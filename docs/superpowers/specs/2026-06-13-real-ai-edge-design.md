# Real AI Edge — Design

**Date:** 2026-06-13
**Plan item:** Item 5 ("Make AI Edge real + clickable cards") in `docs/PLAN.md`.
**Branch:** new `feat/real-ai-edge` (off the current branch / main).

## Goal

Turn the AI Edge from a static showcase into **real, interactive tools**. Make the four
capability cards clickable, and build three exploratory pages backed by real Groq + real
Open-Meteo weather + the existing haversine distance engine:

- `/ai-edge/predictive-insights` — delay-probability / ETA / cost-trend forecast for a lane.
- `/ai-edge/route-optimizer` — weather-aware lane optimizer (cost vs. time vs. carbon + backup).
- `/ai-edge/proactive-resolution` — scenario-based exception detection → auto-fix suggestion.

## Decisions (agreed with Timi, 2026-06-13)

1. **Inputs:** users pick a lane from the existing `PORTS` dropdowns (origin → destination),
   plus an optional cargo-ready date. No free-text geocoding — `PORTS` already carry coords.
2. **Honesty:** distances and weather are **real**; AI-generated figures (delay probability,
   cost trend, risk) are clearly framed as **"AI estimate · grounded in live weather + distance"**,
   never as guarantees. Matches the site's honesty stance.
3. **Proactive Resolution** is **scenario-based** (lane + a chosen disruption type) — no
   dependency on seeded DB shipments; always demoable.
4. **Structured output:** Groq returns JSON so results render as cards, not raw prose. A
   server-side normalizer makes flaky AI output degrade gracefully.
5. **Single-shot** (no streaming), mirroring the existing `askAdvisor` pipeline.

## Architecture

One shared backbone; three thin tool actions + three page consoles. Reuses existing pieces:
`PORTS`, `estimateDistanceKm`, `computeQuotes`, `Port`, `QuoteOption` from `src/lib/quote-data.ts`;
`chat()` from `src/lib/ai/groq.ts`; the `ai_interactions` audit log + `checkRateLimit` pattern
from `src/app/actions/advisor.ts`.

```
quote-data.ts (PORTS, estimateDistanceKm, computeQuotes) ─┐
src/lib/ai/weather.ts (Open-Meteo fetch + normalize) ──────┼─▶ src/app/actions/ai-tools.ts
src/lib/ai/groq.ts (chat + new chatJSON) ──────────────────┘     (3 server actions)
src/lib/ai/tools/*.ts (prompt builders + result normalizers, pure) ─┘
        ▲
        │ used by
src/components/ai/ai-tool-console.tsx (shared client scaffold)
  ├─ /ai-edge/predictive-insights/page.tsx
  ├─ /ai-edge/route-optimizer/page.tsx
  └─ /ai-edge/proactive-resolution/page.tsx
```

### New shared libs

**`src/lib/ai/weather.ts`** (server-safe fetch + pure normalizer):
- `type Weather = { tempC: number; windKph: number; precipMm: number; conditions: string }`.
- `async fetchWeather(lat: number, lng: number): Promise<Weather | null>` — GET
  `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current=temperature_2m,precipitation,wind_speed_10m,weather_code&wind_speed_unit=kmh`.
  Returns `null` on any error/timeout (best-effort; never throws).
- `normalizeWeather(raw: unknown): Weather | null` — pure; reads `current.*`, maps WMO
  `weather_code` to a human string via a small code→label map, returns `null` if shape invalid.
  This is the unit-tested unit; `fetchWeather` is the thin IO wrapper around it.

**`src/lib/ai/groq.ts`** — add:
- `async chatJSON<T>(messages: ChatMsg[]): Promise<T | null>` — same client/model as `chat`,
  but with `response_format: { type: "json_object" }`. `JSON.parse` the content inside a
  try/catch; return `null` on empty/unparseable output. Does NOT validate the shape — that's
  each tool's normalizer's job.

### Tool modules (`src/lib/ai/tools/`) — pure, unit-tested

Each tool exports a prompt builder and a result type + normalizer. No IO.

- **`predictive.ts`**
  - `type PredictiveResult = { delayProbabilityPct: number; etaConfidencePct: number; riskFactors: string[]; costTrend: string; alternatives: string[]; summary: string }`.
  - `buildPredictivePrompt(input: { origin: Port; destination: Port; distanceKm: number; readyDate?: string; originWx: Weather | null; destWx: Weather | null }): ChatMsg[]` — system + user message stating the real facts (lane, distance, weather) and asking for a JSON object with those exact keys.
  - `normalizePredictive(raw: unknown): PredictiveResult | null` — clamp `delayProbabilityPct`/`etaConfidencePct` to 0–100, coerce `riskFactors`/`alternatives` to string arrays (cap 5), require a non-empty `summary`, else `null`.
- **`optimizer.ts`**
  - `type RouteCandidate = { name: string; costUSD: number; transitDays: number; co2Kg: number }`.
  - `type OptimizerResult = { recommended: string; backupLane: string; rationale: string; rankings: { name: string; verdict: string }[] }`.
  - `buildOptimizerPrompt(input: { origin: Port; destination: Port; candidates: RouteCandidate[]; originWx; destWx }): ChatMsg[]` — passes the REAL computed candidates (from `computeQuotes`) and weather; asks Groq to pick the optimal balancing cost/time/carbon, name a congestion backup, and rank.
  - `normalizeOptimizer(raw): OptimizerResult | null`.
