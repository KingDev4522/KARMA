"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/cn";

/** Theme switch (light/dark). Usable anywhere — including pre-sign-in screens. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className={cn("rounded-control p-2 hover:bg-surface-overlay pressable", className)}
    >
      {theme === "dark" ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
    </button>
  );
}
