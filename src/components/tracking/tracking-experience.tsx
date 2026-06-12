"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, ArrowRight, PackageX } from "lucide-react";
import { motion } from "framer-motion";
import type { TrackPayload } from "@/lib/tracking/payload";
import { TrackingLoader } from "./tracking-loader";
import { TrackingResult } from "./tracking-result";
import { EASE_OUT_EXPO } from "@/lib/motion";

const MIN_LOADER_MS = 3000;

type Phase =
  | { name: "idle" }
  | { name: "loading" }
  | { name: "done"; data: TrackPayload }
  | { name: "error"; query: string };

export function TrackingExperience({ initialRef }: { initialRef?: string }) {
  const [query, setQuery] = useState(initialRef ?? "");
  const [phase, setPhase] = useState<Phase>({ name: "idle" });

  const track = useCallback(async (raw: string) => {
    const ref = raw.trim();
    if (!ref) return;
    setPhase({ name: "loading" });
    const started = Date.now();
    let next: Phase;
    try {
      const res = await fetch(`/api/track/${encodeURIComponent(ref)}`);
      next = res.ok
        ? { name: "done", data: (await res.json()) as TrackPayload }
        : { name: "error", query: ref };
    } catch {
      next = { name: "error", query: ref };
    }
    const wait = Math.max(0, MIN_LOADER_MS - (Date.now() - started));
    setTimeout(() => setPhase(next), wait);
  }, []);

  useEffect(() => {
    if (!initialRef) return;
    // Defer so setState doesn't run synchronously within the effect body.
    queueMicrotask(() => void track(initialRef));
  }, [initialRef, track]);

  return (
    <section className="relative pt-28 pb-20 lg:pt-32">
      <div className="bg-grid absolute inset-0 -z-10 h-96" />
      <div className="absolute -right-32 top-10 -z-10 h-[28rem] w-[28rem] rounded-full bg-cyan/10 blur-[120px] animate-aurora" />

      <div className="mx-auto max-w-5xl px-5 lg:px-8">
        <div className="no-print mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-cyan/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
            <Search className="h-3.5 w-3.5" /> Tracking Result
          </span>
          <h1
            className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foam md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Track your <span className="text-gradient">consignment.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-mist">
            Enter your tracking number to see the full consignment report —
            live route, status, and the complete tracking log.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void track(query);
            }}
            className="glass mx-auto mt-7 flex max-w-xl items-center gap-2 rounded-2xl p-2 pl-4 shadow-xl"
          >
            <Search className="h-5 w-5 shrink-0 text-cyan" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tracking number, e.g. BRL-12345678"
              className="h-11 w-full bg-transparent text-sm text-foam placeholder:text-mist/70 focus:outline-none"
              aria-label="Tracking number"
            />
            <button
              type="submit"
              disabled={phase.name === "loading"}
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-cyan px-5 text-sm font-semibold text-white transition-transform active:scale-95 disabled:opacity-60"
            >
              Track <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {phase.name === "loading" && <TrackingLoader />}

        {phase.name === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          >
            <TrackingResult data={phase.data} />
          </motion.div>
        )}

        {phase.name === "error" && (
          <div className="mx-auto mt-14 flex max-w-md flex-col items-center text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-rose/10 text-rose">
              <PackageX className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-foam">
              No consignment found for &ldquo;{phase.query}&rdquo;
            </h2>
            <p className="mt-2 text-sm text-mist">
              Double-check the tracking number on your confirmation email, or{" "}
              <a href="/contact" className="font-medium text-cyan hover:underline">
                contact support
              </a>{" "}
              and we&apos;ll locate it for you.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
