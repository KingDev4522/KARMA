import { addDays, daysBetween, toDayKey } from "../shared/utils";

/**
 * Streak + Momentum (MASTER PRD §15, PRD v2 §25, LRP-RPG-001 §12-§14).
 * - Streak = consecutive qualifying active days (server UTC day keys).
 * - Momentum = softer 0..100 recent-consistency signal, decays slowly.
 * - Rest Day freezes streak (does not increment, does not break).
 * - Missed day resets current streak to 1 on next qualifying completion (no punishment beyond reset).
 */

export interface StreakState {
  currentStreak: number;
  bestStreak: number;
  lastActiveDay: string | null; // YYYY-MM-DD
}

export interface StreakResult extends StreakState {
  incremented: boolean;
  isNewBest: boolean;
}

export function applyCompletionToStreak(
  prev: StreakState,
  opts: { todayKey?: string; isRestDay?: boolean; countsTowardStreak?: boolean },
): StreakResult {
  const todayKey = opts.todayKey ?? toDayKey();
  if (opts.isRestDay) {
    // Rest is valid state: freeze, no increment, no break.
    return { ...prev, incremented: false, isNewBest: false };
  }
  if (opts.countsTowardStreak === false) {
    return { ...prev, incremented: false, isNewBest: false };
  }
  const { currentStreak, bestStreak, lastActiveDay } = prev;
  if (!lastActiveDay) {
    const cur = 1;
    return { currentStreak: cur, bestStreak: Math.max(bestStreak, cur), lastActiveDay: todayKey, incremented: true, isNewBest: cur > bestStreak };
  }
  if (lastActiveDay === todayKey) {
    return { currentStreak, bestStreak, lastActiveDay, incremented: false, isNewBest: false };
  }
  const gap = daysBetween(lastActiveDay, todayKey);
  if (gap === 1) {
    const cur = currentStreak + 1;
    return { currentStreak: cur, bestStreak: Math.max(bestStreak, cur), lastActiveDay: todayKey, incremented: true, isNewBest: cur > bestStreak };
  }
  if (gap > 1) {
    // Check rest-day bridge: if yesterday was declared rest, gap of 2 still continues.
    // Caller should pass isRestDay handling per-day; here gap>1 resets to 1.
    const cur = 1;
    return { currentStreak: cur, bestStreak: Math.max(bestStreak, cur), lastActiveDay: todayKey, incremented: true, isNewBest: false };
  }
  // Completion dated in the past (shouldn't happen; ignore)
  return { currentStreak, bestStreak, lastActiveDay, incremented: false, isNewBest: false };
}

export function yesterdayKey(todayKey = toDayKey()): string {
  return addDays(todayKey, -1);
}

/**
 * Momentum 0..100: weighted count of active days in last 14 days.
 * Recent days weigh more; decays slowly; never punishes, only visualizes consistency.
 */
export function momentumForActiveDays(activeDayKeys: string[], todayKey = toDayKey()): number {
  if (activeDayKeys.length === 0) return 0;
  const set = new Set(activeDayKeys);
  let score = 0;
  let weightSum = 0;
  for (let i = 0; i < 14; i++) {
    const key = addDays(todayKey, -i);
    const w = 14 - i; // 14..1 linear decay
    weightSum += w;
    if (set.has(key)) score += w;
  }
  return Math.round((score / weightSum) * 100);
}

export function momentumAfterCompletion(prevMomentum: number, incrementedStreak: boolean): number {
  // small immediate lift on completion, capped; decay handled by recompute from history.
  const lift = incrementedStreak ? 4 : 2;
  return Math.min(100, prevMomentum + lift);
}
