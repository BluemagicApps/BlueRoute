import type { LngLat } from "@/lib/tracking-data";

/** Free CARTO Positron basemap (light, OSM-based, no API key required). */
export const BASEMAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

/**
 * Split a route into "traveled" and "remaining" segments at the vessel's
 * position. The two segments overlap by one point so the drawn lines join.
 * If the vessel is not an exact route vertex, splits at the route midpoint.
 */
export function splitRouteAtVessel(
  route: LngLat[],
  vessel: LngLat,
): { traveled: LngLat[]; remaining: LngLat[] } {
  const vIdx = route.findIndex((c) => c[0] === vessel[0] && c[1] === vessel[1]);
  const cut = vIdx >= 0 ? vIdx + 1 : Math.ceil(route.length * 0.5);
  return { traveled: route.slice(0, cut), remaining: route.slice(cut - 1) };
}
