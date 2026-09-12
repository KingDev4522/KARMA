"use client";

import { useEffect, useRef, useState } from "react";
import { client, type H } from "@/lib/api";
import { Scenery, SCENERY_COUNT } from "@/components/scenery";

const MIN_MS = 3000;
const MAX_MS = 9000;

/**
 * Realm gate — tap-to-enter splash shown once per tab session after sign-in.
 * A moment of art (animated scenery montage), a short song sting, and honest
 * work: the 3–5s window preloads Today + profile + store so the realm opens
 * warm. Nothing proceeds until the player taps.
 */
export function Splash({ authHeaders, heroName }: { authHeaders: () => H; heroName: string }) {
  const [scene, setScene] = useState(0);
  const [ready, setReady] = useState(false);
  const [gone, setGone] = useState(false);
  const [mobile, setMobile] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    setMobile(mq.matches);
    const onMq = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  useEffect(() => {
    // Animated montage while loading (calm in reduced-motion).
    if (document.documentElement.dataset.motion === "off") return;
    const id = setInterval(() => setScene((s) => (s + 1) % SCENERY_COUNT), 1600);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const t0 = Date.now();
    let alive = true;
    // Preload the realm's core data during the splash window.
    const h = authHeaders();
    Promise.allSettled([client.getToday(h).catch(() => null), client.getProfile(h).catch(() => null), client.store(h).catch(() => null)]).then(() => {
      if (!alive) return;
      const wait = Math.max(0, MIN_MS - (Date.now() - t0));
      setTimeout(() => alive && setReady(true), wait);
    });
    const fallback = setTimeout(() => alive && setReady(true), MAX_MS);
    return () => {
      alive = false;
      clearTimeout(fallback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;

  const enter = () => {
    if (!ready || done.current) return;
    done.current = true;
    try {
      window.sessionStorage.setItem("lrp-splash", "seen");
    } catch {
      /* ignore */
    }
    // The tap is the gesture that unlocks audio.
    void import("@/lib/bgm").then((b) => { if (b.bgmEnabled()) void b.ensureBgm(); }).catch(() => undefined);
    void import("@/lib/sound").then((s) => s.playCreate()).catch(() => undefined);
    setGone(true);
  };

  return (
    <div className="splash" role="dialog" aria-modal="true" aria-label="Enter the realm" onClick={enter}>
      <div className="splash-art" aria-hidden="true">
        <Scenery key={scene} index={scene} mobile={mobile} className="sc-scene-enter" />
      </div>
      <div className="splash-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo.png" alt="KARMA" className="splash-logo" width={mobile ? 64 : 84} height={mobile ? 64 : 84} />
        <h1 className="splash-title">KARMA</h1>
        <p className="splash-sub">
          {heroName && heroName !== "Aki" ? `Welcome back, ${heroName}. ` : ""}Your life is the campaign.
        </p>
        <div className="splash-status" aria-live="polite">
          {!ready ? (
            <span className="splash-loading">
              <span className="splash-dots" aria-hidden="true"><i /><i /><i /></span>
              Opening your realm…
            </span>
          ) : (
            <span className="splash-ready">The realm is warm — tap anywhere to enter</span>
          )}
        </div>
        <button className={`btn btn--primary btn--lg splash-continue${ready ? " is-on" : ""}`} disabled={!ready} onClick={(e) => { e.stopPropagation(); enter(); }}>
          {ready ? "Continue" : "Loading…"}
        </button>
      </div>
    </div>
  );
}

/** True when this tab already passed the gate. */
export function splashSeen(): boolean {
  try {
    return window.sessionStorage.getItem("lrp-splash") === "seen";
  } catch {
    return true;
  }
}
