"use client";

import { useActionState, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  MapPin,
  Boxes,
  Sparkles,
  Leaf,
  ShieldCheck,
  Check,
  Clock,
  Ship,
  CalendarDays,
  CircleCheck,
  Anchor,
} from "lucide-react";
import {
  PORTS,
  CONTAINERS,
  computeQuotes,
  computeInsuranceFee,
  estimateDistanceKm,
  type Port,
  type ContainerType,
  type CargoMode,
  type QuoteOption,
} from "@/lib/quote-data";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { submitBooking } from "@/app/actions/leads";
import type { BookingState } from "@/lib/leads/types";

const STEPS = ["Route", "Cargo", "Rates", "Confirm"];

export function QuoteWizard() {
  const [step, setStep] = useState(0);

  // Form state
  const [originCode, setOriginCode] = useState("CNSHA");
  const [destCode, setDestCode] = useState("NLRTM");
  const [mode, setMode] = useState<CargoMode>("door-to-door");
  const [containerId, setContainerId] = useState("40hc");
  const [weight, setWeight] = useState("18000");
  const [readyDate, setReadyDate] = useState("");
  const [selectedOptionId, setSelectedOptionId] = useState<QuoteOption["id"]>("balanced");
  const [insurance, setInsurance] = useState(true);

  const origin = PORTS.find((p) => p.code === originCode)!;
  const destination = PORTS.find((p) => p.code === destCode)!;
  const container = CONTAINERS.find((c) => c.id === containerId)!;
  const samePort = originCode === destCode;

  const quotes = useMemo(
    () => computeQuotes({ origin, destination, container, mode }),
    [origin, destination, container, mode]
  );
  const distanceKm = useMemo(
    () => estimateDistanceKm({ origin, destination, container, mode }),
    [origin, destination, container, mode]
  );
  const selected = quotes.find((q) => q.id === selectedOptionId)!;

  const insuranceFee = computeInsuranceFee(selected.priceUSD);
  const total = selected.priceUSD + (insurance ? insuranceFee : 0);
  const bookingRef = useMemo(
    () => makeRef(originCode, destCode, containerId, selectedOptionId),
    [originCode, destCode, containerId, selectedOptionId]
  );

  const [bookingState, bookingAction, bookingPending] = useActionState<BookingState, FormData>(
    submitBooking,
    { status: "idle" },
  );

  const canNext = step === 0 ? !samePort : true;

  return (
    <section className="relative pt-28 pb-20 lg:pt-32">
      <div className="bg-grid absolute inset-0 -z-10 h-96" />
      <div className="absolute -left-32 top-10 -z-10 h-[28rem] w-[28rem] rounded-full bg-cyan/10 blur-[120px] animate-aurora" />

      <div className="mx-auto max-w-4xl px-5 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-cyan/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
            <Sparkles className="h-3.5 w-3.5" /> AI-Optimized Quote
          </span>
          <h1
            className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foam md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Your best route, <span className="text-gradient">priced in seconds.</span>
          </h1>
        </div>

        {/* Stepper */}
        <Stepper step={step} />

        {/* Panels */}
        <div className="glass mt-8 rounded-3xl p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
            >
              {step === 0 && (
                <RouteStep
                  originCode={originCode}
                  destCode={destCode}
                  setOriginCode={setOriginCode}
                  setDestCode={setDestCode}
                  mode={mode}
                  setMode={setMode}
                  samePort={samePort}
                  distanceKm={distanceKm}
                />
              )}
              {step === 1 && (
                <CargoStep
                  containerId={containerId}
                  setContainerId={setContainerId}
                  weight={weight}
                  setWeight={setWeight}
                  readyDate={readyDate}
                  setReadyDate={setReadyDate}
                />
              )}
              {step === 2 && (
                <RatesStep
                  quotes={quotes}
                  selectedOptionId={selectedOptionId}
                  setSelectedOptionId={setSelectedOptionId}
                  insurance={insurance}
                  setInsurance={setInsurance}
                  insuranceFee={insuranceFee}
                />
              )}
              {step === 3 && (
                <ConfirmStep
                  origin={origin}
                  destination={destination}
                  container={container}
                  mode={mode}
                  selected={selected}
                  insurance={insurance}
                  insuranceFee={insuranceFee}
                  total={total}
                  bookingRef={bookingRef}
                  originCode={originCode}
                  destCode={destCode}
                  containerId={containerId}
                  weight={weight}
                  readyDate={readyDate}
                  bookingState={bookingState}
                  bookingAction={bookingAction}
                  bookingPending={bookingPending}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Nav */}
          {step < 3 && (
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-mist transition-colors hover:text-foam disabled:pointer-events-none disabled:opacity-0"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={() => canNext && setStep((s) => s + 1)}
                disabled={!canNext}
                className="inline-flex items-center gap-2 rounded-full bg-cyan px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_30px_-6px_rgba(30,91,255,0.6)] transition-transform active:scale-95 disabled:opacity-40"
              >
                {step === 2 ? "Review & book" : "Continue"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Stepper ---------------- */
function Stepper({ step }: { step: number }) {
  return (
    <div className="mt-10 flex items-center justify-center">
      <ol className="flex w-full max-w-xl items-center">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-full border text-sm font-semibold transition-colors",
                    done && "border-cyan bg-cyan text-white",
                    active && "border-cyan bg-cyan/15 text-cyan",
                    !done && !active && "border-steel/60 text-mist"
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium",
                    active ? "text-foam" : "text-mist"
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span
                  className={cn(
                    "mx-2 h-px flex-1 transition-colors",
                    i < step ? "bg-cyan/60" : "bg-steel/60"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ---------------- Step 1: Route ---------------- */
function RouteStep(props: {
  originCode: string;
  destCode: string;
  setOriginCode: (v: string) => void;
  setDestCode: (v: string) => void;
  mode: CargoMode;
  setMode: (m: CargoMode) => void;
  samePort: boolean;
  distanceKm: number;
}) {
  return (
    <div>
      <StepTitle icon={MapPin} title="Where is your cargo going?" />
      <div className="grid gap-4 md:grid-cols-2">
        <PortSelect
          label="Origin"
          value={props.originCode}
          onChange={props.setOriginCode}
        />
        <PortSelect
          label="Destination"
          value={props.destCode}
          onChange={props.setDestCode}
        />
      </div>
      {props.samePort && (
        <p className="mt-3 text-sm text-amber-400">
          Origin and destination must be different.
        </p>
      )}

      <div className="mt-6">
        <p className="mb-2 text-sm font-medium text-foam">Service type</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              { id: "door-to-door", label: "Door-to-Door", desc: "Pickup to final delivery", icon: Boxes },
              { id: "port-to-port", label: "Port-to-Port", desc: "Terminal to terminal", icon: Anchor },
            ] as const
          ).map((opt) => {
            const Icon = opt.icon;
            const active = props.mode === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => props.setMode(opt.id)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-4 text-left transition-all",
                  active
                    ? "border-cyan/50 bg-cyan/10"
                    : "border-steel/50 bg-abyss/40 hover:border-cyan/30"
                )}
              >
                <Icon className={cn("h-6 w-6", active ? "text-cyan" : "text-mist")} />
                <span>
                  <span className="block text-sm font-medium text-foam">{opt.label}</span>
                  <span className="block text-xs text-mist">{opt.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {!props.samePort && (
        <p className="mt-6 inline-flex items-center gap-2 rounded-xl bg-abyss/40 px-3 py-2 text-xs text-mist">
          <Ship className="h-3.5 w-3.5 text-cyan" />
          Est. sea distance: ~{props.distanceKm.toLocaleString()} km
        </p>
      )}
    </div>
  );
}

function PortSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foam">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl border border-steel/60 bg-abyss/60 px-4 text-sm text-foam outline-none transition-colors focus:border-cyan/60"
      >
        {PORTS.map((p) => (
          <option key={p.code} value={p.code} className="bg-deep">
            {p.city}, {p.country} ({p.code})
          </option>
        ))}
      </select>
    </label>
  );
}

/* ---------------- Step 2: Cargo ---------------- */
function CargoStep(props: {
  containerId: string;
  setContainerId: (v: string) => void;
  weight: string;
  setWeight: (v: string) => void;
  readyDate: string;
  setReadyDate: (v: string) => void;
}) {
  return (
    <div>
      <StepTitle icon={Boxes} title="What are you shipping?" />
      <p className="mb-3 text-sm font-medium text-foam">Container / load type</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CONTAINERS.map((c) => {
          const active = props.containerId === c.id;
          return (
            <button
              key={c.id}
              onClick={() => props.setContainerId(c.id)}
              className={cn(
                "rounded-2xl border p-4 text-left transition-all",
                active
                  ? "border-cyan/50 bg-cyan/10"
                  : "border-steel/50 bg-abyss/40 hover:border-cyan/30"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foam">{c.label}</span>
                {active && <CircleCheck className="h-4 w-4 text-cyan" />}
              </div>
              <span className="mt-1 block text-xs text-mist">{c.detail}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foam">
            Cargo weight (kg)
          </span>
          <input
            type="number"
            min="0"
            value={props.weight}
            onChange={(e) => props.setWeight(e.target.value)}
            className="h-12 w-full rounded-2xl border border-steel/60 bg-abyss/60 px-4 text-sm text-foam outline-none transition-colors focus:border-cyan/60"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foam">
            Cargo ready date
          </span>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" />
            <input
              type="date"
              value={props.readyDate}
              onChange={(e) => props.setReadyDate(e.target.value)}
              className="h-12 w-full rounded-2xl border border-steel/60 bg-abyss/60 pl-11 pr-4 text-sm text-foam outline-none transition-colors focus:border-cyan/60 [color-scheme:light]"
            />
          </div>
        </label>
      </div>
    </div>
  );
}

/* ---------------- Step 3: Rates ---------------- */
function RatesStep(props: {
  quotes: QuoteOption[];
  selectedOptionId: QuoteOption["id"];
  setSelectedOptionId: (id: QuoteOption["id"]) => void;
  insurance: boolean;
  setInsurance: (v: boolean) => void;
  insuranceFee: number;
}) {
  return (
    <div>
      <StepTitle icon={Sparkles} title="AI-optimized options" />
      <div className="grid gap-3 lg:grid-cols-3">
        {props.quotes.map((q) => {
          const active = props.selectedOptionId === q.id;
          return (
            <button
              key={q.id}
              onClick={() => props.setSelectedOptionId(q.id)}
              className={cn(
                "relative flex flex-col rounded-2xl border p-5 text-left transition-all",
                active
                  ? "border-cyan/60 bg-cyan/10 glow-cyan"
                  : "border-steel/50 bg-abyss/40 hover:border-cyan/30"
              )}
            >
              {q.recommended && (
                <span className="absolute right-4 top-4 rounded-full bg-cyan px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white">
                  AI pick
                </span>
              )}
              <span className="flex items-center gap-2 text-sm font-semibold text-foam">
                {q.id === "green" && <Leaf className="h-4 w-4 text-emerald-400" />}
                {q.name}
              </span>
              <span className="mt-0.5 text-xs text-mist">{q.tagline}</span>

              <span
                className="mt-4 text-2xl font-semibold text-foam"
                style={{ fontFamily: "var(--font-display)" }}
              >
                ${q.priceUSD.toLocaleString()}
              </span>

              <div className="mt-3 space-y-1.5 text-xs text-mist">
                <span className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-cyan" /> {q.transitDays} days transit
                </span>
                <span className="flex items-center gap-2">
                  <Leaf className="h-3.5 w-3.5 text-emerald-400" />{" "}
                  {q.co2Kg.toLocaleString()} kg CO₂
                </span>
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-cyan" /> {q.riskLabel} risk
                </span>
              </div>

              <ul className="mt-4 space-y-1 border-t border-steel/40 pt-3">
                {q.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-xs text-mist">
                    <Check className="h-3 w-3 text-cyan" /> {h}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* Insurance upsell */}
      <button
        onClick={() => props.setInsurance(!props.insurance)}
        className={cn(
          "mt-4 flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all",
          props.insurance
            ? "border-cyan/50 bg-cyan/10"
            : "border-steel/50 bg-abyss/40 hover:border-cyan/30"
        )}
      >
        <span
          className={cn(
            "grid h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors",
            props.insurance ? "bg-cyan" : "bg-steel"
          )}
        >
          <span
            className={cn(
              "h-5 w-5 rounded-full bg-white transition-transform",
              props.insurance && "translate-x-5"
            )}
          />
        </span>
        <span className="flex-1">
          <span className="flex items-center gap-2 text-sm font-medium text-foam">
            <ShieldCheck className="h-4 w-4 text-cyan" /> Add cargo insurance
          </span>
          <span className="block text-xs text-mist">
            All-risk coverage with instant claims — recommended for high-value cargo.
          </span>
        </span>
        <span className="text-sm font-semibold text-foam">
          +${props.insuranceFee.toLocaleString()}
        </span>
      </button>
    </div>
  );
}

/* ---------------- Step 4: Confirm ---------------- */
function ConfirmStep(props: {
  origin: Port;
  destination: Port;
  container: ContainerType;
  mode: CargoMode;
  selected: QuoteOption;
  insurance: boolean;
  insuranceFee: number;
  total: number;
  bookingRef: string;
  originCode: string;
  destCode: string;
  containerId: string;
  weight: string;
  readyDate: string;
  bookingState: BookingState;
  bookingAction: (formData: FormData) => void;
  bookingPending: boolean;
}) {
  const { bookingState } = props;
  const fieldErrors = bookingState.status === "error" ? bookingState.fieldErrors ?? {} : {};

  if (bookingState.status === "success") {
    return (
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald/15 text-emerald">
          <CircleCheck className="h-8 w-8" />
        </span>
        <h2
          className="mt-4 text-2xl font-semibold text-foam"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Booking request received
        </h2>
        <p className="mt-1 text-sm text-mist">
          Reference{" "}
          <span className="font-semibold text-aqua">{bookingState.bookingRef}</span>. We&apos;ve
          emailed you a confirmation — our team will confirm availability and next steps.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-cyan/15 text-cyan">
        <CircleCheck className="h-8 w-8" />
      </span>
      <h2
        className="mt-4 text-2xl font-semibold text-foam"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Review &amp; request booking
      </h2>
      <p className="mt-1 text-sm text-mist">
        Reference{" "}
        <span className="font-semibold text-aqua">{props.bookingRef}</span>
      </p>

      <div className="mx-auto mt-6 max-w-md space-y-2 rounded-2xl border border-steel/50 bg-abyss/40 p-5 text-left text-sm">
        <Row label="Route">
          {props.origin.city} → {props.destination.city}
        </Row>
        <Row label="Service">
          {props.mode === "door-to-door" ? "Door-to-Door" : "Port-to-Port"}
        </Row>
        <Row label="Container">{props.container.label}</Row>
        <Row label="Option">
          {props.selected.name} · {props.selected.transitDays} days
        </Row>
        <Row label="Carbon">{props.selected.co2Kg.toLocaleString()} kg CO₂</Row>
        <Row label="Freight">${props.selected.priceUSD.toLocaleString()}</Row>
        {props.insurance && (
          <Row label="Insurance">+${props.insuranceFee.toLocaleString()}</Row>
        )}
        <div className="mt-2 flex items-center justify-between border-t border-steel/50 pt-3">
          <span className="text-foam">Total</span>
          <span
            className="text-xl font-semibold text-foam"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ${props.total.toLocaleString()}
          </span>
        </div>
      </div>

      <form action={props.bookingAction} className="mx-auto mt-6 max-w-md text-left">
        {/* Honeypot */}
        <div aria-hidden className="hidden">
          <input type="text" name="company_url" tabIndex={-1} autoComplete="off" />
        </div>
        {/* Hidden selection — server re-prices from these. */}
        <input type="hidden" name="originCode" value={props.originCode} />
        <input type="hidden" name="destCode" value={props.destCode} />
        <input type="hidden" name="mode" value={props.mode} />
        <input type="hidden" name="containerId" value={props.containerId} />
        <input type="hidden" name="optionId" value={props.selected.id} />
        <input type="hidden" name="insurance" value={props.insurance ? "true" : "false"} />
        <input type="hidden" name="weight" value={props.weight} />
        <input type="hidden" name="readyDate" value={props.readyDate} />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foam">Full name *</span>
            <input
              name="name"
              placeholder="Jane Shipper"
              className="h-12 w-full rounded-2xl border border-steel/60 bg-abyss/60 px-4 text-sm text-foam outline-none transition-colors focus:border-cyan/60"
            />
            {fieldErrors.name && <span className="mt-1 block text-xs text-rose">{fieldErrors.name}</span>}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foam">Work email *</span>
            <input
              type="email"
              name="email"
              placeholder="jane@acme.com"
              className="h-12 w-full rounded-2xl border border-steel/60 bg-abyss/60 px-4 text-sm text-foam outline-none transition-colors focus:border-cyan/60"
            />
            {fieldErrors.email && <span className="mt-1 block text-xs text-rose">{fieldErrors.email}</span>}
          </label>
        </div>

        {bookingState.status === "error" && (
          <p className="mt-3 text-sm text-rose">{bookingState.error}</p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="submit"
            disabled={props.bookingPending}
            className="inline-flex items-center gap-2 rounded-full bg-cyan px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_-6px_rgba(30,91,255,0.6)] transition-transform active:scale-95 disabled:opacity-40"
          >
            {props.bookingPending ? "Sending…" : "Request booking"} <ArrowRight className="h-4 w-4" />
          </button>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-aqua/30 px-6 py-3 text-sm font-medium text-foam transition-colors hover:bg-aqua/10"
          >
            Talk to an expert
          </a>
        </div>
        <p className="mt-4 text-center text-xs text-mist">
          No payment is taken now — our team confirms availability and next steps by email.
        </p>
      </form>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-mist">{label}</span>
      <span className="font-medium text-foam">{children}</span>
    </div>
  );
}

function StepTitle({
  icon: Icon,
  title,
}: {
  icon: typeof MapPin;
  title: string;
}) {
  return (
    <h2
      className="mb-5 flex items-center gap-2 text-lg font-semibold text-foam"
      style={{ fontFamily: "var(--font-display)" }}
    >
      <Icon className="h-5 w-5 text-cyan" />
      {title}
    </h2>
  );
}

/* Deterministic booking reference from inputs (no randomness). */
function makeRef(o: string, d: string, c: string, opt: string): string {
  const seed = `${o}${d}${c}${opt}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const num = (hash % 9000) + 1000;
  return `BR-${o.slice(0, 2)}${d.slice(0, 2)}-${num}`;
}
