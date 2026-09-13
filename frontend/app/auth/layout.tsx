import type { Metadata } from "next";

/** Auth transient screens — never indexed. Layout stays a passthrough so UI is unchanged. */
export const metadata: Metadata = {
  title: "Welcome",
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
