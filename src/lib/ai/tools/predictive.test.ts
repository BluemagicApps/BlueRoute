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
