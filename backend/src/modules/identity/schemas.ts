import { z } from "zod";
import { nameError } from "./names";

const heroNameField = z
  .string()
  .min(1)
  .max(80)
  .nullable()
  .optional()
  .refine((v) => v == null || nameError(v) === null, (v) => ({
    message: (v != null && nameError(v as string)) || "Name not allowed.",
  }));

export const UpdateIdentitySchema = z.object({
  displayName: heroNameField,
  heroName: heroNameField,
  bio: z.string().max(500).nullable().optional(),
  heroAssetId: z.string().max(120).optional(),
  companionAssetId: z.string().max(120).optional(),
  companionName: heroNameField,
  avatarAssetId: z.string().max(100000).nullable().optional(),
  lifeDomains: z.array(z.string().min(1).max(40)).max(12).optional(),
  // UX prefs (LRP-FE-001 §15 reduced-motion, §20 accessibility): persisted server-side.
  reducedMotion: z.boolean().optional(),
  theme: z.string().max(40).nullable().optional(),
  // Notification prefs (PRD v2 §31): every category toggleable.
  notifyQuest: z.boolean().optional(),
  notifyStreak: z.boolean().optional(),
  notifyCelebrate: z.boolean().optional(),
});
