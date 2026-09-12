"use client";

/**
 * Ambient BGM — three slow generative pads (no audio assets) that take turns,
 * one evolving soundscape for the whole realm. Starts only after the first
 * user gesture (autoplay policy), suspends when the tab hides, and stops
 * instantly from Settings. Independent from one-shot sound effects.
 */

const KEY = "lrp-bgm";

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

// Three tracks: root + fifth + octave, slow-breathing gains. Quiet by design.
const TRACKS = [
  { name: "Dawn Haze", base: 146.83, fifth: 220.0, octave: 293.66 },
  { name: "Ember Drift", base: 164.81, fifth: 246.94, octave: 329.63 },
  { name: "Night Vigil", base: 130.81, fifth: 196.0, octave: 261.63 },
];

let ctx: AudioContext | null = null;
let nodes: { osc: OscillatorNode[]; gain: GainNode; filter: BiquadFilterNode } | null = null;
let trackIdx = 0;
let rotateTimer: ReturnType<typeof setInterval> | null = null;
let booted = false;

function buildTrack(i: number) {
  if (!ctx || !nodes) return;
  const t = TRACKS[i % TRACKS.length];
  const now = ctx.currentTime;
  nodes.osc.forEach((o, k) => {
    const f = [t.base, t.fifth, t.octave][k % 3];
    o.frequency.cancelScheduledValues(now);
    o.frequency.setValueAtTime(o.frequency.value, now);
    o.frequency.linearRampToValueAtTime(f, now + 4);
  });
}

function startLoop() {
  if (!ctx || nodes || typeof window === "undefined") return;
  try {
    const gain = ctx.createGain();
    gain.gain.value = 0.0;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 620;
    filter.Q.value = 0.4;
    const osc = [0, 1, 2].map((k) => {
      const o = ctx!.createOscillator();
      o.type = k === 2 ? "triangle" : "sine";
      const t = TRACKS[trackIdx % TRACKS.length];
      o.frequency.value = [t.base, t.fifth, t.octave][k];
      o.detune.value = k === 1 ? 4 : -3;
      o.connect(filter);
      o.start();
      return o;
    });
    // Slow breathing swell.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.012;
    lfo.connect(lfoGain).connect(gain.gain);
    lfo.start();
    filter.connect(gain).connect(ctx.destination);
    gain.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 6);
    nodes = { osc, gain, filter };
    // Tracks take turns every two minutes.
    rotateTimer = setInterval(() => {
      trackIdx = (trackIdx + 1) % TRACKS.length;
      buildTrack(trackIdx);
    }, 120_000);
  } catch {
    nodes = null;
  }
}

export function currentTrackName(): string {
  return TRACKS[trackIdx % TRACKS.length].name;
}

export function stopBgm() {
  try {
    if (rotateTimer) clearInterval(rotateTimer);
    rotateTimer = null;
    if (nodes && ctx) {
      nodes.gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      const old = nodes;
      setTimeout(() => old.osc.forEach((o) => { try { o.stop(); } catch { /* noop */ } }), 700);
    }
  } catch {
    /* ignore */
  }
  nodes = null;
}

export async function ensureBgm() {
  if (typeof window === "undefined" || !bgmEnabled() || nodes) return;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = ctx ?? new AC();
    if (ctx.state === "suspended") await ctx.resume().catch(() => undefined);
    if (document.visibilityState === "hidden") return;
    startLoop();
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
    if (!ctx) return;
    try {
      if (document.visibilityState === "hidden") void ctx.suspend().catch(() => undefined);
      else if (bgmEnabled()) void ctx.resume().catch(() => undefined);
    } catch {
      /* ignore */
    }
  });
}
