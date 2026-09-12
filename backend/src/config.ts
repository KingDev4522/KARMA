import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing required env var ${name} (see .env.example)`);
  return v;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  corsOrigin: (process.env.CORS_ORIGIN ?? "http://localhost:3000").split(",").map((s) => s.trim()),
  databaseUrl: required("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/life_rpg?schema=public"),
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET ?? "",
  devAuthBypass: process.env.DEV_AUTH_BYPASS === "true",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 120),
  mutationRateLimitMax: Number(process.env.MUTATION_RATE_LIMIT_MAX ?? 30),
  isProd: (process.env.NODE_ENV ?? "development") === "production",
};
