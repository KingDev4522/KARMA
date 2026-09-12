/**
 * Base rewards by effort/difficulty — configuration, NOT user input (LRP-BE-001 §7).
 * Effort 1 Tiny → 10 XP / 3 Coins ... Effort 5 Epic → 120 XP / 30 Coins.
 * LRP-RPG-001 §10. Coin ranges in PRD v2 §18 are compatible guidance for bonuses.
 */

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export const BASE_REWARDS: Record<Difficulty, { xp: number; coins: number; label: string }> = {
  1: { xp: 10, coins: 3, label: "Tiny" },
  2: { xp: 20, coins: 5, label: "Light" },
  3: { xp: 40, coins: 10, label: "Standard" },
  4: { xp: 75, coins: 18, label: "Major" },
  5: { xp: 120, coins: 30, label: "Epic" },
};

export function baseRewardFor(difficulty: number): { xp: number; coins: number; label: string } {
  const d = Math.min(5, Math.max(1, Math.floor(difficulty))) as Difficulty;
  return BASE_REWARDS[d];
}

/** Quest-type coin guidance (PRD v2 §18) used only for milestone/achievement bonuses, not base. */
export const QUEST_TYPE_COIN_HINT: Record<string, [number, number]> = {
  quick: [5, 10],
  focus: [10, 25],
  challenge: [25, 60],
  campaign: [50, 150],
  routine: [5, 12],
  recovery: [3, 8],
};
