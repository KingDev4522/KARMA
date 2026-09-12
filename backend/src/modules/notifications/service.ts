import { prisma } from "../../db";
import { toDayKey } from "../../shared/utils";
import { ensureProfile } from "../identity/service";

export interface Notice {
  key: string;
  kind: "quest" | "streak" | "celebration" | "rest" | "info";
  title: string;
  body: string;
}

/**
 * Prototype notifications (PRD v2 §31): quest/routine reminders, streak warnings,
 * celebrations, companion notes. Composed deterministically from live state —
 * no spam, every category toggleable via profile prefs. No push worker in MVP;
 * the feed is the in-app notification center the frontend polls.
 */
export async function getNotifications(userId: string): Promise<{ notifications: Notice[]; prefs: { quest: boolean; streak: boolean; celebrate: boolean } }> {
  const profile = await ensureProfile(userId);
  const prefs = {
    quest: (profile as { notifyQuest?: boolean }).notifyQuest ?? true,
    streak: (profile as { notifyStreak?: boolean }).notifyStreak ?? true,
    celebrate: (profile as { notifyCelebrate?: boolean }).notifyCelebrate ?? true,
  };
  const notices: Notice[] = [];
  const todayKey = toDayKey();
  const dayStart = new Date(`${todayKey}T00:00:00.000Z`);

  const [dueCount, overdueCount, dueInstances, prog, recentAch, restToday, campaign] = await Promise.all([
    prefs.quest
      ? prisma.quest.count({
          where: {
            userId,
            deletedAt: null,
            status: { in: ["active", "in_progress", "draft"] },
            OR: [{ scheduledFor: dayStart }, { dueAt: { gte: dayStart, lt: new Date(`${todayKey}T23:59:59.999Z`) } }],
          },
        })
      : 0,
    // Overdue reminders: still-open quests whose due moment already passed.
    prefs.quest
      ? prisma.quest.count({
          where: { userId, deletedAt: null, status: { in: ["active", "in_progress", "draft"] }, dueAt: { lt: dayStart } },
        })
      : 0,
    // Routine reminders: today's rhythm instances still open.
    prefs.quest
      ? prisma.questInstance.count({
          where: { quest: { userId }, occurrenceDate: dayStart, status: { in: ["active", "in_progress", "draft"] } },
        })
      : 0,
    prisma.profileProgression.findUnique({ where: { profileId: userId } }),
    prefs.celebrate
      ? prisma.userAchievement.findMany({
          where: { userId, unlockedAt: { gte: new Date(Date.now() - 7 * 86_400_000) } },
          include: { achievement: true },
          orderBy: { unlockedAt: "desc" },
          take: 5,
        })
      : [],
    prisma.restDay.findUnique({ where: { userId_date: { userId, date: dayStart } } }).catch(() => null),
    prisma.campaign.findFirst({ where: { userId, status: "active" }, include: { milestones: true } }),
  ]);

  if (restToday) {
    notices.push({ key: "rest-today", kind: "rest", title: "Rest day declared", body: "Rest is part of the run. We're not quitting; we're recovering." });
  }
  if (prefs.quest && dueCount + dueInstances > 0) {
    const total = dueCount + dueInstances;
    notices.push({
      key: "due-today",
      kind: "quest",
      title: `${total} quest${total === 1 ? "" : "s"} due today`,
      body: dueInstances > 0 ? `Including ${dueInstances} rhythm check-in${dueInstances === 1 ? "" : "s"}. Pick the first one.` : "Your board is set. Pick the first one.",
    });
  }
  if (prefs.quest && overdueCount > 0) {
    notices.push({
      key: "overdue",
      kind: "quest",
      title: `${overdueCount} overdue — no shame`,
      body: "Reschedule or abandon them from Quests; the ledger keeps everything honest.",
    });
  }
  if (prefs.streak && prog && prog.currentStreak > 0) {
    const lastDay = prog.lastActiveDay ? prog.lastActiveDay.toISOString().slice(0, 10) : null;
    if (lastDay !== todayKey) {
      notices.push({ key: "streak-risk", kind: "streak", title: `Streak at ${prog.currentStreak} day${prog.currentStreak === 1 ? "" : "s"}`, body: "Clear one quest today to keep the chain unbroken." });
    }
  }
  if (prefs.celebrate) {
    for (const u of recentAch) {
      notices.push({ key: `ach-${u.achievementId}`, kind: "celebration", title: `Badge earned — ${u.achievement.name}`, body: u.achievement.description });
    }
  }
  if (campaign && campaign.milestones.length > 0) {
    const next = campaign.milestones.find((m) => (m.status as string) === "todo" || (m.status as string) === "in_progress");
    if (next && prefs.quest) {
      notices.push({ key: `camp-${campaign.id}`, kind: "info", title: `${campaign.title}: next objective`, body: next.title as string });
    }
  }
  if (notices.length === 0) {
    notices.push({ key: "all-clear", kind: "info", title: "All quiet", body: "Your board is clear. Add your first Quest." });
  }
  return { notifications: notices, prefs };
}
