"use client";

/**
 * Typed API client for the LIFE RPG backend. Every function maps 1:1 to a
 * backend route (see backend/docs/API.md). All errors surface as ApiErrorShape
 * with `retryable` so the UI can offer [Try Again] (LRP-FE-001 §18).
 */
import type { ApiError, Campaign, CompletionResponse, Quest, StoreItem, TodayResponse } from "./types";

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

export interface ApiErrorShape extends Error {
  status: number;
  body: ApiError;
}

export async function api<T>(path: string, opts: RequestInit & { headers?: Record<string, string> } = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) },
  });
  if (!res.ok) {
    let body: ApiError;
    try {
      const j = (await res.json()) as { error?: ApiError };
      body = j.error ?? { code: "UNKNOWN", message: `Request failed (${res.status})`, retryable: res.status >= 500 };
    } catch {
      body = { code: "UNKNOWN", message: `Request failed (${res.status})`, retryable: res.status >= 500 };
    }
    const err = new Error(body.message) as ApiErrorShape;
    err.status = res.status;
    err.body = body;
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export type H = Record<string, string>;

/** Route map — mirrors backend/src/routes. Used by the contract test. */
export const ROUTES = {
  health: "GET /health",
  getProfile: "GET /api/v1/profile/me",
  patchProfile: "PATCH /api/v1/profile/me",
  getProgression: "GET /api/v1/profile/me/progression",
  getToday: "GET /api/v1/quests/today",
  listQuests: "GET /api/v1/quests",
  createQuest: "POST /api/v1/quests",
  previewQuest: "POST /api/v1/quests/preview",
  suggestMapping: "GET /api/v1/quests/suggest-mapping",
  getQuest: "GET /api/v1/quests/:id",
  patchQuest: "PATCH /api/v1/quests/:id",
  deleteQuest: "DELETE /api/v1/quests/:id",
  completeQuest: "POST /api/v1/quests/:id/complete",
  genInstances: "POST /api/v1/quests/:id/generate-instances",
  listInstances: "GET /api/v1/quests/:id/instances",
  activityTypes: "GET /api/v1/quests/meta/activity-types",
  listCampaigns: "GET /api/v1/campaigns",
  createCampaign: "POST /api/v1/campaigns",
  getCampaign: "GET /api/v1/campaigns/:id",
  patchCampaign: "PATCH /api/v1/campaigns/:id",
  deleteCampaign: "DELETE /api/v1/campaigns/:id",
  createMilestone: "POST /api/v1/campaigns/:id/milestones",
  patchMilestone: "PATCH /api/v1/campaigns/milestones/:mid",
  deleteMilestone: "DELETE /api/v1/campaigns/milestones/:mid",
  listFocus: "GET /api/v1/focus",
  startFocus: "POST /api/v1/focus/start",
  finishFocus: "POST /api/v1/focus/:id/finish",
  pauseFocus: "POST /api/v1/focus/:id/pause",
  resumeFocus: "POST /api/v1/focus/:id/resume",
  wallet: "GET /api/v1/wallet",
  store: "GET /api/v1/store",
  purchase: "POST /api/v1/store/purchase",
  inventory: "GET /api/v1/inventory",
  equip: "POST /api/v1/inventory/equip",
  unequip: "POST /api/v1/inventory/unequip",
  achievements: "GET /api/v1/achievements",
  companion: "GET /api/v1/companion",
  history: "GET /api/v1/chronicle/history",
  analytics: "GET /api/v1/chronicle/analytics",
  debrief: "GET /api/v1/chronicle/debrief",
  heroCard: "GET /api/v1/hero-card",
  realm: "GET /api/v1/realm",
  restDays: "GET /api/v1/rest-days",
  createRestDay: "POST /api/v1/rest-days",
  starters: "GET /api/v1/starters",
} as const;

export const client = {
  getToday: (h: H, date?: string, tz?: string) => {
    const q = new URLSearchParams();
    if (date) q.set("date", date);
    if (tz) q.set("tz", tz);
    const qs = q.toString();
    return api<TodayResponse>(`/api/v1/quests/today${qs ? `?${qs}` : ""}`, { headers: h });
  },
  listQuests: (h: H, qs = "status=active,in_progress,draft&preview=true&limit=50") =>
    api<Quest[]>(`/api/v1/quests?${qs}`, { headers: h }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createQuest: (h: H, body: any) => api<Quest>(`/api/v1/quests`, { method: "POST", headers: h, body: JSON.stringify(body) }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  previewQuest: (h: H, body: any) => api<import("./types").RewardPreview>(`/api/v1/quests/preview`, { method: "POST", headers: h, body: JSON.stringify(body) }),
  suggestMapping: (h: H, activityKey: string) =>
    api<{ primary: string; secondary: string; source: string }>(`/api/v1/quests/suggest-mapping?activityKey=${encodeURIComponent(activityKey)}`, { headers: h }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patchQuest: (h: H, id: string, body: any) => api<Quest>(`/api/v1/quests/${id}`, { method: "PATCH", headers: h, body: JSON.stringify(body) }),
  deleteQuest: (h: H, id: string) => api<unknown>(`/api/v1/quests/${id}`, { method: "DELETE", headers: h }),
  completeQuest: (h: H, id: string, idempotencyKey: string, opts?: { instanceId?: string }) =>
    api<CompletionResponse>(`/api/v1/quests/${id}/complete`, { method: "POST", headers: h, body: JSON.stringify({ idempotencyKey, ...(opts?.instanceId ? { instanceId: opts.instanceId } : {}) }) }),
  activityTypes: (h: H) => api<{ key: string; name: string }[]>(`/api/v1/quests/meta/activity-types`, { headers: h }),
  listCampaigns: (h: H) => api<Campaign[]>(`/api/v1/campaigns`, { headers: h }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createCampaign: (h: H, body: any) => api<Campaign>(`/api/v1/campaigns`, { method: "POST", headers: h, body: JSON.stringify(body) }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patchCampaign: (h: H, id: string, body: any) => api<Campaign>(`/api/v1/campaigns/${id}`, { method: "PATCH", headers: h, body: JSON.stringify(body) }),
  deleteCampaign: (h: H, id: string) => api<unknown>(`/api/v1/campaigns/${id}`, { method: "DELETE", headers: h }),
  getCampaign: (h: H, id: string) => api<Campaign>(`/api/v1/campaigns/${id}`, { headers: h }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createMilestone: (h: H, id: string, body: any) => api<unknown>(`/api/v1/campaigns/${id}/milestones`, { method: "POST", headers: h, body: JSON.stringify(body) }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patchMilestone: (h: H, mid: string, body: any) => api<unknown>(`/api/v1/campaigns/milestones/${mid}`, { method: "PATCH", headers: h, body: JSON.stringify(body) }),
  deleteMilestone: (h: H, mid: string) => api<unknown>(`/api/v1/campaigns/milestones/${mid}`, { method: "DELETE", headers: h }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  startFocus: (h: H, body: any) => api<{ id: string; status: string }>(`/api/v1/focus/start`, { method: "POST", headers: h, body: JSON.stringify(body) }),
  listFocus: (h: H, limit = 20) => api<unknown[]>(`/api/v1/focus?limit=${limit}`, { headers: h }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  finishFocus: (h: H, id: string, body: any) => api<unknown>(`/api/v1/focus/${id}/finish`, { method: "POST", headers: h, body: JSON.stringify(body) }),
  pauseFocus: (h: H, id: string) => api<unknown>(`/api/v1/focus/${id}/pause`, { method: "POST", headers: h }),
  resumeFocus: (h: H, id: string) => api<unknown>(`/api/v1/focus/${id}/resume`, { method: "POST", headers: h }),
  store: (h: H) => api<{ coins: number; items: StoreItem[] }>(`/api/v1/store`, { headers: h }),
  purchase: (h: H, itemId: string) => api<{ balance: number }>(`/api/v1/store/purchase`, { method: "POST", headers: h, body: JSON.stringify({ itemId }) }),
  inventory: (h: H) => api<unknown>(`/api/v1/inventory`, { headers: h }),
  equip: (h: H, itemId: string) => api<unknown>(`/api/v1/inventory/equip`, { method: "POST", headers: h, body: JSON.stringify({ itemId }) }),
  unequip: (h: H, slot: string) => api<unknown>(`/api/v1/inventory/unequip`, { method: "POST", headers: h, body: JSON.stringify({ slot }) }),
  genInstances: (h: H, id: string, from: string, to: string) =>
    api<unknown>(`/api/v1/quests/${id}/generate-instances`, { method: "POST", headers: h, body: JSON.stringify({ from, to }) }),
  listInstances: (h: H, id: string) => api<unknown[]>(`/api/v1/quests/${id}/instances`, { headers: h }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getProfile: (h: H) => api<any>(`/api/v1/profile/me`, { headers: h }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patchProfile: (h: H, body: any) => api<unknown>(`/api/v1/profile/me`, { method: "PATCH", headers: h, body: JSON.stringify(body) }),
  deleteProfile: (h: H) => api<{ deleted: boolean; authDeleted: boolean }>(`/api/v1/profile/me`, { method: "DELETE", headers: h }),
  getProgression: (h: H) => api<{ level: number; coins: number; currentStreak: number }>(`/api/v1/profile/me/progression`, { headers: h }),
  achievements: (h: H) => api<{ unlocked: unknown[] }>(`/api/v1/achievements`, { headers: h }),
  companion: (h: H, event = "app_open", tz?: string) => {
    const q = new URLSearchParams({ event });
    if (tz) q.set("tz", tz);
    return api<{ mood: string; message: string }>(`/api/v1/companion?${q.toString()}`, { headers: h });
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  history: (h: H, limit = 20) => api<any>(`/api/v1/chronicle/history?limit=${limit}`, { headers: h }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analytics: (h: H) => api<any>(`/api/v1/chronicle/analytics`, { headers: h }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debrief: (h: H, date?: string) => api<any>(`/api/v1/chronicle/debrief${date ? `?date=${date}` : ""}`, { headers: h }),
  calendar: (h: H, from: string, to: string) =>
    api<import("./types").CalendarFeed>(`/api/v1/chronicle/calendar?from=${from}&to=${to}`, { headers: h }),
  notifications: (h: H) =>
    api<{ notifications: import("./types").Notice[]; prefs: { quest: boolean; streak: boolean; celebrate: boolean } }>(`/api/v1/notifications`, { headers: h }),
  wallet: (h: H) => api<{ coins: number; lifetimeXp: number }>(`/api/v1/wallet`, { headers: h }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  heroCard: (h: H) => api<any>(`/api/v1/hero-card`, { headers: h }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  realm: (h: H) => api<any>(`/api/v1/realm`, { headers: h }),
  starters: (h: H) => api<{ suggestions: { title: string; questType: string; activityKey: string; difficulty: number; estimatedMinutes: number }[] }>(`/api/v1/starters`, { headers: h }),
};
