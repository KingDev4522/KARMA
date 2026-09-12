"use client";

import { useState } from "react";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import type { StoreItem } from "@/lib/types";
import { StoreItemCard } from "@/components/world";
import { CoinPurse } from "@/components/rpg";
import { SectionHeading, useToast } from "@/components/ui";
import { EmptyState, ErrorState, Skeleton } from "@/components/States";

/** Store — identity marketplace with inventory feel and instant confirmation. */
const GROUPS = ["frame", "title", "nameplate", "realm", "effect", "companion_emote", "quest_skin", "badge_case", "hero_card"] as const;

export default function StorePage() {
  const { authHeaders, userId } = useAuth();
  const toast = useToast();
  const { data, error, loading, retry } = useApi(() => client.store(authHeaders()), [userId]);
  const [busy, setBusy] = useState<string | null>(null);

  if (loading) return <Skeleton label="Store" rows={4} />;
  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (!data) return <EmptyState message="The market is unreachable right now." />;

  const buy = async (item: StoreItem) => {
    setBusy(item.id);
    try {
      await client.purchase(authHeaders(), item.id);
      toast({ title: `${item.name} acquired`, body: "Equip it to change your identity.", tone: "coin" });
      retry();
    } catch (e) {
      toast({ title: "Purchase failed", body: e instanceof Error ? e.message : "Coins unchanged.", tone: "bad" });
    } finally {
      setBusy(null);
    }
  };

  const equip = async (item: StoreItem) => {
    setBusy(item.id);
    try {
      await client.equip(authHeaders(), item.id);
      toast({ title: `${item.name} equipped`, body: "Your realm already looks different.", tone: "xp" });
      retry();
    } catch (e) {
      toast({ title: "Couldn't equip", body: e instanceof Error ? e.message : "", tone: "bad" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeading title="Identity market" />
        <CoinPurse coins={data.coins} />
      </div>
      {GROUPS.map((g) => {
        const items = data.items.filter((i) => i.itemType === g);
        if (!items.length) return null;
        return (
          <section key={g} aria-label={g.replace(/_/g, " ")}>
            <h2 className="mb-2 text-sm font-semibold capitalize text-ink-secondary">{g.replace(/_/g, " ")}</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => (
                <StoreItemCard key={item.id} item={item} onBuy={() => buy(item)} onEquip={() => equip(item)} busy={busy === item.id} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
