"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GoogleLogo } from "@phosphor-icons/react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { EmptyState } from "@/components/States";

const ERROR_COPY: Record<string, string> = {
  denied: "Google sign-in was cancelled. Nothing changed — try again whenever you're ready.",
  oauth: "The sign-in handshake failed (expired or reused link). Please try again.",
  session: "No session found. Please sign in.",
};

/** Login — professional OAuth entry. Google only; no passwords ever touch this app. */
function LoginInner() {
  const params = useSearchParams();
  const { userId, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(ERROR_COPY[params.get("error") ?? ""] ?? null);
  const devBypass = process.env.NEXT_PUBLIC_DEV_BYPASS === "true";

  const signInWithGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/auth/welcome` },
      });
      if (error) throw error;
      // Browser navigates to Google; nothing more to do here.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start Google sign-in.");
      setBusy(false);
    }
  };

  if (!loading && userId) {
    window.location.replace("/");
    return null;
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="pattern-asanoha overflow-hidden rounded-panel border border-line bg-surface-elevated p-6 text-center shadow-card md:p-8">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-[10px] bg-seal font-display text-lg font-bold text-white" aria-hidden>
          命
        </span>
        <h1 className="mt-3 font-display text-2xl">Enter the realm</h1>
        <p className="mx-auto mt-1 max-w-[36ch] text-sm text-ink-secondary">
          One account across every device. Your quests, XP and identity persist.
        </p>

        {error && (
          <p role="alert" className="mt-4 rounded-card border border-danger/40 bg-surface-card p-3 text-sm text-danger">
            {error}
          </p>
        )}

        {!isSupabaseConfigured() && !devBypass ? (
          <div className="mt-4">
            <EmptyState message="Sign-in isn't configured yet — add your Supabase URL and anon key to .env.local, allow-list the callback URL in Supabase, and reload." />
          </div>
        ) : (
          <button
            onClick={signInWithGoogle}
            disabled={busy}
            className="mt-5 inline-flex w-full items-center justify-center gap-2.5 rounded-control border border-line bg-surface-card px-4 py-3 text-sm font-semibold shadow-card pressable hover:border-xp/50 disabled:opacity-60"
          >
            <GoogleLogo size={19} weight="bold" aria-hidden />
            {busy ? "Opening Google…" : "Sign in with Google"}
          </button>
        )}

        {devBypass && (
          <p className="mt-3 text-xs text-ink-muted">Local preview mode is on — you&apos;re already signed in as the dev hero.</p>
        )}
        <p className="mt-3 text-[11px] text-ink-muted">Google handles the password. This app never sees it.</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
