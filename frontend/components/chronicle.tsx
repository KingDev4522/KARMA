"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CaretLeft, CaretRight, Check } from "@phosphor-icons/react";
import { cn, Z } from "@/lib/cn";
import { CompanionSprite } from "./world";

/** Adventure-history timeline (storytelling through data, not a dashboard). */
export function ChronicleTimeline({ items }: { items: { id: string; title: string; detail: string; at: string }[] }) {
  return (
    <ol className="relative ml-2 space-y-4 border-l-2 border-line pl-6" aria-label="Adventure timeline">
      {items.map((it, i) => (
        <motion.li
          key={it.id}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ delay: Math.min(i * 0.04, 0.3) }}
          className="relative"
        >
          <span aria-hidden className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-xp bg-surface-bg" />
          <p className="text-sm font-semibold">{it.title}</p>
          <p className="text-xs text-coin">{it.detail}</p>
          <p className="text-[11px] text-ink-muted">{new Date(it.at).toLocaleString()}</p>
        </motion.li>
      ))}
    </ol>
  );
}

/** 7-week activity heatmap (contribution rhythm). */
export function Heatmap({ days }: { days: { date: string; count: number }[] }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <div className="flex gap-1" role="img" aria-label={`Activity over the last ${days.length} days`}>
      {days.slice(-49).map((d) => (
        <div key={d.date} className="flex flex-1 flex-col gap-1">
          <span
            title={`${d.date}: ${d.count}`}
            className="h-8 w-full rounded-[4px]"
            style={{ backgroundColor: d.count === 0 ? "rgb(var(--surface-overlay))" : `rgb(var(--xp) / ${0.25 + 0.75 * (d.count / max)})` }}
          />
        </div>
      ))}
    </div>
  );
}

