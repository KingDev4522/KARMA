/**
 * Single source of truth for SEO / site URL.
 *
 * NEXT_PUBLIC_SITE_URL should be the production origin, e.g.
 * https://karma-xyz.vercel.app (no trailing slash). Locally it falls back
 * to http://localhost:3000 so robots/sitemap/metadata never crash a dev
 * build when the var is missing.
 */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export const SITE_NAME = "KARMA";
export const SITE_TAGLINE = "Quiet progress, kept score.";
export const SITE_DESCRIPTION =
  "KARMA is a Life RPG — turn real-life goals into quests, earn XP and coins, build streaks and attributes, and grow a visible hero identity.";
