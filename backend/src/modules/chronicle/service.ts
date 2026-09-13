import { prisma } from "../../db";
import { xpProgressForLevel } from "../../rpg/xpCurve";
import { rankForXp } from "../../rpg/ranks";
import { ATTRIBUTE_KEYS } from "../../shared/validation";
import { ensureProfile } from "../identity/service";

/**
 * Chronicle — history, statistics, analytics, Hero Card read model (MASTER PRD §13, PRD v2 §32-§33, §20).
 * Visual pattern is game history log; analytics answer "Am I becoming more consistent?"
 */

export async function getHistory(userId: string, limit = 30) {
  await ensureProfile(userId);
  const [completions, sessions, ledger] = await Promise.all([
    prisma.questCompletion.findMany({ where: { userId }, orderBy: { completedAt: "desc" }, take: limit }),
    prisma.focusSession.findMany({ where: { userId }, orderBy: { startedAt: "desc" }, take: limit }),
    prisma.rewardLedger.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: limit }),
  ]);
  const questIds = [...new Set(completions.map((c) => c.questId))];
  const quests = await prisma.quest.findMany({ where: { id: { in: questIds } }, select: { id: true, title: true, questType: true } });
  const byId = new Map(quests.map((q) => [q.id, q]));
  return {
    completions: completions.map((c) => ({ ...c, quest: byId.get(c.questId) ?? null })),
    focusSessions: sessions,
    ledger,
  };
}

export async function getAnalytics(userId: string) {
  await ensureProfile(userId);
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() - ((startOfWeek.getUTCDay() + 6) % 7)); // Monday
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [todayC, weekC, monthC, sessions, attrs, prog] = await Promise.all([
    prisma.questCompletion.findMany({ where: { userId, completedAt: { gte: startOfDay } } }),
    prisma.questCompletion.findMany({ where: { userId, completedAt: { gte: startOfWeek } } }),
    prisma.questCompletion.findMany({ where: { userId, completedAt: { gte: startOfMonth } } }),
    prisma.focusSession.findMany({ where: { userId, startedAt: { gte: startOfMonth }, status: "completed" } }),
    prisma.profileAttribute.findMany({ where: { profileId: userId }, include: { attribute: true }, orderBy: { xp: "desc" } }),
    prisma.profileProgression.findUnique({ where: { profileId: userId } }),
  ]);

  const sum = (rows: { rewardXp: number; rewardCoins: number }[]) => ({
    xp: rows.reduce((a, r) => a + r.rewardXp, 0),
    coins: rows.reduce((a, r) => a + r.rewardCoins, 0),
    count: rows.length,
  });

  const focusSeconds = sessions.reduce((a, s) => a + (s.actualSeconds ?? s.plannedSeconds), 0);
  const activeDays = new Set(weekC.map((c) => c.completedAt.toISOString().slice(0, 10))).size;

  // Streak/activity history: per-day buckets for the last 30 days (MASTER PRD § History).
  const dailyActivity = (() => {
    const map = new Map<string, { date: string; quests: number; xp: number; coins: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(startOfDay);
      d.setUTCDate(d.getUTCDate() - i);
      const k = d.toISOString().slice(0, 10);
      map.set(k, { date: k, quests: 0, xp: 0, coins: 0 });
    }
    for (const c of monthC) {
      const k = c.completedAt.toISOString().slice(0, 10);
      const b = map.get(k);
      if (b) {
        b.quests += 1;
        b.xp += c.rewardXp;
        b.coins += c.rewardCoins;
      }
    }
    return [...map.values()];
  })();

  return {
    today: { ...sum(todayC), focusSecondsToday: sessions.filter((s) => s.startedAt >= startOfDay).reduce((a, s) => a + (s.actualSeconds ?? 0), 0) },
    week: { ...sum(weekC), activeDays },
    month: { ...sum(monthC), focusSeconds, strongestAttribute: attrs[0]?.attribute.key ?? null, totalFocusSessions: sessions.length },
    streak: { current: prog?.currentStreak ?? 0, best: prog?.bestStreak ?? 0, momentum: prog?.momentum ?? 0 },
    attributes: attrs.map((a) => ({ key: a.attribute.key, name: a.attribute.name, xp: a.xp, level: a.level })),
    dailyActivity,
  };
}

/**
 * Unified planning calendar (PRD v2 §29): scheduled quests, routine instances,
 * campaign milestones and focus sessions in ONE feed. Every event links to its
 * underlying quest — no duplicate task records.
 */
