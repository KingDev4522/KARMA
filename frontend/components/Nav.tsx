"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ClockCounterClockwise,
  Flag,
  GearSix,
  House,
  MagnifyingGlass,
  Medal,
  Scroll,
  Storefront,
  Timer,
  type Icon,
} from "@phosphor-icons/react";
import { CoinPurse } from "./rpg";
import { ThemeToggle } from "./ThemeToggle";
import { CommandPalette } from "./CommandPalette";
import { cn } from "@/lib/cn";

const PRIMARY: { href: string; label: string; icon: Icon }[] = [
  { href: "/", label: "Today", icon: House },
  { href: "/quests", label: "Quests", icon: Scroll },
  { href: "/campaigns", label: "Campaigns", icon: Flag },
  { href: "/focus", label: "Focus", icon: Timer },
  { href: "/realm", label: "Realm", icon: Medal },
  { href: "/chronicle", label: "Chronicle", icon: ClockCounterClockwise },
];

const SECONDARY: { href: string; label: string; icon: Icon }[] = [
  { href: "/store", label: "Store", icon: Storefront },
  { href: "/settings", label: "Settings", icon: GearSix },
];

/**
 * Application shell navigation: persistent rail (desktop) + bottom bar (mobile),
 * compact hero identity, global coins, theme toggle, command access.
 */
export function Nav({ heroName, level, coins }: { heroName?: string; level?: number; coins?: number }) {
  const path = usePathname();
  const [palette, setPalette] = useState(false);
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const item = (l: { href: string; label: string; icon: Icon }) => {
    const Icon = l.icon;
    const active = isActive(l.href);
    return (
      <Link
        key={l.href}
        href={l.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-2.5 rounded-control px-3 py-2 text-sm pressable",
          active ? "bg-xp/10 font-semibold text-ink-primary" : "text-ink-secondary hover:bg-surface-overlay/60",
        )}
      >
        <Icon size={18} weight={active ? "fill" : "regular"} aria-hidden />
        <span className="max-md:hidden">{l.label}</span>
        {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-xp max-md:hidden" aria-hidden />}
      </Link>
    );
  };

  return (
    <>
      <nav aria-label="Primary" className="sticky top-0 z-30 flex h-dvh w-60 shrink-0 flex-col gap-1 overflow-y-auto border-r border-line bg-surface-elevated/60 p-4 backdrop-blur max-md:hidden">
        <Link href="/" className="mb-1 flex items-center gap-2 px-1" aria-label="LIFE RPG home">
          <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-seal font-display text-sm font-bold text-white" aria-hidden>
            命
          </span>
          <span className="font-display text-lg tracking-wide">LIFE RPG</span>
        </Link>

        {(heroName || typeof level === "number") && (
          <div className="mb-2 rounded-card border border-line bg-surface-card px-3 py-2.5" aria-label="Hero identity">
            <p className="truncate text-sm font-semibold">{heroName ?? "Unnamed Hero"}</p>
            <p className="text-xs text-ink-muted">Level {level ?? 1}</p>
          </div>
        )}

        <button
          onClick={() => setPalette(true)}
          className="mb-2 flex items-center gap-2 rounded-control border border-line bg-surface-card px-3 py-2 text-sm text-ink-muted hover:border-xp/50"
          aria-label="Open command palette"
        >
          <MagnifyingGlass size={15} aria-hidden />
          <span>Jump to…</span>
          <kbd className="ml-auto rounded border border-line bg-surface-overlay px-1.5 text-[11px]">⌘K</kbd>
        </button>

        {PRIMARY.map(item)}
        <div className="my-2 border-t border-line" aria-hidden />
        {SECONDARY.map(item)}

        <div className="mt-auto space-y-2 border-t border-line pt-3">
          <div className="flex items-center justify-between px-1">
            {typeof coins === "number" ? <CoinPurse coins={coins} /> : <span />}
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <nav aria-label="Primary mobile" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface-elevated/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="flex justify-around px-1 py-1.5">
          {PRIMARY.slice(0, 5).map((l) => {
            const Icon = l.icon;
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                aria-label={l.label}
                className={cn("flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-control px-2", active ? "text-xp" : "text-ink-secondary")}
              >
                <Icon size={20} weight={active ? "fill" : "regular"} aria-hidden />
                <span className="text-[10px]">{l.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <CommandPalette open={palette} onOpenChange={setPalette} />
    </>
  );
}
