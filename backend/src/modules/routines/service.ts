import { prisma } from "../../db";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../shared/errors";
import { ensureProfile } from "../identity/service";

/**
 * Routines — recurrence definition → dated instances (LRP-BE-001 §15).
 * A routine is a Quest with questType=routine + recurrenceRule.
 * Backend creates individual dated instances; historical instances immutable.
 */

export interface RecurrenceEnds {
  type: "never" | "on" | "after";
  /** Inclusive last date (YYYY-MM-DD) when type === "on". */
  date?: string;
  /** Max occurrences when type === "after" (1–100). */
  count?: number;
}

export interface RecurrenceRule {
  freq: "daily" | "weekly" | "custom";
  days?: number[]; // 0=Sun..6=Sat for weekly/custom
  time?: string;
  /** Step size for custom rules (1–30). Defaults to 1. */
  every?: number;
  /** Step unit for custom rules. Defaults to "day". */
  unit?: "day" | "week";
  /** End condition for custom rules. Defaults to never-ending. */
  ends?: RecurrenceEnds;
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

function normalizeRule(rule: RecurrenceRule): RecurrenceRule & { every: number; unit: "day" | "week"; ends: RecurrenceEnds } {
  const freq = rule.freq;
  if (freq !== "daily" && freq !== "weekly" && freq !== "custom") {
    throw new BadRequestError("Unknown recurrence frequency");
  }
  const every = Math.min(30, Math.max(1, Math.floor(rule.every ?? 1)));
  if (!Number.isFinite(every)) throw new BadRequestError("Invalid recurrence interval");
  const unit = rule.unit === "week" ? "week" : "day";
  const days = Array.isArray(rule.days) ? [...new Set(rule.days)].filter((n) => Number.isInteger(n) && n >= 0 && n <= 6).sort((a, b) => a - b) : undefined;
  if ((freq === "weekly" || (freq === "custom" && unit === "week")) && days !== undefined && days.length === 0) {
    throw new BadRequestError("Pick at least one weekday for a weekly repeat");
  }
  const ends = rule.ends ?? { type: "never" as const };
  if (ends.type !== "never" && ends.type !== "on" && ends.type !== "after") {
    throw new BadRequestError("Unknown recurrence end");
  }
  if (ends.type === "on") {
    if (!ends.date || !/^\d{4}-\d{2}-\d{2}$/.test(ends.date) || isNaN(new Date(`${ends.date}T00:00:00.000Z`).getTime())) {
      throw new BadRequestError("End date must be YYYY-MM-DD");
    }
  }
  if (ends.type === "after") {
    const count = Math.floor(ends.count ?? 0);
    if (!Number.isFinite(count) || count < 1 || count > 100) throw new BadRequestError("Occurrence count must be 1–100");
    ends.count = count;
  }
  return { ...rule, freq, every, unit, days, ends };
}

export function enumerateDates(from: string, to: string, rule: RecurrenceRule): string[] {
  const out: string[] = [];
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) throw new BadRequestError("Invalid date range");
  const r = normalizeRule(rule);
  const endCap = r.ends.type === "on" ? new Date(`${r.ends.date}T00:00:00.000Z`) : end;
  const capCount = r.ends.type === "after" ? (r.ends.count as number) : Number.POSITIVE_INFINITY;
  // Anchor intervals at the window start so "every N" is stable per generation call.
  const anchor = start.getTime();
  // cap generation window to 62 days to avoid abuse
  const maxDays = 62;
  let days = 0;
  for (let d = new Date(start); d <= end && d <= endCap && days < maxDays && out.length < capCount; d.setUTCDate(d.getUTCDate() + 1), days++) {
    const key = d.toISOString().slice(0, 10);
    if (r.freq === "daily") {
      out.push(key);
      continue;
    }
    if (r.freq === "custom" && r.unit === "day") {
      const elapsed = Math.floor((d.getTime() - anchor) / 86_400_000);
      if (elapsed % (r.every as number) === 0) out.push(key);
      continue;
    }
    // weekly or custom-weekly: weekday filter + week stepping
    const weekIndex = Math.floor((d.getTime() - anchor) / (7 * 86_400_000));
    if (weekIndex % (r.freq === "custom" ? (r.every as number) : 1) !== 0) continue;
    const dow = d.getUTCDay();
    if (!r.days || r.days.includes(dow)) out.push(key);
  }
  return out;
}

export async function listRoutineInstances(userId: string, questId: string) {
  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  if (!quest || quest.userId !== userId) throw new ForbiddenError("Not found or not owned");
  return prisma.questInstance.findMany({ where: { questId }, orderBy: { occurrenceDate: "asc" }, take: 100 });
}
