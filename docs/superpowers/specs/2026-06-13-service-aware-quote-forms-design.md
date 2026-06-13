# Service-Aware Quote Forms — Design

**Date:** 2026-06-13
**Plan item:** Rest of item 6 (per-service quote/booking forms) in `docs/PLAN.md`.
**Branch:** `feat/warehouse-booking` continues, or a new `feat/service-quotes` branch.

## Goal

Make the `/quote` flow **service-aware**. Today `/quote` renders a single
ocean-only wizard (ports / containers / sea-distance / live pricing) and every
service detail page links to it with no preselection. We add tailored
"request a quote" forms for the services that have no realistic pricing engine,
preselect the service from the detail pages, and route the request into the
existing `bookings` review queue.

## Decisions (agreed with Timi, 2026-06-13)

1. **Non-ocean services get tailored request forms** (no fake instant price).
   Only ocean has a real pricing engine.
2. **Live-priced wizard** is used by **ocean-freight AND door-to-door**. The
   other five — air-freight, land-freight, project-cargo, cold-chain, customs —
   use the new request form.
3. **Storage:** service quote requests reuse the existing `bookings` table
   (`type='service'`, `service_slug`) and appear in the `/admin/bookings` page
   already built for item 8. No new table, no new admin page.

## Architecture

Pure config + libs → a server action → a config-driven client wizard → routing
on the `/quote` page. Mirrors the warehouse booking flow (item 8) exactly.

```
service-fields.ts (config)  ─┐
quote/validate.ts (validate, ├─▶ submitServiceQuote (server action) ─▶ bookings table
  buildServiceDetails)       │                                          + Resend emails
bookings/refs.ts (BR-SV ref) ┘
                                ServiceQuoteWizard (client) ──▶ submitServiceQuote
/quote/page.tsx routes ?service= to QuoteWizard | ServiceQuoteWizard
```

### Routing — `/quote?service=<slug>`

`src/app/(site)/quote/page.tsx` becomes an async server component (Next 16:
`searchParams` is a Promise — await it), reads `service`, and branches:

- `ocean-freight`, `door-to-door`, or **no/unknown param** → existing
  `QuoteWizard`. For `door-to-door` it preselects the mode via a new optional
  `initialMode?: CargoMode` prop on `QuoteWizard` (defaults to current
  `"door-to-door"` default, so no behavior change when absent).
- `air-freight`, `land-freight`, `project-cargo`, `cold-chain`, `customs` →
  `ServiceQuoteWizard` with that service's field config.

Service detail pages: the "Get a quote" button in
`src/app/(site)/services/[slug]/page.tsx` changes from `/quote` to
`/quote?service=${s.slug}` (one-line change).

### `ServiceQuoteWizard` — config-driven client component

`src/components/quote/service-quote-wizard.tsx`. 3 steps, same visual language
as `warehouse-booking-wizard.tsx` (stepper → panels → review card):

1. **Shipment details** — renders the service-specific fields from config.
2. **Contact** — company, full name\*, work email\*, phone.
3. **Review & submit** — read-only summary of entered values, honeypot
   (`company_url`), hidden inputs, submit button. "No payment is taken now."

