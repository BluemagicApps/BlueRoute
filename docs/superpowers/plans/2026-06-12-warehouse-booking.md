# Warehouse Booking + Admin Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A no-payment warehouse booking flow — customer requests a facility via a dedicated wizard page → saved to the live Supabase `bookings` table + team email → admin reviews on a new `/admin/bookings` page and approves/rejects, emailing the customer.

**Architecture:** Pure libs (refs, validation, details builder, email templates) → a Server Action layer (`submitWarehouseBooking`, `setBookingStatus`) → a public wizard page and an admin review page. No DB migration (the `bookings` table is already live). Mirrors the existing leads/quote-wizard patterns exactly.

**Tech Stack:** Next 16 (App Router, Server Actions, `useActionState`), Tailwind v4, Supabase service-role server reads/writes, Resend (best-effort email), Vitest.

**Spec:** `docs/superpowers/specs/2026-06-12-warehouse-booking-design.md`

**Executor notes:**
- This is **Next 16**: `searchParams`/`params` are Promises (await them); Server-Action files (`"use server"`) export ONLY async functions; eslint bans `Date.now()`/`crypto` in RSC bodies but actions are fine.
- `EmailBody` is `{ subject: string; html: string }` (NO `text` field). `OutgoingEmail` is `{ to, subject, html, replyTo? }`. `sendEmails(OutgoingEmail[])` is best-effort and never throws.
- `requireAdmin(menu?)` returns the `AdminProfile` and enforces the menu permission; `AdminMenu` is exported from both `@/lib/admin/menus` and re-exported by `@/lib/admin/auth`.
- The `bookings` table (live): `id, created_at, type ('warehouse'|'service'), service_slug, warehouse_id, name, email, phone, company, details jsonb, status ('new'|'approved'|'rejected'|'closed'), booking_ref`.
- Run tests with `npx vitest run` (73 currently pass). Dev server runs on http://localhost:3000.
- Hand-rolled validation in the style of `src/lib/leads/validate.ts` — NO zod.

---

### Task 1: Expand the warehouse dataset

**Files:**
- Modify: `src/lib/warehouse-data.ts` (append ~25 facilities to `FACILITIES`)
- Test: `src/lib/warehouse-data.test.ts` (new)

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/warehouse-data.test.ts
import { describe, expect, it } from "vitest";
import { FACILITIES, REGIONS, ALL_FEATURES } from "@/lib/warehouse-data";

