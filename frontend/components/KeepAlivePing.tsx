"use client";

import { useKeepAlive } from "@/lib/useKeepAlive";

/** Internal wrapper that starts the keep-alive ping once auth is ready.
 *
 * The hook is a no-op while there is no signed-in user, so this wrapper
 * never blocks rendering of the rest of the tree (Shell gates on auth
 * itself).
 */
export function KeepAlivePing({ children }: { children: React.ReactNode }) {
  useKeepAlive();
  return <>{children}</>;
}
