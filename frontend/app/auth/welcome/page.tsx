"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/States";

/**
 * Post-login gate: a Supabase user with no hero name is new → onboarding,
 * otherwise straight to Today. (Backend auto-bootstraps an empty game profile,
 * so heroName is the deterministic new/returning signal.)
 */
export default function WelcomePage() {
  const router = useRouter();
  const { authHeaders, userId, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!userId) {
      router.replace("/login?error=session");
      return;
    }
    let alive = true;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (!alive) return;
        if (!data.user) {
          router.replace("/login?error=session");
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const me = (await client.getProfile(authHeaders())) as any;
        if (!alive) return;
        router.replace(me?.profile?.heroName ? "/" : "/onboarding");
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Couldn't reach your realm.");
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, userId]);

  if (error) {
    return (
      <div role="alert" className="mx-auto max-w-sm rounded-card border border-danger/40 bg-surface-card p-6 text-center">
        <p className="font-display text-lg">The gate wouldn&apos;t open.</p>
        <p className="mt-1 text-sm text-ink-secondary">{error} Your progress was not changed.</p>
        <button onClick={() => window.location.reload()} className="mt-4 rounded-control bg-xp px-4 py-2 text-sm font-semibold text-white">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm">
      <Skeleton label="your realm" rows={2} />
      <p className="mt-3 text-center text-sm text-ink-muted">Crossing into your realm…</p>
    </div>
  );
}
