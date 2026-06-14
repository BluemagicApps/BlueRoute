# Company Content (Item 9) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the About page around Blue Route's real Houston-1998 founding story with real leadership photos + bios, and turn Insights from dead cards into real, readable article pages at `/insights/[slug]`.

**Architecture:** Two static data modules (`src/lib/about-data.ts`, `src/lib/insights-data.ts`) mirroring the existing `services-data.ts` pattern; the About page and Insights list consume them; a new `/insights/[slug]` route renders full articles using `generateStaticParams` + `notFound`, mirroring `services/[slug]/page.tsx`. No DB/CMS, no i18n on these pages (English-only — i18n Phase 2 covers them later).

**Tech Stack:** Next 16.2.7 (App Router, Turbopack), React 19, TypeScript, Tailwind v4, framer-motion 12.40, next/image, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-14-company-content-design.md`

**Voice for all written copy:** analytical, concrete, confident, no hype — match the existing About/Insights wording. Never invent third-party/carrier claims.

---

## Task 1: About data module (`src/lib/about-data.ts`)

**Files:**
- Create: `src/lib/about-data.ts`
- Test: `src/lib/about-data.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/about-data.test.ts
import { describe, it, expect } from "vitest";
import { STATS, TIMELINE, LEADERS } from "./about-data";

