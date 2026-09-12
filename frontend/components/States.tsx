"use client";

import Link from "next/link";
import type { ApiErrorShape } from "@/lib/api";
import { cn } from "@/lib/cn";

/** Loading (skeletal, layout-shaped) / Empty / Error(+retry) / Signed-out states. */

/** Signed-out door: shown instead of an error wall when there is no session. */
export function SignInPrompt({ message }: { message?: string }) {
  return (
    <div className="pattern-asanoha rounded-panel border border-line bg-surface-elevated px-6 py-10 text-center shadow-card">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-[10px] bg-seal font-display text-lg font-bold text-white" aria-hidden>
        命
      </span>
      <h1 className="mt-3 font-display text-2xl">The realm is sealed</h1>
      <p className="mx-auto mt-1 max-w-[42ch] text-sm text-ink-secondary">
        {message ?? "Sign in to open your quests, XP and identity — they persist across every device."}
      </p>
      <Link href="/login" className="mt-5 inline-block rounded-control bg-xp px-6 py-2.5 text-sm font-semibold text-white pressable">
        Sign in with Google
      </Link>
    </div>
  );
}

export function Skeleton({ label, rows = 3 }: { label: string; rows?: number }) {
  return (
    <div aria-busy="true" aria-label={`Loading ${label}`} className="animate-pulse space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn("rounded-card bg-surface-card", i === 0 ? "h-28" : "h-20")}
        />
      ))}
    </div>
  );
}

export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-line bg-surface-card/50 px-6 py-8 text-center">
      <div className="pattern-waves mx-auto mb-3 h-10 w-24 rounded-full" aria-hidden />
      <p className="mx-auto max-w-[40ch] text-sm text-ink-secondary">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: ApiErrorShape; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-card border border-danger/40 bg-surface-card p-5">
      <p className="font-display text-lg">The path is blocked.</p>
      <p className="mt-1 text-sm text-ink-secondary">{error.body?.message ?? error.message}</p>
      <p className="mt-1 text-xs text-ink-muted">Your progress was not changed.</p>
      {(error.body?.retryable ?? true) && (
        <button
          onClick={onRetry}
          className="mt-3 rounded-control bg-xp px-4 py-2 text-sm font-semibold text-white pressable"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
