export type LngLat = [number, number];

/** Free CARTO Positron basemap (light, OSM-based, no API key required). */
export const BASEMAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

/** Spherical linear interpolation between two lng/lat points (great circle). */
export function greatCircle(a: LngLat, b: LngLat, steps = 64): LngLat[] {
  const rad = Math.PI / 180;
  const [lam1, phi1] = [a[0] * rad, a[1] * rad];
  const [lam2, phi2] = [b[0] * rad, b[1] * rad];
  const toVec = (lam: number, phi: number) => [
    Math.cos(phi) * Math.cos(lam),
    Math.cos(phi) * Math.sin(lam),
    Math.sin(phi),
  ];
  const v1 = toVec(lam1, phi1);
  const v2 = toVec(lam2, phi2);
  const dot = Math.min(1, Math.max(-1, v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]));
  const omega = Math.acos(dot);

  const pts: LngLat[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let p: number[];
    if (omega < 1e-9) {
      p = v1;
    } else {
      const s1 = Math.sin((1 - t) * omega) / Math.sin(omega);
      const s2 = Math.sin(t * omega) / Math.sin(omega);
      p = [
        s1 * v1[0] + s2 * v2[0],
        s1 * v1[1] + s2 * v2[1],
        s1 * v1[2] + s2 * v2[2],
      ];
    }
    const lat = Math.atan2(p[2], Math.hypot(p[0], p[1])) / rad;
    const lng = Math.atan2(p[1], p[0]) / rad;
    pts.push([lng, lat]);
  }
  // Unwrap longitudes so the line never jumps across the antimeridian.
  for (let i = 1; i < pts.length; i++) {
    while (pts[i][0] - pts[i - 1][0] > 180) pts[i][0] -= 360;
    while (pts[i][0] - pts[i - 1][0] < -180) pts[i][0] += 360;
  }
  return pts;
}

/**
 * Build the traveled/remaining trip segments. Routes through `current` when
 * known; otherwise splits the direct arc at `progressPct`. Segments share
 * their joining point so the drawn lines connect.
 */
export function buildTripPath(
  origin: LngLat,
  destination: LngLat,
  current: LngLat | null,
  progressPct: number,
): { traveled: LngLat[]; remaining: LngLat[] } {
  if (current) {
    return {
      traveled: greatCircle(origin, current),
      remaining: greatCircle(current, destination),
    };
  }
  const route = greatCircle(origin, destination);
  const pct = Math.min(100, Math.max(0, progressPct));
  const cut = Math.round((route.length - 1) * (pct / 100));
  return {
    traveled: route.slice(0, cut + 1),
    remaining: route.slice(cut),
  };
}
