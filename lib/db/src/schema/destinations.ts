import { pgTable, text, serial, integer, boolean, real, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ─── REGIONS (CONTINENTS) ──────────────────────────────────────
export const regionsTable = pgTable("regions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  imageUrl: text("image_url"),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  regionsIsActiveIdx: index("regions_is_active_idx").on(table.isActive),
}));

export const insertRegionSchema = createInsertSchema(regionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRegion = z.infer<typeof insertRegionSchema>;
export type Region = typeof regionsTable.$inferSelect;

// ─── COUNTRIES ─────────────────────────────────────────────────
export const countriesTable = pgTable("countries", {
  id: serial("id").primaryKey(),
  regionId: integer("region_id").references(() => regionsTable.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  code: text("code").notNull(),
  imageUrl: text("image_url"),
  thumbnailUrl: text("thumbnail_url"),
  heroVideoUrl: text("hero_video_url"),
  description: text("description"),
  longDescription: text("long_description"),
  capital: text("capital"),
  currency: text("currency"),
  language: text("language"),
  timezone: text("timezone"),
  bestTimeToVisit: text("best_time_to_visit"),
  visaInfo: text("visa_info"),
  highlights: text("highlights").array(),
  howToReach: text("how_to_reach"),
  thingsToDo: text("things_to_do").array(),
  localCuisine: text("local_cuisine").array(),
  famousFor: text("famous_for").array(),
  activities: text("activities").array(),
  festivals: text("festivals").array(),
  safetyInfo: text("safety_info"),
  galleryImages: text("gallery_images").array(),
  localAttractions: text("local_attractions").array(),
  
  // Advanced Traveler Knowledge
  historyAndCulture: text("history_and_culture"),
  geography: text("geography"),
  weatherAndClimate: text("weather_and_climate"),
  transportation: text("transportation"),
  currencyAndPayments: text("currency_and_payments"),
  languageAndCommunication: text("language_and_communication"),
  localEtiquette: text("local_etiquette"),
  healthTips: text("health_tips"),
  emergencyNumbers: text("emergency_numbers"),
  packingList: text("packing_list"),
  shopping: text("shopping"),

  // SEO fields
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  canonicalUrl: text("canonical_url"),
  ogImageUrl: text("og_image_url"),
  // AEO/AI fields
  faqs: jsonb("faqs"),           // [{question, answer}]
  travelTips: text("travel_tips").array(),
  packageCount: integer("package_count").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Standard Indexes
  countriesIsFeaturedIdx: index("countries_is_featured_idx").on(table.isFeatured),
  countriesIsActiveIdx: index("countries_is_active_idx").on(table.isActive),
  countriesRegionIdx: index("countries_region_idx").on(table.regionId),
  // Composite Indexes
  countriesRegionActiveIdx: index("countries_region_active_idx").on(table.regionId, table.isActive),
}));

export const insertCountrySchema = createInsertSchema(countriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCountry = z.infer<typeof insertCountrySchema>;
export type Country = typeof countriesTable.$inferSelect;

// ─── STATES ────────────────────────────────────────────────────
export const statesTable = pgTable("states", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  countryId: integer("country_id").notNull(),
  imageUrl: text("image_url"),
  thumbnailUrl: text("thumbnail_url"),
  heroVideoUrl: text("hero_video_url"),
  description: text("description"),
  longDescription: text("long_description"),
  capital: text("capital"),
  region: text("region"),
  bestTimeToVisit: text("best_time_to_visit"),
  highlights: text("highlights").array(),
  thingsToDo: text("things_to_do").array(),
  localCuisine: text("local_cuisine").array(),
  howToReach: text("how_to_reach"),
  famousFor: text("famous_for").array(),
  activities: text("activities").array(),
  festivals: text("festivals").array(),
  safetyInfo: text("safety_info"),
  galleryImages: text("gallery_images").array(),
  localAttractions: text("local_attractions").array(),

  // Advanced Traveler Knowledge
  historyAndCulture: text("history_and_culture"),
  geography: text("geography"),
  weatherAndClimate: text("weather_and_climate"),
  transportation: text("transportation"),
  currencyAndPayments: text("currency_and_payments"),
  languageAndCommunication: text("language_and_communication"),
  localEtiquette: text("local_etiquette"),
  healthTips: text("health_tips"),
  emergencyNumbers: text("emergency_numbers"),
  packingList: text("packing_list"),
  shopping: text("shopping"),

  // SEO fields
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  canonicalUrl: text("canonical_url"),
  ogImageUrl: text("og_image_url"),
  // AEO/AI fields
  faqs: jsonb("faqs"),
  travelTips: text("travel_tips").array(),
  packageCount: integer("package_count").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Standard Indexes
  statesIsFeaturedIdx: index("states_is_featured_idx").on(table.isFeatured),
  statesIsActiveIdx: index("states_is_active_idx").on(table.isActive),
  statesCountryIdx: index("states_country_idx").on(table.countryId),
  // Composite Indexes
  statesCountryActiveIdx: index("states_country_active_idx").on(table.countryId, table.isActive),
}));

