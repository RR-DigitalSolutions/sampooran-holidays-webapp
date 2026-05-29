import { pgTable, text, serial, integer, boolean, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const hotelsTable = pgTable("hotels", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(), // Links to usersTable (HOTEL_OWNER)
  destinationId: integer("destination_id").notNull(), // Links to destinationsTable
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type").notNull().default("Hotel"), // 'Hotel', 'Resort', 'Homestay', 'Camp'
  starRating: integer("star_rating").default(3),
  description: text("description"),
  address: text("address").notNull(),
  amenities: text("amenities").array(), // e.g., ["WIFI", "POOL", "RESTAURANT"]
  images: text("images").array(),
  status: text("status").notNull().default("PENDING"), // 'PENDING', 'APPROVED', 'REJECTED', 'DRAFT'
  isFeatured: boolean("is_featured").default(false),
  latitude: real("latitude"),
  longitude: real("longitude"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const hotelRoomsTable = pgTable("hotel_rooms", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id").notNull(),
  name: text("name").notNull(), // e.g. 'Deluxe Room', 'Suite'
  type: text("type").notNull(), // 'SC', 'CP', 'MAP', 'AP' (Meal plans)
  basePrice: real("base_price").notNull(),
  maxOccupancy: integer("max_occupancy").notNull().default(2),
  amenities: text("amenities").array(),
  images: text("images").array(),
  totalRooms: integer("total_rooms").notNull().default(1),
  availableRooms: integer("available_rooms").notNull().default(1),
});

export const insertHotelSchema = createInsertSchema(hotelsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHotel = z.infer<typeof insertHotelSchema>;
export type Hotel = typeof hotelsTable.$inferSelect;

export const insertHotelRoomSchema = createInsertSchema(hotelRoomsTable).omit({ id: true });
export type InsertHotelRoom = z.infer<typeof insertHotelRoomSchema>;
export type HotelRoom = typeof hotelRoomsTable.$inferSelect;
