-- Identity + store expansion: companion naming, hero skins, premium companions.
-- Idempotent (IF NOT EXISTS / guarded enum values) so it applies cleanly on
-- fresh databases and on the existing Supabase database.
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "companion_name" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "avatar_asset_id" TEXT;

-- ItemType enum: pre-migration values are frame/title/nameplate/realm/effect/
-- companion_emote/quest_skin/badge_case/hero_card. Each addition is guarded so
-- re-runs no-op. (DO-block guards work on every supported Postgres version.)
DO $$ BEGIN
  ALTER TYPE "ItemType" ADD VALUE 'hero_skin';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE "ItemType" ADD VALUE 'companion';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "user_loadout" ADD COLUMN IF NOT EXISTS "hero_skin_item_id" UUID;
ALTER TABLE "user_loadout" ADD COLUMN IF NOT EXISTS "companion_item_id" UUID;
