/**
 * Deterministic companion engine — no AI service (MASTER PRD §11, PRD v2 §23-§24, BLUEPRINT §19-§20).
 * Aligned with FRONTEND UX PRD LRP-FE-001 §11 companion states:
 * Idle | Greeting | Encouraging | Celebrating | Focused | Resting.
 * Event matrix: app_open, first_quest, quest_complete, level_up, achievement, campaign_milestone,
 * missed_task, return_after_absence, store_purchase, rest_day, focus_started.
 * Dialogue is short (1-2 sentences), contextual, sparse.
 */

export type CompanionEvent =
  | "app_open"
  | "first_quest"
  | "quest_complete"
  | "level_up"
  | "achievement"
  | "campaign_milestone"
  | "missed_task"
  | "return_after_absence"
  | "store_purchase"
  | "rest_day"
  | "focus_started";

/** FE-canonical mood set. `curious` kept as deprecated alias of `focused` for backwards compat. */
export type CompanionMood =
  | "idle"
  | "greeting"
  | "encouraging"
  | "celebrating"
  | "focused"
  | "resting"
  | "curious";

export interface CompanionContext {
  heroName?: string;
  questsToday?: number;
  streak?: number;
  campaignPct?: number;
  level?: number;
  achievementName?: string;
  daysAbsent?: number;
  timeOfDay?: "morning" | "afternoon" | "evening" | "night";
}

const pick = (arr: string[], seed = 0) => arr[Math.abs(seed) % arr.length];

export function companionMoodFor(event: CompanionEvent): CompanionMood {
  switch (event) {
    case "app_open":
    case "return_after_absence":
      return "greeting";
    case "quest_complete":
    case "level_up":
    case "achievement":
    case "campaign_milestone":
    case "store_purchase":
      return "celebrating";
    case "first_quest":
    case "missed_task":
      return "encouraging";
    case "focus_started":
      return "focused";
    case "rest_day":
      return "resting";
    default:
      return "idle";
  }
}

export function companionMessage(event: CompanionEvent, ctx: CompanionContext = {}, seed = 0): string {
  const hero = ctx.heroName?.trim() ? ctx.heroName!.trim() : "hero";
  switch (event) {
    case "app_open": {
      const tod = ctx.timeOfDay ?? daypart();
      const greet = tod === "morning" ? "Good morning" : tod === "afternoon" ? "Good afternoon" : tod === "evening" ? "Good evening" : "Still up";
      const quests = ctx.questsToday ?? 0;
      if (quests > 0) return `${greet}, ${hero}. ${quests} quest${quests === 1 ? "" : "s"} waiting. Pick the first one.`;
      return `${greet}, ${hero}. Your progress is still here. Let's pick up where we left off.`;
    }
    case "first_quest":
      return "First quest taken. Small steps count — this one matters.";
    case "quest_complete":
      return pick(
        ["Quest cleared. That one mattered.", "Quest cleared. Nice work.", "Done. That counted.", "You're getting stronger."],
        seed,
      );
    case "level_up":
      return `That wasn't just another task, ${hero}. You just reached level ${ctx.level ?? "up"}.`;
    case "achievement":
      return ctx.achievementName ? `Badge earned — ${ctx.achievementName}. Well earned.` : "Badge earned. Well earned.";
    case "campaign_milestone":
      return "Milestone reached. The campaign map just moved.";
    case "missed_task":
      return "Missed one? No guilt. Reschedule it and keep moving.";
    case "return_after_absence": {
      const d = ctx.daysAbsent ?? 1;
      return `Welcome back, ${hero}. ${d} day${d === 1 ? "" : "s"} away — your progress is still here.`;
    }
    case "store_purchase":
      return "New look equipped. Looking sharp.";
    case "focus_started":
      return "Focus locked in. One quest, one timer.";
    case "rest_day":
      return "Rest is part of the run. We're not quitting; we're recovering.";
    default:
      return "Onward.";
  }
}

export function daypart(date = new Date()): "morning" | "afternoon" | "evening" | "night" {
  const h = date.getUTCHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 22) return "evening";
  return "night";
}

/** Daily greeting composition — Smart without AI (BLUEPRINT §23): deterministic from state. */
export function dailyGreeting(ctx: CompanionContext): string {
  const parts: string[] = [];
  parts.push(companionMessage("app_open", ctx));
  if ((ctx.streak ?? 0) >= 6) parts.push(`One day away from a ${ctx.streak! + 1}-day consistency mark.`);
  if ((ctx.campaignPct ?? 0) > 0) parts.push(`Campaign at ${ctx.campaignPct}%.`);
  return parts.join(" ");
}
