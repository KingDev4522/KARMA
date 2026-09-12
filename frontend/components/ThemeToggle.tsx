"use client";

import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/illustrations";

/** Theme switch (light/dark). Usable anywhere — including pre-sign-in screens. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className={`icon-btn${className ? ` ${className}` : ""}`}
    >
      <Icon id={theme === "dark" ? "i-sun" : "i-moon"} />
    </button>
  );
}
