"use client";

import { useState } from "react";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import { XpBar } from "@/components/XpBar";
import { EmptyState, ErrorState, Skeleton } from "@/components/States";

/** Campaigns — destination + progress + next actionable milestone (FE §8). */
export default function CampaignsPage() {
  const { authHeaders, userId } = useAuth();
  const { data, error, loading, retry } = useApi(() => client.listCampaigns(authHeaders()), [userId]);
  const [title, setTitle] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  if (loading) return <Skeleton label="Campaigns" />;
  if (error) return <ErrorState error={error} onRetry={retry} />;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) {
      setFormError("Choose something worth becoming — give it a name.");
      return;
    }
    try {
      await client.createCampaign(authHeaders(), { title: title.trim() });
      setTitle("");
      retry();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't create campaign.");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl">Campaigns</h1>
      <form onSubmit={create} className="flex gap-2 rounded-xl bg-surface-elevated p-4" aria-label="Create campaign">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Build Portfolio"
          className="flex-1 rounded-lg bg-surface-card px-3 py-2"
        />
        <button type="submit" className="rounded-lg bg-xp px-4 py-2 text-sm font-semibold text-surface-bg">Begin</button>
      </form>
      {formError && <p role="alert" className="text-sm text-danger">{formError}</p>}

      {!data || data.length === 0 ? (
        <EmptyState message="Choose something worth becoming." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.map((c) => (
            <article key={c.id} className="rounded-xl bg-surface-card p-4 shadow-card" aria-label={`Campaign: ${c.title}`}>
              <h2 className="font-display uppercase tracking-wide">{c.title}</h2>
              <p className="text-sm text-ink-secondary">{c.progressPct ?? 0}%</p>
              <XpBar pct={(c.progressPct ?? 0) / 100} label={`${c.title} progress`} />
              {c.nextMilestone ? (
                <p className="mt-2 text-sm">Next: <strong>{c.nextMilestone.title}</strong></p>
              ) : (
                <p className="mt-2 text-sm text-ink-muted">No open milestones — add one to keep moving.</p>
              )}
              {c.nextQuest && <p className="text-sm text-ink-secondary">Today&apos;s cut: {c.nextQuest.title}</p>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
