import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import { InsightsList } from "@/components/insights/insights-list";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Market intelligence, AI insights, sustainability, and operations thinking from the Blue Route Logistics team.",
};

export default function InsightsPage() {
  return (
    <section className="relative pt-28 pb-20 lg:pt-32">
      <div className="bg-grid absolute inset-0 -z-10 h-72" />
      <div className="absolute -right-28 top-12 -z-10 h-[26rem] w-[26rem] rounded-full bg-indigo/20 blur-[120px] animate-aurora" />

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-cyan/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
            <Newspaper className="h-3.5 w-3.5" /> Insights
          </span>
          <h1
            className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foam md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Intelligence for people who <span className="text-gradient">move the world.</span>
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-mist">
            Market signals, AI deep-dives, and operational playbooks from the Blue
            Route team.
          </p>
        </div>

        <div className="mt-10">
          <InsightsList />
        </div>
      </div>
    </section>
  );
}
