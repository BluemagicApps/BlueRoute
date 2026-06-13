# Item 15 — Auto-translate by IP (i18n) — Design

**Status:** spec · 2026-06-13 · branch `feat/warehouse-booking` (or a fresh branch)
**Plan:** `docs/superpowers/plans/2026-06-13-i18n-auto-translate.md`
**Source of truth:** `docs/PLAN.md` item 15 (decisions pre-locked — no brainstorm needed).

## Goal

A visitor from a non-English region lands on the site and sees it in their language
automatically on the **first** visit, can switch to English or any of the top-10 languages
from a header/footer control, and that choice sticks across visits. Static UI comes from
pre-built catalogs; dynamic database content is translated live via Groq.

## Locked decisions (from PLAN.md item 15)

- **Library:** `next-intl` 4.13 (installed) on **Next 16.2.7** (non-standard — Proxy convention,
  async `cookies()`, Turbopack).
- **Languages (10):** English `en`, Mandarin `zh`, Hindi `hi`, Spanish `es`, French `fr`,
  Arabic `ar`, Bengali `bn`, Portuguese `pt`, Russian `ru`, Urdu `ur`. (`ar` + `ur` are RTL.)
- **Detection:** by IP on first load — Vercel geo header in prod, `ipapi.co` free fallback in dev.
- **Persistence:** cookie; auto-force only on the genuine first visit, never again once set.
- **Switcher:** in header + footer; switch to English or any language.
- **Translation strategy:** hybrid — pre-translated **static UI** catalogs + **live Groq**
  translation for dynamic data (`/api/ai/translate`).

## Key architectural decision: NO URL-prefix routing (cookie-based locale)

next-intl supports two modes. We deliberately choose **"without i18n routing"** (locale in a
cookie, no `/fr/…` URL prefix) rather than the `[locale]` segment approach.

**Why:**
- The locked decisions never ask for localized URLs — they ask for IP auto-detect + a cookie.
- The app already has a `(site)` route group, `/admin`, `/portal`, and a **Proxy** (`src/proxy.ts`)
  doing Supabase session refresh + optimistic auth redirects. Wrapping every route in `[locale]`
  would collide with all of that and force a massive restructure.
- Cookie mode needs **no next-intl middleware** at all, so it composes cleanly with the existing
  Proxy instead of fighting it.

**Mechanism:**
- `src/i18n/request.ts` → `getRequestConfig` reads the `NEXT_LOCALE` cookie (async `cookies()` in
  Next 16), validates it against the locale list, defaults to `en`, and loads the matching catalog.
- `next.config.ts` wrapped with `createNextIntlPlugin('./src/i18n/request.ts')`.
- Root layout (`src/app/layout.tsx`) calls `getLocale()`, sets `<html lang>` + `dir` (RTL for
  ar/ur), and wraps `<body>` children in `<NextIntlClientProvider>` (messages flow automatically).

## IP detection in the Proxy

Detection is added to the **existing** `src/proxy.ts` (it already runs on all routes via its
matcher). Logic, run only when the request has **no** `NEXT_LOCALE` cookie:

