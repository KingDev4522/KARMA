"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { client } from "@/lib/api";
import { Nav } from "@/components/Nav";

/** App shell: identity-aware nav + content column. */
export function Shell({ children }: { children: React.ReactNode }) {
  const { authHeaders, userId } = useAuth();
  const [identity, setIdentity] = useState<{ heroName?: string; level?: number; coins?: number }>({});

  useEffect(() => {
    if (!userId) return;
    client
      .getToday(authHeaders())
      .then((t) => setIdentity({ heroName: t.greeting.heroName, level: t.greeting.heroLevel, coins: t.greeting.coins }))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-shell md:gap-5">
      <Nav heroName={identity.heroName} level={identity.level} coins={identity.coins} />
      <main id="main" className="min-w-0 flex-1 px-4 pb-24 pt-4 md:px-2 md:pb-10 md:pt-6">
        {children}
      </main>
    </div>
  );
}
