import { NextResponse } from "next/server";
import { chat } from "@/lib/ai/groq";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { isLocale } from "@/lib/i18n/locales";
import { buildTranslatePrompt, normalizeTranslation } from "@/lib/i18n/translate";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
  let body: { text?: unknown; targetLocale?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text : "";
  const target = body.targetLocale;
  if (!text || typeof target !== "string" || !isLocale(target)) {
    return NextResponse.json({ error: "text and a valid targetLocale are required." }, { status: 400 });
  }
  if (target === "en") {
    return NextResponse.json({ translation: text });
  }
  try {
    const raw = await chat([{ role: "user", content: buildTranslatePrompt(text, target) }]);
    const translation = normalizeTranslation(raw);
    return NextResponse.json({ translation: translation ?? text });
  } catch {
    return NextResponse.json({ translation: text }); // best-effort: fall back to source
  }
}
