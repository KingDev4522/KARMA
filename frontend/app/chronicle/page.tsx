"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: debrief } = useApi<any>(() => client.debrief(authHeaders()), [userId], {
    enabled: !authLoading && !!userId,
  });
  const now = new Date();
  const [cal, setCal] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState(() => now.toISOString().slice(0, 10));
  const monthStart = `${cal.y}-${String(cal.m + 1).padStart(2, "0")}-01`;
  const monthEnd = new Date(cal.y, cal.m + 1, 0).toISOString().slice(0, 10);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: feed } = useApi<any>(() => client.calendar(authHeaders(), monthStart, monthEnd), [userId, cal.y, cal.m], {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const focusEvs = (((sessions ?? []) as any[]).slice(0, 8)).map((s: any) => ({
      at: new Date(s.startedAt).getTime(),
      kind: "focus",
      label: `Deep focus held · ${Math.round((s.actualSeconds ?? s.plannedSeconds ?? 0) / 60)} min`,
      time: new Date(s.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      xp: undefined,
    }));
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
      ...focusEvs,
    ].sort((a, b) => b.at - a.at);

    // Unified planning markers: scheduled quests, routine instances, milestones, focus.
    // dayEvents keeps the underlying link keys so a day drills into its quests.
    const marks: Record<string, { q: number; r: number; m: number; f: number }> = {};
    const dayEvents: Record<string, { kind: string; label: string; href: string }[]> = {};
    const bump = (k: string | null | undefined, f: "q" | "r" | "m" | "f") => {
      if (!k) return;
      marks[k] = marks[k] ?? { q: 0, r: 0, m: 0, f: 0 };
      marks[k][f] += 1;
    };
    const pushEv = (k: string | null | undefined, ev: { kind: string; label: string; href: string }) => {
      if (!k) return;
      dayEvents[k] = dayEvents[k] ?? [];
      dayEvents[k].push(ev);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const q of ((feed?.quests ?? []) as any[])) {
      const k = (q.dueAt ?? q.scheduledFor ?? "").slice(0, 10) || null;
      bump(k, "q");
      pushEv(k, { kind: "quest", label: q.title ?? "Quest", href: `/quests?q=${encodeURIComponent(q.title ?? "")}` });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const i of ((feed?.instances ?? []) as any[])) {
      const k = String(i.date).slice(0, 10);
      bump(k, "r");
      pushEv(k, { kind: "routine", label: `${i.questTitle ?? "Routine"} · instance`, href: `/quests?q=${encodeURIComponent(i.questTitle ?? "")}` });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const m of ((feed?.milestones ?? []) as any[])) {
      const k = m.date ? String(m.date).slice(0, 10) : null;
      bump(k, "m");
      pushEv(k, { kind: "milestone", label: `${m.title ?? "Milestone"} · ${m.campaignTitle ?? "campaign"}`, href: "/campaigns" });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const s of ((feed?.focusSessions ?? []) as any[])) {
      const k = String(s.startedAt).slice(0, 10);
      bump(k, "f");
      const mins = Math.round(((s.actualSeconds ?? s.plannedSeconds ?? 0) as number) / 60);
      pushEv(k, { kind: "focus", label: `Focus session · ${mins} min`, href: "/focus" });
    }

    return { completions, weekXP, days, evs, focusHours: focusSecs / 3600, marks, dayEvents };
  }, [history, achievements, sessions, feed]);

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
          <p className="sub">The story of your discipline, written daily — history, calendar, analytics.</p>
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

      {debrief && debrief.questsCleared > 0 && (
        <div className="panel" role="status" aria-label="Daily debrief" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <Icon id="i-spark" />
          <span style={{ fontSize: 13.5 }}>
            <strong>Daily debrief — </strong>
            {debrief.questsCleared} cleared · +{debrief.xp} XP · +{debrief.coins} coins
          </span>
        </div>
      )}

      <div className="chronicle-grid">
        <div className="timeline panel">
          <div className="sec-head" style={{ margin: 0 }}>
            <h3>Story</h3>
          </div>
          {model.evs.length === 0 && <p style={{ fontSize: 13.5, color: "var(--text-3)" }}>No story yet — your first quest writes the opening line.</p>}
          {(() => {
            const groups = new Map<string, typeof model.evs>();
            for (const ev of model.evs) {
              const date = new Date(ev.at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              if (!groups.has(date)) groups.set(date, []);
              groups.get(date)!.push(ev);
            }
            return Array.from(groups.entries()).map(([date, items]) => (
              <div key={date}>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 650,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    color: "var(--text-3)",
                    margin: "12px 0 6px",
                    paddingTop: 8,
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  {date}
                </div>
                {items.map((ev, j) => (
                  <div key={`${date}-${j}`} className={`tl-item t-${ev.kind}`}>
                    <span className="tl-dot">
                      <Icon id={ev.kind === "achievement" ? "i-trophy" : "i-check"} />
                    </span>
                    <div className="tl-body">
                      <strong>
                        {ev.label}
                        {(ev.kind === "achievement" || ev.kind === "level") && (
                          <span className="seal" style={{ width: 18, height: 18, fontSize: 9, marginLeft: 6 }}>
                            <Icon id="i-trophy" />
                          </span>
                        )}
                        {typeof ev.xp === "number" && ev.xp > 0 && <span className="tl-xp">+{ev.xp} XP</span>}
                      </strong>
                      <time>{ev.time}</time>
                    </div>
                  </div>
                ))}
              </div>
            ));
          })()}
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

      <MonthCalendar
        year={cal.y}
        month={cal.m}
        marks={model.marks}
        selected={selected}
        onSelect={setSelected}
        onPrev={() => setCal((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))}
        onNext={() => setCal((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))}
      />

      <section aria-label="Selected day agenda" className="panel" style={{ marginTop: 12 }}>
        <div className="sec-head" style={{ margin: 0 }}>
          <h3>{new Date(`${selected}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</h3>
        </div>
        {(model.dayEvents[selected] ?? []).length === 0 ? (
          <p style={{ fontSize: 13.5, color: "var(--text-3)" }}>Nothing planned this day — quests you schedule land here.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            {(model.dayEvents[selected] ?? []).map((ev, j) => (
              <li key={`${selected}-${j}`}>
                <Link href={ev.href} className="dd-item" style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 12px" }}>
                  <Icon id={ev.kind === "milestone" ? "i-campaigns" : ev.kind === "focus" ? "i-focus" : ev.kind === "routine" ? "i-clock" : "i-quests"} />
                  <span style={{ fontSize: 13 }}>{ev.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MonthCalendar({
  year,
  month,
  marks,
  selected,
  onSelect,
  onPrev,
  onNext,
}: {
  year: number;
  month: number;
  marks: Record<string, { q: number; r: number; m: number; f: number }>;
  selected: string;
  onSelect: (dayKey: string) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const first = new Date(year, month, 1);
  const cells: (number | null)[] = Array<null>(first.getDay()).fill(null);
  const dim = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= dim; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  const todayKey = new Date().toISOString().slice(0, 10);
  const dots: { k: "q" | "r" | "m" | "f"; c: string; l: string }[] = [
    { k: "q", c: "var(--accent)", l: "quests" },
    { k: "r", c: "var(--tint-sage-d)", l: "routines" },
    { k: "m", c: "var(--gold)", l: "milestones" },
    { k: "f", c: "var(--tint-coral-d)", l: "focus" },
  ];
  return (
    <section aria-label="Planning calendar" className="panel cal-panel">
      <div className="cal-head">
        <h3 className="cal-title">{first.toLocaleString(undefined, { month: "long", year: "numeric" })}</h3>
        <span className="cal-nav">
          <button className="icon-btn" onClick={onPrev} aria-label="Previous month">‹</button>
          <button className="icon-btn" onClick={onNext} aria-label="Next month">›</button>
        </span>
      </div>
      <div className="cal-grid" role="grid" aria-label="Month calendar">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} className="cal-dow">{d}</span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={i} aria-hidden />;
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const mk = marks[key];
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(key)}
              aria-label={key + (mk ? `: ${mk.q} quests, ${mk.r} routines, ${mk.m} milestones, ${mk.f} focus` : "")}
              aria-pressed={selected === key}
              className={`cal-cell${key === todayKey ? " is-today" : ""}${selected === key ? " is-selected" : ""}`}
              style={{ cursor: "pointer" }}
            >
              <span className="cal-num">{d}</span>
              {mk && (
                <span className="cal-dots" aria-hidden>
                  {dots.map((t) => (mk[t.k] > 0 ? <i key={t.k} style={{ background: t.c }} /> : null))}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="cal-legend">
        {dots.map((t) => (
          <span key={t.k}><i style={{ background: t.c }} />{t.l}</span>
        ))}
      </p>
    </section>
  );
}
