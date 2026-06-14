import { type Locale, isLocale } from "./locales";

// Representative country → language map (not exhaustive; unmapped → null → default en).
const COUNTRY_LOCALE: Record<string, Locale> = {
  CN: "zh", TW: "zh", HK: "zh", MO: "zh", SG: "zh",
  IN: "hi",
  ES: "es", MX: "es", AR: "es", CO: "es", CL: "es", PE: "es", VE: "es", EC: "es",
  FR: "fr", BE: "fr", CH: "fr", LU: "fr", SN: "fr", CI: "fr", CD: "fr",
  SA: "ar", AE: "ar", EG: "ar", IQ: "ar", JO: "ar", KW: "ar", QA: "ar", DZ: "ar", MA: "ar", TN: "ar",
  BD: "bn",
  PT: "pt", BR: "pt", AO: "pt", MZ: "pt",
  RU: "ru", BY: "ru", KZ: "ru", KG: "ru",
  PK: "ur",
};

export function countryToLocale(country: string | null | undefined): Locale | null {
  if (!country) return null;
  return COUNTRY_LOCALE[country.toUpperCase()] ?? null;
}

function firstAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;
  for (const part of header.split(",")) {
    const tag = part.split(";")[0]?.trim().split("-")[0]?.toLowerCase();
    if (isLocale(tag) && tag !== "en") return tag;
  }
  return null;
}

export function pickLocaleFromHeaders(input: {
  country: string | null | undefined;
  acceptLanguage: string | null | undefined;
}): Locale | null {
  return countryToLocale(input.country) ?? firstAcceptLanguage(input.acceptLanguage);
}
