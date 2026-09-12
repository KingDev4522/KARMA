"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { clientTimeZone, useApi } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { useFocus } from "@/components/focus";
import type { Campaign, CompletionResponse, Quest } from "@/lib/types";
import { CompanionImage, FrameWrap, HeroImage, Icon, TitleBox } from "@/components/illustrations";
import { ATTR_META, LevelUpModal, QuestPrimary, QuestRow, announceAchievements, burstAt } from "@/components/quests";
import { Celebration, celebrationFrom, type CelebrationData } from "@/components/celebration";
import { CampaignPreview } from "@/components/journey";
import { attrProgress } from "@/lib/identity";
import { EmptyState, ErrorState, SignInPrompt, Skeleton, useNowDate } from "@/components/States";

/** Today — editorial command center: greeting, level, decisive quest, quiet ledger. */
export default function TodayPage() {
  const { authHeaders, userId, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { focusSeq } = useFocus();
  const { data, error, loading, retry } = useApi(() => client.getToday(authHeaders(), undefined, clientTimeZone()), [userId, focusSeq], {
    enabled: !authLoading && !!userId,
  });
  const summaryId = data?.campaignSummary?.id ?? null;
  const { data: campaignDetail } = useApi(
    () => (summaryId ? client.getCampaign(authHeaders(), summaryId) : Promise.resolve(null as unknown as Campaign)),
    [summaryId],
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, CompletionResponse>>({});
  const [ceremony, setCeremony] = useState<CompletionResponse | null>(null);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const todayDate = useNowDate();

  if (authLoading || loading) return <Skeleton label="Today" rows={4} />;
  if (!userId) return <SignInPrompt />;
  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (!data) return <EmptyState message="Your board is clear. Add your first Quest." />;

  const complete = async (q: Quest, el: HTMLElement | null) => {
    if (busyId) return;
    setBusyId(q.id);
    try {
      const r = await client.completeQuest(authHeaders(), q.id, crypto.randomUUID());
      setResults((m) => ({ ...m, [q.id]: r }));
      burstAt(el);
      void import("@/lib/sound").then((s) => s.playCoin()).catch(() => undefined);
      toast(`“${q.title.length > 32 ? `${q.title.slice(0, 32)}…` : q.title}” complete · +${r.rewardXp} XP`, "i-check");
      announceAchievements(r, toast);
      setCelebration(celebrationFrom(r, { companionAssetId, companionName }));
      if (r.leveledUp) setCeremony(r);
      retry();
      window.dispatchEvent(new CustomEvent("liferpg:refresh"));
    } catch (e) {
      toast(e instanceof Error ? e.message : "Quest couldn't be completed. Your progress was not changed.", "i-close");
    } finally {
      setBusyId(null);
    }
  };

  const g = data.greeting as typeof data.greeting & { heroAssetId?: string | null; heroName?: string };
  // Canonical identity comes from data.hero (backend today aggregate); fall
  // back to legacy greeting/profile fields for older deployments.
  const heroObj = (data as unknown as { hero?: { heroAssetId?: string | null; heroName?: string; companionAssetId?: string | null; companionName?: string | null; avatarAssetId?: string | null; frameAsset?: string | null; titleBoxAsset?: string | null } }).hero;
  const heroAssetId: string | null =
    heroObj?.heroAssetId ??
    ((data as any)?.hero?.assetId as string | null | undefined) ??
    ((data as any)?.heroAssetId as string | null | undefined) ??
    ((data as any)?.greeting?.heroAssetId as string | null | undefined) ??
    ((data as any)?.greeting?.hero_asset_id as string | null | undefined) ??
    ((data as any)?.profile?.heroAssetId as string | null | undefined) ??
    ((g as any)?.heroAssetId as string | null | undefined) ??
    null;
  const companionAssetId: string | null =
    heroObj?.companionAssetId ??
    ((data as any)?.companion?.companionAssetId as string | null | undefined) ??
    ((data as any)?.companionAssetId as string | null | undefined) ??
    null;
  const companionName: string | null =
    heroObj?.companionName ??
    ((data as any)?.companion?.companionName as string | null | undefined) ??
    null;
  const heroName: string = heroObj?.heroName ?? (g as any)?.heroName ?? (data as any)?.hero?.heroName ?? (data as any)?.heroName ?? "hero";
  const frameAsset: string | null = heroObj?.frameAsset ?? null;
  const titleBoxAsset: string | null = heroObj?.titleBoxAsset ?? null;
  const seen = new Set<string>();
  const flat: Quest[] = [];
  const buckets = data.buckets as typeof data.buckets & { unscheduled?: Quest[] };
  for (const q of [...buckets.pinned, ...buckets.dueToday, ...buckets.routine, ...buckets.campaign, ...(buckets.unscheduled ?? []), ...data.quests]) {
    if (!seen.has(q.id) && q.status !== "completed") {
      seen.add(q.id);
      flat.push(q);
    }
  }
  if (data.spark && !seen.has(data.spark.id)) flat.push(data.spark);
  const primary = flat.find((q) => q.isPinned) ?? flat[0] ?? null;
  const upNext = flat.filter((q) => q !== primary).slice(0, 6);

  const pct = Math.min(100, Math.max(0, Math.round((g.xpProgress.intoLevel / Math.max(1, g.xpProgress.neededForNext)) * 100)));

  const detail = (campaignDetail ?? null) as Campaign | null;
  const milestones = (detail?.milestones ?? []).slice().sort((a, b) => a.orderIndex - b.orderIndex);
  const nextId = detail?.nextMilestone?.id ?? milestones.find((m) => m.status !== "done")?.id ?? null;

  return (
    <div className="page is-active">
      <Celebration data={celebration} onClose={() => setCelebration(null)} />
      {ceremony && (
          <LevelUpModal
            level={ceremony.newLevel}
            message={`${ceremony.companion.message} A new rank: ${ceremony.newRankDisplay}.`}
            rankUp={ceremony.rankUp}
            heroAssetId={heroAssetId}
            onClose={() => setCeremony(null)}
          />
      )}

      {/* EDITORIAL HEAD */}
      <header className="ed-head" style={{ position: "relative" }}>
        <div>
          <p className="ed-eyebrow">
            <span className="meta">{todayDate}</span>
            <span className="meta" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon id="i-flame" style={{ width: 13, height: 13 }} />
              {data.streak.current}-day streak
            </span>
          </p>
          <h1 className="ed-title">
            Good {g.timeOfDay}, <span className="who">{heroName}.</span>
          </h1>
          <p className="ed-sub">
            {g.rank.display} · {upNext.length + (primary ? 1 : 0)} open{" "}
            {(upNext.length + (primary ? 1 : 0)) === 1 ? "quest" : "quests"} ·{" "}
            {g.coins.toLocaleString("en-US")} coins in hand.
          </p>
          <div className="companion-note">
            <CompanionImage assetId={companionAssetId} width={30} alt={companionName ?? "Companion"} />
            <p>
              {companionName ? <strong>{companionName} · </strong> : null}
              {data.companion.message}
            </p>
          </div>
        </div>
        <div className="ed-side">
          <div className="ed-level">
            <div className="lvl-ring-wrap" id="lvlRing" aria-hidden="true">
              <svg viewBox="0 0 92 92"><circle className="track" cx="46" cy="46" r="41"/><circle className="prog" cx="46" cy="46" r="41" strokeDasharray="257.61" strokeDashoffset={257.61 * (1 - pct/100)} /></svg>
              <div className="lvl-huge">{g.heroLevel}</div>
            </div>
            <div className="lvl-cap">Level · {g.rank.display}</div>
            <div className="xp-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to next level">
              <i style={{ width: `${pct}%` }} />
            </div>
            <div className="xp-num">
              {g.xpProgress.intoLevel} / {g.xpProgress.neededForNext} XP
            </div>
          </div>
          <figure className="hero-portrait">
            <FrameWrap frameSrc={frameAsset} label={`${heroName}'s frame`}>
              <HeroImage assetId={heroAssetId} eager alt={heroName} />
            </FrameWrap>
            <figcaption className="hp-cap">
              <TitleBox boxSrc={titleBoxAsset} name={heroName} />
            </figcaption>
          </figure>
        </div>
        <span className="seal seal--line" title="Today" aria-hidden="true" style={{ position: "absolute", top: 8, right: 8, width: 22, height: 22, fontSize: 11, lineHeight: 1 }}>
          今
        </span>
      </header>

      <div className="today-grid">
        <div className="today-main">
          {primary ? (
            <QuestPrimary quest={primary} onComplete={complete} completing={busyId === primary.id} />
          ) : (
            <EmptyState
              message={data.emptyHints.allClear ?? "Every quest is stamped. The page rests."}
              action={(
                <Link href="/quests?create=1" className="btn btn--primary">
                  Create quest
                </Link>
              )}
            />
          )}

          {/* UP NEXT — compact numbered rows */}
          <section aria-label="Up next">
            <div className="sec-head">
              <h3>Up next</h3>
              <Link className="link-btn" href="/quests">
                All quests <Icon id="i-arrow-r" />
              </Link>
            </div>
            {upNext.length > 0 ? (
              <div className="quest-list panel upnext">
                {upNext.map((q, i) => (
                  <QuestRow key={q.id} quest={q} index={i} onComplete={complete} lastResult={results[q.id] ?? null} checkDisabled={busyId === q.id} />
                ))}
              </div>
            ) : (
              !primary && (
                <EmptyState
                  message="No open quests. Create one to begin."
                  action={(
                    <Link href="/quests?create=1" className="btn btn--primary">
                      Create quest
                    </Link>
                  )}
                />
              )
            )}
          </section>
        </div>

        <aside className="today-side">
          {data.campaignSummary ? (
            <CampaignPreview
              title={data.campaignSummary.title}
              progressPct={data.campaignSummary.progressPct}
              milestones={milestones.map((m) => ({ name: m.title, done: m.status === "done", current: m.id === nextId }))}
              nextText={detail?.nextMilestone ? `Next: ${detail.nextMilestone.title}` : "Keep walking — the path unfolds."}
              onOpen={() => router.push("/campaigns")}
            />
          ) : (
            <EmptyState
              message={data.emptyHints.noCampaign ?? "No campaign yet."}
              action={(
                <Link href="/campaigns" className="btn btn--ghost">
                  Begin a journey
                </Link>
              )}
            />
          )}
          <div className="growth panel">
            <div className="sec-head" style={{ margin: 0 }}>
              <h3>Growth</h3>
            </div>
            <div className="attr-grid">
              {data.attributeSnapshot.map((a) => {
                const meta = ATTR_META[a.key] ?? { name: a.name, icon: "i-spark" as const };
                return (
                  <div className="attr-stat" key={a.key}>
                    <span className="attr-icon">
                      <Icon id={meta.icon} />
                    </span>
                    <div className="info">
                      <div className="name">
                        {a.name}
                        <em>Lv {a.level}</em>
                      </div>
                      <div className="attr-bar">
                        <i style={{ width: `${attrProgress(a.level ?? 1, a.xp ?? 0)}%` }} />
                        <i className={`attr-dot${(a.level ?? 0) >= 5 ? " is-accent" : ""}`} aria-hidden />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
