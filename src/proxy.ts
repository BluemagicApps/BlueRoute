import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy-session";
import { isProtectedPath, isAdminPath } from "@/lib/auth/paths";

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

  return response;
}

export const config = {
  // Inline literal on purpose: Next statically analyzes the matcher and
  // ignores imported variables. Skips static assets and image files.
  matcher: [
    "/((?!_next/static|_next/image|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
