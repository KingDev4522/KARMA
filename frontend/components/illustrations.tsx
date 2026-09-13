"use client";

import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import { resolveAvatar, resolveCompanion, resolveHero, type HeroVariant } from "@/lib/identity";

/* ============================================================
   Illustration system — monochrome editorial linework.
   Six fixed slice-of-life heroes (modern dress, ink + paper +
   one vermilion stitch), one fox companion, quiet environments.
   Rendered once as an SVG sprite; consumed everywhere via <use>.
   ============================================================ */

export type IconId =
  | "i-today" | "i-quests" | "i-campaigns" | "i-focus" | "i-realm"
  | "i-chronicle" | "i-store" | "i-settings" | "i-search" | "i-bell"
  | "i-coin" | "i-plus" | "i-check" | "i-play" | "i-pause" | "i-flame"
  | "i-close" | "i-arrow-r" | "i-sun" | "i-moon" | "i-spark" | "i-clock"
  | "i-strength" | "i-vitality" | "i-intellect" | "i-focusattr"
  | "i-discipline" | "i-craft" | "i-connection" | "i-exploration"
  | "i-level" | "i-trophy" | "i-vol" | "i-volx";

export function Icon({ id, style }: { id: IconId; style?: CSSProperties }) {
  return (
    <svg className="ic" style={style} aria-hidden="true">
      <use href={`#${id}`} />
    </svg>
  );
}

/** heroAssetId ("hero_ember" …) → variant index 0–5. Unknown ids hash stably. */
export function variantFor(assetId?: string | null): number {
  const order = ["hero_ember", "hero_sage", "hero_warden", "hero_scout", "hero_mystic", "hero_forge"];
  if (assetId) {
    const i = order.indexOf(assetId);
    if (i >= 0) return i;
    let h = 0;
    for (let k = 0; k < assetId.length; k++) h = (h * 31 + assetId.charCodeAt(k)) >>> 0;
    return h % 6;
  }
  return 0;
}

export function Hero({
  width = "100%",
  className,
  variant = 0,
}: {
  width?: string | number;
  className?: string;
  variant?: number;
}) {
  const v = ((variant % 6) + 6) % 6;
  return (
    <span className={`hero-stack${className ? ` ${className}` : ""}`} style={{ width }} aria-hidden="true">
      <svg viewBox="0 0 220 360">
        <use href="#ill-hero-base" />
      </svg>
      <svg viewBox="0 0 220 360">
        <use href={`#ill-hero-v${v}`} />
      </svg>
    </span>
  );
}

export function Companion({ width = "100%" }: { width?: string | number }) {
  return (
    <svg viewBox="0 0 140 110" width={width} aria-hidden="true">
      <use href="#ill-companion" />
    </svg>
  );
}

/* ============================================================
   Real-asset identity images (assets/ → public/).
   HeroImage / CompanionImage render the true JPEG/PNG art and fall
   back to the SVG linework only if the raster is missing, so old
   profiles and slow networks never render blank.
   ============================================================ */

