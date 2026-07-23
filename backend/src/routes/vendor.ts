import { Router, Response } from "express";
import {
  db, hotelsTable, hotelRoomsTable, hotelPoliciesTable, hotelReviewsTable,
  hotelPhotosTable, hotelRoomInventoryTable, transportServicesTable,
  bookingsTable, inquiriesTable, destinationsTable, statesTable, countriesTable,
  usersTable, pendingCityRequestsTable, conversationsTable, messagesTable
} from "@workspace/db";
import { eq, and, desc, asc, sql, gte, lte, inArray } from "drizzle-orm";
import { authenticate, authorize, AuthenticatedRequest } from "../middleware/auth";
import { logger } from "../lib/logger";
import { clearCachePattern } from "../lib/cache";

const router = Router();

// BASE MIDDLEWARE: All routes here require being a Vendor or Admin
router.use(authenticate);
router.use(authorize(["HOTEL_OWNER", "TRANSPORTER", "ADMIN", "SUPERADMIN"]));

// ─────────────────────────────────────────────────────────────
// VENDOR DASHBOARD STATS
// ─────────────────────────────────────────────────────────────
router.get("/dashboard", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;

    const [bookingCount] = await db.select({ count: sql<number>`count(*)` })
      .from(bookingsTable).where(and(eq(bookingsTable.vendorId, ownerId), eq(bookingsTable.bookingType, "HOTEL")));

    const [inquiryCount] = await db.select({ count: sql<number>`count(*)` })
      .from(inquiriesTable).where(eq(inquiriesTable.vendorId, ownerId));

    const [earnings] = await db.select({ sum: sql<number>`coalesce(sum(${bookingsTable.totalAmount}),0)` })
      .from(bookingsTable)
      .where(and(eq(bookingsTable.vendorId, ownerId), eq(bookingsTable.bookingType, "HOTEL"), eq(bookingsTable.status, "CONFIRMED")));

    const [hotelCount] = await db.select({ count: sql<number>`count(*)` })
      .from(hotelsTable).where(eq(hotelsTable.ownerId, ownerId));

    const [activeHotels] = await db.select({ count: sql<number>`count(*)` })
      .from(hotelsTable).where(and(eq(hotelsTable.ownerId, ownerId), eq(hotelsTable.status, "APPROVED")));

    const [pendingBookings] = await db.select({ count: sql<number>`count(*)` })
      .from(bookingsTable)
      .where(and(eq(bookingsTable.vendorId, ownerId), eq(bookingsTable.bookingType, "HOTEL"), eq(bookingsTable.status, "PENDING")));

    res.json({
      totalBookings: Number(bookingCount.count),
      totalInquiries: Number(inquiryCount.count),
      totalRevenue: Number(earnings?.sum || 0),
      totalProperties: Number(hotelCount.count),
      activeProperties: Number(activeHotels.count),
      pendingBookings: Number(pendingBookings.count),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

// ─────────────────────────────────────────────────────────────
// HOTEL MANAGEMENT
// ─────────────────────────────────────────────────────────────

// GET /vendor/hotels — list vendor's properties (or all for admin)
router.get("/hotels", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);

    const results = await db
      .select({
        hotel: hotelsTable,
        destinationName: destinationsTable.name,
        ownerName: usersTable.name,
        ownerEmail: usersTable.email,
      })
      .from(hotelsTable)
      .leftJoin(destinationsTable, eq(hotelsTable.destinationId, destinationsTable.id))
      .leftJoin(usersTable, eq(hotelsTable.ownerId, usersTable.id))
      .where(isAdmin ? undefined : eq(hotelsTable.ownerId, ownerId))
      .orderBy(desc(hotelsTable.createdAt));

    res.json(results.map(r => ({
      ...r.hotel,
      destinationName: r.destinationName,
      ownerName: r.ownerName,
      ownerEmail: r.ownerEmail,
    })));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch hotels" });
  }
});

// GET /vendor/hotels/:id — full hotel detail
router.get("/hotels/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);
    const hotelId = Number(req.params.id);

    const [hotel] = await db.select().from(hotelsTable).where(eq(hotelsTable.id, hotelId)).limit(1);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });
    if (!isAdmin && hotel.ownerId !== ownerId) return res.status(403).json({ error: "Forbidden" });

    const rooms = await db.select().from(hotelRoomsTable).where(eq(hotelRoomsTable.hotelId, hotelId));
    const [policies] = await db.select().from(hotelPoliciesTable).where(eq(hotelPoliciesTable.hotelId, hotelId)).limit(1);
    const photos = await db.select().from(hotelPhotosTable).where(eq(hotelPhotosTable.hotelId, hotelId)).orderBy(hotelPhotosTable.displayOrder);
    const reviews = await db.select().from(hotelReviewsTable).where(eq(hotelReviewsTable.hotelId, hotelId)).orderBy(desc(hotelReviewsTable.createdAt));

    res.json({ ...hotel, rooms, policies: policies || null, photos, reviews });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch hotel detail" });
  }
});

