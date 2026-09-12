"use client";

/** Contextual companion message (LRP-FE-001 §11). Compact, never dominating. */
const MOOD_GLYPH: Record<string, string> = {
  greeting: "✦",
  encouraging: "›",
  celebrating: "★",
  focused: "◉",
  resting: "☾",
  idle: "·",
};

export function Companion({ mood, message }: { mood: string; message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-surface-elevated p-3" role="status" aria-label={`Companion (${mood})`}>
      <span aria-hidden className="text-xl text-coin">
        {MOOD_GLYPH[mood] ?? "·"}
      </span>
      <p className="text-sm text-ink-secondary">{message}</p>
    </div>
  );
}
