// Deterministic from a seed (testable); callers pass crypto.randomUUID().
function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

/** Public tracking number, e.g. BRL-48203916. */
export function formatTrackingNumber(seed: string): string {
  return `BRL-${String(hashSeed(seed) % 100_000_000).padStart(8, "0")}`;
}
