"use client";

import { Sparkles } from "lucide-react";
import { AiToolConsole } from "@/components/ai/ai-tool-console";
import { runRouteOptimizer } from "@/app/actions/ai-tools";
import type { OptimizerResult } from "@/lib/ai/tools/optimizer";

export function OptimizerConsole() {
  return (
    <AiToolConsole<OptimizerResult>
      action={runRouteOptimizer}
      renderResult={(r) => (
        <div className="space-y-5">
          <div className="rounded-2xl border border-cyan/40 bg-cyan/5 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-cyan">
              <Sparkles className="h-4 w-4" /> Recommended: {r.recommended}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foam">{r.rationale}</p>
            <p className="mt-2 text-sm text-mist"><span className="font-medium text-foam">Backup lane:</span> {r.backupLane}</p>
          </div>
          {r.rankings.length > 0 && (
            <div className="space-y-2">
              {r.rankings.map((rk) => (
                <div key={rk.name} className="flex items-center justify-between gap-4 rounded-2xl border border-steel/50 bg-abyss/40 px-4 py-3 text-sm">
                  <span className="font-medium text-foam">{rk.name}</span>
                  <span className="text-right text-mist">{rk.verdict}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    />
  );
}
