import { prisma } from "../../db";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../shared/errors";
import { ensureProfile } from "../identity/service";

/**
 * Focus — Quest → Focus timer → Pause/Resume → Finish → Quest Completion → Reward
 * (MASTER PRD §8, LRP-FE-001 §9 Focus UX: Quest, Timer, Pause/Resume, Finish → reward sequence).
 * Backend stores planned/actual/start/finish/linked Quest; browser displays countdown (LRP-BE-001 §16).
 * The client completes the linked quest right after a completed finish (idempotent —
 * key `focus-<sessionId>`), so rewards stay server-authoritative while the chain is one tap.
 */

export async function startSession(userId: string, input: { questId?: string; plannedSeconds: number }) {
  await ensureProfile(userId);
  if (input.questId) {
    const q = await prisma.quest.findUnique({ where: { id: input.questId } });
    if (!q || q.userId !== userId || q.deletedAt) throw new NotFoundError("Quest not found");
    await prisma.quest.update({ where: { id: input.questId }, data: { status: "in_progress" } }).catch(() => undefined);
  }
  const existing = await prisma.focusSession.findFirst({ where: { userId, status: { in: ["running", "paused"] } } });
  if (existing) throw new BadRequestError("A focus session is already running. Finish or cancel it first.");
  return prisma.focusSession.create({
    data: { userId, questId: input.questId, plannedSeconds: input.plannedSeconds, status: "running" },
  });
}

export async function pauseSession(userId: string, id: string) {
  const s = await prisma.focusSession.findUnique({ where: { id } });
  if (!s || s.userId !== userId) throw new NotFoundError("Focus session not found");
  if (s.status !== "running") throw new BadRequestError("Only a running session can be paused");
  return prisma.focusSession.update({ where: { id }, data: { status: "paused" } });
}

export async function resumeSession(userId: string, id: string) {
  const s = await prisma.focusSession.findUnique({ where: { id } });
  if (!s || s.userId !== userId) throw new NotFoundError("Focus session not found");
  if (s.status !== "paused") throw new BadRequestError("Only a paused session can be resumed");
  const other = await prisma.focusSession.findFirst({ where: { userId, status: "running", id: { not: id } } });
  if (other) throw new BadRequestError("Another focus session is already running");
  return prisma.focusSession.update({ where: { id }, data: { status: "running" } });
}

export async function finishSession(userId: string, id: string, input: { status: "completed" | "cancelled"; actualSeconds?: number }) {
  const s = await prisma.focusSession.findUnique({ where: { id } });
  if (!s || s.userId !== userId) throw new NotFoundError("Focus session not found");
  if (s.status !== "running" && s.status !== "paused") throw new BadRequestError("Session is not running");
  const endedAt = new Date();
  const actual = input.actualSeconds ?? Math.max(0, Math.round((endedAt.getTime() - s.startedAt.getTime()) / 1000));
  const updated = await prisma.focusSession.update({
    where: { id },
    data: { endedAt, actualSeconds: actual, status: input.status },
  });
  if (s.questId && input.status === "completed") {
    // Leave quest completion to explicit POST /quests/:id/complete (reward integrity).
    await prisma.quest.update({ where: { id: s.questId }, data: { status: "in_progress" } }).catch(() => undefined);
  }
  // Early cancel on a linked quest stings a little (-5 XP under 5 real minutes);
  // a long session stopped late costs nothing — the effort already happened.
  let penaltyXp = 0;
  if (s.questId && input.status === "cancelled") {
    const { focusCancelPenalty, applyPenaltyToLifetime } = await import("../../rpg/penalties");
    const requested = focusCancelPenalty(actual);
    if (requested > 0) {
      const prog = await prisma.profileProgression.findUnique({ where: { profileId: userId } });
      if (prog) {
        const { newLifetime, applied } = applyPenaltyToLifetime(prog.lifetimeXp, prog.level, requested);
        if (applied > 0) {
          await prisma.profileProgression.update({ where: { profileId: userId }, data: { lifetimeXp: newLifetime } });
          await prisma.rewardLedger.create({
            data: { userId, sourceType: "abandon", sourceId: s.id, currencyType: "xp", amount: -applied, metadata: { questId: s.questId, kind: "focus_early_cancel", actualSeconds: actual } },
          });
        }
        penaltyXp = applied;
      }
    }
  }
  return { ...updated, penaltyXp };
}

export async function listSessions(userId: string, limit = 20) {
  if (limit > 100) throw new ForbiddenError("limit too large");
  return prisma.focusSession.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: limit,
    include: { quest: { select: { id: true, title: true, status: true } } },
  });
}
