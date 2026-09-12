"use client";

import { useEffect } from "react";
import { CompanionImage } from "@/components/illustrations";

export interface CelebrationData {
  companionAssetId?: string | null;
  companionName?: string | null;
  message: string;
}

/**
 * Companion cheers — the player's OWN companion face beside a contextual
 * message that differs per event (quest, level-up, badge, milestone…).
 * Non-modal bottom sheet: it never blocks the level-up ceremony.
 */
export function Celebration({ data, onClose }: { data: CelebrationData | null; onClose: () => void }) {
  useEffect(() => {
    if (!data) return;
    const id = setTimeout(onClose, 4200);
    return () => clearTimeout(id);
  }, [data, onClose]);

  if (!data) return null;
  return (
    <div className="celebration" role="status" aria-live="polite" aria-label="Companion cheers">
      <CompanionImage assetId={data.companionAssetId} width={64} alt={data.companionName ?? "Companion"} eager />
      <div className="celebration-bubble">
        {data.companionName && <strong>{data.companionName}</strong>}
        <p>{data.message}</p>
      </div>
      <button className="icon-btn celebration-close" onClick={onClose} aria-label="Dismiss cheer">
        ✕
      </button>
    </div>
  );
}

export function celebrationFrom(
  r: { companion?: { message?: string; companionAssetId?: string | null; companionName?: string | null } | null },
  fallback?: { companionAssetId?: string | null; companionName?: string | null },
): CelebrationData | null {
  const message = r?.companion?.message;
  if (!message) return null;
  return {
    companionAssetId: r?.companion?.companionAssetId ?? fallback?.companionAssetId ?? null,
    companionName: r?.companion?.companionName ?? fallback?.companionName ?? null,
    message,
  };
}
