import { afterEach, describe, expect, it, vi } from "vitest";
import { geocodeCity } from "@/lib/geocode";

afterEach(() => vi.unstubAllGlobals());

describe("geocodeCity", () => {
  it("returns the first hit's coordinates", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ longitude: 9.99, latitude: 53.55 }] }),
    }));
    expect(await geocodeCity("Hamburg")).toEqual({ lng: 9.99, lat: 53.55 });
  });

  it("returns null on no results or network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
    expect(await geocodeCity("Xyzzy")).toBeNull();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await geocodeCity("Hamburg")).toBeNull();
  });

  it("strips trailing country qualifiers for better hits", async () => {
    const spy = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", spy);
    await geocodeCity("Hamburg port, Germany");
    expect(String(spy.mock.calls[0][0])).toContain(encodeURIComponent("Hamburg port"));
  });
});
