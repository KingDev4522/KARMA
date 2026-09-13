"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { client } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CompanionImage } from "@/components/illustrations";

const KEY = "lrp-tour";

const keyFor = (userId?: string | null) => (userId ? `${KEY}-${userId}` : KEY);

/** One-time first-run guide: armed ONLY by onboarding finish ("ready"),
 *  consumed on Skip/Finish ("done"). Returning logins never re-arm it —
 *  Settings "Replay tour" is the only other writer. Per-account key so a
 *  second device / second account can't replay or suppress it wrongly. */
export function startTour(userId?: string | null) {
  try {
    window.localStorage.setItem(KEY, "ready");
    if (userId) window.localStorage.setItem(keyFor(userId), "ready");
    window.dispatchEvent(new CustomEvent("liferpg:tour"));
  } catch {
    /* ignore */
  }
}

export function endTourState(userId?: string | null) {
  try {
    window.localStorage.setItem(KEY, "done");
    if (userId) window.localStorage.setItem(keyFor(userId), "done");
  } catch {
    /* ignore */
  }
}

function tourState(userId?: string | null): string | null {
  try {
    if (userId) {
      const per = window.localStorage.getItem(keyFor(userId));
      if (per) return per;
    }
    return window.localStorage.getItem(KEY);
  } catch {
    return "done";
  }
}

interface TourStep {
  route: string;
  target: string; // [data-tour] id to spotlight
  title: string;
  body: (hero: string, comp: string) => string;
}

const STEPS: TourStep[] = [
  { route: "/", target: "today", title: "Today runs the day", body: (hero) => `${hero}, this tab is your march — what matters now, not everything ever.` },
  { route: "/", target: "coins", title: "Coins are earned", body: () => `Every finished quest drops coins here. Green arrow up means payday.` },
  { route: "/quests", target: "quests", title: "Every mission lives here", body: (hero, comp) => `Create anything, ${hero} — drink water, study, ship code. ${comp} keeps the score.` },
  { route: "/campaigns", target: "campaigns", title: "Big dreams, small steps", body: () => `Long journeys become milestones here — each finished step feeds Today.` },
  { route: "/focus", target: "focus", title: "One quest, one timer", body: () => `Pick a quest, set any minutes, hold the line. Finish and the reward lands itself.` },
  { route: "/realm", target: "realm", title: "This is you, growing", body: (hero) => `Levels, attributes, badges — proof of who ${hero} is becoming.` },
  { route: "/chronicle", target: "chronicle", title: "Your story, kept", body: () => `History, calendar, charts. Tap any marked day to see what happened.` },
  { route: "/store", target: "store", title: "Coins become identity", body: () => `Skins, frames, title boxes, rare friends. Earned, never bought with real money.` },
  { route: "/personalize", target: "personalize", title: "Make it yours", body: (hero) => `Your dressing room, ${hero} — picture, character, frame, names. All saved.` },
  { route: "/hero-card", target: "hero-card", title: "Show it off", body: () => `Your radar card. Export it as a picture and flex the journey anywhere.` },
  { route: "/settings", target: "settings", title: "Your controls", body: () => `Sound, music, motion, reminders, rest days, tour replay — all here.` },
  { route: "/", target: "profile", title: "This is your face", body: (hero, comp) => `Tap here anytime, ${hero} — ${comp} guards your Realm, dressing room and sign-out.` },
];

const TourCtx = createContext<{ replay: () => void }>({ replay: () => undefined });

export function useTour() {
  return useContext(TourCtx);
}

interface Spot {
  x: number;
  y: number;
  w: number;
  h: number;
  bx: number;
  by: number;
  below: boolean;
  ax: number;
  fallback: boolean;
}

