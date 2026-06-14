import { describe, it, expect } from "vitest";
import { countryToLocale, pickLocaleFromHeaders } from "./detect";

describe("countryToLocale", () => {
  it("maps representative countries to the right language", () => {
    expect(countryToLocale("CN")).toBe("zh");
    expect(countryToLocale("TW")).toBe("zh");
    expect(countryToLocale("FR")).toBe("fr");
    expect(countryToLocale("SA")).toBe("ar");
    expect(countryToLocale("BR")).toBe("pt");
    expect(countryToLocale("RU")).toBe("ru");
    expect(countryToLocale("PK")).toBe("ur");
    expect(countryToLocale("BD")).toBe("bn");
    expect(countryToLocale("MX")).toBe("es");
    expect(countryToLocale("IN")).toBe("hi");
  });
  it("is case-insensitive", () => {
    expect(countryToLocale("cn")).toBe("zh");
  });
  it("returns null for unmapped/empty", () => {
    expect(countryToLocale("US")).toBeNull();
    expect(countryToLocale("")).toBeNull();
    expect(countryToLocale(null)).toBeNull();
    expect(countryToLocale(undefined)).toBeNull();
  });
});

describe("pickLocaleFromHeaders", () => {
  it("prefers the geo country", () => {
    expect(pickLocaleFromHeaders({ country: "FR", acceptLanguage: "en-US,en" })).toBe("fr");
  });
  it("falls back to Accept-Language when geo is unmapped", () => {
    expect(pickLocaleFromHeaders({ country: "US", acceptLanguage: "es-ES,es;q=0.9,en;q=0.8" })).toBe("es");
  });
  it("returns null when nothing matches a supported locale", () => {
    expect(pickLocaleFromHeaders({ country: "US", acceptLanguage: "en-US,en" })).toBeNull();
    expect(pickLocaleFromHeaders({ country: null, acceptLanguage: null })).toBeNull();
  });
});
