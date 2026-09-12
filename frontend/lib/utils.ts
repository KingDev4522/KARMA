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
