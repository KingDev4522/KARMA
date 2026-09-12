"use client";

import { useRouter } from "next/navigation";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { useFocus } from "@/components/focus";
import type { Campaign } from "@/lib/types";
import { WorldCard, WorldPanel } from "@/components/journey";
import { EmptyState, ErrorState, SignInPrompt, Skeleton } from "@/components/States";

/** Campaigns — world panel for the frontier journey + cards for the rest. */
export default function CampaignsPage() {
  const { authHeaders, userId, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { openFocus } = useFocus();
  const { data, error, loading, retry } = useApi(() => client.listCampaigns(authHeaders()), [userId], {
    enabled: !authLoading && !!userId,
  });
  const firstId = data?.[0]?.id ?? null;
  const { data: detail } = useApi(
    () => (firstId ? client.getCampaign(authHeaders(), firstId) : Promise.resolve(null as unknown as Campaign)),
    [firstId],
    { enabled: !authLoading && !!userId && !!firstId },
  );

  if (authLoading || loading) return <Skeleton label="Campaigns" rows={3} />;
  if (!userId) return <SignInPrompt />;
  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (!data || data.length === 0) return <EmptyState message="No journeys yet. Your first campaign begins with a single quest." />;

  const [head, ...rest] = data;
  const headDetail = detail && detail.id === head.id ? detail : head;
  const miles = (headDetail.milestones ?? []).slice().sort((a, b) => a.orderIndex - b.orderIndex);
  const nextId = headDetail.nextMilestone?.id ?? miles.find((m) => m.status !== "done")?.id ?? null;

  const workOnThis = () => {
    const nq = headDetail.nextQuest;
    if (nq) {
      openFocus({ id: nq.id, title: nq.title, minutes: Math.min(nq.estimatedMinutes ?? 25, 50) });
    } else if (headDetail.nextMilestone) {
      toast(`Next milestone: ${headDetail.nextMilestone.title}`, "i-spark");
      router.push("/quests");
    } else {
      toast("Journey complete. Begin a new one from a quest.", "i-trophy");
    }
  };

  return (
    <div className="page is-active">
      <div className="page-head">
        <div>
          <h2>Campaigns</h2>
          <p className="sub">Long journeys, one milestone at a time.</p>
        </div>
      </div>

      <WorldPanel
        title={head.title}
        theme={head.status === "active" ? "Active journey" : head.status}
        desc={head.description ?? undefined}
        milestones={miles.map((m) => ({ name: m.title, done: m.status === "done", current: m.id === nextId }))}
        nextText={
          headDetail.nextMilestone
            ? `Next milestone: ${headDetail.nextMilestone.title}`
            : headDetail.nextQuest
              ? `Next quest: ${headDetail.nextQuest.title}`
              : "Journey complete — well walked."
        }
        onWork={workOnThis}
      />

      {rest.length > 0 && (
        <>
          <div className="sec-head">
            <h3>Other journeys</h3>
          </div>
          <div className="world-grid">
            {rest.map((c) => (
              <WorldCard
                key={c.id}
                title={c.title}
                meta={`${c.status} · ${c.progressPct ?? 0}%`}
                progressPct={c.progressPct ?? 0}
                onOpen={() => router.push("/quests")}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
