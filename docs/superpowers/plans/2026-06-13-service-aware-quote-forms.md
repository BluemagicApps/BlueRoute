# Service-Aware Quote Forms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/quote` service-aware — five services (air, land, project-cargo, cold-chain, customs) get tailored "request a quote" forms that write to the existing `bookings` table and surface in `/admin/bookings`; ocean-freight and door-to-door keep the live-priced wizard.

**Architecture:** Pure config + libs (field config, validation, details builder, BR-SV ref) → a `submitServiceQuote` server action (writes `bookings` type='service') → a config-driven `ServiceQuoteWizard` client component → `/quote?service=<slug>` routing. Mirrors the warehouse booking flow (item 8) exactly.

**Tech Stack:** Next 16 (App Router, Server Actions, `useActionState`), Tailwind v4, Supabase service-role writes, Resend (best-effort email), Vitest.

**Spec:** `docs/superpowers/specs/2026-06-13-service-aware-quote-forms-design.md`

**Executor notes:**
- This is **Next 16**: `searchParams` is a Promise (await it); Server-Action files (`"use server"`) export ONLY async functions; `crypto.randomUUID()` is fine inside actions.
- `EmailBody` is `{ subject: string; html: string }` (NO `text`). `OutgoingEmail` is `{ to, subject, html, replyTo? }`. `sendEmails(OutgoingEmail[])` is best-effort, never throws.
- The `bookings` table (live): `id, created_at, type ('warehouse'|'service'), service_slug, warehouse_id, name, email, phone, company, details jsonb, status ('new'|'approved'|'rejected'|'closed'), booking_ref`.
- `src/lib/email/booking-templates.ts` already defines module-private `wrap(title, inner)` and `row(label, value)` helpers and `firstName(name)` — reuse them; do NOT re-declare.
- `src/lib/bookings/refs.ts` already defines a module-private `hashSeed(seed)` — reuse it for `formatServiceRef`.
- Run tests with `npx vitest run` (84 currently pass). Dev server: http://localhost:3000.
- End every commit message in this plan with:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

---

### Task 1: Service booking reference (`formatServiceRef`)

**Files:**
- Modify: `src/lib/bookings/refs.ts`
- Test: `src/lib/bookings/refs.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

Append this `describe` block to `src/lib/bookings/refs.test.ts` (and add `formatServiceRef` to the existing import from `@/lib/bookings/refs`):

```ts
import { formatWarehouseRef, formatServiceRef } from "@/lib/bookings/refs";

