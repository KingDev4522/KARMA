# KARMA — Frontend

Next.js 14 + TypeScript + Tailwind + Framer Motion + Supabase Auth.
Implements LRP-FE-001: Today, Quests, Campaigns, Focus, Realm, Chronicle, Store + onboarding, settings, Hero Card.

## Quick start

1. `cp .env.example .env.local` — set `NEXT_PUBLIC_API_URL` (backend, default `:4000`).
   For data without Supabase: backend `DEV_AUTH_BYPASS=true` + `NEXT_PUBLIC_DEV_BYPASS=true`.
2. `npm install`
3. `npm run dev` → `:3000`. Backend must run (`backend/npm run dev`).

## Conventions (PRD-strict)

- One backend call per screen where possible (`/quests/today`, `/realm`); no N+1.
- Every quest card shows server-computed `rewardPreview` (+XP/coins, attrs).
- Never send xp/coins to the backend (server-authoritative; 400 if forged).
- Completion uses `crypto.randomUUID()` idempotency keys; replays are safe.
- Errors carry `retryable` → [Try Again]; failures never fake success.
- Reduced motion: `prefers-reduced-motion` CSS + persisted `reducedMotion` pref.
- Keyboard: semantic landmarks, skip link, visible focus, `aria-current` nav.

## Scripts

`dev | build | start | typecheck | test` (contract test: every backend route has a client fn).
