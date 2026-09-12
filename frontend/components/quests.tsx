"use client";

import { useEffect, useState } from "react";
import type { CompletionResponse, Quest, RewardPreview } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/toast";
import { useFocus } from "@/components/focus";
import { Hero, Icon, type IconId } from "@/components/illustrations";

/* ================= Backend → display mapping ================= */

export const ATTR_META: Record<string, { name: string; icon: IconId }> = {
  strength: { name: "Strength", icon: "i-strength" },
  vitality: { name: "Vitality", icon: "i-vitality" },
  intellect: { name: "Intellect", icon: "i-intellect" },
  focus: { name: "Focus", icon: "i-focusattr" },
  discipline: { name: "Discipline", icon: "i-discipline" },
  craft: { name: "Craft", icon: "i-craft" },
  connection: { name: "Connection", icon: "i-connection" },
  exploration: { name: "Exploration", icon: "i-exploration" },
};

const TYPE_ATTR_FALLBACK: Record<string, string> = {
  quick: "discipline",
  focus: "focus",
  routine: "discipline",
  campaign: "craft",
  challenge: "strength",
  recovery: "vitality",
};

export function questAttrKey(q: Quest): string {
  return q.rewardPreview?.primaryAttr ?? TYPE_ATTR_FALLBACK[q.questType] ?? "focus";
}
export function questXp(q: Quest): number {
  return q.rewardPreview?.rewardXp ?? 10 + (q.difficulty ?? 3) * 8;
}
export function questCoins(q: Quest): number {
  return q.rewardPreview?.rewardCoins ?? 4 + (q.difficulty ?? 3) * 2;
}
export function questActivity(q: Quest): string {
  if (q.activityType?.name) return q.activityType.name;
  return q.questType.charAt(0).toUpperCase() + q.questType.slice(1);
}
export function diffLabel(d: number): string {
  if (d <= 1) return "Easy";
  if (d === 2) return "Medium";
  if (d === 3) return "Hard";
  if (d === 4) return "Major";
  return "Epic";
}
function diffCount(d: number): number {
  if (d <= 1) return 1;
  if (d === 2) return 2;
  if (d === 3) return 3;
  return 4;
}
export function dueLabel(q: Quest): string {
  const day = q.scheduledFor?.slice(0, 10);
  if (day) {
    const today = new Date();
    const t = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (day === t) return "Today";
    const tm = new Date(today);
    tm.setDate(tm.getDate() + 1);
    const t2 = `${tm.getFullYear()}-${String(tm.getMonth() + 1).padStart(2, "0")}-${String(tm.getDate()).padStart(2, "0")}`;
    if (day === t2) return "Tomorrow";
    return new Date(`${day}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (q.dueAt) return new Date(q.dueAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return "Anytime";
}

const ACCENTS = ["sage", "yellow", "lavender", "coral", "sky", "cream"];
export function accentFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ACCENTS[h % ACCENTS.length];
}
export function sizeFor(q: Quest): "s" | "m" | "l" {
  const m = q.estimatedMinutes ?? 30;
  return m >= 60 ? "l" : m >= 30 ? "m" : "s";
}
export function esc(s: string): string {
  return s;
}

/* ================= Bits ================= */

export function DiffDots({ level, title }: { level: number; title?: string }) {
  const n = diffCount(level);
  return (
    <span className="diff-dots" title={title ?? diffLabel(level)}>
      {[1, 2, 3, 4].map((i) => (
        <i key={i} className={i <= n ? "on" : ""} />
      ))}
    </span>
  );
}

/** Fly XP particles from a source element to coin pill + level ring (subtle RPG). */
export function burstAt(sourceEl: Element | null, n = 9) {
  try {
    if (document.documentElement.dataset.motion === "off") return;
    const toCoin = document.getElementById("coinPill");
    const toRing = document.getElementById("lvlRing");
    const to = toCoin ?? toRing;
    if (!sourceEl || !to) return;
    const f = sourceEl.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      const useRing = !!toRing && i % 3 === 0;
      const target = (useRing ? toRing : toCoin) as HTMLElement;
      const tr = target.getBoundingClientRect();
      const p = document.createElement("i");
      p.className = "xp-particle";
      if (i % 4 === 0) p.style.background = "var(--accent)";
      const sx = f.left + f.width / 2 + (Math.random() - 0.5) * 40;
      const sy = f.top + f.height / 2 + (Math.random() - 0.5) * 20;
      p.style.left = `${sx}px`;
      p.style.top = `${sy}px`;
      document.body.appendChild(p);
      const anim = p.animate(
        [
          { transform: "translate(0,0) scale(1)", opacity: 1 },
          {
            transform: `translate(${tr.left + tr.width / 2 - sx + (Math.random() - 0.5) * 30}px,${tr.top + tr.height / 2 - sy}px) scale(.3)`,
            opacity: 0.9,
          },
        ],
        { duration: 650 + Math.random() * 350, easing: "cubic-bezier(.4,0,.6,1)", delay: i * 45 },
      );
      anim.onfinish = () => p.remove();
    }
  } catch {
    /* decorative only */
  }
}

export function shakeCoins() {
  const pill = document.getElementById("coinPill");
  if (!pill) return;
  pill.classList.add("shake");
  setTimeout(() => pill.classList.remove("shake"), 450);
}

/* ================= Cards ================= */

export function QuestPrimary({
  quest,
  onComplete,
  completing,
}: {
  quest: Quest;
  onComplete: (q: Quest, el: HTMLElement | null) => void;
  completing?: boolean;
}) {
  const { openFocus } = useFocus();
  const attr = ATTR_META[questAttrKey(quest)] ?? { name: questAttrKey(quest), icon: "i-spark" as IconId };
  return (
    <article className="panel primary-quest" aria-label={`Primary quest: ${quest.title}`}>
      <div className="pq-top">
        <span className="tag tag--accent">Today&apos;s Quest</span>
        <span className="tag">{questActivity(quest)}</span>
        <span className="tag">{dueLabel(quest)}</span>
      </div>
      <h3>{quest.title}</h3>
      {quest.description && <p className="desc">{quest.description}</p>}
      <div className="pq-meta">
        <span className="meta-chip">
          <DiffDots level={quest.difficulty ?? 3} />
          &nbsp;{diffLabel(quest.difficulty ?? 3)}
        </span>
        <span className="meta-chip">
          <Icon id="i-clock" />
          {quest.estimatedMinutes ? `${quest.estimatedMinutes} min` : "unsized"}
        </span>
        <span className="meta-chip">
          <Icon id={attr.icon} />
          {attr.name}
        </span>
        <span className="meta-chip xp">+{questXp(quest)} XP</span>
        <span className="meta-chip coin">
          <Icon id="i-coin" />
          {questCoins(quest)}
        </span>
      </div>
      <div className="pq-actions">
        <button
          className="btn btn--accent btn--lg"
          disabled={!!completing}
          onClick={(e) => onComplete(quest, e.currentTarget as HTMLElement)}
        >
          <Icon id="i-check" style={{ width: 16, height: 16 }} />
          {completing ? "Completing…" : "Complete Quest"}
        </button>
        <button
          className="btn btn--ghost btn--lg"
          onClick={() => openFocus({ id: quest.id, title: quest.title, minutes: Math.min(quest.estimatedMinutes ?? 25, 50) })}
        >
          <Icon id="i-play" style={{ width: 16, height: 16 }} />
          Focus
        </button>
      </div>
    </article>
  );
}

export function QuestMasonryCard({
  quest,
  index = 0,
  onComplete,
}: {
  quest: Quest;
  index?: number;
  onComplete: (q: Quest, el: HTMLElement | null) => void;
}) {
  const done = quest.status === "completed";
  return (
    <article
      className={`quest-card quest-card--${accentFor(quest.id)} quest-card--${sizeFor(quest)}${done ? " is-done" : ""}`}
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
      aria-label={`Quest: ${quest.title}`}
    >
      <div className="qc-top">
        <span className="qc-cat">{questActivity(quest)}</span>
        <button
          className="quest-check"
          disabled={done}
          onClick={(e) => onComplete(quest, e.currentTarget as HTMLElement)}
          title={done ? "Completed" : "Complete quest"}
          aria-label={done ? "Completed" : `Complete quest ${quest.title}`}
        >
          <Icon id="i-check" />
        </button>
      </div>
      <h4 className="qc-title">{quest.title}</h4>
      <div className="qc-meta">
        <span>
          <Icon id="i-clock" />
          {quest.estimatedMinutes ? `${quest.estimatedMinutes}m` : "unsized"}
        </span>
        <DiffDots level={quest.difficulty ?? 3} />
        <span className="qc-xp">+{questXp(quest)} XP</span>
        <span className="qc-coin">
          <Icon id="i-coin" style={{ width: 12, height: 12 }} />
          {questCoins(quest)}
        </span>
      </div>
    </article>
  );
}

export function QuestRow({
  quest,
  index = 0,
  onComplete,
  lastResult,
  onChanged,
}: {
  quest: Quest;
  index?: number;
  onComplete: (q: Quest, el: HTMLElement | null) => void;
  lastResult?: CompletionResponse | null;
  onChanged?: () => void;
}) {
  const { authHeaders } = useAuth();
  const toast = useToast();
  const { openFocus } = useFocus();
  const [manage, setManage] = useState(false);
  const [editing, setEditing] = useState(false);
  const [eTitle, setETitle] = useState(quest.title);
  const [eDesc, setEDesc] = useState(quest.description ?? "");
  const [eDue, setEDue] = useState((quest.dueAt ?? "").slice(0, 10));
  const [busy, setBusy] = useState(false);
  const done = quest.status === "completed" || !!lastResult;
  const attr = ATTR_META[questAttrKey(quest)];

  const mutate = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast(ok, "i-check");
      setManage(false);
      setEditing(false);
      onChanged?.();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't update quest. Nothing was changed.", "i-close");
    } finally {
      setBusy(false);
    }
  };
  return (
    <article
      className={`quest-row${done ? " is-done" : ""}`}
      style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
      aria-label={`Quest: ${quest.title}`}
    >
      <button
        className="quest-check"
        disabled={done}
        onClick={(e) => onComplete(quest, e.currentTarget as HTMLElement)}
        title={done ? "Completed" : "Complete quest"}
        aria-label={done ? "Completed" : `Complete quest ${quest.title}`}
      >
        <Icon id="i-check" />
      </button>
      <div className="qr-main">
        <h4>{quest.title}</h4>
        <div className="qr-meta">
          <span>{questActivity(quest)}</span>
          <span>{dueLabel(quest)}</span>
          <span>{diffLabel(quest.difficulty ?? 3)}</span>
          <DiffDots level={quest.difficulty ?? 3} />
          <span><Icon id="i-clock" />{quest.estimatedMinutes ? `${quest.estimatedMinutes}m` : "—"}</span>
          {quest.questType === "routine" && quest.recurrenceRule ? (
            <span>{describeRule(quest.recurrenceRule as any)}</span>
          ) : null}
        </div>
        {lastResult && (
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--tint-sage-d)", marginTop: 4 }}>
            Cleared +{lastResult.rewardXp} XP · +{lastResult.rewardCoins} coins
            {lastResult.leveledUp ? ` · Level ${lastResult.newLevel}` : ""}
            {lastResult.rankUp ? ` · Rank up ${lastResult.rankUp.from} → ${lastResult.rankUp.to} (+${lastResult.rankUp.bonusCoins})` : ""}
          </p>
        )}
      </div>
      {attr && <span className="tag">{attr.name}</span>}
      <span className="qr-xp">+{lastResult ? lastResult.rewardXp : questXp(quest)} XP</span>
      <span className="qr-coin">
        <Icon id="i-coin" />+{lastResult ? lastResult.rewardCoins : questCoins(quest)}
      </span>
      <div className="qr-actions">
        {!done && (
          <button
            className="icon-btn"
            onClick={() => openFocus({ id: quest.id, title: quest.title, minutes: Math.min(quest.estimatedMinutes ?? 25, 50) })}
            title="Focus"
            aria-label={`Focus on ${quest.title}`}
          >
            <Icon id="i-play" />
          </button>
        )}
        {onChanged && !done && (
          <button
            className="icon-btn"
            onClick={() => setManage((v) => !v)}
            title="Manage quest"
            aria-label={`Manage quest ${quest.title}`}
            aria-expanded={manage}
          >
            <Icon id="i-settings" />
          </button>
        )}
      </div>
      {manage && onChanged && !done && (
        <div className="qr-manage" style={{ marginTop: 8, borderTop: "1px dashed var(--line)", paddingTop: 8 }}>
          {!editing ? (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button className="chip" onClick={() => { setETitle(quest.title); setEDesc(quest.description ?? ""); setEDue((quest.dueAt ?? "").slice(0, 10)); setEditing(true); }} disabled={busy}>
                {quest.isPinned ? "★ " : ""}Edit
              </button>
              <button
                className="chip"
                disabled={busy}
                onClick={() => mutate(() => client.patchQuest(authHeaders(), quest.id, { isPinned: !quest.isPinned }), quest.isPinned ? "Unpinned from Today" : "Pinned to Today")}
              >
                {quest.isPinned ? "Unpin" : "Pin today"}
              </button>
              {quest.status !== "skipped" ? (
                <button className="chip" disabled={busy} onClick={() => mutate(() => client.patchQuest(authHeaders(), quest.id, { status: "skipped" }), "Quest skipped — reschedule anytime")}>
                  Skip
                </button>
              ) : (
                <button className="chip" disabled={busy} onClick={() => mutate(() => client.patchQuest(authHeaders(), quest.id, { status: "active" }), "Quest back on the board")}>
                  Re-queue
                </button>
              )}
              <button
                className="chip"
                disabled={busy}
                onClick={() => {
                  if (window.confirm(`Archive “${quest.title}”? History and rewards are kept.`)) {
                    mutate(() => client.deleteQuest(authHeaders(), quest.id), "Quest archived — history kept");
                  }
                }}
              >
                Archive
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!eTitle.trim()) return;
                mutate(
                  () => client.patchQuest(authHeaders(), quest.id, { title: eTitle.trim(), description: eDesc.trim() || undefined, dueAt: eDue || null }),
                  "Quest updated",
                );
              }}
              style={{ display: "grid", gap: 6 }}
            >
              <input value={eTitle} onChange={(e) => setETitle(e.target.value)} aria-label="Quest title" maxLength={200} style={{ width: "100%" }} />
              <input value={eDesc} onChange={(e) => setEDesc(e.target.value)} aria-label="Quest description" placeholder="Description (optional)" style={{ width: "100%" }} />
              <input type="date" value={eDue} onChange={(e) => setEDue(e.target.value)} aria-label="Due date" />
              <span style={{ display: "flex", gap: 6 }}>
                <button type="submit" className="chip" disabled={busy || !eTitle.trim()}>Save</button>
                <button type="button" className="chip" onClick={() => setEditing(false)}>Cancel</button>
              </span>
            </form>
          )}
        </div>
      )}
    </article>
  );
}

/* ================= Quest creator (5-step wizard) ================= */

const ACTIVITIES = ["Move", "Mind", "Create", "Connect", "Explore", "Focus", "Nourish", "Tidy"] as const;
const ACTIVITY_KEY: Record<string, string> = {
  Move: "cardio",
  Mind: "study_learning",
  Create: "creative_practice",
  Connect: "social_collab",
  Explore: "exploration",
  Focus: "deep_work",
  Nourish: "recovery",
  Tidy: "life_admin",
};
const ACTIVITY_ATTR: Record<string, string> = {
  Move: "strength",
  Mind: "intellect",
  Create: "craft",
  Connect: "connection",
  Explore: "exploration",
  Focus: "focus",
  Nourish: "vitality",
  Tidy: "discipline",
};
const DIFFS = [
  { label: "Easy", num: 1, diff: 1 },
  { label: "Medium", num: 2, diff: 2 },
  { label: "Hard", num: 3, diff: 3 },
  { label: "Major", num: 4, diff: 4 },
  { label: "Epic", num: 5, diff: 5 },
];
const DURATIONS = [2, 5, 10, 15, 20, 30, 45, 60, 90, 120];
const WHENS = ["Today", "Tomorrow", "This weekend", "Someday"] as const;
const KINDS = [
  { v: "quick", hint: "1–15 min · fast win" },
  { v: "focus", hint: "deep work + timer" },
  { v: "routine", hint: "repeats on a schedule" },
  { v: "campaign", hint: "a slice of a big goal" },
  { v: "challenge", hint: "time-boxed push" },
  { v: "recovery", hint: "rest and maintenance" },
] as const;
const DOW = ["S", "M", "T", "W", "T", "F", "S"] as const;
const STEP_QUESTIONS = ["What are you working on?", "How much effort?", "When?", "What kind of activity?", "Your reward"];

function dateForWhen(when: string): string | undefined {
  const d = new Date();
  if (when === "Today") return d.toISOString().slice(0, 10);
  if (when === "Tomorrow") {
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  if (when === "This weekend") {
    const add = (6 - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + add);
    return d.toISOString().slice(0, 10);
  }
  return undefined;
}

export type RepeatEnds =
  | { type: "never" }
  | { type: "on"; date: string }
  | { type: "after"; count: number };

export interface RepeatRule {
  freq: "daily" | "weekly" | "custom";
  days?: number[];
  every?: number;
  unit?: "day" | "week";
  ends?: RepeatEnds;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** Human sentence for a recurrence rule ("Every 3 days · ends after 10"). */
export function describeRule(rule?: RepeatRule | null): string {
  if (!rule) return "Does not repeat";
  const endBit =
    !rule.ends || rule.ends.type === "never"
      ? ""
      : rule.ends.type === "on"
        ? ` · ends ${rule.ends.date}`
        : ` · ends after ${rule.ends.count}`;
  if (rule.freq === "daily") return `Daily${endBit}`;
  if (rule.freq === "weekly") {
    const days = [...(rule.days ?? [])].sort((a, b) => a - b);
    const dayBit = days.length === 7 ? "" : days.length > 0 ? ` · ${days.map((d) => DAY_NAMES[d]).join(", ")}` : "";
    return `Weekly${dayBit}${endBit}`;
  }
  const every = Math.min(30, Math.max(1, Math.floor(rule.every ?? 1)));
  const unit = rule.unit === "week" ? "week" : "day";
  const unitBit = every === 1 ? unit : `${unit}s`;
  const dayBit =
    unit === "week"
      ? (() => {
          const days = [...(rule.days ?? [])].sort((a, b) => a - b);
          return days.length > 0 && days.length < 7 ? ` · ${days.map((d) => DAY_NAMES[d]).join(", ")}` : "";
        })()
      : "";
  return `Every ${every} ${unitBit}${dayBit}${endBit}`;
}

export function QuestCreator({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { authHeaders } = useAuth();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [duration, setDuration] = useState(30);
  const [when, setWhen] = useState<string>("Today");
  const [kind, setKind] = useState<string>("quick");
  const [repeat, setRepeat] = useState<"once" | "daily" | "weekly" | "custom">("once");
  const [recurDays, setRecurDays] = useState<number[]>([1, 3, 5]);
  const [customEvery, setCustomEvery] = useState(2);
  const [customUnit, setCustomUnit] = useState<"day" | "week">("day");
  const [endsType, setEndsType] = useState<"never" | "on" | "after">("never");
  const [endsDate, setEndsDate] = useState("");
  const [endsCount, setEndsCount] = useState(10);
  const [mapping, setMapping] = useState<{ primary: string; secondary: string } | null>(null);
  const [activity, setActivity] = useState<string>("Move");
  const [preview, setPreview] = useState<RewardPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Offline-tolerant draft (client cache only — the server stays authoritative).
  // Reads tolerate drafts saved by older versions (missing fields → defaults).
  useEffect(() => {
    if (!open) return;
    try {
      const raw = window.localStorage.getItem("lrp-quest-draft");
      if (!raw) return;
      const d = JSON.parse(raw) as {
        title?: string; desc?: string; kind?: string; activity?: string; repeat?: string;
        recurDays?: number[];
        customEvery?: number; customUnit?: "day" | "week";
        endsType?: "never" | "on" | "after"; endsDate?: string; endsCount?: number;
      };
      if (d.title) setTitle(d.title);
      if (d.desc) setDesc(d.desc);
      if (d.kind) setKind(d.kind);
      if (d.activity) setActivity(d.activity);
      if (d.repeat === "once" || d.repeat === "daily" || d.repeat === "weekly" || d.repeat === "custom") setRepeat(d.repeat);
      if (Array.isArray(d.recurDays)) setRecurDays(d.recurDays.filter((n) => Number.isInteger(n) && n >= 0 && n <= 6));
      if (Number.isFinite(d.customEvery)) setCustomEvery(Math.min(30, Math.max(1, Math.floor(d.customEvery as number))));
      if (d.customUnit === "day" || d.customUnit === "week") setCustomUnit(d.customUnit);
      if (d.endsType === "never" || d.endsType === "on" || d.endsType === "after") setEndsType(d.endsType);
      if (typeof d.endsDate === "string") setEndsDate(d.endsDate);
      if (Number.isFinite(d.endsCount)) setEndsCount(Math.min(100, Math.max(1, Math.floor(d.endsCount as number))));
    } catch {
      /* corrupt draft is ignored */
    }
  }, [open ]);

  useEffect(() => {
    if (!open) return;
    try {
      window.localStorage.setItem(
        "lrp-quest-draft",
        JSON.stringify({ title, desc, kind, activity, repeat, recurDays, customEvery, customUnit, endsType, endsDate, endsCount }),
      );
    } catch {
      /* storage blocked — creation still works */
    }
  }, [open, title, desc, kind, activity, repeat, recurDays, customEvery, customUnit, endsType, endsDate, endsCount]);

  useEffect(() => {
    if (open) {
      setStep(1);
      setError(null);
      setPreview(null);
      setMapping(null);
    }
  }, [open ]);

  useEffect(() => {
    if (!open || step !== 5) return;
    let alive = true;
    setPreview(null);
    const diffNum = DIFFS.find((d) => d.label === difficulty)?.num ?? 2;
    const qType = rulePreview ? "routine" : kind;
    const aKey = ACTIVITY_KEY[activity];
    Promise.all([
      client.previewQuest(authHeaders(), { difficulty: diffNum, questType: qType, activityKey: aKey }).catch(() => null),
      client.suggestMapping(authHeaders(), aKey).catch(() => null),
    ]).then(([pv, map]) => {
      if (!alive) return;
      setPreview(pv);
      setMapping(map);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step, difficulty, activity, kind, repeat]);

  if (!open) return null;

  /** Rule for the payload, or null for a one-time quest. */
  const buildRule = (): RepeatRule | null => {
    if (repeat === "once") return null;
    if (repeat === "daily") return { freq: "daily" };
    if (repeat === "weekly") return { freq: "weekly", days: [...recurDays].sort() };
    const every = Math.min(30, Math.max(1, Math.floor(customEvery) || 1));
    const ends: RepeatEnds =
      endsType === "on" && /^\d{4}-\d{2}-\d{2}$/.test(endsDate)
        ? { type: "on", date: endsDate }
        : endsType === "after"
          ? { type: "after", count: Math.min(100, Math.max(1, Math.floor(endsCount) || 1)) }
          : { type: "never" };
    return customUnit === "week"
      ? { freq: "custom", every, unit: "week", days: [...recurDays].sort(), ends }
      : { freq: "custom", every, unit: "day", ends };
  };

  const rulePreview = buildRule();

  const create = async () => {
    if (!title.trim()) {
      toast("Give your quest a name first", "i-close");
      return;
    }
    if (repeat === "custom" && endsType === "on" && !/^\d{4}-\d{2}-\d{2}$/.test(endsDate)) {
      setError("Pick an end date for the custom repeat.");
      return;
    }
    if (repeat === "custom" && endsType === "on" && endsDate < new Date().toISOString().slice(0, 10)) {
      setError("The end date is in the past — pick today or later.");
      return;
    }
    const usesWeekdays = repeat === "weekly" || (repeat === "custom" && customUnit === "week");
    if (usesWeekdays && recurDays.length === 0) {
      setError("Pick at least one weekday for a weekly repeat.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const rule = buildRule();
      const created = await client.createQuest(authHeaders(), {
        title: title.trim(),
        description: desc.trim() || undefined,
        questType: rule ? "routine" : kind,
        activityKey: ACTIVITY_KEY[activity],
        difficulty: DIFFS.find((d) => d.label === difficulty)?.num ?? 2,
        estimatedMinutes: duration,
        scheduledFor: dateForWhen(when),
        ...(rule ? { recurrenceRule: rule } : {}),
      });
      if (rule) {
        const today = new Date().toISOString().slice(0, 10);
        const end = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
        await client.genInstances(authHeaders(), created.id, today, end).catch(() => undefined);
      }
      try {
        window.localStorage.removeItem("lrp-quest-draft");
      } catch {
        /* ignore */
      }
      setTitle("");
      setDesc("");
      onCreated();
      onClose();
      toast("Quest created. The path awaits.", "i-spark");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create quest. Nothing was written.");
    } finally {
      setBusy(false);
    }
  };

  const attrKey = preview?.primaryAttr ?? mapping?.primary ?? ACTIVITY_ATTR[activity];
  const attr = ATTR_META[attrKey] ?? { name: attrKey, icon: "i-spark" as IconId };

  return (
    <div className={`modal-backdrop${open ? " is-open" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-label="Create quest">
        <div className="modal-head">
          <div>
            <h3>Create quest</h3>
            <p className="sub">
              Step {step} of 5 — {STEP_QUESTIONS[step - 1]}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon id="i-close" />
          </button>
        </div>
        <div className="wizard-steps" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((i) => (
            <i key={i} className={i <= step ? "on" : ""} />
          ))}
        </div>

        {step === 1 && (
          <>
            <div className="field">
              <label htmlFor="dqTitle">What are you working on?</label>
              <input id="dqTitle" className="cmd-input" type="text" placeholder="Name the quest" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} autoFocus />
            </div>
            <div className="field">
              <label htmlFor="dqDesc">Description (optional)</label>
              <textarea id="dqDesc" rows={3} placeholder="What does done look like?" value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div className="option-grid">
              {DIFFS.map((d) => (
                <button key={d.label} data-diff={d.diff} className={`option${difficulty === d.label ? " is-on" : ""}`} onClick={() => setDifficulty(d.label)} aria-pressed={difficulty === d.label}>
                  <strong className="diff-name"><span className="diff-dot" aria-hidden />{d.label}</strong>
                  <span>{"●".repeat({ Easy: 1, Medium: 2, Hard: 3, Major: 4, Epic: 5 }[d.label] ?? 2)} · level {d.num}</span>
                </button>
              ))}
            </div>
            <div className="field" style={{ marginTop: 18 }}>
              <label>Estimated duration</label>
              <div className="chip-row">
                {DURATIONS.map((m) => (
                  <button key={m} className={`chip${duration === m ? " is-on" : ""}`} onClick={() => setDuration(m)} aria-pressed={duration === m}>
                    {m} min
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      {step === 3 && (
        <>
          <div className="chip-row" role="group" aria-label="Quest kind">
            {KINDS.map((k) => (
              <button key={k.v} className={`chip${kind === k.v ? " is-on" : ""}`} onClick={() => setKind(k.v)} aria-pressed={kind === k.v} title={k.hint}>
                {k.v.charAt(0).toUpperCase() + k.v.slice(1)}
              </button>
            ))}
          </div>
          <div className="chip-row" style={{ marginTop: 12 }}>
            {WHENS.map((w) => (
              <button key={w} className={`chip${when === w ? " is-on" : ""}`} onClick={() => setWhen(w)} aria-pressed={when === w}>
                {w}
              </button>
            ))}
          </div>
          {(repeat === "daily" || repeat === "weekly" || repeat === "custom") && kind !== "routine" ? (
            <p style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 600 }}>
              Repeating quests travel as routines — the quest type will be set accordingly.
            </p>
          ) : null}
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Repeats</p>
              <div className="chip-row" role="group" aria-label="Repeat">
                {(["once", "daily", "weekly", "custom"] as const).map((f) => (
                  <button key={f} className={`chip${repeat === f ? " is-on" : ""}`} onClick={() => setRepeat(f)} aria-pressed={repeat === f} title={f === "once" ? "One time only — never repeats" : f === "custom" ? "Your own rhythm: interval and end" : `Repeats ${f}`}>
                    {f === "once" ? "Once" : f === "daily" ? "Daily" : f === "weekly" ? "Weekly" : "Custom"}
                  </button>
                ))}
              </div>
              {(repeat === "weekly" || (repeat === "custom" && customUnit === "week")) && (
                <div className="chip-row" style={{ marginTop: 8 }} role="group" aria-label="Repeat days">
                  {DOW.map((d, i) => (
                    <button
                      key={i}
                      className={`chip${recurDays.includes(i) ? " is-on" : ""}`}
                      onClick={() => setRecurDays((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))}
                      aria-pressed={recurDays.includes(i)}
                      aria-label={["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][i]}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
              {repeat === "custom" && (
                <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                  <div>
                    <p style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Every</p>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <button className="chip" onClick={() => setCustomEvery((n) => Math.max(1, n - 1))} aria-label="Decrease interval">−</button>
                        <strong aria-live="polite" style={{ minWidth: 24, textAlign: "center" }}>{customEvery}</strong>
                        <button className="chip" onClick={() => setCustomEvery((n) => Math.min(30, n + 1))} aria-label="Increase interval">+</button>
                      </span>
                      <span className="chip-row" role="group" aria-label="Interval unit">
                        {(["day", "week"] as const).map((u) => (
                          <button key={u} className={`chip${customUnit === u ? " is-on" : ""}`} onClick={() => setCustomUnit(u)} aria-pressed={customUnit === u}>
                            {customEvery === 1 ? u : `${u}s`}
                          </button>
                        ))}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Ends</p>
                    <div className="chip-row" role="group" aria-label="End condition">
                      {(["never", "on", "after"] as const).map((t) => (
                        <button key={t} className={`chip${endsType === t ? " is-on" : ""}`} onClick={() => setEndsType(t)} aria-pressed={endsType === t}>
                          {t === "never" ? "Never" : t === "on" ? "On date" : "After…"}
                        </button>
                      ))}
                    </div>
                    {endsType === "on" && (
                      <input type="date" value={endsDate} onChange={(e) => setEndsDate(e.target.value)} aria-label="End date" style={{ marginTop: 8, width: "100%" }} />
                    )}
                    {endsType === "after" && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                        <button className="chip" onClick={() => setEndsCount((n) => Math.max(1, n - 1))} aria-label="Decrease occurrences">−</button>
                        <strong aria-live="polite" style={{ minWidth: 60, textAlign: "center", fontSize: 13 }}>{endsCount} times</strong>
                        <button className="chip" onClick={() => setEndsCount((n) => Math.min(100, n + 1))} aria-label="Increase occurrences">+</button>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          <p style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 16, fontWeight: 600 }}>
            You can reschedule any time from the Quests page.
          </p>
        </>
      )}
        {step === 4 && (
          <div className="option-grid">
            {ACTIVITIES.map((a) => {
              const at = ATTR_META[ACTIVITY_ATTR[a]];
              return (
                <button key={a} data-act={a} className={`option${activity === a ? " is-on" : ""}`} onClick={() => setActivity(a)} aria-pressed={activity === a}>
                  <strong className="act-name">
                    <span className="act-dot" aria-hidden />
                    <Icon id={at.icon} style={{ width: 16, height: 16 }} />
                    {a}
                  </strong>
                  <span>Grows {at.name}</span>
                </button>
              );
            })}
          </div>
        )}
        {step === 5 && (
          <>
            <div className="reward-preview">
              <h4>{title.trim() || "Untitled quest"}</h4>
              <p style={{ fontSize: 12.5, color: "var(--text-3)", fontWeight: 600 }}>
                {activity} · {rulePreview ? "routine" : kind} · {duration} min · {difficulty} · {when}
                {" · "}{describeRule(rulePreview)}
              </p>
              <div className="rp-rows">
                <span className="meta-chip xp">+{preview ? preview.rewardXp : "…"}&nbsp;XP</span>
                <span className="meta-chip coin">
                  <Icon id="i-coin" />
                  {preview ? preview.rewardCoins : "…"}
                </span>
                <span className="meta-chip">
                  <Icon id={attr.icon} />
                  {attr.name}
                </span>
              </div>
              {preview?.capped && (
                <p style={{ fontSize: 12, color: "var(--accent-text)", marginTop: 8, fontWeight: 700 }}>
                  Capped today{preview.capReason ? ` — ${preview.capReason}` : ""}
                </p>
              )}
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 14, fontWeight: 600 }}>
              Rewards are server-calculated — no math required on your side.
            </p>
          </>
        )}

        {error && (
          <p role="alert" style={{ fontSize: 13, color: "var(--accent-text)", marginTop: 12 }}>
            {error}
          </p>
        )}

        <div className="modal-foot">
          <button className="btn btn--quiet" style={{ visibility: step === 1 ? "hidden" : "visible" }} onClick={() => setStep((s) => Math.max(1, s - 1))}>
            Back
          </button>
          {step < 5 ? (
            <button
              className="btn btn--primary"
              disabled={step === 1 && !title.trim()}
              onClick={() => {
                if (step === 1 && !title.trim()) {
                  toast("Give your quest a name first", "i-close");
                  return;
                }
                setStep((s) => s + 1);
              }}
            >
              Continue
            </button>
          ) : (
            <button className="btn btn--primary" onClick={create} disabled={busy || !title.trim()}>
              {busy ? "Creating…" : "Create Quest"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= Level-up — luxury minimal sequence ================= */

function CountUp({ to, duration = 700 }: { to: number; duration?: number }) {
  const [n, setN] = useState(0);
  const reduced = typeof document !== "undefined" && (document.documentElement.dataset.motion === "off" || window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    if (reduced) { setN(to); return; }
    let raf = 0; const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration, reduced]);
  return <>{n}</>;
}

export function LevelUpModal({ level, message, rankUp, onClose }: { level: number; message: string; rankUp?: { from: string; to: string; bonusCoins: number } | null; onClose: () => void }) {
  const reduced = typeof document !== "undefined" && (document.documentElement.dataset.motion === "off" || window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <AnimatePresence>
      <motion.div className="modal-backdrop is-open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.22 }}>
        <motion.div className="modal levelup-modal" role="dialog" aria-modal="true" aria-label={`Level ${level}`} initial={reduced ? false : { scale: 0.96, y: 12, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.98, y: 8, opacity: 0 }} transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 20 }}>
          <div className="lv-ring" aria-hidden="true" />
          <Hero width={120} className="lv-hero idle" />
          <h3>Level up</h3>
          <div className="lv-num"><CountUp to={level} /></div>
          {rankUp && (
            <motion.p className="lv-rank" role="status" initial={reduced ? false : { scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 18, delay: 0.18 }}>
              <span className="seal" aria-hidden="true">
                <Icon id="i-check" />
              </span>
              {rankUp.from} → {rankUp.to} · +{rankUp.bonusCoins} coins
            </motion.p>
          )}
          <p>{message}</p>
          <button className="btn btn--primary btn--lg" style={{ width: "100%", justifyContent: "center" }} onClick={onClose} autoFocus>
            Continue
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
