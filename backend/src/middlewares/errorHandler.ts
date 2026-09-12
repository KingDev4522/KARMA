import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../shared/errors";
import { config } from "../config";

/** Failure handling — Loading/Empty/Success/Error/Retry contract (LRP-ARCH-001 §12, LRP-FE-001 §18).
 * FE §18: errors must be explicit + recoverable with [Try Again]; never hide a failed
 * transaction behind a successful animation. Every error carries `retryable` so the UI
 * knows whether to offer retry vs fix-input vs re-auth.
 */
function retryableFor(status: number, code: string): boolean {
  if (code === "RATE_LIMITED") return true;
  if (status === 429 || status >= 500) return true;
  if (status === 408) return true;
  // 409 idempotency conflict = already applied → do NOT retry as new write; refetch instead.
  // 400 validation → fix input; 401/403 → re-auth/fix perms; 404 → fix ref.
  return false;
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details ?? null, retryable: retryableFor(err.status, err.code) } });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: { code: "VALIDATION_FAILED", message: "Validation failed", details: err.flatten(), retryable: false } });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: { code: "CONFLICT", message: "Duplicate record — idempotency blocked a double write. Your progress was not changed.", details: { target: (err.meta as { target?: unknown } | undefined)?.target ?? null }, retryable: false } });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Record not found", details: null, retryable: false } });
    }
    return res.status(500).json({ error: { code: "DB_ERROR", message: "Database error. Your progress was not changed.", details: config.isProd ? null : String(err.message), retryable: true } });
  }
  const message = err instanceof Error ? err.message : "Internal error";
  if (!config.isProd) console.error(err);
  return res.status(500).json({ error: { code: "INTERNAL", message: config.isProd ? "Something went wrong. Your progress was not changed." : message, details: null, retryable: true } });
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found", details: null, retryable: false } });
}
