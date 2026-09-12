"use client";

import { useMemo } from "react";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import { Icon } from "@/components/illustrations";
import { ErrorState, SignInPrompt, Skeleton } from "@/components/States";

/** Chronicle — stats, story timeline, 7-day chart. All server data. */
export default function ChroniclePage() {
  const { authHeaders, userId, loading: authLoading } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: history, error, loading, retry } = useApi<any>(() => client.history(authHeaders(), 30), [userId], {
    enabled: !authLoading && !!userId,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: analytics } = useApi<any>(() => client.analytics(authHeaders()), [userId], {
    enabled: !authLoading && !!userId,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: achievements } = useApi<any>(() => client.achievements(authHeaders()), [userId], {
    enabled: !authLoading && !!userId,
  });
  const { data: sessions } = useApi(() => client.listFocus(authHeaders(), 50).catch(() => [] as unknown[]), [userId], {
    enabled: !authLoading && !!userId,
  });

  const model = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completions: any[] = history?.completions ?? [];
    const weekAgo = Date.now() - 7 * 86400000;
    const inWeek = completions.filter((c) => new Date(c.completedAt).getTime() >= weekAgo);
    const weekXP = inWeek.reduce((s, c) => s + (c.rewardXp ?? 0), 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unlocked: any[] = achievements?.unlocked ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const focusSecs = ((sessions ?? []) as any[]).reduce((s, f) => s + (f.actualSeconds ?? f.plannedSeconds ?? 0), 0);

    const days: { key: string; label: string; xp: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const xp = completions.filter((c) => new Date(c.completedAt).toISOString().slice(0, 10) === key).reduce((s, c) => s + (c.rewardXp ?? 0), 0);
      days.push({ key, label: "SMTWTFS"[d.getDay()], xp });
    }

    type Ev = { at: number; kind: string; label: string; time: string; xp?: number };
    const evs: Ev[] = [
      ...completions.map((c) => ({
        at: new Date(c.completedAt).getTime(),
        kind: "quest",
        label: `“${c.quest?.title ?? "Quest"}” completed`,
        time: new Date(c.completedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
        xp: c.rewardXp as number | undefined,
      })),
      ...unlocked
        .filter((a) => a.unlockedAt)
        .map((a) => ({
          at: new Date(a.unlockedAt).getTime(),
          kind: "achievement",
          label: `Badge earned: ${a.name ?? a.key}`,
          time: new Date(a.unlockedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          xp: undefined,
        })),
    ].sort((a, b) => b.at - a.at);

    return { completions, weekXP, days, evs, focusHours: focusSecs / 3600 };
  }, [history, achievements, sessions]);

  if (authLoading || loading) return <Skeleton label="Chronicle" rows={4} />;
  if (!userId) return <SignInPrompt />;
  if (error) return <ErrorState error={error} onRetry={retry} />;

  const streak = analytics?.streak?.current ?? 0;
  const maxBar = Math.max(1, ...model.days.map((d) => d.xp));

  return (
    <div className="page is-active">
      <div className="page-head">
        <div>
          <h2>Chronicle</h2>
          <p className="sub">The story of your discipline, written daily.</p>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <div className="sv">{model.weekXP.toLocaleString("en-US")}</div>
          <div className="sl">XP this week</div>
        </div>
        <div className="stat-box">
          <div className="sv">{model.completions.length}</div>
          <div className="sl">Quests completed</div>
        </div>
        <div className="stat-box">
          <div className="sv">{streak}</div>
          <div className="sl">Current streak</div>
        </div>
        <div className="stat-box">
          <div className="sv">{model.focusHours >= 1 ? `${model.focusHours.toFixed(1)}h` : `${Math.round(model.focusHours * 60)}m`}</div>
          <div className="sl">Time in focus</div>
        </div>
      </div>

      <div className="chronicle-grid">
        <div className="timeline panel">
          {model.evs.length === 0 && <p style={{ fontSize: 13.5, color: "var(--text-3)" }}>No story yet — your first quest writes the opening line.</p>}
          {model.evs.map((ev, i) => (
            <div key={i} className={`tl-item t-${ev.kind}`}>
              <span className="tl-dot">
                <Icon id={ev.kind === "achievement" ? "i-trophy" : "i-check"} />
              </span>
              <div className="tl-body">
                <strong>
                  {ev.label}
                  {typeof ev.xp === "number" && ev.xp > 0 && <span className="tl-xp">+{ev.xp} XP</span>}
                </strong>
                <time>{ev.time}</time>
              </div>
            </div>
          ))}
        </div>
        <div className="chart panel">
          <div className="sec-head" style={{ margin: 0 }}>
            <h3>Last 7 days</h3>
          </div>
          <div className="chart-bars">
            {model.days.map((d) => (
              <div key={d.key} className={`bar${d.xp === maxBar && d.xp > 0 ? " best" : ""}`}>
                <b>{d.xp}</b>
                <i style={{ height: `${Math.max(3, (d.xp / maxBar) * 100)}%` }} />
                <span>{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
