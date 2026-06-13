"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { PORTS } from "@/lib/quote-data";
import type { ToolState } from "@/app/actions/ai-tools";

const selectCls =
  "h-12 w-full rounded-2xl border border-steel/60 bg-abyss/60 px-4 text-sm text-foam outline-none transition-colors focus:border-cyan/60";

export function AiToolConsole<T>({
  action,
  renderResult,
  extraFields,
  defaultOrigin = "CNSHA",
  defaultDest = "NLRTM",
}: {
  action: (prev: ToolState<T>, fd: FormData) => Promise<ToolState<T>>;
  renderResult: (result: T, weatherUsed: boolean) => React.ReactNode;
  extraFields?: React.ReactNode;
  defaultOrigin?: string;
  defaultDest?: string;
}) {
  const [state, formAction, pending] = useActionState<ToolState<T>, FormData>(action, { status: "idle" });

  return (
    <div className="glass mt-8 rounded-3xl p-6 md:p-8">
      <form action={formAction}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foam">Origin</span>
            <select name="originCode" defaultValue={defaultOrigin} className={selectCls}>
              {PORTS.map((p) => (
                <option key={p.code} value={p.code} className="bg-deep">
                  {p.city}, {p.country} ({p.code})
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foam">Destination</span>
            <select name="destCode" defaultValue={defaultDest} className={selectCls}>
              {PORTS.map((p) => (
                <option key={p.code} value={p.code} className="bg-deep">
                  {p.city}, {p.country} ({p.code})
                </option>
              ))}
            </select>
          </label>
          {extraFields}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-cyan to-indigo px-6 py-3 text-sm font-semibold text-white shadow-soft transition-transform active:scale-95 disabled:opacity-50"
        >
          {pending ? "Analyzing…" : "Run analysis"} <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      {state.status === "error" && (
        <p className="mt-4 rounded-2xl bg-rose/10 p-3 text-sm text-rose">{state.error}</p>
      )}

      {state.status === "success" && (
        <div className="mt-6">
          {renderResult(state.result, state.weatherUsed)}
          <p className="mt-4 text-center text-xs text-mist">
            {state.weatherUsed
              ? "AI estimate · grounded in live weather + distance"
              : "AI estimate · weather unavailable, distance-only"}
          </p>
        </div>
      )}
    </div>
  );
}
