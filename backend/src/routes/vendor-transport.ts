import { Router, Response } from "express";
import {
  db, transportVendorsTable, transportVehiclesTable, transportDriversTable,
  transportAvailabilityTable, transportPricingRulesTable, transportBookingsTable,
  transportReviewsTable, usersTable, destinationsTable, statesTable, countriesTable,
} from "@workspace/db";
import { eq, and, desc, sql, asc } from "drizzle-orm";
import { authenticate, authorize, AuthenticatedRequest } from "../middleware/auth";
import { logger } from "../lib/logger";

const router = Router();

// All vendor-transport routes require authentication
router.use(authenticate);
router.use(authorize(["TRANSPORTER", "ADMIN", "SUPERADMIN"]));

// ─────────────────────────────────────────────────────────────────────────────
// VENDOR PROFILE / ONBOARDING
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/vendor/transport/profile
router.get("/profile", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const [vendor] = await db
      .select()
      .from(transportVendorsTable)
      .where(eq(transportVendorsTable.userId, userId))
      .limit(1);
    res.json(vendor || null);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch vendor profile" });
  }
});

// POST /api/vendor/transport/profile  — create or update transport vendor profile
router.post("/profile", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);

    const {
      businessName, businessType, phone, alternatePhone, email, website,
      address, city, state, pincode,
      gstNumber, panNumber,
      gstCertificateUrl, panCardUrl, businessRegistrationUrl, addressProofUrl,
      operatingSince, operatingCities, vehicleTypes,
      bankAccountName, bankAccountNumber, bankIfscCode, bankName,
      logoUrl, description,
    } = req.body;

    const existing = await db
      .select()
      .from(transportVendorsTable)
      .where(eq(transportVendorsTable.userId, userId))
      .limit(1);

    const data: any = {
      userId, businessName, businessType,
      phone, alternatePhone, email, website,
      address, city, state, pincode,
      gstNumber, panNumber,
      gstCertificateUrl, panCardUrl, businessRegistrationUrl, addressProofUrl,
      operatingSince, operatingCities, vehicleTypes,
      bankAccountName, bankAccountNumber, bankIfscCode, bankName,
      logoUrl, description,
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      const [updated] = await db
        .update(transportVendorsTable)
        .set(data)
        .where(eq(transportVendorsTable.userId, userId))
        .returning();

      // Also update users table vendor fields
      await db.update(usersTable).set({
        vendorBusinessName: businessName,
        vendorBusinessAddress: address,
      }).where(eq(usersTable.id, userId));

      return res.json(updated);
    }

    // New vendor — set to PENDING for admin approval
    const [newVendor] = await db
      .insert(transportVendorsTable)
      .values({ ...data, status: isAdmin ? "APPROVED" : "PENDING" })
      .returning();

    // Update user role to TRANSPORTER if not already
    await db.update(usersTable).set({
      role: "TRANSPORTER",
      vendorBusinessName: businessName,
      vendorBusinessAddress: address,
    }).where(eq(usersTable.id, userId));

    res.status(201).json(newVendor);
  } catch (error: any) {
    logger.error({ error: error.message }, "Vendor profile error");
    res.status(500).json({ error: "Failed to save vendor profile", details: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// VENDOR DASHBOARD STATS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/vendor/transport/dashboard
router.get("/dashboard", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);

    const vendorCondition = isAdmin ? sql`1=1` : sql`vendor_id = (SELECT id FROM transport_vendors WHERE user_id = ${ownerId} LIMIT 1)`;
    const ownerCondition = isAdmin ? sql`1=1` : sql`owner_id = ${ownerId}`;

    const totalVehicles = await db.execute(sql`SELECT COUNT(*) AS count FROM transport_vehicles WHERE ${ownerCondition}`) as any;
    const approvedVehicles = await db.execute(sql`SELECT COUNT(*) AS count FROM transport_vehicles WHERE ${ownerCondition} AND status = 'APPROVED'`) as any;
    const totalBookings = await db.execute(sql`SELECT COUNT(*) AS count FROM transport_bookings WHERE ${vendorCondition}`) as any;
    const pendingBookings = await db.execute(sql`SELECT COUNT(*) AS count FROM transport_bookings WHERE ${vendorCondition} AND status = 'PENDING'`) as any;
    const totalRevenue = await db.execute(sql`SELECT COALESCE(SUM(vendor_earning), 0) AS sum FROM transport_bookings WHERE ${vendorCondition} AND status = 'CONFIRMED'`) as any;
    const monthRevenue = await db.execute(sql`
      SELECT COALESCE(SUM(vendor_earning), 0) AS sum FROM transport_bookings 
      WHERE ${vendorCondition} AND status = 'CONFIRMED' 
      AND created_at >= date_trunc('month', CURRENT_DATE)
    `) as any;

    const recentBookings = await db.execute(sql`
      SELECT tb.*, tv.name AS vehicle_name, tv.type AS vehicle_type,
             u.name AS customer_name, u.email AS customer_email
      FROM transport_bookings tb
      LEFT JOIN transport_vehicles tv ON tb.vehicle_id = tv.id
      LEFT JOIN users u ON tb.user_id = u.id
      WHERE ${vendorCondition}
      ORDER BY tb.created_at DESC LIMIT 5
    `);

    res.json({
      totalVehicles: Number(totalVehicles.rows[0]?.count || 0),
      approvedVehicles: Number(approvedVehicles.rows[0]?.count || 0),
      totalBookings: Number(totalBookings.rows[0]?.count || 0),
      pendingBookings: Number(pendingBookings.rows[0]?.count || 0),
      totalRevenue: Number(totalRevenue.rows[0]?.sum || 0),
      monthRevenue: Number(monthRevenue.rows[0]?.sum || 0),
      recentBookings: recentBookings.rows,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Transport dashboard error");
    res.status(500).json({ error: "Failed to fetch dashboard" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// VEHICLE MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/vendor/transport/vehicles
router.get("/vehicles", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);

    const vehicles = await db.execute(sql`
      SELECT
        tv.*,
        u.name AS owner_name, u.email AS owner_email,
        u.vendor_business_name,
        COALESCE(d.name, tv.custom_city) AS city_name,
        COALESCE(r.avg_rating, 0) AS avg_rating,
        COALESCE(r.review_count, 0) AS review_count,
        COALESCE(b.booking_count, 0) AS booking_count
      FROM transport_vehicles tv
      LEFT JOIN users u ON tv.owner_id = u.id
      LEFT JOIN destinations d ON tv.destination_id = d.id
      LEFT JOIN (
        SELECT vehicle_id, ROUND(AVG(rating)::numeric,1) AS avg_rating, COUNT(*) AS review_count
        FROM transport_reviews WHERE admin_approved = true GROUP BY vehicle_id
      ) r ON r.vehicle_id = tv.id
      LEFT JOIN (
        SELECT vehicle_id, COUNT(*) AS booking_count
        FROM transport_bookings WHERE status != 'CANCELLED' GROUP BY vehicle_id
      ) b ON b.vehicle_id = tv.id
      WHERE ${isAdmin ? sql`1=1` : sql`tv.owner_id = ${ownerId}`}
      ORDER BY tv.created_at DESC
    `);

    res.json(vehicles.rows);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch vehicles" });
  }
});

// GET /api/vendor/transport/vehicles/:id
router.get("/vehicles/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);
    const vehicleId = Number(req.params.id);

    const [vehicle] = await db
      .select()
      .from(transportVehiclesTable)
      .where(eq(transportVehiclesTable.id, vehicleId))
      .limit(1);

    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
    if (!isAdmin && vehicle.ownerId !== ownerId) return res.status(403).json({ error: "Forbidden" });

    const drivers = await db.select().from(transportDriversTable).where(eq(transportDriversTable.vehicleId, vehicleId));
    const pricing = await db.select().from(transportPricingRulesTable).where(eq(transportPricingRulesTable.vehicleId, vehicleId)).orderBy(asc(transportPricingRulesTable.displayOrder));
    const availability = await db.select().from(transportAvailabilityTable).where(eq(transportAvailabilityTable.vehicleId, vehicleId));

    res.json({ ...vehicle, drivers, pricing, availability });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch vehicle" });
  }
});

// POST /api/vendor/transport/vehicles — Register a new vehicle
router.post("/vehicles", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);

    // Resolve vendor profile
    const [vendor] = await db
      .select()
      .from(transportVendorsTable)
      .where(eq(transportVendorsTable.userId, ownerId))
      .limit(1);

    if (!vendor && !isAdmin) {
      return res.status(400).json({ error: "Please complete your vendor profile first" });
    }

    const {
      name, type, subType, description,
      make, model, year, color, registrationNumber,
      seatingCapacity, luggageCapacity, fuelType, transmission,
      isAC, features, images, documents, conditionReport,
      bookingType, basePricePerKm, basePricePerDay, minimumKm,
      waitingChargePerHour, driverAllowancePerDay, nightChargePercent,
      maxPassengers, advanceBookingHours,
      destinationId, stateId, countryId, customCity,
      metaTitle, metaDescription,
    } = req.body;

    if (!name || !type || !make || !model || !seatingCapacity) {
      return res.status(400).json({ error: "Missing required fields: name, type, make, model, seatingCapacity" });
    }

    // Resolve geo slugs (same pattern as hotels)
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
      if (st) { stateSlug = st.slug; if (st.countryId && !resolvedCountryId) resolvedCountryId = st.countryId; }
    }
    if (resolvedCountryId) {
      const [cn] = await db.select({ slug: countriesTable.slug })
        .from(countriesTable).where(eq(countriesTable.id, Number(resolvedCountryId))).limit(1);
      if (cn) countrySlug = cn.slug;
    }

    const cityLabel = destinationSlug || customCity?.toLowerCase().replace(/\s+/g, "-") || "india";
    const slug = `${make.toLowerCase()}-${model.toLowerCase()}-${cityLabel}-${Date.now().toString().slice(-6)}`.replace(/[^a-z0-9-]/g, "-");

    const minPrice = basePricePerDay || basePricePerKm
      ? Math.min(basePricePerDay || 99999, basePricePerKm ? (basePricePerKm * (minimumKm || 50)) : 99999)
      : 0;

    const [vehicle] = await db.insert(transportVehiclesTable).values({
      vendorId: vendor?.id || 0,
      ownerId,
      destinationId: destinationId ? Number(destinationId) : null,
      stateId: resolvedStateId ? Number(resolvedStateId) : null,
      countryId: resolvedCountryId ? Number(resolvedCountryId) : null,
      destinationSlug, stateSlug, countrySlug,
      customCity: customCity || null,
      name, slug, type, subType, description,
      make, model, year, color, registrationNumber,
      seatingCapacity, luggageCapacity, fuelType, transmission,
      isAC: isAC !== undefined ? isAC : true,
      features, images, documents: documents || {}, conditionReport: conditionReport || {},
      bookingType: bookingType || "INSTANT",
      basePricePerKm, basePricePerDay, minimumKm,
      waitingChargePerHour, driverAllowancePerDay, nightChargePercent,
      maxPassengers: maxPassengers || seatingCapacity,
      advanceBookingHours: advanceBookingHours || 24,
      minPrice,
      metaTitle, metaDescription,
      status: isAdmin ? "APPROVED" : "PENDING",
    } as any).returning();

    res.status(201).json(vehicle);
  } catch (error: any) {
    logger.error({ error: error.message }, "Vehicle create error");
    res.status(500).json({ error: "Failed to register vehicle", details: error.message });
  }
});

