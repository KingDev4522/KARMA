import type { Metadata } from "next";

/** Auth-gated screen — never indexed. Layout stays a passthrough so UI is unchanged. */
export const metadata: Metadata = {
  title: "Realm",
  robots: { index: false, follow: false },
};

export default function RealmLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
