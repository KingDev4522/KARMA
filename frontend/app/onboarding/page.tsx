"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { CompanionImage, HeroImage, Icon } from "@/components/illustrations";
import { FREE_COMPANIONS, HEROES, PREMIUM_COMPANIONS, heroAssetId } from "@/lib/identity";
import { SignInPrompt, Skeleton } from "@/components/States";

const DOMAINS = ["Fitness", "Learning", "Career", "Creativity", "Relationships", "Home", "Mindfulness"];

/**
 * Onboarding — entering the world.
 * 1 hero (of 6, traditional attire) → hero name + oath → companion (of 6 free)
 * + companion name → life domains → first campaign + first quest.
 * Premium companions and variant skins live in the Store, not here.
 */
export default function OnboardingPage() {
  const { authHeaders, userId, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [step, setStep] = useState(0);
  // Nothing preselected — the player chooses everything (no hardcoded defaults).
  const [heroId, setHeroId] = useState<string | null>(null);
  const [heroName, setHeroName] = useState("");
  const [oath, setOath] = useState("");
  const [companionId, setCompanionId] = useState<string | null>(null);
  const [companionName, setCompanionName] = useState("");
  const [domains, setDomains] = useState<string[]>(["Learning"]);
  const [firstQuest, setFirstQuest] = useState("Drink a glass of water");
  const [firstCampaign, setFirstCampaign] = useState("My first campaign");
  const [domainsSaved, setDomainsSaved] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: starterPack } = useApi<any>(() => client.starters(authHeaders()), [userId, domainsSaved], {
    enabled: !!userId && step === 4 && domainsSaved,
  });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!companionName && companionId) {
      const c = FREE_COMPANIONS.find((x) => x.id === companionId);
      if (c) setCompanionName(c.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companionId]);

  const toggleDomain = (d: string) => setDomains((s) => (s.includes(d) ? s.filter((x) => x !== d) : [...s, d]));

  const finish = async () => {
    setError(null);
    if (!heroId) {
      setError("Choose your character first.");
      setStep(0);
      return;
    }
    if (!companionId) {
      setError("Choose your companion first.");
      setStep(2);
      return;
    }
    if (!heroName.trim()) {
      setError("Name your character to cross the threshold.");
      return;
    }
    if (!firstQuest.trim()) {
      setError("Write one small first quest — it should take minutes.");
      return;
    }
    try {
      // Optional profile photo — asked up front, skippable, changeable later.
      let avatarAssetId: string | null = null;
      if (photoFile && userId) {
        try {
          const { uploadAvatarPhoto } = await import("@/lib/avatar-upload");
          avatarAssetId = await uploadAvatarPhoto(userId, photoFile);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Photo upload failed — continuing without it.");
          avatarAssetId = null;
        }
      }
      await client.patchProfile(authHeaders(), {
        heroAssetId: heroAssetId(heroId as string, "traditional"),
        heroName: heroName.trim(),
        companionAssetId: companionId as string,
        companionName: companionName.trim() || null,
        bio: oath.trim() || null,
        lifeDomains: domains,
        ...(avatarAssetId ? { avatarAssetId } : {}),
      });
      const camp = await client.createCampaign(authHeaders(), { title: firstCampaign.trim() || "My first campaign" });
      await client.createQuest(authHeaders(), { title: firstQuest.trim(), questType: "quick", activityKey: "routine_habit", difficulty: 1, campaignId: camp.id });
      setDone(true);
      toast("Welcome to the realm.", "i-spark");
      try {
        window.localStorage.setItem("lrp-tour", "ready");
      } catch {
        /* ignore */
      }
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't finish onboarding. Nothing was written.");
    }
  };

  const starters: { title: string }[] = starterPack?.suggestions ?? [];
  const hero = HEROES.find((h) => h.id === heroId) ?? HEROES[0];

  return (
    <div className="page is-active" style={{ maxWidth: 600, margin: "0 auto" }}>
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
            Step {step + 1} of 5 — your life is the campaign.
          </p>
        </div>
      </div>

      <div className="wizard-steps" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <i key={i} className={i <= step ? "on" : ""} />
        ))}
      </div>

      {step === 0 && (
        <section className="panel" style={{ padding: 24 }} aria-label="Choose character">
          <h3 style={{ fontSize: 17, marginBottom: 4, textAlign: "center" }}>Choose your character</h3>
          <p style={{ fontSize: 13, color: "var(--text-2)", textAlign: "center", marginBottom: 12 }}>
            Six travelers in traditional attire. Other looks are earned in the Store.
          </p>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <div style={{ width: 150, borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
              <HeroImage assetId={heroId ? heroAssetId(heroId, "traditional") : null} eager alt={hero ? `${hero.region} traveler in traditional attire` : "Choose a character below"} />
            </div>
          </div>
          <div className="option-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            {HEROES.map((h) => (
              <button key={h.id} onClick={() => setHeroId(h.id)} aria-pressed={heroId === h.id} className={`option${heroId === h.id ? " is-on" : ""}`} title={`${h.region} — ${h.line}`}>
                <strong>{h.region}</strong>
                <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{h.line}</span>
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12.5, color: "var(--text-3)", textAlign: "center", marginTop: 10 }}>You will name your character next — the name is yours to choose.</p>
        </section>
      )}
      {step === 1 && (
        <section className="panel" style={{ padding: 24 }} aria-label="Name character">
          <h3 style={{ fontSize: 17, marginBottom: 4, textAlign: "center" }}>Name your character</h3>
          <p style={{ fontSize: 13, color: "var(--text-2)", textAlign: "center", marginBottom: 14 }}>
            Give your character a name and a one-line oath — a goal, a strength, a habit to break.
          </p>
          <div className="field">
            <label htmlFor="obName">Character name</label>
            <input id="obName" type="text" value={heroName} onChange={(e) => setHeroName(e.target.value)} placeholder="Your character's name" maxLength={80} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="obPhoto">Profile photo <span style={{ fontWeight: 400, color: "var(--text-3)" }}>(optional — your character leads by default)</span></label>
            <input
              id="obPhoto"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setPhotoFile(f);
                setPhotoPreview(f ? URL.createObjectURL(f) : null);
              }}
            />
            {photoPreview && (
              <span style={{ display: "block", width: 72, borderRadius: 12, overflow: "hidden", marginTop: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="Photo preview" style={{ width: "100%", display: "block" }} />
              </span>
            )}
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="obOath">Oath (shown on your Realm)</label>
            <input id="obOath" type="text" value={oath} onChange={(e) => setOath(e.target.value)} placeholder="Ship my portfolio, kill doomscroll" maxLength={500} />
          </div>
        </section>
      )}
      {step === 2 && (
        <section className="panel" style={{ padding: 24 }} aria-label="Choose companion">
          <h3 style={{ fontSize: 17, marginBottom: 4, textAlign: "center" }}>Choose your companion</h3>
          <p style={{ fontSize: 13, color: "var(--text-2)", textAlign: "center", marginBottom: 12 }}>
            Your first friend is free — others unlock in the Store.
          </p>
          <div className="option-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            {FREE_COMPANIONS.map((c) => (
              <button key={c.id} onClick={() => setCompanionId(c.id)} aria-pressed={companionId === c.id} className={`option${companionId === c.id ? " is-on" : ""}`}>
                <CompanionImage assetId={c.id} width={64} />
                <strong style={{ marginTop: 6 }}>{c.name}</strong>
              </button>
            ))}
          </div>
          <div className="field" style={{ marginTop: 16, marginBottom: 0 }}>
            <label htmlFor="obCompName">Companion name (yours to choose)</label>
            <input id="obCompName" type="text" value={companionName} onChange={(e) => setCompanionName(e.target.value)} placeholder="Moss" maxLength={80} />
          </div>
          <p style={{ fontSize: 12.5, color: "var(--text-3)", textAlign: "center", marginTop: 10 }}>
            Premium: {PREMIUM_COMPANIONS.map((c) => c.name).join(" · ")} — earn coins, meet them in the Store.
          </p>
        </section>
      )}
      {step === 3 && (
        <section className="panel" style={{ padding: 24 }} aria-label="Choose focus">
          <h3 style={{ fontSize: 17, marginBottom: 4 }}>What do you want to work on?</h3>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 12 }}>
            Pick every goal that matters — your first quests are shaped around them.
          </p>
          <div className="chip-row">
            {DOMAINS.map((d) => (
              <button key={d} onClick={() => toggleDomain(d)} aria-pressed={domains.includes(d)} className={`chip${domains.includes(d) ? " is-on" : ""}`}>
                {d}
              </button>
            ))}
          </div>
        </section>
      )}
      {step === 4 && (
        <section className="panel" style={{ padding: 24 }} aria-label="First quest">
          <h3 style={{ fontSize: 17, marginBottom: 6 }}>What is your final goal?</h3>
          <p style={{ fontSize: 13.5, color: "var(--text-2)", marginBottom: 14 }}>
            Name the campaign your life is building toward — your first quest will serve it.
          </p>
          <div className="field">
            <label htmlFor="obCamp">Final goal (first campaign)</label>
            <input id="obCamp" type="text" value={firstCampaign} onChange={(e) => setFirstCampaign(e.target.value)} maxLength={80} />
          </div>
          <h3 style={{ fontSize: 17, marginBottom: 6, marginTop: 8 }}>Receive your first quest</h3>
          {starters.length > 0 && (
            <div className="chip-row" style={{ marginBottom: 10 }} aria-label="Suggested first quests">
              {starters.slice(0, 3).map((s) => (
                <button key={s.title} className={`chip${firstQuest === s.title ? " is-on" : ""}`} onClick={() => setFirstQuest(s.title)} aria-pressed={firstQuest === s.title}>
                  {s.title}
                </button>
              ))}
            </div>
          )}
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
        {step < 4 ? (
          <button
            onClick={async () => {
              setError(null);
              if (step === 0 && !heroId) {
                setError("Choose your character to continue.");
                return;
              }
              if (step === 2 && !companionId) {
                setError("Choose your companion to continue.");
                return;
              }
              if (step === 3) {
                // Persist interests first so step 4 suggestions come from the server.
                await client.patchProfile(authHeaders(), { lifeDomains: domains }).catch(() => undefined);
                setDomainsSaved(true);
              }
              setStep((s) => s + 1);
            }}
            className="btn btn--primary"
          >
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