// PATCH /api/vendor/transport/vehicles/:id — Update vehicle
router.patch("/vehicles/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);
    const vehicleId = Number(req.params.id);

    const [vehicle] = await db.select().from(transportVehiclesTable).where(eq(transportVehiclesTable.id, vehicleId)).limit(1);
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
    if (!isAdmin && vehicle.ownerId !== ownerId) return res.status(403).json({ error: "Forbidden" });

    const updateData: any = { ...req.body, updatedAt: new Date() };
    // Vendors cannot change status, slug, or ownership
    if (!isAdmin) { delete updateData.status; delete updateData.adminNote; }
    delete updateData.id; delete updateData.ownerId; delete updateData.vendorId;
    delete updateData.slug; delete updateData.createdAt;

    // Recalculate minPrice if pricing changed
    if (updateData.basePricePerDay || updateData.basePricePerKm) {
      const day = updateData.basePricePerDay || vehicle.basePricePerDay || 99999;
      const km = updateData.basePricePerKm ? updateData.basePricePerKm * (vehicle.minimumKm || 50) : 99999;
      updateData.minPrice = Math.min(day, km);
    }

    const [updated] = await db
      .update(transportVehiclesTable)
      .set(updateData)
      .where(eq(transportVehiclesTable.id, vehicleId))
      .returning();

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update vehicle" });
  }
});

