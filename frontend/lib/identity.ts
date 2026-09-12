"use client";

/**
 * Identity catalog — single source of truth for heroes, skins, companions.
 * PRD: 6 fixed heroes (traditional default free; warrior/modern/holiday sold
 * in Store) + 10 companions (6 common free, 4 premium store-only).
 */

export type HeroVariant = "traditional" | "warrior" | "modern" | "holiday";

export interface HeroDef {
  id: string; // e.g. "meera"
  name: string; // canonical hero name
  region: string;
  line: string;
  file: (v: HeroVariant) => string;
}

export const HEROES: HeroDef[] = [
  { id: "meera", name: "Meera", region: "Central", line: "Warm, steady", file: (v) => `/heroes/meera-${v}.jpeg` },
  { id: "dev", name: "Dev", region: "East", line: "Bold, bright", file: (v) => `/heroes/dev-${v}.jpeg` },
  { id: "zoya", name: "Zoya", region: "North", line: "Sharp, calm", file: (v) => `/heroes/zoya-${v}.jpeg` },
  { id: "tenzing", name: "Tenzing", region: "North-East", line: "Kind, high-altitude grit", file: (v) => `/heroes/tenzing-${v}.jpeg` },
  { id: "arjun", name: "Arjun", region: "North-West", line: "Disciplined archer energy", file: (v) => `/heroes/arjun-${v}.jpeg` },
  { id: "kavya", name: "Kavya", region: "South", line: "Poetic, precise", file: (v) => `/heroes/kavya-${v}.jpeg` },
];

export const HERO_VARIANTS: { id: HeroVariant; label: string; hint: string; price: number }[] = [
  { id: "traditional", label: "Traditional", hint: "Default — free with hero", price: 0 },
  { id: "warrior", label: "Warrior", hint: "Level-up / inferno quests", price: 220 },
  { id: "modern", label: "Modern", hint: "Focus room attire", price: 180 },
  { id: "holiday", label: "Holiday", hint: "Streak & rest-day wear", price: 150 },
];

export interface CompanionDef {
  id: string;
  name: string;
  premium: boolean;
  price: number;
  src: string;
}

export const COMPANIONS: CompanionDef[] = [
  { id: "cat", name: "Cat", premium: false, price: 0, src: "/companions/cat.jpeg" },
  { id: "cow", name: "Cow", premium: false, price: 0, src: "/companions/cow.jpeg" },
  { id: "deer", name: "Deer", premium: false, price: 0, src: "/companions/deer.jpeg" },
  { id: "dog", name: "Dog", premium: false, price: 0, src: "/companions/dog.jpeg" },
  { id: "rabbit", name: "Rabbit", premium: false, price: 0, src: "/companions/rabbit.jpeg" },
  { id: "squirrel", name: "Squirrel", premium: false, price: 0, src: "/companions/squirrel.jpeg" },
  { id: "dragon", name: "Dragon", premium: true, price: 400, src: "/companions/dragon.png" },
  { id: "otter", name: "Otter", premium: true, price: 300, src: "/companions/otter.jpeg" },
  { id: "panda", name: "Panda", premium: true, price: 300, src: "/companions/panda.jpeg" },
  { id: "penguin", name: "Penguin", premium: true, price: 250, src: "/companions/penguin.jpeg" },
];

export const FREE_COMPANIONS = COMPANIONS.filter((c) => !c.premium);
export const PREMIUM_COMPANIONS = COMPANIONS.filter((c) => c.premium);

function norm(s?: string | null): string {
  return (s ?? "").toLowerCase().replace(/[^a-z]/g, "");
}

