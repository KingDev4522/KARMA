-- CreateEnum
CREATE TYPE "QuestType" AS ENUM ('quick', 'focus', 'routine', 'campaign', 'challenge', 'recovery');

-- CreateEnum
CREATE TYPE "QuestStatus" AS ENUM ('draft', 'active', 'in_progress', 'completed', 'skipped', 'archived');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('frame', 'title', 'nameplate', 'realm', 'effect', 'companion_emote', 'quest_skin', 'badge_case', 'hero_card');

-- CreateEnum
CREATE TYPE "FocusStatus" AS ENUM ('running', 'paused', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('active', 'paused', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('todo', 'in_progress', 'done', 'skipped');

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "display_name" TEXT,
    "hero_name" TEXT,
    "bio" TEXT,
    "hero_asset_id" TEXT,
    "companion_asset_id" TEXT,
    "life_domains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reduced_motion" BOOLEAN NOT NULL DEFAULT false,
    "theme" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_progression" (
    "profile_id" TEXT NOT NULL,
    "lifetime_xp" INTEGER NOT NULL DEFAULT 0,
    "season_xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "rank_key" TEXT NOT NULL DEFAULT 'novice_i',
    "coins" INTEGER NOT NULL DEFAULT 0,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "best_streak" INTEGER NOT NULL DEFAULT 0,
    "momentum" INTEGER NOT NULL DEFAULT 0,
    "last_active_day" DATE,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "profile_progression_pkey" PRIMARY KEY ("profile_id")
);

-- CreateTable
CREATE TABLE "attributes" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_attributes" (
    "profile_id" TEXT NOT NULL,
    "attribute_id" UUID NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "profile_attributes_pkey" PRIMARY KEY ("profile_id","attribute_id")
);

-- CreateTable
CREATE TABLE "activity_types" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "primary_attribute" TEXT NOT NULL,
    "secondary_attribute" TEXT NOT NULL,
    "primary_ratio" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "secondary_ratio" DOUBLE PRECISION NOT NULL DEFAULT 0.35,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "activity_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quests" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "quest_type" "QuestType" NOT NULL,
    "activity_type_id" UUID,
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "estimated_minutes" INTEGER,
    "scheduled_for" DATE,
    "due_at" TIMESTAMPTZ(6),
    "status" "QuestStatus" NOT NULL DEFAULT 'active',
    "campaign_id" UUID,
    "milestone_id" UUID,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_rule" JSONB,
    "primary_override" TEXT,
    "secondary_override" TEXT,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quest_instances" (
    "id" UUID NOT NULL,
    "quest_id" UUID NOT NULL,
    "occurrence_date" DATE NOT NULL,
    "status" "QuestStatus" NOT NULL DEFAULT 'active',
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "quest_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quest_completions" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "quest_id" UUID NOT NULL,
    "instance_id" UUID,
    "idempotency_key" TEXT NOT NULL,
    "completed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "base_xp" INTEGER NOT NULL,
    "reward_xp" INTEGER NOT NULL,
    "reward_coins" INTEGER NOT NULL,
    "activity_key" TEXT,
    "primary_attribute" TEXT,
    "primary_attribute_xp" INTEGER NOT NULL DEFAULT 0,
    "secondary_attribute" TEXT,
    "secondary_attribute_xp" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quest_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'active',
    "target_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_milestones" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order_index" INTEGER NOT NULL,
    "target_date" DATE,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'todo',

    CONSTRAINT "campaign_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "focus_sessions" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "quest_id" UUID,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),
    "planned_seconds" INTEGER NOT NULL,
    "actual_seconds" INTEGER,
    "status" "FocusStatus" NOT NULL DEFAULT 'running',

    CONSTRAINT "focus_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_ledger" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "currency_type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" UUID NOT NULL,
    "item_type" "ItemType" NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "asset_path" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "rarity" TEXT NOT NULL DEFAULT 'common',
    "metadata" JSONB DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "user_id" TEXT NOT NULL,
    "item_id" UUID NOT NULL,
    "acquired_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'purchase',

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("user_id","item_id")
);

