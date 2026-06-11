# Portal Supabase Magic-Link Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put `/portal` behind real Supabase passwordless (magic-link) authentication with open signup, per the approved spec `docs/superpowers/specs/2026-06-10-portal-supabase-auth-design.md`.

**Architecture:** `@supabase/ssr` cookie sessions. A Next 16 **Proxy** (`src/proxy.ts` — Middleware was renamed Proxy in Next 16) refreshes the session cookie on every matched request and optimistically redirects signed-out visitors away from `/portal`; the authoritative gate is `getUser()` inside the `/portal` server component. `/login` sends a magic link via `signInWithOtp`; `/auth/confirm` verifies it with `verifyOtp` and sets the session cookie; `/auth/signout` (POST) ends it.

**Tech Stack:** Next.js 16.2.7 (App Router), `@supabase/ssr` 0.12, `@supabase/supabase-js` 2.x, Vitest 4. No new dependencies, no new env vars (`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` already in `.env.local`).

**Deviations from spec (small, deliberate):**
- The protected-path check lives in a new pure module `src/lib/auth/paths.ts` so it can be unit-tested without importing `next/server`.
- The login page is split into a thin server component (`src/app/login/page.tsx`, reads `?error=` + redirects already-signed-in users) and a client form (`src/components/auth/login-form.tsx`) — matches the codebase pattern (e.g. contact page + `contact-form.tsx`) and avoids a `useSearchParams` Suspense boundary.
- `config.matcher` in `proxy.ts` must be an inline literal (Next statically analyzes it — imported constants are ignored), so the matcher test imports `config` from `@/proxy` and asserts its shape.

**Next 16 gotchas baked into the code below:**
- `cookies()` from `next/headers` is **async** — always `await cookies()`.
- Page `searchParams` is a **Promise** — `await searchParams`.
- `maplibre`-style default-export trap does not apply here; `@supabase/ssr` has named exports only (`createServerClient`, `createBrowserClient`).

---

### Task 1: Branch + protected-path helper (pure, TDD)

**Files:**
- Create: `src/lib/auth/paths.ts`
- Test: `src/lib/auth/paths.test.ts`

- [ ] **Step 1: Create the feature branch**

```bash
git checkout -b feat/portal-auth
```

- [ ] **Step 2: Write the failing test**

Create `src/lib/auth/paths.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { isProtectedPath } from "./paths";

describe("isProtectedPath", () => {
  it("protects /portal exactly", () => {
    expect(isProtectedPath("/portal")).toBe(true);
  });

  it("protects nested portal paths", () => {
    expect(isProtectedPath("/portal/invoices")).toBe(true);
  });

  it("does not protect lookalike prefixes", () => {
    expect(isProtectedPath("/portal-preview")).toBe(false);
  });

  it("leaves public routes alone", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/login")).toBe(false);
    expect(isProtectedPath("/tracking")).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/auth/paths.test.ts`
Expected: FAIL — cannot resolve `./paths`.

- [ ] **Step 4: Write the implementation**

Create `src/lib/auth/paths.ts`:

```ts
/** Route prefixes that require a signed-in Supabase user. */
export const PROTECTED_PREFIXES = ["/portal"] as const;

/** True when the pathname is (or is nested under) a protected prefix. */
export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/auth/paths.test.ts`
Expected: 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth/paths.ts src/lib/auth/paths.test.ts
git commit -m "feat: add protected-path helper for portal auth"
```

---

### Task 2: Supabase server + browser clients

Thin SDK wrappers with no branching logic — covered by `tsc`/build gates rather than unit tests (nothing to assert without mocking the whole SDK).

**Files:**
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/client.ts`

- [ ] **Step 1: Create the server client**

Create `src/lib/supabase/server.ts`:

```ts
import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Cookie-session Supabase client for Server Components, Server Actions, and
 * Route Handlers. Uses the public anon key — RLS applies.
 */
export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    );
  }
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Safe to ignore: the proxy refreshes the session cookie instead.
        }
      },
    },
  });
}
```

