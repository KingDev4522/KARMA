"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { HeroFigure, CompanionSprite } from "@/components/world";
import { Field, inputCls } from "@/components/ui";
import { cn } from "@/lib/cn";

/** Onboarding — entering the world. No fixed personas; the user defines the quest. */
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
  const { authHeaders } = useAuth();
  const router = useRouter();
  const reduce = useReducedMotion();
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
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't finish onboarding.");
    }
  };

  const titles = ["Choose your hero", "Name your hero", "Choose your companion", "Areas of interest", "Your first quest"];

  return (
    <div className="mx-auto max-w-xl">
      <div className="pattern-asanoha overflow-hidden rounded-panel border border-line bg-surface-elevated p-6 shadow-card md:p-8">
        <p className="text-xs text-ink-muted">Step {step + 1} of {titles.length} · {titles[step]}</p>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={reduce ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {HEROES.map((h) => (
                  <button key={h.id} onClick={() => setHeroAssetId(h.id)} aria-pressed={heroAssetId === h.id}
                    className={cn("rounded-card border p-3 pressable", heroAssetId === h.id ? "border-xp bg-xp/10" : "border-line bg-surface-card")}>
                    <HeroFigure assetId={h.id} size={56} />
                    <span className="mt-1 block text-center text-xs font-medium">{h.label}</span>
                  </button>
                ))}
              </div>
            )}
            {step === 1 && (
              <div className="mt-3">
                <Field label="Hero name">
                  <input value={heroName} onChange={(e) => setHeroName(e.target.value)} placeholder="Aperture Adept" autoFocus className={inputCls} />
                </Field>
              </div>
            )}
            {step === 2 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {COMPANIONS.map((c) => (
                  <button key={c.id} onClick={() => setCompanionAssetId(c.id)} aria-pressed={companionAssetId === c.id}
                    className={cn("flex flex-col items-center rounded-card border p-3 pressable", companionAssetId === c.id ? "border-xp bg-xp/10" : "border-line bg-surface-card")}>
                    <CompanionSprite mood="greeting" />
                    <span className="mt-1 text-xs font-medium">{c.label}</span>
                  </button>
                ))}
              </div>
            )}
            {step === 3 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {DOMAINS.map((d) => (
                  <button key={d} onClick={() => toggleDomain(d)} aria-pressed={domains.includes(d)}
                    className={cn("rounded-full px-4 py-2 text-sm pressable", domains.includes(d) ? "bg-xp font-semibold text-white" : "border border-line bg-surface-card")}>
                    {d}
                  </button>
                ))}
              </div>
            )}
            {step === 4 && (
              <div className="mt-3">
                <Field label="One small first quest" hint="Minutes, not hours. Momentum beats ambition on day one." error={step === 4 ? error : null}>
                  <input value={firstQuest} onChange={(e) => setFirstQuest(e.target.value)} className={inputCls} />
                </Field>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {step !== 4 && error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
        <div className="mt-5 flex justify-between gap-2">
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
            className="inline-flex items-center gap-1 rounded-control px-4 py-2 text-sm disabled:opacity-40 pressable">
            <ArrowLeft size={15} aria-hidden /> Back
          </button>
          {step < titles.length - 1 ? (
            <button onClick={() => setStep((s) => s + 1)} className="inline-flex items-center gap-1 rounded-control bg-xp px-5 py-2 text-sm font-semibold text-white pressable">
              Continue <ArrowRight size={15} aria-hidden />
            </button>
          ) : (
            <button onClick={finish} disabled={done} className="rounded-control bg-seal px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 pressable">
              {done ? "Entering…" : "Enter Today"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
