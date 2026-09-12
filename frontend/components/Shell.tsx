"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { client } from "@/lib/api";
import { Nav } from "@/components/Nav";

/**
 * App shell with a hard auth gate.
 *
 * Signed out → the ONLY thing that exists is the dedicated login screen.
 * No nav, no pages, no content — blank until the session resolves, then
 * /login for strangers. Auth callback/welcome stay public (they mint the session).
 * Signed in → full shell: nav, identity, command palette, everything.
 */
const PUBLIC_PATHS = ["/login", "/auth/callback", "/auth/welcome"];

function isPublic(path: string) {
  return PUBLIC_PATHS.some((p) => path === p);
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { authHeaders, userId, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [identity, setIdentity] = useState<{ heroName?: string; level?: number; coins?: number }>({});

  const signedOut = !authLoading && !userId;

  useEffect(() => {
    if (signedOut && !isPublic(pathname)) {
      router.replace("/login");
    }
  }, [signedOut, pathname, router]);

  useEffect(() => {
    if (!userId) return;
    client
      .getToday(authHeaders())
      .then((t) => setIdentity({ heroName: t.greeting.heroName, level: t.greeting.heroLevel, coins: t.greeting.coins }))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Blank while resolving, blank gate while redirecting — nothing leaks.
  if (authLoading) return null;
  if (signedOut) {
    if (!isPublic(pathname)) return null;
    return (
      <main id="main" className="mx-auto min-h-dvh w-full max-w-shell px-4 pb-10 pt-10 md:pt-16">
        {children}
      </main>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-shell md:gap-5">
      <Nav heroName={identity.heroName} level={identity.level} coins={identity.coins} />
      <main id="main" className="min-w-0 flex-1 px-4 pb-24 pt-4 md:px-2 md:pb-10 md:pt-6">
        {children}
      </main>
    </div>
  );
}
