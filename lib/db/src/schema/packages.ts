import { pgTable, text, serial, integer, boolean, real, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const packagesTable = pgTable("packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  stateId: integer("state_id"),
  countryId: integer("country_id"),
  destinationId: integer("destination_id"),
  destinationIds: integer("destination_ids").array().default([]),
  imageUrl: text("image_url"),
  thumbnailUrl: text("thumbnail_url"),
  shortDescription: text("short_description"),
  longDescription: text("long_description"),
  duration: integer("duration").notNull(),
  nights: integer("nights").notNull(),
  pricePerPerson: real("price_per_person").notNull(),
  originalPrice: real("original_price"),
  discountPercent: integer("discount_percent").default(0),
  category: text("category").notNull(),
  packageType: text("package_type").notNull().default("both"),
  isFeatured: boolean("is_featured").notNull().default(false),
  isTrending: boolean("is_trending").notNull().default(false),
  rating: real("rating").default(4.5),
  reviewCount: integer("review_count").default(0),
  highlights: text("highlights").array(),
  cities: text("cities").array(),
  tags: text("tags").array(),
  itinerary: jsonb("itinerary"),
  inclusions: text("inclusions").array(),
  exclusions: text("exclusions").array(),
  hotels: jsonb("hotels"),
  tourType: text("tour_type"),
  groupSize: text("group_size"),
  pickupPoint: text("pickup_point"),
  importantNotes: text("important_notes").array(),
  cancellationPolicy: text("cancellation_policy"),
  paymentPolicy: text("payment_policy"),
  faqs: jsonb("faqs"),
  inclusionIcons: text("inclusion_icons").array().default([]),
  galleryImages: text("gallery_images").array().default([]),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  monthsToTravel: text("months_to_travel").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Standard B-Tree Indexes
  packagesIsFeaturedIdx: index("packages_is_featured_idx").on(table.isFeatured),
  packagesIsTrendingIdx: index("packages_is_trending_idx").on(table.isTrending),
  packagesStateIdx: index("packages_state_idx").on(table.stateId),
  packagesCountryIdx: index("packages_country_idx").on(table.countryId),
  packagesDestinationIdx: index("packages_destination_idx").on(table.destinationId),
  packagesCategoryIdx: index("packages_category_idx").on(table.category),
  
  // Composite Indexes (For advanced filtering combinations)
  packagesStateCategoryIdx: index("packages_state_category_idx").on(table.stateId, table.category),
  packagesCountryCategoryIdx: index("packages_country_category_idx").on(table.countryId, table.category),
  
  // GIN Indexes for Array columns (Extremely fast array searching)
  packagesTagsGinIdx: index("packages_tags_gin_idx").using("gin", table.tags),
  packagesCitiesGinIdx: index("packages_cities_gin_idx").using("gin", table.cities),
  packagesDestinationIdsGinIdx: index("packages_destination_ids_gin_idx").using("gin", table.destinationIds),
}));

export const insertPackageSchema = createInsertSchema(packagesTable).omit({ id: true, createdAt: true });
export type InsertPackage = z.infer<typeof insertPackageSchema>;
export type Package = typeof packagesTable.$inferSelect;

// ─── THEMES (SPECIALITY TOURS) ─────────────────────────────────
export const themesTable = pgTable("themes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  imageUrl: text("image_url"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  themesIsActiveIdx: index("themes_is_active_idx").on(table.isActive),
}));

export const insertThemeSchema = createInsertSchema(themesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTheme = z.infer<typeof insertThemeSchema>;
export type Theme = typeof themesTable.$inferSelect;

// ─── PACKAGE THEMES MAPPING ────────────────────────────────────
export const packageThemesTable = pgTable("package_themes", {
  packageId: integer("package_id").notNull().references(() => packagesTable.id, { onDelete: 'cascade' }),
  themeId: integer("theme_id").notNull().references(() => themesTable.id, { onDelete: 'cascade' }),
});
