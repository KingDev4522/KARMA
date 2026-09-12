-- Repair: ensure notification preference columns exist.
-- The original migration files were lost locally after already being applied to
-- this database, so this repair is idempotent: fresh databases get the columns,
-- existing databases no-op.
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "notify_quest" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "notify_streak" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "notify_celebrate" BOOLEAN NOT NULL DEFAULT true;
