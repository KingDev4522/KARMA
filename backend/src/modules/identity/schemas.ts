import { z } from "zod";

export const UpdateIdentitySchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  heroName: z.string().min(1).max(80).optional(),
  bio: z.string().max(500).optional(),
  heroAssetId: z.string().max(120).optional(),
  companionAssetId: z.string().max(120).optional(),
  lifeDomains: z.array(z.string().min(1).max(40)).max(12).optional(),
  // UX prefs (LRP-FE-001 §15 reduced-motion, §20 accessibility): persisted server-side.
  reducedMotion: z.boolean().optional(),
  theme: z.string().max(40).nullable().optional(),
  // Notification prefs (PRD v2 §31): every category toggleable.
  notifyQuest: z.boolean().optional(),
  notifyStreak: z.boolean().optional(),
  notifyCelebrate: z.boolean().optional(),
});
