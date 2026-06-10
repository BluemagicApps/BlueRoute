# Design — Real forms (Supabase + Resend)

**Date:** 2026-06-10
**Status:** Approved (ready for implementation plan)
**Scope:** First backend sub-project for Blue Route Logistics. Make the
**Contact form** and the **Quote wizard's booking step** real: persist
submissions to a database and send email notifications. Auth, payments, the
live AI advisor, the MapLibre swap, and i18n are **separate later pieces**.

---

## 1. Goal & success criteria

Turn two front-end mocks into working lead capture:

- **Contact form** (`src/components/contact/contact-form.tsx`) — today flips to a
  fake "ticket logged" success with a locally-computed ref and makes **no network
  call**.
- **Quote wizard** (`src/components/quote/quote-wizard.tsx`) — today the final
  "Confirm booking" button does nothing, is labelled a "demo flow", and the
  wizard **never collects the customer's name or email**, so there is nothing to
  follow up on.

**Success looks like:** a visitor submits either form on the live/dev site →
a row appears in Supabase → the team inbox receives a notification email → the
submitter receives a branded acknowledgement email → the UI shows a
server-authoritative reference (ticket/booking ref). Failures degrade
gracefully (inline error, lead still captured if only email fails).

---

## 2. Architecture

**Pattern: Next.js Server Actions** (App Router, idiomatic for 16.2.7 — verified
against `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`).
The existing client forms call exported `'use server'` functions directly via
React's `useActionState`. Server-only secrets (Resend key, Supabase service-role
key) never reach the client; no separate REST layer or manual `fetch`/JSON
plumbing.

**Rejected alternatives:**
- *Route Handlers* (`app/api/.../route.ts`) — more boilerplate, curl-testable but
  nothing else consumes these endpoints, so the indirection isn't worth it.
- *Direct browser → Supabase insert* — can't send email from the client without
  exposing the Resend key, so a server piece is needed anyway.

### Data flow

```
Client form submit
  → Server Action ('use server')
      → validate fields + honeypot check
      → Supabase insert (service-role client, server-only)   ← source of truth
      → Resend: team notification + customer acknowledgement  ← best-effort
      → return { ok: true, ref } | { ok: false, error / fieldErrors }
  → Client shows server-returned ref on success, or inline error
```

- DB insert is the **source of truth**. If the insert succeeds, the submission is
  a success even if an email send hiccups — email failures are logged
  server-side, never surfaced to the user (the lead is already safe).
- A tripped **honeypot** returns a fake success and is **never stored** (bot
  deterrence without a CAPTCHA).

---

## 3. Files

**New:**
- `src/lib/supabase/admin.ts` — server-only Supabase client built from
  `SUPABASE_SERVICE_ROLE_KEY`; `import "server-only"` guard so it can never be
  bundled into a client component.
- `src/lib/leads/validate.ts` — small hand-rolled validators (pure functions).
  No new dependency (no `zod`).
- `src/lib/email/resend.ts` — Resend client + a `sendLeadEmails` helper that
  fires the team + customer emails and swallows/logs failures.
- `src/lib/email/templates.ts` — inline-styled HTML for the four emails:
  contact→team, contact→customer ack, booking→team, booking→customer ack.
- `src/app/actions/leads.ts` — `submitContact` and `submitBooking` server
  actions, each with the `useActionState` signature `(prevState, formData)`.
- `supabase/schema.sql` — committed schema, pasted into Supabase's SQL editor.

**Modified:**
- `src/components/contact/contact-form.tsx` — wire submit to `submitContact`;
  show the **server's** ticket ref on success (remove local `makeTicket`); inline
  error on failure; add a hidden honeypot input.
- `src/components/quote/quote-wizard.tsx` — add **Name + Work email** fields to
  the Confirm step; wire "Confirm booking" to `submitBooking`; reframe copy from
  "demo flow — no payment is taken" to a real **booking request** ("No payment
  now — our team confirms availability & next steps by email"); hidden honeypot.
- `.env.local` — new env vars (Section 5).
- `package.json` / lockfile — add Vitest dev dependencies (Section 6).

---

## 4. Database schema (Supabase / Postgres)

Both tables have **Row Level Security enabled with no public policies**
(deny-all). Only the server's service-role key — which bypasses RLS — reads or
writes them, so submissions stay private. Leads are reviewed in the Supabase
table editor for now (an in-app admin view is a later piece).

`contact_inquiries`
- `id` uuid pk default `gen_random_uuid()`
- `created_at` timestamptz default `now()`
- `name` text not null
- `company` text
- `email` text not null
- `topic` text
- `message` text not null
- `ticket_ref` text not null
- `status` text not null default `'new'`
- `user_agent` text

`quote_requests`
- `id` uuid pk default `gen_random_uuid()`
- `created_at` timestamptz default `now()`
- `name` text not null
- `email` text not null
- `company` text
- `origin_code` text, `origin_label` text
- `dest_code` text, `dest_label` text
- `mode` text  (`door-to-door` | `port-to-port`)
- `container_id` text, `container_label` text
- `weight_kg` numeric
- `ready_date` date
- `option_id` text, `option_name` text
- `transit_days` int
- `co2_kg` numeric
- `price_usd` numeric
- `insurance` boolean
- `insurance_fee_usd` numeric
- `total_usd` numeric
- `booking_ref` text not null
- `status` text not null default `'new'`

---

## 5. Environment variables (`.env.local`)

| Var | Purpose | Exposure |
|-----|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (kept for future client/auth work) | public |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only writes/reads, bypasses RLS | **secret** |
| `RESEND_API_KEY` | Resend auth | **secret** |
| `RESEND_FROM` | e.g. `Blue Route Logistics <notifications@blueroute.com>` | server |
| `LEAD_NOTIFICATION_EMAIL` | Team inbox that receives notifications, e.g. `sales@blueroute.com` | server |

Resend is already set up (API key + verified domain). Supabase project is to be
created during implementation — the plan includes guided, step-by-step setup
(create project → run `supabase/schema.sql` → copy URL/anon/service-role keys →
paste into `.env.local`).

---

## 6. Error handling

- **Field validation** fails → `{ ok: false, fieldErrors }`, rendered inline; no
  DB write, no email.
- **Honeypot** filled → return a fake `{ ok: true }`, store nothing.
- **DB insert** fails → `{ ok: false, error: "Something went wrong — please try
  again or email us directly." }`.
- **Email** fails → logged server-side; request still returns success (lead is
  saved). Both emails are sent best-effort and independently.
- **Missing/invalid env at runtime** → server logs a clear error; client gets the
  generic error message above.

---

## 7. Testing

The project has **no test runner today** — add **Vitest** (dev dependency) plus
`npm run test`.

- **Unit:** `src/lib/leads/validate.ts` — table of valid/invalid inputs (missing
  required fields, bad email, etc.).
- **Unit:** `src/lib/email/templates.ts` — rendered HTML contains the key fields
  (name, ref, route/total for bookings).
- **Integration (mocked):** `submitContact` / `submitBooking` with Supabase and
  Resend mocked — assert the insert payload shape, that both emails are
  requested, the honeypot path stores nothing, and the validation path returns
  `fieldErrors`.
- **Manual end-to-end:** submit each form on `npm run dev` → confirm a row in the
  Supabase table editor → confirm both emails arrive.

Implementation follows TDD (tests before implementation) per the project's
superpowers workflow.

---

## 8. Out of scope (deliberately deferred)

Auth / login, payments, IP-based rate limiting (honeypot only for now), an
in-app leads/admin dashboard, CRM or webhook sync, and i18n. Each is its own
future sub-project.
