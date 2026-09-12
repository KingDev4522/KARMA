# LIFE RPG — Backend

Modular monolith: Express + TypeScript + Prisma (PostgreSQL) + Supabase Auth JWT.
Covers all 7 PRDs: MASTER, PRD v2, BLUEPRINT v2, BACKEND/DATABASE, RPG ENGINE, ARCHITECTURE, **FRONTEND UX**.

## Quick start

1. `cp .env.example .env` and set `DATABASE_URL`, `SUPABASE_JWT_SECRET`.
2. `npm install`
3. `npm run prisma:generate && npm run prisma:migrate && npm run db:seed`
4. `npm run dev` → `:4000`. `GET /health`.

Local auth bypass (dev only): `DEV_AUTH_BYPASS=true` + header `X-Dev-User-Id: <uuid>`.

## Structure

- `src/rpg/` — deterministic engine: XP curve `floor(100·level^1.55)`, base rewards (10/3 … 120/30), attribute split `floor(x·0.35)`, ranks (Novice→…→Mythic, 5 stages each, Ascendant+stars), streak/momentum, anti-farming (micro cap 5/day), companion (FE §11 moods incl. `focused`).
- `src/modules/` — identity, progression, quests (+preview/suggest, completion tx, Today buckets), routines, campaigns (+next actionable), focus (pause/resume), economy (store w/ equipped/locked), inventory, achievements, companion, chronicle (+Realm, hero-card w/ title).
- `src/routes/` `src/middlewares/` `src/app.ts` `src/server.ts`.
- `prisma/schema.prisma` (+`sql/001_init.sql` RLS notes), `prisma/seed.ts` (8 attrs, 11 activities, 10 achievements, 28 items).
- `tests/` pure-engine tests (no DB). `docs/API.md` frontend contract.

## Key contracts (FE-aligned)

- Today: one call → greeting/level/coins, companion, buckets `{pinned, dueToday, routine, campaign, spark}`, campaign+attrs+streak+recentReward+emptyHints.
- Quest create: `suggest-mapping` → `preview` → create. Card shows type/time/activity/attrs/reward preview.
- Complete: idempotent, server-authoritative, returns `choreography` order + `companion`.
- Campaign: `nextMilestone` + `nextQuest`. Realm: single aggregate. Store: `status` + purchase returns `loadout`.
- Errors carry `retryable`. Prefs (`reducedMotion`, `theme`) persisted server-side.

## Scripts

`dev | build | start | typecheck | test | prisma:generate | prisma:migrate | db:seed`
