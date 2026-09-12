
# LIFE RPG — BACKEND & DATABASE PRD

**Document ID:** LRP-BE-001  
**Version:** 1.0  
**Status:** Backend Baseline

## 1. Objective

The backend must maintain the user's LIFE RPG state securely and consistently.

It is responsible for:

- authentication integration;
- authorization;
- task persistence;
- routine generation;
- campaign state;
- focus sessions;
- reward calculation;
- progression;
- economy;
- inventory;
- achievements;
- historical records.

The problem statement specifically requires secure backend behavior, database persistence, CRUD functionality and user-specific data isolation. fileciteturn0file0L8-L12 fileciteturn0file0L47-L61

## 2. Database

Use PostgreSQL.

The data model is relational because quests, completions, campaigns, milestones, users, inventory and progression have strong relationships and require transactional updates.

## 3. Core Tables

### profiles

```text
id
display_name
hero_name
bio
hero_asset_id
companion_asset_id
created_at
updated_at
```

### profile_progression

```text
profile_id
lifetime_xp
season_xp
level
rank_key
coins
current_streak
best_streak
momentum
updated_at
```

### attributes

```text
id
key
name
description
```

### profile_attributes

```text
profile_id
attribute_id
xp
level
updated_at
```

### activity_types

```text
id
key
name
description
primary_attribute
secondary_attribute
primary_ratio
secondary_ratio
active
```

### quests

```text
id
user_id
title
description
quest_type
activity_type_id
difficulty
estimated_minutes
scheduled_for
due_at
status
campaign_id
milestone_id
is_pinned
recurrence_rule
created_at
updated_at
```

### quest_instances

```text
id
quest_id
occurrence_date
status
completed_at
```

### quest_completions

```text
id
user_id
quest_id
instance_id
idempotency_key
completed_at
base_xp
reward_xp
reward_coins
primary_attribute_xp
secondary_attribute_xp
```

### campaigns

```text
id
user_id
title
description
status
target_date
created_at
updated_at
```

### campaign_milestones

```text
id
campaign_id
title
description
order_index
target_date
status
```

### focus_sessions

```text
id
user_id
quest_id
started_at
ended_at
planned_seconds
actual_seconds
status
```

### reward_ledger

```text
id
user_id
source_type
source_id
currency_type
amount
metadata
created_at
```

### items

```text
id
item_type
key
name
description
asset_path
price
rarity
metadata
active
```

### inventory

```text
user_id
item_id
acquired_at
source
```

### user_loadout

```text
user_id
frame_item_id
title_item_id
realm_item_id
effect_item_id
companion_emote_item_id
quest_skin_item_id
badge_case_item_id
hero_card_item_id
```

### achievements

```text
id
key
name
description
icon_path
rule_key
reward_coins
```

### user_achievements

```text
user_id
achievement_id
unlocked_at
```

## 4. Ownership

All user-owned records must be associated with the authenticated user's identity.

The backend must never use a client-supplied user identifier as proof of ownership.

## 5. Quest CRUD

Users must be able to:

- create;
- view;
- edit;
- schedule;
- complete;
- archive/delete

their own quests.

A deleted quest must not erase historical completion/reward records.

## 6. Activity Mapping

The database stores activity types instead of an infinite task catalog.

Example:

```text
activity_type = study_learning
primary = intellect
secondary = focus
```

The user may override the suggested attribute mapping when creating an individual Quest.

The final resolved reward values are stored at completion time.

## 7. Reward Calculation

Inputs:

```text
difficulty
activity type
estimated duration
quest type
campaign context
anti-farming state
```

Initial reward configuration:

```text
Effort 1 → 10 XP / 3 Coins
Effort 2 → 20 XP / 5 Coins
Effort 3 → 40 XP / 10 Coins
Effort 4 → 75 XP / 18 Coins
Effort 5 → 120 XP / 30 Coins
```

These values are configuration, not user-provided input.

## 8. Quest Completion Transaction

Completion must execute as one server-side transaction:

```text
Authenticate
→ Verify Ownership
→ Verify Not Already Completed
→ Resolve Reward
→ Create Completion
→ Add XP
→ Add Coins
→ Add Attribute XP
→ Update Streak
→ Evaluate Level
→ Evaluate Achievements
→ Update Campaign
→ Commit
```

## 9. Idempotency

Every completion request must have an idempotency key.

Repeated requests must not produce duplicate:

- XP;
- Coins;
- attributes;
- achievements;
- completion records.

## 10. XP Integrity

The client cannot submit authoritative reward values.

Forbidden trust pattern:

```json
{
  "xp": 100000,
  "coins": 99999
}
```

The server calculates the result.

## 11. XP Curve

Recommended:

```text
Required XP(level) =
floor(100 × level^1.55)
```

The backend must be the source of truth for level calculation.

## 12. Attribute Calculation

Example:

```text
Reward XP = 60

Primary attribute = 60
Secondary attribute = 21
```

Formula:

```text
secondary = floor(primary × 0.35)
```

The exact configuration remains centrally controlled.

## 13. Streak Calculation

A qualifying completed action contributes to the current day.

The backend determines:

- whether today is active;
- whether the previous qualifying day exists;
- whether the streak increments;
- best streak;
- rest-day behavior.

## 14. Campaign Progress

Campaign progress must be derived from milestone/quest state.

Do not allow the browser to directly set:

```text
progress = 100%
```

## 15. Routine Generation

A routine is a recurrence definition.

The backend creates individual dated instances.

Historical instances remain immutable.

## 16. Focus Sessions

The backend stores:

- planned duration;
- actual duration;
- start;
- finish;
- linked Quest.

The browser is responsible for displaying the countdown.

## 17. Store Purchase

A purchase executes transactionally:

```text
Authenticate
→ Verify Item
→ Verify Balance
→ Verify Ownership
→ Deduct Coins
→ Create Ledger Entry
→ Create Inventory Entry
→ Commit
```

## 18. Security

Required controls:

- authenticated private operations;
- ownership checks;
- database-level ownership rules where available;
- validated inputs;
- server-authoritative rewards;
- rate limiting for high-impact mutations;
- secret management outside source code.

## 19. Historical Integrity

Historical completion rewards must remain unchanged if:

- the Quest is edited;
- the Quest is archived;
- activity mappings change;
- reward configuration changes.

## 20. Indexing

Recommended:

```text
quests(user_id, status)
quests(user_id, scheduled_for)
quests(user_id, due_at)
quest_instances(quest_id, occurrence_date)
quest_completions(user_id, completed_at)
reward_ledger(user_id, created_at)
inventory(user_id)
campaigns(user_id, status)
focus_sessions(user_id, started_at)
```

## 21. Backend Acceptance Criteria

The backend is accepted when:

- authentication works;
- user data is isolated;
- Quest CRUD works;
- completion is transactional and idempotent;
- XP/Coins cannot be client-forged;
- historical rewards persist;
- store purchases are transactional;
- all primary state survives refresh and cross-device login.
