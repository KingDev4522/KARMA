"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CompanionImage } from "@/components/illustrations";

const KEY = "lrp-tour";

export function startTour() {
  try {
    window.localStorage.setItem(KEY, "ready");
    window.dispatchEvent(new CustomEvent("liferpg:tour"));
  } catch {
    /* ignore */
  }
}

function tourState(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return "done";
  }
}

interface TourStep {
  route: string;
  title: string;
  body: (hero: string, comp: string) => string;
}

const STEPS: TourStep[] = [
  {
    route: "/",
    title: "Today is your march",
    body: (hero) => `${hero}, this is Today. Your next quest waits below — hit Complete and watch the coins fly to your purse.`,
  },
  {
    route: "/quests",
    title: "Every mission lives here",
    body: (hero, comp) => `Create anything — drink water, study, ship code. ${comp} keeps the score and it all counts, ${hero}.`,
  },
  {
    route: "/campaigns",
    title: "Big dreams, small steps",
    body: () => `Long journeys become milestones here — and each finished step feeds back into Today.`,
  },
  {
    route: "/focus",
    title: "One quest, one timer",
    body: () => `Pick a quest, hold the line. Finish, and the reward lands by itself — no extra taps.`,
  },
  {
    route: "/store",
    title: "Coins become identity",
    body: () => `Skins, frames, title boxes, rare friends. Everything here is earned — never bought with real money.`,
  },
  {
    route: "/personalize",
    title: "Make it yours",
    body: (hero) => `This dressing room is yours, ${hero}. Wear what you've earned, rename anyone, choose your frame.`,
  },
];

const TourCtx = createContext<{ replay: () => void }>({ replay: () => undefined });

export function useTour() {
  return useContext(TourCtx);
}

/** First-run companion guide — the user's own companion, using their names. */
export function TourProvider({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { authHeaders, userId, loading: authLoading } = useAuth();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [who, setWho] = useState({ hero: "traveler", comp: "friend", compId: null as string | null });

  const refresh = useCallback(() => {
    setActive(tourState() === "ready");
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("liferpg:tour", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("liferpg:tour", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  // Names + face come from the server profile so the companion greets its owner.
  useEffect(() => {
    if (!active || authLoading || !userId) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client.getProfile(authHeaders()).then((me: any) => {
      const p = me?.profile ?? {};
      setWho({
        hero: p.heroName ?? p.displayName ?? "traveler",
        comp: p.companionName ?? "friend",
        compId: p.companionAssetId ?? null,
      });
    }).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, userId, authLoading]);

  const end = useCallback(() => {
    try {
      window.localStorage.setItem(KEY, "done");
    } catch {
      /* ignore */
    }
    setActive(false);
    setStep(0);
  }, []);

  const replay = useCallback(() => {
    startTour();
    setStep(0);
    router.push("/");
  }, [router]);

  const current = STEPS[step];
  const show = active && !!userId && current && path === current.route;

  return (
    <TourCtx.Provider value={{ replay }}>
      {children}
      {show && (
        <div className="tour-card" role="dialog" aria-label="Guide">
          <CompanionImage assetId={who.compId} width={56} alt={who.comp} eager />
          <div className="tour-bubble">
            <strong>
              {who.comp} <span className="tour-step">{step + 1} / {STEPS.length}</span>
            </strong>
            <p className="tour-title">{current.title}</p>
            <p>{current.body(who.hero, who.comp)}</p>
            <div className="tour-actions">
              {step < STEPS.length - 1 ? (
                <button
                  className="btn btn--primary"
                  onClick={() => {
                    const next = STEPS[step + 1];
                    setStep(step + 1);
                    router.push(next.route);
                  }}
                >
                  Show me
                </button>
              ) : (
                <button className="btn btn--primary" onClick={end}>
                  Let&apos;s go
                </button>
              )}
              <button className="btn btn--ghost" onClick={end}>
                Skip tour
              </button>
            </div>
          </div>
        </div>
      )}
    </TourCtx.Provider>
  );
}
