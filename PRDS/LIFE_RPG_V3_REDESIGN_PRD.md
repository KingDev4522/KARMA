# KARMA (LIFE RPG) — V3 Rebrand PRD: Master Blueprint + Answers to Every Open Question

**Status:** Accepted for `frontend-v2` rebuild · **Scope:** 1-day hackathon prototype, IIT Bhubaneswar
**Rule:** backend contract unchanged (`backend/docs/API.md`). All rewards server-authoritative. This PRD answers the long brainstorm prompt, question by question, and locks the frontend-v2 redesign.

> Taste skill note: `taste` is **not installed** in this environment (only `customize-opencode` exists), so this redesign hand-rolls an equivalent RPG taste direction — **"Temple-ink & Marigold"** — instead of depending on the skill.

---

## 0. One-paragraph pitch

KARMA turns your real life into a cozy-epic RPG. You pick a **fixed hero** (one of six, each rooted in an Indian region — we now have real skins: Meera, Dev, Zoya, Tenzing, Arjun, Kavya in `character skins/`), name them, pick a **companion** who talks to you like Clash of Clans' chief-greeter, and convert anything you actually do — drink water, gym, code, call parents — into **Quests**. Completing quests bursts **XP + Coins + Attribute growth**, climbs an infinite **Level/Rank ladder**, keeps a **streak**, and earns **identity cosmetics** (frames, titles, realm themes — never clothes, see §7) you show off on your **Hero Card**. Today shows one **Primary Quest + grouped march** (never one giant "build portfolio" blob). Everything is tappable on mobile and rich on desktop.

---

## 1. Hero & companion — locked decisions (your biggest worry)

### 1.1 Heroes: 6 fixed assets, no body-builder. Correct call, keep it.
Custom body sliders would eat the whole hackathon and add zero demo value (there is no 3D world to walk the body around in). Instead:

| Hero | Region | Skin folder (just pulled) | Personality line |
|---|---|---|---|
| Meera | Central | `character skins/central - meera/` (4 moods) | Warm, steady |
| Dev | East | `character skins/east - Dev/` | Bold, bright |
| Zoya | North | `character skins/north - zoya/` | Sharp, calm |
| Tenzing | North-East | `character skins/north east - tenzing/` | Kind, high-altitude grit |
| Arjun | North-West | `character skins/north west - arjun/` | Disciplined archer energy |
| Kavya | South | `character skins/south - kavya/` | Poetic, precise |

Each hero ships **4 art variants** already in repo: `traditional` (default portrait), `warrior` (level-up / inferno quests), `modern` (focus room), `holiday` (streak celebration / rest day). Frontend maps `heroAssetId` → folder; variant switches by context. **No per-limb customization in v1.** Future: layered PNG accessories (headgear only) once an artist pipeline exists.

Onboarding asks: **hero → hero name → companion → life domains → first micro-quest**. Also asks for a 1-line **oath** (the "description" you wanted: goal, strengths, bad habit to break). Stored on profile, shown on Realm. Diary is **cut from v1** (see §10) — oath covers identity, diary ships as Chronicle-notes later.

### 1.2 Companion: the emotional layer, deterministic (no AI needed)
Companion is a small creature (Spark / Moss / Emberling today; reskin later). It:
- greets on app open by time-of-day + streak ("Good morning, Dave. Day 6 — the temple bell rang twice for you."),
- celebrates every completion ("+50 XP! Meera stands taller."),
- nags kindly after 48h absence + sends web notification,
- announces level-ups, milestones, store purchases, rest days.

Implementation: backend `GET /api/v1/companion?event=` returns `{mood, message}` from a **deterministic template table** (event × streak-bucket × time-of-day), no LLM. Frontend renders it in a **speech bubble** next to the companion on Today + Realm + Level-up modal. Full line-list lives in `LIFE_RPG_RPG_ENGINE_PRD.md`; v3 adds absence + purchase + rest lines.

### 1.3 Where the hero "acts"
No full animation rig in v1. Instead, three cheap-but-juicy reactions (all already in engine, now styled gold):
1. **XP burst particles** fly from the completed card to the coin pill (`burstAt`),
2. **Hero variant swap**: `traditional` → `warrior` for 3s on level-up; `holiday` on streak milestone,
3. **Realm plinth glow** + BGM sting (`clear` / `levelup` SFX). Reduced-motion safe.

---

## 2. Quest taxonomy — "how many things can we give?" (all of these, nothing else)

