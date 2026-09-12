
# LIFE RPG — PRODUCT REQUIREMENTS DOCUMENT (PRD) v2.0

**Status:** Product baseline / hackathon master PRD  
**Target:** IIT Bhubaneswar Life RPG problem statement  
**Date:** 12 September 2026  
**Product thesis:** Turn real-world progress into a visible, satisfying character progression system.

---

## 0. Product north star

**Every meaningful action in real life should create an immediate, understandable sense of progress.**

LIFE RPG is not a to-do list with game colors. It is a personal progression layer placed on top of everyday life:

**Intent → Quest → Action → Reward → Growth → Identity → Next action**

The supplied problem statement explicitly frames the core pain as delayed gratification and asks for a full-stack Life RPG with authentication, persistent historical data, non-linear progression, streaks, attributes, rewards/economy, responsive accessibility, and a polished non-generic experience. fileciteturn0file0L2-L27 fileciteturn0file0L38-L64

---

# 1. The product concept

A user enters LIFE RPG and creates a **Hero** rather than an account profile. They choose a 2D visual identity and a companion, then define what they are trying to become. The product converts daily responsibilities, routines, projects and goals into structured **Quests**.

The system maintains several progression layers simultaneously:

- **Hero Level:** overall progression.
- **Attributes:** areas of life that become stronger through repeated actions.
- **Coins:** spendable reward currency.
- **Momentum:** consistency signal; it should encourage continuation, not punish failure.
- **Streaks:** visible consistency records.
- **Achievements:** milestone recognition.
- **Collection:** cosmetics, titles, frames, realms, companion items and effects.
- **Campaigns:** long-term goals decomposed into milestones.
- **Hero Card:** a compact visual record of current identity and achievements.

The key design principle is separation of concerns: **XP means progress, Coins mean choice, Attributes mean growth, and Collection means expression.**

---

# 2. What problem are we solving?

Traditional productivity systems optimize for management. LIFE RPG optimizes for **felt progress**.

Typical failure pattern:

1. User has a large goal.
2. The benefit is far away.
3. Daily work feels repetitive.
4. The tracker only says “done.”
5. Motivation decays.

LIFE RPG changes step 4 into a feedback loop:

1. Quest completed.
2. Immediate completion choreography.
3. XP animation.
4. Attribute growth.
5. Coins earned.
6. Streak/momentum updated.
7. Companion reacts.
8. New progress becomes visible.
9. The user understands what the action contributed to.

---

# 3. User Intent & Self-Defined Progress Model

LIFE RPG does not assume that users belong to fixed personas such as “student,” “developer,” or “fitness user.” The user defines what matters to them and creates the tasks that represent their own life.

The product should therefore personalize around **intent, domains and goals**, not identity categories.

The onboarding question is:

> **“What do you want to work on?”**

Users may select one or more optional life domains:

- Fitness
- Learning
- Career
- Creativity
- Relationships
- Personal Growth
- Home
- Hobbies
- Finance
- Mindfulness
- Custom

These domains are organizational/contextual labels. They do not lock the user into a persona and do not determine what tasks they are allowed to create.

## 3.1 Unlimited user-defined tasks

A user can create essentially any real-world task:

> “Water my plants for 5 minutes.”

> “Complete 30 minutes of DSA.”

> “Call my parents.”

> “Practice guitar.”

> “Clean my room.”

The system must not require a predefined task library for ordinary task creation.

## 3.2 Presets are optional, not mandatory

LIFE RPG may provide starter suggestions and templates, but users must be able to ignore, edit, replace or create their own tasks.

The product should assist with setup without telling the user what their life goals should be.

## 3.3 Controlled activity taxonomy

To keep the RPG engine deterministic, every custom task may optionally be assigned to an **Activity Type** such as:

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

The user supplies the actual task. The activity type supplies the RPG interpretation.

Example:

> “Learn Photoshop for 1 hour.”

Activity Type: Learning

The RPG engine can map that activity to:

**Intellect + Focus**

It never needs to understand what Photoshop is.

## 3.4 User-controlled attribute mapping

The system should suggest a primary and secondary attribute based on the selected activity type.

Example:

