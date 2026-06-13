// Deterministic booking reference (same hash style as src/lib/leads/refs.ts).
function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

export function formatWarehouseRef(seed: string): string {
  return `BR-WH-${(hashSeed(seed) % 90000) + 10000}`;
}

export function formatServiceRef(seed: string): string {
  return `BR-SV-${(hashSeed(seed) % 90000) + 10000}`;
}
