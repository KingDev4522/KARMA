"use client";

/**
 * Typed API client for the KARMA backend. Every function maps 1:1 to a
 * backend route (see backend/docs/API.md). All errors surface as ApiErrorShape
 * with `retryable` so the UI can offer [Try Again] (LRP-FE-001 §18).
 */
import type { ApiError, Campaign, CompletionResponse, Quest, StoreItem, TodayResponse } from "./types";

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

// ── Request cache (Phase 2: client-side caching) ─────────────────────────
// Lightweight TTL cache for GET requests. POST/PUT/DELETE are never cached.
// Prevents duplicate requests within a short window (e.g. Shell + Today page
// both calling getToday).
//
// The cache key is scoped by auth token/header so that a signed-in user's
// data can never be served to a different user on the same tab after
// sign-out/sign-in — each session gets its own entry.
const CACHE_TTL_MS = 30_000; // 30 seconds
const _cache = new Map<string, { data: unknown; ts: number }>();
// Per-prefix generation. A mutation (invalidation) bumps the version of a
// path prefix; a GET captures the prefix version at start and only writes
// into the cache if it is unchanged when it resolves. This prevents an
// in-flight request from writing stale data after a mutation — even for a
// sibling key under the same prefix that was never cached (e.g. the
// timezone-variant of /quests/today).
const _prefixGen = new Map<string, number>();
// In-flight GET promises keyed by cache key — coalesces simultaneous
// identical requests (e.g. Shell + Today page both fetching /quests/today)
// into one network call.
const _inflight = new Map<string, Promise<unknown>>();

function cacheKey(path: string, opts?: RequestInit): string | undefined {
  if (opts?.method && opts.method !== "GET") return undefined;
  // Distinguish users: the Authorization bearer JWT (or dev user header).
  // headers may be a plain object (our callers) or a Headers instance.
  const headers = opts?.headers;
  let auth = "";
  if (headers instanceof Headers) {
    auth = headers.get("Authorization") ?? headers.get("authorization") ?? "";
  } else if (headers && typeof headers === "object") {
    const h = headers as Record<string, unknown>;
    auth = (h["Authorization"] as string) ?? (h["authorization"] as string) ?? (h["X-Dev-User-Id"] as string) ?? "";
  }
  return `${auth}|${path}`;
}

/** Longest prefix that has been invalidated, anchored at a boundary. */
const pathOf = (key: string) => key.slice(key.indexOf("|") + 1);
function genForPath(path: string): number {
  let best = -1;
  let bestLen = 0;
  for (const [pfx, v] of _prefixGen) {
    if (path.startsWith(pfx) && pfx.length > bestLen) {
      best = v;
      bestLen = pfx.length;
    }
  }
  return best;
}

function cacheGet<T>(key: string): T | undefined {
  const entry = _cache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    _cache.delete(key);
    return undefined;
  }
  return entry.data as T;
}

function cacheSet(key: string, data: unknown): void {
  _cache.set(key, { data, ts: Date.now() });
}

/**
 * Remove cached entries whose request path starts with `pathPrefix`.
 * Keys are `${auth}|${path}`, so we match against the path portion.
 * Used after mutations so stale data is never served (e.g. after
 * completing a quest, matching "/api/v1/quests" clears today + list).
 *
 * Bumps the prefix generation so any GET in-flight at this moment — that
 * started under an older version — will not write its (now stale) result
 * into the cache. Sibling keys under the same prefix are covered too,
 * because versioning is prefix-scoped, not per key.
 */
export function invalidateCache(pathPrefix: string): void {
  for (const key of _cache.keys()) {
    if (pathOf(key).startsWith(pathPrefix)) _cache.delete(key);
  }
  // Drop any in-flight promise for that prefix so a re-fetch doesn't
  // coalesce onto a stale request.
  for (const key of _inflight.keys()) {
    if (pathOf(key).startsWith(pathPrefix)) _inflight.delete(key);
  }
  // Bump the prefix version (again — idempotent, monotonic).
  _prefixGen.set(pathPrefix, (_prefixGen.get(pathPrefix) ?? 0) + 1);
}

export interface ApiErrorShape extends Error {
  status: number;
  body: ApiError;
}

