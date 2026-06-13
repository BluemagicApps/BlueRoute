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
