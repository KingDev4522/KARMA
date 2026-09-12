import { prisma } from "../../db";
import { ATTRIBUTE_KEYS } from "../../shared/validation";

/**
 * Identity domain — Hero + Companion + Profile bootstrap.
 * Onboarding: Enter realm → choose hero → name hero → choose companion → focus → campaign → first quest.
 * (PRD v2 §36). Backend bootstraps progression/attributes/loadout on first sight.
 */

export async function ensureProfile(userId: string) {
  let profile = await prisma.profile.findUnique({
    where: { id: userId },
    include: { progression: true },
  });
  if (profile) return profile;

  const created = await prisma.$transaction(async (tx) => {
    const p = await tx.profile.create({ data: { id: userId } });
    await tx.profileProgression.create({
      data: { profileId: userId, lifetimeXp: 0, seasonXp: 0, level: 1, rankKey: "novice_i", coins: 0, currentStreak: 0, bestStreak: 0, momentum: 0 },
    });
    await tx.userLoadout.create({ data: { userId } });
    const attrs = await tx.attribute.findMany();
    for (const a of attrs) {
      await tx.profileAttribute.upsert({
        where: { profileId_attributeId: { profileId: userId, attributeId: a.id } },
        update: {},
        create: { profileId: userId, attributeId: a.id, xp: 0, level: 1 },
      });
    }
    // Ensure all 8 attribute keys exist even if seed hasn't run (defensive for fresh DB)
    for (const key of ATTRIBUTE_KEYS) {
      const existing = attrs.find((x) => x.key === key);
      if (!existing) {
        const createdAttr = await tx.attribute.create({ data: { key, name: key, description: key } });
        await tx.profileAttribute.upsert({
          where: { profileId_attributeId: { profileId: userId, attributeId: createdAttr.id } },
          update: {},
          create: { profileId: userId, attributeId: createdAttr.id, xp: 0, level: 1 },
        });
      }
    }
    return p;
  });

  return prisma.profile.findUnique({ where: { id: created.id }, include: { progression: true } });
}

export async function getFullProfile(userId: string) {
  await ensureProfile(userId);
  const [profile, progression, attributes, loadout] = await Promise.all([
    prisma.profile.findUniqueOrThrow({ where: { id: userId } }),
    prisma.profileProgression.findUnique({ where: { profileId: userId } }),
    prisma.profileAttribute.findMany({ where: { profileId: userId }, include: { attribute: true } }),
    prisma.userLoadout.findUnique({ where: { userId } }),
  ]);
  return { profile, progression, attributes, loadout };
}

export async function updateIdentity(
  userId: string,
  data: { displayName?: string; heroName?: string; bio?: string; heroAssetId?: string; companionAssetId?: string; lifeDomains?: string[]; reducedMotion?: boolean; theme?: string | null; notifyQuest?: boolean; notifyStreak?: boolean; notifyCelebrate?: boolean },
) {
  await ensureProfile(userId);
  return prisma.profile.update({
    where: { id: userId },
    data: {
      displayName: data.displayName?.trim(),
      heroName: data.heroName?.trim(),
      bio: data.bio,
      heroAssetId: data.heroAssetId,
      companionAssetId: data.companionAssetId,
      lifeDomains: data.lifeDomains,
      reducedMotion: data.reducedMotion,
      theme: data.theme === null ? null : data.theme,
      notifyQuest: data.notifyQuest,
      notifyStreak: data.notifyStreak,
      notifyCelebrate: data.notifyCelebrate,
    },
  });
}

/**
 * Account deletion (PRD v2 §45: users own their data, incl. leaving).
 * Removes every app-owned row transactionally; historical integrity no longer
 * applies once the owner asks to be forgotten. Also attempts the Supabase Auth
 * user deletion when a service-role key is configured (best-effort, reported).
 */
export async function deleteAccount(userId: string): Promise<{ deleted: boolean; authDeleted: boolean }> {
  await prisma.$transaction(async (tx) => {
    const questIds = (await tx.quest.findMany({ where: { userId }, select: { id: true } })).map((q) => q.id);
    if (questIds.length > 0) {
      await tx.questCompletion.deleteMany({ where: { questId: { in: questIds } } });
      await tx.questInstance.deleteMany({ where: { questId: { in: questIds } } });
    }
    await tx.focusSession.deleteMany({ where: { userId } });
    await tx.quest.deleteMany({ where: { userId } });
    const campaignIds = (await tx.campaign.findMany({ where: { userId }, select: { id: true } })).map((c) => c.id);
    if (campaignIds.length > 0) {
      await tx.campaignMilestone.deleteMany({ where: { campaignId: { in: campaignIds } } });
    }
    await tx.campaign.deleteMany({ where: { userId } });
    await tx.rewardLedger.deleteMany({ where: { userId } });
    await tx.inventory.deleteMany({ where: { userId } });
    await tx.userAchievement.deleteMany({ where: { userId } });
    await tx.restDay.deleteMany({ where: { userId } });
    await tx.userLoadout.deleteMany({ where: { userId } });
    await tx.profileAttribute.deleteMany({ where: { profileId: userId } });
    await tx.profileProgression.deleteMany({ where: { profileId: userId } });
    await tx.profile.deleteMany({ where: { id: userId } });
  });

  // Best-effort removal of the Supabase Auth identity itself.
  let authDeleted = false;
  const { config } = await import("../../config");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (serviceKey && config.supabaseUrl) {
    try {
      const res = await fetch(`${config.supabaseUrl.replace(/\/$/, "")}/auth/v1/admin/users/${userId}`, {
        method: "DELETE",
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      });
      authDeleted = res.ok;
    } catch {
      authDeleted = false;
    }
  }
  return { deleted: true, authDeleted };
}
