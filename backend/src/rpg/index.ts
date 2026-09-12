import { ACTIVITY_BY_KEY, splitAttributeXp } from "./attributes";
import { applyAntiFarming, isMicroQuest, streakBonusCoins } from "./antiFarming";
import { baseRewardFor } from "./rewards";

export * from "./xpCurve";
export * from "./attributes";
export * from "./rewards";
export * from "./ranks";
export * from "./streak";
export * from "./antiFarming";
export * from "./companion";

/**
 * Central RewardEngine — deterministic: identical inputs → identical rewards (LRP-RPG-001 §21).
 * Client must never alter authoritative XP/Coins/attributes.
 *
 * Pipeline: difficulty/activity/duration/quest-type/campaign → base → anti-farm → streak bonus → split attrs
 */
export interface RewardInput {
  difficulty: number;
  questType: string;
  activityKey?: string | null;
  primaryOverride?: string | null;
  secondaryOverride?: string | null;
  microCountToday?: number;
  currentStreak?: number;
}

export interface RewardOutput {
  baseXp: number;
  baseCoins: number;
  rewardXp: number;
  rewardCoins: number;
  capped: boolean;
  capReason?: string;
  primaryAttr: string;
  secondaryAttr: string;
  primaryXp: number;
  secondaryXp: number;
  streakBonusCoins: number;
  difficulty: number;
}

export function resolveRewards(input: RewardInput): RewardOutput {
  const difficulty = Math.min(5, Math.max(1, Math.floor(input.difficulty))) as 1 | 2 | 3 | 4 | 5;
  const base = baseRewardFor(difficulty);
  const questType = input.questType;

  const mapping = input.activityKey ? ACTIVITY_BY_KEY[input.activityKey] : undefined;
  const primaryAttr = input.primaryOverride ?? mapping?.primary ?? "discipline";
  const secondaryAttr = input.secondaryOverride ?? mapping?.secondary ?? "focus";

  const micro = isMicroQuest(difficulty, questType);
  const farmed = applyAntiFarming({
    difficulty,
    questType,
    baseXp: base.xp,
    baseCoins: base.coins,
    microCountToday: input.microCountToday ?? 0,
    isMicro: micro,
  });

  const bonus = streakBonusCoins(input.currentStreak ?? 0);
  const rewardXp = farmed.xp;
  const rewardCoins = farmed.coins + bonus;

  const split = splitAttributeXp(rewardXp, primaryAttr as never, secondaryAttr as never);

  return {
    baseXp: base.xp,
    baseCoins: base.coins,
    rewardXp,
    rewardCoins,
    capped: farmed.capped,
    capReason: farmed.reason,
    primaryAttr: split.primary,
    secondaryAttr: split.secondary,
    primaryXp: split.primaryXp,
    secondaryXp: split.secondaryXp,
    streakBonusCoins: bonus,
    difficulty,
  };
}
