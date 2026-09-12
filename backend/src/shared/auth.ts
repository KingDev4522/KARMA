import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { UnauthorizedError } from "../shared/errors";

export interface AuthContext {
  userId: string;
  email?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

/**
 * Authentication boundary (LRP-ARCH-001 §6, LRP-BE-001 §4/§18).
 * Every private operation executes within authenticated user context.
 * Backend NEVER uses client-supplied userId as proof of ownership.
 *
 * Verifies Supabase Auth JWT (HS256 with SUPABASE_JWT_SECRET).
 * Dev bypass (DEV_AUTH_BYPASS=true) accepts X-Dev-User-Id for local tests only.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    if (config.devAuthBypass) {
      const devId = req.header("X-Dev-User-Id");
      if (devId && devId.trim().length > 0) {
        req.auth = { userId: devId.trim() };
        return next();
      }
      // fall through to JWT check so misconfig surfaces clearly
    }
    const header = req.header("Authorization") ?? "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) throw new UnauthorizedError("Missing Bearer token");
    const token = match[1].trim();
    if (!config.supabaseJwtSecret) throw new UnauthorizedError("Server missing SUPABASE_JWT_SECRET");

    const payload = jwt.verify(token, config.supabaseJwtSecret, { algorithms: ["HS256"] }) as {
      sub?: string;
      email?: string;
    };
    if (!payload.sub) throw new UnauthorizedError("Invalid token: missing sub");
    req.auth = { userId: payload.sub, email: payload.email };
    return next();
  } catch (err) {
    if (err instanceof UnauthorizedError) return next(err);
    return next(new UnauthorizedError("Invalid or expired token"));
  }
}

export function currentUserId(req: Request): string {
  const id = req.auth?.userId;
  if (!id) throw new UnauthorizedError("Not authenticated");
  return id;
}
