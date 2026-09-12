import { Prisma } from "@prisma/client";
import { prisma } from "../../db";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../../shared/errors";
import { toDayKey } from "../../shared/utils";
import { ATTRIBUTE_KEYS } from "../../shared/validation";
import { ACTIVITY_BY_KEY } from "../../rpg/attributes";
import { attributeLevelForXp } from "../../rpg/xpCurve";
import { resolveRewards } from "../../rpg";
import { applyCompletionToStreak, momentumAfterCompletion, momentumForActiveDays } from "../../rpg/streak";
import { didRankAdvance, levelUpCoinBonus, rankForXp, rankUpChestCoins } from "../../rpg/ranks";
import { xpProgressForLevel } from "../../rpg/xpCurve";
import { evaluateAndGrantAchievements } from "../achievements/service";
import { ensureProfile } from "../identity/service";
import { abandonPenaltyFor, applyPenaltyToLifetime } from "../../rpg/penalties";

/**
 * Quest domain (LRP-BE-001 §5, §8-§10, §13, §15, §19).
 * - CRUD scoped to owner; soft delete preserves history.
 * - Completion is one server transaction, idempotent, server-authoritative.
 */

interface CreateQuestInput {
  title: string;
  description?: string;
  questType: "quick" | "focus" | "routine" | "campaign" | "challenge" | "recovery";
  activityKey?: string;
  difficulty?: number;
  estimatedMinutes?: number;
  scheduledFor?: string;
  dueAt?: string;
  campaignId?: string;
  milestoneId?: string;
  isPinned?: boolean;
  recurrenceRule?: { freq: "daily" | "weekly" | "custom"; days?: number[]; time?: string };
  primaryOverride?: string;
  secondaryOverride?: string;
}

export async function createQuest(userId: string, input: CreateQuestInput) {
  await ensureProfile(userId);

  if (input.activityKey && !ACTIVITY_BY_KEY[input.activityKey]) {
    throw new BadRequestError(`Unknown activityKey ${input.activityKey}`);
  }
  if (input.primaryOverride && !(ATTRIBUTE_KEYS as string[]).includes(input.primaryOverride)) {
    throw new BadRequestError(`Unknown primaryOverride ${input.primaryOverride}`);
  }
  if (input.secondaryOverride && !(ATTRIBUTE_KEYS as string[]).includes(input.secondaryOverride)) {
    throw new BadRequestError(`Unknown secondaryOverride ${input.secondaryOverride}`);
  }
  // Validate campaign/milestone ownership when linking (unified relationships, PRD v2 §30)
  if (input.campaignId) {
    const c = await prisma.campaign.findUnique({ where: { id: input.campaignId } });
    if (!c || c.userId !== userId) throw new ForbiddenError("Campaign not found or not owned");
  }
  if (input.milestoneId) {
    const m = await prisma.campaignMilestone.findUnique({ where: { id: input.milestoneId }, include: { campaign: true } });
    if (!m || m.campaign.userId !== userId) throw new ForbiddenError("Milestone not found or not owned");
    if (input.campaignId && m.campaignId !== input.campaignId) throw new BadRequestError("milestone does not belong to campaign");
  }

  let activityTypeId: string | undefined;
  if (input.activityKey) {
    const at = await prisma.activityType.findUnique({ where: { key: input.activityKey } });
    if (!at) throw new BadRequestError(`activityKey not seeded: ${input.activityKey}`);
    activityTypeId = at.id;
  }

  return prisma.quest.create({
    data: {
      userId,
      title: input.title.trim(),
      description: input.description,
      questType: input.questType as never,
      activityTypeId,
      difficulty: Math.min(5, Math.max(1, Math.floor(input.difficulty ?? 3))),
      estimatedMinutes: input.estimatedMinutes,
      scheduledFor: input.scheduledFor ? new Date(`${input.scheduledFor}T00:00:00.000Z`) : undefined,
      dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
      campaignId: input.milestoneId
        ? (await prisma.campaignMilestone.findUniqueOrThrow({ where: { id: input.milestoneId } })).campaignId
        : input.campaignId,
      milestoneId: input.milestoneId,
      isPinned: input.isPinned ?? false,
      recurrenceRule: input.recurrenceRule ?? Prisma.DbNull,
      primaryOverride: input.primaryOverride,
      secondaryOverride: input.secondaryOverride,
      status: "active",
    },
  });
}

type QuestRow = {
  difficulty: number;
  questType: string;
  activityType?: { key: string } | null;
  primaryOverride?: string | null;
  secondaryOverride?: string | null;
};

/**
 * Today's micro-quest count — mirrors the engine's isMicroQuest() rule
 * (difficulty 1 + quick/recovery), counted through the quest relation so
 * low-XP campaign/focus completions never inflate the cap.
 */
async function countMicrosToday(
  db: Pick<typeof prisma, "questCompletion">,
  userId: string,
  dayStart: Date,
): Promise<number> {
  return db.questCompletion.count({
    where: {
      userId,
      completedAt: { gte: dayStart },
      quest: { difficulty: { lte: 1 }, questType: { in: ["quick", "recovery"] as never } },
    },
  });
}

