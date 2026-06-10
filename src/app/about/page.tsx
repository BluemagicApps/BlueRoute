import type { Metadata } from "next";
import Link from "next/link";
import {
  Target,
  Leaf,
  ShieldCheck,
  Sparkles,
  Heart,
  Globe2,
  Quote,
  ArrowRight,
  Anchor,
} from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Blue Route Logistics is on a mission to make global shipping intelligent — AI-powered door-to-door container logistics and smart warehouse leasing across 180+ countries.",
};

const STATS = [
  { v: "180+", l: "Countries served" },
  { v: "2.4M", l: "Containers / year" },
  { v: "9", l: "Smart warehouse hubs" },
  { v: "94%", l: "On-time, AI-verified" },
];

const VALUES = [
  {
    icon: Sparkles,
    color: "cyan",
    title: "Predictive by default",
    body: "We'd rather prevent a delay than apologize for one. Intelligence is built into every shipment, not bolted on.",
  },
  {
    icon: Heart,
    color: "rose",
    title: "Customer-obsessed",
    body: "Your supply chain is our scorecard. We measure ourselves on your on-time delivery, not our utilization.",
  },
  {
    icon: Leaf,
    color: "emerald",
    title: "Sustainable by design",
    body: "Every route carries a carbon number, and we make the greener option the easy option.",
  },
  {
    icon: ShieldCheck,
    color: "indigo",
    title: "Radically transparent",
    body: "Live visibility, honest ETAs with confidence scores, and no surprises buried in fine print.",
  },
];

const TIMELINE = [
  { year: "2019", title: "Founded in Rotterdam", body: "Two freight veterans set out to fix reactive logistics." },
  { year: "2021", title: "Door-to-door network", body: "Expanded to full origin-to-destination coverage across Asia–Europe." },
  { year: "2023", title: "The AI Edge launches", body: "Predictive ETAs and agentic planning go live for every customer." },
  { year: "2025", title: "Smart warehousing", body: "Launched AI-matched leasing across 9 global smart hubs." },
  { year: "2026", title: "180+ countries", body: "Now moving 2.4M containers a year on the world's smartest network." },
];

const LEADERS = [
  { name: "Lena Vos", role: "Co-founder & CEO", initials: "LV", color: "from-cyan to-indigo" },
  { name: "Marcus Aiyer", role: "Co-founder & CTO", initials: "MA", color: "from-indigo to-rose" },
  { name: "Sofia Marin", role: "Chief Operations Officer", initials: "SM", color: "from-teal to-cyan" },
  { name: "Tomas Berg", role: "Head of AI", initials: "TB", color: "from-emerald to-teal" },
];

