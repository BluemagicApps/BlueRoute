import { describe, it, expect } from "vitest";
import { formatTrackingNumber } from "./tracking-number";

describe("formatTrackingNumber", () => {
  it("matches BRL-XXXXXXXX (8 digits)", () => {
    expect(formatTrackingNumber("seed-1")).toMatch(/^BRL-\d{8}$/);
  });
  it("is deterministic for a seed", () => {
    expect(formatTrackingNumber("abc")).toBe(formatTrackingNumber("abc"));
  });
  it("differs across seeds", () => {
    expect(formatTrackingNumber("a")).not.toBe(formatTrackingNumber("b"));
  });
});
