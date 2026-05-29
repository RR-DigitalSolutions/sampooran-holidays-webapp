import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const inquiriesTable = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  inquiryType: text("inquiry_type").notNull(),
  packageId: integer("package_id"),
  hotelId: integer("hotel_id"),
  roomId: integer("room_id"),
  transportId: integer("transport_id"),
  vendorId: integer("vendor_id"), // Leads can be routed directly to vendors
  destination: text("destination"),
  travelDate: text("travel_date"),
  numberOfPersons: integer("number_of_persons"),
  message: text("message").notNull(),
  budget: real("budget"),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInquirySchema = createInsertSchema(inquiriesTable).omit({ id: true, status: true, createdAt: true });
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Inquiry = typeof inquiriesTable.$inferSelect;
