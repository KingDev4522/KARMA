import { PrismaClient } from "@prisma/client";
import { ACTIVITY_TYPES, ATTRIBUTE_DEFS } from "../src/rpg/attributes";
import { STARTER_ITEM_KEYS } from "../src/shared/starterKit";

const prisma = new PrismaClient();

const ACHIEVEMENTS = [
  { key: "first_quest", name: "First Blood", description: "Complete your first quest.", iconPath: "/badges/first-blood.svg", ruleKey: "first_quest", rewardCoins: 10 },
  { key: "streak_5", name: "Five Alive", description: "Complete quests five days in a row.", iconPath: "/badges/streak-5.svg", ruleKey: "streak_5", rewardCoins: 25 },
  { key: "deep_focus_3", name: "Deep Diver", description: "Complete three 60+ minute focus quests.", iconPath: "/badges/deep-diver.svg", ruleKey: "deep_focus_3", rewardCoins: 30 },
  { key: "first_milestone", name: "Campaigner", description: "Complete your first long-term milestone.", iconPath: "/badges/campaigner.svg", ruleKey: "first_milestone", rewardCoins: 50 },
  { key: "micro_20", name: "Tiny Steps", description: "Complete 20 micro quests.", iconPath: "/badges/tiny-steps.svg", ruleKey: "micro_20", rewardCoins: 15 },
  { key: "polymath", name: "Polymath", description: "Improve five different attributes.", iconPath: "/badges/polymath.svg", ruleKey: "polymath", rewardCoins: 40 },
  { key: "comeback", name: "Comeback", description: "Return after 7+ days and complete a quest.", iconPath: "/badges/comeback.svg", ruleKey: "comeback_7d", rewardCoins: 20 },
  { key: "craft_50", name: "Builder", description: "Complete 50 Craft-focused quests.", iconPath: "/badges/builder.svg", ruleKey: "craft_50", rewardCoins: 60 },
  { key: "streak_7", name: "Weekforged", description: "Reach a 7-day streak.", iconPath: "/badges/streak-7.svg", ruleKey: "streak_7", rewardCoins: 35 },
  { key: "level_5", name: "Rising Hero", description: "Reach level 5.", iconPath: "/badges/level-5.svg", ruleKey: "level_5", rewardCoins: 25 },
];

// MVP store: product-wide identity (PRD v2 §19, BLUEPRINT §17). No clothing dependency.
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
const ITEMS: { itemType: never; key: string; name: string; description: string; assetPath: string; price: number; rarity: string; metadata?: Record<string, string> }[] = [
  // NOTE: retired placeholder items (old SVG/JSON art) are NOT listed here —
  // RETIRED_KEYS below deactivates them so the Store only sells working art.
  // Hero skins — non-default variants (traditional is free with the hero).
  // metadata.heroAssetId is applied to Profile.heroAssetId on equip.
  ...(["meera", "dev", "zoya", "tenzing", "arjun", "kavya"] as const).flatMap((hero) => [
    { itemType: "hero_skin" as never, key: `skin_${hero}_warrior`, name: `${cap(hero)} · Warrior`, description: "Warrior variant — level-up and inferno quests.", assetPath: `/heroes/${hero}-warrior.jpeg`, price: 220, rarity: "epic", metadata: { heroAssetId: `${hero}-warrior` } },
    { itemType: "hero_skin" as never, key: `skin_${hero}_modern`, name: `${cap(hero)} · Modern`, description: "Modern variant — focus room attire.", assetPath: `/heroes/${hero}-modern.jpeg`, price: 180, rarity: "rare", metadata: { heroAssetId: `${hero}-modern` } },
    { itemType: "hero_skin" as never, key: `skin_${hero}_holiday`, name: `${cap(hero)} · Holiday`, description: "Holiday variant — streak and rest-day wear.", assetPath: `/heroes/${hero}-holiday.jpeg`, price: 150, rarity: "rare", metadata: { heroAssetId: `${hero}-holiday` } },
  ]),
  // Premium companions — the 6 common ones are free at onboarding; these 4 are store-only.
  // metadata.companionAssetId is applied to Profile.companionAssetId on equip.
  { itemType: "companion" as never, key: "companion_dragon", name: "Dragon Companion", description: "Rare skyfire drake. Premium companion.", assetPath: "/companions/dragon.png", price: 400, rarity: "legendary", metadata: { companionAssetId: "dragon" } },
  { itemType: "companion" as never, key: "companion_otter", name: "Otter Companion", description: "Playful river otter. Premium companion.", assetPath: "/companions/otter.jpeg", price: 300, rarity: "epic", metadata: { companionAssetId: "otter" } },
  { itemType: "companion" as never, key: "companion_panda", name: "Panda Companion", description: "Gentle bamboo panda. Premium companion.", assetPath: "/companions/panda.jpeg", price: 300, rarity: "epic", metadata: { companionAssetId: "panda" } },
  { itemType: "companion" as never, key: "companion_penguin", name: "Penguin Companion", description: "Dapper ice penguin. Premium companion.", assetPath: "/companions/penguin.jpeg", price: 250, rarity: "rare", metadata: { companionAssetId: "penguin" } },
  // Real frames (assessts/title frame → public/frames). Frames 1–4 are the free
  // starter set granted to every hero; 5–20 are earned in the Store.
  ...([1, 2, 3, 4] as const).map((n) => (
    { itemType: "frame" as never, key: `frame_no_${n}`, name: `Frame ${n}`, description: "Starter frame — yours from day one.", assetPath: `/frames/frame-${n}.jpeg`, price: 0, rarity: "common" }
  )),
  ...([5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] as const).map((n) => (
    { itemType: "frame" as never, key: `frame_no_${n}`, name: `Frame ${n}`, description: "Hand-drawn temple frame for your portrait.", assetPath: `/frames/frame-${n}.jpeg`, price: n <= 10 ? 100 : n <= 16 ? 200 : 300, rarity: n <= 10 ? "rare" : n <= 16 ? "epic" : "legendary" }
  )),
  // Real title boxes (assessts/tilte box → public/frames). Boxes 1–4 are free;
  // 5–11 are earned. Your hero name is rendered inside the equipped box.
  ...([1, 2, 3, 4] as const).map((n) => (
    { itemType: "title" as never, key: `title_box_${n}`, name: `Title Box ${n}`, description: "Starter title plate — your name, framed.", assetPath: `/frames/titlebox-${n}.jpeg`, price: 0, rarity: "common" }
  )),
  ...([5, 6, 7, 8, 9, 10, 11] as const).map((n) => (
    { itemType: "title" as never, key: `title_box_${n}`, name: `Title Box ${n}`, description: "Ornate title plate for your name.", assetPath: `/frames/titlebox-${n}.jpeg`, price: n <= 7 ? 100 : 150, rarity: n <= 7 ? "rare" : "epic" }
  )),
];

