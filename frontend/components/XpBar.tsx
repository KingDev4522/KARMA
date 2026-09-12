"use client";

import { motion } from "framer-motion";

/** Large progression indicator (LRP-FE-001 §2, §4). Respects reduced motion. */
export function XpBar({ pct, label }: { pct: number; label: string }) {
  const clamped = Math.max(0, Math.min(1, pct));
  return (
    <div role="progressbar" aria-valuenow={Math.round(clamped * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="h-2.5 overflow-hidden rounded-full bg-surface-overlay">
        <motion.div
          className="h-full rounded-full bg-xp"
          initial={false}
          animate={{ width: `${clamped * 100}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}
