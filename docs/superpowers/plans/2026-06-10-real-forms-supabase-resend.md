# Real Forms (Supabase + Resend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Contact form and the Quote wizard's booking step real — persist submissions to Supabase and send Resend notification + acknowledgement emails via Next.js Server Actions.

**Architecture:** Existing client forms call `'use server'` actions (`src/app/actions/leads.ts`) through React `useActionState`. Actions validate input, write to Supabase using a server-only service-role client, then send two emails best-effort. The DB write is the source of truth; email failures are logged but don't fail the request. Booking totals are recomputed server-side from the quote engine (the client price is never trusted).

**Tech Stack:** Next.js 16.2.7 (App Router, Server Actions), React 19, `@supabase/supabase-js`, `resend`, Vitest (new), TypeScript.

**Spec:** `docs/superpowers/specs/2026-06-10-real-forms-supabase-resend-design.md`

---

## File structure

**New:**
- `vitest.config.ts` — test runner config with `@/*` alias.
- `src/lib/leads/types.ts` — shared input/state/error types.
- `src/lib/leads/validate.ts` — pure field validators.
- `src/lib/leads/refs.ts` — ticket/booking reference formatters (pure).
- `src/lib/leads/booking.ts` — `resolveBooking` (server-authoritative totals).
- `src/lib/email/templates.ts` — the four email bodies (pure).
- `src/lib/email/resend.ts` — Resend client + best-effort `sendEmails`.
- `src/lib/supabase/admin.ts` — server-only service-role client.
- `src/app/actions/leads.ts` — `submitContact`, `submitBooking` server actions.
- `supabase/schema.sql` — DB schema (run in Supabase SQL editor).
- Test files colocated as `*.test.ts` next to each pure module.

**Modified:**
- `src/lib/quote-data.ts` — add `computeInsuranceFee` helper.
- `src/components/contact/contact-form.tsx` — wire to `submitContact`.
- `src/components/quote/quote-wizard.tsx` — add name/email capture, wire to `submitBooking`, use `computeInsuranceFee`.
- `package.json` — add Vitest dev deps + `test` scripts; add `server-only`.
- `.env.local` — add Supabase/Resend env vars (Timi, guided).

---

### Task 1: Test tooling + server-only

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`
- Test: `src/lib/sanity.test.ts` (temporary)

- [ ] **Step 1: Install dependencies**

Run in PowerShell at repo root:
```powershell
npm install server-only
npm install -D vitest
```
Expected: both install with no errors; `package.json` gains `server-only` under dependencies and `vitest` under devDependencies.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": resolve(root, "src") },
  },
});
```

- [ ] **Step 3: Add test scripts to `package.json`**

In the `"scripts"` block add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write a temporary sanity test**

`src/lib/sanity.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("sanity", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run the test**

Run: `npm test`
Expected: 1 passed.

- [ ] **Step 6: Delete the sanity test and commit**

```powershell
Remove-Item src/lib/sanity.test.ts
git add package.json package-lock.json vitest.config.ts
git commit -m "Add Vitest test runner and server-only dependency"
```

---

### Task 2: Lead types + validators

**Files:**
- Create: `src/lib/leads/types.ts`, `src/lib/leads/validate.ts`
- Test: `src/lib/leads/validate.test.ts`

- [ ] **Step 1: Create the shared types**

`src/lib/leads/types.ts`:
```ts
export type ContactInput = {
  name: string;
  company: string;
  email: string;
  topic: string;
  message: string;
};

export type BookingInput = {
  name: string;
  email: string;
  company: string;
  originCode: string;
  destCode: string;
  mode: "door-to-door" | "port-to-port";
  containerId: string;
  optionId: "express" | "balanced" | "green";
  insurance: boolean;
  weightKg: number | null;
  readyDate: string | null;
};

export type FieldErrors = Record<string, string>;

export type ContactState =
  | { status: "idle" }
  | { status: "error"; error: string; fieldErrors?: FieldErrors }
  | { status: "success"; ticketRef: string };

export type BookingState =
  | { status: "idle" }
  | { status: "error"; error: string; fieldErrors?: FieldErrors }
  | { status: "success"; bookingRef: string };
```

- [ ] **Step 2: Write the failing test**

`src/lib/leads/validate.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { validateContact, validateBooking } from "./validate";
import type { ContactInput, BookingInput } from "./types";

const goodContact: ContactInput = {
  name: "Jane Shipper",
  company: "Acme",
  email: "jane@acme.com",
  topic: "Sales & quoting",
  message: "Need a quote.",
};

const goodBooking: BookingInput = {
  name: "Jane",
  email: "jane@acme.com",
  company: "",
  originCode: "CNSHA",
  destCode: "NLRTM",
  mode: "door-to-door",
  containerId: "40hc",
  optionId: "balanced",
  insurance: true,
  weightKg: 18000,
  readyDate: null,
};

describe("validateContact", () => {
  it("passes a valid contact", () => {
    expect(validateContact(goodContact)).toEqual({});
  });
  it("flags missing name, bad email, empty message", () => {
    const errs = validateContact({ ...goodContact, name: " ", email: "nope", message: "" });
    expect(errs.name).toBeTruthy();
    expect(errs.email).toBeTruthy();
    expect(errs.message).toBeTruthy();
  });
});

