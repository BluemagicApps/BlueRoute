import { describe, expect, it } from "vitest";
import { validateWarehouseBooking, buildBookingDetails } from "@/lib/bookings/validate";
import type { WarehouseBookingInput } from "@/lib/bookings/validate";

const valid: WarehouseBookingInput = {
  facilityId: "rtm-a",
  name: "Jane Shipper",
  email: "jane@acme.com",
  company: "Acme",
  phone: "+1 555",
  sqftRequested: 20000,
  moveIn: "2026-08-01",
  termMonths: 24,
  features: ["Cold storage"],
  message: "Need reefer space.",
};

describe("validateWarehouseBooking", () => {
  it("passes a fully valid input", () => {
    expect(validateWarehouseBooking(valid)).toEqual({});
  });
  it("requires name", () => {
    expect(validateWarehouseBooking({ ...valid, name: " " }).name).toBeTruthy();
  });
  it("requires a valid email", () => {
    expect(validateWarehouseBooking({ ...valid, email: "nope" }).email).toBeTruthy();
  });
  it("requires positive sqft and term", () => {
    expect(validateWarehouseBooking({ ...valid, sqftRequested: 0 }).sqftRequested).toBeTruthy();
    expect(validateWarehouseBooking({ ...valid, termMonths: 0 }).termMonths).toBeTruthy();
  });
  it("requires a move-in date", () => {
    expect(validateWarehouseBooking({ ...valid, moveIn: "" }).moveIn).toBeTruthy();
  });
});

describe("buildBookingDetails", () => {
  it("merges facility info with the request", () => {
    const d = buildBookingDetails(valid, {
      name: "Rotterdam Smart Hub A",
      city: "Rotterdam",
      country: "Netherlands",
    });
    expect(d).toMatchObject({
      facilityName: "Rotterdam Smart Hub A",
      city: "Rotterdam",
      country: "Netherlands",
      sqftRequested: 20000,
      moveIn: "2026-08-01",
      termMonths: 24,
      features: ["Cold storage"],
      message: "Need reefer space.",
    });
  });
});
