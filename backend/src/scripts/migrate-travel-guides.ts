import { db, travelGuidesTable } from "@workspace/db";
import { sql } from "drizzle-orm";

/**
 * Migration script to create the travel_guides table.
 * Run from the backend: npx tsx src/scripts/migrate-travel-guides.ts
 */
async function migrate() {
  console.log("🔄 Running travel_guides migration...");
  
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS travel_guides (
        id SERIAL PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        entity_type TEXT NOT NULL DEFAULT 'place',
        entity_id INTEGER,
        hero_image_url TEXT,
        hero_video_url TEXT,
        gallery_images TEXT[],
        short_description TEXT,
        full_content TEXT,
        best_time_to_visit TEXT,
        how_to_reach TEXT,
        nearest_airport TEXT,
        nearest_railway TEXT,
        local_language TEXT,
        currency TEXT,
        timezone TEXT,
        highlights TEXT[],
        things_to_do TEXT[],
        top_attractions TEXT[],
        local_cuisine TEXT[],
        activities TEXT[],
        festivals TEXT[],
        famous_for TEXT[],
        packing_list TEXT[],
        travel_tips TEXT[],
        history_and_culture TEXT,
        geography TEXT,
        weather_and_climate TEXT,
        transportation TEXT,
        currency_and_payments TEXT,
        language_and_communication TEXT,
        local_etiquette TEXT,
        health_tips TEXT,
        safety_info TEXT,
        emergency_numbers TEXT,
        shopping TEXT,
        visa_info TEXT,
        faqs JSONB,
        meta_title TEXT,
        meta_description TEXT,
        meta_keywords TEXT,
        canonical_url TEXT,
        og_image_url TEXT,
        is_published BOOLEAN NOT NULL DEFAULT false,
        published_at TIMESTAMP,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`CREATE INDEX IF NOT EXISTS travel_guides_slug_idx ON travel_guides(slug)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS travel_guides_entity_idx ON travel_guides(entity_type, entity_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS travel_guides_published_idx ON travel_guides(is_published)`);

    console.log("✅ travel_guides table and indexes created successfully!");
    
    // Verify it worked by selecting from it
    const rows = await db.select().from(travelGuidesTable).limit(1);
    console.log("✅ Verification: travel_guides table accessible. Rows:", rows.length);
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    throw error;
  }

  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
