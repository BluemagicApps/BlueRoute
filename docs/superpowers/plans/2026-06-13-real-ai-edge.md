# Real AI Edge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the AI Edge into real interactive tools — three Groq + Open-Meteo + haversine-backed pages (predictive insights, route optimizer, proactive resolution) plus making the four capability cards clickable.

**Architecture:** A shared backbone (Open-Meteo `weather.ts`, a `chatJSON` Groq helper, pure per-tool prompt/normalizer modules) → three `"use server"` tool actions writing nothing new to the DB (reuse `ai_interactions`) → three pages built on a shared client `<AiToolConsole>` scaffold. Distances + weather are real; AI figures are labeled estimates.

**Tech Stack:** Next 16 (App Router, Server Actions, `useActionState`), Tailwind v4, Groq (`groq-sdk`, non-streaming JSON mode), Open-Meteo (free, no key), Vitest.

**Spec:** `docs/superpowers/specs/2026-06-13-real-ai-edge-design.md`

**Executor notes:**
- **Next 16**: Server-Action files (`"use server"`) export ONLY async functions (a `type` export is fine). `crypto`/`Date.now()` are fine inside actions but eslint bans `Date.now()` in RSC bodies — hoist into a helper if needed.
- Reuse from `src/lib/quote-data.ts`: `PORTS: Port[]` where `Port = { code; city; country; region; lat; lng }`; `CONTAINERS: ContainerType[]`; `estimateDistanceKm(input)` and `computeQuotes(input)` where `input = { origin: Port; destination: Port; container: ContainerType; mode: CargoMode }`; `QuoteOption = { id: "express"|"balanced"|"green"; name; transitDays; priceUSD; co2Kg; ... }`.
- Reuse from AI lib: `chat()` and the cached client in `src/lib/ai/groq.ts` (has `import "server-only"`); `checkRateLimit(ip)` from `src/lib/ai/rate-limit.ts`; the `ai_interactions` insert columns are `question, answer, cta_path, duration_ms, ok, model` (see `src/app/actions/advisor.ts` `logInteraction`).
- The site-wide assistant opens via `window.dispatchEvent(new Event("br-open-assistant"))` — `OpenAdvisorButton` (`src/components/ai/open-advisor-button.tsx`) already does this.
- Tailwind tokens in use: `foam, mist, cyan, aqua, indigo, teal, emerald, steel, abyss, deep, rose`; utilities `glass, bg-grid, text-gradient, shadow-soft, bg-aurora-gradient`.
- Run tests: `npx vitest run` (95 currently pass). Dev server: http://localhost:3000.
- End every commit message with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

---

### Task 1: Weather lib (Open-Meteo)

**Files:**
- Create: `src/lib/ai/weather.ts`
- Test: `src/lib/ai/weather.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/ai/weather.test.ts
import { describe, expect, it } from "vitest";
import { normalizeWeather } from "@/lib/ai/weather";

const sample = {
  current: { temperature_2m: 14.2, precipitation: 0.3, wind_speed_10m: 22.5, weather_code: 61 },
};

describe("normalizeWeather", () => {
  it("maps an Open-Meteo current payload", () => {
    expect(normalizeWeather(sample)).toEqual({
      tempC: 14.2,
      precipMm: 0.3,
      windKph: 22.5,
      conditions: "Light rain",
    });
  });
  it("labels a clear-sky code", () => {
    expect(normalizeWeather({ current: { temperature_2m: 20, precipitation: 0, wind_speed_10m: 5, weather_code: 0 } })?.conditions).toBe("Clear sky");
  });
  it("falls back for an unknown code", () => {
    expect(normalizeWeather({ current: { temperature_2m: 1, precipitation: 0, wind_speed_10m: 1, weather_code: 999 } })?.conditions).toBe("Unsettled");
  });
  it("returns null on a malformed payload", () => {
    expect(normalizeWeather({})).toBeNull();
    expect(normalizeWeather(null)).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/ai/weather.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/ai/weather.ts`**

```ts
export type Weather = {
  tempC: number;
  precipMm: number;
  windKph: number;
  conditions: string;
};

// Compact WMO weather-code → label map (Open-Meteo `weather_code`).
const WMO: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Freezing fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Severe thunderstorm",
};

/** Pure: normalize an Open-Meteo forecast response. Returns null if shape is invalid. */
export function normalizeWeather(raw: unknown): Weather | null {
  if (!raw || typeof raw !== "object") return null;
  const cur = (raw as { current?: Record<string, unknown> }).current;
  if (!cur || typeof cur !== "object") return null;
  const tempC = Number(cur.temperature_2m);
  const precipMm = Number(cur.precipitation);
  const windKph = Number(cur.wind_speed_10m);
  const code = Number(cur.weather_code);
  if (![tempC, precipMm, windKph, code].every(Number.isFinite)) return null;
  return { tempC, precipMm, windKph, conditions: WMO[code] ?? "Unsettled" };
}

/** Best-effort IO wrapper. Never throws — returns null on any failure. */
export async function fetchWeather(lat: number, lng: number): Promise<Weather | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,wind_speed_10m,weather_code&wind_speed_unit=kmh`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    return normalizeWeather(await res.json());
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/ai/weather.test.ts`
Expected: PASS. Then `npx tsc --noEmit` clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/weather.ts src/lib/ai/weather.test.ts
git commit -m "feat: Open-Meteo weather lib for AI Edge"
```

---

### Task 2: JSON parse helper + `chatJSON`

**Files:**
- Create: `src/lib/ai/json.ts`
- Test: `src/lib/ai/json.test.ts`
- Modify: `src/lib/ai/groq.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/ai/json.test.ts
import { describe, expect, it } from "vitest";
import { safeParseJSON } from "@/lib/ai/json";

describe("safeParseJSON", () => {
  it("parses a valid JSON object", () => {
    expect(safeParseJSON<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
  });
  it("returns null on garbage", () => {
    expect(safeParseJSON("not json")).toBeNull();
    expect(safeParseJSON("")).toBeNull();
  });
  it("returns null for non-object JSON", () => {
    expect(safeParseJSON("42")).toBeNull();
    expect(safeParseJSON("null")).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/ai/json.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/ai/json.ts`**

```ts
/** Pure, safe JSON-object parse. Returns null on empty/invalid/non-object input. */
export function safeParseJSON<T>(text: string): T | null {
  if (!text || !text.trim()) return null;
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as T;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/ai/json.test.ts`
Expected: PASS.

- [ ] **Step 5: Add `chatJSON` to `src/lib/ai/groq.ts`**

Add this import at the top (below the existing imports):

```ts
import { safeParseJSON } from "@/lib/ai/json";
```

Append at the end of the file:

