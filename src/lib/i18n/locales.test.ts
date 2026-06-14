import { describe, it, expect } from "vitest";
import { LOCALES, LOCALE_CODES, DEFAULT_LOCALE, isLocale, dirFor, resolveRequestLocale } from "./locales";

describe("locales", () => {
  it("exposes exactly the 10 locked languages", () => {
    expect(LOCALE_CODES).toEqual(["en", "zh", "hi", "es", "fr", "ar", "bn", "pt", "ru", "ur"]);
  });
  it("defaults to English", () => {
    expect(DEFAULT_LOCALE).toBe("en");
  });
  it("every locale has a native + English name", () => {
    for (const l of LOCALES) {
      expect(l.nativeName.length).toBeGreaterThan(0);
      expect(l.englishName.length).toBeGreaterThan(0);
    }
  });
  it("isLocale narrows valid codes and rejects junk/undefined", () => {
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("xx")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale("")).toBe(false);
  });
  it("marks only Arabic and Urdu as RTL", () => {
    expect(dirFor("ar")).toBe("rtl");
    expect(dirFor("ur")).toBe("rtl");
    expect(dirFor("en")).toBe("ltr");
    expect(dirFor("zh")).toBe("ltr");
  });
});

describe("resolveRequestLocale", () => {
  it("returns a valid cookie value unchanged", () => {
    expect(resolveRequestLocale("ar")).toBe("ar");
  });
  it("falls back to default for junk/undefined", () => {
    expect(resolveRequestLocale("xx")).toBe("en");
    expect(resolveRequestLocale(undefined)).toBe("en");
  });
});
