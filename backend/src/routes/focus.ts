import { Router } from "express";
import { asyncHandler } from "../shared/asyncHandler";
import { requireAuth, currentUserId } from "../shared/auth";
import { validateBody } from "../middlewares/validate";
import { FinishFocusSchema, StartFocusSchema } from "../modules/focus/schemas";
import { finishSession, listSessions, pauseSession, resumeSession, startSession } from "../modules/focus/service";

export const focusRouter = Router();

focusRouter.get("/", requireAuth, asyncHandler(async (req, res) => {
  res.json(await listSessions(currentUserId(req), req.query.limit ? Number(req.query.limit) : 20));
}));
focusRouter.post("/start", requireAuth, validateBody(StartFocusSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await startSession(currentUserId(req), req.body));
}));
focusRouter.post("/:id/finish", requireAuth, validateBody(FinishFocusSchema), asyncHandler(async (req, res) => {
  res.json(await finishSession(currentUserId(req), req.params.id, req.body));
}));
// LRP-FE-001 §9: Pause / Resume controls.
focusRouter.post("/:id/pause", requireAuth, asyncHandler(async (req, res) => {
  res.json(await pauseSession(currentUserId(req), req.params.id));
}));
focusRouter.post("/:id/resume", requireAuth, asyncHandler(async (req, res) => {
  res.json(await resumeSession(currentUserId(req), req.params.id));
}));
