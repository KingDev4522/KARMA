"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui";
import { FocusTimer } from "@/components/chronicle";
import { EmptyState } from "@/components/States";

/** Focus — a different world: no nav noise, ambient timer, clear controls. */
export default function FocusPage() {
  const { authHeaders } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [planned, setPlanned] = useState(25 * 60);
  const [left, setLeft] = useState(25 * 60);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const tick = () => setLeft((s) => (s > 0 ? s - 1 : 0));
  const arm = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(tick, 1000);
  };

  const start = async () => {
    setError(null);
    try {
      const s = await client.startFocus(authHeaders(), { plannedSeconds: planned });
      setSessionId(s.id);
      setLeft(planned);
      setStatus("running");
      arm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start focus.");
    }
  };
  const pause = async () => {
    if (!sessionId) return;
    try {
      await client.pauseFocus(authHeaders(), sessionId);
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
      setStatus("running");
      arm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't resume.");
    }
  };
  const finish = async (done: boolean) => {
    if (!sessionId) return;
    try {
      await client.finishFocus(authHeaders(), sessionId, { status: done ? "completed" : "cancelled", actualSeconds: planned - left });
      if (timer.current) clearInterval(timer.current);
      if (done) {
        toast({ title: "Session complete", body: "Now complete the quest to claim the reward.", tone: "xp" });
        router.push("/quests");
      } else {
        setStatus("cancelled");
        setSessionId(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't finish session.");
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-end justify-between">
        <h1 className="font-display text-2xl">Focus room</h1>
        {!started(sessionId, status) && (
          <label className="text-sm text-ink-secondary">
            Minutes
            <input
              type="number" min={1} max={480} value={Math.round(planned / 60)}
              onChange={(e) => { const m = Math.max(1, Math.min(480, Number(e.target.value || 25))); setPlanned(m * 60); setLeft(m * 60); }}
              className="ml-2 w-20 rounded-control border border-line bg-surface-card px-2 py-1.5"
            />
          </label>
        )}
      </div>

      <FocusTimer
        secondsLeft={left}
        total={planned}
        status={status}
        onStart={start}
        onPause={pause}
        onResume={resume}
        onFinish={() => finish(true)}
        onCancel={() => finish(false)}
        started={!!sessionId && status !== "cancelled"}
      />
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {!sessionId && (
        <EmptyState message="One quest, one timer. Starting focus quiets everything else." />
      )}
    </div>
  );
}

function started(id: string | null, status: string | null) {
  return !!id && status !== "cancelled";
}
