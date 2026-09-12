import { z } from "zod";

export const StartFocusSchema = z.object({
  questId: z.string().uuid().optional(),
  plannedSeconds: z.number().int().min(60).max(8 * 3600),
});

export const FinishFocusSchema = z.object({
  status: z.enum(["completed", "cancelled"]).default("completed"),
  actualSeconds: z.number().int().min(0).max(12 * 3600).optional(),
});
