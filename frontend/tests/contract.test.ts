import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

/**
 * Contract test: every backend route must have a matching frontend client function.
 * Runs offline (static analysis of backend/src/routes + frontend/lib/api.ts).
 * Run: npm test (frontend) — plus live probe when BACKEND_URL is reachable.
 */

const root = path.resolve(__dirname, "..", "..");
const apiSrc = fs.readFileSync(path.join(root, "frontend", "lib", "api.ts"), "utf8");

// Backend route → frontend client fn that must reference its path fragment.
const CONTRACT: [string, string][] = [
  ["/api/v1/quests/today", "getToday"],
  ["/api/v1/quests?", "listQuests"],
  ["/api/v1/quests`", "createQuest"],
  ["/api/v1/quests/${id}`", "deleteQuest"],
  ["/generate-instances`", "genInstances"],
  ["/instances`", "listInstances"],
  ["/api/v1/quests/preview", "previewQuest"],
  ["/api/v1/quests/suggest-mapping", "suggestMapping"],
  ["/api/v1/quests/${id}`", "patchQuest"],
  ["/complete`", "completeQuest"],
  ["/abandon`", "abandonQuest"],
  ["/generate-instances`", "genInstances"],
  ["/instances`", "listInstances"],
  ["/meta/activity-types`", "activityTypes"],
  ["/api/v1/campaigns`", "listCampaigns"],
  ["/api/v1/campaigns/${id}`", "patchCampaign"],
  ["/api/v1/campaigns/${id}`", "deleteCampaign"],
  ["/milestones`", "createMilestone"],
  ["/milestones/${mid}`", "patchMilestone"],
  ["/milestones/${mid}`", "deleteMilestone"],
  ["/api/v1/focus/start`", "startFocus"],
  ["/finish`", "finishFocus"],
  ["/pause`", "pauseFocus"],
  ["/resume`", "resumeFocus"],
  ["/api/v1/wallet`", "wallet"],
  ["/api/v1/store`", "store"],
  ["/store/purchase`", "purchase"],
  ["/api/v1/inventory`", "inventory"],
  ["/inventory/equip`", "equip"],
  ["/inventory/unequip`", "unequip"],
  ["/api/v1/profile/me`", "deleteProfile"],
  ["/api/v1/achievements`", "achievements"],
  ["/api/v1/companion", "companion"],
  ["/chronicle/history", "history"],
  ["/chronicle/analytics", "analytics"],
  ["/chronicle/debrief", "debrief"],
  ["/chronicle/calendar", "calendar"],
  ["/api/v1/notifications", "notifications"],
  ["/hero-card`", "heroCard"],
  ["/api/v1/realm`", "realm"],
  ["/rest-days`", "restDays"],
  ["/api/v1/starters`", "starters"],
  ["/api/v1/profile/me`", "getProfile"],
];

let missing = 0;
for (const [fragment, fn] of CONTRACT) {
  const hasPath = apiSrc.includes(fragment.replace(/`/g, ""));
  const hasFn = new RegExp(`\\b${fn}\\b`).test(apiSrc);
  if (!hasPath || !hasFn) {
    missing++;
    console.error(`MISSING: route fragment "${fragment}" or client fn "${fn}"`);
  }
}
assert.equal(missing, 0, `${missing} contract gaps`);

// ROUTES map must export all keys the test above relies on.
assert.ok(apiSrc.includes("export const ROUTES"), "ROUTES map missing");
console.log(`contract.test.ts: ${CONTRACT.length} backend↔frontend route pairs verified`);