// DELETE /api/vendor/transport/vehicles/:id — Soft delete (set to DRAFT)
router.delete("/vehicles/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);
    const vehicleId = Number(req.params.id);

    const [vehicle] = await db.select().from(transportVehiclesTable).where(eq(transportVehiclesTable.id, vehicleId)).limit(1);
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
    if (!isAdmin && vehicle.ownerId !== ownerId) return res.status(403).json({ error: "Forbidden" });

    await db.update(transportVehiclesTable)
      .set({ status: "DRAFT" } as any)
      .where(eq(transportVehiclesTable.id, vehicleId));

    res.json({ message: "Vehicle delisted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete vehicle" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DRIVER MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/vendor/transport/vehicles/:id/drivers
router.get("/vehicles/:id/drivers", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);
    const vehicleId = Number(req.params.id);

    const [vehicle] = await db.select({ ownerId: transportVehiclesTable.ownerId }).from(transportVehiclesTable).where(eq(transportVehiclesTable.id, vehicleId)).limit(1);
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
    if (!isAdmin && vehicle.ownerId !== ownerId) return res.status(403).json({ error: "Forbidden" });

    const drivers = await db.select().from(transportDriversTable).where(eq(transportDriversTable.vehicleId, vehicleId));
    res.json(drivers);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

// POST /api/vendor/transport/vehicles/:id/drivers — Add driver to vehicle
router.post("/vehicles/:id/drivers", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);
    const vehicleId = Number(req.params.id);

    const [vehicle] = await db.select().from(transportVehiclesTable).where(eq(transportVehiclesTable.id, vehicleId)).limit(1);
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
    if (!isAdmin && vehicle.ownerId !== ownerId) return res.status(403).json({ error: "Forbidden" });

    const {
      name, phone, alternatePhone, photoUrl,
      licenseNumber, licenseExpiry, licenseUrl,
      experienceYears, languagesKnown,
    } = req.body;

    if (!name || !phone || !licenseNumber) {
      return res.status(400).json({ error: "Name, phone, and license number are required" });
    }

    const [driver] = await db.insert(transportDriversTable).values({
      vehicleId,
      vendorId: vehicle.vendorId,
      name, phone, alternatePhone, photoUrl,
      licenseNumber, licenseExpiry, licenseUrl,
      experienceYears, languagesKnown,
    } as any).returning();

    res.status(201).json(driver);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to add driver" });
  }
});

