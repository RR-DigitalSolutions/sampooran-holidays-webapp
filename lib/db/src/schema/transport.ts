import {
  pgTable, text, serial, integer, boolean, real, timestamp, jsonb, index, unique
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ─────────────────────────────────────────────────────────────────────────────
// TRANSPORT VENDORS — Business Profile + KYC (OTA-grade)
// One-to-one with usersTable where role = 'TRANSPORTER'
// ─────────────────────────────────────────────────────────────────────────────
export const transportVendorsTable = pgTable("transport_vendors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),        // FK → usersTable (TRANSPORTER)

  // ── Business Identity ──────────────────────────────────────────────────────
  businessName: text("business_name").notNull(),
  businessType: text("business_type").notNull().default("PROPRIETORSHIP"),
  // PROPRIETORSHIP | PARTNERSHIP | PRIVATE_LTD | LLP | INDIVIDUAL

  // ── Contact ──────────────────────────────────────────────────────────────
  phone: text("phone").notNull(),
  alternatePhone: text("alternate_phone"),
  email: text("email").notNull(),
  website: text("website"),

  // ── Registered Address ───────────────────────────────────────────────────
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),

  // ── Legal / KYC ──────────────────────────────────────────────────────────
  gstNumber: text("gst_number"),
  panNumber: text("pan_number"),

  // KYC Document URLs (Cloudinary: sampooran-holidays/transport/kyc/{userId}/*)
  gstCertificateUrl: text("gst_certificate_url"),
  panCardUrl: text("pan_card_url"),
  businessRegistrationUrl: text("business_registration_url"),
  addressProofUrl: text("address_proof_url"),

  // ── Operations ───────────────────────────────────────────────────────────
  operatingSince: integer("operating_since"),   // Year (e.g. 2010)
  operatingCities: text("operating_cities").array(),
  vehicleTypes: text("vehicle_types").array(),
  // CAB | TEMPO_TRAVELLER | BUS | LUXURY | SELF_DRIVE

  // ── Banking (for payouts) ─────────────────────────────────────────────────
  bankAccountName: text("bank_account_name"),
  bankAccountNumber: text("bank_account_number"),
  bankIfscCode: text("bank_ifsc_code"),
  bankName: text("bank_name"),

  // ── Profile ──────────────────────────────────────────────────────────────
  logoUrl: text("logo_url"),
  description: text("description"),

  // ── Admin Control ────────────────────────────────────────────────────────
  status: text("status").notNull().default("PENDING"),
  // PENDING | APPROVED | REJECTED | SUSPENDED
  adminNote: text("admin_note"),
  approvedAt: timestamp("approved_at"),
  commissionPct: real("commission_pct").default(15.0),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// TRANSPORT VEHICLES — Core listing entity (mirrors hotelsTable design)
// URL: /transport/{countrySlug}/{stateSlug}/{citySlug}/{slug}
// ─────────────────────────────────────────────────────────────────────────────
export const transportVehiclesTable = pgTable("transport_vehicles", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull(),     // FK → transportVendorsTable
  ownerId: integer("owner_id").notNull(),        // FK → usersTable (for auth ownership checks)

  // ── GEO Hierarchy (for SEO URLs — same pattern as hotelsTable) ───────────
  destinationId: integer("destination_id"),
  stateId: integer("state_id"),
  countryId: integer("country_id"),
  destinationSlug: text("destination_slug"),     // "manali"
  stateSlug: text("state_slug"),                 // "himachal-pradesh"
  countrySlug: text("country_slug"),             // "india"
  customCity: text("custom_city"),               // fallback when city not in CMS

  // ── Identity ─────────────────────────────────────────────────────────────
  name: text("name").notNull(),
  // e.g. "Toyota Innova Crysta 7-Seater Manali"
  slug: text("slug").notNull().unique(),
  // e.g. "toyota-innova-crysta-manali-abc123"
  type: text("type").notNull(),
  // CAB | TEMPO_TRAVELLER | BUS | LUXURY | SELF_DRIVE
  subType: text("sub_type"),
  // Hatchback | Sedan | SUV | Mini | Volvo | Mercedes | etc.
  description: text("description"),

  // ── Vehicle Specifications ────────────────────────────────────────────────
  make: text("make").notNull(),                  // Toyota, Volvo, Tata, Mercedes
  model: text("model").notNull(),                // Innova Crysta, Volvo B11R
  year: integer("year"),
  color: text("color"),
  registrationNumber: text("registration_number"), // Stored for admin/vendor only
  seatingCapacity: integer("seating_capacity").notNull(),
  luggageCapacity: integer("luggage_capacity"),  // No. of bags
  fuelType: text("fuel_type").default("DIESEL"),
  // PETROL | DIESEL | CNG | ELECTRIC | HYBRID
  transmission: text("transmission").default("MANUAL"),
  // MANUAL | AUTOMATIC

  // ── Amenities ─────────────────────────────────────────────────────────────
  isAC: boolean("is_ac").default(true),
  features: text("features").array(),
  // ["WIFI","CHARGING_PORT","MUSIC","GPS","RECLINER","BLANKET","WATER_BOTTLE"]

  // ── Documents (URLs + expiry dates) — stored as JSONB ────────────────────
  // Structure: { rc: {url, expiry}, insurance: {url, expiry},
  //              fitness: {url, expiry}, permit: {url, expiry}, puc: {url, expiry} }
  documents: jsonb("documents").default({}),

  // ── Vehicle Condition Report (Digital Inspection Checklist) ──────────────
  // Structure: { engine: 4, ac: 5, tyres: 3, brakes: 5, lights: 5,
  //              interior: 4, seats: 5, first_aid: true, fire_extinguisher: true,
  //              gps_installed: true, seat_belts: true, last_checked_by: "...",
  //              notes: "..." }
  conditionReport: jsonb("condition_report").default({}),
  lastInspectionDate: timestamp("last_inspection_date"),

  // ── Images (Cloudinary: sampooran-holidays/transport/vehicles/{vehicleId}/*) 
  images: text("images").array(),

  // ── Pricing Configuration ─────────────────────────────────────────────────
  bookingType: text("booking_type").notNull().default("INSTANT"),
  // INSTANT | REQUEST
  basePricePerKm: real("base_price_per_km"),
  basePricePerDay: real("base_price_per_day"),
  minimumKm: integer("minimum_km").default(0),
  waitingChargePerHour: real("waiting_charge_per_hour"),
  driverAllowancePerDay: real("driver_allowance_per_day"),
  nightChargePercent: real("night_charge_percent").default(0),

  // Cached min price for search listings (same pattern as hotelsTable.minPrice)
  minPrice: real("min_price").default(0),

  // ── Booking Config ───────────────────────────────────────────────────────
  advanceBookingHours: integer("advance_booking_hours").default(24),
  maxPassengers: integer("max_passengers").default(4),

  // ── CMS / Admin ──────────────────────────────────────────────────────────
  status: text("status").notNull().default("PENDING"),
  // PENDING | APPROVED | REJECTED | DRAFT | SUSPENDED
  isFeatured: boolean("is_featured").default(false),
  displayOrder: integer("display_order").notNull().default(0),
  adminNote: text("admin_note"),

  // ── SEO ──────────────────────────────────────────────────────────────────
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// TRANSPORT DRIVERS — Assigned drivers per vehicle
// ─────────────────────────────────────────────────────────────────────────────
export const transportDriversTable = pgTable("transport_drivers", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),   // FK → transportVehiclesTable
  vendorId: integer("vendor_id").notNull(),

  // ── Identity ─────────────────────────────────────────────────────────────
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  alternatePhone: text("alternate_phone"),
  photoUrl: text("photo_url"),
  // Cloudinary: sampooran-holidays/transport/drivers/{driverId}/photo

  // ── License Documents ─────────────────────────────────────────────────────
  licenseNumber: text("license_number").notNull(),
  licenseExpiry: text("license_expiry"),         // ISO date string "2027-08-15"
  licenseUrl: text("license_url"),               // Cloudinary URL

  // ── Professional Details ──────────────────────────────────────────────────
  experienceYears: integer("experience_years"),
  languagesKnown: text("languages_known").array(),
  // ["Hindi","English","Himachali","Punjabi"]

  // ── Ratings & Status ─────────────────────────────────────────────────────
  isAvailable: boolean("is_available").default(true),
  isVerified: boolean("is_verified").default(false),
  rating: real("rating").default(0),
  totalTrips: integer("total_trips").default(0),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// TRANSPORT AVAILABILITY — Date-range blocks per vehicle
// ─────────────────────────────────────────────────────────────────────────────
export const transportAvailabilityTable = pgTable("transport_availability", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  vendorId: integer("vendor_id").notNull(),

  startDate: text("start_date").notNull(),       // ISO: "2024-06-15"
  endDate: text("end_date").notNull(),           // ISO: "2024-06-20"
  status: text("status").notNull().default("BLOCKED"),
  // AVAILABLE | BLOCKED | MAINTENANCE | BOOKED
  reason: text("reason"),

  createdAt: timestamp("created_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// TRANSPORT PRICING RULES — Dynamic pricing per vehicle
// ─────────────────────────────────────────────────────────────────────────────
export const transportPricingRulesTable = pgTable("transport_pricing_rules", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  vendorId: integer("vendor_id").notNull(),

  name: text("name").notNull(),
  // e.g. "One-Way Delhi→Manali", "Peak Season Rate", "Full Day Package"
  ruleType: text("rule_type").notNull(),
  // FIXED_ROUTE | SEASONAL | HOURLY | DAILY | PACKAGE

  // Route-based
  fromCity: text("from_city"),
  toCity: text("to_city"),
  estimatedDistanceKm: integer("estimated_distance_km"),

  // Date-based seasonal pricing
  startDate: text("start_date"),
  endDate: text("end_date"),

  // Pricing
  price: real("price").notNull(),
  priceType: text("price_type").notNull().default("FIXED"),
  // FIXED | PER_KM | PER_DAY | PER_HOUR
  isRoundTrip: boolean("is_round_trip").default(false),
  roundTripPrice: real("round_trip_price"),

  // Inclusions
  includes: text("includes").array(),
  // ["DRIVER_ALLOWANCE","FUEL","TOLLS","PARKING"]
  excludes: text("excludes").array(),

  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// TRANSPORT BOOKINGS — Dedicated booking table (more specific than generic)
// ─────────────────────────────────────────────────────────────────────────────
export const transportBookingsTable = pgTable("transport_bookings", {
  id: serial("id").primaryKey(),
  bookingRef: text("booking_ref").notNull().unique(),
  // Format: TRN-YYYYMMDD-XXXXX (e.g. TRN-20240615-A7K2M)

  userId: integer("user_id").notNull(),
  vehicleId: integer("vehicle_id").notNull(),
  vendorId: integer("vendor_id").notNull(),
  driverId: integer("driver_id"),

  // ── Journey Details ───────────────────────────────────────────────────────
  journeyType: text("journey_type").notNull().default("ONE_WAY"),
  // ONE_WAY | ROUND_TRIP | MULTI_DAY | LOCAL_RENTAL
  pickupDate: text("pickup_date").notNull(),     // "2024-06-15"
  pickupTime: text("pickup_time").notNull(),     // "06:00"
  returnDate: text("return_date"),
  returnTime: text("return_time"),

  pickupAddress: text("pickup_address").notNull(),
  dropAddress: text("drop_address").notNull(),
  pickupLat: real("pickup_lat"),
  pickupLng: real("pickup_lng"),
  dropLat: real("drop_lat"),
  dropLng: real("drop_lng"),

  estimatedDistanceKm: integer("estimated_distance_km"),
  estimatedDuration: text("estimated_duration"),  // "4h 30m"

  // ── Passengers ────────────────────────────────────────────────────────────
  adults: integer("adults").notNull().default(1),
  children: integer("children").default(0),
  luggage: integer("luggage").default(0),

  // ── Pricing Breakdown ─────────────────────────────────────────────────────
  baseAmount: real("base_amount").notNull(),
  extraCharges: jsonb("extra_charges").default({}),
  // { tolls: 200, driver_allowance: 300, waiting: 0, night_charges: 0 }
  discountAmount: real("discount_amount").default(0),
  totalAmount: real("total_amount").notNull(),
  platformFee: real("platform_fee").default(0),
  vendorEarning: real("vendor_earning").default(0),

  // ── Payment ───────────────────────────────────────────────────────────────
  paymentStatus: text("payment_status").default("PENDING"),
  // PENDING | PAID | REFUNDED | PARTIALLY_REFUNDED
  paymentDetails: jsonb("payment_details"),

  // ── Status ────────────────────────────────────────────────────────────────
  status: text("status").notNull().default("PENDING"),
  // PENDING | CONFIRMED | CANCELLED | COMPLETED | NO_SHOW

  // ── Additional Info ───────────────────────────────────────────────────────
  specialRequests: text("special_requests"),
  flightNumber: text("flight_number"),           // For airport pickups
  vendorNote: text("vendor_note"),
  cancelledReason: text("cancelled_reason"),
  ratingGiven: boolean("rating_given").default(false),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// TRANSPORT REVIEWS — Customer ratings per vehicle
// ─────────────────────────────────────────────────────────────────────────────
export const transportReviewsTable = pgTable("transport_reviews", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  vendorId: integer("vendor_id").notNull(),
  bookingId: integer("booking_id"),
  userId: integer("user_id").notNull(),

  // ── Overall Rating ────────────────────────────────────────────────────────
  rating: integer("rating").notNull(),           // 1–5
  title: text("title"),
  comment: text("comment"),

  // ── Sub-ratings ──────────────────────────────────────────────────────────
  driverRating: integer("driver_rating"),
  cleanlinessRating: integer("cleanliness_rating"),
  punctualityRating: integer("punctuality_rating"),
  valueRating: integer("value_rating"),

  // ── Moderation ───────────────────────────────────────────────────────────
  isVerified: boolean("is_verified").default(false),
  adminApproved: boolean("admin_approved").default(true),

  createdAt: timestamp("created_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// TRANSPORT ROUTES — Popular fixed routes (kept + enhanced from original)
// ─────────────────────────────────────────────────────────────────────────────
export const transportRoutesTable = pgTable("transport_routes", {
  id: serial("id").primaryKey(),
  from: text("from_city").notNull(),
  to: text("to_city").notNull(),
  fromSlug: text("from_slug"),
  toSlug: text("to_slug"),
  distance: integer("distance").notNull(),       // km
  estimatedTime: text("estimated_time").notNull(), // "6h 30m"
  startingPrice: real("starting_price").notNull(),
  description: text("description"),
  highlights: text("highlights").array(),
  imageUrl: text("image_url"),
  isPopular: boolean("is_popular").notNull().default(false),
  displayOrder: integer("display_order").default(0),
});

// ─────────────────────────────────────────────────────────────────────────────
// BACKWARD COMPAT — Legacy transport_services table (kept for existing refs)
// New code uses transportVehiclesTable instead
// ─────────────────────────────────────────────────────────────────────────────
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
  ownerId: integer("owner_id"),
  status: text("status").notNull().default("APPROVED"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// ZOD SCHEMAS — For validation
// ─────────────────────────────────────────────────────────────────────────────
export const insertTransportVendorSchema = createInsertSchema(transportVendorsTable)
  .omit({ id: true, createdAt: true, updatedAt: true, approvedAt: true, status: true });
export type InsertTransportVendor = z.infer<typeof insertTransportVendorSchema>;
export type TransportVendor = typeof transportVendorsTable.$inferSelect;

export const insertTransportVehicleSchema = createInsertSchema(transportVehiclesTable)
  .omit({ id: true, createdAt: true, updatedAt: true, status: true, slug: true });
export type InsertTransportVehicle = z.infer<typeof insertTransportVehicleSchema>;
export type TransportVehicle = typeof transportVehiclesTable.$inferSelect;

export const insertTransportDriverSchema = createInsertSchema(transportDriversTable)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTransportDriver = z.infer<typeof insertTransportDriverSchema>;
export type TransportDriver = typeof transportDriversTable.$inferSelect;

export const insertTransportBookingSchema = createInsertSchema(transportBookingsTable)
  .omit({ id: true, createdAt: true, updatedAt: true, bookingRef: true });
export type InsertTransportBooking = z.infer<typeof insertTransportBookingSchema>;
export type TransportBooking = typeof transportBookingsTable.$inferSelect;

export const insertTransportPricingRuleSchema = createInsertSchema(transportPricingRulesTable)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTransportPricingRule = z.infer<typeof insertTransportPricingRuleSchema>;
export type TransportPricingRule = typeof transportPricingRulesTable.$inferSelect;

export const insertTransportReviewSchema = createInsertSchema(transportReviewsTable)
  .omit({ id: true, createdAt: true });
export type InsertTransportReview = z.infer<typeof insertTransportReviewSchema>;
export type TransportReview = typeof transportReviewsTable.$inferSelect;

export const insertTransportRouteSchema = createInsertSchema(transportRoutesTable)
  .omit({ id: true });
export type InsertTransportRoute = z.infer<typeof insertTransportRouteSchema>;
export type TransportRoute = typeof transportRoutesTable.$inferSelect;

// Legacy compat
export const insertTransportServiceSchema = createInsertSchema(transportServicesTable)
  .omit({ id: true, createdAt: true });
export type InsertTransportService = z.infer<typeof insertTransportServiceSchema>;
export type TransportService = typeof transportServicesTable.$inferSelect;
