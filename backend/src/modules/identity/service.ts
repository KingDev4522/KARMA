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
  data: { displayName?: string; heroName?: string; bio?: string; heroAssetId?: string; companionAssetId?: string; lifeDomains?: string[]; reducedMotion?: boolean; theme?: string | null },
) {
  await ensureProfile(userId);
  return prisma.profile.update({
    where: { id: userId },
    data: {
      displayName: data.displayName,
      heroName: data.heroName,
      bio: data.bio,
      heroAssetId: data.heroAssetId,
      companionAssetId: data.companionAssetId,
      lifeDomains: data.lifeDomains,
      reducedMotion: data.reducedMotion,
      theme: data.theme === null ? null : data.theme,
    },
  });
}
