import type { Metadata } from "next";

/** Auth-gated onboarding — never indexed. Layout stays a passthrough so UI is unchanged. */
export const metadata: Metadata = {
  title: "Onboarding",
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
