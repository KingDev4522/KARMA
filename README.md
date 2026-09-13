# KARMA — Life RPG

> **Quiet progress, kept score.**  
> A minimal productivity practice with a discreet RPG progression system.

---

## Overview

**KARMA** is a full-stack web application that transforms real-life actions into a structured RPG progression layer. Users define their own goals and tasks, which become **Quests**. Completing quests yields **XP**, **Coins**, and **Attribute Growth**, driving **Level/Rank** progression, unlocking **Achievements**, and building a visible **Identity** (Hero, Companion, Titles, Frames, Realm, Hero Card).

Unlike conventional productivity dashboards with game visuals, KARMA is a **progression layer over the user's own life** — the player defines what progress means; KARMA defines how that progress is represented and rewarded.

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

---

## Team & Role Assignment

| Member | Role | Primary Ownership |
|--------|------|-------------------|
| **Debjeet Mazumder** | **Lead Full Stack Developer & Backend Architect** | Server architecture, RPG engine (XP curve, rewards, anti-farming, ranks, streaks), Prisma schema, domain services, API design, database migrations, authentication boundary, transactional reward operations, CI/CD pipeline |
| **Mehul Kumar Jaiswal** | **DevOps, Platform Engineer & Backend Developer** | Supabase/PostgreSQL provisioning, Vercel deployment, environment management, monitoring, logging, rate limiting, security headers, seed scripts, database backups, preview deployments, developer tooling (tsx, typecheck, lint), documentation maintenance |
| **Indranil Chatterjee** | **Frontend Lead & UX Architect** | Next.js App Router architecture, component system, design tokens, motion (Framer Motion), Today/Quest/Focus/Campaign/Realm/Chronicle/Store screens, Hero Card export, accessibility (WCAG AA), reduced-motion mode, responsive layouts, performance optimization |
| **Debardrita Baksi** | **Game Systems & UI/UX Engineer** | Quest/Campaign/Routine/Focus domain logic (backend + frontend), progression integration, economy & store (coins, inventory, loadout), achievement engine, companion deterministic dialogue, attribute mapping, campaign-to-quest decomposition, reward preview, end-to-end feature wiring |


> **Work Balance Principle:** Each member owns a vertical slice (backend ↔ frontend ↔ infra) while collaborating on cross-cutting features (auth, reward engine, companion, Hero Card). Code reviews are mandatory for all domain services and UI primitives.

---

## Features

### Core Game Systems

| System | Description |
|--------|-------------|
| **Quest System** | 6 quest types: Quick, Focus, Routine, Campaign, Challenge, Recovery. User-defined titles, descriptions, difficulty (1–5), activity archetype mapping, pinning, scheduling, recurrence. |
| **Progression** | Non-linear Hero XP curve `floor(100 × level^1.55)`, 10-rank ladder (Novice → Ascendant), 8 attributes (Strength, Vitality, Intellect, Focus, Discipline, Craft, Connection, Exploration), streak & momentum tracking, rest-day support. |
| **Economy** | Dual currency: **XP** (permanent, unspendable) + **Coins** (spendable). Store with 10 cosmetic categories: Frames, Titles, Nameplates, Realm Themes, XP Effects, Companion Emotes, Quest Skins, Badge Cases, Hero Card Themes, Hero/Companion Skins. |
| **Campaigns** | Long-term goals decomposed into ordered milestones; each milestone spawns actionable quests. Visual progress map, next-action surfacing on Today screen. |
| **Identity** | Hero (6 archetypes × 4 variants), Companion (10 species), Title, Frame, Realm, Hero Card (exportable PNG), Achievement collection. |
| **History (Chronicle)** | Completion log, focus session history, reward ledger, attribute growth timeline, streak calendar, campaign progress archive. |

### Execution Layer

