"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { client } from "@/lib/api";
import type { CompletionResponse } from "@/lib/types";
import { useToast } from "@/components/toast";
import { Icon } from "@/components/illustrations";
import { ATTR_META, LevelUpModal, announceAchievements, questAttrKey } from "@/components/quests";
import { Celebration, celebrationFrom, type CelebrationData } from "@/components/celebration";
import { Scenery, sceneryIndexFor } from "@/components/scenery";
import { bgmEnabled, setBgmEnabled, ensureBgm } from "@/lib/bgm";

export interface FocusQuest {
  id?: string;
  title: string;
  minutes: number;
}

interface FocusValue {
  openFocus: (q: FocusQuest) => void;
  focusSeq: number;
}

const FocusCtx = createContext<FocusValue>({ openFocus: () => undefined, focusSeq: 0 });

export function useFocus() {
  return useContext(FocusCtx);
}

const RING_C = 2 * Math.PI * 104;

export function FocusProvider({ children }: { children: ReactNode }) {
  const { authHeaders, userId, loading: authLoading } = useAuth();
  const toast = useToast();
  const [quest, setQuest] = useState<FocusQuest | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [total, setTotal] = useState(25 * 60);
  const [left, setLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [seq, setSeq] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ceremony, setCeremony] = useState<CompletionResponse | null>(null);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const [recovered, setRecovered] = useState<{ id: string; questId?: string; title: string; remaining: number; planned: number } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTick = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };
  useEffect(() => stopTick, []);

  const startTick = useCallback(() => {
    stopTick();
    timer.current = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          stopTick();
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  }, []);

  // Recovery: a refresh must never eat a live session. If the server holds a
  // running/paused session, offer to resume it (remaining recomputed from the
  // server clock) or discard it.
  useEffect(() => {
    if (authLoading || !userId || quest) return;
    let alive = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client.listFocus(authHeaders(), 5).then((ss: any[]) => {
      if (!alive) return;
      const s = (ss ?? []).find((x) => x.status === "running" || x.status === "paused");
      if (!s) return;
      const planned = s.plannedSeconds ?? 1500;
      const elapsed = Math.max(0, Math.round((Date.now() - new Date(s.startedAt).getTime()) / 1000));
      setRecovered({
        id: s.id,
        questId: s.questId ?? s.quest?.id ?? undefined,
        title: s.quest?.title ?? "Focus session",
        remaining: Math.max(0, planned - elapsed),
        planned,
      });
    }).catch(() => undefined);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, authLoading]);

  const resumeRecovered = useCallback(async () => {
    if (!recovered) return;
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sessions = (await client.listFocus(authHeaders(), 5).catch(() => [])) as any[];
      const s = sessions.find((x) => x.id === recovered.id);
      if (s?.status === "paused") {
        await client.resumeFocus(authHeaders(), recovered.id);
      } else if (!s || (s.status !== "running" && s.status !== "paused")) {
        setRecovered(null);
        return;
      }
      if (recovered.remaining <= 0) {
        await client.finishFocus(authHeaders(), recovered.id, { status: "completed", actualSeconds: recovered.planned });
        setRecovered(null);
        setSeq((n) => n + 1);
        window.dispatchEvent(new CustomEvent("liferpg:refresh"));
        return;
      }
      setQuest({ id: recovered.questId, title: recovered.title, minutes: Math.ceil(recovered.planned / 60) });
      setTotal(recovered.planned);
      setLeft(recovered.remaining);
      setSessionId(recovered.id);
      setRunning(true);
      startTick();
      setRecovered(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't resume the session.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recovered]);

  const discardRecovered = useCallback(async () => {
    if (!recovered) return;
    try {
      const res = (await client.finishFocus(authHeaders(), recovered.id, { status: "cancelled" })) as { penaltyXp?: number };
      if ((res?.penaltyXp ?? 0) > 0) toast(`Left early · −${res.penaltyXp} XP`, "i-close");
    } catch {
      /* discarding anyway */
    }
    setRecovered(null);
    setSeq((n) => n + 1);
    window.dispatchEvent(new CustomEvent("liferpg:refresh"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recovered]);

  const openFocus = useCallback(
    async (q: FocusQuest) => {
      setError(null);
      const secs = Math.max(60, Math.round(q.minutes) * 60);
      setQuest(q);
      setTotal(secs);
      setLeft(secs);
      try {
        const s = await client.startFocus(authHeaders(), { questId: q.id, plannedSeconds: secs });
        setSessionId(s.id);
        setRunning(true);
        stopTick();
        timer.current = setInterval(() => {
          setLeft((v) => {
            if (v <= 1) {
              stopTick();
              return 0;
            }
            return v - 1;
          });
        }, 1000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't start focus.");
        setRunning(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authHeaders],
  );

  // PRD chain: Focus finish on a linked quest completes the quest server-side
  // so XP + Coins + Attributes + Streak land in one tap. Idempotency key is
  // derived from the session so retries/auto-finish can never double-grant.
  const completeLinkedQuest = useCallback(
    async (questId: string | undefined, sid: string | null) => {
      if (!questId) {
        toast("Focus session complete — well held.", "i-focus");
        return;
      }
      try {
        const r = await client.completeQuest(authHeaders(), questId, `focus-${sid ?? "free"}`);
        void import("@/lib/sound").then((s) => s.playCoin()).catch(() => undefined);
        toast(`“${quest?.title ?? "Quest"}” complete · +${r.rewardXp} XP · +${r.rewardCoins} coins`, "i-check");
        announceAchievements(r, toast);
        setCelebration(celebrationFrom(r));
        if (r.leveledUp) setCeremony(r);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (/already|conflict|completed/i.test(msg)) {
          toast("That quest already counted — session logged.", "i-check");
        } else {
          toast(e instanceof Error ? e.message : "Session logged, but the quest reward didn't land — complete it from Quests.", "i-close");
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authHeaders, quest?.title],
  );

  // Auto-finish at zero
  useEffect(() => {
    if (quest && left === 0 && sessionId) {
      const qid = quest.id;
      const sid = sessionId;
      client
        .finishFocus(authHeaders(), sid, { status: "completed", actualSeconds: total })
        .catch(() => undefined)
        .finally(() => {
          stopTick();
          setRunning(false);
          setSeq((s) => s + 1);
          void completeLinkedQuest(qid, sid);
          setQuest(null);
          setSessionId(null);
          window.dispatchEvent(new CustomEvent("liferpg:refresh"));
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  const pause = useCallback(async () => {
    if (!sessionId) return;
    try {
      await client.pauseFocus(authHeaders(), sessionId);
      setRunning(false);
      stopTick();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't pause.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const resume = useCallback(async () => {
    if (!sessionId) return;
    try {
      await client.resumeFocus(authHeaders(), sessionId);
      setRunning(true);
      stopTick();
      timer.current = setInterval(() => {
        setLeft((v) => {
          if (v <= 1) {
            stopTick();
            return 0;
          }
          return v - 1;
        });
      }, 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't resume.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const finish = useCallback(
    async (done: boolean) => {
      const qid = quest?.id;
      const sid = sessionId;
      if (sid) {
        try {
          await client.finishFocus(authHeaders(), sid, {
            status: done ? "completed" : "cancelled",
            actualSeconds: total - left,
          });
        } catch (e) {
          if (done) {
            setError(e instanceof Error ? e.message : "Couldn't finish session.");
            return;
          }
        }
      }
      stopTick();
      setRunning(false);
      if (done) {
        setSeq((s) => s + 1);
        await completeLinkedQuest(qid, sid);
        window.dispatchEvent(new CustomEvent("liferpg:refresh"));
      }
      setQuest(null);
      setSessionId(null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionId, total, left, quest?.id, completeLinkedQuest],
  );

  const exit = useCallback(async () => {
    if (sessionId) {
      try {
        const res = (await client.finishFocus(authHeaders(), sessionId, { status: "cancelled", actualSeconds: total - left })) as { penaltyXp?: number };
        if ((res?.penaltyXp ?? 0) > 0) {
          void import("@/lib/sound").then((s) => s.playAbandon()).catch(() => undefined);
          toast(`Left early · −${res.penaltyXp} XP — the quest waits for another run`, "i-close");
        }
      } catch {
        /* leaving anyway */
      }
    }
    stopTick();
    setRunning(false);
    setQuest(null);
    setSessionId(null);
    window.dispatchEvent(new CustomEvent("liferpg:refresh"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, total, left]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  // One scenery per minute of the session (6 vignettes, cycling).
  const sceneIdx = sceneryIndexFor(total - left);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (quest) setMuted(!bgmEnabled());
  }, [quest]);

  const toggleMute = () => {
    const next = !bgmEnabled();
    setBgmEnabled(next);
    if (next) void ensureBgm();
    setMuted(!next);
  };

  return (
    <FocusCtx.Provider value={{ openFocus, focusSeq: seq }}>
      {children}
      <Celebration data={celebration} onClose={() => setCelebration(null)} />
      {recovered && !quest && (
        <div className="focus-recover" role="dialog" aria-label="Unfinished focus session">
          <div>
            <strong>Unfinished session</strong>
            <p>“{recovered.title}” still has ~{Math.max(1, Math.round(recovered.remaining / 60))} min on its timer.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn--primary" onClick={resumeRecovered}>Resume</button>
            <button className="btn btn--ghost" onClick={discardRecovered}>Discard</button>
          </div>
        </div>
      )}
      {ceremony && (
        <LevelUpModal
          level={ceremony.newLevel}
          message={`${ceremony.companion.message} A new rank: ${ceremony.newRankDisplay}.`}
          rankUp={ceremony.rankUp}
          onClose={() => setCeremony(null)}
        />
      )}
      <div className={`focus-session${quest ? " is-open" : ""}`} role="dialog" aria-modal={!!quest} aria-label="Focus session">
        {quest && (
          <div className="focus-scenery" aria-hidden="true">
            <Scenery key={sceneIdx} index={sceneIdx} className="sc-scene-enter" />
          </div>
        )}
        <button className="btn btn--ghost focus-exit" onClick={exit}>
          <Icon id="i-close" style={{ width: 15, height: 15 }} />
          Leave focus
        </button>
        <button
          className="icon-btn focus-mute"
          onClick={toggleMute}
          title={muted ? "Unmute ambient music" : "Mute ambient music"}
          aria-label={muted ? "Unmute ambient music" : "Mute ambient music"}
          aria-pressed={!muted}
        >
          <Icon id={muted ? "i-volx" : "i-vol"} style={{ width: 15, height: 15 }} />
        </button>
        <div className="focus-stage">
          <div className="focus-label">Focus session</div>
          <div className="focus-timer" role="timer" aria-label={`${mm} minutes ${ss} seconds left`}>
            <svg viewBox="0 0 230 230">
              <circle className="track" cx="115" cy="115" r="104" />
              <circle
                className="prog"
                cx="115"
                cy="115"
                r="104"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * (1 - (total ? left / total : 0))}
              />
            </svg>
            <div className="focus-clock">
              {mm}:{ss}
            </div>
          </div>
          <div className="focus-quest">{quest?.title ?? ""}</div>
          {quest?.id ? (()=>{const k=questAttrKey({rewardPreview: null, questType: "focus", difficulty:3} as any); const m=ATTR_META[k]??{name:k, icon:"i-spark"}; return <span className="focus-attr"><Icon id={m.icon}/> {m.name}</span>})() : <span className="focus-attr"><Icon id="i-focusattr"/> Focus</span>}
          {error && (
            <p role="alert" style={{ fontSize: 13, color: "var(--accent-text)" }}>
              {error}
            </p>
          )}
          <div className="focus-actions">
            <button className="btn btn--ghost btn--lg" onClick={running ? pause : resume}>
              <Icon id={running ? "i-pause" : "i-play"} style={{ width: 16, height: 16 }} />
              <span>{running ? "Pause" : "Resume"}</span>
            </button>
            <button className="btn btn--primary" onClick={() => finish(true)}>
              <Icon id="i-check" style={{ width: 16, height: 16 }} />
              Finish
            </button>
          </div>
        </div>
      </div>
    </FocusCtx.Provider>
  );
}
