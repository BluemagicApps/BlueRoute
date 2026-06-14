import { describe, it, expect } from "vitest";
import { buildTranslatePrompt, normalizeTranslation } from "./translate";

describe("translate lib", () => {
  it("names the target language in the prompt", () => {
    const p = buildTranslatePrompt("Delayed at port", "fr");
    expect(p).toContain("French");
    expect(p).toContain("Delayed at port");
  });
  it("falls back to English for an unknown locale", () => {
    expect(buildTranslatePrompt("Hello", "xx")).toContain("English");
  });
  it("normalizeTranslation trims and rejects empty", () => {
    expect(normalizeTranslation("  Bonjour  ")).toBe("Bonjour");
    expect(normalizeTranslation("")).toBeNull();
    expect(normalizeTranslation(null)).toBeNull();
    expect(normalizeTranslation(undefined)).toBeNull();
  });
});
