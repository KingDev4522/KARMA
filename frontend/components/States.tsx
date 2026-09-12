"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ApiErrorShape } from "@/lib/api";
import { Icon } from "@/components/illustrations";

/** Loading / Empty / Error(+retry) states in the Live-deliberately skin. */

const LOADER_LINES = [
  "Polishing quest cards…",
  "Feeding your companion…",
  "Counting coins…",
  "Unrolling the campaign map…",
  "Sharpening focus…",
  "Consulting the stars…",
];

/** KARMA loader — spinning coin, flavor line, shimmer rows. Same props as
 *  the old skeleton so every call site stays untouched. */
export function Skeleton({ label, rows = 3 }: { label: string; rows?: number }) {
  const [line, setLine] = useState(0);
  useEffect(() => {
    if (document.documentElement.dataset.motion === "off") return;
    const id = setInterval(() => setLine((l) => (l + 1) % LOADER_LINES.length), 1400);
    return () => clearInterval(id);
  }, []);
  return (
    <div aria-busy="true" aria-label={`Loading ${label}`} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="karma-loader" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/coin.png" alt="" className="karma-loader-coin" width={34} height={34} />
        <span className="karma-loader-line">{LOADER_LINES[line % LOADER_LINES.length]}</span>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-block" style={{ height: i === 0 ? 120 : 72 }} />
      ))}
    </div>
  );
}

export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="empty-state panel">
      <Icon id="i-quests" />
      <p>{message}</p>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: ApiErrorShape; onRetry: () => void }) {
  return (
    <div role="alert" className="error-state">
      <h3>Something didn&apos;t land.</h3>
      <p>{error.body?.message ?? error.message}</p>
      <p style={{ marginTop: 4, fontSize: 12 }}>Your progress was not changed.</p>
      {(error.body?.retryable ?? true) && (
        <button onClick={onRetry} className="btn btn--primary" style={{ marginTop: 14 }}>
          Try Again
        </button>
      )}
    </div>
  );
}

export function useNowDate(): string {
  const [s, setS] = useState("");
  useEffect(() => {
    setS(new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));
  }, []);
  return s;
}

/** Signed-out door: shown instead of an error wall when there is no session. */
export function SignInPrompt({ message }: { message?: string }) {
  return (
    <div className="panel" style={{ padding: "44px 30px", textAlign: "center", maxWidth: 480, margin: "6vh auto 0" }}>
      <span className="brand-mark" style={{ margin: "0 auto" }}>
        <Icon id="i-spark" />
      </span>
      <h1 style={{ fontSize: 24, marginTop: 14 }}>The realm is sealed</h1>
      <p style={{ fontSize: 13.5, color: "var(--text-2)", marginTop: 6 }}>
        {message ?? "Sign in to open your quests, XP and identity — they persist across every device."}
      </p>
      <Link href="/login" className="btn btn--primary" style={{ marginTop: 18 }}>
        Sign in with Google
      </Link>
    </div>
  );
}