- [ ] **Step 2: Create the browser client**

Create `src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";

/** Supabase client for client components (login form). Anon key, RLS applies. */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/server.ts src/lib/supabase/client.ts
git commit -m "feat: add cookie-session Supabase server and browser clients"
```

---

### Task 3: Proxy session refresh + optimistic redirect

**Files:**
- Create: `src/lib/supabase/proxy-session.ts`
- Create: `src/proxy.ts`
- Test: `src/proxy.test.ts`

- [ ] **Step 1: Write the session-refresh helper**

Create `src/lib/supabase/proxy-session.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

/**
 * Refreshes the Supabase session cookie for a proxied request and reports the
 * (possibly null) user so the proxy can do optimistic redirects.
 *
 * IMPORTANT: the returned response carries the refreshed cookies — the proxy
 * must return it (or copy its cookies) or users will be randomly logged out.
 */
export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; user: User | null }> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() validates the JWT against Supabase and triggers the cookie
  // refresh above when the token is stale. Do not replace with getSession().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
```

- [ ] **Step 2: Write the proxy**

Create `src/proxy.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy-session";
import { isProtectedPath } from "@/lib/auth/paths";

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);

  // Optimistic redirect only — the /portal server component is the
  // authoritative gate (it calls getUser() itself).
  if (!user && isProtectedPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Inline literal on purpose: Next statically analyzes the matcher and
  // ignores imported variables. Skips static assets and image files.
  matcher: [
    "/((?!_next/static|_next/image|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
```

- [ ] **Step 3: Write the matcher-shape test**

Create `src/proxy.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { config } from "@/proxy";

describe("proxy config", () => {
  it("exports a non-empty string matcher array", () => {
    expect(Array.isArray(config.matcher)).toBe(true);
    expect(config.matcher.length).toBeGreaterThan(0);
    for (const m of config.matcher) {
      expect(typeof m).toBe("string");
    }
  });

  it("excludes Next static assets and image files", () => {
    const pattern = config.matcher[0];
    expect(pattern).toContain("_next/static");
    expect(pattern).toContain("_next/image");
    expect(pattern).toContain("svg|png|jpg");
  });
});
```

- [ ] **Step 4: Run the test suite**

Run: `npx vitest run`
Expected: all tests pass (36 existing + 4 paths + 2 proxy = 42).
If importing `@/proxy` blows up on `next/server` in the node environment, the fallback is to assert the same two facts by reading the file text with `node:fs` `readFileSync("src/proxy.ts", "utf8")` — but try the direct import first; it should work.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase/proxy-session.ts src/proxy.ts src/proxy.test.ts
git commit -m "feat: add Next 16 proxy with Supabase session refresh and portal redirect"
```

---

### Task 4: Magic-link confirm route

**Files:**
- Create: `src/app/auth/confirm/route.ts`

- [ ] **Step 1: Write the route handler**

Create `src/app/auth/confirm/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Magic-link landing endpoint. The Supabase email template links here:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
 * Verifying the OTP sets the session cookie (open signup: first-time emails
 * create the account), then we land the user on the portal.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next") ?? "/portal";
  // Only allow internal redirect targets.
  const next = nextParam.startsWith("/") ? nextParam : "/portal";

  if (tokenHash && type) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=link-expired", request.url),
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/auth/confirm/route.ts
git commit -m "feat: add magic-link confirm route handler"
```

---

### Task 5: Sign-out route

**Files:**
- Create: `src/app/auth/signout/route.ts`

- [ ] **Step 1: Write the route handler**

Create `src/app/auth/signout/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** POST-only sign-out (forms post here). 303 turns the redirect into a GET. */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/auth/signout/route.ts
git commit -m "feat: add sign-out route handler"
```

---

### Task 6: Login page + form

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/components/auth/login-form.tsx`

