"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { AvatarImg, CompanionImage, FrameWrap, HeroImage, TitleBox } from "@/components/illustrations";
import { COMPANIONS, FREE_COMPANIONS, HEROES, avatarAssetIdFor, heroAssetId, resolveHero } from "@/lib/identity";
import { EmptyState, ErrorState, SignInPrompt, Skeleton } from "@/components/States";

/**
 * Personalize — the dressing room. Profile picture, hero + attire, companion,
 * frames, title boxes, names and oath. Everything reads from and writes to
 * the server, so choices survive every login on every device.
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
  // Legacy placeholder items (pre-real-art) stay equippable from the Collection
  // but are hidden here — this room only shows art that actually renders.
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
  const name = profile.heroName ?? profile.displayName ?? "hero";
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
      toast("Profile picture updated", "i-check");
      refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't upload photo.", "i-close");
    } finally {
      setPhotoBusy(false);
    }
  };

  return (
    <div className="page is-active">
      <div className="page-head">
        <div>
          <h2>Personalize</h2>
          <p className="sub">Your dressing room — picture, character, companion, frames, names. All saved server-side.</p>
        </div>
        <Link className="link-btn" href="/store">Store</Link>
      </div>

      {/* Live preview */}
      <section className="panel" aria-label="Preview" style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <FrameWrap frameSrc={frameAsset} label="Framed profile picture">
          <span style={{ display: "block", width: 120, borderRadius: 16, overflow: "hidden" }}>
            <AvatarImg avatarAssetId={curAvatar} heroAssetId={curHeroId} width="100%" eager alt={name} />
          </span>
        </FrameWrap>
        <div style={{ flex: 1, minWidth: 200 }}>
          <TitleBox boxSrc={titleBoxAsset} name={name} sub={profile.bio ?? null} />
          <p style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 8 }}>
            {equippedIds.size === 0 ? "Nothing equipped yet — your 4 starter frames and 4 title boxes are waiting below." : "This is how the realm sees you."}
          </p>
        </div>
      </section>

      {/* Profile picture */}
      <section className="panel" aria-label="Profile picture">
        <div className="sec-head" style={{ margin: 0 }}><h3>Profile picture</h3></div>
        <p style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 8 }}>
          Your face across the realm — follow your character, pick a friend, or upload your own photo.
        </p>
        <div className="option-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(86px, 1fr))" }}>
          <label
            className="option"
            title="Upload your own photo (max 2 MB)"
            style={{ cursor: photoBusy ? "wait" : "pointer", opacity: photoBusy ? 0.6 : 1 }}
          >
            <span style={{ display: "grid", placeItems: "center", width: 56, height: 56, borderRadius: 12, border: "1px dashed var(--border-strong)", fontSize: 22 }} aria-hidden>
              {photoBusy ? "…" : "+"}
            </span>
            <strong style={{ marginTop: 6 }}>{photoBusy ? "Uploading…" : "Your photo"}</strong>
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
          <button
            className={`option${curAvatar === null ? " is-on" : ""}`}
            disabled={busy === "avatar-follow"}
            onClick={() => run("avatar-follow", () => client.patchProfile(authHeaders(), { avatarAssetId: null }), "Picture follows your character")}
            title="Use your character portrait"
          >
            <span style={{ display: "block", width: 56, borderRadius: 12, overflow: "hidden" }}>
              <HeroImage assetId={curHeroId} width="100%" alt={name} />
            </span>
            <strong style={{ marginTop: 6 }}>Character</strong>
          </button>
          {FREE_COMPANIONS.map((c) => {
            const key = avatarAssetIdFor("companion", c.id);
            return (
              <button
                key={c.id}
                className={`option${curAvatar === key ? " is-on" : ""}`}
                disabled={busy === key}
                onClick={() => run(key, () => client.patchProfile(authHeaders(), { avatarAssetId: key }), `${c.name} is your picture`)}
                title={`${c.name} as profile picture`}
              >
                <CompanionImage assetId={c.id} width={56} alt={c.name} />
                <strong style={{ marginTop: 6 }}>{c.name}</strong>
              </button>
            );
          })}
          {COMPANIONS.filter((c) => c.premium && ownedPremiumIds.has(c.id)).map((c) => {
            const key = avatarAssetIdFor("companion", c.id);
            return (
              <button
                key={c.id}
                className={`option${curAvatar === key ? " is-on" : ""}`}
                disabled={busy === key}
                onClick={() => run(key, () => client.patchProfile(authHeaders(), { avatarAssetId: key }), `${c.name} is your picture`)}
                title={`${c.name} as profile picture`}
              >
                <CompanionImage assetId={c.id} width={56} alt={c.name} />
                <strong style={{ marginTop: 6 }}>{c.name} ★</strong>
              </button>
            );
          })}
        </div>
      </section>

      {/* Hero + attire */}
      <section className="panel" aria-label="Character and attire">
        <div className="sec-head" style={{ margin: 0 }}><h3>Character & attire</h3></div>
        <p style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 8 }}>Base character — always in traditional dress. Others unlock in the Store.</p>
        <div className="option-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(86px, 1fr))", marginBottom: 12 }}>
          {HEROES.map((h) => {
            const tradId = heroAssetId(h.id, "traditional");
            const unlocked = curBase === h.id || ownedTradSkins.has(tradId);
            if (!unlocked) {
              return (
                <Link key={h.id} href="/store" className="option" title={`${h.name} · unlock in the Store for 60 coins`}>
                  <span style={{ display: "block", width: 56, borderRadius: 12, overflow: "hidden", filter: "grayscale(1)", opacity: 0.75 }}>
                    <HeroImage assetId={tradId} width="100%" alt={`${h.name} (locked)`} />
                  </span>
                  <strong style={{ marginTop: 6 }}>{h.name}</strong>
                  <span style={{ fontSize: 11.5, color: "var(--gold)", fontWeight: 700 }}>Unlock · 60</span>
                </Link>
              );
            }
            return (
              <button
                key={h.id}
                className={`option${curBase === h.id ? " is-on" : ""}`}
                disabled={busy === `hero-${h.id}`}
                onClick={() => run(`hero-${h.id}`, () => client.patchProfile(authHeaders(), { heroAssetId: tradId }), `${h.name} leads your story`)}
                title={`${h.name} · ${h.region}`}
              >
                <span style={{ display: "block", width: 56, borderRadius: 12, overflow: "hidden" }}>
                  <HeroImage assetId={tradId} width="100%" alt={h.name} />
                </span>
                <strong style={{ marginTop: 6 }}>{h.name}</strong>
              </button>
            );
          })}
        </div>
        <p style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 8 }}>Owned attire — earned in the Store, worn everywhere instantly.</p>
        {skins.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>No extra attire yet. <Link href="/store" style={{ textDecoration: "underline" }}>Earn coins, visit the Store.</Link></p>
        ) : (
          <div className="option-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))" }}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {skins.map((s: any) => (
              <button
                key={s.id}
                className={`option${curHeroId === s.metadata?.heroAssetId ? " is-on" : ""}`}
                disabled={busy === s.id}
                onClick={() => run(s.id, () => client.equip(authHeaders(), s.id), `${s.name} worn`)}
                title={s.description ?? s.name}
              >
                <span style={{ display: "block", width: "100%", borderRadius: 12, overflow: "hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.assetPath} alt={s.name} loading="lazy" style={{ width: "100%", display: "block" }} />
                </span>
                <strong style={{ marginTop: 6 }}>{s.name}</strong>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Companion */}
      <section className="panel" aria-label="Companion">
        <div className="sec-head" style={{ margin: 0 }}>
          <h3>Companion</h3>
          <Link className="link-btn" href="/store">More in Store</Link>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 8 }}>Your first friend is free. Others unlock in the Store.</p>
        <div className="option-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(86px, 1fr))" }}>
          {FREE_COMPANIONS.map((c) => {
            const unlocked = curCompanion === c.id || ownedCompanionIds.has(c.id);
            if (!unlocked) {
              return (
                <Link key={c.id} href="/store" className="option" title={`${c.name} · unlock in the Store for 30 coins`}>
                  <span style={{ filter: "grayscale(1)", opacity: 0.75 }}>
                    <CompanionImage assetId={c.id} width={56} alt={`${c.name} (locked)`} />
                  </span>
                  <strong style={{ marginTop: 6 }}>{c.name}</strong>
                  <span style={{ fontSize: 11.5, color: "var(--gold)", fontWeight: 700 }}>Unlock · 30</span>
                </Link>
              );
            }
            return (
              <button
                key={c.id}
                className={`option${curCompanion === c.id ? " is-on" : ""}`}
                disabled={busy === `comp-${c.id}`}
                onClick={() => run(`comp-${c.id}`, () => client.patchProfile(authHeaders(), { companionAssetId: c.id }), `${c.name} walks with you`)}
                title={`${c.name} — yours`}
              >
                <CompanionImage assetId={c.id} width={56} alt={c.name} />
                <strong style={{ marginTop: 6 }}>{c.name}</strong>
              </button>
            );
          })}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {companionItems.filter((i: any) => !FREE_COMPANIONS.some((c) => c.id === i?.metadata?.companionAssetId)).map((i: any) => {
            const cid = i?.metadata?.companionAssetId;
            if (!cid) return null;
            const premium = !FREE_COMPANIONS.some((c) => c.id === cid);
            return (
              <button
                key={i.id}
                className={`option${curCompanion === cid ? " is-on" : ""}`}
                disabled={busy === i.id}
                onClick={() => run(i.id, () => client.equip(authHeaders(), i.id), `${i.name} walks with you`)}
                title={i.description ?? i.name}
              >
                <CompanionImage assetId={cid} width={56} alt={i.name} />
                <strong style={{ marginTop: 6 }}>{i.name}{premium ? " ★" : ""}</strong>
              </button>
            );
          })}
        </div>
      </section>

      {/* Frames */}
      <section className="panel" aria-label="Frames">
        <div className="sec-head" style={{ margin: 0 }}>
          <h3>Frames</h3>
          <Link className="link-btn" href="/store">More in Store</Link>
        </div>
        {frames.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>No frames yet — your 4 starter frames should already be here; visit the Store to sync.</p>
        ) : (
          <div className="option-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))" }}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {frames.map((f: any) => {
              const eq = loadout.frameItemId === f.id;
              return (
                <button
                  key={f.id}
                  className={`option${eq ? " is-on" : ""}`}
                  disabled={busy === f.id}
                  onClick={() => run(f.id, () => client.equip(authHeaders(), f.id), `${f.name} framing you`)}
                  title={f.price === 0 ? `${f.name} — starter, free` : f.description ?? f.name}
                >
                  <span style={{ display: "block", width: "100%", borderRadius: 12, overflow: "hidden" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.assetPath} alt={f.name} loading="lazy" style={{ width: "100%", display: "block" }} />
                  </span>
                  <strong style={{ marginTop: 6 }}>{f.name}{f.price === 0 ? " · free" : ""}</strong>
                </button>
              );
            })}
          </div>
        )}
        {loadout.frameItemId && (
          <button className="chip" style={{ marginTop: 8 }} disabled={busy === "unframe"} onClick={() => run("unframe", () => client.unequip(authHeaders(), "frameItemId"), "Frame removed")}>
            Remove frame
          </button>
        )}
      </section>

      {/* Title boxes */}
      <section className="panel" aria-label="Title boxes">
        <div className="sec-head" style={{ margin: 0 }}>
          <h3>Title boxes</h3>
          <Link className="link-btn" href="/store">More in Store</Link>
        </div>
        {boxes.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>No title boxes yet — your 4 starter boxes should already be here; visit the Store to sync.</p>
        ) : (
          <div className="option-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {boxes.map((b: any) => {
              const eq = loadout.titleItemId === b.id;
              return (
                <button
                  key={b.id}
                  className={`option${eq ? " is-on" : ""}`}
                  disabled={busy === b.id}
                  onClick={() => run(b.id, () => client.equip(authHeaders(), b.id), `${b.name} holds your name`)}
                  title={b.price === 0 ? `${b.name} — starter, free` : b.description ?? b.name}
                >
                  <TitleBox boxSrc={b.assetPath} name={name} />
                  <strong style={{ marginTop: 6 }}>{b.name}{b.price === 0 ? " · free" : ""}</strong>
                </button>
              );
            })}
          </div>
        )}
        {loadout.titleItemId && (
          <button className="chip" style={{ marginTop: 8 }} disabled={busy === "untitle"} onClick={() => run("untitle", () => client.unequip(authHeaders(), "titleItemId"), "Title box removed")}>
            Remove title box
          </button>
        )}
      </section>

      {/* Names */}
      <section className="panel" aria-label="Names">
        <div className="sec-head" style={{ margin: 0 }}><h3>Names & oath</h3></div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run("names", () => client.patchProfile(authHeaders(), {
              heroName: (heroName ?? profile.heroName ?? "").trim(),
              companionName: (compName ?? profile.companionName ?? "").trim(),
              bio: (oath ?? profile.bio ?? "").trim() || null,
            }), "Identity updated");
          }}
          style={{ display: "grid", gap: 8 }}
        >
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="pzHero">Character name</label>
            <input id="pzHero" type="text" defaultValue={profile.heroName ?? ""} onChange={(e) => setHeroName(e.target.value)} maxLength={80} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="pzComp">Companion name</label>
            <input id="pzComp" type="text" defaultValue={profile.companionName ?? ""} onChange={(e) => setCompName(e.target.value)} maxLength={80} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="pzOath">Oath</label>
            <input id="pzOath" type="text" defaultValue={profile.bio ?? ""} onChange={(e) => setOath(e.target.value)} maxLength={500} placeholder="Ship my portfolio, kill doomscroll" />
          </div>
          <div>
            <button type="submit" className="btn btn--primary" disabled={busy === "names"}>
              {busy === "names" ? "Saving…" : "Save identity"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
