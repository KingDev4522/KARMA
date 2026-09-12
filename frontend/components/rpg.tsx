"use client";

import {
  Barbell,
  BookOpen,
  Compass,
  Crosshair,
  Hammer,
  Heartbeat,
  ShieldCheck,
  Users,
  Flame,
  Coins,
  Sparkle,
  type Icon,
} from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

/**
 * RPG atoms: level/rank emblems, XP bar, attribute stats, streak, reward preview.
 * Rank badge uses a hanko-seal motif (brand-appropriate, not stereotyped decoration).
 */

export const ATTRIBUTE_META: Record<
  string,
  { name: string; icon: Icon; blurb: string }
> = {
  strength: { name: "Strength", icon: Barbell, blurb: "Physical capability and resistance." },
  vitality: { name: "Vitality", icon: Heartbeat, blurb: "Movement, recovery, well-being." },
  intellect: { name: "Intellect", icon: BookOpen, blurb: "Learning, analysis, problem-solving." },
  focus: { name: "Focus", icon: Crosshair, blurb: "Sustained attention and deep work." },
  discipline: { name: "Discipline", icon: ShieldCheck, blurb: "Consistency and follow-through." },
  craft: { name: "Craft", icon: Hammer, blurb: "Making, coding, creative execution." },
  connection: { name: "Connection", icon: Users, blurb: "Relationships and contribution." },
  exploration: { name: "Exploration", icon: Compass, blurb: "Curiosity and new experiences." },
};

export function LevelBadge({ level, size = "md" }: { level: number; size?: "sm" | "md" | "lg" }) {
  const dims = { sm: "h-10 w-10 text-sm", md: "h-14 w-14 text-lg", lg: "h-20 w-20 text-2xl" }[size];
  return (
    <div
      className={cn("relative flex items-center justify-center rounded-full border-2 border-xp bg-surface-elevated font-display font-bold", dims)}
      role="img"
      aria-label={`Level ${level}`}
    >
      <span className="absolute inset-1 rounded-full border border-line" aria-hidden />
      {level}
    </div>
  );
}

export function RankBadge({ display }: { display: string }) {
  // Hanko seal: vermillion square, off-white glyphs, slight rotate — identity stamp.
  return (
    <span
      className="inline-flex -rotate-3 items-center rounded-[6px] bg-seal px-2.5 py-1 font-display text-xs font-bold tracking-wide text-white shadow-seal"
      aria-label={`Rank ${display}`}
    >
      {display}
    </span>
  );
}

export function XpBar({ pct, label, glow }: { pct: number; label: string; glow?: boolean }) {
  const clamped = Math.max(0, Math.min(1, pct));
  return (
    <div role="progressbar" aria-valuenow={Math.round(clamped * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cn("h-2.5 overflow-hidden rounded-full bg-surface-overlay", glow && "shadow-glow")}>
        <motion.div
          className="h-full rounded-full bg-xp"
          initial={false}
          animate={{ width: `${clamped * 100}%` }}
          transition={{ type: "spring", stiffness: 110, damping: 22 }}
        />
      </div>
    </div>
  );
}

export function AttributeStat({
  attrKey,
  level,
  xp,
  recent,
  compact,
}: {
  attrKey: string;
  level: number;
  xp: number;
  recent?: string | null;
  compact?: boolean;
}) {
  const meta = ATTRIBUTE_META[attrKey] ?? { name: attrKey, icon: Sparkle, blurb: "" };
  const Icon = meta.icon;
  return (
    <div className="flex items-center gap-3" title={meta.blurb}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-surface-overlay text-xp" aria-hidden>
        <Icon size={18} weight="duotone" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-semibold capitalize">{meta.name}</p>
          <p className="text-xs text-ink-secondary">
            Lv {level} · {xp} XP
          </p>
        </div>
        {!compact && <XpBar pct={Math.min(1, xp / 500)} label={`${meta.name} progress`} />}
        {recent && <p className="mt-0.5 truncate text-xs text-ink-muted">{recent}</p>}
      </div>
    </div>
  );
}

export function Streak({ current, best }: { current: number; best: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-overlay px-2.5 py-1 text-xs font-semibold" aria-label={`${current} day streak, best ${best}`}>
      <Flame size={14} weight="fill" className="text-coral" aria-hidden />
      {current} day{current === 1 ? "" : "s"}
      <span className="font-normal text-ink-muted">best {best}</span>
    </span>
  );
}

export function CoinPurse({ coins, size = "md" }: { coins: number; size?: "sm" | "md" }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-semibold text-coin", size === "sm" ? "text-xs" : "text-base")} aria-label={`${coins} coins`}>
      <Coins size={size === "sm" ? 14 : 18} weight="duotone" aria-hidden />
      {coins}
    </span>
  );
}

export function RewardPreview({ xp, coins, capped }: { xp: number; coins: number; capped?: boolean }) {
  return (
    <p className="text-sm font-semibold text-coin" aria-label={`Reward ${xp} XP and ${coins} coins${capped ? ", capped today" : ""}`}>
      +{xp} XP · +{coins} coins{capped && <span className="font-normal text-ink-muted"> · capped</span>}
    </p>
  );
}
