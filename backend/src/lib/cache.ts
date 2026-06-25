import { Request, Response, NextFunction } from "express";
import redisClient from "./redis";
import { logger } from "./logger";

/**
 * Cache middleware generator for Express.
 * @param durationInSeconds How long to keep the response in Redis (TTL)
 *
 * Architecture notes (Senior OTA pattern):
 * - The SERVER owns caching policy. Client headers like Cache-Control: no-store
 *   are IGNORED — they are browser hints, not server directives. Honouring them
 *   is what broke Redis: every Next.js ISR fetch sent no-store and bypassed cache.
 * - Only admin-forced purge via clearCachePattern() invalidates the cache.
 * - All responses carry Cache-Control: no-store so browsers never build stale 304
 *   caches from hotel / destination listings (correct for dynamic price data).
 * - Redis fail-open: if Redis is down, the request falls through to the DB.
 */
export const cacheMiddleware = (durationInSeconds: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Tell browsers not to cache (prices/availability change) — but Redis still caches server-side
    res.setHeader("Cache-Control", "no-store, must-revalidate");

    // Use the full URL (including query strings) as the cache key
    const key = `cache:${req.originalUrl || req.url}`;

    try {
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        logger.debug({ key }, "🚀 Redis Cache HIT");
        res.setHeader("X-Cache", "HIT");
        res.setHeader("Content-Type", "application/json");
        return res.send(cachedData);
      }

      logger.debug({ key }, "🐢 Redis Cache MISS");
      res.setHeader("X-Cache", "MISS");

      // Intercept res.json / res.send to save the payload to Redis
      const originalSend = res.send.bind(res);
      const originalJson = res.json.bind(res);

      res.send = (body: any): Response => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient.setex(key, durationInSeconds, typeof body === "string" ? body : JSON.stringify(body)).catch((err) => {
            logger.error({ err, key }, "Failed to save response to Redis cache");
          });
        }
        return originalSend(body);
      };

      res.json = (body: any): Response => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient.setex(key, durationInSeconds, JSON.stringify(body)).catch((err) => {
            logger.error({ err, key }, "Failed to save json to Redis cache");
          });
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      // Redis down → fail-open: serve from DB without caching
      logger.warn({ error, key }, "Redis unavailable — falling through to DB (fail-open)");
      next();
    }
  };
};

/**
 * Utility to invalidate caches based on a prefix pattern.
 * e.g., clearCachePattern("cache:/api/packages*")
 * Called by admin routes after CMS updates.
 */
export const clearCachePattern = async (pattern: string) => {
  try {
    let cursor = "0";
    let count = 0;

    do {
      const result = await redisClient.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = result[0];
      const keys = result[1];

      if (keys.length > 0) {
        await redisClient.del(...keys);
        count += keys.length;
      }
    } while (cursor !== "0");

    logger.info({ pattern, keysDeleted: count }, "🧹 Redis Cache cleared successfully");
  } catch (error) {
    logger.error({ error, pattern }, "Failed to clear Redis cache");
  }
};

/**
 * Warm the most-critical cache keys on server startup.
 * Prevents first-visitor cache misses after a cold deploy.
 *
 * Call this AFTER server.listen() — it runs async and never blocks startup.
 */
export const warmCache = async (baseUrl: string) => {
  const routes = [
    "/api/ota/home/config",
    "/api/ota/home/top-destinations",
    "/api/ota/home/trending-hotels",
    "/api/packages?featured=true&limit=6",
    "/api/packages?trending=true&limit=12",
    "/api/destinations/mega-menu",
    "/api/hotels/mega-menu",
  ];

  logger.info("🔥 Starting cache warm-up for top routes...");

  for (const route of routes) {
    try {
      const key = `cache:${route}`;
      const existing = await redisClient.get(key);
      if (!existing) {
        // Fire-and-forget internal fetch to trigger Redis population
        fetch(`${baseUrl}${route}`).catch(() => {});
      }
    } catch {
      // Non-fatal
    }
  }

  logger.info(`🔥 Cache warm-up triggered for ${routes.length} routes`);
};
