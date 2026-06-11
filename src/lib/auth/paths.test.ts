import { describe, it, expect } from "vitest";
import { isProtectedPath } from "./paths";

describe("isProtectedPath", () => {
  it("protects /portal exactly", () => {
    expect(isProtectedPath("/portal")).toBe(true);
  });

  it("protects nested portal paths", () => {
    expect(isProtectedPath("/portal/invoices")).toBe(true);
  });

  it("does not protect lookalike prefixes", () => {
    expect(isProtectedPath("/portal-preview")).toBe(false);
  });

  it("leaves public routes alone", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/login")).toBe(false);
    expect(isProtectedPath("/tracking")).toBe(false);
  });
});