// POST /vendor/hotels — create new property
router.post("/hotels", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const {
      name, destinationId, stateId, countryId,
      address, city, pincode, phone, email: hotelEmail, website,
      description, starRating, type, images, amenities, highlights,
      checkInTime, checkOutTime, totalRooms, bookingType, metaTitle, metaDescription,
      // Custom city fallback (when vendor city isn't in CMS)
      customCity, customStateName, customCountryName,
    } = req.body;

    // ── Resolve location slugs from IDs ──────────────────────────────
    let destinationSlug: string | null = null;
    let stateSlug: string | null = null;
    let countrySlug: string | null = null;
    let resolvedStateId = stateId || null;
    let resolvedCountryId = countryId || null;

    if (destinationId) {
      const [dest] = await db.select({
        slug: destinationsTable.slug,
        stateId: destinationsTable.stateId,
        countryId: destinationsTable.countryId,
      }).from(destinationsTable).where(eq(destinationsTable.id, Number(destinationId))).limit(1);

      if (dest) {
        destinationSlug = dest.slug;
        if (dest.stateId && !resolvedStateId) resolvedStateId = dest.stateId;
        if (dest.countryId && !resolvedCountryId) resolvedCountryId = dest.countryId;
      }
    }

    if (resolvedStateId) {
      const [st] = await db.select({ slug: statesTable.slug, countryId: statesTable.countryId })
        .from(statesTable).where(eq(statesTable.id, Number(resolvedStateId))).limit(1);
      if (st) {
        stateSlug = st.slug;
        if (st.countryId && !resolvedCountryId) resolvedCountryId = st.countryId;
      }
    }

    if (resolvedCountryId) {
      const [cn] = await db.select({ slug: countriesTable.slug })
        .from(countriesTable).where(eq(countriesTable.id, Number(resolvedCountryId))).limit(1);
      if (cn) countrySlug = cn.slug;
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString().slice(-6);

    const [newHotel] = await db.insert(hotelsTable).values({
      ownerId,
      destinationId: destinationId ? Number(destinationId) : null,
      stateId: resolvedStateId ? Number(resolvedStateId) : null,
      countryId: resolvedCountryId ? Number(resolvedCountryId) : null,
      destinationSlug,
      stateSlug,
      countrySlug,
      customCity: customCity || null,
      name, slug, address, city, pincode, phone, email: hotelEmail, website,
      description, starRating, type, images, amenities, highlights,
      checkInTime: checkInTime || "14:00",
      checkOutTime: checkOutTime || "12:00",
      totalRooms: totalRooms || 0,
      bookingType: bookingType || "INSTANT",
      metaTitle, metaDescription,
      status: "DRAFT",
    } as any).returning();

    // Create default policies record
    await db.insert(hotelPoliciesTable).values({ hotelId: newHotel.id } as any).onConflictDoNothing();

    // Sync property creation images array to hotelPhotosTable
    if (Array.isArray(images) && images.length > 0) {
      const photoRecords = images
        .filter((url: any) => typeof url === "string" && url.trim().length > 0)
        .map((url: string, index: number) => ({
          hotelId: newHotel.id,
          url: url.trim(),
          caption: index === 0 ? "Main Photo" : `Photo ${index + 1}`,
          category: "EXTERIOR",
          isPrimary: index === 0,
          displayOrder: index,
        }));
      if (photoRecords.length > 0) {
        await db.insert(hotelPhotosTable).values(photoRecords);
      }
    }

    // If vendor entered a custom city not in our CMS, create a pendingCityRequest
    if (customCity) {
      await db.insert(pendingCityRequestsTable as any).values({
        vendorId: ownerId,
        hotelId: newHotel.id,
        cityName: customCity,
        stateName: customStateName || null,
        countryName: customCountryName || null,
        stateId: resolvedStateId ? Number(resolvedStateId) : null,
        countryId: resolvedCountryId ? Number(resolvedCountryId) : null,
        status: "PENDING",
      }).onConflictDoNothing();
    }

    // Clear cached API responses for homepage & list pages
    await clearCachePattern("cache:/api/hotels*");
    await clearCachePattern("cache:/api/ota/home*");

    res.status(201).json(newHotel);
  } catch (error: any) {
    logger.error({ error: error.message }, "Hotel creation error");
    res.status(500).json({ error: "Failed to list property", details: error.message });
  }
});