- **`resolution.ts`**
  - `DISRUPTIONS = ["Port congestion", "Severe weather", "Customs hold", "Equipment shortage"] as const`.
  - `type ResolutionResult = { exception: string; impact: string; recommendedFix: string; steps: string[]; severity: "low" | "medium" | "high" }`.
  - `buildResolutionPrompt(input: { origin; destination; distanceKm; disruption: string; destWx }): ChatMsg[]`.
  - `normalizeResolution(raw): ResolutionResult | null` — coerce `severity` to the union (default "medium"), `steps` to string array (cap 6).

### Server actions (`src/app/actions/ai-tools.ts`, `"use server"`)

Three actions: `runPredictiveInsights`, `runRouteOptimizer`, `runProactiveResolution`.
Shared shape (a generic discriminated result per tool):

```ts
export type ToolState<T> =
  | { status: "idle" }
  | { status: "success"; result: T; weatherUsed: boolean }
  | { status: "error"; error: string };
```

Each action (designed for `useActionState`, signature `(_prev, formData) => Promise<ToolState<T>>`):
1. Read `originCode`/`destCode` (+ tool-specific fields) from `formData`; resolve against `PORTS`. Unknown/identical → error.
2. Rate-limit by IP (reuse `checkRateLimit`).
3. Compute `estimateDistanceKm` (+ `computeQuotes` for the optimizer).
4. `fetchWeather` for origin + destination (best-effort; `weatherUsed = both non-null`).
5. `chatJSON<…>(buildXPrompt(...))` → tool normalizer. `null` → error "Couldn't generate analysis — please try again."
6. Best-effort `ai_interactions` log (reuse the `logInteraction` pattern; question = a synthesized label like "predictive-insights: CNSHA→NLRTM", answer = `result.summary`/equivalent).
7. Return `{ status: "success", result, weatherUsed }`.

### Pages + shared console

**`src/components/ai/ai-tool-console.tsx`** (client) — a reusable scaffold:
- Props: `{ title; subtitle; action; renderResult: (result, weatherUsed) => ReactNode; extraFields?: ReactNode }`.
- Renders: origin/destination `PORTS` `<select>`s (default `CNSHA`→`NLRTM`, same as quote wizard), any `extraFields`, a "Run analysis" submit button (`useActionState`, disabled while pending, "Analyzing…"), an error banner, and on success the `renderResult(...)` output plus the **"AI estimate · grounded in live weather + distance"** caption (or "· weather unavailable, distance-only" when `weatherUsed` is false).

Three pages under `src/app/(site)/ai-edge/<slug>/page.tsx` (server components with `metadata`):
each renders a hero + the `AiToolConsole` wired to its action with a tool-specific
`renderResult` (cards: predictive = probability/confidence gauges + risk/alt lists; optimizer =
ranked candidate cards + recommended/backup callout; resolution = exception → fix steps, plus a
disruption-type `<select>` as `extraFields`). Match the existing `/ai-edge` page styling
(`CHIP` colors, `glass`, `bg-grid`, `text-gradient`, `predictive-dashboard.tsx` gauge style).

### Clickable cards

- **`/ai-edge/page.tsx`**: wrap each of the 4 capability cards so it links — `assistant` fires
  the `br-open-assistant` window event (small client wrapper, reuse `OpenAdvisorButton`'s event),
  `predictive`→`/ai-edge/predictive-insights`, `optimizer`→`/ai-edge/route-optimizer`,
  `radar`→`/ai-edge/proactive-resolution`. Add an `href` field to the `CAPABILITIES` data.
- **`src/components/home/ai-edge.tsx`**: the 3 non-lead cards become `Link`s to the tool pages
  (add an `href` to those `FEATURES` entries); the lead/accent card keeps linking to `/ai-edge`.

## Error handling & honesty

- Open-Meteo failure → analysis proceeds distance-only; result caption notes weather unavailable.
  Never blocks.
- Groq empty/unparseable JSON → friendly error, no crash.
- Rate-limited → the same gentle message as the advisor.
- All probabilities/forecasts visibly labeled AI estimates; real facts (distance, weather,
  computed cost/time/CO₂) shown as facts.

## Testing

- `src/lib/ai/weather.test.ts` — `normalizeWeather` maps a sample Open-Meteo `current` payload,
  maps a couple of WMO codes to labels, returns `null` on malformed input.
- `src/lib/ai/tools/predictive.test.ts` — `normalizePredictive` clamps out-of-range percentages,
  caps arrays, rejects missing `summary`; `buildPredictivePrompt` includes the lane + distance +
  weather facts in the user message.
- `src/lib/ai/tools/optimizer.test.ts` — `normalizeOptimizer` shapes rankings, rejects junk;
  prompt includes the real candidates.
- `src/lib/ai/tools/resolution.test.ts` — `normalizeResolution` coerces `severity` to the union
  and defaults sensibly; prompt includes the disruption + lane.
- `src/lib/ai/groq.test.ts` (or extend existing) — `chatJSON` returns parsed object on valid JSON,
  `null` on garbage (mock the client).
- `scripts/verify-ai-edge-e2e.mjs` — the 3 new pages + `/ai-edge` return 200; clickable-card hrefs
  present in `/ai-edge` HTML; and (when `GROQ_API_KEY` is set) one real `runPredictiveInsights`
  call returns a normalized success. Mirrors the existing verify scripts' style.

## Out of scope

- Voice (item 16) — separate next cycle.
- Streaming responses.
- No new DB tables (reuse `ai_interactions`).
- No changes to the existing `askAdvisor` chat assistant beyond the card link.