describe("formatServiceRef", () => {
  it("is deterministic and BR-SV-##### shaped", () => {
    const a = formatServiceRef("seed-123");
    expect(a).toMatch(/^BR-SV-\d{5}$/);
    expect(formatServiceRef("seed-123")).toBe(a);
  });
  it("varies with the seed", () => {
    expect(formatServiceRef("a")).not.toBe(formatServiceRef("b"));
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/lib/bookings/refs.test.ts`
Expected: FAIL — `formatServiceRef` is not exported.

- [ ] **Step 3: Implement `formatServiceRef`**

In `src/lib/bookings/refs.ts`, add below `formatWarehouseRef` (reuse the existing `hashSeed`):

```ts
export function formatServiceRef(seed: string): string {
  return `BR-SV-${(hashSeed(seed) % 90000) + 10000}`;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/lib/bookings/refs.test.ts`
Expected: PASS. Then `npx tsc --noEmit` clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/bookings/refs.ts src/lib/bookings/refs.test.ts
git commit -m "feat: BR-SV service quote reference"
```

---

### Task 2: Per-service field config

**Files:**
- Create: `src/lib/quote/service-fields.ts`
- Test: `src/lib/quote/service-fields.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/quote/service-fields.test.ts
import { describe, expect, it } from "vitest";
import {
  SERVICE_QUOTE_FIELDS,
  SERVICE_QUOTE_SLUGS,
  getServiceQuoteConfig,
} from "@/lib/quote/service-fields";

const TYPES = ["text", "number", "date", "select", "multiselect", "textarea"];

describe("SERVICE_QUOTE_FIELDS", () => {
  it("has a config for all 5 declared slugs", () => {
    expect(SERVICE_QUOTE_SLUGS).toHaveLength(5);
    for (const slug of SERVICE_QUOTE_SLUGS) {
      expect(SERVICE_QUOTE_FIELDS[slug]?.slug).toBe(slug);
      expect(SERVICE_QUOTE_FIELDS[slug].fields.length).toBeGreaterThan(0);
    }
  });

  it("every field is well-formed", () => {
    for (const slug of SERVICE_QUOTE_SLUGS) {
      for (const f of SERVICE_QUOTE_FIELDS[slug].fields) {
        expect(f.name).toBeTruthy();
        expect(f.label).toBeTruthy();
        expect(TYPES).toContain(f.type);
        if (f.type === "select" || f.type === "multiselect") {
          expect(f.options && f.options.length > 0).toBe(true);
        }
      }
    }
  });

  it("resolves known slugs and rejects unknown", () => {
    expect(getServiceQuoteConfig("air-freight")?.title).toBe("Air freight quote");
    expect(getServiceQuoteConfig("bogus")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/lib/quote/service-fields.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/quote/service-fields.ts`**

```ts
export type FieldType = "text" | "number" | "date" | "select" | "multiselect" | "textarea";

export type QuoteField = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
};

export type ServiceQuoteConfig = {
  slug: string;
  title: string;
  fields: QuoteField[];
};

export const SERVICE_QUOTE_SLUGS = [
  "air-freight",
  "land-freight",
  "project-cargo",
  "cold-chain",
  "customs",
] as const;

export const SERVICE_QUOTE_FIELDS: Record<string, ServiceQuoteConfig> = {
  "air-freight": {
    slug: "air-freight",
    title: "Air freight quote",
    fields: [
      { name: "origin", label: "Origin city / airport", type: "text", required: true, placeholder: "Shanghai (PVG)" },
      { name: "destination", label: "Destination city / airport", type: "text", required: true, placeholder: "Los Angeles (LAX)" },
      { name: "serviceLevel", label: "Service level", type: "select", required: true, options: ["Next-flight-out express", "Express", "Deferred economy", "Full charter"] },
      { name: "commodity", label: "Commodity", type: "select", options: ["General cargo", "Perishables", "Pharma", "Dangerous goods", "Other"] },
      { name: "weightKg", label: "Chargeable weight (kg)", type: "number", required: true, placeholder: "1200" },
      { name: "pieces", label: "Number of pieces", type: "number", placeholder: "5" },
      { name: "dimensions", label: "Dimensions (L×W×H cm)", type: "text", placeholder: "120×80×100" },
      { name: "readyDate", label: "Cargo ready date", type: "date" },
      { name: "message", label: "Anything else?", type: "textarea", placeholder: "Special handling, deadlines…" },
    ],
  },
  "land-freight": {
    slug: "land-freight",
    title: "Land freight quote",
    fields: [
      { name: "origin", label: "Origin city / postal", type: "text", required: true, placeholder: "Rotterdam" },
      { name: "destination", label: "Destination city / postal", type: "text", required: true, placeholder: "Munich" },
      { name: "loadType", label: "Load type", type: "select", required: true, options: ["FTL (full truckload)", "LTL (less than truckload)", "Intermodal rail", "Port drayage"] },
      { name: "weightKg", label: "Weight (kg)", type: "number", placeholder: "8000" },
      { name: "equipment", label: "Equipment", type: "select", options: ["Dry van", "Reefer", "Flatbed", "Container chassis", "Other"] },
      { name: "crossBorder", label: "Scope", type: "select", options: ["Domestic", "Cross-border"] },
      { name: "readyDate", label: "Cargo ready date", type: "date" },
      { name: "message", label: "Anything else?", type: "textarea", placeholder: "Access constraints, appointments…" },
    ],
  },
  "project-cargo": {
    slug: "project-cargo",
    title: "Project & heavy cargo quote",
    fields: [
      { name: "origin", label: "Origin", type: "text", required: true, placeholder: "Hamburg" },
      { name: "destination", label: "Destination", type: "text", required: true, placeholder: "Jebel Ali" },
      { name: "cargoDescription", label: "What are you moving?", type: "text", required: true, placeholder: "Transformer, turbine blade…" },
      { name: "weightTonnes", label: "Total weight (tonnes)", type: "number", required: true, placeholder: "85" },
      { name: "dimensions", label: "Dimensions (L×W×H m)", type: "text", required: true, placeholder: "12×4×4.5" },
      { name: "outOfGauge", label: "Out-of-gauge?", type: "select", options: ["Out-of-gauge", "Fits standard equipment"] },
      { name: "needs", label: "What do you need?", type: "multiselect", options: ["Route survey", "Lifting plan", "Permits & escorts", "Specialized equipment"] },
      { name: "readyDate", label: "Target ship date", type: "date" },
      { name: "message", label: "Project details", type: "textarea", placeholder: "Site access, timelines, constraints…" },
    ],
  },
  "cold-chain": {
    slug: "cold-chain",
    title: "Cold chain quote",
    fields: [
      { name: "origin", label: "Origin", type: "text", required: true, placeholder: "Amsterdam" },
      { name: "destination", label: "Destination", type: "text", required: true, placeholder: "Singapore" },
      { name: "commodity", label: "Commodity", type: "select", required: true, options: ["Pharma", "Food & beverage", "Perishables", "Chemicals", "Other"] },
      { name: "tempRange", label: "Temperature range", type: "select", required: true, options: ["Frozen (−18°C)", "Chilled (2–8°C)", "Cool (8–15°C)", "Custom setpoint"] },
      { name: "mode", label: "Preferred mode", type: "select", options: ["Ocean reefer", "Air", "Road reefer", "Multimodal"] },
      { name: "weightKg", label: "Weight (kg)", type: "number", placeholder: "5000" },
      { name: "readyDate", label: "Cargo ready date", type: "date" },
      { name: "message", label: "Anything else?", type: "textarea", placeholder: "GDP requirements, setpoint…" },
    ],
  },
  customs: {
    slug: "customs",
    title: "Customs & compliance quote",
    fields: [
      { name: "direction", label: "Direction", type: "select", required: true, options: ["Import", "Export", "Both"] },
      { name: "originCountry", label: "Origin country", type: "text", required: true, placeholder: "China" },
      { name: "destCountry", label: "Destination country", type: "text", required: true, placeholder: "United States" },
      { name: "mode", label: "Transport mode", type: "select", options: ["Ocean", "Air", "Land"] },
      { name: "commodity", label: "Goods / HS code if known", type: "text", placeholder: "Electronics / 8517.62" },
      { name: "shipmentValue", label: "Shipment value (USD)", type: "text", placeholder: "50000" },
      { name: "bonded", label: "Regime", type: "select", options: ["Standard", "Bonded", "Special regime"] },
      { name: "message", label: "Anything else?", type: "textarea", placeholder: "Licenses, prior rulings…" },
    ],
  },
};

export function getServiceQuoteConfig(slug: string): ServiceQuoteConfig | undefined {
  return SERVICE_QUOTE_FIELDS[slug];
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/lib/quote/service-fields.test.ts`
Expected: PASS. Then `npx tsc --noEmit` clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/quote/service-fields.ts src/lib/quote/service-fields.test.ts
git commit -m "feat: per-service quote field config"
```

---

### Task 3: Validation + details builder

**Files:**
- Create: `src/lib/quote/validate.ts`
- Test: `src/lib/quote/validate.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/quote/validate.test.ts
import { describe, expect, it } from "vitest";
import { validateServiceQuote, buildServiceDetails, type ServiceQuoteInput } from "@/lib/quote/validate";
import { getServiceQuoteConfig } from "@/lib/quote/service-fields";

const customs = getServiceQuoteConfig("customs")!;
const air = getServiceQuoteConfig("air-freight")!;

const validCustoms: ServiceQuoteInput = {
  slug: "customs",
  values: { direction: "Import", originCountry: "China", destCountry: "United States", mode: "Ocean" },
  name: "Jane Shipper",
  email: "jane@acme.com",
  company: "Acme",
  phone: "+1 555",
};

describe("validateServiceQuote", () => {
  it("passes a fully valid input", () => {
    expect(validateServiceQuote(customs, validCustoms)).toEqual({});
  });
  it("flags missing required service fields", () => {
    const e = validateServiceQuote(customs, { ...validCustoms, values: { direction: "", originCountry: "", destCountry: "" } });
    expect(e.direction).toBeTruthy();
    expect(e.originCountry).toBeTruthy();
    expect(e.destCountry).toBeTruthy();
  });
  it("flags a missing required field for air freight (weightKg)", () => {
    const e = validateServiceQuote(air, {
      slug: "air-freight",
      values: { origin: "PVG", destination: "LAX", serviceLevel: "Express" },
      name: "Jane", email: "jane@acme.com", company: "", phone: "",
    });
    expect(e.weightKg).toBeTruthy();
  });
  it("requires name and a valid email", () => {
    expect(validateServiceQuote(customs, { ...validCustoms, name: " " }).name).toBeTruthy();
    expect(validateServiceQuote(customs, { ...validCustoms, email: "nope" }).email).toBeTruthy();
  });
});

describe("buildServiceDetails", () => {
  it("merges entered fields and builds a non-empty summary", () => {
    const d = buildServiceDetails(customs, validCustoms);
    expect(d).toMatchObject({ service: "Customs & compliance quote", direction: "Import", originCountry: "China" });
    expect(typeof d.summary).toBe("string");
    expect((d.summary as string).length).toBeGreaterThan(0);
  });
  it("omits empty fields from details", () => {
    const d = buildServiceDetails(air, {
      slug: "air-freight",
      values: { origin: "PVG", destination: "LAX", serviceLevel: "Express", weightKg: "1200", pieces: "" },
      name: "Jane", email: "jane@acme.com", company: "", phone: "",
    });
    expect(d).not.toHaveProperty("pieces");
    expect(d).toMatchObject({ origin: "PVG", weightKg: "1200" });
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/lib/quote/validate.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/quote/validate.ts`**

```ts
import type { ServiceQuoteConfig } from "@/lib/quote/service-fields";

export type ServiceQuoteInput = {
  slug: string;
  values: Record<string, string | string[]>;
  name: string;
  email: string;
  company: string;
  phone: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmpty(v: string | string[] | undefined): boolean {
  if (Array.isArray(v)) return v.length === 0;
  return !v || !v.trim();
}

export function validateServiceQuote(
  config: ServiceQuoteConfig,
  input: ServiceQuoteInput,
): Record<string, string> {
  const e: Record<string, string> = {};
  for (const f of config.fields) {
    if (f.required && isEmpty(input.values[f.name])) {
      e[f.name] = `${f.label} is required.`;
    }
  }
  if (!input.name.trim()) e.name = "Please enter your name.";
  if (!EMAIL_RE.test(input.email)) e.email = "Enter a valid email.";
  return e;
}

/** Pure assembler for the bookings.details jsonb payload (type='service'). */
export function buildServiceDetails(
  config: ServiceQuoteConfig,
  input: ServiceQuoteInput,
): Record<string, unknown> {
  const details: Record<string, unknown> = { service: config.title };
  for (const f of config.fields) {
    const v = input.values[f.name];
    if (!isEmpty(v)) details[f.name] = v;
  }
  if (input.phone) details.phone = input.phone;
  details.summary = buildSummary(config, input.values);
  return details;
}

function buildSummary(
  config: ServiceQuoteConfig,
  values: Record<string, string | string[]>,
): string {
  const parts: string[] = [];
  for (const f of config.fields) {
    if (parts.length >= 3) break;
    if (f.type === "textarea" || f.type === "multiselect") continue;
    const v = values[f.name];
    if (typeof v === "string" && v.trim()) parts.push(v.trim());
  }
  return parts.length ? parts.join(" · ") : config.title;
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/lib/quote/validate.test.ts`
Expected: PASS. Then `npx tsc --noEmit` clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/quote/validate.ts src/lib/quote/validate.test.ts
git commit -m "feat: service quote validation + details builder"
```

---

### Task 4: Service quote email templates

**Files:**
- Modify: `src/lib/email/booking-templates.ts`

- [ ] **Step 1: Add the templates**

At the top of `src/lib/email/booking-templates.ts`, add these imports alongside the existing ones (do NOT duplicate the existing `EmailBody` / `WarehouseBookingInput` imports):

```ts
import type { ServiceQuoteConfig } from "@/lib/quote/service-fields";
import type { ServiceQuoteInput } from "@/lib/quote/validate";
```

At the END of the file, append (reusing the existing module-private `wrap`, `row`, `firstName`):

```ts
export function serviceQuoteTeamEmail(
  config: ServiceQuoteConfig,
  input: ServiceQuoteInput,
  ref: string,
): EmailBody {
  const fieldRows = config.fields
    .map((f) => {
      const v = input.values[f.name];
      const val = Array.isArray(v) ? v.join(", ") : v;
      return val && val.trim() ? row(f.label, val) : "";
    })
    .join("");
  return {
    subject: `New ${config.title} ${ref}`,
    html: wrap(
      `New ${config.title.toLowerCase()} (${ref})`,
      `<table style="font-size:14px">
        ${row("Company", input.company || "—")}
        ${row("Contact", `${input.name} · ${input.email}`)}
        ${row("Phone", input.phone || "—")}
        ${fieldRows}
      </table>`,
    ),
  };
}

export function serviceQuoteAckEmail(
  config: ServiceQuoteConfig,
  input: ServiceQuoteInput,
  ref: string,
): EmailBody {
  return {
    subject: `We received your ${config.title} (${ref})`,
    html: wrap(
      `Thanks, ${firstName(input.name)}!`,
      `<p style="font-size:14px">We've received your ${config.title.toLowerCase()} and logged it as
        <strong>${ref}</strong>. No payment is taken now — our team will review the details and
        follow up with options and pricing shortly.</p>`,
    ),
  };
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` (clean) and `npx eslint src/lib/email/booking-templates.ts` (clean).

- [ ] **Step 3: Commit**

```bash
git add src/lib/email/booking-templates.ts
git commit -m "feat: service quote email templates"
```

---

### Task 5: `submitServiceQuote` server action

**Files:**
- Modify: `src/app/actions/bookings.ts`

- [ ] **Step 1: Add imports**

In `src/app/actions/bookings.ts`, extend the existing imports. Add to the top with the other imports:

```ts
import { getServiceQuoteConfig } from "@/lib/quote/service-fields";
import {
  validateServiceQuote,
  buildServiceDetails,
  type ServiceQuoteInput,
} from "@/lib/quote/validate";
import { formatServiceRef } from "@/lib/bookings/refs";
import {
  serviceQuoteTeamEmail,
  serviceQuoteAckEmail,
} from "@/lib/email/booking-templates";
```

Note: `formatServiceRef` joins the existing `import { formatWarehouseRef } from "@/lib/bookings/refs";` — either merge into one import line or add a second import; both compile. The service email imports join the existing `from "@/lib/email/booking-templates"` import block.

- [ ] **Step 2: Add the state type and action**

Append to `src/app/actions/bookings.ts` (the file already defines `HONEYPOT`, `GENERIC`, `team`, `str` helpers and is `"use server"` — reuse them):

```ts
export type ServiceQuoteState =
  | { status: "idle" }
  | { status: "success"; bookingRef: string }
  | { status: "error"; error: string; fieldErrors?: Record<string, string> };

export async function submitServiceQuote(
  _prev: ServiceQuoteState,
  formData: FormData,
): Promise<ServiceQuoteState> {
  if (str(formData, HONEYPOT)) {
    return { status: "success", bookingRef: formatServiceRef(crypto.randomUUID()) };
  }

  const slug = str(formData, "serviceSlug");
  const config = getServiceQuoteConfig(slug);
  if (!config) {
    return { status: "error", error: "Unknown service — please start from a service page." };
  }

  const values: Record<string, string | string[]> = {};
  for (const f of config.fields) {
    values[f.name] =
      f.type === "multiselect"
        ? formData.getAll(f.name).map((v) => String(v))
        : str(formData, f.name);
  }

  const input: ServiceQuoteInput = {
    slug,
    values,
    name: str(formData, "name"),
    email: str(formData, "email"),
    company: str(formData, "company"),
    phone: str(formData, "phone"),
  };

  const fieldErrors = validateServiceQuote(config, input);
  if (Object.keys(fieldErrors).length) {
    return { status: "error", error: "Please fix the fields below.", fieldErrors };
  }

  const bookingRef = formatServiceRef(crypto.randomUUID());

  try {
    const { error } = await getSupabaseAdmin().from("bookings").insert({
      type: "service",
      service_slug: slug,
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      company: input.company || null,
      details: buildServiceDetails(config, input),
      status: "new",
      booking_ref: bookingRef,
    });
    if (error) {
      console.error("[service-quote] insert failed:", error);
      return { status: "error", error: GENERIC };
    }
  } catch (err) {
    console.error("[service-quote] insert threw:", err);
    return { status: "error", error: GENERIC };
  }

  await sendEmails([
    { to: team(), replyTo: input.email, ...serviceQuoteTeamEmail(config, input, bookingRef) },
    { to: input.email, ...serviceQuoteAckEmail(config, input, bookingRef) },
  ]);

  return { status: "success", bookingRef };
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` (clean), `npx eslint src/app/actions/bookings.ts` (clean), `npx vitest run` (still all green — no new tests here; the pure pieces are tested in Tasks 1–3).

- [ ] **Step 4: Commit**

```bash
git add src/app/actions/bookings.ts
git commit -m "feat: submitServiceQuote server action"
```

---

### Task 6: `ServiceQuoteWizard` client component

**Files:**
- Create: `src/components/quote/service-quote-wizard.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useActionState, useState } from "react";
import { ArrowRight, ArrowLeft, Check, CircleCheck, Boxes, Building2, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitServiceQuote, type ServiceQuoteState } from "@/app/actions/bookings";
import type { ServiceQuoteConfig, QuoteField } from "@/lib/quote/service-fields";

const STEPS = ["Shipment", "Contact", "Review"];
const inputCls =
  "h-12 w-full rounded-2xl border border-steel/60 bg-abyss/60 px-4 text-sm text-foam outline-none transition-colors focus:border-cyan/60";

type Values = Record<string, string | string[]>;

export function ServiceQuoteWizard({ config }: { config: ServiceQuoteConfig }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(() => initialValues(config));
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [stepError, setStepError] = useState<string | null>(null);

  const [state, action, pending] = useActionState<ServiceQuoteState, FormData>(
    submitServiceQuote,
    { status: "idle" },
  );
  const fieldErrors = state.status === "error" ? state.fieldErrors ?? {} : {};

  function setValue(key: string, v: string | string[]) {
    setValues((cur) => ({ ...cur, [key]: v }));
  }
  function toggleMulti(key: string, opt: string) {
    setValues((cur) => {
      const arr = Array.isArray(cur[key]) ? (cur[key] as string[]) : [];
      return { ...cur, [key]: arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt] };
    });
  }

  function next() {
    if (step === 0) {
      const missing = config.fields.find((f) => f.required && isEmpty(values[f.name]));
      if (missing) {
        setStepError(`Please fill in “${missing.label}”.`);
        return;
      }
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
          taken — our team will review your request and email you options and pricing.
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
          <Title icon={Boxes} text="Shipment details" />
          <div className="grid gap-4 sm:grid-cols-2">
            {config.fields.map((f) => (
              <FieldInput
                key={f.name}
                field={f}
                value={values[f.name]}
                error={fieldErrors[f.name]}
                onChange={(v) => setValue(f.name, v)}
                onToggle={(opt) => toggleMulti(f.name, opt)}
              />
            ))}
          </div>
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
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <Title icon={ClipboardCheck} text="Review & submit" />
          <div className="space-y-2 rounded-2xl border border-steel/50 bg-abyss/40 p-5 text-sm">
            {config.fields.filter((f) => !isEmpty(values[f.name])).map((f) => (
              <Row key={f.name} label={f.label}>{display(values[f.name])}</Row>
            ))}
            <Row label="Contact">{name} · {email}</Row>
            {company && <Row label="Company">{company}</Row>}
          </div>

          <form action={action} className="mt-6">
            <div aria-hidden className="hidden">
              <input type="text" name="company_url" tabIndex={-1} autoComplete="off" />
            </div>
            <input type="hidden" name="serviceSlug" value={config.slug} />
            {config.fields.map((f) => {
              const v = values[f.name];
              if (Array.isArray(v)) {
                return v.map((item) => <input key={f.name + item} type="hidden" name={f.name} value={item} />);
              }
              return <input key={f.name} type="hidden" name={f.name} value={(v as string) ?? ""} />;
            })}
            <input type="hidden" name="company" value={company} />
            <input type="hidden" name="name" value={name} />
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="phone" value={phone} />
            <button type="submit" disabled={pending} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-cyan to-indigo px-6 py-3 text-sm font-semibold text-white shadow-soft transition-transform active:scale-95 disabled:opacity-50">
              {pending ? "Submitting…" : "Submit request"} <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-3 text-center text-xs text-mist">No payment is taken now.</p>
          </form>
        </div>
      )}

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

function initialValues(config: ServiceQuoteConfig): Values {
  const v: Values = {};
  for (const f of config.fields) v[f.name] = f.type === "multiselect" ? [] : "";
  return v;
}
function isEmpty(v: string | string[] | undefined): boolean {
  if (Array.isArray(v)) return v.length === 0;
  return !v || !v.trim();
}
function display(v: string | string[]): string {
  return Array.isArray(v) ? v.join(", ") : v;
}

function FieldInput({ field, value, error, onChange, onToggle }: {
  field: QuoteField;
  value: string | string[] | undefined;
  error?: string;
  onChange: (v: string) => void;
  onToggle: (opt: string) => void;
}) {
  const span = field.type === "textarea" || field.type === "multiselect" ? "sm:col-span-2" : "";
  return (
    <div className={span}>
      <Field label={field.required ? `${field.label} *` : field.label} error={error}>
        {field.type === "textarea" ? (
          <textarea value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={field.placeholder} className={cn(inputCls, "h-auto py-3")} />
        ) : field.type === "select" ? (
          <select value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className={inputCls}>
            <option value="" className="bg-deep">Select…</option>
            {field.options?.map((o) => <option key={o} value={o} className="bg-deep">{o}</option>)}
          </select>
        ) : field.type === "multiselect" ? (
          <div className="flex flex-wrap gap-2">
            {field.options?.map((o) => {
              const active = Array.isArray(value) && value.includes(o);
              return (
                <button key={o} type="button" onClick={() => onToggle(o)} className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active ? "border-cyan/60 bg-cyan/10 text-cyan" : "border-steel/60 text-mist hover:border-cyan/30",
                )}>
                  {o}
                </button>
              );
            })}
          </div>
        ) : (
          <input
            type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
            inputMode={field.type === "number" ? "numeric" : undefined}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={cn(inputCls, field.type === "date" && "[color-scheme:light]")}
          />
        )}
      </Field>
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

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` (clean) and `npx eslint src/components/quote/service-quote-wizard.tsx` (clean).

- [ ] **Step 3: Commit**

```bash
git add src/components/quote/service-quote-wizard.tsx
git commit -m "feat: config-driven ServiceQuoteWizard component"
```

---

### Task 7: Wire `/quote` routing, `initialMode`, and the service-page CTA

**Files:**
- Modify: `src/components/quote/quote-wizard.tsx` (add optional `initialMode` prop)
- Modify: `src/app/(site)/quote/page.tsx` (route on `?service=`)
- Modify: `src/app/(site)/services/[slug]/page.tsx` (CTA preselects the service)

- [ ] **Step 1: Add `initialMode` to `QuoteWizard`**

In `src/components/quote/quote-wizard.tsx`, change the component signature and the `mode` state initializer. Replace:

```tsx
export function QuoteWizard() {
  const [step, setStep] = useState(0);

  // Form state
  const [originCode, setOriginCode] = useState("CNSHA");
  const [destCode, setDestCode] = useState("NLRTM");
  const [mode, setMode] = useState<CargoMode>("door-to-door");
```

with:

```tsx
export function QuoteWizard({ initialMode = "door-to-door" }: { initialMode?: CargoMode }) {
  const [step, setStep] = useState(0);

  // Form state
  const [originCode, setOriginCode] = useState("CNSHA");
  const [destCode, setDestCode] = useState("NLRTM");
  const [mode, setMode] = useState<CargoMode>(initialMode);
```

(`CargoMode` is already imported in this file.)

- [ ] **Step 2: Route the `/quote` page on `?service=`**

Replace the entire contents of `src/app/(site)/quote/page.tsx` with:

```tsx
import type { Metadata } from "next";
import { QuoteWizard } from "@/components/quote/quote-wizard";
import { ServiceQuoteWizard } from "@/components/quote/service-quote-wizard";
import { getServiceQuoteConfig } from "@/lib/quote/service-fields";
import type { CargoMode } from "@/lib/quote-data";

export const metadata: Metadata = {
  title: "Get a Quote",
  description:
    "Get an AI-optimized shipping quote in seconds — compare express, balanced, and low-carbon routes with carbon estimates and instant booking.",
};

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service } = await searchParams;
  const config = service ? getServiceQuoteConfig(service) : undefined;

  if (config) {
    const heading = config.title.replace(/ quote$/i, "");
    return (
      <section className="relative pt-28 pb-20 lg:pt-32">
        <div className="bg-grid absolute inset-0 -z-10 h-96" />
        <div className="mx-auto max-w-3xl px-5 lg:px-8">
          <h1
            className="text-balance text-3xl font-semibold tracking-tight text-foam md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Request a <span className="text-gradient">{heading}</span> quote
          </h1>
          <p className="mt-2 text-mist">
            Tell us about your shipment — no payment now. Our team replies with options and pricing.
          </p>
          <ServiceQuoteWizard config={config} />
        </div>
      </section>
    );
  }

  const initialMode: CargoMode = service === "ocean-freight" ? "port-to-port" : "door-to-door";
  return <QuoteWizard initialMode={initialMode} />;
}
```

Note: plain `/quote` (no param) and `door-to-door` keep the existing `"door-to-door"` default (no behavior change); only `ocean-freight` preselects `"port-to-port"`. Both are valid `CargoMode` values used by the existing Route step.

- [ ] **Step 3: Preselect the service from the detail-page CTA**

In `src/app/(site)/services/[slug]/page.tsx`, find the hero CTA:

```tsx
                <Button href="/quote" variant="primary" size="lg">
                  Get a quote
                </Button>
```

Replace it with:

```tsx
                <Button href={`/quote?service=${s.slug}`} variant="primary" size="lg">
                  Get a quote
                </Button>
```

- [ ] **Step 4: Verify in the running app**

Run `npx tsc --noEmit` (clean), `npx eslint` on the three files (clean), `npx vitest run` (unchanged count).
With the dev server up:
- `curl -s -o NUL -w "%{http_code}\n" "http://localhost:3000/quote"` → 200 (ocean wizard)
- `curl -s -o NUL -w "%{http_code}\n" "http://localhost:3000/quote?service=air-freight"` → 200 (service wizard)
- `curl -s -o NUL -w "%{http_code}\n" "http://localhost:3000/quote?service=door-to-door"` → 200 (ocean wizard)
- `curl -s -o NUL -w "%{http_code}\n" "http://localhost:3000/quote?service=bogus"` → 200 (falls back to ocean wizard)

- [ ] **Step 5: Commit**

```bash
git add src/components/quote/quote-wizard.tsx "src/app/(site)/quote/page.tsx" "src/app/(site)/services/[slug]/page.tsx"
git commit -m "feat: service-aware /quote routing + preselected CTA"
```

---

### Task 8: Admin bookings — show the service summary

**Files:**
- Modify: `src/app/admin/(panel)/bookings/page.tsx`

- [ ] **Step 1: Update the Request column**

In `src/app/admin/(panel)/bookings/page.tsx`, find the "Request" cell:

```tsx
                  <td className="px-4 py-3 text-xs text-mist">
                    {d.sqftRequested ? `${Number(d.sqftRequested).toLocaleString()} ft²` : "—"}
                    {d.moveIn ? ` · ${String(d.moveIn)}` : ""}
                    {d.termMonths ? ` · ${String(d.termMonths)}mo` : ""}
                  </td>
```

Replace it with (service rows carry a human-readable `details.summary`; warehouse rows keep the sqft/move-in/term rendering):

```tsx
                  <td className="px-4 py-3 text-xs text-mist">
                    {typeof d.summary === "string" && d.summary ? (
                      d.summary
                    ) : (
                      <>
                        {d.sqftRequested ? `${Number(d.sqftRequested).toLocaleString()} ft²` : "—"}
                        {d.moveIn ? ` · ${String(d.moveIn)}` : ""}
                        {d.termMonths ? ` · ${String(d.termMonths)}mo` : ""}
                      </>
                    )}
                  </td>
```

- [ ] **Step 2: Verify**

Run `npx tsc --noEmit` (clean), `npx eslint "src/app/admin/(panel)/bookings/page.tsx"` (clean), `npx next build` (green).

- [ ] **Step 3: Commit**

```bash
git add "src/app/admin/(panel)/bookings/page.tsx"
git commit -m "feat: show service quote summary in admin bookings"
```

---

### Task 9: Live E2E

**Files:**
- Create: `scripts/verify-service-quotes-e2e.mjs`

- [ ] **Step 1: Write the script**

Mirrors `scripts/verify-bookings-e2e.mjs` (cookie-jar admin auth + service-role seeding). Same seeded super admin: `roberthorton2167@gmail.com` / `BlueRoute!Admin2026`.

```js
// Live E2E for service quote requests. Seeds a type='service' booking via the service role
// (mirroring submitServiceQuote's insert), verifies the authed /admin/bookings page renders it
// with its summary, and the public /quote routing (service wizard 200, bogus falls back 200).
//   node scripts/verify-service-quotes-e2e.mjs   (dev server must be up)
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
const REF = "BR-SV-99999";
const SUMMARY = "Shanghai (PVG) · Los Angeles (LAX) · Express";

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

// 1. seed a service-quote booking (shape submitServiceQuote writes)
{
  const { error } = await svc.from("bookings").insert({
    type: "service", service_slug: "air-freight", name: "E2E Tester", email: "e2e@example.com",
    phone: "+1 555", company: "E2E Co", status: "new", booking_ref: REF,
    details: { service: "Air freight quote", origin: "Shanghai (PVG)", destination: "Los Angeles (LAX)", serviceLevel: "Express", weightKg: "1200", summary: SUMMARY },
  });
  step("seed service booking row", !error, error?.message ?? REF);
}

// 2. admin auth
const { client: authed, jar } = makeJar();
{
  const { data, error } = await authed.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  step("admin sign-in", !error && !!data.session && jar.size > 0, error?.message ?? "");
}

// 3. /admin/bookings renders the row + its summary
{
  const r = await get("/admin/bookings", jar);
  step("GET /admin/bookings shows service seed", r.status === 200 && r.body.includes(REF) && r.body.includes(SUMMARY), `status=${r.status}`);
}

// 4. service filter (status=new) includes it
{
  const r = await get("/admin/bookings?status=new", jar);
  step("new filter includes the service row", r.status === 200 && r.body.includes(REF));
}

// 5. public /quote routing
{
  const ocean = await get("/quote");
  const air = await get("/quote?service=air-freight");
  const bogus = await get("/quote?service=bogus");
  step("plain /quote 200 (ocean wizard)", ocean.status === 200);
  step("/quote?service=air-freight 200 (service wizard)", air.status === 200 && air.body.includes("Shipment"));
  step("/quote?service=bogus 200 (falls back)", bogus.status === 200);
}

// cleanup
await svc.from("bookings").delete().eq("booking_ref", REF);
console.log(process.exitCode ? "\nRESULT: FAIL" : "\nRESULT: ALL GREEN");
```

- [ ] **Step 2: Run it** (dev server up)

Run: `node scripts/verify-service-quotes-e2e.mjs`
Expected: `RESULT: ALL GREEN`. (If admin sign-in fails, reseed with `node scripts/seed-admin.mjs roberthorton2167@gmail.com "BlueRoute!Admin2026"` and rerun.)

- [ ] **Step 3: Commit**

```bash
git add scripts/verify-service-quotes-e2e.mjs
git commit -m "test: live E2E for service quote requests"
```

---

### Task 10: Reconcile PLAN.md + final verification

**Files:**
- Modify: `docs/PLAN.md`

- [ ] **Step 1: Update `docs/PLAN.md`**

Mark **item 6** ✅ done (quote wizard is now service-aware: ocean/door-to-door priced wizard kept; air/land/project-cargo/cold-chain/customs get tailored request forms → `bookings` type='service' → `/admin/bookings`; service detail CTAs preselect the service; live E2E green). In "Build order (remaining)", mark step `4b` done and set the next item to **Real AI (5) + voice (16)**. Add item 6 to "Completed so far" and bump the Vitest count (now ~95).

- [ ] **Step 2: Full verification**

Run: `npx vitest run` (all green) and `npx next build` (green).

- [ ] **Step 3: Commit**

```bash
git add docs/PLAN.md
git commit -m "docs: mark service-aware quote forms (item 6) done"
```

- [ ] **Step 4: Tell Timi what to eyeball**

Visit each service detail page (e.g. `/services/air-freight`, `/services/customs`) → "Get a quote" → the preselected tailored wizard → fill the shipment + contact steps → submit → success ref (`BR-SV-…`). Then `/admin/bookings` (sign in) → the request appears with its summary in the Request column. Ocean (`/services/ocean-freight`) and door-to-door still open the live-priced wizard.