```ts
/** Non-streaming JSON-mode completion. Returns a parsed object, or null on empty/invalid output. */
export async function chatJSON<T>(messages: ChatMsg[]): Promise<T | null> {
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const res = await client().chat.completions.create({
    model,
    messages,
    temperature: 0.4,
    max_tokens: 800,
    response_format: { type: "json_object" },
  });
  return safeParseJSON<T>(res.choices[0]?.message?.content ?? "");
}
```

- [ ] **Step 6: Verify**

Run: `npx vitest run src/lib/ai/json.test.ts` (PASS), `npx tsc --noEmit` (clean), `npx eslint src/lib/ai/groq.ts src/lib/ai/json.ts` (clean).

- [ ] **Step 7: Commit**

```bash
git add src/lib/ai/json.ts src/lib/ai/json.test.ts src/lib/ai/groq.ts
git commit -m "feat: chatJSON + safe JSON parse for AI tools"
```

---

### Task 3: Shared normalizer helpers

**Files:**
- Create: `src/lib/ai/tools/normalize.ts`
- Test: `src/lib/ai/tools/normalize.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/ai/tools/normalize.test.ts
import { describe, expect, it } from "vitest";
import { clampPct, strArray, oneLine } from "@/lib/ai/tools/normalize";

describe("clampPct", () => {
  it("rounds and clamps to 0-100", () => {
    expect(clampPct(72.6)).toBe(73);
    expect(clampPct(-5)).toBe(0);
    expect(clampPct(140)).toBe(100);
    expect(clampPct("48")).toBe(48);
    expect(clampPct("x")).toBe(0);
  });
});

describe("strArray", () => {
  it("keeps non-empty strings up to the cap", () => {
    expect(strArray(["a", "", "  ", "b", "c", "d"], 3)).toEqual(["a", "b", "c"]);
    expect(strArray("nope", 3)).toEqual([]);
  });
});

describe("oneLine", () => {
  it("trims a string and returns a fallback for non-strings", () => {
    expect(oneLine("  hi  ", "x")).toBe("hi");
    expect(oneLine(123, "x")).toBe("x");
    expect(oneLine("", "x")).toBe("x");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/ai/tools/normalize.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/ai/tools/normalize.ts`**

```ts
/** Round + clamp any value to an integer percentage in [0,100]; 0 on garbage. */
export function clampPct(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

/** Coerce to an array of trimmed non-empty strings, capped. */
export function strArray(x: unknown, cap: number): string[] {
  if (!Array.isArray(x)) return [];
  return x
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .map((s) => s.trim())
    .slice(0, cap);
}

/** Trimmed string, or the fallback for non-strings / empties. */
export function oneLine(x: unknown, fallback: string): string {
  return typeof x === "string" && x.trim() ? x.trim() : fallback;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/ai/tools/normalize.test.ts`
Expected: PASS. Then `npx tsc --noEmit` clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/tools/normalize.ts src/lib/ai/tools/normalize.test.ts
git commit -m "feat: shared normalizer helpers for AI tools"
```

---

### Task 4: Predictive Insights tool module

**Files:**
- Create: `src/lib/ai/tools/predictive.ts`
- Test: `src/lib/ai/tools/predictive.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/ai/tools/predictive.test.ts
import { describe, expect, it } from "vitest";
import { buildPredictivePrompt, normalizePredictive } from "@/lib/ai/tools/predictive";
import type { Port } from "@/lib/quote-data";

const origin: Port = { code: "CNSHA", city: "Shanghai", country: "China", region: "Asia", lat: 31.2, lng: 121.5 };
const dest: Port = { code: "NLRTM", city: "Rotterdam", country: "Netherlands", region: "Europe", lat: 51.9, lng: 4.5 };

describe("buildPredictivePrompt", () => {
  it("includes the lane, distance, and weather facts in the user message", () => {
    const msgs = buildPredictivePrompt({
      origin, destination: dest, distanceKm: 19500, readyDate: "2026-08-01",
      originWx: { tempC: 14, precipMm: 0, windKph: 20, conditions: "Overcast" },
      destWx: null,
    });
    expect(msgs[0].role).toBe("system");
    const user = msgs[1].content;
    expect(user).toContain("Shanghai");
    expect(user).toContain("Rotterdam");
    expect(user).toContain("19500");
    expect(user).toContain("Overcast");
    expect(user).toContain("2026-08-01");
  });
});

