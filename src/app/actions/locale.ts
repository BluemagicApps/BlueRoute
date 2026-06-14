"use server";

import { cookies } from "next/headers";
import { resolveRequestLocale } from "@/lib/i18n/locales";

export async function setLocale(locale: string) {
  const value = resolveRequestLocale(locale);
  const store = await cookies();
  store.set("NEXT_LOCALE", value, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
}
