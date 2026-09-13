"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { AvatarImg, CompanionImage, FrameWrap, HeroImage, Icon, TitleBox } from "@/components/illustrations";
import { COMPANIONS, FREE_COMPANIONS, HEROES, avatarAssetIdFor, heroAssetId, isPhotoAvatar, resolveHero } from "@/lib/identity";
import { EmptyState, ErrorState, SignInPrompt, Skeleton } from "@/components/States";

type WardrobeTab = "heroes" | "companions" | "frames" | "titles" | "avatar" | "identity";

/**
 * Personalize — the luxury dressing room and character sanctum.
 * Clean, unboxed editorial layout with live hero pedestal and responsive wardrobe racks.
 */
export default function PersonalizePage() {
  const { authHeaders, userId, loading: authLoading } = useAuth();
  const toast = useToast();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: me, error: meError, loading: meLoading, retry: retryMe } = useApi<any>(() => client.getProfile(authHeaders()), [userId], {
    enabled: !authLoading && !!userId,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inv, error: invError, loading: invLoading, retry: retryInv } = useApi<any>(() => client.inventory(authHeaders()), [userId], {
    enabled: !authLoading && !!userId,
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WardrobeTab>("heroes");
  const [heroName, setHeroName] = useState<string | null>(null);
  const [compName, setCompName] = useState<string | null>(null);
  const [oath, setOath] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);

  const refresh = () => {
    retryMe();
    retryInv();
    window.dispatchEvent(new CustomEvent("liferpg:refresh"));
  };

  const run = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    if (busy) return;
    setBusy(key);
    try {
      await fn();
      toast(ok, "i-check");
      refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't save. Nothing was changed.", "i-close");
    } finally {
      setBusy(null);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries = useMemo(() => ((inv?.items ?? []) as any[]), [inv]);
  const loadout = (inv?.loadout ?? {}) as Record<string, string | null>;
  const byId = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m = new Map<string, any>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const e of entries) if (e?.item) m.set(e.itemId, e.item);
    return m;
  }, [entries]);
  const owned = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => (type: string) => entries.map((e: any) => e.item).filter((i: any) => i?.itemType === type),
    [entries],
  );
  const hasArt = (i: { assetPath?: string }) => /\.(jpe?g|png|webp)$/i.test(i?.assetPath ?? "");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const frames = (owned("frame") as any[]).filter(hasArt);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const boxes = (owned("title") as any[]).filter(hasArt);
  const equippedIds = useMemo(() => new Set(Object.values(loadout).filter((v): v is string => typeof v === "string")), [loadout]);

  if (authLoading || meLoading || invLoading) return <Skeleton label="Personalize" rows={4} />;
  if (!userId) return <SignInPrompt />;
  if (meError) return <ErrorState error={meError} onRetry={retryMe} />;
  if (invError) return <ErrorState error={invError} onRetry={retryInv} />;
  if (!me) return <EmptyState message="No hero yet." />;

  const profile = me.profile ?? {};
  const curHeroId: string | null = profile.heroAssetId ?? null;
  const curBase = resolveHero(curHeroId).hero.id;
  const curAvatar: string | null = profile.avatarAssetId ?? null;
  const curCompanion: string | null = profile.companionAssetId ?? null;
  const name = profile.heroName ?? profile.displayName ?? "Traveler";
  const frameAsset = (loadout.frameItemId && byId.get(loadout.frameItemId)?.assetPath) || null;
  const titleItem = (loadout.titleItemId && byId.get(loadout.titleItemId)) || null;
  const titleBoxAsset = titleItem?.assetPath?.endsWith(".jpeg") ? titleItem.assetPath : null;
  const skins = owned("hero_skin");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const companionItems: any[] = owned("companion");
  const ownedCompanionIds = new Set(companionItems.map((i) => i?.metadata?.companionAssetId).filter(Boolean));
  const ownedPremiumIds = ownedCompanionIds;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ownedTradSkins = new Set(skins.map((s: any) => s?.metadata?.heroAssetId).filter((v: unknown): v is string => typeof v === "string" && v.endsWith("-traditional")));

  const uploadPhoto = async (file: File | undefined) => {
    if (!file || !userId) return;
    setPhotoBusy(true);
    try {
      const { uploadAvatarPhoto } = await import("@/lib/avatar-upload");
      const url = await uploadAvatarPhoto(userId, file);
      await client.patchProfile(authHeaders(), { avatarAssetId: url });
      // Verify it actually stuck (re-read server state, don't trust the toast).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const check = (await client.getProfile(authHeaders()).catch(() => null)) as any;
      if (check?.profile?.avatarAssetId !== url) {
        throw new Error("Photo didn't stick on the server — try again, or update the app.");
      }
      toast("Profile picture updated — it's you everywhere now", "i-check");
      refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't upload photo.", "i-close");
    } finally {
      setPhotoBusy(false);
    }
  };

  return (
    <div className="page is-active">
      {/* Header */}
      <div className="page-head">
        <div>
          <h2>Personalize</h2>
          <p className="sub">Your dressing sanctum — character, companion, frames, names, and oath.</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link className="link-btn" href="/hero-card">Hero Card</Link>
          <Link className="link-btn" href="/store">Store</Link>
        </div>
      </div>

      <div className="personalize-studio">
        {/* Hero Dais Live Stage (Seamless, no ugly card box) */}
        <section className="studio-hero-stage" aria-label="Current Hero Sanctum">
          {/* Framed Avatar Pedestal with seamless photo upload trigger */}
          <div className="studio-avatar-pedestal" style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div className="studio-avatar-wrap">
              <FrameWrap frameSrc={frameAsset} label="Framed profile picture">
                <span style={{ display: "block", width: 120, borderRadius: 20, overflow: "hidden" }}>
                  <AvatarImg avatarAssetId={curAvatar} heroAssetId={curHeroId} width="100%" eager alt={name} />
                </span>
              </FrameWrap>
              {/* Photo Upload Floating Trigger Button */}
              <label className="studio-photo-trigger" title="Upload custom profile photo">
                <input
                  type="file"
                  accept="image/*"
                  aria-label="Upload custom profile photo"
                  style={{ display: "none" }}
                  disabled={photoBusy}
                  onChange={(e) => {
                    void uploadPhoto(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                {photoBusy ? "…" : <Icon id="i-spark" style={{ width: 15, height: 15 }} />}
              </label>
              <span style={{ display: "block", textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--text-3)", marginTop: 6, letterSpacing: ".08em" }}>
                PROFILE PICTURE
              </span>
            </div>
            <div className="studio-avatar-wrap">
              <span className="studio-character-box" style={{ display: "block", width: 120, aspectRatio: "1/1", borderRadius: 20, overflow: "hidden", border: "1px solid var(--border-strong)", background: "var(--surface-2)" }}>
                <HeroImage assetId={curHeroId} eager alt={`${name} — character`} />
              </span>
              <span style={{ display: "block", textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--text-3)", marginTop: 6, letterSpacing: ".08em" }}>
                CHARACTER
              </span>
            </div>
          </div>

          {/* Hero Identity Inscription */}
          <div className="studio-hero-info">
            <div className="studio-hero-title-row">
              <TitleBox boxSrc={titleBoxAsset} name={name} sub={profile.bio ?? null} />
              {curCompanion && (
                <span className="studio-companion-badge">
                  <CompanionImage assetId={curCompanion} width={40} alt={profile.companionName ?? "Companion"} />
                  <span>{profile.companionName || "Loyal Companion"}</span>
                </span>
              )}
            </div>

            <p className="studio-hero-oath">
              “{profile.bio || "No oath declared yet. Declare your singular focus in Identity & Oath below."}”
            </p>

            <div className="studio-status-line">
              <span>{equippedIds.size === 0 ? "Starter cosmetics active" : `${equippedIds.size} loadout items active`}</span>
              <span>·</span>
              <span>Synced server-side across all devices</span>
            </div>
          </div>
        </section>

        {/* Wardrobe Navigation Pill Tabs */}
        <nav className="studio-tabs" role="tablist" aria-label="Wardrobe sections">
          <button
            role="tab"
            aria-selected={activeTab === "heroes"}
            className={`studio-tab-btn${activeTab === "heroes" ? " is-active" : ""}`}
            onClick={() => setActiveTab("heroes")}
          >
            Character & Attire
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "companions"}
            className={`studio-tab-btn${activeTab === "companions" ? " is-active" : ""}`}
            onClick={() => setActiveTab("companions")}
          >
            Companions
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "frames"}
            className={`studio-tab-btn${activeTab === "frames" ? " is-active" : ""}`}
            onClick={() => setActiveTab("frames")}
          >
            Frames
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "titles"}
            className={`studio-tab-btn${activeTab === "titles" ? " is-active" : ""}`}
            onClick={() => setActiveTab("titles")}
          >
            Title Boxes
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "avatar"}
            className={`studio-tab-btn${activeTab === "avatar" ? " is-active" : ""}`}
            onClick={() => setActiveTab("avatar")}
          >
            Profile Picture
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "identity"}
            className={`studio-tab-btn${activeTab === "identity" ? " is-active" : ""}`}
            onClick={() => setActiveTab("identity")}
          >
            Identity & Oath
          </button>
        </nav>

        {/* ============================================================
            TAB 1: CHARACTER & ATTIRE
            ============================================================ */}
        {activeTab === "heroes" && (
          <div className="studio-content-section">
            <div className="studio-content-header">
              <div>
                <h3>Base Characters</h3>
                <p>Choose the core persona leading your journey. Unlock other characters in the Store.</p>
              </div>
            </div>

            <div className="studio-wardrobe-grid" style={{ marginBottom: 36 }}>
              {HEROES.map((h) => {
                const tradId = heroAssetId(h.id, "traditional");
                const unlocked = curBase === h.id || ownedTradSkins.has(tradId);
                const isSelected = curBase === h.id;

                if (!unlocked) {
                  return (
                    <Link
                      key={h.id}
                      href="/store"
                      className="studio-item-card"
                      title={`${h.name} · unlock in Store for 60 coins`}
                    >
                      <div className="studio-card-img-wrap" style={{ filter: "grayscale(1)", opacity: 0.65 }}>
                        <HeroImage assetId={tradId} width="100%" alt={`${h.name} (locked)`} />
                      </div>
                      <strong className="studio-card-name">{h.name}</strong>
                      <span className="studio-card-status" style={{ color: "#A0A0A0" }}>Unlock · 60 coins</span>
                    </Link>
                  );
                }

                return (
                  <button
                    key={h.id}
                    className={`studio-item-card${isSelected ? " is-selected" : ""}`}
                    disabled={busy === `hero-${h.id}`}
                    onClick={() => run(`hero-${h.id}`, () => client.patchProfile(authHeaders(), { heroAssetId: tradId }), `${h.name} leads your story`)}
                    title={`${h.name} · ${h.region}`}
                  >
                    {isSelected && <span className="studio-equipped-chip">ACTIVE</span>}
                    <div className="studio-card-img-wrap">
                      <HeroImage assetId={tradId} width="100%" alt={h.name} />
                    </div>
                    <strong className="studio-card-name">{h.name}</strong>
                    <span className={`studio-card-status${isSelected ? " is-equipped" : ""}`}>
                      {isSelected ? "Equipped" : h.region}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="studio-content-header">
              <div>
                <h3>Earned Attire</h3>
                <p>Special edition robes and variants earned from the Store. Worn everywhere instantly.</p>
              </div>
            </div>

            {skins.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--text-3)", padding: "12px 0" }}>
                No extra attire yet. <Link href="/store" style={{ textDecoration: "underline", color: "#FFFFFF" }}>Earn coins, visit the Store.</Link>
              </p>
            ) : (
              <div className="studio-wardrobe-grid">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {skins.map((s: any) => {
                  const isEquipped = curHeroId === s.metadata?.heroAssetId;
                  return (
                    <button
                      key={s.id}
                      className={`studio-item-card${isEquipped ? " is-selected" : ""}`}
                      disabled={busy === s.id}
                      onClick={() => run(s.id, () => client.equip(authHeaders(), s.id), `${s.name} worn`)}
                      title={s.description ?? s.name}
                    >
                      {isEquipped && <span className="studio-equipped-chip">ACTIVE</span>}
                      <div className="studio-card-img-wrap">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.assetPath} alt={s.name} loading="lazy" />
                      </div>
                      <strong className="studio-card-name">{s.name}</strong>
                      <span className={`studio-card-status${isEquipped ? " is-equipped" : ""}`}>
                        {isEquipped ? "Equipped" : "Available"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            TAB 2: COMPANIONS
            ============================================================ */}
        {activeTab === "companions" && (
          <div className="studio-content-section">
            <div className="studio-content-header">
              <div>
                <h3>Loyal Companions</h3>
                <p>Companions walk with you through trials, focus sessions, and celebrations.</p>
              </div>
              <Link className="link-btn" href="/store">More in Store</Link>
            </div>

            <div className="studio-wardrobe-grid">
              {FREE_COMPANIONS.map((c) => {
                const unlocked = curCompanion === c.id || ownedCompanionIds.has(c.id);
                const isSelected = curCompanion === c.id;

                if (!unlocked) {
                  return (
                    <Link
                      key={c.id}
                      href="/store"
                      className="studio-item-card"
                      title={`${c.name} · unlock in Store for 30 coins`}
                    >
                      <div className="studio-card-img-wrap" style={{ filter: "grayscale(1)", opacity: 0.65 }}>
                        <CompanionImage assetId={c.id} width={64} alt={`${c.name} (locked)`} />
                      </div>
                      <strong className="studio-card-name">{c.name}</strong>
                      <span className="studio-card-status" style={{ color: "#A0A0A0" }}>Unlock · 30 coins</span>
                    </Link>
                  );
                }

                return (
                  <button
                    key={c.id}
                    className={`studio-item-card${isSelected ? " is-selected" : ""}`}
                    disabled={busy === `comp-${c.id}`}
                    onClick={() => run(`comp-${c.id}`, () => client.patchProfile(authHeaders(), { companionAssetId: c.id }), `${c.name} walks with you`)}
                    title={`${c.name} — companion`}
                  >
                    {isSelected && <span className="studio-equipped-chip">ACTIVE</span>}
                    <div className="studio-card-img-wrap">
                      <CompanionImage assetId={c.id} width={64} alt={c.name} />
                    </div>
                    <strong className="studio-card-name">{c.name}</strong>
                    <span className={`studio-card-status${isSelected ? " is-equipped" : ""}`}>
                      {isSelected ? "Equipped" : "Available"}
                    </span>
                  </button>
                );
              })}

              {/* Premium / Store Companions */}
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {companionItems.filter((i: any) => !FREE_COMPANIONS.some((c) => c.id === i?.metadata?.companionAssetId)).map((i: any) => {
                const cid = i?.metadata?.companionAssetId;
                if (!cid) return null;
                const isSelected = curCompanion === cid;
                return (
                  <button
                    key={i.id}
                    className={`studio-item-card${isSelected ? " is-selected" : ""}`}
                    disabled={busy === i.id}
                    onClick={() => run(i.id, () => client.equip(authHeaders(), i.id), `${i.name} walks with you`)}
                    title={i.description ?? i.name}
                  >
                    {isSelected && <span className="studio-equipped-chip">ACTIVE</span>}
                    <div className="studio-card-img-wrap">
                      <CompanionImage assetId={cid} width={64} alt={i.name} />
                    </div>
                    <strong className="studio-card-name">{i.name} ★</strong>
                    <span className={`studio-card-status${isSelected ? " is-equipped" : ""}`}>
                      {isSelected ? "Equipped" : "Premium"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 3: FRAMES
            ============================================================ */}
        {activeTab === "frames" && (
          <div className="studio-content-section">
            <div className="studio-content-header">
              <div>
                <h3>Portrait Frames</h3>
                <p>Hand-drawn temple masonry and heraldic rings framing your visage.</p>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {loadout.frameItemId && (
                  <button
                    className="chip"
                    disabled={busy === "unframe"}
                    onClick={() => run("unframe", () => client.unequip(authHeaders(), "frameItemId"), "Frame removed")}
                  >
                    Remove Frame
                  </button>
                )}
                <Link className="link-btn" href="/store">More in Store</Link>
              </div>
            </div>

            {frames.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--text-3)" }}>No frames available yet. Visit the Store to discover frames.</p>
            ) : (
              <div className="studio-wardrobe-grid">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {frames.map((f: any) => {
                  const eq = loadout.frameItemId === f.id;
                  return (
                    <button
                      key={f.id}
                      className={`studio-item-card${eq ? " is-selected" : ""}`}
                      disabled={busy === f.id}
                      onClick={() => run(f.id, () => client.equip(authHeaders(), f.id), `${f.name} framing you`)}
                      title={f.price === 0 ? `${f.name} — starter, free` : f.description ?? f.name}
                    >
                      {eq && <span className="studio-equipped-chip">ACTIVE</span>}
                      <div className="studio-card-img-wrap">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={f.assetPath} alt={f.name} loading="lazy" />
                      </div>
                      <strong className="studio-card-name">{f.name}</strong>
                      <span className={`studio-card-status${eq ? " is-equipped" : ""}`}>
                        {eq ? "Equipped" : f.price === 0 ? "Starter" : "Available"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            TAB 4: TITLE BOXES
            ============================================================ */}
        {activeTab === "titles" && (
          <div className="studio-content-section">
            <div className="studio-content-header">
              <div>
                <h3>Title Boxes</h3>
                <p>Ornate plates and banners that hold your traveler name in clean relief.</p>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {loadout.titleItemId && (
                  <button
                    className="chip"
                    disabled={busy === "untitle"}
                    onClick={() => run("untitle", () => client.unequip(authHeaders(), "titleItemId"), "Title box removed")}
                  >
                    Remove Title Box
                  </button>
                )}
                <Link className="link-btn" href="/store">More in Store</Link>
              </div>
            </div>

            {boxes.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--text-3)" }}>No title boxes available yet. Visit the Store to discover title boxes.</p>
            ) : (
              <div className="studio-wardrobe-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {boxes.map((b: any) => {
                  const eq = loadout.titleItemId === b.id;
                  return (
                    <button
                      key={b.id}
                      className={`studio-item-card${eq ? " is-selected" : ""}`}
                      disabled={busy === b.id}
                      onClick={() => run(b.id, () => client.equip(authHeaders(), b.id), `${b.name} holds your name`)}
                      title={b.price === 0 ? `${b.name} — starter, free` : b.description ?? b.name}
                    >
                      {eq && <span className="studio-equipped-chip">ACTIVE</span>}
                      <div style={{ width: "100%", margin: "8px 0 12px" }}>
                        <TitleBox boxSrc={b.assetPath} name={name} />
                      </div>
                      <strong className="studio-card-name">{b.name}</strong>
                      <span className={`studio-card-status${eq ? " is-equipped" : ""}`}>
                        {eq ? "Equipped" : b.price === 0 ? "Starter" : "Available"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            TAB 5: PROFILE PICTURE
            ============================================================ */}
        {activeTab === "avatar" && (
          <div className="studio-content-section">
            <div className="studio-content-header">
              <div>
                <h3>Profile Visage</h3>
                <p>Follow your current character, pick a loyal companion, or upload your own portrait photo.</p>
              </div>
            </div>

            <div className="studio-wardrobe-grid">
              {/* Option 1: Custom Photo Upload */}
              <label
                className={`studio-item-card${isPhotoAvatar(curAvatar) ? " is-selected" : ""}`}
                title="Upload custom photo (max 2 MB)"
                style={{ cursor: photoBusy ? "wait" : "pointer" }}
              >
                {isPhotoAvatar(curAvatar) && <span className="studio-equipped-chip">ACTIVE</span>}
                <div className="studio-card-img-wrap">
                  {isPhotoAvatar(curAvatar) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={curAvatar as string} alt="Your custom photo" />
                  ) : (
                    <span style={{ fontSize: 24, color: "#FFFFFF" }}>{photoBusy ? "…" : "+"}</span>
                  )}
                </div>
                <strong className="studio-card-name">{photoBusy ? "Uploading…" : "Custom Photo"}</strong>
                <span className={`studio-card-status${isPhotoAvatar(curAvatar) ? " is-equipped" : ""}`}>
                  {isPhotoAvatar(curAvatar) ? "Active Photo" : "Upload Image"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  aria-label="Upload your own profile photo"
                  style={{ display: "none" }}
                  disabled={photoBusy}
                  onChange={(e) => {
                    void uploadPhoto(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>

              {/* Option 2: Follow Character Portrait */}
              <button
                className={`studio-item-card${curAvatar === null ? " is-selected" : ""}`}
                disabled={busy === "avatar-follow"}
                onClick={() => run("avatar-follow", () => client.patchProfile(authHeaders(), { avatarAssetId: null }), "Picture follows your character")}
                title="Use your character portrait"
              >
                {curAvatar === null && <span className="studio-equipped-chip">ACTIVE</span>}
                <div className="studio-card-img-wrap">
                  <HeroImage assetId={curHeroId} width="100%" alt={name} />
                </div>
                <strong className="studio-card-name">Character</strong>
                <span className={`studio-card-status${curAvatar === null ? " is-equipped" : ""}`}>
                  {curAvatar === null ? "Active Visage" : "Follows Skin"}
                </span>
              </button>

              {/* Option 3: Companion Visages */}
              {FREE_COMPANIONS.map((c) => {
                const key = avatarAssetIdFor("companion", c.id);
                const isSelected = curAvatar === key;
                return (
                  <button
                    key={c.id}
                    className={`studio-item-card${isSelected ? " is-selected" : ""}`}
                    disabled={busy === key}
                    onClick={() => run(key, () => client.patchProfile(authHeaders(), { avatarAssetId: key }), `${c.name} is your picture`)}
                    title={`${c.name} as profile picture`}
                  >
                    {isSelected && <span className="studio-equipped-chip">ACTIVE</span>}
                    <div className="studio-card-img-wrap">
                      <CompanionImage assetId={c.id} width={64} alt={c.name} />
                    </div>
                    <strong className="studio-card-name">{c.name}</strong>
                    <span className={`studio-card-status${isSelected ? " is-equipped" : ""}`}>
                      {isSelected ? "Active Visage" : "Companion"}
                    </span>
                  </button>
                );
              })}

              {COMPANIONS.filter((c) => c.premium && ownedPremiumIds.has(c.id)).map((c) => {
                const key = avatarAssetIdFor("companion", c.id);
                const isSelected = curAvatar === key;
                return (
                  <button
                    key={c.id}
                    className={`studio-item-card${isSelected ? " is-selected" : ""}`}
                    disabled={busy === key}
                    onClick={() => run(key, () => client.patchProfile(authHeaders(), { avatarAssetId: key }), `${c.name} is your picture`)}
                    title={`${c.name} as profile picture`}
                  >
                    {isSelected && <span className="studio-equipped-chip">ACTIVE</span>}
                    <div className="studio-card-img-wrap">
                      <CompanionImage assetId={c.id} width={64} alt={c.name} />
                    </div>
                    <strong className="studio-card-name">{c.name} ★</strong>
                    <span className={`studio-card-status${isSelected ? " is-equipped" : ""}`}>
                      {isSelected ? "Active Visage" : "Premium"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 6: IDENTITY & OATH
            ============================================================ */}
        {activeTab === "identity" && (
          <div className="studio-content-section">
            <div className="studio-content-header">
              <div>
                <h3>Identity & Oath</h3>
                <p>Names etched into your ledger, and the oath that centers your focus.</p>
              </div>
            </div>

            <div className="studio-form-wrap">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run("names", () => client.patchProfile(authHeaders(), {
                    heroName: (heroName ?? profile.heroName ?? "").trim(),
                    companionName: (compName ?? profile.companionName ?? "").trim(),
                    bio: (oath ?? profile.bio ?? "").trim() || null,
                  }), "Identity updated");
                }}
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                <div className="studio-field">
                  <label htmlFor="pzHero">Character Name</label>
                  <input
                    id="pzHero"
                    className="studio-input"
                    type="text"
                    defaultValue={profile.heroName ?? ""}
                    onChange={(e) => setHeroName(e.target.value)}
                    maxLength={80}
                    placeholder="Enter character name"
                  />
                </div>

                <div className="studio-field">
                  <label htmlFor="pzComp">Companion Name</label>
                  <input
                    id="pzComp"
                    className="studio-input"
                    type="text"
                    defaultValue={profile.companionName ?? ""}
                    onChange={(e) => setCompName(e.target.value)}
                    maxLength={80}
                    placeholder="Name your companion"
                  />
                </div>

                <div className="studio-field">
                  <label htmlFor="pzOath">Solemn Oath</label>
                  <input
                    id="pzOath"
                    className="studio-input"
                    type="text"
                    defaultValue={profile.bio ?? ""}
                    onChange={(e) => setOath(e.target.value)}
                    maxLength={500}
                    placeholder="e.g. Ship my portfolio, kill doomscroll"
                  />
                </div>

                <div style={{ paddingTop: 8 }}>
                  <button type="submit" className="showcase-btn-primary" disabled={busy === "names"}>
                    {busy === "names" ? "Inscribing…" : "Save Identity"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
