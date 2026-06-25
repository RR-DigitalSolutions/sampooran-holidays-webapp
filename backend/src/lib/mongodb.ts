/**
 * lib/mongodb.ts
 *
 * MongoDB connection singleton — production-grade with:
 * - Connection pooling (min 5, max 20 connections)
 * - Automatic reconnect with exponential back-off
 * - Health check endpoint support
 * - Fail-open: if Mongo is down, callers fall back to PostgreSQL
 * - Read preference: secondaryPreferred for maximum read throughput
 *
 * Architecture (Booking.com / MakeMyTrip pattern):
 *   80% of public reads → MongoDB (no JOINs, denormalized, fast)
 *   20% writes + ACID transactions → Neon PostgreSQL
 */

import { MongoClient, Db, Collection, ReadPreference } from "mongodb";
import { logger } from "./logger";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = "sampooran";

// ─── Collection name constants ────────────────────────────────────────────────
export const COLLECTIONS = {
  PACKAGES: "packages",
  DESTINATIONS: "destinations",
  COUNTRIES: "countries",
  STATES: "states",
  THEMES: "themes",
  HOME_CONFIG: "homeConfig",
  HOTELS_PUBLIC: "hotelsPublic",
  TRAVEL_GUIDES: "travelGuides",
  SYNC_LOG: "syncLog",
} as const;

// ─── Singleton state ──────────────────────────────────────────────────────────
let client: MongoClient | null = null;
let db: Db | null = null;
let isConnecting = false;
let connectionAttempts = 0;

/**
 * Returns the MongoDB database instance.
 * Creates and caches the connection on first call.
 * Returns null if MongoDB is unavailable (fail-open pattern).
 */
export async function getMongoDB(): Promise<Db | null> {
  if (db) return db;
  if (!MONGODB_URI) {
    logger.warn("MONGODB_URI not set — MongoDB reads disabled, falling back to PostgreSQL");
    return null;
  }
  if (isConnecting) {
    // Wait briefly for in-progress connection
    await new Promise((r) => setTimeout(r, 100));
    return db;
  }

  isConnecting = true;
  try {
    client = new MongoClient(MONGODB_URI, {
      // Connection pool tuned for a Node.js OTA backend
      minPoolSize: 5,          // Keep 5 connections warm — avoids connection latency on first request
      maxPoolSize: 20,         // Cap at 20 — MongoDB Atlas M0/M10 handles this easily
      maxIdleTimeMS: 60_000,   // Close idle connections after 1 minute
      serverSelectionTimeoutMS: 5_000,  // Fail fast if Atlas is unreachable
      connectTimeoutMS: 10_000,
      socketTimeoutMS: 30_000,

      // Reads go to nearest replica — maximizes throughput for 80% read traffic
      readPreference: ReadPreference.NEAREST,

      // Compression reduces Atlas data transfer costs
      compressors: ["snappy", "zlib"],

      // Retry reads but NOT writes (writes must go through PostgreSQL first)
      retryReads: true,
      retryWrites: false,
    });

    await client.connect();
    db = client.db(DB_NAME);

    // Test connection with a lightweight ping
    await db.command({ ping: 1 });

    connectionAttempts = 0;
    logger.info({ dbName: DB_NAME }, "✅ MongoDB Atlas connected successfully");

    // Register graceful shutdown
    client.on("close", () => {
      logger.warn("MongoDB connection closed");
      db = null;
    });
    client.on("error", (err) => {
      logger.error({ err }, "MongoDB client error");
      db = null;
    });

    return db;
  } catch (err) {
    connectionAttempts++;
    const backoff = Math.min(30_000, 1000 * 2 ** connectionAttempts);
    logger.error({ err, attempt: connectionAttempts, nextRetryMs: backoff }, "MongoDB connection failed — will retry");

    db = null;
    isConnecting = false;

    // Schedule automatic reconnect
    setTimeout(async () => {
      db = null;
      client = null;
      await getMongoDB();
    }, backoff);

    return null;
  } finally {
    isConnecting = false;
  }
}

