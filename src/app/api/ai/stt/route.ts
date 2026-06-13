import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { validateAudio } from "@/lib/voice/stt";
import { transcribe } from "@/lib/ai/groq";

export async function POST(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (!checkRateLimit(`stt:${ip}`, Date.now(), 8)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  let file: FormDataEntryValue | null = null;
  try {
    const form = await req.formData();
    file = form.get("audio");
  } catch {
    return Response.json({ error: "Invalid upload." }, { status: 400 });
  }

  const audio = file && typeof file !== "string" ? file : null;
  const err = validateAudio(audio);
  if (err) return Response.json({ error: err }, { status: 400 });

  try {
    const text = await transcribe(audio as File);
    return Response.json({ text });
  } catch (e) {
    console.error("[stt] transcription failed:", e);
    return Response.json({ error: "Transcription failed." }, { status: 502 });
  }
}
