import { prisma } from "../../db";
import { ForbiddenError, NotFoundError } from "../../shared/errors";
import { ensureProfile } from "../identity/service";

/**
 * Campaigns — long-term goals decomposed into milestones → actionable quests (MASTER PRD §9).
 * Progress derived from milestone/quest state; browser cannot set progress directly (LRP-BE-001 §14).
 */

export async function createCampaign(userId: string, input: { title: string; description?: string; targetDate?: string }) {
  await ensureProfile(userId);
  return prisma.campaign.create({
    data: { userId, title: input.title.trim(), description: input.description, targetDate: input.targetDate ? new Date(`${input.targetDate}T00:00:00.000Z`) : undefined },
  });
}

export async function listCampaigns(userId: string) {
  return prisma.campaign.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, include: { milestones: { orderBy: { orderIndex: "asc" } } } });
}

async function ownedCampaign(userId: string, id: string) {
  const c = await prisma.campaign.findUnique({ where: { id }, include: { milestones: { orderBy: { orderIndex: "asc" } } } });
  if (!c || c.userId !== userId) throw new NotFoundError("Campaign not found");
  return c;
}

export async function getCampaign(userId: string, id: string) {
  const c = await ownedCampaign(userId, id);
  const quests = await prisma.quest.findMany({
    where: { campaignId: id, deletedAt: null },
    include: { activityType: true },
    orderBy: { createdAt: "asc" },
  });
  const progressPct = deriveProgress(c.milestones as never, quests as never);
  // LRP-FE-001 §8: user must always know the next actionable milestone + quest.
  const nextMilestone = (c.milestones as { status: string }[]).find((m) => m.status === "todo" || m.status === "in_progress") ?? null;
  const nextQuest = quests.find((q) => (q.status as string) === "active" || (q.status as string) === "in_progress" || (q.status as string) === "draft")
    ?? null;
  return { ...c, progressPct, questCount: quests.length, nextMilestone, nextQuest };
}

export async function updateCampaign(userId: string, id: string, patch: { title?: string; description?: string; targetDate?: string | null; status?: never }) {
  await ownedCampaign(userId, id);
  return prisma.campaign.update({
    where: { id },
    data: {
      title: patch.title?.trim(),
      description: patch.description,
      targetDate: patch.targetDate === null ? null : patch.targetDate ? new Date(`${patch.targetDate}T00:00:00.000Z`) : undefined,
      status: patch.status,
    },
  });
}

export async function deleteCampaign(userId: string, id: string) {
  await ownedCampaign(userId, id);
  // Archive; quests unlinked? Keep quests but detach campaign to preserve history.
  await prisma.quest.updateMany({ where: { campaignId: id }, data: { campaignId: null } });
  return prisma.campaign.update({ where: { id }, data: { status: "archived" } });
}

export async function createMilestone(userId: string, campaignId: string, input: { title: string; description?: string; orderIndex?: number; targetDate?: string }) {
  const c = await ownedCampaign(userId, campaignId);
  if (!c) throw new ForbiddenError("Not owned");
  const count = await prisma.campaignMilestone.count({ where: { campaignId } });
  return prisma.campaignMilestone.create({
    data: {
      campaignId,
      title: input.title.trim(),
      description: input.description,
      orderIndex: input.orderIndex ?? count,
      targetDate: input.targetDate ? new Date(`${input.targetDate}T00:00:00.000Z`) : undefined,
    },
  });
}

export async function updateMilestone(userId: string, milestoneId: string, patch: { title?: string; description?: string; targetDate?: string | null; status?: never; orderIndex?: number }) {
  const m = await prisma.campaignMilestone.findUnique({ where: { id: milestoneId }, include: { campaign: true } });
  if (!m || m.campaign.userId !== userId) throw new NotFoundError("Milestone not found");
  return prisma.campaignMilestone.update({
    where: { id: milestoneId },
    data: {
      title: patch.title?.trim(),
      description: patch.description,
      targetDate: patch.targetDate === null ? null : patch.targetDate ? new Date(`${patch.targetDate}T00:00:00.000Z`) : undefined,
      status: patch.status,
      orderIndex: patch.orderIndex,
    },
  });
}

function deriveProgress(milestones: { status: string }[], quests: { status: string }[]): number {
  if (milestones.length > 0) {
    const done = milestones.filter((m) => m.status === "done").length;
    return Math.round((done / milestones.length) * 100);
  }
  if (quests.length > 0) {
    const done = quests.filter((m) => m.status === "completed").length;
    return Math.round((done / quests.length) * 100);
  }
  return 0;
}