/**
 * Attach deterministic reward previews to quest rows (LRP-FE-001 §6 Quest Card:
 * every card shows +XP / +coins + primary/secondary attrs BEFORE action).
 * One extra query per call (streak + today's micro count), shared across rows.
 */
export async function withRewardPreviews<T extends QuestRow>(userId: string, rows: T[]): Promise<(T & { rewardPreview: ReturnType<typeof resolveRewards> })[]> {
  if (rows.length === 0) return [];
  const todayKey = toDayKey();
  const dayStart = new Date(`${todayKey}T00:00:00.000Z`);
  const [prog, microCountToday] = await Promise.all([
    prisma.profileProgression.findUnique({ where: { profileId: userId } }),
    countMicrosToday(prisma, userId, dayStart),
  ]);
  return rows.map((r) => ({
    ...r,
    rewardPreview: resolveRewards({
      difficulty: r.difficulty,
      questType: r.questType,
      activityKey: r.activityType?.key ?? null,
      primaryOverride: r.primaryOverride ?? null,
      secondaryOverride: r.secondaryOverride ?? null,
      microCountToday,
      currentStreak: prog?.currentStreak ?? 0,
    }),
  }));
}

export async function listQuests(userId: string, q: { status?: string; questType?: string; limit?: number; cursor?: string; includeDeleted?: boolean; preview?: boolean }) {
  const where: Prisma.QuestWhereInput = { userId };
  if (!q.includeDeleted) where.deletedAt = null;
  if (q.status) {
    const list = q.status.split(",").map((s) => s.trim()).filter(Boolean);
    where.status = list.length === 1 ? (list[0] as never) : { in: list as never };
  }
  if (q.questType) {
    const list = q.questType.split(",").map((s) => s.trim()).filter(Boolean);
    where.questType = list.length === 1 ? (list[0] as never) : { in: list as never };
  }
  const rows = await prisma.quest.findMany({
    where,
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: Math.min(100, Math.max(1, q.limit ?? 20)),
    ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    include: { activityType: true },
  });
  if (q.preview) return withRewardPreviews(userId, rows);
  return rows;
}

export async function getQuest(userId: string, id: string) {
  const quest = await prisma.quest.findUnique({ where: { id }, include: { activityType: true } });
  if (!quest || quest.userId !== userId || quest.deletedAt) throw new NotFoundError("Quest not found");
  // Single-fetch also previews (FE §6: reward visible before action, everywhere).
  const [previewed] = await withRewardPreviews(userId, [quest]);
  return previewed;
}

export async function updateQuest(userId: string, id: string, patch: Partial<CreateQuestInput> & { status?: string }) {
  const quest = await prisma.quest.findUnique({ where: { id } });
  if (!quest || quest.userId !== userId || quest.deletedAt) throw new NotFoundError("Quest not found");
  if (quest.status === "completed") throw new ConflictError("Completed quests are immutable history; create a new quest instead.");

  let activityTypeId: string | null | undefined;
  if (patch.activityKey !== undefined) {
    if (!patch.activityKey) activityTypeId = null;
    else {
      const at = await prisma.activityType.findUnique({ where: { key: patch.activityKey } });
      if (!at) throw new BadRequestError(`activityKey not seeded: ${patch.activityKey}`);
      activityTypeId = at.id;
    }
  }

  return prisma.quest.update({
    where: { id },
    data: {
      title: patch.title?.trim(),
      description: patch.description,
      questType: patch.questType as never | undefined,
      ...(activityTypeId !== undefined ? { activityTypeId } : {}),
      difficulty: patch.difficulty !== undefined ? Math.min(5, Math.max(1, Math.floor(patch.difficulty))) : undefined,
      estimatedMinutes: patch.estimatedMinutes,
      scheduledFor: patch.scheduledFor !== undefined ? (patch.scheduledFor ? new Date(`${patch.scheduledFor}T00:00:00.000Z`) : null) : undefined,
      dueAt: patch.dueAt !== undefined ? (patch.dueAt ? new Date(patch.dueAt) : null) : undefined,
      campaignId: patch.campaignId,
      milestoneId: patch.milestoneId,
      isPinned: patch.isPinned,
      recurrenceRule: patch.recurrenceRule !== undefined ? (patch.recurrenceRule ?? Prisma.DbNull) : undefined,
      primaryOverride: patch.primaryOverride,
      secondaryOverride: patch.secondaryOverride,
      status: patch.status as never | undefined,
    },
  });
}

/** Soft delete — historical completions/ledger retained (LRP-BE-001 §5, §19; BLUEPRINT §30). */
export async function deleteQuest(userId: string, id: string) {
  const quest = await prisma.quest.findUnique({ where: { id } });
  if (!quest || quest.userId !== userId || quest.deletedAt) throw new NotFoundError("Quest not found");
  return prisma.quest.update({ where: { id }, data: { deletedAt: new Date(), status: "archived" } });
}

