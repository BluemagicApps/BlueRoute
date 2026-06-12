import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, __resetRateLimit } from "./rate-limit";

beforeEach(() => __resetRateLimit());

describe("checkRateLimit", () => {
  it("allows up to 8 messages in the window, then blocks", () => {
    for (let i = 0; i < 8; i++) {
      expect(checkRateLimit("ip-a", 1000)).toBe(true);
    }
    expect(checkRateLimit("ip-a", 1000)).toBe(false);
  });
  it("allows again after the window elapses", () => {
    for (let i = 0; i < 8; i++) checkRateLimit("ip-b", 0);
    expect(checkRateLimit("ip-b", 0)).toBe(false);
    expect(checkRateLimit("ip-b", 60_001)).toBe(true);
  });
  it("tracks keys independently", () => {
    for (let i = 0; i < 8; i++) checkRateLimit("ip-c", 0);
    expect(checkRateLimit("ip-c", 0)).toBe(false);
    expect(checkRateLimit("ip-d", 0)).toBe(true);
  });
  it("honors a custom limit", () => {
    __resetRateLimit();
    for (let i = 0; i < 20; i++) expect(checkRateLimit("k20", 1000, 20)).toBe(true);
    expect(checkRateLimit("k20", 1000, 20)).toBe(false);
  });
});