| Feature | Details |
|---------|---------|
| **Focus Timer** | Pomodoro-style session bound to a quest; pause/resume; actual vs planned time tracking; session history feeds achievements. |
| **Today's Quest** | Algorithmic aggregation: pinned + due today + routine instances + next campaign action + optional spark suggestion. Max 7 visible. |
| **Micro Quests** | Bounded daily rewards (first 5 effort-1 quick/recovery quests pay full; thereafter 1 XP / 0 coins). |
| **Completion Choreography** | Card compress → checkmark locks → XP floats → coins increment → attribute bars move → companion celebrates → level-up ceremony (if triggered) — all within 700–1400 ms. |
| **Companion Engine** | Deterministic event-driven dialogue (11 events: app_open, first_quest, quest_complete, level_up, achievement, campaign_milestone, missed_task, return_after_absence, store_purchase, rest_day, focus_started). 6 moods. No AI dependency. |

### Technical Highlights

- **Server-authoritative reward engine** — deterministic, idempotent, transactional; client never computes rewards
- **Anti-farming** — daily micro-quest cap, difficulty gating (Epic only for campaign/challenge/focus), idempotency keys
- **Modular monolith** — explicit domain boundaries (identity, quests, routines, campaigns, focus, progression, economy, inventory, achievements, companion)
- **Optimistic UI with reconciliation** — instant visual feedback, final state from server
- **Accessibility-first** — semantic HTML, keyboard navigation, screen-reader support, visible focus, readable contrast, reduced-motion mode, non-color-only state
- **Configuration-driven cosmetics** — asset paths, prices, rarity in database; frontend renders from catalog

---

## Architecture

```
┌────────────────────┐
│      Browser       │
│  React / Next.js   │
└─────────┬──────────┘
          │ HTTPS / REST
          ▼
┌────────────────────┐
│  Server Application │  (Express + TypeScript)
│  ┌────────────────┐ │
│  │ Auth (JWT)     │ │
│  │ Quest Domain   │ │
│  │ Routine Domain │ │
│  │ Campaign Domain│ │
│  │ Focus Domain   │ │
│  │ Progression    │ │
│  │ Economy        │ │
│  │ Achievement    │ │
│  │ Inventory      │ │
│  │ Companion      │ │
│  └────────────────┘ │
└─────────┬──────────┘
          │ Prisma ORM
          ▼
┌────────────────────┐
│    PostgreSQL      │  (Supabase)
│  Persistent State  │
└────────────────────┘
```

### Domain Models (Prisma)

- **Profile** — display name, hero/companion assets, UX prefs (reduced motion, theme), notification toggles
- **ProfileProgression** — lifetime/season XP, level, rank_key, coins, streak, momentum, last_active_day
- **Attribute / ProfileAttribute** — 8 attributes with independent XP/level tracks
- **ActivityType** — 13 archetypes with primary/secondary attribute mappings & ratios
- **Quest / QuestInstance / QuestCompletion** — full lifecycle with idempotency, recurrence, campaign linkage
- **Campaign / CampaignMilestone** — hierarchical long-term goals
- **FocusSession** — timer state machine (running/paused/completed/cancelled)
- **RewardLedger** — immutable audit trail for every XP/coin/attribute grant
- **Item / Inventory / UserLoadout** — cosmetic catalog, ownership, equipped loadout
- **Achievement / UserAchievement** — rule-based unlocks with coin rewards
- **RestDay** — user-declared streak-freeze days

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- PostgreSQL 15+ (or Supabase project)
- pnpm (recommended) or npm

### Environment Variables

Create `.env` in `backend/` and `frontend/` from the examples:

**backend/.env**
```env
DATABASE_URL="postgresql://user:pass@host:5432/life_rpg?schema=public"
DIRECT_URL="postgresql://user:pass@host:5432/life_rpg?schema=public"
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="anon-key"
SUPABASE_SERVICE_ROLE_KEY="service-role-key"
JWT_SECRET="your-jwt-secret"
CORS_ORIGIN="http://localhost:3000"
PORT=4000
NODE_ENV=development
```

**frontend/.env.local**
```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="anon-key"
```

### Installation

