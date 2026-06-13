# Blue Route Logistics — Full Upgrade Plan

This plan maps **1:1 to the original 16-point request**. It is the single source of
truth for the upgrade. Status is tracked per item.

**Legend:** ✅ done · 🟡 in progress · ⏳ planned · ⛔ blocked on you

> **Status reconciled 2026-06-11.** Since this plan was first drafted, four backend
> sub-projects shipped to `main` (real Supabase+Resend forms · live Groq AI advisor ·
> MapLibre map swap · `/portal` magic-link auth) and imagery Checkpoint 2 was completed
> (Timi chose **Variant 1 — Cobalt Duotone** at `/transport-lab`). Markers below reflect that.

---

## Locked decisions (agreed with Timi)

| Area | Decision |
|------|----------|
| Delivery | One comprehensive build; two visual-variant checkpoints (globe ✅ done, backgrounds ⏳) require your pick |
| Backend | **Supabase** (Postgres + Auth + Storage + RLS), deployed on **Vercel** |
| AI | **Groq** free tier (assistant, dynamic translation, Whisper STT fallback) |
| Translation | **Hybrid** — pre-translated static UI (`next-intl`) + live Groq translation for dynamic data |
| Imagery | Free premium stock (Pexels/Unsplash) sourced by me + Blue Route branding overlay; **leadership photos supplied by you** |
| Maps | **MapLibre GL** (free, no token) |
| Warehouses | ~30–40 facility dataset + no-payment, staff-routed booking wizard (no public warehouse API exists) |

### New dependencies (installed ✅)
`@supabase/supabase-js`, `@supabase/ssr`, `maplibre-gl`, `next-intl`, `groq-sdk`, `resend`.

### Accounts / keys ✅ all received (in `.env.local`)
- **Supabase:** URL + anon + service-role keys live; project `ktyfrxfjuognirtqiifo`, schema applied.
- **Groq:** `GROQ_API_KEY` live (assistant verified green).
- **Resend:** `RESEND_API_KEY` live; also wired as Supabase auth SMTP. ⛔ Domain not yet
  verified on Resend → test mode: sender `onboarding@resend.dev`, delivers only to Timi's
  Resend-account email. Verify `blueroute.com` before launch.
- **Leadership photos:** received — 23.jpg (CEO), 20.jpg (CTO), 24.jpg (COO), 21.jpg (Head of AI)

### Engineering notes
- This is **Next 16** (not standard Next). Consult `node_modules/next/dist/docs/01-app/…`
  before each subsystem: route-handlers, app-icons, metadata, authentication, images.
- Reusable building blocks to create: a `RouteMap` (MapLibre, animated trip line) shared
  by tracking + portal; a `bookings` schema flexible enough to absorb future data points;
  an `ai_interactions` audit log written by every AI call.

---

## The 16 items

### 1. Animated globe icon + bigger wordmark + tab icon — ✅ done
- **Decision:** you chose to keep the current globe; rim darkened to cobalt `#1e5bff` so the
  edge is visible (your original complaint).
- "Blue **Route**" wordmark enlarged, extra-bold, "Route" in cobalt — `src/components/brand/logo.tsx`.
- New cobalt tab icon — `src/app/icon.svg` (Next 16 file convention); removed default `favicon.ico`.

### 2. Remove AI banner, rephrase welcome, add phone — ✅ done
- Removed the "AI-Powered Logistics Platform" badge — `src/components/home/hero.tsx`.
- Rewrote the welcome paragraph; removed the "MSC and Maersk" line and all brand names.
- Added **☎ +1 (323) 484-8030** with a phone icon at top-right, above Get Quote — `src/components/site-header.tsx`.

### 3. Real, human imagery on every page (anti-AI look) — 🟡 checkpoint done, rollout remaining
- ✅ **Checkpoint 2 complete:** 5 treatments built at `/transport-lab` (not `/bg-lab`);
  Timi chose **Variant 1 — Cobalt Duotone Full-Bleed**. Productized as
  `src/components/ui/transport-photo.tsx` (`<TransportPhoto vehicle=… />`, duotone +
  scrim + Ken Burns). Photos in `public/transport/{ship,plane,train,truck}.jpg`.
- ✅ Applied: home hero (ship) + ocean/air/land service detail heroes.
- ⏳ **Remaining:** extend `TransportPhoto` to arbitrary scene photos; source + apply an
  on-theme photo to the remaining pages (warehousing → warehouse interior, cold-chain →
  reefer, door-to-door, project-cargo, customs, about, sustainability, …) in `public/scenes/`.
- ⏳ Polish pass on every section; delete throwaway `/transport-lab` once Timi confirms live look.