export async function api<T>(path: string, opts: RequestInit & { headers?: Record<string, string> } = {}): Promise<T> {
  const ckey = cacheKey(path, opts);

  // 1) Cached value (30s TTL) — instant for repeat GETs.
  if (ckey) {
    const cached = cacheGet<T>(ckey);
    if (cached !== undefined) return cached;

    // 2) In-flight coalescing — reuse the same network promise so two
    //    simultaneous identical GETs (e.g. Shell + Today) fire once.
    const pending = _inflight.get(ckey);
    if (pending) return pending as Promise<T>;
  }

  const run = (async (): Promise<T> => {
    // Capture the generation this request started under. If a mutation
    // bumps its prefix version while we're in flight, our result must not
    // enter the cache.
    const genAtStart = ckey ? genForPath(pathOf(ckey)) : -1;
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
    const data = (await res.json()) as T;
    // Only cache if no mutation invalidated this path while we were
    // in flight (prefix generation unchanged).
    if (ckey && genForPath(pathOf(ckey)) === genAtStart) {
      cacheSet(ckey, data);
    }
    return data;
  })();

  if (ckey) {
    _inflight.set(ckey, run);
    // Always clear the in-flight entry once settled, so a later retry
    // issues a real request (the TTL cache keeps the fast path).
    run.finally(() => {
      if (_inflight.get(ckey) === run) _inflight.delete(ckey);
    }).catch(() => {});
  }
  return run;
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
  createQuest: (h: H, body: any) => {
    const r = api<Quest>(`/api/v1/quests`, { method: "POST", headers: h, body: JSON.stringify(body) });
    r.then(() => invalidateCache("/api/v1/quests")).catch(() => undefined);
    return r;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  previewQuest: (h: H, body: any) => api<import("./types").RewardPreview>(`/api/v1/quests/preview`, { method: "POST", headers: h, body: JSON.stringify(body) }),
  suggestMapping: (h: H, activityKey: string) =>
    api<{ primary: string; secondary: string; source: string }>(`/api/v1/quests/suggest-mapping?activityKey=${encodeURIComponent(activityKey)}`, { headers: h }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patchQuest: (h: H, id: string, body: any) => {
    const r = api<Quest>(`/api/v1/quests/${id}`, { method: "PATCH", headers: h, body: JSON.stringify(body) });
    r.then(() => invalidateCache("/api/v1/quests")).catch(() => undefined);
    return r;
  },
  deleteQuest: (h: H, id: string) => {
    const r = api<unknown>(`/api/v1/quests/${id}`, { method: "DELETE", headers: h });
    r.then(() => {
      invalidateCache("/api/v1/quests");
      invalidateCache("/api/v1/quests/today");
    }).catch(() => undefined);
    return r;
  },
  completeQuest: (h: H, id: string, idempotencyKey: string) => {
    const r = api<CompletionResponse>(`/api/v1/quests/${id}/complete`, { method: "POST", headers: h, body: JSON.stringify({ idempotencyKey }) });
    r.then(() => invalidateCache("/api/v1/quests")).catch(() => undefined);
    return r;
  },
  activityTypes: (h: H) => api<{ key: string; name: string }[]>(`/api/v1/quests/meta/activity-types`, { headers: h }),
  listCampaigns: (h: H) => api<Campaign[]>(`/api/v1/campaigns`, { headers: h }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createCampaign: (h: H, body: any) => {
    const r = api<Campaign>(`/api/v1/campaigns`, { method: "POST", headers: h, body: JSON.stringify(body) });
    r.then(() => invalidateCache("/api/v1/campaigns")).catch(() => undefined);
    return r;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patchCampaign: (h: H, id: string, body: any) => {
    const r = api<Campaign>(`/api/v1/campaigns/${id}`, { method: "PATCH", headers: h, body: JSON.stringify(body) });
    r.then(() => invalidateCache("/api/v1/campaigns")).catch(() => undefined);
    return r;
  },
  deleteCampaign: (h: H, id: string) => {
    const r = api<unknown>(`/api/v1/campaigns/${id}`, { method: "DELETE", headers: h });
    r.then(() => invalidateCache("/api/v1/campaigns")).catch(() => undefined);
    return r;
  },
  getCampaign: (h: H, id: string) => api<Campaign>(`/api/v1/campaigns/${id}`, { headers: h }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createMilestone: (h: H, id: string, body: any) => {
    const r = api<unknown>(`/api/v1/campaigns/${id}/milestones`, { method: "POST", headers: h, body: JSON.stringify(body) });
    r.then(() => invalidateCache("/api/v1/campaigns")).catch(() => undefined);
    return r;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patchMilestone: (h: H, mid: string, body: any) => {
    const r = api<unknown>(`/api/v1/campaigns/milestones/${mid}`, { method: "PATCH", headers: h, body: JSON.stringify(body) });
    r.then(() => invalidateCache("/api/v1/campaigns")).catch(() => undefined);
    return r;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  startFocus: (h: H, body: any) => api<{ id: string; status: string }>(`/api/v1/focus/start`, { method: "POST", headers: h, body: JSON.stringify(body) }),
  listFocus: (h: H, limit = 20) => api<unknown[]>(`/api/v1/focus?limit=${limit}`, { headers: h }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  finishFocus: (h: H, id: string, body: any) => api<unknown>(`/api/v1/focus/${id}/finish`, { method: "POST", headers: h, body: JSON.stringify(body) }),
  pauseFocus: (h: H, id: string) => api<unknown>(`/api/v1/focus/${id}/pause`, { method: "POST", headers: h }),
  resumeFocus: (h: H, id: string) => api<unknown>(`/api/v1/focus/${id}/resume`, { method: "POST", headers: h }),
  store: (h: H) => api<{ coins: number; items: StoreItem[] }>(`/api/v1/store`, { headers: h }),
  purchase: (h: H, itemId: string) => {
    const r = api<{ balance: number }>(`/api/v1/store/purchase`, { method: "POST", headers: h, body: JSON.stringify({ itemId }) });
    r.then(() => {
      invalidateCache("/api/v1/store");
      invalidateCache("/api/v1/wallet");
    }).catch(() => undefined);
    return r;
  },
  inventory: (h: H) => api<unknown>(`/api/v1/inventory`, { headers: h }),
  equip: (h: H, itemId: string) => {
    const r = api<unknown>(`/api/v1/inventory/equip`, { method: "POST", headers: h, body: JSON.stringify({ itemId }) });
    r.then(() => invalidateCache("/api/v1/inventory")).catch(() => undefined);
    return r;
  },
  unequip: (h: H, slot: string) => {
    const r = api<unknown>(`/api/v1/inventory/unequip`, { method: "POST", headers: h, body: JSON.stringify({ slot }) });
    r.then(() => invalidateCache("/api/v1/inventory")).catch(() => undefined);
    return r;
  },
  genInstances: (h: H, id: string, from: string, to: string) =>
    api<unknown>(`/api/v1/quests/${id}/generate-instances`, { method: "POST", headers: h, body: JSON.stringify({ from, to }) }),
  listInstances: (h: H, id: string) => api<unknown[]>(`/api/v1/quests/${id}/instances`, { headers: h }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getProfile: (h: H) => api<any>(`/api/v1/profile/me`, { headers: h }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patchProfile: (h: H, body: any) => {
    const r = api<unknown>(`/api/v1/profile/me`, { method: "PATCH", headers: h, body: JSON.stringify(body) });
    r.then(() => {
      invalidateCache("/api/v1/profile");
      invalidateCache("/api/v1/quests/today");
    }).catch(() => undefined);
    return r;
  },
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
  // Rest days (read + write)
  restDays: (h: H) => api<unknown[]>(`/api/v1/rest-days`, { headers: h }),
  createRestDay: (h: H, body: { date: string; note?: string }) => {
    const r = api<unknown>(`/api/v1/rest-days`, { method: "POST", headers: h, body: JSON.stringify(body) });
    r.then(() => {
      invalidateCache("/api/v1/rest-days");
      invalidateCache("/api/v1/quests/today");
    }).catch(() => undefined);
    return r;
  },
  // Keep-alive / health check (no cache)
  health: () => fetch(`${BASE}/health`, { method: "GET" }),
};
