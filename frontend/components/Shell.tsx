"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { client } from "@/lib/api";
import { Hero, Icon, IconSprite, type IconId } from "@/components/illustrations";
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
  "/settings": "Settings",
  "/hero-card": "Hero Card",
  "/onboarding": "Onboarding",
  "/login": "Sign in",
};

/** Public routes that mint or need no session (hard auth gate allow-list). */
const PUBLIC_PATHS = ["/login", "/auth/callback", "/auth/welcome"];

// Optional right-panel slot prop — reserved for future detail/preview pane (e.g. quest inspector).
// Not rendered yet; CSS for .right-panel will be added in P2 when the slot is used.
export function Shell({ children, rightPanel }: { children: React.ReactNode; rightPanel?: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { authHeaders, userId, signOut, email, loading: authLoading } = useAuth();
  const { theme, toggle } = useTheme();
  const [identity, setIdentity] = useState({ heroName: "Aki", level: 1, rank: "Drifter", coins: 0, active: 0, streak: 0 });
  const [notices, setNotices] = useState<Notice[]>([]);
  const [query, setQuery] = useState("");
  const [sideOpen, setSideOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const sideRef = useRef<HTMLElement>(null);

  const refreshIdentity = useCallback(() => {
    if (!userId) return;
    client
      .getToday(authHeaders())
      .then((t) =>
        setIdentity({
          heroName: t.greeting.heroName,
          level: t.greeting.heroLevel,
          rank: t.greeting.rank.display,
          coins: t.greeting.coins,
          active: t.counts.pinned + t.counts.due,
          streak: t.streak.current,
        }),
      )
      .catch(() => undefined);
    client
      .notifications(authHeaders())
      .then((n) => setNotices(n.notifications))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    refreshIdentity();
  }, [refreshIdentity, path]);
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
  }, [path]);

  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const submitSearch = () => {
    router.push(`/quests${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
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

      {/* ============ SIDEBAR ============ */}
      <aside
        ref={sideRef}
        className={`sidebar${sideOpen ? " is-open" : ""}`}
        aria-label="Primary"
        aria-hidden={sideOpen ? "false" : "true"}
      >
        <div className="sidebar__brand">
          <span className="brand-mark" aria-hidden="true">
            L
          </span>
          <span className="brand-name">
            LIFE<em>RPG</em>
          </span>
        </div>
        <div className="sidebar__label">Workspace</div>
        <nav aria-label="Workspace">
          {NAV.map((n) => (
            <Link key={n.id} href={n.href} aria-current={isActive(n.href) ? "page" : undefined} className={`nav-item${isActive(n.href) ? " is-active" : ""}`}>
              <Icon id={n.icon} />
              <span>{n.label}</span>
              {n.id === "quests" && identity.active > 0 && <em className="nav-badge">{identity.active}</em>}
            </Link>
          ))}
        </nav>
        <div className="sidebar__divider" />
        <nav aria-label="More">
          {MORE.map((n) => (
            <Link key={n.id} href={n.href} aria-current={isActive(n.href) ? "page" : undefined} className={`nav-item${isActive(n.href) ? " is-active" : ""}`}>
              <Icon id={n.icon} />
              <span>{n.label}</span>
              {n.id === "store" && <em className="nav-dot" />}
            </Link>
          ))}
        </nav>
        <Link href="/realm" className="sidebar__user">
          <span className="avatar">
            <Hero width={26} />
          </span>
          <span>
            <strong>{identity.heroName}</strong>
            <span>
              Lv {identity.level} · {identity.rank}
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
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setSideOpen(true)} aria-label="Open menu">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <h1 className="topbar__title">{TITLES[path] ?? "Today"}</h1>
          <span className="topbar__progress" aria-label={"Level " + identity.level}>
            {identity.level} · {identity.rank}
          </span>
          <div className="topbar__search">
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
            <div className="coin-pill" id="coinPill" title="Your coins" aria-label={`${identity.coins} coins`}>
              <Icon id="i-coin" />
              <span className="coin-val">{identity.coins.toLocaleString("en-US")}</span>
            </div>
            <button className="icon-btn" onClick={toggle} title="Toggle theme" aria-label="Toggle theme">
              <Icon id={theme === "dark" ? "i-sun" : "i-moon"} />
            </button>
            <div className="notif-wrap" ref={notifRef}>
              <button className="icon-btn" onClick={() => { setNotifOpen((o) => !o); setProfileOpen(false); }} aria-label={`Notifications, ${notices.filter((n) => n.key !== "all-clear").length} unread`} aria-expanded={notifOpen}>
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
                className="icon-btn"
                style={{ padding: 0 }}
                onClick={() => { setProfileOpen((o) => !o); setNotifOpen(false); }}
                aria-label="Profile menu"
                aria-expanded={profileOpen}
              >
                <span className="avatar" style={{ width: 32, height: 32 }}>
                  <Hero width={24} />
                </span>
              </button>
              <div className={`dropdown${profileOpen ? " is-open" : ""}`} role="menu" aria-label="Profile">
                <div className="dd-head">
                  {identity.heroName} · {identity.rank}
                </div>
                <Link href="/realm" className="dd-item" onClick={() => setProfileOpen(false)}>
                  <Icon id="i-realm" /> View Realm
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
          <Link key={n.id} href={n.href} className={isActive(n.href) ? "is-active" : ""} aria-current={isActive(n.href) ? "page" : undefined}>
            <Icon id={n.icon} />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
