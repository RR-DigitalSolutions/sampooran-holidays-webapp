import { pgTable, text, serial, integer, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { destinationsTable } from "./destinations";

// ─── DINING TYPES ─────────────────────────────────────────────────────────────
export const DINING_TYPES = [
  "restaurant",
  "cafe",
  "fast_food",
  "dhaba",
  "bakery",
  "street_food",
  "rooftop",
  "fine_dining",
  "buffet",
  "food_court",
] as const;

export type DiningType = (typeof DINING_TYPES)[number];

// ─── DINING POINTS TABLE ───────────────────────────────────────────────────────
export const diningPointsTable = pgTable(
  "dining_points",
  {
    id: serial("id").primaryKey(),

    // Location hierarchy
    destinationId: integer("destination_id")
      .notNull()
      .references(() => destinationsTable.id, { onDelete: "cascade" }),

    // Core info
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    type: text("type").notNull().default("restaurant"), // DiningType
    shortDescription: text("short_description"),
    longDescription: text("long_description"),

    // Media
    coverImage: text("cover_image"),
    images: text("images").array().default([]),

    // Cuisine & food details
    cuisine: text("cuisine").array().default([]),       // e.g. ["Indian", "Chinese", "Continental"]
    specialItems: text("special_items").array().default([]), // must-try dishes

    // Practical info
    address: text("address"),
    timingInfo: text("timing_info"),                   // e.g. "8 AM – 11 PM"
    priceRange: text("price_range"),                   // e.g. "₹150–₹400 per person"
    phone: text("phone"),
    website: text("website"),

    // Package integration flags
    // When true, this dining point appears in the day-wise itinerary "enroute stop" picker
    isEnrouteStop: boolean("is_enroute_stop").notNull().default(false),
    // Tag to categorise when this stop is used: breakfast / lunch / dinner / snack
    suitableFor: text("suitable_for").array().default([]), // ["lunch", "dinner"]

    // Location
    latitude: text("latitude"),
    longitude: text("longitude"),

    // Flags
    isActive: boolean("is_active").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    displayOrder: integer("display_order").notNull().default(0),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    diningDestIdx: index("dining_dest_idx").on(table.destinationId),
    diningTypeIdx: index("dining_type_idx").on(table.type),
    diningActiveIdx: index("dining_active_idx").on(table.isActive),
    diningEnrouteIdx: index("dining_enroute_idx").on(table.isEnrouteStop),
    diningFeaturedIdx: index("dining_featured_idx").on(table.isFeatured),
    // Composite
    diningDestActiveIdx: index("dining_dest_active_idx").on(
      table.destinationId,
      table.isActive
    ),
    diningDestEnrouteIdx: index("dining_dest_enroute_idx").on(
      table.destinationId,
      table.isEnrouteStop
    ),
  })
);

export const insertDiningPointSchema = createInsertSchema(diningPointsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDiningPoint = z.infer<typeof insertDiningPointSchema>;
export type DiningPoint = typeof diningPointsTable.$inferSelect;
