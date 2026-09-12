import assert from "node:assert";
import { resolveRewards } from "../src/rpg/index";
import { streakBonusCoins } from "../src/rpg/antiFarming";
import { companionMessage, companionMoodFor } from "../src/rpg/companion";

// Reward pipeline: Base → anti-farm cap → streak/context bonus → attribute split.
// Deterministic: identical inputs → identical outputs (LRP-RPG-001 §21).

// E3 Standard focus/study: 40 XP / 10 coins, intellect +40, focus +14, no streak bonus.
const base = resolveRewards({ difficulty: 3, questType: "focus", activityKey: "study_learning", microCountToday: 0, currentStreak: 0 });
assert.equal(base.baseXp, 40);
assert.equal(base.baseCoins, 10);
assert.equal(base.rewardXp, 40);
assert.equal(base.rewardCoins, 10);
assert.equal(base.primaryAttr, "intellect");
assert.equal(base.primaryXp, 40);
assert.equal(base.secondaryXp, 14);

// Streak bonus tiers (PRD v2 §18-compatible context bonus, deterministic).
assert.equal(streakBonusCoins(0), 0);
assert.equal(streakBonusCoins(3), 1);
assert.equal(streakBonusCoins(7), 2);
assert.equal(streakBonusCoins(14), 3);
assert.equal(streakBonusCoins(30), 5);
const withStreak = resolveRewards({ difficulty: 3, questType: "focus", activityKey: "study_learning", currentStreak: 7 });
assert.equal(withStreak.rewardCoins, 12, "10 base + 2 streak bonus");

// Micro cap: first 5 full, then floor (PRD v2 §26-§27).
const m5 = resolveRewards({ difficulty: 1, questType: "quick", activityKey: "recovery", microCountToday: 5 });
assert.equal(m5.capped, true);
assert.equal(m5.rewardXp, 1);
assert.equal(m5.rewardCoins, 0);

// Determinism: same input twice → same output.
const a = resolveRewards({ difficulty: 4, questType: "challenge", activityKey: "coding_building", currentStreak: 5 });
const b = resolveRewards({ difficulty: 4, questType: "challenge", activityKey: "coding_building", currentStreak: 5 });
assert.deepEqual(a, b);

// Overrides respected (user-controlled mapping, MASTER PRD §5).
const o = resolveRewards({ difficulty: 2, questType: "quick", activityKey: "study_learning", primaryOverride: "craft", secondaryOverride: "focus" });
assert.equal(o.primaryAttr, "craft");
assert.equal(o.secondaryAttr, "focus");
assert.equal(o.secondaryXp, Math.floor(o.rewardXp * 0.35));

// Choreography order (LRP-FE-001 §10): checkmark → xp → coins → attributes → companion → level/achievement.
const expectedOrder = ["checkmark", "xp", "coins", "attributes", "companion"];
assert.deepEqual(expectedOrder, ["checkmark", "xp", "coins", "attributes", "companion"]);

// Companion alignment (LRP-FE-001 §11): focused mood exists, messages short.
assert.equal(companionMoodFor("focus_started"), "focused");
assert.equal(companionMoodFor("quest_complete"), "celebrating");
assert.ok(companionMessage("quest_complete").length < 80);
assert.equal(companionMessage("rest_day"), "Rest is part of the run. We're not quitting; we're recovering.");

console.log("rewardFlow.test.ts: all assertions passed");
