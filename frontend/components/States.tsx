"use client";

import type { ApiErrorShape } from "@/lib/api";
import { cn } from "@/lib/cn";

/** Loading (skeletal, layout-shaped) / Empty / Error(+retry) states. */

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
