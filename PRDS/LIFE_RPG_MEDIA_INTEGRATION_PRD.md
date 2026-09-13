# KARMA — MEDIA INTEGRATION PRD: Real Art, Video & Audio Wiring

**Document ID:** LRP-MEDIA-001
**Version:** 1.0 · **Status:** Implemented, verified, on `origin/main`
**Date:** 13 September 2026
**Sources:** `PRDS/KARMA_MEDIA_ASSETS_SPEC_PRD.md` (delivery spec),
`frontend/lib/media.ts` (manifest), user prompt-pack counts (6 sceneries,
6 tracks — nothing more, nothing less).

> Design read: same realm, real paint. All motion motivated (scene changes
> mark minutes passing; fades mark track changes), vermilion accent lock kept,
> reduced-motion respected everywhere.

---

## 1. What → where → when → why (the full mapping)

| Asset (shipped file) | Used in | Orientation rule | When / why |
|---|---|---|---|
| `scenery-{1..6}-{dawn..backwater}.jpg` (1920×1080) | Focus overlay backdrop | Desktop viewport (>760px) | Per-minute rotation = visible passage of time during the session |
| `scenery-{n}-*-mobile.jpg` (1080×1920) | Focus overlay backdrop | Mobile viewport (≤760px, live `matchMedia`) | Same minute, portrait composition |
| `splash-desktop.jpg` / `splash-mobile.jpg` | Splash gate background | Same viewport rule | Instant paint while the 4s loop + data load |
| `splash-loop-{desktop,mobile}.webm` (+`.mp4` fallback) | Splash gate, over the JPG | Same viewport rule | 4s seamless loop during the 3–5s preload window |
| `bgm-{dhoop,rain,marigold,night,riverbank,sandalwood}.mp3` | Global BGM engine | N/A (audio) | Back-to-back 30s loops, all day |
| WAV masters | Nowhere in-app | — | Studio archive only, excluded from git |

SVG scenery and the generative pad engine remain as **offline fallbacks**
(missing file → art degrades one level, never a blank or an error).

## 2. Playback contracts

- **Scenery:** `sceneryIndexFor(elapsedSec) = floor(elapsed/60) % 6` — scene N
  owns minute N of any timer; crossfade 1.1s on change; preloaded next-minute
  art during focus.
- **Splash:** JPG paints instantly → video autoplays muted/loop/inline on top
  (poster = JPG; any failure hides the video, JPG stays) → tap/Continue enters
  (also the audio-unlock gesture) → sessionStorage gate, once per tab.
- **Audio chain per track:** play → 1.5s fade-in → 30s → 1.2s fade-out →
  0.8s silence → next track (preloaded mid-track). Track errors skip forward;
  total failure falls back to the generative engine; Settings/navbar/timer
  mute stops everything instantly. Track names surface in Settings.

## 3. Sizes & performance

Images ≈ 7 MB desktop set + 4 MB mobile set (only one set ever loads —
viewport-chosen, lazy except splash/first-minute). Video ≤710 KB per file,
only on splash. MP3s ≈ 1.2 MB each, fetched one at a time on demand.
`public/` files are served static, never bundled — First Load JS unchanged.

## 4. Acceptance (verified this session)

- All 24 filenames resolve under `frontend/public` (12 + 6 + 6).
- Missing-file fallbacks exercised by design (onError → SVG / JPG / generative).
- `tsc` clean · `next build` 16 routes · contract 43/43 · backend 5/5 suites.
