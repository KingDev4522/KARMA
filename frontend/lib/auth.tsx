"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "./supabase/client";

/**
 * Auth provider: Supabase session (cookie-backed via @supabase/ssr) → Bearer JWT.
 * Public API is unchanged, so no page rewrites were needed.
 * Dev bypass (NEXT_PUBLIC_DEV_BYPASS=true) sends X-Dev-User-Id instead — local only.
 */

interface AuthValue {
  token: string | null;
  userId: string | null;
  email: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  authHeaders: () => Record<string, string>;
}

const AuthCtx = createContext<AuthValue>({
  token: null,
  userId: null,
  email: null,
  loading: true,
  signOut: async () => undefined,
  authHeaders: () => ({}),
});

const devBypass = process.env.NEXT_PUBLIC_DEV_BYPASS === "true";
const devUserId = process.env.NEXT_PUBLIC_DEV_USER_ID ?? "";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (devBypass) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    if (devBypass) return;
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" }).catch(() => supabase.auth.signOut({ scope: "local" }));
    setSession(null);
  }, []);

  const value = useMemo<AuthValue>(() => {
    if (devBypass) {
      return {
        token: null,
        userId: devUserId || null,
        email: "dev@localhost",
        loading,
        signOut,
        authHeaders: () => ({ "X-Dev-User-Id": devUserId }),
      };
    }
    return {
      token: session?.access_token ?? null,
      userId: session?.user?.id ?? null,
      email: session?.user?.email ?? null,
      loading,
      signOut,
      authHeaders: () => {
        const h: Record<string, string> = {};
        if (session?.access_token) h.Authorization = `Bearer ${session.access_token}`;
        return h;
      },
    };
  }, [session, loading, signOut]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
