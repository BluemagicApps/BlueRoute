export type FieldType = "text" | "number" | "date" | "select" | "multiselect" | "textarea";

export type QuoteField = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
};

export type ServiceQuoteConfig = {
  slug: string;
  title: string;
  fields: QuoteField[];
};

export const SERVICE_QUOTE_SLUGS = [
  "air-freight",
  "land-freight",
  "project-cargo",
  "cold-chain",
  "customs",
] as const;

export const SERVICE_QUOTE_FIELDS: Record<string, ServiceQuoteConfig> = {
  "air-freight": {
    slug: "air-freight",
    title: "Air freight quote",
    fields: [
      { name: "origin", label: "Origin city / airport", type: "text", required: true, placeholder: "Shanghai (PVG)" },
      { name: "destination", label: "Destination city / airport", type: "text", required: true, placeholder: "Los Angeles (LAX)" },
      { name: "serviceLevel", label: "Service level", type: "select", required: true, options: ["Next-flight-out express", "Express", "Deferred economy", "Full charter"] },
      { name: "commodity", label: "Commodity", type: "select", options: ["General cargo", "Perishables", "Pharma", "Dangerous goods", "Other"] },
      { name: "weightKg", label: "Chargeable weight (kg)", type: "number", required: true, placeholder: "1200" },
      { name: "pieces", label: "Number of pieces", type: "number", placeholder: "5" },
      { name: "dimensions", label: "Dimensions (L×W×H cm)", type: "text", placeholder: "120×80×100" },
      { name: "readyDate", label: "Cargo ready date", type: "date" },
      { name: "message", label: "Anything else?", type: "textarea", placeholder: "Special handling, deadlines…" },
    ],
  },
  "land-freight": {
    slug: "land-freight",
    title: "Land freight quote",
    fields: [
      { name: "origin", label: "Origin city / postal", type: "text", required: true, placeholder: "Rotterdam" },
      { name: "destination", label: "Destination city / postal", type: "text", required: true, placeholder: "Munich" },
      { name: "loadType", label: "Load type", type: "select", required: true, options: ["FTL (full truckload)", "LTL (less than truckload)", "Intermodal rail", "Port drayage"] },
      { name: "weightKg", label: "Weight (kg)", type: "number", placeholder: "8000" },
      { name: "equipment", label: "Equipment", type: "select", options: ["Dry van", "Reefer", "Flatbed", "Container chassis", "Other"] },
      { name: "crossBorder", label: "Scope", type: "select", options: ["Domestic", "Cross-border"] },
      { name: "readyDate", label: "Cargo ready date", type: "date" },
      { name: "message", label: "Anything else?", type: "textarea", placeholder: "Access constraints, appointments…" },
    ],
  },
  "project-cargo": {
    slug: "project-cargo",
    title: "Project & heavy cargo quote",
    fields: [
      { name: "origin", label: "Origin", type: "text", required: true, placeholder: "Hamburg" },
      { name: "destination", label: "Destination", type: "text", required: true, placeholder: "Jebel Ali" },
      { name: "cargoDescription", label: "What are you moving?", type: "text", required: true, placeholder: "Transformer, turbine blade…" },
      { name: "weightTonnes", label: "Total weight (tonnes)", type: "number", required: true, placeholder: "85" },
      { name: "dimensions", label: "Dimensions (L×W×H m)", type: "text", required: true, placeholder: "12×4×4.5" },
      { name: "outOfGauge", label: "Out-of-gauge?", type: "select", options: ["Out-of-gauge", "Fits standard equipment"] },
      { name: "needs", label: "What do you need?", type: "multiselect", options: ["Route survey", "Lifting plan", "Permits & escorts", "Specialized equipment"] },
      { name: "readyDate", label: "Target ship date", type: "date" },
      { name: "message", label: "Project details", type: "textarea", placeholder: "Site access, timelines, constraints…" },
    ],
  },
  "cold-chain": {
    slug: "cold-chain",
    title: "Cold chain quote",
    fields: [
      { name: "origin", label: "Origin", type: "text", required: true, placeholder: "Amsterdam" },
      { name: "destination", label: "Destination", type: "text", required: true, placeholder: "Singapore" },
      { name: "commodity", label: "Commodity", type: "select", required: true, options: ["Pharma", "Food & beverage", "Perishables", "Chemicals", "Other"] },
      { name: "tempRange", label: "Temperature range", type: "select", required: true, options: ["Frozen (−18°C)", "Chilled (2–8°C)", "Cool (8–15°C)", "Custom setpoint"] },
      { name: "mode", label: "Preferred mode", type: "select", options: ["Ocean reefer", "Air", "Road reefer", "Multimodal"] },
      { name: "weightKg", label: "Weight (kg)", type: "number", placeholder: "5000" },
      { name: "readyDate", label: "Cargo ready date", type: "date" },
      { name: "message", label: "Anything else?", type: "textarea", placeholder: "GDP requirements, setpoint…" },
    ],
  },
  customs: {
    slug: "customs",
    title: "Customs & compliance quote",
    fields: [
      { name: "direction", label: "Direction", type: "select", required: true, options: ["Import", "Export", "Both"] },
      { name: "originCountry", label: "Origin country", type: "text", required: true, placeholder: "China" },
      { name: "destCountry", label: "Destination country", type: "text", required: true, placeholder: "United States" },
      { name: "mode", label: "Transport mode", type: "select", options: ["Ocean", "Air", "Land"] },
      { name: "commodity", label: "Goods / HS code if known", type: "text", placeholder: "Electronics / 8517.62" },
      { name: "shipmentValue", label: "Shipment value (USD)", type: "text", placeholder: "50000" },
      { name: "bonded", label: "Regime", type: "select", options: ["Standard", "Bonded", "Special regime"] },
      { name: "message", label: "Anything else?", type: "textarea", placeholder: "Licenses, prior rulings…" },
    ],
  },
};

export function getServiceQuoteConfig(slug: string): ServiceQuoteConfig | undefined {
  return SERVICE_QUOTE_FIELDS[slug];
}