> Running → Vitality + Strength

The user may adjust the suggested mapping within the available attribute system.

This gives users meaningful control while keeping the game's progression rules finite and understandable.

## 3.5 Product philosophy

> **LIFE RPG does not define what a good life looks like. The player does.**

The role of the system is to make the player's chosen actions measurable, rewarding and visually meaningful.

# 4. Product principles

### 4.1 Real life first

The game layer serves real-world action. The user should never feel that they are completing fake game chores instead of doing their actual work.

### 4.2 No meaningless complexity

Every system must answer a visible question:

- “What should I do now?”
- “Why does it matter?”
- “What did I gain?”
- “What am I becoming?”
- “What can I unlock?”

### 4.3 Reward effort, not punishment

Missed tasks should not destroy progress. A broken streak is feedback, not failure.

### 4.4 User agency with controlled structure

Users can customize their actual tasks freely, but the RPG engine uses a finite taxonomy and rule-based scoring instead of trying to understand arbitrary language perfectly.

### 4.5 The interface should feel alive

Completion is an event, not a database update.

### 4.6 Everything persists

Primary data belongs on the server/database, not only in localStorage. The problem statement explicitly prohibits fake local-only persistence. fileciteturn0file0L65-L87

---

# 5. The information architecture

The product should have six primary spaces:

**Home / Today**  
The user's immediate command center.

**Quests**  
All active work organized by horizon and type.

**Campaigns**  
Long-term goals, milestones and multi-step projects.

**Focus**  
Timer + task execution + deep-work mode.

**Realm**  
Character, attributes, collection, achievements and visual identity.

**Chronicle**  
History, statistics, calendar, reflections and progression analytics.

Secondary surfaces:

- Store
- Notifications
- Settings
- Hero Card
- Onboarding
- Help / onboarding guide

The navigation should not expose every system simultaneously. The UI should prioritize “what matters now.”

---

# 6. The core quest model

Instead of only “small task” and “long task,” LIFE RPG uses **quest archetypes**.

### Quick Quest

Expected duration: 1–15 minutes.

Examples:
- Drink water
- Water plants
- Make the bed
- Reply to one email
- Read 3 pages

Purpose: remove friction and create fast wins.

### Focus Quest

Expected duration: 15–120 minutes.

Examples:
- Study calculus for 60 minutes
- Code for 45 minutes
- Work on report for 90 minutes

Purpose: meaningful work with an optional linked timer.

### Routine Quest

Repeats according to a schedule.

Examples:
- Workout Monday/Wednesday/Friday
- Read every night
- Sunday planning

Purpose: habit formation.

### Campaign Quest

A piece of a long-term goal.

Example:

**Campaign: Build Portfolio**
→ Milestone 1: Research references  
→ Milestone 2: Design homepage  
→ Milestone 3: Build hero section  
→ Milestone 4: Add projects  
→ Milestone 5: Publish

Purpose: make distant goals visible.

### Challenge Quest

Time-bounded special mission.

Examples:
- Complete 5 workouts this week
- Finish 7 days of reading
- Ship one feature by Friday

Purpose: short-term intensity.

### Recovery Quest

Low-pressure tasks designed for rest and maintenance.

Examples:
- Stretch
- Walk
- Drink water
- Clean workspace
- Sleep routine

Purpose: prevent the system from treating productivity as endless output.

---

# 7. The three-horizon system

This resolves the user's requirement that today's screen must still show long-term work.

Every quest is assigned to one of three horizons:

### TODAY

Immediate action.

### CAMPAIGN

Long-term goal and milestone work.

### ROUTINE

Recurring behavior.

A long-term goal does not appear as one giant task every day.

Instead:

**Campaign → milestone due soon → today's quest**

Example:

**Campaign:** Learn Full-Stack Development  
**Progress:** 42%

Current milestone:
“Build authentication flow”

Today's quest:
“Implement login API for 45 minutes”

This keeps the daily screen actionable without losing sight of the destination.

---

# 8. Today's Quest system

The Home screen contains a dedicated **Today's Quest** section.

It contains four buckets:

### Pinned

Tasks the user explicitly chooses for today.

### Due

