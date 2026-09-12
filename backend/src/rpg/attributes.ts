import type { AttributeKey } from "../shared/validation";

/**
 * Activity archetypes — finite RPG interpretation for unlimited user intent
 * (MASTER PRD §4-§5, BLUEPRINT §13, LRP-BE-001 §6, LRP-RPG-001 §4-§5).
 * User supplies task text; activity_type supplies primary/secondary mapping.
 */

export interface ActivityMapping {
  key: string;
  name: string;
  description: string;
  primary: AttributeKey;
  secondary: AttributeKey;
  primaryRatio: number; // 1.0
  secondaryRatio: number; // 0.35
}

export const SECONDARY_RATIO = 0.35;

export const ACTIVITY_TYPES: ActivityMapping[] = [
  { key: "physical_training", name: "Physical", description: "Strength training, sport, physical practice", primary: "strength", secondary: "vitality", primaryRatio: 1, secondaryRatio: SECONDARY_RATIO },
  { key: "cardio", name: "Cardio", description: "Running, walking, cycling, cardio", primary: "vitality", secondary: "strength", primaryRatio: 1, secondaryRatio: SECONDARY_RATIO },
  { key: "study_learning", name: "Learning", description: "Study, reading, courses, analysis", primary: "intellect", secondary: "focus", primaryRatio: 1, secondaryRatio: SECONDARY_RATIO },
  { key: "coding_building", name: "Building / Coding", description: "Coding, building, shipping", primary: "craft", secondary: "intellect", primaryRatio: 1, secondaryRatio: SECONDARY_RATIO },
  { key: "creative_practice", name: "Creative", description: "Art, writing, music, design practice", primary: "craft", secondary: "focus", primaryRatio: 1, secondaryRatio: SECONDARY_RATIO },
  { key: "deep_work", name: "Focus / Deep Work", description: "Sustained deep work session", primary: "focus", secondary: "discipline", primaryRatio: 1, secondaryRatio: SECONDARY_RATIO },
  { key: "routine_habit", name: "Routine / Habit", description: "Recurring habit execution", primary: "discipline", secondary: "focus", primaryRatio: 1, secondaryRatio: SECONDARY_RATIO },
  { key: "social_collab", name: "Social / Collaboration", description: "Conversation, collaboration, contribution", primary: "connection", secondary: "discipline", primaryRatio: 1, secondaryRatio: SECONDARY_RATIO },
  { key: "life_admin", name: "Life Management", description: "Household, admin, life maintenance", primary: "discipline", secondary: "vitality", primaryRatio: 1, secondaryRatio: SECONDARY_RATIO },
  { key: "exploration", name: "Exploration", description: "New experiences, curiosity, travel", primary: "exploration", secondary: "intellect", primaryRatio: 1, secondaryRatio: SECONDARY_RATIO },
  { key: "recovery", name: "Recovery", description: "Rest, stretch, sleep, recovery", primary: "vitality", secondary: "discipline", primaryRatio: 1, secondaryRatio: SECONDARY_RATIO },
];

export const ACTIVITY_BY_KEY: Record<string, ActivityMapping> = Object.fromEntries(
  ACTIVITY_TYPES.map((a) => [a.key, a]),
);

export const ATTRIBUTE_DEFS: { key: AttributeKey; name: string; description: string }[] = [
  { key: "strength", name: "Strength", description: "Physical capability and resistance." },
  { key: "vitality", name: "Vitality", description: "Movement, recovery and physical well-being." },
  { key: "intellect", name: "Intellect", description: "Learning, analysis, problem-solving." },
  { key: "focus", name: "Focus", description: "Sustained attention and deep work." },
  { key: "discipline", name: "Discipline", description: "Consistency, follow-through and routine execution." },
  { key: "craft", name: "Craft", description: "Making, designing, writing, coding and creative execution." },
  { key: "connection", name: "Connection", description: "Healthy relationships, collaboration and contribution." },
  { key: "exploration", name: "Exploration", description: "Curiosity, experimentation and new experiences." },
];

/** Attribute XP split (LRP-BE-001 §12): primary = reward XP, secondary = floor(primary*0.35). */
export function splitAttributeXp(rewardXp: number, primary: AttributeKey, secondary: AttributeKey) {
  const primaryXp = rewardXp;
  const secondaryXp = Math.floor(rewardXp * SECONDARY_RATIO);
  return { primary, primaryXp, secondary, secondaryXp };
}
