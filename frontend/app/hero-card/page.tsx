"use client";

import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import { CompanionImage, FrameWrap, HeroImage, CoinImg, Icon, TitleBox } from "@/components/illustrations";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const equipped = ((data.equippedItems ?? []) as any[]);
  const frameAsset = equipped.find((i) => i.itemType === "frame")?.assetPath ?? null;
  const titleBoxRaw = equipped.find((i) => i.itemType === "title")?.assetPath ?? null;
  const titleBoxAsset = typeof titleBoxRaw === "string" && titleBoxRaw.endsWith(".jpeg") ? titleBoxRaw : null;
  const avatarId = data.avatarAssetId ?? data.avatar ?? data.heroAssetId;

  const exportPng = async () => {
    const el = document.querySelector(".panel > div") as HTMLElement;
    if (!el) return window.print();
    try {
      // @ts-ignore
      const mod = await import("html2canvas").catch(() => null);
      if (mod?.default) {
        const canvas = await mod.default(el, { backgroundColor: null, scale: 2 });
        const a = document.createElement("a");
        a.download = "hero-card.png";
        a.href = canvas.toDataURL("image/png");
        a.click();
        return;
      }
      // Simple canvas fallback without external dep
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 800;
      const ctx = canvas.getContext("2d");
      if (!ctx) return window.print();
      const cs = getComputedStyle(document.documentElement);
      const surface = cs.getPropertyValue("--surface").trim() || "#FFFFFF";
      ctx.fillStyle = surface || "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = cs.getPropertyValue("--border").trim() || "#E9E9E6";
      ctx.lineWidth = 1;
      ctx.strokeRect(12, 12, 576, 776);
      ctx.textAlign = "center";
      ctx.fillStyle = cs.getPropertyValue("--text-3").trim() || "#A0A0A0";
      ctx.font = "800 11px Inter, sans-serif";
      ctx.fillText("HERO · 勇者", 300, 70);
      ctx.fillStyle = cs.getPropertyValue("--text").trim() || "#181818";
      ctx.font = "800 24px Inter, sans-serif";
      ctx.fillText(String(data.heroName ?? "Hero"), 300, 105);
      ctx.fillStyle = cs.getPropertyValue("--text-2").trim() || "#5F5F5F";
      ctx.font = "400 13px Inter, sans-serif";
      ctx.fillText(`Level ${data.level} · ${data.rank?.display ?? ""}`, 300, 130);
      ctx.fillStyle = cs.getPropertyValue("--text-3").trim() || "#A0A0A0";
      ctx.font = "600 12px Inter, sans-serif";
      ctx.fillText(`${data.streak}-day streak`, 300, 300);
      if (data.title?.name) {
        ctx.fillStyle = cs.getPropertyValue("--text-2").trim() || "#5F5F5F";
        ctx.font = "700 13px Inter, sans-serif";
        ctx.fillText(`“${data.title.name}”`, 300, 325);
      }
      // xp bar
      const barX = 120;
      const barW = 360;
      const barY = 350;
      ctx.fillStyle = cs.getPropertyValue("--surface-3").trim() || "#EFEFEF";
      ctx.fillRect(barX, barY, barW, 2);
      ctx.fillStyle = cs.getPropertyValue("--text").trim() || "#181818";
      ctx.fillRect(barX, barY, Math.round((barW * pct) / 100), 2);
      const a = document.createElement("a");
      a.download = "hero-card.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    } catch {
      window.print();
    }
  };

  return (
    <div className="page is-active" style={{ maxWidth: 520, margin: "0 auto" }}>
      <div className="page-head">
        <div>
          <h2>Hero Card</h2>
          <p className="sub">Preview before you share it.</p>
        </div>
      </div>

      <div className="panel" style={{ padding: 10 }}>
        <div className="share-card">
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".35em", color: "var(--text-3)" }}>HERO · 勇者</p>
          <div style={{ marginTop: 4, display: "flex", justifyContent: "center" }}>
            <TitleBox boxSrc={titleBoxAsset} name={String(data.heroName ?? "Hero")} />
          </div>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>
            Level {data.level} · {data.rank?.display}
          </p>
          <div style={{ display: "flex", justifyContent: "center", margin: "14px 0" }}>
            <div style={{ width: 180 }}>
              <FrameWrap frameSrc={frameAsset} label="Framed hero">
                <span style={{ display: "block", borderRadius: 16, overflow: "hidden" }}>
                  <HeroImage assetId={avatarId} eager alt={data.heroName ?? "Hero"} />
                </span>
              </FrameWrap>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12, flexDirection: "column", alignItems: "center", gap: 4 }}>
            <CompanionImage assetId={data.companion ?? data.companionAssetId} width={64} alt={data.companionName ?? "Companion"} />
            {data.companionName && <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 700 }}>{data.companionName}</span>}
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 12 }}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(data.topAttributes ?? []).map((a: any) => {
              const meta = ATTR_META[String(a.key ?? "").toLowerCase()];
              return (
                <span key={a.key} style={{ fontSize: 12, fontWeight: 650, display: "inline-flex", alignItems: "center", gap: 5, color: "var(--text-2)" }}>
                  {meta && <Icon id={meta.icon} style={{ width: 14, height: 14, color: "var(--text-3)" }} />}
                  {a.name} Lv{a.level}
                </span>
              );
            })}
          </div>
          <p style={{ marginTop: 12, fontSize: 13, fontWeight: 700 }}>
            <Icon id="i-flame" style={{ display: "inline", verticalAlign: -3, color: "var(--text-3)" }} /> {data.streak}-day streak
          </p>
          {data.title && <p style={{ marginTop: 4, fontSize: 13, color: "var(--text-2)", fontWeight: 700 }}>“{data.title.name}”</p>}
          <div className="xp-bar" style={{ marginTop: 12 }}>
            <i style={{ width: `${pct}%` }} />
          </div>
          <div style={{ marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(data.campaigns ?? []).map((c: any) => (
              <p key={c.id} style={{ fontSize: 11.5, color: "var(--text-2)", border: "1px solid var(--border)", borderRadius: 999, padding: "4px 10px" }}>
                {c.title} · {c.progressPct}%
              </p>
            ))}
          </div>
          {(data.achievements?.length ?? 0) > 0 && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {data.achievements.slice(0, 5).map((_: any, i: number) => (
                  <i
                    key={i}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      display: "inline-block",
                      opacity: 0.9 - i * 0.12,
                    }}
                  />
                ))}
              </span>
              <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{data.achievements.length} seals earned</span>
            </div>
          )}
          {typeof data.coins === "number" && (
            <p style={{ marginTop: 4, fontSize: 12, color: "var(--gold)", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              <CoinImg size={14} /> {data.coins} coins
            </p>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={exportPng} className="btn btn--primary" style={{ flex: 1, justifyContent: "center" }}>
          Export PNG
        </button>
        <button onClick={() => window.print()} className="btn btn--ghost" style={{ flex: 1, justifyContent: "center" }}>
          Print
        </button>
      </div>
      <p style={{ textAlign: "center", fontSize: 11.5, color: "var(--text-3)", marginTop: 10 }}>
        Sharing is explicit — nothing leaves your realm unless you send it.
      </p>
    </div>
  );
}