export function HeroImage({  assetId,
  variant,
  width = "100%",
  className,
  alt = "Hero portrait",
  eager = false,
}: {
  assetId?: string | null;
  variant?: HeroVariant;
  width?: string | number;
  className?: string;
  alt?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const { hero, variant: v } = resolveHero(assetId);
  const useVariant = variant ?? v;
  if (failed || !assetId) {
    if (!assetId) {
      return (
        <span
          role="img"
          aria-label={alt}
          style={{ display: "grid", placeItems: "center", width: "100%", aspectRatio: "3/4", borderRadius: 12, background: "var(--surface-2)", color: "var(--text-3)" }}
        >
          <Icon id="i-realm" style={{ width: "40%", height: "40%" }} />
        </span>
      );
    }
    return <Hero width={width} className={className} variant={0} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={hero.file(useVariant)}
      alt={`${hero.name} · ${useVariant} — ${alt}`}
      width={typeof width === "number" ? width : undefined}
      style={typeof width === "number" ? undefined : { width: width as string, height: "auto", display: "block" }}
      className={className}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export function CompanionImage({
  assetId,
  width = 72,
  alt = "Companion",
  eager = false,
}: {
  assetId?: string | null;
  width?: string | number;
  alt?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const c = resolveCompanion(assetId);
  if (failed || !assetId) {
    if (!assetId) {
      return (
        <span
          role="img"
          aria-label={alt}
          style={{ display: "grid", placeItems: "center", width: typeof width === "number" ? width : "100%", aspectRatio: "1", borderRadius: 12, background: "var(--surface-2)", color: "var(--text-3)" }}
        >
          <Icon id="i-spark" style={{ width: "40%", height: "40%" }} />
        </span>
      );
    }
    return <Companion width={width} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={c.src}
      alt={`${c.name} — ${alt}`}
      width={typeof width === "number" ? width : undefined}
      style={typeof width === "number" ? { height: "auto", borderRadius: 12 } : { width: width as string, height: "auto", display: "block", borderRadius: 12 }}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

/** Real coin currency mark (assets/coin.png). Falls back to the SVG coin. */
export function CoinImg({ size = 16 }: { size?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Icon id="i-coin" style={{ width: size, height: size }} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/coin.png"
      alt="Coins"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "contain" }}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

/** App brand mark (assets/logo.png). The art is dark-on-black, so it always
 *  sits on a white tile — visible on light and dark themes alike. Falls back
 *  to the letter mark. */
export function BrandLogo({ size = 30 }: { size?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="brand-mark" aria-hidden="true">
        L
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-grid",
        placeItems: "center",
        width: size,
        height: size,
        borderRadius: Math.max(6, Math.round(size * 0.28)),
        background: "#FFFFFF",
        overflow: "hidden",
        flex: "none",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo.png"
        alt="LIFE RPG"
        width={size}
        height={size}
        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        loading="eager"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

/* ============================================================
   Profile picture + equipped cosmetics.
   AvatarImg renders the chosen profile picture (hero variant or
   companion); FrameWrap dresses any portrait in the equipped
   title-frame art; TitleBox renders the hero name inside the
   equipped title-box art. All fall back gracefully to plain UI.
   ============================================================ */

export function AvatarImg({
  avatarAssetId,
  heroAssetId,
  width = 32,
  alt = "Profile",
  eager = false,
}: {
  avatarAssetId?: string | null;
  heroAssetId?: string | null;
  width?: string | number;
  alt?: string;
  eager?: boolean;
}) {
  // No identity at all (signed out / fresh) → neutral silhouette, NEVER a
  // default character. No hero is hardcoded anywhere in the UI.
  // (Hook first: early returns must never skip hooks between renders.)
  const [photoGone, setPhotoGone] = useState(false);
  if (!avatarAssetId && !heroAssetId) {
    return (
      <span
        role="img"
        aria-label={alt}
        style={{
          display: "grid",
          placeItems: "center",
          width: typeof width === "number" ? width : undefined,
          ...(typeof width === "number" ? {} : { width: width as string }),
          aspectRatio: "1",
          borderRadius: 12,
          background: "var(--surface-2)",
          color: "var(--text-3)",
        }}
      >
        <Icon id="i-realm" style={{ width: "55%", height: "55%" }} />
      </span>
    );
  }
  const a = resolveAvatar(avatarAssetId, heroAssetId);
  if (a.kind === "photo" && a.photoUrl && !photoGone) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={a.photoUrl}
        alt={alt}
        width={typeof width === "number" ? width : undefined}
        style={typeof width === "number" ? { height: "auto", borderRadius: 12, objectFit: "cover" } : { width: width as string, height: "auto", display: "block", borderRadius: 12, objectFit: "cover" }}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onError={() => setPhotoGone(true)}
      />
    );
  }
  if (a.kind === "companion") return <CompanionImage assetId={a.companion.id} width={width} alt={alt} eager={eager} />;
  return <HeroImage assetId={`${a.hero.id}-${a.variant}`} width={width} alt={alt} eager={eager} />;
}

export function FrameWrap({
  frameSrc,
  children,
  label = "Framed portrait",
}: {
  frameSrc?: string | null;
  children: ReactNode;
  label?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!frameSrc || failed) return <>{children}</>;
  return (
    <span className="frame-wrap" role="img" aria-label={label}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={frameSrc} alt="" aria-hidden="true" className="frame-art" loading="lazy" decoding="async" onError={() => setFailed(true)} />
      <span className="frame-inner">{children}</span>
    </span>
  );
}

export function TitleBox({
  boxSrc,
  name,
  sub,
}: {
  boxSrc?: string | null;
  name: string;
  sub?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  if (!boxSrc || failed) {
    return (
      <span className="titlebox-fallback">
        <strong>{name}</strong>
        {sub ? <span>{sub}</span> : null}
      </span>
    );
  }
  return (
    <span className="titlebox" role="img" aria-label={`${name}${sub ? `, ${sub}` : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={boxSrc} alt="" aria-hidden="true" loading="lazy" decoding="async" onError={() => setFailed(true)} />
      <span className="titlebox-name">{name}</span>
    </span>
  );
}

export function EnvStack() {
  return (
    <div className="env-stack" aria-hidden="true">
      <svg className="env-layer env-day" aria-hidden="true">
        <use href="#ill-env-day" />
      </svg>
      <svg className="env-layer env-night" aria-hidden="true">
        <use href="#ill-env-night" />
      </svg>
    </div>
  );
}

/* ============================================================
   TERMINOLOGY LOCK (see LRP-AVATAR-002):
   - Avatar = one of the six characters. NEVER framed, never mixed.
   - Profile Picture = photo / companion / character image choice.
     ONLY the profile picture ever wears a frame.
   - Title Box = name plate. Shows the name, always legible.
   ============================================================ */

/** Profile picture in a small slot, wearing the equipped frame (if any).
 *  Square badge: frame art as backdrop, picture inset. No frame → plain. */
export function FramedAvatar({
  avatarAssetId,
  heroAssetId,
  frameSrc,
  size = 32,
  alt = "Profile",
}: {
  avatarAssetId?: string | null;
  heroAssetId?: string | null;
  frameSrc?: string | null;
  size?: number;
  alt?: string;
}) {
  const [frameGone, setFrameGone] = useState(false);
  if (!frameSrc || frameGone) {
    return <AvatarImg avatarAssetId={avatarAssetId} heroAssetId={heroAssetId} width={size} alt={alt} />;
  }
  return (
    <span className="frame-badge" style={{ width: size, height: size }} role="img" aria-label={alt}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={frameSrc} alt="" aria-hidden="true" className="frame-badge-art" loading="lazy" decoding="async" onError={() => setFrameGone(true)} />
      <span className="frame-badge-inner">
        <AvatarImg avatarAssetId={avatarAssetId} heroAssetId={heroAssetId} width="100%" alt={alt} />
      </span>
    </span>
  );
}

export function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        {/* ============ HERO BASE — shared body, ink & paper ============ */}
        <symbol id="ill-hero-base" viewBox="0 0 220 360">
          <ellipse cx="110" cy="340" rx="54" ry="8" fill="#181818" opacity=".1" />
          {/* trousers */}
          <path d="M86 204 h48 v12 l-4 96 h-17 l-3 -78 -3 78 h-17 l-4 -96 z" fill="#2B2B2B" />
          {/* sneakers */}
          <path d="M78 312 h30 v10 q0 8 -10 8 h-20 q-8 0 -8 -8 z" fill="#F4F4F2" stroke="#1A1A1A" strokeWidth="3" />
          <path d="M112 312 h30 v10 q0 8 -10 8 h-20 q-8 0 -8 -8 z" fill="#F4F4F2" stroke="#1A1A1A" strokeWidth="3" />
          <path d="M70 326 h48 M112 326 h48" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" />
          {/* forearms + hands */}
          <path d="M62 168 q-3 22 2 40" stroke="#CFC9BE" strokeWidth="13" strokeLinecap="round" fill="none" />
          <path d="M158 168 q3 22 -2 40" stroke="#CFC9BE" strokeWidth="13" strokeLinecap="round" fill="none" />
          <circle cx="64" cy="214" r="8" fill="#DCD7CE" stroke="#1A1A1A" strokeWidth="2.5" />
          <circle cx="156" cy="214" r="8" fill="#DCD7CE" stroke="#1A1A1A" strokeWidth="2.5" />
          {/* neck + head */}
          <path d="M101 88 h18 v16 q-9 7 -18 0 z" fill="#DCD7CE" />
          <ellipse cx="110" cy="60" rx="26" ry="28" fill="#DCD7CE" stroke="#1A1A1A" strokeWidth="3" />
          <ellipse cx="84" cy="63" rx="3.4" ry="4.8" fill="#CFC9BE" stroke="#1A1A1A" strokeWidth="2" />
          <ellipse cx="136" cy="63" rx="3.4" ry="4.8" fill="#CFC9BE" stroke="#1A1A1A" strokeWidth="2" />
          <circle cx="100" cy="65" r="2.7" fill="#1A1A1A" />
          <circle cx="120" cy="65" r="2.7" fill="#1A1A1A" />
          <path d="M95 57.5 q4.5 -2.4 9 -1 M106 56.5 q4.5 -1.4 9 1" stroke="#1A1A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M108.5 68 v5" stroke="#8f8a80" strokeWidth="2" strokeLinecap="round" />
          <path d="M104 79 q6 4 12 0" stroke="#1A1A1A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </symbol>

        {/* ============ V0 EMBER — cropped hair, overshirt, vermilion stitch ============ */}
        <symbol id="ill-hero-v0" viewBox="0 0 220 360">
          <path d="M84 52 Q82 30 110 28 Q138 30 136 52 L133 44 Q126 34 110 34 Q94 34 87 44 Z" fill="#1A1A1A" />
          <path d="M84 52 q-3 14 0 24 l6 -2 -2 -22 z M136 52 q3 14 0 24 l-6 -2 2 -22 z" fill="#1A1A1A" />
          <path d="M92 96 L110 122 L128 96 L142 100 L146 172 Q147 196 126 198 L94 198 Q73 196 74 172 L78 100 Z" fill="#8A8A86" stroke="#1A1A1A" strokeWidth="3" strokeLinejoin="round" />
          <path d="M92 96 L110 122 L128 96 L124 210 M96 96 L96 210" stroke="#1A1A1A" strokeWidth="2" fill="none" opacity=".45" />
          <path d="M102 118 h16 v70 q-8 6 -16 0 z" fill="#F4F4F2" stroke="#1A1A1A" strokeWidth="2.5" />
          <path d="M106 130 h8 M106 136 h8" stroke="#BC4028" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M78 100 Q64 108 62 130 L60 168" stroke="#1A1A1A" strokeWidth="11" strokeLinecap="round" fill="none" />
          <path d="M142 100 Q156 108 158 130 L160 168" stroke="#1A1A1A" strokeWidth="11" strokeLinecap="round" fill="none" />
        </symbol>

        {/* ============ V1 SAGE — tied hair, hoodie ============ */}
        <symbol id="ill-hero-v1" viewBox="0 0 220 360">
          <path d="M84 54 Q80 28 110 26 Q140 28 136 54 Q136 44 128 40 L124 66 Q118 50 110 50 Q100 50 96 64 L92 42 Q86 46 84 54" fill="#1A1A1A" />
          <path d="M132 60 q16 8 14 34 q-1 16 -10 22 q4 -22 -8 -34 z" fill="#1A1A1A" />
          <circle cx="142" cy="96" r="4" fill="#BC4028" />
          <path d="M92 96 Q110 106 128 96 L130 88 Q110 96 90 88 Z" fill="#3A3A3A" />
          <path d="M78 102 Q76 94 90 92 L130 92 Q144 94 142 102 L146 170 Q148 194 126 196 L94 196 Q72 194 74 170 Z" fill="#C6C6C2" stroke="#1A1A1A" strokeWidth="3" strokeLinejoin="round" />
          <path d="M92 150 h36 M94 158 h32" stroke="#1A1A1A" strokeWidth="2" opacity=".4" strokeLinecap="round" />
          <path d="M78 102 Q64 110 62 132 L60 168" stroke="#C6C6C2" strokeWidth="14" strokeLinecap="round" fill="none" />
          <path d="M142 102 Q156 110 158 132 L160 168" stroke="#C6C6C2" strokeWidth="14" strokeLinecap="round" fill="none" />
        </symbol>

        {/* ============ V2 WARDEN — beanie, technical jacket ============ */}
        <symbol id="ill-hero-v2" viewBox="0 0 220 360">
          <path d="M82 50 Q84 26 110 26 Q136 26 138 50 L138 56 L82 56 Z" fill="#2B2B2B" />
          <path d="M80 56 h60 v6 h-60 z" fill="#1A1A1A" />
          <path d="M88 62 q-4 8 -4 18 M132 62 q4 8 4 18" stroke="#1A1A1A" strokeWidth="5" strokeLinecap="round" />
          <path d="M90 94 L110 112 L130 94 L144 100 L147 172 Q148 196 126 198 L94 198 Q72 196 73 172 L76 100 Z" fill="#333332" stroke="#1A1A1A" strokeWidth="3" strokeLinejoin="round" />
          <path d="M110 112 v86" stroke="#F4F4F2" strokeWidth="3" />
          <circle cx="110" cy="132" r="1.8" fill="#F4F4F2" /><circle cx="110" cy="152" r="1.8" fill="#F4F4F2" />
          <path d="M90 94 L98 108 L86 104 Z M130 94 L122 108 L134 104 Z" fill="#262625" stroke="#1A1A1A" strokeWidth="2" />
          <path d="M76 100 Q62 108 60 130 L58 168" stroke="#333332" strokeWidth="13" strokeLinecap="round" fill="none" />
          <path d="M144 100 Q158 108 160 130 L162 168" stroke="#333332" strokeWidth="13" strokeLinecap="round" fill="none" />
          <path d="M122 148 h14 v10 h-14 z" fill="none" stroke="#F4F4F2" strokeWidth="2" />
        </symbol>

        {/* ============ V3 SCOUT — wavy hair, tee + backpack straps ============ */}
        <symbol id="ill-hero-v3" viewBox="0 0 220 360">
          <path d="M83 55 Q78 28 110 26 Q142 28 137 55 Q139 46 133 42 Q136 54 130 58 Q128 46 118 45 Q112 52 102 48 Q94 48 92 58 Q86 58 86 48 Q81 50 83 55" fill="#1A1A1A" />
          <path d="M84 50 q-4 18 0 32 M136 50 q4 18 0 32" stroke="#1A1A1A" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M88 100 L110 116 L132 100 L144 106 L145 172 Q145 194 124 196 L96 196 Q75 194 75 172 L76 106 Z" fill="#EFEFEC" stroke="#1A1A1A" strokeWidth="3" strokeLinejoin="round" />
          <path d="M92 102 L102 170 M128 102 L118 170" stroke="#1A1A1A" strokeWidth="7" strokeLinecap="round" />
          <rect x="120" y="140" width="12" height="16" rx="2" fill="#BC4028" />
          <path d="M76 106 Q64 114 62 134 L60 168" stroke="#DCD7CE" strokeWidth="12" strokeLinecap="round" fill="none" opacity=".85" />
          <path d="M144 106 Q156 114 158 134 L160 168" stroke="#DCD7CE" strokeWidth="12" strokeLinecap="round" fill="none" opacity=".85" />
        </symbol>

        {/* ============ V4 MYSTIC — straight hair, turtleneck + long coat ============ */}
        <symbol id="ill-hero-v4" viewBox="0 0 220 360">
          <path d="M82 56 Q78 26 110 24 Q142 26 138 56 L140 96 q2 14 -6 20 q2 -26 -6 -38 l-4 -22 q-4 -8 -14 -8 q-10 0 -14 8 l-4 22 q-8 12 -6 38 q-8 -6 -6 -20 z" fill="#1A1A1A" />
          <path d="M98 88 h24 v14 q-12 8 -24 0 z" fill="#262625" />
          <path d="M84 100 L98 118 L110 110 L122 118 L136 100 L146 108 L148 200 Q149 236 128 244 L92 244 Q71 236 72 200 L74 108 Z" fill="#B9B9B4" stroke="#1A1A1A" strokeWidth="3" strokeLinejoin="round" />
          <path d="M110 110 v130" stroke="#1A1A1A" strokeWidth="2" opacity=".5" />
          <path d="M84 100 L98 118 M136 100 L122 118" stroke="#1A1A1A" strokeWidth="2" fill="none" />
          <path d="M74 108 Q62 116 61 136 L60 170" stroke="#B9B9B4" strokeWidth="13" strokeLinecap="round" fill="none" opacity=".9" />
          <path d="M146 108 Q158 116 159 136 L160 170" stroke="#B9B9B4" strokeWidth="13" strokeLinecap="round" fill="none" opacity=".9" />
        </symbol>

        {/* ============ V5 FORGE — neat hair, glasses, work jacket ============ */}
        <symbol id="ill-hero-v5" viewBox="0 0 220 360">
          <path d="M84 54 Q84 30 110 30 Q136 30 136 54 L134 46 Q128 38 118 38 L116 46 Q108 38 100 42 L98 36 Q90 38 88 48 Z" fill="#1A1A1A" />
          <circle cx="100" cy="65" r="7.5" fill="none" stroke="#1A1A1A" strokeWidth="2" />
          <circle cx="120" cy="65" r="7.5" fill="none" stroke="#1A1A1A" strokeWidth="2" />
          <path d="M107.5 65 h5" stroke="#1A1A1A" strokeWidth="2" />
          <path d="M90 96 L110 120 L130 96 L143 101 L146 172 Q147 196 126 198 L94 198 Q73 196 74 172 L77 101 Z" fill="#77776F" stroke="#1A1A1A" strokeWidth="3" strokeLinejoin="round" />
          <path d="M92 96 L110 120 L128 96" fill="none" stroke="#1A1A1A" strokeWidth="2" />
          <rect x="120" y="132" width="14" height="18" rx="2" fill="none" stroke="#1A1A1A" strokeWidth="2" />
          <path d="M77 101 Q63 109 61 131 L59 168" stroke="#77776F" strokeWidth="13" strokeLinecap="round" fill="none" />
          <path d="M143 101 Q157 109 159 131 L161 168" stroke="#77776F" strokeWidth="13" strokeLinecap="round" fill="none" />
        </symbol>

        {/* ============ COMPANION — small fox, ink + vermilion tail tip ============ */}
        <symbol id="ill-companion" viewBox="0 0 140 110">
          <path d="M96 78 q30 -2 34 -30 q4 26 -26 34 z" fill="#2B2B2B" />
          <path d="M122 52 q8 -2 10 -8 q2 10 -10 12 z" fill="#BC4028" />
          <path d="M40 46 L30 14 L60 36 Z" fill="#E4E4E0" stroke="#1A1A1A" strokeWidth="3" strokeLinejoin="round" />
          <path d="M94 46 L104 14 L74 36 Z" fill="#E4E4E0" stroke="#1A1A1A" strokeWidth="3" strokeLinejoin="round" />
          <path d="M40 44 L36 28 L50 38 Z M94 44 L98 28 L84 38 Z" fill="#1A1A1A" />
          <ellipse cx="67" cy="72" rx="34" ry="30" fill="#EFEFEC" stroke="#1A1A1A" strokeWidth="3" />
          <ellipse cx="67" cy="88" rx="19" ry="11" fill="#fff" />
          <circle cx="54" cy="68" r="3.4" fill="#1A1A1A" />
          <circle cx="80" cy="68" r="3.4" fill="#1A1A1A" />
          <path d="M63 77 q4 3.4 8 0" stroke="#1A1A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="67" cy="74" r="1.8" fill="#1A1A1A" />
        </symbol>

        {/* ============ ENVIRONMENTS — quiet paper washes ============ */}
        <symbol id="ill-env-day" viewBox="0 0 800 300" preserveAspectRatio="xMidYMax slice">
          <rect width="800" height="300" fill="#F7F7F5" />
          <circle cx="640" cy="80" r="26" fill="none" stroke="#A0A0A0" strokeWidth="2" />
          <path d="M0 190 Q200 160 400 182 Q600 204 800 176" fill="none" stroke="#D8D8D8" strokeWidth="2" />
          <path d="M0 232 Q240 200 480 226 Q640 240 800 218" fill="none" stroke="#E4E4E1" strokeWidth="2" />
          <path d="M120 232 v22 M124 236 v14 M700 222 v20 M704 226 v12" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round" />
          <rect x="586" y="150" width="52" height="5" rx="2.5" fill="#D8D8D8" />
          <rect x="594" y="161" width="36" height="4" rx="2" fill="#E4E4E1" />
        </symbol>
        <symbol id="ill-env-night" viewBox="0 0 800 300" preserveAspectRatio="xMidYMax slice">
          <rect width="800" height="300" fill="#101010" />
          <circle cx="640" cy="80" r="22" fill="none" stroke="#5F5F5F" strokeWidth="2" />
          <g fill="#5F5F5F">
            <circle cx="140" cy="60" r="1.6" /><circle cx="300" cy="44" r="1.8" /><circle cx="470" cy="66" r="1.3" />
            <circle cx="80" cy="120" r="1.2" /><circle cx="380" cy="104" r="1.1" /><circle cx="740" cy="130" r="1.4" />
          </g>
          <path d="M0 190 Q200 164 400 184 Q600 204 800 178" fill="none" stroke="#2A2A28" strokeWidth="2" />
          <path d="M0 232 Q240 204 480 228 Q640 240 800 220" fill="none" stroke="#1E1E1C" strokeWidth="2" />
          <rect x="586" y="150" width="52" height="5" rx="2.5" fill="#2A2A28" />
        </symbol>

        {/* ICONS — thin precise linework */}
        <symbol id="i-today" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M8 3v4M16 3v4M4 10.5h16" /><path d="M9.5 15.5l2 2 3.5-4" /></g></symbol>
        <symbol id="i-quests" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4.4" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /></g></symbol>
        <symbol id="i-campaigns" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="6" cy="18" r="2.4" /><circle cx="18" cy="6" r="2.4" /><path d="M8.4 18H14a3.4 3.4 0 0 0 0-6.8h-4a3.4 3.4 0 0 1 0-6.8h5.4" /></g></symbol>
        <symbol id="i-focus" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="7.5" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /><path d="M12 2.5v2M21.5 12h-2M12 21.5v-2M2.5 12h2" /></g></symbol>
        <symbol id="i-realm" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.2-3.4 3.8-5 7-5s5.8 1.6 7 5" /></g></symbol>
        <symbol id="i-chronicle" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19a2 2 0 0 1 2-2h13" /><path d="M9 7.5h6" /></g></symbol>
        <symbol id="i-store" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8h12l-1.1 12H7.1z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></g></symbol>
        <symbol id="i-settings" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /><circle cx="9" cy="7" r="2.1" /><circle cx="15" cy="12" r="2.1" /><circle cx="11" cy="17" r="2.1" /></g></symbol>
        <symbol id="i-search" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="11" cy="11" r="6.2" /><path d="M15.8 15.8L20 20" /></g></symbol>
        <symbol id="i-bell" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 16v-5a6 6 0 0 1 12 0v5l1.6 2.6H4.4z" /><path d="M10 21a2.2 2.2 0 0 0 4 0" /></g></symbol>
        <symbol id="i-coin" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="8.2" /><circle cx="12" cy="12" r="3.4" /></g></symbol>
        <symbol id="i-plus" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></g></symbol>
        <symbol id="i-check" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7.5" /></symbol>
        <symbol id="i-play" viewBox="0 0 24 24"><path fill="currentColor" d="M8.5 5.5v13l10.5-6.5z" /></symbol>
        <symbol id="i-pause" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M9 5.5v13M15 5.5v13" /></g></symbol>
        <symbol id="i-flame" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" d="M12 3c.5 3.2-4.6 5.4-4.6 9.6a4.9 4.9 0 0 0 9.8 0C17.2 8.6 13.2 7.2 12 3zM12 13.5c-1.1.9-1.6 1.7-1.6 2.6a1.9 1.9 0 0 0 3.8 0c0-1.1-1-1.8-2.2-2.6z" /></symbol>
        <symbol id="i-close" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></g></symbol>
        <symbol id="i-arrow-r" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></g></symbol>
        <symbol id="i-sun" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M18.7 5.3l-1.5 1.5M6.8 17.2l-1.5 1.5" /></g></symbol>
        <symbol id="i-moon" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" d="M20 13.6A8.2 8.2 0 0 1 10.4 4 8.2 8.2 0 1 0 20 13.6z" /></symbol>
        <symbol id="i-spark" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.5l2 6.6 6.6 2-6.6 2-2 6.6-2-6.6-6.6-2 6.6-2z" /></symbol>
        <symbol id="i-clock" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="8" /><path d="M12 7.5v4.8l3 1.8" /></g></symbol>
        <symbol id="i-strength" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M7.5 8v8M4.5 9.8v4.4M16.5 8v8M19.5 9.8v4.4M7.5 12h9" /></g></symbol>
        <symbol id="i-vitality" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" d="M12 20s-7.2-4.6-7.2-9.7A4.1 4.1 0 0 1 12 7.2a4.1 4.1 0 0 1 7.2 3.1C19.2 15.4 12 20 12 20z" /></symbol>
        <symbol id="i-intellect" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M12 6.2C10 4.6 7 4.2 4 4.7V18.4c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V4.7c-3-.5-6-.1-8 1.5z" /><path d="M12 6.2v13.7" /></g></symbol>
        <symbol id="i-focusattr" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M3 12s3.4-6 9-6 9 6 9 6-3.4 6-9 6-9-6-9-6z" /><circle cx="12" cy="12" r="2.4" /></g></symbol>
        <symbol id="i-discipline" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" d="M12 3l7 2.5v5.6c0 4.9-3 7.9-7 9.9-4-2-7-5-7-9.9V5.5z" /></symbol>
        <symbol id="i-craft" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M14.5 4.5l5 5L8.5 20.5H3.5v-5z" /><path d="M12.5 6.5l5 5" /></g></symbol>
        <symbol id="i-connection" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19c.8-3 2.9-4.6 5.5-4.6s4.7 1.6 5.5 4.6" /><circle cx="17" cy="9.5" r="2.2" /><path d="M16.2 14.6c2.1.3 3.6 1.6 4.3 3.9" /></g></symbol>
        <symbol id="i-exploration" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><circle cx="12" cy="12" r="8" /><path d="M15 9l-1.8 4.5L8.8 15.2l1.8-4.5z" /></g></symbol>
        <symbol id="i-level" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9z" /></g></symbol>
        <symbol id="i-vol" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" /><path d="M15 9a4.2 4.2 0 0 1 0 6M17.6 6.8a7.4 7.4 0 0 1 0 10.4" /></g></symbol>
        <symbol id="i-volx" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" /><path d="M15.5 9.5l5 5M20.5 9.5l-5 5" /></g></symbol>
        <symbol id="i-trophy" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M8 4h8v6a4 4 0 0 1-8 0z" /><path d="M8 5.5H4.5A3.5 3.5 0 0 0 8 9M16 5.5h3.5A3.5 3.5 0 0 1 16 9" /><path d="M12 14v3M8.5 20h7M10 17h4" /></g></symbol>
      </defs>
    </svg>
  );
}
