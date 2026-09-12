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
- `hero_skin` items carry `metadata.heroAssetId` (`<hero>-<variant>`); equipping also flips `Profile.heroAssetId` so Today/Realm/Hero Card change immediately. `companion` items carry `metadata.companionAssetId` and flip `Profile.companionAssetId` the same way. Loadout slots: `heroSkinItemId`, `companionItemId`.
- Today (`GET /api/v1/quests/today`) returns a top-level `hero {heroAssetId, heroName, companionAssetId, companionName}` block for instant header/portrait render (single call, no follow-up fetch).

## Companion (LRP-FE-001 §11)

- `GET /api/v1/companion?event=app_open|first_quest|quest_complete|level_up|achievement|campaign_milestone|missed_task|return_after_absence|store_purchase|rest_day|focus_started` → `{event, message, mood, context, companionAssetId}`.
- Moods: `idle|greeting|encouraging|celebrating|focused|resting` (`curious` deprecated alias of `focused`).

## Misc

- `PATCH /api/v1/profile/me` identity + UX prefs `{reducedMotion, theme}` + notification prefs `{notifyQuest, notifyStreak, notifyCelebrate}` (persisted; localStorage is cache only). Identity fields: `displayName, heroName, companionName, bio (oath), heroAssetId (<hero>-<variant>), companionAssetId, avatarAssetId (null = follow hero, `<hero>-<variant>`, or `companion:<id>`), lifeDomains`.
- Starter kit: every profile is granted frames 1–4 + title boxes 1–4 (free, `source: "starter"`) on creation and on profile/store reads — Personalize always has day-one options. Retired placeholder items (old SVG/JSON art) are seed-deactivated; owners keep inventory, Store hides them.
- `DELETE /api/v1/profile/me` erases all app data (and the Supabase Auth identity when a service-role key is configured). Double-confirm in UI.
- `GET /api/v1/chronicle/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD` unified feed: scheduled quests + routine instances + milestones + focus sessions (62-day cap).
- `GET /api/v1/notifications` deterministic center: due quests, streak risk, recent badges, next objective + active prefs.
- `GET /api/v1/quests?preview=true` attaches `rewardPreview` to every row; `GET /api/v1/quests/:id` always previews. `POST /api/v1/quests/preview` resolves with live user state (streak + today's micro count) so cap warnings are honest.
- `POST /api/v1/quests/:id/abandon` stops a quest with XP negative marking (~25% of the difficulty's gain: 3/5/10/20/30; level never drops — clamps at level floor). Quest → `skipped` (re-queueable), ledger `sourceType "abandon"`, streak/coins/attrs untouched.
- `POST /api/v1/focus/:id/finish {status: cancelled}` returns `penaltyXp` (5 XP when cancelled before 300 real seconds on a linked quest, else 0); the quest itself is never touched.
- Achievements grant title boxes/frames (`rewardItems` in `unlockedAchievements`) in-transaction, idempotent.
- Notifications include overdue quests and today's routine instances alongside due/streak/celebration/campaign items.
- Micro-quest cap counts true micros (difficulty 1 + quick/recovery) through the quest relation — low-XP campaign/focus completions never inflate it.
- `GET /api/v1/campaigns` includes live `progressPct + questCount` per journey; `DELETE /api/v1/campaigns/milestones/:mid` removes a milestone (linked quests keep history, link nulls).
- Focus finish on a linked quest is followed by `POST /api/v1/quests/:id/complete` with idempotency key `focus-<sessionId>` — one tap from timer to reward, retries never double-grant. `GET /api/v1/focus` includes the linked quest title.
- Completion returns `rankUp: {from, to, bonusCoins} | null` + matching `rank_up` ledger entry.
- `GET /api/v1/starters` deterministic starter suggestions from `lifeDomains`.
- `GET|POST /api/v1/rest-days`, `GET /api/v1/achievements`, `GET /api/v1/wallet`.
- `GET /health`.