Routine quests or scheduled tasks due today.

### Campaign

The next actionable task from active long-term goals.

### Spark

One optional recommendation generated from user preferences.

The user always has the ability to accept, replace or dismiss a Spark.

This is important: the app should feel intelligent without pretending to be an AI.

---

# 9. Quest creation

The user should never be forced to understand RPG mechanics before creating a normal task.

The creation flow must be **task-first**, not RPG-first. The user decides the real-world action; the RPG layer is presented as a consequence.

Create Quest flow:

**Step 1 — What are you doing?**  
Task title.

**Step 2 — How big is it?**  
Quick / Focus / Campaign / Routine.

**Step 3 — When?**  
Today / date / recurring schedule / no deadline.

**Step 4 — Optional activity type**  
Physical / Learning / Building / Creative / Focus / Routine / Social / Life Management / Recovery / Exploration.

This field may be suggested by the UI but must remain editable.

**Step 5 — Optional details**  
Duration, notes, reminder, campaign, timer.

The RPG mapping is shown as a preview:

> “This quest primarily develops INTELLECT and FOCUS.”

The user can understand the consequence without needing to configure equations.

---

# 10. Attribute system

Recommended attributes:

**Strength** — physical capability and resistance.

**Vitality** — movement, recovery and physical well-being.

**Intellect** — learning, analysis, problem-solving.

**Focus** — sustained attention and deep work.

**Discipline** — consistency, follow-through and routine execution.

**Craft** — making, designing, writing, coding and creative execution.

**Connection** — healthy relationships, collaboration, communication and contribution.

**Exploration** — curiosity, experimentation, new experiences and learning outside the routine.

Eight attributes give breadth without creating a stat sheet that feels arbitrary.

---

# 11. How arbitrary tasks map to attributes

This is one of the most important architecture decisions.

We do **not** attempt to predefine every real-world task.

We also do **not** ask the backend to understand arbitrary natural-language tasks.

Instead, every quest is assigned to a finite **Activity Archetype**.

| Archetype | Primary | Secondary |
|---|---|---|
| Physical Training | Strength | Vitality |
| Cardio / Walking | Vitality | Strength |
| Study / Learning | Intellect | Focus |
| Coding / Building | Craft | Intellect |
| Creative Practice | Craft | Focus |
| Deep Work | Focus | Discipline |
| Routine / Habit | Discipline | Focus |
| Social / Collaboration | Connection | Discipline |
| Household / Life Admin | Discipline | Vitality |
| Exploration / New Experience | Exploration | Intellect |
| Recovery | Vitality | Discipline |

The user supplies the actual activity. The taxonomy supplies the RPG meaning.

Thus:

“Study React for 45 minutes”

becomes:

**Activity:** Study / Learning  
**Primary:** Intellect  
**Secondary:** Focus

The engine never needs to know what React is.

This also makes custom tasks safe from accidental attribute nonsense.

---

# 12. Attribute weight model

Each quest has:

**Primary attribute = 100% weight basis**

**Secondary attribute = 35% weight basis**

Optional tertiary effects should not be allowed in the MVP.

Example:

45-minute study task worth 60 base XP:

Intellect +60  
Focus +21

A difficult campaign milestone may use a higher effort multiplier.

The system should avoid giving identical XP to every task.

---

# 13. Effort scoring

Each quest has a normalized difficulty:

**Effort 1 — Tiny**  
1–5 minutes or extremely low effort.

**Effort 2 — Light**  
5–15 minutes.

**Effort 3 — Standard**  
15–45 minutes.

**Effort 4 — Major**  
45–120 minutes.

**Effort 5 — Epic**  
Large milestone / substantial deliverable.

The UI should expose effort in plain language, not formulas.

Example:

> Standard · 45 min · +60 XP · +21 Focus

The user should understand the reward before doing the quest.

---

# 14. XP model

Hero XP must be non-linear, as explicitly required by the problem statement. fileciteturn0file0L50-L60

Recommended level curve:

**XP to reach level N = floor(100 × N^1.55)**

This produces a gentle beginning and increasingly meaningful later progression.

Do not reset lifetime Hero XP at the end of a season.

