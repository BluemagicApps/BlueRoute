# Item 9 — Company Content (About story + leadership + Insights) — Design

**Status:** spec · 2026-06-14 · branch `feat/warehouse-booking`
**Plan:** `docs/superpowers/plans/2026-06-14-company-content.md` (to be written next)
**Source of truth:** `docs/PLAN.md` item 9.

## Goal

Make the Company section real and coherent: rewrite the About page around Blue Route's true
origin (Houston, TX, 1998, door-to-door parcel courier → global container line), give the four
leaders real photos and compelling bios, and turn the Insights page from dead cards into real,
readable article pages. Honest, on-brand content — no fabricated third-party claims.

## Decisions (locked with Timi)

- **Founding story:** Houston, TX, **1998**, started as a **door-to-door parcel courier**, grew
  into a global shipping company. (Matches the real Houston HQ already on `/contact`.)
- **Leadership:** new American names fitting the Houston story (not the old Euro names); CEO is the
  original 1998 founder. Real photos supplied in `public/leadership/` (23/20/24/21.jpg).
- **Insights:** real article **detail pages** (`/insights/[slug]`) with full written bodies — the
  "Read article" buttons must work.
- **Out of scope:** Sustainability, Careers, Contact (already substantive — left as-is). These new
  pages stay **English-only**; localizing them is i18n Phase 2, not item 9.

## Part 1 — About page rewrite (`src/app/(site)/about/page.tsx`)

Keep the existing section structure (hero → mission+pull-quote → stats → values → timeline →
leadership → sustainability teaser) and the visual system. Change content:

- **Hero/mission copy:** reframe to the Houston roots — Blue Route began in 1998 as a single-van
  parcel courier in Houston with a promise that every package arrives as expected; that promise
  scaled into a global door-to-door network. Keep the "foresight, not hope" mission theme.
- **Stats band:** unchanged (180+ countries, 2.4M containers/yr, 9 smart hubs, 94% on-time).
- **Values:** unchanged (4 principles).
- **Timeline (rewrite to a 1998→2026 arc):**
  | Year | Title | Body (direction) |
  |------|-------|------------------|
  | 1998 | Founded in Houston | One van, one promise — door-to-door parcel delivery across the city. |
  | 2004 | Gulf-Coast freight | Grew into regional LTL/FTL trucking across Texas and the Gulf Coast. |
  | 2011 | Going global | First international ocean lanes + in-house customs brokerage. |
  | 2017 | Door-to-door network | Full origin-to-destination coverage; offices in LA, Rotterdam, Singapore. |
  | 2023 | The AI Edge | Predictive ETAs and agentic planning go live for every customer. |
  | 2026 | 180+ countries | 2.4M containers a year on the world's smartest network. |
  (Offices listed match `/contact`: Houston HQ, LA, Rotterdam, Singapore.)
- **Pull-quote:** re-attributed to the founder/CEO (Carol Briggs).

## Part 2 — Leadership (data + cards)

