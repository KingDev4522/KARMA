import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../shared/asyncHandler";
import { requireAuth, currentUserId } from "../shared/auth";
import { validateBody } from "../middlewares/validate";
import { listAchievements } from "../modules/achievements/service";
import { getCompanionState } from "../modules/companion/service";
import { getAnalytics, getCalendar, getDebrief, getHeroCard, getHistory, getRealm } from "../modules/chronicle/service";
import { getNotifications } from "../modules/notifications/service";
import { prisma } from "../db";
import { ensureProfile } from "../modules/identity/service";
import { toDayKey } from "../shared/utils";

export const metaRouter = Router();

metaRouter.get("/achievements", requireAuth, asyncHandler(async (req, res) => { res.json(await listAchievements(currentUserId(req))); }));

metaRouter.get(
  "/companion",
  requireAuth,
  asyncHandler(async (req, res) => {
    const event = (typeof req.query.event === "string" ? req.query.event : "app_open") as never;
    const tz = typeof req.query.tz === "string" ? req.query.tz.slice(0, 60) : undefined;
    res.json(await getCompanionState(currentUserId(req), event, tz));
  }),
);

metaRouter.get("/chronicle/history", requireAuth, asyncHandler(async (req, res) => {
  res.json(await getHistory(currentUserId(req), req.query.limit ? Number(req.query.limit) : 30));
}));
metaRouter.get("/chronicle/analytics", requireAuth, asyncHandler(async (req, res) => { res.json(await getAnalytics(currentUserId(req))); }));
metaRouter.get("/chronicle/debrief", requireAuth, asyncHandler(async (req, res) => {
  const date = typeof req.query.date === "string" ? req.query.date : undefined;
  res.json(await getDebrief(currentUserId(req), date));
}));
metaRouter.get("/hero-card", requireAuth, asyncHandler(async (req, res) => { res.json(await getHeroCard(currentUserId(req))); }));
// LRP-FE-001 §12 Realm in one call (FE §21 perceived performance).
metaRouter.get("/realm", requireAuth, asyncHandler(async (req, res) => { res.json(await getRealm(currentUserId(req))); }));

// Unified planning calendar (PRD v2 §29): quests + instances + milestones + focus.
metaRouter.get("/chronicle/calendar", requireAuth, asyncHandler(async (req, res) => {
  const q = req.query as Record<string, string | undefined>;
  const today = toDayKey();
  res.json(await getCalendar(currentUserId(req), q.from ?? today, q.to ?? today));
}));

// Notification center feed (PRD v2 §31): deterministic, toggleable, no spam.
metaRouter.get("/notifications", requireAuth, asyncHandler(async (req, res) => { res.json(await getNotifications(currentUserId(req))); }));

// Rest days — intentional rest without breaking streak (MASTER PRD §15)
const RestSchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), note: z.string().max(280).optional() });

metaRouter.get("/rest-days", requireAuth, asyncHandler(async (req, res) => {
  res.json(await prisma.restDay.findMany({ where: { userId: currentUserId(req) }, orderBy: { date: "desc" }, take: 60 }));
}));
metaRouter.post("/rest-days", requireAuth, validateBody(RestSchema), asyncHandler(async (req, res) => {
  const userId = currentUserId(req);
  await ensureProfile(userId);
  const date = new Date(`${req.body.date}T00:00:00.000Z`);
  const row = await prisma.restDay.upsert({
    where: { userId_date: { userId, date } },
    update: { note: req.body.note },
    create: { userId, date, note: req.body.note },
  });
  res.status(201).json(row);
}));

// Starter suggestions — Smart without AI (BLUEPRINT §23): deterministic from lifeDomains
metaRouter.get("/starters", requireAuth, asyncHandler(async (req, res) => {
  const userId = currentUserId(req);
  await ensureProfile(userId);
  const profile = await prisma.profile.findUniqueOrThrow({ where: { id: userId } });
  const domains = new Set((profile.lifeDomains ?? []).map((d) => d.toLowerCase()));
  const has = (...keys: string[]) => keys.some((k) => domains.has(k));
  const suggestions: { title: string; questType: string; activityKey: string; difficulty: number; estimatedMinutes: number }[] = [];
  if (has("fitness", "health")) {
    suggestions.push(
      { title: "10-minute walk", questType: "quick", activityKey: "cardio", difficulty: 1, estimatedMinutes: 10 },
      { title: "Drink water", questType: "quick", activityKey: "recovery", difficulty: 1, estimatedMinutes: 2 },
      { title: "5-minute stretch", questType: "recovery", activityKey: "recovery", difficulty: 1, estimatedMinutes: 5 },
    );
  }
  if (has("learning", "study", "career", "coding", "code")) {
    suggestions.push(
      { title: "25-minute deep work", questType: "focus", activityKey: "deep_work", difficulty: 3, estimatedMinutes: 25 },
      { title: "Review one concept", questType: "quick", activityKey: "study_learning", difficulty: 2, estimatedMinutes: 15 },
      { title: "Complete one small building task", questType: "focus", activityKey: "coding_building", difficulty: 3, estimatedMinutes: 30 },
    );
  }
  if (suggestions.length === 0) {
    suggestions.push(
      { title: "Write tomorrow's top 3", questType: "quick", activityKey: "life_admin", difficulty: 1, estimatedMinutes: 5 },
      { title: "Clear desk", questType: "quick", activityKey: "life_admin", difficulty: 1, estimatedMinutes: 5 },
      { title: "Read 2 pages", questType: "quick", activityKey: "study_learning", difficulty: 1, estimatedMinutes: 5 },
      { title: "Step outside", questType: "recovery", activityKey: "recovery", difficulty: 1, estimatedMinutes: 5 },
    );
  }
  res.json({ date: toDayKey(), domains: profile.lifeDomains, suggestions: suggestions.slice(0, 5) });
}));
