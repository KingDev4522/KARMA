import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { BadRequestError } from "../shared/errors";

export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Reject client-forged reward fields (LRP-BE-001 §10) on completion routes.
    if (req.path.includes("/complete") && typeof req.body === "object" && req.body !== null) {
      const forged = ["xp", "coins", "rewardXp", "rewardCoins", "attributeXp", "level"].filter((k) => k in (req.body as Record<string, unknown>));
      if (forged.length > 0) {
        return next(new BadRequestError(`Server-authoritative rewards: must not send ${forged.join(", ")}`));
      }
    }
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return next(new BadRequestError("Validation failed", parsed.error.flatten()));
    req.body = parsed.data;
    next();
  };
}
