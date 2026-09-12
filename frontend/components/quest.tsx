"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarBlank, Check, CaretDown, Clock, Play } from "@phosphor-icons/react";
import type { CompletionResponse, Quest } from "@/lib/types";
import { ATTRIBUTE_META, RewardPreview } from "./rpg";
import { Modal, Field, inputCls, useToast } from "./ui";
import { client } from "@/lib/api";
import { cn } from "@/lib/cn";

const DIFFICULTY_LABEL = ["", "Tiny", "Light", "Standard", "Major", "Epic"] as const;

/** Mission object: hierarchy-led, tactile, expandable. */
export function QuestCard({
  quest,
  onComplete,
  onStartFocus,
  completing,
  lastResult,
}: {
  quest: Quest;
  onComplete: (q: Quest) => void;
  onStartFocus?: (q: Quest) => void;
  completing?: boolean;
  lastResult?: CompletionResponse | null;
}) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const pv = quest.rewardPreview;
  const done = quest.status === "completed";
  const due = quest.dueAt ? new Date(quest.dueAt).toLocaleDateString() : quest.scheduledFor ?? null;

  return (
    <motion.article
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group rounded-card border border-line bg-surface-card p-4 shadow-card transition-shadow hover:shadow-lift pressable",
        done && "opacity-70",
      )}
      aria-label={`Quest: ${quest.title}`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => !done && onComplete(quest)}
          disabled={done || completing}
          aria-label={done ? "Quest completed" : `Complete quest ${quest.title}`}
          aria-pressed={done}
          className={cn(
            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            done ? "border-sage bg-sage text-white" : "border-ink-muted hover:border-xp",
          )}
        >
          {(done || completing) && <Check size={15} weight="bold" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className={cn("font-medium leading-snug", done && "line-through decoration-ink-muted")}>{quest.title}</h3>
            <span className="shrink-0 rounded-full bg-surface-overlay px-2 py-0.5 text-[11px] font-medium capitalize text-ink-secondary">
              {quest.questType}
              {quest.status === "in_progress" ? " · active" : ""}
            </span>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1">
              <Clock size={12} aria-hidden /> {quest.estimatedMinutes ? `${quest.estimatedMinutes} min` : "unsized"}
            </span>
            <span aria-hidden>·</span>
            <span>{DIFFICULTY_LABEL[quest.difficulty] ?? ""}</span>
            {quest.activityType && (
              <>
                <span aria-hidden>·</span>
                <span>{quest.activityType.name}</span>
              </>
            )}
            {due && (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <CalendarBlank size={12} aria-hidden /> {due}
                </span>
              </>
            )}
          </p>
          {pv && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs">
              <RewardPreview xp={pv.rewardXp} coins={pv.rewardCoins} capped={pv.capped} />
              <span className="text-ink-muted">
                {ATTRIBUTE_META[pv.primaryAttr]?.name ?? pv.primaryAttr} +{pv.primaryXp} ·{" "}
                {ATTRIBUTE_META[pv.secondaryAttr]?.name ?? pv.secondaryAttr} +{pv.secondaryXp}
              </span>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {lastResult && (
          <motion.p
            role="status"
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-2 overflow-hidden text-xs font-medium text-sage"
          >
            Cleared: +{lastResult.rewardXp} XP · {lastResult.companion.message}
            {lastResult.leveledUp ? ` · Level ${lastResult.newLevel}!` : ""}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-2.5 flex items-center gap-2 pl-10">
        {onStartFocus && quest.questType === "focus" && !done && (
          <button
            onClick={() => onStartFocus(quest)}
            className="inline-flex items-center gap-1 rounded-control border border-xp/40 px-2.5 py-1 text-xs font-medium pressable"
          >
            <Play size={12} weight="fill" aria-hidden /> Focus
          </button>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1 rounded-control px-2 py-1 text-xs text-ink-secondary hover:bg-surface-overlay"
        >
          Details
          <CaretDown size={12} className={cn("transition-transform", open && "rotate-180")} aria-hidden />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-1 border-t border-line pt-2 pl-10 text-xs text-ink-secondary">
              {quest.description && <p>{quest.description}</p>}
              <p>
                Effort {quest.difficulty}/5 · {quest.isPinned ? "Pinned for today. " : ""}
                {quest.campaignId ? "Linked to a campaign. " : ""}
                {pv?.previewNote ?? ""}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

const TYPES = [
  { v: "quick", hint: "1–15 min · fast win" },
  { v: "focus", hint: "15–120 min · deep work + timer" },
  { v: "routine", hint: "repeats on a schedule" },
  { v: "campaign", hint: "a slice of a big goal" },
  { v: "challenge", hint: "time-boxed push" },
  { v: "recovery", hint: "rest and maintenance" },
];

const EFFORTS = [
  { v: 1, label: "Tiny", hint: "1–5 min" },
  { v: 2, label: "Light", hint: "5–15 min" },
  { v: 3, label: "Standard", hint: "15–45 min" },
  { v: 4, label: "Major", hint: "45–120 min" },
  { v: 5, label: "Epic", hint: "a real milestone" },
];

/**
 * QuestCreator: accepting a mission, not filling a form.
 * Progressive disclosure: what → effort → when → activity → mapping → reward → create.
 */
export function QuestCreator({
  open,
  onOpenChange,
  onCreated,
  authHeaders,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
  authHeaders: () => Record<string, string>;
}) {
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [effort, setEffort] = useState(3);
  const [questType, setQuestType] = useState("focus");
  const [when, setWhen] = useState("");
  const [activityKey, setActivityKey] = useState("study_learning");
  const [activities, setActivities] = useState<{ key: string; name: string }[]>([]);
  const [mapping, setMapping] = useState<{ primary: string; secondary: string } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [preview, setPreview] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep(0);
    setTitle("");
    setEffort(3);
    setQuestType("focus");
    setWhen("");
    setMapping(null);
    setPreview(null);
    setError(null);
  };

  const loadMeta = async () => {
    try {
      const [acts, map, pv] = await Promise.all([
        client.activityTypes(authHeaders()).catch(() => []),
        client.suggestMapping(authHeaders(), activityKey).catch(() => null),
        client.previewQuest(authHeaders(), { difficulty: effort, questType, activityKey }).catch(() => null),
      ]);
      setActivities(acts);
      setMapping(map);
      setPreview(pv);
    } catch {
      /* preview is progressive enhancement; creation still works */
    }
  };

  const next = async () => {
    setError(null);
    if (step === 0 && !title.trim()) {
      setError("Give your quest a name.");
      return;
    }
    if (step === 4) await loadMeta();
    setStep((s) => Math.min(6, s + 1));
  };

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      await client.createQuest(authHeaders(), {
        title: title.trim(),
        questType,
        activityKey,
        difficulty: effort,
        scheduledFor: when || undefined,
      });
      toast({ title: "Quest accepted", body: `"${title.trim()}" awaits on Today.`, tone: "xp" });
      reset();
      onOpenChange(false);
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create quest.");
    } finally {
      setBusy(false);
    }
  };

  const steps = ["Action", "Effort", "When", "Activity", "Spirit", "Reward", "Begin"];

  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }} title="Accept a mission">
      <ol className="mb-4 flex gap-1" aria-label="Creation progress">
        {steps.map((s, i) => (
          <li key={s} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-xp" : "bg-surface-overlay")} aria-label={`${s}${i === step ? " (current)" : ""}`} />
        ))}
      </ol>

      {step === 0 && (
        <Field label="What are you doing?" error={error}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Study DSA for 45 minutes" autoFocus className={inputCls} />
        </Field>
      )}
      {step === 1 && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">How much effort?</legend>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {EFFORTS.map((e) => (
              <button key={e.v} type="button" onClick={() => setEffort(e.v)} aria-pressed={effort === e.v}
                className={cn("rounded-card border p-3 text-left pressable", effort === e.v ? "border-xp bg-xp/10" : "border-line")}>
                <span className="block text-sm font-semibold">{e.label}</span>
                <span className="text-xs text-ink-muted">{e.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {step === 2 && (
        <div className="space-y-3">
          <fieldset>
            <legend className="mb-2 text-sm font-medium">How large is it?</legend>
            <div className="grid gap-2 md:grid-cols-2">
              {TYPES.map((t) => (
                <button key={t.v} type="button" onClick={() => setQuestType(t.v)} aria-pressed={questType === t.v}
                  className={cn("rounded-card border p-3 text-left pressable", questType === t.v ? "border-xp bg-xp/10" : "border-line")}>
                  <span className="block text-sm font-semibold capitalize">{t.v}</span>
                  <span className="text-xs text-ink-muted">{t.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <Field label="When? (optional)" hint="Leave empty for no deadline.">
            <input type="date" value={when} onChange={(e) => setWhen(e.target.value)} className={inputCls} />
          </Field>
        </div>
      )}
      {step === 3 && (
        <Field label="Activity type" hint="This gives the quest its RPG meaning — the system never needs to understand the words.">
          <select value={activityKey} onChange={(e) => setActivityKey(e.target.value)} className={inputCls}>
            {(activities.length ? activities : [{ key: activityKey, name: activityKey }]).map((a) => (
              <option key={a.key} value={a.key}>{a.name}</option>
            ))}
          </select>
        </Field>
      )}
      {step === 4 && (
        <div className="rounded-card border border-line p-4 text-sm">
          <p className="font-medium">This quest strengthens</p>
          <p className="mt-1 text-lg font-display capitalize">
            {mapping ? `${ATTRIBUTE_META[mapping.primary]?.name ?? mapping.primary} + ${ATTRIBUTE_META[mapping.secondary]?.name ?? mapping.secondary}` : "Discipline + Focus"}
          </p>
          <p className="mt-1 text-xs text-ink-muted">Suggested by the activity. The engine keeps scoring finite and fair.</p>
        </div>
      )}
      {step === 5 && (
        <div className="rounded-card border border-xp/40 bg-xp/5 p-4 text-center">
          <p className="text-xs text-ink-muted">Your reward, before you begin</p>
          <p className="mt-1 font-display text-3xl text-coin">+{preview?.rewardXp ?? "–"} XP</p>
          <p className="text-sm text-ink-secondary">+{preview?.rewardCoins ?? "–"} coins</p>
          {preview?.capped && <p className="mt-1 text-xs text-ink-muted">Daily micro-quest cap applies — full rewards resume tomorrow.</p>}
        </div>
      )}
      {step === 6 && (
        <div className="text-center">
          <p className="font-display text-xl">“{title.trim()}”</p>
          <p className="mt-1 text-sm text-ink-secondary capitalize">{questType} · {EFFORTS[effort - 1].label}{when ? ` · ${when}` : ""}</p>
        </div>
      )}

      {step !== 0 && step !== 4 && step !== 5 && step !== 6 && error && (
        <p role="alert" className="mt-2 text-sm text-danger">{error}</p>
      )}
      {(step === 0 || step === 6) && error && (
        <p role="alert" className="mt-2 text-sm text-danger">{error}</p>
      )}

      <div className="mt-4 flex justify-between gap-2">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="rounded-control px-4 py-2 text-sm disabled:opacity-40">
          Back
        </button>
        {step < 6 ? (
          <button onClick={next} className="rounded-control bg-xp px-5 py-2 text-sm font-semibold text-white pressable">
            Continue
          </button>
        ) : (
          <button onClick={create} disabled={busy} className="rounded-control bg-xp px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 pressable">
            {busy ? "Accepting…" : "Create Quest"}
          </button>
        )}
      </div>
    </Modal>
  );
}
