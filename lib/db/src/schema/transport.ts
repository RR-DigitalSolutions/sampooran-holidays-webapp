import { pgTable, text, serial, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transportServicesTable = pgTable("transport_services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type").notNull(),
  vehicleModel: text("vehicle_model"),
  capacity: integer("capacity").notNull(),
  imageUrl: text("image_url"),
  pricePerKm: real("price_per_km"),
  basePrice: real("base_price"),
  description: text("description"),
  features: text("features").array(),
  isAC: boolean("is_ac").default(true),
  ownerId: integer("owner_id"), // NULL means admin-owned
  status: text("status").notNull().default("APPROVED"), // Admin stuff is auto-approved, vendors are PENDING
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTransportServiceSchema = createInsertSchema(transportServicesTable).omit({ id: true, createdAt: true });
export type InsertTransportService = z.infer<typeof insertTransportServiceSchema>;
export type TransportService = typeof transportServicesTable.$inferSelect;

export const transportRoutesTable = pgTable("transport_routes", {
  id: serial("id").primaryKey(),
  from: text("from_city").notNull(),
  to: text("to_city").notNull(),
  distance: integer("distance").notNull(),
  estimatedTime: text("estimated_time").notNull(),
  startingPrice: real("starting_price").notNull(),
  isPopular: boolean("is_popular").notNull().default(false),
});

export const insertTransportRouteSchema = createInsertSchema(transportRoutesTable).omit({ id: true });
export type InsertTransportRoute = z.infer<typeof insertTransportRouteSchema>;
export type TransportRoute = typeof transportRoutesTable.$inferSelect;
