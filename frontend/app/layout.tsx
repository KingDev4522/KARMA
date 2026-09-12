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

export const metadata: Metadata = {
  title: "KARMA — Quiet progress, kept score",
  description: "A minimal productivity practice with a discreet RPG progression system. Quests, focus, campaigns, and identity.",
  icons: {
    icon: "/brand/logo.png",
    apple: "/brand/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0C0C0C" },
  ],
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
