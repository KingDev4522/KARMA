import assert from "node:assert";
import { enumerateDates } from "../src/modules/routines/service";

// Every 2 days over 7 days → days 0,2,4,6 (anchored at window start)
assert.deepEqual(enumerateDates("2026-09-14", "2026-09-20", { freq: "custom", every: 2, unit: "day" }), [
  "2026-09-14",
  "2026-09-16",
  "2026-09-18",
  "2026-09-20",
]);

// Every 2 weeks on Mon/Fri across 3 weeks → week 0 (Mon,Fri) + week 2 (Mon,Fri)
// 2026-09-14 is a Monday.
assert.deepEqual(
  enumerateDates("2026-09-14", "2026-10-04", { freq: "custom", every: 2, unit: "week", days: [1, 5] }),
  ["2026-09-14", "2026-09-18", "2026-09-28", "2026-10-02"],
);

// Ends after 3 caps a daily run
assert.deepEqual(enumerateDates("2026-09-14", "2026-09-30", { freq: "daily", ends: { type: "after", count: 3 } }), [
  "2026-09-14",
  "2026-09-15",
  "2026-09-16",
]);

// Ends on a date truncates
assert.deepEqual(enumerateDates("2026-09-14", "2026-09-30", { freq: "daily", ends: { type: "on", date: "2026-09-15" } }), [
  "2026-09-14",
  "2026-09-15",
]);

// Legacy shapes unchanged
assert.equal(enumerateDates("2026-09-14", "2026-09-16", { freq: "daily" }).length, 3);
assert.deepEqual(enumerateDates("2026-09-14", "2026-09-20", { freq: "weekly", days: [1] }), ["2026-09-14"]);

// Invalid input rejected, nothing half-written (throw before any DB touch)
assert.throws(() => enumerateDates("2026-09-14", "2026-09-20", { freq: "weekly", days: [] }), /weekday/);
assert.throws(() => enumerateDates("2026-09-14", "2026-09-20", { freq: "custom", every: 2, unit: "week", days: [] }), /weekday/);
assert.throws(() => enumerateDates("2026-09-14", "2026-09-20", { freq: "daily", ends: { type: "after", count: 0 } }), /1–100/);
assert.throws(() => enumerateDates("2026-09-14", "2026-09-20", { freq: "daily", ends: { type: "on", date: "not-a-date" } }), /YYYY-MM-DD/);
assert.throws(() => enumerateDates("2026-09-20", "2026-09-14", { freq: "daily" }), /Invalid date range/);

console.log("routines.test.ts: all assertions passed");
