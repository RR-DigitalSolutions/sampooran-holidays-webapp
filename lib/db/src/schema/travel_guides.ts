import { pgTable, text, serial, integer, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * TRAVEL GUIDES TABLE
 *
 * Completely independent from the destinations/countries/states tables.
 * Destinations = SEO-rich tour package landing pages (managed at /destinations in admin).
 * Travel Guides = Long-form editorial traveller information (managed at /travel-guides in admin).
 *
 * A Travel Guide can optionally reference a destination hierarchy item
 * (country / state / place) via entityType + entityId purely for organizational
 * grouping and display name — the content itself is always independent.
 */
export const travelGuidesTable = pgTable("travel_guides", {
  id: serial("id").primaryKey(),

  // ── Identity ────────────────────────────────────────────────
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),

  // ── Hierarchy link (optional, for organisational grouping only) ──
  // entityType: "country" | "state" | "place"
  entityType: text("entity_type").notNull().default("place"),
  // entityId references the id in countries/states/destinations table
  // This is a soft reference (no FK constraint) to avoid cascade issues
  entityId: integer("entity_id"),

  // ── Hero / Media ────────────────────────────────────────────
  heroImageUrl: text("hero_image_url"),
  heroVideoUrl: text("hero_video_url"),
  galleryImages: text("gallery_images").array(),

  // ── Core Content (editorial) ────────────────────────────────
  shortDescription: text("short_description"),
  // Full rich article content (HTML / markdown)
  fullContent: text("full_content"),

  // ── Essential Travel Information ────────────────────────────
  bestTimeToVisit: text("best_time_to_visit"),
  howToReach: text("how_to_reach"),
  nearestAirport: text("nearest_airport"),
  nearestRailway: text("nearest_railway"),
  localLanguage: text("local_language"),
  currency: text("currency"),
  timezone: text("timezone"),

  // ── Structured Lists ────────────────────────────────────────
  highlights: text("highlights").array(),
  thingsToDo: text("things_to_do").array(),
  topAttractions: text("top_attractions").array(),
  localCuisine: text("local_cuisine").array(),
  activities: text("activities").array(),
  festivals: text("festivals").array(),
  famousFor: text("famous_for").array(),
  packingList: text("packing_list").array(),
  travelTips: text("travel_tips").array(),

  // ── Deep Traveller Knowledge ────────────────────────────────
  historyAndCulture: text("history_and_culture"),
  geography: text("geography"),
  weatherAndClimate: text("weather_and_climate"),
  transportation: text("transportation"),
  currencyAndPayments: text("currency_and_payments"),
  languageAndCommunication: text("language_and_communication"),
  localEtiquette: text("local_etiquette"),
  healthTips: text("health_tips"),
  safetyInfo: text("safety_info"),
  emergencyNumbers: text("emergency_numbers"),
  shopping: text("shopping"),
  visaInfo: text("visa_info"),

  // ── FAQ (AI / AEO) ──────────────────────────────────────────
  // Format: [{ question: string, answer: string }]
  faqs: jsonb("faqs"),

  // ── SEO ─────────────────────────────────────────────────────
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  canonicalUrl: text("canonical_url"),
  ogImageUrl: text("og_image_url"),

  // ── Status ──────────────────────────────────────────────────
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  displayOrder: integer("display_order").notNull().default(0),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  travelGuidesSlugIdx: index("travel_guides_slug_idx").on(table.slug),
  travelGuidesEntityIdx: index("travel_guides_entity_idx").on(table.entityType, table.entityId),
  travelGuidesPublishedIdx: index("travel_guides_published_idx").on(table.isPublished),
}));

export const insertTravelGuideSchema = createInsertSchema(travelGuidesTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertTravelGuide = z.infer<typeof insertTravelGuideSchema>;
export type TravelGuide = typeof travelGuidesTable.$inferSelect;
