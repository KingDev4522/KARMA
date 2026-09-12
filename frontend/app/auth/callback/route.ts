import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth callback: exchanges the PKCE code for a session (cookie).
 * Success → welcome gate (decides onboarding vs Today).
 * Denied/expired/invalid → login with a recoverable error.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/auth/welcome";
  const denied = searchParams.get("error");

  if (denied) {
    return NextResponse.redirect(`${origin}/login?error=denied`);
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch {
      // Unconfigured Supabase or exchange failure — fall through to login error.
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