A small inline field renderer supports six field types: `text`, `number`,
`date`, `select` (options), `multiselect` (chip toggles), `textarea`.
Client-side step gating mirrors the warehouse wizard (block "Continue" until the
current step's required fields are filled); the server re-validates.

### Per-service field config

`src/lib/quote/service-fields.ts` exports a typed config keyed by service slug.

```ts
export type FieldType = "text" | "number" | "date" | "select" | "multiselect" | "textarea";
export type QuoteField = {
  name: string;          // form field name + details key
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];    // for select / multiselect
};
export type ServiceQuoteConfig = {
  slug: string;
  title: string;         // e.g. "Air freight quote"
  fields: QuoteField[];  // step-1 shipment fields (contact fields are shared, added by the wizard)
};
export const SERVICE_QUOTE_SLUGS = [
  "air-freight", "land-freight", "project-cargo", "cold-chain", "customs",
] as const;
export const SERVICE_QUOTE_FIELDS: Record<string, ServiceQuoteConfig>;
export function getServiceQuoteConfig(slug: string): ServiceQuoteConfig | undefined;
```

Field sets (`*` = required):

| Service | Tailored shipment fields |
|---|---|
| **air-freight** | origin\* (text), destination\* (text), serviceLevel\* (select: Next-flight-out express / Express / Deferred economy / Full charter), commodity (select: General / Perishables / Pharma / Dangerous goods / Other), weightKg\* (number, "Chargeable weight (kg)"), pieces (number), dimensions (text, "L×W×H cm"), readyDate (date), message (textarea) |
| **land-freight** | origin\* (text), destination\* (text), loadType\* (select: FTL / LTL / Intermodal rail / Port drayage), weightKg (number), equipment (select: Dry van / Reefer / Flatbed / Container chassis / Other), crossBorder (select: Domestic / Cross-border), readyDate (date), message (textarea) |
| **project-cargo** | origin\* (text), destination\* (text), cargoDescription\* (text), weightTonnes\* (number, "Total weight (tonnes)"), dimensions\* (text, "L×W×H m"), outOfGauge (select: Out-of-gauge / Fits standard), needs (multiselect: Route survey / Lifting plan / Permits & escorts / Specialized equipment), readyDate (date), message (textarea) |
| **cold-chain** | origin\* (text), destination\* (text), commodity\* (select: Pharma / Food & beverage / Perishables / Chemicals / Other), tempRange\* (select: Frozen (−18°C) / Chilled (2–8°C) / Cool (8–15°C) / Custom setpoint), mode (select: Ocean reefer / Air / Road reefer / Multimodal), weightKg (number), readyDate (date), message (textarea) |
| **customs** | direction\* (select: Import / Export / Both), originCountry\* (text), destCountry\* (text), mode (select: Ocean / Air / Land), commodity (text, "Goods / HS code if known"), shipmentValue (text, "Shipment value (USD)"), bonded (select: Standard / Bonded / Special regime), message (textarea) |

Shared contact fields (added by the wizard, same for all services):
company (text), name (text, required), email (email, required), phone (text).

### Server action + libs

- **`submitServiceQuote(prev, formData)`** — new export in
  `src/app/actions/bookings.ts` (alongside `submitWarehouseBooking`). Honeypot →
  pretend success. Resolve the config by `service_slug` server-side (reject
  unknown slug). Validate → on errors return `fieldErrors`. Insert into
  `bookings`: `type='service'`, `service_slug=<slug>`, `warehouse_id=null`,
  `name/email/phone/company`, `details` jsonb (all entered fields + `summary`),
  `status='new'`, `booking_ref` `BR-SV-#####`. Best-effort team + ack emails.
  Returns a `ServiceQuoteState` discriminated union shaped like
  `WarehouseBookingState`.
- **`src/lib/quote/validate.ts`**
  - `type ServiceQuoteInput = { slug: string; values: Record<string,string|string[]>; name; email; company; phone }`.
  - `validateServiceQuote(config, input): Record<string,string>` — enforce
    required-ness from the config + an email regex (same as warehouse).
  - `buildServiceDetails(config, input): Record<string,unknown>` — assemble the
    jsonb: each field's value keyed by name, plus a human-readable `summary`
    (e.g. `"Air freight · Shanghai → LA · 1,200 kg"`; falls back to title +
    first two filled fields).
- **`formatServiceRef(seed)`** — added to `src/lib/bookings/refs.ts`,
  `BR-SV-#####`, same `hashSeed` style as `formatWarehouseRef`.
- **Email templates** in `src/lib/email/booking-templates.ts`:
  `serviceQuoteTeamEmail(config, input, ref)` (lists service + all provided
  fields via `row()`), `serviceQuoteAckEmail(config, input, ref)` (thank-you +
  ref). Both take `(config, input, ref)`. Reuse the existing `wrap`/`row` helpers.

### Admin

`/admin/bookings` already renders `service_slug` for non-warehouse rows
(`b.type === "warehouse" ? facilityName(...) : b.service_slug`). One tweak to
`src/app/admin/(panel)/bookings/page.tsx`: the "Request" column shows
`details.summary` when present, falling back to the existing
sqft/moveIn/term rendering for warehouse rows.

## What stays unchanged

Ocean / door-to-door keep writing to `quote_requests` via the existing
`submitBooking` action — untouched. Only the five new services use `bookings`.

## Testing

- `src/lib/bookings/refs.test.ts` — extend: `formatServiceRef` is
  `/^BR-SV-\d{5}$/`, deterministic, varies with seed.
- `src/lib/quote/service-fields.test.ts` (new) — all 5 slugs present in
  `SERVICE_QUOTE_FIELDS`; every field has a valid `type`; `select`/`multiselect`
  fields have non-empty `options`; `getServiceQuoteConfig` resolves and rejects.
- `src/lib/quote/validate.test.ts` (new) — `validateServiceQuote`: a fully valid
  customs input passes `{}`; missing `direction`/countries flagged; air-freight
  missing `weightKg` flagged; invalid email flagged. `buildServiceDetails`
  merges entered fields and produces a non-empty `summary`.
- `scripts/verify-service-quotes-e2e.mjs` (new, mirrors
  `verify-bookings-e2e.mjs`) — seed a `type='service'` booking via the service
  role, confirm the authed `/admin/bookings` renders it with its summary, public
  `/quote?service=air-freight` returns 200 and `/quote?service=bogus` falls back
  to the ocean wizard (200). Cleanup.

## Verification

- `npx vitest run` all green.
- `npx tsc --noEmit` clean; `npx eslint` clean on changed files.
- `npx next build` green (routes unchanged: `/quote` is one route with a search
  param).
- `node scripts/verify-service-quotes-e2e.mjs` → ALL GREEN (dev server up).
- Manual: each service detail page "Get a quote" → preselected wizard; submit a
  request → success ref → row appears in `/admin/bookings`.

## Out of scope

- No admin page for `quote_requests` (ocean bookings) — pre-existing gap, not
  part of this work.
- No real pricing for non-ocean services.
- Warehouse already has its own dedicated wizard (item 8); not touched here.
