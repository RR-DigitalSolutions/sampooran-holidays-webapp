/**
 * Migration: Advanced Hotel Booking Engine
 * Adds new pricing columns to hotel_rooms and bookings tables.
 * Safe to run multiple times — skips existing columns.
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const { Client } = pg;

async function migrate() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // ── hotel_rooms: New occupancy & pricing columns ──────────────────────────
    const roomColumns = [
      ['base_adults',                  'INTEGER DEFAULT 2'],
      ['base_children',                'INTEGER DEFAULT 0'],
      ['extra_child_with_bed_price',   'REAL DEFAULT 0'],
      ['extra_child_without_bed_price','REAL DEFAULT 0'],
      ['weekend_price',                'REAL'],             // NULL = same as weekday
      ['weekend_days',                 "TEXT[] DEFAULT ARRAY['Friday','Saturday']"],
      ['meal_plan_options',            "JSONB DEFAULT '[]'::jsonb"],
    ];

    console.log('\n📋 Migrating hotel_rooms...');
    for (const [colName, colType] of roomColumns) {
      try {
        await client.query(`ALTER TABLE hotel_rooms ADD COLUMN ${colName} ${colType}`);
        console.log(`  ✅ Added: ${colName}`);
      } catch (err) {
        if (err.code === '42701') {
          console.log(`  ⏭  Already exists: ${colName}`);
        } else {
          console.error(`  ❌ Error adding ${colName}:`, err.message);
        }
      }
    }

    // ── bookings: New fields for advanced hotel booking data ─────────────────
    const bookingColumns = [
      ['meal_plan',           'TEXT'],
      ['children_with_bed',   'INTEGER DEFAULT 0'],
      ['children_without_bed','INTEGER DEFAULT 0'],
      ['price_breakdown',     "JSONB DEFAULT 'null'::jsonb"],
    ];

    console.log('\n📋 Migrating bookings...');
    for (const [colName, colType] of bookingColumns) {
      try {
        await client.query(`ALTER TABLE bookings ADD COLUMN ${colName} ${colType}`);
        console.log(`  ✅ Added: ${colName}`);
      } catch (err) {
        if (err.code === '42701') {
          console.log(`  ⏭  Already exists: ${colName}`);
        } else {
          console.error(`  ❌ Error adding ${colName}:`, err.message);
        }
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
