"use client";

import { motion } from "framer-motion";
import type { CompletionResponse, Quest } from "@/lib/types";

/**
 * Quest card (LRP-FE-001 §6): title, type, time, activity, primary/secondary,
 * reward preview, primary action. Color never the only status signal (§20).
 */
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
  const pv = quest.rewardPreview;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-surface-card p-4 shadow-card"
      aria-label={`Quest: ${quest.title}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-ink-primary">{quest.title}</h3>
        <span className="shrink-0 rounded-full border border-surface-overlay px-2 py-0.5 text-xs text-ink-secondary">
          {quest.questType}
          {quest.status !== "active" ? ` · ${quest.status.replace("_", " ")}` : ""}
        </span>
      </div>
      <p className="mt-1 text-xs text-ink-muted">
        {quest.estimatedMinutes ? `${quest.estimatedMinutes} min` : "unsized"}
        {quest.activityType ? ` · ${quest.activityType.name}` : ""}
        {pv ? ` · ${pv.primaryAttr.toUpperCase()} + ${pv.secondaryAttr.toUpperCase()}` : ""}
      </p>
      {pv && (
        <p className="mt-1 text-sm text-coin" aria-label={`Reward: ${pv.rewardXp} XP and ${pv.rewardCoins} coins`}>
          +{pv.rewardXp} XP · +{pv.rewardCoins} coins{pv.capped ? " · capped today" : ""}
        </p>
      )}
      {lastResult && (
        <p className="mt-1 text-xs text-success" role="status">
          Cleared: +{lastResult.rewardXp} XP · {lastResult.companion.message}
          {lastResult.leveledUp ? ` · Level ${lastResult.newLevel}!` : ""}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        {onStartFocus && quest.questType === "focus" && (
          <button
            onClick={() => onStartFocus(quest)}
            className="rounded-lg border border-xp/50 px-3 py-1.5 text-sm text-ink-primary focus-visible:outline-2 focus-visible:outline-xp"
          >
            Start Focus
          </button>
        )}
        <button
          onClick={() => onComplete(quest)}
          disabled={completing || quest.status === "completed"}
          className="rounded-lg bg-xp px-3 py-1.5 text-sm font-semibold text-surface-bg disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-white"
        >
          {quest.status === "completed" ? "Completed ✓" : completing ? "Clearing…" : "Complete"}
        </button>
      </div>
    </motion.article>
  );
}
