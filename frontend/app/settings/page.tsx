"use client";

import { useState } from "react";
import Link from "next/link";
import { api, client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useApi } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { ErrorState, SignInPrompt, Skeleton } from "@/components/States";

/** Settings — appearance, motion, hero identity, rest days, sign out. */
export default function SettingsPage() {
  const { authHeaders, userId, signOut, email, loading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, loading, retry } = useApi<any>(() => client.getProfile(authHeaders()), [userId], {
    enabled: !authLoading && !!userId,
  });
  const [restDate, setRestDate] = useState("");
  const [motionOff, setMotionOff] = useState<boolean | null>(null);
  const [armed, setArmed] = useState(false);
  const [erasing, setErasing] = useState(false);

  if (authLoading || loading) return <Skeleton label="Settings" rows={3} />;
  if (!userId) return <SignInPrompt />;
  if (error) return <ErrorState error={error} onRetry={retry} />;

  const profile = data?.profile ?? {};
  const reduceMotion = motionOff ?? !!profile.reducedMotion;

  const save = async (patch: Record<string, unknown>, msg: string) => {
    try {
      await client.patchProfile(authHeaders(), patch);
      toast(msg, "i-check");
      retry();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't save. Nothing was changed.", "i-close");
    }
  };

  const toggleMotion = () => {
    const next = !reduceMotion;
    setMotionOff(next);
    document.documentElement.dataset.motion = next ? "off" : "default";
    save({ reducedMotion: next }, "Motion preference saved");
  };

  const markRest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restDate) return;
    try {
      await api(`/api/v1/rest-days`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ date: restDate }) });
      toast(`Rest day marked · ${restDate}`, "i-check");
      setRestDate("");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't mark rest.", "i-close");
    }
  };

  const eraseAccount = async () => {
    setErasing(true);
    try {
      await client.deleteProfile(authHeaders());
      await signOut();
      window.location.replace("/login?deleted=1");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't delete account. Nothing was erased.", "i-close");
      setErasing(false);
      setArmed(false);
    }
  };

  return (
    <div className="page is-active">
      <div className="page-head">
        <div>
          <h2>Settings</h2>
          <p className="sub">
            {!authLoading && !userId ? (
              <>
                Not signed in.{" "}
                <Link href="/login" style={{ fontWeight: 700, color: "var(--accent-text)" }}>
                  Sign in with Google
                </Link>{" "}
                to sync across devices.
              </>
            ) : (
              <>Signed in as {email ?? "local hero"}</>
            )}
          </p>
        </div>
      </div>

      <div className="settings-panel">
        <h3>Appearance</h3>
        <div className="set-row">
          <div className="info">
            <strong>Dark mode</strong>
            <span>Deep indigo environment for evening play</span>
          </div>
          <button className={`switch${theme === "dark" ? " is-on" : ""}`} role="switch" aria-checked={theme === "dark"} aria-label="Dark mode" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} />
        </div>
        <div className="set-row">
          <div className="info">
            <strong>Reduce motion</strong>
            <span>Minimize animations and particles</span>
          </div>
          <button className={`switch${reduceMotion ? " is-on" : ""}`} role="switch" aria-checked={reduceMotion} aria-label="Reduce motion" onClick={toggleMotion} />
        </div>
      </div>

      <div className="settings-panel">
        <h3>Hero</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            save({ heroName: String(fd.get("heroName") || ""), bio: String(fd.get("bio") || "") }, "Hero updated");
          }}
        >
          <div className="field">
            <label htmlFor="setHero">Hero name</label>
            <input id="setHero" name="heroName" type="text" defaultValue={profile.heroName ?? ""} className="set-input" />
          </div>
          <div className="field">
            <label htmlFor="setBio">Bio</label>
            <input id="setBio" name="bio" type="text" defaultValue={profile.bio ?? ""} className="set-input" />
          </div>
          <button type="submit" className="btn btn--primary">
            Save hero
          </button>
        </form>
      </div>

      <div className="settings-panel">
        <h3>Rest days</h3>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 12 }}>Rest is part of the run — it never breaks the story.</p>
        <form onSubmit={markRest} style={{ display: "flex", gap: 8 }}>
          <input type="date" value={restDate} onChange={(e) => setRestDate(e.target.value)} aria-label="Rest day date" className="set-input" style={{ flex: 1 }} />
          <button type="submit" className="btn btn--ghost">
            Mark rest
          </button>
        </form>
      </div>

      <div className="settings-panel">
        <h3>Notifications</h3>
        {(
          [
            ["notifyQuest", "Quest reminders", "Due quests and next objectives"],
            ["notifyStreak", "Streak warnings", "Nudges before a streak breaks"],
            ["notifyCelebrate", "Celebrations", "Badges and milestones"],
          ] as const
        ).map(([key, label, hint]) => (
          <div className="set-row" key={key}>
            <div className="info">
              <strong>{label}</strong>
              <span>{hint}</span>
            </div>
            <button
              className={`switch${profile[key] ? " is-on" : ""}`}
              role="switch"
              aria-checked={!!profile[key]}
              aria-label={label}
              onClick={() => save({ [key]: !profile[key] }, "Notification preference saved")}
            />
          </div>
        ))}
      </div>

      <div className="settings-panel">
        <h3>Account</h3>
        <div className="set-row">
          <div className="info">
            <strong>{profile.heroName ?? "Local hero"}</strong>
            <span>
              Server-side profile — survives every device ·{" "}
              <Link href="/privacy" style={{ textDecoration: "underline" }}>
                Privacy Policy
              </Link>
            </span>
          </div>
          <button onClick={signOut} className="btn btn--ghost">
            Sign out
          </button>
        </div>
        <div className="set-row">
          <div className="info">
            <strong>Erase everything</strong>
            <span>Deletes all quests, history and identity. Forever.</span>
          </div>
          {!armed ? (
            <button onClick={() => setArmed(true)} className="btn btn--ghost">
              Delete…
            </button>
          ) : (
            <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
              <button onClick={eraseAccount} disabled={erasing} className="btn btn--primary">
                {erasing ? "Erasing…" : "Yes, erase"}
              </button>
              <button onClick={() => setArmed(false)} className="btn btn--ghost">
                Keep
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
