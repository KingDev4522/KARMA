"use client";

/**
 * Player photo upload — downscaled in-browser to a small JPEG data-URL and
 * stored directly on the profile (`avatarAssetId`). No storage bucket, no
 * RLS policies, no dashboard steps: it works everywhere and syncs to every
 * device through Postgres like all other identity state.
 */

const MAX_SIDE = 320;
const QUALITY = 0.72;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that image."));
    };
    img.src = url;
  });
}

/**
 * Downscale + store a player photo. Returns the value to save as
 * `avatarAssetId`. Throws human-readable errors.
 */
export async function uploadAvatarPhoto(_userId: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Pick an image file.");
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const w = Math.max(1, Math.round((img.naturalWidth || MAX_SIDE) * scale));
  const h = Math.max(1, Math.round((img.naturalHeight || MAX_SIDE) * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't process that image.");
  ctx.drawImage(img, 0, 0, w, h);
  const url = canvas.toDataURL("image/jpeg", QUALITY);
  if (!url || url.length < 100) throw new Error("Couldn't process that image.");
  if (url.length > 90000) throw new Error("That photo is too detailed — try a smaller one.");
  return url;
}
