# KARMA Media Assets Specification & Delivery PRD

## 1. Executive Summary

This document details the generation, optimization, and organization of the **KARMA Media Asset Pack** — a complete suite of visual and sonic assets crafted in a **Makoto Shinkai / Studio Ghibli anime aesthetic fused with authentic Indian cultural scenery, architecture, and classical music traditions**.

All assets are strictly isolated within the [`assets/`](file:///c:/Users/Debjeet%20Mazumder/Desktop/Coding/C%20Code%20Runner/KARMA/assets) directory. **Zero application code changes and zero Git pushes** have been performed, preserving your codebase for direct integration.



## 2. Directory Structure & File Locations

All generated assets are organized in two complementary structures:
1. **Device-Categorized Hierarchy** (`desktop/`, `mobile/`, `audio/`): Cleanly structured for modular asset loaders.
2. **Flat Root Mirror** (`assets/media/`): Exact 1-to-1 filename match corresponding to the Delivery Checklist for zero-config drop-in replacement.

```
KARMA/
└── assets/
    ├── desktop/
    │   ├── sceneries/                      # 1920×1080 Landscape Timer Sceneries
    │   │   ├── scenery-1-dawn.jpg
    │   │   ├── scenery-2-thar.jpg
    │   │   ├── scenery-3-monsoon.jpg
    │   │   ├── scenery-4-dusk.jpg
    │   │   ├── scenery-5-night.jpg
    │   │   └── scenery-6-backwater.jpg
    │   ├── splash/                         # 1920×1080 Landscape Splash Art
    │   │   └── splash-desktop.jpg
    │   └── loading/                        # 1280×720 Seamless 4s Loop (Muted)
    │       ├── splash-loop-desktop.webm    # Primary (VP9)
    │       └── splash-loop-desktop.mp4     # Fallback (H.264)
    ├── mobile/
    │   ├── sceneries/                      # 1080×1920 Portrait Timer Sceneries
    │   │   ├── scenery-1-dawn-mobile.jpg
    │   │   ├── scenery-2-thar-mobile.jpg
    │   │   ├── scenery-3-monsoon-mobile.jpg
    │   │   ├── scenery-4-dusk-mobile.jpg
    │   │   ├── scenery-5-night-mobile.jpg
    │   │   └── scenery-6-backwater-mobile.jpg
    │   ├── splash/                         # 1080×1920 Portrait Splash Art
    │   │   └── splash-mobile.jpg
    │   └── loading/                        # 720×1280 Seamless 4s Loop (Muted)
    │       ├── splash-loop-mobile.webm     # Primary (VP9)
    │       └── splash-loop-mobile.mp4      # Fallback (H.264)
    ├── audio/                              # 30-second Seamless Loops (-14 LUFS)
    │   ├── bgm-dhoop.mp3                   # 96 BPM Yaman Bansuri + Tabla
    │   ├── bgm-rain.mp3                    # 88 BPM Khamaj Sitar + Rain
    │   ├── bgm-marigold.mp3                # 104 BPM Bhupali Harmonium + Dholak
    │   ├── bgm-night.mp3                   # 80 BPM Bhairavi Sarod + Bell
    │   ├── bgm-riverbank.mp3               # 100 BPM River Flute + Shaker
    │   ├── bgm-sandalwood.mp3              # 92 BPM Malkauns Mridangam + Bass
    │   └── wav/                            # Studio Master 24-bit PCM WAVs
    │       ├── bgm-dhoop.wav
    │       ├── bgm-rain.wav
    │       ├── bgm-marigold.wav
    │       ├── bgm-night.wav
    │       ├── bgm-riverbank.wav
    │       └── bgm-sandalwood.wav
    └── media/                              # Flat Delivery Mirror (24 Exact Files)
        ├── scenery-1-dawn.jpg
        ├── scenery-1-dawn-mobile.jpg
        ├── scenery-2-thar.jpg
        ├── scenery-2-thar-mobile.jpg
        ├── scenery-3-monsoon.jpg
        ├── scenery-3-monsoon-mobile.jpg
        ├── scenery-4-dusk.jpg
        ├── scenery-4-dusk-mobile.jpg
        ├── scenery-5-night.jpg
        ├── scenery-5-night-mobile.jpg
        ├── scenery-6-backwater.jpg
        ├── scenery-6-backwater-mobile.jpg
        ├── splash-desktop.jpg
        ├── splash-mobile.jpg
        ├── splash-loop-desktop.webm
        ├── splash-loop-desktop.mp4
        ├── splash-loop-mobile.webm
        ├── splash-loop-mobile.mp4
        ├── bgm-dhoop.mp3
        ├── bgm-rain.mp3
        ├── bgm-marigold.mp3
        ├── bgm-night.mp3
        ├── bgm-riverbank.mp3
        └── bgm-sandalwood.mp3
```

---

## 3. Global Aesthetic & Palette Lock Compliance

All visual assets strictly adhere to the defined palette lock and styling rules:
* **Deep Indigo Night (`#232B55`)**: Used for cosmic night skies, deep mountain shadows, and water depths.
* **Vermilion Accent (`#BC4028`)**: Used for temple shikharas, flags, terracotta roofs, and sunset horizons.
* **Marigold Gold (`#E8A33D`)**: Used for glowing diya lamps, flower fields, sun crowns, and warm highlights.
* **Ivory (`#F7F3EA`)**: Used for Himalayan snow caps, morning mist, prayer flags, and marble details.
* **Teal (`#5E8A7A`)**: Used for Western Ghats foliage, Kerala backwater reflections, and monsoon clouds.
* **Rules Followed**: No text, no letters, no watermarks, no character close-ups (tiny distant silhouettes only), center 50% calm composition for timer UI / logo overlay.

---

## 4. Delivery Checklist & Asset Specifications

### A. Timer Sceneries (12 Files)

| ID | Title | Desktop Path (1920×1080) | Mobile Path (1080×1920) | Visual Description |
|:---|:---|:---|:---|:---|
| **S1** | Himalayan Dawn | `assets/desktop/sceneries/scenery-1-dawn.jpg` | `assets/mobile/sceneries/scenery-1-dawn-mobile.jpg` | Rose-gold sunrise over snowy Himalayan peaks, fluttering prayer flags diagonally strung, birds mid-sky, glowing marigold field in foreground, morning mist between ridges. |
| **S2** | Thar Gold | `assets/desktop/sceneries/scenery-2-thar.jpg` | `assets/mobile/sceneries/scenery-2-thar-mobile.jpg` | Golden desert dunes at late afternoon, giant low sun, carved sandstone temple arch silhouette, wind ripples on dunes, horizon heat shimmer. |
| **S3** | Monsoon Hills | `assets/desktop/sceneries/scenery-3-monsoon.jpg` | `assets/mobile/sceneries/scenery-3-monsoon-mobile.jpg` | Teal-grey Western Ghats in soft rain, translucent diagonal rain streaks, mountain mist, reflective mirror lake, small stone temple with warm glowing interior on shoreline. |
| **S4** | Marigold Dusk | `assets/desktop/sceneries/scenery-4-dusk.jpg` | `assets/mobile/sceneries/scenery-4-dusk-mobile.jpg` | Maroon-to-ember sunset, huge low sun centered, dual temple shikhara spires on flanks, floating diya oil-lamp glows along steps and water, purple-orange clouds. |
| **S5** | Himalayan Night | `assets/desktop/sceneries/scenery-5-night.jpg` | `assets/mobile/sceneries/scenery-5-night-mobile.jpg` | Deep indigo starry night over moonlit snow peaks, crescent moon upper right, twinkling stars, warm diya lights along valley path, still lake reflection. |
| **S6** | Backwater Emerald | `assets/desktop/sceneries/scenery-6-backwater.jpg` | `assets/mobile/sceneries/scenery-6-backwater-mobile.jpg` | Kerala backwaters morning, leaning coconut palms framing sides, emerald water with soft ripples, small wooden canoe with distant silhouette, pale gold sun, two flying egrets. |

---

### B. Splash Art (2 Files)

| Orientation | Resolution | File Path | Visual Description |
|:---|:---|:---|:---|
| **Desktop** | 1920×1080 JPG | `assets/desktop/splash/splash-desktop.jpg` | Wide multicultural Indian panorama at golden hour: Himalayan snow peaks on the left, ancient temple town and ghats in middle, backwater palms and houseboats on right; birds crossing sky; warm radiant glow in center for logo placement. |
| **Mobile** | 1080×1920 JPG | `assets/mobile/splash/splash-mobile.jpg` | Vertical recomposition of the multicultural panorama: sky and flock of birds in top third, temple spires and mountain ridge across the middle, flowing river path flanked by ghat steps leading down to bottom (with calm space for "Continue" button). |

---

### C. Loading Screen Video Loops (4 Files)

Specs: 4.0 seconds duration, 24 fps (96 frames), seamless loop, muted, retro pixelated anime aesthetic highlighting Indian culture.

| Device | Format | Resolution | File Size | File Path | Animation Mechanics |
|:---|:---|:---|:---|:---|:---|
| **Desktop** | WebM (VP9) | 1280×720 | ~230 KB | `assets/desktop/loading/splash-loop-desktop.webm` | Slow breathing push-in (zoom 1.0 to 1.04), floating marigold petals swaying with harmonic wrap, diya flames pulsating with warm golden glow, two birds crossing sky, subtle pixel-art anime texture. |
| **Desktop** | MP4 (H.264) | 1280×720 | ~449 KB | `assets/desktop/loading/splash-loop-desktop.mp4` | Universal fallback version with identical 4s seamless loop. |
| **Mobile** | WebM (VP9) | 720×1280 | ~400 KB | `assets/mobile/loading/splash-loop-mobile.webm` | Vertical portrait loop over the temple ghat dusk scene, floating petals, pulsating diya reflections, drifting clouds, birds crossing. |
| **Mobile** | MP4 (H.264) | 720×1280 | ~710 KB | `assets/mobile/loading/splash-loop-mobile.mp4` | Universal fallback version with identical 4s seamless loop. |

---

### D. Audio Engine Tracks (6 Tracks / 12 Files)

Specs: 30.0 seconds exact duration, 44.1 kHz, mastered to -14 LUFS, soft loop envelope, 320 kbps MP3 + 24-bit studio WAVs.

| ID | Track Title | BPM | Raga / Scale | Instrumentation | Catchy 5s Hook & Description |
|:---|:---|:---|:---|:---|:---|
| **T1** | Dhoop | 96 | Raag Yaman (D major, tivra Ma #4) | Tanpura in D, 8-beat Keherwa tabla groove (Dha-Ge-Na-Ti), bansuri flute, tape hiss | Distinct 4-note Yaman ascent (E4-F#4-G#4-A4) in first 5s; warm morning lofi pulse; resolves to tonic D. |
| **T2** | Rain Raga | 88 | Raag Khamaj (Mixolydian, komal Ni b7) | Soft rain bed, plucked sitar with tarab resonance, mellow kick, monsoon rim | Melodic call-and-response sitar phrase answering itself in first 5s; soothing rainy atmosphere; resolves to C. |
| **T3** | Marigold | 104 | Bhupali Pentatonic (D-E-F#-A-B) | Harmonium chords (D-G-A-Bm), dholak-lite bounce, handclap groove | Most uplifting track; clappable rhythm with joyful flute hook in first 5s; sunrise energy; resolves to D. |
| **T4** | Night Vigil | 80 | Raag Bhairavi (Phrygian mode) | Deep meditative ambient pads, sparse sarod with meend slide, bronze bell | Struck temple bell at **0:02** and **0:17**; deep cosmic sub-bass and serene late-night contemplation; resolves to C. |
| **T5** | Riverbank | 100 | Major Pentatonic in G (G-A-B-D-E) | Flowing river water bed, bansuri flute lead, soft 8th-note shaker, soft kick | Sweetest, most melodic bansuri hook in first 5s; flowing water texture; resolves to tonic G. |
| **T6** | Sandalwood | 92 | Raag Malkauns (C-Eb-F-Ab-Bb) | Mridangam soft groove (tha-dhi-thom-nam), deep acoustic low end, bansuri | Mystical, ancient, deeply spiritual; warm low-end sub and microtonal slides; resolves to tonic C. |

---

## 5. Integration Notes for Developer

When wiring the media into your components:
1. **Timer Sceneries (`scenery.tsx`)**:
   - Reference via `/assets/desktop/sceneries/scenery-${i + 1}-${name}.jpg` or `/assets/media/scenery-${i + 1}-${name}.jpg`.
   - Rotate per minute using `elapsedSeconds / 60 % 6`.
2. **Splash Gate**:
   - Preload `splash-desktop.jpg` or `splash-mobile.jpg` as background cover.
   - Embed `splash-loop-desktop.webm` (with `.mp4` fallback) as video background behind the loader.
3. **BGM Audio Engine**:
   - Load `bgm-dhoop.mp3` through `bgm-sandalwood.mp3` with `loop = true`.
   - Mastered cleanly at -14 LUFS to prevent clipping across device speakers.