Instead:

**Lifetime XP** = permanent identity.

**Season XP** = temporary event progress.

**Prestige** = optional future feature that changes the title/cosmetic layer, not the underlying history.

This avoids the psychologically frustrating “I worked for a year and the app deleted it” problem.

---

# 15. Rank architecture

Use a title ladder instead of infinite named tiers.

Example:

**Novice → Apprentice → Adept → Vanguard → Expert → Master → Elite → Legend → Mythic**

Inside each rank:

**I → II → III → IV → V**

After Mythic V, the user enters:

**Ascendant + infinite stars**

Example:

> Mythic III  
> ★★★

This gives the user both a familiar game-like hierarchy and an effectively unbounded endgame.

---

# 16. Level-up rewards

Every level grants a small reward.

Possible reward types:

- Coins
- Badge
- Title
- Frame
- Companion emote
- Completion effect
- New realm accent
- Hero Card template
- Rare item token

Every rank promotion grants a more meaningful cosmetic.

A level should never feel like “+1 number.”

---

# 17. Currency architecture

Do not create many currencies.

Use exactly two in the prototype:

### XP

Progression currency. Cannot be spent.

### Coins

Spendable reward currency.

Optional future third currency:

**Relics** — extremely rare achievement tokens.

Do not implement a complex multi-currency economy in the hackathon.

---

# 18. Coin economy

Example reward:

Quick Quest → 5–10 coins  
Focus Quest → 10–25 coins  
Challenge → 25–60 coins  
Campaign milestone → 50–150 coins  
Rank promotion → bonus chest

Coins are intentionally more frequent than cosmetics.

This creates:

**Do → Earn → Choose → Personalize**

---

# 19. The Store — what actually makes sense

The store should NOT primarily sell character clothing.

Because the user's concern is correct: if the character only appears on one screen, collecting outfits has weak utility.

The prototype store therefore focuses on **visible product-wide identity**.

### Store category 1 — Hero Frames

Frames around the profile/hero.

Examples:
- Glass
- Neon
- Ember
- Astral
- Scholar
- Royal

### Store category 2 — Titles

Examples:
- The Consistent
- Night Builder
- Bookkeeper of Dreams
- Code Smith
- Early Riser

### Store category 3 — Nameplates

Change how the user's identity card appears.

### Store category 4 — XP Bursts

When a quest completes:

Default:
**+60 XP**

Owned effect:
**+60 XP ✦**

or animated particle burst.

### Store category 5 — Completion FX

Small celebratory effects.

Examples:
- Spark
- Arc
- Confetti
- Pixel burst
- Pulse

### Store category 6 — Companion Emotes

The companion can unlock reactions:

- Clap
- Wave
- Celebrate
- Sleepy
- Focused
- Shocked

### Store category 7 — Realm Themes

A lightweight dashboard presentation theme.

Examples:
- Dawn
- Midnight
- Forest
- Cyber
- Library
- Observatory

### Store category 8 — Quest Card Skins

Changes the visual treatment of task cards.

### Store category 9 — Badge Cases

Cosmetic layouts for achievements.

### Store category 10 — Hero Card Templates

Changes the design of the shareable/exportable profile card.

This is the key innovation:

**the user is not buying something to stare at once. They are buying ways to personalize the entire progress experience.**

---

# 20. The Hero Card

The Hero Card solves the “why make a character if nobody sees it?” problem.

It is a visual identity snapshot containing:

- Hero name
- Avatar
- Companion
- Level
- Rank
- Top attributes
- Current streak
- Selected title
- Rare achievements
- Campaign progress
- Equipped frame
- Optional quote / personal goal

The user can generate:

**View Card → Download PNG**

No internal social network is required.

The artifact can be shared externally, but external sharing is optional and not part of the core product.

---

# 21. Character system

The prototype should use:

**6–8 fixed base 2D hero bodies**

Do not attempt full character creation.

Each hero receives a display identity:

- Name
- Hero alias
- Selected archetype
- Bio
- Personal goal

The visual system is intentionally asset-efficient.

---

# 22. Cosmetic implementation strategy

Use layered 2D assets:

