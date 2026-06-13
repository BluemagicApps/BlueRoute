# i18n Auto-translate (Item 15) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A first-time visitor sees the site auto-translated to their region's language (by IP), can switch language from the header/footer, and the choice persists in a cookie; static UI is served from pre-built catalogs and dynamic data is translated live via Groq.

**Architecture:** `next-intl` 4.13 in **cookie-based "without i18n routing"** mode (no `/fr/` URL prefix, no `[locale]` segment, no next-intl middleware) so it composes with the existing Next 16 `src/proxy.ts` instead of fighting it. Locale resolves from a `NEXT_LOCALE` cookie in `getRequestConfig`; first-visit detection runs in the Proxy (Vercel geo header in prod, `ipapi.co` in dev) and sets the cookie. The 9 non-English catalogs are generated from `messages/en.json` by a Groq script and committed. Pilot scope: full infra + global chrome + home page localized to all 10 languages; remaining pages follow the same pattern in Phase 2.

**Tech Stack:** Next 16.2.7 (App Router, Turbopack, Proxy), next-intl 4.13, Groq (`chatJSON`), Vitest, TypeScript, Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-06-13-i18n-auto-translate-design.md`

**Languages (10):** `en` English · `zh` 中文 · `hi` हिन्दी · `es` Español · `fr` Français · `ar` العربية (RTL) · `bn` বাংলা · `pt` Português · `ru` Русский · `ur` اردو (RTL).

---

## Task 1: Locale definitions (client-safe)

**Files:**
- Create: `src/lib/i18n/locales.ts`
- Test: `src/lib/i18n/locales.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/i18n/locales.test.ts
import { describe, it, expect } from "vitest";
import { LOCALES, LOCALE_CODES, DEFAULT_LOCALE, isLocale, dirFor } from "./locales";