| Quest type | What it is | Example | Reward shape |
|---|---|---|---|
| **Spark** (micro, ≤15 min, diff 1) | 2–5 min life sparks, user-picked from presets or custom | Drink water, water plants 5 min, stretch, clear desk, step outside | 10–20 XP, 2–4 coins, **capped** (see §4) |
| **Quick** | Normal todo, unscheduled | Read 10 pages, call parents | 25–60 XP |
| **Focus** | Quest + timer session | DSA 45 min, portfolio section | base + focus bonus (+40 XP/session) |
| **Ritual** (routine) | Recurring; each occurrence = one instance | Gym M/W/F 18:00, journal nightly | standard each instance; streak multiplier |
| **Campaign** | Long goal broken into milestones → quests | Build Portfolio → Auth → "Implement login screen" | milestone bonus on completion |
| **Challenge** | Hard, high difficulty 4–5 | Run 10k, ship launch | 100–200 XP, big coins |
| **Recovery** | Rest counts as progress | Sleep 8h, rest day, walk slow | small XP, protects streak |

To-do list, timer, calendar, rituals are **views over the same Quest object**, not separate systems: To-do = Today's march; Timer = Focus session on a quest; Calendar = `scheduledFor/dueAt` projection; Ritual = routine template + instances. This interconnection is why the backend has one `/quests` resource with `questType`, `scheduledFor`, `generate-instances`.

**Presets (starter shelf, customizable down to minutes):** water (2m), plants (5m), stretch (5m), desk (5m), sunlight (5m), pages (15m), run (20m), DSA (45m), guitar (30m), call home (10m), top-3 tomorrow (5m). User can rename/retime everything. First-run suggests 3 by chosen life-domains.

---

## 3. The attribute problem — SOLVED (finite rules × infinite intent)

Your fear is right: free text can't map to attributes, and hardcoding every real-life act is infinite. The solution (already in backend, now surfaced properly in UI) is a **3-layer sandwich**:

1. **Finite `activityKey` vocabulary (~12):** `cardio, strength, study_learning, deep_work, creative_practice, social_collab, life_admin, exploration, recovery, routine_habit, mindfulness, nourish`. The user NEVER types an attribute — they pick an activity (8 big friendly tiles in the creator: Move / Mind / Create / Connect / Explore / Focus / Nourish / Tidy).
2. **Server mapping table** (`activityKey` → primary + secondary attribute, §5 of master PRD: e.g. gym/cardio → Vitality+Strength; coding → Craft+Intellect; posting/business → Connection+Craft). `GET /quests/suggest-mapping` returns it.
3. **Per-quest override:** `primaryOverride/secondaryOverride` — the user can correct the suggestion ("this run was actually Discipline for me"). Coding can never *accidentally* land in Strength; it only lands there if the user deliberately overrides, which is their prerogative ("player defines progress, system defines representation").

Gym-sub-exercise rabbit hole (bench vs squat vs swim): **deliberately not modeled.** Gym = one quest with an activity; if the user wants granularity they split quests. Depth comes from streaks/campaigns, not exercise taxonomy.

---

## 4. XP & coin economy — concrete numbers (no more "50 × something")

All math server-side; frontend only previews via `POST /quests/preview`.

- **Base XP by difficulty:** d1=15, d2=30, d3=55, d4=100, d5=160. Duration adds +1 XP per 5 min capped +30. Focus finish adds +40. Streak adds +2%/day capped +30%.
- **Anti-farm caps (the answer to "what stops 200 water quests?"):** Sparks capped at **100 XP + 20 coins/day** combined; soft-cap beyond: rewards halve with `capped:true` + note shown in UI. Quests preview endpoint returns `capped` so the creator warns before creation.
- **Coins:** ≈ XP/5 (d1≈4, d3≈12, d5≈32) + streak bonus coins. Coins spend, XP never spends.
- **Attributes:** quest XP splits 70/30 primary/secondary. Attribute level curve: `need(attrLv) = floor(80 × attrLv^1.4)`.
- **Hero level curve (non-linear, per problem statement):** `need(heroLv) = floor(100 × heroLv^1.55)` → Lv1→2 needs 100 (two small quests, feels great), Lv10 needs ~3500, Lv30 needs ~20k. Numbers live in backend; frontend draws the bar from `xpProgress`.

---

## 5. Levels & ranks — infinite ladder, yearly seasons optional

**Rank ladder (10 ranks × numbered stars, toughness grows):** Novice (1–3★) → Apprentice → Adept → Vanguard → Expert → Master → Elite → Legend → Mythic → **Ascendant (∞ stars)**. Early ranks need 1 level each; Elite+ needs 3–5 levels per star; Ascendant never caps — stars accumulate forever (your "godly then infinite" idea, formalized).