```text
Base Hero
   +
Frame
   +
Aura
   +
Title plate
   +
Badge
   +
Companion
   +
Realm background
```

Do not generate dozens of complete character illustrations.

One base character + transparent cosmetic layers can create many combinations.

For the hackathon, the minimum viable inventory can be:

- 6 hero bases
- 4 frames
- 4 realm backgrounds
- 4 titles
- 4 companion emotes
- 4 XP effects
- 6 badges

This is enough to make the store feel populated without requiring an impossible art workload.

---

# 23. Companion system

The companion is not decoration.

It is the product's emotional feedback channel.

The companion appears on:

- Onboarding
- Home
- Quest completion
- Level-up
- Streak milestone
- Returning after absence
- Empty state
- Campaign completion
- Store purchase
- Rest day

The companion should have a small state machine:

**Idle → Greeting → Encouraging → Celebrating → Curious → Resting**

The dialogue does not need generative AI.

Use deterministic templates.

Examples:

Morning:
> “Good morning, {hero}. What are we conquering first?”

Quest completion:
> “Quest cleared. Nice work.”

Level up:
> “That wasn't just another task. You just leveled up.”

Return:
> “Welcome back, {hero}. Your progress is still here. Let’s pick up where we left off.”

Rest:
> “Rest is part of the run. We’re not quitting; we’re recovering.”

---

# 24. Daily companion greeting

When the user opens the app, the companion can reference:

- time of day
- number of quests today
- current streak
- nearest campaign deadline
- last session

Example:

> “Three quests are waiting. Your campaign milestone is 72% complete.”

Avoid pretending to know facts the product does not have.

---

# 25. Streaks and Momentum

Use both, but make them different.

### Streak

Consecutive active days.

### Momentum

A softer consistency signal based on recent activity.

Momentum can rise from:
- completing scheduled tasks
- completing a campaign milestone
- returning after a break
- completing a focus session

Momentum should decay slowly, if at all.

The goal is motivation, not anxiety.

The problem statement requires streaks; it does not require harsh punishment. fileciteturn0file0L56-L60

Include:

**Rest Day**

The user can intentionally designate a rest day.

---

# 26. Daily micro-quests

The user explicitly asked for very small real-life activities.

The system should allow:

- Drink water
- Water plants
- Step outside
- Stretch for 5 minutes
- Clear desk
- Read one page
- Write 3 lines
- Breathe for 2 minutes
- Pack tomorrow's bag
- Put clothes away

These should be called **Micro Quests**.

Micro Quests can earn small XP and coins, but they should have a low daily reward ceiling so users cannot farm infinite XP by creating hundreds of trivial tasks.

---

# 27. Reward anti-farming rule

Every reward-bearing action passes through:

**Base reward → effort multiplier → daily anti-farming cap → streak/context bonus → ledger**

Example:

A 2-minute water reminder should feel rewarding, but should never be economically equivalent to a 90-minute project milestone.

This protects the progression system.

---

# 28. Focus mode

Focus is not just a timer.

When a user starts:

> Quest: Build login API  
> Time: 45:00  
> Primary Attribute: Craft  
> Secondary: Intellect

The screen becomes a distraction-minimized execution environment.

At completion:

**Session complete → XP animation → attribute update → coins → companion reaction**

Optional future feature:
- ambient sounds
- full-screen mode
- focus statistics

---

# 29. Calendar

The calendar is a planning layer, not a second task database.

All tasks, routines, campaign milestones and focus sessions flow into one calendar.

Clicking a calendar item opens the underlying quest.

No duplicate task records.

---

# 30. Unified task relationships

Everything must interconnect.

Example:

```text
Campaign
  ↓
Milestone
  ↓
Quest
  ↓
Focus session
  ↓
Completion
  ↓
Reward transaction
  ↓
XP + Attributes + Coins + Streak + Achievement
```

A routine can generate a quest instance for a specific date.

A quest can link to a campaign.

A focus session can link to a quest.

A completed quest appears in history.

This is the backbone of the product.

---

# 31. Notifications

Prototype notifications:

- Quest reminder
- Routine reminder
- Campaign deadline reminder
- Streak warning
- Level-up celebration
- Companion message

