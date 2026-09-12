"use client";

/**
 * Ambient BGM — six 30-second generative lofi loops with an Indian classical
 * heart: tanpura-style drone (sa–pa), Keherwa-flavoured 8-beat percussion and
 * raga-flavoured pentatonic plucks. No audio assets, pure WebAudio.
 * Tracks take turns; Settings stops everything instantly; tab-hide suspends.
 */

const KEY = "lrp-bgm";
const LOOP_SECONDS = 30;

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

interface Track {
  name: string;
  root: number; // Hz
  scale: number[]; // semitone offsets (raga-flavoured)
  bpm: number;
}

// Dhoop · Rain Raga · Marigold · Night Vigil · Riverbank · Sandalwood
const TRACKS: Track[] = [
  { name: "Dhoop", root: 146.83, scale: [0, 2, 4, 6, 7, 9, 11], bpm: 96 },
  { name: "Rain Raga", root: 130.81, scale: [0, 2, 4, 5, 7, 9, 10], bpm: 88 },
  { name: "Marigold", root: 164.81, scale: [0, 2, 4, 7, 9], bpm: 104 },
  { name: "Night Vigil", root: 116.54, scale: [0, 1, 4, 5, 7, 8, 10], bpm: 80 },
  { name: "Riverbank", root: 196.0, scale: [0, 2, 5, 7, 9], bpm: 100 },
  { name: "Sandalwood", root: 138.59, scale: [0, 3, 5, 7, 10], bpm: 92 },
];

export const BGM_TRACK_COUNT = TRACKS.length;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let noiseBuf: AudioBuffer | null = null;
let trackIdx = 0;
let booted = false;

const semisToRatio = (s: number) => Math.pow(2, s / 12);

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = ctx ?? new AC();
    if (!master) {
      master = ctx.createGain();
      master.gain.value = 0.0;
      master.connect(ctx.destination);
      const len = ctx.sampleRate;
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return ctx;
  } catch {
    return null;
  }
}

function pluck(at: number, freq: number, vol = 0.16, dur = 0.5) {
  if (!ctx || !master) return;
  try {
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(master);
    o.start(at);
    o.stop(at + dur + 0.05);
  } catch {
    /* ignore */
  }
}

function drone(at: number, freq: number, dur: number, vol = 0.035) {
  if (!ctx || !master) return;
  try {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(vol, at + 2);
    g.gain.setValueAtTime(vol, at + dur - 2);
    g.gain.linearRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(master);
    o.start(at);
    o.stop(at + dur + 0.05);
  } catch {
    /* ignore */
  }
}

function kick(at: number, vol = 0.22) {
  if (!ctx || !master) return;
  try {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(150, at);
    o.frequency.exponentialRampToValueAtTime(48, at + 0.11);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
    o.connect(g).connect(master);
    o.start(at);
    o.stop(at + 0.2);
  } catch {
    /* ignore */
  }
}

function slap(at: number, vol = 0.1) {
  if (!ctx || !master || !noiseBuf) return;
  try {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.playbackRate.value = 1.4;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 1800;
    f.Q.value = 1.1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.09);
    src.connect(f).connect(g).connect(master);
    src.start(at, Math.random());
    src.stop(at + 0.12);
  } catch {
    /* ignore */
  }
}

// Deterministic 30s arrangement per track (seeded walk, always the catchy bit).
function scheduleTrack(idx: number, startAt: number) {
  const t = TRACKS[idx % TRACKS.length];
  const beat = 60 / t.bpm;
  const loopLen = LOOP_SECONDS;
  // Drone bed: sa + pa across the whole loop.
  drone(startAt, t.root, loopLen);
  drone(startAt, t.root * 1.5, loopLen, 0.022);
  // Keherwa-ish 8-beat: kick 1 & 5, slap 3 & 7, soft slap ghost on 8.
  const beats = Math.floor(loopLen / beat);
  for (let b = 0; b < beats; b++) {
    const at = startAt + b * beat;
    const pos = b % 8;
    if (pos === 0 || pos === 4) kick(at);
    if (pos === 2 || pos === 6) slap(at);
    if (pos === 7) slap(at, 0.05);
  }
  // Pluck melody: seeded pentatonic walk, phrases breathe every 4 beats.
  let seed = 1234 + idx * 777;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  let deg = 2;
  for (let b = 0; b < beats; b += 2) {
    if (b % 8 === 6) continue; // breathe
    deg += Math.floor(rnd() * 5) - 2;
    deg = Math.max(0, Math.min(t.scale.length + 2, deg));
    const oct = deg >= t.scale.length ? 2 : 1;
    const semi = t.scale[deg % t.scale.length];
    const f = t.root * 2 * semisToRatio(semi) * (oct === 2 ? 1 : 1);
    pluck(startAt + b * beat, f, 0.13 + rnd() * 0.06, beat * 2.4);
    if (rnd() > 0.6) pluck(startAt + b * beat + beat, t.root * 2 * semisToRatio(t.scale[(deg + 2) % t.scale.length]), 0.08, beat * 1.6);
  }
}

export function currentTrackName(): string {
  return TRACKS[trackIdx % TRACKS.length].name;
}

export function stopBgm() {
  try {
    if (timer) clearInterval(timer);
    timer = null;
    if (master && ctx) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    }
  } catch {
    /* ignore */
  }
}

export async function ensureBgm() {
  if (typeof window === "undefined" || !bgmEnabled() || timer) return;
  const c = ensureCtx();
  if (!c || !master) return;
  try {
    if (c.state === "suspended") await c.resume().catch(() => undefined);
    if (document.visibilityState === "hidden") return;
    master.gain.cancelScheduledValues(c.currentTime);
    master.gain.setValueAtTime(0.0001, c.currentTime);
    master.gain.linearRampToValueAtTime(1.0, c.currentTime + 2);
    // Loops chained back-to-back, track advances each 30s loop.
    const first = c.currentTime + 0.1;
    scheduleTrack(trackIdx, first);
    let nextAt = first + LOOP_SECONDS;
    timer = setInterval(() => {
      if (!bgmEnabled() || !ctx) return;
      const ahead = nextAt - ctx.currentTime;
      if (ahead < 1.5) {
        trackIdx = (trackIdx + 1) % TRACKS.length;
        scheduleTrack(trackIdx, nextAt);
        nextAt += LOOP_SECONDS;
      }
    }, 500);
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
