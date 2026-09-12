import type { Config } from "tailwindcss";

/**
 * Token-driven theme (taste-skill §4.4 shape lock + §8 theme lock):
 * - ONE radius scale: panel 20px / card 16px / control 12px / chip full.
 * - All color comes from CSS vars (:root = warm paper light, .dark = moonlit charcoal).
 * - Single primary accent family (indigo); coral = energy/danger, amber = coin, sage = growth.
 */
const withAlpha = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          bg: withAlpha("--surface-bg"),
          elevated: withAlpha("--surface-elevated"),
          card: withAlpha("--surface-card"),
          overlay: withAlpha("--surface-overlay"),
        },
        ink: {
          primary: withAlpha("--ink-primary"),
          secondary: withAlpha("--ink-secondary"),
          muted: withAlpha("--ink-muted"),
        },
        line: withAlpha("--line"),
        xp: withAlpha("--xp"),
        coin: withAlpha("--coin"),
        coral: withAlpha("--coral"),
        sage: withAlpha("--sage"),
        success: withAlpha("--success"),
        warning: withAlpha("--warning"),
        danger: withAlpha("--danger"),
        info: withAlpha("--info"),
        seal: withAlpha("--seal"),
      },
      fontFamily: {
        // Japanese editorial pairing: Mincho-style display + clean Gothic-style body.
        // System stacks only — zero font-download risk, native JP glyphs where present.
        display: [
          '"Hiragino Mincho ProN"',
          '"Hiragino Mincho Pro"',
          '"Yu Mincho"',
          '"YuMincho"',
          '"Noto Serif JP"',
          "Georgia",
          "serif",
        ],
        body: [
          '"Hiragino Kaku Gothic ProN"',
          '"Hiragino Sans"',
          '"Yu Gothic"',
          "system-ui",
          "-apple-system",
          '"Segoe UI"',
          "sans-serif",
        ],
      },
      borderRadius: {
        panel: "20px",
        card: "16px",
        control: "12px",
      },
      boxShadow: {
        card: "0 10px 30px -12px rgb(var(--shadow) / 0.35)",
        lift: "0 16px 40px -14px rgb(var(--shadow) / 0.45)",
        glow: "0 0 22px -4px rgb(var(--xp) / 0.45)",
        seal: "0 2px 0 0 rgb(var(--shadow) / 0.25)",
      },
      maxWidth: {
        shell: "1400px",
      },
    },
  },
  plugins: [],
};

export default config;
