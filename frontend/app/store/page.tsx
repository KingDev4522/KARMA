"use client";

import { useState } from "react";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import { useToast } from "@/components/toast";
import type { StoreItem } from "@/lib/types";
import { Companion, EnvStack, Hero, Icon, CoinImg } from "@/components/illustrations";
import { burstAt, shakeCoins } from "@/components/quests";
import { EmptyState, ErrorState, SignInPrompt, Skeleton } from "@/components/States";

const CAT_LABEL: Record<string, string> = {
  hero_skin: "Hero Skins",
  companion: "Companions",
  frame: "Frames",
  title: "Titles",
  nameplate: "Nameplates",
  realm: "Realm Themes",
  effect: "XP Effects",
  companion_emote: "Companion Emotes",
  quest_skin: "Quest Skins",
  badge_case: "Badge Cases",
  hero_card: "Hero Card Themes",
};

/** True when the item carries real raster art (hero/companions/frames). */
function isRaster(item: StoreItem): boolean {
  const p = (item as StoreItem & { assetPath?: string; preview?: string }).assetPath
    ?? (item as StoreItem & { preview?: string }).preview
    ?? "";
  return /\.(jpe?g|png|webp)$/i.test(p);
}

function rasterSrc(item: StoreItem): string {
  const m = item as StoreItem & { assetPath?: string; preview?: string };
  return m.assetPath ?? m.preview ?? "";
}

function Preview({ item }: { item: StoreItem }) {
  if (isRaster(item)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={rasterSrc(item)} alt={item.name} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />;
  }
  switch (item.itemType) {
    case "frame":
      return <div className="frame-ring" />;
    case "badge_case":
      return (
        <div className="frame-ring">
          <Icon id="i-trophy" style={{ width: 22, height: 22, color: "var(--gold)", position: "absolute" }} />
        </div>
      );
    case "title":
      return <span className="preview-title">{item.name}</span>;
    case "nameplate":
      return <span className="plate">{item.name.toUpperCase().slice(0, 14)}</span>;
    case "realm":
      return <EnvStack />;
    case "effect":
      return (
        <div className="fx-sparks">
          <Icon id="i-spark" style={{ width: 64, height: 64, top: 0, left: 0 }} />
          <Icon id="i-spark" style={{ width: 30, height: 30, bottom: 0, right: 0, animationDirection: "reverse" }} />
        </div>
      );
    case "companion_emote":
      return (
        <div className="emote-face">
          <Companion width={74} />
        </div>
      );
    case "quest_skin":
      return (
        <div className="skin-card">
          <i />
          <i />
          <i style={{ width: "45%" }} />
        </div>
      );
    case "hero_card":
      return (
        <div className="mini-card">
          <Hero width={52} />
        </div>
      );
    default:
      return <div className="frame-ring" />;
  }
}

const PREVIEW_BG: Record<string, string> = {
  "Hero Skins": "",
  Companions: "",
  Frames: "tint-coral",
  Titles: "tint-yellow",
  Nameplates: "tint-cream",
  "Realm Themes": "",
  "XP Effects": "tint-lavender",
  "Companion Emotes": "tint-sage",
  "Quest Skins": "tint-sky",
  "Hero Card Themes": "tint-yellow",
  "Badge Cases": "tint-cream",
};