export interface AbandonResult {
  questId: string;
  status: "skipped";
  penaltyXp: number;
  requestedPenalty: number;
  newLifetimeXp: number;
  level: number;
  rankDisplay: string;
  companion: { mood: string; message: string };
}

/**
 * Abandon a quest — the "stop / cancel / couldn't do it" path with honest
 * negative marking. The quest moves to `skipped` (re-queueable, never
 * destructive) and ~25% of the difficulty's gain is deducted from lifetime
 * XP, clamped so the level can never drop. Streak, coins, attributes and
 * achievements are untouched. Fully ledgered (sourceType "abandon").
 */
export async function abandonQuest(userId: string, questId: string): Promise<AbandonResult> {
  await ensureProfile(userId);
  return prisma.$transaction(async (tx) => {
    const quest = await tx.quest.findUnique({ where: { id: questId } });
    if (!quest || quest.userId !== userId || quest.deletedAt) throw new NotFoundError("Quest not found");
    if ((quest.status as string) === "completed") throw new ConflictError("Quest already completed — nothing to abandon.");
    if ((quest.status as string) === "skipped") throw new ConflictError("Quest already stopped — re-queue it to try again.");
    if ((quest.status as string) === "archived") throw new ConflictError("Quest is archived.");

    const prog = await tx.profileProgression.findUniqueOrThrow({ where: { profileId: userId } });
    const requested = abandonPenaltyFor(quest.difficulty);
    const { newLifetime, applied } = applyPenaltyToLifetime(prog.lifetimeXp, prog.level, requested);

    await tx.profileProgression.update({ where: { profileId: userId }, data: { lifetimeXp: newLifetime } });
    if (applied > 0) {
      await tx.rewardLedger.create({
        data: { userId, sourceType: "abandon", sourceId: questId, currencyType: "xp", amount: -applied, metadata: { questId, difficulty: quest.difficulty, requested } },
      });
    }
    await tx.quest.update({ where: { id: questId }, data: { status: "skipped" } });

    const { rankForXp: rankFor } = await import("../../rpg/ranks");
    const { companionMessage } = await import("../../rpg/companion");
    return {
      questId,
      status: "skipped" as const,
      penaltyXp: applied,
      requestedPenalty: requested,
      newLifetimeXp: newLifetime,
      level: prog.level,
      rankDisplay: rankFor(newLifetime).display,
      companion: { mood: "encouraging", message: companionMessage("missed_task", {}) },
    };
  });
}

export interface CompletionResult {
  deduped: boolean;
  completion: unknown;
  rewardXp: number;
  rewardCoins: number;
  primaryAttr: string;
  primaryXp: number;
  secondaryAttr: string;
  secondaryXp: number;
  newLevel: number;
  leveledUp: boolean;
  levelsGained: number;
  newRankKey: string;
  newRankDisplay: string;
  // PRD v2 §16: rank promotions pay a bonus chest on top of level rewards.
  rankUp: { from: string; to: string; bonusCoins: number } | null;
  currentStreak: number;
  bestStreak: number;
  momentum: number;
  unlockedAchievements: { key: string; name: string; rewardCoins: number }[];
  campaignProgress: { campaignId: string; progressPct: number } | null;
  capped: boolean;
  // LRP-FE-001 §10 reward choreography: ordered UI steps + companion reaction.
  // Order: checkmark → xp → coins → attributes → companion → level/achievement.
  choreography: { step: string; label: string }[];
  companion: { mood: string; message: string };
}

/**
 * Quest completion transaction (LRP-BE-001 §8):
 * Auth → Ownership → Not-Already-Completed → Resolve → Completion → XP → Coins →
 * Attributes → Streak → Level → Achievements → Campaign → Commit. Idempotent (§9).
 */
