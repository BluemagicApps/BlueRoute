"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Star,
  Ruler,
  MoveVertical,
  Truck,
  Zap,
  Check,
  Calculator,
  MapPin,
  Building2,
  ArrowRight,
} from "lucide-react";
import {
  FACILITIES,
  REGIONS,
  SIZE_BUCKETS,
  ALL_FEATURES,
  type Facility,
  type FacilityFeature,
} from "@/lib/warehouse-data";
import { WarehouseMap } from "./warehouse-map";
import { TransportPhoto } from "@/components/ui/transport-photo";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { cn } from "@/lib/utils";

const TYPE_COLOR: Record<Facility["type"], string> = {
  Smart: "bg-cyan/10 text-cyan",
  "Cold Chain": "bg-teal/10 text-teal",
  Bonded: "bg-indigo/10 text-indigo",
  Standard: "bg-amber/10 text-amber",
};

export function WarehouseExplorer() {
  const [region, setRegion] = useState("All regions");
  const [minSize, setMinSize] = useState(0);
  const [features, setFeatures] = useState<FacilityFeature[]>([]);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [term, setTerm] = useState(36);

  const filtered = useMemo(() => {
    return FACILITIES.filter((f) => {
      if (region !== "All regions" && f.region !== region) return false;
      if (f.sqft < minSize) return false;
      if (availableOnly && !f.available) return false;
      if (features.length && !features.every((ft) => f.features.includes(ft)))
        return false;
      return true;
    }).sort((a, b) => b.rating - a.rating);
  }, [region, minSize, features, availableOnly]);

  const aiPick = filtered[0] ?? null;
  const selected =
    filtered.find((f) => f.id === selectedId) ?? aiPick;

  const toggleFeature = (ft: FacilityFeature) =>
    setFeatures((prev) =>
      prev.includes(ft) ? prev.filter((x) => x !== ft) : [...prev, ft]
    );

  return (
    <section className="relative overflow-hidden pt-28 pb-20 lg:pt-32">
      <TransportPhoto
        src="/scenes/warehouse.jpg"
        className="h-[26rem]"
        scrim="from-abyss/85 via-abyss/60 to-abyss/30"
      />

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-cyan/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
            <Building2 className="h-3.5 w-3.5" /> Warehouse Leasing
          </span>
          <h1
            className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foam md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Smart space, <span className="text-gradient">matched by AI</span> to how
            you ship
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-mist">
            Search our network of smart facilities, filter by what matters, and
            let AI surface your best fit — with live leasing estimates.
          </p>
        </div>

        {/* Filters */}
        <div className="glass mt-8 rounded-3xl p-4 md:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <Select label="Region" value={region} onChange={setRegion} options={REGIONS} />
            <Select
              label="Min size"
              value={String(minSize)}
              onChange={(v) => setMinSize(Number(v))}
              options={SIZE_BUCKETS.map((b) => ({ label: b.label, value: String(b.min) }))}
            />
            <button
              onClick={() => setAvailableOnly((v) => !v)}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-medium transition-colors",
                availableOnly
                  ? "border-cyan/50 bg-cyan/10 text-cyan"
                  : "border-steel/70 bg-white text-mist hover:border-cyan/30"
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  availableOnly ? "bg-cyan" : "bg-mist/50"
                )}
              />
              Available now
            </button>
            <span className="ml-auto text-sm text-mist">
              {filtered.length} facilit{filtered.length === 1 ? "y" : "ies"}
            </span>
          </div>

          {/* Feature chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            {ALL_FEATURES.map((ft) => {
              const active = features.includes(ft);
              return (
                <button
                  key={ft}
                  onClick={() => toggleFeature(ft)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-indigo/50 bg-indigo/10 text-indigo"
                      : "border-steel/70 bg-white text-mist hover:border-indigo/30"
                  )}
                >
                  {ft}
                </button>
              );
            })}
          </div>
        </div>

        {/* AI match banner */}
        {aiPick && (
          <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-cyan/30 bg-gradient-to-r from-cyan/8 to-indigo/8 p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-aurora-gradient text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foam">
                AI match: {aiPick.name}
              </p>
              <p className="text-xs text-mist">
                Best fit for your filters — {aiPick.city}, {aiPick.country} ·{" "}
                {aiPick.sqft.toLocaleString()} ft² · ${aiPick.pricePerSqftYear}/ft²/yr
              </p>
            </div>
            <button
              onClick={() => setSelectedId(aiPick.id)}
              className="inline-flex items-center gap-1.5 rounded-full bg-aurora-gradient px-4 py-2 text-sm font-semibold text-white"
            >
              View <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Main grid */}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Facility list */}
          <div className="space-y-4">
            {filtered.length === 0 && (
              <div className="rounded-3xl border border-steel/70 bg-white p-10 text-center text-mist">
                No facilities match these filters. Try widening your search.
              </div>
            )}
            {filtered.map((f) => (
              <FacilityCard
                key={f.id}
                f={f}
                active={selected?.id === f.id}
                isAiPick={aiPick?.id === f.id}
                onSelect={() => setSelectedId(f.id)}
              />
            ))}
          </div>

          {/* Map + calculator */}
          <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="glass overflow-hidden rounded-3xl p-1.5">
              <div className="h-[420px] w-full overflow-hidden rounded-[1.35rem]">
                <WarehouseMap
                  facilities={filtered}
                  selectedId={selected?.id ?? null}
                  onSelect={setSelectedId}
                />
              </div>
            </div>
            {selected && (
              <LeasingCalculator facility={selected} term={term} setTerm={setTerm} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Facility card ---------------- */
function FacilityCard({
  f,
  active,
  isAiPick,
  onSelect,
}: {
  f: Facility;
  active: boolean;
  isAiPick: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      layout
      onClick={onSelect}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
      className={cn(
        "block w-full rounded-3xl border bg-white p-5 text-left shadow-soft transition-all hover:-translate-y-0.5",
        active ? "border-cyan/60 glow-cyan" : "border-steel/70 hover:border-cyan/30"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-foam">{f.name}</h3>
            <span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-semibold", TYPE_COLOR[f.type])}>
              {f.type}
            </span>
            {isAiPick && (
              <span className="inline-flex items-center gap-1 rounded-full bg-aurora-gradient px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white">
                <Sparkles className="h-3 w-3" /> AI pick
              </span>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-mist">
            <MapPin className="h-3.5 w-3.5" /> {f.city}, {f.country}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-foam">
          <Star className="h-4 w-4 fill-amber text-amber" /> {f.rating}
        </span>
      </div>

      {/* Specs */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Spec icon={Ruler} value={`${(f.sqft / 1000).toFixed(0)}k ft²`} />
        <Spec icon={MoveVertical} value={`${f.clearHeightM}m clear`} />
        <Spec icon={Truck} value={`${f.docks} docks`} />
        <Spec icon={Zap} value={`${f.powerMVA} MVA`} />
      </div>

      {/* Features */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {f.features.slice(0, 4).map((ft) => (
          <span
            key={ft}
            className="inline-flex items-center gap-1 rounded-md bg-abyss px-2 py-0.5 text-[0.7rem] text-mist"
          >
            <Check className="h-3 w-3 text-cyan" /> {ft}
          </span>
        ))}
        {f.features.length > 4 && (
          <span className="rounded-md px-2 py-0.5 text-[0.7rem] text-mist">
            +{f.features.length - 4} more
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-steel/60 pt-3">
        <span className="text-sm">
          <span className="font-semibold text-foam">${f.pricePerSqftYear}</span>
          <span className="text-mist">/ft²/yr</span>
        </span>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold",
            f.available ? "bg-emerald/10 text-emerald" : "bg-amber/10 text-amber"
          )}
        >
          {f.available ? "Available now" : `From ${f.availableFrom}`}
        </span>
      </div>
    </motion.button>
  );
}

function Spec({ icon: Icon, value }: { icon: typeof Ruler; value: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl bg-abyss px-2.5 py-2">
      <Icon className="h-4 w-4 text-cyan" />
      <span className="text-xs font-medium text-foam">{value}</span>
    </div>
  );
}

/* ---------------- Leasing calculator ---------------- */
const TERMS = [12, 24, 36, 60];

function discountFor(term: number) {
  if (term >= 60) return 0.15;
  if (term >= 36) return 0.08;
  if (term >= 24) return 0.04;
  return 0;
}

function LeasingCalculator({
  facility,
  term,
  setTerm,
}: {
  facility: Facility;
  term: number;
  setTerm: (n: number) => void;
}) {
  const annual = facility.sqft * facility.pricePerSqftYear;
  const discount = discountFor(term);
  const monthlyList = annual / 12;
  const monthly = monthlyList * (1 - discount);
  const total = monthly * term;

  return (
    <div className="glass rounded-3xl p-6">
      <h2
        className="flex items-center gap-2 text-base font-semibold text-foam"
        style={{ fontFamily: "var(--font-display)" }}
      >
        <Calculator className="h-5 w-5 text-cyan" /> Leasing calculator
      </h2>
      <p className="mt-1 text-xs text-mist">
        {facility.name} · {facility.sqft.toLocaleString()} ft²
      </p>

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium text-foam">Lease term</p>
        <div className="grid grid-cols-4 gap-2">
          {TERMS.map((t) => (
            <button
              key={t}
              onClick={() => setTerm(t)}
              className={cn(
                "rounded-xl border py-2 text-sm font-medium transition-colors",
                term === t
                  ? "border-cyan/60 bg-cyan/10 text-cyan"
                  : "border-steel/70 bg-white text-mist hover:border-cyan/30"
              )}
            >
              {t}mo
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-2 rounded-2xl bg-abyss p-4 text-sm">
        <Row label="List rate">
          ${(monthlyList).toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
        </Row>
        {discount > 0 && (
          <Row label={`AI-negotiated (−${Math.round(discount * 100)}%)`} accent>
            −$
            {(monthlyList - monthly).toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
            /mo
          </Row>
        )}
        <div className="flex items-center justify-between border-t border-steel/60 pt-2">
          <span className="text-mist">Monthly</span>
          <span
            className="text-lg font-semibold text-foam"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ${monthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        <Row label={`Total over ${term} mo`}>
          ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </Row>
      </div>

      <Link
        href={`/warehousing/book?facility=${facility.id}`}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-cyan to-indigo px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(30,91,255,0.65)] transition-transform active:scale-95"
      >
        Request this space <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function Row({
  label,
  children,
  accent,
}: {
  label: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={accent ? "text-emerald" : "text-mist"}>{label}</span>
      <span className={accent ? "font-medium text-emerald" : "font-medium text-foam"}>
        {children}
      </span>
    </div>
  );
}

/* ---------------- Select ---------------- */
function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: (string | { label: string; value: string })[];
}) {
  return (
    <label className="inline-flex h-11 items-center gap-2 rounded-2xl border border-steel/70 bg-white px-3 text-sm">
      <span className="text-mist">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent font-medium text-foam outline-none"
      >
        {options.map((o) => {
          const opt = typeof o === "string" ? { label: o, value: o } : o;
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}
