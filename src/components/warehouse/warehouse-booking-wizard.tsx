"use client";

import { useActionState, useState } from "react";
import { ArrowRight, ArrowLeft, Check, CircleCheck, Boxes, Building2, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitWarehouseBooking, type WarehouseBookingState } from "@/app/actions/bookings";

type FacilityLite = {
  id: string;
  name: string;
  city: string;
  country: string;
  features: string[];
};

const STEPS = ["Requirements", "Company", "Review"];
const inputCls =
  "h-12 w-full rounded-2xl border border-steel/60 bg-abyss/60 px-4 text-sm text-foam outline-none transition-colors focus:border-cyan/60";

export function WarehouseBookingWizard({ facility }: { facility: FacilityLite }) {
  const [step, setStep] = useState(0);
  const [sqft, setSqft] = useState("");
  const [moveIn, setMoveIn] = useState("");
  const [term, setTerm] = useState("24");
  const [features, setFeatures] = useState<string[]>([]);
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [stepError, setStepError] = useState<string | null>(null);

  const [state, action, pending] = useActionState<WarehouseBookingState, FormData>(
    submitWarehouseBooking,
    { status: "idle" },
  );
  const fieldErrors = state.status === "error" ? state.fieldErrors ?? {} : {};

  function toggleFeature(f: string) {
    setFeatures((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));
  }

  function next() {
    if (step === 0 && (!(Number(sqft) > 0) || !moveIn)) {
      setStepError("Enter the space you need and a move-in date.");
      return;
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
          taken — our team will confirm availability at {facility.name} and email you next steps.
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
          <Title icon={Boxes} text="What do you need?" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Space needed (ft²) *" error={fieldErrors.sqftRequested}>
              <input value={sqft} onChange={(e) => setSqft(e.target.value)} inputMode="numeric" placeholder="20000" className={inputCls} />
            </Field>
            <Field label="Lease term (months) *" error={fieldErrors.termMonths}>
              <input value={term} onChange={(e) => setTerm(e.target.value)} inputMode="numeric" className={inputCls} />
            </Field>
            <Field label="Desired move-in *" error={fieldErrors.moveIn}>
              <input type="date" value={moveIn} onChange={(e) => setMoveIn(e.target.value)} className={cn(inputCls, "[color-scheme:light]")} />
            </Field>
          </div>
          {facility.features.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-foam">Features you need</p>
              <div className="flex flex-wrap gap-2">
                {facility.features.map((f) => (
                  <button key={f} type="button" onClick={() => toggleFeature(f)} className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    features.includes(f) ? "border-cyan/60 bg-cyan/10 text-cyan" : "border-steel/60 text-mist hover:border-cyan/30",
                  )}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}
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
            <div className="sm:col-span-2">
              <Field label="Message"><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className={cn(inputCls, "h-auto py-3")} /></Field>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <Title icon={ClipboardCheck} text="Review & submit" />
          <div className="space-y-2 rounded-2xl border border-steel/50 bg-abyss/40 p-5 text-sm">
            <Row label="Facility">{facility.name}, {facility.city}</Row>
            <Row label="Space">{Number(sqft).toLocaleString()} ft²</Row>
            <Row label="Term">{term} months</Row>
            <Row label="Move-in">{moveIn}</Row>
            <Row label="Features">{features.length ? features.join(", ") : "—"}</Row>
            <Row label="Contact">{name} · {email}</Row>
            {company && <Row label="Company">{company}</Row>}
          </div>

          <form action={action} className="mt-6">
            <div aria-hidden className="hidden">
              <input type="text" name="company_url" tabIndex={-1} autoComplete="off" />
            </div>
            <input type="hidden" name="facilityId" value={facility.id} />
            <input type="hidden" name="sqftRequested" value={sqft} />
            <input type="hidden" name="termMonths" value={term} />
            <input type="hidden" name="moveIn" value={moveIn} />
            <input type="hidden" name="company" value={company} />
            <input type="hidden" name="name" value={name} />
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="phone" value={phone} />
            <input type="hidden" name="message" value={message} />
            {features.map((f) => (
              <input key={f} type="hidden" name="features" value={f} />
            ))}
            <button type="submit" disabled={pending} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-cyan to-indigo px-6 py-3 text-sm font-semibold text-white shadow-soft transition-transform active:scale-95 disabled:opacity-50">
              {pending ? "Submitting…" : "Submit request"} <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-3 text-center text-xs text-mist">No payment is taken now.</p>
          </form>
        </div>
      )}

      {/* Nav (hide on review step, which has its own submit) */}
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