describe("FACILITIES dataset", () => {
  it("has at least 35 facilities", () => {
    expect(FACILITIES.length).toBeGreaterThanOrEqual(35);
  });

  it("has unique ids", () => {
    const ids = FACILITIES.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses only declared regions and features, with sane numbers", () => {
    const regions = new Set(REGIONS.filter((r) => r !== "All regions"));
    const features = new Set(ALL_FEATURES);
    for (const f of FACILITIES) {
      expect(regions.has(f.region)).toBe(true);
      expect(f.features.every((x) => features.has(x))).toBe(true);
      expect(f.sqft).toBeGreaterThan(0);
      expect(f.pricePerSqftYear).toBeGreaterThan(0);
      expect(f.coord).toHaveLength(2);
      expect(f.rating).toBeGreaterThanOrEqual(0);
      expect(f.rating).toBeLessThanOrEqual(5);
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/lib/warehouse-data.test.ts`
Expected: FAIL on the "at least 35" assertion (only 11 today).

- [ ] **Step 3: Append ~25 facilities**

In `src/lib/warehouse-data.ts`, add these entries inside the `FACILITIES` array (after the existing 11, before the closing `]`). Keep the existing `Facility` type. These are realistic; coords are `[lng, lat]`.

```ts
  // —— Europe ——
  { id: "ldn-gw", name: "London Gateway Logistics Park", city: "London", country: "United Kingdom", region: "Europe", coord: [0.47, 51.51], sqft: 96000, clearHeightM: 15, docks: 22, powerMVA: 2.8, pricePerSqftYear: 14.2, type: "Smart", available: true, availableFrom: "Now", rating: 4.7, features: ["Solar power", "EV charging", "Automated racking", "Smart sensors", "24/7 security"] },
  { id: "mad-sur", name: "Madrid Sur Distribution Centre", city: "Madrid", country: "Spain", region: "Europe", coord: [-3.65, 40.32], sqft: 72000, clearHeightM: 12, docks: 16, powerMVA: 2.1, pricePerSqftYear: 8.9, type: "Standard", available: true, availableFrom: "Now", rating: 4.3, features: ["Cross-dock", "24/7 security", "Rail siding"] },
  { id: "war-pl", name: "Warsaw Central Logistics", city: "Warsaw", country: "Poland", region: "Europe", coord: [21.01, 52.23], sqft: 110000, clearHeightM: 13, docks: 24, powerMVA: 2.6, pricePerSqftYear: 7.4, type: "Standard", available: false, availableFrom: "Q3 2026", rating: 4.2, features: ["Cross-dock", "Rail siding", "24/7 security"] },
  { id: "mil-it", name: "Milan Interporto Hub", city: "Milan", country: "Italy", region: "Europe", coord: [9.19, 45.46], sqft: 64000, clearHeightM: 11, docks: 14, powerMVA: 1.8, pricePerSqftYear: 10.1, type: "Standard", available: true, availableFrom: "Now", rating: 4.1, features: ["Cross-dock", "24/7 security"] },
  { id: "lyo-fr", name: "Lyon Saint-Exupéry Cold DC", city: "Lyon", country: "France", region: "Europe", coord: [4.94, 45.73], sqft: 58000, clearHeightM: 10, docks: 12, powerMVA: 2.9, pricePerSqftYear: 13.6, type: "Cold Chain", available: true, availableFrom: "Now", rating: 4.6, features: ["Cold storage", "Smart sensors", "24/7 security", "Solar power"] },
  { id: "ant-be", name: "Antwerp Port Bonded Store", city: "Antwerp", country: "Belgium", region: "Europe", coord: [4.40, 51.26], sqft: 88000, clearHeightM: 13, docks: 20, powerMVA: 2.4, pricePerSqftYear: 11.9, type: "Bonded", available: true, availableFrom: "Now", rating: 4.5, features: ["Bonded zone", "Cross-dock", "24/7 security", "Rail siding"] },

  // —— Asia ——
  { id: "sin-tk", name: "Singapore Tuas Mega Hub", city: "Singapore", country: "Singapore", region: "Asia", coord: [103.64, 1.32], sqft: 140000, clearHeightM: 16, docks: 30, powerMVA: 3.6, pricePerSqftYear: 16.8, type: "Smart", available: true, availableFrom: "Now", rating: 4.9, features: ["Automated racking", "Smart sensors", "EV charging", "Solar power", "24/7 security"] },
  { id: "shz-cn", name: "Shenzhen Yantian Logistics", city: "Shenzhen", country: "China", region: "Asia", coord: [114.27, 22.56], sqft: 132000, clearHeightM: 14, docks: 28, powerMVA: 3.2, pricePerSqftYear: 9.7, type: "Standard", available: true, availableFrom: "Now", rating: 4.4, features: ["Cross-dock", "24/7 security", "Automated racking"] },
  { id: "mum-in", name: "Mumbai JNPT Distribution Park", city: "Mumbai", country: "India", region: "Asia", coord: [72.95, 18.95], sqft: 78000, clearHeightM: 11, docks: 18, powerMVA: 2.0, pricePerSqftYear: 6.2, type: "Standard", available: true, availableFrom: "Now", rating: 4.0, features: ["Cross-dock", "24/7 security"] },
  { id: "tok-jp", name: "Tokyo Bay Smart Warehouse", city: "Tokyo", country: "Japan", region: "Asia", coord: [139.79, 35.62], sqft: 90000, clearHeightM: 15, docks: 20, powerMVA: 3.0, pricePerSqftYear: 17.5, type: "Smart", available: false, availableFrom: "Q4 2026", rating: 4.8, features: ["Automated racking", "Smart sensors", "EV charging", "24/7 security"] },
  { id: "bus-kr", name: "Busan New Port Cold Hub", city: "Busan", country: "South Korea", region: "Asia", coord: [128.81, 35.08], sqft: 70000, clearHeightM: 12, docks: 16, powerMVA: 2.8, pricePerSqftYear: 12.4, type: "Cold Chain", available: true, availableFrom: "Now", rating: 4.5, features: ["Cold storage", "Smart sensors", "24/7 security"] },
  { id: "bkk-th", name: "Bangkok Eastern Seaboard DC", city: "Bangkok", country: "Thailand", region: "Asia", coord: [100.91, 13.10], sqft: 84000, clearHeightM: 12, docks: 18, powerMVA: 2.2, pricePerSqftYear: 7.0, type: "Standard", available: true, availableFrom: "Now", rating: 4.1, features: ["Cross-dock", "Rail siding", "24/7 security"] },

  // —— North America ——
  { id: "lax-us", name: "Los Angeles Inland Empire DC", city: "Los Angeles", country: "United States", region: "North America", coord: [-117.40, 34.06], sqft: 150000, clearHeightM: 16, docks: 34, powerMVA: 3.8, pricePerSqftYear: 13.1, type: "Smart", available: true, availableFrom: "Now", rating: 4.7, features: ["Automated racking", "Smart sensors", "EV charging", "Solar power", "24/7 security"] },
  { id: "nyc-us", name: "New Jersey Port Logistics", city: "Newark", country: "United States", region: "North America", coord: [-74.17, 40.69], sqft: 102000, clearHeightM: 14, docks: 24, powerMVA: 3.0, pricePerSqftYear: 15.4, type: "Standard", available: true, availableFrom: "Now", rating: 4.4, features: ["Cross-dock", "Rail siding", "24/7 security"] },
  { id: "chi-us", name: "Chicago Midwest Crossdock", city: "Chicago", country: "United States", region: "North America", coord: [-87.75, 41.79], sqft: 118000, clearHeightM: 13, docks: 28, powerMVA: 2.9, pricePerSqftYear: 9.8, type: "Standard", available: false, availableFrom: "Q3 2026", rating: 4.2, features: ["Cross-dock", "Rail siding", "24/7 security"] },
  { id: "dal-us", name: "Dallas Alliance Cold Hub", city: "Dallas", country: "United States", region: "North America", coord: [-97.06, 32.99], sqft: 86000, clearHeightM: 12, docks: 20, powerMVA: 3.1, pricePerSqftYear: 11.0, type: "Cold Chain", available: true, availableFrom: "Now", rating: 4.5, features: ["Cold storage", "Smart sensors", "EV charging", "24/7 security"] },
  { id: "tor-ca", name: "Toronto Pearson Gateway", city: "Toronto", country: "Canada", region: "North America", coord: [-79.63, 43.68], sqft: 94000, clearHeightM: 13, docks: 22, powerMVA: 2.7, pricePerSqftYear: 10.6, type: "Standard", available: true, availableFrom: "Now", rating: 4.3, features: ["Cross-dock", "24/7 security", "Solar power"] },
  { id: "mex-mx", name: "Mexico City Norte Park", city: "Mexico City", country: "Mexico", region: "North America", coord: [-99.11, 19.55], sqft: 76000, clearHeightM: 11, docks: 16, powerMVA: 2.0, pricePerSqftYear: 7.8, type: "Standard", available: true, availableFrom: "Now", rating: 4.0, features: ["Cross-dock", "24/7 security"] },

  // —— Middle East ——
  { id: "dxb-ae", name: "Dubai Jebel Ali Free Zone DC", city: "Dubai", country: "United Arab Emirates", region: "Middle East", coord: [55.06, 25.01], sqft: 160000, clearHeightM: 16, docks: 36, powerMVA: 4.0, pricePerSqftYear: 12.9, type: "Bonded", available: true, availableFrom: "Now", rating: 4.8, features: ["Bonded zone", "Automated racking", "Smart sensors", "Solar power", "24/7 security"] },
  { id: "ruh-sa", name: "Riyadh Logistics City", city: "Riyadh", country: "Saudi Arabia", region: "Middle East", coord: [46.72, 24.71], sqft: 108000, clearHeightM: 14, docks: 24, powerMVA: 3.0, pricePerSqftYear: 8.4, type: "Standard", available: true, availableFrom: "Now", rating: 4.3, features: ["Cross-dock", "Solar power", "24/7 security"] },
  { id: "dmm-sa", name: "Dammam Port Cold Store", city: "Dammam", country: "Saudi Arabia", region: "Middle East", coord: [50.10, 26.43], sqft: 62000, clearHeightM: 11, docks: 14, powerMVA: 2.7, pricePerSqftYear: 10.2, type: "Cold Chain", available: false, availableFrom: "Q4 2026", rating: 4.2, features: ["Cold storage", "Smart sensors", "24/7 security"] },

  // —— Oceania ——
  { id: "syd-au", name: "Sydney Western Logistics Hub", city: "Sydney", country: "Australia", region: "Oceania", coord: [150.86, -33.81], sqft: 98000, clearHeightM: 14, docks: 22, powerMVA: 2.8, pricePerSqftYear: 13.8, type: "Smart", available: true, availableFrom: "Now", rating: 4.6, features: ["Automated racking", "Smart sensors", "Solar power", "EV charging", "24/7 security"] },
  { id: "mel-au", name: "Melbourne Dandenong DC", city: "Melbourne", country: "Australia", region: "Oceania", coord: [145.21, -37.99], sqft: 82000, clearHeightM: 12, docks: 18, powerMVA: 2.4, pricePerSqftYear: 12.1, type: "Standard", available: true, availableFrom: "Now", rating: 4.3, features: ["Cross-dock", "24/7 security", "Solar power"] },
  { id: "akl-nz", name: "Auckland Wiri Distribution", city: "Auckland", country: "New Zealand", region: "Oceania", coord: [174.86, -36.98], sqft: 54000, clearHeightM: 10, docks: 12, powerMVA: 1.9, pricePerSqftYear: 11.3, type: "Standard", available: true, availableFrom: "Now", rating: 4.1, features: ["Cross-dock", "24/7 security"] },
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/lib/warehouse-data.test.ts`
Expected: PASS. Then `npx tsc --noEmit` clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/warehouse-data.ts src/lib/warehouse-data.test.ts
git commit -m "feat: expand warehouse dataset to ~36 facilities"
```

End every commit message in this plan with:
`Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`

---

### Task 2: Booking refs, validation, and details builder (pure libs)

**Files:**
- Create: `src/lib/bookings/refs.ts`, `src/lib/bookings/validate.ts`
- Test: `src/lib/bookings/refs.test.ts`, `src/lib/bookings/validate.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/bookings/refs.test.ts
import { describe, expect, it } from "vitest";
import { formatWarehouseRef } from "@/lib/bookings/refs";

describe("formatWarehouseRef", () => {
  it("is deterministic and BR-WH-##### shaped", () => {
    const a = formatWarehouseRef("seed-123");
    expect(a).toMatch(/^BR-WH-\d{5}$/);
    expect(formatWarehouseRef("seed-123")).toBe(a);
  });
  it("varies with the seed", () => {
    expect(formatWarehouseRef("a")).not.toBe(formatWarehouseRef("b"));
  });
});
```

```ts
// src/lib/bookings/validate.test.ts
import { describe, expect, it } from "vitest";
import { validateWarehouseBooking, buildBookingDetails } from "@/lib/bookings/validate";
import type { WarehouseBookingInput } from "@/lib/bookings/validate";

const valid: WarehouseBookingInput = {
  facilityId: "rtm-a",
  name: "Jane Shipper",
  email: "jane@acme.com",
  company: "Acme",
  phone: "+1 555",
  sqftRequested: 20000,
  moveIn: "2026-08-01",
  termMonths: 24,
  features: ["Cold storage"],
  message: "Need reefer space.",
};

describe("validateWarehouseBooking", () => {
  it("passes a fully valid input", () => {
    expect(validateWarehouseBooking(valid)).toEqual({});
  });
  it("requires name", () => {
    expect(validateWarehouseBooking({ ...valid, name: " " }).name).toBeTruthy();
  });
  it("requires a valid email", () => {
    expect(validateWarehouseBooking({ ...valid, email: "nope" }).email).toBeTruthy();
  });
  it("requires positive sqft and term", () => {
    expect(validateWarehouseBooking({ ...valid, sqftRequested: 0 }).sqftRequested).toBeTruthy();
    expect(validateWarehouseBooking({ ...valid, termMonths: 0 }).termMonths).toBeTruthy();
  });
  it("requires a move-in date", () => {
    expect(validateWarehouseBooking({ ...valid, moveIn: "" }).moveIn).toBeTruthy();
  });
});

describe("buildBookingDetails", () => {
  it("merges facility info with the request", () => {
    const d = buildBookingDetails(valid, {
      name: "Rotterdam Smart Hub A",
      city: "Rotterdam",
      country: "Netherlands",
    });
    expect(d).toMatchObject({
      facilityName: "Rotterdam Smart Hub A",
      city: "Rotterdam",
      country: "Netherlands",
      sqftRequested: 20000,
      moveIn: "2026-08-01",
      termMonths: 24,
      features: ["Cold storage"],
      message: "Need reefer space.",
    });
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/lib/bookings/`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement `src/lib/bookings/refs.ts`**

```ts
// Deterministic booking reference (same hash style as src/lib/leads/refs.ts).
function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

export function formatWarehouseRef(seed: string): string {
  return `BR-WH-${(hashSeed(seed) % 90000) + 10000}`;
}
```

- [ ] **Step 4: Implement `src/lib/bookings/validate.ts`**

```ts
// Hand-rolled validation in the style of src/lib/leads/validate.ts — no zod.

export type WarehouseBookingInput = {
  facilityId: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  sqftRequested: number;
  moveIn: string;
  termMonths: number;
  features: string[];
  message: string;
};

export type BookingFieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateWarehouseBooking(input: WarehouseBookingInput): BookingFieldErrors {
  const e: BookingFieldErrors = {};
  if (!input.facilityId.trim()) e.facilityId = "Choose a facility.";
  if (!input.name.trim()) e.name = "Please enter your name.";
  if (!EMAIL_RE.test(input.email)) e.email = "Enter a valid email.";
  if (!Number.isFinite(input.sqftRequested) || input.sqftRequested <= 0)
    e.sqftRequested = "Enter the space you need (ft²).";
  if (!Number.isInteger(input.termMonths) || input.termMonths <= 0)
    e.termMonths = "Enter a lease term in months.";
  if (!input.moveIn.trim()) e.moveIn = "Choose a move-in date.";
  return e;
}

/** Pure assembler for the bookings.details jsonb payload. */
export function buildBookingDetails(
  input: WarehouseBookingInput,
  facility: { name: string; city: string; country: string },
): Record<string, unknown> {
  return {
    facilityName: facility.name,
    city: facility.city,
    country: facility.country,
    sqftRequested: input.sqftRequested,
    moveIn: input.moveIn,
    termMonths: input.termMonths,
    features: input.features,
    message: input.message,
  };
}
```

- [ ] **Step 5: Run to verify they pass**

Run: `npx vitest run src/lib/bookings/`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/bookings/
git commit -m "feat: warehouse booking refs + validation + details builder"
```

---

### Task 3: Booking email templates

**Files:**
- Create: `src/lib/email/booking-templates.ts`

This file reuses the visual `wrap`/`row` helpers' style but they're not exported from `templates.ts`, so inline minimal equivalents here (keep them small and consistent with the brand colors used in `templates.ts`).

- [ ] **Step 1: Implement `src/lib/email/booking-templates.ts`**

```ts
import type { EmailBody } from "@/lib/email/templates";
import type { WarehouseBookingInput } from "@/lib/bookings/validate";

type Facility = { name: string; city: string; country: string };
const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there";

function wrap(title: string, inner: string): string {
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#0b1b2b">
  <div style="background:linear-gradient(135deg,#1e5bff,#1336a0);color:#fff;padding:20px 24px;border-radius:16px 16px 0 0">
    <strong style="font-size:18px">Blue Route Logistics</strong>
  </div>
  <div style="border:1px solid #e4e9f0;border-top:0;border-radius:0 0 16px 16px;padding:24px">
    <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
    ${inner}
  </div>
</div>`;
}
function row(label: string, value: string): string {
  return `<tr><td style="padding:4px 12px 4px 0;color:#5c6b7b">${label}</td><td style="padding:4px 0;font-weight:600">${value}</td></tr>`;
}

export function warehouseBookingTeamEmail(
  input: WarehouseBookingInput,
  facility: Facility,
  ref: string,
): EmailBody {
  return {
    subject: `New warehouse booking ${ref} — ${facility.name}`,
    html: wrap(
      `New warehouse booking (${ref})`,
      `<table style="font-size:14px">
        ${row("Facility", `${facility.name}, ${facility.city}`)}
        ${row("Company", input.company || "—")}
        ${row("Contact", `${input.name} · ${input.email}`)}
        ${row("Phone", input.phone || "—")}
        ${row("Space", `${input.sqftRequested.toLocaleString()} ft²`)}
        ${row("Move-in", input.moveIn)}
        ${row("Term", `${input.termMonths} months`)}
        ${row("Features", input.features.length ? input.features.join(", ") : "—")}
      </table>
      <p style="margin:16px 0 4px;color:#5c6b7b;font-size:14px">Message</p>
      <p style="white-space:pre-wrap;font-size:14px">${input.message || "—"}</p>`,
    ),
  };
}

export function warehouseBookingAckEmail(
  input: WarehouseBookingInput,
  facility: Facility,
  ref: string,
): EmailBody {
  return {
    subject: `We received your warehouse request (${ref})`,
    html: wrap(
      `Thanks, ${firstName(input.name)}!`,
      `<p style="font-size:14px">We've received your request for space at
        <strong>${facility.name}</strong> (${facility.city}) and logged it as
        <strong>${ref}</strong>. No payment is taken now — our team will confirm
        availability and next steps shortly.</p>`,
    ),
  };
}

export function warehouseDecisionEmail(
  booking: { name: string; booking_ref: string; details: Record<string, unknown> },
  decision: "approved" | "rejected",
): EmailBody {
  const facilityName = String(booking.details.facilityName ?? "your requested facility");
  const approved = decision === "approved";
  return {
    subject: approved
      ? `Your warehouse request is approved (${booking.booking_ref})`
      : `Update on your warehouse request (${booking.booking_ref})`,
    html: wrap(
      approved ? `Good news, ${firstName(booking.name)}!` : `Thanks for your patience, ${firstName(booking.name)}`,
      approved
        ? `<p style="font-size:14px">Your request <strong>${booking.booking_ref}</strong> for
            <strong>${facilityName}</strong> has been <strong>approved</strong>. A leasing
            specialist will reach out to finalize the agreement and schedule your move-in.</p>`
        : `<p style="font-size:14px">After review, we're unable to confirm
            <strong>${facilityName}</strong> for request <strong>${booking.booking_ref}</strong>
            right now. Our team will follow up with alternative facilities that fit your needs.</p>`,
    ),
  };
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` (clean) and `npx eslint src/lib/email/booking-templates.ts` (clean).

- [ ] **Step 3: Commit**

```bash
git add src/lib/email/booking-templates.ts
git commit -m "feat: warehouse booking email templates"
```

---

### Task 4: Server actions (`submitWarehouseBooking`, `setBookingStatus`)

**Files:**
- Create: `src/app/actions/bookings.ts`

- [ ] **Step 1: Implement `src/app/actions/bookings.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/auth";
import { sendEmails } from "@/lib/email/resend";
import { FACILITIES } from "@/lib/warehouse-data";
import {
  validateWarehouseBooking,
  buildBookingDetails,
  type WarehouseBookingInput,
} from "@/lib/bookings/validate";
import { formatWarehouseRef } from "@/lib/bookings/refs";
import {
  warehouseBookingTeamEmail,
  warehouseBookingAckEmail,
  warehouseDecisionEmail,
} from "@/lib/email/booking-templates";

const HONEYPOT = "company_url";
const GENERIC = "Something went wrong — please try again or email us directly.";
const team = () => process.env.LEAD_NOTIFICATION_EMAIL ?? "";
const str = (fd: FormData, k: string) => ((fd.get(k) as string) ?? "").trim();
const num = (fd: FormData, k: string) => Number(str(fd, k));

export type WarehouseBookingState =
  | { status: "idle" }
  | { status: "success"; bookingRef: string }
  | { status: "error"; error: string; fieldErrors?: Record<string, string> };

export async function submitWarehouseBooking(
  _prev: WarehouseBookingState,
  formData: FormData,
): Promise<WarehouseBookingState> {
  if (str(formData, HONEYPOT)) {
    return { status: "success", bookingRef: formatWarehouseRef(crypto.randomUUID()) };
  }

  const input: WarehouseBookingInput = {
    facilityId: str(formData, "facilityId"),
    name: str(formData, "name"),
    email: str(formData, "email"),
    company: str(formData, "company"),
    phone: str(formData, "phone"),
    sqftRequested: num(formData, "sqftRequested"),
    moveIn: str(formData, "moveIn"),
    termMonths: num(formData, "termMonths"),
    features: formData.getAll("features").map((v) => String(v)),
    message: str(formData, "message"),
  };

  const fieldErrors = validateWarehouseBooking(input);
  if (Object.keys(fieldErrors).length) {
    return { status: "error", error: "Please fix the fields below.", fieldErrors };
  }

  // Resolve the facility server-side (don't trust client labels).
  const facility = FACILITIES.find((f) => f.id === input.facilityId);
  if (!facility) {
    return { status: "error", error: "That facility is no longer available." };
  }

  const bookingRef = formatWarehouseRef(crypto.randomUUID());

  try {
    const { error } = await getSupabaseAdmin().from("bookings").insert({
      type: "warehouse",
      warehouse_id: facility.id,
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      company: input.company || null,
      details: buildBookingDetails(input, facility),
      status: "new",
      booking_ref: bookingRef,
    });
    if (error) {
      console.error("[booking] insert failed:", error);
      return { status: "error", error: GENERIC };
    }
  } catch (err) {
    console.error("[booking] insert threw:", err);
    return { status: "error", error: GENERIC };
  }

  await sendEmails([
    { to: team(), replyTo: input.email, ...warehouseBookingTeamEmail(input, facility, bookingRef) },
    { to: input.email, ...warehouseBookingAckEmail(input, facility, bookingRef) },
  ]);

  return { status: "success", bookingRef };
}

export async function setBookingStatus(
  id: string,
  status: "approved" | "rejected" | "closed",
): Promise<{ ok: boolean }> {
  await requireAdmin("bookings");
  if (!["approved", "rejected", "closed"].includes(status)) return { ok: false };

  const supabase = getSupabaseAdmin();
  const { data: booking, error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", id)
    .select("name, email, booking_ref, details")
    .single();
  if (error || !booking) {
    console.error("[booking] status update failed:", error?.message);
    return { ok: false };
  }

  if (status === "approved" || status === "rejected") {
    await sendEmails([
      {
        to: booking.email,
        ...warehouseDecisionEmail(
          { name: booking.name, booking_ref: booking.booking_ref, details: booking.details ?? {} },
          status,
        ),
      },
    ]);
  }

  revalidatePath("/admin/bookings");
  return { ok: true };
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` (clean), `npx eslint src/app/actions/bookings.ts` (clean), `npx vitest run` (still 75+ — no new tests here, the pure pieces are already tested).

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/bookings.ts
git commit -m "feat: warehouse booking server actions (submit + status)"
```

---

### Task 5: Public booking page + wizard

**Files:**
- Create: `src/app/(site)/warehousing/book/page.tsx`
- Create: `src/components/warehouse/warehouse-booking-wizard.tsx`
- Modify: `src/components/warehouse/warehouse-explorer.tsx` (wire the existing "Request this space" button to the page)

- [ ] **Step 1: Create the page `src/app/(site)/warehousing/book/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FACILITIES } from "@/lib/warehouse-data";
import { WarehouseBookingWizard } from "@/components/warehouse/warehouse-booking-wizard";

export const metadata: Metadata = {
  title: "Request a Warehouse",
  description: "Request a Blue Route warehouse facility — no payment, staff-confirmed availability.",
};

export default async function WarehouseBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ facility?: string }>;
}) {
  const { facility: facilityId } = await searchParams;
  const facility = FACILITIES.find((f) => f.id === facilityId);
  if (!facility) notFound();

  return (
    <section className="relative pt-28 pb-20 lg:pt-32">
      <div className="bg-grid absolute inset-0 -z-10 h-96" />
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <Link href="/warehousing" className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to facilities
        </Link>
        <div className="mt-4">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foam md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
            Request <span className="text-gradient">{facility.name}</span>
          </h1>
          <p className="mt-2 text-mist">
            {facility.city}, {facility.country} · {facility.sqft.toLocaleString()} ft² ·
            ${facility.pricePerSqftYear}/ft²/yr
          </p>
        </div>
        <WarehouseBookingWizard
          facility={{
            id: facility.id,
            name: facility.name,
            city: facility.city,
            country: facility.country,
            features: facility.features,
          }}
        />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create the wizard `src/components/warehouse/warehouse-booking-wizard.tsx`**

```tsx
"use client";

import { useActionState, useState } from "react";
import { ArrowRight, ArrowLeft, Check, CircleCheck, Boxes, Building2, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitWarehouseBooking, type WarehouseBookingState } from "@/app/actions/bookings";

type FacilityLite = {
  id: string;
  name: string;
  city: string;
  country: string;
  features: string[];
};

const STEPS = ["Requirements", "Company", "Review"];
const inputCls =
  "h-12 w-full rounded-2xl border border-steel/60 bg-abyss/60 px-4 text-sm text-foam outline-none transition-colors focus:border-cyan/60";

export function WarehouseBookingWizard({ facility }: { facility: FacilityLite }) {
  const [step, setStep] = useState(0);
  const [sqft, setSqft] = useState("");
  const [moveIn, setMoveIn] = useState("");
  const [term, setTerm] = useState("24");
  const [features, setFeatures] = useState<string[]>([]);
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [stepError, setStepError] = useState<string | null>(null);

  const [state, action, pending] = useActionState<WarehouseBookingState, FormData>(
    submitWarehouseBooking,
    { status: "idle" },
  );
  const fieldErrors = state.status === "error" ? state.fieldErrors ?? {} : {};

  function toggleFeature(f: string) {
    setFeatures((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));
  }

  function next() {
    if (step === 0 && (!(Number(sqft) > 0) || !moveIn)) {
      setStepError("Enter the space you need and a move-in date.");
      return;
    }
    if (step === 1 && (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      setStepError("Enter your name and a valid work email.");
      return;
    }
    setStepError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  if (state.status === "success") {
    return (
      <div className="glass mt-8 rounded-3xl p-8 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald/15 text-emerald">
          <CircleCheck className="h-8 w-8" />
        </span>
        <h2 className="mt-4 text-2xl font-semibold text-foam" style={{ fontFamily: "var(--font-display)" }}>
          Request received
        </h2>
        <p className="mt-1 text-sm text-mist">
          Reference <span className="font-semibold text-aqua">{state.bookingRef}</span>. No payment
          taken — our team will confirm availability at {facility.name} and email you next steps.
        </p>
      </div>
    );
  }

  return (
    <div className="glass mt-8 rounded-3xl p-6 md:p-8">
      {/* Stepper */}
      <ol className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2 last:flex-none">
            <span className={cn(
              "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold",
              i < step ? "bg-emerald/15 text-emerald" : i === step ? "bg-gradient-to-br from-cyan to-indigo text-white" : "bg-steel/60 text-mist",
            )}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className={cn("hidden text-xs font-medium sm:block", i === step ? "text-foam" : "text-mist")}>{label}</span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-steel/60" />}
          </li>
        ))}
      </ol>

      {(stepError || (state.status === "error" && state.error)) && (
        <p className="mb-4 rounded-2xl bg-rose/10 p-3 text-sm text-rose">
          {stepError ?? (state.status === "error" ? state.error : null)}
        </p>
      )}

      {step === 0 && (
        <div>
          <Title icon={Boxes} text="What do you need?" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Space needed (ft²) *" error={fieldErrors.sqftRequested}>
              <input value={sqft} onChange={(e) => setSqft(e.target.value)} inputMode="numeric" placeholder="20000" className={inputCls} />
            </Field>
            <Field label="Lease term (months) *" error={fieldErrors.termMonths}>
              <input value={term} onChange={(e) => setTerm(e.target.value)} inputMode="numeric" className={inputCls} />
            </Field>
            <Field label="Desired move-in *" error={fieldErrors.moveIn}>
              <input type="date" value={moveIn} onChange={(e) => setMoveIn(e.target.value)} className={cn(inputCls, "[color-scheme:light]")} />
            </Field>
          </div>
          {facility.features.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-foam">Features you need</p>
              <div className="flex flex-wrap gap-2">
                {facility.features.map((f) => (
                  <button key={f} type="button" onClick={() => toggleFeature(f)} className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    features.includes(f) ? "border-cyan/60 bg-cyan/10 text-cyan" : "border-steel/60 text-mist hover:border-cyan/30",
                  )}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div>
          <Title icon={Building2} text="Who should we contact?" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company"><input value={company} onChange={(e) => setCompany(e.target.value)} className={inputCls} /></Field>
            <Field label="Full name *" error={fieldErrors.name}><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></Field>
            <Field label="Work email *" error={fieldErrors.email}><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></Field>
            <Field label="Phone"><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} /></Field>
            <div className="sm:col-span-2">
              <Field label="Message"><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className={cn(inputCls, "h-auto py-3")} /></Field>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <Title icon={ClipboardCheck} text="Review & submit" />
          <div className="space-y-2 rounded-2xl border border-steel/50 bg-abyss/40 p-5 text-sm">
            <Row label="Facility">{facility.name}, {facility.city}</Row>
            <Row label="Space">{Number(sqft).toLocaleString()} ft²</Row>
            <Row label="Term">{term} months</Row>
            <Row label="Move-in">{moveIn}</Row>
            <Row label="Features">{features.length ? features.join(", ") : "—"}</Row>
            <Row label="Contact">{name} · {email}</Row>
            {company && <Row label="Company">{company}</Row>}
          </div>

          <form action={action} className="mt-6">
            <div aria-hidden className="hidden">
              <input type="text" name="company_url" tabIndex={-1} autoComplete="off" />
            </div>
            <input type="hidden" name="facilityId" value={facility.id} />
            <input type="hidden" name="sqftRequested" value={sqft} />
            <input type="hidden" name="termMonths" value={term} />
            <input type="hidden" name="moveIn" value={moveIn} />
            <input type="hidden" name="company" value={company} />
            <input type="hidden" name="name" value={name} />
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="phone" value={phone} />
            <input type="hidden" name="message" value={message} />
            {features.map((f) => (
              <input key={f} type="hidden" name="features" value={f} />
            ))}
            <button type="submit" disabled={pending} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-cyan to-indigo px-6 py-3 text-sm font-semibold text-white shadow-soft transition-transform active:scale-95 disabled:opacity-50">
              {pending ? "Submitting…" : "Submit request"} <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-3 text-center text-xs text-mist">No payment is taken now.</p>
          </form>
        </div>
      )}

      {/* Nav (hide on review step, which has its own submit) */}
      {step < 2 && (
        <div className="mt-8 flex items-center justify-between">
          <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-mist transition-colors hover:text-foam disabled:opacity-0">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button type="button" onClick={next} className="inline-flex items-center gap-2 rounded-full bg-cyan px-6 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform active:scale-95">
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function Title({ icon: Icon, text }: { icon: typeof Boxes; text: string }) {
  return (
    <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-foam" style={{ fontFamily: "var(--font-display)" }}>
      <Icon className="h-5 w-5 text-cyan" /> {text}
    </h2>
  );
}
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foam">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-rose">{error}</span>}
    </label>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-mist">{label}</span>
      <span className="text-right font-medium text-foam">{children}</span>
    </div>
  );
}
```

- [ ] **Step 3: Wire the entry point in `src/components/warehouse/warehouse-explorer.tsx`**

The `LeasingCalculator` (rendered when a facility is selected) has an existing no-op "Request this space" button (search for `Request this space`). Convert it to a Next `Link` to the booking page. Add `import Link from "next/link";` at the top of the file if not already present. Replace the button:

```tsx
        <Link
          href={`/warehousing/book?facility=${facility.id}`}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-cyan to-indigo px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(30,91,255,0.65)] transition-transform active:scale-95"
        >
          Request this space <ArrowRight className="h-4 w-4" />
        </Link>
```

(`ArrowRight` is already imported in that file. The `<button>` was the only thing changed.)

- [ ] **Step 4: Verify in the running app**

Run `npx tsc --noEmit` (clean), `npx eslint` on the three files (clean), `npx vitest run` (unchanged count).
Then with the dev server: `curl -s -o NUL -w "%{http_code}\n" "http://localhost:3000/warehousing/book?facility=rtm-a"` → 200; `curl -s -o NUL -w "%{http_code}\n" "http://localhost:3000/warehousing/book?facility=bogus"` → 404; `/warehousing` still 200.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(site)/warehousing/book/page.tsx" src/components/warehouse/
git commit -m "feat: public warehouse booking page + wizard"
```

---

### Task 6: Admin Bookings page + approve/reject

**Files:**
- Modify: `src/lib/admin/menus.ts` (add `"bookings"`)
- Modify: `src/components/admin/admin-sidebar.tsx` (icon)
- Modify: `src/app/admin/(panel)/layout.tsx` (nav item)
- Create: `src/app/admin/(panel)/bookings/page.tsx`
- Create: `src/components/admin/booking-actions.tsx`

- [ ] **Step 1: Add the `bookings` menu**

In `src/lib/admin/menus.ts`, add `"bookings"` to the `AdminMenu` union (e.g. after `"settings"`) and to `ALL_MENUS`:

```ts
export type AdminMenu =
  | "dashboard"
  | "shipments"
  | "create"
  | "bookings"
  | "email"
  | "admins"
  | "settings"
  | "ai-audit";

export const ALL_MENUS: AdminMenu[] = [
  "dashboard",
  "shipments",
  "create",
  "bookings",
  "email",
  "admins",
  "settings",
  "ai-audit",
];
```

- [ ] **Step 2: Sidebar icon** in `src/components/admin/admin-sidebar.tsx`

Add `ClipboardList` to the lucide import and a map entry:

```ts
import {
  LayoutDashboard, Ship, PackagePlus, Mail, Users, Settings, Bot, LogOut,
  ClipboardList, type LucideIcon,
} from "lucide-react";
```
```ts
const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  shipments: Ship,
  create: PackagePlus,
  bookings: ClipboardList,
  email: Mail,
  admins: Users,
  settings: Settings,
  "ai-audit": Bot,
};
```

- [ ] **Step 3: Nav item** in `src/app/admin/(panel)/layout.tsx`

Add to the `NAV` array, after the `create` entry:

```ts
  { key: "bookings", label: "Bookings", href: "/admin/bookings" },
```

- [ ] **Step 4: Create `src/components/admin/booking-actions.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { setBookingStatus } from "@/app/actions/bookings";

const BADGE: Record<string, string> = {
  new: "bg-cyan/10 text-cyan",
  approved: "bg-emerald/10 text-emerald",
  rejected: "bg-rose/10 text-rose",
  closed: "bg-steel/60 text-mist",
};

export function BookingActions({ id, status: initial }: { id: string; status: string }) {
  const [status, setStatus] = useState(initial);
  const [pending, startTransition] = useTransition();

  function decide(next: "approved" | "rejected") {
    startTransition(async () => {
      const res = await setBookingStatus(id, next);
      if (res.ok) setStatus(next);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${BADGE[status] ?? BADGE.closed}`}>
        {status}
      </span>
      {status === "new" && (
        <>
          <button type="button" onClick={() => decide("approved")} disabled={pending} aria-label="Approve" className="grid h-7 w-7 place-items-center rounded-full border border-steel text-emerald hover:border-emerald/50 disabled:opacity-50">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => decide("rejected")} disabled={pending} aria-label="Reject" className="grid h-7 w-7 place-items-center rounded-full border border-steel text-rose hover:border-rose/50 disabled:opacity-50">
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create `src/app/admin/(panel)/bookings/page.tsx`**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { FACILITIES } from "@/lib/warehouse-data";
import { BookingActions } from "@/components/admin/booking-actions";

export const metadata: Metadata = { title: "Bookings" };

const STATUSES = ["all", "new", "approved", "rejected", "closed"] as const;

type BookingRow = {
  id: string;
  created_at: string;
  type: string;
  warehouse_id: string | null;
  service_slug: string | null;
  name: string;
  email: string;
  company: string | null;
  details: Record<string, unknown> | null;
  status: string;
  booking_ref: string;
};

function facilityName(id: string | null): string {
  if (!id) return "—";
  return FACILITIES.find((f) => f.id === id)?.name ?? id;
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin("bookings");
  const { status } = await searchParams;
  const active = STATUSES.includes((status ?? "all") as (typeof STATUSES)[number])
    ? (status ?? "all")
    : "all";

  let query = getSupabaseAdmin()
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  if (active !== "all") query = query.eq("status", active);
  const { data } = await query;
  const rows = (data ?? []) as BookingRow[];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foam" style={{ fontFamily: "var(--font-display)" }}>
        Bookings
      </h1>
      <p className="mt-1 text-sm text-mist">Warehouse and service requests from customers.</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/admin/bookings" : `/admin/bookings?status=${s}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${active === s ? "bg-gradient-to-br from-cyan to-indigo text-white" : "border border-steel/70 text-mist hover:text-foam"}`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-steel/70 bg-deep shadow-soft">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-steel/60 text-xs uppercase tracking-wide text-mist">
            <tr>
              <th className="px-4 py-3 font-semibold">Ref</th>
              <th className="px-4 py-3 font-semibold">Facility / Service</th>
              <th className="px-4 py-3 font-semibold">Company</th>
              <th className="px-4 py-3 font-semibold">Contact</th>
              <th className="px-4 py-3 font-semibold">Request</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-steel/50 text-foam">
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-mist">No bookings yet.</td></tr>
            )}
            {rows.map((b) => {
              const d = b.details ?? {};
              return (
                <tr key={b.id}>
                  <td className="px-4 py-3 font-mono text-xs">{b.booking_ref}</td>
                  <td className="px-4 py-3">
                    {b.type === "warehouse" ? facilityName(b.warehouse_id) : b.service_slug ?? "—"}
                  </td>
                  <td className="px-4 py-3">{b.company ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="block">{b.name}</span>
                    <span className="block text-xs text-mist">{b.email}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-mist">
                    {d.sqftRequested ? `${Number(d.sqftRequested).toLocaleString()} ft²` : "—"}
                    {d.moveIn ? ` · ${String(d.moveIn)}` : ""}
                    {d.termMonths ? ` · ${String(d.termMonths)}mo` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <BookingActions id={b.id} status={b.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify**

Run `npx tsc --noEmit` (clean), `npx eslint` on the changed/created files (clean), `npx vitest run` (unchanged), `npx next build` (expect green; new route `/admin/bookings`).
Then: `curl -s -o NUL -w "%{http_code}\n" http://localhost:3000/admin/bookings` → 307 (auth redirect; not 500).

- [ ] **Step 7: Commit**

```bash
git add src/lib/admin/menus.ts src/components/admin/admin-sidebar.tsx "src/app/admin/(panel)/layout.tsx" "src/app/admin/(panel)/bookings/page.tsx" src/components/admin/booking-actions.tsx
git commit -m "feat: admin bookings review page with approve/reject"
```

---

### Task 7: Live E2E

**Files:**
- Create: `scripts/verify-bookings-e2e.mjs`

- [ ] **Step 1: Write `scripts/verify-bookings-e2e.mjs`**

Mirrors `scripts/verify-admin-e2e.mjs` (cookie-jar admin auth) + service-role seeding. Uses the seeded super admin from `verify-admin-e2e` context: email `roberthorton2167@gmail.com`, password `BlueRoute!Admin2026`.

```js
// Live E2E for warehouse bookings. Seeds a booking via the service role (mirroring
// submitWarehouseBooking's insert), verifies the authed /admin/bookings page renders
// it, flips status, checks the filter, and the public page 200/404. Cleans up.
//   node scripts/verify-bookings-e2e.mjs   (dev server must be up)
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const BASE = "http://localhost:3000";
const EMAIL = "roberthorton2167@gmail.com";
const PASSWORD = "BlueRoute!Admin2026";
const REF = "BR-WH-99999";

const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function step(label, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"} | ${label}${detail ? " | " + detail : ""}`);
  if (!ok) process.exitCode = 1;
}
function makeJar() {
  const jar = new Map();
  const client = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach((c) => jar.set(c.name, c.value)) },
  });
  return { client, jar };
}
const cookieHeader = (jar) => [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
async function get(path, jar) {
  const res = await fetch(BASE + path, { redirect: "manual", headers: jar ? { cookie: cookieHeader(jar) } : {} });
  return { status: res.status, body: res.status === 200 ? await res.text() : "", location: res.headers.get("location") };
}

// clean any prior seed
await svc.from("bookings").delete().eq("booking_ref", REF);

// 1. seed a booking (shape submitWarehouseBooking writes)
{
  const { error } = await svc.from("bookings").insert({
    type: "warehouse", warehouse_id: "rtm-a", name: "E2E Tester", email: "e2e@example.com",
    phone: "+1 555", company: "E2E Co", status: "new", booking_ref: REF,
    details: { facilityName: "Rotterdam Smart Hub A", city: "Rotterdam", country: "Netherlands", sqftRequested: 20000, moveIn: "2026-09-01", termMonths: 24, features: ["Cross-dock"], message: "hi" },
  });
  step("seed booking row", !error, error?.message ?? REF);
}

// 2. admin auth
const { client: authed, jar } = makeJar();
{
  const { data, error } = await authed.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  step("admin sign-in", !error && !!data.session && jar.size > 0);
}

// 3. /admin/bookings renders the row
{
  const r = await get("/admin/bookings", jar);
  step("GET /admin/bookings shows seed", r.status === 200 && r.body.includes(REF) && r.body.includes("Rotterdam Smart Hub A"), `status=${r.status}`);
}

// 4. flip to approved via service role, page reflects it
{
  await svc.from("bookings").update({ status: "approved" }).eq("booking_ref", REF);
  const r = await get("/admin/bookings?status=approved", jar);
  step("approved filter includes the row", r.status === 200 && r.body.includes(REF));
  const rn = await get("/admin/bookings?status=new", jar);
  step("new filter excludes the approved row", rn.status === 200 && !rn.body.includes(REF));
}

// 5. public page 200 / 404
{
  const ok = await get("/warehousing/book?facility=rtm-a");
  const bad = await get("/warehousing/book?facility=bogus");
  step("public booking page 200 for real facility", ok.status === 200);
  step("public booking page 404 for bogus facility", bad.status === 404);
}

// cleanup
await svc.from("bookings").delete().eq("booking_ref", REF);
console.log(process.exitCode ? "\nRESULT: FAIL" : "\nRESULT: ALL GREEN");
```

- [ ] **Step 2: Run it** (dev server up)

Run: `node scripts/verify-bookings-e2e.mjs`
Expected: `RESULT: ALL GREEN`. (If admin sign-in fails, the super admin password may have been rotated — reseed with `node scripts/seed-admin.mjs roberthorton2167@gmail.com "BlueRoute!Admin2026"` and rerun.)

- [ ] **Step 3: Commit**

```bash
git add scripts/verify-bookings-e2e.mjs
git commit -m "test: live E2E for warehouse bookings"
```

---

### Task 8: Reconcile PLAN.md + final verification

**Files:**
- Modify: `docs/PLAN.md`

- [ ] **Step 1: Update `docs/PLAN.md`** — mark **item 8** ✅ done (dataset expanded to ~36; `/warehousing/book` wizard → `bookings`; admin `/admin/bookings` approve/reject + email; live E2E green). Update "Build order (remaining)" so the next item is the rest of **item 6** (service-aware quote forms). Add item 8 to "Completed so far".

- [ ] **Step 2: Full verification**

Run: `npx vitest run` (all green) and `npx next build` (green, includes `/warehousing/book` and `/admin/bookings`).

- [ ] **Step 3: Commit**

```bash
git add docs/PLAN.md
git commit -m "docs: mark warehouse booking (item 8) done"
```

- [ ] **Step 4: Tell Timi what to eyeball**

`/warehousing` → pick a facility → "Request this space" → wizard → submit → success ref. Then `/admin/bookings` (sign in) → the request appears → Approve → status flips and a customer email is attempted (test-mode: lands at the Resend account address).
