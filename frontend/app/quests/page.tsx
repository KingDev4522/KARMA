"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus } from "@phosphor-icons/react";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import type { CompletionResponse, Quest } from "@/lib/types";
import { QuestCard, QuestCreator } from "@/components/quest";
import { LevelUpOverlay } from "@/components/chronicle";
import { SectionHeading } from "@/components/ui";
import { EmptyState, ErrorState, SignInPrompt, Skeleton } from "@/components/States";

/** Quests — the work library, with mission-style creation. */
export default function QuestsPage() {
  const { authHeaders, userId, loading: authLoading } = useAuth();
  const { data, error, loading, retry } = useApi(() => client.listQuests(authHeaders()), [userId], {
    enabled: !authLoading && !!userId,
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, CompletionResponse>>({});
  const [ceremony, setCeremony] = useState<CompletionResponse | null>(null);
  const [creator, setCreator] = useState(false);

  if (authLoading || loading) return <Skeleton label="Quests" />;
  if (!userId) return <SignInPrompt />;
  if (error) return <ErrorState error={error} onRetry={retry} />;

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

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {ceremony && (
          <LevelUpOverlay level={ceremony.newLevel} rankDisplay={ceremony.newRankDisplay} coins={ceremony.rewardCoins} onDone={() => setCeremony(null)} />
        )}
      </AnimatePresence>
      <SectionHeading
        title="Quest library"
        action={
          <button onClick={() => setCreator(true)} className="inline-flex items-center gap-1.5 rounded-control bg-xp px-4 py-2 text-sm font-semibold text-white pressable">
            <Plus size={15} weight="bold" aria-hidden /> New quest
          </button>
        }
      />
      {!data || data.length === 0 ? (
        <EmptyState
          message="Your board is clear. Add your first Quest."
          action={
            <button onClick={() => setCreator(true)} className="rounded-control bg-xp px-4 py-2 text-sm font-semibold text-white">
              Accept a mission
            </button>
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {data.map((q) => (
            <QuestCard key={q.id} quest={q} onComplete={complete} completing={busyId === q.id} lastResult={results[q.id] ?? null} />
          ))}
        </div>
      )}
      <QuestCreator open={creator} onOpenChange={setCreator} onCreated={retry} authHeaders={authHeaders} />
    </div>
  );
}