```bash
# Root
pnpm install

# Backend
cd backend
pnpm install
pnpm prisma:generate
pnpm prisma:migrate dev
pnpm db:seed
pnpm dev        # http://localhost:4000

# Frontend (separate terminal)
cd frontend
pnpm install
pnpm dev        # http://localhost:3000
```

### Available Scripts

**Backend**
```bash
pnpm dev              # tsx watch
pnpm build            # tsc
pnpm start            # node dist/server.js
pnpm typecheck        # tsc --noEmit
pnpm test             # all test suites
pnpm prisma:generate  # generate client
pnpm prisma:migrate   # dev migrations
pnpm db:deploy        # migrate deploy + seed
```

**Frontend**
```bash
pnpm dev              # next dev -p 3000
pnpm build            # next build
pnpm start            # next start -p 3000
pnpm typecheck        # tsc --noEmit
pnpm lint             # next lint
pnpm test             # contract tests
```

---

## Project Structure

```
Karma/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   ├── migrations/            # Migration history
│   │   └── seed.ts                # Demo data
│   ├── src/
│   │   ├── app.ts                 # Express app factory
│   │   ├── server.ts              # Entry point
│   │   ├── config.ts              # Env validation
│   │   ├── db.ts                  # Prisma client
│   │   ├── middlewares/           # errorHandler, rateLimit, validate
│   │   ├── modules/               # Domain modules
│   │   │   ├── achievements/
│   │   │   ├── campaigns/
│   │   │   ├── companion/
│   │   │   ├── economy/
│   │   │   ├── focus/
│   │   │   ├── identity/
│   │   │   ├── inventory/
│   │   │   ├── notifications/
│   │   │   ├── progression/
│   │   │   ├── quests/
│   │   │   └── routines/
│   │   ├── routes/                # API route composition
│   │   ├── rpg/                   # Core game engine
│   │   │   ├── attributes.ts
│   │   │   ├── antiFarming.ts
│   │   │   ├── companion.ts
│   │   │   ├── index.ts           # RewardEngine
│   │   │   ├── penalties.ts
│   │   │   ├── ranks.ts
│   │   │   ├── rewards.ts
│   │   │   ├── streak.ts
│   │   │   └── xpCurve.ts
│   │   └── shared/                # Cross-cutting utilities
│   └── tests/                     # Unit & integration tests
├── frontend/
│   ├── app/                       # Next.js App Router pages
│   │   ├── (auth)/                # login, welcome, onboarding
│   │   ├── campaigns/
│   │   ├── chronicle/
│   │   ├── focus/
│   │   ├── hero-card/
│   │   ├── personalize/
│   │   ├── quests/
│   │   ├── realm/
│   │   ├── settings/
│   │   ├── store/
│   │   ├── layout.tsx
│   │   └── page.tsx               # Today screen
│   ├── components/
│   │   ├── quests/                # QuestPrimary, QuestRow, LevelUpModal
│   │   ├── journey/               # CampaignPreview
│   │   ├── illustrations/         # HeroImage, CompanionImage, FrameWrap
│   │   ├── celebration/           # Completion burst, confetti
│   │   ├── toast/, focus/, tour/  # UI primitives
│   │   └── Shell.tsx              # App shell + navigation
│   ├── lib/
│   │   ├── api.ts                 # Typed API client
│   │   ├── auth.tsx               # Supabase SSR auth
│   │   ├── identity-context.tsx   # Profile + progression state
│   │   ├── theme.tsx              # CSS variable theme
│   │   ├── sound.ts               # Web Audio FX
│   │   ├── types.ts               # Shared TypeScript types
│   │   └── supabase/              # Server/client helpers
│   ├── public/                    # Static assets (heroes, companions, frames, audio)
│   └── tests/
├── PRDS/                          # 14 product requirement documents
├── supabase/                      # Supabase config & migrations
└── package.json                   # Root devDependencies (supabase CLI)
```

---

## API Reference

Base URL: `http://localhost:4000/api/v1`

