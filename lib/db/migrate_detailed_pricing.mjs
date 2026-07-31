/**
 * Safe additive migration — adds child_with_bed_price, child_without_bed_price, infant_price to packages table
 * Uses ALTER TABLE ADD COLUMN IF NOT EXISTS (PostgreSQL 9.6+, Neon compatible)
 * Run with: node lib/db/migrate_detailed_pricing.mjs
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
    console.log("Starting migration: add detailed pricing columns to packages...");

    await client.query(`
      ALTER TABLE packages 
      ADD COLUMN IF NOT EXISTS child_with_bed_price real DEFAULT 0,
      ADD COLUMN IF NOT EXISTS child_without_bed_price real DEFAULT 0,
      ADD COLUMN IF NOT EXISTS infant_price real DEFAULT 0;
    `);
    console.log("✅ child_with_bed_price, child_without_bed_price, infant_price columns added/verified");

    console.log("\n🎉 Migration completed successfully!");
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
