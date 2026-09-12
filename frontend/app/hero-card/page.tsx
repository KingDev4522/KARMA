"use client";

import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import { HeroCardView } from "@/components/world";
import { SectionHeading } from "@/components/ui";
import { EmptyState, ErrorState, SignInPrompt, Skeleton } from "@/components/States";

/** Hero Card — collectible identity composition, export-ready. */
export default function HeroCardPage() {
  const { authHeaders, userId, loading: authLoading } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, loading, retry } = useApi<any>(() => client.heroCard(authHeaders()), [userId], {
    enabled: !authLoading && !!userId,
  });

  if (authLoading || loading) return <Skeleton label="Hero Card" />;
  if (!userId) return <SignInPrompt />;
  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (!data) return <EmptyState message="No hero yet." />;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <SectionHeading title="Hero Card" />
      <HeroCardView card={data} />
      <button onClick={() => window.print()} className="w-full rounded-card bg-xp p-3 font-semibold text-white pressable">
        Export / Print
      </button>
      <p className="text-center text-xs text-ink-muted">Sharing is explicit — nothing leaves your realm unless you send it.</p>
    </div>
  );
}
