# Warehouse Booking + Admin Review — Design

**Date:** 2026-06-12 · **Plan item:** 8 (warehousing: more listings + no-payment booking wizard)
**Approved by Timi:** warehouse booking built first (before item 6 service quotes) ·
full **admin Bookings page with approve/reject + customer email** · dedicated
**`/warehousing/book`** page (not a modal).

## Goal

Expand the warehouse dataset and add a no-payment, staff-routed booking flow: a
customer requests a facility through a dedicated wizard page; the request lands in
the existing Supabase `bookings` table and notifies the team; an admin reviews it on
a new `/admin/bookings` page and approves or rejects it, which emails the customer.

## Out of scope (deferred)

Service-aware quote forms (item 6 — the next sub-project), real warehouse-inventory
API integration, online payments, editing a submitted booking from the public side.

## Pre-conditions (already true)

- `bookings` table is **live** in Supabase (from `admin-schema.sql`, verified): columns
  `id, created_at, type ('warehouse'|'service'), service_slug, warehouse_id, name, email,
  phone, company, details jsonb, status ('new'|'approved'|'rejected'|'closed'), booking_ref`.
  **No DB migration is required.**
- Email plumbing exists: `sendEmails` (`src/lib/email/resend.ts`), template helpers in
  `src/lib/email/templates.ts`. Resend is in test mode (delivers only to Timi's account
  email); customer emails are best-effort and the DB row is the source of truth.
- Admin shell + `requireAdmin(menu)` gate + `AdminMenu` permission system exist
  (`src/lib/admin/{auth,menus}.ts`, `src/app/admin/(panel)/layout.tsx`,
  `src/components/admin/admin-sidebar.tsx`).
- The quote wizard's honeypot + Server-Action + ref-formatter patterns are the model to follow
  (`src/app/actions/leads.ts`, `src/lib/leads/{validate,refs}.ts`).

## 1. Dataset expansion — `src/lib/warehouse-data.ts`

Keep the existing 11 facilities; add ~25 more for **~36 total**, spread across the existing
`REGIONS` (Europe, Asia, North America, Middle East, Oceania). Each new entry is realistic
and uses the existing `Facility` type unchanged (id, name, city, country, region, coord
[lng,lat], sqft, clearHeightM, docks, powerMVA, pricePerSqftYear, type, available,
availableFrom, rating, features). Pure data — no type/schema change. Ids stay short-kebab and
unique. This feeds the existing `WarehouseExplorer` filters and map with no other change.

## 2. Public booking flow

### 2a. Entry point — `src/components/warehouse/warehouse-explorer.tsx`
Each facility card gains a **"Request this facility"** link (styled as the primary button)
to `/warehousing/book?facility=<id>`. Keep existing card content/actions; this is additive.

### 2b. Page — `src/app/(site)/warehousing/book/page.tsx` (server component)
- Reads `?facility=` from `searchParams` (awaited, Next 16), resolves it against `FACILITIES`.
- Unknown/missing id → `notFound()` (404). A valid id → renders a short facility summary
  header + the wizard, passing the resolved facility.
- `metadata`: title "Request a Warehouse", `robots` default (indexable is fine).

