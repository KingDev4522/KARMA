"use client";

import { useEffect, useRef, useState } from "react";
import type { CompletionResponse, Quest, RewardPreview } from "@/lib/types";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/toast";
import { useFocus } from "@/components/focus";
import { Icon, type IconId } from "@/components/illustrations";

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
  if (d <= 4) return "Hard";
  return "Epic";
}
function diffCount(d: number): number {
  if (d <= 1) return 1;
  if (d === 2) return 2;
  if (d <= 4) return 3;
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

/** Fly XP particles from a source element to the coin pill. */
export function burstAt(sourceEl: Element | null, n = 7) {
  try {
    if (document.documentElement.dataset.motion === "off") return;
    const to = document.getElementById("coinPill");
    if (!sourceEl || !to) return;
    const f = sourceEl.getBoundingClientRect();
    const t = to.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i");
      p.className = "xp-particle";
      const sx = f.left + f.width / 2 + (Math.random() - 0.5) * 40;
      const sy = f.top + f.height / 2 + (Math.random() - 0.5) * 20;
      p.style.left = `${sx}px`;
      p.style.top = `${sy}px`;
      document.body.appendChild(p);
      const anim = p.animate(
        [
          { transform: "translate(0,0) scale(1)", opacity: 1 },
          {
            transform: `translate(${t.left + t.width / 2 - sx + (Math.random() - 0.5) * 30}px,${t.top + t.height / 2 - sy}px) scale(.3)`,
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
        <span className="tag">Today&apos;s Quest</span>
        <span className="tag tag--plain">{questActivity(quest)}</span>
        <span className="tag tag--plain">{dueLabel(quest)}</span>
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
          className="btn btn--primary btn--lg"
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
        </div>
        {lastResult && (
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--tint-sage-d)", marginTop: 4 }}>
            Cleared +{lastResult.rewardXp} XP · +{lastResult.rewardCoins} coins
            {lastResult.leveledUp ? ` · Level ${lastResult.newLevel}` : ""}
            {lastResult.rankUp ? ` · Rank up ${lastResult.rankUp.from} → ${lastResult.rankUp.to} (+${lastResult.rankUp.bonusCoins})` : ""}
          </p>
        )}
      </div>
      {attr && <span className="tag tag--plain">{attr.name}</span>}
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
  Move: "vitality",
  Mind: "intellect",
  Create: "craft",
  Connect: "connection",
  Explore: "exploration",
  Focus: "focus",
  Nourish: "vitality",
  Tidy: "discipline",
};
const DIFFS = [
  { label: "Easy", num: 1 },
  { label: "Medium", num: 2 },
  { label: "Hard", num: 3 },
  { label: "Major", num: 4 },
  { label: "Epic", num: 5 },
];
const DURATIONS = [10, 15, 30, 45, 60, 90, 120];
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
  const [recurFreq, setRecurFreq] = useState<"daily" | "weekly">("weekly");
  const [recurDays, setRecurDays] = useState<number[]>([1, 3, 5]);
  const [mapping, setMapping] = useState<{ primary: string; secondary: string } | null>(null);
  const [activity, setActivity] = useState<string>("Move");
  const [preview, setPreview] = useState<RewardPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Offline-tolerant draft (client cache only — the server stays authoritative).
  useEffect(() => {
    if (!open) return;
    try {
      const raw = window.localStorage.getItem("lrp-quest-draft");
      if (!raw) return;
      const d = JSON.parse(raw) as { title?: string; desc?: string; kind?: string; activity?: string };
      if (d.title) setTitle(d.title);
      if (d.desc) setDesc(d.desc);
      if (d.kind) setKind(d.kind);
      if (d.activity) setActivity(d.activity);
    } catch {
      /* corrupt draft is ignored */
    }
  }, [open ]);

  useEffect(() => {
    if (!open) return;
    try {
      window.localStorage.setItem("lrp-quest-draft", JSON.stringify({ title, desc, kind, activity }));
    } catch {
      /* storage blocked — creation still works */
    }
  }, [open, title, desc, kind, activity]);

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
    const qType = kind;
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
  }, [open, step, difficulty, activity, kind]);

  if (!open) return null;

  const create = async () => {
    if (!title.trim()) {
      toast("Give your quest a name first", "i-close");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await client.createQuest(authHeaders(), {
        title: title.trim(),
        description: desc.trim() || undefined,
        questType: kind,
        activityKey: ACTIVITY_KEY[activity],
        difficulty: DIFFS.find((d) => d.label === difficulty)?.num ?? 2,
        estimatedMinutes: duration,
        scheduledFor: dateForWhen(when),
        ...(kind === "routine"
          ? { recurrenceRule: recurFreq === "daily" ? { freq: "daily" as const } : { freq: "weekly" as const, days: [...recurDays].sort() } }
          : {}),
      });
      if (kind === "routine") {
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
              <label htmlFor="dqTitle">Quest title</label>
              <input id="dqTitle" type="text" placeholder="e.g. Practice watercolor for 30 minutes" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} autoFocus />
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
                <button key={d.label} className={`option${difficulty === d.label ? " is-on" : ""}`} onClick={() => setDifficulty(d.label)} aria-pressed={difficulty === d.label}>
                  <strong>{d.label}</strong>
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
                {k.v}
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
          {kind === "routine" && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Repeats</p>
              <div className="chip-row" role="group" aria-label="Repeat frequency">
                {(["daily", "weekly"] as const).map((f) => (
                  <button key={f} className={`chip${recurFreq === f ? " is-on" : ""}`} onClick={() => setRecurFreq(f)} aria-pressed={recurFreq === f}>
                    {f}
                  </button>
                ))}
              </div>
              {recurFreq === "weekly" && (
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
            </div>
          )}
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
                <button key={a} className={`option${activity === a ? " is-on" : ""}`} onClick={() => setActivity(a)} aria-pressed={activity === a}>
                  <strong style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                {activity} · {kind} · {duration} min · {difficulty} · {when}
                {kind === "routine" ? (recurFreq === "daily" ? " · daily" : ` · ${recurDays.length}×/week`) : ""}
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
            <button className="btn btn--primary" onClick={() => setStep((s) => s + 1)}>
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

/* ================= Level-up ================= */

const BURST_COLORS = ["#D4694A", "#E9B95C", "#93AC8E", "#B0A4E6", "#8FBCD4"];

export function LevelUpModal({ level, message, rankUp, onClose }: { level: number; message: string; rankUp?: { from: string; to: string; bonusCoins: number } | null; onClose: () => void }) {
  const burstRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mount = burstRef.current;
    if (!mount || document.documentElement.dataset.motion === "off") return;
    for (let i = 0; i < 26; i++) {
      const s = document.createElement("span");
      s.style.background = BURST_COLORS[i % BURST_COLORS.length];
      mount.appendChild(s);
      const a = Math.random() * Math.PI * 2;
      const d = 90 + Math.random() * 130;
      s.animate(
        [
          { transform: "translate(-50%,-50%) scale(0)", opacity: 1 },
          {
            transform: `translate(${Math.cos(a) * d - 4}px,${Math.sin(a) * d - 4}px) scale(1) rotate(${Math.random() * 360}deg)`,
            opacity: 0,
          },
        ],
        { duration: 900 + Math.random() * 500, easing: "cubic-bezier(.2,.7,.3,1)", delay: i * 22 },
      );
    }
  }, []);

  return (
    <div className="modal-backdrop is-open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal levelup-modal" role="dialog" aria-label={`Level ${level}`}>
        <div className="burst" ref={burstRef} />
        <h3 style={{ marginTop: 6 }}>Level up</h3>
        <div className="lv-num">{level}</div>
        <p>{message}</p>
        {rankUp && (
          <p role="status" style={{ fontWeight: 800, color: "var(--gold)", marginTop: 6 }}>
            Rank up: {rankUp.from} → {rankUp.to} · +{rankUp.bonusCoins} chest
          </p>
        )}
        <button className="btn btn--primary btn--lg" style={{ width: "100%", justifyContent: "center" }} onClick={onClose}>
          Continue the journey
        </button>
      </div>
    </div>
  );
}
