import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy-session";
import { isProtectedPath, isAdminPath } from "@/lib/auth/paths";
import { pickLocaleFromHeaders, countryToLocale } from "@/lib/i18n/detect";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

async function detectLocale(request: NextRequest): Promise<string> {
  // Prod: Vercel injects geo headers. Fall back to Accept-Language.
  const fromHeaders = pickLocaleFromHeaders({
    country: request.headers.get("x-vercel-ip-country"),
    acceptLanguage: request.headers.get("accept-language"),
  });
  if (fromHeaders) return fromHeaders;

  // Dev only: best-effort public-IP lookup (localhost has no geo header).
  if (process.env.NODE_ENV !== "production") {
    try {
      const res = await fetch("https://ipapi.co/json/", {
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) {
        const data = (await res.json()) as { country_code?: string };
        const loc = countryToLocale(data.country_code);
        if (loc) return loc;
      }
    } catch {
      // ignore — fall through to default
    }
  }
  return DEFAULT_LOCALE;
}

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);

  // Optimistic redirects only — the /portal and /admin server components are
  // the authoritative gates (they call getUser()/requireAdmin() themselves).
  if (!user && isAdminPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!user && isProtectedPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // First-visit language auto-detect — set once, never re-run.
  if (!request.cookies.has("NEXT_LOCALE")) {
    const locale = await detectLocale(request);
    response.cookies.set("NEXT_LOCALE", locale, {
      maxAge: LOCALE_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  // Inline literal on purpose: Next statically analyzes the matcher and
  // ignores imported variables. Skips static assets and image files.
  matcher: [
    "/((?!_next/static|_next/image|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