export async function completeQuest(
  userId: string,
  questId: string,
  opts: { idempotencyKey: string; instanceId?: string },
): Promise<CompletionResult> {
  await ensureProfile(userId);
  const todayKey = toDayKey();

  // Idempotency first: repeats return original, no duplicate reward.
  const existing = await prisma.questCompletion.findUnique({
    where: { userId_idempotencyKey: { userId, idempotencyKey: opts.idempotencyKey } },
  });
  if (existing) {
    return (existing as unknown as { metadataCache?: CompletionResult }).metadataCache as CompletionResult ?? {
      deduped: true,
      completion: existing,
      rewardXp: existing.rewardXp,
      rewardCoins: existing.rewardCoins,
      primaryAttr: existing.primaryAttribute ?? "",
      primaryXp: existing.primaryAttributeXp,
      secondaryAttr: existing.secondaryAttribute ?? "",
      secondaryXp: existing.secondaryAttributeXp,
      newLevel: 0,
      leveledUp: false,
      levelsGained: 0,
      newRankKey: "",
      newRankDisplay: "",
      rankUp: null,
      currentStreak: 0,
      bestStreak: 0,
      momentum: 0,
      unlockedAchievements: [],
      campaignProgress: null,
      capped: false,
      choreography: choreographyFor({ leveledUp: false, hasAchievements: false }),
      companion: { mood: "celebrating", message: "Quest cleared. That one mattered." },
    };
  }

  return prisma.$transaction(async (tx) => {
    const quest = await tx.quest.findUnique({ where: { id: questId }, include: { activityType: true } });
    if (!quest || quest.userId !== userId || quest.deletedAt) throw new NotFoundError("Quest not found");
    // Verify Not Already Completed (single quests). Routine instances checked below.
    if (!opts.instanceId && quest.status === "completed") {
      throw new ConflictError("Quest already completed — duplicate reward blocked.");
    }

    let instance: { id: string; status: string } | null = null;
    if (opts.instanceId) {
      const inst = await tx.questInstance.findUnique({ where: { id: opts.instanceId } });
      if (!inst || inst.questId !== questId) throw new NotFoundError("Quest instance not found");
      if ((inst.status as string) === "completed") throw new ConflictError("Instance already completed.");
      instance = { id: inst.id, status: inst.status as string };
    }

    // Anti-farming state: count today's micro completions
    const dayStart = new Date(`${todayKey}T00:00:00.000Z`);
    const microCountToday = await countMicrosToday(tx, userId, dayStart);

    const prog = await tx.profileProgression.findUniqueOrThrow({ where: { profileId: userId } });
    const activityKey = quest.activityType?.key ?? null;

    const rewards = resolveRewards({
      difficulty: quest.difficulty,
      questType: quest.questType as string,
      activityKey,
      primaryOverride: quest.primaryOverride,
      secondaryOverride: quest.secondaryOverride,
      microCountToday,
      currentStreak: prog.currentStreak,
    });

    // Rest-day check
    const rest = await tx.restDay.findUnique({ where: { userId_date: { userId, date: dayStart } } }).catch(() => null);

    // Create completion (historical record stores resolved values — §6, §19)
    const completion = await tx.questCompletion.create({
      data: {
        userId,
        questId,
        instanceId: instance?.id,
        idempotencyKey: opts.idempotencyKey,
        baseXp: rewards.baseXp,
        rewardXp: rewards.rewardXp,
        rewardCoins: rewards.rewardCoins,
        activityKey,
        primaryAttribute: rewards.primaryAttr,
        primaryAttributeXp: rewards.primaryXp,
        secondaryAttribute: rewards.secondaryAttr,
        secondaryAttributeXp: rewards.secondaryXp,
      },
    });

    // XP + level (backend source of truth)
    const oldLevel = prog.level;
    const newLifetime = prog.lifetimeXp + rewards.rewardXp;
    const newSeason = prog.seasonXp + rewards.rewardXp;
    const progress = xpProgressForLevel(newLifetime);
    const newRank = rankForXp(newLifetime);
    const leveledUp = progress.level > oldLevel;
    const levelsGained = progress.level - oldLevel;
    let bonusCoins = 0;
    if (leveledUp) {
      for (let l = oldLevel + 1; l <= progress.level; l++) bonusCoins += levelUpCoinBonus(l);
    }

    // Rank promotion chest (PRD v2 §16): rung-up or new Ascendant star pays out.
    const oldRank = rankForXp(prog.lifetimeXp);
    const rankAdvanced = didRankAdvance(oldRank, newRank);
    const rankUpBonus = rankAdvanced ? rankUpChestCoins(newRank.rank, newRank.stars ?? 0) : 0;
    bonusCoins += rankUpBonus;
    const rankUp = rankAdvanced
      ? { from: oldRank.display, to: newRank.display, bonusCoins: rankUpBonus }
      : null;

    // Streak
    const streakPrev = {
      currentStreak: prog.currentStreak,
      bestStreak: prog.bestStreak,
      lastActiveDay: prog.lastActiveDay ? prog.lastActiveDay.toISOString().slice(0, 10) : null,
    };
    const streak = applyCompletionToStreak(streakPrev, { todayKey, isRestDay: !!rest });

    // Momentum recompute from last 14 days completions + lift
    const since = new Date(Date.now() - 14 * 86_400_000);
    const recent = await tx.questCompletion.findMany({ where: { userId, completedAt: { gte: since } }, select: { completedAt: true } });
    const daySet = new Set(recent.map((r) => r.completedAt.toISOString().slice(0, 10)));
    daySet.add(todayKey);
    const recomputed = momentumForActiveDays([...daySet], todayKey);
    const momentum = momentumAfterCompletion(Math.max(prog.momentum, recomputed), streak.incremented);

    await tx.profileProgression.update({
      where: { profileId: userId },
      data: {
        lifetimeXp: newLifetime,
        seasonXp: newSeason,
        level: progress.level,
        rankKey: newRank.rankKey,
        coins: prog.coins + rewards.rewardCoins + bonusCoins,
        currentStreak: streak.currentStreak,
        bestStreak: streak.bestStreak,
        momentum,
        lastActiveDay: streak.lastActiveDay ? new Date(`${streak.lastActiveDay}T00:00:00.000Z`) : undefined,
      },
    });

    // Attribute XP (independent track)
    for (const [attrKey, gain] of [[rewards.primaryAttr, rewards.primaryXp], [rewards.secondaryAttr, rewards.secondaryXp]] as const) {
      if (!gain) continue;
      const attr = await tx.attribute.findUnique({ where: { key: attrKey } });
      if (!attr) continue;
      const pa = await tx.profileAttribute.findUnique({ where: { profileId_attributeId: { profileId: userId, attributeId: attr.id } } });
      const newXp = (pa?.xp ?? 0) + gain;
      await tx.profileAttribute.upsert({
        where: { profileId_attributeId: { profileId: userId, attributeId: attr.id } },
        update: { xp: newXp, level: attributeLevelForXp(newXp) },
        create: { profileId: userId, attributeId: attr.id, xp: newXp, level: attributeLevelForXp(newXp) },
      });
    }

    // Ledger entries (trustworthy game backend — BLUEPRINT §35G)
    await tx.rewardLedger.createMany({
      data: [
        { userId, sourceType: "quest_completion", sourceId: completion.id, currencyType: "xp", amount: rewards.rewardXp, metadata: { questId, difficulty: rewards.difficulty, capped: rewards.capped } },
        { userId, sourceType: "quest_completion", sourceId: completion.id, currencyType: "coins", amount: rewards.rewardCoins, metadata: { questId, streakBonus: rewards.streakBonusCoins } },
        ...(bonusCoins ? [{ userId, sourceType: "level_up", sourceId: completion.id, currencyType: "coins", amount: bonusCoins, metadata: { levelsGained } }] : []),
        ...(rankUp ? [{ userId, sourceType: "rank_up", sourceId: completion.id, currencyType: "coins", amount: rankUp.bonusCoins, metadata: { from: rankUp.from, to: rankUp.to } }] : []),
      ],
    });

    // Quest → completed (single) or instance → completed
    if (instance) {
      await tx.questInstance.update({ where: { id: instance.id }, data: { status: "completed", completedAt: new Date() } });
    } else {
      await tx.quest.update({ where: { id: questId }, data: { status: "completed" } });
    }

    // Achievements (deterministic) — evaluated inside same tx
    const unlockedAchievements = await evaluateAndGrantAchievements(tx, userId, {
      completionId: completion.id,
      questType: quest.questType as string,
      primaryAttr: rewards.primaryAttr,
      difficulty: rewards.difficulty,
      estimatedMinutes: quest.estimatedMinutes ?? undefined,
      newLevel: progress.level,
      gapDays: null, // comeback computed separately below
    });

    // Comeback check: previous lastActiveDay gap >= 7
    if (streakPrev.lastActiveDay) {
      const { daysBetween } = await import("../../shared/utils");
      const gap = daysBetween(streakPrev.lastActiveDay, todayKey);
      if (gap >= 7) {
        const extra = await evaluateAndGrantAchievements(tx, userId, { completionId: completion.id, questType: "comeback_probe", newLevel: progress.level, gapDays: gap });
        unlockedAchievements.push(...extra);
      }
    }

    // Campaign progress derived (never client-set — §14)
    let campaignProgress: CompletionResult["campaignProgress"] = null;
    const campaignId = quest.campaignId;
    if (campaignId) {
      const [milestones, quests] = await Promise.all([
        tx.campaignMilestone.findMany({ where: { campaignId } }),
        tx.quest.findMany({ where: { campaignId, deletedAt: null }, select: { id: true, status: true } }),
      ]);
      let pct = 0;
      if (milestones.length > 0) {
        const done = milestones.filter((m) => (m.status as string) === "done").length;
        pct = Math.round((done / milestones.length) * 100);
        // Auto-complete milestone if all its quests completed
        if (quest.milestoneId) {
          const sibs = await tx.quest.findMany({ where: { milestoneId: quest.milestoneId, deletedAt: null }, select: { status: true } });
          if (sibs.length > 0 && sibs.every((s) => (s.status as string) === "completed")) {
            await tx.campaignMilestone.update({ where: { id: quest.milestoneId }, data: { status: "done" } });
            const refreshed = await tx.campaignMilestone.findMany({ where: { campaignId } });
            const done2 = refreshed.filter((m) => (m.status as string) === "done").length;
            pct = Math.round((done2 / refreshed.length) * 100);
          }
        }
      } else if (quests.length > 0) {
        const done = quests.filter((x) => (x.status as string) === "completed").length;
        // include just-completed quest (in-tx read may be stale) → count current as done
        const adjusted = quests.find((x) => x.id === questId) && !instance ? done + 0 : done;
        pct = Math.round((adjusted / quests.length) * 100);
      }
      if (pct >= 100) {
        await tx.campaign.update({ where: { id: campaignId }, data: { status: "completed" } });
      }
      campaignProgress = { campaignId, progressPct: pct };
    }

    const result: CompletionResult = {
      deduped: false,
      completion,
      rewardXp: rewards.rewardXp,
      rewardCoins: rewards.rewardCoins + bonusCoins,
      primaryAttr: rewards.primaryAttr,
      primaryXp: rewards.primaryXp,
      secondaryAttr: rewards.secondaryAttr,
      secondaryXp: rewards.secondaryXp,
      newLevel: progress.level,
      leveledUp,
      levelsGained,
      newRankKey: newRank.rankKey,
      newRankDisplay: newRank.display,
      rankUp,
      currentStreak: streak.currentStreak,
      bestStreak: streak.bestStreak,
      momentum,
      unlockedAchievements,
      campaignProgress,
      capped: rewards.capped,
      choreography: choreographyFor({ leveledUp, hasAchievements: unlockedAchievements.length > 0 }),
      companion: companionForCompletion({ leveledUp, newLevel: progress.level, achievements: unlockedAchievements }),
    };
    // Celebration identity: the exact companion face + names the frontend
    // bubble needs, so cheers always come from YOUR companion, by name.
    const prof = await tx.profile.findUnique({ where: { id: userId } });
    if (prof) {
      const p = prof as unknown as { companionAssetId?: string | null; companionName?: string | null; heroName?: string | null; displayName?: string | null };
      (result.companion as Record<string, unknown>).companionAssetId = p.companionAssetId ?? null;
      (result.companion as Record<string, unknown>).companionName = p.companionName ?? null;
      (result.companion as Record<string, unknown>).heroName = p.heroName ?? p.displayName ?? null;
    }
    return result;
  });
}

