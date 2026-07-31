/**
 * Safe additive migration — adds stateIds[] and countryIds[] to packages table
 * Uses ALTER TABLE ADD COLUMN IF NOT EXISTS (PostgreSQL 9.6+, Neon compatible)
 * Also adds GIN indexes for fast array searches.
 * Run with: node lib/db/migrate_multi_geo.mjs
 */
import pg from "pg";
import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../.env") });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Starting migration: add stateIds[], countryIds[] to packages...");

    // 1. Add stateIds column (safe — no-op if exists)
    await client.query(`
      ALTER TABLE packages 
      ADD COLUMN IF NOT EXISTS state_ids integer[] DEFAULT '{}';
    `);
    console.log("✅ state_ids column added/verified");

    // 2. Add countryIds column (safe — no-op if exists)
    await client.query(`
      ALTER TABLE packages 
      ADD COLUMN IF NOT EXISTS country_ids integer[] DEFAULT '{}';
    `);
    console.log("✅ country_ids column added/verified");

    // 3. Add GIN index on stateIds (CONCURRENTLY = non-blocking, safe on live DB)
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS packages_state_ids_gin_idx 
      ON packages USING gin(state_ids);
    `);
    console.log("✅ GIN index on state_ids created/verified");

    // 4. Add GIN index on countryIds
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS packages_country_ids_gin_idx 
      ON packages USING gin(country_ids);
    `);
    console.log("✅ GIN index on country_ids created/verified");

    console.log("\n🎉 Migration completed successfully! All changes are backward-compatible.");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
