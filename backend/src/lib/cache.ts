import { Request, Response, NextFunction } from "express";
import redisClient from "./redis";
import { logger } from "./logger";

/**
 * Cache middleware generator for Express.
 * @param durationInSeconds How long to keep the response in cache (TTL)
 */
export const cacheMiddleware = (durationInSeconds: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // We only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Use the full URL (including query strings) as the cache key
    const key = `cache:${req.originalUrl || req.url}`;

    try {
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        // Cache Hit
        logger.debug({ key }, "🚀 Redis Cache HIT");
        res.setHeader("X-Cache", "HIT");
        res.setHeader("Content-Type", "application/json");
        return res.send(cachedData);
      }

      // Cache Miss
      logger.debug({ key }, "🐢 Redis Cache MISS");
      res.setHeader("X-Cache", "MISS");

      // Intercept the `res.json` and `res.send` to save the payload to Redis
      const originalSend = res.send.bind(res);
      const originalJson = res.json.bind(res);

      res.send = (body: any): Response => {
        // Save to cache asynchronously, don't block the response
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
