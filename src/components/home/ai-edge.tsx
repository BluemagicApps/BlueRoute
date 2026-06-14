import {
  Bot,
  LineChart,
  Route,
  Radar,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

// Per-card accent classes (static so Tailwind keeps them).
const ACCENTS = {
  cyan: "bg-cyan/10 text-cyan group-hover:bg-cyan group-hover:text-white",
  teal: "bg-teal/10 text-teal group-hover:bg-teal group-hover:text-white",
  emerald: "bg-emerald/10 text-emerald group-hover:bg-emerald group-hover:text-white",
} as const;

const GLOWS = {
  cyan: "bg-cyan/15 group-hover:bg-cyan/25",
  teal: "bg-teal/15 group-hover:bg-teal/25",
  emerald: "bg-emerald/15 group-hover:bg-emerald/25",
} as const;

const FEATURES = [
  {
    icon: Bot,
    key: "assistant",
    span: "lg:col-span-2",
    accent: true as const,
    color: "cyan" as const,
  },
  {
    icon: LineChart,
    key: "predictiveInsights",
    color: "cyan" as const,
    href: "/ai-edge/predictive-insights",
  },
  {
    icon: Route,
    key: "routeOptimizer",
    color: "teal" as const,
    href: "/ai-edge/route-optimizer",
  },
  {
    icon: Radar,
    key: "proactiveResolution",
    span: "lg:col-span-2",
    color: "emerald" as const,
    href: "/ai-edge/proactive-resolution",
  },
];

export async function AiEdge() {
  const t = await getTranslations("Home.aiEdge");

  return (
    <section id="ai-edge" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={
            <>
              {t("title")}{" "}
              <span className="text-gradient">{t("titleAccent")}</span>
            </>
          }
          subtitle={t("subtitle")}
        />

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            const title = t(`features.${f.key}.title`);
            const body = t(`features.${f.key}.body`);

            // The lead card is a vibrant gradient panel with white text.
            if (f.accent) {
              return (
                <Reveal key={f.key} delay={i * 0.07} className={f.span ?? ""}>
                  <article className="group bg-aurora-gradient relative flex h-full flex-col overflow-hidden rounded-3xl p-7 text-white shadow-soft transition-all duration-500 hover:-translate-y-1">
                    <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/20 blur-2xl" />
                    <div className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
                    <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white/20 text-white backdrop-blur">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3
                      className="relative mt-5 text-xl font-semibold"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {title}
                    </h3>
                    <p className="relative mt-2 max-w-md text-sm leading-relaxed text-white/85">
                      {body}
                    </p>
                    <Link
                      href="/ai-edge"
                      className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white"
                    >
                      {t("features.assistant.cta")}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </article>
                </Reveal>
              );
            }

            return (
              <Reveal key={f.key} delay={i * 0.07} className={f.span ?? ""}>
                <Link href={f.href ?? "/ai-edge"} className="group block h-full">
                  <article className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-steel/70 bg-deep p-7 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:border-cyan/40">
                    <div
                      className={`absolute -right-12 -top-12 h-40 w-40 rounded-full blur-2xl transition-all duration-500 ${GLOWS[f.color]}`}
                    />
                    <span
                      className={`grid h-12 w-12 place-items-center rounded-2xl transition-colors ${ACCENTS[f.color]}`}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-5 text-xl font-semibold text-foam" style={{ fontFamily: "var(--font-display)" }}>
                      {title}
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-mist">{body}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-cyan">
                      {t("features.openTool")}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </article>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
