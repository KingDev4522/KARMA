import { Prisma } from "@prisma/client";
import { prisma } from "../../db";

export interface GrantCtx {
  completionId: string;
  questType: string;
  primaryAttr?: string;
  difficulty?: number;
  estimatedMinutes?: number;
  newLevel?: number;
  gapDays?: number | null;
}

/**
 * Title showcase for achievements — each badge also unlocks a title box or
 * frame the hero can wear in Personalize. Earned, never sold: this is how a
 * player "beholds" a title after proving something. Item grants are
 * idempotent (already-owned is skipped, never duplicated).
 */
const ACHIEVEMENT_ITEM_REWARDS: Record<string, string> = {
  first_quest: "title_box_5",
  streak_5: "title_box_6",
  streak_7: "title_box_7",
  level_5: "title_box_8",
  first_milestone: "title_box_9",
  deep_focus_3: "title_box_10",
  polymath: "title_box_11",
  micro_20: "frame_no_5",
  comeback: "frame_no_6",
  craft_50: "frame_no_7",
};

export interface GrantedRewardItem {
  key: string;
  name: string;
  assetPath: string;
}
export async function evaluateAndGrantAchievements(
  tx: Prisma.TransactionClient,
  userId: string,
  ctx: GrantCtx,
): Promise<{ key: string; name: string; rewardCoins: number; rewardItems: GrantedRewardItem[] }[]> {
  const defs = await tx.achievement.findMany();
  const owned = await tx.userAchievement.findMany({ where: { userId } });
  const ownedSet = new Set(owned.map((o) => o.achievementId));
  const byKey = new Map(defs.map((d) => [d.key, d]));

  const toGrant: typeof defs = [];

  const totalCompletions = await tx.questCompletion.count({ where: { userId } });
  const prog = await tx.profileProgression.findUnique({ where: { profileId: userId } });
  const microCount = await tx.questCompletion.count({ where: { userId, baseXp: 10 } });

  const check = (key: string, cond: boolean) => {
    const def = byKey.get(key);
    if (def && cond && !ownedSet.has(def.id)) toGrant.push(def);
  };

  check("first_quest", totalCompletions >= 1);
  check("streak_5", (prog?.bestStreak ?? 0) >= 5 || (prog?.currentStreak ?? 0) >= 5);
  check("streak_7", (prog?.bestStreak ?? 0) >= 7);
  check("level_5", (ctx.newLevel ?? prog?.level ?? 1) >= 5);
  check("micro_20", microCount >= 20);
  check("comeback", (ctx.gapDays ?? 0) >= 7);

  // Polymath: >=5 distinct attributes with xp>0
  const attrs = await tx.profileAttribute.findMany({ where: { profileId: userId } });
  check("polymath", attrs.filter((a) => a.xp > 0).length >= 5);

  // Builder: 50 craft completions
  const craftCount = await tx.questCompletion.count({ where: { userId, primaryAttribute: "craft" } });
  check("craft_50", craftCount >= 50);

  // Deep Diver: three 60+ min focus completions (questType focus + estimated>=60)
  if (ctx.questType === "focus" && (ctx.estimatedMinutes ?? 0) >= 60) {
    const focusLong = await tx.questCompletion.count({
      where: { userId, quest: { questType: "focus", estimatedMinutes: { gte: 60 } } },
    });
    check("deep_focus_3", focusLong >= 3);
  } else {
    // still check in case threshold crossed by earlier completions
    const focusLong = await tx.questCompletion.count({
      where: { userId, quest: { questType: "focus", estimatedMinutes: { gte: 60 } } },
    });
    check("deep_focus_3", focusLong >= 3);
  }

  // Campaigner: any milestone done
  const doneMilestones = await tx.campaignMilestone.count({
    where: { campaign: { userId }, status: "done" },
  });
  check("first_milestone", doneMilestones >= 1);

  const unlocked: { key: string; name: string; rewardCoins: number; rewardItems: GrantedRewardItem[] }[] = [];
  for (const def of toGrant) {
    try {
      await tx.userAchievement.create({ data: { userId, achievementId: def.id } });
      if (def.rewardCoins > 0) {
        await tx.profileProgression.update({ where: { profileId: userId }, data: { coins: { increment: def.rewardCoins } } });
        await tx.rewardLedger.create({
          data: { userId, sourceType: "achievement", sourceId: def.id, currencyType: "coins", amount: def.rewardCoins, metadata: { key: def.key } },
        });
      }
      // Title showcase: the badge's companion title box / frame, if seeded.
      const rewardItems: GrantedRewardItem[] = [];
      const itemKey = ACHIEVEMENT_ITEM_REWARDS[def.key];
      if (itemKey) {
        const item = await tx.item.findUnique({ where: { key: itemKey } });
        if (item && item.active) {
          try {
            await tx.inventory.create({ data: { userId, itemId: item.id, source: "achievement" } });
          } catch {
            // already owned — the title stays, no duplicate
          }
          await tx.rewardLedger.create({
            data: { userId, sourceType: "achievement", sourceId: def.id, currencyType: "title", amount: 1, metadata: { key: def.key, itemKey } },
          }).catch(() => undefined);
          rewardItems.push({ key: item.key, name: item.name, assetPath: item.assetPath });
        }
      }
      ownedSet.add(def.id);
      unlocked.push({ key: def.key, name: def.name, rewardCoins: def.rewardCoins, rewardItems });
    } catch {
      // race: already unlocked — ignore (idempotent)
    }
  }
  return unlocked;
}

export async function listAchievements(userId: string) {
  const [defs, owned] = await Promise.all([
    prisma.achievement.findMany({ orderBy: { name: "asc" } }),
    prisma.userAchievement.findMany({ where: { userId }, include: { achievement: true } }),
  ]);
  const ownedIds = new Set(owned.map((o) => o.achievementId));
  return { all: defs, unlocked: owned, locked: defs.filter((d) => !ownedIds.has(d.id)) };
}
