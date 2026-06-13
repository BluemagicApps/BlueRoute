import { describe, expect, it } from "vitest";
import { formatWarehouseRef, formatServiceRef } from "@/lib/bookings/refs";

describe("formatWarehouseRef", () => {
  it("is deterministic and BR-WH-##### shaped", () => {
    const a = formatWarehouseRef("seed-123");
    expect(a).toMatch(/^BR-WH-\d{5}$/);
    expect(formatWarehouseRef("seed-123")).toBe(a);
  });
  it("varies with the seed", () => {
    expect(formatWarehouseRef("a")).not.toBe(formatWarehouseRef("b"));
  });
});

describe("formatServiceRef", () => {
  it("is deterministic and BR-SV-##### shaped", () => {
    const a = formatServiceRef("seed-123");
    expect(a).toMatch(/^BR-SV-\d{5}$/);
    expect(formatServiceRef("seed-123")).toBe(a);
  });
  it("varies with the seed", () => {
    expect(formatServiceRef("a")).not.toBe(formatServiceRef("b"));
  });
});
