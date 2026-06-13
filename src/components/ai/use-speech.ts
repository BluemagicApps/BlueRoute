"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type UseSpeech = {
  supported: boolean;
  speaking: boolean;
  speak: (text: string) => void;
  cancel: () => void;
};

export function useSpeech(): UseSpeech {
  const [supported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);
  const [speaking, setSpeaking] = useState(false);

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
