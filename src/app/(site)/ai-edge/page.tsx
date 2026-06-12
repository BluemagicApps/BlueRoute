import type { Metadata } from "next";
import Link from "next/link";
import {
  Bot,
  LineChart,
  Route as RouteIcon,
  Radar,
  Check,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { OpenAdvisorButton } from "@/components/ai/open-advisor-button";
import { PredictiveDashboard } from "@/components/ai/predictive-dashboard";

export const metadata: Metadata = {
  title: "The AI Edge",
  description:
    "BlueRoute's AI Edge: an agentic assistant, predictive insights, route optimization, and proactive exception resolution that legacy carriers can't match.",
};

const CHIP: Record<string, string> = {
  cyan: "bg-cyan/10 text-cyan",
  indigo: "bg-indigo/10 text-indigo",
  teal: "bg-teal/10 text-teal",
  emerald: "bg-emerald/10 text-emerald",
};

const CAPABILITIES = [
  {
    id: "assistant",
    icon: Bot,
    color: "cyan",
    title: "BlueRoute AI Assistant",
    body: "An agentic chat & voice copilot that doesn't just answer — it acts. Ask it to plan a multi-leg shipment, run a 'what-if' on the Red Sea, or compare warehouse options, and it executes the steps for you.",
    bullets: ["Chat + voice", "Multi-step agentic planning", "Quotes, tracking & risk in one place"],
  },
  {
    id: "predictive",
    icon: LineChart,
    color: "indigo",
    title: "Predictive Insights",
    body: "Delay probabilities, cost forecasts, and route alternatives computed from 40+ live signals per lane — so you decide ahead of disruptions instead of reacting to them.",
    bullets: ["Delay probability scoring", "8-week cost forecasting", "Ranked route alternatives"],
  },
  {
    id: "optimizer",
    icon: RouteIcon,
    color: "teal",
    title: "AI Route Optimizer",
    body: "Every shipment is optimized across cost, transit time, and emissions using live ocean, port, and weather data — with a congestion-avoiding backup lane always on standby.",
    bullets: ["Cost vs. time vs. carbon", "Live congestion avoidance", "−26% emissions options"],
  },
  {
    id: "radar",
    icon: Radar,
    color: "emerald",
    title: "Proactive Resolution",
    body: "Exceptions are detected early and resolved automatically — re-routing, re-booking, or pre-clearing customs — so you get a fix in your inbox, not just an alert.",
    bullets: ["Early exception detection", "Auto re-route & re-book", "Customs pre-clearance"],
  },
];

const STATS = [
  { v: "3.5d", l: "Avg. delay avoided" },
  { v: "99%", l: "ETA confidence" },
  { v: "−26%", l: "Emissions option" },
  { v: "60s", l: "To an AI quote" },
];

export default function AiEdgePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-16 lg:pt-40">
        <div className="bg-grid absolute inset-0 -z-10 h-96" />
        <div className="absolute -left-32 top-10 -z-10 h-[30rem] w-[30rem] rounded-full bg-cyan/25 blur-[120px] animate-aurora" />
        <div className="absolute -right-24 top-20 -z-10 h-[28rem] w-[28rem] rounded-full bg-indigo/25 blur-[130px] animate-aurora" />

        <div className="mx-auto max-w-3xl px-5 text-center lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-cyan/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
            <Sparkles className="h-3.5 w-3.5" /> The AI Edge
          </span>
          <h1
            className="mt-6 text-balance text-4xl font-semibold leading-[1.04] tracking-tight text-foam md:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Logistics that <span className="text-gradient">thinks ahead.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-mist">
            MSC and Maersk tell you a container is late after it&apos;s late.
            Blue Route&apos;s AI sees it coming, weighs the options, and acts — the
            edge competitors can&apos;t match.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <OpenAdvisorButton />
            <Link
              href="/quote"
              className="inline-flex h-[3.25rem] items-center justify-center gap-2 rounded-full border border-aqua/40 px-7 text-base font-medium text-foam transition-colors hover:bg-aqua/10"
            >
              Get an AI quote <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="relative py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            eyebrow="Capabilities"
            title="Four ways AI changes the game"
            subtitle="Each capability runs on the same predictive backbone — and powers the live AI Advisor in the corner of your screen."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {CAPABILITIES.map((c, i) => {
              const Icon = c.icon;
              return (
                <Reveal key={c.id} delay={i * 0.06}>
                  <article
                    id={c.id}
                    className="group h-full scroll-mt-28 rounded-3xl border border-steel/70 bg-deep p-7 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:border-cyan/40"
                  >
                    <span className={`grid h-12 w-12 place-items-center rounded-2xl ${CHIP[c.color]}`}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3
                      className="mt-5 text-xl font-semibold text-foam"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {c.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-mist">{c.body}</p>
                    <ul className="mt-4 space-y-1.5">
                      {c.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-2 text-sm text-foam">
                          <Check className="h-4 w-4 text-cyan" /> {b}
                        </li>
                      ))}
                    </ul>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Predictive dashboard */}
      <section className="relative py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            eyebrow="Predictive Insights"
            title={
              <>
                A live cockpit for your <span className="text-gradient">supply chain</span>
              </>
            }
            subtitle="A glimpse of the predictive dashboard every shipment unlocks."
          />
          <div className="mt-12">
            <Reveal>
              <PredictiveDashboard />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-10">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid grid-cols-2 gap-6 rounded-3xl border border-steel/60 bg-gradient-to-r from-white/60 to-navy/40 p-8 md:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal key={s.l} delay={i * 0.07}>
                <p
                  className="text-gradient text-4xl font-semibold tracking-tight"
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

    </>
  );
}
