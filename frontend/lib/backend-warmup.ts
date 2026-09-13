"use client";

import { useEffect } from "react";

/**
 * Backend warm-up for Render free-tier cold starts.
 *
 * Problem: Render sleeps the backend after ~15 min of inactivity. The first
 * request after sleep takes 30-60s (cold start), so a user who lands on the
 * frontend and immediately signs in / creates a quest would hit a slow or
 * timed-out API call.
 *
 * Fix: the moment ANY frontend page loads (including /login for signed-out
 * visitors), fire a lightweight `GET /health` at the backend to start the
 * boot early. By the time the user acts, the server is already warm.
 *
 * Design constraints (do not regress):
 * - Fire-and-forget: never blocks render, never throws, never shows UI.
 * - No auth headers, no cookies, no custom headers → simple CORS GET, no
 *   preflight, so the wake-up request is as cheap as possible.
 * - Retry with backoff: the very first request may time out while Render
 *   boots; the server keeps booting anyway, so a follow-up retry lands warm.
 * - Dedupe: React StrictMode double-mounts effects in dev; concurrent calls
 *   share one in-flight promise.
 * - Periodic keep-alive every 10 min (< 15 min idle window) while the tab is
 *   open, plus a re-ping when the tab becomes visible again.
 */

const KEEP_ALIVE_MS = 10 * 60 * 1000; // 10 min — comfortably inside Render's 15 min window
const WAKE_TIMEOUT_MS = 30_000; // per-attempt ceiling; server keeps booting even if we abort
const WAKE_DELAYS_MS = [0, 2_000, 6_000, 12_000]; // immediate + 3 retries

let inflight: Promise<boolean> | null = null;
let preconnected = false;

function backendBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  return raw.replace(/\/$/, "");
}

function healthUrl(): string {
  return `${backendBase()}/health`;
}

function backendOrigin(): string | null {
  try {
    return new URL(backendBase()).origin;
  } catch {
    return null;
  }
}

/** Inject <link rel="preconnect"> + dns-prefetch for the API origin (once). */
function ensurePreconnect(): void {
  if (preconnected) return;
  if (typeof document === "undefined") return;
  const origin = backendOrigin();
  if (!origin) return;
  // Skip same-origin (local dev) — no benefit, avoids duplicate links.
  try {
    if (new URL(origin).origin === window.location.origin) {
      preconnected = true;
      return;
    }
  } catch {
    return;
  }
  preconnected = true;
  for (const rel of ["preconnect", "dns-prefetch"] as const) {
    try {
      if (document.querySelector(`link[rel="${rel}"][href="${origin}"]`)) continue;
      const link = document.createElement("link");
      link.rel = rel;
      link.href = origin;
      if (rel === "preconnect") link.crossOrigin = "anonymous";
      document.head.appendChild(link);
    } catch {
      /* ignore — preconnect is best-effort */
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Single best-effort GET /health. Resolves true on HTTP 2xx, false otherwise. Never throws. */
async function pingOnce(timeoutMs: number): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(healthUrl(), {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        keepalive: true,
        signal: ctrl.signal,
      });
      return res.ok;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return false;
  }
}

/**
 * Wake the backend: one immediate ping + retries with backoff.
 * Concurrent callers share the same promise. Never throws.
 */
export function warmBackend(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (inflight) return inflight;
  inflight = (async () => {
    for (let i = 0; i < WAKE_DELAYS_MS.length; i++) {
      if (i > 0) await sleep(WAKE_DELAYS_MS[i]!);
      const ok = await pingOnce(WAKE_TIMEOUT_MS);
      if (ok) return true;
    }
    return false;
  })().finally(() => {
    inflight = null;
  });
  // Attach a noop catch so an un-awaited warmBackend() never surfaces an
  // unhandled rejection (pingOnce already swallows, this is belt-and-braces).
  inflight.catch(() => undefined);
  return inflight;
}

/**
 * Mount once (typically at the root layout) to warm the backend on every
 * frontend load — signed-in or not — and keep it warm while the tab is open.
 */
export function useBackendWarmup(): void {
  useEffect(() => {
    ensurePreconnect();
    // Fire immediately on page load; do not await, do not block paint.
    void warmBackend();

    const id = window.setInterval(() => {
      void warmBackend();
    }, KEEP_ALIVE_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") void warmBackend();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}
