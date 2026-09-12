import type { Config } from "tailwindcss";

/**
 * The visual system lives in app/globals.css (Inter + data-theme
 * tokens + component classes). Tailwind is kept for utilities only.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