describe("validateBooking", () => {
  it("passes a valid booking", () => {
    expect(validateBooking(goodBooking)).toEqual({});
  });
  it("flags bad email and same origin/destination", () => {
    const errs = validateBooking({ ...goodBooking, email: "x", destCode: "CNSHA" });
    expect(errs.email).toBeTruthy();
    expect(errs.route).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- validate`
Expected: FAIL — cannot find module `./validate`.

- [ ] **Step 4: Implement the validators**

`src/lib/leads/validate.ts`:
```ts
import type { ContactInput, BookingInput, FieldErrors } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact(input: ContactInput): FieldErrors {
  const e: FieldErrors = {};
  if (!input.name.trim()) e.name = "Please enter your name.";
  if (!EMAIL_RE.test(input.email)) e.email = "Enter a valid email.";
  if (!input.message.trim()) e.message = "Please enter a message.";
  return e;
}

export function validateBooking(input: BookingInput): FieldErrors {
  const e: FieldErrors = {};
  if (!input.name.trim()) e.name = "Please enter your name.";
  if (!EMAIL_RE.test(input.email)) e.email = "Enter a valid email.";
  if (!input.originCode || !input.destCode) e.route = "Choose origin and destination.";
  else if (input.originCode === input.destCode) e.route = "Origin and destination must differ.";
  return e;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- validate`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```powershell
git add src/lib/leads/types.ts src/lib/leads/validate.ts src/lib/leads/validate.test.ts
git commit -m "Add lead input types and field validators"
```

---

### Task 3: Reference formatters

**Files:**
- Create: `src/lib/leads/refs.ts`
- Test: `src/lib/leads/refs.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/leads/refs.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { formatTicketRef, formatBookingRef } from "./refs";

describe("formatTicketRef", () => {
  it("is deterministic for a seed and matches BR-INQ-##### shape", () => {
    const a = formatTicketRef("seed-1");
    expect(a).toBe(formatTicketRef("seed-1"));
    expect(a).toMatch(/^BR-INQ-\d{5}$/);
  });
});

describe("formatBookingRef", () => {
  it("embeds origin/dest prefixes and matches shape", () => {
    const ref = formatBookingRef("seed-1", "CNSHA", "NLRTM");
    expect(ref).toMatch(/^BR-CNNL-\d{4}$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- refs`
Expected: FAIL — cannot find module `./refs`.

- [ ] **Step 3: Implement the formatters**

`src/lib/leads/refs.ts`:
```ts
// Reference formatters. Pure and deterministic from a seed so they are
// testable; the action passes crypto.randomUUID() as the seed at runtime.
function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

export function formatTicketRef(seed: string): string {
  return `BR-INQ-${(hashSeed(seed) % 90000) + 10000}`;
}

export function formatBookingRef(seed: string, originCode: string, destCode: string): string {
  const num = (hashSeed(seed) % 9000) + 1000;
  return `BR-${originCode.slice(0, 2)}${destCode.slice(0, 2)}-${num}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- refs`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```powershell
git add src/lib/leads/refs.ts src/lib/leads/refs.test.ts
git commit -m "Add ticket and booking reference formatters"
```

---

### Task 4: Insurance fee helper + booking resolver

**Files:**
- Modify: `src/lib/quote-data.ts` (add helper at end of file)
- Create: `src/lib/leads/booking.ts`
- Test: `src/lib/leads/booking.test.ts`

- [ ] **Step 1: Add `computeInsuranceFee` to `src/lib/quote-data.ts`**

Append at the end of the file:
```ts
/** Cargo insurance fee: 1.8% of freight, rounded to the nearest $5. */
export function computeInsuranceFee(priceUSD: number): number {
  return Math.round((priceUSD * 0.018) / 5) * 5;
}
```

- [ ] **Step 2: Write the failing test**

`src/lib/leads/booking.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { resolveBooking } from "./booking";
import type { BookingInput } from "./types";

const base: BookingInput = {
  name: "Jane",
  email: "jane@acme.com",
  company: "",
  originCode: "CNSHA",
  destCode: "NLRTM",
  mode: "door-to-door",
  containerId: "40hc",
  optionId: "balanced",
  insurance: true,
  weightKg: 18000,
  readyDate: null,
};

describe("resolveBooking", () => {
  it("resolves labels, option and adds insurance to total", () => {
    const r = resolveBooking(base)!;
    expect(r).not.toBeNull();
    expect(r.origin.label).toContain("Shanghai");
    expect(r.destination.label).toContain("Rotterdam");
    expect(r.option.id).toBe("balanced");
    expect(r.insuranceFeeUSD).toBeGreaterThan(0);
    expect(r.totalUSD).toBe(r.option.priceUSD + r.insuranceFeeUSD);
  });

  it("omits insurance from total when not selected", () => {
    const r = resolveBooking({ ...base, insurance: false })!;
    expect(r.totalUSD).toBe(r.option.priceUSD);
  });

  it("returns null for unknown port or container", () => {
    expect(resolveBooking({ ...base, originCode: "XXXXX" })).toBeNull();
    expect(resolveBooking({ ...base, containerId: "nope" })).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- booking`
Expected: FAIL — cannot find module `./booking`.

- [ ] **Step 4: Implement the resolver**

`src/lib/leads/booking.ts`:
```ts
import {
  PORTS,
  CONTAINERS,
  computeQuotes,
  computeInsuranceFee,
  type QuoteOption,
} from "@/lib/quote-data";
import type { BookingInput } from "./types";

export type ResolvedBooking = {
  origin: { code: string; label: string };
  destination: { code: string; label: string };
  container: { id: string; label: string };
  mode: BookingInput["mode"];
  option: QuoteOption;
  insurance: boolean;
  insuranceFeeUSD: number;
  totalUSD: number;
};

/**
 * Recompute the booking server-side from submitted codes so prices can't be
 * tampered with on the client. Returns null if any code is unknown.
 */
export function resolveBooking(input: BookingInput): ResolvedBooking | null {
  const origin = PORTS.find((p) => p.code === input.originCode);
  const destination = PORTS.find((p) => p.code === input.destCode);
  const container = CONTAINERS.find((c) => c.id === input.containerId);
  if (!origin || !destination || !container) return null;

  const quotes = computeQuotes({ origin, destination, container, mode: input.mode });
  const option = quotes.find((q) => q.id === input.optionId);
  if (!option) return null;

  const insuranceFeeUSD = computeInsuranceFee(option.priceUSD);
  const totalUSD = option.priceUSD + (input.insurance ? insuranceFeeUSD : 0);

  return {
    origin: { code: origin.code, label: `${origin.city}, ${origin.country}` },
    destination: { code: destination.code, label: `${destination.city}, ${destination.country}` },
    container: { id: container.id, label: container.label },
    mode: input.mode,
    option,
    insurance: input.insurance,
    insuranceFeeUSD,
    totalUSD,
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- booking`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```powershell
git add src/lib/quote-data.ts src/lib/leads/booking.ts src/lib/leads/booking.test.ts
git commit -m "Add insurance fee helper and server-side booking resolver"
```

---

### Task 5: Email templates

**Files:**
- Create: `src/lib/email/templates.ts`
- Test: `src/lib/email/templates.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/email/templates.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import {
  contactTeamEmail,
  contactAckEmail,
  bookingTeamEmail,
  bookingAckEmail,
} from "./templates";
import type { ContactInput } from "@/lib/leads/types";
import type { ResolvedBooking } from "@/lib/leads/booking";

const contact: ContactInput = {
  name: "Jane Shipper",
  company: "Acme",
  email: "jane@acme.com",
  topic: "Sales & quoting",
  message: "Need a quote to Rotterdam.",
};

const resolved: ResolvedBooking = {
  origin: { code: "CNSHA", label: "Shanghai, China" },
  destination: { code: "NLRTM", label: "Rotterdam, Netherlands" },
  container: { id: "40hc", label: "40' High-Cube" },
  mode: "door-to-door",
  option: {
    id: "balanced",
    name: "Balanced",
    tagline: "Best value",
    transitDays: 30,
    priceUSD: 3200,
    co2Kg: 1800,
    riskLabel: "Low",
    highlights: [],
  },
  insurance: true,
  insuranceFeeUSD: 60,
  totalUSD: 3260,
};

describe("contact templates", () => {
  it("team email includes name, email and ticket", () => {
    const { subject, html } = contactTeamEmail(contact, "BR-INQ-12345");
    expect(subject).toContain("BR-INQ-12345");
    expect(html).toContain("jane@acme.com");
    expect(html).toContain("Need a quote");
  });
  it("ack email greets the customer by first name", () => {
    const { html } = contactAckEmail(contact, "BR-INQ-12345");
    expect(html).toContain("Jane");
    expect(html).toContain("BR-INQ-12345");
  });
});

describe("booking templates", () => {
  it("team email includes route, total and booking ref", () => {
    const { subject, html } = bookingTeamEmail(
      { name: "Jane", email: "jane@acme.com" },
      resolved,
      "BR-CNNL-1234",
    );
    expect(subject).toContain("BR-CNNL-1234");
    expect(html).toContain("Shanghai, China");
    expect(html).toContain("Rotterdam, Netherlands");
    expect(html).toContain("3,260");
  });
  it("ack email confirms the booking ref", () => {
    const { html } = bookingAckEmail(
      { name: "Jane", email: "jane@acme.com" },
      resolved,
      "BR-CNNL-1234",
    );
    expect(html).toContain("BR-CNNL-1234");
    expect(html).toContain("Jane");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- templates`
Expected: FAIL — cannot find module `./templates`.

- [ ] **Step 3: Implement the templates**

`src/lib/email/templates.ts`:
```ts
import type { ContactInput } from "@/lib/leads/types";
import type { ResolvedBooking } from "@/lib/leads/booking";

export type EmailBody = { subject: string; html: string };
type Person = { name: string; email: string };

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;
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

export function contactTeamEmail(c: ContactInput, ticketRef: string): EmailBody {
  return {
    subject: `New inquiry ${ticketRef} — ${c.topic || "General"}`,
    html: wrap(
      `New contact inquiry (${ticketRef})`,
      `<table style="font-size:14px">
        ${row("Name", c.name)}
        ${row("Company", c.company || "—")}
        ${row("Email", c.email)}
        ${row("Topic", c.topic || "—")}
      </table>
      <p style="margin:16px 0 4px;color:#5c6b7b;font-size:14px">Message</p>
      <p style="white-space:pre-wrap;font-size:14px">${c.message}</p>`,
    ),
  };
}

export function contactAckEmail(c: ContactInput, ticketRef: string): EmailBody {
  return {
    subject: `We received your message (${ticketRef})`,
    html: wrap(
      `Thanks, ${firstName(c.name)}!`,
      `<p style="font-size:14px">We've received your inquiry and logged it as
        <strong>${ticketRef}</strong>. A specialist will reply within 2 business hours.</p>
      <p style="font-size:14px;color:#5c6b7b">Need an answer right now? Our AI Advisor is available 24/7 on blueroute.com.</p>`,
    ),
  };
}

export function bookingTeamEmail(p: Person, b: ResolvedBooking, bookingRef: string): EmailBody {
  return {
    subject: `New booking request ${bookingRef} — ${b.origin.code}→${b.destination.code}`,
    html: wrap(
      `New booking request (${bookingRef})`,
      `<table style="font-size:14px">
        ${row("Customer", `${p.name} · ${p.email}`)}
        ${row("Route", `${b.origin.label} → ${b.destination.label}`)}
        ${row("Service", b.mode === "door-to-door" ? "Door-to-Door" : "Port-to-Port")}
        ${row("Container", b.container.label)}
        ${row("Option", `${b.option.name} · ${b.option.transitDays} days`)}
        ${row("Freight", usd(b.option.priceUSD))}
        ${row("Insurance", b.insurance ? usd(b.insuranceFeeUSD) : "—")}
        ${row("Total", usd(b.totalUSD))}
      </table>`,
    ),
  };
}

export function bookingAckEmail(p: Person, b: ResolvedBooking, bookingRef: string): EmailBody {
  return {
    subject: `Your booking request ${bookingRef}`,
    html: wrap(
      `Thanks, ${firstName(p.name)} — request received`,
      `<p style="font-size:14px">Your booking request <strong>${bookingRef}</strong> for
        <strong>${b.origin.label} → ${b.destination.label}</strong> is in. No payment is taken now —
        our team will confirm availability and next steps by email.</p>
      <table style="font-size:14px">
        ${row("Option", `${b.option.name} · ${b.option.transitDays} days`)}
        ${row("Estimated total", usd(b.totalUSD))}
      </table>`,
    ),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- templates`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```powershell
git add src/lib/email/templates.ts src/lib/email/templates.test.ts
git commit -m "Add transactional email templates for contact and booking"
```

---

### Task 6: Supabase admin client (server-only)

**Files:**
- Create: `src/lib/supabase/admin.ts`

No unit test — this is a thin infra wrapper exercised through the action tests (Task 8/9) with mocks.

- [ ] **Step 1: Implement the client**

`src/lib/supabase/admin.ts`:
```ts
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/** Server-only Supabase client using the service-role key (bypasses RLS). */
export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0 (no errors).

- [ ] **Step 3: Commit**

```powershell
git add src/lib/supabase/admin.ts
git commit -m "Add server-only Supabase admin client"
```

---

### Task 7: Resend send helper (server-only)

**Files:**
- Create: `src/lib/email/resend.ts`

No unit test — thin infra wrapper, exercised through action tests with mocks.

- [ ] **Step 1: Implement the helper**

`src/lib/email/resend.ts`:
```ts
import "server-only";
import { Resend } from "resend";

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

let cached: Resend | null = null;
function getResend(): Resend {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY missing.");
  cached = new Resend(key);
  return cached;
}

/** Sends each email best-effort. Logs failures; never throws. */
export async function sendEmails(emails: OutgoingEmail[]): Promise<void> {
  const from = process.env.RESEND_FROM;
  if (!from) {
    console.error("[email] RESEND_FROM missing — skipping send.");
    return;
  }
  const client = getResend();
  await Promise.all(
    emails.map(async (e) => {
      try {
        const { error } = await client.emails.send({
          from,
          to: e.to,
          subject: e.subject,
          html: e.html,
          ...(e.replyTo ? { replyTo: e.replyTo } : {}),
        });
        if (error) console.error("[email] send failed:", error);
      } catch (err) {
        console.error("[email] send threw:", err);
      }
    }),
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```powershell
git add src/lib/email/resend.ts
git commit -m "Add best-effort Resend send helper"
```

---

### Task 8: `submitContact` server action

**Files:**
- Create: `src/app/actions/leads.ts` (contact half), `src/app/actions/leads.test.ts`

- [ ] **Step 1: Write the failing test**

`src/app/actions/leads.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const insert = vi.fn().mockResolvedValue({ error: null });
const from = vi.fn(() => ({ insert }));
const sendEmails = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: () => ({ from }) }));
vi.mock("@/lib/email/resend", () => ({ sendEmails }));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: () => "test-agent" }),
}));

import { submitContact } from "./leads";

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.append(k, v);
  return f;
}

beforeEach(() => {
  insert.mockClear();
  from.mockClear();
  sendEmails.mockClear();
});

describe("submitContact", () => {
  it("inserts and sends two emails on success", async () => {
    const res = await submitContact(
      { status: "idle" },
      fd({ name: "Jane", email: "jane@acme.com", message: "Hi", topic: "Sales & quoting" }),
    );
    expect(res.status).toBe("success");
    expect(from).toHaveBeenCalledWith("contact_inquiries");
    expect(insert).toHaveBeenCalledTimes(1);
    expect(sendEmails).toHaveBeenCalledTimes(1);
    expect(sendEmails.mock.calls[0][0]).toHaveLength(2);
  });

  it("returns fieldErrors and does not insert on invalid input", async () => {
    const res = await submitContact({ status: "idle" }, fd({ name: "", email: "bad", message: "" }));
    expect(res.status).toBe("error");
    expect(insert).not.toHaveBeenCalled();
  });

  it("silently succeeds and stores nothing when honeypot is filled", async () => {
    const res = await submitContact(
      { status: "idle" },
      fd({ name: "Bot", email: "bot@x.com", message: "spam", company_url: "http://spam" }),
    );
    expect(res.status).toBe("success");
    expect(insert).not.toHaveBeenCalled();
    expect(sendEmails).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- leads`
Expected: FAIL — cannot find module `./leads`.

- [ ] **Step 3: Implement `submitContact`**

`src/app/actions/leads.ts`:
```ts
"use server";

import { headers } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendEmails } from "@/lib/email/resend";
import { validateContact } from "@/lib/leads/validate";
import { formatTicketRef } from "@/lib/leads/refs";
import { contactTeamEmail, contactAckEmail } from "@/lib/email/templates";
import type { ContactInput, ContactState } from "@/lib/leads/types";

const HONEYPOT = "company_url";
const GENERIC = "Something went wrong — please try again or email us directly.";
const team = () => process.env.LEAD_NOTIFICATION_EMAIL ?? "";
const str = (fd: FormData, k: string) => ((fd.get(k) as string) ?? "").trim();

export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // Honeypot: pretend success, store nothing.
  if (str(formData, HONEYPOT)) {
    return { status: "success", ticketRef: formatTicketRef(crypto.randomUUID()) };
  }

  const input: ContactInput = {
    name: str(formData, "name"),
    company: str(formData, "company"),
    email: str(formData, "email"),
    topic: str(formData, "topic"),
    message: str(formData, "message"),
  };

  const fieldErrors = validateContact(input);
  if (Object.keys(fieldErrors).length) {
    return { status: "error", error: "Please fix the fields below.", fieldErrors };
  }

  const ticketRef = formatTicketRef(crypto.randomUUID());
  const userAgent = (await headers()).get("user-agent") ?? null;

  try {
    const { error } = await getSupabaseAdmin().from("contact_inquiries").insert({
      name: input.name,
      company: input.company || null,
      email: input.email,
      topic: input.topic || null,
      message: input.message,
      ticket_ref: ticketRef,
      user_agent: userAgent,
    });
    if (error) {
      console.error("[contact] insert failed:", error);
      return { status: "error", error: GENERIC };
    }
  } catch (err) {
    console.error("[contact] insert threw:", err);
    return { status: "error", error: GENERIC };
  }

  await sendEmails([
    { to: team(), replyTo: input.email, ...contactTeamEmail(input, ticketRef) },
    { to: input.email, ...contactAckEmail(input, ticketRef) },
  ]);

  return { status: "success", ticketRef };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- leads`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```powershell
git add src/app/actions/leads.ts src/app/actions/leads.test.ts
git commit -m "Add submitContact server action"
```

---

### Task 9: `submitBooking` server action

**Files:**
- Modify: `src/app/actions/leads.ts` (add booking half)
- Modify: `src/app/actions/leads.test.ts` (add booking describe block)

- [ ] **Step 1: Add the failing test**

Append to `src/app/actions/leads.test.ts` (after the `submitContact` block, before end of file):
```ts
import { submitBooking } from "./leads";

function bookingFd(over: Record<string, string> = {}): FormData {
  return fd({
    name: "Jane",
    email: "jane@acme.com",
    originCode: "CNSHA",
    destCode: "NLRTM",
    mode: "door-to-door",
    containerId: "40hc",
    optionId: "balanced",
    insurance: "true",
    ...over,
  });
}

describe("submitBooking", () => {
  it("inserts into quote_requests and emails on success", async () => {
    const res = await submitBooking({ status: "idle" }, bookingFd());
    expect(res.status).toBe("success");
    expect(from).toHaveBeenCalledWith("quote_requests");
    expect(insert).toHaveBeenCalledTimes(1);
    expect(sendEmails.mock.calls[0][0]).toHaveLength(2);
  });

  it("errors on invalid email without inserting", async () => {
    const res = await submitBooking({ status: "idle" }, bookingFd({ email: "bad" }));
    expect(res.status).toBe("error");
    expect(insert).not.toHaveBeenCalled();
  });

  it("errors when route resolves to nothing (unknown port)", async () => {
    const res = await submitBooking({ status: "idle" }, bookingFd({ originCode: "ZZZZZ" }));
    expect(res.status).toBe("error");
    expect(insert).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- leads`
Expected: FAIL — `submitBooking` is not exported.

- [ ] **Step 3: Implement `submitBooking`**

Add these imports to the top of `src/app/actions/leads.ts` (merge with existing import lines):
```ts
import { validateBooking } from "@/lib/leads/validate";
import { resolveBooking } from "@/lib/leads/booking";
import { formatBookingRef } from "@/lib/leads/refs";
import { bookingTeamEmail, bookingAckEmail } from "@/lib/email/templates";
import type { BookingInput, BookingState } from "@/lib/leads/types";
```

Append this function to the end of `src/app/actions/leads.ts`:
```ts
export async function submitBooking(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  if (str(formData, HONEYPOT)) {
    return {
      status: "success",
      bookingRef: formatBookingRef(crypto.randomUUID(), str(formData, "originCode"), str(formData, "destCode")),
    };
  }

  const input: BookingInput = {
    name: str(formData, "name"),
    email: str(formData, "email"),
    company: str(formData, "company"),
    originCode: str(formData, "originCode"),
    destCode: str(formData, "destCode"),
    mode: str(formData, "mode") === "port-to-port" ? "port-to-port" : "door-to-door",
    containerId: str(formData, "containerId"),
    optionId: (str(formData, "optionId") || "balanced") as BookingInput["optionId"],
    insurance: str(formData, "insurance") === "true",
    weightKg: Number(str(formData, "weight")) || null,
    readyDate: str(formData, "readyDate") || null,
  };

  const fieldErrors = validateBooking(input);
  if (Object.keys(fieldErrors).length) {
    return { status: "error", error: "Please fix the fields below.", fieldErrors };
  }

  const resolved = resolveBooking(input);
  if (!resolved) {
    return { status: "error", error: "We couldn't price that route — please review your selection." };
  }

  const bookingRef = formatBookingRef(crypto.randomUUID(), resolved.origin.code, resolved.destination.code);

  try {
    const { error } = await getSupabaseAdmin().from("quote_requests").insert({
      name: input.name,
      email: input.email,
      company: input.company || null,
      origin_code: resolved.origin.code,
      origin_label: resolved.origin.label,
      dest_code: resolved.destination.code,
      dest_label: resolved.destination.label,
      mode: resolved.mode,
      container_id: resolved.container.id,
      container_label: resolved.container.label,
      weight_kg: input.weightKg,
      ready_date: input.readyDate,
      option_id: resolved.option.id,
      option_name: resolved.option.name,
      transit_days: resolved.option.transitDays,
      co2_kg: resolved.option.co2Kg,
      price_usd: resolved.option.priceUSD,
      insurance: resolved.insurance,
      insurance_fee_usd: resolved.insuranceFeeUSD,
      total_usd: resolved.totalUSD,
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

  const person = { name: input.name, email: input.email };
  await sendEmails([
    { to: team(), replyTo: input.email, ...bookingTeamEmail(person, resolved, bookingRef) },
    { to: input.email, ...bookingAckEmail(person, resolved, bookingRef) },
  ]);

  return { status: "success", bookingRef };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- leads`
Expected: PASS (6 tests total in the file).

- [ ] **Step 5: Commit**

```powershell
git add src/app/actions/leads.ts src/app/actions/leads.test.ts
git commit -m "Add submitBooking server action with server-side pricing"
```

---

### Task 10: Wire the Contact form

**Files:**
- Modify: `src/components/contact/contact-form.tsx`

This replaces the local fake-submit with the real action. Replace the **entire file** with the version below (keeps the same UI and `Field` helper; swaps `useState`-based submit for `useActionState`, adds `name` attributes + a honeypot, and shows the server ticket ref).

- [ ] **Step 1: Replace `src/components/contact/contact-form.tsx`**

```tsx
"use client";

import { useActionState, useState } from "react";
import { motion } from "framer-motion";
import { CircleCheck, Send } from "lucide-react";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { OpenAdvisorButton } from "@/components/ai/open-advisor-button";
import { submitContact } from "@/app/actions/leads";
import type { ContactState } from "@/lib/leads/types";

const TOPICS = [
  "Sales & quoting",
  "Tracking & support",
  "Warehouse leasing",
  "Partnerships",
  "Other",
];

const INITIAL: ContactState = { status: "idle" };

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContact, INITIAL);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const fieldErrors = state.status === "error" ? state.fieldErrors ?? {} : {};

  if (state.status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
        className="glass rounded-3xl p-8 text-center"
      >
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald/12 text-emerald">
          <CircleCheck className="h-8 w-8" />
        </span>
        <h2
          className="mt-4 text-2xl font-semibold text-foam"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Thanks{name ? `, ${name.split(" ")[0]}` : ""}!
        </h2>
        <p className="mt-2 text-sm text-mist">
          Your inquiry is logged as{" "}
          <span className="font-semibold text-cyan">{state.ticketRef}</span>. A
          specialist will reply within 2 business hours, and a confirmation is on
          its way to your inbox.
        </p>
        <p className="mt-4 text-sm text-mist">Need an answer right now?</p>
        <div className="mt-3 flex justify-center">
          <OpenAdvisorButton>Ask the AI Advisor</OpenAdvisorButton>
        </div>
      </motion.div>
    );
  }

  return (
    <form action={formAction} className="glass rounded-3xl p-6 md:p-8">
      <h2
        className="text-xl font-semibold text-foam"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Send us a message
      </h2>
      <p className="mt-1 text-sm text-mist">
        Tell us about your shipment or question — we&apos;ll route it to the right
        expert.
      </p>

      {/* Honeypot — hidden from humans, bots fill it. */}
      <div aria-hidden className="hidden">
        <label>
          Company URL
          <input type="text" name="company_url" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required error={fieldErrors.name}>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Shipper"
            className={inputCls}
          />
        </Field>
        <Field label="Company">
          <input name="company" placeholder="Acme Trading Co." className={inputCls} />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Work email" required error={fieldErrors.email}>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@acme.com"
            className={inputCls}
          />
        </Field>
        <Field label="Topic">
          <select name="topic" defaultValue={TOPICS[0]} className={inputCls}>
            {TOPICS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Message" required error={fieldErrors.message}>
          <textarea
            name="message"
            rows={4}
            placeholder="Origin, destination, cargo, timeline — or your question."
            className={`${inputCls} resize-none py-3`}
          />
        </Field>
      </div>

      {state.status === "error" && !Object.keys(fieldErrors).length && (
        <p className="mt-4 text-sm text-rose">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-cyan to-indigo px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(30,91,255,0.65)] transition-transform active:scale-95 disabled:opacity-40"
      >
        {pending ? "Sending…" : "Send message"} <Send className="h-4 w-4" />
      </button>
      <p className="mt-3 text-center text-xs text-mist">
        Prefer instant answers? The AI Advisor is in the corner 24/7.
      </p>
    </form>
  );
}

const inputCls =
  "h-12 w-full rounded-2xl border border-steel/70 bg-white px-4 text-sm text-foam placeholder:text-mist/70 outline-none transition-colors focus:border-cyan/60";

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foam">
        {label}
        {required && <span className="text-cyan"> *</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-rose">{error}</span>}
    </label>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit` then `npx eslint src/components/contact/contact-form.tsx`
Expected: both exit 0.

- [ ] **Step 3: Commit**

```powershell
git add src/components/contact/contact-form.tsx
git commit -m "Wire contact form to submitContact server action"
```

---

### Task 11: Wire the Quote wizard booking step

**Files:**
- Modify: `src/components/quote/quote-wizard.tsx`

Three edits: (a) use `computeInsuranceFee` instead of the inline formula, (b) add `useActionState` for booking, (c) replace the Confirm step's action area with a real form that captures name/email + hidden fields and renders a success state.

- [ ] **Step 1: Update imports and the insurance-fee line in `QuoteWizard`**

In `src/components/quote/quote-wizard.tsx`, update the `quote-data` import to add `computeInsuranceFee`:
```ts
import {
  PORTS,
  CONTAINERS,
  computeQuotes,
  computeInsuranceFee,
  estimateDistanceKm,
  type Port,
  type ContainerType,
  type CargoMode,
  type QuoteOption,
} from "@/lib/quote-data";
```

Merge `useActionState` into the **existing** React import so there is no duplicate import line — change:
```ts
import { useMemo, useState } from "react";
```
to:
```ts
import { useActionState, useMemo, useState } from "react";
```

Then add these two imports below the existing `cn` import:
```ts
import { submitBooking } from "@/app/actions/leads";
import type { BookingState } from "@/lib/leads/types";
```

Replace the line:
```ts
  const insuranceFee = Math.round((selected.priceUSD * 0.018) / 5) * 5;
```
with:
```ts
  const insuranceFee = computeInsuranceFee(selected.priceUSD);
```

- [ ] **Step 2: Add booking action state in `QuoteWizard`**

Immediately after the `const bookingRef = useMemo(...)` block, add:
```ts
  const [bookingState, bookingAction, bookingPending] = useActionState<BookingState, FormData>(
    submitBooking,
    { status: "idle" },
  );
```

- [ ] **Step 3: Pass the new props to `ConfirmStep`**

Replace the existing `<ConfirmStep ... />` usage (the `step === 3` block) with:
```tsx
              {step === 3 && (
                <ConfirmStep
                  origin={origin}
                  destination={destination}
                  container={container}
                  mode={mode}
                  selected={selected}
                  insurance={insurance}
                  insuranceFee={insuranceFee}
                  total={total}
                  bookingRef={bookingRef}
                  originCode={originCode}
                  destCode={destCode}
                  containerId={containerId}
                  weight={weight}
                  readyDate={readyDate}
                  bookingState={bookingState}
                  bookingAction={bookingAction}
                  bookingPending={bookingPending}
                />
              )}
```

- [ ] **Step 4: Replace the `ConfirmStep` function**

Replace the entire existing `ConfirmStep` function with:
```tsx
/* ---------------- Step 4: Confirm ---------------- */
function ConfirmStep(props: {
  origin: Port;
  destination: Port;
  container: ContainerType;
  mode: CargoMode;
  selected: QuoteOption;
  insurance: boolean;
  insuranceFee: number;
  total: number;
  bookingRef: string;
  originCode: string;
  destCode: string;
  containerId: string;
  weight: string;
  readyDate: string;
  bookingState: BookingState;
  bookingAction: (formData: FormData) => void;
  bookingPending: boolean;
}) {
  const { bookingState } = props;
  const fieldErrors = bookingState.status === "error" ? bookingState.fieldErrors ?? {} : {};

  if (bookingState.status === "success") {
    return (
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald/15 text-emerald">
          <CircleCheck className="h-8 w-8" />
        </span>
        <h2
          className="mt-4 text-2xl font-semibold text-foam"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Booking request received
        </h2>
        <p className="mt-1 text-sm text-mist">
          Reference{" "}
          <span className="font-semibold text-aqua">{bookingState.bookingRef}</span>. We&apos;ve
          emailed you a confirmation — our team will confirm availability and next steps.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-cyan/15 text-cyan">
        <CircleCheck className="h-8 w-8" />
      </span>
      <h2
        className="mt-4 text-2xl font-semibold text-foam"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Review &amp; request booking
      </h2>
      <p className="mt-1 text-sm text-mist">
        Reference{" "}
        <span className="font-semibold text-aqua">{props.bookingRef}</span>
      </p>

      <div className="mx-auto mt-6 max-w-md space-y-2 rounded-2xl border border-steel/50 bg-abyss/40 p-5 text-left text-sm">
        <Row label="Route">
          {props.origin.city} → {props.destination.city}
        </Row>
        <Row label="Service">
          {props.mode === "door-to-door" ? "Door-to-Door" : "Port-to-Port"}
        </Row>
        <Row label="Container">{props.container.label}</Row>
        <Row label="Option">
          {props.selected.name} · {props.selected.transitDays} days
        </Row>
        <Row label="Carbon">{props.selected.co2Kg.toLocaleString()} kg CO₂</Row>
        <Row label="Freight">${props.selected.priceUSD.toLocaleString()}</Row>
        {props.insurance && (
          <Row label="Insurance">+${props.insuranceFee.toLocaleString()}</Row>
        )}
        <div className="mt-2 flex items-center justify-between border-t border-steel/50 pt-3">
          <span className="text-foam">Total</span>
          <span
            className="text-xl font-semibold text-foam"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ${props.total.toLocaleString()}
          </span>
        </div>
      </div>

      <form action={props.bookingAction} className="mx-auto mt-6 max-w-md text-left">
        {/* Honeypot */}
        <div aria-hidden className="hidden">
          <input type="text" name="company_url" tabIndex={-1} autoComplete="off" />
        </div>
        {/* Hidden selection — server re-prices from these. */}
        <input type="hidden" name="originCode" value={props.originCode} />
        <input type="hidden" name="destCode" value={props.destCode} />
        <input type="hidden" name="mode" value={props.mode} />
        <input type="hidden" name="containerId" value={props.containerId} />
        <input type="hidden" name="optionId" value={props.selected.id} />
        <input type="hidden" name="insurance" value={props.insurance ? "true" : "false"} />
        <input type="hidden" name="weight" value={props.weight} />
        <input type="hidden" name="readyDate" value={props.readyDate} />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foam">Full name *</span>
            <input
              name="name"
              placeholder="Jane Shipper"
              className="h-12 w-full rounded-2xl border border-steel/60 bg-abyss/60 px-4 text-sm text-foam outline-none transition-colors focus:border-cyan/60"
            />
            {fieldErrors.name && <span className="mt-1 block text-xs text-rose">{fieldErrors.name}</span>}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foam">Work email *</span>
            <input
              type="email"
              name="email"
              placeholder="jane@acme.com"
              className="h-12 w-full rounded-2xl border border-steel/60 bg-abyss/60 px-4 text-sm text-foam outline-none transition-colors focus:border-cyan/60"
            />
            {fieldErrors.email && <span className="mt-1 block text-xs text-rose">{fieldErrors.email}</span>}
          </label>
        </div>

        {bookingState.status === "error" && (
          <p className="mt-3 text-sm text-rose">{bookingState.error}</p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="submit"
            disabled={props.bookingPending}
            className="inline-flex items-center gap-2 rounded-full bg-cyan px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_-6px_rgba(30,91,255,0.6)] transition-transform active:scale-95 disabled:opacity-40"
          >
            {props.bookingPending ? "Sending…" : "Request booking"} <ArrowRight className="h-4 w-4" />
          </button>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-aqua/30 px-6 py-3 text-sm font-medium text-foam transition-colors hover:bg-aqua/10"
          >
            Talk to an expert
          </a>
        </div>
        <p className="mt-4 text-center text-xs text-mist">
          No payment is taken now — our team confirms availability and next steps by email.
        </p>
      </form>
    </div>
  );
}
```

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit` then `npx eslint src/components/quote/quote-wizard.tsx`
Expected: both exit 0. (If eslint flags an unused import that the rewrite removed, delete it and re-run.)

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: all tests pass (15 across validate/refs/booking/templates/leads).

- [ ] **Step 7: Commit**

```powershell
git add src/components/quote/quote-wizard.tsx
git commit -m "Capture contact details and wire quote booking to submitBooking"
```

---

### Task 12: Database schema + Supabase/Resend setup + end-to-end verification

**Files:**
- Create: `supabase/schema.sql`
- Modify: `.env.local` (Timi, guided — not committed)

- [ ] **Step 1: Create `supabase/schema.sql`**

```sql
-- Blue Route Logistics — lead capture schema.
-- RLS is enabled with no public policies; only the service-role key (used
-- server-side) can read/write these tables.

create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  company text,
  email text not null,
  topic text,
  message text not null,
  ticket_ref text not null,
  status text not null default 'new',
  user_agent text
);

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  company text,
  origin_code text,
  origin_label text,
  dest_code text,
  dest_label text,
  mode text,
  container_id text,
  container_label text,
  weight_kg numeric,
  ready_date date,
  option_id text,
  option_name text,
  transit_days int,
  co2_kg numeric,
  price_usd numeric,
  insurance boolean,
  insurance_fee_usd numeric,
  total_usd numeric,
  booking_ref text not null,
  status text not null default 'new'
);

alter table public.contact_inquiries enable row level security;
alter table public.quote_requests enable row level security;
-- No policies created => no anon/auth access. Service role bypasses RLS.
```

- [ ] **Step 2: Commit the schema**

```powershell
git add supabase/schema.sql
git commit -m "Add Supabase schema for contact_inquiries and quote_requests"
```

- [ ] **Step 3: Guided Supabase setup (Timi performs)**

Walk Timi through these (he must do the dashboard clicks):
1. Go to https://supabase.com → **New project** (free tier). Pick a name + strong DB password; wait for provisioning.
2. **SQL Editor → New query** → paste the entire contents of `supabase/schema.sql` → **Run**. Expected: "Success. No rows returned." Confirm both tables appear under **Table Editor**.
3. **Project Settings → API**: copy the **Project URL**, the **anon public** key, and the **service_role** key.

- [ ] **Step 4: Fill `.env.local` (Timi performs)**

Open `C:\Users\Timel\Desktop\BlueRoute\.env.local` and add (replacing the placeholder values):
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY
RESEND_API_KEY=YOUR-RESEND-KEY
RESEND_FROM=Blue Route Logistics <notifications@blueroute.com>
LEAD_NOTIFICATION_EMAIL=YOUR-INBOX@blueroute.com
```
Save, then restart the dev server (`npm run dev`) so the new env vars load.

- [ ] **Step 5: Manual end-to-end verification**

1. Run `npm run dev`, open http://localhost:3000/contact, submit the form with a real email you can check.
   - Expected: success card with a `BR-INQ-#####` ref; a new row in Supabase **contact_inquiries**; a notification email in `LEAD_NOTIFICATION_EMAIL` and an acknowledgement in the address you submitted.
2. Open http://localhost:3000/quote, complete the wizard, enter name + email on the Confirm step, click **Request booking**.
   - Expected: "Booking request received" with a `BR-...` ref; a new row in **quote_requests** with correct totals; team + customer emails arrive.
3. Submit the contact form once with browser devtools filling the hidden `company_url` field.
   - Expected: success UI, but **no** new row in Supabase (honeypot path).

- [ ] **Step 6: Final check**

Run: `npm test` and `npx tsc --noEmit` and `npm run build`
Expected: tests pass, no type errors, build succeeds.

---

## Notes for the implementer

- **Env vars are required at runtime**, not build time — `npm run build` succeeds without them, but form submission will return the generic error until `.env.local` is filled (Task 12). Do Tasks 1–11 freely; Task 12 needs Timi's accounts.
- **Reduced-motion / styling** conventions already exist in the codebase — reuse the token classes (`text-foam`, `bg-abyss`, `text-rose`, etc.) as shown.
- The **`text-rose`** utility is already defined in the theme (used elsewhere for errors).
