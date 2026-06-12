import { describe, expect, it } from "vitest";
import { buildTrackPayload } from "@/lib/tracking/payload";

const shipment = {
  id: "secret-uuid",
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-02T00:00:00Z",
  tracking_number: "BRL-12345678",
  receiver_name: "Graham Buckley",
  receiver_email: "g@example.com",
  receiver_phone: "+1 805",
  receiver_address: "Ridgeway Drive",
  receiver_country: "United States",
  sender_name: "Liebherr",
  sender_email: "info@example.com",
  sender_phone: "+49",
  sender_address: "Biberach",
  sender_country: "Germany",
  origin: "Hamburg port, Germany",
  destination: "Phnom Penh, Cambodia",
  freight_type: "Sea Freight",
  content_type: "Container",
  weight_kg: 150961.43,
  qty: 1,
  description: "Crane parts",
  status: "On Hold",
  date_shipped: "2026-05-12",
  expected_delivery: "2026-06-30",
  current_location: "Varna port, Varna",
  current_city: "Varna",
  current_lng: 27.91,
  current_lat: 43.2,
  origin_lng: 9.99,
  origin_lat: 53.55,
  destination_lng: 104.92,
  destination_lat: 11.56,
  shipment_cost: 25000,
  clearance_cost: 1200,
  delivery_pct: 59,
  photo_url: null,
  notice: "Urgent attention needed",
};

const events = [
  { id: "e1", shipment_id: "secret-uuid", created_at: "x", occurred_at: "2026-05-20T10:00:00Z", status: "On route", location: "Mersin port", country: "Turkey", comment: "Departed" },
  { id: "e2", shipment_id: "secret-uuid", created_at: "x", occurred_at: "2026-06-07T10:25:00Z", status: "On Hold", location: "Varna port", country: "Bulgaria", comment: "Hold" },
];

describe("buildTrackPayload", () => {
  it("includes consignment, parties, costs, notice, and map points", () => {
    const p = buildTrackPayload(shipment, events);
    expect(p.consignment.trackingNumber).toBe("BRL-12345678");
    expect(p.consignment.shipmentCost).toBe(25000);
    expect(p.receiver.name).toBe("Graham Buckley");
    expect(p.map.origin).toEqual({ name: "Hamburg port, Germany", lng: 9.99, lat: 53.55 });
    expect(p.map.current).toEqual({ name: "Varna", lng: 27.91, lat: 43.2 });
    expect(p.notice).toBe("Urgent attention needed");
  });

  it("never leaks internal ids", () => {
    const json = JSON.stringify(buildTrackPayload(shipment, events));
    expect(json).not.toContain("secret-uuid");
  });

  it("sorts events newest first", () => {
    const p = buildTrackPayload(shipment, events);
    expect(p.events[0].status).toBe("On Hold");
    expect(p.events[1].location).toBe("Mersin port");
  });

  it("yields null map points when coords are missing", () => {
    const p = buildTrackPayload(
      { ...shipment, origin_lng: null, origin_lat: null, current_lng: null, current_lat: null },
      [],
    );
    expect(p.map.origin).toBeNull();
    expect(p.map.current).toBeNull();
    expect(p.map.destination).not.toBeNull();
  });
});
