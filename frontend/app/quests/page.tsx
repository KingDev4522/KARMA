"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { useFocus } from "@/components/focus";
import type { CompletionResponse, Quest } from "@/lib/types";
import { LevelUpModal, QuestCreator, QuestRow, announceAchievements, burstAt, questActivity } from "@/components/quests";
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
  const [creator, setCreator] = useState(() => params.get("create") === "1");
  const creatorLink = useMemo(
    () => ({
      campaignId: params.get("campaignId"),
      milestoneId: params.get("milestoneId"),
      campaignTitle: params.get("campaignTitle"),
      milestoneTitle: params.get("milestoneTitle"),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [creator],
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, CompletionResponse>>({});
  const [ceremony, setCeremony] = useState<CompletionResponse | null>(null);

  const qs =
    status === "done"
      ? "status=completed&preview=true&limit=50"
      : status === "active"
        ? "status=active,in_progress,draft&preview=true&limit=50"
        : "status=active,in_progress,draft,completed,skipped,archived&preview=true&limit=100";
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
      void import("@/lib/sound").then((s) => s.playCoin()).catch(() => undefined);
      toast(`“${t.title.length > 32 ? `${t.title.slice(0, 32)}…` : t.title}” complete · +${r.rewardXp} XP`, "i-check");
      announceAchievements(r, toast);
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
            rankUp={ceremony.rankUp}
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
        <>
          {list.some((t) => t.questType === "routine") && (
            <section aria-label="Routines">
              <div className="sec-head">
                <h3>Rhythms</h3>
              </div>
              <div className="quest-list panel">
                {list
                  .filter((t) => t.questType === "routine")
                  .map((t, i) => (
                    <RoutineRow
                      key={t.id}
                      quest={t}
                      index={i}
                      onReward={(q, r) => {
                        setResults((m) => ({ ...m, [q.id]: r }));
                        if (r.leveledUp) setCeremony(r);
                      }}
                      onChanged={() => { retry(); window.dispatchEvent(new CustomEvent("liferpg:refresh")); }}
                    />
                  ))}
              </div>
            </section>
          )}
          <div className="quest-list panel">
            {list
              .filter((t) => t.questType !== "routine")
              .map((t, i) => (
                <QuestRow key={t.id} quest={t} index={i} onComplete={complete} lastResult={results[t.id] ?? null} onChanged={() => { retry(); window.dispatchEvent(new CustomEvent("liferpg:refresh")); }} />
              ))}
          </div>
        </>
      )}

      <QuestCreator open={creator} onClose={() => setCreator(false)} onCreated={() => { retry(); window.dispatchEvent(new CustomEvent("liferpg:refresh")); }} link={creatorLink.campaignId || creatorLink.milestoneId ? creatorLink : null} />
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

const DOW_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

/** A routine as a living rhythm: rule chips + completable upcoming instances. */
function RoutineRow({ quest, index, onReward, onChanged }: { quest: Quest; index: number; onReward: (t: Quest, r: CompletionResponse) => void; onChanged: () => void }) {
  const { authHeaders } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busyIns, setBusyIns] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: instances, retry: retryIns } = useApi<any>(() => client.listInstances(authHeaders(), quest.id), [quest.id, open], {
    enabled: open,
  });
  const rule = quest.recurrenceRule;
  const days = rule?.freq === "daily" ? [0, 1, 2, 3, 4, 5, 6] : (rule?.days ?? []);
  const todayKey = new Date().toISOString().slice(0, 10);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insList = ((instances ?? []) as any[]).slice().sort((a, b) => String(a.occurrenceDate).localeCompare(String(b.occurrenceDate)));
  const todayIns = insList.find((i) => String(i.occurrenceDate).slice(0, 10) <= todayKey && i.status !== "completed");

  const logInstance = async (ins: { id: string; occurrenceDate: string }) => {
    if (busyIns) return;
    setBusyIns(ins.id);
    try {
      const r = await client.completeQuest(authHeaders(), quest.id, crypto.randomUUID(), { instanceId: ins.id });
      burstAt(document.querySelector(`[data-ins="${ins.id}"]`));
      void import("@/lib/sound").then((s) => s.playCoin()).catch(() => undefined);
      toast(`“${quest.title}” logged · +${r.rewardXp} XP`, "i-check");
      announceAchievements(r, toast);
      onReward(quest, r);
      retryIns();
      onChanged();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't log this occurrence. Nothing was changed.", "i-close");
    } finally {
      setBusyIns(null);
    }
  };

  const generate = async () => {
    if (busyIns) return;
    setBusyIns("gen");
    try {
      const end = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      await client.genInstances(authHeaders(), quest.id, todayKey, end);
      toast("Occurrences generated for the next 30 days", "i-check");
      retryIns();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't generate occurrences.", "i-close");
    } finally {
      setBusyIns(null);
    }
  };

  return (
    <article className="quest-row" style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }} aria-label={`Routine: ${quest.title}`}>
      <div className="qr-main">
        <h4>{quest.title}</h4>
        <div className="qr-meta">
          <span>{rule ? (rule.freq === "daily" ? "Daily" : "Weekly") : "Routine"}</span>
          <span style={{ display: "inline-flex", gap: 3 }} aria-label={rule?.freq === "daily" ? "Repeats daily" : `Repeats ${(days).map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ")}`}>
            {DOW_SHORT.map((d, i) => (
              <b key={i} style={{ opacity: days.includes(i) ? 1 : 0.3, fontSize: 11 }}>{d}</b>
            ))}
          </span>
        </div>
      </div>
      <div className="qr-actions">
        {todayIns && (
          <button className="chip" disabled={busyIns === todayIns.id} onClick={() => logInstance(todayIns)} title="Log today's occurrence" aria-label={`Log today's ${quest.title}`}>
            {busyIns === todayIns.id ? "…" : "Log today"}
          </button>
        )}
        <button className="icon-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open} title="Upcoming occurrences" aria-label={`Upcoming occurrences of ${quest.title}`}>
          <Icon id="i-clock" />
        </button>
      </div>
      {open && (
        <div style={{ flexBasis: "100%", marginTop: 6 }}>
          {!instances ? (
            <p style={{ fontSize: 12, color: "var(--text-3)" }}>Reading the rhythm…</p>
          ) : insList.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--text-3)" }}>
              No upcoming occurrences.{" "}
              <button className="chip" disabled={busyIns === "gen"} onClick={generate}>
                {busyIns === "gen" ? "…" : "Generate 30 days"}
              </button>
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4 }}>
              {insList.slice(0, 8).map((ins) => {
                const past = String(ins.occurrenceDate).slice(0, 10) <= todayKey;
                const doneIns = ins.status === "completed";
                return (
                  <li key={ins.id} data-ins={ins.id} style={{ fontSize: 12, color: "var(--text-2)", display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ flex: 1 }}>
                      {new Date(ins.occurrenceDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      {" · "}
                      {String(ins.status).replace("_", " ")}
                    </span>
                    {!doneIns && past && (
                      <button className="chip" disabled={busyIns === ins.id} onClick={() => logInstance(ins)} aria-label={`Log ${quest.title} for ${String(ins.occurrenceDate).slice(0, 10)}`}>
                        {busyIns === ins.id ? "…" : "Log"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}
