// Hand-rolled validation in the style of src/lib/leads/validate.ts — no zod.

export const FREIGHT_TYPES = ["Sea Freight", "Air Freight", "Land Freight"] as const;
export const SHIPMENT_STATUSES = [
  "Pending",
  "Approved",
  "In Transit",
  "On Hold",
  "Customs",
  "Out for Delivery",
  "Delivered",
] as const;

export type FreightType = (typeof FREIGHT_TYPES)[number];
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export type ShipmentInput = {
  receiver_name: string;
  receiver_email: string | null;
  receiver_phone: string | null;
  receiver_address: string | null;
  receiver_country: string | null;
  sender_name: string;
  sender_email: string | null;
  sender_phone: string | null;
  sender_address: string | null;
  sender_country: string | null;
  origin: string;
  destination: string;
  freight_type: FreightType;
  content_type: string | null;
  weight_kg: number | null;
  qty: number | null;
  description: string | null;
  status: ShipmentStatus;
  date_shipped: string | null;
  expected_delivery: string | null;
  current_location: string | null;
  current_city: string | null;
  shipment_cost: number | null;
  clearance_cost: number | null;
  delivery_pct: number;
  notice: string | null;
};

type Raw = Record<string, unknown>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function str(raw: Raw, key: string): string {
  const v = raw[key];
  return typeof v === "string" ? v.trim() : "";
}

function optStr(raw: Raw, key: string): string | null {
  const s = str(raw, key);
  return s === "" ? null : s;
}

function optNum(
  raw: Raw,
  key: string,
  errors: Record<string, string>,
): number | null {
  const s = str(raw, key);
  if (s === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) {
    errors[key] = "Must be a non-negative number.";
    return null;
  }
  return n;
}

function optEmail(
  raw: Raw,
  key: string,
  errors: Record<string, string>,
): string | null {
  const s = str(raw, key);
  if (s === "") return null;
  if (!EMAIL_RE.test(s)) {
    errors[key] = "Invalid email address.";
    return null;
  }
  return s;
}

export function validateShipmentInput(
  raw: Raw,
): { ok: true; data: ShipmentInput } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const receiver_name = str(raw, "receiver_name");
  if (!receiver_name) errors.receiver_name = "Receiver name is required.";
  const sender_name = str(raw, "sender_name");
  if (!sender_name) errors.sender_name = "Sender name is required.";
  const origin = str(raw, "origin");
  if (!origin) errors.origin = "Origin is required.";
  const destination = str(raw, "destination");
  if (!destination) errors.destination = "Destination is required.";

  const freight_type = str(raw, "freight_type") || "Sea Freight";
  if (!FREIGHT_TYPES.includes(freight_type as FreightType))
    errors.freight_type = "Unknown freight type.";
  const status = str(raw, "status") || "Pending";
  if (!SHIPMENT_STATUSES.includes(status as ShipmentStatus))
    errors.status = "Unknown status.";

  const receiver_email = optEmail(raw, "receiver_email", errors);
  const sender_email = optEmail(raw, "sender_email", errors);

  const weight_kg = optNum(raw, "weight_kg", errors);
  const qty = optNum(raw, "qty", errors);
  const shipment_cost = optNum(raw, "shipment_cost", errors);
  const clearance_cost = optNum(raw, "clearance_cost", errors);

  const pctRaw = str(raw, "delivery_pct");
  const delivery_pct = pctRaw === "" ? 0 : Number(pctRaw);
  if (!Number.isInteger(delivery_pct) || delivery_pct < 0 || delivery_pct > 100)
    errors.delivery_pct = "Must be a whole number between 0 and 100.";

  if (Object.keys(errors).length) return { ok: false, errors };

  return {
    ok: true,
    data: {
      receiver_name,
      receiver_email,
      receiver_phone: optStr(raw, "receiver_phone"),
      receiver_address: optStr(raw, "receiver_address"),
      receiver_country: optStr(raw, "receiver_country"),
      sender_name,
      sender_email,
      sender_phone: optStr(raw, "sender_phone"),
      sender_address: optStr(raw, "sender_address"),
      sender_country: optStr(raw, "sender_country"),
      origin,
      destination,
      freight_type: freight_type as FreightType,
      content_type: optStr(raw, "content_type"),
      weight_kg,
      qty: qty === null ? null : Math.round(qty),
      description: optStr(raw, "description"),
      status: status as ShipmentStatus,
      date_shipped: optStr(raw, "date_shipped"),
      expected_delivery: optStr(raw, "expected_delivery"),
      current_location: optStr(raw, "current_location"),
      current_city: optStr(raw, "current_city"),
      shipment_cost,
      clearance_cost,
      delivery_pct,
      notice: optStr(raw, "notice"),
    },
  };
}
