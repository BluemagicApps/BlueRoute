# Voice Mode in the AI Advisor — Design

**Date:** 2026-06-13
**Plan item:** Item 16 ("Voice mode in the AI Advisor") in `docs/PLAN.md`.
**Branch:** continues `feat/warehouse-booking` (or a new branch).

## Goal

Make the AI Advisor talk and listen. Wire the existing (no-op) mic button so the user can
**speak** a message (native Web Speech API, with a **Groq Whisper** fallback for browsers
without `SpeechRecognition` — Firefox, iOS Safari), and have the assistant **speak its reply
aloud** (`speechSynthesis`). Works web + mobile.

## Decisions (agreed with Timi, 2026-06-13)

1. **Push-to-talk mic + spoken replies.** Click the mic to talk; speech becomes the message;
   the assistant then speaks its reply. A speaker/mute toggle controls spoken replies (default
   on). **Typed** messages are never spoken — only voice-initiated turns.
2. **Auto-send** on a final transcript (hands-free); the user can still type instead.
3. **English only** (matches the advisor's grounding). No wake-word, no streaming TTS.
4. Real Web Speech API + real Groq Whisper — no mocks. Failures degrade gracefully; the user
   can always fall back to typing.

## Architecture

Voice only feeds text into, and reads replies out of, the **existing** assistant pipeline
(`send(text)` → `askAdvisor` in `src/app/actions/advisor.ts`). Two thin browser hooks + one
server route + a small pure-helpers module. No new DB, no changes to `askAdvisor`.

```
use-speech-to-text.ts (STT hook) ──onTranscript──▶ ai-assistant.tsx send(text, viaVoice=true)
   ├─ native: window.SpeechRecognition                     │
   └─ fallback: MediaRecorder ─▶ transcribeViaApi ─▶ /api/ai/stt ─▶ groq.transcribe (Whisper)
use-speech.ts (TTS hook) ◀──speak(reply.content)── (voice-initiated, not muted)
src/lib/voice/stt.ts: resolveSttMode(caps), validateAudio(file), MAX_AUDIO_BYTES, transcribeViaApi(blob)
```

### Pure helpers — `src/lib/voice/stt.ts`

- `MAX_AUDIO_BYTES = 25 * 1024 * 1024` (Groq's audio limit headroom; ~25 MB).
- `type SttMode = "native" | "whisper" | "unsupported"`.
- `resolveSttMode(caps: { speechRecognition: boolean; mediaRecorder: boolean }): SttMode` —
  `"native"` if `speechRecognition`; else `"whisper"` if `mediaRecorder`; else `"unsupported"`.
  Pure → unit-tested.
- `validateAudio(file: { size: number } | null | undefined): string | null` — returns an error
  string for missing (`"No audio provided."`) or oversized (`> MAX_AUDIO_BYTES`,
  `"Recording too large."`) input, else `null`. Pure → unit-tested.
- `transcribeViaApi(blob: Blob): Promise<string>` — client helper: POST the blob as
  `multipart/form-data` (field `audio`) to `/api/ai/stt`; returns `data.text` or throws on a
  non-ok response. Thin IO (not unit-tested).

### Groq Whisper helper — add to `src/lib/ai/groq.ts`

```ts
export async function transcribe(file: File): Promise<string> {
  const model = process.env.GROQ_WHISPER_MODEL || "whisper-large-v3-turbo";
  const res = await client().audio.transcriptions.create({ file, model });
  return (res.text ?? "").trim();
}
```

Reuses the existing cached `client()`; `import "server-only"` already present.

### Whisper route — `src/app/api/ai/stt/route.ts`

`POST` handler (mirrors the defensive style of `src/app/api/track/[number]/route.ts`):
1. Per-IP rate limit via `checkRateLimit` (x-forwarded-for) → 429 JSON on limit.
2. `const form = await req.formData(); const file = form.get("audio")`.
3. `validateAudio(file)` → 400 JSON `{ error }` on failure.
4. `transcribe(file as File)` inside try/catch → 502 JSON on Groq error (logged).
5. Success → `{ text }` JSON. Always returns JSON; never throws to the client.

### STT hook — `src/components/ai/use-speech-to-text.ts`

`useSpeechToText({ onTranscript }: { onTranscript: (text: string) => void })` →
`{ mode: SttMode; listening: boolean; transcribing: boolean; error: string | null; start: () => void; stop: () => void }`.

- On mount, compute `mode` via `resolveSttMode` from feature detection
  (`"SpeechRecognition" in window || "webkitSpeechRecognition" in window`; `"MediaRecorder" in window`).
- **Native:** lazily construct a `SpeechRecognition` (`lang = "en-US"`, `interimResults = false`,
  `continuous = false`). `start()` → `listening = true`; on `result`, take the final transcript →
  `onTranscript(text)`; `onend` → `listening = false`; `onerror` → set `error`, clear listening.
  `stop()` calls `recognition.stop()`.
- **Whisper:** `start()` → `getUserMedia({ audio: true })` + `MediaRecorder`, collect chunks,
  `listening = true`. `stop()` → stop recorder; on `stop` event assemble a `Blob`,
  `transcribing = true`, `await transcribeViaApi(blob)` → `onTranscript(text)`,
  `transcribing = false`. Errors (permission denied, API failure) → set `error`.
- **Unsupported:** `start`/`stop` are no-ops; the consumer hides the mic.
- A minimal local TypeScript interface declares the `SpeechRecognition` shape used (the DOM lib
  doesn't ship it), avoiding `any`.

### TTS hook — `src/components/ai/use-speech.ts`

`useSpeech()` → `{ supported: boolean; speaking: boolean; speak: (text: string) => void; cancel: () => void }`.
- `supported = "speechSynthesis" in window`.
- `speak(text)`: `cancel()` any current utterance, create `SpeechSynthesisUtterance(text)`
  (browser default voice, `lang = "en-US"`), wire `onend`/`onerror` → `speaking = false`,
  `speechSynthesis.speak(u)`, `speaking = true`. Guards against empty text.
- `cancel()`: `speechSynthesis.cancel()`, `speaking = false`.

### Wiring `src/components/ai/ai-assistant.tsx`

- Add `useSpeechToText({ onTranscript: (t) => send(t, true) })` and `useSpeech()`.
- `send` gains an optional second arg `viaVoice = false`. After a successful reply, if
  `viaVoice && spokenRepliesOn && tts.supported` → `tts.speak(res.content)`.
- **Mic button** (currently a no-op at the input row): `onClick` toggles `listening ? stop() : start()`.
  Visual states — idle (`Mic`), listening (active/pulsing, e.g. red ring), transcribing (spinner).
  Hidden when `stt.mode === "unsupported"`. An `error` shows as a small inline hint.
- **Speaker/mute toggle** in the panel header (near the close button): toggles `spokenRepliesOn`
  (local `useState`, default `true`); shown only when `tts.supported`. While `tts.speaking`,
  clicking it calls `tts.cancel()` (stop talking). Icons: `Volume2` / `VolumeX` (lucide).
- On panel close (`setOpen(false)`) and on unmount → `tts.cancel()` and `stt.stop()`.

## Error handling & honesty

- Mic permission denied / STT error → inline hint ("Couldn't access the mic — you can type
  instead."), never a crash.
- Whisper route failure → `transcribeViaApi` throws → hook sets `error`; user types instead.
- Rate-limited STT → 429 surfaced as a gentle hint.
- Real APIs throughout; no fabricated transcripts or canned audio.

## Testing

Voice APIs aren't implemented in jsdom, so automated tests cover the **pure** pieces; the live
speech path is verified manually.

- `src/lib/voice/stt.test.ts` — `resolveSttMode` (native when speechRecognition; whisper when
  only mediaRecorder; unsupported when neither) and `validateAudio` (null on a small file;
  error on missing; error on `> MAX_AUDIO_BYTES`).
- `scripts/verify-voice-e2e.mjs` — `POST /api/ai/stt` with no `audio` field → 400 JSON;
  `GET /api/ai/stt` (wrong method) → 405; `/` still 200. (Reject paths need no Groq call.)
- **Manual:** Chrome → click mic, speak, message auto-sends, reply is spoken; mute toggle
  silences it; Firefox → MediaRecorder → Whisper transcript path; mic hidden where unsupported.

## Verification

- `npx vitest run` all green.
- `npx tsc --noEmit` clean; `npx eslint` clean on changed files.
- `npx next build` green (new route `/api/ai/stt`).
- `node scripts/verify-voice-e2e.mjs` → ALL GREEN (dev server up).
- Manual eyeball per the Testing section (needs `GROQ_API_KEY`, already set).

## Out of scope

- Wake-word / always-on listening; streaming TTS; voice voice-picking UI.
- Multi-language voice (English only).
- Voice anywhere other than the advisor panel.
- No change to the `askAdvisor` action or its grounding.
