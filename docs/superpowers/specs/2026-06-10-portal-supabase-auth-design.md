# Design — Supabase magic-link auth for /portal

**Date:** 2026-06-10
**Status:** Approved (ready for implementation plan)
**Scope:** Fourth backend sub-project. Put the `/portal` dashboard behind real
Supabase authentication using passwordless **magic links**, with open signup.
Delivers the auth gate, real cookie sessions, and real user identity — NOT real
per-user dashboard data (that stays mock and is a separate future project).

---

## 1. Goal & success criteria

`/portal` currently renders `PortalDashboard` (mock `PORTAL_USER` data) with no
gate — anyone can see it and there is no real login.

**Success looks like:** visiting `/portal` while signed out redirects to
`/login`; entering an email there sends a magic link; clicking the link signs the
user in (creating the account on first use — open signup) and lands them on
`/portal`; the dashboard greets them by their real email; a **Sign out** button
ends the session and returns to `/login`.

**Decisions (from brainstorming):** magic-link (passwordless) auth; open signup;
dashboard contents remain mock.

---

## 2. Architecture

**Pattern: `@supabase/ssr` cookie-based sessions** (the canonical Supabase +
Next App Router approach), adapted to **Next 16's Proxy** (Middleware was renamed
to Proxy in Next 16 — verified in
`node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`; it is
`proxy.ts` exporting a `proxy()` function with the same `config.matcher`).

Per Next's guidance, Proxy does **optimistic** checks + session-cookie refresh
only; the authoritative auth check is `getUser()` in the `/portal` server
component.

**Rejected alternatives:**
- Client-only auth (supabase-js + localStorage): not SSR-safe, causes auth
  flicker, and `/portal` could not be a protected server component.
- Auth.js / NextAuth: redundant — Supabase Auth already covers this, no new dep.

### Flow

```
/login (client form) ── signInWithOtp(email, { emailRedirectTo }) ──▶ Supabase sends magic link
User clicks link → /auth/confirm?token_hash=…&type=email (Route Handler)
   verifyOtp({ token_hash, type }) → session cookie set → redirect /portal
proxy.ts → refreshes the session cookie on matched requests; if no session and
           path is /portal → redirect /login
/portal (server component) → getUser(); no user → redirect("/login"); else render
Sign out (POST /auth/signout) → signOut() → redirect /login
```

---

## 3. Files

**New:**
- `src/lib/supabase/server.ts` — `createSupabaseServerClient()` via
  `createServerClient` (`@supabase/ssr`), wiring cookies through `next/headers`
  `cookies()` (the 0.12 `getAll`/`setAll` interface). Uses
  `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (no new env).
- `src/lib/supabase/client.ts` — `createSupabaseBrowserClient()` via
  `createBrowserClient` (for the login form).
- `src/lib/supabase/proxy-session.ts` — `updateSession(request)` helper that
  builds a server client bound to the request/response cookies, calls `getUser()`
  to refresh the token, and returns the response (plus the user for the optimistic
  redirect). Keeps `proxy.ts` thin.
- `src/proxy.ts` — Next 16 proxy: calls `updateSession`; if there is no user and
  the request path starts with `/portal`, redirects to `/login`. `config.matcher`
  excludes static assets and image files.
- `src/app/login/page.tsx` — client form: email input → `signInWithOtp`, then a
  "check your inbox" confirmation state. Reads `?error=` to show link errors.
  Themed to match the site (glass card, cyan accents).
- `src/app/auth/confirm/route.ts` — Route Handler: reads `token_hash` + `type`,
  calls `verifyOtp`; on success redirects to the `next` param (default `/portal`);
  on failure redirects `/login?error=link-expired`.
- `src/app/auth/signout/route.ts` — POST: `signOut()` → redirect `/login`.

**Modified:**
- `src/app/portal/page.tsx` — async server component: `createSupabaseServerClient()`
  → `getUser()`; if none, `redirect("/login")`; else
  `<PortalDashboard userEmail={user.email ?? null} />`.
- `src/components/portal/portal-dashboard.tsx` — accept optional
  `userEmail?: string | null`; greet with it when present (fall back to
  `PORTAL_USER`); add a **Sign out** button that POSTs to `/auth/signout`.

**Unchanged:** `portal-data.ts` (still mock). No new env vars.

---

## 4. Data / types

- `PortalDashboard` gains a prop `userEmail?: string | null`.
- `updateSession(request: NextRequest)` returns
  `{ response: NextResponse; user: User | null }` (User from `@supabase/supabase-js`).

---

## 5. Error handling

- **Invalid / expired magic link:** `/auth/confirm` redirects to
  `/login?error=link-expired`; the login page shows a clear message and lets the
  user request a new link.
- **Email send failure / invalid email:** the login form surfaces the Supabase
  error inline.
- **Authoritative gate:** `/portal` always calls `getUser()`; even if the
  optimistic proxy redirect is bypassed, the server component still blocks
  unauthenticated access.
- **Signed-out access to `/portal`:** proxy redirects to `/login` (optimistic) and
  the server component enforces it (authoritative).

---

## 6. Testing

Auth is mostly Supabase/Next integration that cannot be meaningfully unit-tested
without a live backend, so:
- **Unit (Vitest):** `proxy.ts` `config.matcher` is the expected shape (a pure
  export) — guards against an accidental matcher that runs on static assets.
- **Automated gates:** `npm test`, `npx tsc --noEmit`, `npm run build` all pass.
- **Live check I can run** with the anon key: call `signInWithOtp` for a test
  address and confirm Supabase accepts the request and queues the email (verifies
  the project's auth config and our wiring).
- **Manual (Timi):** request a link, click it, confirm landing on `/portal`
  signed in with the email greeting, then Sign out and confirm redirect to
  `/login` and that `/portal` is blocked again.

---

## 7. Setup (Timi performs, guided — Supabase dashboard)

1. **Authentication → Providers → Email:** ensure Email is enabled (open signup
   is the default).
2. **Authentication → URL Configuration:** set **Site URL** to
   `http://localhost:3000` and add `http://localhost:3000/**` to **Redirect URLs**.
3. **Authentication → Email Templates → Magic Link:** set the link to
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email` (the SSR
   verifyOtp pattern).

No new environment variables — reuses the Supabase URL + anon key already in
`.env.local`. Magic-link emails use Supabase's built-in sender (low rate limits,
fine for testing); point Supabase at custom SMTP (e.g. Resend) later for volume.

---

## 8. Out of scope (deliberately deferred)

Password and OAuth sign-in, real per-user dashboard data, role-based access
control, an account-management UI, and production SMTP configuration.
