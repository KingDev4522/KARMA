"use client";

import { useState } from "react";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import type { StoreItem } from "@/lib/types";
import { EmptyState, ErrorState, Skeleton } from "@/components/States";

/** Store — ownership + equip state obvious (FE §13). Purchase → immediate equip transition. */
export default function StorePage() {
  const { authHeaders, userId } = useAuth();
  const { data, error, loading, retry } = useApi(() => client.store(authHeaders()), [userId]);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (loading) return <Skeleton label="Store" />;
  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (!data) return <EmptyState message="The store is unreachable right now." />;

  const buy = async (item: StoreItem) => {
    setBusy(item.id);
    setNotice(null);
    try {
      await client.purchase(authHeaders(), item.id);
      setNotice(`${item.name} acquired — equip it to change your identity.`);
      retry();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Purchase failed. Coins unchanged.");
    } finally {
      setBusy(null);
    }
  };

  const equip = async (item: StoreItem) => {
    setBusy(item.id);
    try {
      await client.equip(authHeaders(), item.id);
      setNotice(`${item.name} equipped.`);
      retry();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Couldn't equip.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Store</h1>
        <p className="text-lg text-coin" aria-label={`${data.coins} coins`}>◉ {data.coins}</p>
      </header>
      {notice && <p role="status" className="rounded-xl bg-surface-elevated p-3 text-sm">{notice}</p>}
      <div className="grid gap-3 md:grid-cols-3">
        {data.items.map((item) => (
          <article key={item.id} className="rounded-xl bg-surface-card p-4 shadow-card" aria-label={`${item.name}, ${item.status}`}>
            <h2 className="font-medium">{item.name}</h2>
            <p className="text-xs text-ink-secondary">{item.description}</p>
            <p className="mt-1 text-xs text-ink-muted">{item.rarity} · ◉ {item.price}</p>
            <p className="mt-1 text-xs font-semibold">
              {item.status === "equipped" ? "Equipped ✓" : item.status === "owned" ? "Owned" : item.status === "locked" ? "Locked — earn more coins" : "Available"}
            </p>
            <div className="mt-2 flex gap-2">
              {!item.owned ? (
                <button
                  onClick={() => buy(item)}
                  disabled={busy === item.id || item.status === "locked"}
                  className="rounded-lg bg-xp px-3 py-1.5 text-sm font-semibold text-surface-bg disabled:opacity-50"
                >
                  {busy === item.id ? "…" : "Buy"}
                </button>
              ) : !item.equipped ? (
                <button onClick={() => equip(item)} disabled={busy === item.id} className="rounded-lg border border-xp/50 px-3 py-1.5 text-sm">
                  {busy === item.id ? "…" : "Equip"}
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
