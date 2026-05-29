import Redis from "ioredis";
import { logger } from "./logger";

// Create a singleton instance of the Redis client
// If REDIS_URL is not set, we'll try to fallback to a local instance, 
// though for this project it's strictly set in .env
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redisOptions: any = {
  // Upstash recommends null for maxRetriesPerRequest to avoid dropping commands during serverless cold starts
  maxRetriesPerRequest: null,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err: Error) {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
};

// Automatically inject TLS config if using a secure rediss:// connection (Upstash)
if (redisUrl.startsWith("rediss://")) {
  redisOptions.tls = { rejectUnauthorized: false };
}

const redisClient = new Redis(redisUrl, redisOptions);

redisClient.on("connect", () => {
  logger.info("✅ Redis client connected successfully");
});

redisClient.on("error", (error) => {
  logger.error({ error: error.message }, "❌ Redis connection error");
});

export default redisClient;