// PATCH /api/vendor/transport/drivers/:driverId
router.patch("/drivers/:driverId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);
    const driverId = Number(req.params.driverId);

    const [driver] = await db.select().from(transportDriversTable).where(eq(transportDriversTable.id, driverId)).limit(1);
    if (!driver) return res.status(404).json({ error: "Driver not found" });

    const [vehicle] = await db.select({ ownerId: transportVehiclesTable.ownerId }).from(transportVehiclesTable).where(eq(transportVehiclesTable.id, driver.vehicleId)).limit(1);
    if (!isAdmin && vehicle?.ownerId !== ownerId) return res.status(403).json({ error: "Forbidden" });

    const updateData: any = { ...req.body, updatedAt: new Date() };
    delete updateData.id; delete updateData.vehicleId; delete updateData.vendorId;

    // Only admin can verify a driver
    if (!isAdmin) delete updateData.isVerified;

    const [updated] = await db.update(transportDriversTable).set(updateData).where(eq(transportDriversTable.id, driverId)).returning();
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update driver" });
  }
});

// DELETE /api/vendor/transport/drivers/:driverId
router.delete("/drivers/:driverId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);
    const driverId = Number(req.params.driverId);

    const [driver] = await db.select().from(transportDriversTable).where(eq(transportDriversTable.id, driverId)).limit(1);
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    const [vehicle] = await db.select({ ownerId: transportVehiclesTable.ownerId }).from(transportVehiclesTable).where(eq(transportVehiclesTable.id, driver.vehicleId)).limit(1);
    if (!isAdmin && vehicle?.ownerId !== ownerId) return res.status(403).json({ error: "Forbidden" });

    await db.delete(transportDriversTable).where(eq(transportDriversTable.id, driverId));
    res.json({ message: "Driver removed" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to remove driver" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// AVAILABILITY MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/vendor/transport/vehicles/:id/availability
router.get("/vehicles/:id/availability", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vehicleId = Number(req.params.id);
    const blocks = await db.select().from(transportAvailabilityTable)
      .where(eq(transportAvailabilityTable.vehicleId, vehicleId))
      .orderBy(asc(transportAvailabilityTable.startDate));
    res.json(blocks);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch availability" });
  }
});

// POST /api/vendor/transport/vehicles/:id/availability — Block dates
router.post("/vehicles/:id/availability", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);
    const vehicleId = Number(req.params.id);

    const [vehicle] = await db.select().from(transportVehiclesTable).where(eq(transportVehiclesTable.id, vehicleId)).limit(1);
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
    if (!isAdmin && vehicle.ownerId !== ownerId) return res.status(403).json({ error: "Forbidden" });

    const { startDate, endDate, status = "BLOCKED", reason } = req.body;
    if (!startDate || !endDate) return res.status(400).json({ error: "startDate and endDate required" });

    const [block] = await db.insert(transportAvailabilityTable).values({
      vehicleId,
      vendorId: vehicle.vendorId,
      startDate, endDate, status, reason,
    } as any).returning();

    res.status(201).json(block);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to block dates" });
  }
});

