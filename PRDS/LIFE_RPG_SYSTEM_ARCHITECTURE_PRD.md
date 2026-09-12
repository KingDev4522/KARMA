
# LIFE RPG — SYSTEM ARCHITECTURE PRD

**Document ID:** LRP-ARCH-001  
**Version:** 1.0  
**Status:** Architecture Baseline

## 1. Architecture Objective

Build LIFE RPG as a **modular full-stack monolith**.

The architecture must be strong enough to protect user data and game-state integrity while remaining practical for rapid implementation.

The problem statement explicitly requires a robust full-stack architecture rather than a frontend-only prototype. fileciteturn0file0L8-L12

## 2. Technology Baseline

Recommended stack:

```text
Frontend: React / Next.js + TypeScript
Styling: Tailwind CSS
UI primitives: shadcn/ui / Radix
Motion: Framer Motion
Backend: Next.js server-side application
Database: PostgreSQL
Authentication: Supabase Auth
Hosting: Vercel
Database/Auth hosting: Supabase
```

The source problem statement permits React and related frontend tooling, Node/Next.js-style backend approaches, PostgreSQL, and managed authentication providers. fileciteturn0file0L28-L37

## 3. Architectural Model

```text
                    ┌────────────────────┐
                    │      Browser       │
                    │ React / Next.js UI │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │ Server Application │
                    │                    │
                    │ Auth               │
                    │ Quest Domain       │
                    │ Routine Domain     │
                    │ Campaign Domain    │
                    │ Focus Domain       │
                    │ Progression Domain │
                    │ Economy Domain     │
                    │ Achievement Domain │
                    │ Inventory Domain   │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │    PostgreSQL      │
                    │  Persistent State  │
                    └────────────────────┘
```

## 4. Modular Monolith

Do not introduce microservices.

Keep explicit internal module boundaries:

```text
identity/
quests/
routines/
campaigns/
focus/
progression/
economy/
inventory/
achievements/
companion/
```

Each module contains its own domain logic.

## 5. Source of Truth

Persistent database state is authoritative.

The client may maintain temporary UI state, but the following must come from the backend/database:

- quests;
- completion history;
- XP;
- Coins;
- attributes;
- levels;
- streaks;
- campaigns;
- inventory;
- equipped items;
- achievements.

## 6. Authentication Boundary

Every private application operation must execute within an authenticated user context.

The architecture must ensure:

```text
Authenticated User
→ Ownership Check
→ Domain Operation
→ Database Mutation
```

## 7. Domain Relationship

```text
User
 |
 +── Profile
 |
 +── Quests
 |     |
 |     +── Completion History
 |     |
 |     +── Focus Sessions
 |
 +── Campaigns
 |     |
 |     +── Milestones
 |            |
 |            +── Quests
 |
 +── Progression
 |     |
 |     +── Attributes
 |     +── Streak
 |     +── Level
 |
 +── Economy
 |     |
 |     +── Coins
 |     +── Ledger
 |
 +── Inventory
 |     |
 |     +── Loadout
 |
 +── Achievements
```

## 8. Read Model

The Today screen should be assembled from the minimum necessary persisted information.

It needs:

- profile;
- current level;
- XP progress;
- Coins;
- Today's Quest;
- Campaign summary;
- attribute snapshot;
- streak;
- companion state.

Avoid excessive independent requests during initial rendering.

## 9. Write Model

CRUD operations should remain simple.

Reward-producing operations must use domain services.

For example:

```text
Complete Quest
→ Quest Completion Service
→ Reward Engine
→ Progression Update
→ Economy Update
→ Achievement Evaluation
→ Campaign Update
```

## 10. Atomic Operations

The following state changes must be atomic.

### Quest Completion

```text
Completion Record
XP
Coins
Attributes
Streak
Level
Achievements
Campaign Progress
```

### Store Purchase

```text
Coin Balance
Ledger
Inventory
```

If any component fails, the complete operation should roll back.

## 11. Optimistic UI

The frontend may optimistically animate a completion state.

However:

```text
Visual optimism ≠ authoritative persistence
```

The final state must reconcile with the server result.

## 12. Failure Handling

Every major surface needs:

```text
Loading
Empty
Success
Error
Retry
```

The source problem statement explicitly penalizes runtime failures and blank-screen crashes. fileciteturn0file0L77-L87

## 13. Asset Architecture

Static visual assets should be separated from application logic.

```text
/public
  /heroes
  /companions
  /frames
  /effects
  /realms
  /badges
  /hero-cards
```

Cosmetic definitions should be configuration-driven.

## 14. Client Storage

Allowed:

- unsaved form drafts;
- temporary UI state;
- preferences;
- reduced-motion setting;
- non-authoritative cache.

Not allowed as authoritative persistence:

- XP;
- Coins;
- Quest completion;
- inventory;
- attributes;
- level;
- user history.

## 15. Deployment Model

```text
GitHub
   ↓
Vercel
   ↓
Next.js
   ↓
Supabase Auth + PostgreSQL
```

The repository must include frontend and backend source plus an environment-variable template, as explicitly required by the problem statement. fileciteturn0file0L38-L43

## 16. Architecture Acceptance Criteria

- application is a modular monolith;
- authentication is centralized;
- domain responsibilities are separated;
- database is authoritative;
- reward operations are transactional;
- private resources are user-scoped;
- frontend can fail gracefully without corrupting state;
- deployment can be reproduced from repository configuration.
