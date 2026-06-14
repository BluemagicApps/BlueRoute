import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { resolveRequestLocale } from "@/lib/i18n/locales";

// Cookie-based locale (no URL routing). The Proxy sets NEXT_LOCALE on first visit.
export default getRequestConfig(async () => {
  const store = await cookies();
  const locale = resolveRequestLocale(store.get("NEXT_LOCALE")?.value);
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
