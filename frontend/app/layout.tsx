import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { ToastProvider } from "@/components/toast";
import { FocusProvider } from "@/components/focus";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "LIFE RPG — Live deliberately",
  description: "Turn real-world actions into quests, growth, and identity.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
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