// DELETE /api/vendor/transport/availability/:blockId — Unblock dates
router.delete("/availability/:blockId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const blockId = Number(req.params.blockId);
    await db.delete(transportAvailabilityTable).where(eq(transportAvailabilityTable.id, blockId));
    res.json({ message: "Availability block removed" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to remove block" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PRICING RULES MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/vendor/transport/vehicles/:id/pricing
router.get("/vehicles/:id/pricing", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vehicleId = Number(req.params.id);
    const rules = await db.select().from(transportPricingRulesTable)
      .where(eq(transportPricingRulesTable.vehicleId, vehicleId))
      .orderBy(asc(transportPricingRulesTable.displayOrder));
    res.json(rules);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch pricing rules" });
  }
});

// POST /api/vendor/transport/vehicles/:id/pricing — Add pricing rule
router.post("/vehicles/:id/pricing", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);
    const vehicleId = Number(req.params.id);

    const [vehicle] = await db.select().from(transportVehiclesTable).where(eq(transportVehiclesTable.id, vehicleId)).limit(1);
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
    if (!isAdmin && vehicle.ownerId !== ownerId) return res.status(403).json({ error: "Forbidden" });

    const {
      name, ruleType, fromCity, toCity, estimatedDistanceKm,
      startDate, endDate, price, priceType,
      isRoundTrip, roundTripPrice, includes, excludes,
    } = req.body;

    if (!name || !ruleType || !price) {
      return res.status(400).json({ error: "name, ruleType, and price are required" });
    }

    const [rule] = await db.insert(transportPricingRulesTable).values({
      vehicleId,
      vendorId: vehicle.vendorId,
      name, ruleType, fromCity, toCity, estimatedDistanceKm,
      startDate, endDate, price, priceType: priceType || "FIXED",
      isRoundTrip: isRoundTrip || false,
      roundTripPrice, includes, excludes,
    } as any).returning();

    res.status(201).json(rule);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to add pricing rule" });
  }
});

