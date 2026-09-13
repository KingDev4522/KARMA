"use client";

/**
 * Media manifest — single source of truth mapping code to shipped art.
 * Desktop vs mobile is chosen by viewport (matchMedia ≤760px), exactly
 * matching how each file was composed. SVG scenery stays as the offline
 * fallback when a JPG is missing.
 */

export const SCENERY_FILES = [
  { id: "dawn", desktop: "/scenery/scenery-1-dawn.jpg", mobile: "/scenery/scenery-1-dawn-mobile.jpg" },
  { id: "thar", desktop: "/scenery/scenery-2-thar.jpg", mobile: "/scenery/scenery-2-thar-mobile.jpg" },
  { id: "monsoon", desktop: "/scenery/scenery-3-monsoon.jpg", mobile: "/scenery/scenery-3-monsoon-mobile.jpg" },
  { id: "dusk", desktop: "/scenery/scenery-4-dusk.jpg", mobile: "/scenery/scenery-4-dusk-mobile.jpg" },
  { id: "night", desktop: "/scenery/scenery-5-night.jpg", mobile: "/scenery/scenery-5-night-mobile.jpg" },
  { id: "backwater", desktop: "/scenery/scenery-6-backwater.jpg", mobile: "/scenery/scenery-6-backwater-mobile.jpg" },
];

export const SPLASH_FILES = {
  desktop: "/splash/splash-desktop.jpg",
  mobile: "/splash/splash-mobile.jpg",
  loopWebmDesktop: "/splash/splash-loop-desktop.webm",
  loopMp4Desktop: "/splash/splash-loop-desktop.mp4",
  loopWebmMobile: "/splash/splash-loop-mobile.webm",
  loopMp4Mobile: "/splash/splash-loop-mobile.mp4",
};

export const TRACK_FILES = [
  { name: "Dhoop", src: "/audio/bgm-dhoop.mp3" },
  { name: "Rain Raga", src: "/audio/bgm-rain.mp3" },
  { name: "Marigold", src: "/audio/bgm-marigold.mp3" },
  { name: "Night Vigil", src: "/audio/bgm-night.mp3" },
  { name: "Riverbank", src: "/audio/bgm-riverbank.mp3" },
  { name: "Sandalwood", src: "/audio/bgm-sandalwood.mp3" },
];

export interface ClassicalFocusTrack {
  id: string;
  name: string;
  movement: string;
  instrument: string;
  src: string;
  fallbackSrc: string;
}

export const FOCUS_CLASSICAL_TRACKS: ClassicalFocusTrack[] = [
  {
    id: "solo-piano-1",
    name: "Nocturne in C Minor",
    movement: "Solo Piano · Take 1",
    instrument: "Piano",
    src: "/audio/focus/solo-piano-1.wav",
    fallbackSrc: "/audio/focus/Focus%20Classical%20I_%20Solo%20Piano%20(Take%201).wav",
  },
  {
    id: "solo-piano-2",
    name: "Clair de Lune Reverie",
    movement: "Solo Piano · Take 2",
    instrument: "Piano",
    src: "/audio/focus/solo-piano-2.wav",
    fallbackSrc: "/audio/focus/Focus%20Classical%20I_%20Solo%20Piano%20(Take%202).wav",
  },
  {
    id: "solo-cello-1",
    name: "Cello Suite No. 1: Prélude",
    movement: "Solo Cello · Take 1",
    instrument: "Cello",
    src: "/audio/focus/solo-cello-1.wav",
    fallbackSrc: "/audio/focus/Focus%20Classical%20II_%20Solo%20Cello%20(Take%201).wav",
  },
  {
    id: "solo-cello-2",
    name: "Élégie for Deep Thought",
    movement: "Solo Cello · Take 2",
    instrument: "Cello",
    src: "/audio/focus/solo-cello-2.wav",
    fallbackSrc: "/audio/focus/Focus%20Classical%20II_%20Solo%20Cello%20(Take%202).wav",
  },
  {
    id: "classical-trumpet-1",
    name: "Heroic Fanfare in D Major",
    movement: "Classical Trumpet · Take 1",
    instrument: "Trumpet",
    src: "/audio/focus/classical-trumpet-1.wav",
    fallbackSrc: "/audio/focus/Focus%20Classical%20III_%20Classical%20Trumpet%20(Take%201).wav",
  },
  {
    id: "classical-trumpet-2",
    name: "Aria for Quiet Dawn",
    movement: "Classical Trumpet · Take 2",
    instrument: "Trumpet",
    src: "/audio/focus/classical-trumpet-2.wav",
    fallbackSrc: "/audio/focus/Focus%20Classical%20III_%20Classical%20Trumpet%20(Take%202).wav",
  },
  {
    id: "lofi-beats-1",
    name: "Midnight Coffee Chillhop",
    movement: "Lo-Fi Beats · Take 1",
    instrument: "Lo-Fi",
    src: "/audio/focus/lofi-beats-1.wav",
    fallbackSrc: "/audio/focus/Focus%20IV_%20Lo-Fi%20Beats%20(Take%201).wav",
  },
  {
    id: "lofi-beats-2",
    name: "Velvet Study Groove",
    movement: "Lo-Fi Beats · Take 2",
    instrument: "Lo-Fi",
    src: "/audio/focus/lofi-beats-2.wav",
    fallbackSrc: "/audio/focus/Focus%20IV_%20Lo-Fi%20Beats%20(Take%202).wav",
  },
  {
    id: "sax-orchestral-2",
    name: "Symphonic Noir & Saxophone",
    movement: "Sax & Orchestral · Take 2",
    instrument: "Saxophone",
    src: "/audio/focus/sax-orchestral-2.wav",
    fallbackSrc: "/audio/focus/Focus%20Classical%20V_%20Sax%20%26%20Orchestral%20(Take%202).wav",
  },
  {
    id: "italian-cinematic",
    name: "Cinema Paradiso Nocturne",
    movement: "Dramatic Italian Cinematic Cover",
    instrument: "Orchestral Strings",
    src: "/audio/focus/italian-cinematic.wav",
    fallbackSrc: "/audio/focus/Dramatic%20Italian%20Cinematic%20Cover.wav",
  },
];

export function isMobileViewport(): boolean {
  try {
    return window.matchMedia("(max-width: 760px)").matches;
  } catch {
    return false;
  }
}

