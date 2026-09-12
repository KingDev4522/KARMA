import { prisma } from "../../db";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../shared/errors";
import { ensureProfile } from "../identity/service";

/**
 * Routines — recurrence definition → dated instances (LRP-BE-001 §15).
 * A routine is a Quest with questType=routine + recurrenceRule.
 * Backend creates individual dated instances; historical instances immutable.
 */

export interface RecurrenceRule {
  freq: "daily" | "weekly" | "custom";
  days?: number[]; // 0=Sun..6=Sat for weekly/custom
  time?: string;
}

export async function generateRoutineInstances(userId: string, questId: string, from: string, to: string) {
  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  if (!quest || quest.userId !== userId) throw new NotFoundError("Routine quest not found");
  if ((quest.questType as string) !== "routine") throw new BadRequestError("Quest is not a routine");
  const rule = quest.recurrenceRule as unknown as RecurrenceRule | null;
  if (!rule?.freq) throw new BadRequestError("Routine missing recurrenceRule");

  const dates = enumerateDates(from, to, rule);
  const created: { id: string; occurrenceDate: Date }[] = [];
  for (const d of dates) {
    const occurrenceDate = new Date(`${d}T00:00:00.000Z`);
    const inst = await prisma.questInstance.upsert({
      where: { questId_occurrenceDate: { questId, occurrenceDate } },
      update: {},
      create: { questId, occurrenceDate, status: "active" },
    });
    created.push({ id: inst.id, occurrenceDate });
  }
  return created;
}

export function enumerateDates(from: string, to: string, rule: RecurrenceRule): string[] {
  const out: string[] = [];
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) throw new BadRequestError("Invalid date range");
  // cap generation window to 62 days to avoid abuse
  const maxDays = 62;
  let days = 0;
  for (let d = new Date(start); d <= end && days < maxDays; d.setUTCDate(d.getUTCDate() + 1), days++) {
    const dow = d.getUTCDay();
    const key = d.toISOString().slice(0, 10);
    if (rule.freq === "daily") out.push(key);
    else if (rule.freq === "weekly" || rule.freq === "custom") {
      if (!rule.days || rule.days.includes(dow)) out.push(key);
    }
  }
  return out;
}

export async function listRoutineInstances(userId: string, questId: string) {
  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  if (!quest || quest.userId !== userId) throw new ForbiddenError("Not found or not owned");
  return prisma.questInstance.findMany({ where: { questId }, orderBy: { occurrenceDate: "asc" }, take: 100 });
}
