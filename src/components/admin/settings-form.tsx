"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Check, AlertCircle } from "lucide-react";
import { saveSettings } from "@/app/actions/settings";

const inputCls =
  "w-full rounded-2xl border border-steel bg-deep px-3.5 py-2.5 text-sm text-foam outline-none focus:border-cyan placeholder:text-mist/60";

const FIELDS: { key: string; label: string }[] = [
  { key: "site_name", label: "Website name" },
  { key: "site_tagline", label: "Tagline" },
  { key: "contact_phone", label: "Contact phone" },
  { key: "sales_email", label: "Sales email" },
  { key: "support_email", label: "Support email" },
  { key: "hq_address", label: "Head-office address" },
];

export function SettingsForm({ values }: { values: Record<string, string> }) {
  const router = useRouter();
  const [form, setForm] = useState(values);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      setMessage(null);
      const res = await saveSettings(form);
      setMessage(
        res.ok
          ? { ok: true, text: "Settings saved." }
          : { ok: false, text: res.error ?? "Save failed." },
      );
      if (res.ok) router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-steel/70 bg-deep p-6 shadow-soft md:p-8">
      {message && (
        <p
          className={`mb-4 flex items-start gap-2 rounded-2xl p-3 text-sm ${
            message.ok ? "bg-emerald/10 text-emerald" : "bg-rose/10 text-rose"
          }`}
        >
          {message.ok ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          {message.text}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className={`block text-sm ${f.key === "hq_address" ? "md:col-span-2" : ""}`}>
            <span className="font-medium text-foam">{f.label}</span>
            <input
              value={form[f.key] ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
              className={`${inputCls} mt-1.5`}
            />
          </label>
        ))}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-cyan to-indigo px-5 py-2.5 text-sm font-semibold text-white shadow-soft disabled:opacity-60"
      >
        <Save className="h-4 w-4" /> {pending ? "Saving…" : "Update settings"}
      </button>
    </form>
  );
}