// PATCH /vendor/hotels/:id — update property details
router.patch("/hotels/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);
    const hotelId = Number(req.params.id);

    const [hotel] = await db.select().from(hotelsTable).where(eq(hotelsTable.id, hotelId)).limit(1);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });
    if (!isAdmin && hotel.ownerId !== ownerId) return res.status(403).json({ error: "Forbidden" });

    const updateData: any = { ...req.body };
    if (!isAdmin) delete updateData.status;
    delete updateData.id; delete updateData.ownerId; delete updateData.slug;
    delete updateData.createdAt; delete updateData.updatedAt;

    // ── Re-resolve geo slugs if location fields changed ─────────────────────
    const hasLocationChange = updateData.destinationId || updateData.stateId || updateData.countryId;
    if (hasLocationChange) {
      let resolvedStateId = updateData.stateId || hotel.stateId;
      let resolvedCountryId = updateData.countryId || hotel.countryId;

      if (updateData.destinationId) {
        const [dest] = await db.select({
          slug: destinationsTable.slug, stateId: destinationsTable.stateId, countryId: destinationsTable.countryId,
        }).from(destinationsTable).where(eq(destinationsTable.id, Number(updateData.destinationId))).limit(1);
        if (dest) {
          updateData.destinationSlug = dest.slug;
          if (dest.stateId) resolvedStateId = dest.stateId;
          if (dest.countryId) resolvedCountryId = dest.countryId;
        }
      }
      if (resolvedStateId) {
        const [st] = await db.select({ slug: statesTable.slug, countryId: statesTable.countryId })
          .from(statesTable).where(eq(statesTable.id, Number(resolvedStateId))).limit(1);
        if (st) {
          updateData.stateSlug = st.slug;
          updateData.stateId = resolvedStateId;
          if (st.countryId) resolvedCountryId = st.countryId;
        }
      }
      if (resolvedCountryId) {
        const [cn] = await db.select({ slug: countriesTable.slug })
          .from(countriesTable).where(eq(countriesTable.id, Number(resolvedCountryId))).limit(1);
        if (cn) { updateData.countrySlug = cn.slug; updateData.countryId = resolvedCountryId; }
      }

      // If vendor added a custom city during update, create pendingCityRequest
      if (updateData.customCity && updateData.customCity !== hotel.customCity) {
        await db.insert(pendingCityRequestsTable as any).values({
          vendorId: ownerId,
          hotelId,
          cityName: updateData.customCity,
          stateName: updateData.customStateName || null,
          countryName: updateData.customCountryName || null,
          stateId: resolvedStateId ? Number(resolvedStateId) : null,
          countryId: resolvedCountryId ? Number(resolvedCountryId) : null,
          status: "PENDING",
        }).onConflictDoNothing();
      }
      // Clean up non-schema fields
      delete updateData.customStateName;
      delete updateData.customCountryName;
    }

    const [updated] = await db.update(hotelsTable)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(hotelsTable.id, hotelId))
      .returning();

    // Clear cached API responses for homepage & list pages
    await clearCachePattern("cache:/api/hotels*");
    await clearCachePattern("cache:/api/ota/home*");

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update hotel" });
  }
});

// POST /vendor/hotels/:id/submit — Submit property for admin approval
router.post("/hotels/:id/submit", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);
    const hotelId = Number(req.params.id);

    const [hotel] = await db.select().from(hotelsTable).where(eq(hotelsTable.id, hotelId)).limit(1);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });
    if (!isAdmin && hotel.ownerId !== ownerId) return res.status(403).json({ error: "Forbidden" });

    // Validate that it meets minimum requirements
    const rooms = await db.select({ id: hotelRoomsTable.id }).from(hotelRoomsTable).where(eq(hotelRoomsTable.hotelId, hotelId));
    if (rooms.length === 0) {
      return res.status(400).json({ error: "You must add at least one room type before submitting." });
    }

    const photos = await db.select({ id: hotelPhotosTable.id }).from(hotelPhotosTable).where(eq(hotelPhotosTable.hotelId, hotelId));
    if (photos.length === 0) {
      return res.status(400).json({ error: "You must add at least one photo before submitting." });
    }

    if (!hotel.city || !hotel.address) {
      return res.status(400).json({ error: "Property address and city are required." });
    }

    const [updated] = await db.update(hotelsTable)
      .set({ status: "PENDING_APPROVAL", updatedAt: new Date() } as any)
      .where(eq(hotelsTable.id, hotelId))
      .returning();

    res.json({ message: "Property submitted for verification successfully", hotel: updated });
  } catch (error: any) {
    logger.error({ error: error.message }, "Submit hotel error");
    res.status(500).json({ error: "Failed to submit hotel for verification" });
  }
});


// DELETE /vendor/hotels/:id — soft delete (set status to DRAFT)
router.delete("/hotels/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);
    const hotelId = Number(req.params.id);

    const [hotel] = await db.select().from(hotelsTable).where(eq(hotelsTable.id, hotelId)).limit(1);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });
    if (!isAdmin && hotel.ownerId !== ownerId) return res.status(403).json({ error: "Forbidden" });

    if (isAdmin) {
      await db.delete(hotelsTable).where(eq(hotelsTable.id, hotelId));
      res.json({ message: "Hotel permanently deleted" });
    } else {
      await db.update(hotelsTable).set({ status: "DRAFT" }).where(eq(hotelsTable.id, hotelId));
      res.json({ message: "Hotel moved to draft" });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete hotel" });
  }
});

// ─────────────────────────────────────────────────────────────
// HOTEL POLICIES
// ─────────────────────────────────────────────────────────────
router.patch("/hotels/:id/policies", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);
    const hotelId = Number(req.params.id);

    const [hotel] = await db.select().from(hotelsTable).where(eq(hotelsTable.id, hotelId)).limit(1);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });
    if (!isAdmin && hotel.ownerId !== ownerId) return res.status(403).json({ error: "Forbidden" });

    const updateData = { ...req.body };
    delete updateData.id; delete updateData.hotelId; delete updateData.createdAt;

    const [existing] = await db.select().from(hotelPoliciesTable).where(eq(hotelPoliciesTable.hotelId, hotelId)).limit(1);

    let result;
    if (existing) {
      [result] = await db.update(hotelPoliciesTable)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(hotelPoliciesTable.hotelId, hotelId))
        .returning();
    } else {
      [result] = await db.insert(hotelPoliciesTable)
        .values({ hotelId, ...updateData } as any)
        .returning();
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update policies" });
  }
});

// ─────────────────────────────────────────────────────────────
// ROOM MANAGEMENT
// ─────────────────────────────────────────────────────────────