All private endpoints require `Authorization: Bearer <supabase_jwt>`.

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile/me` | Full profile + progression + loadout |
| PATCH | `/profile/me` | Update display name, hero, companion, prefs |
| GET | `/profile/me/progression` | XP, level, rank, coins, streak, attributes |
| DELETE | `/profile/me` | Account deletion (irreversible) |

### Quests
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/quests/today` | Today's Quest aggregate (pinned, due, routine, campaign, spark) |
| GET | `/quests` | List with filters (status, type, limit, cursor) |
| POST | `/quests` | Create quest |
| GET | `/quests/:id` | Single quest |
| PATCH | `/quests/:id` | Update quest |
| DELETE | `/quests/:id` | Soft delete |
| POST | `/quests/preview` | Reward preview (no creation) |
| GET | `/quests/suggest-mapping` | Attribute mapping suggestion |
| POST | `/quests/:id/complete` | Complete (idempotent) |
| POST | `/quests/:id/abandon` | Abandon (negative XP marker) |
| POST | `/quests/:id/generate-instances` | Routine instance generation |
| GET | `/quests/:id/instances` | Routine instances |
| GET | `/quests/meta/activity-types` | Active activity archetypes |

### Campaigns
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/campaigns` | List campaigns |
| POST | `/campaigns` | Create campaign |
| GET | `/campaigns/:id` | Campaign with milestones |
| PATCH | `/campaigns/:id` | Update campaign |
| DELETE | `/campaigns/:id` | Archive |
| POST | `/campaigns/:id/milestones` | Add milestone |
| PATCH | `/campaigns/milestones/:id` | Update milestone |

### Focus
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/focus` | Session history |
| POST | `/focus/start` | Start session |
| POST | `/focus/:id/finish` | Finish session |
| POST | `/focus/:id/pause` | Pause |
| POST | `/focus/:id/resume` | Resume |

### Economy
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/store` | Catalog (active items) |
| POST | `/store/purchase` | Buy item (atomic: coins + ledger + inventory) |
| GET | `/inventory` | Owned items |
| GET | `/loadout` | Equipped loadout |
| PATCH | `/loadout` | Equip/unequip |

### Meta
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/meta/achievements` | Achievement definitions |
| GET | `/meta/ranks` | Rank ladder |

---

## Design System

### Tokens (CSS Variables)

```css
:root {
  /* Surfaces */
  --bg: #0C0C0C;
  --bg-elevated: #141414;
  --card: #1A1A1A;
  --overlay: rgba(0,0,0,0.6);

  /* Text */
  --text: #FFFFFF;
  --text-muted: #888888;
  --text-inverse: #0C0C0C;

  /* State */
  --success: #10B981;
  --warning: #F59E0B;
  --danger: #EF4444;
  --info: #3B82F6;
  --xp: #FBBF24;
  --currency: #F59E0B;

  /* Motion */
  --motion-micro: 120ms;
  --motion-standard: 240ms;
  --motion-celebration: 700ms;
}
```

### Typography

- **Display**: Inter 800/700 — Hero level, rank titles
- **Headline**: Inter 600 — Section headers
- **Body**: Inter 400/500 — UI copy
- **Mono**: JetBrains Mono — XP numbers, codes

### Motion Hierarchy

| Tier | Duration | Use Cases |
|------|----------|-----------|
| Micro | 120ms | Hover, tap, toggle |
| Standard | 240ms | Panel slide, modal enter |
| Celebration | 700–1400ms | Completion choreography, level-up |

**Reduced Motion** — Disables particles, instant transitions, static progress bars, no screen pulse. All information preserved.

---

## Deployment

### Production (Vercel + Supabase)

```bash
# 1. Push to GitHub
git push origin main

# 2. Vercel: Import repository
#    - Framework: Next.js
#    - Root Directory: frontend
#    - Build Command: pnpm build
#    - Output Directory: .next
#    - Environment Variables: from frontend/.env.example

# 3. Supabase: Link project
supabase link --project-ref <ref>

# 4. Run migrations
supabase db push

# 5. Seed (optional)
supabase functions deploy seed  # or run locally with DIRECT_URL
```

### Docker (Alternative)

