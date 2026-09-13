"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { client } from "@/lib/api";
import { Icon, IconSprite, BrandLogo, CoinImg, AvatarImg, type IconId } from "@/components/illustrations";
import { useIdentity } from "@/lib/identity-context";
import { Splash, splashSeen } from "@/components/splash";
import type { Notice } from "@/lib/types";

const NAV: { id: string; href: string; label: string; icon: IconId }[] = [
  { id: "today", href: "/", label: "Today", icon: "i-today" },
  { id: "quests", href: "/quests", label: "Quests", icon: "i-quests" },
  { id: "campaigns", href: "/campaigns", label: "Campaigns", icon: "i-campaigns" },
  { id: "focus", href: "/focus", label: "Focus", icon: "i-focus" },
  { id: "realm", href: "/realm", label: "Realm", icon: "i-realm" },
  { id: "chronicle", href: "/chronicle", label: "Chronicle", icon: "i-chronicle" },
];

const MORE: { id: string; href: string; label: string; icon: IconId }[] = [
  { id: "store", href: "/store", label: "Store", icon: "i-store" },
  { id: "personalize", href: "/personalize", label: "Personalize", icon: "i-spark" },
  { id: "hero-card", href: "/hero-card", label: "Character Card", icon: "i-level" },
  { id: "settings", href: "/settings", label: "Settings", icon: "i-settings" },
];

const TITLES: Record<string, string> = {
  "/": "Today",
  "/quests": "Quests",
  "/campaigns": "Campaigns",
  "/focus": "Focus",
  "/realm": "Realm",
  "/chronicle": "Chronicle",
  "/store": "Store",
  "/personalize": "Personalize",
  "/settings": "Settings",
  "/hero-card": "Character Card",
  "/onboarding": "Onboarding",
  "/login": "Sign in",
};

/** Public routes that mint or need no session (hard auth gate allow-list). */
const PUBLIC_PATHS = ["/login", "/auth/callback", "/auth/welcome", "/privacy"];