// GET /vendor/hotels/:id/rooms
router.get("/hotels/:id/rooms", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rooms = await db.select().from(hotelRoomsTable)
      .where(eq(hotelRoomsTable.hotelId, Number(req.params.id)));
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

// POST /vendor/hotels/:id/rooms — add room type
router.post("/hotels/:id/rooms", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);
    const hotelId = Number(req.params.id);

    const [hotel] = await db.select().from(hotelsTable).where(eq(hotelsTable.id, hotelId)).limit(1);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });
    if (!isAdmin && hotel.ownerId !== ownerId) return res.status(403).json({ error: "Forbidden" });

    // Generate slug
    const roomSlug = req.body.slug || req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const existingRooms = await db.select({ slug: hotelRoomsTable.slug }).from(hotelRoomsTable)
      .where(eq(hotelRoomsTable.hotelId, hotelId));
    const existingSlugs = new Set(existingRooms.map(r => r.slug).filter(Boolean));
    let finalSlug = roomSlug || `room-${Date.now().toString().slice(-4)}`;
    let counter = 2;
    while (existingSlugs.has(finalSlug)) {
      finalSlug = `${roomSlug}-${counter}`;
      counter++;
    }

    const [newRoom] = await db.insert(hotelRoomsTable).values({
      hotelId,
      ...req.body,
      slug: finalSlug,
    } as any).returning();

    // Update hotel total_rooms count
    await db.execute(sql`
      UPDATE hotels SET total_rooms = (SELECT count(*) FROM hotel_rooms WHERE hotel_id = ${hotelId})
      WHERE id = ${hotelId}
    `);

    res.status(201).json(newRoom);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to add room", details: error.message });
  }
});

// PATCH /vendor/hotels/:id/rooms/:roomId
router.patch("/hotels/:id/rooms/:roomId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);
    const hotelId = Number(req.params.id);

    const [hotel] = await db.select().from(hotelsTable).where(eq(hotelsTable.id, hotelId)).limit(1);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });
    if (!isAdmin && hotel.ownerId !== ownerId) return res.status(403).json({ error: "Forbidden" });

    const updateData = { ...req.body };
    delete updateData.id; delete updateData.hotelId;

    if (updateData.name || updateData.slug) {
      const roomSlug = updateData.slug || (updateData.name ? updateData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") : "");
      if (roomSlug) {
        const existingRooms = await db.select({ id: hotelRoomsTable.id, slug: hotelRoomsTable.slug })
          .from(hotelRoomsTable)
          .where(and(eq(hotelRoomsTable.hotelId, hotelId), sql`id != ${Number(req.params.roomId)}`));
        const existingSlugs = new Set(existingRooms.map(r => r.slug).filter(Boolean));
        let finalSlug = roomSlug;
        let counter = 2;
        while (existingSlugs.has(finalSlug)) {
          finalSlug = `${roomSlug}-${counter}`;
          counter++;
        }
        updateData.slug = finalSlug;
      }
    }

    const [updated] = await db.update(hotelRoomsTable)
      .set({ ...updateData, updatedAt: new Date() } as any)
      .where(and(eq(hotelRoomsTable.id, Number(req.params.roomId)), eq(hotelRoomsTable.hotelId, hotelId)))
      .returning();

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update room" });
  }
});

// DELETE /vendor/hotels/:id/rooms/:roomId
router.delete("/hotels/:id/rooms/:roomId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);
    const hotelId = Number(req.params.id);

    const [hotel] = await db.select().from(hotelsTable).where(eq(hotelsTable.id, hotelId)).limit(1);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });
    if (!isAdmin && hotel.ownerId !== ownerId) return res.status(403).json({ error: "Forbidden" });

    await db.delete(hotelRoomsTable)
      .where(and(eq(hotelRoomsTable.id, Number(req.params.roomId)), eq(hotelRoomsTable.hotelId, hotelId)));

    // Update hotel total_rooms count
    await db.execute(sql`
      UPDATE hotels SET total_rooms = (SELECT count(*) FROM hotel_rooms WHERE hotel_id = ${hotelId})
      WHERE id = ${hotelId}
    `);

    res.json({ message: "Room deleted" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete room" });
  }
});

// ─────────────────────────────────────────────────────────────
// INVENTORY CALENDAR (Rate & Availability Management)
// ─────────────────────────────────────────────────────────────

// GET /vendor/hotels/:id/inventory?roomId=&startDate=&endDate=
router.get("/hotels/:id/inventory", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);
    const hotelId = Number(req.params.id);
    const { roomId, startDate, endDate } = req.query;

    const [hotel] = await db.select().from(hotelsTable).where(eq(hotelsTable.id, hotelId)).limit(1);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });
    if (!isAdmin && hotel.ownerId !== ownerId) return res.status(403).json({ error: "Forbidden" });

    const conditions = [eq(hotelRoomInventoryTable.hotelId, hotelId)];
    if (roomId) conditions.push(eq(hotelRoomInventoryTable.roomId, Number(roomId)));
    if (startDate) conditions.push(gte(hotelRoomInventoryTable.date, startDate as string));
    if (endDate) conditions.push(lte(hotelRoomInventoryTable.date, endDate as string));

    const inventory = await db.select().from(hotelRoomInventoryTable)
      .where(and(...conditions))
      .orderBy(hotelRoomInventoryTable.date);

    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

