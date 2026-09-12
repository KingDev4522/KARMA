"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { useFocus } from "@/components/focus";
import type { Campaign, CompletionResponse, Quest } from "@/lib/types";
import { Companion, EnvStack, Hero, Icon } from "@/components/illustrations";
import { ATTR_META, LevelUpModal, QuestMasonryCard, QuestPrimary, burstAt } from "@/components/quests";
import { CampaignPreview } from "@/components/journey";
import { EmptyState, ErrorState, SignInPrompt, Skeleton, useNowDate } from "@/components/States";

/** Today — hero display, primary quest, progression, masonry, campaign, growth. */
export default function TodayPage() {
  const { authHeaders, userId, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { focusSeq } = useFocus();
  const { data, error, loading, retry } = useApi(() => client.getToday(authHeaders()), [userId, focusSeq], {
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
      toast(`“${q.title.length > 32 ? `${q.title.slice(0, 32)}…` : q.title}” complete · +${r.rewardXp} XP`, "i-check");
      if (r.leveledUp) setCeremony(r);
      retry();
      window.dispatchEvent(new CustomEvent("liferpg:refresh"));
    } catch (e) {
      toast(e instanceof Error ? e.message : "Quest couldn't be completed. Your progress was not changed.", "i-close");
    } finally {
      setBusyId(null);
    }
  };

  const g = data.greeting;
  const seen = new Set<string>();
  const flat: Quest[] = [];
  for (const q of [...data.buckets.pinned, ...data.buckets.dueToday, ...data.buckets.routine, ...data.buckets.campaign, ...data.quests]) {
    if (!seen.has(q.id) && q.status !== "completed") {
      seen.add(q.id);
      flat.push(q);
    }
  }
  if (data.spark && !seen.has(data.spark.id)) flat.push(data.spark);
  const primary = flat.find((q) => q.isPinned) ?? flat[0] ?? null;
  const masonry = flat.filter((q) => q !== primary).slice(0, 6);

  const pct = Math.min(100, Math.max(0, Math.round((g.xpProgress.intoLevel / Math.max(1, g.xpProgress.neededForNext)) * 100)));
  const ringC = 2 * Math.PI * 16;

  const detail = (campaignDetail ?? null) as Campaign | null;
  const milestones = (detail?.milestones ?? []).slice().sort((a, b) => a.orderIndex - b.orderIndex);
  const nextId = detail?.nextMilestone?.id ?? milestones.find((m) => m.status !== "done")?.id ?? null;

  return (
    <div className="page is-active">
      {ceremony && (
          <LevelUpModal
            level={ceremony.newLevel}
            message={`${ceremony.companion.message} A new rank: ${ceremony.newRankDisplay}.`}
            rankUp={ceremony.rankUp}
            onClose={() => setCeremony(null)}
          />
      )}

      {/* HERO */}
      <div className="today-hero">
        <div className="today-hero__text">
          <p className="eyebrow">
            <Icon id="i-flame" />
            <span>
              {todayDate} · {data.streak.current}-day streak
            </span>
          </p>
          <h2>
            Good {g.timeOfDay}, {g.heroName}.
          </h2>
          <p className="sub">Your next quest is ready.</p>
        </div>
        <div className="today-hero__art">
          <EnvStack />
          <div className="companion-fig">
            <Companion width="100%" />
          </div>
          <div className="hero-fig">
            <Hero width="100%" className="idle" />
          </div>
        </div>
      </div>

      <div className="today-grid">
        <div className="today-main">
          {primary ? (
            <QuestPrimary quest={primary} onComplete={complete} completing={busyId === primary.id} />
          ) : (
            <EmptyState message={data.emptyHints.allClear ?? "Every quest is stamped. The page rests."} />
          )}

          {/* PROGRESSION */}
          <div className="progression panel">
            <div className="prog-item">
              <div className="prog-ring">
                <svg width="44" height="44" viewBox="0 0 40 40" aria-hidden="true">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="var(--surface-3)" strokeWidth="4" />
                  <circle
                    cx="20" cy="20" r="16" fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={ringC} strokeDashoffset={ringC * (1 - pct / 100)} transform="rotate(-90 20 20)"
                  />
                </svg>
                <span>{g.heroLevel}</span>
              </div>
              <div>
                <div className="prog-label">Level</div>
                <div className="prog-value">{g.rank.display}</div>
              </div>
            </div>
            <div className="prog-sep" />
            <div className="xp-bar-wrap">
              <div className="prog-label">Experience</div>
              <div className="xp-bar">
                <i style={{ width: `${pct}%` }} />
              </div>
              <div className="xp-num">
                {g.xpProgress.intoLevel} / {g.xpProgress.neededForNext} XP
              </div>
            </div>
            <div className="prog-sep" />
            <div className="prog-item">
              <Icon id="i-flame" style={{ color: "var(--tint-yellow-d)" }} />
              <div>
                <div className="prog-label">Streak</div>
                <div className="prog-value">{data.streak.current} days</div>
              </div>
            </div>
            <div className="prog-sep" />
            <div className="prog-item">
              <Icon id="i-coin" style={{ color: "var(--gold)" }} />
              <div>
                <div className="prog-label">Coins</div>
                <div className="prog-value">{g.coins.toLocaleString("en-US")}</div>
              </div>
            </div>
          </div>

          {/* MASONRY */}
          <section aria-label="Your quests">
            <div className="sec-head">
              <h3>Your quests</h3>
              <Link className="link-btn" href="/quests">
                All quests <Icon id="i-arrow-r" />
              </Link>
            </div>
            {masonry.length > 0 ? (
              <div className="quest-masonry">
                {masonry.map((q, i) => (
                  <QuestMasonryCard key={q.id} quest={q} index={i} onComplete={complete} />
                ))}
              </div>
            ) : (
              !primary && <EmptyState message="No open quests. Create one to begin." />
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
            <EmptyState message={data.emptyHints.noCampaign ?? "No campaign yet."} />
          )}
          <div className="growth panel">
            <div className="sec-head" style={{ margin: 0 }}>
              <h3>Character Growth</h3>
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
                        <i style={{ width: `${Math.min(100, Math.round(((a.xp % 500) / 500) * 100))}%` }} />
                      </div>
                      {a.recent && (
                        <div className="name" style={{ fontWeight: 400, opacity: 0.75 }} title={a.recent.questTitle}>
                          +{a.recent.gain} from {a.recent.questTitle.length > 22 ? `${a.recent.questTitle.slice(0, 22)}…` : a.recent.questTitle}
                        </div>
                      )}
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
