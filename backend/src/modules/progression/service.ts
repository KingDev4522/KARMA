import { prisma } from "../../db";
import { xpProgressForLevel } from "../../rpg/xpCurve";
import { rankForXp } from "../../rpg/ranks";
import { ensureProfile } from "../identity/service";

/** Progression read model — level/rank derived server-side (LRP-BE-001 §11). */
export async function getProgression(userId: string) {
  await ensureProfile(userId);
  const prog = await prisma.profileProgression.findUniqueOrThrow({ where: { profileId: userId } });
  const progress = xpProgressForLevel(prog.lifetimeXp);
  const rank = rankForXp(prog.lifetimeXp);
  const attributes = await prisma.profileAttribute.findMany({
    where: { profileId: userId },
    include: { attribute: true },
    orderBy: { xp: "desc" },
  });
  return { ...prog, xpProgress: progress, rank };
}
