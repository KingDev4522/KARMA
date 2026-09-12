/**
 * Hero XP curve — LRP-BE-001 §11, LRP-RPG-001 §7, MASTER PRD §14.
 * Required XP(level) = floor(100 * level^1.55)
 * Backend is source of truth for level calculation.
 * Level N requires `requiredXpForLevel(N)` cumulative? No — PRD defines per-level threshold.
 * We treat `lifetime_xp` as cumulative total; level ups while lifetime_xp >= cumulativeXpForLevel(level+1).
 */

export function requiredXpForLevel(level: number): number {
  if (level < 1) throw new Error("level must be >= 1");
  return Math.floor(100 * Math.pow(level, 1.55));
}

/** Cumulative XP needed to REACH given level (level 1 needs 0). */
export function cumulativeXpForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let l = 1; l < level; l++) total += requiredXpForLevel(l);
  return total;
}

export function levelForLifetimeXp(lifetimeXp: number): number {
  if (lifetimeXp < 0) return 1;
  let level = 1;
  // guard upper bound for safety
  while (level < 500 && lifetimeXp >= cumulativeXpForLevel(level + 1)) level++;
  return level;
}

export function xpProgressForLevel(lifetimeXp: number): {
  level: number;
  currentLevelFloor: number;
  nextLevelCeiling: number;
  intoLevel: number;
  neededForNext: number;
  pct: number;
} {
  const level = levelForLifetimeXp(lifetimeXp);
  const floor = cumulativeXpForLevel(level);
  const ceiling = cumulativeXpForLevel(level + 1);
  const intoLevel = lifetimeXp - floor;
  const neededForNext = ceiling - floor;
  return {
    level,
    currentLevelFloor: floor,
    nextLevelCeiling: ceiling,
    intoLevel,
    neededForNext,
    pct: neededForNext === 0 ? 1 : intoLevel / neededForNext,
  };
}

/** Attribute XP uses same curve shape but independent track (LRP-RPG-001 §8). */
export function attributeLevelForXp(xp: number): number {
  return levelForLifetimeXp(xp);
}
