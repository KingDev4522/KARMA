import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../shared/asyncHandler";
import { requireAuth, currentUserId } from "../shared/auth";
import { validateBody } from "../middlewares/validate";
import { CompleteQuestSchema, CreateQuestSchema, UpdateQuestSchema } from "../modules/quests/schemas";
import { completeQuest, createQuest, deleteQuest, getQuest, getToday, listQuests, previewQuestReward, suggestMapping, updateQuest } from "../modules/quests/service";
import { generateRoutineInstances, listRoutineInstances } from "../modules/routines/service";
import { prisma } from "../db";

export const questRouter = Router();

// Today's Quest — must be before /:id
questRouter.get(
  "/today",
  requireAuth,
  asyncHandler(async (req, res) => {
    const date = typeof req.query.date === "string" ? req.query.date : undefined;
    const tz = typeof req.query.tz === "string" ? req.query.tz.slice(0, 60) : undefined;
    res.json(await getToday(currentUserId(req), date, tz));
  }),
);

questRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const q = req.query as Record<string, string | undefined>;
    res.json(
      await listQuests(currentUserId(req), {
        status: q.status,
        questType: q.questType,
        limit: q.limit ? Number(q.limit) : 20,
        cursor: q.cursor,
        includeDeleted: q.includeDeleted === "true",
        preview: q.preview === "true" || q.preview === "1",
      }),
    );
  }),
);

questRouter.post(
  "/",
  requireAuth,
  validateBody(CreateQuestSchema),
  asyncHandler(async (req, res) => {
    const created = await createQuest(currentUserId(req), req.body);
    res.status(201).json(created);
  }),
);

// Reward preview + mapping suggest — LRP-FE-001 §6 Quest Card + §7 creation flow.
// Task-first: user picks activity → backend suggests mapping + previews reward. No quest created.
// NOTE: must be registered BEFORE /:id so "preview"/"suggest-mapping" aren't treated as ids.
const PreviewSchema = z.object({
  difficulty: z.number().int().min(1).max(5).default(3),
  questType: z.enum(["quick", "focus", "routine", "campaign", "challenge", "recovery"]).default("quick"),
  activityKey: z.string().min(1).max(60).optional(),
  primaryOverride: z.string().min(1).max(30).optional(),
  secondaryOverride: z.string().min(1).max(30).optional(),
});

questRouter.post(
  "/preview",
  requireAuth,
  validateBody(PreviewSchema),
  asyncHandler(async (req, res) => {
    res.json(await previewQuestReward(req.body));
  }),
);

questRouter.get(
  "/suggest-mapping",
  requireAuth,
  asyncHandler(async (req, res) => {
    const q = req.query as Record<string, string | undefined>;
    res.json(suggestMapping(q.activityKey ?? null, q.primaryOverride ?? null, q.secondaryOverride ?? null));
  }),
);

questRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await getQuest(currentUserId(req), req.params.id));
  }),
);

questRouter.patch(
  "/:id",
  requireAuth,
  validateBody(UpdateQuestSchema),
  asyncHandler(async (req, res) => {
    res.json(await updateQuest(currentUserId(req), req.params.id, req.body));
  }),
);

questRouter.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await deleteQuest(currentUserId(req), req.params.id));
  }),
);

// Completion — server-authoritative, idempotent (LRP-BE-001 §8-§10)
questRouter.post(
  "/:id/complete",
  requireAuth,
  validateBody(CompleteQuestSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await completeQuest(currentUserId(req), req.params.id, req.body));
  }),
);

// Routines: instance generation + listing
const GenSchema = z.object({ from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

questRouter.post(
  "/:id/generate-instances",
  requireAuth,
  validateBody(GenSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await generateRoutineInstances(currentUserId(req), req.params.id, req.body.from, req.body.to));
  }),
);

questRouter.get(
  "/:id/instances",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await listRoutineInstances(currentUserId(req), req.params.id));
  }),
);

// Activity types — finite taxonomy (public to authenticated users)
questRouter.get(
  "/meta/activity-types",
  requireAuth,
  asyncHandler(async (_req, res) => {
    res.json(await prisma.activityType.findMany({ where: { active: true }, orderBy: { key: "asc" } }));
  }),
);