// PATCH /api/vendor/transport/pricing/:ruleId
router.patch("/pricing/:ruleId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ruleId = Number(req.params.ruleId);
    const updateData: any = { ...req.body, updatedAt: new Date() };
    delete updateData.id; delete updateData.vehicleId; delete updateData.vendorId;

    const [updated] = await db.update(transportPricingRulesTable).set(updateData).where(eq(transportPricingRulesTable.id, ruleId)).returning();
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update pricing rule" });
  }
});

// DELETE /api/vendor/transport/pricing/:ruleId
router.delete("/pricing/:ruleId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    await db.delete(transportPricingRulesTable).where(eq(transportPricingRulesTable.id, Number(req.params.ruleId)));
    res.json({ message: "Pricing rule deleted" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete pricing rule" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// BOOKINGS MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/vendor/transport/bookings
router.get("/bookings", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);
    const { status } = req.query;

    const vendorCondition = isAdmin
      ? sql`1=1`
      : sql`tb.vendor_id = (SELECT id FROM transport_vendors WHERE user_id = ${ownerId} LIMIT 1)`;

    const statusCondition = status ? sql`AND tb.status = ${status as string}` : sql``;

    const bookings = await db.execute(sql`
      SELECT
        tb.*,
        tv.name AS vehicle_name, tv.type AS vehicle_type, tv.make, tv.model,
        tv.images AS vehicle_images,
        u.name AS customer_name, u.email AS customer_email, u.phone_number AS customer_phone,
        td.name AS driver_name, td.phone AS driver_phone
      FROM transport_bookings tb
      LEFT JOIN transport_vehicles tv ON tb.vehicle_id = tv.id
      LEFT JOIN users u ON tb.user_id = u.id
      LEFT JOIN transport_drivers td ON tb.driver_id = td.id
      WHERE ${vendorCondition} ${statusCondition}
      ORDER BY tb.created_at DESC
    `);

    res.json(bookings.rows);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// PATCH /api/vendor/transport/bookings/:id — Confirm / Cancel / Complete
router.patch("/bookings/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(req.user!.role);
    const bookingId = Number(req.params.id);
    const { status, driverId, vendorNote, cancelledReason } = req.body;

    const bookingResult = await db.execute(sql`
      SELECT tb.*, tv.owner_id FROM transport_bookings tb
      LEFT JOIN transport_vehicles tv ON tb.vehicle_id = tv.id
      WHERE tb.id = ${bookingId} LIMIT 1
    `) as any;

    const b = bookingResult?.rows?.[0];
    if (!b) return res.status(404).json({ error: "Booking not found" });
    if (!isAdmin && b.owner_id !== ownerId) return res.status(403).json({ error: "Forbidden" });

    const updateData: any = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (driverId) updateData.driverId = driverId;
    if (vendorNote) updateData.vendorNote = vendorNote;
    if (cancelledReason) updateData.cancelledReason = cancelledReason;

    // When confirming, block those dates in availability
    if (status === "CONFIRMED" && b.pickup_date) {
      await db.execute(sql`
        INSERT INTO transport_availability (vehicle_id, vendor_id, start_date, end_date, status, reason)
        VALUES (${b.vehicle_id}, ${b.vendor_id}, ${b.pickup_date}, ${b.return_date || b.pickup_date}, 'BOOKED', 'Booking ${bookingId}')
        ON CONFLICT DO NOTHING
      `);
    }

    const updatedResult = await db.execute(sql`
      UPDATE transport_bookings SET ${sql.raw(
        Object.entries(updateData).map(([k, v]) => `${k.replace(/([A-Z])/g, '_$1').toLowerCase()} = '${v}'`).join(', ')
      )} WHERE id = ${bookingId} RETURNING *
    `) as any;

    res.json(updatedResult.rows[0]);
  } catch (error: any) {
    logger.error({ error: error.message }, "Booking update error");
    res.status(500).json({ error: "Failed to update booking" });
  }
});

export default router;
