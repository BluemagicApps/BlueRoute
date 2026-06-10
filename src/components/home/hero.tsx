"use client";

import { motion } from "framer-motion";
import { ArrowRight, Search, Sparkles, ShieldCheck, Zap } from "lucide-react";
import type { Variants } from "framer-motion";
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
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
      {/* Backdrop — Cobalt Duotone Full-Bleed transport photography */}
      <TransportPhoto vehicle="ship" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        {/* Copy */}
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div variants={item}>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-cyan/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Logistics Platform
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="mt-6 text-balance text-4xl font-semibold leading-[1.02] tracking-tight text-foam sm:text-5xl lg:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Intelligent global shipping,{" "}
            <span className="text-gradient">engineered to never surprise you.</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-5 max-w-xl text-lg leading-relaxed text-mist"
          >
            Door-to-door container shipping to and from any country — with
            predictive ETAs, proactive risk mitigation, and smart warehouse
            leasing. The AI Edge that MSC and Maersk can&apos;t match.
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
                placeholder="Track by container #, B/L, or booking reference"
                className="h-11 w-full bg-transparent text-sm text-foam placeholder:text-mist/70 focus:outline-none"
                aria-label="Tracking reference"
              />
              <Button size="md" className="shrink-0">
                Track
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>

          {/* Secondary CTAs */}
          <motion.div variants={item} className="mt-5 flex flex-wrap items-center gap-3">
            <Button href="/quote" variant="outline" size="md">
              Get Instant Quote
            </Button>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("br-open-assistant"))}
              className="group inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-foam"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-cyan/15 text-cyan transition-colors group-hover:bg-cyan group-hover:text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              Ask the AI Advisor
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>

          {/* Trust chips */}
          <motion.div
            variants={item}
            className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-mist"
          >
            <span className="inline-flex items-center gap-2">
              <Zap className="h-4 w-4 text-cyan" /> 94% on-time, AI-verified
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan" /> Proactive risk alerts
            </span>
            <span className="inline-flex items-center gap-2">
              <Search className="h-4 w-4 text-cyan" /> Real-time visibility
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
              Predicted ETA
            </p>
            <p className="mt-1 text-sm font-semibold text-foam">
              Shanghai → Rotterdam
            </p>
            <p className="text-xs text-mist">On time · 99.2% confidence</p>
          </motion.div>

          {/* Floating risk card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.7 }}
            className="glass absolute bottom-12 right-0 rounded-2xl border-l-4 border-l-teal p-3.5 shadow-xl"
          >
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-teal">
              AI Risk Watch
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-foam">
              <span className="h-2 w-2 rounded-full bg-teal animate-float" />
              Re-routed around congestion
            </p>
            <p className="text-xs text-mist">Saved an est. 3.5 days</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
