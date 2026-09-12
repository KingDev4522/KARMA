"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import { HeroFigure, HeroScene, AchievementCard } from "@/components/world";
import { AttributeStat, LevelBadge, RankBadge, Streak, XpBar } from "@/components/rpg";
import { SectionHeading } from "@/components/ui";
import { EmptyState, ErrorState, SignInPrompt, Skeleton } from "@/components/States";

/** Realm — premium character showcase, not a settings page. */
export default function RealmPage() {
  const { authHeaders, userId, loading: authLoading } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, loading, retry } = useApi<any>(() => client.realm(authHeaders()), [userId], {
    enabled: !authLoading && !!userId,
  });

  if (authLoading || loading) return <Skeleton label="Realm" rows={4} />;
  if (!userId) return <SignInPrompt />;
  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (!data) return <EmptyState message="Your realm is unformed. Complete a quest to begin." />;

  const attrs = (data.attributes ?? []) as { key: string; xp: number; level: number }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unlocked = ((data.achievements?.unlocked ?? []) as any[]).slice(0, 6);

  return (
    <div className="space-y-6">
      <HeroScene timeOfDay="evening">
        <div className="flex flex-col items-center gap-4 p-6 text-center md:flex-row md:text-left">
          <HeroFigure assetId={data.hero?.heroAssetId} size={150} companion="companion" companionMood="idle" />
          <div className="flex-1">
            <h1 className="font-display text-3xl">{data.hero?.name ?? data.hero?.displayName ?? "Unnamed Hero"}</h1>
            {data.hero?.bio && <p className="mt-1 max-w-[50ch] text-sm text-ink-secondary">{data.hero.bio}</p>}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 md:justify-start">
              {data.rank && <RankBadge display={data.rank.display} />}
              <Streak current={data.progression?.currentStreak ?? 0} best={data.progression?.bestStreak ?? 0} />
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-card border border-line/60 bg-surface-elevated/80 p-3 backdrop-blur">
            <LevelBadge level={data.progression?.level ?? 1} />
            <div className="w-36">
              <XpBar pct={data.heroCard?.xpProgress?.pct ?? 0} label="Hero XP progress" glow />
            </div>
          </div>
        </div>
      </HeroScene>

      <section aria-label="Attributes">
        <SectionHeading title="Attribute constellation" />
        <div className="grid gap-3 rounded-panel border border-line bg-surface-card p-5 shadow-card sm:grid-cols-2">
          {attrs.map((a) => (
            <AttributeStat key={a.key} attrKey={a.key} level={a.level} xp={a.xp} />
          ))}
        </div>
      </section>

      <section aria-label="Achievements">
        <SectionHeading
          title="Collections"
          action={
            <Link href="/chronicle" className="inline-flex items-center gap-1 text-sm font-medium text-xp">
              Full chronicle <ArrowRight size={14} aria-hidden />
            </Link>
          }
        />
        {unlocked.length === 0 ? (
          <EmptyState message="Your first badge is one Quest away." />
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {unlocked.map((a: any) => (
              <AchievementCard key={a.key} name={a.name} description={a.description} />
            ))}
          </div>
        )}
      </section>

      <Link href="/hero-card" className="block rounded-card bg-xp p-4 text-center font-semibold text-white pressable">
        View collectible Hero Card
      </Link>
    </div>
  );
}
