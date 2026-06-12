import { describe, expect, it } from "vitest";
import { FACILITIES, REGIONS, ALL_FEATURES } from "@/lib/warehouse-data";

describe("FACILITIES dataset", () => {
  it("has at least 35 facilities", () => {
    expect(FACILITIES.length).toBeGreaterThanOrEqual(35);
  });

  it("has unique ids", () => {
    const ids = FACILITIES.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses only declared regions and features, with sane numbers", () => {
    const regions = new Set(REGIONS.filter((r) => r !== "All regions"));
    const features = new Set(ALL_FEATURES);
    for (const f of FACILITIES) {
      expect(regions.has(f.region)).toBe(true);
      expect(f.features.every((x) => features.has(x))).toBe(true);
      expect(f.sqft).toBeGreaterThan(0);
      expect(f.pricePerSqftYear).toBeGreaterThan(0);
      expect(f.coord).toHaveLength(2);
      expect(f.rating).toBeGreaterThanOrEqual(0);
      expect(f.rating).toBeLessThanOrEqual(5);
    }
  });
});
