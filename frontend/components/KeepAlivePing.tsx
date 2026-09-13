"use client";

import { useKeepAlive } from "@/lib/useKeepAlive";

/** Root wrapper that warms the Render backend on every frontend load.
 *
 *  Mounted once in app/layout.tsx, so it runs on ALL pages — including
 *  logged-out routes like /login — firing GET /health immediately to wake
 *  the free-tier server while the user reads / signs in. Never blocks
 *  rendering of the rest of the tree.
 */
export function KeepAlivePing({ children }: { children: React.ReactNode }) {
  useKeepAlive();
  return <>{children}</>;
}