export async function getCalendar(userId: string, from: string, to: string) {
  await ensureProfile(userId);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    const { BadRequestError } = await import("../../shared/errors");
    throw new BadRequestError("from/to must be YYYY-MM-DD");
  }
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T23:59:59.999Z`);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    const { BadRequestError } = await import("../../shared/errors");
    throw new BadRequestError("Invalid date range");
  }
  if ((end.getTime() - start.getTime()) / 86_400_000 > 62) {
    const { BadRequestError } = await import("../../shared/errors");
    throw new BadRequestError("Range capped at 62 days");
  }

  const [quests, instances, milestones, sessions] = await Promise.all([
    prisma.quest.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [
          { scheduledFor: { gte: start, lte: end } },
          { dueAt: { gte: start, lte: end } },
        ],
      },
      select: { id: true, title: true, questType: true, status: true, scheduledFor: true, dueAt: true, campaignId: true, milestoneId: true },
      orderBy: { dueAt: "asc" },
      take: 200,
    }),
    prisma.questInstance.findMany({
      where: { quest: { userId }, occurrenceDate: { gte: start, lte: end } },
      include: { quest: { select: { id: true, title: true } } },
      orderBy: { occurrenceDate: "asc" },
      take: 200,
    }),
    prisma.campaignMilestone.findMany({
      where: { campaign: { userId }, targetDate: { gte: start, lte: end } },
      include: { campaign: { select: { id: true, title: true } } },
      orderBy: { targetDate: "asc" },
      take: 100,
    }),
    prisma.focusSession.findMany({
      where: { userId, startedAt: { gte: start, lte: end } },
      select: { id: true, questId: true, startedAt: true, endedAt: true, plannedSeconds: true, actualSeconds: true, status: true },
      orderBy: { startedAt: "asc" },
      take: 200,
    }),
  ]);

  return {
    from,
    to,
    quests: quests.map((q) => ({ kind: "quest" as const, ...q })),
    instances: instances.map((i) => ({ kind: "routine_instance" as const, id: i.id, questId: i.questId, questTitle: i.quest.title, date: i.occurrenceDate, status: i.status })),
    milestones: milestones.map((m) => ({ kind: "milestone" as const, id: m.id, title: m.title, status: m.status, date: m.targetDate, campaignId: m.campaignId, campaignTitle: m.campaign.title })),
    focusSessions: sessions.map((s) => ({ kind: "focus" as const, ...s })),
  };
}

export async function getDebrief(userId: string, dateKey?: string) {
  await ensureProfile(userId);
  const day = dateKey ?? new Date().toISOString().slice(0, 10);
  const start = new Date(`${day}T00:00:00.000Z`);
  const end = new Date(`${day}T23:59:59.999Z`);
  const completions = await prisma.questCompletion.findMany({ where: { userId, completedAt: { gte: start, lte: end } } });
  const prog = await prisma.profileProgression.findUnique({ where: { profileId: userId } });
  return {
    date: day,
    questsCleared: completions.length,
    xp: completions.reduce((a, c) => a + c.rewardXp, 0),
    coins: completions.reduce((a, c) => a + c.rewardCoins, 0),
    byPrimary: completions.reduce<Record<string, number>>((acc, c) => {
      const k = c.primaryAttribute ?? "unknown";
      acc[k] = (acc[k] ?? 0) + c.primaryAttributeXp;
      return acc;
    }, {}),
    streak: prog?.currentStreak ?? 0,
  };
}

/** Hero Card snapshot — visual identity object (MASTER PRD §13, PRD v2 §20, BLUEPRINT §18, LRP-FE-001 §14).
 * FE §14: preview-before-export; prioritizes Hero Identity, Level/Rank, Top Attributes,
 * Streak, Title, Achievements, Campaign Progress. Title resolves to the equipped title ITEM name. */
export async function getHeroCard(userId: string) {
  await ensureProfile(userId);
  const [profile, prog, attrs, achievements, loadout, campaigns] = await Promise.all([
    prisma.profile.findUniqueOrThrow({ where: { id: userId } }),
    prisma.profileProgression.findUnique({ where: { profileId: userId } }),
    prisma.profileAttribute.findMany({ where: { profileId: userId }, include: { attribute: true } }),
    prisma.userAchievement.findMany({ where: { userId }, include: { achievement: true }, orderBy: { unlockedAt: "desc" }, take: 6 }),
    prisma.userLoadout.findUnique({ where: { userId } }),
    prisma.campaign.findMany({ where: { userId, status: "active" }, include: { milestones: true }, take: 3 }),
  ]);
  // Full 8-attribute set in canonical order (radar spokes are positional —
  // a top-4 slice would misalign the graph with real scores).
  const attrByKey = new Map(attrs.map((a) => [a.attribute.key, a]));
  const allAttrs = ATTRIBUTE_KEYS.map((key) => {
    const row = attrByKey.get(key);
    return row
      ? { key, name: row.attribute.name, xp: row.xp, level: row.level }
      : { key, name: key.charAt(0).toUpperCase() + key.slice(1), xp: 0, level: 0 };
  });
  const lifetimeXp = prog?.lifetimeXp ?? 0;
  const loadoutRec = (loadout ?? {}) as Record<string, string | null>;
  const equippedIds = Object.values(loadoutRec).filter((v): v is string => typeof v === "string" && v.length > 0);
  const equippedItems = equippedIds.length
    ? await prisma.item.findMany({ where: { id: { in: equippedIds } } })
    : [];
  const byId = new Map(equippedItems.map((i) => [i.id, i]));
  const titleItem = loadout?.titleItemId ? byId.get(loadout.titleItemId) ?? null : null;
  return {
    heroName: profile.heroName ?? profile.displayName ?? "Unnamed Hero",
    avatar: profile.heroAssetId,
    avatarAssetId: (profile as Record<string, unknown>).avatarAssetId ?? null,
    companion: profile.companionAssetId,
    companionName: (profile as Record<string, unknown>).companionName ?? null,
    level: prog?.level ?? 1,
    xpProgress: xpProgressForLevel(lifetimeXp),
    rank: rankForXp(lifetimeXp),
    topAttributes: allAttrs,
    streak: prog?.currentStreak ?? 0,
    achievements: achievements.map((a) => ({ key: a.achievement.key, name: a.achievement.name, iconPath: a.achievement.iconPath })),
    campaigns: campaigns.map((c) => ({
      id: c.id,
      title: c.title,
      progressPct: c.milestones.length ? Math.round((c.milestones.filter((m) => (m.status as string) === "done").length / c.milestones.length) * 100) : 0,
    })),
    equipped: loadout,
    equippedItems: equippedItems.map((i) => ({ id: i.id, itemType: i.itemType, key: i.key, name: i.name, assetPath: i.assetPath })),
    title: titleItem ? { id: titleItem.id, key: titleItem.key, name: titleItem.name } : null,
  };
}

/**
 * Realm aggregate — LRP-FE-001 §12 identity/progression space in ONE call (FE §21 minimal blocking):
 * hero + companion + level/rank + attributes + achievements + collection + equipped + Hero Card.
 */
export async function getRealm(userId: string) {
  await ensureProfile(userId);
  const [profile, prog, attrs, ach, inventory, loadout, heroCard] = await Promise.all([
    prisma.profile.findUniqueOrThrow({ where: { id: userId } }),
    prisma.profileProgression.findUnique({ where: { profileId: userId } }),
    prisma.profileAttribute.findMany({ where: { profileId: userId }, include: { attribute: true }, orderBy: { xp: "desc" } }),
    prisma.userAchievement.findMany({ where: { userId }, include: { achievement: true }, orderBy: { unlockedAt: "desc" } }),
    prisma.inventory.findMany({ where: { userId }, orderBy: { acquiredAt: "desc" } }),
    prisma.userLoadout.findUnique({ where: { userId } }),
    getHeroCard(userId),
  ]);
  const lifetimeXp = prog?.lifetimeXp ?? 0;
  const itemIds = inventory.map((e) => e.itemId);
  const items = itemIds.length ? await prisma.item.findMany({ where: { id: { in: itemIds } } }) : [];
  const byId = new Map(items.map((i) => [i.id, i]));
  return {
    hero: { name: profile.heroName, displayName: profile.displayName, bio: profile.bio, heroAssetId: profile.heroAssetId, avatarAssetId: (profile as Record<string, unknown>).avatarAssetId ?? null },
    companion: { companionAssetId: profile.companionAssetId, companionName: (profile as Record<string, unknown>).companionName ?? null },
    progression: prog,
    xpProgress: xpProgressForLevel(lifetimeXp),
    rank: rankForXp(lifetimeXp),
    attributes: attrs.map((a) => ({ key: a.attribute.key, name: a.attribute.name, description: a.attribute.description, xp: a.xp, level: a.level })),
    achievements: {
      unlocked: ach.map((a) => ({ key: a.achievement.key, name: a.achievement.name, description: a.achievement.description, iconPath: a.achievement.iconPath, unlockedAt: a.unlockedAt })),
      count: ach.length,
      emptyHint: ach.length === 0 ? "Your first badge is one Quest away." : null,
    },
    collection: inventory.map((e) => ({ ...e, item: byId.get(e.itemId) ?? null })),
    equipped: loadout,
    heroCard,
    emptyHints: {
      noCollection: inventory.length === 0 ? "Earn coins from quests, then visit the Store." : null,
    },
  };
}