/**
 * Typed collection accessor.
 * Returns null if MongoDB is unavailable (caller should fall back to PG).
 *
 * @example
 * const col = await getCollection<PackageDoc>(COLLECTIONS.PACKAGES);
 * if (!col) { // fallback to PG }
 */
export async function getCollection<T extends object>(
  name: string
): Promise<Collection<T> | null> {
  const database = await getMongoDB();
  if (!database) return null;
  return database.collection<T>(name);
}

/**
 * Health check — returns connection state for /api/healthz.
 */
export async function mongoHealthCheck(): Promise<{
  connected: boolean;
  latencyMs?: number;
}> {
  if (!db) return { connected: false };
  try {
    const start = Date.now();
    await db.command({ ping: 1 });
    return { connected: true, latencyMs: Date.now() - start };
  } catch {
    return { connected: false };
  }
}

/**
 * Ensure required indexes exist on startup.
 * Indexes are idempotent — safe to run every time.
 */
export async function ensureMongoIndexes(): Promise<void> {
  const database = await getMongoDB();
  if (!database) return;

  try {
    // PACKAGES — most queried collection
    const packages = database.collection(COLLECTIONS.PACKAGES);
    await Promise.all([
      packages.createIndex({ slug: 1 }, { unique: true, background: true }),
      packages.createIndex({ pgId: 1 }, { unique: true, background: true }),
      packages.createIndex({ isFeatured: 1, pricePerPerson: 1 }, { background: true }),
      packages.createIndex({ isTrending: 1, createdAt: -1 }, { background: true }),
      packages.createIndex({ stateName: 1, pricePerPerson: 1 }, { background: true }),
      packages.createIndex({ countryName: 1, pricePerPerson: 1 }, { background: true }),
      packages.createIndex({ destinationName: 1 }, { background: true }),
      packages.createIndex({ category: 1, pricePerPerson: 1 }, { background: true }),
      packages.createIndex({ tags: 1 }, { background: true }),
      // Text index for full-text search within Atlas
      packages.createIndex(
        { name: "text", destinationName: "text", stateName: "text", category: "text", tags: "text" },
        { background: true, name: "packages_text_search" }
      ),
    ]);

    // DESTINATIONS
    const destinations = database.collection(COLLECTIONS.DESTINATIONS);
    await Promise.all([
      destinations.createIndex({ slug: 1 }, { unique: true, background: true }),
      destinations.createIndex({ pgId: 1 }, { unique: true, background: true }),
      destinations.createIndex({ isFeatured: 1 }, { background: true }),
      destinations.createIndex({ stateName: 1 }, { background: true }),
    ]);

    // COUNTRIES & STATES
    await database.collection(COLLECTIONS.COUNTRIES).createIndex({ pgId: 1 }, { unique: true, background: true });
    await database.collection(COLLECTIONS.STATES).createIndex({ pgId: 1 }, { unique: true, background: true });
    await database.collection(COLLECTIONS.STATES).createIndex({ countryId: 1 }, { background: true });

    // HOME CONFIG — single document store, index on _type discriminator
    await database.collection(COLLECTIONS.HOME_CONFIG).createIndex({ _type: 1 }, { unique: true, background: true });

    // HOTELS PUBLIC
    const hotels = database.collection(COLLECTIONS.HOTELS_PUBLIC);
    await Promise.all([
      hotels.createIndex({ slug: 1 }, { unique: true, background: true }),
      hotels.createIndex({ pgId: 1 }, { unique: true, background: true }),
      hotels.createIndex({ destinationId: 1 }, { background: true }),
      hotels.createIndex({ isTrending: 1 }, { background: true }),
    ]);

    logger.info("✅ MongoDB indexes ensured");
  } catch (err) {
    logger.error({ err }, "Failed to create MongoDB indexes — non-fatal");
  }
}

/**
 * Graceful shutdown — close the MongoDB connection pool.
 * Called during process SIGTERM/SIGINT.
 */
export async function closeMongoDB(): Promise<void> {
  if (client) {
    await client.close(true);
    client = null;
    db = null;
    logger.info("MongoDB connection closed gracefully");
  }
}
