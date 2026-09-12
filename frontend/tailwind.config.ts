import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Premium fantasy-modern: dark surface + luminous accents (LRP-FE-001 §2).
        surface: {
          bg: "#0b0d17",
          elevated: "#12162a",
          card: "#181d36",
          overlay: "#1f2547",
        },
        ink: {
          primary: "#f2f4ff",
          secondary: "#b9c0e4",
          muted: "#7d86ad",
        },
        xp: "#8b7bff",
        coin: "#f5c542",
        success: "#4ade80",
        warning: "#fbbf24",
        danger: "#f87171",
        info: "#60a5fa",
      },
      fontFamily: {
        display: ["'Cinzel', 'Georgia', serif"],
        body: ["'Inter', system-ui, sans-serif"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(139, 123, 255, 0.35)",
        card: "0 8px 32px rgba(0, 0, 0, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