- **New data module `src/lib/about-data.ts`** exporting `STATS`, `TIMELINE`, and `LEADERS`. Each
  leader: `{ name, role, photo, bio }` where `photo` is the `public/leadership/*.jpg` path and
  `bio` is a 3–4 sentence narrative (background → impact → where they're taking the company).
  (Extracting these out of the page keeps the page file focused and the content unit-inspectable.)
- **Leaders** (names are Timi-approved; final bios written during implementation in the existing
  on-brand voice):
  - **Carol Briggs — Founder & CEO** — `/leadership/23.jpg`. Founded Blue Route in 1998 with a
    single van; built it on the "arrive-as-expected" standard she still sets today.
  - **Michael Reyes — Co-founder & CTO** — `/leadership/20.jpg`. Turned a tracking spreadsheet
    into the platform behind the AI Edge.
  - **Rachel Donovan — Chief Operations Officer** — `/leadership/24.jpg`. Runs the global network
    and the 9 smart-warehouse hubs.
  - **Arjun Mehta — Head of AI** — `/leadership/21.jpg`. The modern hire; leads predictive ETAs
    and agentic planning.
- **Leadership cards (in `about/page.tsx`):** replace the gradient-initial avatar with a
  `next/image` photo (rounded), and render name + role + the bio paragraph. Grow the grid to
  2-up on desktop so the bio has room (was a 4-up avatar grid). Keep the hover/reveal treatment.
  Images: fixed dimensions, `alt` = name, object-cover rounded.

## Part 3 — Insights real articles

- **New data module `src/lib/insights-data.ts`** (mirrors `src/lib/services-data.ts`):
  - `type Article = { slug; title; excerpt; category; date; readMin; color; author; body }`
    where `author` is `{ name, role }` (tie to a leader where natural) and `body` is an array of
    sections `{ heading?, paragraphs: string[] }`.
  - `ARTICLES: Article[]` — the **7 existing articles** keep their titles/excerpts/category/date,
    gain an `author`, a `slug`, and a full written `body` (several sections each, in the existing
    analytical brand voice). Articles and angles:
    1. `predictive-etas-replacing-static-schedules` — "Why predictive ETAs are replacing static schedules in 2026" (AI & Tech, featured) — author: Arjun Mehta.
    2. `red-sea-volatility-resilient-lanes` — "Red Sea volatility: building resilience into your lanes" (Market) — author: Rachel Donovan.
    3. `green-corridors-scaling` — "Green corridors are finally scaling" (Sustainability).
    4. `cutting-demurrage-inland-scheduling` — "Cutting demurrage with smarter inland scheduling" (Operations).
    5. `agentic-ai-beyond-the-chatbot` — "Agentic AI in logistics: beyond the chatbot" (AI & Tech) — author: Arjun Mehta.
    6. `container-rates-outlook-h2-2026` — "Container rates outlook: H2 2026 scenarios" (Market).
    7. `smart-warehouse-sensors-solar-ai` — "The smart warehouse: sensors, solar, and AI matching" (Operations) — author: Rachel Donovan.
  - Helpers: `getArticle(slug): Article | undefined` and `ARTICLE_SLUGS: string[]` (or derive).
- **`src/components/insights/insights-list.tsx` (modify):** import `ARTICLES` from the data module
  (remove the local hardcoded array). The featured block, each grid card, and the "Read article"
  control become `next/link` to `/insights/${slug}`. Keep the category filter + newsletter as-is.
  (The newsletter stays a client island; the list can remain a client component.)
- **`src/app/(site)/insights/[slug]/page.tsx` (new):** rich article template mirroring
  `src/app/(site)/services/[slug]/page.tsx`:
  - `generateStaticParams()` from `ARTICLE_SLUGS`; `generateMetadata` per article (title + excerpt);
    `notFound()` for unknown slugs.
  - Layout: hero (category tag, title, author, date, read time, gradient banner consistent with the
    card color), prose body (render `body` sections with headings + paragraphs, styled for
    readability), an author footer, a "Related articles" strip (2–3 others, prefer same category),
    a back-to-Insights link, and the existing newsletter CTA reused.

## Files

| File | Change |
|------|--------|
| `src/lib/about-data.ts` | NEW — `STATS`, `TIMELINE`, `LEADERS` (with photo + bio). |
| `src/app/(site)/about/page.tsx` | MODIFY — Houston story copy, new timeline, photo+bio leadership cards, founder pull-quote; consume `about-data`. |
| `src/lib/insights-data.ts` | NEW — `Article` type, `ARTICLES` (7, with author + body), `getArticle`, `ARTICLE_SLUGS`. |
| `src/lib/insights-data.test.ts` | NEW — `getArticle` + slug coverage tests. |
| `src/components/insights/insights-list.tsx` | MODIFY — read from data module; cards/featured/"Read article" link to `/insights/[slug]`. |
| `src/app/(site)/insights/[slug]/page.tsx` | NEW — article detail template + generateStaticParams + metadata + notFound. |
| `public/leadership/{23,20,24,21}.jpg` | EXISTING — wired into leadership cards. |

## Testing

- **Unit (Vitest):** `getArticle` returns the right article for a valid slug and `undefined` for an
  unknown one; `ARTICLE_SLUGS` covers all `ARTICLES`; every article has non-empty `body`.
- **Build/serve:** `npx tsc --noEmit`, `npm run build` green; `/insights/[slug]` routes appear in
  the manifest (7 SSG pages) and `/about` + each article render 200; an unknown slug → 404.
- **Manual eyeball:** About reads as the Houston story with 4 photo bios; clicking an Insights card
  opens a full article; related links + back link work.

## Non-goals

- No CMS / no DB for articles (static data module, like services — a real feed can replace it later).
- No localization of these pages (i18n Phase 2).
- No changes to Sustainability / Careers / Contact.
- No new article imagery beyond the existing gradient banners (keep the current visual treatment).