Avoid spam.

Notification preferences must be configurable.

---

# 32. Chronicle / history

The user should be able to see:

- completed quests
- XP earned
- coins earned
- attributes gained
- streaks
- campaign progress
- daily/weekly/monthly activity

The visual pattern should feel closer to a game history log than an accounting table.

---

# 33. Analytics for the player

Player-facing analytics:

**Today**
- quests completed
- XP earned
- focus time

**This week**
- active days
- attribute growth
- campaign progress

**This month**
- strongest attribute
- most consistent routine
- total focus
- milestone count

The analytics should answer:

> “Am I becoming more consistent?”

not:

> “How many database records do I have?”

---

# 34. Achievements

Achievement examples:

**First Blood**  
Complete your first quest.

**Five Alive**  
Complete quests five days in a row.

**Deep Diver**  
Complete three 60+ minute focus quests.

**Campaigner**  
Complete your first long-term milestone.

**Tiny Steps**  
Complete 20 micro quests.

**Polymath**  
Improve five different attributes.

**Comeback**  
Return after 7+ days and complete a quest.

**Builder**  
Complete 50 Craft-focused quests.

Achievements should be mostly milestone-based and deterministic.

---

# 35. End-of-day experience

The Home screen can transition to a compact:

**Daily Debrief**

It shows:

> 6 Quests cleared  
> +240 XP  
> +48 Coins  
> Intellect +92  
> Focus +54  
> Streak: 7 days

This creates closure.

Optional one-line reflection:

> “What made today count?”

This is the seed for a later diary/journal feature without making journaling part of the MVP.

---

# 36. Onboarding

Onboarding should feel like the opening of an RPG.

Sequence:

**1. Enter the realm**

“Your life is the campaign.”

**2. Choose hero**

Pick one of the fixed 2D heroes.

**3. Name your hero**

Display name + optional alias.

**4. Choose companion**

Companion A / B or a small set.

**5. Choose your focus**

Examples:
- Fitness
- Study
- Career
- Creativity
- Discipline
- Balance
- Exploration

This drives recommended starter tasks.

**6. Choose your first campaign**

Examples:
- Build a study habit
- Ship a project
- Get healthier
- Read consistently
- Fix my routine

**7. Receive the first quest**

The onboarding should end with an immediate achievable action.

---

# 37. Personalized starter system

Do not ask the user to build the entire system manually.

From the selected focus, generate 3–5 starter suggestions.

Example:

Focus: Fitness

Suggested:
- 10-minute walk
- Drink water
- 5-minute stretch

Focus: Coding

Suggested:
- 25-minute deep work
- Review one concept
- Complete one small coding task

The user accepts or edits them.

The system is assisting, not prescribing.

---

# 38. Motivation loop

The core loop should be:

**See → Choose → Act → Celebrate → Grow → Personalize → Return**

A secondary loop is:

**Goal → Campaign → Milestone → Quest → Completion**

A collection loop is:

**Complete → Earn Coins → Visit Store → Equip → See identity change**

A mastery loop is:

**Repeated activity → Attribute growth → Attribute milestone → Badge/Title**

---

# 39. The product's “magic moments”

These must be choreographed.

### First Quest

The companion celebrates and the UI reveals the reward.

### First Level-Up

Full-screen moment:
- level number expands
- XP bar fills
- attribute spark
- title reveal
- reward chest

### Campaign Milestone

The campaign map progresses visually.

### Store Purchase

The item visually equips immediately.

### Seven-day Streak

A badge or aura unlocks.

### Return After Absence

No guilt. The companion welcomes the user back.

---

# 40. Visual design direction

Recommended theme:

**Fantasy-modern / premium game interface**

Not medieval clutter.

Think:

- dark base
- luminous accents
- glassy panels
- high-contrast type
- 2D character art
- subtle particles
- deep gradients
- restrained glow
- card depth
- large progression numbers
- smooth motion

The problem statement explicitly warns against generic SaaS/Bootstrap styling and asks for cohesive thematic execution, tactile feedback and strong hierarchy. fileciteturn0file0L13-L27 fileciteturn0file0L67-L80

---

