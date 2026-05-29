import Redis from "ioredis";
import { logger } from "./logger";

// Create a singleton instance of the Redis client
// If REDIS_URL is not set, we'll try to fallback to a local instance, 
// though for this project it's strictly set in .env
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
});

redisClient.on("connect", () => {
  logger.info("✅ Redis client connected successfully");
});

redisClient.on("error", (error) => {
  logger.error({ error: error.message }, "❌ Redis connection error");
});

export default redisClient;
