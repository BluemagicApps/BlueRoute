"use client";

import { motion } from "framer-motion";
import { ArrowRight, Search, Sparkles, ShieldCheck, Zap } from "lucide-react";
import type { Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { RouteGlobe } from "./route-globe";
import { TransportPhoto } from "@/components/ui/transport-photo";
import { EASE_OUT_EXPO } from "@/lib/motion";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT_EXPO } },
};

export function Hero() {
  const t = useTranslations("Home.hero");

  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
      {/* Backdrop — Cobalt Duotone Full-Bleed transport photography */}
      <TransportPhoto vehicle="ship" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        {/* Copy */}
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.h1
            variants={item}
            className="mt-6 text-balance text-4xl font-semibold leading-[1.02] tracking-tight text-foam sm:text-5xl lg:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("headline")}{" "}
            <span className="text-gradient">{t("headlineAccent")}</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-5 max-w-xl text-lg leading-relaxed text-mist"
          >
            {t("sub")}
          </motion.p>

          {/* Track bar */}
          <motion.div variants={item} className="mt-8">
            <form
              action="/tracking"
              className="glass flex items-center gap-2 rounded-2xl p-2 pl-4 shadow-xl"
            >
              <Search className="h-5 w-5 shrink-0 text-cyan" />
              <input
                name="ref"
                placeholder={t("trackPlaceholder")}
                className="h-11 w-full bg-transparent text-sm text-foam placeholder:text-mist/70 focus:outline-none"
                aria-label={t("trackAriaLabel")}
              />
              <Button size="md" className="shrink-0">
                {t("trackButton")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>

          {/* Secondary CTAs */}
          <motion.div variants={item} className="mt-5 flex flex-wrap items-center gap-3">
            <Button href="/quote" variant="outline" size="md">
              {t("ctaPrimary")}
            </Button>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("br-open-assistant"))}
              className="group inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-foam"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-cyan/15 text-cyan transition-colors group-hover:bg-cyan group-hover:text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              {t("ctaSecondary")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>

          {/* Trust chips */}
          <motion.div
            variants={item}
            className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-mist"
          >
            <span className="inline-flex items-center gap-2">
              <Zap className="h-4 w-4 text-cyan" /> {t("trustOnTime")}
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan" /> {t("trustRiskAlerts")}
            </span>
            <span className="inline-flex items-center gap-2">
              <Search className="h-4 w-4 text-cyan" /> {t("trustVisibility")}
            </span>
          </motion.div>
        </motion.div>

        {/* Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: EASE_OUT_EXPO, delay: 0.15 }}
          className="relative mx-auto aspect-square w-full max-w-xl"
        >
          <RouteGlobe />

          {/* Floating predictive-ETA card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.7 }}
            className="glass absolute left-0 top-10 rounded-2xl border-l-4 border-l-indigo p-3.5 shadow-xl"
          >
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-indigo">
              {t("etaCard.label")}
            </p>
            <p className="mt-1 text-sm font-semibold text-foam">
              {t("etaCard.route")}
            </p>
            <p className="text-xs text-mist">{t("etaCard.status")}</p>
          </motion.div>

          {/* Floating risk card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.7 }}
            className="glass absolute bottom-12 right-0 rounded-2xl border-l-4 border-l-teal p-3.5 shadow-xl"
          >
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-teal">
              {t("riskCard.label")}
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-foam">
              <span className="h-2 w-2 rounded-full bg-teal animate-float" />
              {t("riskCard.status")}
            </p>
            <p className="text-xs text-mist">{t("riskCard.detail")}</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
