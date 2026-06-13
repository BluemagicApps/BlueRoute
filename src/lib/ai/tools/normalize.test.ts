import { describe, expect, it } from "vitest";
import { clampPct, strArray, oneLine } from "@/lib/ai/tools/normalize";

describe("clampPct", () => {
  it("rounds and clamps to 0-100", () => {
    expect(clampPct(72.6)).toBe(73);
    expect(clampPct(-5)).toBe(0);
    expect(clampPct(140)).toBe(100);
    expect(clampPct("48")).toBe(48);
    expect(clampPct("x")).toBe(0);
  });
});

describe("strArray", () => {
  it("keeps non-empty strings up to the cap", () => {
    expect(strArray(["a", "", "  ", "b", "c", "d"], 3)).toEqual(["a", "b", "c"]);
    expect(strArray("nope", 3)).toEqual([]);
  });
});

describe("oneLine", () => {
  it("trims a string and returns a fallback for non-strings", () => {
    expect(oneLine("  hi  ", "x")).toBe("hi");
    expect(oneLine(123, "x")).toBe("x");
    expect(oneLine("", "x")).toBe("x");
  });
});