// Optional right-panel slot prop — reserved for future detail/preview pane (e.g. quest inspector).
// Not rendered yet; CSS for .right-panel will be added in P2 when the slot is used.
export function Shell({ children, rightPanel }: { children: React.ReactNode; rightPanel?: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { authHeaders, userId, signOut, email, loading: authLoading } = useAuth();
  const { theme, toggle } = useTheme();
  // Identity lives in shared context (populated by refreshIdentity below) so
  // child pages never re-fetch /quests/today just for header info.
  const identityCtx = useIdentity();
  const identity = identityCtx;
  const setIdentity = identityCtx.setIdentity;
  const [notices, setNotices] = useState<Notice[]>([]);
  const [query, setQuery] = useState("");
  const [coinDelta, setCoinDelta] = useState<0 | 1 | -1>(0);
  const prevCoins = useRef<number | null>(null);

  // Coin delta arrow: green ▲ when coins arrive (quest/campaign rewards),
  // red ▼ when coins leave (store purchases). Clears after a beat.
  useEffect(() => {
    if (prevCoins.current === null) {
      prevCoins.current = identity.coins;
      return;
    }
    if (identity.coins > prevCoins.current) setCoinDelta(1);
    else if (identity.coins < prevCoins.current) setCoinDelta(-1);
    else return;
    prevCoins.current = identity.coins;
    const id = setTimeout(() => setCoinDelta(0), 2200);
    return () => clearTimeout(id);
  }, [identity.coins]);  const [sideOpen, setSideOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [muted, setMuted] = useState(false);
  const [gate, setGate] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("karma_sidebar_collapsed");
      if (saved === "true") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("karma_sidebar_collapsed", String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  // 120 FPS cursor spotlight sheen & sliding magnetic hover pill for the navigation bar
  const topbarRef = useRef<HTMLElement>(null);
  const [hoverPill, setHoverPill] = useState<{ x: number; y: number; w: number; h: number; opacity: number }>({
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    opacity: 0,
  });
  const rafId = useRef<number | null>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const topbar = topbarRef.current;
    if (!topbar) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      if (!topbarRef.current) return;
      const rect = topbarRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      topbarRef.current.style.setProperty("--mouse-x", `${x}px`);
      topbarRef.current.style.setProperty("--mouse-y", `${y}px`);
      topbarRef.current.style.setProperty("--mouse-active", "1");
    });
  };

  const handlePointerLeave = () => {
    if (topbarRef.current) {
      topbarRef.current.style.setProperty("--mouse-active", "0");
    }
    setHoverPill((prev) => ({ ...prev, opacity: 0 }));
  };

  const handleItemHover = (e: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>) => {
    const topbar = topbarRef.current;
    if (!topbar) return;
    const target = e.currentTarget;
    const topbarRect = topbar.getBoundingClientRect();
    const itemRect = target.getBoundingClientRect();
    setHoverPill({
      x: itemRect.left - topbarRect.left,
      y: itemRect.top - topbarRect.top,
      w: itemRect.width,
      h: itemRect.height,
      opacity: 1,
    });
  };

  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  // Realm gate: once per tab session, after sign-in, the splash warms the
  // realm and waits for the player's tap.
  useEffect(() => {
    if (!authLoading && userId && !splashSeen()) setGate(true);
  }, [authLoading, userId]);

  useEffect(() => {
    void import("@/lib/bgm").then((b) => setMuted(!b.bgmEnabled())).catch(() => undefined);
  }, []);

  const toggleMute = () => {
    void import("@/lib/bgm").then((b) => {
      const next = !b.bgmEnabled();
      b.setBgmEnabled(next);
      if (next) void b.ensureBgm();
      setMuted(!next);
    }).catch(() => undefined);
  };  const searchRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const sideRef = useRef<HTMLElement>(null);

  /** Fetch identity data and notifications in PARALLEL (was sequential). */
  const refreshIdentity = useCallback(() => {
    if (!userId) return;
    // Both requests fire simultaneously — no waterfall.
    Promise.all([
      client.getToday(authHeaders()).catch(() => null),
      client.notifications(authHeaders()).catch(() => null),
    ]).then(([todayData, notifData]) => {
      if (todayData) {
        // Union: team's parallel fetch + safe access, plus avatar fields so
        // the sidebar/profile show the real hero and profile picture.
        const hero = (todayData as unknown as { hero?: { heroAssetId?: string | null; avatarAssetId?: string | null } }).hero;
        setIdentity({
          heroName: todayData.greeting?.heroName ?? "Aki",
          heroAssetId: hero?.heroAssetId ?? null,
          avatarAssetId: hero?.avatarAssetId ?? null,
          level: todayData.greeting?.heroLevel ?? 1,
          rank: todayData.greeting?.rank?.display ?? "Drifter",
          coins: todayData.greeting?.coins ?? 0,
          active: (todayData.counts?.pinned ?? 0) + (todayData.counts?.due ?? 0),
          streak: todayData.streak?.current ?? 0,
        });
      }
      if (notifData?.notifications) {
        setNotices(notifData.notifications);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, authHeaders]);

  // Refresh identity on mount and when path changes.
  useEffect(() => {
    refreshIdentity();
  }, [refreshIdentity, path]);
  // Listen for global refresh events (quest completion, etc.).
  useEffect(() => {
    const fn = () => {
      refreshIdentity();
      const el = document.querySelector(".topbar__progress") as HTMLElement | null;
      if (el && document.documentElement.dataset.motion !== "off" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        el.classList.remove("is-pulse");
        void el.offsetWidth;
        el.classList.add("is-pulse");
        setTimeout(() => el.classList.remove("is-pulse"), 650);
      }
    };
    window.addEventListener("liferpg:refresh", fn);
    return () => window.removeEventListener("liferpg:refresh", fn);
  }, [refreshIdentity]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        setNotifOpen(false);
        setProfileOpen(false);
        setSideOpen(false);
        setMobileSearch(false);
      }
    };
    // Professional dismiss: a tap anywhere outside an open popup/menu closes it.
    // pointerdown beats click so the close lands before the next action.
    const onPointerDown = (e: PointerEvent) => {
      if (!notifOpen && !profileOpen && !sideOpen) return;
      const t = e.target as Node;
      const inside = [notifRef.current, profileRef.current, sideRef.current].some((el) => el?.contains(t));
      if (!inside) {
        setNotifOpen(false);
        setProfileOpen(false);
        setSideOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [notifOpen, profileOpen, sideOpen]);

  // Navigating away always resets popups/menus.
  // aria-hidden + inert for the drawer when closed (mobile a11y).
  useEffect(() => {
    const el = sideRef.current as unknown as HTMLElement & { inert?: boolean };
    if (!el) return;
    if (sideOpen) {
      el.removeAttribute("inert");
      if ("inert" in el) el.inert = false;
    } else {
      el.setAttribute("inert", "");
      if ("inert" in el) el.inert = true;
    }
  }, [sideOpen]);

  useEffect(() => {
    setNotifOpen(false);
    setProfileOpen(false);
    setSideOpen(false);
    setMobileSearch(false);
  }, [path]);

  // When the mobile search row opens, focus the input (it unhides same tick).
  useEffect(() => {
    if (mobileSearch) {
      const id = requestAnimationFrame(() => searchRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [mobileSearch]);

  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const submitSearch = () => {
    setMobileSearch(false);
    router.push(`/quests${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
  };

  // Hover prefetch: warm the api() cache for a tab's primary endpoint before
  // the click, so second (and often first) visits render instantly. GET-only,
  // cache-deduped — hovering never causes duplicate network calls.
  const prefetchRoute = (href: string) => {
    if (!userId) return;
    try {
      const h = authHeaders();
      if (href === "/") client.getToday(h).catch(() => undefined);
      else if (href === "/quests") client.listQuests(h).catch(() => undefined);
      else if (href === "/campaigns") client.listCampaigns(h).catch(() => undefined);
      else if (href === "/store") client.store(h).catch(() => undefined);
      else if (href === "/realm") client.realm(h).catch(() => undefined);
      else if (href === "/chronicle") client.history(h, 30).catch(() => undefined);
      else if (href === "/hero-card") client.heroCard(h).catch(() => undefined);
      else if (href === "/personalize" || href === "/settings") client.getProfile(h).catch(() => undefined);
    } catch {
      /* best-effort */
    }
  };

  // Hard auth gate: signed-out visitors only ever see the login screen.
  // Auth callback/welcome stay public (they mint the session).
  const isPublic = PUBLIC_PATHS.some((p) => p === path);
  const signedOut = !authLoading && !userId;
  useEffect(() => {
    if (signedOut && !isPublic) router.replace("/login");
  }, [signedOut, isPublic, router]);

  // Blank while resolving, blank gate while redirecting — nothing leaks.
  if (authLoading) return null;
  if (signedOut) {
    if (!isPublic) return null;
    return (
      <div className="app-shell">
        <IconSprite />
        <div className="app-main">
          <main className="app-content" id="main">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <IconSprite />
      {gate && <Splash authHeaders={authHeaders} heroName={identity.heroName} />}

      {/* ============ SIDEBAR ============ */}
      <aside
        ref={sideRef}
        className={`sidebar${sideOpen ? " is-open" : ""}${collapsed ? " is-collapsed" : ""}`}
        aria-label="Primary"
        aria-hidden={sideOpen ? "false" : "true"}
      >
        <div className="sidebar__brand">
          <Link href="/" className="sidebar__brand-link" title="KARMA Home">
            <BrandLogo size={28} />
            <span className="brand-name">
              KARMA
              <em className="brand-rpg">RPG</em>
            </span>
          </Link>
          <button
            type="button"
            className="sidebar__collapse-btn"
            onClick={toggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {collapsed ? (
                <path d="M9 18l6-6-6-6" />
              ) : (
                <path d="M15 18l-6-6 6-6" />
              )}
            </svg>
          </button>
        </div>

        <div className="sidebar__label">Workspace</div>
        <nav aria-label="Workspace">
          {NAV.map((n) => (
            <Link
              key={n.id}
              href={n.href}
              data-tour={n.id}
              title={n.label}
              onMouseEnter={() => prefetchRoute(n.href)}
              onFocus={() => prefetchRoute(n.href)}
              aria-current={isActive(n.href) ? "page" : undefined}
              className={`nav-item${isActive(n.href) ? " is-active" : ""}`}
            >
              <span className="nav-icon-wrap">
                <Icon id={n.icon} />
                {n.id === "quests" && identity.active > 0 && (
                  <em className="nav-badge nav-badge--floating">{identity.active}</em>
                )}
              </span>
              <span className="nav-label">{n.label}</span>
              {n.id === "quests" && identity.active > 0 && (
                <em className="nav-badge nav-badge--inline">{identity.active}</em>
              )}
            </Link>
          ))}
        </nav>

        <div className="sidebar__divider" role="separator">
          <span className="divider-line" />
          <span className="divider-rune">◈</span>
          <span className="divider-line" />
        </div>

        <div className="sidebar__label">Realm & Codex</div>
        <nav aria-label="More">
          {MORE.map((n) => (
            <Link
              key={n.id}
              href={n.href}
              data-tour={n.id}
              title={n.label}
              onMouseEnter={() => prefetchRoute(n.href)}
              onFocus={() => prefetchRoute(n.href)}
              aria-current={isActive(n.href) ? "page" : undefined}
              className={`nav-item${isActive(n.href) ? " is-active" : ""}`}
            >
              <span className="nav-icon-wrap">
                <Icon id={n.icon} />
                {n.id === "store" && <em className="nav-dot nav-dot--floating" />}
              </span>
              <span className="nav-label">{n.label}</span>
              {n.id === "store" && <em className="nav-dot nav-dot--inline" />}
            </Link>
          ))}
        </nav>

        {/* User profile */}
        <Link href="/personalize" className="sidebar__user" title="Open Personalize">
          <span className="avatar">
            <AvatarImg
              avatarAssetId={identity.avatarAssetId}
              heroAssetId={identity.heroAssetId}
              width={30}
              alt={identity.heroName}
            />
          </span>
          <span className="sidebar__user-info">
            <strong className="sidebar__user-name">{identity.heroName}</strong>
            <span className="sidebar__user-meta">
              Lv {identity.level} · {identity.rank}
              {identity.streak > 0 && ` · ${identity.streak}d`}
            </span>
          </span>
          <span className="rank-insignia" title={`Level ${identity.level}`}>
            {identity.level}
          </span>
        </Link>
      </aside>
      <div
        className={`sidebar-backdrop${sideOpen ? " is-open" : ""}`}
        onClick={() => setSideOpen(false)}
        aria-hidden="true"
      />

      {/* ============ MAIN ============ */}
      <div className="app-main">
        <div className="topbar-wrapper">
          <header
            ref={topbarRef}
            className="topbar"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          >
            <div
              className="topbar__hover-pill"
              style={{
                transform: `translate3d(${hoverPill.x}px, ${hoverPill.y}px, 0)`,
                width: `${hoverPill.w}px`,
                height: `${hoverPill.h}px`,
                opacity: hoverPill.opacity,
              }}
              aria-hidden="true"
            />
            <button
              className="icon-btn menu-btn"
              onClick={() => setSideOpen(true)}
              onMouseEnter={handleItemHover}
              onFocus={handleItemHover}
              aria-label="Open menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <div
              className="topbar__title-chip"
              onMouseEnter={handleItemHover}
              onFocus={handleItemHover}
            >
              <h1 className="topbar__title">{TITLES[path] ?? "Today"}</h1>
              <span className="topbar__progress" aria-label={"Level " + identity.level}>
                Lv {identity.level}
              </span>
            </div>
            <div
              className={`topbar__search${mobileSearch ? " is-open" : ""}`}
              onMouseEnter={handleItemHover}
              onFocus={handleItemHover}
            >
              <Icon id="i-search" style={{ width: 16, height: 16 }} />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitSearch();
                }}
                placeholder="Search quests, campaigns, or type a command…"
                aria-label="Search quests"
              />
              <kbd>⌘K</kbd>
            </div>
            <div className="topbar__actions">
              <button
                className="icon-btn search-toggle"
                onClick={() => setMobileSearch((v) => !v)}
                onMouseEnter={handleItemHover}
                onFocus={handleItemHover}
                title="Search quests"
                aria-label="Search quests"
                aria-expanded={mobileSearch}
              >
                <Icon id="i-search" />
              </button>
              <div
                className="coin-pill"
                id="coinPill"
                data-tour="coins"
                title="Your coins"
                aria-label={`${identity.coins} coins`}
                onMouseEnter={handleItemHover}
                onFocus={handleItemHover}
              >
                <CoinImg size={16} />
                <span className="coin-val">{identity.coins.toLocaleString("en-US")}</span>
                {coinDelta !== 0 && (
                  <span className={`coin-delta${coinDelta > 0 ? " up" : " down"}`} aria-hidden="true">
                    {coinDelta > 0 ? "▲" : "▼"}
                  </span>
                )}
              </div>
              <button
                className="icon-btn theme-btn"
                onClick={toggle}
                onMouseEnter={handleItemHover}
                onFocus={handleItemHover}
                title="Toggle theme"
                aria-label="Toggle theme"
              >
                <Icon id={theme === "dark" ? "i-sun" : "i-moon"} />
              </button>
              <button
                className="icon-btn mute-btn"
                onClick={toggleMute}
                onMouseEnter={handleItemHover}
                onFocus={handleItemHover}
                title={muted ? "Unmute ambient music" : "Mute ambient music"}
                aria-label={muted ? "Unmute ambient music" : "Mute ambient music"}
                aria-pressed={!muted}
              >
                <Icon id={muted ? "i-volx" : "i-vol"} />
              </button>
              <div className="notif-wrap" ref={notifRef}>
                <button
                  className="icon-btn notif-btn"
                  onClick={() => { setNotifOpen((o) => !o); setProfileOpen(false); }}
                  onMouseEnter={handleItemHover}
                  onFocus={handleItemHover}
                  aria-label={`Notifications, ${notices.filter((n) => n.key !== "all-clear").length} unread`}
                  aria-expanded={notifOpen}
                >
                  <Icon id="i-bell" />
                  {notices.some((n) => n.key !== "all-clear") && <em className="ping" />}
                </button>
                <div className={`dropdown${notifOpen ? " is-open" : ""}`} role="menu" aria-label="Notifications">
                  <div className="dd-head">Notifications</div>
                  {notices.map((n) => (
                    <div className="dd-item" key={n.key}>
                      <Icon id={n.kind === "streak" ? "i-flame" : n.kind === "celebration" ? "i-trophy" : n.kind === "quest" ? "i-quests" : n.kind === "rest" ? "i-moon" : "i-spark"} />
                      <span>
                        <strong>{n.title}</strong>
                        <br />
                        <span style={{ fontWeight: 400, opacity: 0.75 }}>{n.body}</span>
                      </span>
                    </div>
                  ))}
                  <Link href="/settings" className="dd-item" onClick={() => setNotifOpen(false)}>
                    <Icon id="i-settings" /> Notification settings
                  </Link>
                </div>
              </div>
              <div className="profile-wrap" ref={profileRef}>
                <button
                  className="icon-btn profile-btn"
                  style={{ padding: 0 }}
                  data-tour="profile"
                  onClick={() => { setProfileOpen((o) => !o); setNotifOpen(false); }}
                  onMouseEnter={handleItemHover}
                  onFocus={handleItemHover}
                  aria-label="Profile menu"
                  aria-expanded={profileOpen}
                >
                  <span className="avatar" style={{ width: 32, height: 32, overflow: "hidden" }}>
                    <AvatarImg avatarAssetId={identity.avatarAssetId} heroAssetId={identity.heroAssetId} width={24} alt={identity.heroName} />
                  </span>
                </button>
                <div className={`dropdown${profileOpen ? " is-open" : ""}`} role="menu" aria-label="Profile">
                  <div className="dd-head">
                    {identity.heroName} · {identity.rank}
                  </div>
                  <Link href="/realm" className="dd-item" onClick={() => setProfileOpen(false)}>
                    <Icon id="i-realm" /> View Realm
                  </Link>
                  <Link href="/personalize" className="dd-item" onClick={() => setProfileOpen(false)}>
                    <Icon id="i-spark" /> Edit profile
                  </Link>
                  <Link href="/settings" className="dd-item" onClick={() => setProfileOpen(false)}>
                    <Icon id="i-settings" /> Settings
                  </Link>
                  <button
                    className="dd-item"
                    onClick={() => {
                      setProfileOpen(false);
                      signOut();
                    }}
                  >
                    <Icon id="i-arrow-r" />{" "}
                    <span className="dd-label">
                      <span className="dd-title">Sign out</span>
                      {email ? <span className="dd-sub">{email}</span> : null}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </header>
        </div>

        <main className="app-content" id="main">
          {children}
        </main>
      </div>

      {/* ============ MOBILE NAV ============ */}
      <Link href="/quests?create=1" className="fab" aria-label="Create quest">
        <Icon id="i-plus" />
      </Link>
      <nav className="mobile-nav" aria-label="Primary mobile">
        {[
          { id: "today", href: "/", label: "Today", icon: "i-today" as IconId },
          { id: "quests", href: "/quests", label: "Quests", icon: "i-quests" as IconId },
          { id: "campaigns", href: "/campaigns", label: "Campaigns", icon: "i-campaigns" as IconId },
          { id: "focus", href: "/focus", label: "Focus", icon: "i-focus" as IconId },
          { id: "realm", href: "/realm", label: "Realm", icon: "i-realm" as IconId },
          { id: "chronicle", href: "/chronicle", label: "Chronicle", icon: "i-chronicle" as IconId },
        ].map((n) => (
          <Link key={n.id} href={n.href} data-tour={n.id} className={isActive(n.href) ? "is-active" : ""} aria-current={isActive(n.href) ? "page" : undefined}>
            <Icon id={n.icon} />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
