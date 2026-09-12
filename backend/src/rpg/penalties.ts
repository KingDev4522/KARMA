import { cumulativeXpForLevel } from "./xpCurve";

/**
 * Abandon / early-cancel XP penalties — negative marking equalized with gains.
 *
 * Gains by difficulty are 10 / 20 / 40 / 75 / 120 XP, so the abandon penalty
 * is ~25% of the gain for that difficulty: stopping hurts, but one failure
 * can never wipe out one success.
 *
 * Guardrails (recovery-first design is preserved):
 * - Levels NEVER decrease: the deduction clamps at the current level floor,
 *   so only progress-into-the-level is ever at risk.
 * - Streak, momentum, coins, attributes and achievements are untouched —
 *   the penalty is XP-only and fully ledgered (sourceType "abandon").
 */
export const ABANDON_PENALTY_BY_DIFFICULTY: Record<number, number> = {
  1: 3,
  2: 5,
  3: 10,
  4: 20,
  5: 30,
};

export function abandonPenaltyFor(difficulty: number): number {
  const d = Math.min(5, Math.max(1, Math.floor(difficulty || 3)));
  return ABANDON_PENALTY_BY_DIFFICULTY[d] ?? 10;
}

/** Focus sessions cancelled before this much real effort also sting a little. */
export const FOCUS_EARLY_CANCEL_GRACE_SECONDS = 300;
export const FOCUS_EARLY_CANCEL_PENALTY_XP = 5;

export function focusCancelPenalty(actualSeconds: number): number {
  return actualSeconds < FOCUS_EARLY_CANCEL_GRACE_SECONDS ? FOCUS_EARLY_CANCEL_PENALTY_XP : 0;
}

/** Deduct `requested` XP from lifetime total without ever de-leveling. */
export function applyPenaltyToLifetime(lifetimeXp: number, currentLevel: number, requested: number): { newLifetime: number; applied: number } {
  const floor = cumulativeXpForLevel(Math.max(1, currentLevel));
  const newLifetime = Math.max(floor, lifetimeXp - Math.max(0, requested));
  return { newLifetime, applied: lifetimeXp - newLifetime };
}
