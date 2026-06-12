import { describe, it, expect } from "vitest";
import { validateShipmentInput } from "./shipment-validate";

const valid = {
  receiver_name: "Graham Buckley",
  receiver_email: "graham@example.com",
  sender_name: "Liebherr International",
  origin: "Hamburg port, Germany",
  destination: "Phnom Penh, Cambodia",
  freight_type: "Sea Freight",
  status: "In Transit",
  weight_kg: "150961.43",
  qty: "2",
  delivery_pct: "59",
};

describe("validateShipmentInput", () => {
  it("accepts a valid shipment and coerces numbers", () => {
    const r = validateShipmentInput(valid);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.weight_kg).toBeCloseTo(150961.43);
      expect(r.data.qty).toBe(2);
      expect(r.data.delivery_pct).toBe(59);
      expect(r.data.receiver_email).toBe("graham@example.com");
    }
  });

  it("requires receiver, sender, origin, destination", () => {
    const r = validateShipmentInput({ ...valid, receiver_name: " ", origin: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.receiver_name).toBeTruthy();
      expect(r.errors.origin).toBeTruthy();
    }
  });

  it("rejects unknown freight type and status", () => {
    const r = validateShipmentInput({ ...valid, freight_type: "Teleport", status: "Lost" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.freight_type).toBeTruthy();
      expect(r.errors.status).toBeTruthy();
    }
  });

  it("rejects out-of-range delivery_pct and negative numbers", () => {
    const r = validateShipmentInput({ ...valid, delivery_pct: "150", weight_kg: "-2" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.delivery_pct).toBeTruthy();
      expect(r.errors.weight_kg).toBeTruthy();
    }
  });

  it("rejects a malformed email but allows it empty", () => {
    const bad = validateShipmentInput({ ...valid, receiver_email: "not-an-email" });
    expect(bad.ok).toBe(false);
    const empty = validateShipmentInput({ ...valid, receiver_email: "" });
    expect(empty.ok).toBe(true);
    if (empty.ok) expect(empty.data.receiver_email).toBeNull();
  });

  it("defaults optional numerics to null when blank", () => {
    const r = validateShipmentInput({ ...valid, weight_kg: "", qty: "" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.weight_kg).toBeNull();
      expect(r.data.qty).toBeNull();
    }
  });
});

describe("coordinates", () => {
  const base = {
    receiver_name: "R",
    sender_name: "S",
    origin: "Hamburg",
    destination: "Phnom Penh",
  };

  it("accepts a full valid coordinate set", () => {
    const res = validateShipmentInput({
      ...base,
      origin_lng: "9.99",
      origin_lat: "53.55",
      destination_lng: "104.92",
      destination_lat: "11.56",
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.origin_lng).toBeCloseTo(9.99);
      expect(res.data.destination_lat).toBeCloseTo(11.56);
    }
  });

  it("treats empty coords as null", () => {
    const res = validateShipmentInput(base);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.origin_lng).toBeNull();
      expect(res.data.destination_lat).toBeNull();
    }
  });

  it("rejects a lng without its lat", () => {
    const res = validateShipmentInput({ ...base, origin_lng: "9.99" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.origin_lat).toBeTruthy();
  });

  it("rejects out-of-range values", () => {
    const res = validateShipmentInput({
      ...base,
      origin_lng: "200",
      origin_lat: "10",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.origin_lng).toBeTruthy();
  });
});
