"use client";

import { useState } from "react";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import { EmptyState, ErrorState, Skeleton } from "@/components/States";

/** Settings — identity, UX prefs (reduced motion, theme), rest days. */
export default function SettingsPage() {
  const { authHeaders, userId, signOut, email } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, loading, retry } = useApi<any>(() => client.getProfile(authHeaders()), [userId]);
  const [notice, setNotice] = useState<string | null>(null);

  if (loading) return <Skeleton label="Settings" />;
  if (error) return <ErrorState error={error} onRetry={retry} />;

  const save = async (patch: Record<string, unknown>) => {
    setNotice(null);
    try {
      await client.patchProfile(authHeaders(), patch);
      setNotice("Saved. It survives refresh on every device.");
      retry();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Couldn't save.");
    }
  };

  const profile = data?.profile ?? {};
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="font-display text-2xl">Settings</h1>
      <p className="text-sm text-ink-secondary">Signed in as {email ?? "unknown"}</p>
      {notice && <p role="status" className="rounded-xl bg-surface-elevated p-3 text-sm">{notice}</p>}

      <section aria-label="Accessibility" className="rounded-xl bg-surface-card p-4">
        <h2 className="mb-2 font-display">Accessibility</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            defaultChecked={!!profile.reducedMotion}
            onChange={(e) => save({ reducedMotion: e.target.checked })}
          />
          Reduced motion (disables decorative motion, keeps state info)
        </label>
      </section>

      <section aria-label="Hero" className="rounded-xl bg-surface-card p-4">
        <h2 className="mb-2 font-display">Hero</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            save({ heroName: String(fd.get("heroName") || ""), bio: String(fd.get("bio") || "") });
          }}
          className="space-y-2"
        >
          <input name="heroName" defaultValue={profile.heroName ?? ""} placeholder="Hero name" className="w-full rounded-lg bg-surface-elevated px-3 py-2" />
          <input name="bio" defaultValue={profile.bio ?? ""} placeholder="Bio" className="w-full rounded-lg bg-surface-elevated px-3 py-2" />
          <button type="submit" className="rounded-lg bg-xp px-4 py-2 text-sm font-semibold text-surface-bg">Save</button>
        </form>
      </section>

      {!data || Object.keys(profile).length === 0 ? <EmptyState message="No profile yet." /> : null}

      <button onClick={signOut} className="rounded-lg border border-danger/50 px-4 py-2 text-sm">Sign out</button>
    </div>
  );
}