/** Resolve any legacy/suffixed heroAssetId to { hero, variant }. */
export function resolveHero(assetId?: string | null): { hero: HeroDef; variant: HeroVariant } {
  const fallback = { hero: HEROES[5], variant: "traditional" as HeroVariant };
  if (!assetId) return fallback;
  const n = norm(assetId);
  // Direct "<hero>-<variant>" ids (new canonical form).
  for (const h of HEROES) {
    if (n.startsWith(h.id)) {
      const rest = n.slice(h.id.length);
      const v = (["traditional", "warrior", "modern", "holiday"] as HeroVariant[]).find((x) => rest.includes(x));
      return { hero: h, variant: v ?? "traditional" };
    }
  }
  // Legacy fake ids hero_ember… map deterministically onto the six heroes.
  const legacy = ["hero_ember", "hero_sage", "hero_warden", "hero_scout", "hero_mystic", "hero_forge"];
  const li = legacy.indexOf(assetId);
  if (li >= 0) return { hero: HEROES[li % HEROES.length], variant: "traditional" };
  // Unknown: stable hash to a hero so old profiles never render blank.
  let h = 0;
  for (let k = 0; k < assetId.length; k++) h = (h * 31 + assetId.charCodeAt(k)) >>> 0;
  return { hero: HEROES[h % HEROES.length], variant: "traditional" };
}

/** Canonical heroAssetId to persist: "<hero>-<variant>". */
export function heroAssetId(heroId: string, variant: HeroVariant = "traditional"): string {
  return `${heroId}-${variant}`;
}

/** Resolve any legacy companion id to a catalog entry. */
export function resolveCompanion(assetId?: string | null): CompanionDef {  if (!assetId) return COMPANIONS[0];
  const n = norm(assetId);
  const direct = COMPANIONS.find((c) => n.includes(c.id));
  if (direct) return direct;
  const legacy: Record<string, string> = { compspark: "cat", compmoss: "dog", compember: "rabbit", spark: "cat", moss: "dog", emberling: "rabbit" };
  const mapped = legacy[n];
  if (mapped) return COMPANIONS.find((c) => c.id === mapped) ?? COMPANIONS[0];
  let h = 0;
  for (let k = 0; k < assetId.length; k++) h = (h * 31 + assetId.charCodeAt(k)) >>> 0;
  return FREE_COMPANIONS[h % FREE_COMPANIONS.length];
}

/** Attribute XP → level progress using the same curve family as the backend
 *  (need(level) = floor(100 * level^1.55)); backend is authoritative, this is
 *  display-only so bars never look hard-coded. */
export function attrProgress(level: number, xp: number): number {
  const need = Math.max(1, Math.floor(100 * Math.pow(Math.max(1, level), 1.55)));
  return Math.min(100, Math.max(0, Math.round(((xp % need) / need) * 100)));
}

/* ---------- Profile picture (Personalize) ---------- */

/** Stored avatarAssetId forms: null (follow hero) · "<hero>-<variant>" · "companion:<id>". */
export function avatarAssetIdFor(kind: "hero" | "companion", id: string, variant: HeroVariant = "traditional"): string {
  return kind === "companion" ? `companion:${id}` : heroAssetId(id, variant);
}

export interface ResolvedAvatar {
  kind: "hero" | "companion";
  hero: HeroDef;
  variant: HeroVariant;
  companion: CompanionDef;
}

/** Resolve the profile picture: explicit choice wins, otherwise the hero. */
export function resolveAvatar(avatarAssetId?: string | null, heroAssetIdFallback?: string | null): ResolvedAvatar {
  if (avatarAssetId?.startsWith("companion:")) {
    const c = resolveCompanion(avatarAssetId.slice("companion:".length));
    return { kind: "companion", hero: HEROES[0], variant: "traditional", companion: c };
  }
  if (avatarAssetId) {
    const { hero, variant } = resolveHero(avatarAssetId);
    return { kind: "hero", hero, variant, companion: COMPANIONS[0] };
  }
  const { hero, variant } = resolveHero(heroAssetIdFallback);
  return { kind: "hero", hero, variant, companion: COMPANIONS[0] };
}

/* ---------- Frames & title boxes (real art) ---------- */

export const FRAME_COUNT = 20;
export const TITLE_BOX_COUNT = 11;
export const STARTER_FRAMES = [1, 2, 3, 4];
export const STARTER_TITLE_BOXES = [1, 2, 3, 4];

export function frameSrc(n: number): string {
  return `/frames/frame-${n}.jpeg`;
}

export function titleBoxSrc(n: number): string {
  return `/frames/titlebox-${n}.jpeg`;
}

/** Extract the trailing number from an assetPath like /frames/frame-12.jpeg. */
export function artNumber(src?: string | null): number | null {
  const m = (src ?? "").match(/(\d+)\.jpe?g$/i);
  return m ? Number(m[1]) : null;
}
