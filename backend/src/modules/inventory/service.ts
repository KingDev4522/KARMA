import { prisma } from "../../db";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../shared/errors";
import type { ItemType } from "../../shared/validation";
import { ensureProfile } from "../identity/service";

/** Inventory + Loadout — equipped identity items (LRP-BE-001 §3 user_loadout). */

// user_loadout slots; `nameplate` items share the hero-chrome family and equip to frameItemId.
// `hero_skin` swaps the equipped hero variant (Profile.heroAssetId) and
// `companion` swaps the equipped companion (Profile.companionAssetId) — both
// also recorded in their loadout slots so Store/Collection show equip state.
// Documented here and in docs/API.md so frontend renders nameplate from loadout.frameItemId when item type is nameplate.
const RESOLVED_SLOT: Record<ItemType, "frameItemId" | "titleItemId" | "realmItemId" | "effectItemId" | "companionEmoteItemId" | "questSkinItemId" | "badgeCaseItemId" | "heroCardItemId" | "heroSkinItemId" | "companionItemId"> = {
  frame: "frameItemId",
  title: "titleItemId",
  nameplate: "frameItemId",
  realm: "realmItemId",
  effect: "effectItemId",
  companion_emote: "companionEmoteItemId",
  quest_skin: "questSkinItemId",
  badge_case: "badgeCaseItemId",
  hero_card: "heroCardItemId",
  hero_skin: "heroSkinItemId",
  companion: "companionItemId",
};

export async function getInventory(userId: string) {
  await ensureProfile(userId);
  const [entries, loadout] = await Promise.all([
    prisma.inventory.findMany({ where: { userId }, orderBy: { acquiredAt: "desc" } }),
    prisma.userLoadout.findUnique({ where: { userId } }),
  ]);
  const items = await prisma.item.findMany({ where: { id: { in: entries.map((e) => e.itemId) } } });
  const byId = new Map(items.map((i) => [i.id, i]));
  return { items: entries.map((e) => ({ ...e, item: byId.get(e.itemId) })), loadout };
}

export async function equipItem(userId: string, itemId: string) {
  await ensureProfile(userId);
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) throw new NotFoundError("Item not found");
  const owned = await prisma.inventory.findUnique({ where: { userId_itemId: { userId, itemId } } });
  if (!owned) throw new ForbiddenError("Item not owned — purchase it first");
  const slot = RESOLVED_SLOT[item.itemType as ItemType];
  if (!slot) throw new BadRequestError(`Cannot equip item type ${item.itemType}`);
  // hero_skin / companion items additionally flip the visible identity so the
  // change is immediate everywhere (Today, Realm, Hero Card).
  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  const profilePatch: { heroAssetId?: string; companionAssetId?: string } = {};
  if (item.itemType === "hero_skin" && typeof meta.heroAssetId === "string") {
    profilePatch.heroAssetId = meta.heroAssetId;
  }
  if (item.itemType === "companion" && typeof meta.companionAssetId === "string") {
    profilePatch.companionAssetId = meta.companionAssetId;
  }
  if (Object.keys(profilePatch).length > 0) {
    await prisma.$transaction([
      prisma.userLoadout.upsert({
        where: { userId },
        update: { [slot]: itemId },
        create: { userId, [slot]: itemId },
      }),
      prisma.profile.update({ where: { id: userId }, data: profilePatch }),
    ]);
    return prisma.userLoadout.findUnique({ where: { userId } });
  }
  return prisma.userLoadout.upsert({
    where: { userId },
    update: { [slot]: itemId },
    create: { userId, [slot]: itemId },
  });
}

export async function unequipSlot(userId: string, slot: string) {
  const allowed = new Set(Object.values(RESOLVED_SLOT));
  if (!allowed.has(slot as never)) throw new BadRequestError(`Unknown slot ${slot}`);
  await ensureProfile(userId);
  return prisma.userLoadout.update({ where: { userId }, data: { [slot]: null } });
}
