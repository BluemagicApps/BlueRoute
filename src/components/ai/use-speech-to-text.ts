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
  const [mode] = useState<SttMode>(() =>
    resolveSttMode({
      speechRecognition: !!getRecognitionCtor(),
      mediaRecorder:
        typeof window !== "undefined" && "MediaRecorder" in window && !!navigator.mediaDevices,
    }),
  );
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  });

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
