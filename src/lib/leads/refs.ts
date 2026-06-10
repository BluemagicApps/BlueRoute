// Reference formatters. Pure and deterministic from a seed so they are
// testable; the action passes crypto.randomUUID() as the seed at runtime.
function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

export function formatTicketRef(seed: string): string {
  return `BR-INQ-${(hashSeed(seed) % 90000) + 10000}`;
}

export function formatBookingRef(seed: string, originCode: string, destCode: string): string {
  const num = (hashSeed(seed) % 9000) + 1000;
  return `BR-${originCode.slice(0, 2)}${destCode.slice(0, 2)}-${num}`;
}
