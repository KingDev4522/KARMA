import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "LIFE RPG — Your life is the campaign",
  description: "Turn real-world actions into quests, growth, and identity.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-surface-bg font-body text-ink-primary">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:p-2 focus:bg-xp focus:text-surface-bg">
          Skip to main content
        </a>
        <AuthProvider>
          <div className="mx-auto flex min-h-screen max-w-6xl md:gap-4">
            <Nav />
            <main id="main" className="flex-1 p-4 pb-20 md:pb-8">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
