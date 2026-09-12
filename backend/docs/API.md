# KARMA Backend — API

Modular monolith (`backend/src`). Auth: Supabase JWT (`Authorization: Bearer`), never trust client `userId`.
Errors: `{ error: { code, message, details, retryable } }` — `retryable=true` → show [Try Again] (LRP-FE-001 §18).

## Read models (minimal blocking requests, LRP-FE-001 §21)

- `GET /api/v1/quests/today?date=YYYY-MM-DD&tz=Asia/Kolkata` → greeting (hero/level/coins/xp/rank/timeOfDay **in the viewer's timezone**, UTC fallback), companion greeting, **buckets** `{pinned, dueToday, routine, campaign, spark}`, combined `quests` (max 7), campaign summary + `progressPct`, `attributeSnapshot` (top 3), `streak`, `recentReward`, `emptyHints`.
- `GET /api/v1/realm` → hero, companion, progression + xp/rank, attributes, achievements, collection, equipped, heroCard (LRP-FE-001 §12).
- `GET /api/v1/hero-card` → preview-optimized card: identity, level/rank, top attrs, streak, **title name**, achievements, campaigns, equipped (LRP-FE-001 §14).
- `GET /api/v1/chronicle/history|analytics|debrief`
- `GET /api/v1/profile/me`, `GET /api/v1/profile/me/progression`
- `GET /api/v1/campaigns/:id` → `progressPct`, `questCount`, `nextMilestone`, `nextQuest` (LRP-FE-001 §8).

## Quest card + creation (LRP-FE-001 §6-§7)

- `GET /api/v1/quests/suggest-mapping?activityKey=study_learning` → `{primary, secondary, source}`.
- `POST /api/v1/quests/preview` `{difficulty, questType, activityKey, overrides}` → base/reward XP+coins, attr split, `capped`, `previewNote`. Same engine as completion.
- `POST /api/v1/quests` task-first create. `PATCH /:id`, `DELETE /:id` (soft, history retained).
- Quest card render from: `title, questType, estimatedMinutes, activityType, primary/secondary (+preview.rewards)`.

## Completion (LRP-FE-001 §10 choreography)

- `POST /api/v1/quests/:id/complete` `{idempotencyKey, instanceId?}` — never send xp/coins (rejected 400).
- Returns `rewardXp/Coins, primary/secondary, newLevel, leveledUp, rank, streak, momentum, unlockedAchievements, campaignProgress, capped` + **`choreography`** ordered steps (checkmark→xp→coins→attributes→companion→[achievement]→[level_up]) + **`companion {mood, message}``.
- Replays with same `idempotencyKey` return original, no double reward.

## Focus (LRP-FE-001 §9)

- `POST /api/v1/focus/start` `{questId?, plannedSeconds}` → `running`.
- `POST /api/v1/focus/:id/pause` → `paused`. `POST /:id/resume` → `running`. `POST /:id/finish` `{status: completed|cancelled, actualSeconds?}`.

## Store (LRP-FE-001 §13)

- `GET /api/v1/store` → `{coins, items[]}` with `preview (=assetPath), price, rarity, owned, equipped, status: equipped|owned|available|locked`.
- `POST /api/v1/store/purchase` `{itemId}` → `{entry, item, balance, loadout}` (equip immediately after confirm).
- `GET /api/v1/inventory`, `POST /api/v1/inventory/equip {itemId}`, `POST /api/v1/inventory/unequip {slot}`.
- `nameplate` items equip to the `frameItemId` hero-chrome slot (documented; FE renders nameplate from loadout frame slot when item type is nameplate).

## Companion (LRP-FE-001 §11)

- `GET /api/v1/companion?event=app_open|first_quest|quest_complete|level_up|achievement|campaign_milestone|missed_task|return_after_absence|store_purchase|rest_day|focus_started` → `{event, message, mood, context, companionAssetId}`.
- Moods: `idle|greeting|encouraging|celebrating|focused|resting` (`curious` deprecated alias of `focused`).

## Misc

- `PATCH /api/v1/profile/me` identity + UX prefs `{reducedMotion, theme}` + notification prefs `{notifyQuest, notifyStreak, notifyCelebrate}` (persisted; localStorage is cache only).
- `DELETE /api/v1/profile/me` erases all app data (and the Supabase Auth identity when a service-role key is configured). Double-confirm in UI.
- `GET /api/v1/chronicle/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD` unified feed: scheduled quests + routine instances + milestones + focus sessions (62-day cap).
- `GET /api/v1/notifications` deterministic center: due quests, streak risk, recent badges, next objective + active prefs.
- `GET /api/v1/quests?preview=true` attaches `rewardPreview` to every row; `GET /api/v1/quests/:id` always previews.
- Completion returns `rankUp: {from, to, bonusCoins} | null` + matching `rank_up` ledger entry.
- `GET /api/v1/starters` deterministic starter suggestions from `lifeDomains`.
- `GET|POST /api/v1/rest-days`, `GET /api/v1/achievements`, `GET /api/v1/wallet`.
- `GET /health`.