- [ ] **Step 1: Write the client form**

Create `src/components/auth/login-form.tsx`:

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { Mail, ArrowRight, Sparkles, AlertCircle, Inbox } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const ERROR_MESSAGES: Record<string, string> = {
  "link-expired":
    "That sign-in link is invalid or has expired. Request a fresh one below.",
};

type Status = "idle" | "sending" | "sent";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(
    initialError
      ? (ERROR_MESSAGES[initialError] ??
        "Something went wrong signing you in. Please request a new link.")
      : null,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: sendError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/portal` },
    });
    if (sendError) {
      setError(sendError.message);
      setStatus("idle");
      return;
    }
    setStatus("sent");
  }

  return (
    <section className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center px-5 pt-28 pb-16">
      <div className="bg-grid absolute inset-0 -z-10 h-72" />

      <div className="w-full max-w-md">
        <div className="glass rounded-3xl border border-steel/70 p-8 shadow-soft">
          {status === "sent" ? (
            <div className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-cyan to-indigo text-white">
                <Inbox className="h-6 w-6" />
              </span>
              <h1
                className="mt-5 text-2xl font-semibold text-foam"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Check your inbox
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-mist">
                We sent a sign-in link to{" "}
                <span className="font-semibold text-foam">{email}</span>. Click
                it on this device to open your portal.
              </p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mt-6 text-sm font-medium text-cyan hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan to-indigo text-white">
                <Sparkles className="h-5 w-5" />
              </span>
              <h1
                className="mt-5 text-2xl font-semibold text-foam"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Sign in to your portal
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-mist">
                No password needed — we&apos;ll email you a secure one-time
                sign-in link.
              </p>

              {error && (
                <p className="mt-4 flex items-start gap-2 rounded-2xl bg-rose/10 p-3 text-sm text-rose">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </p>
              )}

              <form onSubmit={handleSubmit} className="mt-6">
                <label
                  htmlFor="login-email"
                  className="text-sm font-medium text-foam"
                >
                  Work email
                </label>
                <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-steel bg-deep px-4 py-3 focus-within:border-cyan">
                  <Mail className="h-4 w-4 shrink-0 text-mist" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full bg-transparent text-sm text-foam outline-none placeholder:text-mist/70"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-cyan to-indigo px-5 py-3 text-sm font-semibold text-white shadow-soft transition-opacity disabled:opacity-60"
                >
                  {status === "sending" ? "Sending link…" : "Email me a sign-in link"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-mist">
          First time here? Just enter your email — your account is created
          automatically.
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Write the page (server component)**

Create `src/app/login/page.tsx`:

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to the Blue Route customer portal with a secure magic link — no password required.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/portal");

  const { error } = await searchParams;
  return <LoginForm initialError={error} />;
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit` then `npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/login/page.tsx src/components/auth/login-form.tsx
git commit -m "feat: add magic-link login page"
```

---

### Task 7: Gate /portal + real-email greeting + sign out

**Files:**
- Modify: `src/app/portal/page.tsx` (whole file, currently 13 lines)
- Modify: `src/components/portal/portal-dashboard.tsx` (signature ~line 47, greeting band lines 56–88)

- [ ] **Step 1: Make the portal page the authoritative gate**

Replace the full contents of `src/app/portal/page.tsx`:

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PortalDashboard } from "@/components/portal/portal-dashboard";

export const metadata: Metadata = {
  title: "Customer Portal",
  description:
    "Your Blue Route dashboard — shipments, predictive ETAs, invoices, warehouse inventory, and AI insights in one place.",
};

