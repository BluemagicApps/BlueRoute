import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SERVICES, type ServiceColor } from "@/lib/services-data";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { TransportBackdrop } from "@/components/ui/transport-backdrop";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Blue Route's complete logistics network — ocean, air, and land freight, door-to-door, project cargo, cold chain, and customs — all on one predictive backbone.",
};

const CHIP: Record<ServiceColor, string> = {
  cyan: "bg-cyan/10 text-cyan group-hover:bg-cyan group-hover:text-white",
  aqua: "bg-aqua/10 text-aqua group-hover:bg-aqua group-hover:text-white",
  indigo: "bg-indigo/10 text-indigo group-hover:bg-indigo group-hover:text-white",
  teal: "bg-teal/10 text-teal group-hover:bg-teal group-hover:text-white",
  amber: "bg-amber/10 text-amber group-hover:bg-amber group-hover:text-white",
  emerald: "bg-emerald/10 text-emerald group-hover:bg-emerald group-hover:text-white",
};

export default function ServicesPage() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40">
      <div className="bg-grid absolute inset-0 -z-10 h-96" />
      <div className="absolute -right-28 top-12 -z-10 h-[28rem] w-[28rem] rounded-full bg-indigo/20 blur-[120px] animate-aurora" />
      <TransportBackdrop mode="all" />

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-cyan/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
            Services
          </span>
          <h1
            className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foam md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            One network. <span className="text-gradient">Every mode.</span>
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-mist">
            From a single container to a heavy-lift project, every Blue Route
            service runs on the same predictive backbone — so visibility, risk,
            and optimization follow your cargo across every leg.
          </p>
        </div>

        {/* Service cards */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={s.slug} delay={i * 0.05}>
                <Link
                  href={`/services/${s.slug}`}
                  className="group flex h-full flex-col rounded-3xl border border-steel/70 bg-deep p-7 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:border-cyan/40"
                >
                  <div className="flex items-start justify-between">
                    <span className={`grid h-12 w-12 place-items-center rounded-2xl transition-colors ${CHIP[s.color]}`}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <ArrowUpRight className="h-5 w-5 text-mist transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan" />
                  </div>
                  <h2
                    className="mt-5 text-lg font-semibold text-foam"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {s.title}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-mist">
                    {s.tagline}
                  </p>
                  <span className="mt-4 text-sm font-semibold text-cyan">
                    Learn more →
                  </span>
                </Link>
              </Reveal>
            );
          })}

          {/* Warehouse cross-link */}
          <Reveal delay={SERVICES.length * 0.05}>
            <Link
              href="/warehousing"
              className="group flex h-full flex-col justify-between rounded-3xl border border-cyan/25 bg-gradient-to-br from-white/70 to-navy/40 p-7 shadow-soft transition-all duration-500 hover:-translate-y-1"
            >
              <div>
                <h2
                  className="text-lg font-semibold text-foam"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Warehouse Leasing
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-mist">
                  Smart, AI-matched facilities near the ports you ship through —
                  with live leasing estimates.
                </p>
              </div>
              <span className="mt-4 text-sm font-semibold text-cyan">
                Explore facilities →
              </span>
            </Link>
          </Reveal>
        </div>

        {/* CTA */}
        <div className="mt-14 flex flex-col items-center gap-4 rounded-3xl border border-steel/60 bg-gradient-to-r from-white/60 to-navy/40 p-8 text-center">
          <h2
            className="text-2xl font-semibold text-foam"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Not sure which service fits?
          </h2>
          <p className="max-w-md text-mist">
            Tell us your route and cargo — the AI Advisor or our team will map the
            optimal mix in minutes.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button href="/quote" variant="primary" size="lg">
              Get a quote
            </Button>
            <Button href="/contact" variant="outline" size="lg">
              Talk to an expert
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
