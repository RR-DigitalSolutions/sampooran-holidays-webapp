import { Router, Request, Response } from "express";
import {
  db, transportVehiclesTable, transportVendorsTable, transportRoutesTable,
  transportPricingRulesTable, transportReviewsTable, transportAvailabilityTable,
  transportDriversTable, usersTable, destinationsTable, statesTable, countriesTable, regionsTable,
} from "@workspace/db";
import { eq, and, desc, asc, sql, ilike, or, inArray } from "drizzle-orm";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";
import { logger } from "../lib/logger";
import { cacheMiddleware } from "../lib/cache";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Search / List Vehicles
// GET /api/transport?type=CAB&city=manali&state=himachal-pradesh&country=india
// GET /api/transport?q=innova&minPrice=2000&maxPrice=10000
// ─────────────────────────────────────────────────────────────────────────────
router.get("/transport", cacheMiddleware(30), async (req: Request, res: Response) => {
  try {
    const {
      type, city, state, country, q,
      minPrice, maxPrice, isAC, passengers,
      sort = "recommended",
      limit = "20", offset = "0",
    } = req.query;

    const conditions: any[] = [sql`tv.status = 'APPROVED'`];

    if (country) conditions.push(sql`tv.country_slug = ${country}`);
    if (state && state !== "all") conditions.push(sql`tv.state_slug = ${state}`);
    if (city) conditions.push(sql`tv.destination_slug = ${city}`);
    if (type) conditions.push(sql`UPPER(tv.type) = UPPER(${type as string})`);
    if (isAC === "true") conditions.push(sql`tv.is_ac = true`);
    if (passengers) conditions.push(sql`tv.seating_capacity >= ${Number(passengers)}`);
    if (minPrice) conditions.push(sql`tv.min_price >= ${Number(minPrice)}`);
    if (maxPrice) conditions.push(sql`tv.min_price <= ${Number(maxPrice)}`);
    if (q) {
      const term = `%${(q as string).toLowerCase()}%`;
      conditions.push(sql`(LOWER(tv.name) LIKE ${term} OR LOWER(tv.make) LIKE ${term} OR LOWER(tv.model) LIKE ${term})`);
    }

    const whereClause = conditions.reduce((acc, c) => sql`${acc} AND ${c}`);

    let orderClause: any = sql`tv.display_order ASC, tv.is_featured DESC`;
    if (sort === "price_asc") orderClause = sql`tv.min_price ASC`;
    if (sort === "price_desc") orderClause = sql`tv.min_price DESC`;
    if (sort === "rating") orderClause = sql`tv.is_featured DESC`;

    const vehicles = await db.execute(sql`
      SELECT
        tv.id, tv.slug, tv.name, tv.type, tv.sub_type, tv.destination_id,
        tv.make, tv.model, tv.year, tv.seating_capacity, tv.luggage_capacity,
        tv.is_ac, tv.features, tv.images,
        tv.booking_type, tv.min_price, tv.base_price_per_km, tv.base_price_per_day,
        tv.minimum_km, tv.is_featured,
        tv.destination_slug, tv.state_slug, tv.country_slug,
        tv.advance_booking_hours, tv.max_passengers,
        u.name AS vendor_name,
        u.vendor_business_name,
        tv_v.logo_url AS vendor_logo,
        tv_v.description AS vendor_description,
        COALESCE(r.avg_rating, 0) AS avg_rating,
        COALESCE(r.review_count, 0) AS review_count,
        COALESCE(d.name, tv.custom_city) AS city_name
      FROM transport_vehicles tv
      LEFT JOIN transport_vendors tv_v ON tv.vendor_id = tv_v.id
      LEFT JOIN users u ON tv.owner_id = u.id
      LEFT JOIN (
        SELECT vehicle_id, ROUND(AVG(rating)::numeric, 1) AS avg_rating, COUNT(*) AS review_count
        FROM transport_reviews WHERE admin_approved = true
        GROUP BY vehicle_id
      ) r ON r.vehicle_id = tv.id
      LEFT JOIN destinations d ON tv.destination_id = d.id
      WHERE ${whereClause}
      ORDER BY ${orderClause}
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `);

    const countResult = await db.execute(sql`
      SELECT COUNT(*) AS total FROM transport_vehicles tv WHERE ${whereClause}
    `) as any;
    const total = countResult.rows?.[0]?.total || 0;

    const formatted = (vehicles.rows || []).map((v: any) => ({
      ...v,
      imageUrl: v.images?.[0] || v.image_url || null,
      capacity: v.seating_capacity || v.capacity || 0,
    }));

    res.json({
      vehicles: formatted,
      services: formatted,
      total: Number(total),
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Transport search error");
    res.status(500).json({ error: "Failed to search transport" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Get vehicle by slug
// GET /api/transport/:slug
// NOTE: Specific sub-routes (/routes, /types, /mega-menu, /my-bookings) are declared
//       BEFORE this handler in the file — Express respects registration order.
//       This guard also prevents keyword slugs from hitting the DB unnecessarily.
// ─────────────────────────────────────────────────────────────────────────────
const TRANSPORT_KEYWORD_SLUGS = new Set(["routes", "types", "mega-menu", "my-bookings", "book"]);
// NOTE: The /transport/:slug route was moved to the bottom of the file to prevent Express routing conflicts with static routes like mega-menu, routes, types, and my-bookings.


// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Popular Routes
// GET /api/transport/routes/popular
// ─────────────────────────────────────────────────────────────────────────────
router.get("/transport/routes/popular", cacheMiddleware(300), async (_req: Request, res: Response) => {
  try {
    const routes = await db
      .select()
      .from(transportRoutesTable)
      .orderBy(asc((transportRoutesTable as any).displayOrder || transportRoutesTable.id))
      .limit(20);
    res.json(routes);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch routes" });
  }
});

// GET /api/transport/routes — Public/Admin fetch all intercity transfer routes
router.get("/transport/routes", cacheMiddleware(60), async (_req: Request, res: Response) => {
  try {
    const routesList = await db
      .select()
      .from(transportRoutesTable)
      .orderBy(asc(transportRoutesTable.displayOrder || transportRoutesTable.id));
    res.json({ routes: routesList });
  } catch (error: any) {
    logger.error({ error: error.message }, "Get routes error");
    res.status(500).json({ error: "Failed to fetch all routes" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Available vehicle types for a location
// GET /api/transport/types?city=manali
// ─────────────────────────────────────────────────────────────────────────────
router.get("/transport/types", cacheMiddleware(120), async (req: Request, res: Response) => {
  try {
    const { city, state, country } = req.query;
    const conditions: any[] = [sql`status = 'APPROVED'`];
    if (country) conditions.push(sql`country_slug = ${country}`);
    if (state) conditions.push(sql`state_slug = ${state}`);
    if (city) conditions.push(sql`destination_slug = ${city}`);
    const where = conditions.reduce((a, c) => sql`${a} AND ${c}`);

    const types = await db.execute(sql`
      SELECT type, sub_type, COUNT(*) AS count, MIN(min_price) AS starting_from
      FROM transport_vehicles
      WHERE ${where}
      GROUP BY type, sub_type
      ORDER BY count DESC
    `);
    res.json(types.rows);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch types" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Check availability for a vehicle on a date range
// GET /api/transport/:id/availability?startDate=2024-06-15&endDate=2024-06-20
// ─────────────────────────────────────────────────────────────────────────────
router.get("/transport/:id/availability", async (req: Request, res: Response) => {
  try {
    const vehicleId = Number(req.params.id);
    const { startDate, endDate } = req.query;

    const conditions: any[] = [eq(transportAvailabilityTable.vehicleId, vehicleId)];
    if (startDate) {
      conditions.push(sql`end_date >= ${startDate as string}`);
    }
    if (endDate) {
      conditions.push(sql`start_date <= ${endDate as string}`);
    }

    const blocks = await db
      .select()
      .from(transportAvailabilityTable)
      .where(and(...conditions));

    res.json({ vehicleId, blockedRanges: blocks });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to check availability" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATED: Book a transport vehicle
// POST /api/transport/:id/book
// ─────────────────────────────────────────────────────────────────────────────
router.post("/transport/:vehicleId/book", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const vehicleId = Number(req.params.vehicleId);

    // Fetch vehicle + vendor
    const [vehicle] = await db
      .select()
      .from(transportVehiclesTable)
      .where(and(eq(transportVehiclesTable.id, vehicleId), eq(transportVehiclesTable.status, "APPROVED")))
      .limit(1);

    if (!vehicle) return res.status(404).json({ error: "Vehicle not found or unavailable" });

    const {
      journeyType = "ONE_WAY",
      pickupDate, pickupTime,
      returnDate, returnTime,
      pickupAddress, dropAddress,
      pickupLat, pickupLng, dropLat, dropLng,
      estimatedDistanceKm,
      adults = 1, children = 0, luggage = 0,
      baseAmount, extraCharges = {}, discountAmount = 0,
      totalAmount, specialRequests, flightNumber,
    } = req.body;

    if (!pickupDate || !pickupTime || !pickupAddress || !dropAddress || !totalAmount) {
      return res.status(400).json({ error: "Missing required booking fields" });
    }

    // Generate booking reference
    const bookingRef = `TRN-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${Math.random().toString(36).toUpperCase().slice(2, 7)}`;

    const commissionPct = 15;
    const platformFee = Math.round((totalAmount * commissionPct) / 100);
    const vendorEarning = totalAmount - platformFee;

    const bookingResult = await db.execute(sql`
      INSERT INTO transport_bookings (
        booking_ref, user_id, vehicle_id, vendor_id,
        journey_type, pickup_date, pickup_time, return_date, return_time,
        pickup_address, drop_address,
        pickup_lat, pickup_lng, drop_lat, drop_lng,
        estimated_distance_km, adults, children, luggage,
        base_amount, extra_charges, discount_amount, total_amount,
        platform_fee, vendor_earning,
        special_requests, flight_number, status, payment_status
      ) VALUES (
        ${bookingRef}, ${userId}, ${vehicleId}, ${vehicle.vendorId},
        ${journeyType}, ${pickupDate}, ${pickupTime}, ${returnDate || null}, ${returnTime || null},
        ${pickupAddress}, ${dropAddress},
        ${pickupLat || null}, ${pickupLng || null}, ${dropLat || null}, ${dropLng || null},
        ${estimatedDistanceKm || null}, ${adults}, ${children}, ${luggage},
        ${baseAmount}, ${JSON.stringify(extraCharges)}, ${discountAmount}, ${totalAmount},
        ${platformFee}, ${vendorEarning},
        ${specialRequests || null}, ${flightNumber || null},
        ${vehicle.bookingType === "INSTANT" ? "CONFIRMED" : "PENDING"}, 'PENDING'
      ) RETURNING *
    `);

    res.status(201).json({
      booking: bookingResult.rows[0],
      message: vehicle.bookingType === "INSTANT"
        ? "Booking confirmed! Driver details will be shared shortly."
        : "Booking request sent! Vendor will confirm within 2 hours.",
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Transport booking error");
    res.status(500).json({ error: "Booking failed", details: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATED: Get user's transport bookings
// GET /api/transport/my-bookings
// ─────────────────────────────────────────────────────────────────────────────
router.get("/transport/my-bookings", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const bookings = await db.execute(sql`
      SELECT
        tb.*,
        tv.name AS vehicle_name, tv.type AS vehicle_type,
        tv.make, tv.model, tv.images AS vehicle_images,
        tv.slug AS vehicle_slug,
        u.name AS vendor_name, u.vendor_business_name
      FROM transport_bookings tb
      LEFT JOIN transport_vehicles tv ON tb.vehicle_id = tv.id
      LEFT JOIN users u ON tb.vendor_id = u.id
      WHERE tb.user_id = ${userId}
      ORDER BY tb.created_at DESC
    `);
    res.json(bookings.rows);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATED: Submit a review
// POST /api/transport/:vehicleId/review
// ─────────────────────────────────────────────────────────────────────────────
router.post("/transport/:vehicleId/review", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const vehicleId = Number(req.params.vehicleId);
    const {
      rating, title, comment,
      driverRating, cleanlinessRating, punctualityRating, valueRating,
      bookingId,
    } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be 1-5" });
    }

    const [vehicle] = await db
      .select({ vendorId: transportVehiclesTable.vendorId })
      .from(transportVehiclesTable)
      .where(eq(transportVehiclesTable.id, vehicleId))
      .limit(1);

    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

    await db.execute(sql`
      INSERT INTO transport_reviews (
        vehicle_id, vendor_id, booking_id, user_id,
        rating, title, comment,
        driver_rating, cleanliness_rating, punctuality_rating, value_rating
      ) VALUES (
        ${vehicleId}, ${vehicle.vendorId}, ${bookingId || null}, ${userId},
        ${rating}, ${title || null}, ${comment || null},
        ${driverRating || null}, ${cleanlinessRating || null},
        ${punctualityRating || null}, ${valueRating || null}
      )
    `);

    if (bookingId) {
      await db.execute(sql`UPDATE transport_bookings SET rating_given = true WHERE id = ${bookingId} AND user_id = ${userId}`);
    }

    res.status(201).json({ message: "Review submitted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to submit review" });
  }
});

// ─────────────────────────────────────────────────────────────
// PUBLIC: Transport Mega Menu
// GET /api/transport/mega-menu
// ─────────────────────────────────────────────────────────────
router.get("/transport/mega-menu", async (_req: Request, res: Response): Promise<void> => {
  try {
    // 1. Group states for India
    const indiaCountry = await db.select().from(countriesTable).where(eq(countriesTable.slug, "india")).limit(1);
    let indiaStates: any[] = [];
    let indiaDestinations: any[] = [];

    if (indiaCountry.length > 0) {
      indiaStates = await db.select().from(statesTable).where(
        and(
          eq(statesTable.countryId, indiaCountry[0].id),
          eq(statesTable.showInTransportMenu, true)
        )
      ).orderBy(asc(statesTable.transportMenuOrder));
      
      if (indiaStates.length > 0) {
        indiaDestinations = await db.select({
          name: destinationsTable.name,
          slug: destinationsTable.slug,
          stateId: destinationsTable.stateId,
        }).from(destinationsTable).where(
          and(
            inArray(destinationsTable.stateId, indiaStates.map(s => s.id)),
            eq(destinationsTable.showInTransportMenu, true)
          )
        ).orderBy(asc(destinationsTable.transportMenuOrder));
      }
    }
    
    // 2. Group countries for World (Regions)
    const regions = await db.select().from(regionsTable).where(eq(regionsTable.isActive, true)).orderBy(asc(regionsTable.displayOrder));
    const allCountries = await db.select().from(countriesTable).where(
      and(
        eq(countriesTable.isActive, true),
        eq(countriesTable.showInTransportMenu, true)
      )
    ).orderBy(asc(countriesTable.transportMenuOrder));
    
    const worldRegions = regions.map(region => {
      const regionCountries = allCountries.filter(c => c.regionId === region.id && c.slug !== "india");
      
      return {
        ...region,
        countries: regionCountries
      };
    }).filter(r => r.countries.length > 0);

    // Fetch destinations and states for world countries
    if (allCountries.length > 0) {
      const worldDestinations = await db.select({
        name: destinationsTable.name,
        slug: destinationsTable.slug,
        countryId: destinationsTable.countryId,
        stateId: destinationsTable.stateId,
      }).from(destinationsTable).where(
        and(
          inArray(destinationsTable.countryId, allCountries.map(c => c.id)),
          eq(destinationsTable.showInTransportMenu, true)
        )
      ).orderBy(asc(destinationsTable.transportMenuOrder));

      const indiaZones = [
        {
          name: "North India",
          states: indiaStates.filter(s => ["himachal-pradesh", "jammu-and-kashmir", "uttarakhand", "punjab", "rajasthan", "delhi", "ladakh"].includes(s.slug)).map(state => ({
            title: state.name,
            slug: state.slug,
            items: indiaDestinations.filter(d => d.stateId === state.id)
          }))
        },
        {
          name: "South & West India",
          states: indiaStates.filter(s => !["himachal-pradesh", "jammu-and-kashmir", "uttarakhand", "punjab", "rajasthan", "delhi", "ladakh"].includes(s.slug)).map(state => ({
            title: state.name,
            slug: state.slug,
            items: indiaDestinations.filter(d => d.stateId === state.id)
          }))
        }
      ].filter(zone => zone.states.length > 0);

      const responseWorldRegions = worldRegions.map(region => ({
        name: region.name,
        slug: region.slug,
        countries: region.countries.map((country: any) => ({
          name: country.name,
          slug: country.slug,
          destinations: worldDestinations.filter(d => d.countryId === country.id)
        }))
      }));

      res.json({
        indiaZones,
        worldRegions: responseWorldRegions
      });
      return;
    }

    res.json({ indiaZones: [], worldRegions: [] });
  } catch (error: any) {
    logger.error({ error: error.message }, "Transport mega menu error");
    res.status(500).json({ error: "Failed to generate transport mega menu" });
  }
});

// GET /api/transport/:slug - parameterized route declared at the bottom to avoid blocking static routes
router.get("/transport/:slug", cacheMiddleware(60), async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;

    // Pass-through guard for keyword paths that should be handled by their own routes
    if (TRANSPORT_KEYWORD_SLUGS.has(slug)) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    const vehicleResult = await db.execute(sql`
      SELECT
        tv.*,
        u.name AS owner_name, u.vendor_business_name,
        tv_v.business_name, tv_v.phone AS vendor_phone,
        tv_v.email AS vendor_email, tv_v.logo_url AS vendor_logo,
        tv_v.description AS vendor_desc, tv_v.operating_since,
        COALESCE(d.name, tv.custom_city) AS city_name,
        s.name AS state_name,
        c.name AS country_name
      FROM transport_vehicles tv
      LEFT JOIN transport_vendors tv_v ON tv.vendor_id = tv_v.id
      LEFT JOIN users u ON tv.owner_id = u.id
      LEFT JOIN destinations d ON tv.destination_id = d.id
      LEFT JOIN states s ON tv.state_id = s.id
      LEFT JOIN countries c ON tv.country_id = c.id
      WHERE tv.slug = ${slug} AND tv.status = 'APPROVED'
      LIMIT 1
    `) as any;

    if (!vehicleResult?.rows?.[0]) return res.status(404).json({ error: "Vehicle not found" });
    const v = vehicleResult.rows[0];

    // Fetch pricing rules
    const pricing = await db
      .select()
      .from(transportPricingRulesTable)
      .where(and(
        eq(transportPricingRulesTable.vehicleId, v.id),
        eq(transportPricingRulesTable.isActive, true)
      ))
      .orderBy(asc(transportPricingRulesTable.displayOrder));

    // Fetch assigned driver (basic info only for users)
    const [driver] = await db
      .select({
        id: transportDriversTable.id,
        name: transportDriversTable.name,
        photoUrl: transportDriversTable.photoUrl,
        experienceYears: transportDriversTable.experienceYears,
        languagesKnown: transportDriversTable.languagesKnown,
        rating: transportDriversTable.rating,
        totalTrips: transportDriversTable.totalTrips,
        isVerified: transportDriversTable.isVerified,
      })
      .from(transportDriversTable)
      .where(and(
        eq(transportDriversTable.vehicleId, v.id),
        eq(transportDriversTable.isAvailable, true)
      ))
      .limit(1);

    // Fetch reviews
    const reviews = await db.execute(sql`
      SELECT tr.*, u.name AS user_name
      FROM transport_reviews tr
      LEFT JOIN users u ON tr.user_id = u.id
      WHERE tr.vehicle_id = ${v.id} AND tr.admin_approved = true
      ORDER BY tr.created_at DESC
      LIMIT 10
    `);

    // Avg rating — db.execute() returns {rows:[...]} directly
    const ratingResult = await db.execute(sql`
      SELECT ROUND(AVG(rating)::numeric, 1) AS avg_rating, COUNT(*) AS review_count
      FROM transport_reviews WHERE vehicle_id = ${v.id} AND admin_approved = true
    `) as any;
    const ratingRow = ratingResult?.rows?.[0] || {};

    res.json({
      ...v,
      pricing,
      driver: driver || null,
      reviews: reviews.rows,
      avgRating:   Number(ratingRow.avg_rating   || 0),
      reviewCount: Number(ratingRow.review_count || 0),
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Vehicle detail error");
    res.status(500).json({ error: "Failed to fetch vehicle" });
  }
});


export default router;
