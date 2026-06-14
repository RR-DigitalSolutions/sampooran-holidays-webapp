/**
 * Migration: Add custom_pricing column to hotel_room_inventory table.
 * Safe to run multiple times — skips if the column already exists.
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Handle ES module dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Client } = pg;

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is missing.');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    console.log('📋 Checking hotel_room_inventory columns...');
    try {
      await client.query(`ALTER TABLE hotel_room_inventory ADD COLUMN custom_pricing JSONB`);
      console.log('  ✅ Added: custom_pricing to hotel_room_inventory');
    } catch (err) {
      if (err.code === '42701') {
        console.log('  ⏭  Already exists: custom_pricing');
      } else {
        console.error('  ❌ Error adding custom_pricing:', err.message);
        throw err;
      }
    }

    console.log('\n🎉 Migration completed successfully!\n');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
