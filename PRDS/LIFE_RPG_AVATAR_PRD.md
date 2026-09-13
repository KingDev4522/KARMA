# KARMA — AVATAR & OVERVIEW PRD: Two-Up Identity, Full Growth, Frame Overlay

**Document ID:** LRP-AVATAR-001
**Version:** 1.1 · **Status:** Implemented, verified, on `origin/main`
**Date:** 13 September 2026

> **CORRECTION (v1.1) — terminology lock, my earlier wording mixed these up:**
> - **Avatar = one of the six characters. NEVER framed, never mixed.**
> - **Profile Picture = photo / companion / character image choice.**
>   ONLY the profile picture ever wears a frame.
> - **Title Box = name plate.** Always shows the name, legibly.
> Any older line in this doc implying otherwise is superseded by the above.

> Design read: same realm, true faces. Photo-first in small slots, character
> large beside it; frames overlay portraits; all 8 attributes always visible.

---

## 1. What changed and why

| Demand | Root cause | Fix |
|---|---|---|
| Studio preview showed no portrait | `.studio-avatar-wrap` fixed 130×130 box vs 3:4 frame stage | Flexible wrap; preview is now two-up: **Profile picture + Character**, labeled |
| "Show character, not companion" | Single `AvatarImg` follows picture setting | Both shown side by side, labeled, everywhere it matters |
| Photo upload "not sticking" | Bucket-dependent path + silent states | In-profile JPEG, verified re-read before celebrating, explicit errors |
| Overview Growth showed 3 of 8 | `getToday` `take: 3` | Full canonical 8 in `attributeSnapshot` |
| Frame beside/inside image | Padded inset box | True overlay: portrait full-bleed (`cover`, top-anchored), frame art on top (`contain`, z-index, pointer-events none) |
| Card missing pieces | Text-only rank, dots-only badges, avatar-only portrait | Rank badge chip, written 8-attribute list (Lv + XP bars), named badge pills, character portrait + picture + companion sections |
| Tutorials firing beyond signup | — | Verified first-signup-only (onboarding arms, welcome seeds done, per-user keys); no change needed |
| "Old images showing" | — | MD5 audit: all 65 `assets/`↔`public/` pairs identical; pre-existing staleness was pre-sync deploys |

## 2. Contracts (unchanged pipelines)

- Identity reads: profile → `AvatarImg` (photo → companion → character) +
  labeled `HeroImage` (always the chosen of the six).
- Writes: photo patch → verified re-read → global refresh → sidebar, topbar,
  preview, card update together.
- No backend/DB change (display + static-asset round only).

## 3. Acceptance (verified this session)

- `tsc` frontend/backend clean · `next build` 16 routes · contract 43/43 ·
  backend 5/5 suites · art checksum 65/65 identical.