### 4. Remove listed teams from "Trusted by…" — ✅ done
- Removed all named carriers (and the placeholder marquee); replaced with neutral, non-brand
  trust signals (licensed & bonded, insured end-to-end, 24/7 monitoring, 180+ countries) —
  `src/components/home/trust-strip.tsx`.

### 5. Make AI Edge real + clickable cards — ✅ done (2026-06-13)
- ✅ Site-wide AI assistant runs on **real Groq** (`src/app/actions/advisor.ts`, grounded
  system prompt, per-IP rate limit, CTA allowlist). Mock "thinking steps" removed.
- ✅ All 4 capability cards are clickable (`src/components/home/ai-edge.tsx` + `/ai-edge`): the
  AI Assistant card opens the advisor (`br-open-assistant` event); the other three link to
  **`/ai-edge/predictive-insights`**, **`/ai-edge/route-optimizer`**, **`/ai-edge/proactive-resolution`**.
- ✅ Three real, interactive tool pages built on Groq JSON-mode + Open-Meteo weather + the
  haversine engine: Predictive Insights (delay-probability/ETA/cost-trend), Route Optimizer
  (cost/time/carbon balance + backup lane), Proactive Resolution (scenario → auto-fix). A shared
  `<AiToolConsole>` drives a PORTS lane picker; figures are labeled "AI estimate · grounded in
  live weather + distance". Tool actions log to `ai_interactions`. Live E2E green
  (`scripts/verify-ai-edge-e2e.mjs`).

### 6. Unique per-service quote/booking forms — ✅ done (live E2E green 2026-06-13)
- ✅ Quote "Request booking" + contact form persist to Supabase (`quote_requests`,
  `contact_inquiries`, RLS deny-all public) with server-side re-pricing, honeypot, and
  Resend team/customer emails (`src/app/actions/leads.ts`).
- ✅ The quote wizard is now **service-aware** via `/quote?service=<slug>`: ocean-freight &
  door-to-door keep the live-priced `quote-wizard.tsx`; air, land, project-cargo, cold-chain,
  and customs each get a tailored, config-driven request form
  (`src/components/quote/service-quote-wizard.tsx` + `src/lib/quote/service-fields.ts`).
- ✅ Every service detail page's "Get a quote" CTA preselects the service (`?service=<slug>`).
- ✅ Service quote requests persist to Supabase `bookings` (type='service') via
  `submitServiceQuote`, notify staff + ack the customer (Resend), and appear in the
  `/admin/bookings` review queue with a summary. Pure libs unit-tested; live E2E green
  (`scripts/verify-service-quotes-e2e.mjs`).

### 7. Fix invisible dropdown menu (web + mobile) — ✅ done
- Mega-menu panel is now a solid white surface with border + shadow (was see-through glass)
  — `src/components/site-header.tsx`. Mobile drawer already solid; verified.

### 8. Warehousing: more listings + booking wizard — ✅ done (live E2E green 2026-06-13)
- ✅ Expanded `src/lib/warehouse-data.ts` to **~36 facilities** across all regions
  (Europe, Asia, North America, Middle East, Oceania).
- ✅ **No-payment booking wizard** at `/warehousing/book?facility=…`
  (`warehouse-booking-wizard.tsx`, 3 steps: requirements → company → review) →
  Supabase `bookings` (type=warehouse) via `submitWarehouseBooking` → team + customer
  ack emails (Resend, best-effort). "Request this space" in the explorer links here.
- ✅ Admin review at **`/admin/bookings`** (new `bookings` menu permission): status-filtered
  table with one-click **approve/reject** (`setBookingStatus`) that emails the customer the
  decision. Pure libs (`src/lib/bookings/refs.ts`, `validate.ts`) unit-tested.
- ✅ Live E2E `scripts/verify-bookings-e2e.mjs` — seed → authed `/admin/bookings` renders →
  status flip + filter → public page 200/404 → **ALL GREEN**.
- (No free public warehouse-inventory API exists; dataset is structured so a real feed can
  replace it later.)

### 9. Company content: About story + leadership + insights — ⏳
- Rewrite About — `src/app/about/page.tsx`: founding story **Houston, TX, 1998**, started as
  door-to-door parcel delivery → grew into a global shipping company; fix the timeline.
- Leadership: a compelling per-person narrative (family + work background, their impact, and
  prospects for the company's future) with the **real photos you supplied** (replace the
  gradient-initial avatars): CEO=23.jpg, CTO=20.jpg, COO=24.jpg, Head of AI=21.jpg.
- Enrich every Company dropdown destination; expand the Insights page with detailed articles.

### 10. Fix two stacked CTA banners site-wide — ✅ done
- Removed the page-level bottom CTA bands that stacked against the global footer CTA, on
  **about, ai-edge, sustainability, services**. Every page now ends on a single CTA.