describe("about-data", () => {
  it("has four stats and a 1998→2026 timeline starting in Houston", () => {
    expect(STATS).toHaveLength(4);
    expect(TIMELINE[0].year).toBe("1998");
    expect(TIMELINE[0].title.toLowerCase()).toContain("houston");
    expect(TIMELINE[TIMELINE.length - 1].year).toBe("2026");
  });
  it("has four leaders, each with a photo under /leadership and a non-empty bio", () => {
    expect(LEADERS).toHaveLength(4);
    for (const p of LEADERS) {
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.role.length).toBeGreaterThan(0);
      expect(p.photo.startsWith("/leadership/")).toBe(true);
      expect(p.bio.length).toBeGreaterThan(40);
    }
  });
  it("the founder is the first leader and the CEO", () => {
    expect(LEADERS[0].role).toContain("CEO");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/about-data.test.ts`
Expected: FAIL — cannot find module `./about-data`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/about-data.ts

export type Stat = { v: string; l: string };
export type TimelineEntry = { year: string; title: string; body: string };
export type Leader = { name: string; role: string; photo: string; bio: string };

export const STATS: Stat[] = [
  { v: "180+", l: "Countries served" },
  { v: "2.4M", l: "Containers / year" },
  { v: "9", l: "Smart warehouse hubs" },
  { v: "94%", l: "On-time, AI-verified" },
];

export const TIMELINE: TimelineEntry[] = [
  { year: "1998", title: "Founded in Houston", body: "One van, one promise — door-to-door parcel delivery across the city." },
  { year: "2004", title: "Gulf-Coast freight", body: "Grew into regional LTL and full-truckload trucking across Texas and the Gulf Coast." },
  { year: "2011", title: "Going global", body: "Opened our first international ocean lanes and brought customs brokerage in-house." },
  { year: "2017", title: "Door-to-door network", body: "Full origin-to-destination coverage, with offices in LA, Rotterdam, and Singapore." },
  { year: "2023", title: "The AI Edge", body: "Predictive ETAs and agentic planning go live for every customer." },
  { year: "2026", title: "180+ countries", body: "Now moving 2.4M containers a year on the world's smartest network." },
];

export const LEADERS: Leader[] = [
  {
    name: "Carol Briggs",
    role: "Founder & CEO",
    photo: "/leadership/23.jpg",
    bio: "Carol started Blue Route in 1998 with a single van, running parcels across Houston on one promise: every package arrives exactly as expected. Nearly three decades later she still runs the company by that standard — now across 180+ countries. She has spent her career proving that reliability is a product, not a slogan, and she's steering Blue Route toward a future where no shipper is ever surprised by their own supply chain.",
  },
  {
    name: "Michael Reyes",
    role: "Co-founder & CTO",
    photo: "/leadership/20.jpg",
    bio: "Michael joined Carol in the early Houston days and turned a shoebox of tracking spreadsheets into the platform that powers Blue Route today. He architected the systems behind real-time visibility and the AI Edge, and he's the reason a company that began as a courier can out-engineer carriers a hundred times its size. His focus now: a network that predicts and self-corrects before a human ever has to.",
  },
  {
    name: "Rachel Donovan",
    role: "Chief Operations Officer",
    photo: "/leadership/24.jpg",
    bio: "Rachel runs the machine — the global door-to-door network, the nine smart-warehouse hubs, and the thousands of moves that happen every day. She came up through port operations and freight forwarding, and she's known for turning chaos into choreography. Under her, Blue Route's on-time rate climbed to 94%, AI-verified, and she's pushing it higher.",
  },
  {
    name: "Arjun Mehta",
    role: "Head of AI",
    photo: "/leadership/21.jpg",
    bio: "Arjun leads the team behind Blue Route's predictive ETAs, route optimization, and agentic resolution. He came from applied machine learning to answer one question: what if logistics could think a step ahead? His models now weigh weather, ports, and live demand on every shipment — and he's building toward a network that plans itself.",
  },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/about-data.test.ts && npx tsc --noEmit`
Expected: PASS (3 tests); tsc exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/about-data.ts src/lib/about-data.test.ts
git commit -m "feat(item9): about-data module (Houston story, timeline, leaders)"
```

---

## Task 2: About page rewrite (`src/app/(site)/about/page.tsx`)

**Files:**
- Modify: `src/app/(site)/about/page.tsx`

The page currently defines `STATS`, `TIMELINE`, `LEADERS` inline and renders the leadership as gradient-initial avatars. Replace the inline arrays with imports from `about-data`, rewrite the Houston-origin copy, and rebuild the leadership cards as photo + bio.

- [ ] **Step 1: Swap data source + imports**

At the top of `src/app/(site)/about/page.tsx`, add:
```ts
import Image from "next/image";
import { STATS, TIMELINE, LEADERS } from "@/lib/about-data";
```
Then DELETE the inline `const STATS = [...]`, `const TIMELINE = [...]`, and `const LEADERS = [...]` declarations from the file (they now come from the import). Keep the `VALUES` and `CHIP` constants as they are.

- [ ] **Step 2: Update the founding-story copy**

In the **Mission** section, replace the two mission paragraphs with Houston-rooted copy (keep the surrounding markup and the `<h2>` "The industry runs on hope. We run on foresight." heading):
```tsx
<p className="mt-4 text-mist">
  Blue Route started in Houston in 1998 with a single van and a simple
  promise: every package arrives exactly as expected. That promise grew
  into regional freight, then global ocean lanes, and finally a
  door-to-door network reaching 180+ countries — but it never changed.
</p>
<p className="mt-3 text-mist">
  Today our platform fuses live ocean, port, and weather signals with
  agentic AI, so your cargo is continuously re-optimized for cost, speed,
  and carbon — and you stay a step ahead, always.
</p>
```
In the **Timeline** section, change the `SectionHeading` to reflect Houston:
```tsx
<SectionHeading eyebrow="Our journey" title="From a Houston van to a global network" />
```
(The timeline entries themselves now render from the imported `TIMELINE` — no per-entry edits needed.)

- [ ] **Step 3: Update the pull-quote attribution to the founder**

In the **Mission** pull-quote card, replace the `LV` initials avatar + name block with the founder from `LEADERS[0]`:
```tsx
<div className="mt-6 flex items-center gap-3">
  <Image
    src={LEADERS[0].photo}
    alt={LEADERS[0].name}
    width={44}
    height={44}
    className="h-11 w-11 rounded-full object-cover"
  />
  <div>
    <p className="text-sm font-semibold text-foam">{LEADERS[0].name}</p>
    <p className="text-xs text-mist">{LEADERS[0].role}</p>
  </div>
</div>
```
(The quote text above it stays as-is — it already fits a founder voice.)

- [ ] **Step 4: Rebuild the leadership cards with photo + bio**

Replace the entire Leadership grid (`<div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"> ... </div>`) with a 2-up photo+bio layout:
```tsx
<div className="mt-12 grid gap-5 sm:grid-cols-2">
  {LEADERS.map((p, i) => (
    <Reveal key={p.name} delay={i * 0.06}>
      <article className="flex h-full gap-5 rounded-3xl border border-steel/70 bg-deep p-6 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:border-cyan/40">
        <Image
          src={p.photo}
          alt={p.name}
          width={96}
          height={96}
          className="h-24 w-24 shrink-0 rounded-2xl object-cover"
        />
        <div>
          <h3 className="text-base font-semibold text-foam">{p.name}</h3>
          <p className="text-sm text-cyan">{p.role}</p>
          <p className="mt-2 text-sm leading-relaxed text-mist">{p.bio}</p>
        </div>
      </article>
    </Reveal>
  ))}
</div>
```
(The `Reveal` import already exists in the file. The `SectionHeading eyebrow="Leadership" title="The people steering Blue Route"` above the grid stays.)

- [ ] **Step 5: Verify build + render**

Run: `npx tsc --noEmit && npm run build`
Expected: exit 0; build succeeds.
Then render-check (use a running dev server on :3000 if present, else start one):
```bash
curl -s http://localhost:3000/about -o /tmp/about.html
grep -ci "Houston\|Carol Briggs\|Arjun Mehta" /tmp/about.html   # > 0
grep -ci "Rotterdam idea\|Lena Vos" /tmp/about.html             # should be 0 (old story gone)
```
Expected: Houston + new leader names present; the old "Rotterdam idea"/"Lena Vos" strings gone.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(site)/about/page.tsx"
git commit -m "feat(item9): rewrite About around Houston-1998 story + photo bios"
```

---

## Task 3: Insights data module (`src/lib/insights-data.ts`)

**Files:**
- Create: `src/lib/insights-data.ts`
- Test: `src/lib/insights-data.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/insights-data.test.ts
import { describe, it, expect } from "vitest";
import { ARTICLES, ARTICLE_SLUGS, getArticle } from "./insights-data";

describe("insights-data", () => {
  it("exposes all seven articles with unique slugs", () => {
    expect(ARTICLES).toHaveLength(7);
    expect(new Set(ARTICLE_SLUGS).size).toBe(7);
    expect(ARTICLE_SLUGS).toEqual(ARTICLES.map((a) => a.slug));
  });
  it("every article has an author and a non-empty body", () => {
    for (const a of ARTICLES) {
      expect(a.author.name.length).toBeGreaterThan(0);
      expect(a.author.role.length).toBeGreaterThan(0);
      expect(a.body.length).toBeGreaterThan(0);
      for (const s of a.body) expect(s.paragraphs.length).toBeGreaterThan(0);
    }
  });
  it("has exactly one featured article", () => {
    expect(ARTICLES.filter((a) => a.featured)).toHaveLength(1);
  });
  it("getArticle resolves a valid slug and returns undefined for unknown", () => {
    expect(getArticle(ARTICLES[0].slug)?.title).toBe(ARTICLES[0].title);
    expect(getArticle("does-not-exist")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/insights-data.test.ts`
Expected: FAIL — cannot find module `./insights-data`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/insights-data.ts` with the type + helpers exactly as below, then the `ARTICLES` array. The full body for the first article is given verbatim. **For the other six, write each `body` as 3–4 `{ heading, paragraphs }` sections in the same analytical voice** (each section 1–2 paragraphs), keeping the listed `slug`/`title`/`excerpt`/`category`/`date`/`readMin`/`color`/`author`/`featured`. Do not invent third-party claims; keep the tone concrete and practical.

```ts
// src/lib/insights-data.ts

export type ArticleCategory = "Market" | "AI & Tech" | "Sustainability" | "Operations";
export type ArticleColor = "cyan" | "indigo" | "teal" | "emerald" | "amber";
export type ArticleSection = { heading?: string; paragraphs: string[] };
export type ArticleAuthor = { name: string; role: string };

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: ArticleCategory;
  date: string;
  readMin: number;
  color: ArticleColor;
  author: ArticleAuthor;
  featured?: boolean;
  body: ArticleSection[];
};

export const ARTICLES: Article[] = [
  {
    slug: "predictive-etas-replacing-static-schedules",
    title: "Why predictive ETAs are replacing static schedules in 2026",
    excerpt:
      "The shift from published timetables to live, confidence-scored arrivals is reshaping how shippers plan inventory and cash flow.",
    category: "AI & Tech",
    date: "Jun 4, 2026",
    readMin: 6,
    color: "cyan",
    featured: true,
    author: { name: "Arjun Mehta", role: "Head of AI" },
    body: [
      {
        paragraphs: [
          "For decades, a shipping schedule was a promise printed in advance and quietly broken in transit. A vessel left with a published arrival date, and everyone downstream — warehouses, factories, finance teams — planned against a number that stopped being true the moment the weather turned. The industry learned to absorb the gap with buffer stock, expedited freight, and apologetic emails.",
          "Predictive ETAs invert that model. Instead of a fixed date, you get a live estimate with a confidence score that updates as conditions change — and that small shift rewrites how a supply chain plans.",
        ],
      },
      {
        heading: "From a date to a distribution",
        paragraphs: [
          "A static ETA is a single point. A predictive ETA is a range with a probability attached: not \"arrives the 14th,\" but \"arrives the 14th, 82% confidence, with port congestion the main risk.\" That lets planners make decisions proportional to certainty — hold inventory when confidence is high, pre-stage a reroute when it isn't.",
          "The inputs are no longer just the carrier's plan. Live vessel positions, port dwell times, berth availability, and weather all feed the estimate, and the model reweighs them continuously.",
        ],
      },
      {
        heading: "What it changes downstream",
        paragraphs: [
          "When arrivals carry confidence scores, working capital stops hiding in safety stock. Inventory can be timed to the actual curve of risk instead of the worst case, and cash that used to sit in buffer inventory goes back to work.",
          "The teams that benefit most aren't the ones with the most data — they're the ones who let the estimate drive the decision instead of treating it as a footnote.",
        ],
      },
    ],
  },
  // ... six more articles below (write full bodies per the spec/instruction) ...
];

export const ARTICLE_SLUGS = ARTICLES.map((a) => a.slug);

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
```

The remaining six `ARTICLES` entries (insert before the closing `];`, after the featured one) — use these exact metadata, and author each a full 3–4-section `body`:

| slug | title | excerpt (keep) | category | date | readMin | color | author |
|------|-------|-------|----------|------|---------|-------|--------|
| `red-sea-volatility-resilient-lanes` | Red Sea volatility: building resilience into your lanes | A practical framework for pricing risk and pre-staging reroutes before disruption hits. | Market | May 28, 2026 | 5 | indigo | Rachel Donovan, Chief Operations Officer |
| `green-corridors-scaling` | Green corridors are finally scaling — here's what it means | Low-emission lanes are moving from pilot to mainstream. The cost gap is closing fast. | Sustainability | May 21, 2026 | 4 | emerald | Rachel Donovan, Chief Operations Officer |
| `cutting-demurrage-inland-scheduling` | Cutting demurrage with smarter inland scheduling | How appointment optimization quietly removes one of logistics' most avoidable costs. | Operations | May 14, 2026 | 7 | amber | Rachel Donovan, Chief Operations Officer |
| `agentic-ai-beyond-the-chatbot` | Agentic AI in logistics: beyond the chatbot | When AI can execute multi-step plans, the operating model of a freight desk changes entirely. | AI & Tech | May 7, 2026 | 8 | teal | Arjun Mehta, Head of AI |
| `container-rates-outlook-h2-2026` | Container rates outlook: H2 2026 scenarios | Three forward curves for the major east–west trades and what could bend them. | Market | Apr 30, 2026 | 6 | indigo | Michael Reyes, Co-founder & CTO |
| `smart-warehouse-sensors-solar-ai` | The smart warehouse: sensors, solar, and AI matching | What separates a modern logistics hub from a plain big box — and why it matters to your TCO. | Operations | Apr 23, 2026 | 5 | cyan | Rachel Donovan, Chief Operations Officer |

(`author` is `{ name, role }` split from the table's "author" column, e.g. `{ name: "Rachel Donovan", role: "Chief Operations Officer" }`. None of these six set `featured`.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/insights-data.test.ts && npx tsc --noEmit`
Expected: PASS (4 tests); tsc exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/insights-data.ts src/lib/insights-data.test.ts
git commit -m "feat(item9): insights-data module (7 articles with bodies + authors)"
```

---

## Task 4: Wire the Insights list to the data module + links

**Files:**
- Modify: `src/components/insights/insights-list.tsx`

The component currently defines its own `Category`/`Article` types and a local `ARTICLES` array, and renders cards as non-navigating `<button>`s. Switch it to the data module and make cards link to `/insights/[slug]`. Also export `Newsletter` so the article page can reuse it.

- [ ] **Step 1: Replace local types/data with imports**

At the top of `src/components/insights/insights-list.tsx` (it is a `"use client"` component — keep that):
```ts
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Clock, Mail, Check } from "lucide-react";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { ARTICLES, type ArticleCategory } from "@/lib/insights-data";

const MotionLink = motion.create(Link);
```
DELETE the local `type Category = ...`, `type Article = ...`, and the entire local `const ARTICLES: Article[] = [...]` array. Keep the `COLOR` and `TAG` maps, but change `TAG`'s key type to `ArticleCategory`:
```ts
const TAG: Record<ArticleCategory, string> = {
  Market: "bg-indigo/10 text-indigo",
  "AI & Tech": "bg-cyan/10 text-cyan",
  Sustainability: "bg-emerald/10 text-emerald",
  Operations: "bg-amber/10 text-amber",
};
```
Update the `CATEGORIES` constant and the `active` state type to use `ArticleCategory`:
```ts
const CATEGORIES: ("All" | ArticleCategory)[] = ["All", "Market", "AI & Tech", "Sustainability", "Operations"];
```
and in `InsightsList`: `const [active, setActive] = useState<"All" | ArticleCategory>("All");`

- [ ] **Step 2: Make the featured block a link**

In the featured block, change the "Read article" `<button>` into a link to the featured article:
```tsx
<Link
  href={`/insights/${featured.slug}`}
  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan"
>
  Read article <ArrowUpRight className="h-4 w-4" />
</Link>
```

- [ ] **Step 3: Make each grid card a link (preserve the layout animation)**

Replace the `motion.button` card with `MotionLink`, adding `href`:
```tsx
{rest.map((a, i) => (
  <MotionLink
    key={a.title}
    href={`/insights/${a.slug}`}
    layout
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, delay: i * 0.04, ease: EASE_OUT_EXPO }}
    className="group flex flex-col overflow-hidden rounded-3xl border border-steel/70 bg-deep text-left shadow-soft transition-all hover:-translate-y-1 hover:border-cyan/40"
  >
    {/* ...unchanged card inner markup (banner, tag, title, excerpt, date/readMin)... */}
  </MotionLink>
))}
```
Keep the inner markup exactly as it is now.

- [ ] **Step 4: Export Newsletter for reuse**

Change the `Newsletter` declaration from `function Newsletter()` to `export function Newsletter()` (so Task 5's article page can import it). No other change to it.

- [ ] **Step 5: Verify build + render**

Run: `npx tsc --noEmit && npm run build`
Expected: exit 0. If tsc complains about `motion.create(Link)` typing, confirm framer-motion 12.40 API — `motion.create` is correct for v12; do not fall back to the deprecated `motion(Link)` factory.
Then:
```bash
curl -s http://localhost:3000/insights -o /tmp/insights.html
grep -o '/insights/predictive-etas-replacing-static-schedules' /tmp/insights.html | head -1   # link present
```
Expected: article hrefs present in the listing.

- [ ] **Step 6: Commit**

```bash
git add src/components/insights/insights-list.tsx
git commit -m "feat(item9): Insights list reads data module + links to articles"
```

---

## Task 5: Article detail page (`/insights/[slug]`)

**Files:**
- Create: `src/app/(site)/insights/[slug]/page.tsx`

- [ ] **Step 1: Write the article template**

```tsx
// src/app/(site)/insights/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Clock } from "lucide-react";
import { ARTICLES, getArticle, type ArticleCategory, type ArticleColor } from "@/lib/insights-data";
import { Reveal } from "@/components/ui/reveal";
import { Newsletter } from "@/components/insights/insights-list";

const COLOR: Record<ArticleColor, string> = {
  cyan: "from-cyan to-indigo",
  indigo: "from-indigo to-rose",
  teal: "from-teal to-cyan",
  emerald: "from-emerald to-teal",
  amber: "from-amber to-rose",
};
const TAG: Record<ArticleCategory, string> = {
  Market: "bg-indigo/10 text-indigo",
  "AI & Tech": "bg-cyan/10 text-cyan",
  Sustainability: "bg-emerald/10 text-emerald",
  Operations: "bg-amber/10 text-amber",
};

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return { title: "Insights" };
  return { title: a.title, description: a.excerpt };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) notFound();

  const sameCat = ARTICLES.filter((x) => x.slug !== a.slug && x.category === a.category);
  const related = (sameCat.length ? sameCat : ARTICLES.filter((x) => x.slug !== a.slug)).slice(0, 2);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-10 lg:pt-40">
        <div className={`absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-br ${COLOR[a.color]} opacity-15`} />
        <div className="mx-auto max-w-3xl px-5 lg:px-8">
          <Link href="/insights" className="inline-flex items-center gap-1.5 text-sm text-mist hover:text-foam">
            <ArrowLeft className="h-4 w-4" /> All insights
          </Link>
          <span className={`mt-6 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${TAG[a.category]}`}>
            {a.category}
          </span>
          <h1
            className="mt-3 text-balance text-3xl font-semibold leading-[1.1] tracking-tight text-foam md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {a.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-mist">
            <span className="font-medium text-foam">{a.author.name}</span>
            <span>{a.author.role}</span>
            <span>{a.date}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {a.readMin} min read
            </span>
          </div>
        </div>
      </section>

      {/* Body */}
      <article className="relative pb-14">
        <div className="mx-auto max-w-3xl px-5 lg:px-8">
          {a.body.map((section, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <div className="mt-8 first:mt-0">
                {section.heading && (
                  <h2
                    className="mb-3 text-xl font-semibold text-foam"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {section.heading}
                  </h2>
                )}
                {section.paragraphs.map((p, j) => (
                  <p key={j} className="mt-4 text-base leading-relaxed text-mist first:mt-0">
                    {p}
                  </p>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </article>

      {/* Related */}
      <section className="relative py-10">
        <div className="mx-auto max-w-3xl px-5 lg:px-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-mist">Related reading</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/insights/${r.slug}`}
                className="group rounded-3xl border border-steel/70 bg-deep p-5 shadow-soft transition-all hover:-translate-y-1 hover:border-cyan/40"
              >
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${TAG[r.category]}`}>
                  {r.category}
                </span>
                <h3 className="mt-3 flex items-start gap-1 text-base font-semibold leading-snug text-foam">
                  {r.title}
                  <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-cyan transition-transform group-hover:translate-x-0.5" />
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-mist">{r.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="relative pb-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <Newsletter />
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 2: Verify build, routes, and 404**

Run: `npx tsc --noEmit && npx eslint "src/app/(site)/insights/[slug]/page.tsx" && npm run build`
Expected: exit 0; build manifest lists `/insights/[slug]` with 7 prerendered paths (SSG).
Then render-check:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/insights/predictive-etas-replacing-static-schedules   # 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/insights/nope-not-real                                  # 404
curl -s http://localhost:3000/insights/agentic-ai-beyond-the-chatbot | grep -ci "Arjun Mehta\|Related reading"          # > 0
```
Expected: 200 for a real slug, 404 for a bogus one, author + related present.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(site)/insights/[slug]/page.tsx"
git commit -m "feat(item9): /insights/[slug] article detail pages"
```

---

## Task 6: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Full unit suite + lint + build**

Run:
```bash
npm test
npx eslint src/lib/about-data.ts src/lib/insights-data.ts src/components/insights/insights-list.tsx "src/app/(site)/about/page.tsx" "src/app/(site)/insights/[slug]/page.tsx"
npm run build
```
Expected: all Vitest tests pass (135 before this feature + the new about-data/insights-data tests → ~142); eslint clean; build exit 0 with 7 new `/insights/[slug]` SSG routes.
Report the exact test count and route total.

- [ ] **Step 2: Manual eyeball checklist (dev server on :3000)**

Confirm by curl/grep (or browser):
```bash
curl -s http://localhost:3000/about -o /tmp/a.html
grep -ci "Houston\|Carol Briggs\|Michael Reyes\|Rachel Donovan\|Arjun Mehta" /tmp/a.html   # > 0
grep -ci "MISSING_MESSAGE\|Application error" /tmp/a.html                                   # 0
curl -s http://localhost:3000/insights -o /tmp/i.html
grep -co '/insights/[a-z-]\+' /tmp/i.html                                                   # 7 (one per card) + featured
```
Expected: About shows the Houston story + all four new leaders; Insights links to detail pages; no errors.

- [ ] **Step 3: Commit (if any verification fixups were needed)**

If Steps 1–2 required small fixes, commit them:
```bash
git add -A
git commit -m "fix(item9): verification fixups"
```
Otherwise, nothing to commit — the feature is complete.

---

## Self-review notes

- **Spec coverage:** About Houston rewrite + timeline (Task 2) · leadership photos+bios (Tasks 1–2) · founder pull-quote (Task 2) · `about-data` module (Task 1) · `insights-data` with 7 article bodies + authors (Task 3) · listing wired to data + links (Task 4) · `/insights/[slug]` template + generateStaticParams + notFound + metadata (Task 5) · tests + build verification (Tasks 1,3,6). Sustainability/Careers/Contact untouched (non-goal). English-only (non-goal: no i18n). All spec items mapped.
- **Type consistency:** `Leader{name,role,photo,bio}`, `Article{slug,title,excerpt,category,date,readMin,color,author{name,role},featured?,body[{heading?,paragraphs[]}]}`, `getArticle`, `ARTICLE_SLUGS`, `ArticleCategory`, `ArticleColor` are defined once (Tasks 1,3) and consumed with identical shapes in Tasks 2,4,5. The `COLOR`/`TAG` map keys match `ArticleColor`/`ArticleCategory`.
- **Content note:** Task 3 requires the implementer to author six full article bodies in the established voice (the featured article body is provided verbatim as the exemplar). This is editorial content, not logic — keep it concrete, practical, and free of invented third-party claims.
- **framer-motion:** v12.40 → `motion.create(Link)` (Task 4). Do not use the deprecated `motion(Link)` factory.
