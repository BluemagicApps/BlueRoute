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
