import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes Supabase sessions on every route (cookie-based auth).
 *
 * Performance: we use `getSession()` which is a LOCAL cookie read — no
 * network — whenever the access token is still fresh. Only when the
 * session is missing entirely do we fall back to `getUser()` (a server
 * validation + mint). `getSession()` also transparently auto-refreshes
 * an expired token (writing fresh cookies back) via @supabase/ssr.
 *
 * Result: sidebar navigation no longer pays a Supabase round-trip for a
 * fresh session, but an expired/missing session is still recovered.
 *
 * Does not redirect — pages decide signed-in vs signed-out UI themselves.
 */
export async function middleware(request: NextRequest) {
  // Dev-bypass / unconfigured mode: no Supabase to refresh against — pass through.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    },
  );

  // Local cookie read — cheap and usually no network when the token is fresh.
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    // No session at all — getUser() validates/mints, refreshing the cookie.
    await supabase.auth.getUser();
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
