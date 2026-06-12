// Pure builder for the public /api/track payload. Internal ids and admin-only
// fields stay out; costs are intentionally public (product decision).

export type TrackPoint = { name: string; lng: number; lat: number };

export type TrackEvent = {
  status: string;
  location: string;
  country: string | null;
  occurredAt: string;
  comment: string | null;
};

export type TrackPayload = {
  consignment: {
    trackingNumber: string;
    status: string;
    freightType: string;
    contentType: string | null;
    weightKg: number | null;
    qty: number | null;
    description: string | null;
    deliveryPct: number;
    dateShipped: string | null;
    expectedDelivery: string | null;
    shipmentCost: number | null;
    clearanceCost: number | null;
    origin: string;
    destination: string;
    currentLocation: string | null;
    photoUrl: string | null;
  };
  receiver: Party;
  sender: Party;
  map: {
    origin: TrackPoint | null;
    destination: TrackPoint | null;
    current: TrackPoint | null;
  };
  notice: string | null;
  events: TrackEvent[];
};

type Party = {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  country: string | null;
};

type ShipmentRow = Record<string, unknown>;
type EventRow = {
  occurred_at: string;
  status: string;
  location: string;
  country: string | null;
  comment: string | null;
};

const s = (r: ShipmentRow, k: string) => (r[k] as string | null) ?? null;
const n = (r: ShipmentRow, k: string) => {
  const v = r[k];
  return typeof v === "number" ? v : v == null ? null : Number(v);
};

function point(r: ShipmentRow, name: string | null, lngKey: string, latKey: string): TrackPoint | null {
  const lng = n(r, lngKey);
  const lat = n(r, latKey);
  if (lng == null || lat == null || !name) return null;
  return { name, lng, lat };
}

export function buildTrackPayload(shipment: ShipmentRow, events: EventRow[]): TrackPayload {
  return {
    consignment: {
      trackingNumber: s(shipment, "tracking_number") ?? "",
      status: s(shipment, "status") ?? "Pending",
      freightType: s(shipment, "freight_type") ?? "Sea Freight",
      contentType: s(shipment, "content_type"),
      weightKg: n(shipment, "weight_kg"),
      qty: n(shipment, "qty"),
      description: s(shipment, "description"),
      deliveryPct: n(shipment, "delivery_pct") ?? 0,
      dateShipped: s(shipment, "date_shipped"),
      expectedDelivery: s(shipment, "expected_delivery"),
      shipmentCost: n(shipment, "shipment_cost"),
      clearanceCost: n(shipment, "clearance_cost"),
      origin: s(shipment, "origin") ?? "",
      destination: s(shipment, "destination") ?? "",
      currentLocation: s(shipment, "current_location"),
      photoUrl: s(shipment, "photo_url"),
    },
    receiver: {
      name: s(shipment, "receiver_name") ?? "",
      email: s(shipment, "receiver_email"),
      phone: s(shipment, "receiver_phone"),
      address: s(shipment, "receiver_address"),
      country: s(shipment, "receiver_country"),
    },
    sender: {
      name: s(shipment, "sender_name") ?? "",
      email: s(shipment, "sender_email"),
      phone: s(shipment, "sender_phone"),
      address: s(shipment, "sender_address"),
      country: s(shipment, "sender_country"),
    },
    map: {
      origin: point(shipment, s(shipment, "origin"), "origin_lng", "origin_lat"),
      destination: point(shipment, s(shipment, "destination"), "destination_lng", "destination_lat"),
      current: point(
        shipment,
        s(shipment, "current_city") ?? s(shipment, "current_location"),
        "current_lng",
        "current_lat",
      ),
    },
    notice: s(shipment, "notice"),
    events: [...events]
      .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
      .map((e) => ({
        status: e.status,
        location: e.location,
        country: e.country,
        occurredAt: e.occurred_at,
        comment: e.comment,
      })),
  };
}
