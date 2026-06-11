import { describe, it, expect } from "vitest";
import { config } from "@/proxy";

describe("proxy config", () => {
  it("exports a non-empty string matcher array", () => {
    expect(Array.isArray(config.matcher)).toBe(true);
    expect(config.matcher.length).toBeGreaterThan(0);
    for (const m of config.matcher) {
      expect(typeof m).toBe("string");
    }
  });

  it("excludes Next static assets and image files", () => {
    const pattern = config.matcher[0];
    expect(pattern).toContain("_next/static");
    expect(pattern).toContain("_next/image");
    expect(pattern).toContain("svg|png|jpg");
  });
});
