/**
 * Mock warehouse-leasing dataset. Stands in for the facilities API.
 * Coordinates are [lng, lat] (Mapbox/GeoJSON order).
 */

export type FacilityFeature =
  | "Solar power"
  | "EV charging"
  | "Cold storage"
  | "Cross-dock"
  | "24/7 security"
  | "Automated racking"
  | "Rail siding"
  | "Bonded zone"
  | "Smart sensors";

export const ALL_FEATURES: FacilityFeature[] = [
  "Solar power",
  "EV charging",
  "Cold storage",
  "Cross-dock",
  "24/7 security",
  "Automated racking",
  "Rail siding",
  "Bonded zone",
  "Smart sensors",
];

export type Facility = {
  id: string;
  name: string;
  city: string;
  country: string;
  region: string;
  coord: [number, number];
  sqft: number;
  clearHeightM: number;
  docks: number;
  powerMVA: number;
  pricePerSqftYear: number; // USD
  type: "Smart" | "Cold Chain" | "Bonded" | "Standard";
  available: boolean;
  availableFrom: string;
  rating: number; // 0-5
  features: FacilityFeature[];
};

export const REGIONS = [
  "All regions",
  "Europe",
  "Asia",
  "North America",
  "Middle East",
  "Oceania",
];

export const FACILITIES: Facility[] = [
  {
    id: "rtm-a",
    name: "Rotterdam Smart Hub A",
    city: "Rotterdam",
    country: "Netherlands",
    region: "Europe",
    coord: [4.13, 51.95],
    sqft: 84000,
    clearHeightM: 12,
    docks: 18,
    powerMVA: 2.4,
    pricePerSqftYear: 11.5,
    type: "Smart",
    available: true,
    availableFrom: "Now",
    rating: 4.8,
    features: ["Solar power", "EV charging", "Cross-dock", "Automated racking", "Smart sensors", "24/7 security"],
  },
  {
    id: "ham-n",
    name: "Hamburg Nordport DC",
    city: "Hamburg",
    country: "Germany",
    region: "Europe",
    coord: [9.99, 53.55],
    sqft: 120000,
    clearHeightM: 14,
    docks: 26,
    powerMVA: 3.1,
    pricePerSqftYear: 10.8,
    type: "Bonded",
    available: true,
    availableFrom: "Now",
    rating: 4.6,
    features: ["Rail siding", "Bonded zone", "Cross-dock", "24/7 security", "Smart sensors"],
  },
  {
    id: "anr-d",
    name: "Antwerp Dockside Logistics",
    city: "Antwerp",
    country: "Belgium",
    region: "Europe",
    coord: [4.4, 51.26],
    sqft: 56000,
    clearHeightM: 11,
    docks: 12,
    powerMVA: 1.8,
    pricePerSqftYear: 10.2,
    type: "Standard",
    available: false,
    availableFrom: "Sep 2026",
    rating: 4.3,
    features: ["Rail siding", "Cross-dock", "24/7 security"],
  },
  {
    id: "sin-p",
    name: "Singapore Logistics Park",
    city: "Singapore",
    country: "Singapore",
    region: "Asia",
    coord: [103.85, 1.29],
    sqft: 98000,
    clearHeightM: 13,
    docks: 22,
    powerMVA: 2.8,
    pricePerSqftYear: 14.2,
    type: "Smart",
    available: true,
    availableFrom: "Now",
    rating: 4.9,
    features: ["Solar power", "Automated racking", "Smart sensors", "EV charging", "24/7 security", "Cross-dock"],
  },
  {
    id: "szx-b",
    name: "Shenzhen Bay Distribution",
    city: "Shenzhen",
    country: "China",
    region: "Asia",
    coord: [114.06, 22.54],
    sqft: 145000,
    clearHeightM: 15,
    docks: 30,
    powerMVA: 3.6,
    pricePerSqftYear: 9.4,
    type: "Smart",
    available: true,
    availableFrom: "Now",
    rating: 4.5,
    features: ["Automated racking", "Smart sensors", "Cross-dock", "Rail siding"],
  },
  {
    id: "nsa-c",
    name: "Mumbai West Cold Hub",
    city: "Mumbai",
    country: "India",
    region: "Asia",
    coord: [72.95, 18.95],
    sqft: 64000,
    clearHeightM: 10,
    docks: 14,
    powerMVA: 2.2,
    pricePerSqftYear: 7.8,
    type: "Cold Chain",
    available: true,
    availableFrom: "Now",
    rating: 4.2,
    features: ["Cold storage", "Smart sensors", "24/7 security", "Solar power"],
  },
  {
    id: "lax-g",
    name: "Los Angeles Gateway DC",
    city: "Los Angeles",
    country: "USA",
    region: "North America",
    coord: [-118.27, 33.74],
    sqft: 132000,
    clearHeightM: 14,
    docks: 28,
    powerMVA: 3.3,
    pricePerSqftYear: 13.6,
    type: "Smart",
    available: false,
    availableFrom: "Aug 2026",
    rating: 4.7,
    features: ["Solar power", "EV charging", "Automated racking", "Cross-dock", "Smart sensors"],
  },
  {
    id: "nyc-h",
    name: "New York Harbor DC",
    city: "New York",
    country: "USA",
    region: "North America",
    coord: [-74.01, 40.7],
    sqft: 72000,
    clearHeightM: 11,
    docks: 16,
    powerMVA: 2.0,
    pricePerSqftYear: 15.9,
    type: "Bonded",
    available: true,
    availableFrom: "Now",
    rating: 4.4,
    features: ["Bonded zone", "Cross-dock", "24/7 security", "Rail siding"],
  },
  {
    id: "dxb-l",
    name: "Dubai Logistics City",
    city: "Dubai",
    country: "UAE",
    region: "Middle East",
    coord: [55.06, 25.0],
    sqft: 160000,
    clearHeightM: 16,
    docks: 34,
    powerMVA: 4.0,
    pricePerSqftYear: 9.1,
    type: "Smart",
    available: true,
    availableFrom: "Now",
    rating: 4.8,
    features: ["Solar power", "Automated racking", "Smart sensors", "Bonded zone", "EV charging", "24/7 security"],
  },
  {
    id: "syd-s",
    name: "Sydney South Hub",
    city: "Sydney",
    country: "Australia",
    region: "Oceania",
    coord: [151.21, -33.86],
    sqft: 78000,
    clearHeightM: 12,
    docks: 17,
    powerMVA: 2.3,
    pricePerSqftYear: 12.4,
    type: "Standard",
    available: true,
    availableFrom: "Now",
    rating: 4.1,
    features: ["EV charging", "Cross-dock", "24/7 security", "Solar power"],
  },
];

export const SIZE_BUCKETS = [
  { label: "Any size", min: 0 },
  { label: "50k+ ft²", min: 50000 },
  { label: "80k+ ft²", min: 80000 },
  { label: "120k+ ft²", min: 120000 },
];
