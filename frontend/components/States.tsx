"use client";

import type { ApiErrorShape } from "@/lib/api";

/** Loading / Empty / Error(+retry) states (LRP-FE-001 §16–§18, ARCH §12). */

export function Skeleton({ label }: { label: string }) {
  return (
    <div aria-busy="true" aria-label={`Loading ${label}`} className="animate-pulse space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 rounded-xl bg-surface-card" />
      ))}
    </div>
  );
}

export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-surface-overlay p-6 text-center">
      <p className="text-sm text-ink-secondary">{message}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: ApiErrorShape; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-danger/40 bg-surface-card p-4">
      <p className="text-sm font-medium text-ink-primary">Something didn&apos;t land.</p>
      <p className="mt-1 text-sm text-ink-secondary">{error.body?.message ?? error.message}</p>
      <p className="mt-1 text-xs text-ink-muted">Your progress was not changed.</p>
      {(error.body?.retryable ?? true) && (
        <button
          onClick={onRetry}
          className="mt-3 rounded-lg bg-xp px-3 py-1.5 text-sm font-semibold text-surface-bg focus-visible:outline-2 focus-visible:outline-white"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
