import { Request, Response, NextFunction } from "express";
import redisClient from "./redis";
import { logger } from "./logger";

/**
 * Cache middleware generator for Express.
 * @param durationInSeconds How long to keep the response in Redis (TTL)
 *
 * Security & correctness notes:
 * - Honoured: Cache-Control: no-cache / no-store / Pragma: no-cache from client
 *   (e.g. when the browser fetch uses cache:'no-store')
 * - All responses carry Cache-Control: no-store so browsers never build stale
 *   304 caches from hotel / destination listings.
 */
export const cacheMiddleware = (durationInSeconds: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // We only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Always set Cache-Control: no-store so browsers / proxies don't cache
    // listing pages (prevents "no hotels found" caused by stale 304 responses)
    res.setHeader("Cache-Control", "no-store");

    // If the client explicitly asks to bypass cache (fetch cache:'no-store'),
    // skip Redis lookup and go straight to the DB.
    const clientCC = req.headers["cache-control"] || "";
    const pragma   = req.headers["pragma"] || "";
    const bypassCache =
      clientCC.includes("no-store") ||
      clientCC.includes("no-cache") ||
      pragma === "no-cache";

    // Use the full URL (including query strings) as the cache key
    const key = `cache:${req.originalUrl || req.url}`;

    try {
      if (!bypassCache) {
        const cachedData = await redisClient.get(key);

        if (cachedData) {
          // Cache Hit
          logger.debug({ key }, "🚀 Redis Cache HIT");
          res.setHeader("X-Cache", "HIT");
          res.setHeader("Content-Type", "application/json");
          return res.send(cachedData);
        }
      }

      // Cache Miss (or bypass)
      logger.debug({ key, bypassed: bypassCache }, "🐢 Redis Cache MISS");
      res.setHeader("X-Cache", bypassCache ? "BYPASS" : "MISS");

      // Intercept res.json / res.send to save the payload to Redis
      // (only if we're not bypassing)
      if (!bypassCache) {
        const originalSend = res.send.bind(res);
        const originalJson = res.json.bind(res);

        res.send = (body: any): Response => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            redisClient.setex(key, durationInSeconds, body).catch((err) => {
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
      }

      next();
    } catch (error) {
      // If Redis fails, log it and proceed without caching (fail-open)
      logger.error({ error, key }, "Redis Cache Error - falling back to DB");
      next();
    }
  };
};

/**
 * Utility to invalidate caches based on a prefix pattern.
 * e.g., clearCachePattern("cache:/api/packages*")
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
