#!/usr/bin/env node
/**
 * Direct SQL migration to create the travel_guides table.
 * Run: node create-travel-guides-table.mjs
 */

import pg from 'pg';
import * as fs from 'fs';

// Read DATABASE_URL from .env file
const envContent = fs.readFileSync('../../.env', 'utf-8');
const match = envContent.match(/DATABASE_URL=(.+)/);
if (!match) throw new Error('DATABASE_URL not found in .env');
const DATABASE_URL = match[1].trim();

const { Client } = pg;
const client = new Client({ connectionString: DATABASE_URL });

const SQL = `
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
);

CREATE INDEX IF NOT EXISTS travel_guides_slug_idx ON travel_guides(slug);
CREATE INDEX IF NOT EXISTS travel_guides_entity_idx ON travel_guides(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS travel_guides_published_idx ON travel_guides(is_published);
`;

async function run() {
  console.log('Connecting to database...');
  await client.connect();
  console.log('Connected! Running migration...');
  await client.query(SQL);
  console.log('✅ travel_guides table created successfully!');
  await client.end();
}

run().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
