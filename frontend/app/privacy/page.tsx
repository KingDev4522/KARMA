import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How KARMA handles your account, gameplay data, and privacy rights.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy — KARMA",
    description: "How KARMA handles your account, gameplay data, and privacy rights.",
    images: [{ url: "/brand/logo.png", width: 512, height: 512, alt: "KARMA logo" }],
  },
  robots: { index: true, follow: true },
};

/** Public privacy policy (linked from sign-in; required for Google production publish). */
export default function PrivacyPage() {
  return (
    <div className="page is-active">
      <div className="auth-wrap" style={{ maxWidth: 720 }}>
        <div className="panel" style={{ padding: "28px 26px" }}>
          <p className="eyebrow">KARMA · Privacy Policy</p>
          <h1 style={{ fontSize: 26, margin: "6px 0 4px" }}>Privacy Policy</h1>
          <p style={{ fontSize: 12.5, color: "var(--text-3)" }}>Effective 12 September 2026</p>

          <div style={{ display: "grid", gap: 16, marginTop: 18, fontSize: 14, lineHeight: 1.65 }}>
            <section>
              <h2 style={{ fontSize: 16, marginBottom: 6 }}>What this app is</h2>
              <p>
                KARMA turns your real-life goals into quests and tracks visible progress (experience points,
                attributes, streaks, and collectibles). An account is required so your progress persists across devices.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: 16, marginBottom: 6 }}>What we collect</h2>
              <ul style={{ paddingLeft: 20, display: "grid", gap: 6 }}>
                <li>
                  <strong>Account identity via Google sign-in:</strong> your email address and basic profile (name and
                  profile picture) as provided by Google through our authentication provider, Supabase. We never see,
                  ask for, or store your Google password.
                </li>
                <li>
                  <strong>Gameplay you create:</strong> quests, routines, campaigns, focus sessions, progression,
                  achievements, store inventory, and preferences such as theme and notification settings.
                </li>
                <li>
                  <strong>On-device data only:</strong> theme choice and unsent quest drafts in your browser&apos;s local
                  storage, plus the login session cookie that keeps you signed in. Nothing else is stored on your device.
                </li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: 16, marginBottom: 6 }}>What we never do</h2>
              <ul style={{ paddingLeft: 20, display: "grid", gap: 6 }}>
                <li>No passwords are collected or stored anywhere in our systems.</li>
                <li>No advertising trackers, analytics beacons, or data brokers. Your data is never sold or shared for marketing.</li>
                <li>Quest content is private to your account by default and is never published without an explicit export action by you.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: 16, marginBottom: 6 }}>Where data lives</h2>
              <p>
                Authentication and the application database are hosted by Supabase; the web app and API run on Vercel and
                Render infrastructure. Data in transit is encrypted (HTTPS). Account access is guarded by short-lived
                signed tokens that the server verifies on every request.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: 16, marginBottom: 6 }}>Your rights</h2>
              <ul style={{ paddingLeft: 20, display: "grid", gap: 6 }}>
                <li>
                  <strong>Export:</strong> your Hero Card can be previewed and exported at any time from inside the app.
                </li>
                <li>
                  <strong>Delete everything:</strong> Settings → Delete account permanently erases all quests, history,
                  and identity data. This cannot be undone.
                </li>
                <li>
                  <strong>Questions or requests:</strong> contact jaiswalmehulkumar441@gmail.com and we will respond.
                </li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: 16, marginBottom: 6 }}>Children</h2>
              <p>KARMA is a general productivity game and is not directed at children under 13.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 16, marginBottom: 6 }}>Changes</h2>
              <p>
                If this policy changes materially, the effective date above will be updated and significant changes will
                be announced in-app.
              </p>
            </section>

            <p>
              <Link href="/login" className="link-btn">
                ← Back to sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