export const insertStateSchema = createInsertSchema(statesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertState = z.infer<typeof insertStateSchema>;
export type State = typeof statesTable.$inferSelect;

// ─── DESTINATIONS (CITIES / PLACES) ────────────────────────────
export const destinationsTable = pgTable("destinations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  stateId: integer("state_id"),
  countryId: integer("country_id"),
  imageUrl: text("image_url"),
  thumbnailUrl: text("thumbnail_url"),
  heroVideoUrl: text("hero_video_url"),
  description: text("description"),
  longDescription: text("long_description"),
  isFeatured: boolean("is_featured").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  showInMenu: boolean("show_in_menu").notNull().default(false),
  packageCount: integer("package_count").notNull().default(0),
  bestTimeToVisit: text("best_time_to_visit"),
  altitude: text("altitude"),
  temperature: text("temperature"),
  distanceFromCapital: text("distance_from_capital"),
  nearestAirport: text("nearest_airport"),
  nearestRailway: text("nearest_railway"),
  highlights: text("highlights").array(),
  thingsToDo: text("things_to_do").array(),
  howToReach: text("how_to_reach"),
  localAttractions: text("local_attractions").array(),
  localCuisine: text("local_cuisine").array(),
  accommodation: text("accommodation").array(),
  travelTips: text("travel_tips").array(),
  // Rich content for AI/AEO
  famousFor: text("famous_for").array(),
  activities: text("activities").array(),
  festivals: text("festivals").array(),
  safetyInfo: text("safety_info"),
  faqs: jsonb("faqs"),           // [{question, answer}]
  // Photo gallery
  galleryImages: text("gallery_images").array(),
  // SEO fields
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  canonicalUrl: text("canonical_url"),
  ogImageUrl: text("og_image_url"),
  // Schema.org structured data
  schemaType: text("schema_type").default("TouristDestination"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Standard Indexes
  destinationsIsFeaturedIdx: index("destinations_is_featured_idx").on(table.isFeatured),
  destinationsIsActiveIdx: index("destinations_is_active_idx").on(table.isActive),
  destinationsStateIdx: index("destinations_state_idx").on(table.stateId),
  destinationsCountryIdx: index("destinations_country_idx").on(table.countryId),
  // Composite Indexes
  destinationsStateActiveIdx: index("destinations_state_active_idx").on(table.stateId, table.isActive),
  destinationsCountryActiveIdx: index("destinations_country_active_idx").on(table.countryId, table.isActive),
}));

export const insertDestinationSchema = createInsertSchema(destinationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDestination = z.infer<typeof insertDestinationSchema>;
export type Destination = typeof destinationsTable.$inferSelect;

