import { describe, it, expect, vi, beforeEach } from "vitest";

const { chat, checkRateLimit } = vi.hoisted(() => ({
  chat: vi.fn(),
  checkRateLimit: vi.fn(() => true),
}));

vi.mock("@/lib/ai/groq", () => ({ chat }));
vi.mock("@/lib/ai/rate-limit", () => ({ checkRateLimit }));
vi.mock("@/lib/ai/system-prompt", () => ({ buildSystemPrompt: () => "SYSTEM" }));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: () => "1.2.3.4" }),
}));

import { askAdvisor } from "./advisor";
import type { AdvisorMessage } from "@/lib/ai/types";

const user = (content: string): AdvisorMessage[] => [{ role: "user", content }];

beforeEach(() => {
  chat.mockReset();
  checkRateLimit.mockReset();
  checkRateLimit.mockReturnValue(true);
});

describe("askAdvisor", () => {
  it("returns content and parsed CTA on success", async () => {
    chat.mockResolvedValue("Here you go.\nCTA: /quote | Get a quote");
    const res = await askAdvisor(user("Plan a route"));
    expect(res).toEqual({
      ok: true,
      content: "Here you go.",
      cta: { href: "/quote", label: "Get a quote" },
    });
  });

  it("blocks when rate-limited and does not call Groq", async () => {
    checkRateLimit.mockReturnValue(false);
    const res = await askAdvisor(user("hi"));
    expect(res.ok).toBe(false);
    expect(chat).not.toHaveBeenCalled();
  });

  it("rejects empty input without calling Groq", async () => {
    const res = await askAdvisor([]);
    expect(res.ok).toBe(false);
    expect(chat).not.toHaveBeenCalled();
  });

  it("rejects an oversized message", async () => {
    const res = await askAdvisor(user("x".repeat(2001)));
    expect(res.ok).toBe(false);
    expect(chat).not.toHaveBeenCalled();
  });

  it("returns a fallback error when Groq throws", async () => {
    chat.mockRejectedValue(new Error("boom"));
    const res = await askAdvisor(user("hi"));
    expect(res.ok).toBe(false);
  });
});
