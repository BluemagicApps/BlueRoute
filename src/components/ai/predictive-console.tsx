"use client";

import { CalendarDays } from "lucide-react";
import { AiToolConsole } from "@/components/ai/ai-tool-console";
import { runPredictiveInsights } from "@/app/actions/ai-tools";
import type { PredictiveResult } from "@/lib/ai/tools/predictive";

export function PredictiveConsole() {
  return (
    <AiToolConsole<PredictiveResult>
      action={runPredictiveInsights}
      extraFields={
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-foam">Cargo ready date (optional)</span>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" />
            <input
              type="date"
              name="readyDate"
              className="h-12 w-full rounded-2xl border border-steel/60 bg-abyss/60 pl-11 pr-4 text-sm text-foam outline-none transition-colors focus:border-cyan/60 [color-scheme:light]"
            />
          </div>
        </label>
      }
      renderResult={(r) => (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Gauge label="Delay probability" pct={r.delayProbabilityPct} tone="rose" />
            <Gauge label="ETA confidence" pct={r.etaConfidencePct} tone="emerald" />
          </div>
          <p className="text-sm leading-relaxed text-foam">{r.summary}</p>
          {r.riskFactors.length > 0 && (
            <List title="Risk factors" items={r.riskFactors} />
          )}
          <p className="text-sm text-mist"><span className="font-medium text-foam">Cost trend:</span> {r.costTrend}</p>
          {r.alternatives.length > 0 && <List title="Alternative lanes" items={r.alternatives} />}
        </div>
      )}
    />
  );
}

function Gauge({ label, pct, tone }: { label: string; pct: number; tone: "rose" | "emerald" }) {
  const bar = tone === "rose" ? "bg-rose" : "bg-emerald";
  return (
    <div className="rounded-2xl border border-steel/50 bg-abyss/40 p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-mist">{label}</span>
        <span className="text-2xl font-semibold text-foam" style={{ fontFamily: "var(--font-display)" }}>{pct}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-steel/50">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-foam">{title}</p>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2 text-sm text-mist">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" /> {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
