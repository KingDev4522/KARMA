"use client";

import { useEffect, useRef, useState } from "react";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";

/** Focus — Quest, Timer, Pause/Resume, Finish → reward sequence (FE §9). Full-screen on mobile. */
export default function FocusPage() {
  const { authHeaders } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [planned, setPlanned] = useState(25 * 60);
  const [left, setLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const tick = () => setLeft((s) => (s > 0 ? s - 1 : 0));

  const start = async () => {
    setError(null);
    try {
      const s = await client.startFocus(authHeaders(), { plannedSeconds: planned });
      setSessionId(s.id);
      setLeft(planned);
      setRunning(true);
      setStatus("running");
      if (timer.current) clearInterval(timer.current);
      timer.current = setInterval(tick, 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start focus.");
    }
  };

  const pause = async () => {
    if (!sessionId) return;
    try {
      await client.pauseFocus(authHeaders(), sessionId);
      setRunning(false);
      setStatus("paused");
      if (timer.current) clearInterval(timer.current);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't pause.");
    }
  };

  const resume = async () => {
    if (!sessionId) return;
    try {
      await client.resumeFocus(authHeaders(), sessionId);
      setRunning(true);
      setStatus("running");
      if (timer.current) clearInterval(timer.current);
      timer.current = setInterval(tick, 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't resume.");
    }
  };

  const finish = async (done: boolean) => {
    if (!sessionId) return;
    try {
      await client.finishFocus(authHeaders(), sessionId, {
        status: done ? "completed" : "cancelled",
        actualSeconds: planned - left,
      });
      setRunning(false);
      setStatus(done ? "completed — now Complete the quest for your reward" : "cancelled");
      if (timer.current) clearInterval(timer.current);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't finish session.");
    }
  };

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div className="mx-auto max-w-lg space-y-4 md:py-8">
      <h1 className="font-display text-2xl">Focus</h1>
      <div className="rounded-2xl bg-surface-card p-8 text-center shadow-card" role="timer" aria-label={`Time left ${mm} minutes ${ss} seconds`}>
        <p className="font-display text-6xl tabular-nums">{mm}:{ss}</p>
        <p className="mt-1 text-sm text-ink-muted">{status ?? "ready"}</p>
      </div>
      <label className="block text-sm">
        Duration (minutes)
        <input
          type="number"
          min={1}
          max={480}
          value={Math.round(planned / 60)}
          onChange={(e) => setPlanned(Math.max(60, Number(e.target.value || 25) * 60))}
          className="ml-2 w-20 rounded-lg bg-surface-card px-2 py-1.5"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {!sessionId || status === "cancelled" || status?.startsWith("completed") ? (
          <button onClick={start} className="rounded-lg bg-xp px-4 py-2 text-sm font-semibold text-surface-bg">Start</button>
        ) : running ? (
          <button onClick={pause} className="rounded-lg border border-xp/50 px-4 py-2 text-sm">Pause</button>
        ) : (
          <button onClick={resume} className="rounded-lg bg-xp px-4 py-2 text-sm font-semibold text-surface-bg">Resume</button>
        )}
        {sessionId && (
          <>
            <button onClick={() => finish(true)} className="rounded-lg bg-success px-4 py-2 text-sm font-semibold text-surface-bg">Finish</button>
            <button onClick={() => finish(false)} className="rounded-lg border border-danger/50 px-4 py-2 text-sm">Cancel</button>
          </>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}
