import { describe, it, expect } from "vitest";
import {
  contactTeamEmail,
  contactAckEmail,
  bookingTeamEmail,
  bookingAckEmail,
} from "./templates";
import type { ContactInput } from "@/lib/leads/types";
import type { ResolvedBooking } from "@/lib/leads/booking";

const contact: ContactInput = {
  name: "Jane Shipper",
  company: "Acme",
  email: "jane@acme.com",
  topic: "Sales & quoting",
  message: "Need a quote to Rotterdam.",
};

const resolved: ResolvedBooking = {
  origin: { code: "CNSHA", label: "Shanghai, China" },
  destination: { code: "NLRTM", label: "Rotterdam, Netherlands" },
  container: { id: "40hc", label: "40' High-Cube" },
  mode: "door-to-door",
  option: {
    id: "balanced",
    name: "Balanced",
    tagline: "Best value",
    transitDays: 30,
    priceUSD: 3200,
    co2Kg: 1800,
    riskLabel: "Low",
    highlights: [],
  },
  insurance: true,
  insuranceFeeUSD: 60,
  totalUSD: 3260,
};

describe("contact templates", () => {
  it("team email includes name, email and ticket", () => {
    const { subject, html } = contactTeamEmail(contact, "BR-INQ-12345");
    expect(subject).toContain("BR-INQ-12345");
    expect(html).toContain("jane@acme.com");
    expect(html).toContain("Need a quote");
  });
  it("ack email greets the customer by first name", () => {
    const { html } = contactAckEmail(contact, "BR-INQ-12345");
    expect(html).toContain("Jane");
    expect(html).toContain("BR-INQ-12345");
  });
});

describe("booking templates", () => {
  it("team email includes route, total and booking ref", () => {
    const { subject, html } = bookingTeamEmail(
      { name: "Jane", email: "jane@acme.com" },
      resolved,
      "BR-CNNL-1234",
    );
    expect(subject).toContain("BR-CNNL-1234");
    expect(html).toContain("Shanghai, China");
    expect(html).toContain("Rotterdam, Netherlands");
    expect(html).toContain("3,260");
  });
  it("ack email confirms the booking ref", () => {
    const { html } = bookingAckEmail(
      { name: "Jane", email: "jane@acme.com" },
      resolved,
      "BR-CNNL-1234",
    );
    expect(html).toContain("BR-CNNL-1234");
    expect(html).toContain("Jane");
  });
});
