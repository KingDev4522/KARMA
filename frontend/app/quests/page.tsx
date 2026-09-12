"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { useFocus } from "@/components/focus";
import type { CompletionResponse, Quest } from "@/lib/types";
import { LevelUpModal, QuestCreator, QuestRow, burstAt, questActivity } from "@/components/quests";
import { Icon } from "@/components/illustrations";
import { ErrorState, SignInPrompt, Skeleton } from "@/components/States";

/** Quests — filterable mission list + 5-step creator, all server-backed. */
function QuestsInner() {
  const { authHeaders, userId, loading: authLoading } = useAuth();
  const toast = useToast();
  const { focusSeq } = useFocus();
  const params = useSearchParams();
  const [status, setStatus] = useState("all");
  const [activity, setActivity] = useState("All");
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [creator, setCreator] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, CompletionResponse>>({});
  const [ceremony, setCeremony] = useState<CompletionResponse | null>(null);

  const qs = status === "done" ? "status=completed&preview=true&limit=50" : "status=active,in_progress,draft&preview=true&limit=50";
  const { data, error, loading, retry } = useApi(() => client.listQuests(authHeaders(), qs), [userId, status, focusSeq], {
    enabled: !authLoading && !!userId,
  });
  const { data: activities } = useApi(() => client.activityTypes(authHeaders()).catch(() => [] as { key: string; name: string }[]), [userId], {
    enabled: !authLoading && !!userId,
  });

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter(
      (t) =>
        (activity === "All" || questActivity(t) === activity) &&
        (!q || t.title.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q)),
    );
  }, [data, activity, query]);

  if (authLoading || loading) return <Skeleton label="Quests" rows={4} />;
  if (!userId) return <SignInPrompt />;
  if (error) return <ErrorState error={error} onRetry={retry} />;

  const complete = async (t: Quest, el: HTMLElement | null) => {
    if (busyId) return;
    setBusyId(t.id);
    try {
      const r = await client.completeQuest(authHeaders(), t.id, crypto.randomUUID());
      setResults((m) => ({ ...m, [t.id]: r }));
      burstAt(el);
      toast(`“${t.title.length > 32 ? `${t.title.slice(0, 32)}…` : t.title}” complete · +${r.rewardXp} XP`, "i-check");
      if (r.leveledUp) setCeremony(r);
      retry();
      window.dispatchEvent(new CustomEvent("liferpg:refresh"));
    } catch (e) {
      toast(e instanceof Error ? e.message : "Quest couldn't be completed. Your progress was not changed.", "i-close");
    } finally {
      setBusyId(null);
    }
  };

  const chips = ["All", ...(activities ?? []).map((a) => a.name)];

  return (
    <div className="page is-active">
      {ceremony && (
        <LevelUpModal
          level={ceremony.newLevel}
          message={`${ceremony.companion.message} A new rank: ${ceremony.newRankDisplay}.`}
          onClose={() => setCeremony(null)}
        />
      )}
      <div className="page-head">
        <div>
          <h2>Quests</h2>
          <p className="sub">Missions you&apos;ve accepted from yourself. Complete them to grow.</p>
        </div>
        <button className="btn btn--primary" onClick={() => setCreator(true)}>
          <Icon id="i-plus" style={{ width: 16, height: 16 }} />
          Create Quest
        </button>
      </div>

      <div className="filter-bar panel">
        <div className="f-search">
          <Icon id="i-search" style={{ width: 16, height: 16 }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter quests…" aria-label="Filter quests" />
        </div>
        <div className="seg" role="tablist" aria-label="Status filter">
          {["all", "active", "done"].map((s) => (
            <button key={s} role="tab" aria-selected={status === s} className={status === s ? "is-on" : ""} onClick={() => setStatus(s)}>
              {s === "all" ? "All" : s === "active" ? "Active" : "Completed"}
            </button>
          ))}
        </div>
        <div className="chip-row">
          {chips.map((a) => (
            <button key={a} className={`chip${activity === a ? " is-on" : ""}`} onClick={() => setActivity(a)} aria-pressed={activity === a}>
              {a}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="empty-state panel">
          <Icon id="i-quests" />
          <p>No quests match. The Realm is quiet… for now.</p>
        </div>
      ) : (
        <div className="quest-list panel">
          {list.map((t, i) => (
            <QuestRow key={t.id} quest={t} index={i} onComplete={complete} lastResult={results[t.id] ?? null} />
          ))}
        </div>
      )}

      <QuestCreator open={creator} onClose={() => setCreator(false)} onCreated={() => { retry(); window.dispatchEvent(new CustomEvent("liferpg:refresh")); }} />
    </div>
  );
}

export default function QuestsPage() {
  return (
    <Suspense>
      <QuestsInner />
    </Suspense>
  );
}
