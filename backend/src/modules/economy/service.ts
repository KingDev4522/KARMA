import { prisma } from "../../db";
import { BadRequestError, ConflictError, NotFoundError } from "../../shared/errors";
import { ensureProfile, grantStarterKit } from "../identity/service";

/** Economy + Store (LRP-BE-001 §17, MASTER PRD §12, PRD v2 §17-§19). Coins spendable, XP permanent. */

export async function getWallet(userId: string) {
  await ensureProfile(userId);
  const prog = await prisma.profileProgression.findUniqueOrThrow({ where: { profileId: userId } });
  const ledger = await prisma.rewardLedger.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 });
  return { coins: prog.coins, lifetimeXp: prog.lifetimeXp, recentLedger: ledger };
}

export async function listStore(userId: string) {
  await ensureProfile(userId);
  await grantStarterKit(userId);
  const [items, owned, loadout, prog] = await Promise.all([
    prisma.item.findMany({ where: { active: true }, orderBy: [{ itemType: "asc" }, { price: "asc" }] }),
    prisma.inventory.findMany({ where: { userId } }),
    prisma.userLoadout.findUnique({ where: { userId } }),
    prisma.profileProgression.findUnique({ where: { profileId: userId } }),
  ]);
  const ownedSet = new Set(owned.map((o) => o.itemId));
  const equippedSet = new Set(
    Object.values((loadout ?? {}) as Record<string, string | null>).filter((v): v is string => typeof v === "string"),
  );
  const coins = prog?.coins ?? 0;
  // LRP-FE-001 §13: Name, Preview(assetPath), Description, Price, Rarity, Owned/Locked/Equipped.
  return {
    coins,
    items: items.map((i) => {
      const isOwned = ownedSet.has(i.id);
      const isEquipped = equippedSet.has(i.id);
      return {
        ...i,
        preview: i.assetPath,
        owned: isOwned,
        equipped: isEquipped,
        status: isEquipped ? ("equipped" as const) : isOwned ? ("owned" as const) : coins >= i.price ? ("available" as const) : ("locked" as const),
      };
    }),
  };
}

/** Transactional purchase: Auth → Verify Item → Balance → Ownership → Deduct → Ledger → Inventory → Commit.
 * Returns updated loadout state so FE can immediately transition to equip (LRP-FE-001 §13/§15). */
export async function purchaseItem(userId: string, itemId: string) {
  await ensureProfile(userId);
  return prisma.$transaction(async (tx) => {
    const item = await tx.item.findUnique({ where: { id: itemId } });
    if (!item || !item.active) throw new NotFoundError("Item not found or unavailable");
    const prog = await tx.profileProgression.findUniqueOrThrow({ where: { profileId: userId } });
    if (prog.coins < item.price) throw new BadRequestError(`Insufficient coins: need ${item.price}, have ${prog.coins}`);
    const already = await tx.inventory.findUnique({ where: { userId_itemId: { userId, itemId } } });
    if (already) throw new ConflictError("Item already owned");

    await tx.profileProgression.update({ where: { profileId: userId }, data: { coins: prog.coins - item.price } });
    await tx.rewardLedger.create({
      data: { userId, sourceType: "purchase", sourceId: item.id, currencyType: "coins", amount: -item.price, metadata: { key: item.key } },
    });
    const entry = await tx.inventory.create({ data: { userId, itemId, source: "purchase" } });
    const loadout = await tx.userLoadout.findUnique({ where: { userId } });
    return { entry, item: { ...item, preview: item.assetPath, owned: true, equipped: false, status: "owned" as const }, balance: prog.coins - item.price, loadout };
  });
}
