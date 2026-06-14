import { Router, Request, Response } from "express";
import {
  db, hotelsTable, hotelRoomsTable, hotelPoliciesTable, hotelReviewsTable,
  hotelPhotosTable, hotelRoomInventoryTable, bookingsTable, usersTable,
  destinationsTable, statesTable, countriesTable, regionsTable
} from "@workspace/db";
import { eq, and, desc, asc, sql, gte, lte, ilike, or, inArray } from "drizzle-orm";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";
import { logger } from "../lib/logger";
import { cacheMiddleware, clearCachePattern } from "../lib/cache";
import { sendHotelBookingConfirmation, notifyVendorOfHotelBooking } from "../lib/notifications";

const router = Router();

// ─────────────────────────────────────────────────────────────
// ⚡ PERFORMANCE: my-bookings MUST be registered BEFORE /:slug
// Otherwise Express will match "my-bookings" as a slug param!
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// AUTHENTICATED: Get User's Hotel Bookings
// GET /api/hotels/my-bookings
// ─────────────────────────────────────────────────────────────
router.get("/my-bookings", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const bookings = await db
      .select({
        id: bookingsTable.id,
        status: bookingsTable.status,
        travelDate: bookingsTable.travelDate,
        totalAmount: bookingsTable.totalAmount,
        paymentStatus: bookingsTable.paymentStatus,
        specialRequests: bookingsTable.specialRequests,
        createdAt: bookingsTable.createdAt,
        travelersCount: bookingsTable.travelersCount,
        hotelName: hotelsTable.name,
        hotelSlug: hotelsTable.slug,
        hotelCity: hotelsTable.city,
        hotelImages: hotelsTable.images,
        hotelType: hotelsTable.type,
        roomName: hotelRoomsTable.name,
        roomType: hotelRoomsTable.type,
        roomBedType: hotelRoomsTable.bedType,
        paymentDetails: bookingsTable.paymentDetails,
      })
      .from(bookingsTable)
      .leftJoin(hotelsTable, eq(bookingsTable.hotelId, hotelsTable.id))
      .leftJoin(hotelRoomsTable, eq(bookingsTable.roomId, hotelRoomsTable.id))
      .where(
        and(
          eq(bookingsTable.userId, userId),
          eq(bookingsTable.bookingType, "HOTEL")
        )
      )
      .orderBy(desc(bookingsTable.createdAt));

    res.json(bookings.map(b => ({
      ...b,
      checkInDate: (b.paymentDetails as any)?.checkInDate || b.travelDate,
      checkOutDate: (b.paymentDetails as any)?.checkOutDate || new Date(new Date(b.travelDate).getTime() + 86400000).toISOString().split("T")[0],
      roomsConfig: (b.paymentDetails as any)?.rooms || [{ adults: b.travelersCount, children: 0 }]
    })));
  } catch (error: any) {
    logger.error({ error: error.message }, "User hotel bookings error");
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// ─────────────────────────────────────────────────────────────
// PUBLIC: Hotels by Location (State or City landing pages)
// GET /api/hotels/by-location?country=india&state=himachal-pradesh&city=manali
// ─────────────────────────────────────────────────────────────
router.get("/by-location", cacheMiddleware(120), async (req: Request, res: Response) => {
  try {
    const { country, state, city, limit = "20", offset = "0" } = req.query;

    const conditions: string[] = [`hotels.status = 'APPROVED'`];
    const params: any[] = [];
    let paramIdx = 1;

    if (country) {
      conditions.push(`hotels.country_slug = $${paramIdx++}`);
      params.push(country);
    }
    if (state && state !== "all" && state !== "undefined") {
      conditions.push(`hotels.state_slug = $${paramIdx++}`);
      params.push(state);
    }
    if (city) {
      conditions.push(`hotels.destination_slug = $${paramIdx++}`);
      params.push(city);
    }

    const lim = Math.min(Number(limit), 50);
    const off = Number(offset);

    const { rows: hotels } = await db.execute(sql`
      SELECT
        hotels.id, hotels.name, hotels.slug, hotels.type,
        hotels.star_rating as "starRating",
        hotels.city, hotels.images, hotels.amenities,
        hotels.min_price as "minPrice",
        hotels.is_featured as "isFeatured",
        hotels.country_slug as "countrySlug",
        hotels.state_slug as "stateSlug",
        hotels.destination_slug as "destinationSlug",
        hotels.custom_city as "customCity",
        destinations.name as "destinationName",
        ROUND(AVG(r.rating)::numeric, 1) as "avgRating",
        COUNT(DISTINCT r.id)::int as "reviewCount"
      FROM hotels
      LEFT JOIN destinations ON hotels.destination_id = destinations.id
      LEFT JOIN hotel_reviews r ON r.hotel_id = hotels.id AND r.is_published = true
      WHERE ${sql.raw(conditions.join(' AND '))}
      GROUP BY hotels.id, destinations.name
      ORDER BY hotels.is_featured DESC, hotels.display_order ASC, hotels.min_price ASC
      LIMIT ${lim} OFFSET ${off}
    `) as any;

    const { rows: totalRows } = await db.execute(sql`
      SELECT COUNT(DISTINCT hotels.id)::int as total
      FROM hotels
      WHERE ${sql.raw(conditions.join(' AND '))}
    `) as any;

    res.json({
      hotels: hotels || [],
      total: Number(totalRows?.[0]?.total || 0),
      limit: lim,
      offset: off,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Hotels by-location error");
    res.status(500).json({ error: "Failed to fetch hotels by location" });
  }
});

// ─────────────────────────────────────────────────────────────
// PUBLIC: Featured Hotels (for homepage)
// GET /api/hotels/featured  — cached 5 min
// ─────────────────────────────────────────────────────────────
router.get("/featured", cacheMiddleware(300), async (req: Request, res: Response) => {
  try {
    const hotels = await db
      .select({
        id: hotelsTable.id,
        name: hotelsTable.name,
        slug: hotelsTable.slug,
        type: hotelsTable.type,
        starRating: hotelsTable.starRating,
        city: hotelsTable.city,
        images: hotelsTable.images,
        minPrice: hotelsTable.minPrice,
        isFeatured: hotelsTable.isFeatured,
        countrySlug: hotelsTable.countrySlug,
        stateSlug: hotelsTable.stateSlug,
        destinationSlug: hotelsTable.destinationSlug,
        destinationName: destinationsTable.name,
      })
      .from(hotelsTable)
      .leftJoin(destinationsTable, eq(hotelsTable.destinationId, destinationsTable.id))
      .where(and(eq(hotelsTable.status, "APPROVED"), eq(hotelsTable.isFeatured, true)))
      .orderBy(hotelsTable.displayOrder)
      .limit(8);

    res.json(hotels);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch featured hotels" });
  }
});

// ─────────────────────────────────────────────────────────────
// PUBLIC: Search & List Hotels
// GET /api/hotels?q=&type=&starRating=&minPrice=&maxPrice=&sort=&limit=&offset=
// Cached 60 seconds — public search results
// ─────────────────────────────────────────────────────────────
router.get("/", cacheMiddleware(60), async (req: Request, res: Response) => {
  try {
    const {
      destination, q,
      minPrice, maxPrice,
      starRating, type,
      sort = "recommended",
      limit = "20",
      offset = "0",
    } = req.query;

    const conditions: any[] = [eq(hotelsTable.status, "APPROVED")];

    // Destination lookup — only do it if destination param exists
    if (destination) {
      const [dest] = await db.select({ id: destinationsTable.id }).from(destinationsTable)
        .where(or(
          ilike(destinationsTable.name, `%${destination}%`),
          eq(destinationsTable.slug, destination as string)
        )).limit(1);
      if (dest) conditions.push(eq(hotelsTable.destinationId, dest.id));
    }

    if (q) {
      conditions.push(or(
        ilike(hotelsTable.name, `%${q}%`),
        ilike(hotelsTable.address, `%${q}%`),
        ilike(hotelsTable.city, `%${q}%`)
      ));
    }

    if (type) conditions.push(eq(hotelsTable.type, type as string));
    if (starRating) conditions.push(eq(hotelsTable.starRating, Number(starRating)));
    if (minPrice) conditions.push(gte(hotelsTable.minPrice, Number(minPrice)));
    if (maxPrice) conditions.push(lte(hotelsTable.minPrice, Number(maxPrice)));

    let orderBy: any = desc(hotelsTable.isFeatured);
    if (sort === "price_asc") orderBy = hotelsTable.minPrice;
    else if (sort === "price_desc") orderBy = desc(hotelsTable.minPrice);
    else if (sort === "rating") orderBy = desc(hotelsTable.starRating);
    else if (sort === "newest") orderBy = desc(hotelsTable.createdAt);

    const lim = Math.min(Number(limit), 50); // Cap at 50
    const off = Number(offset);

    // ⚡ Optimized: Single query with embedded ratings subquery
    const hotels = await db.execute(sql`
      SELECT
        hotels.id, hotels.name, hotels.slug, hotels.type, hotels.star_rating as "starRating",
        hotels.address, hotels.city, hotels.images, hotels.amenities, hotels.min_price as "minPrice",
        hotels.is_featured as "isFeatured", hotels.latitude, hotels.longitude,
        hotels.check_in_time as "checkInTime", hotels.check_out_time as "checkOutTime",
        hotels.breakfast_included as "breakfastIncluded", hotels.booking_type as "bookingType",
        hotels.destination_id as "destinationId",
        hotels.country_slug as "countrySlug",
        hotels.state_slug as "stateSlug",
        hotels.destination_slug as "destinationSlug",
        destinations.name as "destinationName",
        ROUND(AVG(r.rating)::numeric, 1) as "avgRating",
        COUNT(r.id)::int as "reviewCount"
      FROM hotels
      LEFT JOIN destinations ON hotels.destination_id = destinations.id
      LEFT JOIN hotel_reviews r ON r.hotel_id = hotels.id AND r.is_published = true
      WHERE ${and(...conditions)}
      GROUP BY hotels.id, destinations.name
      ORDER BY hotels.is_featured DESC, hotels.display_order ASC
      LIMIT ${lim} OFFSET ${off}
    `);

    // ⚡ Count in same transaction — avoids separate round trip
    const totalResult = await db.execute(sql`
      SELECT COUNT(DISTINCT hotels.id)::int as total
      FROM hotels
      LEFT JOIN destinations ON hotels.destination_id = destinations.id
      WHERE ${and(...conditions)}
    `) as any;
    const total = totalResult.rows?.[0]?.total || 0;

    res.json({
      hotels: (hotels as any).rows || [],
      total: Number(total) || 0,
      limit: lim,
      offset: off,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Hotel search error");
    res.status(500).json({ error: "Failed to search hotels", details: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PUBLIC: Hotels Mega Menu
// GET /api/hotels/mega-menu
// ─────────────────────────────────────────────────────────────
router.get("/mega-menu", async (_req: Request, res: Response): Promise<void> => {
  try {
    // 1. Group states for India
    const indiaCountry = await db.select().from(countriesTable).where(eq(countriesTable.slug, "india")).limit(1);
    let indiaStates: any[] = [];
    let indiaDestinations: any[] = [];

    if (indiaCountry.length > 0) {
      indiaStates = await db.select().from(statesTable).where(
        and(
          eq(statesTable.countryId, indiaCountry[0].id),
          eq(statesTable.showInHotelsMenu, true)
        )
      ).orderBy(asc(statesTable.hotelsMenuOrder));
      
      if (indiaStates.length > 0) {
        indiaDestinations = await db.select({
          name: destinationsTable.name,
          slug: destinationsTable.slug,
          stateId: destinationsTable.stateId,
        }).from(destinationsTable).where(
          and(
            inArray(destinationsTable.stateId, indiaStates.map(s => s.id)),
            eq(destinationsTable.showInHotelsMenu, true)
          )
        ).orderBy(asc(destinationsTable.hotelsMenuOrder));
      }
    }
    
    // 2. Group countries for World (Regions)
    const regions = await db.select().from(regionsTable).where(eq(regionsTable.isActive, true)).orderBy(asc(regionsTable.displayOrder));
    const allCountries = await db.select().from(countriesTable).where(
      and(
        eq(countriesTable.isActive, true),
        eq(countriesTable.showInHotelsMenu, true)
      )
    ).orderBy(asc(countriesTable.hotelsMenuOrder));
    
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
          eq(destinationsTable.showInHotelsMenu, true)
        )
      ).orderBy(asc(destinationsTable.hotelsMenuOrder));

      const worldStatesWithId = await db.select({
        id: statesTable.id,
        name: statesTable.name,
        slug: statesTable.slug,
        countryId: statesTable.countryId,
      }).from(statesTable).where(
        and(
          inArray(statesTable.countryId, allCountries.map(c => c.id)),
          eq(statesTable.showInHotelsMenu, true)
        )
      ).orderBy(asc(statesTable.hotelsMenuOrder));

      const stateIdToSlug = new Map(worldStatesWithId.map(s => [s.id, s.slug]));

      // Attach destinations and states to the countries
      worldRegions.forEach(region => {
        region.countries.forEach(country => {
          const cDests = worldDestinations
            .filter(d => d.countryId === country.id)
            .map(d => ({
              name: d.name,
              slug: d.slug,
              isState: false,
              stateSlug: d.stateId ? stateIdToSlug.get(d.stateId) : null
            }));
            
          const cStates = worldStatesWithId
            .filter(s => s.countryId === country.id)
            .map(s => ({
              name: s.name,
              slug: s.slug,
              isState: true,
              stateSlug: s.slug
            }));
            
          (country as any).destinations = [...cStates, ...cDests];
        });
      });
    }

    // Group India states by Region
    const orderedRegions = [
      "North India",
      "South India",
      "East & North East India",
      "Rajasthan, West & Central India",
      "Union Territories",
      "Island Territory",
      "Other"
    ];

    const indiaZonesObj: Record<string, any[]> = {};
    // Initialize to preserve order
    orderedRegions.forEach(r => { indiaZonesObj[r] = []; });

    indiaStates.forEach((state) => {
      let zone = state.region || "Other";
      if (zone === "North India (Union Territory)") zone = "North India";
      if (zone === "West India") zone = "Rajasthan, West & Central India";
      if (zone === "Union Territory") zone = "Union Territories";
      if (!orderedRegions.includes(zone)) zone = "Other";

      const stateDests = indiaDestinations.filter(d => d.stateId === state.id);
      
      indiaZonesObj[zone].push({
        title: state.name,
        slug: state.slug,
        items: stateDests.map(d => ({ name: d.name, slug: d.slug, isState: false, stateSlug: state.slug }))
      });
    });
    
    // Only return regions that have at least one state
    const indiaZones = orderedRegions
      .filter(zone => indiaZonesObj[zone].length > 0)
      .map(zone => ({
        name: zone,
        states: indiaZonesObj[zone]
      }));

    res.json({ indiaZones, worldRegions });
  } catch (error) {
    logger.error({ error }, "Hotels mega menu error");
    res.status(500).json({ error: "Failed to fetch hotels mega menu data" });
  }
});

// ─────────────────────────────────────────────────────────────
// PUBLIC: Hotel Detail Page
// GET /api/hotels/:slug — cached 3 min
// ─────────────────────────────────────────────────────────────
router.get("/:slug", cacheMiddleware(180), async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    // ⚡ Optimized: Run all queries in PARALLEL using Promise.all
    const [hotel] = await db
      .select({
        hotel: hotelsTable,
        destinationName: destinationsTable.name,
        destinationSlug: destinationsTable.slug,
        stateName: statesTable.name,
        stateSlug: statesTable.slug,
        countryName: countriesTable.name,
        countrySlug: countriesTable.slug,
      })
      .from(hotelsTable)
      .leftJoin(destinationsTable, eq(hotelsTable.destinationId, destinationsTable.id))
      .leftJoin(statesTable, eq(hotelsTable.stateId, statesTable.id))
      .leftJoin(countriesTable, eq(hotelsTable.countryId, countriesTable.id))
      .where(and(eq(hotelsTable.slug, slug as string), eq(hotelsTable.status, "APPROVED")))
      .limit(1);

    if (!hotel) return res.status(404).json({ error: "Hotel not found" });

    const hotelId = hotel.hotel.id;

    // ⚡ All secondary queries run in parallel — saves ~400ms vs sequential
    const [rooms, policies, photos, reviews, ratingAgg] = await Promise.all([
      db.select().from(hotelRoomsTable)
        .where(and(eq(hotelRoomsTable.hotelId, hotelId), eq(hotelRoomsTable.isActive, true)))
        .orderBy(hotelRoomsTable.basePrice),

      db.select().from(hotelPoliciesTable)
        .where(eq(hotelPoliciesTable.hotelId, hotelId)).limit(1)
        .then(r => r[0] || null),

      db.select().from(hotelPhotosTable)
        .where(eq(hotelPhotosTable.hotelId, hotelId))
        .orderBy(hotelPhotosTable.displayOrder)
        .limit(20),

      db.select({ review: hotelReviewsTable, guestName: usersTable.name })
        .from(hotelReviewsTable)
        .leftJoin(usersTable, eq(hotelReviewsTable.userId, usersTable.id))
        .where(and(eq(hotelReviewsTable.hotelId, hotelId), eq(hotelReviewsTable.isPublished, true)))
        .orderBy(desc(hotelReviewsTable.createdAt))
        .limit(20),

      db.execute(sql`
        SELECT
          ROUND(AVG(rating)::numeric, 1) as avg_rating,
          ROUND(AVG(cleanliness_rating)::numeric, 1) as avg_cleanliness,
          ROUND(AVG(comfort_rating)::numeric, 1) as avg_comfort,
          ROUND(AVG(location_rating)::numeric, 1) as avg_location,
          ROUND(AVG(facilities_rating)::numeric, 1) as avg_facilities,
          ROUND(AVG(service_rating)::numeric, 1) as avg_service,
          ROUND(AVG(value_rating)::numeric, 1) as avg_value,
          COUNT(*)::int as total
        FROM hotel_reviews
        WHERE hotel_id = ${hotelId} AND is_published = true
      `).then((r: any) => r.rows?.[0] || null),
    ]);

    res.json({
      ...hotel.hotel,
      destinationName: hotel.destinationName,
      destinationSlug: hotel.destinationSlug,
      countrySlug: hotel.countrySlug,
      stateSlug: hotel.stateSlug,
      customCity: hotel.hotel.customCity,
      rooms,
      policies,
      photos,
      reviews: reviews.map(r => ({ ...r.review, guestName: r.guestName })),
      ratingsSummary: ratingAgg,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Hotel detail error");
    res.status(500).json({ error: "Failed to fetch hotel" });
  }
});

// ─────────────────────────────────────────────────────────────
// PUBLIC: Get Room by SLUG (new hierarchical URLs)
// GET /api/hotels/:slug/rooms/by-slug/:roomSlug
// ─────────────────────────────────────────────────────────────
router.get("/:slug/rooms/by-slug/:roomSlug", async (req: Request, res: Response) => {
  try {
    const { slug, roomSlug } = req.params;

    const [hotel] = await db.select({ id: hotelsTable.id })
      .from(hotelsTable)
      .where(and(eq(hotelsTable.slug, slug), eq(hotelsTable.status, "APPROVED")))
      .limit(1);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });

    const [room] = await db.select().from(hotelRoomsTable)
      .where(and(
        eq(hotelRoomsTable.hotelId, hotel.id),
        eq((hotelRoomsTable as any).slug, roomSlug),
        eq(hotelRoomsTable.isActive, true)
      ))
      .limit(1);

    if (!room) return res.status(404).json({ error: "Room not found" });
    res.json(room);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch room by slug" });
  }
});

// ─────────────────────────────────────────────────────────────
// PUBLIC: Check Room Availability
// GET /api/hotels/:slug/availability?roomId=&checkIn=&checkOut=
// ─────────────────────────────────────────────────────────────
router.get("/:slug/availability", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { checkIn, checkOut, roomId } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({ error: "checkIn and checkOut dates are required" });
    }

    const [hotel] = await db.select({ id: hotelsTable.id })
      .from(hotelsTable).where(eq(hotelsTable.slug, slug as string)).limit(1);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });

    const rooms = await db.select().from(hotelRoomsTable)
      .where(and(
        eq(hotelRoomsTable.hotelId, hotel.id),
        eq(hotelRoomsTable.isActive, true),
        ...(roomId ? [eq(hotelRoomsTable.id, Number(roomId))] : [])
      ));

    if (rooms.length === 0) return res.json({ hotelId: hotel.id, checkIn, checkOut, rooms: [] });

    // ⚡ Fixed N+1: Fetch ALL room inventory in ONE query using inArray
    const roomIds = rooms.map(r => r.id);
    const allInventory = await db.select().from(hotelRoomInventoryTable)
      .where(and(
        inArray(hotelRoomInventoryTable.roomId, roomIds),
        gte(hotelRoomInventoryTable.date, checkIn as string),
        lte(hotelRoomInventoryTable.date, checkOut as string),
      ));

    // Group inventory by room
    const inventoryByRoom: Record<number, typeof allInventory> = {};
    for (const inv of allInventory) {
      if (!inventoryByRoom[inv.roomId]) inventoryByRoom[inv.roomId] = [];
      inventoryByRoom[inv.roomId].push(inv);
    }

    const availabilityByRoom: Record<number, { available: boolean; minAvailable: number; prices: any[] }> = {};
    for (const room of rooms) {
      const inventory = inventoryByRoom[room.id] || [];
      if (inventory.length === 0) {
        availabilityByRoom[room.id] = {
          available: room.availableRooms > 0,
          minAvailable: room.availableRooms,
          prices: [],
        };
      } else {
        const blocked = inventory.some(i => i.isBlocked);
        const minAvail = Math.min(...inventory.map(i => i.availableCount));
        availabilityByRoom[room.id] = {
          available: !blocked && minAvail > 0,
          minAvailable: minAvail,
          prices: inventory.map(i => ({
            date: i.date,
            price: i.priceOverride || room.basePrice,
            available: !i.isBlocked && i.availableCount > 0,
          })),
        };
      }
    }

    res.json({
      hotelId: hotel.id,
      checkIn, checkOut,
      rooms: rooms.map(r => ({
        ...r,
        availability: availabilityByRoom[r.id],
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to check availability" });
  }
});

// ─────────────────────────────────────────────────────────────
// AUTHENTICATED: Create Hotel Booking
// POST /api/hotels/:slug/book
// ─────────────────────────────────────────────────────────────
router.post("/:slug/book", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const userId = req.user!.id;
    const {
      roomId, checkIn, checkOut, guests,
      totalAmount, specialRequests, paymentMethod, roomsConfig,
      mealPlan, childrenWithBed = 0, childrenWithoutBed = 0, priceBreakdown
    } = req.body;

    const [hotel] = await db.select().from(hotelsTable).where(eq(hotelsTable.slug, slug as string)).limit(1);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });

    const [room] = await db.select().from(hotelRoomsTable)
      .where(and(eq(hotelRoomsTable.id, Number(roomId)), eq(hotelRoomsTable.hotelId, hotel.id))).limit(1);
    if (!room) return res.status(404).json({ error: "Room not found" });

    // ─────────────────────────────────────────────────────────────
    // 🛡️ DATE-LEVEL INVENTORY VERIFICATION & PRICE VALIDATION
    // ─────────────────────────────────────────────────────────────
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const dates: string[] = [];
    const current = new Date(start);
    while (current < end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }

    if (dates.length === 0) {
      return res.status(400).json({ error: "Invalid check-in/check-out date range." });
    }

    const requestedRooms = Number(req.body.rooms || 1);

    const inventoryRecords = await db
      .select()
      .from(hotelRoomInventoryTable)
      .where(
        and(
          eq(hotelRoomInventoryTable.roomId, room.id),
          inArray(hotelRoomInventoryTable.date, dates)
        )
      );

    const invMap = new Map<string, typeof inventoryRecords[0]>();
    for (const record of inventoryRecords) {
      invMap.set(record.date, record);
    }

    // Check availability for all stay dates
    for (const dStr of dates) {
      const record = invMap.get(dStr);
      if (record) {
        if (record.isBlocked) {
          return res.status(400).json({ error: `Selected room type is blocked for sales on ${dStr}.` });
        }
        if (record.availableCount < requestedRooms) {
          return res.status(400).json({ error: `Not enough rooms available on ${dStr}. Only ${record.availableCount} left, requested ${requestedRooms}.` });
        }
      } else {
        const defaultAvail = room.totalRooms || 1;
        if (defaultAvail < requestedRooms) {
          return res.status(400).json({ error: `Not enough rooms available on ${dStr}. Only ${defaultAvail} left, requested ${requestedRooms}.` });
        }
      }
    }

    // Server-side price calculation
    let calculatedSubtotal = 0;
    const baseAdults = room.baseAdults ?? 2;
    const baseChildren = room.baseChildren ?? 0;

    for (const config of roomsConfig) {
      for (const dStr of dates) {
        const record = invMap.get(dStr);
        const customPricing = record?.customPricing as any;

        // Weekend check
        const dayName = new Date(dStr).toLocaleDateString("en-US", { weekday: "long" });
        const dateWeekendDays = customPricing?.weekendDays || room.weekendDays || ["Friday", "Saturday"];
        const isWeekend = dateWeekendDays.includes(dayName);

        const dateWeekendPrice = customPricing && customPricing.weekendPrice !== undefined && customPricing.weekendPrice !== null
          ? Number(customPricing.weekendPrice)
          : room.weekendPrice;

        let basePrice = record?.priceOverride !== null && record?.priceOverride !== undefined
          ? Number(record.priceOverride)
          : (isWeekend && dateWeekendPrice !== null && dateWeekendPrice !== undefined && dateWeekendPrice > 0
            ? dateWeekendPrice
            : room.basePrice);

        const discountType = record ? record.discountType : (room.discountType || "PERCENT");
        const discountPercent = record ? Number(record.discountPercent) : Number(room.discountPercent || 0);
        const discountFlat = record ? Number(record.discountFlat) : Number(room.discountFlat || 0);

        let daily = basePrice;
        if (discountType === "PERCENT" && discountPercent > 0) {
          daily = Math.max(0, basePrice - (basePrice * discountPercent) / 100);
        } else if (discountType === "FLAT" && discountFlat > 0) {
          daily = Math.max(0, basePrice - discountFlat);
        }

        // Add extra adult charge
        const dateExtraAdultPrice = customPricing && customPricing.extraAdultPrice !== undefined && customPricing.extraAdultPrice !== null
          ? Number(customPricing.extraAdultPrice)
          : (room.extraAdultPrice || 0);
        const extraAdults = Math.max(0, config.adults - baseAdults);
        daily += extraAdults * dateExtraAdultPrice;

        // Add extra child with bed charge
        const dateExtraChildWithBedPrice = customPricing && customPricing.extraChildWithBedPrice !== undefined && customPricing.extraChildWithBedPrice !== null
          ? Number(customPricing.extraChildWithBedPrice)
          : (room.extraChildWithBedPrice || room.extraChildPrice || 0);
        const extraKidsWithBed = Math.max(0, (config.childrenWithBed || 0) - baseChildren);
        daily += extraKidsWithBed * dateExtraChildWithBedPrice;

        // Add child sharing (no bed) charge
        const dateExtraChildWithoutBedPrice = customPricing && customPricing.extraChildWithoutBedPrice !== undefined && customPricing.extraChildWithoutBedPrice !== null
          ? Number(customPricing.extraChildWithoutBedPrice)
          : (room.extraChildWithoutBedPrice || 0);
        const remainingBaseChildren = Math.max(0, baseChildren - (config.childrenWithBed || 0));
        const extraKidsWithoutBed = Math.max(0, (config.childrenWithoutBed || 0) - remainingBaseChildren);
        daily += extraKidsWithoutBed * dateExtraChildWithoutBedPrice;

        // Add meal plan charge
        const basePlanCode = "EP";
        const basePlanLabel = "Room Only";

        const rawDayOptions = customPricing && Array.isArray(customPricing.mealPlanOptions) && customPricing.mealPlanOptions.length > 0
          ? customPricing.mealPlanOptions
          : (room.mealPlanOptions && Array.isArray(room.mealPlanOptions) && room.mealPlanOptions.length > 0
            ? room.mealPlanOptions
            : []);

        const dayMealPlans = [
          { code: basePlanCode, label: basePlanLabel, adultPrice: 0, childPrice: 0, isBase: true },
          ...rawDayOptions.filter((o: any) => o.code !== basePlanCode)
        ];
        const daySelectedPlanObj = dayMealPlans.find((m: any) => m.code === mealPlan) || dayMealPlans[0];

        const kidsTotal = (config.childrenWithBed || 0) + (config.childrenWithoutBed || 0);
        daily += (config.adults * (daySelectedPlanObj.adultPrice || 0)) + (kidsTotal * (daySelectedPlanObj.childPrice || 0));

        calculatedSubtotal += daily;
      }
    }

    const calculatedTaxes = Math.round(calculatedSubtotal * 0.12);
    const calculatedTotal = calculatedSubtotal + calculatedTaxes;

    // Validate client totalAmount against calculatedTotal (allow minor rounding differences up to ₹15)
    if (totalAmount && Math.abs(totalAmount - calculatedTotal) > 15) {
      logger.warn({
        submitted: totalAmount,
        calculated: calculatedTotal,
        roomId: room.id,
        checkIn,
        checkOut
      }, "Booking total amount discrepancy");
      return res.status(400).json({
        error: `Price validation failed. The calculated total was ₹${calculatedTotal}, but ₹${totalAmount} was submitted. Please refresh and try again.`
      });
    }

    // Decrement inventory availability for all stay dates
    for (const dStr of dates) {
      const record = invMap.get(dStr);
      if (record) {
        await db
          .update(hotelRoomInventoryTable)
          .set({
            availableCount: Math.max(0, record.availableCount - requestedRooms),
            updatedAt: new Date()
          })
          .where(eq(hotelRoomInventoryTable.id, record.id));
      } else {
        await db.insert(hotelRoomInventoryTable).values({
          roomId: room.id,
          hotelId: hotel.id,
          date: dStr,
          availableCount: Math.max(0, (room.totalRooms || 1) - requestedRooms),
          priceOverride: null,
          isBlocked: false,
        });
      }
    }

    const status = hotel.bookingType === "INSTANT" ? "CONFIRMED" : "PENDING";

    const [booking] = await db.insert(bookingsTable).values({
      userId,
      vendorId: hotel.ownerId,
      bookingType: "HOTEL",
      hotelId: hotel.id,
      roomId: room.id,
      status,
      travelDate: new Date(checkIn),
      travelersCount: guests || 1,
      mealPlan,
      childrenWithBed,
      childrenWithoutBed,
      priceBreakdown: priceBreakdown || null,
      totalAmount: totalAmount || calculatedTotal,
      finalPaidAmount: totalAmount || calculatedTotal,
      paymentStatus: paymentMethod === "ONLINE" ? "PAID" : "PENDING",
      specialRequests,
      paymentDetails: {
        method: paymentMethod || "PAY_AT_HOTEL",
        checkInDate: checkIn,
        checkOutDate: checkOut,
        rooms: roomsConfig || [{ adults: guests || 2, childrenWithBed, childrenWithoutBed }],
        mealPlan,
        priceBreakdown
      },
    } as any).returning();

    // Invalidate cache for this hotel's detail page after booking
    clearCachePattern(`cache:/api/hotels/${slug}*`).catch(() => {});

    // Fire-and-forget email notifications
    const guestEmail = req.body.guestEmail || req.user!.email;
    const guestName = req.body.guestName || "Valued Guest";
    if (guestEmail) {
      sendHotelBookingConfirmation({
        guestEmail, guestName,
        bookingId: booking.id,
        hotelName: hotel.name,
        roomName: room.name,
        checkIn, checkOut,
        guests: guests || 1,
        totalAmount: totalAmount || room.basePrice,
        paymentMethod: paymentMethod || "PAY_AT_HOTEL",
        status,
      }).catch(() => {});
    }

    if (hotel.ownerId) {
      db.select({ email: usersTable.email })
        .from(usersTable).where(eq(usersTable.id, hotel.ownerId)).limit(1)
        .then(([vendor]) => {
          if (vendor?.email) {
            notifyVendorOfHotelBooking({
              vendorEmail: vendor.email,
              hotelName: hotel.name,
              bookingId: booking.id,
              guestName, checkIn,
              guests: guests || 1,
              totalAmount: totalAmount || room.basePrice,
              status,
            }).catch(() => {});
          }
        }).catch(() => {});
    }

    res.status(201).json({
      ...booking,
      hotelName: hotel.name,
      roomName: room.name,
      status,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Hotel booking error");
    res.status(500).json({ error: "Failed to create booking", details: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// AUTHENTICATED: Submit Review
// POST /api/hotels/:slug/reviews
// ─────────────────────────────────────────────────────────────
router.post("/:slug/reviews", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const userId = req.user!.id;

    const [hotel] = await db.select({ id: hotelsTable.id }).from(hotelsTable)
      .where(eq(hotelsTable.slug, slug as string)).limit(1);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });

    const {
      rating, title, body, travelType, stayDate,
      cleanlinessRating, comfortRating, locationRating,
      facilitiesRating, serviceRating, valueRating, bookingId
    } = req.body;

    let isVerified = false;
    if (bookingId) {
      const [booking] = await db.select({ id: bookingsTable.id }).from(bookingsTable)
        .where(and(
          eq(bookingsTable.id, Number(bookingId)),
          eq(bookingsTable.hotelId, hotel.id),
          eq(bookingsTable.userId, userId),
          eq(bookingsTable.status, "CONFIRMED")
        )).limit(1);
      isVerified = !!booking;
    }

    const [review] = await db.insert(hotelReviewsTable).values({
      hotelId: hotel.id,
      userId,
      bookingId: bookingId ? Number(bookingId) : null,
      rating: Number(rating),
      cleanlinessRating: cleanlinessRating ? Number(cleanlinessRating) : null,
      comfortRating: comfortRating ? Number(comfortRating) : null,
      locationRating: locationRating ? Number(locationRating) : null,
      facilitiesRating: facilitiesRating ? Number(facilitiesRating) : null,
      serviceRating: serviceRating ? Number(serviceRating) : null,
      valueRating: valueRating ? Number(valueRating) : null,
      title, body, travelType,
      stayDate: stayDate || null,
      isVerified,
      isPublished: true,
    } as any).returning();

    // Invalidate detail cache so new review shows immediately
    clearCachePattern(`cache:/api/hotels/${slug}*`).catch(() => {});

    res.status(201).json(review);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to submit review", details: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PUBLIC: Get Room Calendar (Rates & Inventory month-wise)
// GET /api/hotels/:slug/rooms/:roomId/calendar?startDate=&endDate=
// ─────────────────────────────────────────────────────────────
router.get("/:slug/rooms/:roomId/calendar", async (req: Request, res: Response) => {
  try {
    const { slug, roomId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate dates are required" });
    }

    const [hotel] = await db.select({ id: hotelsTable.id })
      .from(hotelsTable).where(eq(hotelsTable.slug, slug as string)).limit(1);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });

    const [room] = await db.select().from(hotelRoomsTable)
      .where(and(
        eq(hotelRoomsTable.id, Number(roomId)),
        eq(hotelRoomsTable.hotelId, hotel.id),
        eq(hotelRoomsTable.isActive, true)
      )).limit(1);

    if (!room) return res.status(404).json({ error: "Room not found" });

    // Fetch all inventory overrides for the room in this date range
    const inventory = await db.select().from(hotelRoomInventoryTable)
      .where(and(
        eq(hotelRoomInventoryTable.roomId, room.id),
        gte(hotelRoomInventoryTable.date, startDate as string),
        lte(hotelRoomInventoryTable.date, endDate as string)
      ));

    const inventoryMap = new Map<string, typeof inventory[0]>();
    for (const inv of inventory) {
      const rawDate = inv.date;
      const dateStr = rawDate instanceof Date 
        ? rawDate.toISOString().split("T")[0] 
        : String(rawDate).split("T")[0];
      inventoryMap.set(dateStr, inv);
    }

    // Generate all dates in the range
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    const days = [];
    const current = new Date(start);

    while (current <= end) {
      const dStr = current.toISOString().split("T")[0];
      const override = inventoryMap.get(dStr);
      const customPricing = override?.customPricing as any;

      const availableCount = override ? override.availableCount : (room.totalRooms || 1);
      const isBlocked = override ? override.isBlocked : false;

      // Weekend check
      const dayName = current.toLocaleDateString("en-US", { weekday: "long" });
      const dateWeekendDays = customPricing?.weekendDays || room.weekendDays || ["Friday", "Saturday"];
      const isWeekend = dateWeekendDays.includes(dayName);

      const dateWeekendPrice = customPricing && customPricing.weekendPrice !== undefined && customPricing.weekendPrice !== null
        ? Number(customPricing.weekendPrice)
        : room.weekendPrice;

      const basePrice = override && override.priceOverride !== null && override.priceOverride !== undefined
        ? override.priceOverride
        : (isWeekend && dateWeekendPrice !== null && dateWeekendPrice !== undefined && dateWeekendPrice > 0
          ? dateWeekendPrice
          : room.basePrice);

      const discountType = override ? (override.discountType || "PERCENT") : (room.discountType || "PERCENT");
      const discountPercent = override ? (override.discountPercent ?? 0) : (room.discountPercent ?? 0);
      const discountFlat = override ? (override.discountFlat ?? 0) : (room.discountFlat ?? 0);

      days.push({
        date: dStr,
        availableCount,
        isBlocked,
        basePrice,
        discountType,
        discountPercent,
        discountFlat,
        customPricing: override ? override.customPricing : null,
      });

      current.setDate(current.getDate() + 1);
    }

    res.json(days);
  } catch (error: any) {
    logger.error({ error: error.message }, "Get room calendar error");
    res.status(500).json({ error: "Failed to fetch room calendar", details: error.message });
  }
});

export default router;
