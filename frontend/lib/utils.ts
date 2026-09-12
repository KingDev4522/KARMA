"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiErrorShape } from "./api";

/** Data-fetch hook with Loading / Error(+retry per LRP-FE-001 §18) / Success states.
 * Pass `{ enabled: false }` to hold the request (e.g. while auth is resolving or
 * signed out) so we never fire an unauthenticated call that 401s into an error wall.
 */
export function useApi<T>(fn: () => Promise<T>, deps: unknown[] = [], opts: { enabled?: boolean } = {}) {
  const enabled = opts.enabled ?? true;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiErrorShape | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const retry = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    fn()
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e) => {
        if (alive) setError(e as ApiErrorShape);
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
