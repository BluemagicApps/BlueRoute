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

  // —— Europe ——
  { id: "ldn-gw", name: "London Gateway Logistics Park", city: "London", country: "United Kingdom", region: "Europe", coord: [0.47, 51.51], sqft: 96000, clearHeightM: 15, docks: 22, powerMVA: 2.8, pricePerSqftYear: 14.2, type: "Smart", available: true, availableFrom: "Now", rating: 4.7, features: ["Solar power", "EV charging", "Automated racking", "Smart sensors", "24/7 security"] },
  { id: "mad-sur", name: "Madrid Sur Distribution Centre", city: "Madrid", country: "Spain", region: "Europe", coord: [-3.65, 40.32], sqft: 72000, clearHeightM: 12, docks: 16, powerMVA: 2.1, pricePerSqftYear: 8.9, type: "Standard", available: true, availableFrom: "Now", rating: 4.3, features: ["Cross-dock", "24/7 security", "Rail siding"] },
  { id: "war-pl", name: "Warsaw Central Logistics", city: "Warsaw", country: "Poland", region: "Europe", coord: [21.01, 52.23], sqft: 110000, clearHeightM: 13, docks: 24, powerMVA: 2.6, pricePerSqftYear: 7.4, type: "Standard", available: false, availableFrom: "Q3 2026", rating: 4.2, features: ["Cross-dock", "Rail siding", "24/7 security"] },
  { id: "mil-it", name: "Milan Interporto Hub", city: "Milan", country: "Italy", region: "Europe", coord: [9.19, 45.46], sqft: 64000, clearHeightM: 11, docks: 14, powerMVA: 1.8, pricePerSqftYear: 10.1, type: "Standard", available: true, availableFrom: "Now", rating: 4.1, features: ["Cross-dock", "24/7 security"] },
  { id: "lyo-fr", name: "Lyon Saint-Exupéry Cold DC", city: "Lyon", country: "France", region: "Europe", coord: [4.94, 45.73], sqft: 58000, clearHeightM: 10, docks: 12, powerMVA: 2.9, pricePerSqftYear: 13.6, type: "Cold Chain", available: true, availableFrom: "Now", rating: 4.6, features: ["Cold storage", "Smart sensors", "24/7 security", "Solar power"] },
  { id: "ant-be", name: "Antwerp Port Bonded Store", city: "Antwerp", country: "Belgium", region: "Europe", coord: [4.40, 51.26], sqft: 88000, clearHeightM: 13, docks: 20, powerMVA: 2.4, pricePerSqftYear: 11.9, type: "Bonded", available: true, availableFrom: "Now", rating: 4.5, features: ["Bonded zone", "Cross-dock", "24/7 security", "Rail siding"] },

  // —— Asia ——
  { id: "sin-tk", name: "Singapore Tuas Mega Hub", city: "Singapore", country: "Singapore", region: "Asia", coord: [103.64, 1.32], sqft: 140000, clearHeightM: 16, docks: 30, powerMVA: 3.6, pricePerSqftYear: 16.8, type: "Smart", available: true, availableFrom: "Now", rating: 4.9, features: ["Automated racking", "Smart sensors", "EV charging", "Solar power", "24/7 security"] },
  { id: "shz-cn", name: "Shenzhen Yantian Logistics", city: "Shenzhen", country: "China", region: "Asia", coord: [114.27, 22.56], sqft: 132000, clearHeightM: 14, docks: 28, powerMVA: 3.2, pricePerSqftYear: 9.7, type: "Standard", available: true, availableFrom: "Now", rating: 4.4, features: ["Cross-dock", "24/7 security", "Automated racking"] },
  { id: "mum-in", name: "Mumbai JNPT Distribution Park", city: "Mumbai", country: "India", region: "Asia", coord: [72.95, 18.95], sqft: 78000, clearHeightM: 11, docks: 18, powerMVA: 2.0, pricePerSqftYear: 6.2, type: "Standard", available: true, availableFrom: "Now", rating: 4.0, features: ["Cross-dock", "24/7 security"] },
  { id: "tok-jp", name: "Tokyo Bay Smart Warehouse", city: "Tokyo", country: "Japan", region: "Asia", coord: [139.79, 35.62], sqft: 90000, clearHeightM: 15, docks: 20, powerMVA: 3.0, pricePerSqftYear: 17.5, type: "Smart", available: false, availableFrom: "Q4 2026", rating: 4.8, features: ["Automated racking", "Smart sensors", "EV charging", "24/7 security"] },
  { id: "bus-kr", name: "Busan New Port Cold Hub", city: "Busan", country: "South Korea", region: "Asia", coord: [128.81, 35.08], sqft: 70000, clearHeightM: 12, docks: 16, powerMVA: 2.8, pricePerSqftYear: 12.4, type: "Cold Chain", available: true, availableFrom: "Now", rating: 4.5, features: ["Cold storage", "Smart sensors", "24/7 security"] },
  { id: "bkk-th", name: "Bangkok Eastern Seaboard DC", city: "Bangkok", country: "Thailand", region: "Asia", coord: [100.91, 13.10], sqft: 84000, clearHeightM: 12, docks: 18, powerMVA: 2.2, pricePerSqftYear: 7.0, type: "Standard", available: true, availableFrom: "Now", rating: 4.1, features: ["Cross-dock", "Rail siding", "24/7 security"] },

  // —— North America ——
  { id: "lax-us", name: "Los Angeles Inland Empire DC", city: "Los Angeles", country: "United States", region: "North America", coord: [-117.40, 34.06], sqft: 150000, clearHeightM: 16, docks: 34, powerMVA: 3.8, pricePerSqftYear: 13.1, type: "Smart", available: true, availableFrom: "Now", rating: 4.7, features: ["Automated racking", "Smart sensors", "EV charging", "Solar power", "24/7 security"] },
  { id: "nyc-us", name: "New Jersey Port Logistics", city: "Newark", country: "United States", region: "North America", coord: [-74.17, 40.69], sqft: 102000, clearHeightM: 14, docks: 24, powerMVA: 3.0, pricePerSqftYear: 15.4, type: "Standard", available: true, availableFrom: "Now", rating: 4.4, features: ["Cross-dock", "Rail siding", "24/7 security"] },
  { id: "chi-us", name: "Chicago Midwest Crossdock", city: "Chicago", country: "United States", region: "North America", coord: [-87.75, 41.79], sqft: 118000, clearHeightM: 13, docks: 28, powerMVA: 2.9, pricePerSqftYear: 9.8, type: "Standard", available: false, availableFrom: "Q3 2026", rating: 4.2, features: ["Cross-dock", "Rail siding", "24/7 security"] },
  { id: "dal-us", name: "Dallas Alliance Cold Hub", city: "Dallas", country: "United States", region: "North America", coord: [-97.06, 32.99], sqft: 86000, clearHeightM: 12, docks: 20, powerMVA: 3.1, pricePerSqftYear: 11.0, type: "Cold Chain", available: true, availableFrom: "Now", rating: 4.5, features: ["Cold storage", "Smart sensors", "EV charging", "24/7 security"] },
  { id: "tor-ca", name: "Toronto Pearson Gateway", city: "Toronto", country: "Canada", region: "North America", coord: [-79.63, 43.68], sqft: 94000, clearHeightM: 13, docks: 22, powerMVA: 2.7, pricePerSqftYear: 10.6, type: "Standard", available: true, availableFrom: "Now", rating: 4.3, features: ["Cross-dock", "24/7 security", "Solar power"] },
  { id: "mex-mx", name: "Mexico City Norte Park", city: "Mexico City", country: "Mexico", region: "North America", coord: [-99.11, 19.55], sqft: 76000, clearHeightM: 11, docks: 16, powerMVA: 2.0, pricePerSqftYear: 7.8, type: "Standard", available: true, availableFrom: "Now", rating: 4.0, features: ["Cross-dock", "24/7 security"] },

  // —— Middle East ——
  { id: "dxb-ae", name: "Dubai Jebel Ali Free Zone DC", city: "Dubai", country: "United Arab Emirates", region: "Middle East", coord: [55.06, 25.01], sqft: 160000, clearHeightM: 16, docks: 36, powerMVA: 4.0, pricePerSqftYear: 12.9, type: "Bonded", available: true, availableFrom: "Now", rating: 4.8, features: ["Bonded zone", "Automated racking", "Smart sensors", "Solar power", "24/7 security"] },
  { id: "ruh-sa", name: "Riyadh Logistics City", city: "Riyadh", country: "Saudi Arabia", region: "Middle East", coord: [46.72, 24.71], sqft: 108000, clearHeightM: 14, docks: 24, powerMVA: 3.0, pricePerSqftYear: 8.4, type: "Standard", available: true, availableFrom: "Now", rating: 4.3, features: ["Cross-dock", "Solar power", "24/7 security"] },
  { id: "dmm-sa", name: "Dammam Port Cold Store", city: "Dammam", country: "Saudi Arabia", region: "Middle East", coord: [50.10, 26.43], sqft: 62000, clearHeightM: 11, docks: 14, powerMVA: 2.7, pricePerSqftYear: 10.2, type: "Cold Chain", available: false, availableFrom: "Q4 2026", rating: 4.2, features: ["Cold storage", "Smart sensors", "24/7 security"] },

  // —— Oceania ——
  { id: "syd-au", name: "Sydney Western Logistics Hub", city: "Sydney", country: "Australia", region: "Oceania", coord: [150.86, -33.81], sqft: 98000, clearHeightM: 14, docks: 22, powerMVA: 2.8, pricePerSqftYear: 13.8, type: "Smart", available: true, availableFrom: "Now", rating: 4.6, features: ["Automated racking", "Smart sensors", "Solar power", "EV charging", "24/7 security"] },
  { id: "mel-au", name: "Melbourne Dandenong DC", city: "Melbourne", country: "Australia", region: "Oceania", coord: [145.21, -37.99], sqft: 82000, clearHeightM: 12, docks: 18, powerMVA: 2.4, pricePerSqftYear: 12.1, type: "Standard", available: true, availableFrom: "Now", rating: 4.3, features: ["Cross-dock", "24/7 security", "Solar power"] },
  { id: "akl-nz", name: "Auckland Wiri Distribution", city: "Auckland", country: "New Zealand", region: "Oceania", coord: [174.86, -36.98], sqft: 54000, clearHeightM: 10, docks: 12, powerMVA: 1.9, pricePerSqftYear: 11.3, type: "Standard", available: true, availableFrom: "Now", rating: 4.1, features: ["Cross-dock", "24/7 security"] },
  { id: "bne-au", name: "Brisbane Port Connect DC", city: "Brisbane", country: "Australia", region: "Oceania", coord: [153.03, -27.47], sqft: 68000, clearHeightM: 11, docks: 15, powerMVA: 2.2, pricePerSqftYear: 11.7, type: "Standard", available: true, availableFrom: "Now", rating: 4.2, features: ["Cross-dock", "24/7 security", "Rail siding"] },
];

export const SIZE_BUCKETS = [
  { label: "Any size", min: 0 },
  { label: "50k+ ft²", min: 50000 },
  { label: "80k+ ft²", min: 80000 },
  { label: "120k+ ft²", min: 120000 },
];
