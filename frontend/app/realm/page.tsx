"use client";

import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import { EnvStack, Hero, Icon, variantFor } from "@/components/illustrations";
import { ATTR_META } from "@/components/quests";
import { EmptyState, ErrorState, SignInPrompt, Skeleton } from "@/components/States";

/** Realm — hero card scene, identity, attributes, achievements, cosmetics. */
export default function RealmPage() {
  const { authHeaders, userId, loading: authLoading } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, loading, retry } = useApi<any>(() => client.realm(authHeaders()), [userId], {
    enabled: !authLoading && !!userId,
  });
  // Badge source of truth: /achievements returns all + unlocked + locked.
  // (The realm aggregate carries unlocked only, so locked must come from here.)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: badgeBook } = useApi<any>(() => client.achievements(authHeaders()), [userId], {
    enabled: !authLoading && !!userId,
  });

  if (authLoading || loading) return <Skeleton label="Realm" rows={4} />;
  if (!userId) return <SignInPrompt />;
  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (!data) return <EmptyState message="Your realm is unformed. Complete a quest to begin." />;

  const heroName = data.hero?.name ?? data.hero?.displayName ?? data.hero?.heroAssetId ?? data.hero?.assetId ?? "Unnamed Hero";
  const level = data.progression?.level ?? 1;
  const rank = data.rank?.display ?? "";
  const coins = data.progression?.coins ?? 0;
  const streak = data.progression?.currentStreak ?? 0;
  const xpInto = data.heroCard?.xpProgress?.intoLevel ?? data.xpProgress?.intoLevel ?? 0;
  const xpNeed = data.heroCard?.xpProgress?.neededForNext ?? data.xpProgress?.neededForNext ?? 100;
  const title = data.heroCard?.title?.name ?? data.title?.name ?? "Wayfarer";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attrs: any[] = data.attributes ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unlocked: any[] = data.achievements?.unlocked ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const locked: any[] = (badgeBook?.locked ?? []).map((a: any) => ({ key: a.key, name: a.name, description: a.description, iconPath: a.iconPath }));
  const equipped = data.equipped ?? data.loadout ?? {};
  const cosmeticTags: string[] = [];
  if (equipped?.frameItemId || equipped?.frame) cosmeticTags.push(`Frame · ${equipped.frameItemId ?? equipped.frame}`);
  if (title) cosmeticTags.push(`Title · ${title}`);
  if (equipped?.realmItemId || equipped?.realm) cosmeticTags.push(`Realm · ${equipped.realmItemId ?? equipped.realm}`);
  if (equipped?.effectItemId) cosmeticTags.push(`Effect · ${equipped.effectItemId}`);

  // Always render 8 attribute placeholders at Lv0 if empty (editorial grid)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const displayAttrs: any[] =
    attrs.length === 0
      ? Object.entries(ATTR_META).map(([key, meta]) => ({ key, name: meta.name, level: 0, xp: 0 }))
      : attrs;

  return (
    <div className="page is-active">
      <div className="page-head">
        <div>
          <h2>Realm</h2>
          <p className="sub">This is who you&apos;re becoming.</p>
        </div>
      </div>

      <div className="realm-grid">
        <div className="realm-hero-card">
          <EnvStack />
          <div className="nameplate">
            <span className="np-frame">
              <Hero width={20} variant={variantFor(data.hero?.heroAssetId ?? data.hero?.assetId ?? null)} />
            </span>
            <div>
              <strong>{heroName}</strong>
              <span>{title}</span>
            </div>
          </div>
          <div className="hero-fig">
            <Hero width="100%" className="idle" variant={variantFor(data.hero?.heroAssetId ?? data.hero?.assetId ?? null)} />
          </div>
        </div>

        <div className="realm-detail">
          <div className="identity panel">
            <div className="id-top">
              <div>
                <h3>{heroName}</h3>
                <div style={{display:"flex", alignItems:"baseline", gap:16, flexWrap:"wrap"}}>
                  <span className="lvl-huge" style={{fontSize:"clamp(56px,6vw,84px)", fontWeight:750, letterSpacing:"-.05em", lineHeight:.95}}>{level}</span>
                  <span className="seal" title={rank} aria-label={rank}>{String(rank).slice(0,2).toUpperCase()}</span>
                </div>
                <p className="rank-line"><b>{rank}</b> rank · {xpInto} / {xpNeed} XP · {coins.toLocaleString("en-US")} coins</p>
              </div>
              <span className="streak-pill">
                <Icon id="i-flame" />
                {streak}-day streak
              </span>
            </div>
            <div className="xp-bar" style={{ marginTop: 18 }}>
              <i style={{ width: `${Math.min(100, Math.round((xpInto / Math.max(1, xpNeed)) * 100))}%` }} />
            </div>
            {data.companion?.message && (
              <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 12 }}>“{data.companion.message}”</p>
            )}
          </div>

          <div className="panel">
            <div className="realm-attrs">
              {displayAttrs.map((a) => {
                const meta = ATTR_META[String(a.key ?? "").toLowerCase()] ?? { name: a.name, icon: "i-spark" as const };
                return (
                  <div className="attr-stat" key={a.key ?? a.name}>
                    <span className="attr-icon">
                      <Icon id={meta.icon} />
                    </span>
                    <div className="info">
                      <div className="name">
                        {a.name}
                        <em>Lv {a.level}</em>
                      </div>
                      <div className="attr-bar">
                        <i style={{ width: `${Math.min(100, Math.round(((Number(a.xp) || 0) % 500) / 5))}%` }} />
                      </div>
                      <span style={{width:6,height:6,borderRadius:"50%",background:"var(--border-strong)", display:"inline-block", marginTop:6}} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel">
            <div className="sec-head" style={{ padding: "22px 24px 0", margin: 0 }}>
              <h3>Achievements</h3>
            </div>
            <div className="achieve-grid">
              {unlocked.length === 0 && locked.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--text-3)" }}>Your first badge is one quest away.</p>
              )}
              {unlocked.map((a) => (
                <div className="achievement" key={a.key ?? a.name} title={a.description ?? a.name}>
                  <span className="ach-icon">
                    <Icon id="i-trophy" />
                  </span>
                  <div>
                    <strong>{a.name}</strong>
                    <span>{a.description ?? "Unlocked"}</span>
                  </div>
                </div>
              ))}
              {locked.map((a) => (
                <div className="achievement locked" key={a.key ?? a.name} title={a.description ?? a.name}>
                  <span className="ach-icon">
                    <Icon id="i-trophy" />
                  </span>
                  <div>
                    <strong>{a.name}</strong>
                    <span>{a.description ?? "Locked"}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="sec-head" style={{ padding: "8px 24px 0", margin: 0 }}>
              <h3>Equipped cosmetics</h3>
            </div>
            <div className="cosmetic-row">
              {cosmeticTags.length === 0 && <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>Nothing equipped — visit the Store.</span>}
              {cosmeticTags.map((t) => (
                <span className="cosmetic-tag" key={t}>
                  <Icon id="i-spark" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