const CHIP: Record<string, string> = {
  cyan: "bg-cyan/10 text-cyan",
  rose: "bg-rose/10 text-rose",
  emerald: "bg-emerald/10 text-emerald",
  indigo: "bg-indigo/10 text-indigo",
};

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-16 lg:pt-40">
        <div className="bg-grid absolute inset-0 -z-10 h-96" />
        <div className="absolute -left-32 top-10 -z-10 h-[30rem] w-[30rem] rounded-full bg-cyan/20 blur-[120px] animate-aurora" />
        <div className="absolute -right-24 top-24 -z-10 h-[28rem] w-[28rem] rounded-full bg-indigo/20 blur-[130px] animate-aurora" />

        <div className="mx-auto max-w-3xl px-5 text-center lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-cyan/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
            <Anchor className="h-3.5 w-3.5" /> About Blue Route
          </span>
          <h1
            className="mt-6 text-balance text-4xl font-semibold leading-[1.04] tracking-tight text-foam md:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            We&apos;re making global shipping{" "}
            <span className="text-gradient">intelligent.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-mist">
            Blue Route Logistics moves containers door-to-door to and from any
            country — and pairs every shipment with AI that predicts, optimizes,
            and resolves before problems reach you.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button href="/quote" variant="primary" size="lg">
              Get a quote
            </Button>
            <Button href="/careers" variant="outline" size="lg">
              Join the team
            </Button>
          </div>
        </div>
      </section>

      {/* Mission + pull quote */}
      <section className="relative py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-cyan/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
              <Target className="h-3.5 w-3.5" /> Our mission
            </span>
            <h2
              className="mt-4 text-3xl font-semibold leading-[1.1] tracking-tight text-foam md:text-4xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              The industry runs on hope. We run on foresight.
            </h2>
            <p className="mt-4 text-mist">
              Global trade still moves on static schedules and reactive emails.
              When something slips, you find out last. We started Blue Route to
              flip that — to give every shipper the predictive intelligence the
              biggest carriers keep locked away or do poorly.
            </p>
            <p className="mt-3 text-mist">
              Today our platform fuses live ocean, port, and weather signals with
              agentic AI, so your cargo is continuously re-optimized for cost,
              speed, and carbon — and you stay a step ahead, always.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative overflow-hidden rounded-3xl border border-cyan/20 bg-gradient-to-br from-white/70 to-navy/40 p-8 shadow-soft">
              <Quote className="h-9 w-9 text-cyan" />
              <p
                className="mt-4 text-xl font-medium leading-relaxed text-foam"
                style={{ fontFamily: "var(--font-display)" }}
              >
                &ldquo;Logistics shouldn&apos;t be a black box. Every container
                should arrive expected, on time, and accounted for — that&apos;s
                the standard we&apos;re building.&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-cyan to-indigo text-sm font-bold text-white">
                  LV
                </span>
                <div>
                  <p className="text-sm font-semibold text-foam">Lena Vos</p>
                  <p className="text-xs text-mist">Co-founder & CEO</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-10">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid grid-cols-2 gap-6 rounded-3xl border border-steel/60 bg-gradient-to-r from-white/60 to-navy/40 p-8 md:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal key={s.l} delay={i * 0.07}>
                <p
                  className="text-gradient text-4xl font-semibold tracking-tight lg:text-5xl"
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

      {/* Values */}
      <section className="relative py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            eyebrow="What we believe"
            title="The principles behind every shipment"
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <Reveal key={v.title} delay={i * 0.06}>
                  <article className="h-full rounded-3xl border border-steel/70 bg-deep p-6 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:border-cyan/40">
                    <span className={`grid h-12 w-12 place-items-center rounded-2xl ${CHIP[v.color]}`}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3
                      className="mt-5 text-lg font-semibold text-foam"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {v.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-mist">{v.body}</p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="relative py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading eyebrow="Our journey" title="From a Rotterdam idea to a global network" />
          <div className="mt-12 grid gap-4 md:grid-cols-5">
            {TIMELINE.map((t, i) => (
              <Reveal key={t.year} delay={i * 0.06}>
                <div className="relative h-full rounded-3xl border border-steel/70 bg-deep p-5 shadow-soft">
                  <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-cyan" />
                  <p
                    className="text-gradient text-2xl font-semibold"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {t.year}
                  </p>
                  <h3 className="mt-2 text-sm font-semibold text-foam">{t.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-mist">{t.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="relative py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading eyebrow="Leadership" title="The people steering Blue Route" />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LEADERS.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.06}>
                <article className="rounded-3xl border border-steel/70 bg-deep p-6 text-center shadow-soft transition-all duration-500 hover:-translate-y-1 hover:border-cyan/40">
                  <span
                    className={`mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br ${p.color} text-xl font-bold text-white`}
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {p.initials}
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-foam">{p.name}</h3>
                  <p className="text-sm text-mist">{p.role}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Sustainability teaser */}
      <section className="relative py-12">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-emerald/30 bg-gradient-to-r from-emerald/8 to-teal/8 p-8 md:p-10">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald/20 blur-3xl" />
            <div className="relative flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald">
                  <Leaf className="h-4 w-4" /> Sustainability
                </span>
                <h2
                  className="mt-3 text-2xl font-semibold tracking-tight text-foam md:text-3xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Decarbonizing global trade, route by route
                </h2>
                <p className="mt-2 text-mist">
                  Carbon on every quote, green-corridor lanes, and a path to
                  net-zero operations.
                </p>
              </div>
              <Link
                href="/sustainability"
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-br from-emerald to-teal px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                Our commitment <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="bg-aurora-gradient relative overflow-hidden rounded-3xl p-10 text-center shadow-soft md:p-14">
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/25 blur-3xl" />
            <div className="relative mx-auto max-w-xl">
              <Globe2 className="mx-auto h-10 w-10 text-white" />
              <h2
                className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Ship with a partner that thinks ahead
              </h2>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/quote"
                  className="inline-flex h-[3.25rem] items-center justify-center rounded-full bg-white px-7 text-base font-semibold text-cyan shadow-lg transition-transform hover:-translate-y-0.5"
                >
                  Get an instant quote
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex h-[3.25rem] items-center justify-center rounded-full border border-white/50 px-7 text-base font-medium text-white transition-colors hover:bg-white/10"
                >
                  Talk to us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
