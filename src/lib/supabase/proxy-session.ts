import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

/**
 * Refreshes the Supabase session cookie for a proxied request and reports the
 * (possibly null) user so the proxy can do optimistic redirects.
 *
 * IMPORTANT: the returned response carries the refreshed cookies — the proxy
 * must return it (or copy its cookies) or users will be randomly logged out.
 */
export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; user: User | null }> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() validates the JWT against Supabase and triggers the cookie
  // refresh above when the token is stale. Do not replace with getSession().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
