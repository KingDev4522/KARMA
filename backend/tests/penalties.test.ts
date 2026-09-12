import assert from "node:assert";
import { cumulativeXpForLevel } from "../src/rpg/xpCurve";
import {
  ABANDON_PENALTY_BY_DIFFICULTY,
  abandonPenaltyFor,
  applyPenaltyToLifetime,
  FOCUS_EARLY_CANCEL_GRACE_SECONDS,
  FOCUS_EARLY_CANCEL_PENALTY_XP,
  focusCancelPenalty,
} from "../src/rpg/penalties";

// Penalty is ~25% of the difficulty's gain (gains: 10/20/40/75/120)
assert.deepEqual(
  [1, 2, 3, 4, 5].map(abandonPenaltyFor),
  [1, 2, 3, 4, 5].map((d) => ABANDON_PENALTY_BY_DIFFICULTY[d]),
);
assert.equal(abandonPenaltyFor(3), 10);
assert.equal(abandonPenaltyFor(99), 30); // clamped to epic
assert.equal(abandonPenaltyFor(0), 10); // invalid input falls back to standard

// One failure never wipes one success: max penalty (30) < min gain (10)? No —
// penalty is bounded per difficulty, and gains always exceed same-diff penalty.
assert.ok(abandonPenaltyFor(1) < 10);
assert.ok(abandonPenaltyFor(5) < 120);

// Levels never decrease: clamp at current level floor
const floor3 = cumulativeXpForLevel(3);
assert.deepEqual(applyPenaltyToLifetime(floor3 + 50, 3, 10), { newLifetime: floor3 + 40, applied: 10 });
assert.deepEqual(applyPenaltyToLifetime(floor3 + 5, 3, 30), { newLifetime: floor3, applied: 5 });
assert.deepEqual(applyPenaltyToLifetime(0, 1, 10), { newLifetime: 0, applied: 0 });

// Focus early-cancel: grace then sting
assert.equal(FOCUS_EARLY_CANCEL_GRACE_SECONDS, 300);
assert.equal(focusCancelPenalty(60), FOCUS_EARLY_CANCEL_PENALTY_XP);
assert.equal(focusCancelPenalty(299), 5);
assert.equal(focusCancelPenalty(300), 0);
assert.equal(focusCancelPenalty(2700), 0);

console.log("penalties.test.ts: all assertions passed");
