"use client";

import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import { EmptyState, ErrorState, Skeleton } from "@/components/States";

/** Chronicle — history log + analytics answering “Am I becoming more consistent?” */
export default function ChroniclePage() {
  const { authHeaders, userId } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: history, error: hErr, loading: hLoad, retry: hRetry } = useApi<any>(() => client.history(authHeaders()), [userId]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: analytics } = useApi<any>(() => client.analytics(authHeaders()), [userId]);

  if (hLoad) return <Skeleton label="Chronicle" />;
  if (hErr) return <ErrorState error={hErr} onRetry={hRetry} />;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl">Chronicle</h1>
      {analytics && (
        <section aria-label="Analytics" className="grid gap-2 rounded-xl bg-surface-elevated p-4 text-sm md:grid-cols-3">
          <p>Today: <strong>{analytics.today?.count ?? 0}</strong> quests · +{analytics.today?.xp ?? 0} XP</p>
          <p>Week: <strong>{analytics.week?.activeDays ?? 0}</strong> active days</p>
          <p>Streak: <strong>{analytics.streak?.current ?? 0}</strong> (best {analytics.streak?.best ?? 0})</p>
        </section>
      )}
      <section aria-label="History">
        {!history || history.completions?.length === 0 ? (
          <EmptyState message="No history yet — your story starts with the first quest." />
        ) : (
          <ol className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {history.completions.map((c: any) => (
              <li key={c.id} className="rounded-xl bg-surface-card p-3 text-sm">
                <strong>{c.quest?.title ?? "Quest"}</strong>
                <span className="ml-2 text-coin">+{c.rewardXp} XP · +{c.rewardCoins} coins</span>
                <span className="ml-2 text-xs text-ink-muted">{new Date(c.completedAt).toLocaleString()}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
