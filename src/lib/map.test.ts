import { describe, it, expect } from "vitest";
import { BASEMAP_STYLE, greatCircle, buildTripPath } from "./map";

describe("BASEMAP_STYLE", () => {
  it("is a CARTO Positron https style URL", () => {
    expect(BASEMAP_STYLE).toMatch(/^https:\/\//);
    expect(BASEMAP_STYLE).toContain("positron");
  });
});

describe("greatCircle", () => {
  it("interpolates along the equator", () => {
    const pts = greatCircle([0, 0], [90, 0], 4);
    expect(pts).toHaveLength(5);
    expect(pts[0]).toEqual([0, 0]);
    expect(pts[2][0]).toBeCloseTo(45, 5);
    expect(pts[2][1]).toBeCloseTo(0, 5);
    expect(pts[4][0]).toBeCloseTo(90, 5);
  });

  it("unwraps longitudes across the antimeridian", () => {
    const pts = greatCircle([170, 10], [-170, 10], 8);
    // continuous: end lng should be ~190, not -170
    expect(pts[pts.length - 1][0]).toBeCloseTo(190, 3);
    for (let i = 1; i < pts.length; i++) {
      expect(Math.abs(pts[i][0] - pts[i - 1][0])).toBeLessThan(90);
    }
  });

  it("handles identical points", () => {
    const pts = greatCircle([5, 5], [5, 5], 4);
    for (const [lng, lat] of pts) {
      expect(lng).toBeCloseTo(5, 9);
      expect(lat).toBeCloseTo(5, 9);
    }
  });
});

describe("buildTripPath", () => {
  const origin: [number, number] = [0, 0];
  const dest: [number, number] = [90, 0];

  it("splits at the current position when provided", () => {
    const { traveled, remaining } = buildTripPath(origin, dest, [45, 0], 50);
    expect(traveled[0]).toEqual([0, 0]);
    expect(traveled[traveled.length - 1][0]).toBeCloseTo(45, 5);
    expect(remaining[0][0]).toBeCloseTo(45, 5);
    expect(remaining[remaining.length - 1][0]).toBeCloseTo(90, 5);
  });

  it("splits by percentage when no current position", () => {
    const { traveled, remaining } = buildTripPath(origin, dest, null, 25);
    const last = traveled[traveled.length - 1];
    expect(last[0]).toBeGreaterThan(15);
    expect(last[0]).toBeLessThan(35);
    expect(remaining[0]).toEqual(last); // segments join
  });

  it("returns empty traveled at 0% and full at 100%", () => {
    expect(buildTripPath(origin, dest, null, 0).traveled.length).toBeLessThanOrEqual(1);
    const done = buildTripPath(origin, dest, null, 100);
    expect(done.remaining.length).toBeLessThanOrEqual(1);
  });
});
