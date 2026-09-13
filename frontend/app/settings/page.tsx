"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useApi } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { useTour } from "@/components/tour";
import { soundEnabled, setSoundEnabled } from "@/lib/sound";
import { bgmEnabled, setBgmEnabled, ensureBgm, currentTrackName } from "@/lib/bgm";
import { ErrorState, SignInPrompt, Skeleton } from "@/components/States";

/** Settings — appearance, motion, character identity, rest days, sign out. */
export default function SettingsPage() {
  const { authHeaders, userId, signOut, email, loading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const { replay } = useTour();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, loading, retry } = useApi<any>(() => client.getProfile(authHeaders()), [userId], {
    enabled: !authLoading && !!userId,
  });
  const [restDate, setRestDate] = useState("");
  const [motionOff, setMotionOff] = useState<boolean | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [bgmOn, setBgmOn] = useState(true);
  const [track, setTrack] = useState("");
  const [armed, setArmed] = useState(false);
  const [erasing, setErasing] = useState(false);

  useEffect(() => {
    setSoundOn(soundEnabled());
    setBgmOn(bgmEnabled());
    setTrack(currentTrackName());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      window.dispatchEvent(new CustomEvent("liferpg:refresh"));
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
              <>Signed in as {email ?? "local character"}</>
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
        <div className="set-row">
          <div className="info">
            <strong>Sound effects</strong>
            <span>Coins, level-ups, badges and purchases</span>
          </div>
          <button
            className={`switch${soundOn ? " is-on" : ""}`}
            role="switch"
            aria-checked={soundOn}
            aria-label="Sound effects"
            onClick={() => {
              const next = !soundOn;
              setSoundOn(next);
              setSoundEnabled(next);
              toast(next ? "Sound on" : "Sound off", "i-check");
            }}
          />
        </div>
        <div className="set-row">
          <div className="info">
            <strong>Ambient music</strong>
            <span>Slow generative pads — {track || "Dawn Haze"}. Tracks take turns.</span>
          </div>
          <button
            className={`switch${bgmOn ? " is-on" : ""}`}
            role="switch"
            aria-checked={bgmOn}
            aria-label="Ambient music"
            onClick={() => {
              const next = !bgmOn;
              setBgmOn(next);
              setBgmEnabled(next);
              if (next) void ensureBgm();
              toast(next ? "Ambient music on" : "Ambient music off", "i-check");
            }}
          />
        </div>
        <div className="set-row">
          <div className="info">
            <strong>Companion tour</strong>
            <span>Replay the first-run guide with your companion</span>
          </div>
          <button className="btn btn--ghost" onClick={replay}>
            Replay tour
          </button>
        </div>
      </div>

      <div className="settings-panel">
        <h3>Character & companion</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            save(
              {
                heroName: String(fd.get("heroName") || ""),
                companionName: String(fd.get("companionName") || ""),
                bio: String(fd.get("bio") || ""),
              },
              "Identity updated",
            );
          }}
        >
          <div className="field">
            <label htmlFor="setHero">Character name (yours to choose)</label>
            <input id="setHero" name="heroName" type="text" defaultValue={profile.heroName ?? ""} className="set-input" maxLength={80} />
          </div>
          <div className="field">
            <label htmlFor="setComp">Companion name (yours to choose)</label>
            <input id="setComp" name="companionName" type="text" defaultValue={profile.companionName ?? ""} className="set-input" maxLength={80} />
          </div>
          <div className="field">
            <label htmlFor="setBio">Oath — how do you define yourself?</label>
            <input id="setBio" name="bio" type="text" defaultValue={profile.bio ?? ""} className="set-input" maxLength={500} placeholder="Ship my portfolio, kill doomscroll" />
          </div>
          <button type="submit" className="btn btn--primary">
            Save identity
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
        <h3>Cloud sync</h3>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 12 }}>
          Same Google account on every device means the same realm. Compare these two lines across devices — if they match, you are in sync.
        </p>
        <div className="set-row">
          <div className="info">
            <strong>{email ?? "Not signed in"}</strong>
            <span>
              ID {(userId ?? "—").slice(0, 8)}… · {(() => { try { return new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").host; } catch { return "local backend"; } })()} · updated{" "}
              {profile.updatedAt ? new Date(profile.updatedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "just now"}
            </span>
          </div>
          <button
            className="btn btn--ghost"
            onClick={async () => {
              const { invalidateCache } = await import("@/lib/api");
              invalidateCache("/api/v1");
              toast("Synced from cloud", "i-check");
              retry();
              window.dispatchEvent(new CustomEvent("liferpg:refresh"));
            }}
          >
            Sync now
          </button>
        </div>
      </div>

      <div className="settings-panel">
        <h3>Account</h3>
        <div className="set-row">
          <div className="info">
            <strong>{profile.heroName ?? "local character"}</strong>
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
