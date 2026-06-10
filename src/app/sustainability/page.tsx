import type { Metadata } from "next";
import Link from "next/link";
import {
  Leaf,
  Gauge,
  Droplet,
  Route as RouteIcon,
  Sun,
  BadgeCheck,
  LineChart,
  ArrowRight,
} from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { CarbonEstimator } from "@/components/sustainability/carbon-estimator";

export const metadata: Metadata = {
  title: "Sustainability",
  description:
    "Blue Route is decarbonizing global trade — carbon on every quote, green-corridor lanes, biofuels, solar smart warehouses, and a path to net-zero by 2040.",
};

const STATS = [
  { v: "−26%", l: "Emissions, Green Route" },
  { v: "14", l: "Green-corridor lanes" },
  { v: "40%", l: "Solar-powered hubs" },
  { v: "2040", l: "Net-zero operations" },
];

const INITIATIVES = [
  {
    icon: Gauge,
    title: "Slow steaming",
    body: "Optimized vessel speeds cut fuel burn dramatically on flexible lanes — the AI picks when it's worth it.",
  },
  {
    icon: Droplet,
    title: "Biofuels & alt fuels",
    body: "Blended biofuels today, methanol and ammonia-ready partners for tomorrow's fleet.",
  },
  {
    icon: RouteIcon,
    title: "Green corridors",
    body: "Dedicated low-emission lanes between key ports, prioritized by the route optimizer.",
  },
  {
    icon: Sun,
    title: "Solar smart warehouses",
    body: "On-site solar, EV charging, and intelligent energy management across our hubs.",
  },
  {
    icon: LineChart,
    title: "Carbon on every quote",
    body: "A live CO₂ figure on every rate, so the lower-carbon choice is always visible.",
  },
  {
    icon: BadgeCheck,
    title: "Verified offsets",
    body: "Gold-standard verified offset projects for the emissions we can't yet eliminate.",
  },
];

const ROADMAP = [
  { year: "2026", title: "Baseline & transparency", body: "Carbon on every shipment; full Scope 1–3 measurement." },
  { year: "2030", title: "−50% intensity", body: "Half the emissions per container vs. 2026, fleet-wide." },
  { year: "2040", title: "Net-zero operations", body: "Net-zero across owned operations and warehouses." },
  { year: "2050", title: "Net-zero value chain", body: "Full Scope 3 net-zero across partners and suppliers." },
];

export default function SustainabilityPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-16 lg:pt-40">
        <div className="bg-grid absolute inset-0 -z-10 h-96" />
        <div className="absolute -left-32 top-10 -z-10 h-[30rem] w-[30rem] rounded-full bg-emerald/20 blur-[120px] animate-aurora" />
        <div className="absolute -right-24 top-24 -z-10 h-[28rem] w-[28rem] rounded-full bg-teal/20 blur-[130px] animate-aurora" />

        <div className="mx-auto max-w-3xl px-5 text-center lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald/30 bg-emerald/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald">
            <Leaf className="h-3.5 w-3.5" /> Sustainability
          </span>
          <h1
            className="mt-6 text-balance text-4xl font-semibold leading-[1.04] tracking-tight text-foam md:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Decarbonizing global trade,{" "}
            <span className="text-gradient-green">route by route.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-mist">
            Lower-carbon shipping shouldn&apos;t mean slower or pricier. We make
            the greener choice visible, measurable, and easy — on every shipment.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/quote"
              className="bg-eco-gradient inline-flex h-[3.25rem] items-center justify-center gap-2 rounded-full px-7 text-base font-semibold text-white shadow-[0_12px_36px_-8px_rgba(16,185,129,0.5)] transition-transform hover:-translate-y-0.5"
            >
              Quote a green route <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/about"
              className="inline-flex h-[3.25rem] items-center justify-center rounded-full border border-emerald/40 px-7 text-base font-medium text-foam transition-colors hover:bg-emerald/10"
            >
              Our story
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-10">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid grid-cols-2 gap-6 rounded-3xl border border-emerald/25 bg-gradient-to-r from-emerald/8 to-teal/8 p-8 md:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal key={s.l} delay={i * 0.07}>
                <p
                  className="text-gradient-green text-4xl font-semibold tracking-tight lg:text-5xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {s.v}
                </p>
                <p className="mt-1 text-sm text-mist">{s.l}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Carbon estimator */}
      <section className="relative py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            eyebrow="Try it"
            title={
              <>
                See your footprint — and the{" "}
                <span className="text-gradient-green">savings</span>
              </>
            }
            subtitle="Estimate the emissions of a shipment and what switching to the Green Route saves."
          />
          <div className="mt-10">
            <Reveal>
              <CarbonEstimator />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Initiatives */}
      <section className="relative py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading eyebrow="How we do it" title="Six levers, one lower-carbon network" />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INITIATIVES.map((it, i) => {
              const Icon = it.icon;
              return (
                <Reveal key={it.title} delay={i * 0.05}>
                  <article className="h-full rounded-3xl border border-steel/70 bg-deep p-6 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:border-emerald/40">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald/10 text-emerald">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3
                      className="mt-5 text-lg font-semibold text-foam"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {it.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-mist">{it.body}</p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="relative py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading eyebrow="The roadmap" title="Our path to net-zero" />
          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {ROADMAP.map((r, i) => (
              <Reveal key={r.year} delay={i * 0.07}>
                <div className="relative h-full rounded-3xl border border-steel/70 bg-deep p-6 shadow-soft">
                  <span className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full bg-emerald/10 text-emerald">
                    <Leaf className="h-3.5 w-3.5" />
                  </span>
                  <p
                    className="text-gradient-green text-3xl font-semibold"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {r.year}
                  </p>
                  <h3 className="mt-2 text-sm font-semibold text-foam">{r.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-mist">{r.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
