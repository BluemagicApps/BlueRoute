# Voice Mode in the AI Advisor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the AI Advisor's mic so users can speak a message (native Web Speech API + Groq Whisper fallback) and hear the reply spoken aloud (`speechSynthesis`).

**Architecture:** Two thin browser hooks (`useSpeechToText`, `useSpeech`) + a `/api/ai/stt` Whisper route + a pure-helpers module feed text into / read replies out of the **existing** `send()`/`askAdvisor` pipeline. No new DB, no change to `askAdvisor`.

**Tech Stack:** Next 16 (App Router, route handler), React client hooks, Web Speech API (`SpeechRecognition`, `speechSynthesis`), `MediaRecorder`, Groq Whisper (`groq-sdk` `audio.transcriptions`), Tailwind v4, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-13-voice-mode-design.md`

**Executor notes:**
- **Next 16**: route handlers export async method fns; `Response.json(body, { status })`. IP via `req.headers.get("x-forwarded-for")`.
- `checkRateLimit(key, now, limit)` from `src/lib/ai/rate-limit.ts` (sliding window). Pattern: `checkRateLimit(\`stt:${ip}\`, Date.now(), 8)`.
- `src/lib/ai/groq.ts` has a cached `client()` (Groq SDK) + `import "server-only"`; the SDK exposes `client().audio.transcriptions.create({ file, model })`.
- The Web Speech `SpeechRecognition` type is NOT in the DOM lib — declare a minimal local interface (don't use `any`). `MediaRecorder`, `SpeechSynthesisUtterance`, `navigator.mediaDevices` ARE in the DOM lib.
- The assistant (`src/components/ai/ai-assistant.tsx`) is mounted site-wide in the layout — if it throws, every page 500s, so a `curl / → 200` is a good smoke test.
- Run tests: `npx vitest run` (115 currently pass). Dev server: http://localhost:3000.
- End every commit message with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

---

### Task 1: Pure voice helpers

**Files:**
- Create: `src/lib/voice/stt.ts`
- Test: `src/lib/voice/stt.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/voice/stt.test.ts
import { describe, expect, it } from "vitest";
import { resolveSttMode, validateAudio, MAX_AUDIO_BYTES } from "@/lib/voice/stt";

describe("resolveSttMode", () => {
  it("prefers native, then whisper, then unsupported", () => {
    expect(resolveSttMode({ speechRecognition: true, mediaRecorder: true })).toBe("native");
    expect(resolveSttMode({ speechRecognition: true, mediaRecorder: false })).toBe("native");
    expect(resolveSttMode({ speechRecognition: false, mediaRecorder: true })).toBe("whisper");
    expect(resolveSttMode({ speechRecognition: false, mediaRecorder: false })).toBe("unsupported");
  });
});

describe("validateAudio", () => {
  it("accepts a small non-empty file", () => {
    expect(validateAudio({ size: 1024 })).toBeNull();
  });
  it("rejects missing / empty audio", () => {
    expect(validateAudio(null)).toBeTruthy();
    expect(validateAudio(undefined)).toBeTruthy();
    expect(validateAudio({ size: 0 })).toBeTruthy();
  });
  it("rejects oversized audio", () => {
    expect(validateAudio({ size: MAX_AUDIO_BYTES + 1 })).toBe("Recording too large.");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/voice/stt.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/voice/stt.ts`**

```ts
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/voice/stt.test.ts`
Expected: PASS. Then `npx tsc --noEmit` clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/voice/stt.ts src/lib/voice/stt.test.ts
git commit -m "feat: pure voice helpers (STT mode + audio validation)"
```

---

### Task 2: Groq Whisper transcribe helper

**Files:**
- Modify: `src/lib/ai/groq.ts`

- [ ] **Step 1: Add the helper.** FIRST read `src/lib/ai/groq.ts`. Append at the END of the file (reuse the existing private `client()`):

```ts
/** Transcribe an audio file via Groq Whisper. Returns the recognized text. */
export async function transcribe(file: File): Promise<string> {
  const model = process.env.GROQ_WHISPER_MODEL || "whisper-large-v3-turbo";
  const res = await client().audio.transcriptions.create({ file, model });
  return (res.text ?? "").trim();
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` (clean — confirms the Groq SDK's `audio.transcriptions.create` signature accepts `{ file, model }`), `npx eslint src/lib/ai/groq.ts` (clean), `npx vitest run` (still 115 green).

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/groq.ts
git commit -m "feat: Groq Whisper transcribe helper"
```

---

### Task 3: Whisper STT route

**Files:**
- Create: `src/app/api/ai/stt/route.ts`

- [ ] **Step 1: Implement `src/app/api/ai/stt/route.ts`**

```ts
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
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` (clean), `npx eslint "src/app/api/ai/stt/route.ts"` (clean). With the dev server up:
- `curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/ai/stt` → expect `400` (no `audio` field; `req.formData()` on an empty body may 400 either via the catch or the validateAudio guard — both return 400).
- `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/ai/stt` → expect `405` (GET not implemented).
If the dev server is down (curl 000), note it and skip the curl checks — do NOT start a server.

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/ai/stt/route.ts"
git commit -m "feat: /api/ai/stt Whisper transcription route"
```

---

### Task 4: Speech-to-text hook

**Files:**
- Create: `src/components/ai/use-speech-to-text.ts`

- [ ] **Step 1: Implement `src/components/ai/use-speech-to-text.ts`**

```ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolveSttMode, transcribeViaApi, type SttMode } from "@/lib/voice/stt";

// Minimal shape of the Web Speech API we use (not in the DOM lib types).
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionEventLike = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type UseSpeechToText = {
  mode: SttMode;
  listening: boolean;
  transcribing: boolean;
  error: string | null;
  start: () => void;
  stop: () => void;
};

export function useSpeechToText({ onTranscript }: { onTranscript: (text: string) => void }): UseSpeechToText {
  const [mode, setMode] = useState<SttMode>("unsupported");
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  useEffect(() => {
    const caps = {
      speechRecognition: !!getRecognitionCtor(),
      mediaRecorder:
        typeof window !== "undefined" && "MediaRecorder" in window && !!navigator.mediaDevices,
    };
    setMode(resolveSttMode(caps));
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    setError(null);
    if (mode === "native") {
      const Ctor = getRecognitionCtor();
      if (!Ctor) return;
      const rec = new Ctor();
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.continuous = false;
      rec.onresult = (e) => {
        const text = Array.from(e.results)
          .map((r) => r[0]?.transcript ?? "")
          .join(" ")
          .trim();
        if (text) onTranscriptRef.current(text);
      };
      rec.onerror = (e) => {
        setError(
          e.error === "not-allowed"
            ? "Couldn't access the mic — you can type instead."
            : "Voice input failed — please type.",
        );
        setListening(false);
      };
      rec.onend = () => setListening(false);
      recognitionRef.current = rec;
      rec.start();
      setListening(true);
    } else if (mode === "whisper") {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const recorder = new MediaRecorder(stream);
          chunksRef.current = [];
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
          };
          recorder.onstop = async () => {
            stream.getTracks().forEach((t) => t.stop());
            const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
            setTranscribing(true);
            try {
              const text = await transcribeViaApi(blob);
              if (text) onTranscriptRef.current(text);
            } catch {
              setError("Transcription failed — please type.");
            } finally {
              setTranscribing(false);
            }
          };
          recorderRef.current = recorder;
          recorder.start();
          setListening(true);
        })
        .catch(() => {
          setError("Couldn't access the mic — you can type instead.");
          setListening(false);
        });
    }
  }, [mode]);

  useEffect(() => () => stop(), [stop]);

  return useMemo(
    () => ({ mode, listening, transcribing, error, start, stop }),
    [mode, listening, transcribing, error, start, stop],
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` (clean) and `npx eslint src/components/ai/use-speech-to-text.ts` (clean). (No unit test — browser speech APIs aren't available in jsdom; the pure parts live in Task 1.)

- [ ] **Step 3: Commit**

```bash
git add src/components/ai/use-speech-to-text.ts
git commit -m "feat: useSpeechToText hook (native + Whisper fallback)"
```

---

### Task 5: Text-to-speech hook

**Files:**
- Create: `src/components/ai/use-speech.ts`

- [ ] **Step 1: Implement `src/components/ai/use-speech.ts`**

```ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type UseSpeech = {
  supported: boolean;
  speaking: boolean;
  speak: (text: string) => void;
  cancel: () => void;
};

export function useSpeech(): UseSpeech {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const cancel = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(trimmed);
    u.lang = "en-US";
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  }, []);

  useEffect(() => () => cancel(), [cancel]);

  return useMemo(() => ({ supported, speaking, speak, cancel }), [supported, speaking, speak, cancel]);
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` (clean) and `npx eslint src/components/ai/use-speech.ts` (clean).

- [ ] **Step 3: Commit**

```bash
git add src/components/ai/use-speech.ts
git commit -m "feat: useSpeech hook (speechSynthesis TTS)"
```

---

### Task 6: Wire voice into the AI Assistant

**Files:**
- Modify: `src/components/ai/ai-assistant.tsx`

This file is heavily touched (imports, hooks, the `send` signature, the header, the input row), so replace the WHOLE file with the version below. It preserves all existing behavior and adds: the two hooks, a `spokenRepliesOn` toggle, mic wiring with listening/transcribing states, a header speaker/mute button, an error hint, and auto-stop on close. The `Bubble`/`Typing` helpers are unchanged.

- [ ] **Step 1: Replace `src/components/ai/ai-assistant.tsx` with EXACTLY this content**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, Send, Mic, MicOff, Loader2, Volume2, VolumeX, X, ArrowRight, Bot } from "lucide-react";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { askAdvisor } from "@/app/actions/advisor";
import type { AdvisorMessage } from "@/lib/ai/types";
import { useSpeech } from "@/components/ai/use-speech";
import { useSpeechToText } from "@/components/ai/use-speech-to-text";

type Msg = {
  id: number;
  role: "user" | "assistant";
  content: string;
  cta?: { label: string; href: string };
};

const QUICK_PROMPTS = [
  "Plan an Asia→Europe shipment, lowest risk",
  "What if the Red Sea is disrupted?",
  "Recommend a warehouse near Rotterdam",
  "Get an instant quote",
];

const GREETING: Msg = {
  id: 0,
  role: "assistant",
  content:
    "Hi, I'm the BlueRoute AI Advisor. I can quote shipments, explain tracking, analyze risk, and plan multi-leg routes. What can I help with?",
};

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [spokenRepliesOn, setSpokenRepliesOn] = useState(true);
  const idRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const tts = useSpeech();

  // Allow any CTA on the site to open the advisor.
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("br-open-assistant", handler);
    return () => window.removeEventListener("br-open-assistant", handler);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking, open]);

  const send = async (text: string, viaVoice = false) => {
    const value = text.trim();
    if (!value || thinking) return;
    const userMsg: Msg = { id: idRef.current++, role: "user", content: value };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setThinking(true);

    // Send the conversation (minus the canned greeting) to the model.
    const history: AdvisorMessage[] = next
      .filter((m) => m.id !== 0)
      .map((m) => ({ role: m.role, content: m.content }));

    const res = await askAdvisor(history);
    setThinking(false);
    setMessages((m) => [
      ...m,
      res.ok
        ? { id: idRef.current++, role: "assistant", content: res.content, cta: res.cta }
        : { id: idRef.current++, role: "assistant", content: res.error },
    ]);
    if (viaVoice && res.ok && spokenRepliesOn && tts.supported) {
      tts.speak(res.content);
    }
  };

  const stt = useSpeechToText({ onTranscript: (text) => send(text, true) });

  // Stop audio + listening whenever the panel closes.
  useEffect(() => {
    if (!open) {
      tts.cancel();
      stt.stop();
    }
  }, [open, tts.cancel, stt.stop]);

  return (
    <>
      {/* Launcher */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.5, ease: EASE_OUT_EXPO }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Open BlueRoute AI Advisor"
        className="bg-aurora-gradient fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full px-4 py-3.5 text-sm font-semibold text-white shadow-[0_12px_40px_-8px_rgba(110,75,255,0.6)] transition-transform hover:-translate-y-0.5 active:scale-95"
      >
        <span className="relative flex h-5 w-5 items-center justify-center">
          <Sparkles className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-white" />
        </span>
        <span className="hidden sm:inline">AI Advisor</span>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
            className="fixed bottom-20 right-4 z-[60] flex h-[min(70vh,560px)] w-[min(92vw,390px)] flex-col overflow-hidden rounded-3xl border border-steel/70 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="bg-aurora-gradient flex items-center justify-between px-5 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 backdrop-blur">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold leading-tight">BlueRoute AI Advisor</p>
                  <p className="flex items-center gap-1 text-[0.7rem] text-white/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Online · agentic
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {tts.supported && (
                  <button
                    type="button"
                    onClick={() => (tts.speaking ? tts.cancel() : setSpokenRepliesOn((v) => !v))}
                    aria-label={tts.speaking ? "Stop speaking" : spokenRepliesOn ? "Mute spoken replies" : "Unmute spoken replies"}
                    className="grid h-8 w-8 place-items-center rounded-full text-white/90 hover:bg-white/15"
                  >
                    {spokenRepliesOn || tts.speaking ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="grid h-8 w-8 place-items-center rounded-full text-white/90 hover:bg-white/15"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-abyss p-4">
              {messages.map((m) => (
                <Bubble key={m.id} msg={m} />
              ))}
              {thinking && <Typing />}
            </div>

            {/* Quick prompts */}
            {messages.length <= 2 && (
              <div className="flex flex-wrap gap-1.5 border-t border-steel/60 bg-white px-3 pt-3">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="rounded-full border border-steel/70 px-2.5 py-1 text-[0.72rem] text-mist transition-colors hover:border-cyan/40 hover:text-cyan"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Voice error hint */}
            {stt.error && (
              <p className="bg-white px-3 pt-2 text-center text-[0.7rem] text-rose">{stt.error}</p>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 bg-white p-3"
            >
              {stt.mode !== "unsupported" && (
                <button
                  type="button"
                  onClick={() => (stt.listening ? stt.stop() : stt.start())}
                  disabled={thinking || stt.transcribing}
                  aria-label={stt.listening ? "Stop listening" : "Voice input"}
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-colors disabled:opacity-40 ${
                    stt.listening
                      ? "border-rose/60 bg-rose/10 text-rose"
                      : "border-steel/70 text-mist hover:border-cyan/40 hover:text-cyan"
                  }`}
                >
                  {stt.transcribing ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : stt.listening ? (
                    <MicOff className="h-4.5 w-4.5" />
                  ) : (
                    <Mic className="h-4.5 w-4.5" />
                  )}
                </button>
              )}
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about quotes, tracking, risk…"
                aria-label="Message the AI Advisor"
                className="h-10 flex-1 rounded-full border border-steel/70 bg-abyss px-4 text-sm text-foam placeholder:text-mist/70 outline-none focus:border-cyan/50"
              />
              <button
                type="submit"
                aria-label="Send"
                disabled={!input.trim() || thinking}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan to-indigo text-white transition-transform active:scale-90 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "max-w-[80%] rounded-2xl rounded-br-sm bg-gradient-to-br from-cyan to-indigo px-3.5 py-2.5 text-sm text-white"
            : "max-w-[88%] rounded-2xl rounded-bl-sm border border-steel/70 bg-white px-3.5 py-2.5 text-sm text-foam shadow-soft"
        }
      >
        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
        {msg.cta && (
          <Link
            href={msg.cta.href}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-cyan"
          >
            {msg.cta.label} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-steel/70 bg-white px-4 py-3 shadow-soft">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
```

The `· … → —` are special characters (middle-dot, ellipsis, arrow, em-dash) — preserve them exactly.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` (clean), `npx eslint src/components/ai/ai-assistant.tsx` (clean — the close-on-`open` effect deps are `[open, tts.cancel, stt.stop]`, both callbacks are stable so no exhaustive-deps warning), `npx vitest run` (115 still green). With the dev server up: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/` → `200` (the assistant mounts site-wide; 200 confirms it renders without throwing).

- [ ] **Step 3: Commit**

```bash
git add src/components/ai/ai-assistant.tsx
git commit -m "feat: voice mode wired into the AI Advisor"
```

---

### Task 7: Live E2E

**Files:**
- Create: `scripts/verify-voice-e2e.mjs`

- [ ] **Step 1: Write the script**

```js
// Live E2E for voice mode's STT route + assistant mount. The browser speech APIs are verified
// manually (Task 8, step 4); this checks the route's reject paths (no Groq call needed) and that
// the site still serves with the assistant mounted.
//   node scripts/verify-voice-e2e.mjs   (dev server must be up)
const BASE = "http://localhost:3000";

function step(label, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"} | ${label}${detail ? " | " + detail : ""}`);
  if (!ok) process.exitCode = 1;
}

// 1. POST with no audio field → 400
{
  const res = await fetch(BASE + "/api/ai/stt", { method: "POST", body: new FormData(), redirect: "manual" });
  step("POST /api/ai/stt with no audio → 400", res.status === 400, `status=${res.status}`);
}

// 2. GET (wrong method) → 405
{
  const res = await fetch(BASE + "/api/ai/stt", { method: "GET", redirect: "manual" });
  step("GET /api/ai/stt → 405", res.status === 405, `status=${res.status}`);
}

// 3. Home still serves (assistant mounts site-wide)
{
  const res = await fetch(BASE + "/", { redirect: "manual" });
  step("/ serves 200 with assistant mounted", res.status === 200, `status=${res.status}`);
}

console.log(process.exitCode ? "\nRESULT: FAIL" : "\nRESULT: ALL GREEN");
```

- [ ] **Step 2: Run it** (dev server up)

Run: `node scripts/verify-voice-e2e.mjs`
Expected: `RESULT: ALL GREEN` (3 PASS).

- [ ] **Step 3: Commit**

```bash
git add scripts/verify-voice-e2e.mjs
git commit -m "test: live E2E for voice STT route"
```

---

### Task 8: Reconcile PLAN.md + final verification

**Files:**
- Modify: `docs/PLAN.md`

- [ ] **Step 1: Update `docs/PLAN.md`**

Change item 16's heading from `### 16. Voice mode in the AI Advisor — ⏳` to `### 16. Voice mode in the AI Advisor — ✅ done (2026-06-13)` and update its bullet to reflect: mic wired to native `SpeechRecognition` + Groq Whisper fallback (`/api/ai/stt`), spoken replies via `speechSynthesis` with a mute toggle, auto-send on final transcript, works web + mobile. In "Build order (remaining)", change the line `5. ~~Real AI (5)~~ ✅ done … **Voice (16)** next. ◀ NEXT` so voice is struck done and the NEXT marker moves to `6. **i18n (15)** rollout. ◀ NEXT`. In "Completed so far", add `16` to the `- Items **…** done.` list, add a one-line summary bullet for voice before the "Build green" line, and bump the test count in that line to the new total (run `npx vitest run` first to get the exact number — expected ~118).

- [ ] **Step 2: Full verification**

Run: `npx vitest run` (all green — note the total) and `npx next build` (green; new route `/api/ai/stt` appears).

- [ ] **Step 3: Commit**

```bash
git add docs/PLAN.md
git commit -m "docs: mark voice mode (item 16) done"
```

- [ ] **Step 4: Tell Timi what to eyeball (manual — browser only)**

Open the site in **Chrome**, click the AI Advisor launcher → click the **mic** → allow mic access → speak ("get me an instant quote") → the message auto-sends and the reply is **spoken aloud**. The header **speaker icon** mutes/unmutes (and stops talking mid-sentence). In **Firefox** (no `SpeechRecognition`), the mic records → transcribes via Whisper (`/api/ai/stt`) → same flow. Where neither API exists, the mic button is hidden. Needs `GROQ_API_KEY` (already set) for the Whisper fallback.

---

## Notes for the executor
- Tasks 4–6 are browser code with no jsdom-testable surface; their correctness is covered by tsc/eslint + the manual eyeball. The pure logic is in Task 1.
- Don't add streaming TTS, wake-word, or multi-language — out of scope (English only).
- `transcribe()` calls real Groq Whisper; the route's reject paths (Task 7) don't hit Groq, so the E2E needs no key.
