import type { Metadata } from "next";

/** Auth-gated screen — never indexed. Layout stays a passthrough so UI is unchanged. */
export const metadata: Metadata = {
  title: "Personalize",
  robots: { index: false, follow: false },
};

export default function PersonalizeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
