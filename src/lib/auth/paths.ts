/** Route prefixes that require a signed-in Supabase user. */
export const PROTECTED_PREFIXES = ["/portal"] as const;

/** True when the pathname is (or is nested under) a protected prefix. */
export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
