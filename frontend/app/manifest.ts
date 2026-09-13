import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KARMA — Quiet progress, kept score",
    short_name: "KARMA",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#0C0C0C",
    theme_color: "#FFFFFF",
    icons: [
      { src: "/brand/logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/logo.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
