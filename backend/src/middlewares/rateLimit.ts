import rateLimit from "express-rate-limit";
import { config } from "../config";

/** Rate limiting for high-impact mutations (LRP-BE-001 §18). */
export const generalLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
});

export const mutationLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.mutationRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS",
});
