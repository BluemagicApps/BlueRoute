"use server";

import { headers } from "next/headers";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { chat } from "@/lib/ai/groq";
import { extractCta } from "@/lib/ai/cta";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import type { AdvisorMessage, AdvisorResult } from "@/lib/ai/types";

const MAX_LEN = 2000;
const MAX_HISTORY = 12;
const FALLBACK =
  "The advisor is briefly unavailable — please try again, or use the quote and tracking tools.";

export async function askAdvisor(messages: AdvisorMessage[]): Promise<AdvisorResult> {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, error: "Please type a message." };
  }
  const last = messages[messages.length - 1];
  if (!last || last.role !== "user" || !last.content.trim()) {
    return { ok: false, error: "Please type a message." };
  }
  if (last.content.length > MAX_LEN) {
    return { ok: false, error: "That message is a bit long — please shorten it." };
  }

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!checkRateLimit(ip)) {
    return { ok: false, error: "You're sending messages quickly — give it a few seconds." };
  }

  const history = messages
    .slice(-MAX_HISTORY)
    .filter((m) => m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_LEN) }));

  try {
    const reply = await chat([{ role: "system", content: buildSystemPrompt() }, ...history]);
    if (!reply) return { ok: false, error: FALLBACK };
    const { content, cta } = extractCta(reply);
    return { ok: true, content, cta };
  } catch (err) {
    console.error("[advisor] groq error:", err);
    return { ok: false, error: FALLBACK };
  }
}
