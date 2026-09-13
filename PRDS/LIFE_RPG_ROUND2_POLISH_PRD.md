# KARMA — SESSION PRD Round 2: Ownership, Celebration, Craft Polish

**Document ID:** LRP-S607-001
**Version:** 1.0 · **Status:** Implemented, verified, merged to `main`
**Date:** 13 September 2026
**Follows:** LRP-S606-001 (abandon & negative marking, universal timers, reminders)

> Design read: in-app product UI for a cozy-epic RPG habit app,
> premium-editorial ink-and-vermilion, existing system preserved, motion +1
> only where motivated. Accent lock vermilion; danger red reserved for loss.

---

## 0. Changelog (this round)

1. **Ownership gates (backend, `identity/service`)** — first character + companion
   free forever; later switches require Store ownership (traditional skins /
   companion items), else `403 Unlock … in the Store first`. Legacy players get
   one free traditional switch. First picks auto-grant their item rows.
2. **Store growth (seed)** — 6 traditional character skins (60 coins), 6 common
   companions (30 coins); evocative names (Ember/Gilded/… Title Boxes, Temple
   Frames I–XX). Prices verified tiered: 0 / 30 / 60 / 100 / 150 / 180 / 200 /
   220 / 250 / 300 / 350 / 400.
3. **Today never empty-by-confusion** — new `unscheduled` bucket fills Today up
   to 7 with dateless active quests; empty states carry action buttons
   (Create quest / Begin a journey). Campaign spotlight prefers ACTIVE journeys.
4. **Double-tap safety** — quest check buttons disable while their completion is
   in flight (server already idempotent; UI now can't double-fire).
5. **Per-quest timer choice** — Today primary quest has a minutes select
   (5–120 + custom 1–240); Focus page keeps presets + custom; any quest, any size.
6. **Companion celebration bubble** — every completion (Today/Quests/routines/
   Focus) raises a non-modal cheer with the player's OWN companion face + name
   and the event-specific backend message; completion payload now carries
   `companionAssetId/companionName/heroName`. First-login-of-day greeting kept.
7. **Focus recovery** — refresh mid-session offers Resume (remaining recomputed
   from server clock) or Discard; sub-minute accidental sessions hidden from
   Recent; early-cancel penalty explained inline.
8. **Ambient BGM** — three generative pads taking turns, gesture-gated,
   tab-hide suspend, Settings stop. SFX untouched and separately toggled.
9. **Photo avatars** — optional upload at signup + Personalize "Your photo"
   (Supabase `avatars` bucket, SQL in `backend/sql/003_avatars_bucket.sql`,
   2 MB cap, graceful fallback to character when missing).
10. **Personalize locking** — unowned characters/companions render
    grayscale with `Unlock · N` deep-links to Store; owned wear instantly and
    reflect everywhere via global refresh.
11. **Character Card** — kanji header removed, 8-spoke radar stat graph,
    profile-picture-first layout, "Choose titles" link.
12. **Realm rebuild** — hero card converted from absolute-positioned layers to
    normal flow (overlap impossible); sidebar profile opens Personalize.
13. **Copy** — user-facing "Hero" → "Character" (routes/identifiers unchanged);
    onboarding asks goals + final goal explicitly; activity filter condensed
    from 12 chips to a select.

## 1. Pipelines touched (all server-authoritative, Supabase-persisted)

```text
complete → companion{mood,message,face,names} → bubble + toast + ceremony
abandon → skipped + ledger · focus cancel → penaltyXp in finish response
patch identity → ownership gate → profile/inventory → refresh everywhere
upload photo → storage bucket → avatarAssetId URL → AvatarImg (fallback hero)
```

## 2. Acceptance (verified)

- `tsc` frontend/backend/seed clean · `next build` 16 routes · contract 43/43 ·
  backend suites 5/5 · pushed to `origin/main`.
- No Prisma schema change this round (avatar column predates it); only new SQL
  is the opt-in storage bucket file.