1. **Prod:** read the country from the Vercel geo header (`x-vercel-ip-country`).
2. **Dev fallback:** if no geo header and `NODE_ENV !== 'production'`, best-effort `fetch` to
   `https://ipapi.co/json/` (returns the dev machine's public-IP country). Wrapped in try/catch,
   short timeout; failure → default `en`.
3. Map country code → language (`src/lib/i18n/detect.ts`, pure `countryToLocale`).
4. Set `NEXT_LOCALE` on the response cookie (1-year max-age) so detection never re-runs.

Auth redirects in the Proxy must still win — locale cookie is only *set* on the response, it never
short-circuits an existing redirect. Order: do Supabase/auth first (unchanged), then, if the
response is being returned (not a redirect we already issued), attach the locale cookie when absent.

## Switcher + persistence

- Server action `setLocale(locale)` in `src/app/actions/locale.ts`: validates the locale, sets the
  `NEXT_LOCALE` cookie, no redirect. Client calls it then `router.refresh()` to re-render with the
  new catalog.
- `src/components/i18n/locale-switcher.tsx` (client): a compact dropdown of the 10 languages
  (native names from `src/lib/i18n/locales.ts`), current one marked. Mounted in `site-header.tsx`
  (desktop nav + mobile drawer) and `site-footer.tsx`.

## Static catalogs + generation pipeline

- Source of truth: `messages/en.json` (namespaced by area: `Nav`, `Footer`, `Home`, `Common`, …).
- The other 9 catalogs are **generated**, not hand-written, by `scripts/translate-messages.mjs`:
  reads `messages/en.json`, for each target locale calls Groq (reusing `chatJSON` from
  `src/lib/ai/groq.ts`) with a "translate these UI strings, preserve ICU placeholders and keys"
  prompt, writes `messages/<locale>.json`. Idempotent; re-runnable when `en.json` changes.
  Generated catalogs are committed so prod needs no Groq calls for static UI.
- RTL: catalogs are identical structurally; direction is handled by `<html dir>` + a few
  logical-property CSS tweaks, not per-string.

## Dynamic data translation

- `POST /api/ai/translate` (`src/app/api/ai/translate/route.ts`): body `{ text|texts, targetLocale }`,
  rate-limited (reuse `src/lib/ai/rate-limit.ts`), calls Groq, returns translated string(s). Used for
  DB-sourced content that has no static catalog (e.g. tracking notices, AI replies already in the
  user's language are skipped). Pure normalizer + prompt builder in `src/lib/i18n/translate.ts`
  (unit-tested); the route is a thin best-effort wrapper mirroring the other AI routes.

## Files

| File | Responsibility |
|------|----------------|
| `src/lib/i18n/locales.ts` | client-safe: `LOCALES` (code, native name, English name, `rtl`), `DEFAULT_LOCALE`, `isLocale`, `dirFor`. |
| `src/lib/i18n/detect.ts` | pure `countryToLocale(country)` + `pickLocaleFromHeaders` (geo header → Accept-Language fallback). |
| `src/lib/i18n/translate.ts` | pure prompt builder + `normalizeTranslation` for the Groq route. |
| `src/i18n/request.ts` | `getRequestConfig` — cookie → validated locale → load catalog. |
| `next.config.ts` | wrap with `createNextIntlPlugin`. |
| `src/app/layout.tsx` | `getLocale()`, `<html lang/dir>`, `<NextIntlClientProvider>`. |
| `src/proxy.ts` | add first-visit locale detection + cookie set (after auth logic). |
| `src/app/actions/locale.ts` | `setLocale` server action (cookie). |
| `src/components/i18n/locale-switcher.tsx` | client dropdown; mounted in header + footer. |
| `src/app/api/ai/translate/route.ts` | dynamic-data translation endpoint. |
| `scripts/translate-messages.mjs` | Groq-powered catalog generator (en → 9). |
| `messages/en.json` (+ 9 generated) | static UI catalogs. |

## Testability

- Pure, unit-tested (Vitest): `countryToLocale`, `pickLocaleFromHeaders`, `isLocale`/`dirFor`,
  `normalizeTranslation`, the request-config locale validation.
- Live E2E (`scripts/verify-i18n-e2e.mjs`): request with a `cn` geo header → response sets
  `NEXT_LOCALE=zh`; request with `NEXT_LOCALE=fr` cookie → home renders French chrome; switcher
  action flips the cookie. Groq catalog generation + translate route verified manually with the key.

## Scope question (to confirm before the plan is finalized)

Two viable scopes for the **first** pass — architecture is identical either way:

- **A — Foundation + pilot:** all infra (plugin, request config, provider, detection, switcher,
  Groq generation pipeline, translate route) proven end-to-end, with the **global chrome
  (header/footer/nav) + home page** fully extracted into catalogs and translated to all 10
  languages. Remaining pages are enumerated as a documented Phase-2 follow-on using the same
  per-page extraction pattern. Ships working, demoable i18n quickly.
- **B — Full extraction now:** every page's static strings extracted in this pass (~30 routes).
  Much larger plan (multi-day), but the entire static UI is localized at the end of the first run.
