"use client";

import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import { Companion, Hero, Icon } from "@/components/illustrations";
import { ATTR_META } from "@/components/quests";
import { EmptyState, ErrorState, SignInPrompt, Skeleton } from "@/components/States";

/** Hero Card — collectible identity composition, export-ready. */
export default function HeroCardPage() {
  const { authHeaders, userId, loading: authLoading } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, loading, retry } = useApi<any>(() => client.heroCard(authHeaders()), [userId], {
    enabled: !authLoading && !!userId,
  });

  if (authLoading || loading) return <Skeleton label="Hero Card" rows={3} />;
  if (!userId) return <SignInPrompt />;
  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (!data) return <EmptyState message="No hero yet." />;

  const pct = Math.round((data.xpProgress?.pct ?? 0) * 100);

  return (
    <div className="page is-active" style={{ maxWidth: 480, margin: "0 auto" }}>
      <div className="page-head">
        <div>
          <h2>Hero Card</h2>
          <p className="sub">Preview before you share it.</p>
        </div>
      </div>

      <div className="panel" style={{ padding: 10 }}>
        <div style={{ border: "2px solid var(--gold)", borderRadius: 14, padding: "26px 22px", textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".35em", color: "var(--text-3)" }}>HERO · 勇者</p>
          <p style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{data.heroName}</p>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>
            Level {data.level} · {data.rank?.display}
          </p>
          <div style={{ display: "flex", justifyContent: "center", margin: "14px 0" }}>
            <Hero width={96} />
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <Companion width={64} />
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(data.topAttributes ?? []).map((a: any) => {
              const meta = ATTR_META[String(a.key ?? "").toLowerCase()];
              return (
                <span key={a.key} className="meta-chip">
                  {meta && <Icon id={meta.icon} />}
                  {a.name} · Lv {a.level}
                </span>
              );
            })}
          </div>
          <p style={{ marginTop: 12, fontSize: 13, fontWeight: 700 }}>
            <Icon id="i-flame" style={{ display: "inline", verticalAlign: -3, color: "var(--accent)" }} /> {data.streak}-day streak
          </p>
          {data.title && <p style={{ marginTop: 4, fontSize: 13, color: "var(--accent-text)", fontWeight: 700 }}>“{data.title.name}”</p>}
          <div className="xp-bar" style={{ marginTop: 12 }}>
            <i style={{ width: `${pct}%` }} />
          </div>
          <div style={{ marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(data.campaigns ?? []).map((c: any) => (
              <p key={c.id} style={{ fontSize: 11.5, color: "var(--text-2)" }}>
                {c.title} · {c.progressPct}%
              </p>
            ))}
          </div>
          {(data.achievements?.length ?? 0) > 0 && (
            <p style={{ marginTop: 6, fontSize: 11.5, color: "var(--text-2)" }}>{data.achievements.length} badges earned</p>
          )}
          {typeof data.coins === "number" && (
            <p style={{ marginTop: 4, fontSize: 12, color: "var(--gold)", fontWeight: 800 }}>
              <Icon id="i-coin" style={{ display: "inline", verticalAlign: -2 }} /> {data.coins} coins
            </p>
          )}
        </div>
      </div>

      <button onClick={() => window.print()} className="btn btn--primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>
        Export / Print
      </button>
      <p style={{ textAlign: "center", fontSize: 11.5, color: "var(--text-3)", marginTop: 10 }}>
        Sharing is explicit — nothing leaves your realm unless you send it.
      </p>
    </div>
  );
}