/** LRP-FE-001 §10: fixed choreography order drives the frontend animation sequence. */
export function choreographyFor(opts: { leveledUp: boolean; hasAchievements: boolean }): { step: string; label: string }[] {
  const steps = [
    { step: "checkmark", label: "Checkmark locks" },
    { step: "xp", label: "XP movement" },
    { step: "coins", label: "Coin increment" },
    { step: "attributes", label: "Attribute movement" },
    { step: "companion", label: "Companion reaction" },
  ];
  if (opts.hasAchievements) steps.push({ step: "achievement", label: "Achievement reveal" });
  if (opts.leveledUp) steps.push({ step: "level_up", label: "Level-up ceremony" });
  return steps;
}

function companionForCompletion(opts: { leveledUp: boolean; newLevel: number; achievements: { name: string }[] }): { mood: string; message: string } {
  const { companionMessage } = require("../../rpg/companion") as typeof import("../../rpg/companion");
  if (opts.leveledUp) return { mood: "celebrating", message: companionMessage("level_up", { level: opts.newLevel }) };
  if (opts.achievements.length > 0) return { mood: "celebrating", message: companionMessage("achievement", { achievementName: opts.achievements[0].name }) };
  return { mood: "celebrating", message: companionMessage("quest_complete") };
}

/**
 * Reward preview — LRP-FE-001 §6 Quest Card + §7 creation flow.
 * Deterministic preview of XP/coins/attributes BEFORE the quest is created or completed.
 * Uses the same engine as completion (minus streak bonus variance, which is flagged).
 */
