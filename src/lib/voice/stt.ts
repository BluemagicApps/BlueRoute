export const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // ~25 MB

export type SttMode = "native" | "whisper" | "unsupported";

/** Pick the speech-to-text strategy from detected browser capabilities. */
export function resolveSttMode(caps: { speechRecognition: boolean; mediaRecorder: boolean }): SttMode {
  if (caps.speechRecognition) return "native";
  if (caps.mediaRecorder) return "whisper";
  return "unsupported";
}

/** Validate an uploaded audio blob/file. Returns an error string, or null when ok. */
export function validateAudio(file: { size: number } | null | undefined): string | null {
  if (!file || typeof file.size !== "number" || file.size <= 0) return "No audio provided.";
  if (file.size > MAX_AUDIO_BYTES) return "Recording too large.";
  return null;
}

/** Client helper: POST a recorded blob to the Whisper route and return the transcript. */
export async function transcribeViaApi(blob: Blob): Promise<string> {
  const form = new FormData();
  form.append("audio", blob, "recording.webm");
  const res = await fetch("/api/ai/stt", { method: "POST", body: form });
  if (!res.ok) throw new Error(`STT failed: ${res.status}`);
  const data = (await res.json()) as { text?: string };
  return (data.text ?? "").trim();
}
