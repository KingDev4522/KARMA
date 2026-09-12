"use client";

import { useState } from "react";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import type { CompletionResponse, Quest } from "@/lib/types";
import { QuestCard } from "@/components/QuestCard";
import { EmptyState, ErrorState, Skeleton } from "@/components/States";

/** Quests — the work library. Task-first creation (FE §7) with mapping + preview. */
const TYPES = ["quick", "focus", "routine", "campaign", "challenge", "recovery"];

export default function QuestsPage() {
  const { authHeaders, userId } = useAuth();
  const { data, error, loading, retry } = useApi(() => client.listQuests(authHeaders()), [userId]);
  const [title, setTitle] = useState("");
  const [questType, setQuestType] = useState("quick");
  const [activityKey, setActivityKey] = useState("study_learning");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, CompletionResponse>>({});
  const [formError, setFormError] = useState<string | null>(null);

  if (loading) return <Skeleton label="Quests" />;
  if (error) return <ErrorState error={error} onRetry={retry} />;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) {
      setFormError("Give your quest a name.");
      return;
    }
    try {
      // Task-first: suggest mapping → preview → create (FE §7).
      const mapping = await client.suggestMapping(authHeaders(), activityKey).catch(() => null);
      await client.previewQuest(authHeaders(), { difficulty: 3, questType, activityKey }).catch(() => null);
      await client.createQuest(authHeaders(), {
        title: title.trim(),
        questType,
        activityKey,
        difficulty: 3,
        primaryOverride: mapping?.source === "suggested" ? undefined : undefined,
      });
      setTitle("");
      retry();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't create quest.");
    }
  };

  const complete = async (q: Quest) => {
    setBusyId(q.id);
    try {
      const r = await client.completeQuest(authHeaders(), q.id, crypto.randomUUID());
      setResults((m) => ({ ...m, [q.id]: r }));
      retry();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Quest couldn't be completed. Your progress was not changed.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl">Quests</h1>
      <form onSubmit={create} className="space-y-2 rounded-xl bg-surface-elevated p-4" aria-label="Create quest">
        <label className="block text-sm">
          What are you doing?
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Study DSA for 45 minutes"
            className="mt-1 w-full rounded-lg bg-surface-card px-3 py-2 text-ink-primary"
          />
        </label>
        <div className="flex gap-2">
          <label className="text-sm">
            How large?
            <select value={questType} onChange={(e) => setQuestType(e.target.value)} className="ml-2 rounded-lg bg-surface-card px-2 py-1.5">
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Activity
            <input value={activityKey} onChange={(e) => setActivityKey(e.target.value)} className="ml-2 w-40 rounded-lg bg-surface-card px-2 py-1.5" />
          </label>
        </div>
        {formError && <p role="alert" className="text-sm text-danger">{formError}</p>}
        <button type="submit" className="rounded-lg bg-xp px-4 py-2 text-sm font-semibold text-surface-bg">Create Quest</button>
      </form>

      {!data || data.length === 0 ? (
        <EmptyState message="Your board is clear. Add your first Quest." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.map((q) => (
            <QuestCard key={q.id} quest={q} onComplete={complete} completing={busyId === q.id} lastResult={results[q.id] ?? null} />
          ))}
        </div>
      )}
    </div>
  );
}
