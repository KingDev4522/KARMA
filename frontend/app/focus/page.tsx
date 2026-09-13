"use client";

import { useState } from "react";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import { useFocus } from "@/components/focus";
import { Icon } from "@/components/illustrations";
import { EmptyState, ErrorState, Skeleton } from "@/components/States";

import { FOCUS_CLASSICAL_TRACKS } from "@/lib/media";

/** Focus — pick a quest, set minutes, enter the session overlay. */
export default function FocusPage() {
  const { authHeaders, userId, loading: authLoading } = useAuth();
  const { openFocus, focusSeq } = useFocus();
  const { data: quests } = useApi(() => client.listQuests(authHeaders(), "status=active,in_progress&preview=false&limit=30").catch(() => []), [userId]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessions, error, loading, retry } = useApi<any>(() => client.listFocus(authHeaders(), 10), [userId, authLoading, focusSeq]);
  const [questId, setQuestId] = useState("");
  const [minutes, setMinutes] = useState(25);
  const [custom, setCustom] = useState("");
  // Sub-minute taps (accidental opens) stay in history but not in Recent.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentSessions = ((sessions ?? []) as any[]).filter((s: any) => (s.actualSeconds ?? s.plannedSeconds ?? 0) >= 60);

  if (authLoading || loading) return <Skeleton label="Focus" rows={3} />;
  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (!userId) return <EmptyState message="Sign in (or enable dev bypass) to enter focus." />;

  const effectiveMinutes = (() => {
    const c = Math.floor(Number(custom));
    if (custom.trim() !== "" && Number.isFinite(c)) return Math.min(240, Math.max(1, c));
    return minutes;
  })();

  const start = () => {
    const q = (quests ?? []).find((t) => t.id === questId);
    openFocus({
      id: q?.id,
      title: q?.title ?? "Free focus session",
      // Any quest — spark or campaign — can hold any timer length.
      minutes: q?.estimatedMinutes && custom.trim() === "" ? Math.min(q.estimatedMinutes, 240) : effectiveMinutes,
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
            <select id="focusMinutes" value={minutes} onChange={(e) => { setMinutes(Number(e.target.value)); setCustom(""); }}>
              {[5, 15, 25, 45, 60, 90, 120].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="focusCustom">Custom (1–240)</label>
            <input
              id="focusCustom"
              type="number"
              min={1}
              max={240}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Any length"
              aria-label="Custom focus length in minutes"
            />
          </div>
        </div>
        <button className="btn btn--primary btn--lg" onClick={start} style={{ alignSelf: "flex-end" }}>
          <Icon id="i-play" style={{ width: 16, height: 16 }} />
          Enter focus
        </button>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 8 }}>
        Finish and the linked quest completes by itself. Leave before 5 real minutes and it costs 5 XP — the quest stays for another run.
      </p>

      {/* Focus Audio Station — 10 Classical & Lo-Fi Tracks on Shuffle */}
      <div
        style={{
          marginTop: 24,
          padding: "20px 24px",
          borderRadius: 18,
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.09)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon id="i-spark" style={{ width: 16, height: 16, color: "#FFFFFF" }} />
            <div>
              <strong style={{ fontSize: 14, color: "#FFFFFF", display: "block" }}>Focus Audio Station · Classical, Lo-Fi & Cinematic</strong>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>{FOCUS_CLASSICAL_TRACKS.length} pieces playing on auto-shuffle with visible player controls during focus</span>
            </div>
          </div>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "4px 12px",
              borderRadius: 9999,
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#FFFFFF",
            }}
          >
            ⇄ Auto-Shuffle Active
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 10 }}>
          {FOCUS_CLASSICAL_TRACKS.map((t, i) => (
            <div
              key={t.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: 10,
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", width: 16 }}>{i + 1}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <strong style={{ display: "block", fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#FFFFFF" }}>
                  {t.name}
                </strong>
                <span style={{ display: "block", fontSize: 10.5, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {t.movement}
                </span>
              </div>
              <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", color: "var(--text-3)", padding: "2px 6px", borderRadius: 4, background: "rgba(255, 255, 255, 0.05)" }}>
                {t.instrument}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="sec-head" style={{ marginTop: 28 }}>
        <h3>Recent sessions</h3>
      </div>
      {!recentSessions || recentSessions.length === 0 ? (
        <div className="empty-state panel">
          <Icon id="i-focus" />
          <p>One quest, one timer. Starting focus quiets everything else.</p>
        </div>
      ) : (
        <div className="quest-list panel">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {recentSessions.map((s: any) => (
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
