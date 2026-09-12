"use client";

import Link from "next/link";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import { XpBar } from "@/components/XpBar";
import { EmptyState, ErrorState, Skeleton } from "@/components/States";

/** Realm — identity/progression space (FE §12): hero, companion, level/rank, attrs, achievements, collection, Hero Card. */
export default function RealmPage() {
  const { authHeaders, userId } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, loading, retry } = useApi<any>(() => client.realm(authHeaders()), [userId]);

  if (loading) return <Skeleton label="Realm" />;
  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (!data) return <EmptyState message="Your realm is unformed. Complete a quest to begin." />;

  return (
    <div className="space-y-4">
      <header className="rounded-xl bg-surface-elevated p-4">
        <h1 className="font-display text-2xl">{data.hero?.name ?? data.hero?.displayName ?? "Unnamed Hero"}</h1>
        <p className="text-sm text-ink-secondary">
          Level {data.progression?.level ?? 1} · {data.rank?.display ?? ""}
        </p>
        <div className="mt-2">
          <XpBar pct={data.heroCard?.xpProgress?.pct ?? 0} label="Hero XP progress" />
        </div>
      </header>

      <section aria-label="Attributes" className="rounded-xl bg-surface-card p-4">
        <h2 className="mb-2 font-display">Attributes</h2>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(data.attributes ?? []).map((a: any) => (
          <div key={a.key} className="py-1">
            <div className="flex justify-between text-sm">
              <span className="capitalize">{a.name}</span>
              <span className="text-ink-secondary">Lv {a.level}</span>
            </div>
            <XpBar pct={Math.min(1, a.xp / 500)} label={`${a.name} progress`} />
          </div>
        ))}
      </section>

      <section aria-label="Achievements" className="rounded-xl bg-surface-card p-4">
        <h2 className="mb-2 font-display">Achievements ({data.achievements?.count ?? 0})</h2>
        {data.achievements?.count === 0 ? (
          <EmptyState message="Your first badge is one Quest away." />
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(data.achievements?.unlocked ?? []).map((a: any) => (
              <li key={a.key} className="rounded-lg bg-surface-elevated p-2 text-sm">
                <strong>{a.name}</strong>
                <p className="text-xs text-ink-secondary">{a.description}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href="/hero-card" className="block rounded-xl bg-xp p-4 text-center font-semibold text-surface-bg">
        View Hero Card →
      </Link>
    </div>
  );
}
