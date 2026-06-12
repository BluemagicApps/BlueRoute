const WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 8;
const hits = new Map<string, number[]>();

/** Sliding-window limiter. Returns true if the call is allowed. */
export function checkRateLimit(
  key: string,
  now: number = Date.now(),
  limit: number = DEFAULT_LIMIT,
): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

/** Test-only: clears all tracked keys. */
export function __resetRateLimit(): void {
  hits.clear();
}
