/**
 * Anti-farming (PRD v2 §26-§27, LRP-RPG-001 §11, LRP-BE-001 §7-§9).
 * Pipeline: Base reward → effort multiplier → daily anti-farming cap → streak/context bonus → ledger
 *
 * Rules (deterministic, centrally controlled):
 * - Idempotency: completion keyed by idempotency_key; repeats return original, no duplicate reward.
 * - Micro-quest cap: Effort-1 quick/recovery quests have bounded daily rewards.
 *   First DAILY_MICRO_FULL_REWARD (5) per UTC day pay full; beyond that pay FLOOR (1 XP / 0 coins).
 * - Difficulty limits: difficulty coerced 1..5; Epic requires quest_type campaign|challenge|focus (else capped at Major).
 * - No client reward trust: server always recomputes.
 */

export const DAILY_MICRO_FULL_REWARD = 5;
export const MICRO_FLOOR_XP = 1;
export const MICRO_FLOOR_COINS = 0;

export interface AntiFarmInput {
  difficulty: number;
  questType: string;
  baseXp: number;
  baseCoins: number;
  microCountToday: number; // count of effort-1 quick/recovery completions already today
  isMicro: boolean;
}

export interface AntiFarmOutput {
  xp: number;
  coins: number;
  capped: boolean;
  reason?: string;
}

const EPIC_ALLOWED: Set<string> = new Set(["campaign", "challenge", "focus"]);

export function applyAntiFarming(input: AntiFarmInput): AntiFarmOutput {
  let { baseXp, baseCoins, difficulty, questType } = input;

  // Difficulty cap: Epic only for substantial work
  if (difficulty >= 5 && !EPIC_ALLOWED.has(questType)) {
    // cap to Major values
    baseXp = Math.min(baseXp, 75);
    baseCoins = Math.min(baseCoins, 18);
  }

  if (input.isMicro) {
    if (input.microCountToday >= DAILY_MICRO_FULL_REWARD) {
      return { xp: MICRO_FLOOR_XP, coins: MICRO_FLOOR_COINS, capped: true, reason: "daily_micro_cap" };
    }
  }
  return { xp: baseXp, coins: baseCoins, capped: false };
}

export function isMicroQuest(difficulty: number, questType: string): boolean {
  return difficulty <= 1 && (questType === "quick" || questType === "recovery");
}

/** Streak/context bonus: small deterministic bonus, keeps trivial tasks from dominating. */
export function streakBonusCoins(currentStreak: number): number {
  if (currentStreak >= 30) return 5;
  if (currentStreak >= 14) return 3;
  if (currentStreak >= 7) return 2;
  if (currentStreak >= 3) return 1;
  return 0;
}