export async function previewQuestReward(
  userId: string,
  input: {
    difficulty?: number;
    questType?: string;
    activityKey?: string | null;
    primaryOverride?: string | null;
    secondaryOverride?: string | null;
    currentStreak?: number;
    microCountToday?: number;
  },
) {
  const difficulty = Math.min(5, Math.max(1, Math.floor(input.difficulty ?? 3)));
  const questType = input.questType ?? "quick";
  const activityKey = input.activityKey ?? null;
  if (activityKey && !ACTIVITY_BY_KEY[activityKey]) throw new BadRequestError(`Unknown activityKey ${activityKey}`);
  // Creator preview uses live user state (streak + today's micro count) so the
  // anti-farming cap warning is honest before creation, not just after.
  const todayKey = toDayKey();
  const dayStart = new Date(`${todayKey}T00:00:00.000Z`);
  const [prog, liveMicros] = await Promise.all([
    input.currentStreak !== undefined
      ? Promise.resolve(null)
      : prisma.profileProgression.findUnique({ where: { profileId: userId } }),
    input.microCountToday !== undefined
      ? Promise.resolve(input.microCountToday)
      : countMicrosToday(prisma, userId, dayStart),
  ]);
  const rewards = resolveRewards({
    difficulty,
    questType,
    activityKey,
    primaryOverride: input.primaryOverride ?? null,
    secondaryOverride: input.secondaryOverride ?? null,
    microCountToday: liveMicros,
    currentStreak: input.currentStreak ?? prog?.currentStreak ?? 0,
  });
  return {
    ...rewards,
    previewNote: rewards.capped ? "Daily micro-quest cap applies — full rewards resume tomorrow." : null,
  };
}

/** Suggested attribute mapping for an activity (FE §7: Suggested Mapping step). */
export function suggestMapping(activityKey?: string | null, primaryOverride?: string | null, secondaryOverride?: string | null) {
  if (!activityKey) return { primary: primaryOverride ?? "discipline", secondary: secondaryOverride ?? "focus", source: "default" as const };
  const m = ACTIVITY_BY_KEY[activityKey];
  if (!m) throw new BadRequestError(`Unknown activityKey ${activityKey}`);
  return {
    primary: primaryOverride ?? m.primary,
    secondary: secondaryOverride ?? m.secondary,
    source: primaryOverride || secondaryOverride ? ("override" as const) : ("suggested" as const),
    activity: { key: m.key, name: m.name },
  };
}

