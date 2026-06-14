/**
 * Migration: Hotel Location Slugs & Room Slugs
 * ---------------------------------------------
 * 1. Populates countrySlug, stateSlug, destinationSlug on hotelsTable
 *    from existing destinationId relationships.
 * 2. Generates slug on hotelRoomsTable from room name.
 * 3. Creates the pending_city_requests table (via raw SQL if not exists).
 *
 * Run: npx tsx scripts/migrate-hotel-location-slugs.ts
 */

import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function run() {
  const client = await pool.connect();
  try {
    console.log("🚀 Starting hotel location slug migration...\n");

    // ─────────────────────────────────────────────────────────────
    // Step 1: Add new columns if they don't exist (safe / idempotent)
    // ─────────────────────────────────────────────────────────────
    await client.query(`
      ALTER TABLE hotels
        ADD COLUMN IF NOT EXISTS state_id INTEGER,
        ADD COLUMN IF NOT EXISTS country_id INTEGER,
        ADD COLUMN IF NOT EXISTS destination_slug TEXT,
        ADD COLUMN IF NOT EXISTS state_slug TEXT,
        ADD COLUMN IF NOT EXISTS country_slug TEXT,
        ADD COLUMN IF NOT EXISTS custom_city TEXT;

      ALTER TABLE hotel_rooms
        ADD COLUMN IF NOT EXISTS slug TEXT;

      CREATE TABLE IF NOT EXISTS pending_city_requests (
        id SERIAL PRIMARY KEY,
        vendor_id INTEGER NOT NULL,
        hotel_id INTEGER,
        city_name TEXT NOT NULL,
        state_name TEXT,
        country_name TEXT,
        state_id INTEGER,
        country_id INTEGER,
        status TEXT NOT NULL DEFAULT 'PENDING',
        resolved_by_id INTEGER,
        resolved_destination_id INTEGER,
        resolved_at TIMESTAMP,
        admin_note TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS pending_city_vendor_idx ON pending_city_requests(vendor_id);
      CREATE INDEX IF NOT EXISTS pending_city_status_idx ON pending_city_requests(status);
    `);
    console.log("✅ Columns & table created (idempotent)\n");

    // ─────────────────────────────────────────────────────────────
    // Step 2: Populate hotel location slugs from existing destinationId
    // ─────────────────────────────────────────────────────────────
    const { rows: hotels } = await client.query(`
      SELECT h.id, h.destination_id, h.city,
             d.slug AS dest_slug, d.name AS dest_name, d.state_id AS dest_state_id, d.country_id AS dest_country_id,
             s.slug AS state_slug, s.name AS state_name, s.country_id AS s_country_id,
             c.slug AS country_slug, c.name AS country_name
      FROM hotels h
      LEFT JOIN destinations d ON h.destination_id = d.id
      LEFT JOIN states s ON COALESCE(d.state_id, s.id) = s.id AND (d.state_id = s.id OR h.destination_id IS NULL)
      LEFT JOIN countries c ON COALESCE(d.country_id, s.country_id) = c.id
      ORDER BY h.id
    `);

    // Better query: join properly
    const { rows: hotelsFull } = await client.query(`
      SELECT 
        h.id,
        h.destination_id,
        h.city,
        d.slug AS dest_slug,
        d.state_id AS d_state_id,
        d.country_id AS d_country_id,
        s.id AS s_id,
        s.slug AS s_slug,
        s.country_id AS s_country_id,
        c.id AS c_id,
        c.slug AS c_slug
      FROM hotels h
      LEFT JOIN destinations d ON h.destination_id = d.id
      LEFT JOIN states s ON d.state_id = s.id
      LEFT JOIN countries c ON s.country_id = c.id
      ORDER BY h.id
    `);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const hotel of hotelsFull) {
      const destSlug = hotel.dest_slug || null;
      const stateSlug = hotel.s_slug || null;
      const countrySlug = hotel.c_slug || null;
      const stateId = hotel.d_state_id || null;
      const countryId = hotel.s_country_id || null;

      if (destSlug || stateSlug || countrySlug) {
        await client.query(`
          UPDATE hotels SET
            destination_slug = $1,
            state_slug = $2,
            country_slug = $3,
            state_id = COALESCE(state_id, $4),
            country_id = COALESCE(country_id, $5)
          WHERE id = $6
        `, [destSlug, stateSlug, countrySlug, stateId, countryId, hotel.id]);
        updatedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`✅ Hotels updated: ${updatedCount}, skipped (no destination): ${skippedCount}\n`);

    // ─────────────────────────────────────────────────────────────
    // Step 3: Generate slugs for hotel rooms
    // ─────────────────────────────────────────────────────────────
    const { rows: rooms } = await client.query(`
      SELECT id, name, hotel_id FROM hotel_rooms ORDER BY id
    `);

    // Track slugs per hotel to handle conflicts
    const hotelRoomSlugs: Map<number, Set<string>> = new Map();
    let roomUpdatedCount = 0;

    for (const room of rooms) {
      if (!hotelRoomSlugs.has(room.hotel_id)) {
        hotelRoomSlugs.set(room.hotel_id, new Set());
      }
      const existingSlugs = hotelRoomSlugs.get(room.hotel_id)!;

      let slug = toSlug(room.name);
      if (!slug) slug = `room-${room.id}`;

      // Handle duplicates within same hotel
      let finalSlug = slug;
      let counter = 2;
      while (existingSlugs.has(finalSlug)) {
        finalSlug = `${slug}-${counter}`;
        counter++;
      }
      existingSlugs.add(finalSlug);

      await client.query(`
        UPDATE hotel_rooms SET slug = $1 WHERE id = $2
      `, [finalSlug, room.id]);
      roomUpdatedCount++;
    }

    console.log(`✅ Room slugs generated: ${roomUpdatedCount}\n`);
    console.log("🎉 Migration complete!\n");

    // Print summary
    const { rows: summary } = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM hotels WHERE destination_slug IS NOT NULL)::int AS hotels_with_slugs,
        (SELECT COUNT(*) FROM hotels WHERE destination_slug IS NULL)::int AS hotels_without_slugs,
        (SELECT COUNT(*) FROM hotel_rooms WHERE slug IS NOT NULL)::int AS rooms_with_slugs,
        (SELECT COUNT(*) FROM pending_city_requests)::int AS pending_city_count
    `);
    console.table(summary[0]);

  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
