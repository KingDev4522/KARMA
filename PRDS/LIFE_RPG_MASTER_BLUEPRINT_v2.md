
# LIFE RPG — MASTER PRODUCT BLUEPRINT v2.0

This document compresses the PRD and TRD into one build map.

---

# 1. The one-sentence product

**LIFE RPG turns real-world actions into quests, quests into measurable growth, growth into character identity, and identity into motivation.**

---

# 2. The system

```text
USER
 |
 | chooses identity
 v
HERO + COMPANION
 |
 | sets goals
 v
CAMPAIGN
 |
 | broken into milestones
 v
QUEST
 |
 +---- Quick
 +---- Focus
 +---- Routine
 +---- Challenge
 +---- Recovery
 |
 v
ACTION
 |
 +---- normal completion
 +---- focus timer
 |
 v
SERVER REWARD ENGINE
 |
 +---- Hero XP
 +---- Attribute XP
 +---- Coins
 +---- Streak
 +---- Momentum
 +---- Achievements
 +---- Campaign progress
 |
 v
VISIBLE FEEDBACK
 |
 +---- XP burst
 +---- Companion reaction
 +---- Level-up
 +---- New badge
 +---- Store balance
 |
 v
IDENTITY
 |
 +---- Title
 +---- Frame
 +---- Realm
 +---- Companion emote
 +---- Hero Card
 |
 v
RETURN
```

---

# 3. The differentiator

Most productivity apps answer:

> “What do I need to do?”

LIFE RPG answers:

> “What do I need to do, what part of me does it strengthen, and what am I becoming?”

---

# 4. The three game layers

## Layer A — Action

Tasks, routines, focus, calendar.

## Layer B — Progression

XP, levels, attributes, streaks, achievements.

## Layer C — Identity

Hero, companion, titles, cosmetics, Hero Card, realm.

A feature belongs in the product only if it strengthens one of these layers or connects two of them.

---

# 5. The seven essential screens

### 1. Today

The current mission.

### 2. Quests

The work library.

### 3. Campaigns

The long-term journey.

### 4. Focus

The execution room.

### 5. Realm

Character + attributes + collection.

### 6. Chronicle

History + calendar + analytics.

### 7. Store

Identity and cosmetic progression.

---

# 6. Home screen wireframe logic

```text
┌─────────────────────────────────────────────┐
│ Greeting + Hero Level       Coins  🔔       │
│ Companion message                           │
├─────────────────────────────────────────────┤
│ TODAY                                       │
│ "Your next quest"                           │
│                                             │
│ [ Quest card ]                              │
│ [ Quest card ]                              │
│ [ Quest card ]                              │
│                                             │
├─────────────────────────────────────────────┤
│ ACTIVE CAMPAIGN                             │
│ Build Portfolio           62%               │
│ Next: Finish homepage                        │
├─────────────────────────────────────────────┤
│ ATTRIBUTE SNAPSHOT                           │
│ Intellect  ████████                         │
│ Focus      ██████                           │
│ Craft      █████████                        │
├─────────────────────────────────────────────┤
│ Recent reward / streak / achievement        │
└─────────────────────────────────────────────┘
```

The visual hierarchy must always favor today's actionable work.

---

# 7. Today's Quest logic

Display:

**Pinned + Due + Campaign + Routine + optional Spark**

Maximum default visible count: 5–7.

Long-term goals never appear as giant to-do items.

Example:

```text
Campaign:
"Build SaaS Project"

Milestone:
"Authentication"

Today's Quest:
"Implement login endpoint — 45 min"
```

---

# 8. Quest card

Every card should show:

```text
[icon]
TITLE

Quick / Focus / Routine / Campaign
45 min
INTELLECT + FOCUS

+60 XP    +10 coins

[Start] [Complete]
```

The reward is visible before action.

---

# 9. Completion choreography

```text
CLICK COMPLETE
      |
      v
card compresses
      |
      v
checkmark locks
      |
      v
XP number floats upward
      |
      v
coins increment
      |
      v
attribute bar moves
      |
      v
companion celebrates
      |
      +---- level up? ---- yes ---> Level-up ceremony
      |
      v
quest archived into history
```

The completion sequence should take roughly 700–1400 ms, not 5 seconds.

---

# 10. Level-up ceremony

```text
CURRENT
Level 7

XP BAR
███████████████████

        ↓

LEVEL UP

        8

"APERTURE ADEPT"

Reward:
+25 Coins
New Title Unlocked
```

Optional:
- particles
- sound
- companion celebration
- subtle screen pulse

---

# 11. Attribute system

```text
STRENGTH
Vitality
Intellect
Focus
Discipline
Craft
Connection
Exploration
```

Each attribute should have:

- level
- XP
- progress bar
- short definition
- recent contribution source

Example:

> Focus +21 from “Study React for 45 minutes.”

This teaches the user how the system works.

---

# 12. Attribute taxonomy

