"use client";

import { useBackendWarmup } from "./backend-warmup";

/** Keep-alive + cold-start warm-up: prevents Render's free tier from sleeping after 15 min idle.
 *
 *  Fires unconditionally on every frontend load — including logged-out pages
 *  like /login — so the backend is already booting while the visitor reads,
 *  signs in, or onboards. Then pings /health every 10 minutes (comfortably
 *  within the 15-minute idle window) while the tab stays open.
 *
 *  Safe: GET only, no auth headers, no mutation. Best-effort; if the browser
 *  throttles a background tab the ping simply fires less often, which is fine.
 *
 *  Implementation lives in ./backend-warmup (retry + dedupe + preconnect).
 *  This hook is kept for backwards compatibility.
 */
export function useKeepAlive() {
  useBackendWarmup();
}
