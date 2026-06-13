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
