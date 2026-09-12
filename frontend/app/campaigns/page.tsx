"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import { CampaignPath } from "@/components/world";
import { Field, SectionHeading, inputCls } from "@/components/ui";
import { EmptyState, ErrorState, Skeleton } from "@/components/States";
import { XpBar } from "@/components/rpg";

/** Campaigns — visual journeys, not card lists. The active milestone dominates. */
export default function CampaignsPage() {
  const { authHeaders, userId } = useAuth();
  const { data, error, loading, retry } = useApi(() => client.listCampaigns(authHeaders()), [userId]);
  const [title, setTitle] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, { milestones: { id: string; title: string; status: string }[]; progressPct: number }>>({});

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

  const openJourney = async (id: string) => {
    if (detail[id]) {
      setDetail((d) => {
        const c = { ...d };
        delete c[id];
        return c;
      });
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = (await client.getCampaign(authHeaders(), id)) as any;
      setDetail((d) => ({ ...d, [id]: { milestones: c.milestones ?? [], progressPct: c.progressPct ?? 0 } }));
    } catch {
      /* journey stays folded on failure */
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeading title="Long journeys" />
      <form onSubmit={create} className="flex flex-col gap-2 rounded-card border border-line bg-surface-card p-4 shadow-card sm:flex-row" aria-label="Begin a campaign">
        <div className="flex-1">
          <Field label="Begin a new campaign" error={formError}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Build Portfolio" className={inputCls} />
          </Field>
        </div>
        <button type="submit" className="inline-flex items-center justify-center gap-1.5 self-end rounded-control bg-xp px-5 py-2 text-sm font-semibold text-white pressable">
          <Plus size={15} weight="bold" aria-hidden /> Begin
        </button>
      </form>

      {!data || data.length === 0 ? (
        <EmptyState message="Choose something worth becoming." />
      ) : (
        <div className="space-y-4">
          {data.map((c) => (
            <article key={c.id} className="overflow-hidden rounded-panel border border-line bg-surface-card shadow-card" aria-label={`Campaign: ${c.title}`}>
              <button onClick={() => openJourney(c.id)} aria-expanded={!!detail[c.id]} className="w-full p-5 text-left">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-xl uppercase tracking-wide">{c.title}</h2>
                  <span className="font-display text-2xl text-xp">{c.progressPct ?? 0}%</span>
                </div>
                <div className="mt-2">
                  <XpBar pct={(c.progressPct ?? 0) / 100} label={`${c.title} progress`} />
                </div>
                {c.nextMilestone ? (
                  <p className="mt-2 text-sm">Next objective: <strong>{c.nextMilestone.title}</strong></p>
                ) : (
                  <p className="mt-2 text-sm text-ink-muted">Tap to view the journey.</p>
                )}
              </button>
              {detail[c.id] && (
                <div className="border-t border-line bg-surface-elevated/60 p-5">
                  {detail[c.id].milestones.length === 0 ? (
                    <p className="text-sm text-ink-muted">No milestones yet — the journey is unwritten.</p>
                  ) : (
                    <CampaignPath milestones={detail[c.id].milestones} />
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
