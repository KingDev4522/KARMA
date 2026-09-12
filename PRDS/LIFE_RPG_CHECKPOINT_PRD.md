# KARMA — CHECKPOINT PRD: Everything Shipped & How It Works

**Document ID:** LRP-CKPT-001
**Version:** 1.0 · **Status:** Implemented, verified, on `origin/main`
**Date:** 13 September 2026
**Supersedes nothing; indexes:** LRP-S606-001 (abandon/reminders), LRP-S607-001
(Round-2 polish), plus all seven foundation PRDs in `PRDS/`.

> Read together with the foundation PRDs for full pipeline context
> (Master, PRD v2, Blueprint v2, RPG Engine, Backend/DB, Frontend UX,
> System Architecture, V3 Redesign). This checkpoint records what changed
> since, and exactly how each piece is wired.

---

## 1. At a glance (all live, all verified)

| System | State | Proof |
|---|---|---|
| Quest abandon + XP negative marking (~25%, level never drops) | Done | `penalties.test.ts`, `POST /:id/abandon`, contract 43/43 |
| Universal timers (any quest, 1–240 min, pause/resume/recover) | Done | focus overlay + launcher + recovery dialog |
| Timer scenery (6 vignettes, per-minute rotation, mobile set) | Done | `components/scenery.tsx` |
| Splash gate (tap-to-enter, preload, animated art) | Done | `components/splash.tsx` |
| Generative BGM (6×30s raga-lofi loops) + navbar/timer/Settings mute | Done | `lib/bgm.ts` |
| Companion celebration bubble on every completion | Done | `components/celebration.tsx` |
| Character/companion ownership (first free, rest Store-earned) | Done | `identity/service` gates + 403s |
| Photo avatars (Supabase bucket, opt-in SQL) | Done | `sql/003_avatars_bucket.sql` |
| Radar Character Card, Realm flow rebuild, empty-state CTAs | Done | pages + CSS |
| Onboarding (character, name, photo, companion, goals, final goal) | Done | 5 steps + tour trigger |
| Personalize dressing room with locks | Done | inventory-driven |
| Store (skins, companions, frames, boxes; tiered prices) | Done | seed, 53 live items |
| Achievement title showcase | Done | grants in completion tx |
| XP ledger both directions | Done | Chronicle red rows |
| Mobile (drawer, bottom nav, collision fixes, landscape) | Done | CSS audit |
| Deploy (Render migrate+seed, keep-alive, cache, middleware) | Done | `render.yaml`, `db:deploy` |

Verification snapshot: backend `tsc` clean · 5/5 suites · frontend `tsc`
clean · `next build` 16 routes · contract 43/43.

## 2. Pipeline map (end to end, server-authoritative)

```text
SIGN-IN → splash gate (preload today/profile/store, tap enters, BGM unlocks)
  → onboarding (first run): character → name+photo → companion+name →
     goals → final goal + first quest → tour
  → TODAY (pinned/due/routine/campaign/unscheduled + spark, max 7)
  → QUEST → complete (XP/coins/attrs/streak/badge/title → bubble+ceremony)
          → abandon (−XP, skipped, re-queueable)
          → focus (any length, pause/resume/recover, finish auto-completes,
             early cancel −5 XP, scenery rotates, mute inline)
  → CAMPAIGN (milestones → quests → auto-advance → completion)
  → ROUTINE (rule → instances → per-day logging)
  → STORE (earn → buy → equip → Personalize/Realm/Card reflect)
  → CHRONICLE (story incl. −XP, 7-day chart, drill-down calendar, debrief)
  → BGM (6 lofi loops) + SFX, mutable anywhere, anytime
```

All game state lives in Supabase Postgres via the Render API; localStorage
holds only UI prefs (theme, motion, sound, tour, splash, drafts).

## 3. Database posture (why it is safe)

- No Prisma schema change in the last two rounds; all features reuse
  `profiles / quests / instances / campaigns / focus / ledger / items /
  inventory / loadout / achievements / rest_days`.
- Deploys run `prisma migrate deploy && prisma db seed` (`render.yaml` +
  `db:deploy`), so code can never outrun the database.
- Only opt-in SQL is `sql/003_avatars_bucket.sql` (photo uploads; feature
  degrades to a message when unapplied).
- Connection guidance stands: Render uses the direct (non-pooled) Supabase
  string for migrate/seed, per `render.yaml` comments.

## 4. Known honest limits (not hidden)

- Scenery, splash art and BGM are hand-built SVG/WebAudio — this environment
  has no image/video/audio generation tools, so there are no AI-painted scenes
  or recorded lofi tracks; everything is offline, zero-dependency and themed.
- True push reminders still need a worker + push infra; the in-app
  notification center (due/overdue/rhythm/streak/celebration) covers the loop.
- Photo upload requires running `003_avatars_bucket.sql` once in Supabase.
