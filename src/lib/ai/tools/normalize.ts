/** Round + clamp any value to an integer percentage in [0,100]; 0 on garbage. */
export function clampPct(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

/** Coerce to an array of trimmed non-empty strings, capped. */
export function strArray(x: unknown, cap: number): string[] {
  if (!Array.isArray(x)) return [];
  return x
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .map((s) => s.trim())
    .slice(0, cap);
}

/** Trimmed string, or the fallback for non-strings / empties. */
export function oneLine(x: unknown, fallback: string): string {
  return typeof x === "string" && x.trim() ? x.trim() : fallback;
}