// POST /vendor/hotels/:id/inventory — bulk upsert inventory by date range
router.post("/hotels/:id/inventory", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);
    const hotelId = Number(req.params.id);

    const [hotel] = await db.select().from(hotelsTable).where(eq(hotelsTable.id, hotelId)).limit(1);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });
    if (!isAdmin && hotel.ownerId !== ownerId) return res.status(403).json({ error: "Forbidden" });

    const { roomId, startDate, endDate, availableCount, priceOverride, isBlocked, discountType, discountPercent, discountFlat, customPricing } = req.body;

    if (!roomId || !startDate || !endDate) {
      return res.status(400).json({ error: "roomId, startDate, endDate are required" });
    }

    const [room] = await db.select().from(hotelRoomsTable)
      .where(eq(hotelRoomsTable.id, Number(roomId)))
      .limit(1);
    if (!room) return res.status(404).json({ error: "Room type not found" });

    // Fetch existing records for this room type and date range to merge partial updates
    const existingRecords = await db.select().from(hotelRoomInventoryTable)
      .where(and(
        eq(hotelRoomInventoryTable.roomId, Number(roomId)),
        gte(hotelRoomInventoryTable.date, startDate as string),
        lte(hotelRoomInventoryTable.date, endDate as string)
      ));

    // Generate date range and merge values
    const start = new Date(startDate);
    const end = new Date(endDate);
    const records: any[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const dateStr = cursor.toISOString().split("T")[0];
      const existing = existingRecords.find(r => r.date.split("T")[0] === dateStr);

      const finalAvailableCount = availableCount !== undefined
        ? (availableCount === null ? room.totalRooms : Number(availableCount))
        : (existing ? Number(existing.availableCount) : room.totalRooms);

      const finalIsBlocked = isBlocked !== undefined
        ? Boolean(isBlocked)
        : (existing ? Boolean(existing.isBlocked) : false);

      const finalPriceOverride = priceOverride !== undefined
        ? (priceOverride === null || priceOverride === "" ? null : Number(priceOverride))
        : (existing ? existing.priceOverride : null);

      const finalDiscountType = discountType !== undefined
        ? discountType
        : (existing ? existing.discountType : room.discountType || 'PERCENT');

      const finalDiscountPercent = discountPercent !== undefined
        ? Number(discountPercent)
        : (existing ? Number(existing.discountPercent) : Number(room.discountPercent || 0));

      const finalDiscountFlat = discountFlat !== undefined
        ? Number(discountFlat)
        : (existing ? Number(existing.discountFlat) : Number(room.discountFlat || 0));

      const finalCustomPricing = customPricing !== undefined
        ? (customPricing === null ? null : (typeof customPricing === 'string' ? customPricing : JSON.stringify(customPricing)))
        : (existing ? existing.customPricing : null);

      records.push({
        roomId: Number(roomId),
        hotelId,
        date: dateStr,
        availableCount: finalAvailableCount,
        priceOverride: finalPriceOverride,
        isBlocked: finalIsBlocked,
        discountType: finalDiscountType,
        discountPercent: finalDiscountPercent,
        discountFlat: finalDiscountFlat,
        customPricing: finalCustomPricing,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    // Upsert each record
    for (const record of records) {
      await db.execute(sql`
        INSERT INTO hotel_room_inventory (room_id, hotel_id, date, available_count, price_override, is_blocked, discount_type, discount_percent, discount_flat, custom_pricing, updated_at)
        VALUES (${record.roomId}, ${record.hotelId}, ${record.date}, ${record.availableCount}, ${record.priceOverride}, ${record.isBlocked}, ${record.discountType}, ${record.discountPercent}, ${record.discountFlat}, ${record.customPricing}, NOW())
        ON CONFLICT (room_id, date) DO UPDATE SET
          available_count = EXCLUDED.available_count,
          price_override = EXCLUDED.price_override,
          is_blocked = EXCLUDED.is_blocked,
          discount_type = EXCLUDED.discount_type,
          discount_percent = EXCLUDED.discount_percent,
          discount_flat = EXCLUDED.discount_flat,
          custom_pricing = EXCLUDED.custom_pricing,
          updated_at = NOW()
      `);
    }

    res.json({ message: `Updated inventory for ${records.length} dates` });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update inventory", details: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PHOTOS MANAGEMENT
// ─────────────────────────────────────────────────────────────

router.get("/hotels/:id/photos", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const photos = await db.select().from(hotelPhotosTable)
      .where(eq(hotelPhotosTable.hotelId, Number(req.params.id)))
      .orderBy(hotelPhotosTable.displayOrder);
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch photos" });
  }
});

router.post("/hotels/:id/photos", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);
    const hotelId = Number(req.params.id);

    const [hotel] = await db.select().from(hotelsTable).where(eq(hotelsTable.id, hotelId)).limit(1);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });
    if (!isAdmin && hotel.ownerId !== ownerId) return res.status(403).json({ error: "Forbidden" });

    const { url, caption, category, roomId, isPrimary, displayOrder } = req.body;

    if (isPrimary) {
      // Unset other primary photos for this hotel
      await db.execute(sql`UPDATE hotel_photos SET is_primary = false WHERE hotel_id = ${hotelId}`);
    }

    const [photo] = await db.insert(hotelPhotosTable).values({
      hotelId, url, caption, category: category || "EXTERIOR",
      roomId: roomId || null,
      isPrimary: isPrimary || false,
      displayOrder: displayOrder || 0,
    } as any).returning();

    // Sync primary image to hotel.images array
    if (isPrimary) {
      await db.execute(sql`
        UPDATE hotels SET images = ARRAY[${url}] || COALESCE(images, '{}') WHERE id = ${hotelId}
      `);
    }

    res.status(201).json(photo);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to add photo", details: error.message });
  }
});

