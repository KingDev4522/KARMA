"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/toast";
import { Companion, Hero, Icon } from "@/components/illustrations";
import { SignInPrompt, Skeleton } from "@/components/States";

/** Onboarding — entering the world. */
const HEROES = [
  { id: "hero_ember", label: "Ember" },
  { id: "hero_sage", label: "Sage" },
  { id: "hero_warden", label: "Warden" },
  { id: "hero_scout", label: "Scout" },
  { id: "hero_mystic", label: "Mystic" },
  { id: "hero_forge", label: "Forge" },
];
const COMPANIONS = [
  { id: "comp_spark", label: "Spark" },
  { id: "comp_moss", label: "Moss" },
  { id: "comp_ember", label: "Emberling" },
];
const DOMAINS = ["Fitness", "Learning", "Career", "Creativity", "Relationships", "Home", "Mindfulness"];

export default function OnboardingPage() {
  const { authHeaders, userId, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [heroAssetId, setHeroAssetId] = useState(HEROES[0].id);
  const [heroName, setHeroName] = useState("");
  const [companionAssetId, setCompanionAssetId] = useState(COMPANIONS[0].id);
  const [domains, setDomains] = useState<string[]>(["Learning"]);
  const [firstQuest, setFirstQuest] = useState("Drink a glass of water");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const toggleDomain = (d: string) => setDomains((s) => (s.includes(d) ? s.filter((x) => x !== d) : [...s, d]));

  const finish = async () => {
    setError(null);
    if (!heroName.trim()) {
      setError("Name your hero to cross the threshold.");
      return;
    }
    if (!firstQuest.trim()) {
      setError("Write one small first quest — it should take minutes.");
      return;
    }
    try {
      await client.patchProfile(authHeaders(), { heroAssetId, heroName: heroName.trim(), companionAssetId, lifeDomains: domains });
      const camp = await client.createCampaign(authHeaders(), { title: "First steps" });
      await client.createQuest(authHeaders(), { title: firstQuest.trim(), questType: "quick", activityKey: "routine_habit", difficulty: 1, campaignId: camp.id });
      setDone(true);
      toast("Welcome to the realm.", "i-spark");
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't finish onboarding. Nothing was written.");
    }
  };

  return (
    <div className="page is-active" style={{ maxWidth: 560, margin: "0 auto" }}>
      {authLoading ? (
        <Skeleton label="Onboarding" rows={2} />
      ) : !userId ? (
        <SignInPrompt />
      ) : (
      <>
      <div className="page-head">
        <div>
          <h2>Enter the realm</h2>
          <p className="sub">
            Step {step + 1} of 4 — your life is the campaign.
          </p>
        </div>
      </div>

      <div className="wizard-steps" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <i key={i} className={i <= step ? "on" : ""} />
        ))}
      </div>

      {step === 0 && (
        <section className="panel" style={{ padding: 24 }} aria-label="Choose hero">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <Hero width={120} />
          </div>
          <h3 style={{ fontSize: 17, marginBottom: 12, textAlign: "center" }}>Choose your hero</h3>
          <div className="option-grid">
            {HEROES.map((h) => (
              <button key={h.id} onClick={() => setHeroAssetId(h.id)} aria-pressed={heroAssetId === h.id} className={`option${heroAssetId === h.id ? " is-on" : ""}`}>
                <strong>{h.label}</strong>
              </button>
            ))}
          </div>
          <div className="field" style={{ marginTop: 16, marginBottom: 0 }}>
            <label htmlFor="obName">Hero name</label>
            <input id="obName" type="text" value={heroName} onChange={(e) => setHeroName(e.target.value)} placeholder="Aki" maxLength={24} />
          </div>
        </section>
      )}
      {step === 1 && (
        <section className="panel" style={{ padding: 24 }} aria-label="Choose companion">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <Companion width={110} />
          </div>
          <h3 style={{ fontSize: 17, marginBottom: 12, textAlign: "center" }}>Choose your companion</h3>
          <div className="option-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            {COMPANIONS.map((c) => (
              <button key={c.id} onClick={() => setCompanionAssetId(c.id)} aria-pressed={companionAssetId === c.id} className={`option${companionAssetId === c.id ? " is-on" : ""}`}>
                <strong>{c.label}</strong>
              </button>
            ))}
          </div>
        </section>
      )}
      {step === 2 && (
        <section className="panel" style={{ padding: 24 }} aria-label="Choose focus">
          <h3 style={{ fontSize: 17, marginBottom: 12 }}>What will you work on?</h3>
          <div className="chip-row">
            {DOMAINS.map((d) => (
              <button key={d} onClick={() => toggleDomain(d)} aria-pressed={domains.includes(d)} className={`chip${domains.includes(d) ? " is-on" : ""}`}>
                {d}
              </button>
            ))}
          </div>
        </section>
      )}
      {step === 3 && (
        <section className="panel" style={{ padding: 24 }} aria-label="First quest">
          <h3 style={{ fontSize: 17, marginBottom: 6 }}>Receive your first quest</h3>
          <p style={{ fontSize: 13.5, color: "var(--text-2)", marginBottom: 14 }}>
            We&apos;ll create your campaign and drop an achievable first quest on Today.
          </p>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="obQuest">First quest</label>
            <input id="obQuest" type="text" value={firstQuest} onChange={(e) => setFirstQuest(e.target.value)} maxLength={80} />
          </div>
        </section>
      )}

      {error && (
        <p role="alert" style={{ fontSize: 13.5, color: "var(--accent-text)", marginTop: 12 }}>
          {error}
        </p>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        {step > 0 && (
          <button onClick={() => setStep((s) => s - 1)} className="btn btn--ghost">
            Back
          </button>
        )}
        {step < 3 ? (
          <button onClick={() => setStep((s) => s + 1)} className="btn btn--primary">
            Next <Icon id="i-arrow-r" style={{ width: 15, height: 15 }} />
          </button>
        ) : (
          <button onClick={finish} disabled={done} className="btn btn--primary">
            {done ? "Entering…" : "Enter the realm"}
          </button>
        )}
      </div>
      </>
      )}
    </div>
  );
}
