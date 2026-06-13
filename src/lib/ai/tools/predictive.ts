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
