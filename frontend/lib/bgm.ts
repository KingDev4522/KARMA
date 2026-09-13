"use client";

import { TRACK_FILES } from "@/lib/media";

/**
 * Ambient BGM — the six shipped 30s lofi tracks (tanpura, Keherwa tabla,
 * raga bansuri/sitar) played back-to-back with a fade-out, a breath of
 * silence, and a fade-in between tracks. If the MP3s ever fail, the trapped
 * generative engine below takes over so the realm never goes quiet by
 * accident. Settings stops everything instantly; tab-hide suspends.
 */

const KEY = "lrp-bgm";
const FADE_OUT_MS = 1200;
const GAP_MS = 800;
const FADE_IN_MS = 1500;
const BASE_VOLUME = 0.75;

export function bgmEnabled(): boolean {
  try {
    return window.localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setBgmEnabled(on: boolean) {
  try {
    window.localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* ignore */
  }
  if (!on) stopBgm();
  else void ensureBgm();
}

export const BGM_TRACK_COUNT = TRACK_FILES.length;

let els: HTMLAudioElement[] = [];
let active = 0;
let trackIdx = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
let fadeTimer: ReturnType<typeof setInterval> | null = null;
let dead = new Set<number>();
let generativeOn = false;
let booted = false;

export function currentTrackName(): string {
  if (generativeOn) return currentGenTrackName();
  return TRACK_FILES[trackIdx % TRACK_FILES.length].name;
}

function clearTimers() {
  if (timer) clearTimeout(timer);
  timer = null;
  if (fadeTimer) clearInterval(fadeTimer);
  fadeTimer = null;
}

/** Ramp an element's volume toward target over ms, then call done. */
function fade(el: HTMLAudioElement, target: number, ms: number, done?: () => void) {
  if (fadeTimer) clearInterval(fadeTimer);
  fadeTimer = null;
  const steps = 12;
  const from = el.volume;
  let n = 0;
  fadeTimer = setInterval(() => {
    n++;
    el.volume = Math.min(1, Math.max(0, from + ((target - from) * n) / steps));
    if (n >= steps) {
      if (fadeTimer) clearInterval(fadeTimer);
      fadeTimer = null;
      done?.();
    }
  }, Math.max(16, Math.round(ms / steps)));
}

function playIndex(i: number) {
  if (typeof window === "undefined" || !bgmEnabled()) return;
  trackIdx = ((i % TRACK_FILES.length) + TRACK_FILES.length) % TRACK_FILES.length;
  const el = els[active];
  const t = TRACK_FILES[trackIdx];
  el.src = t.src;
  el.volume = 0;
  el.play().then(() => {
    fade(el, BASE_VOLUME, FADE_IN_MS);
    // Preload the next track while this one plays.
    const next = els[1 - active];
    const nt = TRACK_FILES[(trackIdx + 1) % TRACK_FILES.length];
    if (!dead.has((trackIdx + 1) % TRACK_FILES.length)) {
      try {
        next.src = nt.src;
        next.load();
      } catch {
        /* ignore */
      }
    }
  }).catch(() => {
    onTrackDead(trackIdx);
  });
}

function onTrackDead(i: number) {
  dead.add(i);
  if (dead.size >= TRACK_FILES.length) {
    startGenerative();
    return;
  }
  advance();
}

function advance() {
  if (typeof window === "undefined" || !bgmEnabled()) return;
  clearTimers();
  const el = els[active];
  fade(el, 0, FADE_OUT_MS, () => {
    try {
      el.pause();
    } catch {
      /* ignore */
    }
    // Breath of silence between tracks.
    timer = setTimeout(() => {
      if (!bgmEnabled()) return;
      active = 1 - active;
      let next = (trackIdx + 1) % TRACK_FILES.length;
      let guard = 0;
      while (dead.has(next) && guard < TRACK_FILES.length) {
        next = (next + 1) % TRACK_FILES.length;
        guard++;
      }
      playIndex(next);
    }, GAP_MS);
  });
}

function wire(el: HTMLAudioElement) {
  el.preload = "auto";
  el.loop = false;
  el.onended = () => {
    if (bgmEnabled()) advance();
  };
  el.onerror = () => {
    onTrackDead(trackIdx);
  };
}

export function stopBgm() {
  clearTimers();
  try {
    for (const el of els) {
      el.pause();
      el.removeAttribute("src");
      el.load();
    }
  } catch {
    /* ignore */
  }
  stopGenerative();
  generativeOn = false;
}

export async function ensureBgm() {
  if (typeof window === "undefined" || !bgmEnabled()) return;
  if (timer || (els[active]?.src && !els[active].paused)) return;
  try {
    if (document.visibilityState === "hidden") return;
    if (els.length === 0) {
      els = [new Audio(), new Audio()];
      els.forEach(wire);
    }
    if (generativeOn) return;
    playIndex(trackIdx);
  } catch {
    /* silent */
  }
}

/** Call once from app boot: gesture unlock + tab visibility handling. */
export function bootBgm() {
  if (booted || typeof window === "undefined") return;
  booted = true;
  const unlock = () => {
    void ensureBgm();
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
  document.addEventListener("visibilitychange", () => {
    try {
      if (document.visibilityState === "hidden") {
        for (const el of els) el.pause();
        suspendGenerative();
      } else if (bgmEnabled()) {
        const el = els[active];
        if (el?.src) void el.play().catch(() => undefined);
        else void ensureBgm();
        resumeGenerative();
      }
    } catch {
      /* ignore */
    }
  });
}

/* ============================================================
   Generative fallback (offline safety net — same musical DNA:
   drone + Keherwa-ish beats + raga-flavoured plucks).
   ============================================================ */

const GEN_TRACKS = [
  { name: "Dhoop", root: 146.83, scale: [0, 2, 4, 6, 7, 9, 11], bpm: 96 },
  { name: "Rain Raga", root: 130.81, scale: [0, 2, 4, 5, 7, 9, 10], bpm: 88 },
  { name: "Marigold", root: 164.81, scale: [0, 2, 4, 7, 9], bpm: 104 },
  { name: "Night Vigil", root: 116.54, scale: [0, 1, 4, 5, 7, 8, 10], bpm: 80 },
  { name: "Riverbank", root: 196.0, scale: [0, 2, 5, 7, 9], bpm: 100 },
  { name: "Sandalwood", root: 138.59, scale: [0, 3, 5, 7, 10], bpm: 92 },
];

let gctx: AudioContext | null = null;
let gmaster: GainNode | null = null;
let gtimer: ReturnType<typeof setInterval> | null = null;
let gnoise: AudioBuffer | null = null;
let gtrack = 0;

function currentGenTrackName(): string {
  return GEN_TRACKS[gtrack % GEN_TRACKS.length].name;
}

function genCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    gctx = gctx ?? new AC();
    if (!gmaster) {
      gmaster = gctx.createGain();
      gmaster.gain.value = 0.0;
      gmaster.connect(gctx.destination);
      const len = gctx.sampleRate;
      gnoise = gctx.createBuffer(1, len, gctx.sampleRate);
      const d = gnoise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return gctx;
  } catch {
    return null;
  }
}

function gnote(at: number, freq: number, vol: number, dur: number, type: OscillatorType) {
  if (!gctx || !gmaster) return;
  try {
    const o = gctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = gctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(gmaster);
    o.start(at);
    o.stop(at + dur + 0.05);
  } catch {
    /* ignore */
  }
}

function scheduleGen(idx: number, startAt: number) {
  const t = GEN_TRACKS[idx % GEN_TRACKS.length];
  const beat = 60 / t.bpm;
  const ratio = (s: number) => Math.pow(2, s / 12);
  const loopLen = 30;
  for (const mult of [1, 1.5]) {
    if (!gctx || !gmaster) return;
    try {
      const o = gctx.createOscillator();
      o.type = "sine";
      o.frequency.value = t.root * mult;
      const g = gctx.createGain();
      g.gain.setValueAtTime(0.0001, startAt);
      g.gain.linearRampToValueAtTime(mult === 1 ? 0.035 : 0.02, startAt + 2);
      g.gain.setValueAtTime(mult === 1 ? 0.035 : 0.02, startAt + loopLen - 2);
      g.gain.linearRampToValueAtTime(0.0001, startAt + loopLen);
      o.connect(g).connect(gmaster);
      o.start(startAt);
      o.stop(startAt + loopLen + 0.05);
    } catch {
      /* ignore */
    }
  }
  const beats = Math.floor(loopLen / beat);
  let seed = 1234 + idx * 777;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  let deg = 2;
  for (let b = 0; b < beats; b++) {
    const at = startAt + b * beat;
    const pos = b % 8;
    if (pos === 0 || pos === 4) {
      if (!gctx || !gmaster) continue;
      try {
        const o = gctx.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(150, at);
        o.frequency.exponentialRampToValueAtTime(48, at + 0.11);
        const g = gctx.createGain();
        g.gain.setValueAtTime(0.2, at);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
        o.connect(g).connect(gmaster!);
        o.start(at);
        o.stop(at + 0.2);
      } catch {
        /* ignore */
      }
    }
    if ((pos === 2 || pos === 6) && gctx && gmaster && gnoise) {
      try {
        const src = gctx.createBufferSource();
        src.buffer = gnoise;
        const f = gctx.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.value = 1800;
        const g = gctx.createGain();
        g.gain.setValueAtTime(0.09, at);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.09);
        src.connect(f).connect(g).connect(gmaster);
        src.start(at, Math.random());
        src.stop(at + 0.12);
      } catch {
        /* ignore */
      }
    }
    if (b % 2 === 0 && b % 8 !== 6) {
      deg += Math.floor(rnd() * 5) - 2;
      deg = Math.max(0, Math.min(t.scale.length + 2, deg));
      const semi = t.scale[deg % t.scale.length];
      gnote(at, t.root * 2 * ratio(semi), 0.13 + rnd() * 0.06, beat * 2.4, "triangle");
    }
  }
}

function startGenerative() {
  if (typeof window === "undefined" || !bgmEnabled() || gtimer) return;
  const c = genCtx();
  if (!c || !gmaster) return;
  generativeOn = true;
  try {
    gmaster.gain.cancelScheduledValues(c.currentTime);
    gmaster.gain.setValueAtTime(0.0001, c.currentTime);
    gmaster.gain.linearRampToValueAtTime(1.0, c.currentTime + 2);
    const first = c.currentTime + 0.1;
    scheduleGen(gtrack, first);
    let nextAt = first + 30;
    gtimer = setInterval(() => {
      if (!bgmEnabled() || !gctx) return;
      if (nextAt - gctx.currentTime < 1.5) {
        gtrack = (gtrack + 1) % GEN_TRACKS.length;
        scheduleGen(gtrack, nextAt);
        nextAt += 30;
      }
    }, 500);
  } catch {
    /* silent */
  }
}

function stopGenerative() {
  try {
    if (gtimer) clearInterval(gtimer);
    gtimer = null;
    if (gmaster && gctx) {
      gmaster.gain.cancelScheduledValues(gctx.currentTime);
      gmaster.gain.setValueAtTime(gmaster.gain.value, gctx.currentTime);
      gmaster.gain.linearRampToValueAtTime(0.0001, gctx.currentTime + 0.4);
    }
  } catch {
    /* ignore */
  }
}

function suspendGenerative() {
  try {
    void gctx?.suspend().catch(() => undefined);
  } catch {
    /* ignore */
  }
}

function resumeGenerative() {
  try {
    if (generativeOn) void gctx?.resume().catch(() => undefined);
  } catch {
    /* ignore */
  }
}