### 2c. Wizard — `src/components/warehouse/warehouse-booking-wizard.tsx` (client)
Three steps (follow the `ShipmentWizard`/`QuoteWizard` stepper + controlled-state pattern):
1. **Requirements** — space needed (sqft, number), desired move-in date, lease term (months),
   features needed (multi-select chips from the facility's `features`).
2. **Company & contact** — company, full name *, work email *, phone, message (textarea).
3. **Review & submit** — read-only summary of facility + all entered values; submit button.

Client-side per-step gates: step 1 requires a positive sqft and a move-in date; step 2
requires name + valid-looking email. A hidden honeypot field `company_url`. Submit builds a
`FormData` (all values + `facilityId`) and calls the Server Action; on success shows a
confirmation screen with the returned `booking_ref` and "no payment taken; the team will
confirm availability." On field errors, re-renders with inline messages.

### 2d. Server Action — `src/app/actions/bookings.ts` → `submitWarehouseBooking`
`"use server"`, async-only exports. Flow (mirrors `submitBooking`):
1. Honeypot set → return fake success with a generated ref, store nothing.
2. Build a `WarehouseBookingInput` from FormData; `validateWarehouseBooking` it.
3. Re-resolve the facility **server-side** from `facilityId` (don't trust client labels);
   unknown id → error.
4. `formatWarehouseRef(crypto.randomUUID())` → e.g. `BR-WH-#####`.
5. Insert into `bookings`: `type:'warehouse'`, `warehouse_id: facility.id`, `name, email,
   phone, company`, `status:'new'`, `booking_ref`, and `details` jsonb =
   `{ facilityName, city, country, sqftRequested, moveIn, termMonths, features, message }`.
6. Best-effort `sendEmails`: team notification (replyTo customer) + customer acknowledgement.
   Email failure does not fail the request (DB row is source of truth).
- Returns a discriminated `WarehouseBookingState` (`idle | success{bookingRef} | error{error,
  fieldErrors?}`), used by the wizard via `useActionState`.

### 2e. Validation — `src/lib/bookings/validate.ts`
Hand-rolled (no zod), in the style of `src/lib/leads/validate.ts`. `WarehouseBookingInput`
type + `validateWarehouseBooking(input)` → `Record<field,string>`: name required, email
required + regex, sqftRequested a positive integer, termMonths a positive integer,
moveIn a non-empty date string. Company/phone/message/features optional. A pure
`buildBookingDetails(input, facility)` helper assembles the `details` jsonb (unit-tested).

### 2f. Ref — `src/lib/bookings/refs.ts`
`formatWarehouseRef(seed)` → `BR-WH-${(hash % 90000) + 10000}` (deterministic; same hash
helper style as `src/lib/leads/refs.ts`). Pure, unit-tested.

### 2g. Emails — `src/lib/email/booking-templates.ts`
Three small template helpers returning `{ subject, html, text }` like the existing templates:
- `warehouseBookingTeamEmail(input, facility, ref)` — team notification.
- `warehouseBookingAckEmail(input, facility, ref)` — customer "request received".
- `warehouseDecisionEmail(booking, decision)` — customer approve/reject outcome (used by §3).

## 3. Admin Bookings review

### 3a. Menu — `src/lib/admin/menus.ts`
Add `"bookings"` to the `AdminMenu` union and `ALL_MENUS`. Add a "Bookings" nav item
(icon + `/admin/bookings`) to `src/components/admin/admin-sidebar.tsx`, gated by the menu
permission like the others. The super admin sees it automatically.

### 3b. List page — `src/app/admin/(panel)/bookings/page.tsx` (server)
- `requireAdmin("bookings")`. Reads optional `?status=` filter (awaited searchParams).
- Service-role select from `bookings` ordered `created_at desc` (optionally filtered by status).
- Renders a table: booking ref, type, facility (from `warehouse_id` → look up name, fall back
  to id) / service slug, company, contact (name + email), key `details` (sqft, move-in, term),
  status badge, created date. Status filter chips (All / New / Approved / Rejected / Closed).
- Each row carries an inline **`booking-actions.tsx`** client component (status badge +
  **Approve** / **Reject** buttons) that calls `setBookingStatus` in a transition and refreshes;
  buttons disable once the booking is no longer `new`.

### 3c. Decision action — `src/app/actions/bookings.ts` → `setBookingStatus(id, status)`
`requireAdmin("bookings")`; validate `status ∈ {approved, rejected, closed}`; update the row;
on `approved`/`rejected`, load the row and best-effort `warehouseDecisionEmail` to the customer;
`revalidatePath("/admin/bookings")`. Returns `{ ok }`.

## 4. File map

- New: `src/app/(site)/warehousing/book/page.tsx`,
  `src/components/warehouse/warehouse-booking-wizard.tsx`,
  `src/app/actions/bookings.ts`, `src/lib/bookings/validate.ts`,
  `src/lib/bookings/refs.ts`, `src/lib/email/booking-templates.ts`,
  `src/app/admin/(panel)/bookings/page.tsx`, `src/components/admin/booking-actions.tsx`,
  `scripts/verify-bookings-e2e.mjs`.
- Modified: `src/lib/warehouse-data.ts` (+~25 facilities),
  `src/components/warehouse/warehouse-explorer.tsx` ("Request this facility" link),
  `src/lib/admin/menus.ts` (+`bookings`), `src/components/admin/admin-sidebar.tsx` (nav item).
- Tests: `src/lib/bookings/validate.test.ts`, `src/lib/bookings/refs.test.ts`.

## 5. Testing & verification

- **Vitest (pure units):** `formatWarehouseRef` (deterministic vector), `validateWarehouseBooking`
  (each required-field failure + a fully-valid pass), `buildBookingDetails` (shape + facility
  fields merged).
- **Live E2E — `scripts/verify-bookings-e2e.mjs`** (reads `.env.local`, dev server up).
  Server Actions can't be cleanly invoked over plain HTTP, so the script verifies the data +
  page layer (mirroring `verify-admin-e2e.mjs`): seed a `bookings` row via the service role
  using the exact shape `submitWarehouseBooking` writes (`type='warehouse'`, `warehouse_id`,
  `status='new'`, populated `details`) → authenticated (cookie-jar) GET `/admin/bookings`
  renders the row and its facility name → flip `status` to `approved` via the service role and
  confirm the authed page reflects it → `?status=new` filter excludes the approved row →
  `/warehousing/book?facility=<real id>` → 200, `?facility=bogus` → 404. Clean up the seed row.
  The `submitWarehouseBooking`/`setBookingStatus` action bodies are covered by unit tests on
  their pure pieces (validate, refs, `buildBookingDetails`, templates); Timi eyeballs the live
  submit + approve/reject + email in the browser.
- `npm run build` green (tsc + eslint); `/warehousing`, `/warehousing/book`, `/admin/bookings`
  all serve; admin menu gating works (a manager without `bookings` doesn't see it).

## 6. Risks / notes

- Resend test mode: customer ack/decision emails only deliver to Timi's account address until a
  domain is verified; code treats email as best-effort so this never blocks a booking.
- `warehouse_id` references the in-code `FACILITIES` ids (no FK); the admin list resolves names
  from that same dataset, so adding/removing facilities later keeps working (falls back to id).
- No payment, by design (plan item 8). The `bookings.status` lifecycle is the whole workflow.
