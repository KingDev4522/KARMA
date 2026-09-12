import { Skeleton } from "@/components/States";

/**
 * Route loading screen — instant branded skeleton on every navigation so the
 * app never sits blank while server state loads (LRP-FE-001 §16/§21).
 */
export default function Loading() {
  return (
    <div className="page is-active" aria-busy="true" aria-label="Loading">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo.png" alt="" width={34} height={34} style={{ borderRadius: 9, objectFit: "contain" }} />
        <p style={{ fontSize: 13.5, color: "var(--text-2)" }}>Summoning your realm…</p>
      </div>
      <Skeleton label="content" rows={4} />
    </div>
  );
}
