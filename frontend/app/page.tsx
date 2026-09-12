"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus } from "@phosphor-icons/react";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import type { CompletionResponse, Quest } from "@/lib/types";
import { QuestCard, QuestCreator } from "@/components/quest";
import { CompanionBubble, HeroFigure, HeroScene } from "@/components/world";
import { LevelUpOverlay } from "@/components/chronicle";
import { CoinPurse, LevelBadge, RankBadge, Streak, XpBar } from "@/components/rpg";
import { SectionHeading } from "@/components/ui";
import { EmptyState, ErrorState, Skeleton } from "@/components/States";

/**
 * Today — the RPG command center. First viewport answers: who you are,
 * your hero/companion/level/rank/XP/coins/streak, and what to do now.
 */
export default function TodayPage() {
  const { authHeaders, userId, loading: authLoading } = useAuth();
  const { data, error, loading, retry } = useApi(() => client.getToday(authHeaders()), [userId, authLoading]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, CompletionResponse>>({});
  const [ceremony, setCeremony] = useState<CompletionResponse | null>(null);
  const [creator, setCreator] = useState(false);

  if (authLoading || loading) return <Skeleton label="Today" rows={4} />;
  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (!userId) return <EmptyState message="Sign in (or enable dev bypass) to enter your realm." />;
  if (!data) return <EmptyState message="Your board is clear. Add your first Quest." />;

  const complete = async (q: Quest) => {
    setBusyId(q.id);
    try {
      const r = await client.completeQuest(authHeaders(), q.id, crypto.randomUUID());
      setResults((m) => ({ ...m, [q.id]: r }));
      if (r.leveledUp) setCeremony(r);
      retry();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Quest couldn't be completed. Your progress was not changed.");
    } finally {
      setBusyId(null);
    }
  };

  const g = data.greeting;
  const buckets: { key: string; title: string; quests: Quest[] }[] = [
    { key: "pinned", title: "Today's Quests", quests: data.buckets.pinned },
    { key: "due", title: "Due today", quests: data.buckets.dueToday },
    { key: "routine", title: "Routines", quests: data.buckets.routine },
    { key: "campaign", title: "Campaign steps", quests: data.buckets.campaign },
  ];

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {ceremony && (
          <LevelUpOverlay
            level={ceremony.newLevel}
            rankDisplay={ceremony.newRankDisplay}
            coins={ceremony.rewardCoins}
            onDone={() => setCeremony(null)}
          />
        )}
      </AnimatePresence>

      {/* Hero environment — character as first-class visual, time-of-day atmosphere */}
      <HeroScene timeOfDay={g.timeOfDay}>
        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-end md:justify-between md:p-7">
          <div className="flex items-end gap-4">
            <HeroFigure size={104} />
            <div className="pb-1">
              <p className="text-xs text-ink-secondary">Good {g.timeOfDay},</p>
              <h1 className="font-display text-3xl leading-tight">{g.heroName}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <RankBadge display={g.rank.display} />
                <Streak current={data.streak.current} best={data.streak.best} />
              </div>
            </div>
          </div>
          <div className="w-full max-w-xs space-y-2 rounded-card border border-line/60 bg-surface-elevated/80 p-3 backdrop-blur">
            <div className="flex items-center justify-between">
              <LevelBadge level={g.heroLevel} size="sm" />
              <CoinPurse coins={g.coins} />
            </div>
            <XpBar pct={g.xpProgress.pct} label="Hero XP toward next level" glow />
            <p className="text-right text-[11px] text-ink-muted">
              {g.xpProgress.intoLevel} / {g.xpProgress.neededForNext} XP
            </p>
          </div>
        </div>
      </HeroScene>

      <CompanionBubble mood={data.companion.mood} message={data.companion.message} />

      {/* Dominant Today experience */}
      <section aria-labelledby="today-heading">
        <SectionHeading
          title="Today's Quest"
          action={
            <button onClick={() => setCreator(true)} className="inline-flex items-center gap-1.5 rounded-control bg-xp px-4 py-2 text-sm font-semibold text-white pressable">
              <Plus size={15} weight="bold" aria-hidden /> New quest
            </button>
          }
        />
        <div id="today-heading" className="sr-only">Today&apos;s quests</div>
        {data.quests.length === 0 ? (
          <EmptyState
            message={data.emptyHints.allClear ?? "Your board is clear. Add your first Quest."}
            action={
              <button onClick={() => setCreator(true)} className="rounded-control bg-xp px-4 py-2 text-sm font-semibold text-white">
                Accept your first mission
              </button>
            }
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {data.quests.slice(0, 2).map((q) => (
              <QuestCard key={q.id} quest={q} onComplete={complete} completing={busyId === q.id} lastResult={results[q.id] ?? null} />
            ))}
          </div>
        )}
      </section>

      {/* Secondary rhythms */}
      {buckets.map((b) =>
        b.quests.length > 0 ? (
          <section key={b.key} aria-label={b.title}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">{b.title}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {(b.key === "pinned" ? b.quests.slice(2) : b.quests).map((q) => (
                <QuestCard key={q.id} quest={q} onComplete={complete} completing={busyId === q.id} lastResult={results[q.id] ?? null} />
              ))}
            </div>
          </section>
        ) : null,
      )}

      {data.spark && (
        <section aria-label="Suggestion">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">A small spark</h2>
          <QuestCard quest={data.spark} onComplete={complete} completing={busyId === data.spark.id} lastResult={results[data.spark.id] ?? null} />
        </section>
      )}

      {data.campaignSummary && (
        <section aria-label="Active campaign" className="rounded-card border border-line bg-surface-card p-4 shadow-card">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg">{data.campaignSummary.title}</h2>
            <span className="text-sm font-semibold text-xp">{data.campaignSummary.progressPct}%</span>
          </div>
          <div className="mt-2">
            <XpBar pct={data.campaignSummary.progressPct / 100} label="Campaign progress" />
          </div>
        </section>
      )}

      <section aria-label="Attributes" className="rounded-card border border-line bg-surface-card p-4 shadow-card">
        <h2 className="mb-3 font-display text-lg">Attributes</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.attributeSnapshot.map((a) => (
            <div key={a.key} className="flex items-center justify-between gap-2 text-sm">
              <span className="capitalize text-ink-secondary">{a.name}</span>
              <span className="font-semibold">Lv {a.level}</span>
            </div>
          ))}
        </div>
      </section>

      <QuestCreator open={creator} onOpenChange={setCreator} onCreated={retry} authHeaders={authHeaders} />
    </div>
  );
}
