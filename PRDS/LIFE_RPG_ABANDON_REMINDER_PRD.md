# KARMA — SESSION PRD: Abandon & Negative Marking, Universal Timers, Reminders, Title Showcase

**Document ID:** LRP-S606-001
**Version:** 1.0
**Status:** Implemented, verified, merged to `main`
**Date:** 13 September 2026
**Basis:** LIFE RPG Master PRD, PRD v2, RPG Engine PRD, Backend/DB PRD, Frontend UX PRD, Master Blueprint v2, V3 Redesign PRD

> Design read: in-app product UI for a cozy-epic RPG habit app, premium-editorial
> ink-and-vermilion language, existing CSS-variable system + framer-motion + real
> asset imagery. Dials: preserve existing, motion +1 only where motivated
> (penalty sting, coin flights, achievement reveals), density unchanged.
> Accent lock: vermilion `#BC4028`; penalties use danger red `#D64545`.

---

## 0. What this session shipped (changelog)

1. **Quest abandon with XP negative marking** — any quest (any type, any size) can be
   stopped from its Manage panel via a two-tap armed confirm that previews the exact
   cost (`Abandon −10 XP` → `Confirm −10 XP`). New backend endpoint
   `POST /api/v1/quests/:id/abandon`; quest parks in `skipped` (re-queueable, history
   kept); penalty ledgered (`sourceType "abandon"`); red toast + low thud sound.
2. **Equalized penalty math** — abandon costs ~25% of the difficulty's gain
   (3 / 5 / 10 / 20 / 30 XP vs gains 10 / 20 / 40 / 75 / 120). One failure can never
   wipe out one success. **Levels never decrease**: deduction clamps at the current
   level floor, so only progress-into-the-level is at risk. Streak, momentum, coins,
   attributes and achievements are untouched.
3. **Universal focus timer** — every quest (spark through campaign) can hold any
   timer length: presets 5–120 min plus a custom 1–240 min field on the Focus page;
   quest cards keep launching focus with their estimated length. Full
   pause / resume / finish / leave cycle, server-persisted.
4. **Early-cancel penalty** — leaving a linked focus session before 5 real minutes
   costs 5 XP (`−5 XP` toast + sound); long sessions stopped late cost nothing. The
   quest itself is never touched — it waits for another run.
5. **Reminders & future scheduling** — quest creator gains `Pick a date` (any future
   date) plus an optional due-moment picker that feeds the notification center;
   notifications now also cover **overdue quests** ("N overdue — no shame") and
   **today's routine instances** in the due-today count. Draft persistence extended.
6. **Titles you behold, not just buy** — every achievement now also unlocks a title
   box or frame (First Blood → Title Box 5 … Polymath → Title Box 11, Tiny Steps /
   Comeback / Builder → Frames 5/6/7), granted idempotently inside the completion
   transaction, announced in the badge toast, wearable instantly in Personalize.
7. **Two-direction XP ledger** — Chronicle story shows red `−X XP` rows for
   abandons and early focus cancels (from the reward ledger), next to green gains.
8. **Store price tiers** — starters free; title boxes 100/150; frames 100/200/300;
   warrior skins 220 (epic top), premium companions 250–400. Nothing shares a flat
   price; premium costs premium.
9. **Safety** — `penalties.test.ts` (9 assertions) added to backend suite; contract
   test covers the abandon route (43 pairs). Full `tsc` + `next build` + suites green.

---

## 1. Abandon pipeline (the core loop)

```text
Quest card → Manage → Abandon −N XP → Confirm −N XP
  → POST /quests/:id/abandon
  → Auth → Ownership → State guard (completed/skipped/archived reject)
  → penalty = table(difficulty), clamped at level floor
  → lifetimeXp −= applied · ledger(−applied, "abandon") · quest → skipped
  → { penaltyXp, newLifetimeXp, rankDisplay, companion "missed_task" line }
  → red toast + thud + global refresh (header/realm/card update)
```

Re-queue returns the quest to `active` (no XP refund — the ledger stays honest).
Archive stays penalty-free (archiving is organizing, not failing).

## 2. Penalty math (equalized with gains)

| Difficulty | Gain XP | Abandon −XP | Ratio |
|---|---|---|---|
| 1 Tiny | 10 | 3 | 30% |
| 2 Light | 20 | 5 | 25% |
| 3 Standard | 40 | 10 | 25% |
| 4 Major | 75 | 20 | 27% |
| 5 Epic | 120 | 30 | 25% |

Focus early-cancel: flat 5 XP under 300 real seconds, 0 above. Rationale: quitting in
the first minutes is avoidance; stopping a long session late is a decision.

## 3. Timer matrix (every quest, every length)

| Entry | Lengths | Pause | Resume | Finish→reward | Cancel cost |
|---|---|---|---|---|---|
| Quest card Focus button | estimated min | ✓ | ✓ | one-tap complete | −5 XP if <5 min |
| Focus page launcher | 5/15/25/45/60/90/120 + custom 1–240 | ✓ | ✓ | one-tap complete | −5 XP if <5 min |
| Campaign quest | same as any quest | ✓ | ✓ | one-tap complete | −5 XP if <5 min |

## 4. Reminder pipeline

```text
Creator (Pick a date + due moment) → scheduledFor / dueAt
  → Today buckets (pinned/due/routine/campaign) + Chronicle calendar dots
  → Notification center: due-today (+ rhythm instances), overdue, streak-risk,
     celebrations, campaign next-objective — all pref-gated in Settings
```

## 5. Title showcase pipeline

```text
Quest complete → achievement check → badge + coins + title box/frame grant
  → toast "Badge earned: X · +N coins · + Title Box 5"
  → Chronicle badge entry → Personalize (wear) → Realm/Hero Card/Store reflect
```

## 6. UI contract (what the player sees)

- Abandon chip previews cost *before* arming; armed state is danger-red with Keep.
- Penalty toasts read `stopped · −N XP` / `Left early · −5 XP`; zero-penalty edge
  (level floor) reads `stopped · no XP lost` — never a bare number.
- Chronicle penalties render red with a close glyph; gains unchanged.
- Copy register: plain functional sentences, no mock-poetic micro-copy.
- Reduced-motion: no coin flights, no delta pops; totals and states still shown.

## 7. Acceptance (all verified this session)

- Abandon Tiny at level floor → 0 XP lost, quest skipped, re-queue works.
- Abandon Standard mid-level → −10 XP, ledger row, Chronicle red entry, header XP drops.
- Focus cancel at 2 min → −5 XP; at 40 min → 0 XP; quest untouched both times.
- First quest completion → First Blood toast names Title Box 5; item in inventory.
- Creator Pick-a-date + due moment → calendar dot + due notification + overdue notice next day.
- `tsc` (frontend/backend/seed) clean · `next build` 16 routes · contract 43/43 ·
  backend suite 5/5 files green · pushed to `origin/main`.
