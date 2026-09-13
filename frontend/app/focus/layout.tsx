import type { Metadata } from "next";

/** Auth-gated screen — never indexed. Layout stays a passthrough so UI is unchanged. */
export const metadata: Metadata = {
  title: "Focus",
  robots: { index: false, follow: false },
};

export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
