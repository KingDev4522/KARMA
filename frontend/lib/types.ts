/** Shared frontend types mirroring the backend contract (docs/API.md). */

export type QuestType = "quick" | "focus" | "routine" | "campaign" | "challenge" | "recovery";
export type QuestStatus = "draft" | "active" | "in_progress" | "completed" | "skipped" | "archived";

export interface RewardPreview {
  baseXp: number;
  baseCoins: number;
  rewardXp: number;
  rewardCoins: number;
  capped: boolean;
  capReason?: string | null;
  primaryAttr: string;
  secondaryAttr: string;
  primaryXp: number;
  secondaryXp: number;
  streakBonusCoins: number;
  difficulty: number;
  previewNote?: string | null;
}

export interface Quest {
  id: string;
  title: string;
  description?: string | null;
  questType: QuestType;
  difficulty: number;
  estimatedMinutes?: number | null;
  scheduledFor?: string | null;
  dueAt?: string | null;
  status: QuestStatus;
  campaignId?: string | null;
  milestoneId?: string | null;
  isPinned: boolean;
  recurrenceRule?: { freq: "daily" | "weekly" | "custom"; days?: number[]; time?: string } | null;
  primaryOverride?: string | null;
  secondaryOverride?: string | null;
  activityType?: { key: string; name: string } | null;
  rewardPreview?: RewardPreview;
}

export interface TodayResponse {
  date: string;
  hero?: { heroAssetId?: string | null; heroName?: string; companionAssetId?: string | null; companionName?: string | null; avatarAssetId?: string | null; frameAsset?: string | null; titleBoxAsset?: string | null } | null;
  greeting: {
    heroName: string;
    heroLevel: number;
    coins: number;
    xpProgress: { level: number; intoLevel: number; neededForNext: number; pct: number };
    rank: { rankKey: string; display: string };
    timeOfDay: string;
  };
  companion: { mood: string; message: string };
  buckets: { pinned: Quest[]; dueToday: Quest[]; routine: Quest[]; campaign: Quest[]; unscheduled?: Quest[]; spark: Quest | null };
  quests: Quest[];
  spark: Quest | null;
  progression: { level: number; coins: number; currentStreak: number; bestStreak: number; momentum: number } | null;
  campaignSummary: { id: string; title: string; progressPct: number } | null;
  attributeSnapshot: { key: string; name: string; xp: number; level: number; recent: { gain: number; questTitle: string } | null }[];
  streak: { current: number; best: number; momentum: number };
  recentReward: { questId: string; xp: number; coins: number; at: string } | null;
  counts: { pinned: number; due: number };
  emptyHints: { allClear: string | null; noCampaign: string | null };
}

export interface CompletionResponse {
  deduped: boolean;
  rewardXp: number;
  rewardCoins: number;
  primaryAttr: string;
  primaryXp: number;
  secondaryAttr: string;
  secondaryXp: number;
  newLevel: number;
  leveledUp: boolean;
  levelsGained: number;
  newRankKey: string;
  newRankDisplay: string;
  rankUp: { from: string; to: string; bonusCoins: number } | null;
  currentStreak: number;
  bestStreak: number;
  momentum: number;
  unlockedAchievements: { key: string; name: string; rewardCoins: number; rewardItems?: { key: string; name: string; assetPath: string }[] }[];
  campaignProgress: { campaignId: string; progressPct: number } | null;
  capped: boolean;
  choreography: { step: string; label: string }[];
  companion: { mood: string; message: string; companionAssetId?: string | null; companionName?: string | null; heroName?: string | null };
}

export interface AbandonResponse {
  questId: string;
  status: "skipped";
  penaltyXp: number;
  requestedPenalty: number;
  newLifetimeXp: number;
  level: number;
  rankDisplay: string;
  companion: { mood: string; message: string };
}

export interface Notice {
  key: string;
  kind: "quest" | "streak" | "celebration" | "rest" | "info";
  title: string;
  body: string;
}

export interface CalendarFeed {
  from: string;
  to: string;
  quests: { kind: "quest"; id: string; title: string; questType: string; status: string; scheduledFor: string | null; dueAt: string | null }[];
  instances: { kind: "routine_instance"; id: string; questId: string; questTitle: string; date: string; status: string }[];
  milestones: { kind: "milestone"; id: string; title: string; status: string; date: string | null; campaignId: string; campaignTitle: string }[];
  focusSessions: { kind: "focus"; id: string; questId: string | null; startedAt: string }[];
}

export interface Campaign {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  targetDate?: string | null;
  progressPct?: number;
  questCount?: number;
  nextMilestone?: { id: string; title: string; status: string } | null;
  nextQuest?: Quest | null;
  milestones?: { id: string; title: string; status: string; orderIndex: number }[];
}

export interface StoreItem {
  id: string;
  itemType: string;
  key: string;
  name: string;
  description: string;
  assetPath: string;
  preview: string;
  price: number;
  rarity: string;
  owned: boolean;
  equipped: boolean;
  status: "equipped" | "owned" | "available" | "locked";
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  retryable: boolean;
}
