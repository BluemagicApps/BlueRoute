import { describe, it, expect } from "vitest";
import { formatTicketRef, formatBookingRef } from "./refs";

describe("formatTicketRef", () => {
  it("is deterministic for a seed and matches BR-INQ-##### shape", () => {
    const a = formatTicketRef("seed-1");
    expect(a).toBe(formatTicketRef("seed-1"));
    expect(a).toMatch(/^BR-INQ-\d{5}$/);
  });
});

describe("formatBookingRef", () => {
  it("embeds origin/dest prefixes and matches shape", () => {
    const ref = formatBookingRef("seed-1", "CNSHA", "NLRTM");
    expect(ref).toMatch(/^BR-CNNL-\d{4}$/);
  });
});
