import { describe, it, expect } from "vitest";
import { STATS, TIMELINE, LEADERS } from "./about-data";

describe("about-data", () => {
  it("has four stats and a 1998→2026 timeline starting in Houston", () => {
    expect(STATS).toHaveLength(4);
    expect(TIMELINE[0].year).toBe("1998");
    expect(TIMELINE[0].title.toLowerCase()).toContain("houston");
    expect(TIMELINE[TIMELINE.length - 1].year).toBe("2026");
  });
  it("has four leaders, each with a photo under /leadership and a non-empty bio", () => {
    expect(LEADERS).toHaveLength(4);
    for (const p of LEADERS) {
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.role.length).toBeGreaterThan(0);
      expect(p.photo.startsWith("/leadership/")).toBe(true);
      expect(p.bio.length).toBeGreaterThan(40);
    }
  });
  it("the founder is the first leader and the CEO", () => {
    expect(LEADERS[0].role).toContain("CEO");
  });
});
