"use client";

import { useState } from "react";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import type { CompletionResponse, Quest } from "@/lib/types";
import { QuestCard } from "@/components/QuestCard";
import { XpBar } from "@/components/XpBar";
import { Companion } from "@/components/Companion";
import { EmptyState, ErrorState, Skeleton } from "@/components/States";

/** Today — the command center (LRP-FE-001 §4–§5). One backend call, answers in seconds. */
export default function TodayPage() {
  const { authHeaders, userId, loading: authLoading } = useAuth();
  const { data, error, loading, retry } = useApi(() => client.getToday(authHeaders()), [userId, authLoading]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, CompletionResponse>>({});

  if (authLoading || loading) return <Skeleton label="Today" />;
  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (!data) return <EmptyState message="Your board is clear. Add your first Quest." />;
  if (!userId) return <EmptyState message="Sign in (or enable dev bypass) to see your quests." />;

  const complete = async (q: Quest) => {
    setBusyId(q.id);
    try {
      const r = await client.completeQuest(authHeaders(), q.id, crypto.randomUUID());
      setResults((m) => ({ ...m, [q.id]: r }));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Quest couldn't be completed. Your progress was not changed.");
    } finally {
      setBusyId(null);
    }
  };

  const g = data.greeting;
  return (
    <div className="space-y-4">
      <header className="rounded-xl bg-surface-elevated p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-muted">Good {g.timeOfDay}, {g.heroName}</p>
            <h1 className="font-display text-2xl">
              Level {g.heroLevel} <span className="text-sm text-ink-secondary">· {g.rank.display}</span>
            </h1>
          </div>
          <p className="text-lg text-coin" aria-label={`${g.coins} coins`}>◉ {g.coins}</p>
        </div>
        <div className="mt-2">
          <XpBar pct={g.xpProgress.pct} label="Hero XP progress" />
        </div>
      </header>

      <Companion mood={data.companion.mood} message={data.companion.message} />

      <section aria-labelledby="today-quests">
        <h2 id="today-quests" className="mb-2 font-display text-lg">Today&apos;s Quest</h2>
        {data.quests.length === 0 ? (
          <EmptyState message={data.emptyHints.allClear ?? "Your board is clear. Add your first Quest."} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.quests.map((q) => (
              <QuestCard key={q.id} quest={q} onComplete={complete} completing={busyId === q.id} lastResult={results[q.id] ?? null} />
            ))}
          </div>
        )}
      </section>

      {data.campaignSummary && (
        <section aria-label="Active campaign" className="rounded-xl bg-surface-card p-4">
          <h2 className="font-display">{data.campaignSummary.title}</h2>
          <p className="text-sm text-ink-secondary">{data.campaignSummary.progressPct}% complete</p>
          <XpBar pct={data.campaignSummary.progressPct / 100} label="Campaign progress" />
        </section>
      )}

      <section aria-label="Attribute snapshot" className="rounded-xl bg-surface-card p-4">
        <h2 className="mb-2 font-display">Attributes</h2>
        {data.attributeSnapshot.map((a) => (
          <div key={a.key} className="flex items-center justify-between py-1 text-sm">
            <span className="capitalize text-ink-secondary">{a.name}</span>
            <span className="text-ink-primary">Lv {a.level} · {a.xp} XP</span>
          </div>
        ))}
      </section>

      <section aria-label="Streak" className="rounded-xl bg-surface-card p-4 text-sm">
        <p>🔥 Streak: <strong>{data.streak.current} days</strong> (best {data.streak.best}) · Momentum {data.streak.momentum}</p>
        {data.recentReward && (
          <p className="mt-1 text-ink-secondary">Recent: +{data.recentReward.xp} XP · +{data.recentReward.coins} coins</p>
        )}
      </section>
    </div>
  );
}
