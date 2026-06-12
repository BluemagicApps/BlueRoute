import { describe, expect, it } from "vitest";
import { code128Checksum, code128Bars } from "@/lib/barcode";

describe("code128Checksum", () => {
  it("computes the documented value for BRL (start B)", () => {
    // start 104 + B(34)*1 + R(50)*2 + L(44)*3 = 370; 370 % 103 = 61
    expect(code128Checksum("BRL")).toBe(61);
  });
});

describe("code128Bars", () => {
  it("returns alternating bar/space widths with quiet structure", () => {
    const bars = code128Bars("BRL-12345678");
    // start(6) + 12 chars * 6 + checksum(6) + stop(7)
    expect(bars).toHaveLength(6 + 12 * 6 + 6 + 7);
    expect(bars.every((w) => w >= 1 && w <= 4)).toBe(true);
  });

  it("throws on non-ASCII input", () => {
    expect(() => code128Bars("BRl-€")).toThrow();
  });
});
