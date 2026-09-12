import { z } from "zod";

/**
 * Core enums — single source of truth.
 * From BLUEPRINT §31 + MASTER PRD §3.1/§5 + BACKEND PRD.
 */
export const QuestTypeEnum = z.enum(["quick", "focus", "routine", "campaign", "challenge", "recovery"]);
export type QuestType = z.infer<typeof QuestTypeEnum>;

export const QuestStatusEnum = z.enum([
  "draft",
  "active",
  "in_progress",
  "completed",
  "skipped",
  "archived",
]);
export type QuestStatus = z.infer<typeof QuestStatusEnum>;

/** Quest state machine (BLUEPRINT §30): draft->planned? We normalize planned/scheduled to active. */
export const ACTIVE_QUEST_STATUSES: QuestStatus[] = ["draft", "active", "in_progress"];

export const AttributeKeyEnum = z.enum([
  "strength",
  "vitality",
  "intellect",
  "focus",
  "discipline",
  "craft",
  "connection",
  "exploration",
]);
export type AttributeKey = z.infer<typeof AttributeKeyEnum>;

export const ATTRIBUTE_KEYS: AttributeKey[] = [
  "strength",
  "vitality",
  "intellect",
  "focus",
  "discipline",
  "craft",
  "connection",
  "exploration",
];

export const ItemTypeEnum = z.enum([
  "frame",
  "title",
  "nameplate",
  "realm",
  "effect",
  "companion_emote",
  "quest_skin",
  "badge_case",
  "hero_card",
  "hero_skin",
  "companion",
]);
export type ItemType = z.infer<typeof ItemTypeEnum>;

export const CurrencyTypeEnum = z.enum(["xp", "coins", "attribute_xp"]);
export type CurrencyType = z.infer<typeof CurrencyTypeEnum>;

export const DifficultySchema = z.coerce.number().int().min(1).max(5);
export type Difficulty = 1 | 2 | 3 | 4 | 5;

export const UuidSchema = z.string().uuid({ message: "Must be UUID" });
export const DateTimeSchema = z.string().datetime({ offset: true });

export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const r = schema.safeParse(data);
  if (!r.success) {
    const { BadRequestError } = require("./errors") as typeof import("./errors");
    throw new BadRequestError("Validation failed", r.error.flatten());
  }
  return r.data;
}