Level-up grants **coins + a free common cosmetic every rank-up** (not per star — economy control). Season reset (yearly) is **opt-in prestige**: lifetime level/rank/achievements are permanent; season badge + fresh seasonal level runs alongside. Never wipe lifetime — problem statement demands persistence.

---

## 6. Today's Quest / Daily march — the aggregation rule

Today = union, deduped, sorted: **pinned → dueToday → routine instances → campaign next-action → spark suggestion**. Display grouped under one march with kind ribbons, ONE Primary Quest on top ("Today's Quest" = first pinned else first due). Long campaigns never render as a blob: only the **next actionable quest** surfaces ("Implement login screen", not "Build Portfolio"), with the campaign path (Campaign → Milestone → this quest) as breadcrumb. Stale (>3d overdue, untouched) auto-suggests reschedule/skip — no shame, just routing.

---

## 7. Store — what to sell when bodies are fixed (your hardest question, answered)

**Do NOT sell clothes/skins for the hero body in v1.** With fixed 2D assets, clothing overlays are a rigging trap and there's no world to show them off in. Sell **identity & realm cosmetics that are visible everywhere** (Today, Realm, Hero Card, Focus room):

Frames · Titles · Nameplates · **Realm Themes** (Today/Realm backdrop — biggest seller) · XP Burst Effects · Companion Emotes · Quest Card Skins · Badge Cases · Hero Card Themes · Soundtrack Disks.

Why anyone buys when they "can't show off": (a) **they see it 50×/day themselves** (realm theme + frame wrap every screen — private luxury, like a phone wallpaper); (b) **Hero Card export** (PNG share to Instagram/status — the extrovert loop); (c) **rank-gated rarities** (Mythic frame = status even if never shared). Introverts get (a), extroverts get (b)+(c). Future layered headgear/pets only after export loop proves demand.

Pricing: commons 50–150, rares 300–600, epics 1000+, mythic rank-gated. Every rank-up grants one free common so the store is never pay-to-feel-bad (coins are earned-only, no IAP in prototype).

---

## 8. Why anyone uses this instead of a todo app (user types)

- **The Anxious Beginner:** tiny sparks + companion kindness + Lv1 in two quests. Never shamed.
- **The Grinder (programmer/gym):** campaigns + focus + attribute proof ("Craft Lv 7 says I'm real").
- **The Aesthete:** realm themes, frames, hero card as identity object.
- **The Social:** hero-card PNG flex, streak bragging, future guilds (cut in v1).
- **The Quiet:** private streak + rest-day forgiveness. No feed, no followers in v1 — **deliberately not addictive-social**. Posting-to-social quests are allowed as Connection quests but never auto-post; the app never rewards screen-time.

Addiction guardrails: no infinite feed, no loot boxes, no streak-punishment (Rest Days protect streak; momentum decays softly, never to zero overnight).

---

## 9. Screens (v1 locked) & v2-cut list

Today (hero stage + companion bubble + primary + march + growth) · Quests (filter + 5-step creator) · Campaigns (world map + milestones) · Focus (dungeon room + timer + BGM morph) · Realm (hero stage + identity + attributes + achievements + loadout) · Chronicle (timeline + weekly chart) · Store (shelves + disks) · Hero Card (export PNG) · Settings · Onboarding (4 steps). **Cut for v1:** diary (oath covers it), social feed/guilds, custom body builder, monthly themes, IAP.

---

## 10. Acceptance walkthrough (demo script, 3 min)

Signup → choose Arjun → name him → pick Moss → domains [Learning, Fitness] → oath "Ship portfolio, kill doomscroll" → first quest "Drink water" → complete (+XP burst, companion cheers) → create "DSA 45m" Focus → finish (+40) → level-up ceremony (warrior variant flash) → streak 1 → Realm shows growth → Store buys Autumn Realm Theme → equip → Hero Card export PNG. Refresh: everything persists (server DB, never localStorage-primary).

---

## 11. Asset pipeline (where designs live)

`character skins/<region> - <hero>/{traditional,warrior,modern,holiday}-<hero>.jpeg` (24 files, just pulled). Frontend `Hero` component gains `hero` + `variant` props (v3 implements variant prop with graceful fallback to SVG Aki while JPEGs are being masked/optimized). Companion stays SVG (cheap, expressive). Realm themes = CSS gradients + existing dungeon SVG biomes (cavern/inferno/summit/overworld). No external asset service; no Antigravity dependency — plain Next.js + CSS.
