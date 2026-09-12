import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../shared/asyncHandler";
import { requireAuth, currentUserId } from "../shared/auth";
import { validateBody } from "../middlewares/validate";
import { getWallet, listStore, purchaseItem } from "../modules/economy/service";
import { equipItem, getInventory, unequipSlot } from "../modules/inventory/service";

export const economyRouter = Router();

economyRouter.get("/wallet", requireAuth, asyncHandler(async (req, res) => { res.json(await getWallet(currentUserId(req))); }));
economyRouter.get("/store", requireAuth, asyncHandler(async (req, res) => { res.json(await listStore(currentUserId(req))); }));
economyRouter.post(
  "/store/purchase",
  requireAuth,
  validateBody(z.object({ itemId: z.string().uuid() })),
  asyncHandler(async (req, res) => { res.status(201).json(await purchaseItem(currentUserId(req), req.body.itemId)); }),
);

economyRouter.get("/inventory", requireAuth, asyncHandler(async (req, res) => { res.json(await getInventory(currentUserId(req))); }));
economyRouter.post(
  "/inventory/equip",
  requireAuth,
  validateBody(z.object({ itemId: z.string().uuid() })),
  asyncHandler(async (req, res) => { res.json(await equipItem(currentUserId(req), req.body.itemId)); }),
);
economyRouter.post(
  "/inventory/unequip",
  requireAuth,
  validateBody(z.object({ slot: z.string().min(1).max(40) })),
  asyncHandler(async (req, res) => { res.json(await unequipSlot(currentUserId(req), req.body.slot)); }),
);
