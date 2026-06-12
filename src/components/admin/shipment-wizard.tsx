"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  PackageCheck,
  AlertCircle,
} from "lucide-react";
import { createShipment } from "@/app/actions/shipments";
import { FREIGHT_TYPES, SHIPMENT_STATUSES } from "@/lib/admin/shipment-validate";
import { cn } from "@/lib/utils";

const STEPS = ["Recipient", "Sender", "Shipping", "Review"] as const;

const inputCls =
  "w-full rounded-2xl border border-steel bg-deep px-3.5 py-2.5 text-sm text-foam outline-none focus:border-cyan placeholder:text-mist/60";

type Values = Record<string, string>;

const INITIAL: Values = {
  receiver_name: "",
  receiver_email: "",
  receiver_phone: "",
  receiver_address: "",
  receiver_country: "",
  sender_name: "",
  sender_email: "",
  sender_phone: "",
  sender_address: "",
  sender_country: "",
  origin: "",
  destination: "",
  freight_type: "Sea Freight",
  content_type: "",
  weight_kg: "",
  qty: "",
  description: "",
  status: "Pending",
  date_shipped: "",
  expected_delivery: "",
  current_location: "",
  current_city: "",
  shipment_cost: "",
  clearance_cost: "",
  delivery_pct: "0",
};

/** Required fields per step (client-side gate before advancing). */
const REQUIRED: Record<number, (keyof typeof INITIAL)[]> = {
  0: ["receiver_name"],
  1: ["sender_name"],
  2: ["origin", "destination"],
};

