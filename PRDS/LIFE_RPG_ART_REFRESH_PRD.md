# KARMA — ART REFRESH PRD: New Team Art Wired End to End

**Document ID:** LRP-ART-001
**Version:** 1.0 · **Status:** Implemented, verified, on `origin/main`
**Date:** 13 September 2026
**Context:** team delivered re-cut art (cropped/centered skins, new frames,
title boxes, coin, BGM changes) plus a focus classical player. The site kept
showing old art because `frontend/public/` still held the previous copies.

> Design read: same realm, true paint. Motion only where it already was.

---

## 1. Why old images showed (root causes, all fixed)

| Cause | Fix |
|---|---|
| `frontend/public/{heroes,companions,frames,brand}` were stale copies from the first art drop | Re-synced all 24 + 10 + 31 + logo from `assets/`; coin downscaled to 256px for particles/pills (5 MB → ~40 KB) |
| Frame CSS assumed square art (`cover` + padding); new frames are mixed aspect (375×666 … 500×500) | `FrameWrap` is now a fixed 3/4 stage: frame art `contain`, portrait centered in the opening, `contain` — heads never crop, nothing left-aligns |
| Skins are now ~square (1695×1536) with centered subjects | Portraits render `contain`-centered in every stage (Today, Realm, card, preview, store, onboarding) |
| Duplicate 34 MB WAV (`…(Take 1) (1).wav`), unreferenced | Deleted from `public/` |
| Uploads could fail silently against old backends | Upload now re-reads the profile and only celebrates on byte-match, else names the failure |

## 2. Avatar truth (profile photo pipeline)

```text
Your-photo tile / signup photo → downscale 320px JPEG → profile.avatarAssetId
  → verified re-read → AvatarImg everywhere (sidebar, topbar, preview, card)
```

Companions stay companions; characters stay characters; the photo is the
player. `resolveAvatar` treats http(s) + data-URLs as photos with hero
fallback if the file ever disappears.

## 3. Focus classical player (team delivery, kept + verified)

10 tracks in `FOCUS_CLASSICAL_TRACKS` — every `src` and `fallbackSrc` checked
against `frontend/public/audio/focus/` on disk: all resolve. Mounted in the
focus overlay; independent from global BGM + SFX mutes.

## 4. Note on the reported hero-card screenshot

The card in the report ("3 LOADOUT ITEMS ACTIVE…") does not exist anywhere on
`main` (searched) — verify against the production Vercel URL of `main`. The
shipped Character Card shows avatar → title box → companion → 8-spoke radar
from live profile data.

## 5. Acceptance (verified this session)

- All `public/` art byte-matches the new `assets/` drops (counts 24/10/31).
- `tsc` clean · `next build` 16 routes · contract 43/43 · backend 5/5 suites.
- No Prisma/database change (display + static assets only).