### 11. Update contact info + addresses — ✅ done
- `src/app/contact/page.tsx`: **sales@blueroute.com**, **support@blueroute.com**,
  **+1 (323) 484 8030**; Head office **3229 Hadley St, Houston, TX 77004**; plausible street
  addresses added to every global office.

### 12. Professional admin backend — ✅ done (live E2E green 2026-06-12)
All of a–g built per the mockups (and the shipment-detail screenshots Timi supplied:
detail view + Actions menu + "Update shipment status" modal + printable invoice).
`admin-schema.sql` applied, super admin seeded (`roberthorton2167@gmail.com`), and a
13-step HTTP E2E (`scripts/verify-admin-e2e.mjs`) passed: unauth redirect, login,
all 6 panel pages render, bogus-id 404, non-admin user bounced.
Deferred: logo/favicon upload in App Settings.
A full `/admin` area mirroring the supplied mockups, rebuilt in Next 16 + Supabase, plus
analytics/auditing of AI-agent interactions.
- **a. Dashboard** (5.png): totals, shipments chart, latest shipments, quick actions.
- **b. Manage Shipments** (6.png): searchable table; **Manage** (14.png) opens an editor to
  update ALL shipment fields, **backdate any tracking log entry**, and **manually add a new
  current location** (writes `shipment_events`).
- **c. Create New Shipment** (7–9.png): rebuilt as a **smart multi-step wizard**
  (recipient → sender → shipping → review) that **generates a tracking number** at the end;
  photo upload to Supabase Storage.
- **d. Email Services** (10.png): category + rich-text compose → send via Resend.
- **e. Administrators** (11–12.png): add manager + manage admins; as the main admin you can
  **update each sub-admin's username/password and assign which menus they can access**
  (role + permissions JSON).
- **f. App Settings** (13.png): site info, logo/favicon, contact, etc.
- **g. AI analytics/audit:** dashboard over the `ai_interactions` log (data captured from AI
  agent ↔ user conversations) for analytics and auditing.
- **Data model:** `admins`, `shipments`, `shipment_events`, `bookings`, `quotes`,
  `ai_interactions`, `app_settings`, `warehouses`, `contacts`. RLS protects admin data;
  public read only through controlled API routes. Built to extend with your future features.

### 13. Professional public tracking page — ✅ done (live core E2E green 2026-06-12)
- Rebuilt `/tracking` per 14–17.png on **real Supabase data**: "Tracking Result" hero,
  Code 128B barcode of the tracking number, receiver/sender/consignment detail tables,
  origin/destination/dates + costs rows, **animated progress bar**, backdated
  **tracking-log table**, amber notice banner, and a **MapLibre animated route line**
  (`src/components/ui/route-map.tsx`, great-circle, draws itself in).
