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
  adultsCount: integer("adults_count").default(2),
  childrenCount: integer("children_count").default(0),
  infantsCount: integer("infants_count").default(0),

  // ── Hotel Booking: Advanced Occupancy Fields ────────────────────────────
  mealPlan: text("meal_plan"),                       // Selected meal plan code: EP/CP/MAP/AP
  childrenWithBed: integer("children_with_bed").default(0),       // Children with dedicated bed
  childrenWithoutBed: integer("children_without_bed").default(0), // Children without bed (sharing)
  priceBreakdown: jsonb("price_breakdown"),           // Full itemized breakdown for audit/display

  totalAmount: real("total_amount").notNull(),
  pointsUsed: real("points_used").default(0),
  finalPaidAmount: real("final_paid_amount").notNull(),
  
  paymentStatus: text("payment_status").default("PENDING"), // 'PENDING', 'PAID', 'REFUNDED'
  paymentDetails: jsonb("payment_details"),
  
  specialRequests: text("special_requests"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
