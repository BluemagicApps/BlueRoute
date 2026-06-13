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