router.delete("/hotels/:id/photos/:photoId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);
    const hotelId = Number(req.params.id);

    const [hotel] = await db.select().from(hotelsTable).where(eq(hotelsTable.id, hotelId)).limit(1);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });
    if (!isAdmin && hotel.ownerId !== ownerId) return res.status(403).json({ error: "Forbidden" });

    await db.delete(hotelPhotosTable)
      .where(and(eq(hotelPhotosTable.id, Number(req.params.photoId)), eq(hotelPhotosTable.hotelId, hotelId)));

    res.json({ message: "Photo deleted" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete photo" });
  }
});

// ─────────────────────────────────────────────────────────────
// BOOKING MANAGEMENT
// ─────────────────────────────────────────────────────────────

router.get("/hotels/:id/bookings", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);
    const hotelId = Number(req.params.id);

    const [hotel] = await db.select().from(hotelsTable).where(eq(hotelsTable.id, hotelId)).limit(1);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });
    if (!isAdmin && hotel.ownerId !== ownerId) return res.status(403).json({ error: "Forbidden" });

    const bookings = await db
      .select({
        booking: bookingsTable,
        guestName: usersTable.name,
        guestEmail: usersTable.email,
        guestPhone: usersTable.phoneNumber,
      })
      .from(bookingsTable)
      .leftJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
      .where(and(eq(bookingsTable.hotelId, hotelId), eq(bookingsTable.bookingType, "HOTEL")))
      .orderBy(desc(bookingsTable.createdAt));

    res.json(bookings.map(b => ({
      ...b.booking,
      guestName: b.guestName,
      guestEmail: b.guestEmail,
      guestPhone: b.guestPhone,
      checkInDate: (b.booking.paymentDetails as any)?.checkInDate || b.booking.travelDate,
      checkOutDate: (b.booking.paymentDetails as any)?.checkOutDate || new Date(new Date(b.booking.travelDate).getTime() + 86400000).toISOString().split("T")[0],
      checkIn: (b.booking.paymentDetails as any)?.checkInDate || (b.booking.travelDate ? new Date(b.booking.travelDate).toISOString().split("T")[0] : null),
      checkOut: (b.booking.paymentDetails as any)?.checkOutDate || new Date(new Date(b.booking.travelDate).getTime() + 86400000).toISOString().split("T")[0],
    })));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// Vendor confirms or rejects a REQUEST-type booking
router.patch("/hotels/:id/bookings/:bookingId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);
    const hotelId = Number(req.params.id);

    const [hotel] = await db.select().from(hotelsTable).where(eq(hotelsTable.id, hotelId)).limit(1);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });
    if (!isAdmin && hotel.ownerId !== ownerId) return res.status(403).json({ error: "Forbidden" });

    const { status } = req.body; // 'CONFIRMED' | 'CANCELLED'
    if (!["CONFIRMED", "CANCELLED"].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Use CONFIRMED or CANCELLED." });
    }

    const [updated] = await db.update(bookingsTable)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(bookingsTable.id, Number(req.params.bookingId)), eq(bookingsTable.hotelId, hotelId)))
      .returning();

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update booking" });
  }
});

// ─────────────────────────────────────────────────────────────
// REVIEWS MANAGEMENT
// ─────────────────────────────────────────────────────────────

router.get("/hotels/:id/reviews", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hotelId = Number(req.params.id);
    const reviews = await db
      .select({ review: hotelReviewsTable, guestName: usersTable.name })
      .from(hotelReviewsTable)
      .leftJoin(usersTable, eq(hotelReviewsTable.userId, usersTable.id))
      .where(eq(hotelReviewsTable.hotelId, hotelId))
      .orderBy(desc(hotelReviewsTable.createdAt));

    res.json(reviews.map(r => ({ ...r.review, guestName: r.guestName })));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// Vendor replies to a review
router.patch("/hotels/:id/reviews/:reviewId/reply", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);
    const hotelId = Number(req.params.id);

    const [hotel] = await db.select().from(hotelsTable).where(eq(hotelsTable.id, hotelId)).limit(1);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });
    if (!isAdmin && hotel.ownerId !== ownerId) return res.status(403).json({ error: "Forbidden" });

    const [updated] = await db.update(hotelReviewsTable)
      .set({ vendorReply: req.body.reply, vendorRepliedAt: new Date() } as any)
      .where(and(eq(hotelReviewsTable.id, Number(req.params.reviewId)), eq(hotelReviewsTable.hotelId, hotelId)))
      .returning();

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to save reply" });
  }
});

// ─────────────────────────────────────────────────────────────
// LEADS (all bookings + inquiries for vendor)
// ─────────────────────────────────────────────────────────────
router.get("/leads", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;

    const bookings = await db.select().from(bookingsTable)
      .where(eq(bookingsTable.vendorId, ownerId))
      .orderBy(desc(bookingsTable.createdAt));

    const inquiries = await db.select().from(inquiriesTable)
      .where(eq(inquiriesTable.vendorId, ownerId))
      .orderBy(desc(inquiriesTable.createdAt));

    res.json({ bookings, inquiries });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// ─────────────────────────────────────────────────────────────
// TRANSPORT MANAGEMENT (unchanged)
// ─────────────────────────────────────────────────────────────
router.get("/transport", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);
    const conditions = isAdmin ? [] : [eq(transportServicesTable.ownerId, ownerId)];
    const results = await db.select().from(transportServicesTable).where(and(...conditions));
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transport fleets" });
  }
});

