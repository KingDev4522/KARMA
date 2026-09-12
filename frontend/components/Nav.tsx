"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Primary nav (LRP-FE-001 §3) + mobile bottom nav (§19). Keyboard-complete, semantic. */
const PRIMARY = [
  { href: "/", label: "Today" },
  { href: "/quests", label: "Quests" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/focus", label: "Focus" },
  { href: "/realm", label: "Realm" },
  { href: "/chronicle", label: "Chronicle" },
];

const SECONDARY = [
  { href: "/store", label: "Store" },
  { href: "/settings", label: "Settings" },
];

export function Nav() {
  const path = usePathname();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <>
      <nav aria-label="Primary" className="hidden md:flex md:w-52 md:shrink-0 md:flex-col md:gap-1 md:p-4">
        <p className="px-3 pb-2 font-display text-sm tracking-widest text-ink-muted">LIFE RPG</p>
        {PRIMARY.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={isActive(l.href) ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-xp ${
              isActive(l.href) ? "bg-surface-card text-ink-primary shadow-glow" : "text-ink-secondary hover:bg-surface-elevated"
            }`}
          >
            {l.label}
          </Link>
        ))}
        <div className="my-2 border-t border-surface-overlay" />
        {SECONDARY.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={isActive(l.href) ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-xp ${
              isActive(l.href) ? "bg-surface-card text-ink-primary" : "text-ink-secondary hover:bg-surface-elevated"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <nav aria-label="Primary mobile" className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-surface-overlay bg-surface-bg/95 p-2 backdrop-blur md:hidden">
        {PRIMARY.slice(0, 5).map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={isActive(l.href) ? "page" : undefined}
            className={`rounded-md px-2 py-2 text-xs focus-visible:outline-2 focus-visible:outline-xp ${
              isActive(l.href) ? "text-coin" : "text-ink-secondary"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
