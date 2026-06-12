# Public Tracking Rebuild + Shared RouteMap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/tracking` per mockups 14–17 on real Supabase shipment data with an animated MapLibre route line, and reuse that map in the customer portal.

**Architecture:** A public route handler `GET /api/track/[number]` reads `shipments` + `shipment_events` with the service-role client and returns a sanitized JSON payload (costs included — Timi's call). The client page shows a ~3s staged loader, then the mockup-ordered consignment report. Coordinates come from four new nullable columns (`origin_lng/lat`, `destination_lng/lat` — migration Timi pastes) filled in the admin forms via a free Open-Meteo geocode assist. A shared `RouteMap` component draws an animated great-circle trip line, also used in a portal modal.

**Tech Stack:** Next 16 route handlers (`RouteContext`, awaited params), MapLibre GL + CARTO Positron, hand-rolled Code 128B SVG barcode, Vitest, Supabase service-role server reads.

**Spec:** `docs/superpowers/specs/2026-06-12-public-tracking-routemap-design.md`

**Engineering notes for the executor:**
- This is **Next 16** — route handler `params` is a Promise; use the global `RouteContext<'/api/track/[number]'>` helper (see `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`).
- maplibre has **no default export**: `import * as maplibregl from "maplibre-gl"`.
- eslint purity rule bans `Date.now()` in RSC bodies — all new pages here are client components or route handlers, which are fine.
- Vitest mocks must use `vi.hoisted()` (see existing tests).
- Run all tests with `npx vitest run` (54 currently pass).

---

### Task 1: Schema migration file + coordinate validation

**Files:**
- Create: `supabase/tracking-migration.sql`
- Modify: `src/lib/admin/shipment-validate.ts`
- Test: `src/lib/admin/shipment-validate.test.ts` (extend existing)

- [ ] **Step 1: Write the migration SQL**

```sql
-- Blue Route — tracking page coordinates (run in the Supabase SQL editor).
-- Adds origin/destination coordinates used by the public tracking map.
alter table public.shipments
  add column if not exists origin_lng numeric,
  add column if not exists origin_lat numeric,
  add column if not exists destination_lng numeric,
  add column if not exists destination_lat numeric;
```

Save as `supabase/tracking-migration.sql`. (Timi pastes this in the SQL editor — the live E2E in Task 12 checks the columns exist and stops with instructions if not.)

- [ ] **Step 2: Write failing tests for coordinate validation**

Append to the existing `src/lib/admin/shipment-validate.test.ts`:

```ts
describe("coordinates", () => {
  const base = {
    receiver_name: "R",
    sender_name: "S",
    origin: "Hamburg",
    destination: "Phnom Penh",
  };

  it("accepts a full valid coordinate set", () => {
    const res = validateShipmentInput({
      ...base,
      origin_lng: "9.99",
      origin_lat: "53.55",
      destination_lng: "104.92",
      destination_lat: "11.56",
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.origin_lng).toBeCloseTo(9.99);
      expect(res.data.destination_lat).toBeCloseTo(11.56);
    }
  });

  it("treats empty coords as null", () => {
    const res = validateShipmentInput(base);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.origin_lng).toBeNull();
      expect(res.data.destination_lat).toBeNull();
    }
  });

  it("rejects a lng without its lat", () => {
    const res = validateShipmentInput({ ...base, origin_lng: "9.99" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.origin_lat).toBeTruthy();
  });

  it("rejects out-of-range values", () => {
    const res = validateShipmentInput({
      ...base,
      origin_lng: "200",
      origin_lat: "10",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.origin_lng).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/lib/admin/shipment-validate.test.ts`
Expected: FAIL — `origin_lng` not on the result type / values undefined.

- [ ] **Step 4: Implement coordinate validation**

In `src/lib/admin/shipment-validate.ts`, add to `ShipmentInput` (after `current_city`):

```ts
  origin_lng: number | null;
  origin_lat: number | null;
  destination_lng: number | null;
  destination_lat: number | null;
```

Add helper below `optNum`:

```ts
function optCoord(
  raw: Raw,
  key: string,
  errors: Record<string, string>,
  min: number,
  max: number,
): number | null {
  const s = str(raw, key);
  if (s === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < min || n > max) {
    errors[key] = `Must be a number between ${min} and ${max}.`;
    return null;
  }
  return n;
}
```

In `validateShipmentInput`, before the `if (Object.keys(errors).length)` check:

```ts
  const origin_lng = optCoord(raw, "origin_lng", errors, -180, 180);
  const origin_lat = optCoord(raw, "origin_lat", errors, -90, 90);
  const destination_lng = optCoord(raw, "destination_lng", errors, -180, 180);
  const destination_lat = optCoord(raw, "destination_lat", errors, -90, 90);
  for (const [a, b] of [
    ["origin_lng", "origin_lat"],
    ["destination_lng", "destination_lat"],
  ] as const) {
    const hasA = str(raw, a) !== "";
    const hasB = str(raw, b) !== "";
    if (hasA !== hasB) {
      errors[hasA ? b : a] = "Both longitude and latitude are required.";
    }
  }
```

And add the four fields to the returned `data` object (after `current_city`):

```ts
      origin_lng,
      origin_lat,
      destination_lng,
      destination_lat,
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/admin/shipment-validate.test.ts`
Expected: PASS (all, including pre-existing).

- [ ] **Step 6: Confirm the actions insert/update picks the new fields up**

Read `src/app/actions/shipments.ts` `createShipment`/`updateShipment`. If they spread the validated `data` into the Supabase insert/update (`...res.data`), nothing to change. If they list fields explicitly, add the four new fields to both lists.

- [ ] **Step 7: Commit**

```bash
git add supabase/tracking-migration.sql src/lib/admin/shipment-validate.ts src/lib/admin/shipment-validate.test.ts src/app/actions/shipments.ts
git commit -m "feat: shipment origin/destination coordinates (migration + validation)"
```

---

### Task 2: Great-circle route math in `src/lib/map.ts`

**Files:**
- Modify: `src/lib/map.ts`
- Test: `src/lib/map.test.ts` (extend existing)

`src/lib/map.ts` currently imports `LngLat` from `@/lib/tracking-data` (which Task 11 deletes) — move the type here.

- [ ] **Step 1: Write failing tests**

Append to `src/lib/map.test.ts`:

```ts
import { greatCircle, buildTripPath } from "@/lib/map";

describe("greatCircle", () => {
  it("interpolates along the equator", () => {
    const pts = greatCircle([0, 0], [90, 0], 4);
    expect(pts).toHaveLength(5);
    expect(pts[0]).toEqual([0, 0]);
    expect(pts[2][0]).toBeCloseTo(45, 5);
    expect(pts[2][1]).toBeCloseTo(0, 5);
    expect(pts[4][0]).toBeCloseTo(90, 5);
  });

  it("unwraps longitudes across the antimeridian", () => {
    const pts = greatCircle([170, 10], [-170, 10], 8);
    // continuous: end lng should be ~190, not -170
    expect(pts[pts.length - 1][0]).toBeCloseTo(190, 3);
    for (let i = 1; i < pts.length; i++) {
      expect(Math.abs(pts[i][0] - pts[i - 1][0])).toBeLessThan(90);
    }
  });

  it("handles identical points", () => {
    const pts = greatCircle([5, 5], [5, 5], 4);
    expect(pts.every(([lng, lat]) => lng === 5 && lat === 5)).toBe(true);
  });
});

describe("buildTripPath", () => {
  const origin: [number, number] = [0, 0];
  const dest: [number, number] = [90, 0];

  it("splits at the current position when provided", () => {
    const { traveled, remaining } = buildTripPath(origin, dest, [45, 0], 50);
    expect(traveled[0]).toEqual([0, 0]);
    expect(traveled[traveled.length - 1][0]).toBeCloseTo(45, 5);
    expect(remaining[0][0]).toBeCloseTo(45, 5);
    expect(remaining[remaining.length - 1][0]).toBeCloseTo(90, 5);
  });

  it("splits by percentage when no current position", () => {
    const { traveled, remaining } = buildTripPath(origin, dest, null, 25);
    const last = traveled[traveled.length - 1];
    expect(last[0]).toBeGreaterThan(15);
    expect(last[0]).toBeLessThan(35);
    expect(remaining[0]).toEqual(last); // segments join
  });

  it("returns empty traveled at 0% and full at 100%", () => {
    expect(buildTripPath(origin, dest, null, 0).traveled.length).toBeLessThanOrEqual(1);
    const done = buildTripPath(origin, dest, null, 100);
    expect(done.remaining.length).toBeLessThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/map.test.ts`
Expected: FAIL — `greatCircle`/`buildTripPath` not exported.

- [ ] **Step 3: Implement**

Replace the `LngLat` import in `src/lib/map.ts` with a local export and add the functions:

```ts
export type LngLat = [number, number];

/** Spherical linear interpolation between two lng/lat points (great circle). */
export function greatCircle(a: LngLat, b: LngLat, steps = 64): LngLat[] {
  const rad = Math.PI / 180;
  const [λ1, φ1] = [a[0] * rad, a[1] * rad];
  const [λ2, φ2] = [b[0] * rad, b[1] * rad];
  const toVec = (λ: number, φ: number) => [
    Math.cos(φ) * Math.cos(λ),
    Math.cos(φ) * Math.sin(λ),
    Math.sin(φ),
  ];
  const v1 = toVec(λ1, φ1);
  const v2 = toVec(λ2, φ2);
  const dot = Math.min(1, Math.max(-1, v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]));
  const ω = Math.acos(dot);

  const pts: LngLat[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let p: number[];
    if (ω < 1e-9) {
      p = v1;
    } else {
      const s1 = Math.sin((1 - t) * ω) / Math.sin(ω);
      const s2 = Math.sin(t * ω) / Math.sin(ω);
      p = [
        s1 * v1[0] + s2 * v2[0],
        s1 * v1[1] + s2 * v2[1],
        s1 * v1[2] + s2 * v2[2],
      ];
    }
    const lat = Math.atan2(p[2], Math.hypot(p[0], p[1])) / rad;
    const lng = Math.atan2(p[1], p[0]) / rad;
    pts.push([lng, lat]);
  }
  // Unwrap longitudes so the line never jumps across the antimeridian.
  for (let i = 1; i < pts.length; i++) {
    while (pts[i][0] - pts[i - 1][0] > 180) pts[i][0] -= 360;
    while (pts[i][0] - pts[i - 1][0] < -180) pts[i][0] += 360;
  }
  return pts;
}

/**
 * Build the traveled/remaining trip segments. Routes through `current` when
 * known; otherwise splits the direct arc at `progressPct`. Segments share
 * their joining point so the drawn lines connect.
 */
export function buildTripPath(
  origin: LngLat,
  destination: LngLat,
  current: LngLat | null,
  progressPct: number,
): { traveled: LngLat[]; remaining: LngLat[] } {
  if (current) {
    return {
      traveled: greatCircle(origin, current),
      remaining: greatCircle(current, destination),
    };
  }
  const route = greatCircle(origin, destination);
  const pct = Math.min(100, Math.max(0, progressPct));
  const cut = Math.round((route.length - 1) * (pct / 100));
  return {
    traveled: route.slice(0, cut + 1),
    remaining: route.slice(cut),
  };
}
```

Keep `BASEMAP_STYLE` and `splitRouteAtVessel` as-is for now (Task 11 removes `splitRouteAtVessel` with its callers).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/map.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/map.ts src/lib/map.test.ts
git commit -m "feat: great-circle trip path math for the route map"
```

---

### Task 3: Code 128B barcode generator

**Files:**
- Create: `src/lib/barcode.ts`
- Create: `src/components/ui/barcode.tsx`
- Test: `src/lib/barcode.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/lib/barcode.test.ts
import { describe, expect, it } from "vitest";
import { code128Checksum, code128Bars } from "@/lib/barcode";

describe("code128Checksum", () => {
  it("computes the documented value for BRL (start B)", () => {
    // start 104 + B(34)*1 + R(50)*2 + L(44)*3 = 370; 370 % 103 = 61
    expect(code128Checksum("BRL")).toBe(61);
  });
});

describe("code128Bars", () => {
  it("returns alternating bar/space widths with quiet structure", () => {
    const bars = code128Bars("BRL-12345678");
    // start(6) + 12 chars * 6 + checksum(6) + stop(7)
    expect(bars).toHaveLength(6 + 12 * 6 + 6 + 7);
    expect(bars.every((w) => w >= 1 && w <= 4)).toBe(true);
  });

  it("throws on non-ASCII input", () => {
    expect(() => code128Bars("BRl-€")).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/barcode.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/barcode.ts`**

```ts
// Code 128 (code set B) — pure, dependency-free. Bars/spaces are emitted as
// alternating module widths starting with a bar.

const PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213",
  "122312", "132212", "221213", "221312", "231212", "112232", "122132",
  "122231", "113222", "123122", "123221", "223211", "221132", "221231",
  "213212", "223112", "312131", "311222", "321122", "321221", "312212",
  "322112", "322211", "212123", "212321", "232121", "111323", "131123",
  "131321", "112313", "132113", "132311", "211313", "231113", "231311",
  "112133", "112331", "132131", "113123", "113321", "133121", "313121",
  "211331", "231131", "213113", "213311", "213131", "311123", "311321",
  "331121", "312113", "312311", "332111", "314111", "221411", "431111",
  "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114",
  "413111", "241112", "134111", "111242", "121142", "121241", "114212",
  "124112", "124211", "411212", "421112", "421211", "212141", "214121",
  "412121", "111143", "111341", "131141", "114113", "114311", "411113",
  "411311", "113141", "114131", "311141", "411131", "211412", "211214",
  "211232",
];
const STOP = "2331112";
const START_B = 104;

function valueOf(ch: string): number {
  const code = ch.charCodeAt(0);
  if (code < 32 || code > 126) {
    throw new Error(`Character not encodable in Code 128B: "${ch}"`);
  }
  return code - 32;
}

/** Modulo-103 checksum for a code-set-B encoding of `text`. */
export function code128Checksum(text: string): number {
  let sum = START_B;
  [...text].forEach((ch, i) => {
    sum += valueOf(ch) * (i + 1);
  });
  return sum % 103;
}

/** Alternating bar/space module widths (starting with a bar). */
export function code128Bars(text: string): number[] {
  if (!text) throw new Error("Empty barcode text.");
  const codes = [START_B, ...[...text].map(valueOf), code128Checksum(text)];
  const digits = codes.map((c) => PATTERNS[c]).join("") + STOP;
  return [...digits].map(Number);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/barcode.test.ts`
Expected: PASS.

- [ ] **Step 5: Create the SVG component `src/components/ui/barcode.tsx`**

```tsx
import { code128Bars } from "@/lib/barcode";

/** Crisp SVG Code 128 barcode with the value printed underneath. */
export function Barcode({
  value,
  height = 64,
  moduleWidth = 2,
}: {
  value: string;
  height?: number;
  moduleWidth?: number;
}) {
  const bars = code128Bars(value);
  const totalModules = bars.reduce((a, b) => a + b, 0);
  const quiet = 10; // quiet zone, modules
  const width = (totalModules + quiet * 2) * moduleWidth;

  let x = quiet * moduleWidth;
  const rects: { x: number; w: number }[] = [];
  bars.forEach((w, i) => {
    const wpx = w * moduleWidth;
    if (i % 2 === 0) rects.push({ x, w: wpx }); // even indices are bars
    x += wpx;
  });

  return (
    <figure className="inline-flex flex-col items-center" aria-label={`Barcode ${value}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        className="max-w-full"
        shapeRendering="crispEdges"
      >
        <rect width={width} height={height} fill="#ffffff" />
        {rects.map((r, i) => (
          <rect key={i} x={r.x} y={0} width={r.w} height={height} fill="#0b1b2b" />
        ))}
      </svg>
      <figcaption className="mt-2 font-mono text-sm tracking-[0.35em] text-foam">
        {value}
      </figcaption>
    </figure>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/barcode.ts src/lib/barcode.test.ts src/components/ui/barcode.tsx
git commit -m "feat: dependency-free Code 128B barcode (lib + SVG component)"
```

---

### Task 4: Track payload builder + public rate limit

**Files:**
- Create: `src/lib/tracking/payload.ts`
- Modify: `src/lib/ai/rate-limit.ts` (parametrize the limit)
- Test: `src/lib/tracking/payload.test.ts`, `src/lib/ai/rate-limit.test.ts` (extend)

- [ ] **Step 1: Write failing tests**

```ts
// src/lib/tracking/payload.test.ts
import { describe, expect, it } from "vitest";
import { buildTrackPayload } from "@/lib/tracking/payload";

const shipment = {
  id: "secret-uuid",
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-02T00:00:00Z",
  tracking_number: "BRL-12345678",
  receiver_name: "Graham Buckley",
  receiver_email: "g@example.com",
  receiver_phone: "+1 805",
  receiver_address: "Ridgeway Drive",
  receiver_country: "United States",
  sender_name: "Liebherr",
  sender_email: "info@example.com",
  sender_phone: "+49",
  sender_address: "Biberach",
  sender_country: "Germany",
  origin: "Hamburg port, Germany",
  destination: "Phnom Penh, Cambodia",
  freight_type: "Sea Freight",
  content_type: "Container",
  weight_kg: 150961.43,
  qty: 1,
  description: "Crane parts",
  status: "On Hold",
  date_shipped: "2026-05-12",
  expected_delivery: "2026-06-30",
  current_location: "Varna port, Varna",
  current_city: "Varna",
  current_lng: 27.91,
  current_lat: 43.2,
  origin_lng: 9.99,
  origin_lat: 53.55,
  destination_lng: 104.92,
  destination_lat: 11.56,
  shipment_cost: 25000,
  clearance_cost: 1200,
  delivery_pct: 59,
  photo_url: null,
  notice: "Urgent attention needed",
};

const events = [
  { id: "e1", shipment_id: "secret-uuid", created_at: "x", occurred_at: "2026-05-20T10:00:00Z", status: "On route", location: "Mersin port", country: "Turkey", comment: "Departed" },
  { id: "e2", shipment_id: "secret-uuid", created_at: "x", occurred_at: "2026-06-07T10:25:00Z", status: "On Hold", location: "Varna port", country: "Bulgaria", comment: "Hold" },
];

describe("buildTrackPayload", () => {
  it("includes consignment, parties, costs, notice, and map points", () => {
    const p = buildTrackPayload(shipment, events);
    expect(p.consignment.trackingNumber).toBe("BRL-12345678");
    expect(p.consignment.shipmentCost).toBe(25000);
    expect(p.receiver.name).toBe("Graham Buckley");
    expect(p.map.origin).toEqual({ name: "Hamburg port, Germany", lng: 9.99, lat: 53.55 });
    expect(p.map.current).toEqual({ name: "Varna", lng: 27.91, lat: 43.2 });
    expect(p.notice).toBe("Urgent attention needed");
  });

  it("never leaks internal ids", () => {
    const json = JSON.stringify(buildTrackPayload(shipment, events));
    expect(json).not.toContain("secret-uuid");
  });

  it("sorts events newest first", () => {
    const p = buildTrackPayload(shipment, events);
    expect(p.events[0].status).toBe("On Hold");
    expect(p.events[1].location).toBe("Mersin port");
  });

  it("yields null map points when coords are missing", () => {
    const p = buildTrackPayload(
      { ...shipment, origin_lng: null, origin_lat: null, current_lng: null, current_lat: null },
      [],
    );
    expect(p.map.origin).toBeNull();
    expect(p.map.current).toBeNull();
    expect(p.map.destination).not.toBeNull();
  });
});
```

And in `src/lib/ai/rate-limit.test.ts`, add:

```ts
it("honors a custom limit", () => {
  __resetRateLimit();
  for (let i = 0; i < 20; i++) expect(checkRateLimit("k20", 1000, 20)).toBe(true);
  expect(checkRateLimit("k20", 1000, 20)).toBe(false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/tracking/payload.test.ts src/lib/ai/rate-limit.test.ts`
Expected: FAIL — module not found / wrong arity.

- [ ] **Step 3: Implement**

Parametrize `src/lib/ai/rate-limit.ts`:

```ts
const WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 8;
const hits = new Map<string, number[]>();

/** Sliding-window limiter. Returns true if the call is allowed. */
export function checkRateLimit(
  key: string,
  now: number = Date.now(),
  limit: number = DEFAULT_LIMIT,
): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

/** Test-only: clears all tracked keys. */
export function __resetRateLimit(): void {
  hits.clear();
}
```

Create `src/lib/tracking/payload.ts`:

```ts
// Pure builder for the public /api/track payload. Internal ids and admin-only
// fields stay out; costs are intentionally public (product decision).

export type TrackPoint = { name: string; lng: number; lat: number };

export type TrackEvent = {
  status: string;
  location: string;
  country: string | null;
  occurredAt: string;
  comment: string | null;
};

export type TrackPayload = {
  consignment: {
    trackingNumber: string;
    status: string;
    freightType: string;
    contentType: string | null;
    weightKg: number | null;
    qty: number | null;
    description: string | null;
    deliveryPct: number;
    dateShipped: string | null;
    expectedDelivery: string | null;
    shipmentCost: number | null;
    clearanceCost: number | null;
    origin: string;
    destination: string;
    currentLocation: string | null;
    photoUrl: string | null;
  };
  receiver: Party;
  sender: Party;
  map: {
    origin: TrackPoint | null;
    destination: TrackPoint | null;
    current: TrackPoint | null;
  };
  notice: string | null;
  events: TrackEvent[];
};

type Party = {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  country: string | null;
};

type ShipmentRow = Record<string, unknown>;
type EventRow = {
  occurred_at: string;
  status: string;
  location: string;
  country: string | null;
  comment: string | null;
};

const s = (r: ShipmentRow, k: string) => (r[k] as string | null) ?? null;
const n = (r: ShipmentRow, k: string) => {
  const v = r[k];
  return typeof v === "number" ? v : v == null ? null : Number(v);
};

function point(r: ShipmentRow, name: string | null, lngKey: string, latKey: string): TrackPoint | null {
  const lng = n(r, lngKey);
  const lat = n(r, latKey);
  if (lng == null || lat == null || !name) return null;
  return { name, lng, lat };
}

export function buildTrackPayload(shipment: ShipmentRow, events: EventRow[]): TrackPayload {
  return {
    consignment: {
      trackingNumber: s(shipment, "tracking_number") ?? "",
      status: s(shipment, "status") ?? "Pending",
      freightType: s(shipment, "freight_type") ?? "Sea Freight",
      contentType: s(shipment, "content_type"),
      weightKg: n(shipment, "weight_kg"),
      qty: n(shipment, "qty"),
      description: s(shipment, "description"),
      deliveryPct: n(shipment, "delivery_pct") ?? 0,
      dateShipped: s(shipment, "date_shipped"),
      expectedDelivery: s(shipment, "expected_delivery"),
      shipmentCost: n(shipment, "shipment_cost"),
      clearanceCost: n(shipment, "clearance_cost"),
      origin: s(shipment, "origin") ?? "",
      destination: s(shipment, "destination") ?? "",
      currentLocation: s(shipment, "current_location"),
      photoUrl: s(shipment, "photo_url"),
    },
    receiver: {
      name: s(shipment, "receiver_name") ?? "",
      email: s(shipment, "receiver_email"),
      phone: s(shipment, "receiver_phone"),
      address: s(shipment, "receiver_address"),
      country: s(shipment, "receiver_country"),
    },
    sender: {
      name: s(shipment, "sender_name") ?? "",
      email: s(shipment, "sender_email"),
      phone: s(shipment, "sender_phone"),
      address: s(shipment, "sender_address"),
      country: s(shipment, "sender_country"),
    },
    map: {
      origin: point(shipment, s(shipment, "origin"), "origin_lng", "origin_lat"),
      destination: point(shipment, s(shipment, "destination"), "destination_lng", "destination_lat"),
      current: point(
        shipment,
        s(shipment, "current_city") ?? s(shipment, "current_location"),
        "current_lng",
        "current_lat",
      ),
    },
    notice: s(shipment, "notice"),
    events: [...events]
      .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
      .map((e) => ({
        status: e.status,
        location: e.location,
        country: e.country,
        occurredAt: e.occurred_at,
        comment: e.comment,
      })),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run`
Expected: ALL pass (existing 54 + new).

- [ ] **Step 5: Commit**

```bash
git add src/lib/tracking/payload.ts src/lib/tracking/payload.test.ts src/lib/ai/rate-limit.ts src/lib/ai/rate-limit.test.ts
git commit -m "feat: public track payload builder; parametrize rate limit"
```

---

### Task 5: Public API route `GET /api/track/[number]`

**Files:**
- Create: `src/app/api/track/[number]/route.ts`

- [ ] **Step 1: Implement the route handler**

```ts
import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { buildTrackPayload } from "@/lib/tracking/payload";
import { checkRateLimit } from "@/lib/ai/rate-limit";

export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/track/[number]">,
) {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (!checkRateLimit(`track:${ip}`, Date.now(), 20)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  const { number } = await ctx.params;
  const trackingNumber = decodeURIComponent(number).trim();
  if (!trackingNumber || trackingNumber.length > 40) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  const { data: shipment, error } = await supabase
    .from("shipments")
    .select("*")
    .ilike("tracking_number", trackingNumber) // no wildcards => case-insensitive exact
    .maybeSingle();
  if (error || !shipment) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const { data: events } = await supabase
    .from("shipment_events")
    .select("occurred_at,status,location,country,comment")
    .eq("shipment_id", shipment.id)
    .order("occurred_at", { ascending: false });

  return Response.json(buildTrackPayload(shipment, events ?? []));
}
```

- [ ] **Step 2: Smoke-check against the dev server**

Run (dev server up): `curl -s http://localhost:3000/api/track/NOPE-123`
Expected: `{"error":"not_found"}` with status 404. (No shipments exist yet — full positive-path check happens in the Task 12 E2E.)

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/track/[number]/route.ts"
git commit -m "feat: public tracking API route"
```

---

### Task 6: Geocode assist helper

**Files:**
- Create: `src/lib/geocode.ts`
- Test: `src/lib/geocode.test.ts`

- [ ] **Step 1: Write failing tests** (mock `fetch` with `vi.hoisted` pattern not needed — plain `vi.stubGlobal`)

```ts
// src/lib/geocode.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { geocodeCity } from "@/lib/geocode";

afterEach(() => vi.unstubAllGlobals());

describe("geocodeCity", () => {
  it("returns the first hit's coordinates", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ longitude: 9.99, latitude: 53.55 }] }),
    }));
    expect(await geocodeCity("Hamburg")).toEqual({ lng: 9.99, lat: 53.55 });
  });

  it("returns null on no results or network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
    expect(await geocodeCity("Xyzzy")).toBeNull();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await geocodeCity("Hamburg")).toBeNull();
  });

  it("strips trailing country qualifiers for better hits", async () => {
    const spy = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", spy);
    await geocodeCity("Hamburg port, Germany");
    expect(String(spy.mock.calls[0][0])).toContain(encodeURIComponent("Hamburg port"));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/geocode.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/geocode.ts`**

```ts
// Free, no-key geocoding via Open-Meteo. Used by the admin "Find coordinates"
// assist (client-side); never on the public request path.

export async function geocodeCity(
  name: string,
): Promise<{ lng: number; lat: number } | null> {
  const query = name.split(",")[0].trim();
  if (!query) return null;
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      results?: { longitude: number; latitude: number }[];
    };
    const hit = json.results?.[0];
    return hit ? { lng: hit.longitude, lat: hit.latitude } : null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/geocode.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/geocode.ts src/lib/geocode.test.ts
git commit -m "feat: open-meteo geocode helper for the admin coordinate assist"
```

---

### Task 7: Coordinate fields in the admin editor + wizard

**Files:**
- Create: `src/components/admin/coord-fields.tsx`
- Modify: `src/components/admin/shipment-editor.tsx` (Shipping section + `ShipmentRecord` type)
- Modify: `src/components/admin/shipment-wizard.tsx` (Shipping step)

- [ ] **Step 1: Create `src/components/admin/coord-fields.tsx`**

A self-contained client pair of inputs (with `name` attributes so the editor's
FormData picks them up) plus a lookup button:

```tsx
"use client";

import { useState } from "react";
import { LocateFixed, Loader2 } from "lucide-react";
import { geocodeCity } from "@/lib/geocode";

const inputCls =
  "w-full rounded-2xl border border-steel bg-deep px-3.5 py-2.5 text-sm text-foam outline-none focus:border-cyan placeholder:text-mist/60";

/**
 * Lng/lat input pair with a "Find coordinates" assist that geocodes the
 * related place text (free Open-Meteo lookup) and fills both fields.
 */
export function CoordFields({
  prefix,
  label,
  getQuery,
  defaultLng,
  defaultLat,
  error,
  onChange,
}: {
  prefix: "origin" | "destination";
  label: string;
  getQuery: () => string;
  defaultLng?: number | null;
  defaultLat?: number | null;
  error?: string;
  onChange?: (lng: string, lat: string) => void;
}) {
  const [lng, setLng] = useState(defaultLng?.toString() ?? "");
  const [lat, setLat] = useState(defaultLat?.toString() ?? "");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function lookup() {
    const q = getQuery();
    if (!q) {
      setNote("Type the place name first.");
      return;
    }
    setBusy(true);
    setNote(null);
    const hit = await geocodeCity(q);
    setBusy(false);
    if (!hit) {
      setNote("No match found — enter coordinates manually.");
      return;
    }
    const lngS = hit.lng.toFixed(4);
    const latS = hit.lat.toFixed(4);
    setLng(lngS);
    setLat(latS);
    onChange?.(lngS, latS);
  }

  return (
    <div className="md:col-span-2">
      <div className="flex items-end justify-between gap-3">
        <span className="text-sm font-medium text-foam">{label}</span>
        <button
          type="button"
          onClick={lookup}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full border border-steel px-3 py-1.5 text-xs font-semibold text-cyan hover:border-cyan/50 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
          Find coordinates
        </button>
      </div>
      <div className="mt-1.5 grid gap-4 md:grid-cols-2">
        <input
          name={`${prefix}_lng`}
          value={lng}
          onChange={(e) => {
            setLng(e.target.value);
            onChange?.(e.target.value, lat);
          }}
          placeholder="Longitude"
          inputMode="decimal"
          className={inputCls}
        />
        <input
          name={`${prefix}_lat`}
          value={lat}
          onChange={(e) => {
            setLat(e.target.value);
            onChange?.(lng, e.target.value);
          }}
          placeholder="Latitude"
          inputMode="decimal"
          className={inputCls}
        />
      </div>
      {(note || error) && (
        <span className="mt-1 block text-xs text-rose">{error ?? note}</span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire into the editor**

In `src/components/admin/shipment-editor.tsx`:
- Add to `ShipmentRecord` (after `current_city`): `origin_lng: number | null; origin_lat: number | null; destination_lng: number | null; destination_lat: number | null;`
- The origin/destination inputs are uncontrolled; give them refs so the assist can read current text:

```tsx
const originRef = useRef<HTMLInputElement>(null);
const destinationRef = useRef<HTMLInputElement>(null);
```

(add `useRef` to the React import), attach `ref={originRef}` / `ref={destinationRef}` to the two inputs, and append inside the "Shipping" section grid after "Expected delivery":

```tsx
<CoordFields
  prefix="origin"
  label="Origin coordinates (public tracking map)"
  getQuery={() => originRef.current?.value ?? ""}
  defaultLng={shipment.origin_lng}
  defaultLat={shipment.origin_lat}
  error={errors.origin_lng ?? errors.origin_lat}
/>
<CoordFields
  prefix="destination"
  label="Destination coordinates (public tracking map)"
  getQuery={() => destinationRef.current?.value ?? ""}
  defaultLng={shipment.destination_lng}
  defaultLat={shipment.destination_lat}
  error={errors.destination_lng ?? errors.destination_lat}
/>
```

with `import { CoordFields } from "./coord-fields";`.

- [ ] **Step 3: Wire into the wizard**

In `src/components/admin/shipment-wizard.tsx`: add `origin_lng: "", origin_lat: "", destination_lng: "", destination_lat: ""` to the initial values object (near `origin: ""`), then in the Shipping step (step index 2) after the destination input add:

```tsx
<CoordFields
  prefix="origin"
  label="Origin coordinates (public tracking map)"
  getQuery={() => values.origin}
  onChange={(lng, lat) => setMany({ origin_lng: lng, origin_lat: lat })}
/>
<CoordFields
  prefix="destination"
  label="Destination coordinates (public tracking map)"
  getQuery={() => values.destination}
  onChange={(lng, lat) => setMany({ destination_lng: lng, destination_lat: lat })}
/>
```

If the wizard has no `setMany`, add one next to its `set` helper:
`const setMany = (patch: Record<string, string>) => setValues((v) => ({ ...v, ...patch }));`
(match the wizard's actual state setter name). The wizard submits via FormData
built from `values` — confirm the four keys are included (if it builds FormData
from an explicit field list, add them).

- [ ] **Step 4: Verify in the running app**

With the dev server up, open `http://localhost:3000/admin/shipments/new`, go to
the Shipping step, type "Hamburg" as origin, click **Find coordinates** →
inputs fill with ~9.99 / 53.55.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/coord-fields.tsx src/components/admin/shipment-editor.tsx src/components/admin/shipment-wizard.tsx
git commit -m "feat: admin coordinate fields with geocode assist"
```

---

### Task 8: Shared `RouteMap` component

**Files:**
- Create: `src/components/ui/route-map.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { BASEMAP_STYLE, buildTripPath, type LngLat } from "@/lib/map";

export type RoutePoint = { name: string; lng: number; lat: number };

/**
 * Animated trip map: great-circle line origin→destination, the traveled
 * segment draws itself in, pulsing marker at the current position.
 * Degrades to a single-pin map (current only) or a styled placeholder.
 */
export function RouteMap({
  origin,
  destination,
  current,
  progressPct,
  className = "h-[420px]",
}: {
  origin: RoutePoint | null;
  destination: RoutePoint | null;
  current: RoutePoint | null;
  progressPct: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);

  const hasRoute = Boolean(origin && destination);
  const hasAnything = hasRoute || Boolean(current);

  useEffect(() => {
    if (!hasAnything || !containerRef.current || mapRef.current) return;

    const center: LngLat = current
      ? [current.lng, current.lat]
      : [origin!.lng, origin!.lat];

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLE,
      center,
      zoom: hasRoute ? 2 : 8,
      attributionControl: { compact: true },
      cooperativeGestures: true,
    });
    mapRef.current = map;
    let raf = 0;

    map.on("load", () => {
      setReady(true);

      const addMarker = (p: RoutePoint, cls: string) => {
        const el = document.createElement("div");
        el.className = cls;
        el.title = p.name;
        new maplibregl.Marker({ element: el })
          .setLngLat([p.lng, p.lat])
          .setPopup(
            new maplibregl.Popup({ offset: 14, closeButton: false }).setHTML(
              `<strong>${p.name}</strong>`,
            ),
          )
          .addTo(map);
      };

      if (origin) addMarker(origin, "br-port-marker");
      if (destination) addMarker(destination, "br-port-marker");
      if (current) addMarker(current, "br-vessel-marker");

      if (hasRoute) {
        const { traveled, remaining } = buildTripPath(
          [origin!.lng, origin!.lat],
          [destination!.lng, destination!.lat],
          current ? [current.lng, current.lat] : null,
          progressPct,
        );

        map.addSource("remaining", { type: "geojson", data: line(remaining) });
        map.addLayer({
          id: "remaining",
          type: "line",
          source: "remaining",
          paint: {
            "line-color": "#5b8cff",
            "line-width": 2.5,
            "line-opacity": 0.5,
            "line-dasharray": [1, 2],
          },
        });

        map.addSource("traveled", { type: "geojson", data: line([traveled[0] ?? [0, 0]]) });
        map.addLayer({
          id: "traveled",
          type: "line",
          source: "traveled",
          paint: { "line-color": "#1e5bff", "line-width": 3 },
        });

        // Animate the traveled segment drawing in (~1.8s, respects reduced motion).
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const src = map.getSource("traveled") as maplibregl.GeoJSONSource;
        if (reduced || traveled.length < 2) {
          src.setData(line(traveled));
        } else {
          const t0 = performance.now();
          const DURATION = 1800;
          const tick = (t: number) => {
            const f = Math.min(1, (t - t0) / DURATION);
            const count = Math.max(1, Math.round(traveled.length * f));
            src.setData(line(traveled.slice(0, count)));
            if (f < 1) raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        }

        const all = [...traveled, ...remaining];
        const bounds = all.reduce(
          (b, c) => b.extend(c),
          new maplibregl.LngLatBounds(all[0], all[0]),
        );
        map.fitBounds(bounds, { padding: 70, duration: 0 });
      }
    });

    return () => {
      cancelAnimationFrame(raf);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin?.lng, origin?.lat, destination?.lng, destination?.lat, current?.lng, current?.lat, progressPct]);

  if (!hasAnything) {
    return (
      <div className={`grid place-items-center rounded-[1.35rem] border border-steel/70 bg-navy ${className}`}>
        <p className="px-6 text-center text-sm text-mist">
          Route map appears once the shipment&apos;s coordinates are set.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative w-full overflow-hidden rounded-[1.35rem] ${className}`}>
      <div ref={containerRef} className="h-full w-full" />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-abyss/60">
          <span className="text-sm text-mist">Loading map…</span>
        </div>
      )}
      {hasRoute && (
        <div className="glass pointer-events-none absolute bottom-3 left-3 flex items-center gap-4 rounded-xl px-3 py-2 text-xs text-mist">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded bg-cyan" /> Traveled
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded bg-aqua/50" /> Remaining
          </span>
        </div>
      )}
    </div>
  );
}

function line(coords: LngLat[]): GeoJSON.Feature {
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "LineString", coordinates: coords },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/route-map.tsx
git commit -m "feat: shared animated RouteMap component"
```

---

### Task 9: Rebuild the public tracking page

**Files:**
- Create: `src/components/tracking/tracking-result.tsx`
- Create: `src/components/tracking/tracking-loader.tsx`
- Rewrite: `src/components/tracking/tracking-experience.tsx`
- Modify: `src/app/(site)/tracking/page.tsx` (metadata copy)
- Modify: `src/app/globals.css` (print rules)

- [ ] **Step 1: Create `src/components/tracking/tracking-loader.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2, Check } from "lucide-react";

const STAGES = [
  "Locating consignment…",
  "Retrieving tracking log…",
  "Compiling report…",
];

/** Staged ~3s progress animation shown after the Track button is pressed. */
export function TrackingLoader() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 1000),
      setTimeout(() => setStage(2), 2000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="mx-auto mt-14 max-w-sm rounded-3xl border border-steel/70 bg-deep p-8 shadow-soft">
      <ul className="space-y-4">
        {STAGES.map((label, i) => (
          <li key={label} className="flex items-center gap-3 text-sm">
            {i < stage ? (
              <Check className="h-4 w-4 shrink-0 text-emerald" />
            ) : i === stage ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-cyan" />
            ) : (
              <span className="h-4 w-4 shrink-0 rounded-full border border-steel" />
            )}
            <span className={i <= stage ? "text-foam" : "text-mist/60"}>{label}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-steel/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan to-indigo transition-[width] duration-1000 ease-out"
          style={{ width: `${((stage + 1) / 3) * 100}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/tracking/tracking-result.tsx`**

The full mockup-ordered report. Complete component:

```tsx
"use client";

import { Printer, AlertTriangle } from "lucide-react";
import type { TrackPayload, TrackEvent } from "@/lib/tracking/payload";
import { Barcode } from "@/components/ui/barcode";
import { RouteMap } from "@/components/ui/route-map";

const fmtDate = (iso: string | null, withTime = false) =>
  iso
    ? new Date(iso).toLocaleString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
      })
    : "—";

const fmtMoney = (v: number | null) =>
  v == null ? "—" : `$${v.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export function TrackingResult({ data }: { data: TrackPayload }) {
  const c = data.consignment;
  return (
    <div id="tracking-report" className="mt-12 space-y-10">
      {/* Intro + barcode (mockup 14) */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foam" style={{ fontFamily: "var(--font-display)" }}>
          Tracking Result
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-mist">
          A consignment was sent to you through Blue Route Logistics. You can keep
          track of your freight through this tracking system at any time. If you
          need assistance, contact us via the contact page.
        </p>
        <p className="mt-5 text-sm font-semibold text-foam">
          Your consignment details are as stated below
        </p>
        <div className="mt-4 flex justify-center overflow-x-auto rounded-2xl bg-white p-4">
          <Barcode value={c.trackingNumber} />
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="no-print mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-cyan to-indigo px-5 py-2.5 text-sm font-semibold text-white shadow-soft"
        >
          <Printer className="h-4 w-4" /> Print shipping invoice
        </button>
      </div>

      {/* Map (mockup 15) */}
      <div className="no-print rounded-3xl border border-steel/70 bg-deep p-1.5 shadow-soft">
        <RouteMap
          origin={data.map.origin}
          destination={data.map.destination}
          current={data.map.current}
          progressPct={c.deliveryPct}
        />
      </div>

      {/* Parties (mockup 15) */}
      <DetailTable
        title="Receiver's Details"
        head={["Full Name", "Address", "Email Address", "Phone Number"]}
        rows={[[data.receiver.name, joinLoc(data.receiver.address, data.receiver.country), data.receiver.email ?? "—", data.receiver.phone ?? "—"]]}
      />
      <DetailTable
        title="Sender's Details"
        head={["Sender's Name", "Address", "Sender Email", "Phone Number"]}
        rows={[[data.sender.name, joinLoc(data.sender.address, data.sender.country), data.sender.email ?? "—", data.sender.phone ?? "—"]]}
      />

      {/* Consignment (mockup 16) */}
      <DetailTable
        title="Consignment's Details"
        head={["Consignment No", "Package Weight", "Status", "Service Type", "Delivery Mode", "Delivery Completion"]}
        rows={[[
          c.trackingNumber,
          c.weightKg == null ? "—" : `${c.weightKg.toLocaleString("en-US")} kg`,
          c.status,
          c.contentType ?? "—",
          c.freightType,
          `${c.deliveryPct}% Complete`,
        ]]}
      />
      <DetailTable
        head={["Origin", "Destination", "Date of Departure", "Expected delivery date"]}
        rows={[[c.origin, c.destination, fmtDate(c.dateShipped), fmtDate(c.expectedDelivery)]]}
      />
      <DetailTable
        head={["Shipment Cost", "Clearance Cost", "Quantity", "Description"]}
        rows={[[fmtMoney(c.shipmentCost), fmtMoney(c.clearanceCost), c.qty ?? "—", c.description ?? "—"]]}
      />

      {/* Progress bar (mockup 16) */}
      <div className="px-1">
        <div className="relative h-2.5 rounded-full bg-rose/25">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan to-indigo transition-[width] duration-[1500ms] ease-out"
            style={{ width: `${c.deliveryPct}%` }}
          />
          <span
            className="absolute -top-2.5 grid h-7 -translate-x-1/2 place-items-center rounded-full bg-foam px-2 text-[11px] font-bold text-white"
            style={{ left: `${Math.min(96, Math.max(4, c.deliveryPct))}%` }}
          >
            {c.deliveryPct}%
          </span>
        </div>
        <div className="mt-2 flex justify-between text-xs text-mist">
          <span>{c.origin}</span>
          <span>{c.destination}</span>
        </div>
      </div>

      {/* Tracking log (mockups 16–17) */}
      <DetailTable
        title="Tracking Log"
        head={["Status", "Current Location", "Arrival Country", "Date and Time", "Comments"]}
        rows={
          data.events.length
            ? data.events.map((e: TrackEvent) => [
                e.status,
                e.location,
                e.country ?? "—",
                fmtDate(e.occurredAt, true),
                e.comment ?? "—",
              ])
            : [["—", "No tracking events recorded yet", "—", "—", "—"]]
        }
      />

      {/* Notice banner (mockup 17) */}
      {data.notice && (
        <div className="flex items-start gap-3 rounded-3xl border border-amber/40 bg-amber/10 p-6 text-center">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
          <p className="w-full text-sm font-semibold leading-relaxed text-foam">
            Notice: {data.notice}
          </p>
        </div>
      )}

      <p className="rounded-2xl bg-navy py-3 text-center text-sm text-mist">
        Thanks for choosing Blue Route. Feel free to track your consignment anytime.
      </p>
    </div>
  );
}

function joinLoc(address: string | null, country: string | null) {
  return [address, country].filter(Boolean).join(", ") || "—";
}

function DetailTable({
  title,
  head,
  rows,
}: {
  title?: string;
  head: string[];
  rows: (string | number)[][];
}) {
  return (
    <section>
      {title && (
        <h3 className="mb-3 text-lg font-semibold text-foam" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </h3>
      )}
      <div className="overflow-x-auto rounded-2xl border border-steel/70 shadow-soft">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-foam text-xs uppercase tracking-wide text-white">
            <tr>
              {head.map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-steel/60 bg-deep text-foam">
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((cell, j) => (
                  <td key={j} className="px-4 py-3.5 align-top">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Rewrite `src/components/tracking/tracking-experience.tsx`**

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, ArrowRight, PackageX } from "lucide-react";
import { motion } from "framer-motion";
import type { TrackPayload } from "@/lib/tracking/payload";
import { TrackingLoader } from "./tracking-loader";
import { TrackingResult } from "./tracking-result";
import { EASE_OUT_EXPO } from "@/lib/motion";

const MIN_LOADER_MS = 3000;

type Phase =
  | { name: "idle" }
  | { name: "loading" }
  | { name: "done"; data: TrackPayload }
  | { name: "error"; query: string };

export function TrackingExperience({ initialRef }: { initialRef?: string }) {
  const [query, setQuery] = useState(initialRef ?? "");
  const [phase, setPhase] = useState<Phase>({ name: "idle" });

  const track = useCallback(async (raw: string) => {
    const ref = raw.trim();
    if (!ref) return;
    setPhase({ name: "loading" });
    const started = Date.now();
    let next: Phase;
    try {
      const res = await fetch(`/api/track/${encodeURIComponent(ref)}`);
      next = res.ok
        ? { name: "done", data: (await res.json()) as TrackPayload }
        : { name: "error", query: ref };
    } catch {
      next = { name: "error", query: ref };
    }
    const wait = Math.max(0, MIN_LOADER_MS - (Date.now() - started));
    setTimeout(() => setPhase(next), wait);
  }, []);

  useEffect(() => {
    if (initialRef) void track(initialRef);
  }, [initialRef, track]);

  return (
    <section className="relative pt-28 pb-20 lg:pt-32">
      <div className="bg-grid absolute inset-0 -z-10 h-96" />
      <div className="absolute -right-32 top-10 -z-10 h-[28rem] w-[28rem] rounded-full bg-cyan/10 blur-[120px] animate-aurora" />

      <div className="mx-auto max-w-5xl px-5 lg:px-8">
        <div className="no-print mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-cyan/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
            <Search className="h-3.5 w-3.5" /> Tracking Result
          </span>
          <h1
            className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foam md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Track your <span className="text-gradient">consignment.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-mist">
            Enter your tracking number to see the full consignment report —
            live route, status, and the complete tracking log.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void track(query);
            }}
            className="glass mx-auto mt-7 flex max-w-xl items-center gap-2 rounded-2xl p-2 pl-4 shadow-xl"
          >
            <Search className="h-5 w-5 shrink-0 text-cyan" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tracking number, e.g. BRL-12345678"
              className="h-11 w-full bg-transparent text-sm text-foam placeholder:text-mist/70 focus:outline-none"
              aria-label="Tracking number"
            />
            <button
              type="submit"
              disabled={phase.name === "loading"}
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-cyan px-5 text-sm font-semibold text-white transition-transform active:scale-95 disabled:opacity-60"
            >
              Track <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {phase.name === "loading" && <TrackingLoader />}

        {phase.name === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          >
            <TrackingResult data={phase.data} />
          </motion.div>
        )}

        {phase.name === "error" && (
          <div className="mx-auto mt-14 flex max-w-md flex-col items-center text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-rose/10 text-rose">
              <PackageX className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-foam">
              No consignment found for “{phase.query}”
            </h2>
            <p className="mt-2 text-sm text-mist">
              Double-check the tracking number on your confirmation email, or{" "}
              <a href="/contact" className="font-medium text-cyan hover:underline">
                contact support
              </a>{" "}
              and we&apos;ll locate it for you.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Update page metadata** in `src/app/(site)/tracking/page.tsx`

```ts
export const metadata: Metadata = {
  title: "Track Your Shipment",
  description:
    "Enter your Blue Route tracking number to see your consignment's live route, current status, and full tracking log.",
};
```

(The component usage is unchanged — it still renders `<TrackingExperience initialRef={ref} />`.)

- [ ] **Step 5: Add print rules to `src/app/globals.css`** (at the end)

```css
/* Print: the tracking page prints as a clean shipping invoice. */
@media print {
  header,
  footer,
  .no-print {
    display: none !important;
  }
  body {
    background: #ffffff !important;
  }
}
```

- [ ] **Step 6: Verify in the running app**

`npm run build` first — expect green. Then with the dev server:
`http://localhost:3000/tracking?ref=NOPE` → 3s loader → not-found state.
(Positive path verified in Task 12 once a demo shipment exists.)

- [ ] **Step 7: Commit**

```bash
git add src/components/tracking/ "src/app/(site)/tracking/page.tsx" src/app/globals.css
git commit -m "feat: rebuild public tracking page per mockups on real data"
```

---

### Task 10: Portal route-map modal (item 14)

**Files:**
- Modify: `src/lib/portal-data.ts` (add route coords per shipment)
- Create: `src/components/portal/route-modal.tsx`
- Modify: `src/components/portal/portal-dashboard.tsx` (row click opens modal)

- [ ] **Step 1: Add coordinates to the mock shipments**

In `src/lib/portal-data.ts`, extend the `Shipment` type:

```ts
export type Shipment = {
  ref: string;
  lane: string;
  mode: string;
  status: "In transit" | "At port" | "Customs" | "Delivered" | "Booked";
  eta: string;
  confidence: number;
  progress: number;
  route: {
    origin: { name: string; lng: number; lat: number };
    destination: { name: string; lng: number; lat: number };
  };
};
```

and add a `route` to each entry:

```ts
export const SHIPMENTS: Shipment[] = [
  { ref: "BR-7741-2026", lane: "Shanghai → Rotterdam", mode: "FCL · 40'HC", status: "In transit", eta: "Jun 19", confidence: 99, progress: 62,
    route: { origin: { name: "Shanghai", lng: 121.49, lat: 31.22 }, destination: { name: "Rotterdam", lng: 4.48, lat: 51.92 } } },
  { ref: "BR-7720-2026", lane: "Singapore → Los Angeles", mode: "FCL · 40'", status: "At port", eta: "Jun 12", confidence: 97, progress: 88,
    route: { origin: { name: "Singapore", lng: 103.82, lat: 1.35 }, destination: { name: "Los Angeles", lng: -118.24, lat: 33.74 } } },
  { ref: "BR-7705-2026", lane: "Shenzhen → Hamburg", mode: "LCL · 18 m³", status: "Customs", eta: "Jun 10", confidence: 95, progress: 93,
    route: { origin: { name: "Shenzhen", lng: 114.06, lat: 22.54 }, destination: { name: "Hamburg", lng: 9.99, lat: 53.55 } } },
  { ref: "BR-7698-2026", lane: "Dubai → New York", mode: "FCL · 40'RF", status: "In transit", eta: "Jun 24", confidence: 92, progress: 34,
    route: { origin: { name: "Dubai", lng: 55.27, lat: 25.2 }, destination: { name: "New York", lng: -74.01, lat: 40.71 } } },
  { ref: "BR-7651-2026", lane: "Mumbai → Antwerp", mode: "FCL · 20'", status: "Delivered", eta: "Jun 02", confidence: 100, progress: 100,
    route: { origin: { name: "Mumbai", lng: 72.88, lat: 19.08 }, destination: { name: "Antwerp", lng: 4.4, lat: 51.22 } } },
  { ref: "BR-7777-2026", lane: "Busan → Sydney", mode: "FCL · 40'HC", status: "Booked", eta: "Jul 01", confidence: 90, progress: 8,
    route: { origin: { name: "Busan", lng: 129.08, lat: 35.18 }, destination: { name: "Sydney", lng: 151.21, lat: -33.87 } } },
];
```

- [ ] **Step 2: Create `src/components/portal/route-modal.tsx`**

```tsx
"use client";

import { X } from "lucide-react";
import { RouteMap } from "@/components/ui/route-map";
import type { Shipment } from "@/lib/portal-data";

export function RouteModal({
  shipment,
  onClose,
}: {
  shipment: Shipment;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foam/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Route for ${shipment.ref}`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-3xl border border-steel/70 bg-deep p-5 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foam" style={{ fontFamily: "var(--font-display)" }}>
              {shipment.ref}
            </h2>
            <p className="mt-0.5 text-sm text-mist">
              {shipment.lane} · {shipment.status} · {shipment.progress}% complete
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-steel text-mist hover:border-cyan/50 hover:text-foam"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <RouteMap
          origin={shipment.route.origin}
          destination={shipment.route.destination}
          current={null}
          progressPct={shipment.progress}
          className="h-[380px]"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Open the modal from shipment rows**

In `src/components/portal/portal-dashboard.tsx`: add state
`const [routeShipment, setRouteShipment] = useState<Shipment | null>(null);`
(import `Shipment` from `@/lib/portal-data` and `RouteModal` from
`./route-modal`). On each shipment row, add a click affordance (e.g. a
"View route" button or make the lane cell a button) calling
`setRouteShipment(s)`; keep the existing `/tracking?ref=` link intact. Render
at the component root:

```tsx
{routeShipment && (
  <RouteModal shipment={routeShipment} onClose={() => setRouteShipment(null)} />
)}
```

Match the file's existing row markup when adding the affordance.

- [ ] **Step 4: Verify in the running app**

Open `http://localhost:3000/portal` (sign in if gated), Shipments tab, click a
row's route affordance → modal with animated trip line; Esc/backdrop closes
(backdrop click implemented; that's enough).

- [ ] **Step 5: Commit**

```bash
git add src/lib/portal-data.ts src/components/portal/
git commit -m "feat: portal shipment route modal with animated trip line"
```

---

### Task 11: Remove dead mock-dashboard code

**Files:**
- Delete: `src/components/tracking/panels.tsx`, `src/components/tracking/shipment-map.tsx`
- Possibly delete: `src/lib/tracking-data.ts`
- Modify: `src/lib/map.ts` + `src/lib/map.test.ts` (drop `splitRouteAtVessel` if unused)

- [ ] **Step 1: Find remaining references**

Run: `npx rg -l "tracking-data|panels|shipment-map|splitRouteAtVessel|SAMPLE_SHIPMENT" src/`
Expected: only the files being deleted (and `map.ts`/its test). If anything
else imports them (e.g. `quote-data` re-uses `PORTS`), keep `tracking-data.ts`
but delete only what's unreferenced.

- [ ] **Step 2: Delete dead files and the `splitRouteAtVessel` helper + its tests** (if Step 1 confirmed unused)

- [ ] **Step 3: Full check**

Run: `npx vitest run` then `npm run build`
Expected: all tests pass; build green; route count includes `/api/track/[number]`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove mock tracking dashboard remnants"
```

---

### Task 12: Live E2E + demo shipment

**Files:**
- Create: `scripts/verify-tracking-e2e.mjs`

**⛔ GATE:** This task needs `supabase/tracking-migration.sql` applied. The
script checks first and prints paste instructions if the columns are missing —
ask Timi to paste it in the Supabase SQL editor (project `ktyfrxfjuognirtqiifo`
→ SQL Editor → Run) before continuing.

- [ ] **Step 1: Write `scripts/verify-tracking-e2e.mjs`**

```js
// Live E2E for the public tracking rebuild. Seeds/refreshes a demo shipment
// (BRL-TEST0001) with backdated events, then drives /api/track and /tracking.
// Run with the dev server up: node scripts/verify-tracking-e2e.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const BASE = "http://localhost:3000";
const TN = "BRL-TEST0001";

function step(label, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"} | ${label}${detail ? " | " + detail : ""}`);
  if (!ok) process.exitCode = 1;
}

// 0. migration gate
{
  const { error } = await svc.from("shipments").select("origin_lng").limit(1);
  if (error) {
    console.log("BLOCKED: tracking-migration.sql not applied.");
    console.log("→ Supabase dashboard → SQL Editor → paste supabase/tracking-migration.sql → Run.");
    process.exit(2);
  }
}

// 1. seed demo shipment + events
const shipmentRow = {
  tracking_number: TN,
  receiver_name: "Graham Buckley",
  receiver_email: "graham@example.com",
  receiver_phone: "+1 (805) 891-0000",
  receiver_address: "Ridgeway Drive, Glendale, CA",
  receiver_country: "United States",
  sender_name: "Liebherr International",
  sender_email: "info@example.com",
  sender_phone: "+49 8273 000",
  sender_address: "Biberach an der Riß",
  sender_country: "Germany",
  origin: "Hamburg port, Germany",
  destination: "Phnom Penh, Cambodia",
  freight_type: "Sea Freight",
  content_type: "Container",
  weight_kg: 150961.43,
  qty: 1,
  description: "Crane parts",
  status: "On Hold",
  date_shipped: "2026-05-12",
  expected_delivery: "2026-06-30",
  current_location: "Varna port, Varna",
  current_city: "Varna",
  current_lng: 27.9147,
  current_lat: 43.1996,
  origin_lng: 9.9937,
  origin_lat: 53.5511,
  destination_lng: 104.9282,
  destination_lat: 11.5564,
  shipment_cost: 25000,
  clearance_cost: 1200,
  delivery_pct: 59,
  notice: "Urgent attention needed: shipment is on hold at Varna port, Bulgaria. Please contact customer support immediately.",
};
const { data: up, error: upErr } = await svc
  .from("shipments")
  .upsert(shipmentRow, { onConflict: "tracking_number" })
  .select("id")
  .single();
step("seed demo shipment", !upErr, upErr?.message ?? `id=${up?.id}`);

await svc.from("shipment_events").delete().eq("shipment_id", up.id);
const events = [
  { status: "Pending", location: "Hamburg port", country: "Germany", occurred_at: "2026-05-12T15:32:00Z", comment: "Vessel sorted at Hamburg terminal" },
  { status: "On route", location: "Mersin port", country: "Turkey", occurred_at: "2026-06-03T12:38:00Z", comment: "Shipment docked at Mersin port" },
  { status: "On Hold", location: "Varna port", country: "Bulgaria", occurred_at: "2026-06-07T10:25:00Z", comment: "Shipment is on hold at Varna port" },
].map((e) => ({ ...e, shipment_id: up.id }));
const { error: evErr } = await svc.from("shipment_events").insert(events);
step("seed backdated events", !evErr, evErr?.message ?? "3 events");

// 2. API positive path
{
  const res = await fetch(`${BASE}/api/track/${TN}`);
  const body = await res.json();
  step("GET /api/track/<demo> 200", res.status === 200);
  step("payload: consignment + parties + costs", body?.consignment?.trackingNumber === TN && body?.receiver?.name === "Graham Buckley" && body?.consignment?.shipmentCost === 25000);
  step("payload: map points resolved", body?.map?.origin?.lat === 53.5511 && body?.map?.current?.name === "Varna");
  step("payload: events newest first", body?.events?.[0]?.status === "On Hold" && body?.events?.length === 3);
  step("payload: no internal id leak", !JSON.stringify(body).includes(up.id));
}

// 3. case-insensitive lookup
{
  const res = await fetch(`${BASE}/api/track/${TN.toLowerCase()}`);
  step("PROBE lowercase tracking number still resolves", res.status === 200);
}

// 4. 404
{
  const res = await fetch(`${BASE}/api/track/BRL-NOPE9999`);
  step("PROBE bogus number -> 404", res.status === 404);
}

// 5. page renders the result for ?ref=
{
  const res = await fetch(`${BASE}/tracking?ref=${TN}`);
  const html = await res.text();
  step("GET /tracking?ref=<demo> 200", res.status === 200 && html.includes("Track your"));
}

// 6. rate limit
{
  let last = 200;
  for (let i = 0; i < 25; i++) {
    const res = await fetch(`${BASE}/api/track/BRL-NOPE9999`);
    last = res.status;
  }
  step("PROBE burst of 25 -> 429", last === 429, `last=${last}`);
}

console.log(process.exitCode ? "\nRESULT: FAIL" : "\nRESULT: ALL GREEN");
```

Note: the `/tracking?ref=` page check can only assert the shell HTML (results
are fetched client-side) — visual confirmation of the report is Timi's
browser pass.

- [ ] **Step 2: Run it** (dev server up)

Run: `node scripts/verify-tracking-e2e.mjs`
Expected: `RESULT: ALL GREEN`. If `BLOCKED`, hand the migration instructions to
Timi and wait.

- [ ] **Step 3: Commit**

```bash
git add scripts/verify-tracking-e2e.mjs
git commit -m "test: live E2E for public tracking (seeds BRL-TEST0001 demo)"
```

---

### Task 13: Reconcile statuses + handoff

**Files:**
- Modify: `docs/PLAN.md`

- [ ] **Step 1: Update `docs/PLAN.md`** — mark item 13 ✅ (note: animated map +
  3s loader + barcode + print w/ costs) and item 14 ✅ (portal modal on mock
  data; real portal data later). Update "Build order (remaining)" → next is
  **Bookings (6, 8)**.

- [ ] **Step 2: Full verification**

Run: `npx vitest run` and `npm run build`
Expected: all green.

- [ ] **Step 3: Commit**

```bash
git add docs/PLAN.md
git commit -m "docs: mark tracking page (13) and portal route map (14) done"
```

- [ ] **Step 4: Tell Timi what to eyeball in the browser**

`/tracking` → enter `BRL-TEST0001` → 3s loader → full report with animated map
line + barcode; print preview (Ctrl+P) shows the invoice with costs; `/portal`
→ shipment row → route modal.
