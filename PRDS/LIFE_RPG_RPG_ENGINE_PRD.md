
# LIFE RPG — RPG ENGINE & ECONOMY PRD

**Document ID:** LRP-RPG-001  
**Version:** 1.0  
**Status:** Game Systems Baseline

## 1. Purpose

Define the deterministic game rules that translate user-selected real-world work into progression and rewards.

## 2. Progression Layers

```text
Quest
 ↓
XP
 ↓
Hero Level
 ↓
Rank

Quest
 ↓
Attribute XP
 ↓
Attribute Level

Quest
 ↓
Coins
 ↓
Store

Repeated activity
 ↓
Streak / Momentum

Milestones
 ↓
Achievements
```

## 3. Attributes

```text
Strength
Vitality
Intellect
Focus
Discipline
Craft
Connection
Exploration
```

## 4. Activity Types

```text
Physical
Learning
Building / Coding
Creative
Focus / Deep Work
Routine / Habit
Social / Collaboration
Life Management
Exploration
Recovery
```

## 5. Mapping Rules

```text
Physical
→ Strength + Vitality

Cardio
→ Vitality + Strength

Learning
→ Intellect + Focus

Building
→ Craft + Intellect

Creative
→ Craft + Focus

Deep Work
→ Focus + Discipline

Routine
→ Discipline + Focus

Social
→ Connection + Discipline

Life Management
→ Discipline + Vitality

Exploration
→ Exploration + Intellect

Recovery
→ Vitality + Discipline
```

The user can modify the selected mapping for a specific Quest.

## 6. Difficulty

Difficulty describes estimated effort, not importance or personal value.

```text
1 — Tiny
2 — Light
3 — Standard
4 — Major
5 — Epic
```

## 7. Hero XP

Use a non-linear level curve:

```text
Required XP(level) =
floor(100 × level^1.55)
```

The curve should create rapid early feedback and progressively longer later progression.

## 8. Attribute XP

For a completed Quest:

```text
Primary XP = reward XP
Secondary XP = floor(reward XP × 0.35)
```

Attribute progression should remain independent from Hero Level.

## 9. Coins

Coins are spendable.

XP is not spendable.

This separation keeps the economy understandable.

## 10. Rewards

Suggested starting reward configuration:

```text
Tiny     → 10 XP / 3 Coins
Light    → 20 XP / 5 Coins
Standard → 40 XP / 10 Coins
Major    → 75 XP / 18 Coins
Epic     → 120 XP / 30 Coins
```

Campaign milestones and achievements can provide additional rewards.

## 11. Anti-Farming

The engine must prevent trivial actions from overpowering the economy.

Controls:

- completion idempotency;
- bounded Micro Quest rewards;
- difficulty limits;
- no duplicate reward for repeated submissions;
- no reward for manipulating client state.

## 12. Streak

A streak increments when the user completes qualifying activity on consecutive days.

Store:

- current streak;
- best streak;
- last qualifying date.

Historical best streak never decreases.

## 13. Momentum

Momentum summarizes recent consistency.

It should be less punitive than a streak.

Use it primarily as a motivational visualization.

## 14. Rest

Rest is a valid state.

The system should support a Rest Day without treating the user as having permanently failed.

## 15. Rank System

Recommended:

```text
Novice
Apprentice
Adept
Vanguard
Expert
Master
Elite
Legend
Mythic
Ascendant
```

Use sub-stages where necessary.

Example:

```text
Adept III
```

After the named progression, an endless star-based progression can be used.

## 16. Seasons

If seasons are implemented:

```text
Lifetime XP = permanent
Season XP = temporary
```

Season reset must never erase the user's historical activity, achievements or lifetime progression.

## 17. Achievement Engine

Achievements should be deterministic.

Examples:

```text
First Quest
Complete 1 Quest

Momentum
Complete 5 consecutive days

Deep Focus
Complete three 60+ minute Focus Quests

Campaigner
Complete first Campaign milestone

Polymath
Increase five attributes

Comeback
Return after an extended absence and complete a Quest
```

## 18. Completion Output

Every successful completion should return:

```text
XP gained
Coins gained
Primary attribute gain
Secondary attribute gain
New level if applicable
New rank if applicable
New streak
Unlocked achievements
Campaign progress change
```

## 19. Level-Up Experience

Level-up is a state transition, not merely a number change.

Visual sequence:

```text
XP bar fills
→ Level revealed
→ Rank/title revealed if applicable
→ Reward revealed
→ Companion reacts
```

## 20. Reward Philosophy

The system rewards:

**effort, consistency, progression and meaningful milestones.**

It must not reward:

- endless task creation;
- meaningless clicks;
- artificial client manipulation;
- unhealthy pressure.

## 21. Engine Acceptance Criteria

Identical inputs must produce deterministic rewards.

The client must never be able to alter authoritative XP, Coins or attribute rewards.

A completed Quest must create one and only one progression outcome.
