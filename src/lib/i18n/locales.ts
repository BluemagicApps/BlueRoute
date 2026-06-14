export type Locale = "en" | "zh" | "hi" | "es" | "fr" | "ar" | "bn" | "pt" | "ru" | "ur";

export type LocaleMeta = {
  code: Locale;
  nativeName: string;
  englishName: string;
  rtl: boolean;
};

export const LOCALES: readonly LocaleMeta[] = [
  { code: "en", nativeName: "English", englishName: "English", rtl: false },
  { code: "zh", nativeName: "中文", englishName: "Chinese", rtl: false },
  { code: "hi", nativeName: "हिन्दी", englishName: "Hindi", rtl: false },
  { code: "es", nativeName: "Español", englishName: "Spanish", rtl: false },
  { code: "fr", nativeName: "Français", englishName: "French", rtl: false },
  { code: "ar", nativeName: "العربية", englishName: "Arabic", rtl: true },
  { code: "bn", nativeName: "বাংলা", englishName: "Bengali", rtl: false },
  { code: "pt", nativeName: "Português", englishName: "Portuguese", rtl: false },
  { code: "ru", nativeName: "Русский", englishName: "Russian", rtl: false },
  { code: "ur", nativeName: "اردو", englishName: "Urdu", rtl: true },
] as const;

export const LOCALE_CODES = LOCALES.map((l) => l.code) as Locale[];

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALE_CODES.includes(value as Locale);
}

export function dirFor(locale: string): "ltr" | "rtl" {
  const meta = LOCALES.find((l) => l.code === locale);
  return meta?.rtl ? "rtl" : "ltr";
}