```dockerfile
# backend/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
COPY prisma ./prisma
RUN npx prisma generate
EXPOSE 4000
CMD ["node", "dist/server.js"]
```

---

## Testing

### Backend
```bash
cd backend
pnpm test
# Runs: rpgEngine, rewardFlow, names, routines, penalties
```

### Frontend
```bash
cd frontend
pnpm test
# Contract tests against live API
```

### Type Safety
```bash
# Both packages
pnpm typecheck
```

---

## Contributing

1. **Branch**: `feat/<domain>-<short-desc>` or `fix/<issue>`
2. **Commit**: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`)
3. **PR**: Template requires description, test plan, screenshots (UI changes), linked PRD section
4. **Review**: Minimum 1 approval from domain owner + 1 cross-domain
5. **Merge**: Squash & merge after CI passes (typecheck, lint, tests)

### Code Standards

- **TypeScript**: Strict mode, no `any`, explicit return types on public APIs
- **Zod**: All request bodies validated via schemas in `modules/*/schemas.ts`
- **Error Handling**: `asyncHandler` wrapper, domain errors via `shared/errors.ts`
- **Database**: All mutations in Prisma transactions (`$transaction`)
- **Idempotency**: Every completion endpoint requires `idempotencyKey`

---

## Product Requirement Documents

Located in `/PRDS`:

| Document | Scope |
|----------|-------|
| `LIFE_RPG_MASTER_PRD.md` | Product baseline, 6 systems, acceptance criteria |
| `LIFE_RPG_MASTER_BLUEPRINT_v2.md` | Build map, 7 screens, wireframes, choreography |
| `LIFE_RPG_SYSTEM_ARCHITECTURE_PRD.md` | Modular monolith, data flow, deployment |
| `LIFE_RPG_FRONTEND_UX_PRD.md` | Screen specs, components, motion, accessibility |
| `LIFE_RPG_RPG_ENGINE_PRD.md` | XP curve, ranks, attributes, anti-farming, companion |
| `LIFE_RPG_BACKEND_DATABASE_PRD.md` | Schema, indexes, migrations, seed |
| `LIFE_RPG_MEDIA_INTEGRATION_PRD.md` | Asset pipeline, hero/companion variants, audio |
| `LIFE_RPG_CHECKPOINT_PRD.md` | Milestone definitions, progress calculation |
| `LIFE_RPG_ROUND2_POLISH_PRD.md` | Polish pass, edge cases, performance budgets |
| `LIFE_RPG_V3_REDESIGN_PRD.md` | Future redesign direction |
| `LIFE_RPG_ABANDON_REMINDER_PRD.md` | Abandon flow, re-engagement |
| `LIFE_RPG_PRD_v2.md` | Iteration 2 requirements |
| `KARMA_MEDIA_ASSETS_SPEC_PRD.md` | Asset specifications, naming conventions |

---

## Acknowledgements

- **Problem Statement**: IIT Bhubaneswar Life RPG Challenge
- **Fonts**: Inter (Google Fonts)
- **Icons**: Custom SVG icon set (`/components/icons`)
- **Audio**: Original compositions (bgm-*, focus/*)
- **Art**: Hero/companion/frame/scenery assets in `/public`

---

## Contact

| Member | GitHub | Email |
|--------|--------|-------|
| Debjeet Mazumder | `@debjeet-mazumder` | debjeetmazumder3232@gmail.com |
| Debardrita Baksi | `@debardrita-baksi` | baksidebadrita@gmail.com |
| Indranil Chatterjee | `@indranil-chatterjee` | indranilchatterjee098@gmail.com |
| Mehul Kumar Jaiswal | `@mehul-kumar-jaiswal` | jaiswalmehulkumar441@gmail.com |

**Project Board**: [GitHub Projects](https://github.com/orgs/karma/projects)  
**Issues**: [GitHub Issues](https://github.com/karma/karma/issues)  
**Discussions**: [GitHub Discussions](https://github.com/karma/karma/discussions)

---

*Built with intention. Progress, not perfection.*
