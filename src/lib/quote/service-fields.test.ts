import { describe, expect, it } from "vitest";
import {
  SERVICE_QUOTE_FIELDS,
  SERVICE_QUOTE_SLUGS,
  getServiceQuoteConfig,
} from "@/lib/quote/service-fields";

const TYPES = ["text", "number", "date", "select", "multiselect", "textarea"];

describe("SERVICE_QUOTE_FIELDS", () => {
  it("has a config for all 5 declared slugs", () => {
    expect(SERVICE_QUOTE_SLUGS).toHaveLength(5);
    for (const slug of SERVICE_QUOTE_SLUGS) {
      expect(SERVICE_QUOTE_FIELDS[slug]?.slug).toBe(slug);
      expect(SERVICE_QUOTE_FIELDS[slug].fields.length).toBeGreaterThan(0);
    }
  });

  it("every field is well-formed", () => {
    for (const slug of SERVICE_QUOTE_SLUGS) {
      for (const f of SERVICE_QUOTE_FIELDS[slug].fields) {
        expect(f.name).toBeTruthy();
        expect(f.label).toBeTruthy();
        expect(TYPES).toContain(f.type);
        if (f.type === "select" || f.type === "multiselect") {
          expect(f.options && f.options.length > 0).toBe(true);
        }
      }
    }
  });

  it("resolves known slugs and rejects unknown", () => {
    expect(getServiceQuoteConfig("air-freight")?.title).toBe("Air freight quote");
    expect(getServiceQuoteConfig("bogus")).toBeUndefined();
  });
});
