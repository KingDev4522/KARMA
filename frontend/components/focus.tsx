"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { client } from "@/lib/api";
import { useToast } from "@/components/toast";
import { Companion, EnvStack, Hero, Icon } from "@/components/illustrations";

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
  const { authHeaders } = useAuth();
  const toast = useToast();
  const [quest, setQuest] = useState<FocusQuest | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [total, setTotal] = useState(25 * 60);
  const [left, setLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [seq, setSeq] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTick = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };
  useEffect(() => stopTick, []);

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

  // Auto-finish at zero
  useEffect(() => {
    if (quest && left === 0 && sessionId) {
      client
        .finishFocus(authHeaders(), sessionId, { status: "completed", actualSeconds: total })
        .catch(() => undefined);
      stopTick();
      setRunning(false);
      setSeq((s) => s + 1);
      toast("Focus session complete · +40 XP", "i-focus");
      setQuest(null);
      setSessionId(null);
      window.dispatchEvent(new CustomEvent("liferpg:refresh"));
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
      if (sessionId) {
        try {
          await client.finishFocus(authHeaders(), sessionId, {
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
        toast("Focus session complete · +40 XP", "i-focus");
        window.dispatchEvent(new CustomEvent("liferpg:refresh"));
      }
      setQuest(null);
      setSessionId(null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionId, total, left],
  );

  const exit = useCallback(async () => {
    if (sessionId) {
      try {
        await client.finishFocus(authHeaders(), sessionId, { status: "cancelled", actualSeconds: total - left });
      } catch {
        /* leaving anyway */
      }
    }
    stopTick();
    setRunning(false);
    setQuest(null);
    setSessionId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, total, left]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <FocusCtx.Provider value={{ openFocus, focusSeq: seq }}>
      {children}
      <div className={`focus-session${quest ? " is-open" : ""}`} role="dialog" aria-modal={!!quest} aria-label="Focus session">
        <div className="focus-env">
          <EnvStack />
        </div>
        <button className="btn btn--ghost focus-exit" onClick={exit}>
          <Icon id="i-close" style={{ width: 15, height: 15 }} />
          Leave focus
        </button>
        <div className="focus-stage">
          <div className="focus-figures">
            <div className="companion-fig">
              <Companion width="100%" />
            </div>
            <div className="hero-fig">
              <Hero width="100%" className="idle" />
            </div>
          </div>
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
          {error && (
            <p role="alert" style={{ fontSize: 13, color: "var(--accent-text)" }}>
              {error}
            </p>
          )}
          <div className="focus-actions">
            <button className="btn btn--primary btn--lg" onClick={running ? pause : resume}>
              <Icon id={running ? "i-pause" : "i-play"} style={{ width: 16, height: 16 }} />
              <span>{running ? "Pause" : "Resume"}</span>
            </button>
            <button className="btn btn--ghost btn--lg" onClick={() => finish(true)}>
              <Icon id="i-check" style={{ width: 16, height: 16 }} />
              Finish
            </button>
          </div>
        </div>
      </div>
    </FocusCtx.Provider>
  );
}
