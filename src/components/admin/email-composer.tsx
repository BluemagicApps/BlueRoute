"use client";

import { useState, useTransition } from "react";
import { Send, Check, AlertCircle, Info } from "lucide-react";
import { sendAdminEmail } from "@/app/actions/admin-email";

const inputCls =
  "w-full rounded-2xl border border-steel bg-deep px-3.5 py-2.5 text-sm text-foam outline-none focus:border-cyan placeholder:text-mist/60";

export function EmailComposer({ initialTo }: { initialTo?: string }) {
  const [category, setCategory] = useState<"all" | "single">(initialTo ? "single" : "all");
  const [to, setTo] = useState(initialTo ?? "");
  const [greeting, setGreeting] = useState("Hello,");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      setResult(null);
      const res = await sendAdminEmail({ category, to, greeting, subject, message });
      if (res.ok) {
        setResult({
          ok: true,
          text: `Sent to ${res.sent} recipient${res.sent === 1 ? "" : "s"}.`,
        });
        setSubject("");
        setMessage("");
      } else {
        setResult({ ok: false, text: res.error ?? "Send failed." });
      }
    });
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-steel/70 bg-deep p-6 shadow-soft md:p-8">
      <p className="flex items-start gap-2 rounded-2xl bg-amber/10 p-3 text-xs text-amber">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        Resend is in test mode until the blueroute.com domain is verified —
        deliveries outside the account owner&apos;s inbox will be suppressed.
      </p>

      {result && (
        <p
          className={`mt-3 flex items-start gap-2 rounded-2xl p-3 text-sm ${
            result.ok ? "bg-emerald/10 text-emerald" : "bg-rose/10 text-rose"
          }`}
        >
          {result.ok ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          {result.text}
        </p>
      )}

      <div className="mt-5 space-y-4">
        <label className="block text-sm">
          <span className="font-medium text-foam">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as "all" | "single")}
            className={`${inputCls} mt-1.5`}
          >
            <option value="all">All customers (shipment receivers + quote leads)</option>
            <option value="single">Single address</option>
          </select>
        </label>

        {category === "single" && (
          <label className="block text-sm">
            <span className="font-medium text-foam">Recipient email</span>
            <input
              type="email"
              required
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="customer@example.com"
              className={`${inputCls} mt-1.5`}
            />
          </label>
        )}

        <label className="block text-sm">
          <span className="font-medium text-foam">Greeting / title</span>
          <input value={greeting} onChange={(e) => setGreeting(e.target.value)} className={`${inputCls} mt-1.5`} />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-foam">Subject</span>
          <input required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className={`${inputCls} mt-1.5`} />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-foam">Message</span>
          <textarea
            required
            rows={8}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message… blank lines start new paragraphs."
            className={`${inputCls} mt-1.5`}
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-cyan to-indigo px-5 py-2.5 text-sm font-semibold text-white shadow-soft disabled:opacity-60"
        >
          <Send className="h-4 w-4" /> {pending ? "Sending…" : "Send"}
        </button>
      </div>
    </form>
  );
}