-- CreateTable
CREATE TABLE "user_loadout" (
    "user_id" TEXT NOT NULL,
    "frame_item_id" UUID,
    "title_item_id" UUID,
    "realm_item_id" UUID,
    "effect_item_id" UUID,
    "companion_emote_item_id" UUID,
    "quest_skin_item_id" UUID,
    "badge_case_item_id" UUID,
    "hero_card_item_id" UUID,

    CONSTRAINT "user_loadout_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon_path" TEXT NOT NULL,
    "rule_key" TEXT NOT NULL,
    "reward_coins" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "user_id" TEXT NOT NULL,
    "achievement_id" UUID NOT NULL,
    "unlocked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("user_id","achievement_id")
);

-- CreateTable
CREATE TABLE "rest_days" (
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rest_days_pkey" PRIMARY KEY ("user_id","date")
);

-- CreateIndex
CREATE UNIQUE INDEX "attributes_key_key" ON "attributes"("key");

-- CreateIndex
CREATE UNIQUE INDEX "activity_types_key_key" ON "activity_types"("key");

-- CreateIndex
CREATE INDEX "quests_user_id_status_idx" ON "quests"("user_id", "status");

-- CreateIndex
CREATE INDEX "quests_user_id_scheduled_for_idx" ON "quests"("user_id", "scheduled_for");

-- CreateIndex
CREATE INDEX "quests_user_id_due_at_idx" ON "quests"("user_id", "due_at");

-- CreateIndex
CREATE INDEX "quest_instances_quest_id_occurrence_date_idx" ON "quest_instances"("quest_id", "occurrence_date");

-- CreateIndex
CREATE UNIQUE INDEX "quest_instances_quest_id_occurrence_date_key" ON "quest_instances"("quest_id", "occurrence_date");

-- CreateIndex
CREATE INDEX "quest_completions_user_id_completed_at_idx" ON "quest_completions"("user_id", "completed_at");

-- CreateIndex
CREATE UNIQUE INDEX "quest_completions_user_id_idempotency_key_key" ON "quest_completions"("user_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "campaigns_user_id_status_idx" ON "campaigns"("user_id", "status");

-- CreateIndex
CREATE INDEX "campaign_milestones_campaign_id_order_index_idx" ON "campaign_milestones"("campaign_id", "order_index");

-- CreateIndex
CREATE INDEX "focus_sessions_user_id_started_at_idx" ON "focus_sessions"("user_id", "started_at");

-- CreateIndex
CREATE INDEX "reward_ledger_user_id_created_at_idx" ON "reward_ledger"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "items_key_key" ON "items"("key");

-- CreateIndex
CREATE INDEX "inventory_user_id_idx" ON "inventory"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_key_key" ON "achievements"("key");

-- CreateIndex
CREATE INDEX "user_achievements_user_id_idx" ON "user_achievements"("user_id");

-- AddForeignKey
ALTER TABLE "profile_progression" ADD CONSTRAINT "profile_progression_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_attributes" ADD CONSTRAINT "profile_attributes_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_attributes" ADD CONSTRAINT "profile_attributes_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quests" ADD CONSTRAINT "quests_activity_type_id_fkey" FOREIGN KEY ("activity_type_id") REFERENCES "activity_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quests" ADD CONSTRAINT "quests_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quests" ADD CONSTRAINT "quests_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "campaign_milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest_instances" ADD CONSTRAINT "quest_instances_quest_id_fkey" FOREIGN KEY ("quest_id") REFERENCES "quests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest_completions" ADD CONSTRAINT "quest_completions_quest_id_fkey" FOREIGN KEY ("quest_id") REFERENCES "quests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_milestones" ADD CONSTRAINT "campaign_milestones_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_quest_id_fkey" FOREIGN KEY ("quest_id") REFERENCES "quests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_loadout" ADD CONSTRAINT "user_loadout_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
