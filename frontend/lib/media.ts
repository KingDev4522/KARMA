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

export function isMobileViewport(): boolean {
  try {
    return window.matchMedia("(max-width: 760px)").matches;
  } catch {
    return false;
  }
}
