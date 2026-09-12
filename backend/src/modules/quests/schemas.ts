import { z } from "zod";
import { DifficultySchema, QuestStatusEnum, QuestTypeEnum } from "../../shared/validation";

export const CreateQuestSchema = z.object({
  title: z.string().min(1, "Give your quest a name.").max(200),
  description: z.string().max(2000).optional(),
  questType: QuestTypeEnum.default("quick"),
  activityKey: z.string().min(1).max(60).optional(),
  difficulty: DifficultySchema.default(3),
  estimatedMinutes: z.number().int().min(1).max(1440).optional(),
  scheduledFor: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "scheduledFor must be YYYY-MM-DD").optional(),
  dueAt: z.string().datetime({ offset: true }).optional(),
  campaignId: z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional(),
  isPinned: z.boolean().default(false),
  recurrenceRule: z
    .object({
      freq: z.enum(["daily", "weekly", "custom"]),
      days: z.array(z.number().int().min(0).max(6)).optional(),
      time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    })
    .optional(),
  primaryOverride: z.string().min(1).max(30).optional(),
  secondaryOverride: z.string().min(1).max(30).optional(),
});

export const UpdateQuestSchema = CreateQuestSchema.partial().extend({
  status: QuestStatusEnum.optional(),
  // Reschedule edge case (PRD v2 §44): accept a plain calendar date or explicit
  // null to clear — the service normalizes both to timestamptz/null.
  dueAt: z.union([z.string().datetime({ offset: true }), z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]).optional(),
});

export const CompleteQuestSchema = z.object({
  idempotencyKey: z.string().min(8).max(120),
  instanceId: z.string().uuid().optional(),
  // No xp/coins fields — server is authoritative (LRP-BE-001 §10). Extra fields rejected by strict check in route.
});

export const QuestQuerySchema = z.object({
  status: z.string().optional(),
  questType: z.string().optional(),
  limit: z.string().optional(),
  cursor: z.string().optional(),
  includeDeleted: z.string().optional(),
});
