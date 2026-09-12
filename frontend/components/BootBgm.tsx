"use client";

import { useEffect } from "react";
import { bootBgm } from "@/lib/bgm";

/** Boots the ambient BGM once (gesture-gated, settings-respecting). */
export function BootBgm() {
  useEffect(() => {
    bootBgm();
  }, []);
  return null;
}