- **3-second staged loader** after Track is clicked. Data via `GET /api/track/[number]`
  (`src/lib/tracking/payload.ts` sanitizes; costs public per Timi's call; per-IP rate limit).
- **Print shipping invoice** button → print stylesheet (costs included).
- ⛔ **One manual step left:** paste `supabase/tracking-migration.sql` in the Supabase SQL
  editor (adds 4 origin/destination coord columns) so the map draws the full route line.
  Until then the map degrades to a current-position pin. Re-run `scripts/verify-tracking-e2e.mjs`
  after pasting to confirm the route. Admin create/edit forms gain a "Find coordinates"
  geocode assist (Open-Meteo) to fill those columns.

### 14. Portal: animated trip line on the map — ✅ done (2026-06-12)
- Each shipment row in `portal-dashboard.tsx` now has a "View route" button opening a modal
  (`src/components/portal/route-modal.tsx`) with the shared `RouteMap` and the trip's animated
  line (same component as tracking). The "open in tracking" link is preserved alongside it.
  Portal still runs on mock data (`portal-data.ts` gained per-lane coords) — wiring it to real
  Supabase shipments is a later effort, but the shared map component is done.

### 15. Auto-translate by IP on first load — ⏳
- `next-intl`, **top 10 languages** (English, Mandarin, Hindi, Spanish, French, Arabic,
  Bengali, Portuguese, Russian, Urdu). Detect the visitor's language by IP on first load
  (Vercel geo header in prod, `ipapi.co` free fallback in dev) and translate automatically;
  header/footer switcher to change to English or any other; choice persisted in a cookie so
  it only auto-forces on the genuine first visit. Static UI from pre-built catalogs; dynamic
  data via `api/ai/translate` (Groq).

### 16. Voice mode in the AI Advisor — ⏳
- Wire the existing mic button — `src/components/ai/ai-assistant.tsx`: native Web Speech API
  (`SpeechRecognition` + `speechSynthesis`) so the user talks and the AI talks back, with a
  **Groq Whisper STT fallback** (`api/ai/stt`) for browsers without native recognition
  (Firefox, iOS Safari). Works web + mobile.

---

## Build order (remaining)
1. ~~Backgrounds (item 3) rollout~~ ✅ done 2026-06-11 (scenes on warehousing, about,
   door-to-door, project-cargo, cold-chain, customs; public routes moved into the
   `(site)` route group so `/admin` is chrome-free).
2. ~~Supabase foundation~~ ✅ done (admins table/roles, `/admin/login` + guard).
3. ~~Admin backend (12)~~ ✅ done 2026-06-12 (schema applied, super admin seeded, live E2E green).
3b. ~~Tracking (13) + portal map (14)~~ ✅ done 2026-06-12 on real data (core E2E green;
   `branch feat/public-tracking`). ⛔ one manual step: paste `supabase/tracking-migration.sql`
   for the full route line.
4. ~~Warehouse booking (8)~~ ✅ done 2026-06-13 (dataset → ~36; `/warehousing/book` wizard
   → `bookings`; admin `/admin/bookings` approve/reject + email; live E2E green;
   `branch feat/warehouse-booking`).
4b. ~~Service-aware quote forms (rest of 6)~~ ✅ done 2026-06-13 (`/quote?service=` routing;
   air/land/project-cargo/cold-chain/customs request forms → `bookings` (type='service') →
   `/admin/bookings`; CTAs preselect; live E2E green; `branch feat/warehouse-booking`).
5. ~~Real AI (5)~~ ✅ done 2026-06-13 — AI-Edge tool pages live (predictive-insights,
   route-optimizer, proactive-resolution) on Groq + Open-Meteo; `branch feat/warehouse-booking`.
   **Voice (16)** next. ◀ NEXT
6. **i18n (15)** rollout.
7. **Company content (9)** with supplied photos.
8. **Deploy to Vercel** + full end-to-end verification.

## Verification (per phase)
- `npm run build` green (tsc + eslint) after each phase; every route serves.
- Admin: super admin → create sub-admin with limited menus → menu gating works. Create
  shipment via wizard → tracking number generated → editable, backdatable, location-addable.
- Public tracking: enter that number → 3s loader → consignment + log + animated map.
- Bookings: per-service quote + warehouse booking → rows in Supabase → staff approval email.
- AI: assistant + the 3 AI-Edge tools return live results; every call logged to `ai_interactions`.
- Voice: dictation + spoken reply in Chrome; Whisper fallback verified.
- i18n: non-US geo loads translated; switcher works; refresh keeps choice.
- Deploy to Vercel; re-verify geo/email/AI in production.

## Completed so far
- Items **1, 2, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14** done.
- **Item 3 Checkpoint 2** done (Variant 1 Cobalt Duotone, productized; rollout to remaining pages pending).
- **Backend sub-projects merged to `main`** (specs/plans in `docs/superpowers/`):
  real forms → Supabase + Resend (2026-06-10) · live Groq AI advisor (2026-06-10) ·
  MapLibre map swap (2026-06-10) · `/portal` magic-link auth + Supabase SMTP via Resend (2026-06-11).
- **Public tracking (13) + portal route map (14)** built on branch `feat/public-tracking`
  (2026-06-12, spec+plan in `docs/superpowers/`): great-circle `RouteMap`, Code 128B barcode,
  3s loader, `GET /api/track/[number]`, admin geocode assist. Live core E2E green
  (`scripts/verify-tracking-e2e.mjs`, demo `BRL-TEST0001`). ⛔ paste `tracking-migration.sql`
  for the route line.
- **Warehouse booking (8)** built on branch `feat/warehouse-booking` (2026-06-13,
  spec+plan in `docs/superpowers/`): ~36-facility dataset, 3-step `/warehousing/book` wizard
  → Supabase `bookings` + Resend emails, admin `/admin/bookings` approve/reject. Live E2E
  green (`scripts/verify-bookings-e2e.mjs`).
- **Service-aware quote forms (item 6)** built on branch `feat/warehouse-booking` (2026-06-13,
  spec+plan in `docs/superpowers/`): `/quote?service=` routing, config-driven request forms for
  air/land/project-cargo/cold-chain/customs → Supabase `bookings` (type='service') + Resend
  emails, surfaced in `/admin/bookings`. Live E2E green (`scripts/verify-service-quotes-e2e.mjs`).
- **Real AI Edge (item 5)** built on branch `feat/warehouse-booking` (2026-06-13, spec+plan in
  `docs/superpowers/`): clickable capability cards + three Groq/Open-Meteo/haversine tool pages
  (`/ai-edge/{predictive-insights,route-optimizer,proactive-resolution}`) on a shared
  `<AiToolConsole>`; AI figures labeled estimates; logged to `ai_interactions`. Live E2E green
  (`scripts/verify-ai-edge-e2e.mjs`).
- Build green (115 Vitest tests, tsc, eslint). NOT yet pushed to origin / deployed.
