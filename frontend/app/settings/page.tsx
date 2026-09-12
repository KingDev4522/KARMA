"use client";

import { useState } from "react";
import Link from "next/link";
import { Moon, Sun } from "@phosphor-icons/react";
import { api, client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useApi } from "@/lib/utils";
import { Field, SectionHeading, inputCls, useToast } from "@/components/ui";
import { EmptyState, ErrorState, SignInPrompt, Skeleton } from "@/components/States";
import { cn } from "@/lib/cn";

/** Settings — identity, theme composition, rest days. */
export default function SettingsPage() {
  const { authHeaders, userId, signOut, email, loading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, loading, retry } = useApi<any>(() => client.getProfile(authHeaders()), [userId], {
    enabled: !authLoading && !!userId,
  });
  const [restDate, setRestDate] = useState("");

  if (authLoading || loading) return <Skeleton label="Settings" />;
  if (!userId) return <SignInPrompt message="Sign in to sync your hero, preferences and rest days across devices." />;
  if (error) return <ErrorState error={error} onRetry={retry} />;

  const save = async (patch: Record<string, unknown>, msg: string) => {
    try {
      await client.patchProfile(authHeaders(), patch);
      toast({ title: msg, body: "It survives refresh on every device.", tone: "xp" });
      retry();
    } catch (e) {
      toast({ title: "Couldn't save", body: e instanceof Error ? e.message : "", tone: "bad" });
    }
  };

  const profile = data?.profile ?? {};
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <SectionHeading title="Settings" />
      {!authLoading && !userId ? (
        <p className="text-sm text-ink-secondary">
          Not signed in.{" "}
          <Link href="/login" className="font-semibold text-xp">
            Sign in with Google
          </Link>{" "}
          to sync across devices.
        </p>
      ) : (
        <p className="text-sm text-ink-secondary">Signed in as {email ?? "local hero"}</p>
      )}

      <section aria-label="Appearance" className="rounded-card border border-line bg-surface-card p-4 shadow-card">
        <h2 className="mb-3 font-display text-lg">Appearance</h2>
        <div className="grid grid-cols-2 gap-2">
          {(["light", "dark"] as const).map((t) => (
            <button key={t} onClick={() => setTheme(t)} aria-pressed={theme === t}
              className={cn("flex items-center justify-center gap-2 rounded-card border p-3 text-sm font-medium capitalize pressable", theme === t ? "border-xp bg-xp/10" : "border-line")}>
              {t === "light" ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />} {t}
            </button>
          ))}
        </div>
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" defaultChecked={!!profile.reducedMotion} onChange={(e) => save({ reducedMotion: e.target.checked }, "Motion preference saved")} className="h-4 w-4 accent-[rgb(var(--xp))]" />
          Reduced motion (keeps every state change, drops decoration)
        </label>
      </section>

      <section aria-label="Hero" className="rounded-card border border-line bg-surface-card p-4 shadow-card">
        <h2 className="mb-3 font-display text-lg">Hero</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            save({ heroName: String(fd.get("heroName") || ""), bio: String(fd.get("bio") || "") }, "Hero updated");
          }}
          className="space-y-3"
        >
          <Field label="Hero name">
            <input name="heroName" defaultValue={profile.heroName ?? ""} className={inputCls} />
          </Field>
          <Field label="Bio">
            <input name="bio" defaultValue={profile.bio ?? ""} className={inputCls} />
          </Field>
          <button type="submit" className="rounded-control bg-xp px-4 py-2 text-sm font-semibold text-white pressable">Save</button>
        </form>
      </section>

      <section aria-label="Rest days" className="rounded-card border border-line bg-surface-card p-4 shadow-card">
        <h2 className="mb-1 font-display text-lg">Rest days</h2>
        <p className="mb-3 text-sm text-ink-secondary">Rest is part of the run — it never breaks the story.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!restDate) return;
            try {
              await api(`/api/v1/rest-days`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ date: restDate }) });
              toast({ title: "Rest day marked", body: restDate, tone: "xp" });
              setRestDate("");
            } catch (err) {
              toast({ title: "Couldn't mark rest", body: err instanceof Error ? err.message : "", tone: "bad" });
            }
          }}
          className="flex gap-2"
        >
          <input type="date" value={restDate} onChange={(e) => setRestDate(e.target.value)} aria-label="Rest day date" className={inputCls} />
          <button type="submit" className="shrink-0 rounded-control border border-xp/40 px-4 py-2 text-sm font-medium pressable">Mark rest</button>
        </form>
      </section>

      {!data && <EmptyState message="No profile yet." />}
      <button onClick={signOut} className="rounded-control border border-danger/50 px-4 py-2 text-sm text-danger pressable">Sign out</button>
    </div>
  );
}
