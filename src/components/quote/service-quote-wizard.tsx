"use client";

import { useActionState, useState } from "react";
import { ArrowRight, ArrowLeft, Check, CircleCheck, Boxes, Building2, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitServiceQuote, type ServiceQuoteState } from "@/app/actions/bookings";
import type { ServiceQuoteConfig, QuoteField } from "@/lib/quote/service-fields";

const STEPS = ["Shipment", "Contact", "Review"];
const inputCls =
  "h-12 w-full rounded-2xl border border-steel/60 bg-abyss/60 px-4 text-sm text-foam outline-none transition-colors focus:border-cyan/60";

type Values = Record<string, string | string[]>;

export function ServiceQuoteWizard({ config }: { config: ServiceQuoteConfig }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(() => initialValues(config));
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [stepError, setStepError] = useState<string | null>(null);

  const [state, action, pending] = useActionState<ServiceQuoteState, FormData>(
    submitServiceQuote,
    { status: "idle" },
  );
  const fieldErrors = state.status === "error" ? state.fieldErrors ?? {} : {};

  function setValue(key: string, v: string | string[]) {
    setValues((cur) => ({ ...cur, [key]: v }));
  }
  function toggleMulti(key: string, opt: string) {
    setValues((cur) => {
      const arr = Array.isArray(cur[key]) ? (cur[key] as string[]) : [];
      return { ...cur, [key]: arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt] };
    });
  }

  function next() {
    if (step === 0) {
      const missing = config.fields.find((f) => f.required && isEmpty(values[f.name]));
      if (missing) {
        setStepError(`Please fill in “${missing.label}”.`);
        return;
      }
    }
    if (step === 1 && (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      setStepError("Enter your name and a valid work email.");
      return;
    }
    setStepError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  if (state.status === "success") {
    return (
      <div className="glass mt-8 rounded-3xl p-8 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald/15 text-emerald">
          <CircleCheck className="h-8 w-8" />
        </span>
        <h2 className="mt-4 text-2xl font-semibold text-foam" style={{ fontFamily: "var(--font-display)" }}>
          Request received
        </h2>
        <p className="mt-1 text-sm text-mist">
          Reference <span className="font-semibold text-aqua">{state.bookingRef}</span>. No payment
          taken — our team will review your request and email you options and pricing.
        </p>
      </div>
    );
  }

  return (
    <div className="glass mt-8 rounded-3xl p-6 md:p-8">
      {/* Stepper */}
      <ol className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2 last:flex-none">
            <span className={cn(
              "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold",
              i < step ? "bg-emerald/15 text-emerald" : i === step ? "bg-gradient-to-br from-cyan to-indigo text-white" : "bg-steel/60 text-mist",
            )}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className={cn("hidden text-xs font-medium sm:block", i === step ? "text-foam" : "text-mist")}>{label}</span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-steel/60" />}
          </li>
        ))}
      </ol>

      {(stepError || (state.status === "error" && state.error)) && (
        <p className="mb-4 rounded-2xl bg-rose/10 p-3 text-sm text-rose">
          {stepError ?? (state.status === "error" ? state.error : null)}
        </p>
      )}

      {step === 0 && (
        <div>
          <Title icon={Boxes} text="Shipment details" />
          <div className="grid gap-4 sm:grid-cols-2">
            {config.fields.map((f) => (
              <FieldInput
                key={f.name}
                field={f}
                value={values[f.name]}
                error={fieldErrors[f.name]}
                onChange={(v) => setValue(f.name, v)}
                onToggle={(opt) => toggleMulti(f.name, opt)}
              />
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <Title icon={Building2} text="Who should we contact?" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company"><input value={company} onChange={(e) => setCompany(e.target.value)} className={inputCls} /></Field>
            <Field label="Full name *" error={fieldErrors.name}><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></Field>
            <Field label="Work email *" error={fieldErrors.email}><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></Field>
            <Field label="Phone"><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} /></Field>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <Title icon={ClipboardCheck} text="Review & submit" />
          <div className="space-y-2 rounded-2xl border border-steel/50 bg-abyss/40 p-5 text-sm">
            {config.fields.filter((f) => !isEmpty(values[f.name])).map((f) => (
              <Row key={f.name} label={f.label}>{display(values[f.name])}</Row>
            ))}
            <Row label="Contact">{name} · {email}</Row>
            {company && <Row label="Company">{company}</Row>}
          </div>

          <form action={action} className="mt-6">
            <div aria-hidden className="hidden">
              <input type="text" name="company_url" tabIndex={-1} autoComplete="off" />
            </div>
            <input type="hidden" name="serviceSlug" value={config.slug} />
            {config.fields.map((f) => {
              const v = values[f.name];
              if (Array.isArray(v)) {
                return v.map((item) => <input key={f.name + item} type="hidden" name={f.name} value={item} />);
              }
              return <input key={f.name} type="hidden" name={f.name} value={(v as string) ?? ""} />;
            })}
            <input type="hidden" name="company" value={company} />
            <input type="hidden" name="name" value={name} />
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="phone" value={phone} />
            <button type="submit" disabled={pending} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-cyan to-indigo px-6 py-3 text-sm font-semibold text-white shadow-soft transition-transform active:scale-95 disabled:opacity-50">
              {pending ? "Submitting…" : "Submit request"} <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-3 text-center text-xs text-mist">No payment is taken now.</p>
          </form>
        </div>
      )}

      {step < 2 && (
        <div className="mt-8 flex items-center justify-between">
          <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-mist transition-colors hover:text-foam disabled:opacity-0">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button type="button" onClick={next} className="inline-flex items-center gap-2 rounded-full bg-cyan px-6 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform active:scale-95">
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function initialValues(config: ServiceQuoteConfig): Values {
  const v: Values = {};
  for (const f of config.fields) v[f.name] = f.type === "multiselect" ? [] : "";
  return v;
}
function isEmpty(v: string | string[] | undefined): boolean {
  if (Array.isArray(v)) return v.length === 0;
  return !v || !v.trim();
}
function display(v: string | string[]): string {
  return Array.isArray(v) ? v.join(", ") : v;
}

function FieldInput({ field, value, error, onChange, onToggle }: {
  field: QuoteField;
  value: string | string[] | undefined;
  error?: string;
  onChange: (v: string) => void;
  onToggle: (opt: string) => void;
}) {
  const span = field.type === "textarea" || field.type === "multiselect" ? "sm:col-span-2" : "";
  return (
    <div className={span}>
      <Field label={field.required ? `${field.label} *` : field.label} error={error}>
        {field.type === "textarea" ? (
          <textarea value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={field.placeholder} className={cn(inputCls, "h-auto py-3")} />
        ) : field.type === "select" ? (
          <select value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className={inputCls}>
            <option value="" className="bg-deep">Select…</option>
            {field.options?.map((o) => <option key={o} value={o} className="bg-deep">{o}</option>)}
          </select>
        ) : field.type === "multiselect" ? (
          <div className="flex flex-wrap gap-2">
            {field.options?.map((o) => {
              const active = Array.isArray(value) && value.includes(o);
              return (
                <button key={o} type="button" onClick={() => onToggle(o)} className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active ? "border-cyan/60 bg-cyan/10 text-cyan" : "border-steel/60 text-mist hover:border-cyan/30",
                )}>
                  {o}
                </button>
              );
            })}
          </div>
        ) : (
          <input
            type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
            inputMode={field.type === "number" ? "numeric" : undefined}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={cn(inputCls, field.type === "date" && "[color-scheme:light]")}
          />
        )}
      </Field>
    </div>
  );
}

function Title({ icon: Icon, text }: { icon: typeof Boxes; text: string }) {
  return (
    <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-foam" style={{ fontFamily: "var(--font-display)" }}>
      <Icon className="h-5 w-5 text-cyan" /> {text}
    </h2>
  );
}
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foam">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-rose">{error}</span>}
    </label>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-mist">{label}</span>
      <span className="text-right font-medium text-foam">{children}</span>
    </div>
  );
}
