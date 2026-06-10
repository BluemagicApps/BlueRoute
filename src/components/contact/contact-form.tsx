"use client";

import { useActionState, useState } from "react";
import { motion } from "framer-motion";
import { CircleCheck, Send } from "lucide-react";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { OpenAdvisorButton } from "@/components/ai/open-advisor-button";
import { submitContact } from "@/app/actions/leads";
import type { ContactState } from "@/lib/leads/types";

const TOPICS = [
  "Sales & quoting",
  "Tracking & support",
  "Warehouse leasing",
  "Partnerships",
  "Other",
];

const INITIAL: ContactState = { status: "idle" };

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContact, INITIAL);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const fieldErrors = state.status === "error" ? state.fieldErrors ?? {} : {};

  if (state.status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
        className="glass rounded-3xl p-8 text-center"
      >
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald/12 text-emerald">
          <CircleCheck className="h-8 w-8" />
        </span>
        <h2
          className="mt-4 text-2xl font-semibold text-foam"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Thanks{name ? `, ${name.split(" ")[0]}` : ""}!
        </h2>
        <p className="mt-2 text-sm text-mist">
          Your inquiry is logged as{" "}
          <span className="font-semibold text-cyan">{state.ticketRef}</span>. A
          specialist will reply within 2 business hours, and a confirmation is on
          its way to your inbox.
        </p>
        <p className="mt-4 text-sm text-mist">Need an answer right now?</p>
        <div className="mt-3 flex justify-center">
          <OpenAdvisorButton>Ask the AI Advisor</OpenAdvisorButton>
        </div>
      </motion.div>
    );
  }

  return (
    <form action={formAction} className="glass rounded-3xl p-6 md:p-8">
      <h2
        className="text-xl font-semibold text-foam"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Send us a message
      </h2>
      <p className="mt-1 text-sm text-mist">
        Tell us about your shipment or question — we&apos;ll route it to the right
        expert.
      </p>

      {/* Honeypot — hidden from humans, bots fill it. */}
      <div aria-hidden className="hidden">
        <label>
          Company URL
          <input type="text" name="company_url" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required error={fieldErrors.name}>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Shipper"
            className={inputCls}
          />
        </Field>
        <Field label="Company">
          <input name="company" placeholder="Acme Trading Co." className={inputCls} />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Work email" required error={fieldErrors.email}>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@acme.com"
            className={inputCls}
          />
        </Field>
        <Field label="Topic">
          <select name="topic" defaultValue={TOPICS[0]} className={inputCls}>
            {TOPICS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Message" required error={fieldErrors.message}>
          <textarea
            name="message"
            rows={4}
            placeholder="Origin, destination, cargo, timeline — or your question."
            className={`${inputCls} resize-none py-3`}
          />
        </Field>
      </div>

      {state.status === "error" && !Object.keys(fieldErrors).length && (
        <p className="mt-4 text-sm text-rose">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-cyan to-indigo px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(30,91,255,0.65)] transition-transform active:scale-95 disabled:opacity-40"
      >
        {pending ? "Sending…" : "Send message"} <Send className="h-4 w-4" />
      </button>
      <p className="mt-3 text-center text-xs text-mist">
        Prefer instant answers? The AI Advisor is in the corner 24/7.
      </p>
    </form>
  );
}

const inputCls =
  "h-12 w-full rounded-2xl border border-steel/70 bg-white px-4 text-sm text-foam placeholder:text-mist/70 outline-none transition-colors focus:border-cyan/60";

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foam">
        {label}
        {required && <span className="text-cyan"> *</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-rose">{error}</span>}
    </label>
  );
}
