import { prisma } from "../../db";
import { companionMessage, companionMoodFor, dailyGreeting, daypart, type CompanionEvent } from "../../rpg/companion";
import { ensureProfile } from "../identity/service";
import { toDayKey } from "../../shared/utils";

/** Companion read model — deterministic greeting/reaction (no AI, LRP-FE-001 §11). */
export async function getCompanionState(userId: string, event: CompanionEvent = "app_open") {
  await ensureProfile(userId);
  const [profile, prog, todayCount, campaign] = await Promise.all([
    prisma.profile.findUnique({ where: { id: userId } }),
    prisma.profileProgression.findUnique({ where: { profileId: userId } }),
    prisma.quest.count({
      where: {
        userId,
        deletedAt: null,
        status: { in: ["active", "in_progress", "draft"] },
        OR: [
          { isPinned: true },
          { scheduledFor: new Date(`${toDayKey()}T00:00:00.000Z`) },
        ],
      },
    }),
    prisma.campaign.findFirst({ where: { userId, status: "active" }, include: { milestones: true } }),
  ]);

  let campaignPct: number | undefined;
  if (campaign) {
    const total = campaign.milestones.length;
    campaignPct = total ? Math.round((campaign.milestones.filter((m) => (m.status as string) === "done").length / total) * 100) : 0;
  }

  const ctx = {
    heroName: profile?.heroName ?? profile?.displayName ?? "hero",
    questsToday: todayCount,
    streak: prog?.currentStreak ?? 0,
    campaignPct,
    level: prog?.level ?? 1,
    timeOfDay: daypart(),
  };

  return {
    event,
    message: event === "app_open" ? dailyGreeting(ctx) : companionMessage(event, ctx),
    mood: companionMoodFor(event),
    context: ctx,
    companionAssetId: profile?.companionAssetId ?? null,
  };
}