// Retired display-only items: placeholder SVG/JSON art with no real asset and no
// visible in-app application. Deactivated so the Store only sells what works;
// existing owners keep their inventory rows untouched.
const RETIRED_KEYS = [
  "frame_glass", "frame_neon", "frame_ember", "frame_astral",
  "title_consistent", "title_night_builder", "title_code_smith", "title_early_riser",
  "nameplate_slate", "nameplate_gilded",
  "realm_dawn", "realm_midnight", "realm_forest", "realm_observatory",
  "effect_spark", "effect_arc", "effect_confetti", "effect_pixel",
  "emote_clap", "emote_celebrate", "emote_focused", "emote_shocked",
  "skin_obsidian", "skin_parchment",
  "case_oak", "case_crystal",
  "card_classic", "card_mythic",
  "frame_temple_01", "frame_temple_02", "frame_temple_03",
  "title_box_gold", "title_box_crimson",
];

/** Starter kit: 4 frames + 4 title boxes, free forever. (Keys live in shared/starterKit.) */
export { STARTER_ITEM_KEYS };

async function main() {
  for (const a of ATTRIBUTE_DEFS) {
    await prisma.attribute.upsert({ where: { key: a.key }, update: { name: a.name, description: a.description }, create: { key: a.key, name: a.name, description: a.description } });
  }
  for (const t of ACTIVITY_TYPES) {
    await prisma.activityType.upsert({
      where: { key: t.key },
      update: { name: t.name, description: t.description, primaryAttribute: t.primary, secondaryAttribute: t.secondary, primaryRatio: t.primaryRatio, secondaryRatio: t.secondaryRatio, active: true },
      create: { key: t.key, name: t.name, description: t.description, primaryAttribute: t.primary, secondaryAttribute: t.secondary, primaryRatio: t.primaryRatio, secondaryRatio: t.secondaryRatio, active: true },
    });
  }
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({ where: { key: a.key }, update: { name: a.name, description: a.description, iconPath: a.iconPath, ruleKey: a.ruleKey, rewardCoins: a.rewardCoins }, create: a });
  }
  for (const i of ITEMS) {
    await prisma.item.upsert({
      where: { key: i.key },
      update: { name: i.name, description: i.description, assetPath: i.assetPath, price: i.price, rarity: i.rarity, active: true, itemType: i.itemType as never, metadata: i.metadata ?? {} },
      create: { itemType: i.itemType as never, key: i.key, name: i.name, description: i.description, assetPath: i.assetPath, price: i.price, rarity: i.rarity, active: true, metadata: i.metadata ?? {} },
    });
  }
  // Retire dead placeholder cards (owners keep inventory; store hides them).
  for (const key of RETIRED_KEYS) {
    await prisma.item.updateMany({ where: { key }, data: { active: false } });
  }
  console.log(`Seeded ${ATTRIBUTE_DEFS.length} attributes, ${ACTIVITY_TYPES.length} activity types, ${ACHIEVEMENTS.length} achievements, ${ITEMS.length} items.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
