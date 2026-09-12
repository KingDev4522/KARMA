import assert from "node:assert";
import { cumulativeXpForLevel, levelForLifetimeXp, requiredXpForLevel, xpProgressForLevel } from "../src/rpg/xpCurve";
import { rankForLevel, rankForXp } from "../src/rpg/ranks";
import { resolveRewards } from "../src/rpg";
import { applyCompletionToStreak, momentumForActiveDays } from "../src/rpg/streak";
import { companionMessage } from "../src/rpg/companion";

// XP curve: floor(100 * level^1.55)
assert.equal(requiredXpForLevel(1), 100);
assert.equal(requiredXpForLevel(2), Math.floor(100 * Math.pow(2, 1.55)));
assert.equal(cumulativeXpForLevel(1), 0);
assert.equal(cumulativeXpForLevel(2), 100);
assert.equal(levelForLifetimeXp(0), 1);
assert.equal(levelForLifetimeXp(99), 1);
assert.equal(levelForLifetimeXp(100), 2);
assert.equal(xpProgressForLevel(150).level, 2);

// Ranks: 5 levels per named rank, ascendant at 46+
assert.equal(rankForLevel(1).rankKey, "novice_i");
assert.equal(rankForLevel(5).rankKey, "novice_v");
assert.equal(rankForLevel(6).rankKey, "apprentice_i");
assert.equal(rankForLevel(46).rank, "ascendant");
assert.equal(rankForXp(0).rank, "novice");

// Rewards deterministic: E3 study → 40 XP, primary intellect 40, secondary focus floor(40*0.35)=14
const r1 = resolveRewards({ difficulty: 3, questType: "focus", activityKey: "study_learning", microCountToday: 0, currentStreak: 0 });
assert.equal(r1.baseXp, 40);
assert.equal(r1.rewardXp, 40);
assert.equal(r1.primaryAttr, "intellect");
assert.equal(r1.secondaryAttr, "focus");
assert.equal(r1.primaryXp, 40);
assert.equal(r1.secondaryXp, 14);

// Example from PRD: 60 XP → secondary 21
const r2 = resolveRewards({ difficulty: 3, questType: "focus", activityKey: "study_learning" });
assert.equal(Math.floor(60 * 0.35), 21);
assert.equal(r2.secondaryXp, Math.floor(r2.rewardXp * 0.35));

// Anti-farming: micro cap at 5/day
const micro = (n: number) => resolveRewards({ difficulty: 1, questType: "quick", activityKey: "recovery", microCountToday: n });
assert.equal(micro(0).rewardXp, 10);
assert.equal(micro(4).rewardXp, 10);
assert.equal(micro(5).capped, true);
assert.equal(micro(5).rewardXp, 1);
assert.equal(micro(5).rewardCoins, 0);

// Epic capped for trivial types
const epicQuick = resolveRewards({ difficulty: 5, questType: "quick", activityKey: "recovery" });
assert.ok(epicQuick.rewardXp <= 75, "epic quick capped to major");
const epicCampaign = resolveRewards({ difficulty: 5, questType: "campaign", activityKey: "coding_building" });
assert.equal(epicCampaign.rewardXp, 120);

// Streak
const s1 = applyCompletionToStreak({ currentStreak: 0, bestStreak: 0, lastActiveDay: null }, { todayKey: "2026-09-12" });
assert.equal(s1.currentStreak, 1);
const s2 = applyCompletionToStreak({ currentStreak: 1, bestStreak: 1, lastActiveDay: "2026-09-11" }, { todayKey: "2026-09-12" });
assert.equal(s2.currentStreak, 2);
const s3 = applyCompletionToStreak({ currentStreak: 5, bestStreak: 5, lastActiveDay: "2026-09-10" }, { todayKey: "2026-09-12" });
assert.equal(s3.currentStreak, 1, "gap resets");
const sRest = applyCompletionToStreak({ currentStreak: 5, bestStreak: 5, lastActiveDay: "2026-09-11" }, { todayKey: "2026-09-12", isRestDay: true });
assert.equal(sRest.currentStreak, 5, "rest freezes");

// Momentum 0..100
assert.equal(momentumForActiveDays([], "2026-09-12"), 0);
assert.ok(momentumForActiveDays(["2026-09-12"], "2026-09-12") > 0);

// Companion deterministic, short
const msg = companionMessage("quest_complete");
assert.ok(msg.length < 80, "companion keeps dialogue short");
assert.equal(companionMessage("rest_day"), "Rest is part of the run. We're not quitting; we're recovering.");

console.log("rpgEngine.test.ts: all assertions passed");