describe("locales", () => {
  it("exposes exactly the 10 locked languages", () => {
    expect(LOCALE_CODES).toEqual(["en", "zh", "hi", "es", "fr", "ar", "bn", "pt", "ru", "ur"]);
  });
  it("defaults to English", () => {
    expect(DEFAULT_LOCALE).toBe("en");
  });
  it("every locale has a native + English name", () => {
    for (const l of LOCALES) {
      expect(l.nativeName.length).toBeGreaterThan(0);
      expect(l.englishName.length).toBeGreaterThan(0);
    }
  });
  it("isLocale narrows valid codes and rejects junk/undefined", () => {
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("xx")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale("")).toBe(false);
  });
  it("marks only Arabic and Urdu as RTL", () => {
    expect(dirFor("ar")).toBe("rtl");
    expect(dirFor("ur")).toBe("rtl");
    expect(dirFor("en")).toBe("ltr");
    expect(dirFor("zh")).toBe("ltr");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/i18n/locales.test.ts`
Expected: FAIL — cannot find module `./locales`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/i18n/locales.ts
export type Locale = "en" | "zh" | "hi" | "es" | "fr" | "ar" | "bn" | "pt" | "ru" | "ur";

export type LocaleMeta = {
  code: Locale;
  nativeName: string;
  englishName: string;
  rtl: boolean;
};

export const LOCALES: readonly LocaleMeta[] = [
  { code: "en", nativeName: "English", englishName: "English", rtl: false },
  { code: "zh", nativeName: "中文", englishName: "Chinese", rtl: false },
  { code: "hi", nativeName: "हिन्दी", englishName: "Hindi", rtl: false },
  { code: "es", nativeName: "Español", englishName: "Spanish", rtl: false },
  { code: "fr", nativeName: "Français", englishName: "French", rtl: false },
  { code: "ar", nativeName: "العربية", englishName: "Arabic", rtl: true },
  { code: "bn", nativeName: "বাংলা", englishName: "Bengali", rtl: false },
  { code: "pt", nativeName: "Português", englishName: "Portuguese", rtl: false },
  { code: "ru", nativeName: "Русский", englishName: "Russian", rtl: false },
  { code: "ur", nativeName: "اردو", englishName: "Urdu", rtl: true },
] as const;

export const LOCALE_CODES = LOCALES.map((l) => l.code) as Locale[];

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALE_CODES.includes(value as Locale);
}

export function dirFor(locale: string): "ltr" | "rtl" {
  const meta = LOCALES.find((l) => l.code === locale);
  return meta?.rtl ? "rtl" : "ltr";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/i18n/locales.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n/locales.ts src/lib/i18n/locales.test.ts
git commit -m "feat(i18n): locale definitions (10 langs, RTL, isLocale)"
```

---

## Task 2: IP → locale detection (pure)

**Files:**
- Create: `src/lib/i18n/detect.ts`
- Test: `src/lib/i18n/detect.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/i18n/detect.test.ts
import { describe, it, expect } from "vitest";
import { countryToLocale, pickLocaleFromHeaders } from "./detect";

describe("countryToLocale", () => {
  it("maps representative countries to the right language", () => {
    expect(countryToLocale("CN")).toBe("zh");
    expect(countryToLocale("TW")).toBe("zh");
    expect(countryToLocale("FR")).toBe("fr");
    expect(countryToLocale("SA")).toBe("ar");
    expect(countryToLocale("BR")).toBe("pt");
    expect(countryToLocale("RU")).toBe("ru");
    expect(countryToLocale("PK")).toBe("ur");
    expect(countryToLocale("BD")).toBe("bn");
    expect(countryToLocale("MX")).toBe("es");
    expect(countryToLocale("IN")).toBe("hi");
  });
  it("is case-insensitive", () => {
    expect(countryToLocale("cn")).toBe("zh");
  });
  it("returns null for unmapped/empty", () => {
    expect(countryToLocale("US")).toBeNull();
    expect(countryToLocale("")).toBeNull();
    expect(countryToLocale(null)).toBeNull();
    expect(countryToLocale(undefined)).toBeNull();
  });
});

describe("pickLocaleFromHeaders", () => {
  it("prefers the geo country", () => {
    expect(pickLocaleFromHeaders({ country: "FR", acceptLanguage: "en-US,en" })).toBe("fr");
  });
  it("falls back to Accept-Language when geo is unmapped", () => {
    expect(pickLocaleFromHeaders({ country: "US", acceptLanguage: "es-ES,es;q=0.9,en;q=0.8" })).toBe("es");
  });
  it("returns null when nothing matches a supported locale", () => {
    expect(pickLocaleFromHeaders({ country: "US", acceptLanguage: "en-US,en" })).toBeNull();
    expect(pickLocaleFromHeaders({ country: null, acceptLanguage: null })).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/i18n/detect.test.ts`
Expected: FAIL — cannot find module `./detect`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/i18n/detect.ts
import { type Locale, isLocale } from "./locales";

// Representative country → language map (not exhaustive; unmapped → null → default en).
const COUNTRY_LOCALE: Record<string, Locale> = {
  CN: "zh", TW: "zh", HK: "zh", MO: "zh", SG: "zh",
  IN: "hi",
  ES: "es", MX: "es", AR: "es", CO: "es", CL: "es", PE: "es", VE: "es", EC: "es",
  FR: "fr", BE: "fr", CH: "fr", LU: "fr", SN: "fr", CI: "fr", CD: "fr",
  SA: "ar", AE: "ar", EG: "ar", IQ: "ar", JO: "ar", KW: "ar", QA: "ar", DZ: "ar", MA: "ar", TN: "ar",
  BD: "bn",
  PT: "pt", BR: "pt", AO: "pt", MZ: "pt",
  RU: "ru", BY: "ru", KZ: "ru", KG: "ru",
  PK: "ur",
};

export function countryToLocale(country: string | null | undefined): Locale | null {
  if (!country) return null;
  return COUNTRY_LOCALE[country.toUpperCase()] ?? null;
}

function firstAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;
  for (const part of header.split(",")) {
    const tag = part.split(";")[0]?.trim().split("-")[0]?.toLowerCase();
    if (isLocale(tag)) return tag;
  }
  return null;
}

export function pickLocaleFromHeaders(input: {
  country: string | null | undefined;
  acceptLanguage: string | null | undefined;
}): Locale | null {
  return countryToLocale(input.country) ?? firstAcceptLanguage(input.acceptLanguage);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/i18n/detect.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n/detect.ts src/lib/i18n/detect.test.ts
git commit -m "feat(i18n): pure country/header locale detection"
```

---

## Task 3: next-intl plugin + request config

**Files:**
- Modify: `next.config.ts`
- Create: `src/i18n/request.ts`
- Create: `messages/en.json` (seed; expanded in Tasks 7–8)
- Test: `src/lib/i18n/locales.test.ts` (add a `resolveRequestLocale` case)
- Modify: `src/lib/i18n/locales.ts` (add `resolveRequestLocale`)

- [ ] **Step 1: Write the failing test (append to locales.test.ts)**

```ts
// add to src/lib/i18n/locales.test.ts
import { resolveRequestLocale } from "./locales";

describe("resolveRequestLocale", () => {
  it("returns a valid cookie value unchanged", () => {
    expect(resolveRequestLocale("ar")).toBe("ar");
  });
  it("falls back to default for junk/undefined", () => {
    expect(resolveRequestLocale("xx")).toBe("en");
    expect(resolveRequestLocale(undefined)).toBe("en");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/i18n/locales.test.ts`
Expected: FAIL — `resolveRequestLocale` is not a function.

- [ ] **Step 3: Implement `resolveRequestLocale` + request config + plugin**

Add to `src/lib/i18n/locales.ts`:

```ts
export function resolveRequestLocale(cookieValue: string | undefined): Locale {
  return isLocale(cookieValue) ? cookieValue : DEFAULT_LOCALE;
}
```

Create `src/i18n/request.ts`:

```ts
import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { resolveRequestLocale } from "@/lib/i18n/locales";

// Cookie-based locale (no URL routing). The Proxy sets NEXT_LOCALE on first visit.
export default getRequestConfig(async () => {
  const store = await cookies();
  const locale = resolveRequestLocale(store.get("NEXT_LOCALE")?.value);
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

Replace `next.config.ts` with:

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);
```

Create seed `messages/en.json` (expanded later):

```json
{
  "Common": {
    "getQuote": "Get Quote"
  }
}
```

- [ ] **Step 4: Run test + typecheck**

Run: `npx vitest run src/lib/i18n/locales.test.ts && npx tsc --noEmit`
Expected: tests PASS; tsc exit 0.

- [ ] **Step 5: Commit**

```bash
git add next.config.ts src/i18n/request.ts messages/en.json src/lib/i18n/locales.ts src/lib/i18n/locales.test.ts
git commit -m "feat(i18n): next-intl plugin + cookie-based request config"
```

---

## Task 4: Root layout — provider, lang & dir

**Files:**
- Modify: `src/app/layout.tsx`
- Create (temporary stubs so build resolves all imports): `messages/{zh,hi,es,fr,ar,bn,pt,ru,ur}.json` each containing `{ "Common": { "getQuote": "Get Quote" } }` (replaced by generated catalogs in Task 9).

- [ ] **Step 1: Create stub catalogs**

For each of the 9 non-English locales, create `messages/<code>.json` with:

```json
{ "Common": { "getQuote": "Get Quote" } }
```

- [ ] **Step 2: Wire the provider into the root layout**

In `src/app/layout.tsx`, add imports at the top:

```ts
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { dirFor } from "@/lib/i18n/locales";
```

Change the component to be async and wrap children. Replace the existing
`export default function RootLayout(...) { ... }` with:

```tsx
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      dir={dirFor(locale)}
      className={`${manrope.variable} h-full antialiased`}
    >
      <body className="grain min-h-full flex flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: build succeeds; no "messages could not be resolved" error.

- [ ] **Step 4: Smoke-test the provider with a dev render**

Run: `npm run dev` in the background, then `curl -s http://localhost:3000 | grep -o '<html[^>]*>'`
Expected: output contains `lang="en"` and `dir="ltr"`. Stop dev server.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx messages/*.json
git commit -m "feat(i18n): NextIntlClientProvider + dynamic lang/dir in root layout"
```

---

## Task 5: First-visit IP detection in the Proxy

**Files:**
- Modify: `src/proxy.ts`

- [ ] **Step 1: Add detection helper + cookie set**

In `src/proxy.ts`, add imports:

```ts
import { pickLocaleFromHeaders, countryToLocale } from "@/lib/i18n/detect";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
```

Add this helper below the imports (above `export async function proxy`):

```ts
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

async function detectLocale(request: NextRequest): Promise<string> {
  // Prod: Vercel injects geo headers. Fall back to Accept-Language.
  const fromHeaders = pickLocaleFromHeaders({
    country: request.headers.get("x-vercel-ip-country"),
    acceptLanguage: request.headers.get("accept-language"),
  });
  if (fromHeaders) return fromHeaders;

  // Dev only: best-effort public-IP lookup (localhost has no geo header).
  if (process.env.NODE_ENV !== "production") {
    try {
      const res = await fetch("https://ipapi.co/json/", {
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) {
        const data = (await res.json()) as { country_code?: string };
        const loc = countryToLocale(data.country_code);
        if (loc) return loc;
      }
    } catch {
      // ignore — fall through to default
    }
  }
  return DEFAULT_LOCALE;
}
```

In the `proxy` function, just before the final `return response;`, add:

```ts
  // First-visit language auto-detect — set once, never re-run.
  if (!request.cookies.has("NEXT_LOCALE")) {
    const locale = await detectLocale(request);
    response.cookies.set("NEXT_LOCALE", locale, {
      maxAge: LOCALE_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
    });
  }
```

(The auth redirect branches above are unchanged and still return early — the cookie will be set on the next, non-redirected request.)

- [ ] **Step 2: Verify typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: exit 0; build registers `ƒ Proxy (Middleware)`.

- [ ] **Step 3: Manual dev check**

Start dev, then:
`curl -s -i http://localhost:3000 | grep -i "set-cookie: NEXT_LOCALE"`
Expected: a `Set-Cookie: NEXT_LOCALE=...` header is present on the first request. Stop dev.

- [ ] **Step 4: Commit**

```bash
git add src/proxy.ts
git commit -m "feat(i18n): first-visit IP locale detection in Proxy"
```

---

## Task 6: setLocale action + locale switcher

**Files:**
- Create: `src/app/actions/locale.ts`
- Create: `src/components/i18n/locale-switcher.tsx`
- Modify: `src/components/site-header.tsx` (mount in desktop nav + mobile drawer)
- Modify: `src/components/site-footer.tsx` (mount in footer)

- [ ] **Step 1: Create the server action**

```ts
// src/app/actions/locale.ts
"use server";

import { cookies } from "next/headers";
import { resolveRequestLocale } from "@/lib/i18n/locales";

export async function setLocale(locale: string) {
  const value = resolveRequestLocale(locale);
  const store = await cookies();
  store.set("NEXT_LOCALE", value, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
}
```

- [ ] **Step 2: Create the switcher (client)**

```tsx
// src/components/i18n/locale-switcher.tsx
"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALES } from "@/lib/i18n/locales";
import { setLocale } from "@/app/actions/locale";

export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      aria-label="Select language"
      value={locale}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(async () => {
          await setLocale(next);
          router.refresh();
        });
      }}
      className={`rounded-full border border-steel/70 bg-white px-2 py-1 text-xs text-foam disabled:opacity-50 ${className}`}
    >
      {LOCALES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.nativeName}
        </option>
      ))}
    </select>
  );
}
```

- [ ] **Step 3: Mount it**

In `src/components/site-header.tsx`: `import { LocaleSwitcher } from "@/components/i18n/locale-switcher";` and render `<LocaleSwitcher />` in the top-right cluster (next to the phone/Get-Quote area) and inside the mobile drawer's action list.

In `src/components/site-footer.tsx`: same import; render `<LocaleSwitcher />` in the footer's bottom bar (near the copyright/legal row).

- [ ] **Step 4: Verify build + manual switch**

Run: `npx tsc --noEmit && npm run build`
Expected: exit 0.
Then dev: load `/`, pick `Français` in the switcher → page refreshes, `NEXT_LOCALE=fr` cookie set (DevTools → Application → Cookies). Chrome still English until Task 7 wires strings — that's expected.

- [ ] **Step 5: Commit**

```bash
git add src/app/actions/locale.ts src/components/i18n/locale-switcher.tsx src/components/site-header.tsx src/components/site-footer.tsx
git commit -m "feat(i18n): setLocale action + header/footer language switcher"
```

---

## Task 7: Extract global chrome strings (nav, header, footer)

**Files:**
- Modify: `messages/en.json` (add `Nav`, `Header`, `Footer` namespaces)
- Modify: `src/lib/navigation.ts`, `src/components/site-header.tsx`, `src/components/site-footer.tsx`

**Pattern (apply to every literal):** read the file, move each user-visible English string
into the catalog under the right namespace/key, then replace the literal with a translation call.

- Server components: `import { getTranslations } from "next-intl/server";` → `const t = await getTranslations("Header");` → `{t("getQuote")}`.
- Client components: `import { useTranslations } from "next-intl";` → `const t = useTranslations("Header");` → `{t("getQuote")}`.
- For nav labels defined as data in `src/lib/navigation.ts`, keep the data shape but store a
  **key** (e.g. `labelKey: "Nav.services"`) and translate at render time with
  `t(item.labelKey)` using a `Nav` namespace, OR translate in the consuming component. Do not put
  translated strings in the data module (it's imported by both server and client).

- [ ] **Step 1: Populate the catalog**

Open the three files, and for each visible string add an entry. Example shape for `messages/en.json`:

```json
{
  "Common": { "getQuote": "Get Quote" },
  "Nav": {
    "services": "Services",
    "tracking": "Tracking",
    "warehousing": "Warehousing",
    "aiEdge": "AI Edge",
    "about": "About",
    "contact": "Contact"
  },
  "Header": {
    "phoneLabel": "Call us",
    "getQuote": "Get Quote"
  },
  "Footer": {
    "tagline": "Intelligent global shipping, AI-powered precision.",
    "rights": "All rights reserved."
  }
}
```

(Use the **actual** strings found in the files; the keys above are the namespace template.)

- [ ] **Step 2: Wire the components**

Replace each literal in `site-header.tsx` / `site-footer.tsx` / nav rendering with the matching
`t("…")` call per the pattern above. The phone number `+1 (323) 484-8030` stays a literal (it's
not translated).

- [ ] **Step 3: Verify build + manual check**

Run: `npx tsc --noEmit && npm run build`
Expected: exit 0.
Dev: with `NEXT_LOCALE=en`, header/footer render unchanged. (Other languages verified after Task 9.)

- [ ] **Step 4: Commit**

```bash
git add messages/en.json src/lib/navigation.ts src/components/site-header.tsx src/components/site-footer.tsx
git commit -m "feat(i18n): localize global chrome (nav, header, footer)"
```

---

## Task 8: Extract home page strings

**Files:**
- Modify: `messages/en.json` (add `Home` namespace)
- Modify: `src/components/home/hero.tsx` and the other `src/components/home/*.tsx` sections used on `/`.

- [ ] **Step 1: Add the `Home` namespace to `messages/en.json`**

Add a `Home` object whose keys cover the hero headline, subcopy, CTA labels, trust-strip items,
AI-Edge card titles/blurbs, services teaser, and warehouse teaser — using the actual strings from
the home components. Template:

```json
{
  "Home": {
    "hero": {
      "headline": "…actual headline…",
      "sub": "…actual subcopy…",
      "ctaPrimary": "…",
      "ctaSecondary": "Ask the AI Advisor"
    },
    "trust": { "item1": "…", "item2": "…", "item3": "…", "item4": "…" }
  }
}
```

- [ ] **Step 2: Wire each home section**

For each `src/components/home/*.tsx` rendered on `/`, apply the extraction pattern from Task 7
(server → `getTranslations("Home")`, client → `useTranslations("Home")`). Keep the
`br-open-assistant` event wiring untouched — only the visible label changes.

- [ ] **Step 3: Verify build + manual check**

Run: `npx tsc --noEmit && npm run build`
Expected: exit 0. Dev `/` with `NEXT_LOCALE=en` renders identically.

- [ ] **Step 4: Commit**

```bash
git add messages/en.json src/components/home/*.tsx
git commit -m "feat(i18n): localize home page strings"
```

---

## Task 9: Groq catalog generation script

**Files:**
- Create: `scripts/translate-messages.mjs`
- Regenerate: `messages/{zh,hi,es,fr,ar,bn,pt,ru,ur}.json`

- [ ] **Step 1: Write the generator**

```js
// scripts/translate-messages.mjs
// Generates messages/<locale>.json from messages/en.json via Groq.
// Usage: node scripts/translate-messages.mjs          (all locales)
//        node scripts/translate-messages.mjs fr ar     (subset)
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Groq from "groq-sdk";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const TARGETS = {
  zh: "Mandarin Chinese", hi: "Hindi", es: "Spanish", fr: "French",
  ar: "Arabic", bn: "Bengali", pt: "Portuguese", ru: "Russian", ur: "Urdu",
};
const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const en = JSON.parse(readFileSync(resolve(root, "messages/en.json"), "utf8"));
const picked = process.argv.slice(2).filter((c) => c in TARGETS);
const locales = picked.length ? picked : Object.keys(TARGETS);

const prompt = (langName, json) =>
  `Translate the VALUES of this JSON i18n catalog from English to ${langName}. ` +
  `Rules: keep every KEY exactly as-is; preserve ICU placeholders like {name}, {count}, ` +
  `and HTML/markup; do NOT translate the brand name "Blue Route"; return ONLY valid JSON ` +
  `with the identical structure.\n\n${JSON.stringify(json, null, 2)}`;

for (const code of locales) {
  const res = await groq.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt(TARGETS[code], en) }],
  });
  const out = JSON.parse(res.choices[0].message.content);
  writeFileSync(resolve(root, `messages/${code}.json`), JSON.stringify(out, null, 2) + "\n");
  console.log(`✓ messages/${code}.json`);
}
```

- [ ] **Step 2: Run it**

Run (PowerShell — env var already in `.env.local`, load it or pass inline):
`node -r dotenv/config scripts/translate-messages.mjs` (or set `GROQ_API_KEY` then run).
Expected: prints `✓ messages/<code>.json` for all 9; files now contain translated values with
the same keys as `en.json`.

- [ ] **Step 3: Sanity-check + build**

Run: `npx tsc --noEmit && npm run build`
Expected: exit 0. Dev: set `NEXT_LOCALE=fr` cookie, reload `/` → header/footer/home render in
French; set `ar` → `<html dir="rtl">` and Arabic text.

- [ ] **Step 4: Commit**

```bash
git add scripts/translate-messages.mjs messages/*.json
git commit -m "feat(i18n): Groq catalog generator + 9 generated catalogs"
```

---

## Task 10: Dynamic-data translation endpoint

**Files:**
- Create: `src/lib/i18n/translate.ts` (pure)
- Test: `src/lib/i18n/translate.test.ts`
- Create: `src/app/api/ai/translate/route.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/i18n/translate.test.ts
import { describe, it, expect } from "vitest";
import { buildTranslatePrompt, normalizeTranslation } from "./translate";

describe("translate lib", () => {
  it("names the target language in the prompt", () => {
    const p = buildTranslatePrompt("Delayed at port", "fr");
    expect(p).toContain("French");
    expect(p).toContain("Delayed at port");
  });
  it("normalizeTranslation trims and rejects empty", () => {
    expect(normalizeTranslation("  Bonjour  ")).toBe("Bonjour");
    expect(normalizeTranslation("")).toBeNull();
    expect(normalizeTranslation(null)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/i18n/translate.test.ts`
Expected: FAIL — cannot find module `./translate`.

- [ ] **Step 3: Implement pure lib + route**

```ts
// src/lib/i18n/translate.ts
import { LOCALES } from "./locales";

export function buildTranslatePrompt(text: string, targetLocale: string): string {
  const name = LOCALES.find((l) => l.code === targetLocale)?.englishName ?? "English";
  return (
    `Translate the following text to ${name}. Preserve meaning, tone, numbers, and any ` +
    `placeholders. Do not translate the brand name "Blue Route". Return only the translation, ` +
    `no quotes or commentary.\n\n${text}`
  );
}

export function normalizeTranslation(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}
```

```ts
// src/app/api/ai/translate/route.ts
import { NextResponse } from "next/server";
import { chat } from "@/lib/ai/groq";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { isLocale } from "@/lib/i18n/locales";
import { buildTranslatePrompt, normalizeTranslation } from "@/lib/i18n/translate";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
  let body: { text?: unknown; targetLocale?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text : "";
  const target = body.targetLocale;
  if (!text || typeof target !== "string" || !isLocale(target)) {
    return NextResponse.json({ error: "text and a valid targetLocale are required." }, { status: 400 });
  }
  if (target === "en") {
    return NextResponse.json({ translation: text });
  }
  try {
    const raw = await chat([{ role: "user", content: buildTranslatePrompt(text, target) }]);
    const translation = normalizeTranslation(raw);
    return NextResponse.json({ translation: translation ?? text });
  } catch {
    return NextResponse.json({ translation: text }); // best-effort: fall back to source
  }
}
```

**Verified against the codebase:** `src/lib/ai/groq.ts` exports `chat(messages: ChatMsg[]): Promise<string>`
(used above with a single user message) and `chatJSON<T>`; `src/lib/ai/rate-limit.ts` exports
`checkRateLimit(key, now?, limit?): boolean`. No new helper needed — do not add `chatText`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/i18n/translate.test.ts && npx tsc --noEmit`
Expected: tests PASS; tsc exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n/translate.ts src/lib/i18n/translate.test.ts src/app/api/ai/translate/route.ts
git commit -m "feat(i18n): /api/ai/translate dynamic-data endpoint"
```

---

## Task 11: Live E2E + full verification

**Files:**
- Create: `scripts/verify-i18n-e2e.mjs`

- [ ] **Step 1: Write the E2E harness**

```js
// scripts/verify-i18n-e2e.mjs
// Assumes `npm run dev` (or a prod server) is running on http://localhost:3000.
const BASE = process.env.BASE_URL || "http://localhost:3000";
let failed = false;
const ok = (name, cond) => { console.log(`${cond ? "✓" : "✗"} ${name}`); if (!cond) failed = true; };

// 1. First visit with a CN geo header → response sets NEXT_LOCALE=zh
const r1 = await fetch(BASE, { headers: { "x-vercel-ip-country": "CN" } });
const setCookie = r1.headers.get("set-cookie") || "";
ok("CN geo header → NEXT_LOCALE=zh cookie", /NEXT_LOCALE=zh/.test(setCookie));

// 2. Existing fr cookie → home renders French <html lang="fr">
const r2 = await fetch(BASE, { headers: { cookie: "NEXT_LOCALE=fr" } });
const html2 = await r2.text();
ok('fr cookie → <html lang="fr">', /<html[^>]*lang="fr"/.test(html2));

// 3. ar cookie → dir="rtl"
const r3 = await fetch(BASE, { headers: { cookie: "NEXT_LOCALE=ar" } });
const html3 = await r3.text();
ok('ar cookie → dir="rtl"', /<html[^>]*dir="rtl"/.test(html3));

// 4. translate endpoint returns a translation (best-effort)
const r4 = await fetch(`${BASE}/api/ai/translate`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ text: "Your shipment is delayed", targetLocale: "es" }),
});
const j4 = await r4.json();
ok("translate endpoint returns a string", typeof j4.translation === "string" && j4.translation.length > 0);

process.exit(failed ? 1 : 0);
```

- [ ] **Step 2: Run the full suite + E2E**

Run: `npm test && npm run build`
Expected: all Vitest tests PASS (existing 119 + the new i18n tests); build exit 0.

Then start dev and run: `node scripts/verify-i18n-e2e.mjs`
Expected: all 4 checks `✓`.

- [ ] **Step 3: Commit**

```bash
git add scripts/verify-i18n-e2e.mjs
git commit -m "test(i18n): live E2E (geo detect, cookie render, RTL, translate)"
```

---

## Phase 2 — remaining page extraction (follow-on, same pattern)

Each page below is its own task: read the page + its sections, add a namespace to `messages/en.json`,
wire `getTranslations`/`useTranslations` per the Task 7 pattern, re-run `node scripts/translate-messages.mjs`
to regenerate the 9 catalogs, `npx tsc --noEmit && npm run build`, commit. No new infrastructure.

- [ ] `/services` hub + `/services/[slug]` template (`ServiceQuote`/services data labels)
- [ ] `/quote` wizards (`quote-wizard.tsx`, `service-quote-wizard.tsx`, field labels)
- [ ] `/warehousing` explorer + `/warehousing/book` wizard
- [ ] `/tracking` (loader, result tables, notices)
- [ ] `/ai-edge` hub + the 3 tool consoles
- [ ] `/about`, `/sustainability`, `/contact`
- [ ] `/portal` dashboard + `/login`
- [ ] `/insights`, `/careers`
- [ ] AI assistant UI strings (`ai-assistant.tsx`) + voice hints
- [ ] `/admin` area (lower priority — staff-facing; English-only is acceptable)
- [ ] RTL polish pass: audit Arabic/Urdu layouts for logical-property fixes (margins, icons,
      flex direction) once content is in.

---

## Self-review notes

- **Spec coverage:** detection (Task 5) · cookie persist (Tasks 3/5/6) · top-10 langs (Task 1) ·
  switcher header+footer (Task 6) · static catalogs (Tasks 7–9) · dynamic Groq translate (Task 10) ·
  RTL (Tasks 1/4/9) · IP geo prod + ipapi dev (Task 5). All locked decisions mapped.
- **Type consistency:** `Locale`, `isLocale`, `resolveRequestLocale`, `dirFor`, `countryToLocale`,
  `pickLocaleFromHeaders`, `buildTranslatePrompt`, `normalizeTranslation`, `setLocale` are defined
  once and reused with identical signatures across tasks.
- **Codebase APIs verified:** Task 10 uses the real `chat(messages)` and `checkRateLimit(key)`
  exports — no `groq.ts` change needed. The one thing the executor must still confirm live is the
  Groq key works for catalog generation (Task 9) and the translate route (Task 10).
