import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { ToastProvider } from "@/components/toast";
import { FocusProvider } from "@/components/focus";
import { TourProvider } from "@/components/tour";
import { IdentityProvider } from "@/lib/identity-context";
import { Shell } from "@/components/Shell";
import { KeepAlivePing } from "@/components/KeepAlivePing";
import { BootBgm } from "@/components/BootBgm";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  applicationName: "KARMA",
  title: {
    default: "KARMA — Quiet progress, kept score",
    template: "%s — KARMA",
  },
  description:
    "KARMA is a Life RPG — turn real-life goals into quests, earn XP and coins, build streaks and attributes, and grow a visible hero identity.",
  keywords: ["life rpg", "productivity", "quests", "habits", "focus timer", "streaks", "gamification", "KARMA"],
  authors: [{ name: "KARMA" }],
  creator: "KARMA",
  publisher: "KARMA",
  category: "productivity",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "KARMA",
    locale: "en_US",
    title: "KARMA — Quiet progress, kept score",
    description:
      "Turn real-life goals into quests. Earn XP and coins, build streaks, and grow your hero.",
    images: [{ url: "/brand/logo.png", width: 512, height: 512, alt: "KARMA logo" }],
  },
  twitter: {
    card: "summary",
    title: "KARMA — Quiet progress, kept score",
    description:
      "Turn real-life goals into quests. Earn XP and coins, build streaks, and grow your hero.",
    images: ["/brand/logo.png"],
  },
  icons: {
    icon: "/brand/logo.png",
    apple: "/brand/logo.png",
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0C0C0C" },
  ],
};

const SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "KARMA",
  alternateName: "KARMA — Life RPG",
  description:
    "KARMA is a Life RPG — turn real-life goals into quests, earn XP and coins, build streaks and attributes, and grow a visible hero identity.",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_JSON_LD) }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[200] focus:rounded-[10px] focus:px-3 focus:py-2"
          style={{ background: "var(--text)", color: "var(--bg)" }}
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <AuthProvider>
            <IdentityProvider>
              <KeepAlivePing>
                <BootBgm />
                <ToastProvider>
                  <FocusProvider>
                    <TourProvider>
                      <Shell>{children}</Shell>
                    </TourProvider>
                  </FocusProvider>
                </ToastProvider>
              </KeepAlivePing>
            </IdentityProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
