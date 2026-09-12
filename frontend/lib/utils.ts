"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiErrorShape } from "./api";

/** Data-fetch hook with Loading / Error(+retry per LRP-FE-001 §18) / Success states.
 * Pass `{ enabled: false }` to hold the request (e.g. while auth is resolving or
 * signed out) so we never fire an unauthenticated call that 401s into an error wall.
 *
 * Stale-while-revalidate: the loader only shows when there is nothing to show
 * yet. Refetches (retry, focus events, tab switches with warm cache) resolve
 * from the api() cache in milliseconds and never flash a skeleton over content.
 */
export function useApi<T>(fn: () => Promise<T>, deps: unknown[] = [], opts: { enabled?: boolean } = {}) {
  const enabled = opts.enabled ?? true;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiErrorShape | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const hasData = useRef(false);

  const retry = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let alive = true;
    // Only paint the loader when there is nothing on screen yet.
    if (!hasData.current) setLoading(true);
    setError(null);
    fn()
      .then((d) => {
        if (!alive) return;
        hasData.current = true;
        setData(d);
      })
      .catch((e) => {
        if (alive && !hasData.current) setError(e as ApiErrorShape);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce, enabled]);

  return { data, error, loading, retry, setData };
}

export function fmtPct(pct: number) {
  return `${Math.round(pct * 100)}%`;
}

/**
 * Viewer's IANA timezone (e.g. "Asia/Kolkata") for locale-correct greetings.
 * Resolved once from the browser; undefined when unavailable (server keeps UTC).
 */
let cachedTz: string | undefined | null = null;

export function clientTimeZone(): string | undefined {
  if (cachedTz !== null) return cachedTz;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    cachedTz = tz && tz.length <= 60 ? tz : undefined;
  } catch {
    cachedTz = undefined;
  }
  return cachedTz;
}