# 41. Motion language

Motion must communicate state.

**Complete**
- card collapses
- XP flies toward meter
- coin burst
- companion reacts

**Level Up**
- progress bar fills
- background pulse
- rank reveal

**Purchase**
- item scales in
- coin count updates

**Navigation**
- content transitions horizontally/vertically depending on hierarchy

Avoid constant movement. Motion should have a reason.

---

# 42. Accessibility

The requirements explicitly call for keyboard navigation and structurally sound screen-reader support. fileciteturn0file0L63-L64

Requirements:

- semantic landmarks
- visible focus states
- keyboard-complete interactions
- ARIA labels only where necessary
- reduced-motion mode
- color is never the only state indicator
- readable contrast
- buttons with text or accessible names
- dialogs escapable via keyboard
- timer accessible without animation dependence

---

# 43. Responsive behavior

Desktop:
- persistent side navigation
- larger hero area
- three-column dashboard where appropriate

Tablet:
- compact navigation
- two-column cards

Mobile:
- bottom navigation
- one primary action
- stacked quest cards
- full-screen Focus mode
- simplified companion placement

The mobile product must not merely shrink the desktop layout.

---

# 44. Error and edge-case requirements

Empty task:
> “Give your quest a name.”

Duplicate submission:
> reward must not be awarded twice.

Offline:
> show connection status and preserve draft state.

Failed API:
> optimistic UI must roll back cleanly.

Expired task:
> can reschedule; no destructive penalty.

Missed streak:
> streak state is shown clearly; user is offered rest/break options.

Refresh:
> all earned progress remains.

Session expiration:
> refresh/auth flow should recover without data loss.

---

# 45. Privacy and trust

Users are entering personal life information.

The product should:

- minimize stored sensitive information
- never expose private tasks publicly by default
- require explicit action for Hero Card sharing
- keep public profile optional
- support account deletion
- avoid selling/ranking personal data
- make notification settings clear

---

# 46. What is deliberately NOT in the MVP

Do not attempt:

- 3D character generation
- multiplayer battles
- internal social network
- live chat
- full AI task interpretation
- hundreds of character assets
- procedural worlds
- complex equipment combat statistics
- ten currencies
- paid monetization
- marketplace economy
- external calendar bidirectional sync
- native mobile application

These can exist as future vision, but they should not compete with the hackathon critical path.

---

# 47. MVP cutline

The absolute demo-critical path is:

**Sign up → choose hero → choose companion → create quest → complete quest → reward animation → level/progression update → refresh page → persisted data**

This directly matches the required walkthrough and the persistence requirement. fileciteturn0file0L38-L46

The next level includes:

**Daily Quests → Routines → Focus Timer → Campaigns → Store → Hero Card → Achievements**

---

# 48. Success metrics

For a hackathon prototype:

**Activation**
- user completes first quest within 3 minutes.

**Completion**
- first quest → second quest conversion.

**System integrity**
- no duplicate rewards.
- no persistence failures.

**Experience**
- level-up feels immediate.
- store purchase changes visible identity.
- today's page communicates priorities in <10 seconds.

**Technical**
- no blocking runtime errors.
- fast initial load.
- usable mobile layout.
- accessible keyboard path.

---

# 49. Competitive inspiration — what to learn, not copy

Habitica validates the RPG productivity model by combining habits, dailies, to-dos, rewards and avatar progression.

Finch demonstrates the power of a companion-led loop, daily quests, goal personalization, streaks and cosmetic collection. Its current feature set includes shops, quests, goals, streaks, customization and a companion-centered home experience. citeturn347313search1turn347313search2turn347313search4

Todoist's Karma demonstrates that points, levels, daily/weekly goals and streaks can add a progression layer to conventional task management. citeturn347313search0turn347313search5

LIFE RPG should combine these patterns but make the **real-life attribute system, campaign structure, hero identity and visual reward layer** its differentiators.

---

# 50. Final product definition

LIFE RPG is:

> **A full-stack personal progression game where real-life work becomes quests, quests become growth, growth becomes identity, and identity becomes motivation.**

The product does not need a virtual world to justify the RPG.

**The user's real life is the world.**
