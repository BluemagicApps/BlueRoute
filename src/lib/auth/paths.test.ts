import { describe, it, expect } from "vitest";
import { isProtectedPath, isAdminPath } from "./paths";

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

describe("isAdminPath", () => {
  it("matches /admin and nested", () => {
    expect(isAdminPath("/admin")).toBe(true);
    expect(isAdminPath("/admin/shipments/abc")).toBe(true);
  });
  it("excludes the admin login page itself", () => {
    expect(isAdminPath("/admin/login")).toBe(false);
  });
  it("ignores lookalikes and public routes", () => {
    expect(isAdminPath("/administration")).toBe(false);
    expect(isAdminPath("/portal")).toBe(false);
  });
});
