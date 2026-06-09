import { pgTable, text, serial, integer, boolean, real, timestamp, jsonb, date, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ─────────────────────────────────────────────────────────────────────────────
// HOTELS — Core Property Table (OTA-grade)
// ─────────────────────────────────────────────────────────────────────────────
export const hotelsTable = pgTable("hotels", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(), // Links to usersTable (HOTEL_OWNER)
  destinationId: integer("destination_id"), // Optional: standalone OTA properties don't need a package destination

  // Identity
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type").notNull().default("Hotel"), // 'Hotel','Resort','Cottage','Homestay','Villa','Camp','Hostel','Apartment'
  starRating: integer("star_rating").default(3),
  description: text("description"),

  // Contact & Location
  address: text("address").notNull(),
  city: text("city"),
  pincode: text("pincode"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  proximity: jsonb("proximity").default([]),
  faqs: jsonb("faqs").default([]),

  // Property Specs
  totalRooms: integer("total_rooms").default(0),
  amenities: text("amenities").array(), // e.g., ["WIFI", "POOL", "RESTAURANT"]
  images: text("images").array(),
  minPrice: real("min_price").default(0), // Cached minimum room price for search

  // Booking Configuration
  bookingType: text("booking_type").notNull().default("INSTANT"), // 'INSTANT' | 'REQUEST'
  checkInTime: text("check_in_time").default("14:00"),
  checkOutTime: text("check_out_time").default("12:00"),
  breakfastIncluded: boolean("breakfast_included").default(false),

  // Financial
  vendorCommissionPct: real("vendor_commission_pct").default(15.0),

  // CMS / Admin
  status: text("status").notNull().default("PENDING"), // 'PENDING','APPROVED','REJECTED','DRAFT','SUSPENDED'
  isFeatured: boolean("is_featured").default(false),
  displayOrder: integer("display_order").notNull().default(0),

  // SEO
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// HOTEL ROOMS — Room Types per Property
// ─────────────────────────────────────────────────────────────────────────────
export const hotelRoomsTable = pgTable("hotel_rooms", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id").notNull(),

  // Identity
  name: text("name").notNull(), // e.g. 'Deluxe Room', 'Suite', 'Executive King'
  description: text("description"),

  // Room Specs
  type: text("type").notNull().default("Standard"), // 'Standard','Deluxe','Suite','Executive','Family','Villa'
  bedType: text("bed_type").default("DOUBLE"), // 'SINGLE','DOUBLE','TWIN','KING','QUEEN','BUNK'
  maxOccupancy: integer("max_occupancy").notNull().default(2),
  maxAdults: integer("max_adults").default(2),
  maxChildren: integer("max_children").default(1),
  sizeSqft: integer("size_sqft"),
  floorNumber: integer("floor_number"),

  // Pricing
  basePrice: real("base_price").notNull(),
  extraAdultPrice: real("extra_adult_price").default(0),
  extraChildPrice: real("extra_child_price").default(0),
  taxIncluded: boolean("tax_included").default(false),

  // Meal Plan
  mealPlan: text("meal_plan").default("EP"), // 'EP'=Room Only, 'CP'=Breakfast, 'MAP'=Breakfast+Dinner, 'AP'=All Inclusive

  // Inventory
  totalRooms: integer("total_rooms").notNull().default(1),
  availableRooms: integer("available_rooms").notNull().default(1),

  // Policies
  refundable: boolean("refundable").default(true),
  cancellationHours: integer("cancellation_hours").default(24), // Free cancellation window

  // Media
  amenities: text("amenities").array(),
  images: text("images").array(),

  // Status
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// HOTEL ROOM INVENTORY — Date-level inventory (Channel Manager style)
// ─────────────────────────────────────────────────────────────────────────────
export const hotelRoomInventoryTable = pgTable("hotel_room_inventory", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  hotelId: integer("hotel_id").notNull(), // Denormalized for faster queries

  date: date("date").notNull(), // The specific date (YYYY-MM-DD)
  availableCount: integer("available_count").notNull().default(0),
  priceOverride: real("price_override"), // NULL = use room base_price
  isBlocked: boolean("is_blocked").default(false), // Admin/vendor can block dates

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => {
  return {
    unqRoomDate: unique("unq_room_date").on(t.roomId, t.date)
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// HOTEL POLICIES — Check-in, Cancellation, Pet, Smoking etc.
// ─────────────────────────────────────────────────────────────────────────────
export const hotelPoliciesTable = pgTable("hotel_policies", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id").notNull().unique(),

  checkInTime: text("check_in_time").default("14:00"),
  checkOutTime: text("check_out_time").default("12:00"),
  earlyCheckIn: text("early_check_in"), // Free text: "Available on request"
  lateCheckOut: text("late_check_out"),

  // Cancellation
  cancellationPolicy: text("cancellation_policy").default("FREE"), // 'FREE','PARTIAL','STRICT','NON_REFUNDABLE'
  cancellationDeadlineHours: integer("cancellation_deadline_hours").default(24),
  cancellationPenaltyPct: real("cancellation_penalty_pct").default(0),
  cancellationDetails: text("cancellation_details"),

  // Child & Extra Bed
  childrenAllowed: boolean("children_allowed").default(true),
  childAgeLimit: integer("child_age_limit").default(12),
  extraBedAvailable: boolean("extra_bed_available").default(false),
  extraBedPrice: real("extra_bed_price").default(0),

  // Other policies
  petsAllowed: boolean("pets_allowed").default(false),
  smokingAllowed: boolean("smoking_allowed").default(false),
  unmarriedCouplesAllowed: boolean("unmarried_couples_allowed").default(true),
  alcoholAllowed: boolean("alcohol_allowed").default(true),

  // Payment
  paymentMethods: text("payment_methods").array(), // ['CASH','CARD','UPI','ONLINE']
  payAtHotelAllowed: boolean("pay_at_hotel_allowed").default(true),

  // Additional notes
  houseRules: text("house_rules"),
  importantInfo: text("important_info"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// HOTEL REVIEWS — Customer Reviews with Multi-Dimensional Ratings
// ─────────────────────────────────────────────────────────────────────────────
export const hotelReviewsTable = pgTable("hotel_reviews", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id").notNull(),
  userId: integer("user_id").notNull(),
  bookingId: integer("booking_id"), // Optional: verify via actual booking

  // Ratings (1–5)
  rating: real("rating").notNull(), // Overall
  cleanlinessRating: real("cleanliness_rating"),
  comfortRating: real("comfort_rating"),
  locationRating: real("location_rating"),
  facilitiesRating: real("facilities_rating"),
  serviceRating: real("service_rating"),
  valueRating: real("value_rating"),

  // Content
  title: text("title"),
  body: text("body"),
  travelType: text("travel_type"), // 'SOLO','COUPLE','FAMILY','BUSINESS','FRIENDS'
  stayDate: date("stay_date"),

  // Photos attached to review
  photos: text("photos").array(),

  // Admin moderation
  isVerified: boolean("is_verified").default(false), // Has confirmed booking?
  isPublished: boolean("is_published").default(false), // Admin published?

  // Vendor reply
  vendorReply: text("vendor_reply"),
  vendorRepliedAt: timestamp("vendor_replied_at"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// HOTEL PHOTOS — Structured gallery with category tagging
// ─────────────────────────────────────────────────────────────────────────────
export const hotelPhotosTable = pgTable("hotel_photos", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id").notNull(),
  roomId: integer("room_id"), // Optional: photo belongs to a specific room

  url: text("url").notNull(),
  caption: text("caption"),
  category: text("category").default("EXTERIOR"), // 'EXTERIOR','INTERIOR','ROOM','BATHROOM','DINING','POOL','VIEW','AMENITY','OTHER'

  isPrimary: boolean("is_primary").default(false), // Cover photo
  displayOrder: integer("display_order").default(0),

  createdAt: timestamp("created_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// ZOD SCHEMAS & TYPES
// ─────────────────────────────────────────────────────────────────────────────
export const insertHotelSchema = createInsertSchema(hotelsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHotel = z.infer<typeof insertHotelSchema>;
export type Hotel = typeof hotelsTable.$inferSelect;

export const insertHotelRoomSchema = createInsertSchema(hotelRoomsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHotelRoom = z.infer<typeof insertHotelRoomSchema>;
export type HotelRoom = typeof hotelRoomsTable.$inferSelect;

export type HotelPolicy = typeof hotelPoliciesTable.$inferSelect;
export type HotelReview = typeof hotelReviewsTable.$inferSelect;
export type HotelPhoto = typeof hotelPhotosTable.$inferSelect;
export type HotelRoomInventory = typeof hotelRoomInventoryTable.$inferSelect;