```text
PHYSICAL
Physical Training -> Strength + Vitality
Cardio            -> Vitality + Strength

MENTAL
Study             -> Intellect + Focus
Deep Work         -> Focus + Discipline

CREATIVE
Coding/Building   -> Craft + Intellect
Art/Writing       -> Craft + Focus

CONSISTENCY
Routine           -> Discipline + Focus

SOCIAL
Conversation      -> Connection + Discipline
Collaboration     -> Connection + Craft

LIFE
Household         -> Discipline + Vitality

EXPLORATION
New Experience    -> Exploration + Intellect

RECOVERY
Rest/Recovery     -> Vitality + Discipline
```

---

# 13. Why user-defined tasks remain safe

The user can write:

> “Build a weather app”

The app never needs to parse the phrase.

The user selects:

**Coding / Building**

That determines the RPG mapping.

This avoids both extremes:

**Hardcoded infinite task library** — impossible.

**AI understanding every task perfectly** — unnecessary.

The product uses:

**human-defined task + controlled archetype + deterministic reward rules**

---

# 14. Long-term campaign model

Campaigns are the answer to:

> “How do I turn a huge goal into a game?”

```text
CAMPAIGN
Build Portfolio
|
+-- Research
|
+-- Design
|
+-- Build
|    |
|    +-- Hero section
|    +-- Projects section
|    +-- Contact form
|
+-- Polish
|
+-- Publish
```

Completion should move a visual campaign map.

---

# 15. Routine model

Routine:

> Exercise Mon/Wed/Fri at 7 PM.

Generates:

```text
Mon -> quest instance
Wed -> quest instance
Fri -> quest instance
```

Each occurrence gets independent completion history.

---

# 16. Focus model

A quest can launch Focus.

```text
Quest
"Study algorithms"
        |
        v
Focus
45:00
        |
        v
Complete
        |
        v
Reward
```

Focus sessions can count toward achievements.

---

# 17. Store model

The Store should feel like a game store without requiring a game world.

Categories:

```text
FRAMES
TITLES
NAMEPLATES
COMPANION EMOTES
REALM THEMES
XP EFFECTS
QUEST SKINS
BADGE CASES
HERO CARD THEMES
```

This solves the utility problem of cosmetics.

A cosmetic changes how the product feels every time the user uses it.

---

# 18. The Hero Card

The Hero Card is the external identity object.

```text
┌───────────────────────────────┐
│       HERO NAME               │
│       LEVEL 18 • MYTHIC II    │
│                               │
│        [ HERO ART ]           │
│                               │
│  STR  72     INT  91          │
│  FOC  84     CRAFT 88         │
│                               │
│  14 DAY STREAK                │
│  "THE CONSISTENT BUILDER"     │
│                               │
│  Campaign: 73%                │
└───────────────────────────────┘
```

The user can export it.

This provides showcase value without requiring internal social media.

---

# 19. Companion event matrix

```text
APP OPEN
-> greeting

FIRST QUEST
-> encouragement

QUEST COMPLETE
-> celebration

LEVEL UP
-> excitement

ACHIEVEMENT
-> praise

CAMPAIGN MILESTONE
-> proud/epic

MISSED TASK
-> neutral recovery

RETURN AFTER ABSENCE
-> welcome back

STORE PURCHASE
-> approval

REST DAY
-> reassurance
```

---

# 20. Content strategy

Keep dialogue short.

The companion should rarely speak more than one or two sentences.

Avoid:

> “Congratulations on completing this task. Through your diligent work..."

Prefer:

> “Quest cleared. That one mattered.”

The game feels better when dialogue is contextual and sparse.

---

# 21. Micro Quest examples

Starter library:

```text
Drink a glass of water
Water the plants
Stretch for 5 minutes
Step outside
Read 2 pages
Clear your desk
Write tomorrow's top 3
Make your bed
Put away 5 items
Meditate for 2 minutes
```

These are optional, not compulsory.

The user chooses what belongs in their system.

---

# 22. Personalization model

User controls:

- hero identity
- companion
- focus areas
- task names
- schedule
- recurrence
- campaign goals
- titles
- cosmetics
- notifications
- rest days

System controls:

- reward math
- attribute mapping rules
- persistence
- transaction integrity
- achievement detection
- inventory ownership

This is the right division between user agency and game-system integrity.

---

# 23. “Smart without AI” principle

The product can look intelligent through deterministic composition.

Example:

```text
User focus = Fitness
+ Morning
+ Streak = 6
+ Workout routine due
=
"Your workout is due today.
You're one day away from a 7-day consistency badge."
```

No AI model is required.

This is faster, cheaper and more reliable for a hackathon.

---

# 24. Visual language

Recommended:

**Premium fantasy + modern productivity**

Not:
- generic SaaS blue
- Bootstrap cards
- cartoon overload
- excessive gradients
- constant particles

Yes:
- strong typography
- dark surface
- luminous accents
- character art
- restrained glass
- motion hierarchy
- clear progress bars
- layered depth

