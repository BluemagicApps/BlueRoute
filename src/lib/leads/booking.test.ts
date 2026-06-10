import { describe, it, expect } from "vitest";
import { resolveBooking } from "./booking";
import type { BookingInput } from "./types";

const base: BookingInput = {
  name: "Jane",
  email: "jane@acme.com",
  company: "",
  originCode: "CNSHA",
  destCode: "NLRTM",
  mode: "door-to-door",
  containerId: "40hc",
  optionId: "balanced",
  insurance: true,
  weightKg: 18000,
  readyDate: null,
};

describe("resolveBooking", () => {
  it("resolves labels, option and adds insurance to total", () => {
    const r = resolveBooking(base)!;
    expect(r).not.toBeNull();
    expect(r.origin.label).toContain("Shanghai");
    expect(r.destination.label).toContain("Rotterdam");
    expect(r.option.id).toBe("balanced");
    expect(r.insuranceFeeUSD).toBeGreaterThan(0);
    expect(r.totalUSD).toBe(r.option.priceUSD + r.insuranceFeeUSD);
  });

  it("omits insurance from total when not selected", () => {
    const r = resolveBooking({ ...base, insurance: false })!;
    expect(r.totalUSD).toBe(r.option.priceUSD);
  });

  it("returns null for unknown port or container", () => {
    expect(resolveBooking({ ...base, originCode: "XXXXX" })).toBeNull();
    expect(resolveBooking({ ...base, containerId: "nope" })).toBeNull();
  });
});