function visibleTarget(id: string): HTMLElement | null {
  const all = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`));
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

/** First-run spotlight guide — dims the realm, rings the exact tab, and the
 *  player's OWN companion explains it by name. Tap Next to walk, Skip to end. */
export function TourProvider({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { authHeaders, userId, loading: authLoading } = useAuth();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [spot, setSpot] = useState<Spot | null>(null);
  const [who, setWho] = useState({ hero: "traveler", comp: "friend", compId: null as string | null });
  const stepRef = useRef(0);
  stepRef.current = step;

  const refresh = useCallback(() => {
    setActive(tourState(userId) === "ready");
  }, [userId]);

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
    endTourState(userId);
    setActive(false);
    setStep(0);
    setSpot(null);
  }, [userId]);

  const replay = useCallback(() => {
    startTour(userId);
    setStep(0);
    setSpot(null);
    router.push("/");
  }, [router, userId]);

  const go = useCallback(
    (n: number) => {
      if (n >= STEPS.length) {
        end();
        return;
      }
      setStep(n);
      setSpot(null);
      const s = STEPS[n];
      if (s.route !== path) router.push(s.route);
    },
    [end, path, router],
  );

  // Esc ends the tour.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") end();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, end]);

  // Measure the spotlight target for the current step.
  useEffect(() => {
    if (!active || !userId) {
      setSpot(null);
      return;
    }
    const s = STEPS[stepRef.current];
    if (!s) return;
    let alive = true;
    let tries = 0;

    const place = (el: HTMLElement | null) => {
      if (!alive) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (!el) {
        // Fallback: centered bubble, no pointer — never stalls the tour.
        setSpot({ x: 0, y: 0, w: 0, h: 0, bx: Math.max(16, (vw - 340) / 2), by: Math.max(16, vh - 300), below: false, ax: -1, fallback: true });
        return;
      }
      try {
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      } catch {
        /* ignore */
      }
      setTimeout(() => {
        if (!alive) return;
        const r = el.getBoundingClientRect();
        if (r.width === 0) return;
        const pad = 10;
        const x = Math.max(8, r.left - pad);
        const y = Math.max(8, r.top - pad);
        const w = Math.min(vw - 16, r.width + pad * 2);
        const h = r.height + pad * 2;
        const BW = Math.min(340, vw - 32);
        const cx = x + w / 2;
        const below = y + h + 16 + 250 < vh;
        const bx = Math.max(16, Math.min(cx - BW / 2, vw - BW - 16));
        const by = below ? y + h + 16 : Math.max(12, y - 16 - 250);
        setSpot({ x, y, w, h, bx, by, below, ax: Math.max(bx + 28, Math.min(cx, bx + BW - 28)), fallback: false });
      }, 320);
    };

    const tick = () => {
      if (!alive) return;
      const el = visibleTarget(s.target);
      if (el || tries >= 16) {
        place(el);
        return;
      }
      tries++;
      setTimeout(tick, 150);
    };
    tick();

    const onResize = () => {
      const el = visibleTarget(s.target);
      if (el) place(el);
    };
    window.addEventListener("resize", onResize);
    return () => {
      alive = false;
      window.removeEventListener("resize", onResize);
    };
  }, [active, userId, step, path]);

  const current = STEPS[step];
  const show = active && !!userId && !!current && !!spot;

  return (
    <TourCtx.Provider value={{ replay }}>
      {children}
      {show && spot && current && (
        <div className="spotlight" role="dialog" aria-modal="true" aria-label={`Guide: ${current.title}`}>
          {!spot.fallback && (
            <div
              className="spotlight-ring"
              aria-hidden="true"
              style={{ left: spot.x, top: spot.y, width: spot.w, height: spot.h }}
            />
          )}
          <div
            className="spotlight-bubble"
            style={{ left: spot.bx, top: spot.by, maxWidth: 340 }}
          >
            {!spot.fallback && (
              <span className={`spotlight-arrow${spot.below ? " is-top" : " is-bottom"}`} style={{ left: spot.ax - spot.bx }} aria-hidden="true" />
            )}
            <div className="spotlight-head">
              <CompanionImage assetId={who.compId} width={52} alt={who.comp} eager />
              <div>
                <strong>{who.comp}</strong>
                <span className="tour-step">{step + 1} / {STEPS.length}</span>
              </div>
            </div>
            <p className="tour-title">{current.title}</p>
            <p className="spotlight-body">{current.body(who.hero, who.comp)}</p>
            <div className="tour-actions">
              <button className="btn btn--primary" onClick={() => go(step + 1)}>
                {step < STEPS.length - 1 ? "Next" : "Let's go"}
              </button>
              {step > 0 && (
                <button className="btn btn--ghost" onClick={() => go(step - 1)}>
                  Back
                </button>
              )}
              <button className="btn btn--ghost" onClick={end}>
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </TourCtx.Provider>
  );
}
