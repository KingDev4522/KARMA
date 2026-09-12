"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Z } from "@/lib/cn";

const DESTINATIONS = [
  { label: "Today — command center", href: "/" },
  { label: "Quests — work library", href: "/quests" },
  { label: "Campaigns — long journeys", href: "/campaigns" },
  { label: "Focus — execution room", href: "/focus" },
  { label: "Realm — character showcase", href: "/realm" },
  { label: "Chronicle — adventure history", href: "/chronicle" },
  { label: "Calendar — planning", href: "/chronicle#calendar" },
  { label: "Store — identity market", href: "/store" },
  { label: "Hero Card — collectible", href: "/hero-card" },
  { label: "Settings", href: "/settings" },
  { label: "Sign in with Google", href: "/login" },
  { label: "Onboarding — enter the world", href: "/onboarding" },
];

/** Command palette (⌘K): jump anywhere, keyboard-first. */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open ]);

  const hits = DESTINATIONS.filter((d) => d.label.toLowerCase().includes(q.toLowerCase())).slice(0, 8);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink-primary/30" style={{ zIndex: Z.commandPalette }} />
        <Dialog.Content
          aria-label="Command palette"
          className="fixed left-1/2 top-[18dvh] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 rounded-panel bg-surface-elevated p-2 shadow-lift"
          style={{ zIndex: Z.commandPalette + 1 }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setIdx((i) => Math.min(hits.length - 1, i + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setIdx((i) => Math.max(0, i - 1));
            } else if (e.key === "Enter" && hits[idx]) {
              go(hits[idx].href);
            }
          }}
        >
          <Dialog.Title className="sr-only">Jump to a place</Dialog.Title>
          <div className="flex items-center gap-2 rounded-control bg-surface-card px-3 py-2">
            <MagnifyingGlass size={16} className="text-ink-muted" aria-hidden />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setIdx(0);
              }}
              placeholder="Where to, hero?"
              aria-label="Search destinations"
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink-muted"
            />
          </div>
          <ul role="listbox" aria-label="Destinations" className="mt-1 max-h-64 overflow-y-auto">
            {hits.map((h, i) => (
              <li key={h.href} role="option" aria-selected={i === idx}>
                <button
                  onClick={() => go(h.href)}
                  onMouseEnter={() => setIdx(i)}
                  className={`w-full rounded-control px-3 py-2 text-left text-sm ${i === idx ? "bg-xp/10 text-ink-primary" : "text-ink-secondary"}`}
                >
                  {h.label}
                </button>
              </li>
            ))}
            {hits.length === 0 && <li className="px-3 py-4 text-sm text-ink-muted">No such place in this realm.</li>}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
