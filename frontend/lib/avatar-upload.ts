"use client";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const BUCKET = "avatars";
const MAX_BYTES = 2 * 1024 * 1024;

/**
 * Player photo upload → Supabase Storage (`avatars/<uid>/<ts>.jpg`),
 * returns the public URL to store as `avatarAssetId`.
 * Throws human-readable errors (bucket missing, too big, offline).
 */
export async function uploadAvatarPhoto(userId: string, file: File): Promise<string> {
  if (!isSupabaseConfigured()) throw new Error("Sign-in isn't configured yet.");
  if (!file.type.startsWith("image/")) throw new Error("Pick an image file.");
  if (file.size > MAX_BYTES) throw new Error("Keep it under 2 MB.");
  const supabase = createClient();
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    if (/bucket|not found|row-level|policy/i.test(error.message)) {
      throw new Error("Photo uploads need the avatars bucket (backend/sql/003).");
    }
    throw new Error(error.message);
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("Couldn't read the uploaded photo back.");
  return data.publicUrl;
}
