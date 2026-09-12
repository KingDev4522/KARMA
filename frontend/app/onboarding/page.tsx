"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";

/** Onboarding — the RPG opening (PRD v2 §36): realm → hero → name → companion → focus → campaign → first quest. */
const HEROES = ["hero_ember", "hero_sage", "hero_warden", "hero_scout", "hero_mystic", "hero_forge"];
const COMPANIONS = ["comp_spark", "comp_moss", "comp_ember"];
const DOMAINS = ["Fitness", "Learning", "Career", "Creativity", "Relationships", "Home", "Mindfulness"];

export default function OnboardingPage() {
  const { authHeaders } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [heroAssetId, setHeroAssetId] = useState(HEROES[0]);
  const [heroName, setHeroName] = useState("");
  const [companionAssetId, setCompanionAssetId] = useState(COMPANIONS[0]);
  const [domains, setDomains] = useState<string[]>(["Learning"]);
  const [campaign, setCampaign] = useState("Build a study habit");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const toggleDomain = (d: string) => setDomains((s) => (s.includes(d) ? s.filter((x) => x !== d) : [...s, d]));

  const finish = async () => {
    setError(null);
    if (!heroName.trim()) {
      setError("Name your hero to continue.");
      return;
    }
    try {
      await client.patchProfile(authHeaders(), { heroAssetId, heroName: heroName.trim(), companionAssetId, lifeDomains: domains });
      const camp = await client.createCampaign(authHeaders(), { title: campaign });
      await client.createQuest(authHeaders(), { title: "Complete your first quest", questType: "quick", activityKey: "routine_habit", difficulty: 1, campaignId: camp.id });
      setDone(true);
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't finish onboarding.");
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="font-display text-2xl">Your life is the campaign.</h1>
      <p className="text-sm text-ink-secondary">Step {step + 1} of 6</p>

      {step === 0 && (
        <section aria-label="Choose hero">
          <h2 className="mb-2 font-display">Choose your hero</h2>
          <div className="grid grid-cols-3 gap-2">
            {HEROES.map((h) => (
              <button key={h} onClick={() => setHeroAssetId(h)} aria-pressed={heroAssetId === h} className={`rounded-xl p-3 text-sm ${heroAssetId === h ? "bg-xp text-surface-bg" : "bg-surface-card"}`}>
                {h.replace("hero_", "")}
              </button>
            ))}
          </div>
        </section>
      )}
      {step === 1 && (
        <section aria-label="Name hero">
          <h2 className="mb-2 font-display">Name your hero</h2>
          <input value={heroName} onChange={(e) => setHeroName(e.target.value)} placeholder="Aperture Adept" className="w-full rounded-lg bg-surface-card px-3 py-2" />
        </section>
      )}
      {step === 2 && (
        <section aria-label="Choose companion">
          <h2 className="mb-2 font-display">Choose your companion</h2>
          <div className="grid grid-cols-3 gap-2">
            {COMPANIONS.map((c) => (
              <button key={c} onClick={() => setCompanionAssetId(c)} aria-pressed={companionAssetId === c} className={`rounded-xl p-3 text-sm ${companionAssetId === c ? "bg-xp text-surface-bg" : "bg-surface-card"}`}>
                {c.replace("comp_", "")}
              </button>
            ))}
          </div>
        </section>
      )}
      {step === 3 && (
        <section aria-label="Choose focus">
          <h2 className="mb-2 font-display">What do you want to work on?</h2>
          <div className="flex flex-wrap gap-2">
            {DOMAINS.map((d) => (
              <button key={d} onClick={() => toggleDomain(d)} aria-pressed={domains.includes(d)} className={`rounded-full px-3 py-1.5 text-sm ${domains.includes(d) ? "bg-xp text-surface-bg" : "bg-surface-card"}`}>
                {d}
              </button>
            ))}
          </div>
        </section>
      )}
      {step === 4 && (
        <section aria-label="First campaign">
          <h2 className="mb-2 font-display">Choose your first campaign</h2>
          <input value={campaign} onChange={(e) => setCampaign(e.target.value)} className="w-full rounded-lg bg-surface-card px-3 py-2" />
        </section>
      )}
      {step === 5 && (
        <section aria-label="Begin">
          <h2 className="mb-2 font-display">Receive your first quest</h2>
          <p className="text-sm text-ink-secondary">We&apos;ll create your campaign and drop an achievable first quest on Today.</p>
        </section>
      )}

      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        {step > 0 && <button onClick={() => setStep((s) => s - 1)} className="rounded-lg border border-surface-overlay px-4 py-2 text-sm">Back</button>}
        {step < 5 ? (
          <button onClick={() => setStep((s) => s + 1)} className="rounded-lg bg-surface-card px-4 py-2 text-sm">Next</button>
        ) : (
          <button onClick={finish} disabled={done} className="rounded-lg bg-xp px-4 py-2 text-sm font-semibold text-surface-bg disabled:opacity-50">
            {done ? "Entering…" : "Enter the realm"}
          </button>
        )}
      </div>
    </div>
  );
}
