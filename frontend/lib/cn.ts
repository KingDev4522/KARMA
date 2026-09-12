import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Z-index scale — systemic layers only, never arbitrary (taste-skill §6.F). */
export const Z = {
  nav: 30,
  commandPalette: 70,
  overlay: 80,
  grain: 90,
  toast: 100,
  ceremony: 110,
} as const;
