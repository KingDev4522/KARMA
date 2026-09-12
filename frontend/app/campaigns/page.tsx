"use client";

import { useState } from "react";
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
  const { data: detail, retry: retryDetail } = useApi(
    () => (firstId ? client.getCampaign(authHeaders(), firstId) : Promise.resolve(null as unknown as Campaign)),
    [firstId],
    { enabled: !authLoading && !!userId && !!firstId },
  );
  const [newTitle, setNewTitle] = useState("");
  const [newMile, setNewMile] = useState("");
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    retry();
    retryDetail();
    window.dispatchEvent(new CustomEvent("liferpg:refresh"));
  };

  const mutate = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast(ok, "i-check");
      refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't update the journey. Nothing was changed.", "i-close");
    } finally {
      setBusy(false);
    }
  };

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
        breadcrumb={[head.title, miles.find((m) => m.id === nextId)?.title].filter(Boolean) as string[]}
        nextText={
          headDetail.nextMilestone
            ? `Next milestone: ${headDetail.nextMilestone.title}`
            : headDetail.nextQuest
              ? `Next quest: ${headDetail.nextQuest.title}`
              : "Journey complete — well walked."
        }
        onWork={workOnThis}
      />

      <div className="panel" aria-label="Manage journey">
        <div className="sec-head" style={{ margin: 0 }}>
          <h3>Shape the journey</h3>
        </div>
        {!editing ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <button className="chip" disabled={busy} onClick={() => { setEditTitle(head.title); setEditing(true); }}>Rename</button>
            {head.status === "active" ? (
              <button className="chip" disabled={busy} onClick={() => mutate(() => client.patchCampaign(authHeaders(), head.id, { status: "paused" }), "Journey paused — it will wait for you")}>Pause</button>
            ) : head.status === "paused" ? (
              <button className="chip" disabled={busy} onClick={() => mutate(() => client.patchCampaign(authHeaders(), head.id, { status: "active" }), "Journey active again")}>Resume</button>
            ) : null}
            <button
              className="chip"
              disabled={busy}
              onClick={() => {
                if (window.confirm(`Archive “${head.title}”? Its quests stay on your board, history is kept.`)) {
                  mutate(() => client.deleteCampaign(authHeaders(), head.id), "Journey archived");
                }
              }}
            >
              Archive
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editTitle.trim()) return;
              mutate(() => client.patchCampaign(authHeaders(), head.id, { title: editTitle.trim() }).then(() => setEditing(false)), "Journey renamed");
            }}
            style={{ display: "flex", gap: 8, marginTop: 8 }}
          >
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} aria-label="Campaign title" maxLength={200} style={{ flex: 1 }} />
            <button type="submit" className="chip" disabled={busy || !editTitle.trim()}>Save</button>
            <button type="button" className="chip" onClick={() => setEditing(false)}>Cancel</button>
          </form>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newMile.trim()) return;
            mutate(() => client.createMilestone(authHeaders(), head.id, { title: newMile.trim() }).then(() => setNewMile("")), "Milestone added to the path");
          }}
          style={{ display: "flex", gap: 8, marginTop: 10 }}
        >
          <input value={newMile} onChange={(e) => setNewMile(e.target.value)} placeholder="New milestone — e.g. Ship the demo" aria-label="New milestone title" maxLength={200} style={{ flex: 1 }} />
          <button type="submit" className="chip" disabled={busy || !newMile.trim()}>Add step</button>
        </form>
        {miles.filter((m) => m.status !== "done").length > 0 && (
          <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: 6 }}>
            {miles.filter((m) => m.status !== "done").map((m) => (
              <li key={m.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                <span style={{ flex: 1 }}>{m.title}</span>
                <button className="chip" disabled={busy} onClick={() => mutate(() => client.patchMilestone(authHeaders(), m.id, { status: "done" }), `Milestone reached: ${m.title}`)}>
                  Done
                </button>
                <button className="chip" disabled={busy} onClick={() => mutate(() => client.patchMilestone(authHeaders(), m.id, { status: "skipped" }), "Milestone skipped")}>
                  Skip
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel" aria-label="Begin a journey">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newTitle.trim()) return;
            mutate(() => client.createCampaign(authHeaders(), { title: newTitle.trim() }).then(() => setNewTitle("")), "New journey begun");
          }}
          style={{ display: "flex", gap: 8 }}
        >
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Begin a journey — e.g. Run a 10k" aria-label="New campaign title" maxLength={200} style={{ flex: 1 }} />
          <button type="submit" className="chip" disabled={busy || !newTitle.trim()}>Begin</button>
        </form>
      </div>

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
