"use client";

import { ShieldCheck } from "lucide-react";
import { AiToolConsole } from "@/components/ai/ai-tool-console";
import { runProactiveResolution } from "@/app/actions/ai-tools";
import { DISRUPTIONS, type ResolutionResult } from "@/lib/ai/tools/resolution";

const SEV: Record<string, string> = {
  low: "bg-emerald/10 text-emerald",
  medium: "bg-amber/10 text-amber",
  high: "bg-rose/10 text-rose",
};

export function ResolutionConsole() {
  return (
    <AiToolConsole<ResolutionResult>
      action={runProactiveResolution}
      extraFields={
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-foam">Disruption scenario</span>
          <select
            name="disruption"
            defaultValue={DISRUPTIONS[0]}
            className="h-12 w-full rounded-2xl border border-steel/60 bg-abyss/60 px-4 text-sm text-foam outline-none transition-colors focus:border-cyan/60"
          >
            {DISRUPTIONS.map((d) => (
              <option key={d} value={d} className="bg-deep">{d}</option>
            ))}
          </select>
        </label>
      }
      renderResult={(r) => (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-foam">
              <ShieldCheck className="h-4 w-4 text-cyan" /> {r.exception}
            </p>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${SEV[r.severity]}`}>
              {r.severity}
            </span>
          </div>
          <p className="text-sm text-mist">{r.impact}</p>
          <div className="rounded-2xl border border-cyan/40 bg-cyan/5 p-5">
            <p className="text-sm font-semibold text-cyan">Recommended fix</p>
            <p className="mt-1 text-sm leading-relaxed text-foam">{r.recommendedFix}</p>
          </div>
          {r.steps.length > 0 && (
            <ol className="space-y-2">
              {r.steps.map((s, i) => (
                <li key={s} className="flex items-start gap-3 text-sm text-foam">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cyan/10 text-xs font-bold text-cyan">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    />
  );
}
