import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

/**
 * Crawlers: only public pages are listed. Auth-gated app screens rely on
 * per-route `noindex` metadata (see segment layouts) so private quest data
 * is never indexed even if a URL leaks.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/privacy"],
        disallow: ["/api/", "/auth/", "/onboarding"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
