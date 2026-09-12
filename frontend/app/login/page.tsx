"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { Hero, Icon } from "@/components/illustrations";
import { ThemeToggle } from "@/components/ThemeToggle";
import { EmptyState, Skeleton } from "@/components/States";

const ERROR_COPY: Record<string, string> = {
  denied: "Google sign-in was cancelled. Nothing changed — try again whenever you're ready.",
  oauth: "The sign-in handshake failed (expired or reused link). Please try again.",
  session: "No session found. Please sign in.",
};

/** Login — Google OAuth entry. No passwords ever touch this app. */
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start Google sign-in.");
      setBusy(false);
    }
  };

  if (loading) return <Skeleton label="Sign in" rows={2} />;
  if (!loading && userId) {
    window.location.replace("/");
    return null;
  }

  return (
    <div className="page is-active">
      <div className="auth-wrap">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <ThemeToggle />
        </div>
        <div className="auth-card panel">
          <span className="brand-mark" style={{ margin: "0 auto" }}>
            <Icon id="i-spark" />
          </span>
          <h1>Enter the realm</h1>
          <p>One account across every device. Your quests, XP and identity persist.</p>
          <div style={{ display: "flex", justifyContent: "center", margin: "14px 0 4px" }}>
            <Hero width={110} />
          </div>

          {error && (
            <p role="alert" style={{ marginTop: 12, fontSize: 13.5, color: "var(--accent-text)" }}>
              {error}
            </p>
          )}

          {!isSupabaseConfigured() && !devBypass ? (
            <div style={{ marginTop: 16 }}>
              <EmptyState message="Sign-in isn't configured yet — add your Supabase URL and anon key to .env.local, allow-list the callback URL in Supabase, and reload." />
            </div>
          ) : (
            <button onClick={signInWithGoogle} disabled={busy} className="btn btn--primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>
              {busy ? "Opening Google…" : "Sign in with Google"}
            </button>
          )}

          {devBypass && <p style={{ marginTop: 12, fontSize: 12, color: "var(--text-3)" }}>Local preview mode is on — you&apos;re already signed in as the dev hero.</p>}
          <p style={{ marginTop: 10, fontSize: 11, color: "var(--text-3)" }}>Google handles the password. This app never sees it.</p>
        </div>
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
