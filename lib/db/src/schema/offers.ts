import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const offersTable = pgTable("offers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("ALL"), // 'HOTELS', 'FLIGHTS', 'HOLIDAYS', 'TRAINS', 'CABS', 'BANK'
  imageUrl: text("image_url").notNull(),
  ctaText: text("cta_text").notNull().default("BOOK NOW"),
  ctaLink: text("cta_link").notNull().default("/"),
  termsAndConditions: text("terms_and_conditions"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOfferSchema = createInsertSchema(offersTable).omit({ id: true, createdAt: true });
