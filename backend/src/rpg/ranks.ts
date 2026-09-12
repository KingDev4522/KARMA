import { cumulativeXpForLevel } from "./xpCurve";

/**
 * Rank ladder (MASTER PRD §14, LRP-RPG-001 §15):
 * Novice → Apprentice → Adept → Vanguard → Expert → Master → Elite → Legend → Mythic → Ascendant
 * Ranks contain numbered stages I..V. After Mythic V → Ascendant + infinite stars.
 *
 * Mapping is level-based and centrally controlled (deterministic):
 * each named rank spans 5 levels; Ascendant starts at 46 with stars = level-45.
 * rank_key examples: "novice_ii", "adept_iii", "mythic_v", "ascendant_3".
 */

export const RANK_ORDER = [
  "novice",
  "apprentice",
  "adept",
  "vanguard",
  "expert",
  "master",
  "elite",
  "legend",
  "mythic",
  "ascendant",
] as const;
export type RankName = (typeof RANK_ORDER)[number];

const ROMAN = ["i", "ii", "iii", "iv", "v"] as const;

export interface RankInfo {
  rank: RankName;
  rankKey: string;
  display: string;
  stage?: number; // 1..5 for named ranks
  stars?: number; // ascendant endless stars
  level: number;
  lifetimeXp: number;
}

export function rankForLevel(level: number): RankInfo {
  const lvl = Math.max(1, Math.floor(level));
  if (lvl >= 46) {
    const stars = lvl - 45;
    return {
      rank: "ascendant",
      rankKey: `ascendant_${stars}`,
      display: stars > 1 ? `Ascendant ★${stars}` : "Ascendant",
      stars,
      level: lvl,
      lifetimeXp: 0,
    };
  }
  const idx = Math.floor((lvl - 1) / 5); // 0..8
  const rank = RANK_ORDER[idx] as RankName;
  const stage = ((lvl - 1) % 5) + 1;
  const roman = ROMAN[stage - 1];
  const cap = rank.charAt(0).toUpperCase() + rank.slice(1);
  return {
    rank,
    rankKey: `${rank}_${roman}`,
    display: `${cap} ${roman.toUpperCase()}`,
    stage,
    level: lvl,
    lifetimeXp: 0,
  };
}

export function rankForXp(lifetimeXp: number): RankInfo {
  // derive level first via curve
  let level = 1;
  while (level < 500 && lifetimeXp >= cumulativeXpForLevel(level + 1)) level++;
  const r = rankForLevel(level);
  return { ...r, lifetimeXp };
}

/** Small level-up coin bonus so every level grants a reward (PRD v2 §16). */
export function levelUpCoinBonus(newLevel: number): number {
  // gentle scaling: 5 + level, capped at 60
  return Math.min(60, 5 + newLevel);
}
