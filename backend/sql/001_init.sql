-- LIFE RPG initial migration — PostgreSQL / Supabase (LRP-BE-001 §3, §20).
-- Apply via Supabase SQL editor or `psql $DATABASE_URL -f sql/001_init.sql`.
-- Prisma is the app ORM; this file is the reviewable SQL baseline with RLS.

-- Enums
DO $$ BEGIN CREATE TYPE "QuestType" AS ENUM ('quick','focus','routine','campaign','challenge','recovery'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "QuestStatus" AS ENUM ('draft','active','in_progress','completed','skipped','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ItemType" AS ENUM ('frame','title','nameplate','realm','effect','companion_emote','quest_skin','badge_case','hero_card'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "FocusStatus" AS ENUM ('running','paused','completed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- NOTE (LRP-FE-001 alignment): profiles adds reduced_motion BOOLEAN DEFAULT false + theme TEXT NULL;
-- existing DBs: ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reduced_motion BOOLEAN DEFAULT false;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme TEXT;
-- ALTER TYPE "FocusStatus" ADD VALUE IF NOT EXISTS 'paused';
DO $$ BEGIN CREATE TYPE "CampaignStatus" AS ENUM ('active','paused','completed','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "MilestoneStatus" AS ENUM ('todo','in_progress','done','skipped'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tables (abbreviated DDL mirrors prisma/schema.prisma; Prisma migrate is canonical for app dev)
-- NOTE: run `npx prisma migrate dev` for full DDL. This file ensures Supabase RLS + indexes exist.

-- Recommended indexes (LRP-BE-001 §20) — created idempotently:
-- quests(user_id, status), quests(user_id, scheduled_for), quests(user_id, due_at),
-- quest_instances(quest_id, occurrence_date), quest_completions(user_id, completed_at),
-- reward_ledger(user_id, created_at), inventory(user_id), campaigns(user_id, status),
-- focus_sessions(user_id, started_at)

-- Enable RLS on user-scoped tables (backend uses service_role which bypasses RLS;
-- these policies protect direct PostgREST access by authenticated users).
-- Each policy enforces auth.uid() = user_id / id ownership (LRP-BE-001 §4).

-- Example (run after Prisma migrate):
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "own_profile" ON profiles FOR ALL USING (auth.uid()::text = id) WITH CHECK (auth.uid()::text = id);
-- ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "own_quests" ON quests FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
-- ALTER TABLE quest_completions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "own_completions" ON quest_completions FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
-- ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "own_campaigns" ON campaigns FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
-- ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "own_focus" ON focus_sessions FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
-- ALTER TABLE reward_ledger ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "own_ledger" ON reward_ledger FOR SELECT USING (auth.uid()::text = user_id);
-- ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "own_inventory" ON inventory FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
-- ALTER TABLE user_loadout ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "own_loadout" ON user_loadout FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
-- ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "own_ach" ON user_achievements FOR SELECT USING (auth.uid()::text = user_id);
-- ALTER TABLE rest_days ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "own_rest" ON rest_days FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
-- ALTER TABLE profile_progression ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "own_prog" ON profile_progression FOR SELECT USING (auth.uid()::text = profile_id);
-- ALTER TABLE profile_attributes ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "own_pattr" ON profile_attributes FOR SELECT USING (auth.uid()::text = profile_id);
