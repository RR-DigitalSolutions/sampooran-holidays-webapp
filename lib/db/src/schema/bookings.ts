import { pgTable, text, serial, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  vendorId: integer("vendor_id"), // The specific Vendor/Owner of the asset
  bookingType: text("booking_type").notNull().default("PACKAGE"), // 'PACKAGE', 'HOTEL', 'TRANSPORT'
  
  packageId: integer("package_id"), // Optional now
  hotelId: integer("hotel_id"),
  roomId: integer("room_id"),
  transportId: integer("transport_id"),
  
  status: text("status").notNull().default("PENDING"), // 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'
  
  travelDate: timestamp("travel_date").notNull(),
  travelersCount: integer("travelers_count").notNull().default(1),
  
  totalAmount: real("total_amount").notNull(),
  pointsUsed: real("points_used").default(0),
  finalPaidAmount: real("final_paid_amount").notNull(),
  
  paymentStatus: text("payment_status").default("PENDING"), // 'PENDING', 'PAID', 'REFUNDED'
  paymentDetails: jsonb("payment_details"),
  
  specialRequests: text("special_requests"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