/** RPG planning calendar: month overview with quest/routine/milestone/focus markers. */
export function CalendarMonth({
  year,
  month,
  markers,
  onPrev,
  onNext,
}: {
  year: number;
  month: number; // 0-11
  markers: Record<string, { quests: number; routines: number; milestones: number; focus: number }>;
  onPrev: () => void;
  onNext: () => void;
}) {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const cells: (number | null)[] = [...Array<null>(startDay).fill(null)];
  const dim = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= dim; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <div className="rounded-card border border-line bg-surface-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={onPrev} aria-label="Previous month" className="rounded-control p-2 hover:bg-surface-overlay pressable">
          <CaretLeft size={16} />
        </button>
        <h3 className="font-display text-lg">{first.toLocaleString(undefined, { month: "long", year: "numeric" })}</h3>
        <button onClick={onNext} aria-label="Next month" className="rounded-control p-2 hover:bg-surface-overlay pressable">
          <CaretRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-ink-muted" aria-hidden>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const m = markers[key];
          const isToday = key === todayKey;
          return (
            <div
              key={i}
              className={cn("min-h-12 rounded-control border p-1 text-left", isToday ? "border-xp bg-xp/5" : "border-transparent hover:border-line")}
              aria-label={`${key}${m ? `: ${m.quests} quests, ${m.routines} routines` : ""}`}
            >
              <span className={cn("text-xs", isToday ? "font-bold text-xp" : "text-ink-secondary")}>{d}</span>
              {m && (
                <span className="mt-1 flex gap-0.5" aria-hidden>
                  {m.quests > 0 && <i className="h-1.5 w-1.5 rounded-full bg-xp" />}
                  {m.routines > 0 && <i className="h-1.5 w-1.5 rounded-full bg-sage" />}
                  {m.milestones > 0 && <i className="h-1.5 w-1.5 rounded-full bg-coin" />}
                  {m.focus > 0 && <i className="h-1.5 w-1.5 rounded-full bg-coral" />}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-2 flex flex-wrap gap-3 text-[11px] text-ink-muted">
        <span><i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-xp" />quests</span>
        <span><i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-sage" />routines</span>
        <span><i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-coin" />milestones</span>
        <span><i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-coral" />focus</span>
      </p>
    </div>
  );
}

/** Ambient focus timer: enlarged time, breathing environment, crystal-clear controls. */
export function FocusTimer({
  secondsLeft,
  total,
  status,
  questTitle,
  attribute,
  onStart,
  onPause,
  onResume,
  onFinish,
  onCancel,
  started,
}: {
  secondsLeft: number;
  total: number;
  status: string | null;
  questTitle?: string;
  attribute?: string;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
  onCancel: () => void;
  started: boolean;
}) {
  const reduce = useReducedMotion();
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const pct = total ? 1 - secondsLeft / total : 0;
  const R = 96;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative overflow-hidden rounded-panel border border-line bg-surface-elevated px-6 py-10 text-center">
      <div className="pattern-waves pointer-events-none absolute inset-0 opacity-50" aria-hidden />
      {!reduce && started && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-10 bg-xp/5 blur-3xl"
          animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.06, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <div className="relative">
        {questTitle && <p className="text-sm text-ink-secondary">{questTitle}{attribute ? ` · ${attribute}` : ""}</p>}
        <div className="relative mx-auto mt-2 h-56 w-56" role="timer" aria-label={`Time left ${mm} minutes ${ss} seconds, ${status ?? "ready"}`}>
          <svg viewBox="0 0 220 220" className="absolute inset-0" aria-hidden>
            <circle cx="110" cy="110" r={R} fill="none" strokeWidth="10" stroke="rgb(var(--surface-overlay))" />
            <motion.circle
              cx="110" cy="110" r={R} fill="none" stroke="rgb(var(--xp))" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={C} initial={false} animate={{ strokeDashoffset: C * (1 - pct) }} transform="rotate(-90 110 110)"
            />
          </svg>
          <p className="absolute inset-0 flex items-center justify-center font-display text-6xl tabular-nums">{mm}:{ss}</p>
        </div>
        <p className="mt-2 text-sm capitalize text-ink-muted">{status ?? "ready"}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {!started ? (
            <button onClick={onStart} className="rounded-control bg-xp px-6 py-2.5 font-semibold text-white pressable">Begin focus</button>
          ) : status === "running" ? (
            <button onClick={onPause} className="rounded-control border border-xp/50 px-6 py-2.5 pressable">Pause</button>
          ) : status === "paused" ? (
            <button onClick={onResume} className="rounded-control bg-xp px-6 py-2.5 font-semibold text-white pressable">Resume</button>
          ) : null}
          {started && !status?.startsWith("completed") && status !== "cancelled" && (
            <>
              <button onClick={onFinish} className="rounded-control bg-sage px-6 py-2.5 font-semibold text-white pressable">Finish</button>
              <button onClick={onCancel} className="rounded-control border border-line px-6 py-2.5 pressable">Cancel</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Level-up ceremony: environmental pulse + companion + reveals. Brief by design. */
export function LevelUpOverlay({ level, rankDisplay, coins, onDone }: { level: number; rankDisplay: string; coins: number; onDone: () => void }) {
  const reduce = useReducedMotion();
  useEffect(() => {
    const t = window.setTimeout(onDone, reduce ? 2500 : 5200);
    return () => window.clearTimeout(t);
  }, [onDone, reduce]);

  return (
    <motion.div
      role="alertdialog"
      aria-label={`Level up to level ${level}`}
      className="fixed inset-0 flex items-center justify-center bg-ink-primary/50 p-4 backdrop-blur-sm"
      style={{ zIndex: Z.ceremony }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDone}
    >
      <motion.div
        initial={reduce ? false : { scale: 0.85, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
        className="w-full max-w-sm rounded-panel bg-surface-elevated p-8 text-center shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        {!reduce && (
          <motion.div aria-hidden className="mx-auto mb-2 w-fit" animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.15, 1] }} transition={{ duration: 0.9 }}>
            <CompanionSprite mood="celebrating" />
          </motion.div>
        )}
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-muted">Level up</p>
        <motion.p
          className="font-display text-7xl text-xp"
          initial={reduce ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 180, damping: 16 }}
        >
          {level}
        </motion.p>
        <p className="mt-1 font-display text-lg">{rankDisplay}</p>
        <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-coin">
          <Check size={14} weight="bold" aria-hidden /> +{coins} coins bestowed
        </p>
        <button onClick={onDone} autoFocus className="mt-5 w-full rounded-control bg-xp py-2.5 text-sm font-semibold text-white pressable">
          Continue the journey
        </button>
      </motion.div>
    </motion.div>
  );
}
