# Design — MapLibre map swap

**Date:** 2026-06-10
**Status:** Approved (ready for implementation plan)
**Scope:** Third backend sub-project. Replace Mapbox GL with MapLibre GL + free
CARTO tiles so the tracking and warehouse maps render with no API token. Mechanical
swap; no behavioural changes beyond "maps always work now". Real-time vessel
updates, a browser test harness, and custom tile styling are out of scope.

---

## 1. Goal & success criteria

`src/components/tracking/shipment-map.tsx` and
`src/components/warehouse/warehouse-map.tsx` currently use `mapbox-gl` with
`mapbox://styles/mapbox/light-v11` behind a `NEXT_PUBLIC_MAPBOX_TOKEN` gate. With
no token set (current state), both render a styled "add your token" fallback
instead of a map.

**Success looks like:** `/tracking` and `/warehousing` show real, interactive
maps out of the box — no token, no config — on a clean light basemap matching the
Nordic Frost theme, with the existing route lines, markers, popups, `fitBounds`
and fly-to behaviour intact, and a small attribution chip.

**Decisions (from brainstorming):**
- **Basemap:** CARTO Positron (light), `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json` — free, no key, OSM-based.
- **Remove Mapbox entirely:** drop `mapbox-gl`, `@types/mapbox-gl`, the token
  gating, and both `MapFallback` components.

---

## 2. Architecture

MapLibre GL is an API-compatible fork of Mapbox GL JS; the GL calls already used
(`new Map`, `addSource`, `addLayer`, `Marker`, `Popup`, `LngLatBounds`,
`fitBounds`, `flyTo`) map one-to-one. The change per component:

- Imports: `import maplibregl from "maplibre-gl"` and
  `import "maplibre-gl/dist/maplibre-gl.css"` (replacing the `mapbox-gl`
  equivalents).
- `style: BASEMAP_STYLE` (shared constant) instead of the `mapbox://` style.
- Delete `accessToken`, `TOKEN`, `HAS_TOKEN`, the `if (!HAS_TOKEN)` early
  returns, and both `MapFallback` components.
- Type references `mapboxgl.X` → `maplibregl.X` (MapLibre bundles its own types).
- **Attribution:** set `attributionControl: { compact: true }` (was `false`) so a
  small "© OpenStreetMap, © CARTO" credit shows — required by the tile terms.
- Everything else (route layers, DOM markers, `ready` loading overlay,
  `cooperativeGestures`, fly-to/highlight effects) is unchanged.

### Shared + testable logic

New `src/lib/map.ts`:
- `export const BASEMAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";`
- `export function splitRouteAtVessel(route, vesselPosition): { traveled; remaining }`
  — the pure traveled/remaining split currently inlined in `shipment-map`'s
  `load` handler. Splits at the vessel's route index; when the vessel is not an
  exact route vertex, falls back to the route midpoint (preserving current
  behaviour). `traveled` and `remaining` overlap by one point so the lines join.

`shipment-map.tsx` imports and uses this helper instead of the inline logic.

---

## 3. Files

**New:**
- `src/lib/map.ts` — `BASEMAP_STYLE` + `splitRouteAtVessel`.
- `src/lib/map.test.ts` — unit tests for both.

**Modified:**
- `src/components/tracking/shipment-map.tsx` — MapLibre swap; use
  `splitRouteAtVessel`; remove token gate + fallback.
- `src/components/warehouse/warehouse-map.tsx` — MapLibre swap; remove token gate
  + fallback.
- `src/app/globals.css` — rename `.mapboxgl-popup-content` / `.mapboxgl-popup-tip`
  to `.maplibregl-popup-content` / `.maplibregl-popup-tip` (and update the two
  comment headers). The `.br-port-marker` / `.br-vessel-marker` / `.br-wh-marker`
  styles are unchanged.
- `package.json` — remove `mapbox-gl` (dependencies) and `@types/mapbox-gl`
  (devDependencies). `maplibre-gl` is already installed.

**Untouched:** `NEXT_PUBLIC_MAPBOX_TOKEN` may stay in `.env.local`; no code reads
it after this change.

---

## 4. Data types

`splitRouteAtVessel` operates on the existing `[number, number][]` route and a
`[number, number]` vessel position (matching `Shipment.route` /
`Shipment.vesselPosition` in `src/lib/tracking-data.ts`), returning
`{ traveled: [number, number][]; remaining: [number, number][] }`.

---

## 5. Error handling

- Keep the loading overlay until the map's `load` event fires.
- If tiles fail to load (e.g. offline), MapLibre shows an empty basemap — the page
  stays usable. No token-gate or fallback component is needed anymore.

---

## 6. Testing

- **Unit `src/lib/map.test.ts`:**
  - `splitRouteAtVessel` splits at the vessel's index (traveled ends at the
    vessel, remaining starts at it, overlapping by one point).
  - `splitRouteAtVessel` falls back to the route midpoint when the vessel isn't
    an exact vertex.
  - `BASEMAP_STYLE` is an `https://` CARTO Positron style URL.
- **Manual (WebGL can't be meaningfully unit-tested here — no browser harness, and
  adding one is out of scope):** run `npm run dev`, then:
  - `/tracking` → a light interactive map with the traveled/remaining route lines,
    port markers (with popups), the pulsing vessel marker, fit to the route, and a
    small attribution chip.
  - `/warehousing` → clickable facility pins, `fitBounds` to the visible set, and
    fly-to + highlight when a facility is selected.

Implementation follows TDD for the pure helper.

---

## 7. Out of scope (deliberately deferred)

Real-time vessel position updates, a Playwright/browser end-to-end test harness,
and bespoke branded tile styling. The maps stay on mock data from
`tracking-data.ts` / `warehouse-data.ts`.
