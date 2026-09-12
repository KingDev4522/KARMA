import { Router } from "express";
import { profileRouter } from "./profile";
import { questRouter } from "./quests";
import { campaignRouter } from "./campaigns";
import { focusRouter } from "./focus";
import { economyRouter } from "./economy";
import { metaRouter } from "./meta";

export const apiRouter = Router();

apiRouter.use("/profile", profileRouter);
apiRouter.use("/quests", questRouter);
apiRouter.use("/campaigns", campaignRouter);
apiRouter.use("/focus", focusRouter);
apiRouter.use("/", economyRouter);
apiRouter.use("/", metaRouter);