---

# 25. Design token concept

```text
SURFACE
background
elevated
card
overlay

TEXT
primary
secondary
muted
inverse

STATE
success
warning
danger
info
xp
currency

MOTION
micro
standard
celebration
```

No component should define arbitrary one-off colors.

---

# 26. Mobile design

Primary mobile navigation:

```text
Today | Quests | Campaigns | Realm | Chronicle
```

Store can live inside Realm or as a prominent secondary action.

Focus becomes full-screen.

Companion can move to a compact floating/inline position.

---

# 27. Desktop design

Left navigation:

```text
TODAY
QUESTS
CAMPAIGNS
FOCUS
REALM
CHRONICLE

----------------
STORE
SETTINGS
```

Main dashboard can use:

```text
Today       Campaign
Recent      Attributes
Companion   Progress
```

---

# 28. Accessibility mode

Add:

**Reduced Motion**

When enabled:
- no particles
- instant state transitions
- no animated XP movement
- no screen pulse

Still show:
- reward totals
- level-up state
- attribute changes

Accessibility should never remove information.

---

# 29. Data flow

```text
UI
 |
 | POST /complete
 v
API
 |
 v
Auth
 |
 v
Ownership
 |
 v
Reward Engine
 |
 v
DB Transaction
 |
 +--> completion
 +--> ledger
 +--> profile
 +--> attribute
 +--> streak
 +--> achievement
 +--> campaign
 |
 v
response
 |
 v
celebration UI
```

---

# 30. Product state machine

```text
QUEST
draft
  ↓
planned
  ↓
scheduled
  ↓
in_progress
  ↓
completed
  ↓
historical
```

Alternative:

```text
planned
  ↓
skipped
  ↓
rescheduled
  ↓
planned
```

Deletion should not erase already-completed historical rewards.

---

# 31. Core enums

```text
quest_type:
quick
focus
routine
campaign
challenge
recovery

quest_status:
draft
active
in_progress
completed
skipped
archived

attribute:
strength
vitality
intellect
focus
discipline
craft
connection
exploration

item_type:
frame
title
nameplate
realm
effect
companion_emote
quest_skin
badge_case
hero_card
```

---

# 32. Hackathon prioritization matrix

## P0 — must work

Auth  
Profile  
Quest CRUD  
Completion engine  
XP  
Coins  
Attributes  
Level  
Persistence  
Today's Quest  
Responsive UI  
Deployment

## P1 — strong scoring advantage

Streaks  
Companion  
Store  
Hero Card  
Campaigns  
Focus timer  
Achievements

## P2 — polish

Advanced calendar  
Complex recurrence  
More cosmetics  
Deep analytics  
Notification center  
Rich motion states

## P3 — future

Multiplayer  
Guilds  
Leaderboards  
AI assistant  
3D characters  
Marketplace  
Social feed

---

# 33. The 90–180 second story

The walkthrough should follow one narrative.

**Opening**

“Life doesn't come with XP bars. We built one.”

**0:00–0:20**

Sign up → hero → companion.

**0:20–0:45**

Create a quest.

**0:45–1:10**

Complete it → XP → coins → attribute growth → companion reaction.

**1:10–1:30**

Level-up / achievement / streak.

**1:30–1:45**

Refresh.

**1:45–2:00**

Store → equip item → Hero Card.

The problem statement requires a 90–180 second video demonstrating signup/login, adding/completing a task, leveling and refresh persistence. fileciteturn0file0L38-L46

---

# 34. What judges should understand in under 30 seconds

They should immediately see:

**This is not a task tracker.**

A task produces:

**XP → attributes → rank → rewards → identity**

That is the product.

---

# 35. The strongest product innovations

### A. Campaign-to-Quest decomposition

Makes long-term goals actionable.

### B. Controlled attribute archetypes

Allows unlimited custom tasks without hardcoding infinite mappings.

### C. Product-wide cosmetics

Makes the Store meaningful even without multiplayer.

### D. Hero Card

Makes the character useful outside the character screen.

### E. Companion event engine

Makes the interface feel alive without AI.

### F. Lifetime + season separation

Preserves user history while allowing seasonal progression.

### G. Reward ledger

Makes the gamification backend trustworthy.

### H. Recovery-first design

Prevents the RPG from becoming another source of pressure.

---

# 36. Anti-feature list

Do not add a feature just because games have it.

Bad ideas for MVP:

- combat damage
- hit points
- weapons
- enemy NPCs
- PvP
- battle pass
- paid loot boxes
- random gambling mechanics
- energy systems that block real work
- punishing task failure

The game should gamify **progress**, not distract from it.

---

# 37. Final product philosophy

The best LIFE RPG is not the one with the most features.

It is the one where the user completes an ordinary real-world task and genuinely feels:

> “That counted.”

The entire product should be built around making that feeling immediate, credible and repeatable.
