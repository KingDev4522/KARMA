"use client";

import { useEffect } from "react";
import { useAuth } from "./auth";

/** Keep-alive ping: prevents Render's free tier from sleeping after 15 min idle.
 *
 *  Pings the backend /health endpoint every 10 minutes (comfortably within the
 *  15-minute idle window). Only active while the user is signed in — no point
 *  burning a ping for a guest visitor.
 *
 *  Safe: GET only, no auth headers, no mutation. Best-effort; if the browser
 *  throttles a background tab the ping simply fires less often, which is fine.
 */
export function useKeepAlive() {
  const { userId } = useAuth();

  useEffect(() => {
    if (!userId) return;

    const ping = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
        await fetch(`${base}/health`, { method: "GET" });
      } catch {
        // Silently ignore — Render may be waking up, network flaky, etc.
      }
    };

    // Fire immediately so the session stays warm from the first click.
    ping();
    const id = setInterval(ping, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(id);
  }, [userId]);
}
