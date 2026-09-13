"use client";

import { useEffect, useState } from "react";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import { useToast } from "@/components/toast";
import type { StoreItem } from "@/lib/types";
import { Companion, EnvStack, Hero, Icon, CoinImg, TitleBox } from "@/components/illustrations";
import { burstAt, shakeCoins } from "@/components/quests";
import { EmptyState, ErrorState, SignInPrompt, Skeleton } from "@/components/States";

const CAT_LABEL: Record<string, string> = {
  hero_skin: "Character Skins",
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

function getItemLore(item: StoreItem): { lore: string; perk: string; slotLabel: string } {
  const type = item.itemType;
  const name = item.name.toLowerCase();

  if (type === "hero_skin") {
    return {
      lore: "Woven for travelers of quiet discipline and focused resolve. Radiates calm mastery across your profile, hero card, and daily quest logs. Transcends the ordinary through meticulous inkwork.",
      perk: "Primary Character Appearance & Profile Avatar",
      slotLabel: "Hero Attire",
    };
  }
  if (type === "companion") {
    if (name.includes("dragon")) {
      return {
        lore: "Forged in primordial embers above the highest peaks. The Dragon radiates quiet warmth, illuminating dark trials and keeping loyal vigil over every conquered milestone.",
        perk: "Rare Companion Aura & Celebration Companion",
        slotLabel: "Loyal Companion",
      };
    }
    if (name.includes("otter")) {
      return {
        lore: "A spirit of joyous curiosity and boundless playfulness. Reminds the traveler that true discipline and craft find delight in every single step of the path.",
        perk: "Playful Companion & Sidebar Presence",
        slotLabel: "Loyal Companion",
      };
    }
    if (name.includes("panda")) {
      return {
        lore: "The embodiment of centered stillness and unwavering calm. Anchors your focus during long hours of deep creative immersion and quiet work.",
        perk: "Serene Companion & Focus Guide",
        slotLabel: "Loyal Companion",
      };
    }
    if (name.includes("penguin")) {
      return {
        lore: "Dapper voyager of crystalline polar waters. Stands composed through the coldest routines and steepest climbs.",
        perk: "Resolute Companion & Focus Guide",
        slotLabel: "Loyal Companion",
      };
    }
    return {
      lore: "A devoted companion of rare pedigree. Walks silently beside you across all realms, keeping vigil over your focus sessions and celebrating your victories.",
      perk: "Companion Display & Ambient Sidebar Presence",
      slotLabel: "Loyal Companion",
    };
  }
  if (type === "frame") {
    return {
      lore: "Handcrafted architectural frame inspired by sacred temple sanctuaries. Bestows undeniable prestige and presence to your likeness in the Hall of Records.",
      perk: "Dresses Profile Picture across the entire realm",
      slotLabel: "Portrait Frame",
    };
  }
  if (type === "title") {
    return {
      lore: "An inscribed heraldic mantle bearing your chosen name. Carved with timeless symmetry to command respect across every quest record and hero ledger.",
      perk: "Framed Nameplate on Profile & Leaderboards",
      slotLabel: "Title Mantle",
    };
  }
  if (type === "nameplate") {
    return {
      lore: "Precision engraved nameplate forged from cold silver and obsidian. Seals your identity with editorial clarity.",
      perk: "Custom Name Header on Hero Card",
      slotLabel: "Engraved Nameplate",
    };
  }
  if (type === "effect") {
    return {
      lore: "Cosmic kinetic particles that ignite upon quest completions. A visual crescendo honoring your sustained focus and unbroken habits.",
      perk: "Completion Burst FX & Level-Up Radiance",
      slotLabel: "XP Visual Effect",
    };
  }
  if (type === "realm") {
    return {
      lore: "Dynamic atmospheric horizons that mirror the quiet rhythm of day and night. Transforms your digital sanctuary into living art.",
      perk: "Interactive Realm Backdrop & Scenery",
      slotLabel: "Realm Scenery",
    };
  }
  return {
    lore: item.description || "An exquisite artifact forged for the dedicated traveler. Elevates your aesthetic journey through the realm.",
    perk: "Cosmetic Enhancement & Profile Display",
    slotLabel: CAT_LABEL[item.itemType] ?? item.itemType,
  };
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
          <Icon id="i-trophy" style={{ width: 22, height: 22, color: "var(--text)", position: "absolute" }} />
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

/** Full-Screen Immersive Showcase for store treasures. */
function StoreShowcaseScreen({
  item,
  items,
  coins,
  onClose,
  onSelect,
  onBuy,
  onEquip,
  busyId,
}: {
  item: StoreItem;
  items: StoreItem[];
  coins: number;
  onClose: () => void;
  onSelect: (item: StoreItem) => void;
  onBuy: (item: StoreItem, el: HTMLElement | null) => Promise<void>;
  onEquip: (item: StoreItem) => Promise<void>;
  busyId: string | null;
}) {
  const currentIndex = items.findIndex((i) => i.id === item.id);
  const prevItem = currentIndex > 0 ? items[currentIndex - 1] : null;
  const nextItem = currentIndex >= 0 && currentIndex < items.length - 1 ? items[currentIndex + 1] : null;
  const lore = getItemLore(item);
  const label = CAT_LABEL[item.itemType] ?? item.itemType;

  // Keyboard navigation & prevent background scrolling
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && prevItem) {
        onSelect(prevItem);
      } else if (e.key === "ArrowRight" && nextItem) {
        onSelect(nextItem);
      }
    };
    window.addEventListener("keydown", onKey);
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = origOverflow;
    };
  }, [prevItem, nextItem, onClose, onSelect]);

  return (
    <div className="store-showcase-screen" role="dialog" aria-modal="true" aria-label={`Showcase: ${item.name}`}>
      {/* Sticky top bar */}
      <header className="showcase-topbar">
        <button className="showcase-back-btn" onClick={onClose} aria-label="Return to store shelf">
          <span>←</span> Back to Store <span className="showcase-kbd">ESC</span>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="coin-pill" title="Your coin balance" style={{ margin: 0 }}>
            <CoinImg size={16} />
            <span className="coin-val">{coins.toLocaleString("en-US")}</span>
          </div>
          <button className="showcase-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
      </header>

      {/* Main cinematic showcase */}
      <main className="showcase-main">
        {/* Left: Visual Stage */}
        <div className="showcase-stage">
          {isRaster(item) ? (
            item.itemType === "title" ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%", maxWidth: 360 }}>
                <TitleBox boxSrc={rasterSrc(item)} name="Traveler" />
                <span className="meta" style={{ color: "rgba(255,255,255,0.6)" }}>Live Title Plate Preview</span>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={rasterSrc(item)} alt={item.name} className="showcase-stage-art" />
            )
          ) : (
            <div style={{ transform: "scale(1.5)", transformOrigin: "center" }}>
              <Preview item={item} />
            </div>
          )}
        </div>

        {/* Right: Narrative & Action Column */}
        <div className="showcase-narrative">
          <div className="showcase-meta-row">
            <span className="showcase-badge">{item.rarity.toUpperCase()}</span>
            <span className="showcase-badge">{label}</span>
            {item.equipped ? (
              <span className="showcase-badge badge--equipped">Equipped</span>
            ) : item.owned ? (
              <span className="showcase-badge" style={{ borderColor: "#FFFFFF", color: "#FFFFFF" }}>Owned</span>
            ) : null}
          </div>

          <h1 className="showcase-title">{item.name}</h1>

          <div className="showcase-lore-box">
            <p className="showcase-lore-quote">“{lore.lore}”</p>
            <p className="showcase-lore-desc">{item.description}</p>
          </div>

          <div className="showcase-specs">
            <div className="showcase-spec-cell">
              <div className="showcase-spec-label">Slot Category</div>
              <div className="showcase-spec-val">{lore.slotLabel}</div>
            </div>
            <div className="showcase-spec-cell">
              <div className="showcase-spec-label">Rarity Tier</div>
              <div className="showcase-spec-val capitalize">{item.rarity}</div>
            </div>
            <div className="showcase-spec-cell" style={{ gridColumn: "span 2" }}>
              <div className="showcase-spec-label">Aesthetic Impact</div>
              <div className="showcase-spec-val">{lore.perk}</div>
            </div>
          </div>

          {/* Action / Buy Card */}
          <div className="showcase-action-card">
            {item.equipped ? (
              <>
                <div>
                  <strong style={{ display: "block", fontSize: 15, fontWeight: 700 }}>Currently Active</strong>
                  <span style={{ fontSize: 12.5, color: "#9E9E9E" }}>Worn across your profile, hero card, and codex</span>
                </div>
                <span className="showcase-badge badge--equipped" style={{ fontSize: 13, padding: "10px 22px" }}>
                  ✓ Equipped
                </span>
              </>
            ) : item.owned ? (
              <>
                <div>
                  <strong style={{ display: "block", fontSize: 15, fontWeight: 700 }}>In Your Collection</strong>
                  <span style={{ fontSize: 12.5, color: "#9E9E9E" }}>Ready to wear anytime</span>
                </div>
                <button
                  className="showcase-btn-primary"
                  disabled={busyId === item.id}
                  onClick={() => onEquip(item)}
                >
                  {busyId === item.id ? "Equipping…" : "Equip to Profile"}
                </button>
              </>
            ) : (
              <>
                <div>
                  <div className="showcase-price-tag">
                    <CoinImg size={22} />
                    <span>{item.price.toLocaleString("en-US")}</span>
                  </div>
                  <span style={{ fontSize: 12, color: coins >= item.price ? "#9E9E9E" : "#D64545" }}>
                    {coins >= item.price
                      ? `Balance: ${coins.toLocaleString("en-US")} coins`
                      : `Need ${(item.price - coins).toLocaleString("en-US")} more coins`}
                  </span>
                </div>
                <button
                  className="showcase-btn-primary"
                  disabled={busyId === item.id || coins < item.price}
                  onClick={(e) => onBuy(item, e.currentTarget)}
                >
                  {busyId === item.id
                    ? "Acquiring…"
                    : coins >= item.price
                    ? "Acquire Gift"
                    : "Insufficient Coins"}
                </button>
              </>
            )}
          </div>

          {/* Carousel Navigation */}
          {items.length > 1 && (
            <div className="showcase-carousel-nav">
              <button
                className="showcase-nav-btn"
                disabled={!prevItem}
                onClick={() => prevItem && onSelect(prevItem)}
                style={{ opacity: prevItem ? 1 : 0.35, cursor: prevItem ? "pointer" : "not-allowed" }}
              >
                <span>‹</span> Previous Gift
              </button>
              <span className="meta" style={{ color: "#7A7A7A" }}>
                {currentIndex + 1} of {items.length}
              </span>
              <button
                className="showcase-nav-btn"
                disabled={!nextItem}
                onClick={() => nextItem && onSelect(nextItem)}
                style={{ opacity: nextItem ? 1 : 0.35, cursor: nextItem ? "pointer" : "not-allowed" }}
              >
                Next Gift <span>›</span>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

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
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);

  // Keep selected item reactive with server updates (e.g. after buy or equip)
  useEffect(() => {
    if (selectedItem && data?.items) {
      const refreshed = data.items.find((i) => i.id === selectedItem.id);
      if (refreshed) setSelectedItem(refreshed);
    }
  }, [data?.items, selectedItem]);

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
      if (el) burstAt(el);
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
          <p className="sub">Spend what you&apos;ve earned. Equip what feels like you. Click any treasure to view in full screen.</p>
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
        <CollectionView
          onChanged={() => {
            retry();
            window.dispatchEvent(new CustomEvent("liferpg:refresh"));
          }}
          onSelectItem={(it) => setSelectedItem(it)}
        />
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
                  <div
                    className="store-item"
                    key={it.id}
                    onClick={() => setSelectedItem(it)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedItem(it);
                      }
                    }}
                    title="Click to view showcase in full screen"
                  >
                    <div className="si-preview" style={undefined} title={it.description}>
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
                        <button
                          className="si-buy"
                          onClick={(e) => {
                            e.stopPropagation();
                            void equip(it);
                          }}
                          disabled={busyId === it.id}
                        >
                          {busyId === it.id ? "…" : "Equip"}
                        </button>
                      ) : (
                        <button
                          className="si-buy"
                          disabled={busyId === it.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            void buy(it, e.currentTarget as HTMLElement);
                          }}
                        >
                          {busyId === it.id ? (
                            "…"
                          ) : (
                            <>
                              <CoinImg size={14} />
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

      {/* Full-Screen Immersive Showcase Overlay */}
      {selectedItem && (
        <StoreShowcaseScreen
          item={selectedItem}
          items={items}
          coins={data.coins}
          onClose={() => setSelectedItem(null)}
          onSelect={(newItem) => setSelectedItem(newItem)}
          onBuy={buy}
          onEquip={equip}
          busyId={busyId}
        />
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
function CollectionView({
  onChanged,
  onSelectItem,
}: {
  onChanged: () => void;
  onSelectItem?: (item: StoreItem) => void;
}) {
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
        const itemObj: StoreItem | null = e.item
          ? {
              id: e.itemId,
              itemType: e.item.itemType,
              key: e.item.key ?? e.itemId,
              name: e.item.name ?? "Item",
              description: e.item.description ?? "",
              assetPath: e.item.assetPath ?? "",
              preview: e.item.assetPath ?? "",
              price: e.item.price ?? 0,
              rarity: e.item.rarity ?? "common",
              owned: true,
              equipped: isEq,
              status: isEq ? "equipped" : "owned",
            }
          : null;

        return (
          <li
            key={`${e.userId}-${e.itemId}`}
            className="store-item"
            onClick={() => {
              if (itemObj && onSelectItem) onSelectItem(itemObj);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(evt) => {
              if (evt.key === "Enter" || evt.key === " ") {
                evt.preventDefault();
                if (itemObj && onSelectItem) onSelectItem(itemObj);
              }
            }}
            title="Click to view showcase in full screen"
          >
            <div className="si-body">
              <div>
                <strong>{e.item?.name ?? "Item"}</strong>
                <div className="si-cat capitalize">{(e.item?.itemType ?? "").replace(/_/g, " ")} · {e.item?.rarity}</div>
              </div>
              {isEq ? (
                <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span className="si-buy equipped">Equipped</span>
                  {slot && (
                    <button
                      className="si-buy"
                      disabled={busy === e.itemId}
                      onClick={(evt) => {
                        evt.stopPropagation();
                        void act(e.itemId, () => client.unequip(authHeaders(), slot), "Unequipped");
                      }}
                    >
                      {busy === e.itemId ? "…" : "Remove"}
                    </button>
                  )}
                </span>
              ) : (
                <button
                  className="si-buy"
                  disabled={busy === e.itemId}
                  onClick={(evt) => {
                    evt.stopPropagation();
                    void act(e.itemId, () => client.equip(authHeaders(), e.itemId), `${e.item?.name ?? "Item"} equipped`);
                  }}
                >
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