describe("normalizePredictive", () => {
  it("clamps percentages, caps arrays, requires a summary", () => {
    const out = normalizePredictive({
      delayProbabilityPct: 142, etaConfidencePct: -3,
      riskFactors: ["weather", "", "congestion", "a", "b", "c", "d"],
      costTrend: "  rising  ", alternatives: ["via Suez"], summary: "Estimated moderate risk.",
    });
    expect(out).not.toBeNull();
    expect(out!.delayProbabilityPct).toBe(100);
    expect(out!.etaConfidencePct).toBe(0);
    expect(out!.riskFactors).toHaveLength(5);
    expect(out!.costTrend).toBe("rising");
    expect(out!.summary).toBe("Estimated moderate risk.");
  });
  it("returns null when summary is missing", () => {
    expect(normalizePredictive({ delayProbabilityPct: 10 })).toBeNull();
    expect(normalizePredictive(null)).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/ai/tools/predictive.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/ai/tools/predictive.ts`**

```ts
import type { Port } from "@/lib/quote-data";
import type { ChatMsg } from "@/lib/ai/groq";
import type { Weather } from "@/lib/ai/weather";
import { clampPct, strArray, oneLine } from "@/lib/ai/tools/normalize";

export type PredictiveResult = {
  delayProbabilityPct: number;
  etaConfidencePct: number;
  riskFactors: string[];
  costTrend: string;
  alternatives: string[];
  summary: string;
};

export type PredictiveInput = {
  origin: Port;
  destination: Port;
  distanceKm: number;
  readyDate?: string;
  originWx: Weather | null;
  destWx: Weather | null;
};

const wx = (w: Weather | null) =>
  w ? `${w.conditions}, ${w.tempC}°C, wind ${w.windKph} km/h, precip ${w.precipMm}mm` : "unavailable";

export function buildPredictivePrompt(input: PredictiveInput): ChatMsg[] {
  const { origin, destination, distanceKm, readyDate, originWx, destWx } = input;
  return [
    {
      role: "system",
      content:
        "You are BlueRoute's predictive logistics engine. Using the REAL lane distance and current weather provided, produce a disruption-risk estimate. All figures are estimates, not guarantees. Respond with ONLY a JSON object — no prose, no markdown.",
    },
    {
      role: "user",
      content: `Lane: ${origin.city}, ${origin.country} (${origin.code}) → ${destination.city}, ${destination.country} (${destination.code}).
Great-circle distance: ${distanceKm} km.
Cargo ready date: ${readyDate || "not specified"}.
Origin weather: ${wx(originWx)}.
Destination weather: ${wx(destWx)}.

Return JSON with EXACTLY these keys:
{
  "delayProbabilityPct": integer 0-100,
  "etaConfidencePct": integer 0-100,
  "riskFactors": array of up to 5 short strings,
  "costTrend": one short sentence on likely freight-cost direction,
  "alternatives": array of up to 3 short alternative-lane suggestions,
  "summary": 2-3 sentence plain-language estimate
}`,
    },
  ];
}

export function normalizePredictive(raw: unknown): PredictiveResult | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const summary = oneLine(r.summary, "");
  if (!summary) return null;
  return {
    delayProbabilityPct: clampPct(r.delayProbabilityPct),
    etaConfidencePct: clampPct(r.etaConfidencePct),
    riskFactors: strArray(r.riskFactors, 5),
    costTrend: oneLine(r.costTrend, "No clear cost trend."),
    alternatives: strArray(r.alternatives, 3),
    summary,
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/ai/tools/predictive.test.ts`
Expected: PASS. Then `npx tsc --noEmit` clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/tools/predictive.ts src/lib/ai/tools/predictive.test.ts
git commit -m "feat: predictive-insights tool module"
```

---

### Task 5: Route Optimizer tool module

**Files:**
- Create: `src/lib/ai/tools/optimizer.ts`
- Test: `src/lib/ai/tools/optimizer.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/ai/tools/optimizer.test.ts
import { describe, expect, it } from "vitest";
import { buildOptimizerPrompt, normalizeOptimizer, type RouteCandidate } from "@/lib/ai/tools/optimizer";
import type { Port } from "@/lib/quote-data";

const origin: Port = { code: "CNSHA", city: "Shanghai", country: "China", region: "Asia", lat: 31.2, lng: 121.5 };
const dest: Port = { code: "NLRTM", city: "Rotterdam", country: "Netherlands", region: "Europe", lat: 51.9, lng: 4.5 };
const candidates: RouteCandidate[] = [
  { name: "Express", costUSD: 5200, transitDays: 24, co2Kg: 1800 },
  { name: "Balanced", costUSD: 3900, transitDays: 31, co2Kg: 1500 },
  { name: "Green", costUSD: 3600, transitDays: 36, co2Kg: 1100 },
];

describe("buildOptimizerPrompt", () => {
  it("includes the real candidates and lane", () => {
    const user = buildOptimizerPrompt({ origin, destination: dest, candidates, originWx: null, destWx: null })[1].content;
    expect(user).toContain("Express");
    expect(user).toContain("5200");
    expect(user).toContain("Shanghai");
  });
});

describe("normalizeOptimizer", () => {
  it("shapes a valid result", () => {
    const out = normalizeOptimizer({
      recommended: "Balanced", backupLane: "via Singapore transshipment",
      rationale: "Best cost/time/carbon balance.",
      rankings: [{ name: "Balanced", verdict: "optimal" }, { name: "Express", verdict: "fastest" }, { bad: 1 }],
    });
    expect(out).not.toBeNull();
    expect(out!.recommended).toBe("Balanced");
    expect(out!.rankings).toHaveLength(2);
  });
  it("returns null when rationale missing", () => {
    expect(normalizeOptimizer({ recommended: "x" })).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/ai/tools/optimizer.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/ai/tools/optimizer.ts`**

```ts
import type { Port } from "@/lib/quote-data";
import type { ChatMsg } from "@/lib/ai/groq";
import type { Weather } from "@/lib/ai/weather";
import { oneLine } from "@/lib/ai/tools/normalize";

export type RouteCandidate = { name: string; costUSD: number; transitDays: number; co2Kg: number };

export type OptimizerResult = {
  recommended: string;
  backupLane: string;
  rationale: string;
  rankings: { name: string; verdict: string }[];
};

export type OptimizerInput = {
  origin: Port;
  destination: Port;
  candidates: RouteCandidate[];
  originWx: Weather | null;
  destWx: Weather | null;
};

const wx = (w: Weather | null) =>
  w ? `${w.conditions}, wind ${w.windKph} km/h` : "unavailable";

export function buildOptimizerPrompt(input: OptimizerInput): ChatMsg[] {
  const { origin, destination, candidates, originWx, destWx } = input;
  const rows = candidates
    .map((c) => `- ${c.name}: $${c.costUSD}, ${c.transitDays} days, ${c.co2Kg} kg CO2`)
    .join("\n");
  return [
    {
      role: "system",
      content:
        "You are BlueRoute's route optimizer. Given REAL pre-computed routing options and current endpoint weather, pick the best balance of cost, transit time, and carbon, and name a congestion-avoiding backup lane. Respond with ONLY a JSON object — no prose, no markdown.",
    },
    {
      role: "user",
      content: `Lane: ${origin.city} (${origin.code}) → ${destination.city} (${destination.code}).
Origin weather: ${wx(originWx)}. Destination weather: ${wx(destWx)}.
Routing options:
${rows}

Return JSON with EXACTLY these keys:
{
  "recommended": name of the best option (one of the option names above),
  "backupLane": one short congestion-avoiding alternative routing,
  "rationale": 2-3 sentence justification,
  "rankings": array of { "name": option name, "verdict": short phrase } for each option
}`,
    },
  ];
}

export function normalizeOptimizer(raw: unknown): OptimizerResult | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const rationale = oneLine(r.rationale, "");
  if (!rationale) return null;
  const rankings = Array.isArray(r.rankings)
    ? r.rankings
        .map((x) => {
          if (!x || typeof x !== "object") return null;
          const o = x as Record<string, unknown>;
          const name = oneLine(o.name, "");
          if (!name) return null;
          return { name, verdict: oneLine(o.verdict, "—") };
        })
        .filter((x): x is { name: string; verdict: string } => x !== null)
        .slice(0, 6)
    : [];
  return {
    recommended: oneLine(r.recommended, "—"),
    backupLane: oneLine(r.backupLane, "No backup identified."),
    rationale,
    rankings,
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/ai/tools/optimizer.test.ts`
Expected: PASS. Then `npx tsc --noEmit` clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/tools/optimizer.ts src/lib/ai/tools/optimizer.test.ts
git commit -m "feat: route-optimizer tool module"
```

---

### Task 6: Proactive Resolution tool module

**Files:**
- Create: `src/lib/ai/tools/resolution.ts`
- Test: `src/lib/ai/tools/resolution.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/ai/tools/resolution.test.ts
import { describe, expect, it } from "vitest";
import { buildResolutionPrompt, normalizeResolution, DISRUPTIONS } from "@/lib/ai/tools/resolution";
import type { Port } from "@/lib/quote-data";

const origin: Port = { code: "CNSHA", city: "Shanghai", country: "China", region: "Asia", lat: 31.2, lng: 121.5 };
const dest: Port = { code: "NLRTM", city: "Rotterdam", country: "Netherlands", region: "Europe", lat: 51.9, lng: 4.5 };

describe("DISRUPTIONS", () => {
  it("offers the four scenarios", () => {
    expect(DISRUPTIONS).toEqual(["Port congestion", "Severe weather", "Customs hold", "Equipment shortage"]);
  });
});

describe("buildResolutionPrompt", () => {
  it("includes the lane and disruption", () => {
    const user = buildResolutionPrompt({ origin, destination: dest, distanceKm: 19500, disruption: "Port congestion", destWx: null })[1].content;
    expect(user).toContain("Port congestion");
    expect(user).toContain("Rotterdam");
  });
});

describe("normalizeResolution", () => {
  it("coerces severity to the union and caps steps", () => {
    const out = normalizeResolution({
      exception: "Berth congestion at destination",
      impact: "2-4 day delay likely",
      recommendedFix: "Divert to Antwerp and truck onward",
      steps: ["a", "b", "c", "d", "e", "f", "g"],
      severity: "HIGH",
    });
    expect(out).not.toBeNull();
    expect(out!.severity).toBe("high");
    expect(out!.steps).toHaveLength(6);
  });
  it("defaults unknown severity to medium and rejects empty fix", () => {
    expect(normalizeResolution({ exception: "x", impact: "y", recommendedFix: "z", steps: [], severity: "weird" })!.severity).toBe("medium");
    expect(normalizeResolution({ exception: "x", impact: "y" })).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/ai/tools/resolution.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/ai/tools/resolution.ts`**

```ts
import type { Port } from "@/lib/quote-data";
import type { ChatMsg } from "@/lib/ai/groq";
import type { Weather } from "@/lib/ai/weather";
import { strArray, oneLine } from "@/lib/ai/tools/normalize";

export const DISRUPTIONS = [
  "Port congestion",
  "Severe weather",
  "Customs hold",
  "Equipment shortage",
] as const;

export type Severity = "low" | "medium" | "high";

export type ResolutionResult = {
  exception: string;
  impact: string;
  recommendedFix: string;
  steps: string[];
  severity: Severity;
};

export type ResolutionInput = {
  origin: Port;
  destination: Port;
  distanceKm: number;
  disruption: string;
  destWx: Weather | null;
};

export function buildResolutionPrompt(input: ResolutionInput): ChatMsg[] {
  const { origin, destination, distanceKm, disruption, destWx } = input;
  const wx = destWx ? `${destWx.conditions}, wind ${destWx.windKph} km/h` : "unavailable";
  return [
    {
      role: "system",
      content:
        "You are BlueRoute's proactive exception engine. Given a lane and a disruption scenario, detect the operational exception and propose a concrete automatic fix (reroute, re-book, or pre-clear). Respond with ONLY a JSON object — no prose, no markdown.",
    },
    {
      role: "user",
      content: `Lane: ${origin.city} (${origin.code}) → ${destination.city} (${destination.code}), ${distanceKm} km.
Disruption scenario: ${disruption}.
Destination weather: ${wx}.

Return JSON with EXACTLY these keys:
{
  "exception": one short sentence naming the detected exception,
  "impact": one short sentence on the likely impact,
  "recommendedFix": one short sentence describing the automatic fix,
  "steps": array of up to 6 short action steps,
  "severity": one of "low", "medium", "high"
}`,
    },
  ];
}

export function normalizeResolution(raw: unknown): ResolutionResult | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const exception = oneLine(r.exception, "");
  const impact = oneLine(r.impact, "");
  const recommendedFix = oneLine(r.recommendedFix, "");
  if (!exception || !impact || !recommendedFix) return null;
  const sev = String(r.severity ?? "").toLowerCase();
  const severity: Severity = sev === "low" || sev === "high" ? sev : "medium";
  return { exception, impact, recommendedFix, steps: strArray(r.steps, 6), severity };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/ai/tools/resolution.test.ts`
Expected: PASS. Then `npx tsc --noEmit` clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/tools/resolution.ts src/lib/ai/tools/resolution.test.ts
git commit -m "feat: proactive-resolution tool module"
```

---

### Task 7: Tool server actions

**Files:**
- Create: `src/app/actions/ai-tools.ts`

- [ ] **Step 1: Implement `src/app/actions/ai-tools.ts`**

```ts
"use server";

import { headers } from "next/headers";
import { PORTS, CONTAINERS, estimateDistanceKm, computeQuotes } from "@/lib/quote-data";
import { chatJSON } from "@/lib/ai/groq";
import { fetchWeather } from "@/lib/ai/weather";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  buildPredictivePrompt,
  normalizePredictive,
  type PredictiveResult,
} from "@/lib/ai/tools/predictive";
import {
  buildOptimizerPrompt,
  normalizeOptimizer,
  type OptimizerResult,
  type RouteCandidate,
} from "@/lib/ai/tools/optimizer";
import {
  buildResolutionPrompt,
  normalizeResolution,
  type ResolutionResult,
} from "@/lib/ai/tools/resolution";

export type ToolState<T> =
  | { status: "idle" }
  | { status: "success"; result: T; weatherUsed: boolean }
  | { status: "error"; error: string };

const RATE_MSG = "You're running tools quickly — give it a few seconds.";
const GEN_ERR = "Couldn't generate an analysis — please try again.";
const str = (fd: FormData, k: string) => ((fd.get(k) as string) ?? "").trim();

async function rateOk(): Promise<boolean> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  return checkRateLimit(ip);
}

/** Best-effort audit log — must never break a tool. */
async function logTool(label: string, summary: string, durationMs: number, ok: boolean): Promise<void> {
  try {
    await getSupabaseAdmin().from("ai_interactions").insert({
      question: label,
      answer: ok ? summary : null,
      cta_path: null,
      duration_ms: durationMs,
      ok,
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
    });
  } catch (err) {
    console.error("[ai-tools] audit log failed:", err);
  }
}

function resolveLane(fd: FormData): { origin: (typeof PORTS)[number]; destination: (typeof PORTS)[number] } | null {
  const origin = PORTS.find((p) => p.code === str(fd, "originCode"));
  const destination = PORTS.find((p) => p.code === str(fd, "destCode"));
  if (!origin || !destination || origin.code === destination.code) return null;
  return { origin, destination };
}

export async function runPredictiveInsights(
  _prev: ToolState<PredictiveResult>,
  formData: FormData,
): Promise<ToolState<PredictiveResult>> {
  if (!(await rateOk())) return { status: "error", error: RATE_MSG };
  const lane = resolveLane(formData);
  if (!lane) return { status: "error", error: "Choose two different ports." };
  const { origin, destination } = lane;
  const readyDate = str(formData, "readyDate") || undefined;
  const container = CONTAINERS.find((c) => c.id === "40hc") ?? CONTAINERS[0];
  const distanceKm = Math.round(estimateDistanceKm({ origin, destination, container, mode: "port-to-port" }));

  const started = Date.now();
  const [originWx, destWx] = await Promise.all([fetchWeather(origin.lat, origin.lng), fetchWeather(destination.lat, destination.lng)]);
  const raw = await chatJSON<unknown>(buildPredictivePrompt({ origin, destination, distanceKm, readyDate, originWx, destWx }));
  const result = normalizePredictive(raw);
  const label = `predictive-insights: ${origin.code}->${destination.code}`;
  if (!result) {
    await logTool(label, "", Date.now() - started, false);
    return { status: "error", error: GEN_ERR };
  }
  await logTool(label, result.summary, Date.now() - started, true);
  return { status: "success", result, weatherUsed: !!originWx && !!destWx };
}

export async function runRouteOptimizer(
  _prev: ToolState<OptimizerResult>,
  formData: FormData,
): Promise<ToolState<OptimizerResult>> {
  if (!(await rateOk())) return { status: "error", error: RATE_MSG };
  const lane = resolveLane(formData);
  if (!lane) return { status: "error", error: "Choose two different ports." };
  const { origin, destination } = lane;
  const container = CONTAINERS.find((c) => c.id === "40hc") ?? CONTAINERS[0];
  const candidates: RouteCandidate[] = computeQuotes({ origin, destination, container, mode: "port-to-port" }).map((q) => ({
    name: q.name,
    costUSD: q.priceUSD,
    transitDays: q.transitDays,
    co2Kg: q.co2Kg,
  }));

  const started = Date.now();
  const [originWx, destWx] = await Promise.all([fetchWeather(origin.lat, origin.lng), fetchWeather(destination.lat, destination.lng)]);
  const raw = await chatJSON<unknown>(buildOptimizerPrompt({ origin, destination, candidates, originWx, destWx }));
  const result = normalizeOptimizer(raw);
  const label = `route-optimizer: ${origin.code}->${destination.code}`;
  if (!result) {
    await logTool(label, "", Date.now() - started, false);
    return { status: "error", error: GEN_ERR };
  }
  await logTool(label, result.rationale, Date.now() - started, true);
  return { status: "success", result, weatherUsed: !!originWx && !!destWx };
}

export async function runProactiveResolution(
  _prev: ToolState<ResolutionResult>,
  formData: FormData,
): Promise<ToolState<ResolutionResult>> {
  if (!(await rateOk())) return { status: "error", error: RATE_MSG };
  const lane = resolveLane(formData);
  if (!lane) return { status: "error", error: "Choose two different ports." };
  const { origin, destination } = lane;
  const disruption = str(formData, "disruption") || "Port congestion";
  const container = CONTAINERS.find((c) => c.id === "40hc") ?? CONTAINERS[0];
  const distanceKm = Math.round(estimateDistanceKm({ origin, destination, container, mode: "port-to-port" }));

  const started = Date.now();
  const destWx = await fetchWeather(destination.lat, destination.lng);
  const raw = await chatJSON<unknown>(buildResolutionPrompt({ origin, destination, distanceKm, disruption, destWx }));
  const result = normalizeResolution(raw);
  const label = `proactive-resolution: ${origin.code}->${destination.code} (${disruption})`;
  if (!result) {
    await logTool(label, "", Date.now() - started, false);
    return { status: "error", error: GEN_ERR };
  }
  await logTool(label, result.recommendedFix, Date.now() - started, true);
  return { status: "success", result, weatherUsed: !!destWx };
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` (clean), `npx eslint src/app/actions/ai-tools.ts` (clean), `npx vitest run` (still all green — no new tests here; the pure pieces are tested in Tasks 1–6).

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/ai-tools.ts
git commit -m "feat: AI Edge tool server actions"
```

---

### Task 8: Shared `<AiToolConsole>` scaffold

**Files:**
- Create: `src/components/ai/ai-tool-console.tsx`

- [ ] **Step 1: Implement `src/components/ai/ai-tool-console.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { PORTS } from "@/lib/quote-data";
import type { ToolState } from "@/app/actions/ai-tools";

const selectCls =
  "h-12 w-full rounded-2xl border border-steel/60 bg-abyss/60 px-4 text-sm text-foam outline-none transition-colors focus:border-cyan/60";

export function AiToolConsole<T>({
  action,
  renderResult,
  extraFields,
  defaultOrigin = "CNSHA",
  defaultDest = "NLRTM",
}: {
  action: (prev: ToolState<T>, fd: FormData) => Promise<ToolState<T>>;
  renderResult: (result: T, weatherUsed: boolean) => React.ReactNode;
  extraFields?: React.ReactNode;
  defaultOrigin?: string;
  defaultDest?: string;
}) {
  const [state, formAction, pending] = useActionState<ToolState<T>, FormData>(action, { status: "idle" });

  return (
    <div className="glass mt-8 rounded-3xl p-6 md:p-8">
      <form action={formAction}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foam">Origin</span>
            <select name="originCode" defaultValue={defaultOrigin} className={selectCls}>
              {PORTS.map((p) => (
                <option key={p.code} value={p.code} className="bg-deep">
                  {p.city}, {p.country} ({p.code})
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foam">Destination</span>
            <select name="destCode" defaultValue={defaultDest} className={selectCls}>
              {PORTS.map((p) => (
                <option key={p.code} value={p.code} className="bg-deep">
                  {p.city}, {p.country} ({p.code})
                </option>
              ))}
            </select>
          </label>
          {extraFields}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-cyan to-indigo px-6 py-3 text-sm font-semibold text-white shadow-soft transition-transform active:scale-95 disabled:opacity-50"
        >
          {pending ? "Analyzing…" : "Run analysis"} <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      {state.status === "error" && (
        <p className="mt-4 rounded-2xl bg-rose/10 p-3 text-sm text-rose">{state.error}</p>
      )}

      {state.status === "success" && (
        <div className="mt-6">
          {renderResult(state.result, state.weatherUsed)}
          <p className="mt-4 text-center text-xs text-mist">
            {state.weatherUsed
              ? "AI estimate · grounded in live weather + distance"
              : "AI estimate · weather unavailable, distance-only"}
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` (clean), `npx eslint src/components/ai/ai-tool-console.tsx` (clean).

- [ ] **Step 3: Commit**

```bash
git add src/components/ai/ai-tool-console.tsx
git commit -m "feat: shared AiToolConsole scaffold"
```

---

### Task 9: Predictive Insights page

**Files:**
- Create: `src/components/ai/predictive-console.tsx`
- Create: `src/app/(site)/ai-edge/predictive-insights/page.tsx`

- [ ] **Step 1: Create `src/components/ai/predictive-console.tsx`**

```tsx
"use client";

import { CalendarDays } from "lucide-react";
import { AiToolConsole } from "@/components/ai/ai-tool-console";
import { runPredictiveInsights } from "@/app/actions/ai-tools";
import type { PredictiveResult } from "@/lib/ai/tools/predictive";

export function PredictiveConsole() {
  return (
    <AiToolConsole<PredictiveResult>
      action={runPredictiveInsights}
      extraFields={
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-foam">Cargo ready date (optional)</span>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" />
            <input
              type="date"
              name="readyDate"
              className="h-12 w-full rounded-2xl border border-steel/60 bg-abyss/60 pl-11 pr-4 text-sm text-foam outline-none transition-colors focus:border-cyan/60 [color-scheme:light]"
            />
          </div>
        </label>
      }
      renderResult={(r) => (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Gauge label="Delay probability" pct={r.delayProbabilityPct} tone="rose" />
            <Gauge label="ETA confidence" pct={r.etaConfidencePct} tone="emerald" />
          </div>
          <p className="text-sm leading-relaxed text-foam">{r.summary}</p>
          {r.riskFactors.length > 0 && (
            <List title="Risk factors" items={r.riskFactors} />
          )}
          <p className="text-sm text-mist"><span className="font-medium text-foam">Cost trend:</span> {r.costTrend}</p>
          {r.alternatives.length > 0 && <List title="Alternative lanes" items={r.alternatives} />}
        </div>
      )}
    />
  );
}

function Gauge({ label, pct, tone }: { label: string; pct: number; tone: "rose" | "emerald" }) {
  const bar = tone === "rose" ? "bg-rose" : "bg-emerald";
  return (
    <div className="rounded-2xl border border-steel/50 bg-abyss/40 p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-mist">{label}</span>
        <span className="text-2xl font-semibold text-foam" style={{ fontFamily: "var(--font-display)" }}>{pct}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-steel/50">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-foam">{title}</p>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2 text-sm text-mist">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" /> {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/(site)/ai-edge/predictive-insights/page.tsx`**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LineChart } from "lucide-react";
import { PredictiveConsole } from "@/components/ai/predictive-console";

export const metadata: Metadata = {
  title: "Predictive Insights",
  description: "AI delay-probability, ETA confidence, and cost-trend estimates for any lane — grounded in live weather and real distance.",
};

export default function PredictiveInsightsPage() {
  return (
    <section className="relative pt-28 pb-20 lg:pt-32">
      <div className="bg-grid absolute inset-0 -z-10 h-96" />
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <Link href="/ai-edge" className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to the AI Edge
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan/10 text-cyan">
            <LineChart className="h-6 w-6" />
          </span>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foam md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
            Predictive <span className="text-gradient">Insights</span>
          </h1>
        </div>
        <p className="mt-3 text-mist">
          Pick a lane and our AI estimates disruption risk, ETA confidence, and cost direction —
          using the real great-circle distance and live weather at both ports.
        </p>
        <PredictiveConsole />
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` (clean), `npx eslint src/components/ai/predictive-console.tsx "src/app/(site)/ai-edge/predictive-insights/page.tsx"` (clean). With the dev server up: `curl -s -o NUL -w "%{http_code}\n" http://localhost:3000/ai-edge/predictive-insights` → 200.

- [ ] **Step 4: Commit**

```bash
git add src/components/ai/predictive-console.tsx "src/app/(site)/ai-edge/predictive-insights/page.tsx"
git commit -m "feat: predictive-insights page"
```

---

### Task 10: Route Optimizer page

**Files:**
- Create: `src/components/ai/optimizer-console.tsx`
- Create: `src/app/(site)/ai-edge/route-optimizer/page.tsx`

- [ ] **Step 1: Create `src/components/ai/optimizer-console.tsx`**

```tsx
"use client";

import { Sparkles } from "lucide-react";
import { AiToolConsole } from "@/components/ai/ai-tool-console";
import { runRouteOptimizer } from "@/app/actions/ai-tools";
import type { OptimizerResult } from "@/lib/ai/tools/optimizer";

export function OptimizerConsole() {
  return (
    <AiToolConsole<OptimizerResult>
      action={runRouteOptimizer}
      renderResult={(r) => (
        <div className="space-y-5">
          <div className="rounded-2xl border border-cyan/40 bg-cyan/5 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-cyan">
              <Sparkles className="h-4 w-4" /> Recommended: {r.recommended}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foam">{r.rationale}</p>
            <p className="mt-2 text-sm text-mist"><span className="font-medium text-foam">Backup lane:</span> {r.backupLane}</p>
          </div>
          {r.rankings.length > 0 && (
            <div className="space-y-2">
              {r.rankings.map((rk) => (
                <div key={rk.name} className="flex items-center justify-between gap-4 rounded-2xl border border-steel/50 bg-abyss/40 px-4 py-3 text-sm">
                  <span className="font-medium text-foam">{rk.name}</span>
                  <span className="text-right text-mist">{rk.verdict}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    />
  );
}
```

- [ ] **Step 2: Create `src/app/(site)/ai-edge/route-optimizer/page.tsx`**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Route as RouteIcon } from "lucide-react";
import { OptimizerConsole } from "@/components/ai/optimizer-console";

export const metadata: Metadata = {
  title: "AI Route Optimizer",
  description: "Balance cost, transit time, and carbon across real routing options — with a weather-aware backup lane on standby.",
};

export default function RouteOptimizerPage() {
  return (
    <section className="relative pt-28 pb-20 lg:pt-32">
      <div className="bg-grid absolute inset-0 -z-10 h-96" />
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <Link href="/ai-edge" className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to the AI Edge
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal/10 text-teal">
            <RouteIcon className="h-6 w-6" />
          </span>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foam md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
            AI Route <span className="text-gradient">Optimizer</span>
          </h1>
        </div>
        <p className="mt-3 text-mist">
          We compute real cost, transit, and carbon for each routing option on your lane, then the
          AI picks the best balance and names a congestion-avoiding backup.
        </p>
        <OptimizerConsole />
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` (clean), `npx eslint src/components/ai/optimizer-console.tsx "src/app/(site)/ai-edge/route-optimizer/page.tsx"` (clean). Dev server up: `curl -s -o NUL -w "%{http_code}\n" http://localhost:3000/ai-edge/route-optimizer` → 200.

- [ ] **Step 4: Commit**

```bash
git add src/components/ai/optimizer-console.tsx "src/app/(site)/ai-edge/route-optimizer/page.tsx"
git commit -m "feat: route-optimizer page"
```

---

### Task 11: Proactive Resolution page

**Files:**
- Create: `src/components/ai/resolution-console.tsx`
- Create: `src/app/(site)/ai-edge/proactive-resolution/page.tsx`

- [ ] **Step 1: Create `src/components/ai/resolution-console.tsx`**

```tsx
"use client";

import { ShieldCheck } from "lucide-react";
import { AiToolConsole } from "@/components/ai/ai-tool-console";
import { runProactiveResolution } from "@/app/actions/ai-tools";
import { DISRUPTIONS, type ResolutionResult } from "@/lib/ai/tools/resolution";

const SEV: Record<string, string> = {
  low: "bg-emerald/10 text-emerald",
  medium: "bg-amber/10 text-amber",
  high: "bg-rose/10 text-rose",
};

export function ResolutionConsole() {
  return (
    <AiToolConsole<ResolutionResult>
      action={runProactiveResolution}
      extraFields={
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-foam">Disruption scenario</span>
          <select
            name="disruption"
            defaultValue={DISRUPTIONS[0]}
            className="h-12 w-full rounded-2xl border border-steel/60 bg-abyss/60 px-4 text-sm text-foam outline-none transition-colors focus:border-cyan/60"
          >
            {DISRUPTIONS.map((d) => (
              <option key={d} value={d} className="bg-deep">{d}</option>
            ))}
          </select>
        </label>
      }
      renderResult={(r) => (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-foam">
              <ShieldCheck className="h-4 w-4 text-cyan" /> {r.exception}
            </p>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${SEV[r.severity]}`}>
              {r.severity}
            </span>
          </div>
          <p className="text-sm text-mist">{r.impact}</p>
          <div className="rounded-2xl border border-cyan/40 bg-cyan/5 p-5">
            <p className="text-sm font-semibold text-cyan">Recommended fix</p>
            <p className="mt-1 text-sm leading-relaxed text-foam">{r.recommendedFix}</p>
          </div>
          {r.steps.length > 0 && (
            <ol className="space-y-2">
              {r.steps.map((s, i) => (
                <li key={s} className="flex items-start gap-3 text-sm text-foam">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cyan/10 text-xs font-bold text-cyan">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    />
  );
}
```

- [ ] **Step 2: Create `src/app/(site)/ai-edge/proactive-resolution/page.tsx`**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Radar } from "lucide-react";
import { ResolutionConsole } from "@/components/ai/resolution-console";

export const metadata: Metadata = {
  title: "Proactive Resolution",
  description: "Detect a shipping exception from a disruption scenario and get an automatic reroute, re-book, or pre-clear fix.",
};

export default function ProactiveResolutionPage() {
  return (
    <section className="relative pt-28 pb-20 lg:pt-32">
      <div className="bg-grid absolute inset-0 -z-10 h-96" />
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <Link href="/ai-edge" className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to the AI Edge
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald/10 text-emerald">
            <Radar className="h-6 w-6" />
          </span>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foam md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
            Proactive <span className="text-gradient">Resolution</span>
          </h1>
        </div>
        <p className="mt-3 text-mist">
          Pick a lane and a disruption — the AI detects the exception and proposes a concrete
          automatic fix, not just an alert.
        </p>
        <ResolutionConsole />
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` (clean), `npx eslint src/components/ai/resolution-console.tsx "src/app/(site)/ai-edge/proactive-resolution/page.tsx"` (clean). Dev server up: `curl -s -o NUL -w "%{http_code}\n" http://localhost:3000/ai-edge/proactive-resolution` → 200.

- [ ] **Step 4: Commit**

```bash
git add src/components/ai/resolution-console.tsx "src/app/(site)/ai-edge/proactive-resolution/page.tsx"
git commit -m "feat: proactive-resolution page"
```

---

### Task 12: Make the capability cards clickable

**Files:**
- Create: `src/components/ai/open-advisor-card.tsx`
- Modify: `src/app/(site)/ai-edge/page.tsx`
- Modify: `src/components/home/ai-edge.tsx`

- [ ] **Step 1: Create a small client wrapper that opens the advisor on click**

`src/components/ai/open-advisor-card.tsx`:

```tsx
"use client";

/** Wraps card content so clicking it opens the site-wide AI Advisor. */
export function OpenAdvisorCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("br-open-assistant"))}
      className={className}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Wire the `/ai-edge` capability cards.**

In `src/app/(site)/ai-edge/page.tsx`, add an `href` to each entry in the `CAPABILITIES` array:

```ts
const CAPABILITIES = [
  { id: "assistant", icon: Bot, color: "cyan", href: null, title: "BlueRoute AI Assistant", body: "An agentic chat & voice copilot that doesn't just answer — it acts. Ask it to plan a multi-leg shipment, run a 'what-if' on the Red Sea, or compare warehouse options, and it executes the steps for you.", bullets: ["Chat + voice", "Multi-step agentic planning", "Quotes, tracking & risk in one place"] },
  { id: "predictive", icon: LineChart, color: "indigo", href: "/ai-edge/predictive-insights", title: "Predictive Insights", body: "Delay probabilities, cost forecasts, and route alternatives computed from 40+ live signals per lane — so you decide ahead of disruptions instead of reacting to them.", bullets: ["Delay probability scoring", "8-week cost forecasting", "Ranked route alternatives"] },
  { id: "optimizer", icon: RouteIcon, color: "teal", href: "/ai-edge/route-optimizer", title: "AI Route Optimizer", body: "Every shipment is optimized across cost, transit time, and emissions using live ocean, port, and weather data — with a congestion-avoiding backup lane always on standby.", bullets: ["Cost vs. time vs. carbon", "Live congestion avoidance", "−26% emissions options"] },
  { id: "radar", icon: Radar, color: "emerald", href: "/ai-edge/proactive-resolution", title: "Proactive Resolution", body: "Exceptions are detected early and resolved automatically — re-routing, re-booking, or pre-clearing customs — so you get a fix in your inbox, not just an alert.", bullets: ["Early exception detection", "Auto re-route & re-book", "Customs pre-clearance"] },
] as const;
```

Add the import at the top:

```tsx
import { OpenAdvisorCard } from "@/components/ai/open-advisor-card";
```

Replace the capability card `<article id={c.id} …>…</article>` block with a version where the card is wrapped in a `Link` (when `c.href`) or an `OpenAdvisorCard` (when not). The inner article markup is unchanged except it adds `cursor-pointer` and a hover hint. Replace the whole `{CAPABILITIES.map((c, i) => { … })}` body with:

```tsx
            {CAPABILITIES.map((c, i) => {
              const Icon = c.icon;
              const inner = (
                <article
                  id={c.id}
                  className="group h-full scroll-mt-28 cursor-pointer rounded-3xl border border-steel/70 bg-deep p-7 text-left shadow-soft transition-all duration-500 hover:-translate-y-1 hover:border-cyan/40"
                >
                  <span className={`grid h-12 w-12 place-items-center rounded-2xl ${CHIP[c.color]}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold text-foam" style={{ fontFamily: "var(--font-display)" }}>
                    {c.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-mist">{c.body}</p>
                  <ul className="mt-4 space-y-1.5">
                    {c.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-sm text-foam">
                        <Check className="h-4 w-4 text-cyan" /> {b}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-cyan">
                    {c.href ? "Open the tool" : "Open the assistant"}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </article>
              );
              return (
                <Reveal key={c.id} delay={i * 0.06}>
                  {c.href ? (
                    <Link href={c.href} className="block">{inner}</Link>
                  ) : (
                    <OpenAdvisorCard className="block w-full">{inner}</OpenAdvisorCard>
                  )}
                </Reveal>
              );
            })}
```

(`ArrowRight` is already imported in this file.)

- [ ] **Step 3: Wire the home `ai-edge.tsx` feature cards.**

In `src/components/home/ai-edge.tsx`, add an `href` to the three non-accent `FEATURES` entries:

```ts
  { icon: LineChart, title: "Predictive Insights", body: "Delay probabilities, cost forecasts, and route alternatives — before disruptions hit your cargo.", color: "cyan" as const, href: "/ai-edge/predictive-insights" },
  { icon: Route, title: "AI Route Optimizer", body: "Lowest-risk, lowest-carbon routing computed across live ocean, port, and weather signals.", color: "teal" as const, href: "/ai-edge/route-optimizer" },
  { icon: Radar, title: "Proactive Resolution", body: "Exceptions are detected and re-routed automatically — you get a fix, not just an alert.", span: "lg:col-span-2", color: "emerald" as const, href: "/ai-edge/proactive-resolution" },
```

Then wrap the non-accent card's `<article>` in a `Link`. Replace the `return (` block of the non-accent branch (the `return ( <Reveal …> <article …>…</article> </Reveal> )` at the end of the map) with:

```tsx
            return (
              <Reveal key={f.title} delay={i * 0.07} className={f.span ?? ""}>
                <Link href={f.href ?? "/ai-edge"} className="group block h-full">
                  <article className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-steel/70 bg-deep p-7 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:border-cyan/40">
                    <div
                      className={`absolute -right-12 -top-12 h-40 w-40 rounded-full blur-2xl transition-all duration-500 ${GLOWS[f.color]}`}
                    />
                    <span
                      className={`grid h-12 w-12 place-items-center rounded-2xl transition-colors ${ACCENTS[f.color]}`}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-5 text-xl font-semibold text-foam" style={{ fontFamily: "var(--font-display)" }}>
                      {f.title}
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-mist">{f.body}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-cyan">
                      Open the tool
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </article>
                </Link>
              </Reveal>
            );
```

(`Link` and `ArrowRight` are already imported in this file. The accent/lead card branch above is unchanged.)

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit` (clean), `npx eslint "src/app/(site)/ai-edge/page.tsx" src/components/home/ai-edge.tsx src/components/ai/open-advisor-card.tsx` (clean). Dev server up: `curl -s http://localhost:3000/ai-edge | grep -o "/ai-edge/predictive-insights"` prints the href; `/ai-edge` still returns 200.

- [ ] **Step 5: Commit**

```bash
git add src/components/ai/open-advisor-card.tsx "src/app/(site)/ai-edge/page.tsx" src/components/home/ai-edge.tsx
git commit -m "feat: make AI Edge capability cards clickable"
```

---

### Task 13: Live E2E

**Files:**
- Create: `scripts/verify-ai-edge-e2e.mjs`

- [ ] **Step 1: Write the script**

```js
// Live E2E for the AI Edge tools. Confirms the 3 tool pages + /ai-edge serve 200 and the
// clickable-card hrefs are present. The tool logic (prompt builders + normalizers) is
// covered by Vitest, and the live Groq path is verified manually (Task 14, step 4) — driving
// a server action over raw HTTP isn't practical, so this script checks routing + render only.
//   node scripts/verify-ai-edge-e2e.mjs   (dev server must be up)
const BASE = "http://localhost:3000";

function step(label, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"} | ${label}${detail ? " | " + detail : ""}`);
  if (!ok) process.exitCode = 1;
}
async function get(path) {
  const res = await fetch(BASE + path, { redirect: "manual" });
  return { status: res.status, body: res.status === 200 ? await res.text() : "" };
}

const pages = [
  "/ai-edge",
  "/ai-edge/predictive-insights",
  "/ai-edge/route-optimizer",
  "/ai-edge/proactive-resolution",
];
for (const p of pages) {
  const r = await get(p);
  step(`GET ${p} → 200`, r.status === 200, `status=${r.status}`);
}

const edge = await get("/ai-edge");
step("/ai-edge links to all three tools",
  ["/ai-edge/predictive-insights", "/ai-edge/route-optimizer", "/ai-edge/proactive-resolution"].every((h) => edge.body.includes(h)));

const predictive = await get("/ai-edge/predictive-insights");
step("predictive page renders the lane console", predictive.body.includes("Run analysis") && predictive.body.includes("Origin"));

console.log(process.exitCode ? "\nRESULT: FAIL" : "\nRESULT: ALL GREEN");
```

- [ ] **Step 2: Run it** (dev server up)

Run: `node scripts/verify-ai-edge-e2e.mjs`
Expected: `RESULT: ALL GREEN`.

- [ ] **Step 3: Commit**

```bash
git add scripts/verify-ai-edge-e2e.mjs
git commit -m "test: live E2E for AI Edge tool pages"
```

---

### Task 14: Reconcile PLAN.md + final verification

**Files:**
- Modify: `docs/PLAN.md`

- [ ] **Step 1: Update `docs/PLAN.md`**

Change item 5's heading from `### 5. Make AI Edge real + clickable cards — 🟡 (assistant is live)` to `### 5. Make AI Edge real + clickable cards — ✅ done (2026-06-13)` and update its bullets so the second/third bullets are marked ✅ (cards now clickable; the 3 tool pages built on Groq + Open-Meteo + haversine). In "Build order (remaining)", change the line `5. **Real AI (5)** + **voice (16)**. ◀ NEXT` to `5. ~~Real AI (5)~~ ✅ done 2026-06-13 — AI-Edge tool pages live. **Voice (16)** next. ◀ NEXT`. In "Completed so far", change `- Items **1, 2, 4, 6, 7, 8, 10, 11, 12, 13, 14** done.` to add `5` (→ `1, 2, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14`), add a summary bullet for the AI-Edge tools before the "Build green" line, and bump the test count in the "Build green" line to the new total (run `npx vitest run` first to get the exact number, expected ~113).

- [ ] **Step 2: Full verification**

Run: `npx vitest run` (all green — note the total) and `npx next build` (green; routes include `/ai-edge/predictive-insights`, `/ai-edge/route-optimizer`, `/ai-edge/proactive-resolution`).

- [ ] **Step 3: Commit**

```bash
git add docs/PLAN.md
git commit -m "docs: mark AI Edge (item 5) done"
```

- [ ] **Step 4: Tell Timi what to eyeball**

`/ai-edge` → click each of the 4 cards (assistant opens the advisor; the other three open their tool pages). On each tool page, pick a lane (e.g., Shanghai → Rotterdam) → Run analysis → a result renders with the "AI estimate · grounded in live weather + distance" caption. Home page AI Edge section cards also link through. Requires `GROQ_API_KEY` in `.env.local` for live results (already set).

---

## Notes for the executor
- The three tool pages are independent of each other but all depend on Tasks 1–8. Build in order.
- If a Groq call returns non-JSON despite JSON mode, the normalizer returns `null` and the action returns the friendly `GEN_ERR` — this is expected, not a bug.
- Don't add streaming, new DB tables, or voice — those are out of scope (voice is item 16, the next cycle).
