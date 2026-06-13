/** Pure, safe JSON-object parse. Returns null on empty/invalid/non-object input. */
export function safeParseJSON<T>(text: string): T | null {
  if (!text || !text.trim()) return null;
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as T;
  } catch {
    return null;
  }
}
