import { describe, it, expect } from "vitest";
import { validateContact, validateBooking } from "./validate";
import type { ContactInput, BookingInput } from "./types";

const goodContact: ContactInput = {
  name: "Jane Shipper",
  company: "Acme",
  email: "jane@acme.com",
  topic: "Sales & quoting",
  message: "Need a quote.",
};

const goodBooking: BookingInput = {
  name: "Jane",
  email: "jane@acme.com",
  company: "",
  originCode: "CNSHA",
  destCode: "NLRTM",
  mode: "door-to-door",
  containerId: "40hc",
  optionId: "balanced",
  insurance: true,
  weightKg: 18000,
  readyDate: null,
};

describe("validateContact", () => {
  it("passes a valid contact", () => {
    expect(validateContact(goodContact)).toEqual({});
  });
  it("flags missing name, bad email, empty message", () => {
    const errs = validateContact({ ...goodContact, name: " ", email: "nope", message: "" });
    expect(errs.name).toBeTruthy();
    expect(errs.email).toBeTruthy();
    expect(errs.message).toBeTruthy();
  });
});

describe("validateBooking", () => {
  it("passes a valid booking", () => {
    expect(validateBooking(goodBooking)).toEqual({});
  });
  it("flags bad email and same origin/destination", () => {
    const errs = validateBooking({ ...goodBooking, email: "x", destCode: "CNSHA" });
    expect(errs.email).toBeTruthy();
    expect(errs.route).toBeTruthy();
  });
});
