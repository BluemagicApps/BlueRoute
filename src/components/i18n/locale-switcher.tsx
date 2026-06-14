"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALES } from "@/lib/i18n/locales";
import { setLocale } from "@/app/actions/locale";

export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      aria-label="Select language"
      value={locale}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(async () => {
          await setLocale(next);
          router.refresh();
        });
      }}
      className={`rounded-full border border-steel/70 bg-white px-2 py-1 text-xs text-foam disabled:opacity-50 ${className}`}
    >
      {LOCALES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.nativeName}
        </option>
      ))}
    </select>
  );
}
