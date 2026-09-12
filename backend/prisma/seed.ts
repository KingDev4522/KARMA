import { PrismaClient } from "@prisma/client";
import { ACTIVITY_TYPES, ATTRIBUTE_DEFS } from "../src/rpg/attributes";

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
const ITEMS: { itemType: never; key: string; name: string; description: string; assetPath: string; price: number; rarity: string }[] = [
  // Frames
  { itemType: "frame" as never, key: "frame_glass", name: "Glass Frame", description: "Clean glass border for your hero.", assetPath: "/frames/glass.svg", price: 40, rarity: "common" },
  { itemType: "frame" as never, key: "frame_neon", name: "Neon Frame", description: "Luminous neon edge.", assetPath: "/frames/neon.svg", price: 120, rarity: "rare" },
  { itemType: "frame" as never, key: "frame_ember", name: "Ember Frame", description: "Warm ember glow.", assetPath: "/frames/ember.svg", price: 150, rarity: "rare" },
  { itemType: "frame" as never, key: "frame_astral", name: "Astral Frame", description: "Starfield glow.", assetPath: "/frames/astral.svg", price: 250, rarity: "epic" },
  // Titles
  { itemType: "title" as never, key: "title_consistent", name: "The Consistent", description: "For showing up daily.", assetPath: "/titles/consistent.svg", price: 60, rarity: "common" },
  { itemType: "title" as never, key: "title_night_builder", name: "Night Builder", description: "For late-night makers.", assetPath: "/titles/night-builder.svg", price: 80, rarity: "common" },
  { itemType: "title" as never, key: "title_code_smith", name: "Code Smith", description: "For builders.", assetPath: "/titles/code-smith.svg", price: 100, rarity: "rare" },
  { itemType: "title" as never, key: "title_early_riser", name: "Early Riser", description: "For dawn starters.", assetPath: "/titles/early-riser.svg", price: 80, rarity: "common" },
  // Nameplates
  { itemType: "nameplate" as never, key: "nameplate_slate", name: "Slate Nameplate", description: "Minimal slate identity plate.", assetPath: "/nameplates/slate.svg", price: 50, rarity: "common" },
  { itemType: "nameplate" as never, key: "nameplate_gilded", name: "Gilded Nameplate", description: "Gold-trimmed plate.", assetPath: "/nameplates/gilded.svg", price: 180, rarity: "epic" },
  // Realms
  { itemType: "realm" as never, key: "realm_dawn", name: "Dawn Realm", description: "Warm dawn dashboard theme.", assetPath: "/realms/dawn.svg", price: 100, rarity: "common" },
  { itemType: "realm" as never, key: "realm_midnight", name: "Midnight Realm", description: "Deep midnight theme.", assetPath: "/realms/midnight.svg", price: 100, rarity: "common" },
  { itemType: "realm" as never, key: "realm_forest", name: "Forest Realm", description: "Calm forest theme.", assetPath: "/realms/forest.svg", price: 120, rarity: "rare" },
  { itemType: "realm" as never, key: "realm_observatory", name: "Observatory Realm", description: "Starry observatory theme.", assetPath: "/realms/observatory.svg", price: 200, rarity: "epic" },
  // Effects (XP bursts + completion FX)
  { itemType: "effect" as never, key: "effect_spark", name: "Spark Burst", description: "Small spark XP effect.", assetPath: "/effects/spark.json", price: 60, rarity: "common" },
  { itemType: "effect" as never, key: "effect_arc", name: "Arc Burst", description: "Arcing XP effect.", assetPath: "/effects/arc.json", price: 90, rarity: "rare" },
  { itemType: "effect" as never, key: "effect_confetti", name: "Confetti FX", description: "Celebratory confetti.", assetPath: "/effects/confetti.json", price: 110, rarity: "rare" },
  { itemType: "effect" as never, key: "effect_pixel", name: "Pixel Burst", description: "Retro pixel burst.", assetPath: "/effects/pixel.json", price: 140, rarity: "epic" },
  // Companion emotes
  { itemType: "companion_emote" as never, key: "emote_clap", name: "Clap", description: "Companion claps.", assetPath: "/companions/emotes/clap.json", price: 30, rarity: "common" },
  { itemType: "companion_emote" as never, key: "emote_celebrate", name: "Celebrate", description: "Companion celebrates.", assetPath: "/companions/emotes/celebrate.json", price: 70, rarity: "rare" },
  { itemType: "companion_emote" as never, key: "emote_focused", name: "Focused", description: "Companion focus pose.", assetPath: "/companions/emotes/focused.json", price: 50, rarity: "common" },
  { itemType: "companion_emote" as never, key: "emote_shocked", name: "Shocked", description: "Companion shocked reaction.", assetPath: "/companions/emotes/shocked.json", price: 60, rarity: "rare" },
  // Quest skins
  { itemType: "quest_skin" as never, key: "skin_obsidian", name: "Obsidian Cards", description: "Dark quest card treatment.", assetPath: "/skins/obsidian.json", price: 90, rarity: "rare" },
  { itemType: "quest_skin" as never, key: "skin_parchment", name: "Parchment Cards", description: "Warm parchment treatment.", assetPath: "/skins/parchment.json", price: 90, rarity: "rare" },
  // Badge cases
  { itemType: "badge_case" as never, key: "case_oak", name: "Oak Case", description: "Wooden badge display.", assetPath: "/cases/oak.svg", price: 70, rarity: "common" },
  { itemType: "badge_case" as never, key: "case_crystal", name: "Crystal Case", description: "Crystal badge display.", assetPath: "/cases/crystal.svg", price: 160, rarity: "epic" },
  // Hero card templates
  { itemType: "hero_card" as never, key: "card_classic", name: "Classic Card", description: "Classic hero card layout.", assetPath: "/hero-cards/classic.svg", price: 80, rarity: "common" },
  { itemType: "hero_card" as never, key: "card_mythic", name: "Mythic Card", description: "Mythic foil hero card.", assetPath: "/hero-cards/mythic.svg", price: 220, rarity: "legendary" },
];

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
      update: { name: i.name, description: i.description, assetPath: i.assetPath, price: i.price, rarity: i.rarity, active: true, itemType: i.itemType as never },
      create: { itemType: i.itemType as never, key: i.key, name: i.name, description: i.description, assetPath: i.assetPath, price: i.price, rarity: i.rarity, active: true },
    });
  }
  console.log(`Seeded ${ATTRIBUTE_DEFS.length} attributes, ${ACTIVITY_TYPES.length} activity types, ${ACHIEVEMENTS.length} achievements, ${ITEMS.length} items.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
