import { Router, Response } from "express";
import { db, hotelsTable, hotelRoomsTable, transportServicesTable, bookingsTable, inquiriesTable, destinationsTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { authenticate, authorize, AuthenticatedRequest } from "../middleware/auth";
import { logger } from "../lib/logger";

const router = Router();

// BASE MIDDLEWARE: All routes here require being a Vendor or Admin
router.use(authenticate);
router.use(authorize(["HOTEL_OWNER", "TRANSPORTER", "ADMIN", "SUPERADMIN"]));

// 1. HOTEL MANAGEMENT
router.get("/hotels", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    // Admins see all, Vendors see only theirs
    const conditions = req.user!.role.includes("ADMIN") 
      ? [] 
      : [eq(hotelsTable.ownerId, ownerId)];
    
    const results = await db.select().from(hotelsTable).where(and(...conditions));
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch hotels" });
  }
});

router.post("/hotels", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const { name, destinationId, address, description, starRating, type, images, amenities } = req.body;
    
    // Sluggify name
    const slug = name.toLowerCase().replace(/ /g, "-") + "-" + Date.now().toString().slice(-4);
    
    // Fallback if destinationId is missing (professional discovery requires a destination)
    let finalDestId = destinationId;
    if (!finalDestId) {
      const [firstDest] = await db.select().from(destinationsTable).limit(1);
      finalDestId = firstDest?.id || 1;
    }

    const [newHotel] = await db.insert(hotelsTable).values({
      ownerId,
      destinationId: finalDestId,
      name,
      slug,
      address,
      description,
      starRating,
      type,
      images,
      amenities,
      status: "PENDING"
    }).returning();
    
    res.status(201).json(newHotel);
  } catch (error: any) {
    logger.error({ error: error.message }, "Hotel creation error details");
    res.status(500).json({ error: "Failed to list property", details: error.message });
  }
});

// 2. TRANSPORT MANAGEMENT
router.get("/transport", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const conditions = req.user!.role.includes("ADMIN") 
      ? [] 
      : [eq(transportServicesTable.ownerId, ownerId)];
      
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
      capacity,
      pricePerDay,
      features,
      imageUrl: images?.[0] || null,
      description,
      vehicleModel,
      status: "PENDING"
    }).returning();
    
    res.status(201).json(newTransport);
  } catch (error) {
    logger.error({ error }, "Transport creation error");
    res.status(500).json({ error: "Failed to list transport" });
  }
});

// 3. BOOKINGS & INQUIRIES LEADS
router.get("/leads", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    
    // Scoped queries for current vendor
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

// 4. STATS for Vendor Dashboard
router.get("/stats", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    
    const [bookingCount] = await db.select({ count: sql<number>`count(*)` })
      .from(bookingsTable).where(eq(bookingsTable.vendorId, ownerId));
      
    const [inquiryCount] = await db.select({ count: sql<number>`count(*)` })
      .from(inquiriesTable).where(eq(inquiriesTable.vendorId, ownerId));
      
    const [earnings] = await db.select({ sum: sql<number>`sum(${bookingsTable.totalAmount})` })
      .from(bookingsTable)
      .where(and(eq(bookingsTable.vendorId, ownerId), eq(bookingsTable.status, 'CONFIRMED')));
      
    res.json({
      totalBookings: Number(bookingCount.count),
      totalInquiries: Number(inquiryCount.count),
      payoutPending: Number(earnings?.sum || 0),
      payoutSettled: 0
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