router.post("/transport", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const { name, type, capacity, pricePerDay, features, images, description, vehicleModel } = req.body;
    const slug = name.toLowerCase().replace(/ /g, "-") + "-" + Date.now().toString().slice(-4);
    const [newTransport] = await db.insert(transportServicesTable).values({
      ownerId,
      name,
      slug,
      type,
      capacity: Number(capacity) || 0,
      basePrice: pricePerDay ? parseFloat(pricePerDay) : null,
      features,
      imageUrl: images?.[0] || null,
      description,
      vehicleModel,
      status: "PENDING"
    } as any).returning();
    res.status(201).json(newTransport);
  } catch (error) {
    logger.error({ error }, "Transport creation error");
    res.status(500).json({ error: "Failed to list transport" });
  }
});


// ─────────────────────────────────────────────────────────────
// GET /vendor/hotel-bookings — All bookings for vendor's hotels
// ─────────────────────────────────────────────────────────────
router.get("/hotel-bookings", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;

    const bookings = await db
      .select({
        id: bookingsTable.id,
        status: bookingsTable.status,
        paymentStatus: bookingsTable.paymentStatus,
        travelDate: bookingsTable.travelDate,
        totalAmount: bookingsTable.totalAmount,
        specialRequests: bookingsTable.specialRequests,
        travelersCount: bookingsTable.travelersCount,
        createdAt: bookingsTable.createdAt,
        paymentDetails: bookingsTable.paymentDetails,
        // Hotel info
        hotelName: hotelsTable.name,
        hotelSlug: hotelsTable.slug,
        hotelCity: hotelsTable.city,
        // Room info
        roomName: hotelRoomsTable.name,
        roomType: hotelRoomsTable.type,
        // Guest info
        guestName: usersTable.name,
        guestEmail: usersTable.email,
        guestPhone: usersTable.phoneNumber,
      })
      .from(bookingsTable)
      .leftJoin(hotelsTable, eq(bookingsTable.hotelId, hotelsTable.id))
      .leftJoin(hotelRoomsTable, eq(bookingsTable.roomId, hotelRoomsTable.id))
      .leftJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
      .where(and(eq(bookingsTable.vendorId, ownerId), eq(bookingsTable.bookingType, "HOTEL")))
      .orderBy(desc(bookingsTable.createdAt))
      .limit(200);

    res.json(bookings.map(b => ({
      ...b,
      checkInDate: (b.paymentDetails as any)?.checkInDate || b.travelDate,
      checkOutDate: (b.paymentDetails as any)?.checkOutDate || new Date(new Date(b.travelDate).getTime() + 86400000).toISOString().split("T")[0],
      checkIn: (b.paymentDetails as any)?.checkInDate || (b.travelDate ? new Date(b.travelDate).toISOString().split("T")[0] : null),
      checkOut: (b.paymentDetails as any)?.checkOutDate || new Date(new Date(b.travelDate).getTime() + 86400000).toISOString().split("T")[0],
    })));
  } catch (error: any) {
    logger.error({ error: error.message }, "Vendor hotel bookings error");
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /vendor/bookings/:id/status — Confirm / Decline / Complete booking
// ─────────────────────────────────────────────────────────────
router.patch("/bookings/:id/status", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const bookingId = Number(req.params.id);
    const { status } = req.body;

    const ALLOWED = ["CONFIRMED", "CANCELLED", "COMPLETED"];
    if (!ALLOWED.includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be CONFIRMED, CANCELLED, or COMPLETED" });
    }

    // Verify booking belongs to this vendor
    const [booking] = await db.select({ id: bookingsTable.id, vendorId: bookingsTable.vendorId })
      .from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);

    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (booking.vendorId !== ownerId) return res.status(403).json({ error: "Access denied" });

    const [updated] = await db
      .update(bookingsTable)
      .set({ status, updatedAt: new Date() } as any)
      .where(eq(bookingsTable.id, bookingId))
      .returning();

    res.json(updated);
  } catch (error: any) {
    logger.error({ error: error.message }, "Booking status update error");
    res.status(500).json({ error: "Failed to update booking status" });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /vendor/revenue — Financial summary and transaction ledger
// ─────────────────────────────────────────────────────────────
router.get("/revenue", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;

    // Fetch all confirmed/completed hotel bookings to build the financial report
    const bookings = await db
      .select({
        id: bookingsTable.id,
        status: bookingsTable.status,
        paymentStatus: bookingsTable.paymentStatus,
        travelDate: bookingsTable.travelDate,
        totalAmount: bookingsTable.totalAmount,
        createdAt: bookingsTable.createdAt,
        paymentDetails: bookingsTable.paymentDetails,
        hotelName: hotelsTable.name,
      })
      .from(bookingsTable)
      .leftJoin(hotelsTable, eq(bookingsTable.hotelId, hotelsTable.id))
      .where(
        and(
          eq(bookingsTable.vendorId, ownerId),
          eq(bookingsTable.bookingType, "HOTEL"),
          inArray(bookingsTable.status, ["CONFIRMED", "COMPLETED"])
        )
      )
      .orderBy(desc(bookingsTable.createdAt));

    const grossEarnings = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const commission = grossEarnings * 0.15;
    const netShare = grossEarnings * 0.85;

    const settledAmount = bookings
      .filter(b => b.status === "COMPLETED")
      .reduce((sum, b) => sum + (b.totalAmount || 0) * 0.85, 0);

    const pendingAmount = bookings
      .filter(b => b.status === "CONFIRMED")
      .reduce((sum, b) => sum + (b.totalAmount || 0) * 0.85, 0);

    // Build list of transactions with commission breakdowns
    const transactions = bookings.map(b => {
      const bGross = b.totalAmount || 0;
      const bComm = bGross * 0.15;
      const bNet = bGross * 0.85;
      return {
        bookingId: b.id,
        hotelName: b.hotelName || "Hotel Booking",
        date: b.travelDate ? new Date(b.travelDate).toISOString().split("T")[0] : null,
        grossAmount: bGross,
        commission: bComm,
        netAmount: bNet,
        status: b.status,
      };
    });

    // Generate dynamic/mock payout records for visual accountability
    const payouts = [];
    if (settledAmount > 0) {
      payouts.push({
        referenceId: "PAY-SH-" + (10000 + ownerId * 100 + 1),
        date: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
        amount: settledAmount,
        status: "PAID",
        channel: "Bank Transfer",
      });
    }
    if (pendingAmount > 0) {
      payouts.push({
        referenceId: "PAY-SH-" + (10000 + ownerId * 100 + 2),
        date: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
        amount: pendingAmount,
        status: "PROCESSING",
        channel: "Bank Transfer",
      });
    }

    res.json({
      summary: {
        grossEarnings,
        commission,
        netShare,
        settledAmount,
        pendingAmount,
      },
      transactions,
      payouts,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Vendor revenue stats error");
    res.status(500).json({ error: "Failed to fetch revenue accountability data" });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /vendor/profile — Update vendor profile details
// ─────────────────────────────────────────────────────────────
router.patch("/profile", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const { name, phoneNumber, vendorBusinessName, vendorBusinessAddress, companyName, gstNumber } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Name is required" });
    }

    const [updated] = await db
      .update(usersTable)
      .set({
        name: name.trim(),
        phoneNumber: phoneNumber?.trim() || null,
        vendorBusinessName: vendorBusinessName?.trim() || null,
        vendorBusinessAddress: vendorBusinessAddress?.trim() || null,
        companyName: companyName?.trim() || null,
        gstNumber: gstNumber?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, ownerId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Vendor user not found" });
    }

    const { passwordHash, ...safe } = updated;
    res.json(safe);
  } catch (error: any) {
    logger.error({ error: error.message }, "Vendor profile update error");
    res.status(500).json({ error: "Failed to update profile details" });
  }
});
// VENDOR CHAT SUPPORT PORTAL ENDPOINTS
// ─────────────────────────────────────────────────────────────

// GET /vendor/conversations — Fetch chats assigned to this vendor
router.get("/conversations", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vendorId = req.user!.id;
    const convos = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.assignedVendorId, vendorId))
      .orderBy(desc(conversationsTable.lastMessageAt));

    const result = await Promise.all(convos.map(async (c) => {
      const [lastMsg] = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.conversationId, c.id))
        .orderBy(desc(messagesTable.createdAt))
        .limit(1);

      const [unread] = await db
        .select({ count: sql<number>`count(*)` })
        .from(messagesTable)
        .where(and(eq(messagesTable.conversationId, c.id), eq(messagesTable.isRead, false), eq(messagesTable.senderRole, 'USER')));

      return {
        ...c,
        lastMessage: lastMsg?.content || "",
        lastMessageRole: lastMsg?.senderRole || "",
        unreadCount: Number(unread?.count || 0),
      };
    }));

    res.json(result);
  } catch (error: any) {
    logger.error({ error: error.message }, "Vendor conversations error");
    res.status(500).json({ error: "Failed to fetch vendor conversations" });
  }
});

