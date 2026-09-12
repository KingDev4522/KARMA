"use client";

import { useMemo, useState } from "react";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import { CalendarMonth, ChronicleTimeline, Heatmap } from "@/components/chronicle";
import { SectionHeading } from "@/components/ui";
import { EmptyState, ErrorState, Skeleton } from "@/components/States";

/** Chronicle — personal adventure history: timeline, heatmap, calendar, focus past. */
export default function ChroniclePage() {
  const { authHeaders, userId } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: history, error: hErr, loading: hLoad, retry: hRetry } = useApi<any>(() => client.history(authHeaders()), [userId]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: analytics } = useApi<any>(() => client.analytics(authHeaders()), [userId]);
  const now = new Date();
  const [cal, setCal] = useState({ y: now.getFullYear(), m: now.getMonth() });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const completions = ((history?.completions ?? []) as any[]);
  const markers = useMemo(() => {
    const map: Record<string, { quests: number; routines: number; milestones: number; focus: number }> = {};
    for (const c of completions) {
      const k = new Date(c.completedAt).toISOString().slice(0, 10);
      map[k] = map[k] ?? { quests: 0, routines: 0, milestones: 0, focus: 0 };
      map[k].quests += 1;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const s of ((history?.focusSessions ?? []) as any[])) {
      const k = new Date(s.startedAt).toISOString().slice(0, 10);
      map[k] = map[k] ?? { quests: 0, routines: 0, milestones: 0, focus: 0 };
      map[k].focus += 1;
    }
    return map;
  }, [completions]);

  const heat = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    for (let i = 48; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      days.push({ date: k, count: markers[k]?.quests ?? 0 });
    }
    return days;
  }, [markers]);

  if (hLoad) return <Skeleton label="Chronicle" rows={4} />;
  if (hErr) return <ErrorState error={hErr} onRetry={hRetry} />;

  return (
    <div className="space-y-6">
      <SectionHeading title="Your adventure so far" />
      {analytics && (
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { v: String(analytics.today?.count ?? 0), l: "today" },
            { v: String(analytics.week?.activeDays ?? 0), l: "active days" },
            { v: String(analytics.streak?.current ?? 0), l: "streak" },
          ].map((s) => (
            <div key={s.l} className="rounded-card border border-line bg-surface-card p-3 shadow-card">
              <p className="font-display text-2xl">{s.v}</p>
              <p className="text-[11px] text-ink-muted">{s.l}</p>
            </div>
          ))}
        </div>
      )}

      <section aria-label="Rhythm">
        <h2 className="mb-2 font-display text-lg">Rhythm</h2>
        <Heatmap days={heat} />
      </section>

      <section aria-label="Timeline">
        <h2 className="mb-3 font-display text-lg">Moments</h2>
        {completions.length === 0 ? (
          <EmptyState message="No history yet — your story starts with the first quest." />
        ) : (
          <ChronicleTimeline
            items={completions.slice(0, 20).map((c) => ({
              id: c.id,
              title: c.quest?.title ?? "Quest cleared",
              detail: `+${c.rewardXp} XP · +${c.rewardCoins} coins`,
              at: c.completedAt,
            }))}
          />
        )}
      </section>

      <section aria-label="Planning calendar" id="calendar">
        <h2 className="mb-3 font-display text-lg">Planning</h2>
        <CalendarMonth
          year={cal.y}
          month={cal.m}
          markers={markers}
          onPrev={() => setCal((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))}
          onNext={() => setCal((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))}
        />
      </section>
    </div>
  );
}
