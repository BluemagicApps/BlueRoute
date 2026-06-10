"use client";

import { useState } from "react";
import { Search, ArrowRight, Boxes } from "lucide-react";
import { motion } from "framer-motion";
import { SAMPLE_SHIPMENT } from "@/lib/tracking-data";
import { ShipmentMap } from "./shipment-map";
import {
  ShipmentHeader,
  EtaCard,
  Timeline,
  Sensors,
  Documents,
  Alerts,
} from "./panels";
import { EASE_OUT_EXPO } from "@/lib/motion";

const SAMPLES = ["BR-7741-2026", "BRLU 774120 3", "BRLSHARTM2026A"];

export function TrackingExperience({ initialRef }: { initialRef?: string }) {
  const [query, setQuery] = useState(initialRef ?? "");
  const [tracked, setTracked] = useState(Boolean(initialRef));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setTracked(true);
  };

  return (
    <section className="relative pt-28 pb-20 lg:pt-32">
      {/* Backdrop */}
      <div className="bg-grid absolute inset-0 -z-10 h-96" />
      <div className="absolute -right-32 top-10 -z-10 h-[28rem] w-[28rem] rounded-full bg-cyan/10 blur-[120px] animate-aurora" />

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {/* Search header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-cyan/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
            <Search className="h-3.5 w-3.5" /> Live Tracking
          </span>
          <h1
            className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foam md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Know exactly where your cargo is —{" "}
            <span className="text-gradient">and where it&apos;s going.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-mist">
            Real-time position, AI-predicted ETAs, live IoT telemetry, and
            proactive exception management in one view.
          </p>

          <form
            onSubmit={onSubmit}
            className="glass mx-auto mt-7 flex max-w-xl items-center gap-2 rounded-2xl p-2 pl-4 shadow-xl"
          >
            <Search className="h-5 w-5 shrink-0 text-cyan" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Container #, B/L, or booking reference"
              className="h-11 w-full bg-transparent text-sm text-foam placeholder:text-mist/70 focus:outline-none"
              aria-label="Tracking reference"
            />
            <button
              type="submit"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-cyan px-5 text-sm font-semibold text-white transition-transform active:scale-95"
            >
              Track <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {!tracked && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-mist">
              <span>Try a sample:</span>
              {SAMPLES.map((sample) => (
                <button
                  key={sample}
                  onClick={() => {
                    setQuery(sample);
                    setTracked(true);
                  }}
                  className="rounded-full border border-steel/60 px-2.5 py-1 font-medium text-aqua transition-colors hover:border-cyan/50"
                >
                  {sample}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        {tracked ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            className="mt-12 space-y-5"
          >
            <ShipmentHeader s={SAMPLE_SHIPMENT} />

            <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
              {/* Left column */}
              <div className="space-y-5">
                <div className="glass overflow-hidden rounded-3xl p-1.5">
                  <div className="h-[440px] w-full overflow-hidden rounded-[1.35rem]">
                    <ShipmentMap shipment={SAMPLE_SHIPMENT} />
                  </div>
                </div>
                <Sensors s={SAMPLE_SHIPMENT} />
                <Documents s={SAMPLE_SHIPMENT} />
              </div>

              {/* Right column */}
              <div className="space-y-5">
                <EtaCard s={SAMPLE_SHIPMENT} />
                <Alerts s={SAMPLE_SHIPMENT} />
                <Timeline s={SAMPLE_SHIPMENT} />
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="mx-auto mt-14 flex max-w-md flex-col items-center text-center text-mist">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-steel/50 text-cyan">
              <Boxes className="h-7 w-7" />
            </span>
            <p className="mt-4 text-sm">
              Enter a reference above to see the full live tracking dashboard.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
