import { describe, expect, it } from "vitest";
import { safeParseJSON } from "@/lib/ai/json";

describe("safeParseJSON", () => {
  it("parses a valid JSON object", () => {
    expect(safeParseJSON<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
  });
  it("returns null on garbage", () => {
    expect(safeParseJSON("not json")).toBeNull();
    expect(safeParseJSON("")).toBeNull();
  });
  it("returns null for non-object JSON", () => {
    expect(safeParseJSON("42")).toBeNull();
    expect(safeParseJSON("null")).toBeNull();
  });
});
