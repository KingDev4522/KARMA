"use client";

import { useState } from "react";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import { useFocus } from "@/components/focus";
import { Icon } from "@/components/illustrations";
import { EmptyState, ErrorState, Skeleton } from "@/components/States";

/** Focus — pick a quest, set minutes, enter the session overlay. */
export default function FocusPage() {
  const { authHeaders, userId, loading: authLoading } = useAuth();
  const { openFocus, focusSeq } = useFocus();
  const { data: quests } = useApi(() => client.listQuests(authHeaders(), "status=active,in_progress&preview=false&limit=30").catch(() => []), [userId]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessions, error, loading, retry } = useApi<any>(() => client.listFocus(authHeaders(), 10), [userId, authLoading, focusSeq]);
  const [questId, setQuestId] = useState("");
  const [minutes, setMinutes] = useState(25);

  if (authLoading || loading) return <Skeleton label="Focus" rows={3} />;
  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (!userId) return <EmptyState message="Sign in (or enable dev bypass) to enter focus." />;

  const start = () => {
    const q = (quests ?? []).find((t) => t.id === questId);
    openFocus({
      id: q?.id,
      title: q?.title ?? "Free focus session",
      minutes: q ? Math.min(q.estimatedMinutes ?? minutes, 120) : minutes,
    });
  };

  return (
    <div className="page is-active">
      <div className="page-head">
        <div>
          <h2>Focus</h2>
          <p className="sub">One quest, one timer, no noise.</p>
        </div>
      </div>

      <div className="panel focus-launch">
        <div style={{ flex: "1 1 220px", minWidth: 0 }}>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="focusQuestPick">Quest</label>
            <select id="focusQuestPick" value={questId} onChange={(e) => setQuestId(e.target.value)}>
              <option value="">Free session — no quest linked</option>
              {(quests ?? []).map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title.slice(0, 60)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="focusMinutes">Minutes</label>
            <select id="focusMinutes" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
              {[15, 25, 45, 60, 90].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn btn--primary btn--lg" onClick={start} style={{ alignSelf: "flex-end" }}>
          <Icon id="i-play" style={{ width: 16, height: 16 }} />
          Enter focus
        </button>
      </div>

      <div className="sec-head" style={{ marginTop: 22 }}>
        <h3>Recent sessions</h3>
      </div>
      {!sessions || sessions.length === 0 ? (
        <div className="empty-state panel">
          <Icon id="i-focus" />
          <p>One quest, one timer. Starting focus quiets everything else.</p>
        </div>
      ) : (
        <div className="quest-list panel">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {sessions.map((s: any) => (
            <div className="session-row" key={s.id}>
              <Icon id="i-clock" style={{ color: "var(--text-3)" }} />
              <span style={{ flex: 1 }}>
                {s.quest?.title ?? s.questId ?? "Free session"}
              </span>
              <span style={{ color: "var(--text-3)", fontWeight: 700, fontSize: 12 }}>
                {Math.round((s.actualSeconds ?? s.plannedSeconds ?? 0) / 60)}m · {s.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
