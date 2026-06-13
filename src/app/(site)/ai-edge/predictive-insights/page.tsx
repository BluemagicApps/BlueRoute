import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LineChart } from "lucide-react";
import { PredictiveConsole } from "@/components/ai/predictive-console";

export const metadata: Metadata = {
  title: "Predictive Insights",
  description: "AI delay-probability, ETA confidence, and cost-trend estimates for any lane — grounded in live weather and real distance.",
};

export default function PredictiveInsightsPage() {
  return (
    <section className="relative pt-28 pb-20 lg:pt-32">
      <div className="bg-grid absolute inset-0 -z-10 h-96" />
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <Link href="/ai-edge" className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to the AI Edge
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan/10 text-cyan">
            <LineChart className="h-6 w-6" />
          </span>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foam md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
            Predictive <span className="text-gradient">Insights</span>
          </h1>
        </div>
        <p className="mt-3 text-mist">
          Pick a lane and our AI estimates disruption risk, ETA confidence, and cost direction —
          using the real great-circle distance and live weather at both ports.
        </p>
        <PredictiveConsole />
      </div>
    </section>
  );
}
