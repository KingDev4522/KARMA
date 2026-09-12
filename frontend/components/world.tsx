"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, Coins, Lock, Medal } from "@phosphor-icons/react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { ATTRIBUTE_META, CoinPurse, LevelBadge, RankBadge, RewardPreview, XpBar } from "./rpg";

/**
 * World elements: environmental scenes, geometric brand figures,
 * companion bubbles, journey paths, routine rhythms, collectibles.
 */

// ---------- Environment scene (time-of-day atmosphere) ----------
export function HeroScene({ timeOfDay, children }: { timeOfDay: string; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const night = timeOfDay === "night" || timeOfDay === "evening";
  return (
    <div className="relative overflow-hidden rounded-panel border border-line" role="img" aria-label={`${timeOfDay} realm scene`}>
      <svg viewBox="0 0 800 260" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            {night ? (
              <>
                <stop offset="0" stopColor="#1c1838" />
                <stop offset="1" stopColor="#3a2f5e" />
              </>
            ) : (
              <>
                <stop offset="0" stopColor="#f6e8d4" />
                <stop offset="1" stopColor="#e8c9a8" />
              </>
            )}
          </linearGradient>
        </defs>
        <rect width="800" height="260" fill="url(#sky)" />
        {/* sun / moon disc */}
        <circle cx={night ? 620 : 180} cy={night ? 60 : 70} r="34" fill={night ? "#f2ead8" : "#c64f42"} opacity="0.9" />
        {night && (
          <g fill="#f2ead8" opacity="0.8">
            <circle cx="120" cy="50" r="2" />
            <circle cx="300" cy="36" r="1.6" />
            <circle cx="480" cy="70" r="2" />
            <circle cx="700" cy="120" r="1.6" />
            <circle cx="220" cy="110" r="1.4" />
          </g>
        )}
        {/* layered ridgelines */}
        <path d="M0 190 L120 130 L240 175 L360 120 L480 170 L600 135 L720 175 L800 150 L800 260 L0 260 Z" fill={night ? "#2b2450" : "#c9a37e"} opacity="0.75" />
        <path d="M0 220 L140 170 L280 210 L420 165 L560 210 L700 175 L800 205 L800 260 L0 260 Z" fill={night ? "#221d42" : "#a87f5c"} />
        {/* pine silhouettes */}
        <g fill={night ? "#191538" : "#7c5a41"}>
          <path d="M90 210 l14 -34 14 34 h-9 v14 h-10 v-14 Z" />
          <path d="M660 205 l12 -28 12 28 h-8 v12 h-8 v-12 Z" />
        </g>
        {/* rising-sun rays (subtle, daytime) */}
        {!night && (
          <g stroke="#c64f42" strokeWidth="3" opacity="0.35">
            <line x1="180" y1="8" x2="180" y2="22" />
            <line x1="120" y1="24" x2="130" y2="36" />
            <line x1="240" y1="24" x2="230" y2="36" />
          </g>
        )}
      </svg>
      {/* drifting mist */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[rgb(var(--scene-haze))] to-transparent"
          animate={{ opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

// ---------- Geometric brand hero figure ----------
const HERO_HUES: Record<string, { cloak: string; trim: string; skin: string }> = {
  hero_ember: { cloak: "#b6483c", trim: "#f2c14e", skin: "#f2cfae" },
  hero_sage: { cloak: "#4a7c59", trim: "#e9e2d0", skin: "#eec39e" },
  hero_warden: { cloak: "#4343a8", trim: "#e9e2d0", skin: "#f2cfae" },
  hero_scout: { cloak: "#8a6d3b", trim: "#4343a8", skin: "#d9a878" },
  hero_mystic: { cloak: "#5b4bc4", trim: "#f28c8c", skin: "#f2cfae" },
  hero_forge: { cloak: "#4a4a55", trim: "#f2c14e", skin: "#eec39e" },
};

export function HeroFigure({ assetId, size = 120, companion, companionMood }: { assetId?: string | null; size?: number; companion?: string | null; companionMood?: string }) {
  const hues = HERO_HUES[assetId ?? ""] ?? HERO_HUES.hero_warden;
  return (
    <div className="flex items-end gap-2" role="img" aria-label="Your hero and companion">
      <svg width={size} height={size * 1.25} viewBox="0 0 100 125" aria-hidden>
        {/* cloak */}
        <path d="M50 18 C30 18 24 44 22 70 L30 108 L70 108 L78 70 C76 44 70 18 50 18 Z" fill={hues.cloak} />
        {/* trim */}
        <path d="M50 18 C40 30 38 60 38 108 L44 108 C44 66 46 36 50 18 Z" fill={hues.trim} opacity="0.85" />
        {/* head */}
        <circle cx="50" cy="26" r="13" fill={hues.skin} />
        {/* hair */}
        <path d="M37 26 C37 14 63 14 63 26 C58 20 42 20 37 26 Z" fill="#2e2a26" />
        {/* eyes */}
        <circle cx="45" cy="27" r="1.8" fill="#2e2a26" />
        <circle cx="55" cy="27" r="1.8" fill="#2e2a26" />
        {/* seal crest */}
        <rect x="44" y="58" width="12" height="12" rx="3" fill={hues.trim} transform="rotate(45 50 64)" opacity="0.9" />
        {/* staff */}
        <rect x="76" y="30" width="4" height="66" rx="2" fill={hues.trim} />
        <circle cx="78" cy="26" r="6" fill="none" stroke={hues.trim} strokeWidth="3" />
      </svg>
      {companion !== undefined && <CompanionSprite mood={companionMood ?? "idle"} />}
    </div>
  );
}

const COMPANION_HUES: Record<string, string> = {
  celebrating: "#f2c14e",
  greeting: "#8fd0a8",
  focused: "#9b8bff",
  encouraging: "#f2a0a0",
  resting: "#9aa3b8",
  idle: "#cfc6ae",
};

export function CompanionSprite({ mood }: { mood: string }) {
  const c = COMPANION_HUES[mood] ?? COMPANION_HUES.idle;
  return (
    <svg width="44" height="52" viewBox="0 0 44 52" role="img" aria-label={`Companion, ${mood}`}>
      <ellipse cx="22" cy="46" rx="12" ry="4" fill="#000" opacity="0.15" />
      <circle cx="22" cy="28" r="14" fill={c} />
      <circle cx="22" cy="28" r="14" fill="none" stroke="#2e2a26" strokeWidth="2" opacity="0.2" />
      <circle cx="16" cy="26" r="2.4" fill="#2e2a26" />
      <circle cx="28" cy="26" r="2.4" fill="#2e2a26" />
      <path d="M17 33 Q22 37 27 33" stroke="#2e2a26" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* ears */}
      <path d="M10 18 L6 6 L16 12 Z" fill={c} stroke="#2e2a26" strokeWidth="1.5" />
      <path d="M34 18 L38 6 L28 12 Z" fill={c} stroke="#2e2a26" strokeWidth="1.5" />
      {mood === "celebrating" && (
        <g stroke="#f2c14e" strokeWidth="2" strokeLinecap="round">
          <line x1="6" y1="8" x2="2" y2="2" />
          <line x1="38" y1="8" x2="42" y2="2" />
        </g>
      )}
      {mood === "resting" && (
        <g fill="none" stroke="#9aa3b8" strokeWidth="1.6">
          <text x="32" y="12" fontSize="10" fill="#9aa3b8" stroke="none">z</text>
        </g>
      )}
    </svg>
  );
}

// ---------- Companion speech bubble ----------
export function CompanionBubble({ mood, message, compact }: { mood: string; message: string; compact?: boolean }) {
  return (
    <div className="flex items-start gap-3" role="status" aria-label={`Companion (${mood}): ${message}`}>
      <div className={cn(!compact && "mt-1")}>
        <CompanionSprite mood={mood} />
      </div>
      <div className="relative max-w-md rounded-card rounded-tl-sm border border-line bg-surface-card px-3.5 py-2.5 shadow-card">
        <p className="text-sm leading-snug">{message}</p>
        <p className="mt-1 text-[11px] capitalize text-ink-muted">{mood}</p>
      </div>
    </div>
  );
}

// ---------- Collectible Hero Card ----------
export function HeroCardView({ card }: { card: Record<string, unknown> }) {
  const rank = card.rank as { display?: string } | undefined;
  const xp = card.xpProgress as { pct?: number } | undefined;
  return (
    <article aria-label="Hero card preview" className="relative overflow-hidden rounded-panel border-2 border-xp/50 bg-surface-elevated p-6 text-center shadow-glow">
      <div className="pattern-asanoha pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-muted">Life RPG · Hero Card</p>
        <p className="mt-1 font-display text-2xl">{String(card.heroName ?? "Unnamed Hero")}</p>
        <div className="mt-1 flex items-center justify-center gap-2">
          <span className="text-sm text-ink-secondary">Lv {String(card.level ?? 1)}</span>
          {rank?.display && (
            <span className="inline-flex -rotate-3 items-center rounded-[6px] bg-seal px-2 py-0.5 font-display text-xs font-bold text-white">
              {rank.display}
            </span>
          )}
        </div>
        <div className="mx-auto my-4 w-fit">
          <HeroFigure assetId={(card.avatar as string) ?? null} size={110} />
        </div>
        <div className="mx-auto grid max-w-xs grid-cols-2 gap-1 text-sm">
          {((card.topAttributes as { key: string; name: string; level: number }[]) ?? []).map((a) => (
            <p key={a.key} className="rounded-control bg-surface-overlay px-2 py-1 capitalize">
              {a.name} <strong>{a.level}</strong>
            </p>
          ))}
        </div>
        <p className="mt-3 text-sm">🔥 {String(card.streak ?? 0)}-day streak</p>
        {(card.title as { name?: string } | null)?.name && (
          <p className="font-display text-coin">“{(card.title as { name: string }).name}”</p>
        )}
      </div>
    </article>
  );
}

// ---------- Campaign journey path ----------
export function CampaignPath({ milestones, activeId }: { milestones: { id: string; title: string; status: string }[]; activeId?: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? milestones : milestones.slice(0, 5);
  return (
    <ol className="relative ml-2 space-y-0 border-l-2 border-dashed border-xp/40 pl-0" aria-label="Campaign journey">
      {visible.map((m, i) => {
        const done = m.status === "done";
        const active = m.id === activeId || (!activeId && !done && milestones.slice(0, i).every((x) => x.status === "done"));
        return (
          <li key={m.id} className="relative flex gap-3 pb-5 pl-6 last:pb-0">
            <span
              aria-hidden
              className={cn(
                "absolute -left-[13px] top-0 flex h-6 w-6 items-center justify-center rounded-full border-2",
                done ? "border-sage bg-sage text-white" : active ? "border-xp bg-xp text-white shadow-glow" : "border-line bg-surface-card",
              )}
            >
              {done && <Check size={13} weight="bold" />}
              {active && !done && <span className="h-2 w-2 rounded-full bg-white" />}
            </span>
            <div className={cn("rounded-card border px-3 py-2", active ? "border-xp bg-xp/5" : "border-line bg-surface-card", active && "shadow-card")}>
              <p className={cn("text-sm font-semibold", active && "text-base")}>{m.title}</p>
              <p className="text-xs capitalize text-ink-muted">{m.status.replace("_", " ")}{active ? " · current objective" : ""}</p>
            </div>
          </li>
        );
      })}
      {milestones.length > 5 && (
        <button onClick={() => setExpanded((v) => !v)} className="ml-6 text-xs font-medium text-xp">
          {expanded ? "Show less" : `Show ${milestones.length - 5} more steps`}
        </button>
      )}
    </ol>
  );
}

// ---------- Routine rhythm card ----------
const DOW = ["S", "M", "T", "W", "T", "F", "S"];

export function RoutineCard({ title, days, streak, completions }: { title: string; days?: number[]; streak?: number; completions?: boolean[] }) {
  return (
    <div className="rounded-card border border-line bg-surface-card p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">{title}</h3>
        {typeof streak === "number" && (
          <span className="text-xs font-semibold text-coral">{streak} in a row</span>
        )}
      </div>
      <div className="mt-3 flex gap-1.5" role="img" aria-label={`Repeats ${(days ?? []).map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ") || "daily"}`}>
        {DOW.map((d, i) => {
          const on = !days || days.includes(i);
          const hit = completions?.[i];
          return (
            <span
              key={i}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                hit ? "bg-sage text-white" : on ? "bg-xp/15 text-xp" : "bg-surface-overlay text-ink-muted",
              )}
            >
              {d}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Achievement collectible ----------
export function AchievementCard({ name, description, iconPath, locked, progress }: { name: string; description: string; iconPath?: string; locked?: boolean; progress?: string }) {
  return (
    <div
      className={cn("flex items-center gap-3 rounded-card border p-3", locked ? "border-dashed border-line opacity-60" : "border-xp/40 bg-surface-card shadow-card")}
      aria-label={`${name}${locked ? " (locked)" : ""}`}
    >
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", locked ? "bg-surface-overlay text-ink-muted" : "bg-xp/15 text-xp")} aria-hidden>
        {locked ? <Lock size={18} /> : <Medal size={20} weight="duotone" />}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{locked ? "???" : name}</p>
        <p className="truncate text-xs text-ink-secondary">{locked ? (progress ?? "Keep questing to reveal.") : description}</p>
        {iconPath && !locked && <p className="sr-only">Badge art: {iconPath}</p>}
      </div>
    </div>
  );
}

// ---------- Store item (inventory feel) ----------
export function StoreItemCard({
  item,
  onBuy,
  onEquip,
  busy,
}: {
  item: { id: string; name: string; description: string; price: number; rarity: string; status: string; owned: boolean; equipped: boolean };
  onBuy: () => void;
  onEquip: () => void;
  busy?: boolean;
}) {
  const rarityTone: Record<string, string> = {
    common: "bg-surface-overlay text-ink-secondary",
    rare: "bg-xp/15 text-xp",
    epic: "bg-coral/15 text-coral",
    legendary: "bg-coin/20 text-coin",
  };
  return (
    <article className="overflow-hidden rounded-card border border-line bg-surface-card shadow-card" aria-label={`${item.name}, ${item.status}`}>
      <div className="pattern-waves flex h-20 items-center justify-center bg-surface-elevated" aria-hidden>
        <Coins size={30} weight="duotone" className="text-coin" />
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-semibold">{item.name}</h3>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize", rarityTone[item.rarity] ?? rarityTone.common)}>
            {item.rarity}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-ink-secondary">{item.description}</p>
        <div className="mt-2 flex items-center justify-between">
          <CoinPurse coins={item.price} size="sm" />
          <span className="text-[11px] font-semibold">
            {item.status === "equipped" ? <span className="text-sage">Equipped ✓</span> : item.status === "owned" ? "Owned" : item.status === "locked" ? <span className="text-ink-muted">Locked</span> : <span className="text-xp">Available</span>}
          </span>
        </div>
        <div className="mt-2">
          {!item.owned ? (
            <button onClick={onBuy} disabled={busy || item.status === "locked"} className="w-full rounded-control bg-xp py-1.5 text-xs font-semibold text-white disabled:opacity-50 pressable">
              {busy ? "…" : "Acquire"}
            </button>
          ) : !item.equipped ? (
            <button onClick={onEquip} disabled={busy} className="w-full rounded-control border border-xp/40 py-1.5 text-xs font-medium pressable">
              {busy ? "…" : "Equip"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
