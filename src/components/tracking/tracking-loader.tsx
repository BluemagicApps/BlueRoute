"use client";

import { useEffect, useState } from "react";
import { Loader2, Check } from "lucide-react";

const STAGES = [
  "Locating consignment…",
  "Retrieving tracking log…",
  "Compiling report…",
];

/** Staged ~3s progress animation shown after the Track button is pressed. */
export function TrackingLoader() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 1000),
      setTimeout(() => setStage(2), 2000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="mx-auto mt-14 max-w-sm rounded-3xl border border-steel/70 bg-deep p-8 shadow-soft">
      <ul className="space-y-4">
        {STAGES.map((label, i) => (
          <li key={label} className="flex items-center gap-3 text-sm">
            {i < stage ? (
              <Check className="h-4 w-4 shrink-0 text-emerald" />
            ) : i === stage ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-cyan" />
            ) : (
              <span className="h-4 w-4 shrink-0 rounded-full border border-steel" />
            )}
            <span className={i <= stage ? "text-foam" : "text-mist/60"}>{label}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-steel/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan to-indigo transition-[width] duration-1000 ease-out"
          style={{ width: `${((stage + 1) / 3) * 100}%` }}
        />
      </div>
    </div>
  );
}
