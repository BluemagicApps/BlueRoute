import { describe, expect, it } from "vitest";
import { validateServiceQuote, buildServiceDetails, type ServiceQuoteInput } from "@/lib/quote/validate";
import { getServiceQuoteConfig } from "@/lib/quote/service-fields";

const customs = getServiceQuoteConfig("customs")!;
const air = getServiceQuoteConfig("air-freight")!;

const validCustoms: ServiceQuoteInput = {
  slug: "customs",
  values: { direction: "Import", originCountry: "China", destCountry: "United States", mode: "Ocean" },
  name: "Jane Shipper",
  email: "jane@acme.com",
  company: "Acme",
  phone: "+1 555",
};

describe("validateServiceQuote", () => {
  it("passes a fully valid input", () => {
    expect(validateServiceQuote(customs, validCustoms)).toEqual({});
  });
  it("flags missing required service fields", () => {
    const e = validateServiceQuote(customs, { ...validCustoms, values: { direction: "", originCountry: "", destCountry: "" } });
    expect(e.direction).toBeTruthy();
    expect(e.originCountry).toBeTruthy();
    expect(e.destCountry).toBeTruthy();
  });
  it("flags a missing required field for air freight (weightKg)", () => {
    const e = validateServiceQuote(air, {
      slug: "air-freight",
      values: { origin: "PVG", destination: "LAX", serviceLevel: "Express" },
      name: "Jane", email: "jane@acme.com", company: "", phone: "",
    });
    expect(e.weightKg).toBeTruthy();
  });
  it("requires name and a valid email", () => {
    expect(validateServiceQuote(customs, { ...validCustoms, name: " " }).name).toBeTruthy();
    expect(validateServiceQuote(customs, { ...validCustoms, email: "nope" }).email).toBeTruthy();
  });
});

describe("buildServiceDetails", () => {
  it("merges entered fields and builds a non-empty summary", () => {
    const d = buildServiceDetails(customs, validCustoms);
    expect(d).toMatchObject({ service: "Customs & compliance quote", direction: "Import", originCountry: "China" });
    expect(typeof d.summary).toBe("string");
    expect((d.summary as string).length).toBeGreaterThan(0);
  });
  it("omits empty fields from details", () => {
    const d = buildServiceDetails(air, {
      slug: "air-freight",
      values: { origin: "PVG", destination: "LAX", serviceLevel: "Express", weightKg: "1200", pieces: "" },
      name: "Jane", email: "jane@acme.com", company: "", phone: "",
    });
    expect(d).not.toHaveProperty("pieces");
    expect(d).toMatchObject({ origin: "PVG", weightKg: "1200" });
  });
});
