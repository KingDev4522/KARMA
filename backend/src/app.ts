import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config";
import { generalLimiter, mutationLimiter } from "./middlewares/rateLimit";
import { errorHandler, notFound } from "./middlewares/errorHandler";
import { apiRouter } from "./routes";

/**
 * Modular monolith server app (LRP-ARCH-001 §3-§4).
 * Browser → Server App (auth → ownership → domain → DB tx) → PostgreSQL.
 */
export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json({ limit: "256kb" }));
  app.use(generalLimiter);
  app.use(mutationLimiter);

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "life-rpg-backend", version: "1.0.0", time: new Date().toISOString() });
  });

  app.use("/api/v1", apiRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