export function ShipmentWizard() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(INITIAL);
  const [stepError, setStepError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<{ trackingNumber: string; id: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  function next() {
    const missing = (REQUIRED[step] ?? []).filter((k) => !values[k].trim());
    if (missing.length) {
      setStepError("Please fill the required fields before continuing.");
      return;
    }
    setStepError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function submit() {
    startTransition(async () => {
      setServerError(null);
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => fd.set(k, v));
      const photo = photoRef.current?.files?.[0];
      if (photo) fd.set("photo", photo);
      const res = await createShipment(fd);
      if (res.ok && res.trackingNumber && res.id) {
        setDone({ trackingNumber: res.trackingNumber, id: res.id });
      } else {
        setServerError(
          res.error ??
            Object.values(res.errors ?? {})[0] ??
            "Could not create the shipment.",
        );
      }
    });
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-steel/70 bg-deep p-8 text-center shadow-soft">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald/10 text-emerald">
          <PackageCheck className="h-7 w-7" />
        </span>
        <h2
          className="mt-5 text-xl font-semibold text-foam"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Shipment created
        </h2>
        <p className="mt-2 text-sm text-mist">Tracking number</p>
        <p
          className="mt-1 text-3xl font-bold tracking-wide text-cyan"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {done.trackingNumber}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(done.trackingNumber);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-steel bg-abyss px-4 py-2.5 text-sm font-medium text-foam"
          >
            {copied ? <Check className="h-4 w-4 text-emerald" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy number"}
          </button>
          <Link
            href={`/admin/shipments/${done.id}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-cyan to-indigo px-4 py-2.5 text-sm font-semibold text-white"
          >
            Manage shipment <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => {
              setValues(INITIAL);
              setStep(0);
              setDone(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-steel bg-abyss px-4 py-2.5 text-sm font-medium text-foam"
          >
            Create another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-steel/70 bg-deep p-6 shadow-soft md:p-8">
      {/* Stepper */}
      <ol className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                i < step
                  ? "bg-emerald/15 text-emerald"
                  : i === step
                    ? "bg-gradient-to-br from-cyan to-indigo text-white"
                    : "bg-steel/60 text-mist",
              )}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={cn("hidden text-xs font-medium sm:block", i === step ? "text-foam" : "text-mist")}>
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-steel/70" />}
          </li>
        ))}
      </ol>

      {(stepError || serverError) && (
        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-rose/10 p-3 text-sm text-rose">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {stepError ?? serverError}
        </p>
      )}

      <div className="mt-6">
        {step === 0 && (
          <Grid>
            <L label="Full name *"><input value={values.receiver_name} onChange={set("receiver_name")} className={inputCls} /></L>
            <L label="Email"><input value={values.receiver_email} onChange={set("receiver_email")} className={inputCls} /></L>
            <L label="Phone"><input value={values.receiver_phone} onChange={set("receiver_phone")} className={inputCls} /></L>
            <L label="Country"><input value={values.receiver_country} onChange={set("receiver_country")} className={inputCls} /></L>
            <L label="Contact address" full><input value={values.receiver_address} onChange={set("receiver_address")} className={inputCls} /></L>
          </Grid>
        )}

        {step === 1 && (
          <Grid>
            <L label="Full name *"><input value={values.sender_name} onChange={set("sender_name")} className={inputCls} /></L>
            <L label="Email"><input value={values.sender_email} onChange={set("sender_email")} className={inputCls} /></L>
            <L label="Phone"><input value={values.sender_phone} onChange={set("sender_phone")} className={inputCls} /></L>
            <L label="Country"><input value={values.sender_country} onChange={set("sender_country")} className={inputCls} /></L>
            <L label="Address" full><input value={values.sender_address} onChange={set("sender_address")} className={inputCls} /></L>
          </Grid>
        )}

        {step === 2 && (
          <Grid>
            <L label="Origin (take-off point) *"><input value={values.origin} onChange={set("origin")} className={inputCls} /></L>
            <L label="Final destination *"><input value={values.destination} onChange={set("destination")} className={inputCls} /></L>
            <L label="Freight type">
              <select value={values.freight_type} onChange={set("freight_type")} className={inputCls}>
                {FREIGHT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </L>
            <L label="Content type"><input value={values.content_type} onChange={set("content_type")} placeholder="Container, Parcel…" className={inputCls} /></L>
            <L label="Weight (kg)"><input value={values.weight_kg} onChange={set("weight_kg")} inputMode="decimal" className={inputCls} /></L>
            <L label="Quantity"><input value={values.qty} onChange={set("qty")} inputMode="numeric" className={inputCls} /></L>
            <L label="Status">
              <select value={values.status} onChange={set("status")} className={inputCls}>
                {SHIPMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </L>
            <L label="Delivery completed (%)"><input value={values.delivery_pct} onChange={set("delivery_pct")} inputMode="numeric" className={inputCls} /></L>
            <L label="Date shipped"><input type="date" value={values.date_shipped} onChange={set("date_shipped")} className={inputCls} /></L>
            <L label="Expected delivery"><input type="date" value={values.expected_delivery} onChange={set("expected_delivery")} className={inputCls} /></L>
            <L label="Current location"><input value={values.current_location} onChange={set("current_location")} className={inputCls} /></L>
            <L label="Current city (map)"><input value={values.current_city} onChange={set("current_city")} className={inputCls} /></L>
            <L label="Shipment cost (USD)"><input value={values.shipment_cost} onChange={set("shipment_cost")} inputMode="decimal" className={inputCls} /></L>
            <L label="Clearance cost (USD)"><input value={values.clearance_cost} onChange={set("clearance_cost")} inputMode="decimal" className={inputCls} /></L>
            <L label="Brief description" full><textarea value={values.description} onChange={set("description")} rows={2} className={inputCls} /></L>
            <L label="Cargo photo (optional)" full>
              <input ref={photoRef} type="file" accept="image/*" className="text-sm text-mist file:mr-3 file:rounded-full file:border-0 file:bg-steel/60 file:px-4 file:py-2 file:text-sm file:font-medium file:text-foam" />
            </L>
          </Grid>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <ReviewBlock title="Recipient" rows={[
              ["Name", values.receiver_name],
              ["Email", values.receiver_email],
              ["Country", values.receiver_country],
            ]} />
            <ReviewBlock title="Sender" rows={[
              ["Name", values.sender_name],
              ["Email", values.sender_email],
              ["Country", values.sender_country],
            ]} />
            <ReviewBlock title="Shipping" rows={[
              ["Route", `${values.origin} → ${values.destination}`],
              ["Freight", values.freight_type],
              ["Status", values.status],
              ["Weight", values.weight_kg && `${values.weight_kg} kg`],
              ["Shipped", values.date_shipped],
              ["Expected", values.expected_delivery],
            ]} />
            <p className="text-xs text-mist">
              The tracking number is generated automatically when you create the
              shipment, and an initial log entry is written from the origin.
            </p>
          </div>
        )}
      </div>

      {/* Nav buttons */}
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || pending}
          className="inline-flex items-center gap-1.5 rounded-full border border-steel bg-abyss px-4 py-2.5 text-sm font-medium text-foam disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-cyan to-indigo px-5 py-2.5 text-sm font-semibold text-white shadow-soft"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-cyan to-indigo px-5 py-2.5 text-sm font-semibold text-white shadow-soft disabled:opacity-60"
          >
            {pending ? "Creating…" : "Generate tracking"} <PackageCheck className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function L({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <label className={cn("block text-sm", full && "md:col-span-2")}>
      <span className="font-medium text-foam">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function ReviewBlock({ title, rows }: { title: string; rows: [string, string | undefined][] }) {
  return (
    <div className="rounded-2xl border border-steel/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-mist">{title}</p>
      <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
        {rows
          .filter(([, v]) => v && v.trim())
          .map(([k, v]) => (
            <div key={k} className="flex gap-2 text-sm">
              <dt className="text-mist">{k}:</dt>
              <dd className="font-medium text-foam">{v}</dd>
            </div>
          ))}
      </dl>
    </div>
  );
}
