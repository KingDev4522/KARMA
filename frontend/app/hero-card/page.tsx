"use client";

import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import { XpBar } from "@/components/XpBar";
import { EmptyState, ErrorState, Skeleton } from "@/components/States";

/** Hero Card — preview before export (FE §14). Identity, level/rank, top attrs, streak, title, badges, campaigns. */
export default function HeroCardPage() {
  const { authHeaders, userId } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, loading, retry } = useApi<any>(() => client.heroCard(authHeaders()), [userId]);

  if (loading) return <Skeleton label="Hero Card" />;
  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (!data) return <EmptyState message="No hero yet." />;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="font-display text-2xl">Hero Card</h1>
      <article aria-label="Hero card preview" className="rounded-2xl border border-xp/40 bg-surface-elevated p-6 text-center shadow-glow">
        <p className="font-display text-xl tracking-wide">{data.heroName}</p>
        <p className="text-sm text-ink-secondary">Level {data.level} · {data.rank?.display}</p>
        <div className="mx-auto my-3 flex h-24 w-24 items-center justify-center rounded-full bg-surface-card text-3xl" aria-hidden>
          ✦
        </div>
        <div className="grid grid-cols-2 gap-1 text-sm">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(data.topAttributes ?? []).map((a: any) => (
            <p key={a.key} className="capitalize">{a.name} {a.level}</p>
          ))}
        </div>
        <p className="mt-2 text-sm">🔥 {data.streak}-day streak</p>
        {data.title && <p className="text-sm text-coin">“{data.title.name}”</p>}
        <div className="mt-2">
          <XpBar pct={data.xpProgress?.pct ?? 0} label="Hero XP progress" />
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(data.campaigns ?? []).map((c: any) => (
          <p key={c.id} className="mt-1 text-xs text-ink-secondary">{c.title}: {c.progressPct}%</p>
        ))}
      </article>
      <button onClick={() => window.print()} className="w-full rounded-xl bg-xp p-3 font-semibold text-surface-bg">
        Export / Print
      </button>
    </div>
  );
}
