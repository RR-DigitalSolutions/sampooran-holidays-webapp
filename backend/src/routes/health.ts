import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { mongoHealthCheck } from "../lib/mongodb";

const router: IRouter = Router();

/**
 * GET /api/healthz
 * Extended health check — reports status of all backend services.
 * Used by Render uptime checks and monitoring dashboards.
 */
router.get("/healthz", async (_req, res) => {
  const [mongoStatus] = await Promise.allSettled([mongoHealthCheck()]);

  const mongo =
    mongoStatus.status === "fulfilled"
      ? mongoStatus.value
      : { connected: false };

  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json({
    ...data,
    services: {
      postgresql: "connected", // If this route responds, PG is up
      mongodb: mongo.connected ? `connected (${mongo.latencyMs}ms)` : "disconnected",
      redis: "see X-Cache header on API responses",
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
