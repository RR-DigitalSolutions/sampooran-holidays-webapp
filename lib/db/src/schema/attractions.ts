import { pgTable, text, serial, integer, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { destinationsTable } from "./destinations";

// ─── ATTRACTION TYPES ─────────────────────────────────────────────────────────
export const ATTRACTION_TYPES = [
  "sightseeing",
  "adventure",
  "cultural",
  "religious",
  "nature",
  "beach",
  "museum",
  "wildlife",
  "waterfall",
  "lake",
  "valley",
  "pass",
  "fort",
  "temple",
  "market",
  "viewpoint",
] as const;

export type AttractionType = (typeof ATTRACTION_TYPES)[number];

// ─── ATTRACTIONS TABLE ─────────────────────────────────────────────────────────
export const attractionsTable = pgTable(
  "attractions",
  {
    id: serial("id").primaryKey(),

    // Location hierarchy
    destinationId: integer("destination_id")
      .notNull()
      .references(() => destinationsTable.id, { onDelete: "cascade" }),

    // Core info
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    type: text("type").notNull().default("sightseeing"), // AttractionType
    shortDescription: text("short_description"),
    longDescription: text("long_description"),

    // Media — multiple images for gallery
    coverImage: text("cover_image"),
    images: text("images").array().default([]), // gallery images (Cloudinary URLs)

    // Practical info
    timingInfo: text("timing_info"),       // e.g. "Open 9 AM – 5 PM, Closed Monday"
    entryFee: text("entry_fee"),           // e.g. "₹500 per person, ₹1000 camera"
    duration: text("duration"),            // e.g. "2–3 hours"
    bestTimeToVisit: text("best_time_to_visit"),

    // Location
    latitude: text("latitude"),
    longitude: text("longitude"),
    address: text("address"),

    // Rich content
    highlights: text("highlights").array().default([]),
    tips: text("tips").array().default([]),
    famousFor: text("famous_for").array().default([]),
    activities: text("activities").array().default([]), // activities at this attraction

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
    attractionsDestIdx: index("attractions_dest_idx").on(table.destinationId),
    attractionsTypeIdx: index("attractions_type_idx").on(table.type),
    attractionsActiveIdx: index("attractions_active_idx").on(table.isActive),
    attractionsFeaturedIdx: index("attractions_featured_idx").on(table.isFeatured),
    // Composite: find attractions for a destination quickly
    attractionsDestActiveIdx: index("attractions_dest_active_idx").on(
      table.destinationId,
      table.isActive
    ),
    attractionsDestTypeIdx: index("attractions_dest_type_idx").on(
      table.destinationId,
      table.type
    ),
  })
);

export const insertAttractionSchema = createInsertSchema(attractionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAttraction = z.infer<typeof insertAttractionSchema>;
export type Attraction = typeof attractionsTable.$inferSelect;
