# Public Tracking Rebuild + Shared RouteMap — Design

**Date:** 2026-06-12 · **Plan items:** 13 (public tracking page) + 14 (portal route map)
**Approved by Timi:** full mockup replacement · public printout INCLUDES prices ·
map coordinates via **schema migration (option B)**.

## Goal

Rebuild `/tracking` per mockups `docs/mockups/14–17.png` (Smart Cargo Movers
reference, restyled in Blue Route Nordic Frost) on **real Supabase data**
(`shipments` + `shipment_events` created by the `/admin` backend), and give the
customer portal an animated trip-line map using the same component.

## Out of scope

Real portal data (portal stays on its existing mock), email/SMS notifications,
shipment editing from the public page, i18n (item 15 later).

## 1. Schema migration — `supabase/tracking-migration.sql`

Timi pastes in the Supabase SQL editor (same flow as before):

```sql
alter table public.shipments
  add column if not exists origin_lng numeric,
  add column if not exists origin_lat numeric,
  add column if not exists destination_lng numeric,
  add column if not exists destination_lat numeric;
```

`current_lng`/`current_lat` already exist. All four new columns are nullable —
a shipment without coordinates still tracks fine; the map just degrades (below).

## 2. Admin form support

- The create-shipment wizard (shipping step) and `[id]/edit` form gain
  origin/destination coordinate inputs.
- Each pair gets a **"Find coordinates"** assist button: client-side fetch to the
  free no-key Open-Meteo geocoding API
  (`https://geocoding-api.open-meteo.com/v1/search?name=…`) using the typed
  origin/destination text; first hit fills the lng/lat inputs (editable after).
- Validation (`shipment-validate.ts`): coords optional; if one of a lng/lat pair
  is present the other must be too; lng ∈ [-180,180], lat ∈ [-90,90].

## 3. Public API — `GET /api/track/[number]`

Next 16 route handler. Service-role lookup by exact `tracking_number`
(case-insensitive, trimmed), joins `shipment_events` ordered `occurred_at desc`.

- **Payload (sanitized, but per Timi's call costs ARE included):** receiver
  (name/email/phone/address/country), sender (same), consignment (tracking
  number, status, freight_type, content_type, weight_kg, qty, description,
  delivery_pct, date_shipped, expected_delivery, shipment_cost, clearance_cost),
  `notice`, `photo_url`, map points (origin/destination/current: `{name, lng, lat}`
  with null coords when unset), and `events[]` (status, location, country,
  occurred_at, comment). Internal `id` and admin-only fields are NOT exposed.
- **Errors:** unknown number → 404 `{ error: "not_found" }`. Light per-IP rate
  limit (same in-memory pattern as `src/lib/ai/rate-limit.ts`, e.g. 20/60s) →
  429. Pure payload-builder function unit-tested.

## 4. `/tracking` page rebuild (full replace)

Client experience (`tracking-experience.tsx` rewritten; old `panels.tsx`
dashboard panels and `SAMPLE_SHIPMENT` usage removed from this page):

1. **Search** — keeps the existing hero search field; `?ref=` deep link
   auto-tracks (portal + admin links keep working).
2. **3-second loader** — staged progress animation ("Locating consignment…",
   "Retrieving tracking log…", "Compiling report…") always displays ~3s total
   (fetch runs concurrently), then reveals results.
3. **Result layout** (mockup order, Nordic Frost styling):
   - "Tracking Result" hero band + reassurance paragraph (mockup 14).
   - **Code 128B barcode** of the tracking number — hand-rolled pure SVG
     generator `src/lib/barcode.ts` (no new dependency, unit-tested).
   - **Print shipping invoice** button → `window.print()` with a print
     stylesheet; printout = full consignment report **including
     shipment_cost + clearance_cost** (mockups 14–15).
   - **RouteMap** (shared component, §5) (mockup 15).
   - Receiver's Details + Sender's Details tables (mockup 15).
   - Consignment's Details table: consignment no, package weight, tracking
     number, status, service type (← `content_type`, e.g. "Container"),
     delivery mode (← `freight_type`, e.g. "Sea Freight"), % complete
     (mockup 16).
   - Origin / Destination / Date of departure / Expected delivery row.
   - **Animated progress bar**: cyan fill animates 0 → `delivery_pct` with a
     percentage badge riding the head (mockup 16's green/red bar, our palette).
   - **Tracking log table**: status, current location, arrival country,
     date & time, comments — newest first, straight from `shipment_events`
     (mockup 16–17).
   - **Notice banner**: when `shipments.notice` is set, an amber urgent banner
     (mockup 17) below the log.
   - Thank-you strip ("Thanks for patronising us…").
4. **Not found** — friendly error state with the searched number and a
   support CTA. **Empty events** — log section shows a "No tracking events
   recorded yet" row.

## 5. Shared `RouteMap` — `src/components/ui/route-map.tsx`

Client component extracted/evolved from `tracking/shipment-map.tsx`:

- Props: `{ origin?: Point; destination?: Point; current?: Point;
  progressPct: number }` where `Point = { name: string; lng: number; lat: number }`.
- MapLibre GL + existing CARTO Positron `BASEMAP_STYLE`; curved (great-circle
  interpolated) line origin → destination; traveled portion (by `progressPct`,
  or up to `current` when provided) **animates drawing in**; dashed remaining
  segment; pulsing current-position marker (existing `.br-*` marker styles);
  port/endpoint markers with name popups; auto `fitBounds`.
- **Degradation:** only `current` known → single-pin map centered on it (exactly
  mockup 15); no coords at all → static styled placeholder ("Map available once
  coordinates are set").
- Old `shipment-map.tsx` stays only if still imported elsewhere; otherwise
  deleted with the dashboard panels. `splitRouteAtVessel` in `src/lib/map.ts`
  reused/extended for the great-circle + progress math (pure, tested).

## 6. Portal (item 14)

In `portal-dashboard.tsx`, clicking a shipment row opens an inline **modal**
with `RouteMap` showing that shipment's animated trip line (mock coordinates
added to `portal-data.ts` lanes). The existing "open in tracking" link remains.

## 7. Testing & verification

- **Vitest (pure units):** Code 128B encoder (checksum + known vectors),
  payload builder (sanitization, cost inclusion, event ordering), coordinate
  validation rules, great-circle/progress split math.
- **Live E2E (extend `scripts/verify-admin-e2e.mjs` pattern):** seed a demo
  shipment + backdated events via service role → `GET /api/track/<number>`
  200 with correct payload → 404 bogus number → 429 after burst →
  `/tracking?ref=<number>` page renders result markers.
- Timi eyeballs: map line animation, barcode scan-ability, print layout,
  portal modal. `npm run build` green; all routes serve.
