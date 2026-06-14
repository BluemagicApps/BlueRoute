import { LOCALES } from "./locales";

export function buildTranslatePrompt(text: string, targetLocale: string): string {
  const name = LOCALES.find((l) => l.code === targetLocale)?.englishName ?? "English";
  return (
    `Translate the following text to ${name}. Preserve meaning, tone, numbers, and any ` +
    `placeholders. Do not translate the brand name "Blue Route". Return only the translation, ` +
    `no quotes or commentary.\n\n${text}`
  );
}

export function normalizeTranslation(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}
