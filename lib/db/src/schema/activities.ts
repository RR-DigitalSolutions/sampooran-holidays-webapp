import { pgTable, text, serial, integer, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { destinationsTable } from "./destinations";

// ─── ACTIVITY TYPES ─────────────────────────────────────────────────────────
export const ACTIVITY_TYPES = [
  "adventure",
  "water-sports",
  "cultural",
  "relaxation",
  "shopping",
  "dining",
  "trekking",
  "photography",
  "yoga",
  "wellness",
  "cooking",
  "workshop",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

// ─── ACTIVITIES TABLE ─────────────────────────────────────────────────────────
export const activitiesTable = pgTable(
  "activities",
  {
    id: serial("id").primaryKey(),

    // Location hierarchy
    destinationId: integer("destination_id")
      .notNull()
      .references(() => destinationsTable.id, { onDelete: "cascade" }),

    // Core info
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    type: text("type").notNull().default("adventure"), // ActivityType
    shortDescription: text("short_description"),
    longDescription: text("long_description"),

    // Media — multiple images for gallery
    coverImage: text("cover_image"),
    images: text("images").array().default([]), // gallery images (Cloudinary URLs)

    // Practical info
    timingInfo: text("timing_info"), // e.g. "9 AM – 5 PM, Daily"
    entryFee: text("entry_fee"), // e.g. "₹500 per person"
    duration: text("duration"), // e.g. "2–3 hours"
    bestTimeToVisit: text("best_time_to_visit"),

    // Pricing
    priceMin: integer("price_min"), // minimum cost in base currency
    priceMax: integer("price_max"), // maximum cost in base currency
    currency: text("currency").notNull().default("INR"),

    // Location
    latitude: text("latitude"),
    longitude: text("longitude"),
    address: text("address"),

    // Rich content
    highlights: text("highlights").array().default([]),
    tips: text("tips").array().default([]),
    famousFor: text("famous_for").array().default([]),

    // Flags
    isActive: boolean("is_active").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    displayOrder: integer("display_order").notNull().default(0),

    // SEO
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    metaKeywords: text("meta_keywords"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    activitiesDestIdx: index("activities_dest_idx").on(table.destinationId),
    activitiesTypeIdx: index("activities_type_idx").on(table.type),
    activitiesActiveIdx: index("activities_active_idx").on(table.isActive),
    activitiesFeaturedIdx: index("activities_featured_idx").on(table.isFeatured),
    activitiesDestActiveIdx: index("activities_dest_active_idx").on(
      table.destinationId,
      table.isActive
    ),
    activitiesDestTypeIdx: index("activities_dest_type_idx").on(
      table.destinationId,
      table.type
    ),
  })
);

export const insertActivitySchema = createInsertSchema(activitiesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activitiesTable.$inferSelect;
