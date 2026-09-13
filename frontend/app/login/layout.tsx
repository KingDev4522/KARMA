import type { Metadata } from "next";

/** Public sign-in entry — indexable. Page itself stays a Client Component. */
export const metadata: Metadata = {
  title: "Enter the realm",
  description: "Sign in to KARMA with Google and keep your quests, XP, streaks, and hero identity in sync across devices.",
  alternates: { canonical: "/login" },
  openGraph: {
    title: "Enter the realm — KARMA",
    description: "One account across every device. Your quests, XP and identity persist.",
    images: [{ url: "/brand/logo.png", width: 512, height: 512, alt: "KARMA logo" }],
  },
  twitter: {
    card: "summary",
    title: "Enter the realm — KARMA",
    description: "One account across every device. Your quests, XP and identity persist.",
    images: ["/brand/logo.png"],
  },
  robots: { index: true, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
