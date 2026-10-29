import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

/**
 * Refreshes the auth token on every request and hands the new one to both the
 * Server Components (via request.cookies) and the browser (via response
 * cookies). Without this, tokens expire and users are signed out at random.
 *
 * Returns the response that `setAll` built last — an earlier response does not
 * carry the refreshed cookies.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // No key configured yet: the app is still running on mock data.
  if (!isSupabaseConfigured) return supabaseResponse;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, cacheHeaders) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        // A response that sets auth cookies must never be cached by a CDN, or
        // one user's token can be served to another.
        Object.entries(cacheHeaders).forEach(([key, value]) => supabaseResponse.headers.set(key, value));
      },
    },
  });

  // Verifies the token signature and refreshes it when needed.
  await supabase.auth.getClaims();

  return supabaseResponse;
}
