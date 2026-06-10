import { describe, it, expect } from "vitest";
import { BASEMAP_STYLE, splitRouteAtVessel } from "./map";
import type { LngLat } from "@/lib/tracking-data";

const route: LngLat[] = [
  [0, 0],
  [10, 0],
  [20, 0],
  [30, 0],
  [40, 0],
];

describe("BASEMAP_STYLE", () => {
  it("is a CARTO Positron https style URL", () => {
    expect(BASEMAP_STYLE).toMatch(/^https:\/\//);
    expect(BASEMAP_STYLE).toContain("positron");
  });
});

describe("splitRouteAtVessel", () => {
  it("splits at the vessel vertex, overlapping by one point", () => {
    const { traveled, remaining } = splitRouteAtVessel(route, [20, 0]);
    expect(traveled).toEqual([[0, 0], [10, 0], [20, 0]]);
    expect(remaining).toEqual([[20, 0], [30, 0], [40, 0]]);
  });

  it("falls back to the midpoint when the vessel is not a vertex", () => {
    const { traveled, remaining } = splitRouteAtVessel(route, [12.3, 4.5]);
    // Math.ceil(5 * 0.5) = 3 → cut at index 3
    expect(traveled).toEqual([[0, 0], [10, 0], [20, 0]]);
    expect(remaining).toEqual([[20, 0], [30, 0], [40, 0]]);
  });
});