// GET /vendor/conversations/:id/messages — Fetch message history
router.get("/conversations/:id/messages", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vendorId = req.user!.id;
    const convId = Number(req.params.id);

    // Security check: ensure chat is assigned to this vendor
    const [conv] = await db.select().from(conversationsTable)
      .where(and(eq(conversationsTable.id, convId), eq(conversationsTable.assignedVendorId, vendorId)))
      .limit(1);

    if (!conv) {
      return res.status(403).json({ error: "Conversation not assigned to this vendor" });
    }

    const msgs = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, convId))
      .orderBy(asc(messagesTable.createdAt));

    // Mark user messages as read
    await db
      .update(messagesTable)
      .set({ isRead: true })
      .where(and(eq(messagesTable.conversationId, convId), eq(messagesTable.senderRole, 'USER')));

    res.json(msgs);
  } catch (error: any) {
    logger.error({ error: error.message }, "Vendor messages error");
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// POST /vendor/conversations/:id/messages — Vendor posts a reply to client
router.post("/conversations/:id/messages", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vendorId = req.user!.id;
    const convId = Number(req.params.id);
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Message text is required" });
    }

    // Security check
    const [conv] = await db.select().from(conversationsTable)
      .where(and(eq(conversationsTable.id, convId), eq(conversationsTable.assignedVendorId, vendorId)))
      .limit(1);

    if (!conv) {
      return res.status(403).json({ error: "Conversation not assigned to this vendor" });
    }

    const [savedMsg] = await db.insert(messagesTable).values({
      conversationId: convId,
      senderId: vendorId,
      senderRole: "AGENT",
      content: text.trim(),
    }).returning();

    await db.update(conversationsTable)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversationsTable.id, convId));

    res.status(201).json(savedMsg);
  } catch (error: any) {
    logger.error({ error: error.message }, "Vendor send message error");
    res.status(500).json({ error: "Failed to send vendor message" });
  }
});

export default router;

