import "server-only";
import Groq from "groq-sdk";
import { safeParseJSON } from "@/lib/ai/json";

export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

let cached: Groq | null = null;
function client(): Groq {
  if (cached) return cached;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY missing.");
  cached = new Groq({ apiKey });
  return cached;
}

/** Non-streaming chat completion. Returns the assistant text (may be empty). */
export async function chat(messages: ChatMsg[]): Promise<string> {
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const res = await client().chat.completions.create({
    model,
    messages,
    temperature: 0.5,
    max_tokens: 700,
  });
  return res.choices[0]?.message?.content?.trim() ?? "";
}

/** Non-streaming JSON-mode completion. Returns a parsed object, or null on empty/invalid output. */
export async function chatJSON<T>(messages: ChatMsg[]): Promise<T | null> {
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const res = await client().chat.completions.create({
    model,
    messages,
    temperature: 0.4,
    max_tokens: 800,
    response_format: { type: "json_object" },
  });
  return safeParseJSON<T>(res.choices[0]?.message?.content ?? "");
}
