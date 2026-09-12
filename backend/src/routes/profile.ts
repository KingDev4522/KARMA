import { Router } from "express";
import { asyncHandler } from "../shared/asyncHandler";
import { requireAuth, currentUserId } from "../shared/auth";
import { getFullProfile, updateIdentity } from "../modules/identity/service";
import { UpdateIdentitySchema } from "../modules/identity/schemas";
import { getProgression } from "../modules/progression/service";
import { validateBody } from "../middlewares/validate";

export const profileRouter = Router();

profileRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await getFullProfile(currentUserId(req)));
  }),
);

profileRouter.patch(
  "/me",
  requireAuth,
  validateBody(UpdateIdentitySchema),
  asyncHandler(async (req, res) => {
    res.json(await updateIdentity(currentUserId(req), req.body));
  }),
);

profileRouter.get(
  "/me/progression",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await getProgression(currentUserId(req)));
  }),
);
