
# LIFE RPG — FRONTEND, UX & VISUAL SYSTEM PRD

**Document ID:** LRP-FE-001  
**Version:** 1.0  
**Status:** Experience Baseline

## 1. UX Objective

The interface must feel alive, tactile and game-like without becoming cluttered or childish.

The problem statement explicitly rejects generic SaaS/CRUD presentation and emphasizes thematic cohesion, immediate interaction, animation, polished visual hierarchy and smooth perceived performance. fileciteturn0file0L13-L27

## 2. Design Direction

Recommended visual language:

**Premium fantasy-modern interface**

Characteristics:

- dark or high-contrast foundation;
- luminous accent system;
- restrained glass surfaces;
- strong typography;
- large progression indicators;
- 2D hero art;
- contextual motion;
- subtle particles;
- high-quality spacing;
- deliberate hierarchy.

Do not use:

- generic Bootstrap styling;
- excessive gradients;
- constant animation;
- cluttered RPG HUDs;
- decorative elements without functional purpose.

## 3. Primary Navigation

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

Mobile should use a compact bottom navigation.

## 4. Today Screen

The screen must answer three questions immediately:

**What should I do?**

**Why does it matter?**

**How am I progressing?**

Recommended structure:

```text
Greeting + Hero Level + Coins
Companion
Today's Quest
Active Campaign
Attribute Snapshot
Streak
Recent Reward
```

## 5. Today's Quest Section

Organize tasks into:

```text
Pinned
Due Today
Routine
Campaign
Optional Spark
```

Default visible count should be limited to avoid cognitive overload.

## 6. Quest Card

Minimum content:

```text
Quest Title
Quest Type
Estimated Time
Activity Type
Primary / Secondary Attribute
Reward Preview
Primary Action
```

Example:

```text
Study DSA
Focus Quest · 45 min
Intellect + Focus
+60 XP · +10 Coins
[Start Focus]
```

## 7. Quest Creation UX

Use a task-first flow.

```text
What are you doing?
↓
How large is it?
↓
When?
↓
Activity Type
↓
Suggested Attribute Mapping
↓
Reward Preview
↓
Create
```

The user should not need to understand the RPG system before creating a task.

## 8. Campaign UX

Campaigns should visually communicate destination and progress.

Example:

```text
BUILD PORTFOLIO
73%

Research ✓
Design ✓
Build ●
Polish ○
Publish ○
```

The user should always know the next actionable milestone.

## 9. Focus UX

Focus mode should reduce distractions.

Display:

```text
Quest
Timer
Pause / Resume
Finish
```

After completion, transition into the reward sequence.

## 10. Reward Choreography

Completion:

```text
Checkmark
→ XP movement
→ Coin increment
→ Attribute movement
→ Companion reaction
→ Level/Achievement state
```

The animation should be fast enough to feel satisfying without delaying task completion.

## 11. Companion UX

The companion appears contextually rather than permanently dominating the interface.

States:

```text
Idle
Greeting
Encouraging
Celebrating
Focused
Resting
```

Dialogue remains short.

Examples:

```text
"Quest cleared."

"That one mattered."

"You're getting stronger."

"Welcome back."

"Rest is part of the run."
```

## 12. Realm

Realm is the user's identity/progression space.

Show:

- hero;
- companion;
- level;
- rank;
- attributes;
- achievements;
- collection;
- equipped cosmetics;
- Hero Card.

## 13. Store UX

The store should make ownership and equip state obvious.

Each item displays:

```text
Name
Preview
Description
Price
Rarity
Owned / Locked / Equipped
```

Purchasing should immediately update the visible loadout after server confirmation.

## 14. Hero Card UX

The user can preview the card before exporting.

The card should prioritize:

```text
Hero Identity
Level / Rank
Top Attributes
Streak
Title
Achievements
Campaign Progress
```

## 15. Motion System

Motion should communicate state.

```text
Hover → subtle response
Tap → tactile response
Navigation → smooth transition
Completion → reward choreography
Level-up → ceremony
Purchase → equip transition
Achievement → reveal
```

Reduced-motion mode must disable decorative motion while preserving state information.

## 16. Loading

Use skeletons for:

- Today;
- Quest lists;
- Campaigns;
- Store;
- Realm;
- Chronicle.

## 17. Empty States

Examples:

```text
No Quest:
"Your board is clear. Add your first Quest."

No Campaign:
"Choose something worth becoming."

No Achievement:
"Your first badge is one Quest away."
```

## 18. Errors

Errors should be explicit and recoverable.

Example:

```text
"Quest couldn't be completed.
Your progress was not changed."
[Try Again]
```

Never hide a failed transaction behind a successful animation.

## 19. Responsive Requirements

### Desktop

- side navigation;
- expanded Hero/Companion region;
- multi-column layout.

### Tablet

- compressed navigation;
- flexible card grid.

### Mobile

- bottom navigation;
- stacked Quest cards;
- compact Hero summary;
- full-screen Focus mode;
- touch-friendly controls.

## 20. Accessibility

Required:

- keyboard-complete navigation;
- visible focus;
- semantic structure;
- screen-reader-compatible labels;
- sufficient contrast;
- reduced motion;
- color-independent status indicators.

## 21. Perceived Performance

Use:

- optimistic UI where safe;
- skeletons;
- lazy-loaded cosmetics;
- optimized 2D assets;
- minimal blocking requests;
- smooth transitions.

The product should never feel slow merely because data is remote. This directly aligns with the problem statement's requirement for optimistic UI, loading skeletons and smooth transitions. fileciteturn0file0L25-L27

## 22. Frontend Acceptance Criteria

The experience is accepted when:

- Today is understandable within seconds;
- task creation is simple;
- completion feels rewarding;
- the user can see progression clearly;
- the store changes visible identity;
- mobile and desktop both feel intentional;
- keyboard navigation works;
- runtime failures produce recoverable states.