/** Store — spend earned coins, equip identity. Fully server-driven. */
export default function StorePage() {
  const { authHeaders, userId, loading: authLoading } = useAuth();
  const toast = useToast();
  const { data, error, loading, retry } = useApi(() => client.store(authHeaders()), [userId], {
    enabled: !authLoading && !!userId,
  });
  const [cat, setCat] = useState("All");
  const [view, setView] = useState<"market" | "collection">("market");
  const [busyId, setBusyId] = useState<string | null>(null);

  if (authLoading || loading) return <Skeleton label="Store" rows={3} />;
  if (!userId) return <SignInPrompt />;
  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (!data) return <EmptyState message="The store is unreachable right now." />;

  const cats = ["All", ...Array.from(new Set(data.items.map((i) => CAT_LABEL[i.itemType] ?? i.itemType)))];
  const items = data.items.filter((i) => cat === "All" || (CAT_LABEL[i.itemType] ?? i.itemType) === cat);

  const buy = async (item: StoreItem, el: HTMLElement | null) => {
    if (busyId || item.owned) return;
    if (data.coins < item.price) {
      shakeCoins();
      toast("Not enough coins — complete quests to earn more", "i-coin");
      return;
    }
    setBusyId(item.id);
    try {
      await client.purchase(authHeaders(), item.id);
      burstAt(el);
      void import("@/lib/sound").then((s) => s.playPurchase()).catch(() => undefined);
      toast(`${item.name} unlocked — equip it in your Realm`, "i-spark");
      retry();
      window.dispatchEvent(new CustomEvent("liferpg:refresh"));
    } catch (e) {
      toast(e instanceof Error ? e.message : "Purchase failed. Coins unchanged.", "i-close");
    } finally {
      setBusyId(null);
    }
  };

  const equip = async (item: StoreItem) => {
    if (busyId || item.equipped) return;
    setBusyId(item.id);
    try {
      await client.equip(authHeaders(), item.id);
      void import("@/lib/sound").then((s) => s.playPurchase()).catch(() => undefined);
      toast(`${item.name} equipped`, "i-check");
      retry();
      window.dispatchEvent(new CustomEvent("liferpg:refresh"));
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't equip.", "i-close");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page is-active">
      <div className="page-head">
        <div>
          <h2>Store</h2>
          <p className="sub">Spend what you&apos;ve earned. Equip what feels like you.</p>
        </div>
        <div className="coin-pill" title="Your coins" aria-label={`${data.coins} coins`} style={{ alignSelf: "center" }}>
          <CoinImg size={16} />
          <span className="coin-val">{data.coins.toLocaleString("en-US")}</span>
        </div>
      </div>

      <div className="store-cats" role="tablist" aria-label="Store views">
        <button role="tab" aria-selected={view === "market"} className={`chip${view === "market" ? " is-on" : ""}`} onClick={() => setView("market")}>
          Market
        </button>
        <button role="tab" aria-selected={view === "collection"} className={`chip${view === "collection" ? " is-on" : ""}`} onClick={() => setView("collection")}>
          Collection
        </button>
      </div>

      {view === "collection" ? (
        <CollectionView onChanged={() => { retry(); window.dispatchEvent(new CustomEvent("liferpg:refresh")); }} />
      ) : (
        <>
          <div className="store-cats">
            {cats.map((c) => (
              <button key={c} className={`chip${cat === c ? " is-on" : ""}`} onClick={() => setCat(c)} aria-pressed={cat === c}>
                {c}
              </button>
            ))}
          </div>

          {items.length === 0 ? (
            <EmptyState message="Nothing on this shelf yet." />
          ) : (
            <div className="store-grid">
              {items.map((it) => {
            const label = CAT_LABEL[it.itemType] ?? it.itemType;
            return (
              <div className="store-item" key={it.id}>
                <div className="si-preview" style={PREVIEW_BG[label] ? { background: `var(--${PREVIEW_BG[label]})` } : undefined} title={it.description}>
                  <Preview item={it} />
                </div>
                <div className="si-body">
                  <div>
                    <strong>{it.name}</strong>
                    <span className="si-rare" style={{ marginTop: 4 }}>{it.rarity}</span>
                    <div className="si-cat">{label}</div>
                    <div className="si-cat" style={{ opacity: 0.75 }}>
                      {it.equipped ? "Equipped" : it.owned ? "Owned — equip it" : data.coins < it.price ? `Locked · need ${(it.price - data.coins).toLocaleString("en-US")} more` : "Available"}
                    </div>
                  </div>
                  {it.equipped ? (
                    <span className="si-buy equipped">Equipped</span>
                  ) : it.owned ? (
                    <button className="si-buy" onClick={() => equip(it)} disabled={busyId === it.id}>
                      {busyId === it.id ? "…" : "Equip"}
                    </button>
                  ) : (
                    <button
                      className="si-buy"
                      disabled={busyId === it.id}
                      onClick={(e) => buy(it, e.currentTarget as HTMLElement)}
                    >
                      {busyId === it.id ? (
                        "…"
                      ) : (
                        <>
                          <Icon id="i-coin" />
                          {it.price.toLocaleString("en-US")}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}
    </div>
  );
}

// Mirrors backend RESOLVED_SLOT (inventory service): nameplates share the frame slot.
const SLOT_FOR: Record<string, string> = {
  hero_skin: "heroSkinItemId",
  companion: "companionItemId",
  frame: "frameItemId",
  title: "titleItemId",
  nameplate: "frameItemId",
  realm: "realmItemId",
  effect: "effectItemId",
  companion_emote: "companionEmoteItemId",
  quest_skin: "questSkinItemId",
  badge_case: "badgeCaseItemId",
  hero_card: "heroCardItemId",
};

/** Collection — everything owned, with equip / unequip loadout control. */
function CollectionView({ onChanged }: { onChanged: () => void }) {
  const { authHeaders, userId, loading: authLoading } = useAuth();
  const toast = useToast();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, loading, retry } = useApi<any>(() => client.inventory(authHeaders()), [userId], {
    enabled: !authLoading && !!userId,
  });
  const [busy, setBusy] = useState<string | null>(null);

  if (loading) return <Skeleton label="Collection" />;
  if (error) return <ErrorState error={error} onRetry={retry} />;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries = ((data?.items ?? []) as any[]);
  const loadout = (data?.loadout ?? {}) as Record<string, string | null>;
  const equipped = new Set(Object.values(loadout).filter((v): v is string => typeof v === "string"));

  const act = async (id: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(id);
    try {
      await fn();
      void import("@/lib/sound").then((s) => s.playPurchase()).catch(() => undefined);
      toast(ok, "i-check");
      retry();
      onChanged();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Loadout unchanged.", "i-close");
    } finally {
      setBusy(null);
    }
  };

  if (entries.length === 0) {
    return <EmptyState message="No treasures yet. Earn coins from quests, then acquire something here." />;
  }
  return (
    <ul className="store-grid">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {entries.map((e: any) => {
        const isEq = equipped.has(e.itemId);
        const slot = SLOT_FOR[e.item?.itemType] ?? null;
        return (
          <li key={`${e.userId}-${e.itemId}`} className="store-item">
            <div className="si-body">
              <div>
                <strong>{e.item?.name ?? "Item"}</strong>
                <div className="si-cat capitalize">{(e.item?.itemType ?? "").replace(/_/g, " ")} · {e.item?.rarity}</div>
              </div>
              {isEq ? (
                <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span className="si-buy equipped">Equipped</span>
                  {slot && (
                    <button className="si-buy" disabled={busy === e.itemId} onClick={() => act(e.itemId, () => client.unequip(authHeaders(), slot), "Unequipped")}>
                      {busy === e.itemId ? "…" : "Remove"}
                    </button>
                  )}
                </span>
              ) : (
                <button className="si-buy" disabled={busy === e.itemId} onClick={() => act(e.itemId, () => client.equip(authHeaders(), e.itemId), `${e.item?.name ?? "Item"} equipped`)}>
                  {busy === e.itemId ? "…" : "Equip"}
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