/**
 * Today's Quest assembly (MASTER PRD §6, BLUEPRINT §7, PRD v2 §8, LRP-FE-001 §4-§5):
 * Buckets: Pinned + Due Today + Routine + Campaign + Optional Spark. Max 5-7 default.
 * Long-term goals never appear as giant to-dos — only next actionable item.
 * Returns the FE Today screen in ONE call (FE §4/§21 minimal blocking requests):
 * greeting/level/coins + companion + buckets + campaign + attribute snapshot + streak + recent reward.
 */
export async function getToday(userId: string, dateKey = toDayKey(), timeZone?: string | null) {
  await ensureProfile(userId);
  const [pinned, due, routines, campaignNext] = await Promise.all([
    prisma.quest.findMany({ where: { userId, deletedAt: null, isPinned: true, status: { in: ["active", "in_progress", "draft"] } }, take: 7, orderBy: { createdAt: "desc" }, include: { activityType: true } }),
    prisma.quest.findMany({
      where: {
        userId, deletedAt: null, status: { in: ["active", "in_progress", "draft"] },
        OR: [{ scheduledFor: new Date(`${dateKey}T00:00:00.000Z`) }, { dueAt: { gte: new Date(`${dateKey}T00:00:00.000Z`), lt: new Date(`${dateKey}T23:59:59.999Z`) } }],
      },
      take: 7, orderBy: { dueAt: "asc" }, include: { activityType: true },
    }),
    prisma.quest.findMany({ where: { userId, deletedAt: null, questType: "routine", status: { in: ["active", "in_progress"] } }, take: 7, orderBy: { updatedAt: "desc" }, include: { activityType: true } }),
    prisma.quest.findMany({ where: { userId, deletedAt: null, questType: "campaign", status: { in: ["active", "in_progress"] } }, take: 3, orderBy: { createdAt: "asc" }, include: { activityType: true } }),
  ]);

  const seen = new Set<string>();
  const pick: typeof pinned = [];
  for (const bucket of [pinned, due, campaignNext, routines]) {
    for (const quest of bucket) {
      if (seen.has(quest.id)) continue;
      seen.add(quest.id);
      pick.push(quest);
      if (pick.length >= 7) break;
    }
    if (pick.length >= 7) break;
  }

  // Spark: deterministic suggestion — oldest active micro/quick quest not already picked.
  let spark: (typeof pick)[number] | null = null;
  if (pick.length < 7) {
    const candidate = await prisma.quest.findFirst({
      where: { userId, deletedAt: null, status: "active", id: { notIn: [...seen] } },
      orderBy: { createdAt: "asc" },
      include: { activityType: true },
    });
    if (candidate) spark = candidate;
  }

  // Also-on-board fill: active quests with no date at all still belong to
  // Today as an overview — a quest must never exist yet be visible nowhere.
  let unscheduled: (typeof pick)[number][] = [];
  if (pick.length < 7) {
    unscheduled = await prisma.quest.findMany({
      where: {
        userId,
        deletedAt: null,
        status: { in: ["active", "in_progress", "draft"] },
        scheduledFor: null,
        dueAt: null,
        id: { notIn: [...seen] },
      },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      take: 7 - pick.length,
      include: { activityType: true },
    });
    for (const q of unscheduled) {
      if (seen.has(q.id)) continue;
      seen.add(q.id);
      pick.push(q);
    }
  }

  const [profile, progression, campaignSummary, attrRows, recentCompletion, loadout] = await Promise.all([
    prisma.profile.findUnique({ where: { id: userId } }),
    prisma.profileProgression.findUnique({ where: { profileId: userId } }),
    prisma.campaign.findFirst({ where: { userId, status: "active" }, orderBy: { updatedAt: "desc" }, include: { milestones: true } }),
    prisma.profileAttribute.findMany({ where: { profileId: userId }, include: { attribute: true }, orderBy: { xp: "desc" }, take: 3 }),
    prisma.questCompletion.findFirst({ where: { userId }, orderBy: { completedAt: "desc" } }),
    prisma.userLoadout.findUnique({ where: { userId } }),
  ]);
  // Equipped frame + title-box art for the header portrait (Personalize/Store).
  const frameIds = [loadout?.frameItemId, loadout?.titleItemId].filter((v): v is string => !!v);
  const frameItems = frameIds.length ? await prisma.item.findMany({ where: { id: { in: frameIds } }, select: { id: true, assetPath: true } }) : [];
  const frameById = new Map(frameItems.map((i) => [i.id, i.assetPath]));

  const { dailyGreeting, daypart } = require("../../rpg/companion") as typeof import("../../rpg/companion");
  const { rankForXp: rankForXpFn } = require("../../rpg/ranks") as typeof import("../../rpg/ranks");
  const { xpProgressForLevel: xpProg } = require("../../rpg/xpCurve") as typeof import("../../rpg/xpCurve");
  const lifetimeXp = progression?.lifetimeXp ?? 0;
  const campaignPct = campaignSummary && campaignSummary.milestones.length
    ? Math.round((campaignSummary.milestones.filter((m) => (m.status as string) === "done").length / campaignSummary.milestones.length) * 100)
    : 0;

  // Reward previews for every visible quest (FE §6: each card shows its reward).
  const toPreview = [...pick, ...(spark && !pick.find((q) => q.id === spark.id) ? [spark] : [])];
  const previewed = await withRewardPreviews(userId, toPreview);
  const byId = new Map(previewed.map((q) => [q.id, q]));
  const withPv = <T extends { id: string }>(row: T): T & { rewardPreview: ReturnType<typeof resolveRewards> } =>
    (byId.get(row.id) ?? { ...row, rewardPreview: resolveRewards({ difficulty: 3, questType: "quick" }) }) as T & { rewardPreview: ReturnType<typeof resolveRewards> };

  // Recent contribution per attribute (BLUEPRINT §11: "Focus +21 from …").
  const recentCompletions = await prisma.questCompletion.findMany({
    where: { userId },
    orderBy: { completedAt: "desc" },
    take: 20,
    select: { questId: true, primaryAttribute: true, primaryAttributeXp: true, secondaryAttribute: true, secondaryAttributeXp: true },
  });
  const questTitles = new Map(
    (await prisma.quest.findMany({ where: { id: { in: [...new Set(recentCompletions.map((c) => c.questId))] } }, select: { id: true, title: true } })).map((q) => [q.id, q.title]),
  );
  const recentByAttr = new Map<string, { gain: number; questTitle: string }>();
  for (const c of recentCompletions) {
    const title = questTitles.get(c.questId) ?? "a quest";
    for (const [attr, gain] of [[c.primaryAttribute, c.primaryAttributeXp], [c.secondaryAttribute, c.secondaryAttributeXp]] as const) {
      if (attr && gain > 0 && !recentByAttr.has(attr)) recentByAttr.set(attr, { gain, questTitle: title });
    }
  }

  return {
    date: dateKey,
    // FE §4 header
    hero: {
      heroAssetId: profile?.heroAssetId ?? null,
      heroName: profile?.heroName ?? profile?.displayName ?? "hero",
      companionAssetId: profile?.companionAssetId ?? null,
      companionName: (profile as Record<string, unknown> | null | undefined)?.companionName ?? null,
      avatarAssetId: (profile as Record<string, unknown> | null | undefined)?.avatarAssetId ?? null,
      frameAsset: (loadout?.frameItemId && frameById.get(loadout.frameItemId)) || null,
      titleBoxAsset: (loadout?.titleItemId && frameById.get(loadout.titleItemId)) || null,
    },
    greeting: {
      heroName: profile?.heroName ?? profile?.displayName ?? "hero",
      heroLevel: progression?.level ?? 1,
      coins: progression?.coins ?? 0,
      xpProgress: xpProg(lifetimeXp),
      rank: rankForXpFn(lifetimeXp),
      timeOfDay: daypart(new Date(), timeZone),
    },
    companion: {
      mood: "greeting" as const,
      message: dailyGreeting({
        heroName: profile?.heroName ?? undefined,
        questsToday: pick.length,
        streak: progression?.currentStreak ?? 0,
        campaignPct,
        timeOfDay: daypart(new Date(), timeZone),
      }),
    },
    // FE §5 buckets (explicit) + combined list for convenience — all with rewardPreview.
    buckets: {
      pinned: pinned.map(withPv),
      dueToday: due.map(withPv),
      routine: routines.map(withPv),
      campaign: campaignNext.map(withPv),
      unscheduled: unscheduled.map(withPv),
      spark: spark ? withPv(spark) : null,
    },
    quests: pick.map(withPv),
    spark: spark ? withPv(spark) : null,
    progression,
    campaignSummary: campaignSummary ? { ...campaignSummary, progressPct: campaignPct } : null,
    attributeSnapshot: attrRows.map((a) => ({
      key: a.attribute.key,
      name: a.attribute.name,
      xp: a.xp,
      level: a.level,
      recent: recentByAttr.get(a.attribute.key) ?? null,
    })),
    streak: { current: progression?.currentStreak ?? 0, best: progression?.bestStreak ?? 0, momentum: progression?.momentum ?? 0 },
    recentReward: recentCompletion
      ? { questId: recentCompletion.questId, xp: recentCompletion.rewardXp, coins: recentCompletion.rewardCoins, at: recentCompletion.completedAt }
      : null,
    counts: { pinned: pinned.length, due: due.length },
    // FE §17 empty states: backend hints so UI copy stays consistent.
    emptyHints: {
      allClear: pick.length === 0 ? "Your board is clear. Add your first Quest." : null,
      noCampaign: !campaignSummary ? "Choose something worth becoming." : null,
    },
  };
}
