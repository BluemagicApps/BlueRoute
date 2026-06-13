import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Radar } from "lucide-react";
import { ResolutionConsole } from "@/components/ai/resolution-console";

export const metadata: Metadata = {
  title: "Proactive Resolution",
  description: "Detect a shipping exception from a disruption scenario and get an automatic reroute, re-book, or pre-clear fix.",
};

export default function ProactiveResolutionPage() {
  return (
    <section className="relative pt-28 pb-20 lg:pt-32">
      <div className="bg-grid absolute inset-0 -z-10 h-96" />
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <Link href="/ai-edge" className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to the AI Edge
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald/10 text-emerald">
            <Radar className="h-6 w-6" />
          </span>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foam md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
            Proactive <span className="text-gradient">Resolution</span>
          </h1>
        </div>
        <p className="mt-3 text-mist">
          Pick a lane and a disruption — the AI detects the exception and proposes a concrete
          automatic fix, not just an alert.
        </p>
        <ResolutionConsole />
      </div>
    </section>
  );
}
