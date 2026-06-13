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
