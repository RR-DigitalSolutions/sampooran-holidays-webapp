/**
 * Safe additive migration — adds category price override columns to package_calendar_inventory table
 * Run with: node lib/db/migrate_calendar_category_pricing.mjs
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
    console.log("Starting migration: add category price override columns to package_calendar_inventory...");

    await client.query(`
      ALTER TABLE package_calendar_inventory 
      ADD COLUMN IF NOT EXISTS extra_person_price real,
      ADD COLUMN IF NOT EXISTS child_with_bed_price real,
      ADD COLUMN IF NOT EXISTS child_without_bed_price real,
      ADD COLUMN IF NOT EXISTS infant_price real;
    `);
    console.log("✅ extra_person_price, child_with_bed_price, child_without_bed_price, infant_price columns added/verified in package_calendar_inventory");

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
