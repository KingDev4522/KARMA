
# LIFE RPG — MASTER PRODUCT REQUIREMENTS DOCUMENT

**Document ID:** LRP-PRD-001  
**Version:** 1.0  
**Status:** Product Baseline  
**Source Basis:** IIT Bhubaneswar Life RPG Problem Statement

## 1. Product Definition

LIFE RPG is a web application that converts user-defined real-life actions into a structured RPG progression system.

The product is not a conventional productivity dashboard with game visuals. It is a progression layer over the user's own life:

```text
User chooses goal
→ User creates task
→ Task becomes Quest
→ Quest is completed
→ XP + Coins + Attribute Growth
→ Level / Rank / Achievement progression
→ Visible identity and reward
→ Motivation to continue
```

The problem statement identifies delayed gratification in conventional productivity systems as the central problem and requires a Life RPG that creates immediate feedback, progression and tangible rewards while retaining a robust full-stack foundation. fileciteturn0file0L2-L27

## 2. Product Principle

**The player defines what progress means. LIFE RPG defines how that progress is represented and rewarded.**

The product must not force users into predefined professions, personas or life paths.

Users choose their own:

- goals;
- tasks;
- routines;
- schedules;
- activity types;
- long-term campaigns;
- preferred areas of growth.

The system provides structure, scoring and feedback.

## 3. Core Product Systems

LIFE RPG consists of six connected systems:

### 3.1 Quest System

The user creates and manages real-world tasks.

Quest types:

- Quick Quest
- Focus Quest
- Routine Quest
- Campaign Quest
- Challenge Quest
- Recovery Quest

### 3.2 Progression System

Tracks:

- Hero XP
- Level
- Rank
- Attribute XP
- Attribute levels
- Streak
- Momentum

### 3.3 Economy System

Tracks:

- Coins
- Store inventory
- Owned cosmetics
- Equipped identity items

### 3.4 Goal System

Represents long-term goals as:

```text
Campaign
→ Milestones
→ Actionable Quests
```

### 3.5 Identity System

Represents the player through:

- Hero
- Companion
- Title
- Frame
- Realm
- Achievement collection
- Hero Card

### 3.6 History System

Records:

- completed quests;
- focus sessions;
- rewards;
- attribute growth;
- streak history;
- campaign progress.

## 4. User-Defined Task Model

The user may create essentially any real-world task.

Examples:

```text
Water my plants for 5 minutes
Study DSA for 45 minutes
Call my parents
Practice guitar
Clean my room
Build a portfolio section
Run for 20 minutes
Read 10 pages
```

The system does not require a predefined database entry for every possible activity.

Instead, the user selects or accepts an **Activity Type**.

Recommended activity types:

- Physical
- Learning
- Building / Coding
- Creative
- Focus / Deep Work
- Routine / Habit
- Social / Collaboration
- Life Management
- Exploration
- Recovery

This creates:

**Unlimited user intent + finite RPG rules.**

## 5. Attribute System

Recommended attributes:

- Strength
- Vitality
- Intellect
- Focus
- Discipline
- Craft
- Connection
- Exploration

Attributes represent capabilities, not professions.

Default mappings:

| Activity | Primary | Secondary |
|---|---|---|
| Physical | Strength | Vitality |
| Cardio | Vitality | Strength |
| Learning | Intellect | Focus |
| Building / Coding | Craft | Intellect |
| Creative | Craft | Focus |
| Deep Work | Focus | Discipline |
| Routine | Discipline | Focus |
| Social | Connection | Discipline |
| Life Management | Discipline | Vitality |
| Exploration | Exploration | Intellect |
| Recovery | Vitality | Discipline |

The user may adjust the suggested mapping for an individual quest.

## 6. Today's Quest

Today's Quest is a first-class product surface.

It combines:

- user-pinned tasks;
- tasks scheduled for today;
- routine instances due today;
- the next actionable item from an active Campaign;
- optional system suggestions.

A long-term goal must not be displayed as a single oversized daily task.

Example:

```text
Campaign: Build Portfolio
Milestone: Authentication
Today's Quest: Implement login screen
```

This keeps long-term direction visible without overwhelming the daily workflow.

## 7. Daily Micro Quests

The system supports very small user-selected activities.

Examples:

