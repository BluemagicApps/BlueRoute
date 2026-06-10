import { describe, it, expect } from "vitest";
import { extractCta } from "./cta";

describe("extractCta", () => {
  it("parses a valid trailing CTA and strips it from content", () => {
    const r = extractCta("Here's a plan for you.\nCTA: /quote | Get an instant quote");
    expect(r.content).toBe("Here's a plan for you.");
    expect(r.cta).toEqual({ href: "/quote", label: "Get an instant quote" });
  });
  it("drops a CTA pointing at a disallowed path (and removes the line)", () => {
    const r = extractCta("Sure.\nCTA: /evil | Click me");
    expect(r.content).toBe("Sure.");
    expect(r.cta).toBeUndefined();
  });
  it("returns content unchanged when there is no directive", () => {
    const r = extractCta("Just a normal answer.");
    expect(r.content).toBe("Just a normal answer.");
    expect(r.cta).toBeUndefined();
  });
});
