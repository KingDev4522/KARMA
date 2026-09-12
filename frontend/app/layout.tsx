import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { ToastProvider } from "@/components/toast";
import { FocusProvider } from "@/components/focus";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "LIFE RPG — Quiet progress, kept score",
  description: "A minimal productivity practice with a discreet RPG progression system. Quests, focus, campaigns, and identity.",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23181818'/%3E%3Ctext x='16' y='22' font-family='sans-serif' font-size='17' font-weight='700' fill='%23fff' text-anchor='middle'%3EL%3C/text%3E%3Ccircle cx='23.5' cy='8.5' r='2.5' fill='%23BC4028'/%3E%3C/svg%3E",
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
            <ToastProvider>
              <FocusProvider>
                <Shell>{children}</Shell>
              </FocusProvider>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