- Drink water
- Water plants
- Stretch for 5 minutes
- Read 2 pages
- Clear desk
- Step outside
- Write tomorrow's top 3

These are optional and customizable.

Micro Quests must have bounded rewards so trivial task creation cannot be used to farm unlimited XP or Coins.

## 8. Focus

Focus converts a Quest into an execution session.

```text
Quest
→ Start Focus
→ Timer
→ Finish Session
→ Quest Completion
→ Reward
```

The timer is a supporting execution mechanism, not a separate productivity system.

## 9. Campaigns

Campaigns represent meaningful long-term objectives.

Example:

```text
Build Portfolio
  ├── Research
  ├── Design
  ├── Build
  ├── Polish
  └── Publish
```

Each milestone can produce actionable quests.

Campaign progress is calculated from milestone and quest state.

## 10. Routines

A routine is a recurring user-defined behavior.

Example:

```text
Workout
Monday / Wednesday / Friday
18:00
```

Each occurrence becomes an individual historical instance.

## 11. Hero and Companion

The prototype uses a limited set of fixed 2D heroes.

The user chooses a hero rather than building a custom body.

The user also chooses a companion.

The companion functions as the product's emotional feedback layer.

Events include:

- opening the app;
- completing a Quest;
- leveling up;
- unlocking an achievement;
- reaching a Campaign milestone;
- returning after an absence;
- purchasing an item;
- entering a rest state.

Companion dialogue should be deterministic and contextual rather than requiring an AI service.

## 12. Economy and Store

Use two primary currencies:

**XP** — permanent progression; cannot be spent.

**Coins** — spendable reward currency.

Store categories should emphasize product-wide identity:

- Frames
- Titles
- Nameplates
- Realm Themes
- XP Effects
- Companion Emotes
- Quest Skins
- Badge Cases
- Hero Card Themes

Character clothing is optional and should not be an architectural dependency.

## 13. Hero Card

The Hero Card is a visual snapshot of the user's progression.

It contains:

- Hero name;
- avatar;
- level;
- rank;
- selected attributes;
- streak;
- title;
- achievements;
- Campaign progress;
- equipped identity cosmetics.

The Hero Card can be exported as an image.

## 14. Progression Model

Hero XP must follow a non-linear level curve, as required by the problem statement. fileciteturn0file0L50-L60

Recommended starting curve:

```text
Required XP(level) = floor(100 × level^1.55)
```

Suggested rank ladder:

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

Ranks may contain numbered stages.

Lifetime progression must remain permanent.

If seasonal progression is implemented, season state must be separate from lifetime state.

## 15. Streaks and Momentum

**Streak** represents consecutive qualifying active days.

**Momentum** is a softer recent-consistency indicator.

The system should encourage continuity without turning missed tasks into punitive failure.

Intentional Rest Days should be supported.

## 16. Reward Experience

Quest completion must visibly trigger:

```text
Completion
→ XP
→ Coins
→ Attribute movement
→ Streak update
→ Achievement check
→ Level-up check
→ Companion reaction
```

The problem statement explicitly expects immediate tactile feedback and celebration for progression events. fileciteturn0file0L18-L27

## 17. Main Navigation

Primary:

```text
Today
Quests
Campaigns
Focus
Realm
Chronicle
```

Secondary:

```text
Store
Settings
```

## 18. Accessibility

The application must support:

- keyboard navigation;
- semantic HTML;
- screen-reader-compatible structure;
- visible focus;
- readable contrast;
- reduced motion;
- non-color-only state communication.

These requirements are explicitly present in the problem statement. fileciteturn0file0L63-L64

## 19. Persistence

Primary data must be stored remotely in the application database.

LocalStorage may be used only for non-authoritative client concerns such as drafts, UI preferences or temporary state. The problem statement disqualifies reliance solely on localStorage for primary data. fileciteturn0file0L81-L87

## 20. Product Acceptance Criteria

The product is accepted when a new user can:

```text
Create account
→ Choose Hero
→ Choose Companion
→ Create a custom Quest
→ Complete Quest
→ Receive XP / Coins / Attribute Growth
→ See progression change
→ Refresh
→ Retain all persisted state
→ View Realm / Hero Card
→ Spend Coins
→ Equip an identity item
```

The required walkthrough explicitly calls for signup/login, task creation/completion, leveling and refresh persistence. fileciteturn0file0L38-L46
