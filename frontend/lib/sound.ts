"use client";

/**
 * Tiny WebAudio soundboard — coin flights, level-ups, purchases, badges.
 * No assets, no dependencies. Respects the mute toggle (Settings) and never
 * throws (silent on unsupported browsers). UI preference lives in
 * localStorage; all game state stays server-side.
 */

const KEY = "lrp-sound";

export function soundEnabled(): boolean {
  try {
    return window.localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundEnabled(on: boolean) {
  try {
    window.localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* ignore */
  }
}

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  try {
    if (!soundEnabled()) return null;
    if (typeof window === "undefined") return null;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = ctx ?? new AC();
    if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
    return ctx;
  } catch {
    return null;
  }
}

function blip(freq: number, at: number, dur = 0.12, type: OscillatorType = "sine", gain = 0.08) {
  const c = ac();
  if (!c) return;
  try {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, c.currentTime + at);
    g.gain.exponentialRampToValueAtTime(gain, c.currentTime + at + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + dur);
    o.connect(g).connect(c.destination);
    o.start(c.currentTime + at);
    o.stop(c.currentTime + at + dur + 0.02);
  } catch {
    /* decorative only */
  }
}

/** Quest complete — bright coin flip. */
export function playCoin() {
  blip(880, 0, 0.1);
  blip(1318, 0.07, 0.14);
}

/** Level up — rising triad. */
export function playLevelUp() {
  blip(523, 0, 0.12, "triangle");
  blip(659, 0.1, 0.12, "triangle");
  blip(784, 0.2, 0.2, "triangle");
}

/** Store purchase — warm cha-ching. */
export function playPurchase() {
  blip(659, 0, 0.1, "sine");
  blip(988, 0.08, 0.16, "sine");
}

/** Badge earned — little fanfare. */
export function playBadge() {
  blip(784, 0, 0.1, "triangle");
  blip(988, 0.09, 0.1, "triangle");
  blip(1175, 0.18, 0.22, "triangle");
}

/** Quest created — soft confirm. */
export function playCreate() {
  blip(587, 0, 0.09, "sine", 0.05);
}
