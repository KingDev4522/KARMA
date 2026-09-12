import { Router } from "express";
import { asyncHandler } from "../shared/asyncHandler";
import { requireAuth, currentUserId } from "../shared/auth";
import { validateBody } from "../middlewares/validate";
import { CreateCampaignSchema, CreateMilestoneSchema, UpdateCampaignSchema, UpdateMilestoneSchema } from "../modules/campaigns/schemas";
import { createCampaign, createMilestone, deleteCampaign, deleteMilestone, getCampaign, listCampaigns, updateCampaign, updateMilestone } from "../modules/campaigns/service";

export const campaignRouter = Router();

campaignRouter.get("/", requireAuth, asyncHandler(async (req, res) => { res.json(await listCampaigns(currentUserId(req))); }));
campaignRouter.post("/", requireAuth, validateBody(CreateCampaignSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await createCampaign(currentUserId(req), req.body));
}));
campaignRouter.get("/:id", requireAuth, asyncHandler(async (req, res) => { res.json(await getCampaign(currentUserId(req), req.params.id)); }));
campaignRouter.patch("/:id", requireAuth, validateBody(UpdateCampaignSchema), asyncHandler(async (req, res) => {
  res.json(await updateCampaign(currentUserId(req), req.params.id, req.body));
}));
campaignRouter.delete("/:id", requireAuth, asyncHandler(async (req, res) => { res.json(await deleteCampaign(currentUserId(req), req.params.id)); }));

campaignRouter.post("/:id/milestones", requireAuth, validateBody(CreateMilestoneSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await createMilestone(currentUserId(req), req.params.id, req.body));
}));
campaignRouter.patch("/milestones/:mid", requireAuth, validateBody(UpdateMilestoneSchema), asyncHandler(async (req, res) => {
  res.json(await updateMilestone(currentUserId(req), req.params.mid, req.body));
}));
campaignRouter.delete("/milestones/:mid", requireAuth, asyncHandler(async (req, res) => {
  res.json(await deleteMilestone(currentUserId(req), req.params.mid));
}));