export default async function PortalPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <PortalDashboard userEmail={user.email ?? null} />;
}
```

- [ ] **Step 2: Greet with the real email + add Sign out**

In `src/components/portal/portal-dashboard.tsx`:

(a) Add `LogOut` to the lucide-react import list (line 6–15).

(b) Change the component signature (line 47) and derive the greeting:

```tsx
export function PortalDashboard({
  userEmail,
}: {
  userEmail?: string | null;
}) {
  const [tab, setTab] = useState<Tab>("Overview");
  const displayName = userEmail ?? PORTAL_USER.name;
  const initials = (
    userEmail ? userEmail.replace(/@.*$/, "").slice(0, 2) : PORTAL_USER.initials
  ).toUpperCase();
  const subline = userEmail ? "Blue Route customer" : PORTAL_USER.company;
```

(c) In the greeting band, swap the three `PORTAL_USER.*` reads:
- `{PORTAL_USER.initials}` (line 64) → `{initials}`
- `{PORTAL_USER.name}` (line 73) → `{displayName}`
- `{PORTAL_USER.company}` (line 74) → `{subline}`

(d) Add a Sign out button at the end of the greeting-band action group (after the `/warehousing` Link, line 86):

```tsx
<form action="/auth/signout" method="POST">
  <button
    type="submit"
    className="inline-flex items-center gap-1.5 rounded-full border border-white/50 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10"
  >
    <LogOut className="h-4 w-4" /> Sign out
  </button>
</form>
```

Note: `PORTAL_USER` stays imported (it is the fallback) — do not remove it from the import.

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit` then `npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/portal/page.tsx src/components/portal/portal-dashboard.tsx
git commit -m "feat: gate /portal behind Supabase auth with email greeting and sign out"
```

---

### Task 8: Full verification gates + live wiring check

**Files:** none new (throwaway script is not committed)

- [ ] **Step 1: Run all automated gates**

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Expected: 42 Vitest tests pass; tsc, lint clean; build succeeds with all routes compiled (now 27: +`/login`, `/auth/confirm`, `/auth/signout`; `/portal` becomes dynamic ƒ because it reads cookies — that is correct, not a regression).

- [ ] **Step 2: Live check — Supabase accepts the OTP request**

Run (PowerShell, project root — single-quoted so nothing expands):

```powershell
node -e 'const{createClient}=require("@supabase/supabase-js");const fs=require("fs");const env=Object.fromEntries(fs.readFileSync(".env.local","utf8").split(/\r?\n/).filter(l=>l.includes("=")&&!l.startsWith("#")).map(l=>[l.slice(0,l.indexOf("=")),l.slice(l.indexOf("=")+1)]));const c=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.NEXT_PUBLIC_SUPABASE_ANON_KEY);c.auth.signInWithOtp({email:"tenyboy@gmail.com"}).then(r=>console.log(r.error?("ERROR: "+r.error.message):"OK: magic link queued"));'
```

Expected: `OK: magic link queued` — proves the anon key + auth endpoint work. (`ERROR: Signups not allowed for otp` would mean email signup is disabled in the dashboard — fix in Task 9 step 1.)

- [ ] **Step 3: Commit any stragglers, then merge to main**

```bash
git checkout main
git merge feat/portal-auth
```

---

### Task 9: Supabase dashboard config (Timi, guided) + manual E2E

No code. Walk Timi through, at https://supabase.com/dashboard (project `ktyfrxfjuognirtqiifo`):

- [ ] **Step 1:** Authentication → Sign In / Providers → ensure **Email** provider is enabled (open signup is default-on).
- [ ] **Step 2:** Authentication → URL Configuration → **Site URL** = `http://localhost:3000`; add `http://localhost:3000/**` to **Redirect URLs**.
- [ ] **Step 3:** Authentication → Emails (Email Templates) → **Magic Link** → replace the anchor href with:
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
- [ ] **Step 4 (manual E2E, Timi):** `npm run dev` → visit `http://localhost:3000/portal` (expect redirect to `/login`) → enter email → click link in inbox → expect to land signed-in on `/portal` greeted by the email → click **Sign out** → expect `/login`, and `/portal` blocked again.
