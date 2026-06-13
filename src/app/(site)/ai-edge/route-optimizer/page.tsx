import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Route as RouteIcon } from "lucide-react";
import { OptimizerConsole } from "@/components/ai/optimizer-console";

export const metadata: Metadata = {
  title: "AI Route Optimizer",
  description: "Balance cost, transit time, and carbon across real routing options — with a weather-aware backup lane on standby.",
};

export default function RouteOptimizerPage() {
  return (
    <section className="relative pt-28 pb-20 lg:pt-32">
      <div className="bg-grid absolute inset-0 -z-10 h-96" />
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <Link href="/ai-edge" className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to the AI Edge
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal/10 text-teal">
            <RouteIcon className="h-6 w-6" />
          </span>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foam md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
            AI Route <span className="text-gradient">Optimizer</span>
          </h1>
        </div>
        <p className="mt-3 text-mist">
          We compute real cost, transit, and carbon for each routing option on your lane, then the
          AI picks the best balance and names a congestion-avoiding backup.
        </p>
        <OptimizerConsole />
      </div>
    </section>
  );
}
