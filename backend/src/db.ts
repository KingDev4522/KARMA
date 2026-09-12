import { PrismaClient } from "@prisma/client";

/**
 * Single Prisma client (PostgreSQL authoritative store, LRP-ARCH-001 §5).
 * All reward-producing writes must go through domain services inside transactions.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
