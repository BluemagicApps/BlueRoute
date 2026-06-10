/**
 * Quote engine mock. Stands in for the AI rating / routing API.
 * Distances use a haversine great-circle estimate × a sea-route factor,
 * then derive transit days, price, and CO₂ deterministically (no randomness,
 * so server and client render identically).
 */

export type Port = {
  code: string;
  city: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
};

export const PORTS: Port[] = [
  { code: "CNSHA", city: "Shanghai", country: "China", region: "Asia", lat: 31.23, lng: 121.47 },
  { code: "CNSZX", city: "Shenzhen", country: "China", region: "Asia", lat: 22.54, lng: 114.06 },
  { code: "SGSIN", city: "Singapore", country: "Singapore", region: "Asia", lat: 1.29, lng: 103.85 },
  { code: "KRPUS", city: "Busan", country: "South Korea", region: "Asia", lat: 35.1, lng: 129.04 },
  { code: "INNSA", city: "Mumbai (Nhava Sheva)", country: "India", region: "South Asia", lat: 18.95, lng: 72.95 },
  { code: "AEJEA", city: "Jebel Ali (Dubai)", country: "UAE", region: "Middle East", lat: 25.0, lng: 55.06 },
  { code: "NLRTM", city: "Rotterdam", country: "Netherlands", region: "Europe", lat: 51.95, lng: 4.14 },
  { code: "DEHAM", city: "Hamburg", country: "Germany", region: "Europe", lat: 53.55, lng: 9.99 },
  { code: "BEANR", city: "Antwerp", country: "Belgium", region: "Europe", lat: 51.26, lng: 4.4 },
  { code: "USLAX", city: "Los Angeles", country: "USA", region: "North America", lat: 33.74, lng: -118.27 },
  { code: "USNYC", city: "New York", country: "USA", region: "North America", lat: 40.7, lng: -74.01 },
  { code: "BRSSZ", city: "Santos", country: "Brazil", region: "South America", lat: -23.96, lng: -46.33 },
  { code: "ZADUR", city: "Durban", country: "South Africa", region: "Africa", lat: -29.87, lng: 31.02 },
  { code: "AUSYD", city: "Sydney", country: "Australia", region: "Oceania", lat: -33.86, lng: 151.21 },
];

export type ContainerType = {
  id: string;
  label: string;
  detail: string;
  baseRate: number; // USD base before distance scaling
  weightFactor: number; // affects CO₂
};

export const CONTAINERS: ContainerType[] = [
  { id: "20gp", label: "20' Standard", detail: "Up to 28 t · 33 m³", baseRate: 1400, weightFactor: 1 },
  { id: "40gp", label: "40' Standard", detail: "Up to 30 t · 67 m³", baseRate: 2100, weightFactor: 1.7 },
  { id: "40hc", label: "40' High-Cube", detail: "Up to 30 t · 76 m³", baseRate: 2300, weightFactor: 1.8 },
  { id: "40rf", label: "40' Reefer", detail: "Temp-controlled · 67 m³", baseRate: 3600, weightFactor: 2.0 },
  { id: "lcl", label: "LCL (per m³)", detail: "Shared container space", baseRate: 95, weightFactor: 0.2 },
];

export type CargoMode = "door-to-door" | "port-to-port";

export type QuoteOption = {
  id: "express" | "balanced" | "green";
  name: string;
  tagline: string;
  transitDays: number;
  priceUSD: number;
  co2Kg: number;
  riskLabel: "Low" | "Very low" | "Moderate";
  recommended?: boolean;
  highlights: string[];
};

export type QuoteInput = {
  origin: Port;
  destination: Port;
  container: ContainerType;
  mode: CargoMode;
};

function haversineKm(a: Port, b: Port): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const round = (n: number, step: number) => Math.round(n / step) * step;

export function estimateDistanceKm(input: QuoteInput): number {
  // Sea routes run ~30% longer than great-circle.
  return Math.round(haversineKm(input.origin, input.destination) * 1.3);
}

export function computeQuotes(input: QuoteInput): QuoteOption[] {
  const km = estimateDistanceKm(input);
  const { container, mode } = input;

  const distanceCost = (km / 1000) * 95; // per 1000 km
  const doorFee = mode === "door-to-door" ? 480 : 0;
  const base = container.baseRate + distanceCost + doorFee;

  // CO₂: ~12 g per ton-km equiv, scaled by container weight factor.
  const co2Base = (km * 12 * container.weightFactor) / 1000; // kg

  const transitBase = km / 620; // effective km/day incl. port calls

  const options: QuoteOption[] = [
    {
      id: "express",
      name: "Express",
      tagline: "Fastest transit, premium priority",
      transitDays: Math.max(6, Math.round(transitBase + 2)),
      priceUSD: round(base * 1.34, 25),
      co2Kg: round(co2Base * 1.12, 10),
      riskLabel: "Low",
      highlights: ["Priority loading", "Guaranteed space", "Fewer transshipments"],
    },
    {
      id: "balanced",
      name: "Balanced",
      tagline: "Best value for cost and speed",
      transitDays: Math.max(8, Math.round(transitBase + 5)),
      priceUSD: round(base, 25),
      co2Kg: round(co2Base, 10),
      riskLabel: "Low",
      recommended: true,
      highlights: ["Lowest all-in cost", "Reliable schedule", "Flexible rebooking"],
    },
    {
      id: "green",
      name: "Green Route",
      tagline: "Lowest carbon, lowest disruption risk",
      transitDays: Math.max(9, Math.round(transitBase + 7)),
      priceUSD: round(base * 1.08, 25),
      co2Kg: round(co2Base * 0.74, 10),
      riskLabel: "Very low",
      highlights: ["Slow-steaming vessels", "−26% emissions", "Congestion-avoiding lane"],
    },
  ];

  return options;
}
