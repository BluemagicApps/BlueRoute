import { ShieldCheck, BadgeCheck, Headphones, Globe2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/ui/reveal";

const STATS = [
  { value: "180+", key: "countries" },
  { value: "2.4M", key: "containers" },
  { value: "94%", key: "onTime" },
  { value: "60s", key: "quote" },
] as const;

// Neutral, non-brand trust signals (no third-party company names).
const SIGNALS = [
  { icon: ShieldCheck, key: "licensed" },
  { icon: BadgeCheck, key: "insured" },
  { icon: Headphones, key: "monitoring" },
  { icon: Globe2, key: "coverage" },
] as const;

export async function TrustStrip() {
  const t = await getTranslations("Home.trust");

  return (
    <section className="relative border-y border-steel/60 bg-gradient-to-b from-white/70 to-navy/40 py-14">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.key} delay={i * 0.08}>
              <p
                className="text-gradient text-4xl font-semibold tracking-tight lg:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {s.value}
              </p>
              <p className="mt-1 text-sm text-mist">{t(`stats.${s.key}`)}</p>
            </Reveal>
          ))}
        </div>

        {/* Trust signals */}
        <div className="mt-12">
          <p className="mb-6 text-center text-xs uppercase tracking-[0.25em] text-mist/70">
            {t("signalsHeading")}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SIGNALS.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={s.key} delay={i * 0.06}>
                  <div className="flex items-center gap-3 rounded-2xl border border-steel/70 bg-deep px-4 py-3.5 shadow-soft">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan/10 text-cyan">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-medium leading-snug text-foam">
                      {t(`signals.${s.key}`)}
                    </span>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
