import { Router, Request, Response } from "express";
import { db, usersTable, rewardTransactionsTable, settingsTable, hotelsTable, hotelRoomsTable, hotelPoliciesTable, transportServicesTable, transportVendorsTable, transportVehiclesTable, transportRoutesTable, packagesTable, countriesTable, statesTable, destinationsTable, homePageSlidesTable, homePageCategoriesTable, homePageSectionsTable, offersTable, conversationsTable, messagesTable, attractionsTable, activitiesTable, diningPointsTable, travelGuidesTable, regionsTable, pendingCityRequestsTable, inquiriesTable, bookingsTable, chatAgentsTable, chatNotesTable, chatBlocklistTable } from "@workspace/db";
import { eq, desc, sql, or, and, asc, inArray } from "drizzle-orm";
import { authenticate, authorize, AuthenticatedRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/permissions";
import { logger } from "../lib/logger";
import { notifyVendorOfApproval, notifyVendorOfVerification } from "../lib/notifications";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { clearCachePattern } from "../lib/cache";
import { syncPackage, deleteMongoPackage, syncDestination, deleteMongoDestination, syncHomeConfig, syncPackageCalendar } from "../lib/mongoSync";
import { seedHimachalTransport } from "../lib/seedHimachalTransport";
import { packageCalendarInventoryTable, packagePriceHistoryTable } from "@workspace/db";

// ─── Local slug generator (no external dep) ─────────────────────────────────
const slugify = (str: string): string =>
  str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// ─── Safe array coercer for text[] Drizzle columns ──────────────────────────
// Ensures the value passed to a text[].array() column is always a proper array.
// Drizzle crashes with "value.map is not a function" if a string/null is passed.
const toStringArray = (val: any, separator = ","): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  if (typeof val === "string") return val.split(separator).map((s) => s.trim()).filter(Boolean);
  return [];
};


const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable is required");

// ─────────────────────────────────────────────────────────────
// PUBLIC: Seed Admin
// ─────────────────────────────────────────────────────────────
router.post("/auth/seed-admin", async (req, res) => {
  // Protect with a server-side secret — only allow in non-production or with correct header
  const seedSecret = process.env.SEED_ADMIN_SECRET;
  if (seedSecret && req.headers["x-seed-secret"] !== seedSecret) {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPass = process.env.ADMIN_PASS;
    if (!adminEmail || !adminPass) {
      return res.status(400).json({ error: "ADMIN_EMAIL and ADMIN_PASS environment variables are not set on backend" });
    }
    const passwordHash = await bcrypt.hash(adminPass, 10);
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail)).limit(1);
    
    if (existing.length > 0) {
      await db.update(usersTable).set({ passwordHash, role: "SUPERADMIN", name: "admin" }).where(eq(usersTable.id, existing[0].id));
      res.json({ message: "Admin user updated." });
    } else {
      await db.insert(usersTable).values({
        name: "admin",
        email: adminEmail,
        passwordHash,
        role: "SUPERADMIN",
        referralCode: "SUPERADMIN_1",
        vendorVerified: true,
      });
      res.json({ message: "Admin user created." });
    }
  } catch(e) {
    res.status(500).json({ error: e });
  }
});

// ─────────────────────────────────────────────────────────────
// PUBLIC: Admin / Staff Login
// ─────────────────────────────────────────────────────────────
router.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const [user] = await db
      .select()
      .from(usersTable)
      .where(or(eq(usersTable.email, username), eq(usersTable.name, username)))
      .limit(1);

    // Allowed roles for admin panel access:
    // - SUPERADMIN: Full access to everything
    // - ADMIN: Access controlled by adminPermissions JSON
    // - AGENT (with SUPPORT permission): Only Support page + their assigned chats
    const ALLOWED_ROLES = ["ADMIN", "SUPERADMIN", "AGENT"];
    if (!user || !ALLOWED_ROLES.includes(user.role)) {
      return res.status(401).json({ error: "Access denied. You are not authorized to access this panel." });
    }

    // For AGENT role, verify they have SUPPORT permission
    if (user.role === "AGENT") {
      const perms: string[] = JSON.parse(user.adminPermissions || '[]');
      if (!perms.includes("SUPPORT") && !perms.includes("ALL")) {
        return res.status(401).json({ error: "Access denied. No support permissions assigned." });
      }
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    // Embed permissions into the JWT so middleware can read them without a DB hit
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        adminPermissions: user.adminPermissions || JSON.stringify(["ALL"]),
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      id: user.id,
      username: user.name,
      email: user.email,
      role: user.role,
      permissions: JSON.parse(user.adminPermissions || '["ALL"]'),
      token,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Admin login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────
// All routes below require authentication
// ─────────────────────────────────────────────────────────────
router.use(authenticate);
router.use(authorize(["ADMIN", "SUPERADMIN", "AGENT"]));

// GET /admin/me — current admin profile
router.get("/me", async (req: AuthenticatedRequest, res) => {
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.id))
      .limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });
    const { passwordHash, ...safe } = user;
    res.json(safe);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch admin profile" });
  }
});

// ─────────────────────────────────────────────────────────────
// USER & AGENT MANAGEMENT  (requires USERS permission)
// ─────────────────────────────────────────────────────────────
router.get("/users", requirePermission("USERS"), async (req, res) => {
  try {
    const list = await db
      .select()
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt));
    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.patch("/users/:id", requirePermission("USERS"), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { role, badge, pointsBalance, name, adminPermissions, vendorVerified } = req.body;

    const [currentUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, Number(id)))
      .limit(1);

    if (pointsBalance !== undefined && pointsBalance !== currentUser.pointsBalance) {
      const diff = pointsBalance - (currentUser.pointsBalance || 0);
      await db.insert(rewardTransactionsTable).values({
        userId: Number(id),
        amount: Math.abs(diff),
        type: diff > 0 ? "BONUS" : "REDEEMED",
        description: `Manual adjustment by admin: ${req.user!.email}`,
      });
    }

    const [updated] = await db
      .update(usersTable)
      .set({
        role,
        badge,
        pointsBalance,
        name,
        vendorVerified: vendorVerified !== undefined ? vendorVerified : currentUser.vendorVerified,
        adminPermissions: adminPermissions ? JSON.stringify(adminPermissions) : currentUser.adminPermissions,
      })
      .where(eq(usersTable.id, Number(id)))
      .returning();

    if (vendorVerified === true && currentUser.vendorVerified !== true) {
      await notifyVendorOfVerification(currentUser.email, updated.name);
    }

    res.json(updated);
  } catch (e: any) {
    logger.error({ error: e.message }, "Admin user update error");
    res.status(500).json({ error: "Failed to update user" });
  }
});

// DELETE /admin/users/:id — delete user account and associated properties (e.g. for rejected vendors)
router.delete("/users/:id", requirePermission("USERS"), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = Number(id);

    // Find all hotels owned by this vendor
    const userHotels = await db.select({ id: hotelsTable.id }).from(hotelsTable).where(eq(hotelsTable.ownerId, userId));
    const hotelIds = userHotels.map(h => h.id);

    if (hotelIds.length > 0) {
      // Delete rooms for these hotels
      await db.delete(hotelRoomsTable).where(inArray(hotelRoomsTable.hotelId, hotelIds));
      // Delete hotels
      await db.delete(hotelsTable).where(eq(hotelsTable.ownerId, userId));
    }

    // Delete user
    await db.delete(usersTable).where(eq(usersTable.id, userId));

    // Clear caches
    await clearCachePattern("cache:/api/hotels*");
    await clearCachePattern("cache:/api/ota/home*");

    res.json({ message: "User and associated properties deleted successfully" });
  } catch (e: any) {
    logger.error({ error: e.message }, "Admin user delete error");
    res.status(500).json({ error: "Failed to delete user: " + e.message });
  }
});

// ─────────────────────────────────────────────────────────────
// STAFF MANAGEMENT  (SUPERADMIN only — creates/manages sub-admins)
// ─────────────────────────────────────────────────────────────
router.post("/staff", async (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== "SUPERADMIN") {
    return res.status(403).json({ error: "Only SUPERADMIN can create staff accounts" });
  }
  try {
    const { name, email, password, permissions, role } = req.body;
    const referralCode = "STAFF" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const passwordHash = await bcrypt.hash(password || "Staff@1234", 12);
    const assignedRole = role === "SUPERADMIN" ? "SUPERADMIN" : "ADMIN";

    const [staff] = await db
      .insert(usersTable)
      .values({
        name,
        email,
        passwordHash,
        role: assignedRole,
        referralCode,
        adminPermissions: assignedRole === "SUPERADMIN" ? JSON.stringify(["ALL"]) : JSON.stringify(permissions || []),
        isFirstLogin: false,
      })
      .returning();

    const { passwordHash: _, ...safe } = staff;
    res.status(201).json(safe);
  } catch (e: any) {
    logger.error({ error: e.message }, "Staff creation error");
    res.status(500).json({ error: "Failed to create staff account" });
  }
});

router.get("/staff", async (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== "SUPERADMIN") {
    return res.status(403).json({ error: "Only SUPERADMIN can view all staff" });
  }
  try {
    const staff = await db
      .select()
      .from(usersTable)
      .where(or(eq(usersTable.role, "ADMIN"), eq(usersTable.role, "SUPERADMIN")))
      .orderBy(desc(usersTable.createdAt));
    res.json(staff.map(({ passwordHash, ...s }) => s));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch staff" });
  }
});

// ─────────────────────────────────────────────────────────────
// SYSTEM SETTINGS  (SUPERADMIN only)
// ─────────────────────────────────────────────────────────────
router.get("/settings", requirePermission("SETTINGS"), async (req, res) => {
  try {
    const settings = await db.select().from(settingsTable);
    res.json(settings);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.post("/settings", requirePermission("SETTINGS"), async (req, res) => {
  try {
    const { settings } = req.body;
    for (const item of settings) {
      await db
        .insert(settingsTable)
        .values({ key: item.key, value: item.value })
        .onConflictDoUpdate({
          target: settingsTable.key,
          set: { value: item.value, updatedAt: new Date() },
        });
    }
    const updatedSettings = await db.select().from(settingsTable);
    res.json({ message: "Settings updated successfully", settings: updatedSettings });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// ─────────────────────────────────────────────────────────────
// INQUIRIES MANAGEMENT
// ─────────────────────────────────────────────────────────────
router.get("/inquiries", requirePermission("USERS"), async (req, res) => {
  try {
    const list = await db
      .select()
      .from(inquiriesTable)
      .orderBy(desc(inquiriesTable.createdAt));
    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch inquiries" });
  }
});

router.patch("/inquiries/:id", requirePermission("USERS"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, message } = req.body;
    const [updated] = await db
      .update(inquiriesTable)
      .set({
        status,
        ...(message !== undefined ? { message } : {}),
      })
      .where(eq(inquiriesTable.id, Number(id)))
      .returning();
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update inquiry" });
  }
});

router.delete("/inquiries/:id", requirePermission("USERS"), async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(inquiriesTable).where(eq(inquiriesTable.id, Number(id)));
    res.json({ message: "Inquiry deleted successfully" });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete inquiry" });
  }
});

// ─────────────────────────────────────────────────────────────
// FINANCIAL OVERSIGHT  (FINANCE permission)
// ─────────────────────────────────────────────────────────────
router.get("/ledger", requirePermission("FINANCE"), async (req, res) => {
  try {
    const ledger = await db
      .select()
      .from(rewardTransactionsTable)
      .orderBy(desc(rewardTransactionsTable.createdAt));
    res.json(ledger);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch reward ledger" });
  }
});

// ─────────────────────────────────────────────────────────────
// OTA APPROVAL ENGINE
// ─────────────────────────────────────────────────────────────

// GET /admin/approvals/hotels
router.get("/approvals/hotels", requirePermission("PACKAGES"), async (req, res) => {
  try {
    const list = await db.select().from(hotelsTable).where(eq(hotelsTable.status, "PENDING_APPROVAL"));
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch pending hotels" });
  }
});

// PATCH /admin/approvals/hotels/:id
router.patch("/approvals/hotels/:id", requirePermission("PACKAGES"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'APPROVED' or 'REJECTED'
    const [updated] = await db.update(hotelsTable).set({ status }).where(eq(hotelsTable.id, Number(id))).returning();
    
  // Invalidate hotels cache so new properties show up immediately
    await clearCachePattern("cache:/api/hotels*");
    
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: "Failed to update hotel status" });
  }
});

// GET /admin/approvals/transport
router.get("/approvals/transport", requirePermission("TRANSPORT"), async (req, res) => {
  try {
    const list = await db.select().from(transportServicesTable).where(eq(transportServicesTable.status, "PENDING"));
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch pending transport" });
  }
});

// PATCH /admin/approvals/transport/:id
router.patch("/approvals/transport/:id", requirePermission("TRANSPORT"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const [updated] = await db.update(transportServicesTable).set({ status }).where(eq(transportServicesTable.id, Number(id))).returning();
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: "Failed to update transport status" });
  }
});

// ─────────────────────────────────────────────────────────────
// TRANSPORT VENDORS — List, Approve, Reject
// ─────────────────────────────────────────────────────────────

// GET /admin/transport-vendors
router.get("/transport-vendors", requirePermission("TRANSPORT"), async (req, res) => {
  try {
    const list = await db
      .select({
        id: transportVendorsTable.id,
        userId: transportVendorsTable.userId,
        businessName: transportVendorsTable.businessName,
        businessType: transportVendorsTable.businessType,
        phone: transportVendorsTable.phone,
        email: transportVendorsTable.email,
        city: transportVendorsTable.city,
        state: transportVendorsTable.state,
        status: transportVendorsTable.status,
        commissionPct: transportVendorsTable.commissionPct,
        adminNote: transportVendorsTable.adminNote,
        approvedAt: transportVendorsTable.approvedAt,
        createdAt: transportVendorsTable.createdAt,
        ownerName: usersTable.name,
        ownerEmail: usersTable.email,
      })
      .from(transportVendorsTable)
      .leftJoin(usersTable, eq(transportVendorsTable.userId, usersTable.id))
      .orderBy(desc(transportVendorsTable.createdAt));
    res.json(list);
  } catch (e: any) {
    logger.error({ error: e.message }, "Failed to fetch transport vendors");
    res.status(500).json({ error: "Failed to fetch transport vendors" });
  }
});

// PATCH /admin/transport-vendors/:id  — approve / reject / suspend
router.patch("/transport-vendors/:id", requirePermission("TRANSPORT"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote, commissionPct } = req.body;
    const updateData: any = { status, updatedAt: new Date() };
    if (adminNote !== undefined) updateData.adminNote = adminNote;
    if (commissionPct !== undefined) updateData.commissionPct = commissionPct;
    if (status === "APPROVED") updateData.approvedAt = new Date();
    const [updated] = await db
      .update(transportVendorsTable)
      .set(updateData)
      .where(eq(transportVendorsTable.id, Number(id)))
      .returning();
    // Also update vendorVerified on the user record
    if (status === "APPROVED") {
      await db.update(usersTable).set({ vendorVerified: true }).where(eq(usersTable.id, updated.userId));
    } else if (status === "REJECTED" || status === "SUSPENDED") {
      await db.update(usersTable).set({ vendorVerified: false }).where(eq(usersTable.id, updated.userId));
    }
    await clearCachePattern("cache:/api/transport*");
    res.json(updated);
  } catch (e: any) {
    logger.error({ error: e.message }, "Failed to update transport vendor");
    res.status(500).json({ error: "Failed to update transport vendor" });
  }
});

// ─────────────────────────────────────────────────────────────
// TRANSPORT VEHICLES — List, Approve, Reject (new OTA system)
// ─────────────────────────────────────────────────────────────

// GET /admin/transport-vehicles
router.get("/transport-vehicles", requirePermission("TRANSPORT"), async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const list = await db.execute(sql`
      SELECT tv.*, u.name AS owner_name, u.email AS owner_email,
             u.vendor_business_name, tv2.business_name AS vendor_business_name_full,
             COALESCE(d.name, tv.custom_city) AS city_name
      FROM transport_vehicles tv
      LEFT JOIN users u ON tv.owner_id = u.id
      LEFT JOIN transport_vendors tv2 ON tv.vendor_id = tv2.id
      LEFT JOIN destinations d ON tv.destination_id = d.id
      ${status ? sql`WHERE tv.status = ${status}` : sql``}
      ORDER BY tv.created_at DESC
    `);
    res.json(list.rows);
  } catch (e: any) {
    logger.error({ error: e.message }, "Failed to fetch transport vehicles");
    res.status(500).json({ error: "Failed to fetch transport vehicles" });
  }
});

// PATCH /admin/transport-vehicles/:id  — approve / reject
router.patch("/transport-vehicles/:id", requirePermission("TRANSPORT"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote, isFeatured } = req.body;
    const updateData: any = { status, updatedAt: new Date() };
    if (adminNote !== undefined) updateData.adminNote = adminNote;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    const [updated] = await db
      .update(transportVehiclesTable)
      .set(updateData)
      .where(eq(transportVehiclesTable.id, Number(id)))
      .returning();
    await clearCachePattern("cache:/api/transport*");
    res.json(updated);
  } catch (e: any) {
    logger.error({ error: e.message }, "Failed to update transport vehicle");
    res.status(500).json({ error: "Failed to update transport vehicle" });
  }
});

// ─────────────────────────────────────────────────────────────
// SEED: Demo Himachal Transport Vendors
// POST /admin/seed-himachal-transport
// ─────────────────────────────────────────────────────────────
router.post("/seed-himachal-transport", async (req: any, res: any) => {
  const seedSecret = process.env.SEED_ADMIN_SECRET;
  if (seedSecret && req.headers["x-seed-secret"] !== seedSecret) {
    return res.status(403).json({ error: "Forbidden: invalid seed secret" });
  }
  try {
    logger.info("Starting Himachal transport demo seed...");
    const results = await seedHimachalTransport();
    await clearCachePattern("cache:/api/transport*");
    res.json({
      success: true,
      message: "Demo transport vendors and vehicles seeded for Himachal Pradesh.",
      credentials: results.map(r => ({
        city: r.city,
        email: r.email,
        password: r.password,
        loginUrl: "/transport-partner",
        vehicleCount: r.vehicles.length,
        vehicles: r.vehicles.map((v: any) => v.name),
      }))
    });
  } catch (err: any) {
    logger.error({ err: err.message }, "Himachal transport seed failed");
    res.status(500).json({ error: "Seed failed: " + err.message });
  }
});

// POST /admin/transport/routes — create a standard fixed route
router.post("/transport/routes", requirePermission("TRANSPORT"), async (req, res) => {
  try {
    const { from, to, distance, estimatedTime, startingPrice, isPopular } = req.body;
    if (!from || !to || !startingPrice) {
      return res.status(400).json({ error: "From, To, and Starting Price are required" });
    }

    const fromSlug = from.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const toSlug = to.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const [inserted] = await db
      .insert(transportRoutesTable)
      .values({
        from,
        to,
        fromSlug,
        toSlug,
        distance: Number(distance || 0),
        estimatedTime: estimatedTime || "1h",
        startingPrice: Number(startingPrice),
        isPopular: !!isPopular,
      })
      .returning();

    await clearCachePattern("cache:/api/transport*");
    res.json(inserted);
  } catch (e: any) {
    logger.error({ error: e.message }, "Failed to create transport route");
    res.status(500).json({ error: "Failed to create transport route" });
  }
});

// ─────────────────────────────────────────────────────────────
// PACKAGE MANAGEMENT
// ─────────────────────────────────────────────────────────────

// GET /admin/packages
router.get("/packages", requirePermission("PACKAGES"), async (req, res) => {
  try {
    const list = await db.select().from(packagesTable).orderBy(desc(packagesTable.createdAt));
    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch packages" });
  }
});

// POST /admin/packages
router.post("/packages", requirePermission("PACKAGES"), async (req, res) => {
  try {
    const data = { ...req.body };
    // Basic slug generation if not provided
    if (!data.slug && data.name) {
      data.slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    }
    if (data.cities) data.cities = toStringArray(data.cities);
    if (data.highlights) data.highlights = toStringArray(data.highlights);
    if (data.inclusions) data.inclusions = toStringArray(data.inclusions);
    if (data.exclusions) data.exclusions = toStringArray(data.exclusions);
    if (data.importantNotes) data.importantNotes = toStringArray(data.importantNotes);
    if (data.inclusionIcons) data.inclusionIcons = toStringArray(data.inclusionIcons);
    if (data.galleryImages) data.galleryImages = toStringArray(data.galleryImages);
    if (data.monthsToTravel) data.monthsToTravel = toStringArray(data.monthsToTravel);
    if (Array.isArray(data.destinationIds)) data.destinationIds = data.destinationIds.map(Number).filter(Boolean);
    if (Array.isArray(data.stateIds)) data.stateIds = data.stateIds.map(Number).filter(Boolean);
    if (Array.isArray(data.countryIds)) data.countryIds = data.countryIds.map(Number).filter(Boolean);
    if (data.childWithBedPrice !== undefined) data.childWithBedPrice = Number(data.childWithBedPrice) || 0;
    if (data.childWithoutBedPrice !== undefined) data.childWithoutBedPrice = Number(data.childWithoutBedPrice) || 0;
    if (data.infantPrice !== undefined) data.infantPrice = Number(data.infantPrice) || 0;
    const [inserted] = await db.insert(packagesTable).values(data).returning();

    // Generate unique package code using ID
    const generatedCode = "SH-" + (inserted.category ? inserted.category.slice(0, 3).toUpperCase() : "PKG") + "-" + String(inserted.id).padStart(4, "0");
    const [updatedWithCode] = await db
      .update(packagesTable)
      .set({ packageCode: data.packageCode || generatedCode })
      .where(eq(packagesTable.id, inserted.id))
      .returning();

    clearCachePattern("cache:/api/packages*");
    clearCachePattern("cache:/api/destinations/resolve-slug*");
    clearCachePattern("cache:/api/ota/home/config*");
    // ⚡ Fire-and-forget: sync to MongoDB in background (non-blocking)
    syncPackage(updatedWithCode.id);
    syncHomeConfig();
    res.status(201).json(updatedWithCode);
  } catch (e: any) {
    logger.error({ error: e.message }, "Package creation error");
    res.status(500).json({ error: "Failed to create package: " + e.message });
  }
});

// GET /admin/packages/:id
router.get("/packages/:id", requirePermission("PACKAGES"), async (req, res) => {
  try {
    const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, Number(req.params.id))).limit(1);
    if (!pkg) return res.status(404).json({ error: "Package not found" });
    res.json(pkg);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch package" });
  }
});

// PATCH /admin/packages/:id
router.patch("/packages/:id", requirePermission("PACKAGES"), async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    if (data.cities) data.cities = toStringArray(data.cities);
    if (data.highlights) data.highlights = toStringArray(data.highlights);
    if (data.inclusions) data.inclusions = toStringArray(data.inclusions);
    if (data.exclusions) data.exclusions = toStringArray(data.exclusions);
    if (data.importantNotes) data.importantNotes = toStringArray(data.importantNotes);
    if (data.inclusionIcons) data.inclusionIcons = toStringArray(data.inclusionIcons);
    if (data.galleryImages) data.galleryImages = toStringArray(data.galleryImages);
    if (data.monthsToTravel) data.monthsToTravel = toStringArray(data.monthsToTravel);
    if (Array.isArray(data.destinationIds)) data.destinationIds = data.destinationIds.map(Number).filter(Boolean);
    if (Array.isArray(data.stateIds)) data.stateIds = data.stateIds.map(Number).filter(Boolean);
    if (Array.isArray(data.countryIds)) data.countryIds = data.countryIds.map(Number).filter(Boolean);
    if (data.childWithBedPrice !== undefined) data.childWithBedPrice = Number(data.childWithBedPrice) || 0;
    if (data.childWithoutBedPrice !== undefined) data.childWithoutBedPrice = Number(data.childWithoutBedPrice) || 0;
    if (data.infantPrice !== undefined) data.infantPrice = Number(data.infantPrice) || 0;

    const [updated] = await db
      .update(packagesTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(packagesTable.id, Number(id)))
      .returning();
    clearCachePattern("cache:/api/packages*");
    clearCachePattern("cache:/api/destinations/resolve-slug*");
    clearCachePattern("cache:/api/ota/home/config*");
    // ⚡ Fire-and-forget: sync updated package to MongoDB
    syncPackage(Number(id));
    syncHomeConfig();
    res.json(updated);
  } catch (e: any) {
    logger.error({ error: e.message }, "Package update error");
    res.status(500).json({ error: "Failed to update package" });
  }
});

// DELETE /admin/packages/:id
router.delete("/packages/:id", requirePermission("PACKAGES"), async (req, res) => {
  try {
    await db.delete(packagesTable).where(eq(packagesTable.id, Number(req.params.id)));
    clearCachePattern("cache:/api/packages*");
    clearCachePattern("cache:/api/destinations/resolve-slug*");
    clearCachePattern("cache:/api/ota/home/config*");
    // ⚡ Fire-and-forget: remove from MongoDB
    deleteMongoPackage(Number(req.params.id));
    syncHomeConfig();
    res.json({ message: "Package deleted successfully" });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete package" });
  }
});

// GET /admin/packages/:id/calendar-inventory
router.get("/packages/:id/calendar-inventory", requirePermission("PACKAGES"), async (req, res) => {
  try {
    const packageId = Number(req.params.id);
    const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
    const endDate = req.query.endDate ? String(req.query.endDate) : undefined;

    let query = db
      .select()
      .from(packageCalendarInventoryTable)
      .where(eq(packageCalendarInventoryTable.packageId, packageId));

    if (startDate && endDate) {
      query = db
        .select()
        .from(packageCalendarInventoryTable)
        .where(
          and(
            eq(packageCalendarInventoryTable.packageId, packageId),
            sql`${packageCalendarInventoryTable.date} >= ${startDate}`,
            sql`${packageCalendarInventoryTable.date} <= ${endDate}`
          )
        );
    }

    const list = await query;
    res.json(list);
  } catch (e: any) {
    logger.error({ error: e.message }, "Failed to fetch calendar inventory");
    res.status(500).json({ error: "Failed to fetch calendar inventory" });
  }
});

// POST /admin/packages/:id/calendar-inventory
router.post("/packages/:id/calendar-inventory", requirePermission("PACKAGES"), async (req, res) => {
  try {
    const packageId = Number(req.params.id);
    const { dates, rateType, priceModifierType, priceModifierValue, discountType, discountValue } = req.body;

    if (!Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: "Invalid dates list" });
    }

    const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, packageId)).limit(1);
    if (!pkg) return res.status(404).json({ error: "Package not found" });

    const basePrice = pkg.pricePerPerson;

    // Use a transaction for batch updates (highly performant / conflict-free)
    await db.transaction(async (tx) => {
      for (const dateStr of dates) {
        // Upsert calendar rule
        await tx
          .insert(packageCalendarInventoryTable)
          .values({
            packageId,
            date: dateStr,
            rateType,
            priceModifierType: priceModifierType || "fixed",
            priceModifierValue: Number(priceModifierValue) || 0,
            discountType: discountType || "none",
            discountValue: Number(discountValue) || 0,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [packageCalendarInventoryTable.packageId, packageCalendarInventoryTable.date],
            set: {
              rateType,
              priceModifierType: priceModifierType || "fixed",
              priceModifierValue: Number(priceModifierValue) || 0,
              discountType: discountType || "none",
              discountValue: Number(discountValue) || 0,
              updatedAt: new Date(),
            },
          });

        // Compute price for history log
        let finalPrice = basePrice;
        if (rateType === "peak" || rateType === "off-season" || rateType === "regular") {
          const modVal = Number(priceModifierValue) || 0;
          if (priceModifierType === "fixed") finalPrice = modVal;
          else if (priceModifierType === "percentage") finalPrice = basePrice * (1 + modVal / 100);
          else if (priceModifierType === "value") finalPrice = basePrice + modVal;
        } else if (rateType === "blackout" || rateType === "price-on-request") {
          finalPrice = 0; // Blackout/on-request has no selling price
        }

        // Apply discount overlay
        if (discountType === "percentage") {
          finalPrice = finalPrice * (1 - (Number(discountValue) || 0) / 100);
        } else if (discountType === "flat") {
          finalPrice = Math.max(0, finalPrice - (Number(discountValue) || 0));
        }

        // Add history log entry
        await tx.insert(packagePriceHistoryTable).values({
          packageId,
          date: dateStr,
          rateType,
          price: finalPrice,
          action: "UPDATED",
          changedBy: "admin",
        });
      }
    });

    clearCachePattern("cache:/api/packages*");
    
    // Sync calendar records to MongoDB
    await syncPackageCalendar(packageId);

    res.json({ message: "Rates updated successfully" });
  } catch (e: any) {
    logger.error({ error: e.message }, "Failed to update calendar inventory");
    res.status(500).json({ error: "Failed to update calendar inventory: " + e.message });
  }
});

// GET /admin/packages/:id/calendar-inventory/notifications
router.get("/packages/:id/calendar-inventory/notifications", requirePermission("PACKAGES"), async (req, res) => {
  try {
    const packageId = Number(req.params.id);
    
    // Check for any unpriced dates in the next 30 days
    const upcomingDates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      upcomingDates.push(`${yyyy}-${mm}-${dd}`);
    }

    const startStr = upcomingDates[0];
    const endStr = upcomingDates[upcomingDates.length - 1];

    const pricedRows = await db
      .select({ date: packageCalendarInventoryTable.date })
      .from(packageCalendarInventoryTable)
      .where(
        and(
          eq(packageCalendarInventoryTable.packageId, packageId),
          sql`${packageCalendarInventoryTable.date} >= ${startStr}`,
          sql`${packageCalendarInventoryTable.date} <= ${endStr}`
        )
      );

    const pricedDates = new Set(pricedRows.map(r => r.date));
    const unpricedDates = upcomingDates.filter(d => !pricedDates.has(d));

    res.json({
      hasUnpricedDates: unpricedDates.length > 0,
      unpricedCount: unpricedDates.length,
      unpricedDates: unpricedDates.slice(0, 10), // Return sample
    });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// ─────────────────────────────────────────────────────────────
// DESTINATION MANAGEMENT - REGIONS & COUNTRIES
// ─────────────────────────────────────────────────────────────

router.get("/regions", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    const list = await db.select().from(regionsTable).orderBy(regionsTable.displayOrder);
    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch regions" });
  }
});

router.post("/regions", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id; delete data.createdAt; delete data.updatedAt;
    if (!data.slug && data.name) {
      data.slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    }
    const [inserted] = await db.insert(regionsTable).values(data).returning();
    clearCachePattern("cache:/api/ota/home/top-destinations*");
    res.status(201).json(inserted);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to create region: " + e.message });
  }
});

router.patch("/regions/:id", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id; delete data.createdAt; delete data.updatedAt;
    const [updated] = await db.update(regionsTable).set({ ...data, updatedAt: new Date() })
      .where(eq(regionsTable.id, Number(req.params.id))).returning();
    clearCachePattern("cache:/api/ota/home/top-destinations*");
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update region" });
  }
});

router.delete("/regions/:id", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    await db.delete(regionsTable).where(eq(regionsTable.id, Number(req.params.id)));
    clearCachePattern("cache:/api/ota/home/top-destinations*");
    res.json({ message: "Region deleted" });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete region" });
  }
});

router.get("/countries", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    const list = await db.select().from(countriesTable).orderBy(countriesTable.name);
    res.json(list);
  } catch (e: any) {
    console.error("[GET /countries] Error:", e);
    res.status(500).json({ error: "Failed to fetch countries: " + e.message });
  }
});

router.post("/countries", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id; delete data.packageCount; delete data.createdAt; delete data.updatedAt;
    if (!data.slug && data.name) {
      data.slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    }
    const [inserted] = await db.insert(countriesTable).values(data).returning();
    clearCachePattern("cache:/api/ota/home/top-destinations*");
    res.status(201).json(inserted);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to create country: " + e.message });
  }
});

router.patch("/countries/:id", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id; delete data.packageCount; delete data.createdAt; delete data.updatedAt;
    const [updated] = await db.update(countriesTable).set({ ...data, updatedAt: new Date() })
      .where(eq(countriesTable.id, Number(req.params.id))).returning();
    clearCachePattern("cache:/api/ota/home/top-destinations*");
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update country" });
  }
});

router.delete("/countries/:id", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    await db.delete(countriesTable).where(eq(countriesTable.id, Number(req.params.id)));
    clearCachePattern("cache:/api/ota/home/top-destinations*");
    res.json({ message: "Country deleted" });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete country" });
  }
});

// ─────────────────────────────────────────────────────────────
// DESTINATION MANAGEMENT - STATES
// ─────────────────────────────────────────────────────────────

router.get("/states", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    const list = await db
      .select({ state: statesTable, countryName: countriesTable.name })
      .from(statesTable)
      .leftJoin(countriesTable, eq(statesTable.countryId, countriesTable.id))
      .orderBy(statesTable.name);
    res.json(list.map(l => ({ ...l.state, countryName: l.countryName })));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch states" });
  }
});

router.post("/states", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id; delete data.countryName; delete data.packageCount; delete data.createdAt; delete data.updatedAt;
    if (!data.slug && data.name) {
      data.slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    }
    const [inserted] = await db.insert(statesTable).values(data).returning();
    clearCachePattern("cache:/api/ota/home/top-destinations*");
    res.status(201).json(inserted);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to create state: " + e.message });
  }
});

router.patch("/states/:id", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id; delete data.countryName; delete data.packageCount; delete data.createdAt; delete data.updatedAt;
    const [updated] = await db.update(statesTable).set({ ...data, updatedAt: new Date() })
      .where(eq(statesTable.id, Number(req.params.id))).returning();
    clearCachePattern("cache:/api/ota/home/top-destinations*");
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update state" });
  }
});

router.delete("/states/:id", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    await db.delete(statesTable).where(eq(statesTable.id, Number(req.params.id)));
    clearCachePattern("cache:/api/ota/home/top-destinations*");
    res.json({ message: "State deleted" });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete state" });
  }
});

// ─────────────────────────────────────────────────────────────
// DESTINATION MANAGEMENT - PLACES/CITIES
// ─────────────────────────────────────────────────────────────

router.get("/destinations", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    const list = await db
      .select({
        destination: destinationsTable,
        stateName: statesTable.name,
        countryName: countriesTable.name,
      })
      .from(destinationsTable)
      .leftJoin(statesTable, eq(destinationsTable.stateId, statesTable.id))
      .leftJoin(countriesTable, eq(statesTable.countryId, countriesTable.id))
      .orderBy(destinationsTable.name);
    res.json(list.map(l => ({ ...l.destination, stateName: l.stateName, countryName: l.countryName })));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch destinations" });
  }
});

router.get("/destinations/:id", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    const [dest] = await db.select().from(destinationsTable)
      .where(eq(destinationsTable.id, Number(req.params.id))).limit(1);
    if (!dest) return res.status(404).json({ error: "Destination not found" });
    res.json(dest);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch destination" });
  }
});

router.post("/destinations", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id; delete data.countryName; delete data.stateName; delete data.packageCount; delete data.createdAt; delete data.updatedAt;
    if (!data.slug && data.name) {
      data.slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    }
    const [inserted] = await db.insert(destinationsTable).values(data).returning();
    clearCachePattern("cache:/api/ota/home/top-destinations*");
    clearCachePattern("cache:/api/destinations*");
    // ⚡ Fire-and-forget: sync to MongoDB
    syncDestination(inserted.id);
    res.status(201).json(inserted);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to create destination: " + e.message });
  }
});

router.patch("/destinations/:id", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id; delete data.countryName; delete data.stateName; delete data.packageCount; delete data.createdAt; delete data.updatedAt;
    const [updated] = await db.update(destinationsTable).set({ ...data, updatedAt: new Date() })
      .where(eq(destinationsTable.id, Number(req.params.id))).returning();
    clearCachePattern("cache:/api/ota/home/top-destinations*");
    clearCachePattern("cache:/api/destinations*");
    // ⚡ Fire-and-forget: sync to MongoDB
    syncDestination(Number(req.params.id));
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update destination" });
  }
});

router.delete("/destinations/:id", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    await db.delete(destinationsTable).where(eq(destinationsTable.id, Number(req.params.id)));
    clearCachePattern("cache:/api/ota/home/top-destinations*");
    clearCachePattern("cache:/api/destinations*");
    // ⚡ Fire-and-forget: remove from MongoDB
    deleteMongoDestination(Number(req.params.id));
    res.json({ message: "Destination deleted" });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete destination" });
  }
});

// ─────────────────────────────────────────────────────────────
// HOME PAGE MANAGEMENT
// ─────────────────────────────────────────────────────────────

router.get("/home/slides", requirePermission("SETTINGS"), async (req, res) => {
  try {
    const list = await db.select({
      id: homePageSlidesTable.id,
      title: homePageSlidesTable.title,
      subtitle: homePageSlidesTable.subtitle,
      imageUrl: homePageSlidesTable.imageUrl,
      videoUrl: homePageSlidesTable.videoUrl,
      tag: homePageSlidesTable.tag,
      ctaText: homePageSlidesTable.ctaText,
      ctaLink: homePageSlidesTable.ctaLink,
      displayOrder: homePageSlidesTable.displayOrder,
      isActive: homePageSlidesTable.isActive
    }).from(homePageSlidesTable).orderBy(asc(homePageSlidesTable.displayOrder));
    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch slides" });
  }
});

router.post("/home/slides", requirePermission("SETTINGS"), async (req, res) => {
  try {
    const [inserted] = await db.insert(homePageSlidesTable).values(req.body).returning();
    clearCachePattern("cache:/api/ota/home/config*");
    // ⚡ Re-sync home config to MongoDB after slide change
    syncHomeConfig();
    res.status(201).json(inserted);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to create slide" });
  }
});

router.patch("/home/slides/:id", requirePermission("SETTINGS"), async (req, res) => {
  try {
    const [updated] = await db.update(homePageSlidesTable).set(req.body).where(eq(homePageSlidesTable.id, Number(req.params.id))).returning();
    clearCachePattern("cache:/api/ota/home/config*");
    syncHomeConfig();
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update slide" });
  }
});

router.delete("/home/slides/:id", requirePermission("SETTINGS"), async (req, res) => {
  try {
    await db.delete(homePageSlidesTable).where(eq(homePageSlidesTable.id, Number(req.params.id)));
    clearCachePattern("cache:/api/ota/home/config*");
    syncHomeConfig();
    res.json({ message: "Slide deleted" });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete slide" });
  }
});

router.get("/home/categories", requirePermission("SETTINGS"), async (req, res) => {
  try {
    const list = await db.select({
      id: homePageCategoriesTable.id,
      label: homePageCategoriesTable.label,
      slug: homePageCategoriesTable.slug,
      description: homePageCategoriesTable.description,
      content: homePageCategoriesTable.content,
      iconName: homePageCategoriesTable.iconName,
      imageUrl: homePageCategoriesTable.imageUrl,
      href: homePageCategoriesTable.href,
      color: homePageCategoriesTable.color,
      displayOrder: homePageCategoriesTable.displayOrder,
      isActive: homePageCategoriesTable.isActive,
      metaTitle: homePageCategoriesTable.metaTitle,
      metaDescription: homePageCategoriesTable.metaDescription,
      metaKeywords: homePageCategoriesTable.metaKeywords
    }).from(homePageCategoriesTable).orderBy(asc(homePageCategoriesTable.displayOrder));
    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.post("/home/categories", requirePermission("SETTINGS"), async (req, res) => {
  try {
    const data = req.body;
    if (!data.slug && data.label) {
      data.slug = data.label.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    }
    const [inserted] = await db.insert(homePageCategoriesTable).values(data).returning();
    clearCachePattern("cache:/api/ota/home/config*");
    syncHomeConfig();
    res.status(201).json(inserted);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to create category" });
  }
});

router.patch("/home/categories/:id", requirePermission("SETTINGS"), async (req, res) => {
  try {
    // Strip computed JOIN fields (packageCount, startingPrice) and DB-managed
    // fields (id, image_url snake_case duplicate) that come from the GET /config
    // response and must never be passed to Drizzle's .set()
    const ALLOWED_CATEGORY_FIELDS = [
      'label', 'slug', 'description', 'content', 'iconName',
      'imageUrl', 'href', 'color', 'displayOrder', 'isActive',
      'metaTitle', 'metaDescription', 'metaKeywords'
    ] as const;

    const updateData: Record<string, any> = {};
    for (const field of ALLOWED_CATEGORY_FIELDS) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields provided for update" });
    }

    const [updated] = await db
      .update(homePageCategoriesTable)
      .set(updateData)
      .where(eq(homePageCategoriesTable.id, Number(req.params.id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Theme not found" });
    }
    clearCachePattern("cache:/api/ota/home/config*");
    syncHomeConfig();
    res.json(updated);
  } catch (e: any) {
    logger.error({ error: e.message, id: req.params.id }, "Failed to update category");
    res.status(500).json({ error: "Failed to update category: " + e.message });
  }
});

router.delete("/home/categories/:id", requirePermission("SETTINGS"), async (req, res) => {
  try {
    await db.delete(homePageCategoriesTable).where(eq(homePageCategoriesTable.id, Number(req.params.id)));
    clearCachePattern("cache:/api/ota/home/config*");
    syncHomeConfig();
    res.json({ message: "Category deleted" });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete category" });
  }
});

router.get("/home/sections", requirePermission("SETTINGS"), async (req, res) => {
  try {
    const list = await db.select().from(homePageSectionsTable).orderBy(asc(homePageSectionsTable.displayOrder));
    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch sections" });
  }
});

router.patch("/home/sections/:id", requirePermission("SETTINGS"), async (req, res) => {
  try {
    const [updated] = await db.update(homePageSectionsTable).set(req.body).where(eq(homePageSectionsTable.id, Number(req.params.id))).returning();
    clearCachePattern("cache:/api/ota/home/config*");
    syncHomeConfig();
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update section" });
  }
});

// ─────────────────────────────────────────────────────────────
// OFFER MANAGEMENT
// ─────────────────────────────────────────────────────────────
router.get("/home/offers", requirePermission("SETTINGS"), async (req, res) => {
  try {
    const list = await db.select().from(offersTable).orderBy(asc(offersTable.displayOrder));
    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch offers" });
  }
});

router.post("/home/offers", requirePermission("SETTINGS"), async (req, res) => {
  try {
    const { 
      title, description, category, imageUrl, 
      ctaText, ctaLink, termsAndConditions, 
      displayOrder, isActive 
    } = req.body;

    const [inserted] = await db
      .insert(offersTable)
      .values({
        title, 
        description, 
        category, 
        imageUrl, 
        ctaText, 
        ctaLink, 
        termsAndConditions, 
        displayOrder, 
        isActive: isActive !== undefined ? isActive : true
      })
      .returning();
    clearCachePattern("cache:/api/ota/home/config*");
    syncHomeConfig();
    res.status(201).json(inserted);
  } catch (e: any) {
    logger.error({ error: e.message, stack: e.stack, body: req.body }, "Failed to create offer");
    res.status(500).json({ error: "Failed to create offer: " + e.message });
  }
});

router.patch("/home/offers/:id", requirePermission("SETTINGS"), async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = [
      'title', 'description', 'category', 'imageUrl', 
      'ctaText', 'ctaLink', 'termsAndConditions', 
      'displayOrder', 'isActive'
    ];
    
    const updateData: any = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields provided for update" });
    }

    const [updated] = await db
      .update(offersTable)
      .set(updateData)
      .where(eq(offersTable.id, Number(id)))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: "Offer not found" });
    }
    clearCachePattern("cache:/api/ota/home/config*");
    syncHomeConfig();
    res.json(updated);
  } catch (e: any) {
    logger.error({ error: e.message, stack: e.stack, body: req.body, id: req.params.id }, "Failed to update offer");
    res.status(500).json({ error: "Failed to update offer: " + e.message });
  }
});


router.delete("/home/offers/:id", requirePermission("SETTINGS"), async (req, res) => {
  try {
    await db.delete(offersTable).where(eq(offersTable.id, Number(req.params.id)));
    clearCachePattern("cache:/api/ota/home/config*");
    syncHomeConfig();
    res.json({ message: "Offer deleted" });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete offer" });
  }
});

// ─────────────────────────────────────────────────────────────
// HOTEL MANAGEMENT  (HOTELS permission)
// Admin can create, view, edit, approve/reject, and delete hotels.
// Admin-created hotels use the admin's own userId as ownerId.
// ─────────────────────────────────────────────────────────────




// GET /admin/hotels — list all hotels with owner info and destination name
router.get("/hotels", requirePermission("HOTELS"), async (req, res) => {
  try {
    const hotels = await db.execute(sql`
      SELECT
        h.*,
        u.name   AS owner_name,
        u.email  AS owner_email,
        u.role   AS owner_role,
        d.name   AS destination_name
      FROM hotels h
      LEFT JOIN users u ON h.owner_id = u.id
      LEFT JOIN destinations d ON h.destination_id = d.id
      ORDER BY h.created_at DESC
    `);
    res.json(hotels.rows);
  } catch (e: any) {
    logger.error({ error: e.message }, "Failed to fetch admin hotels");
    res.status(500).json({ error: "Failed to fetch hotels" });
  }
});

// POST /admin/hotels — admin directly creates a hotel (ownerId = admin user)
router.post("/hotels", requirePermission("HOTELS"), async (req: AuthenticatedRequest, res) => {
  try {
    const data = { ...req.body };
    delete data.id; delete data.createdAt; delete data.updatedAt;
    delete data.owner_name; delete data.owner_email; delete data.destination_name;

    if (!data.name) return res.status(400).json({ error: "Hotel name is required" });

    // Auto-generate slug if missing, ensure uniqueness
    if (!data.slug) {
      data.slug = slugify(data.name) + "-" + Math.random().toString(36).slice(2, 6);
    }

    // Admin is the owner for directly-created hotels
    data.ownerId = req.user!.id;
    // Admin-created hotels start as PENDING — must be explicitly approved after verification
    data.status = data.status || "PENDING";

    if (data.amenities && typeof data.amenities === "string") {
      data.amenities = data.amenities.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
    if (data.images && typeof data.images === "string") {
      data.images = data.images.split("\n").map((s: string) => s.trim()).filter(Boolean);
    }
    if (data.starRating) data.starRating = Number(data.starRating);
    if (data.totalRooms) data.totalRooms = Number(data.totalRooms);
    if (data.minPrice) data.minPrice = Number(data.minPrice);
    if (data.vendorCommissionPct) data.vendorCommissionPct = Number(data.vendorCommissionPct);
    if (data.displayOrder !== undefined) data.displayOrder = Number(data.displayOrder);
    if (data.destinationId) data.destinationId = Number(data.destinationId);
    if (data.stateId) data.stateId = Number(data.stateId);
    if (data.countryId) data.countryId = Number(data.countryId);
    if (data.latitude) data.latitude = parseFloat(data.latitude);
    if (data.longitude) data.longitude = parseFloat(data.longitude);

    const [inserted] = await db.insert(hotelsTable).values(data).returning();
    await clearCachePattern("cache:/api/hotels*");
    await clearCachePattern("cache:/api/ota/home*");
    res.status(201).json(inserted);
  } catch (e: any) {
    logger.error({ error: e.message }, "Admin hotel create error");
    res.status(500).json({ error: "Failed to create hotel: " + e.message });
  }
});

// GET /admin/hotels/:id — single hotel detail
router.get("/hotels/:id", requirePermission("HOTELS"), async (req, res) => {
  try {
    const [hotel] = await db.select().from(hotelsTable)
      .where(eq(hotelsTable.id, Number(req.params.id))).limit(1);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });
    res.json(hotel);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch hotel" });
  }
});

// PATCH /admin/hotels/:id — update any hotel field (status, featured, etc.)
router.patch("/hotels/:id", requirePermission("HOTELS"), async (req: AuthenticatedRequest, res) => {
  try {
    const data = { ...req.body };
    delete data.id; delete data.createdAt; delete data.ownerId;
    delete data.owner_name; delete data.owner_email; delete data.destination_name;

    if (data.amenities && typeof data.amenities === "string") {
      data.amenities = data.amenities.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
    if (data.images && typeof data.images === "string") {
      data.images = data.images.split("\n").map((s: string) => s.trim()).filter(Boolean);
    }
    if (data.starRating !== undefined) data.starRating = Number(data.starRating);
    if (data.totalRooms !== undefined) data.totalRooms = Number(data.totalRooms);
    if (data.minPrice !== undefined) data.minPrice = Number(data.minPrice);
    if (data.destinationId) data.destinationId = Number(data.destinationId);
    if (data.stateId) data.stateId = Number(data.stateId);
    if (data.countryId) data.countryId = Number(data.countryId);
    if (data.latitude) data.latitude = parseFloat(data.latitude);
    if (data.longitude) data.longitude = parseFloat(data.longitude);

    data.updatedAt = new Date();

    const [updated] = await db.update(hotelsTable)
      .set(data)
      .where(eq(hotelsTable.id, Number(req.params.id)))
      .returning();
    if (!updated) return res.status(404).json({ error: "Hotel not found" });
    await clearCachePattern("cache:/api/hotels*");
    await clearCachePattern("cache:/api/ota/home*");
    res.json(updated);
  } catch (e: any) {
    logger.error({ error: e.message }, "Admin hotel update error");
    res.status(500).json({ error: "Failed to update hotel: " + e.message });
  }
});

// DELETE /admin/hotels/:id — hard delete hotel (removes rooms cascade)
router.delete("/hotels/:id", requirePermission("HOTELS"), async (req, res) => {
  try {
    // Delete rooms first to avoid FK violation
    await db.delete(hotelRoomsTable).where(eq(hotelRoomsTable.hotelId, Number(req.params.id)));
    await db.delete(hotelsTable).where(eq(hotelsTable.id, Number(req.params.id)));
    await clearCachePattern("cache:/api/hotels*");
    await clearCachePattern("cache:/api/ota/home*");
    res.json({ message: "Hotel deleted successfully" });
  } catch (e: any) {
    logger.error({ error: e.message }, "Admin hotel delete error");
    res.status(500).json({ error: "Failed to delete hotel: " + e.message });
  }
});

// ─── Hotel Rooms ─────────────────────────────────────────────

// GET /admin/hotels/:id/rooms
router.get("/hotels/:id/rooms", requirePermission("HOTELS"), async (req, res) => {
  try {
    const rooms = await db.select().from(hotelRoomsTable)
      .where(eq(hotelRoomsTable.hotelId, Number(req.params.id)))
      .orderBy(asc(hotelRoomsTable.id));
    res.json(rooms);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

// POST /admin/hotels/:id/rooms
router.post("/hotels/:id/rooms", requirePermission("HOTELS"), async (req, res) => {
  try {
    const hotelId = Number(req.params.id);
    const data = { ...req.body };
    delete data.id; delete data.createdAt; delete data.updatedAt;

    data.hotelId = hotelId;
    if (data.basePrice) data.basePrice = Number(data.basePrice);
    if (data.maxOccupancy) data.maxOccupancy = Number(data.maxOccupancy);
    if (data.totalRooms) data.totalRooms = Number(data.totalRooms);
    if (data.discountPercent !== undefined) data.discountPercent = Number(data.discountPercent);
    if (data.discountFlat !== undefined) data.discountFlat = Number(data.discountFlat);

    if (!data.slug && data.name) {
      data.slug = slugify(data.name) + "-" + hotelId;
    }
    if (data.amenities && typeof data.amenities === "string") {
      data.amenities = data.amenities.split(",").map((s: string) => s.trim()).filter(Boolean);
    }

    const [inserted] = await db.insert(hotelRoomsTable).values(data).returning();

    // Update hotel minPrice cache if this room is cheaper
    const allRooms = await db.select({ basePrice: hotelRoomsTable.basePrice })
      .from(hotelRoomsTable).where(eq(hotelRoomsTable.hotelId, hotelId));
    const minPrice = Math.min(...allRooms.map(r => r.basePrice || 0).filter(p => p > 0));
    if (isFinite(minPrice)) {
      await db.update(hotelsTable).set({ minPrice }).where(eq(hotelsTable.id, hotelId));
    }

    await clearCachePattern("cache:/api/hotels*");
    res.status(201).json(inserted);
  } catch (e: any) {
    logger.error({ error: e.message }, "Admin room create error");
    res.status(500).json({ error: "Failed to create room: " + e.message });
  }
});

// PATCH /admin/hotels/:id/rooms/:roomId
router.patch("/hotels/:id/rooms/:roomId", requirePermission("HOTELS"), async (req, res) => {
  try {
    const hotelId = Number(req.params.id);
    const roomId = Number(req.params.roomId);
    const data = { ...req.body };
    delete data.id; delete data.hotelId; delete data.createdAt;

    if (data.basePrice !== undefined) data.basePrice = Number(data.basePrice);
    if (data.maxOccupancy !== undefined) data.maxOccupancy = Number(data.maxOccupancy);
    if (data.totalRooms !== undefined) data.totalRooms = Number(data.totalRooms);
    if (data.discountPercent !== undefined) data.discountPercent = Number(data.discountPercent);
    if (data.discountFlat !== undefined) data.discountFlat = Number(data.discountFlat);
    if (data.amenities && typeof data.amenities === "string") {
      data.amenities = data.amenities.split(",").map((s: string) => s.trim()).filter(Boolean);
    }

    const [updated] = await db.update(hotelRoomsTable)
      .set(data).where(eq(hotelRoomsTable.id, roomId)).returning();

    // Recalculate hotel minPrice
    const allRooms = await db.select({ basePrice: hotelRoomsTable.basePrice })
      .from(hotelRoomsTable).where(and(eq(hotelRoomsTable.hotelId, hotelId), eq(hotelRoomsTable.isActive, true)));
    const minPrice = Math.min(...allRooms.map(r => r.basePrice || 0).filter(p => p > 0));
    if (isFinite(minPrice)) {
      await db.update(hotelsTable).set({ minPrice }).where(eq(hotelsTable.id, hotelId));
    }

    await clearCachePattern("cache:/api/hotels*");
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update room" });
  }
});

// DELETE /admin/hotels/:id/rooms/:roomId
router.delete("/hotels/:id/rooms/:roomId", requirePermission("HOTELS"), async (req, res) => {
  try {
    const hotelId = Number(req.params.id);
    await db.delete(hotelRoomsTable).where(eq(hotelRoomsTable.id, Number(req.params.roomId)));
    // Recalculate minPrice
    const allRooms = await db.select({ basePrice: hotelRoomsTable.basePrice })
      .from(hotelRoomsTable).where(and(eq(hotelRoomsTable.hotelId, hotelId), eq(hotelRoomsTable.isActive, true)));
    if (allRooms.length > 0) {
      const minPrice = Math.min(...allRooms.map(r => r.basePrice || 0).filter(p => p > 0));
      if (isFinite(minPrice)) await db.update(hotelsTable).set({ minPrice }).where(eq(hotelsTable.id, hotelId));
    }
    await clearCachePattern("cache:/api/hotels*");
    res.json({ message: "Room deleted" });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete room" });
  }
});

// POST /admin/transport-vehicles — admin directly creates a vehicle (CRM entry)
// Uses or creates a system "Admin Direct Fleet" vendor for ownerId assignment.
router.post("/transport-vehicles", requirePermission("TRANSPORT"), async (req: AuthenticatedRequest, res) => {
  try {
    const body = { ...req.body };

    // ── Strip read-only / auto-generated fields ────────────────────────────
    delete body.id; delete body.createdAt; delete body.updatedAt;
    delete body.owner_name; delete body.owner_email; delete body.city_name;
    delete body.vendorId; // resolved below

    // ── Required field validation ──────────────────────────────────────────
    if (!body.name || !body.make || !body.model || !body.type) {
      return res.status(400).json({ error: "name, make, model, and type are required" });
    }

    // ── Auto-generate slug ─────────────────────────────────────────────────
    if (!body.slug) {
      const city = body.customCity ? `-${slugify(body.customCity)}` : "";
      body.slug = `${slugify(body.name)}${city}-${Date.now().toString().slice(-6)}`;
    }

    // ── Numeric coercions ──────────────────────────────────────────────────
    const seatingCapacity = Number(body.seatingCapacity) || 4;
    const luggageCapacity  = body.luggageCapacity   != null ? Number(body.luggageCapacity)   : null;
    const year             = body.year              != null ? Number(body.year)              : null;
    const minPrice         = body.minPrice          != null ? Number(body.minPrice)          : 0;
    const basePricePerKm   = body.basePricePerKm    != null ? Number(body.basePricePerKm)   : null;
    const basePricePerDay  = body.basePricePerDay   != null ? Number(body.basePricePerDay)  : null;
    const destinationId    = body.destinationId     != null ? Number(body.destinationId)    : null;
    const stateId          = body.stateId           != null ? Number(body.stateId)          : null;
    const countryId        = body.countryId         != null ? Number(body.countryId)        : null;

    // ── Array fields — CRITICAL: must be proper JS arrays for Drizzle text[] ─
    const features = toStringArray(body.features, ",");
    const images   = toStringArray(body.images,   "\n");

    // ── Status & flags ─────────────────────────────────────────────────────
    const status     = body.status     || "APPROVED";   // Admin-created → live by default
    const isAC       = body.isAC       !== undefined ? Boolean(body.isAC)       : true;
    const isFeatured = body.isFeatured !== undefined ? Boolean(body.isFeatured) : false;

    // ── Resolve or auto-create a system transport vendor for this admin ─────
    let vendorId: number;
    const [existingVendor] = await db
      .select({ id: transportVendorsTable.id })
      .from(transportVendorsTable)
      .where(eq(transportVendorsTable.userId, req.user!.id))
      .limit(1);

    if (existingVendor) {
      vendorId = existingVendor.id;
    } else {
      const [adminUser] = await db.select().from(usersTable)
        .where(eq(usersTable.id, req.user!.id)).limit(1);
      const [newVendor] = await db.insert(transportVendorsTable).values({
        userId:       req.user!.id,
        businessName: "Admin Direct Fleet – Sampooran Holidays",
        businessType: "PROPRIETORSHIP",
        phone:        adminUser?.phoneNumber || "9800000000",
        email:        adminUser?.email       || "admin@sampooran.com",
        address:      "Sampooran Holidays Head Office",
        city:         body.customCity || "Delhi",
        state:        "Delhi",
        pincode:      "110001",
        status:       "APPROVED",
        commissionPct: 0,
        adminNote:    "System vendor auto-created for admin-direct CRM vehicles",
      }).returning();
      vendorId = newVendor.id;
    }

    // ── Insert vehicle ─────────────────────────────────────────────────────
    const [inserted] = await db.insert(transportVehiclesTable).values({
      vendorId,
      ownerId:      req.user!.id,
      name:         body.name,
      slug:         body.slug,
      type:         body.type,
      subType:      body.subType      || null,
      description:  body.description  || null,
      make:         body.make,
      model:        body.model,
      year,
      color:        body.color        || null,
      registrationNumber: body.registrationNumber || null,
      seatingCapacity,
      luggageCapacity,
      fuelType:     body.fuelType     || "DIESEL",
      transmission: body.transmission || "MANUAL",
      isAC,
      features,       // ← proper string[]
      images,         // ← proper string[]
      documents:    {},
      conditionReport: {},
      basePricePerKm,
      basePricePerDay,
      minPrice,
      customCity:   body.customCity   || null,
      destinationId,
      stateId,
      countryId,
      destinationSlug: body.destinationSlug || null,
      stateSlug:       body.stateSlug       || null,
      countrySlug:     body.countrySlug     || null,
      status,
      isFeatured,
      displayOrder: 0,
      adminNote:    body.adminNote || "Admin CRM direct entry",
    }).returning();

    await clearCachePattern("cache:/api/transport*");
    res.status(201).json(inserted);
  } catch (e: any) {
    logger.error({ error: e.message, stack: e.stack }, "Admin vehicle create error");
    res.status(500).json({ error: "Failed to create vehicle: " + e.message });
  }
});


// ─────────────────────────────────────────────────────────────
// LIVE CHAT MANAGEMENT
// ─────────────────────────────────────────────────────────────

// GET /admin/conversations — list all with last message + guest info
router.get("/conversations", async (req, res) => {
  try {
    const convos = await db
      .select()
      .from(conversationsTable)
      .orderBy(desc(conversationsTable.lastMessageAt));

    // Attach last message for each conversation
    const result = await Promise.all(convos.map(async (c) => {
      const [lastMsg] = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.conversationId, c.id))
        .orderBy(desc(messagesTable.createdAt))
        .limit(1);

      const unreadCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(messagesTable)
        .where(and(eq(messagesTable.conversationId, c.id), eq(messagesTable.isRead, false), eq(messagesTable.senderRole, 'USER')));

      return {
        ...c,
        lastMessage: lastMsg?.content || "",
        lastMessageRole: lastMsg?.senderRole || "",
        unreadCount: Number(unreadCount[0]?.count || 0),
      };
    }));

    res.json(result);
  } catch (e: any) {
    console.error("GET /admin/conversations ERROR:", e);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// GET /admin/conversations/:id/messages — message history
router.get("/conversations/:id/messages", async (req, res) => {
  try {
    const msgs = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, Number(req.params.id)))
      .orderBy(asc(messagesTable.createdAt));

    // Mark all user messages as read
    await db
      .update(messagesTable)
      .set({ isRead: true })
      .where(and(eq(messagesTable.conversationId, Number(req.params.id)), eq(messagesTable.senderRole, 'USER')));

    res.json(msgs);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// PATCH /admin/conversations/:id/status — open/close
router.patch("/conversations/:id/status", async (req: AuthenticatedRequest, res) => {
  try {
    const { status } = req.body;
    const [updated] = await db
      .update(conversationsTable)
      .set({ status })
      .where(eq(conversationsTable.id, Number(req.params.id)))
      .returning();
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update conversation status" });
  }
});

// PATCH /admin/conversations/:id/assign — supervisor assigns to staff or vendor
router.patch("/conversations/:id/assign", async (req: AuthenticatedRequest, res) => {
  const perms: string[] = JSON.parse(req.user?.adminPermissions || '["ALL"]');
  const isSupervisor = req.user?.role === "SUPERADMIN" || perms.includes("ALL");
  if (!isSupervisor) {
    return res.status(403).json({ error: "Only supervisors can assign conversations." });
  }
  try {
    const { staffId, vendorId, department } = req.body;
    const updateData: Record<string, any> = { status: "ASSIGNED" };
    if (staffId !== undefined)    updateData.assignedStaffId  = staffId ? Number(staffId) : null;
    if (vendorId !== undefined)   updateData.assignedVendorId = vendorId ? Number(vendorId) : null;
    if (department) updateData.assignedDepartment = department;

    const [updated] = await db
      .update(conversationsTable)
      .set(updateData)
      .where(eq(conversationsTable.id, Number(req.params.id)))
      .returning();

    let assignedStaffName = "";
    if (updated.assignedStaffId) {
      const [staff] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, updated.assignedStaffId)).limit(1);
      assignedStaffName = staff?.name || "";
    }

    let assignedVendorName = "";
    if (updated.assignedVendorId) {
      const [vendor] = await db.select({ name: usersTable.name, vendorBusinessName: usersTable.vendorBusinessName }).from(usersTable).where(eq(usersTable.id, updated.assignedVendorId)).limit(1);
      assignedVendorName = vendor?.vendorBusinessName || vendor?.name || "";
    }

    res.json({ ...updated, assignedStaffName, assignedVendorName });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to assign conversation" });
  }
});

// POST /admin/conversations/:id/takeover — Admin/Staff stops AI bot and takes over live chat
router.post("/conversations/:id/takeover", async (req: AuthenticatedRequest, res) => {
  try {
    const convId = Number(req.params.id);
    const staffId = req.user!.id;
    const [staff] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, staffId)).limit(1);
    const staffName = staff?.name || req.user?.email || "Support Specialist";

    const [updated] = await db
      .update(conversationsTable)
      .set({
        status: "OPEN",
        botEscalated: true,
        assignedStaffId: staffId,
        botState: "ESCALATED",
      })
      .where(eq(conversationsTable.id, convId))
      .returning();

    // Insert system notification message in chat
    const [sysMsg] = await db.insert(messagesTable).values({
      conversationId: convId,
      senderId: staffId,
      senderRole: "ADMIN",
      content: `💬 ${staffName} from Sampooran Holidays has joined the chat and taken over from AI. How can I assist you today?`,
    }).returning();

    res.json({ ...updated, systemMessage: sysMsg, staffName });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to takeover conversation: " + e.message });
  }
});

// PATCH /admin/conversations/:id/category — set category
router.patch("/conversations/:id/category", async (req: AuthenticatedRequest, res) => {
  try {
    const { category } = req.body;
    const VALID = ["TOUR", "HOTEL", "TAXI", "B2B", "B2C", "GENERAL"];
    if (!VALID.includes(category)) return res.status(400).json({ error: "Invalid category" });
    const [updated] = await db.update(conversationsTable)
      .set({ category })
      .where(eq(conversationsTable.id, Number(req.params.id)))
      .returning();
    res.json(updated);
  } catch { res.status(500).json({ error: "Failed to update category" }); }
});

// PATCH /admin/conversations/:id/priority — set priority
router.patch("/conversations/:id/priority", async (req: AuthenticatedRequest, res) => {
  try {
    const { priority } = req.body;
    const VALID = ["LOW", "NORMAL", "HIGH", "URGENT"];
    if (!VALID.includes(priority)) return res.status(400).json({ error: "Invalid priority" });
    const [updated] = await db.update(conversationsTable)
      .set({ priority })
      .where(eq(conversationsTable.id, Number(req.params.id)))
      .returning();
    res.json(updated);
  } catch { res.status(500).json({ error: "Failed to update priority" }); }
});

// POST /admin/conversations/:id/notes — add internal staff note
router.post("/conversations/:id/notes", async (req: AuthenticatedRequest, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: "Note content required" });
    const [note] = await db.insert(chatNotesTable).values({
      conversationId: Number(req.params.id),
      authorId: req.user!.id,
      authorName: req.user!.email,
      content: content.trim(),
    }).returning();
    res.status(201).json(note);
  } catch { res.status(500).json({ error: "Failed to add note" }); }
});

// GET /admin/conversations/:id/notes — fetch internal notes
router.get("/conversations/:id/notes", async (req: AuthenticatedRequest, res) => {
  try {
    const notes = await db.select().from(chatNotesTable)
      .where(eq(chatNotesTable.conversationId, Number(req.params.id)))
      .orderBy(asc(chatNotesTable.createdAt));
    res.json(notes);
  } catch { res.status(500).json({ error: "Failed to fetch notes" }); }
});

// POST /admin/conversations/:id/ban — ban a guest session/phone/email
router.post("/conversations/:id/ban", async (req: AuthenticatedRequest, res) => {
  const perms: string[] = JSON.parse(req.user?.adminPermissions || '["ALL"]');
  const isSupervisor = req.user?.role === "SUPERADMIN" || perms.includes("ALL");
  if (!isSupervisor) return res.status(403).json({ error: "Only supervisors can ban guests." });
  try {
    const { type, value, reason } = req.body; // type: SESSION | PHONE | EMAIL
    if (!type || !value) return res.status(400).json({ error: "type and value are required" });
    const [entry] = await db.insert(chatBlocklistTable).values({
      type, value, reason: reason || "Banned by admin",
      blockedBy: req.user!.id,
    }).returning();
    // Also update conversation status to SPAM
    await db.update(conversationsTable)
      .set({ status: "SPAM", isBanned: true })
      .where(eq(conversationsTable.id, Number(req.params.id)));
    res.status(201).json(entry);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to ban guest: " + e.message });
  }
});

// GET /admin/blocklist — list all banned sessions/phones/emails
router.get("/blocklist", async (req: AuthenticatedRequest, res) => {
  try {
    const list = await db.select().from(chatBlocklistTable).orderBy(desc(chatBlocklistTable.createdAt));
    res.json(list);
  } catch { res.status(500).json({ error: "Failed to fetch blocklist" }); }
});

// DELETE /admin/blocklist/:id — unban
router.delete("/blocklist/:id", async (req: AuthenticatedRequest, res) => {
  const perms: string[] = JSON.parse(req.user?.adminPermissions || '["ALL"]');
  const isSupervisor = req.user?.role === "SUPERADMIN" || perms.includes("ALL");
  if (!isSupervisor) return res.status(403).json({ error: "Only supervisors can unban." });
  try {
    await db.delete(chatBlocklistTable).where(eq(chatBlocklistTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Failed to unban" }); }
});

// ─────────────────────────────────────────────────────────────
// CHAT AGENT MANAGEMENT
// Only SUPERADMIN can create/manage chat agents
// ─────────────────────────────────────────────────────────────

// GET /admin/chat-agents — list all chat agents
router.get("/chat-agents", async (req: AuthenticatedRequest, res) => {
  try {
    const agents = await db
      .select({
        id: chatAgentsTable.id,
        userId: chatAgentsTable.userId,
        department: chatAgentsTable.department,
        isSupervisor: chatAgentsTable.isSupervisor,
        isAvailable: chatAgentsTable.isAvailable,
        maxConcurrentChats: chatAgentsTable.maxConcurrentChats,
        displayName: chatAgentsTable.displayName,
        createdAt: chatAgentsTable.createdAt,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
      })
      .from(chatAgentsTable)
      .innerJoin(usersTable, eq(chatAgentsTable.userId, usersTable.id))
      .orderBy(desc(chatAgentsTable.createdAt));
    res.json(agents);
  } catch { res.status(500).json({ error: "Failed to fetch chat agents" }); }
});

// POST /admin/chat-agents — assign a staff user as chat agent with department
router.post("/chat-agents", async (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== "SUPERADMIN") {
    return res.status(403).json({ error: "Only SUPERADMIN can manage chat agents." });
  }
  try {
    const { userId, department, isSupervisor, maxConcurrentChats, displayName } = req.body;
    if (!userId || !department) return res.status(400).json({ error: "userId and department are required" });
    // Verify user exists
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, Number(userId))).limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });
    // Ensure they have SUPPORT permission
    const perms: string[] = JSON.parse(user.adminPermissions || '[]');
    if (!perms.includes("SUPPORT") && !perms.includes("ALL")) {
      // Auto-add SUPPORT permission
      perms.push("SUPPORT");
      await db.update(usersTable)
        .set({ adminPermissions: JSON.stringify(perms) })
        .where(eq(usersTable.id, Number(userId)));
    }
    const [agent] = await db.insert(chatAgentsTable).values({
      userId: Number(userId),
      department,
      isSupervisor: Boolean(isSupervisor),
      maxConcurrentChats: maxConcurrentChats || 5,
      displayName: displayName || user.name,
    }).returning();
    res.status(201).json(agent);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to create chat agent: " + e.message });
  }
});

// PATCH /admin/chat-agents/:id — update agent config
router.patch("/chat-agents/:id", async (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== "SUPERADMIN") {
    return res.status(403).json({ error: "Only SUPERADMIN can manage chat agents." });
  }
  try {
    const { department, isSupervisor, isAvailable, maxConcurrentChats, displayName } = req.body;
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (department !== undefined)         updateData.department         = department;
    if (isSupervisor !== undefined)       updateData.isSupervisor       = Boolean(isSupervisor);
    if (isAvailable !== undefined)        updateData.isAvailable        = Boolean(isAvailable);
    if (maxConcurrentChats !== undefined) updateData.maxConcurrentChats = Number(maxConcurrentChats);
    if (displayName !== undefined)        updateData.displayName        = displayName;
    const [updated] = await db.update(chatAgentsTable)
      .set(updateData)
      .where(eq(chatAgentsTable.id, Number(req.params.id)))
      .returning();
    res.json(updated);
  } catch { res.status(500).json({ error: "Failed to update agent" }); }
});

// DELETE /admin/chat-agents/:id — remove agent assignment
router.delete("/chat-agents/:id", async (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== "SUPERADMIN") {
    return res.status(403).json({ error: "Only SUPERADMIN can manage chat agents." });
  }
  try {
    await db.delete(chatAgentsTable).where(eq(chatAgentsTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Failed to delete agent" }); }
});

// GET /admin/vendors — fetch registered Hotel Owners and Transporters for chat assignment
router.get("/vendors", async (req: AuthenticatedRequest, res) => {
  try {
    const vendors = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        phoneNumber: usersTable.phoneNumber,
        role: usersTable.role,
        vendorBusinessName: usersTable.vendorBusinessName,
        vendorBusinessAddress: usersTable.vendorBusinessAddress,
        vendorVerified: usersTable.vendorVerified,
      })
      .from(usersTable)
      .where(or(eq(usersTable.role, "HOTEL_OWNER"), eq(usersTable.role, "TRANSPORTER")))
      .orderBy(desc(usersTable.createdAt));
    res.json(vendors);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch vendors: " + e.message });
  }
});

// ─────────────────────────────────────────────────────────────
// SUPPORT STAFF MANAGEMENT (create logins for support agents)
// ─────────────────────────────────────────────────────────────

// POST /admin/support-staff — SUPERADMIN creates a support agent login
router.post("/support-staff", async (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== "SUPERADMIN") {
    return res.status(403).json({ error: "Only SUPERADMIN can create support staff accounts" });
  }
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, and password are required" });
    }
    const referralCode = "SUPPORT" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const passwordHash = await bcrypt.hash(password, 12);

    const [staff] = await db.insert(usersTable).values({
      name,
      email,
      passwordHash,
      role: "ADMIN",
      referralCode,
      adminPermissions: JSON.stringify(["SUPPORT", "INQUIRIES"]),
      isFirstLogin: false,
    }).returning();

    const { passwordHash: _, ...safe } = staff;
    res.status(201).json(safe);
  } catch (e: any) {
    logger.error({ error: e.message }, "Support staff creation error");
    res.status(500).json({ error: "Failed to create support staff: " + e.message });
  }
});

// GET /admin/support-staff — list all support agents
router.get("/support-staff", async (req: AuthenticatedRequest, res) => {
  try {
    const staff = await db
      .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, adminPermissions: usersTable.adminPermissions, createdAt: usersTable.createdAt })
      .from(usersTable)
      .where(or(eq(usersTable.role, "ADMIN"), eq(usersTable.role, "SUPERADMIN")))
      .orderBy(desc(usersTable.createdAt));
    res.json(staff);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch support staff" });
  }
});

// ─────────────────────────────────────────────────────────────
// ATTRACTIONS MANAGEMENT
// ─────────────────────────────────────────────────────────────

router.get("/attractions", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    const { destinationId } = req.query;
    const list = await db
      .select({ attraction: attractionsTable, destinationName: destinationsTable.name })
      .from(attractionsTable)
      .leftJoin(destinationsTable, eq(attractionsTable.destinationId, destinationsTable.id))
      .orderBy(asc(attractionsTable.displayOrder), attractionsTable.name);
    const filtered = destinationId
      ? list.filter(r => r.attraction.destinationId === Number(destinationId))
      : list;
    res.json(filtered.map(r => ({ ...r.attraction, destinationName: r.destinationName })));
  } catch (e: any) { res.status(500).json({ error: "Failed to fetch attractions" }); }
});

router.post("/attractions", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id; delete data.destinationName; delete data.createdAt; delete data.updatedAt;
    if (!data.slug && data.name) {
      data.slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    }
    const [inserted] = await db.insert(attractionsTable).values(data).returning();
    clearCachePattern("cache:/api/attractions*");
    res.status(201).json(inserted);
  } catch (e: any) { res.status(500).json({ error: "Failed to create attraction: " + e.message }); }
});

router.patch("/attractions/:id", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id; delete data.destinationName; delete data.createdAt; delete data.updatedAt;
    const [updated] = await db.update(attractionsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(attractionsTable.id, Number(req.params.id))).returning();
    clearCachePattern("cache:/api/attractions*");
    res.json(updated);
  } catch (e: any) { res.status(500).json({ error: "Failed to update attraction" }); }
});

router.delete("/attractions/:id", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    await db.delete(attractionsTable).where(eq(attractionsTable.id, Number(req.params.id)));
    clearCachePattern("cache:/api/attractions*");
    res.json({ message: "Attraction deleted" });
  } catch (e: any) { res.status(500).json({ error: "Failed to delete attraction" }); }
});

// ─────────────────────────────────────────────────────────────
// ACTIVITIES MANAGEMENT
// ─────────────────────────────────────────────────────────────

router.get("/activities", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    const { destinationId } = req.query;
    const list = await db
      .select({ activity: activitiesTable, destinationName: destinationsTable.name })
      .from(activitiesTable)
      .leftJoin(destinationsTable, eq(activitiesTable.destinationId, destinationsTable.id))
      .orderBy(asc(activitiesTable.displayOrder), activitiesTable.name);
    const filtered = destinationId
      ? list.filter(r => r.activity.destinationId === Number(destinationId))
      : list;
    res.json(filtered.map(r => ({ ...r.activity, destinationName: r.destinationName })));
  } catch (e: any) { res.status(500).json({ error: "Failed to fetch activities" }); }
});

router.post("/activities", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id; delete data.destinationName; delete data.createdAt; delete data.updatedAt;
    if (!data.slug && data.name) {
      data.slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    }
    const [inserted] = await db.insert(activitiesTable).values(data).returning();
    clearCachePattern("cache:/api/activities*");
    res.status(201).json(inserted);
  } catch (e: any) { res.status(500).json({ error: "Failed to create activity: " + e.message }); }
});

router.patch("/activities/:id", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id; delete data.destinationName; delete data.createdAt; delete data.updatedAt;
    const [updated] = await db.update(activitiesTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(activitiesTable.id, Number(req.params.id))).returning();
    clearCachePattern("cache:/api/activities*");
    res.json(updated);
  } catch (e: any) { res.status(500).json({ error: "Failed to update activity" }); }
});

router.delete("/activities/:id", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    await db.delete(activitiesTable).where(eq(activitiesTable.id, Number(req.params.id)));
    clearCachePattern("cache:/api/activities*");
    res.json({ message: "Activity deleted" });
  } catch (e: any) { res.status(500).json({ error: "Failed to delete activity" }); }
});

// ─────────────────────────────────────────────────────────────
// DINING POINTS MANAGEMENT
// ─────────────────────────────────────────────────────────────

router.get("/dining", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    const { destinationId } = req.query;
    const list = await db
      .select({ dining: diningPointsTable, destinationName: destinationsTable.name })
      .from(diningPointsTable)
      .leftJoin(destinationsTable, eq(diningPointsTable.destinationId, destinationsTable.id))
      .orderBy(asc(diningPointsTable.displayOrder), diningPointsTable.name);
    const filtered = destinationId
      ? list.filter(r => r.dining.destinationId === Number(destinationId))
      : list;
    res.json(filtered.map(r => ({ ...r.dining, destinationName: r.destinationName })));
  } catch (e: any) { res.status(500).json({ error: "Failed to fetch dining points" }); }
});

router.post("/dining", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id; delete data.destinationName; delete data.createdAt; delete data.updatedAt;
    if (!data.slug && data.name) {
      data.slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    }
    const [inserted] = await db.insert(diningPointsTable).values(data).returning();
    clearCachePattern("cache:/api/dining*");
    res.status(201).json(inserted);
  } catch (e: any) { res.status(500).json({ error: "Failed to create dining point: " + e.message }); }
});

router.patch("/dining/:id", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id; delete data.destinationName; delete data.createdAt; delete data.updatedAt;
    const [updated] = await db.update(diningPointsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(diningPointsTable.id, Number(req.params.id))).returning();
    clearCachePattern("cache:/api/dining*");
    res.json(updated);
  } catch (e: any) { res.status(500).json({ error: "Failed to update dining point" }); }
});

router.delete("/dining/:id", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    await db.delete(diningPointsTable).where(eq(diningPointsTable.id, Number(req.params.id)));
    clearCachePattern("cache:/api/dining*");
    res.json({ message: "Dining point deleted" });
  } catch (e: any) { res.status(500).json({ error: "Failed to delete dining point" }); }
});

// ─────────────────────────────────────────────────────────────
// TRAVEL GUIDES MANAGEMENT
// Independent from Destinations. Manages long-form editorial traveller content.
// ─────────────────────────────────────────────────────────────

// GET /admin/travel-guides — list all guides
router.get("/travel-guides", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    const list = await db.select().from(travelGuidesTable).orderBy(travelGuidesTable.displayOrder, travelGuidesTable.title);
    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch travel guides" });
  }
});

// GET /admin/travel-guides/:id — single guide
router.get("/travel-guides/:id", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    const [guide] = await db.select().from(travelGuidesTable)
      .where(eq(travelGuidesTable.id, Number(req.params.id))).limit(1);
    if (!guide) return res.status(404).json({ error: "Travel guide not found" });
    res.json(guide);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch travel guide" });
  }
});

// POST /admin/travel-guides — create
router.post("/travel-guides", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id; delete data.createdAt; delete data.updatedAt;
    if (!data.slug && data.title) {
      data.slug = data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') + '-travel-guide';
    }
    const [inserted] = await db.insert(travelGuidesTable).values(data).returning();
    clearCachePattern("cache:/api/travel-guides*");
    res.status(201).json(inserted);
  } catch (e: any) {
    logger.error({ error: e.message }, "Travel guide creation error");
    res.status(500).json({ error: "Failed to create travel guide: " + e.message });
  }
});

// PATCH /admin/travel-guides/:id — update
router.patch("/travel-guides/:id", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id; delete data.createdAt; delete data.updatedAt;
    // Set publishedAt when publishing for the first time
    if (data.isPublished && !data.publishedAt) {
      data.publishedAt = new Date();
    }
    const [updated] = await db.update(travelGuidesTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(travelGuidesTable.id, Number(req.params.id)))
      .returning();
    if (!updated) return res.status(404).json({ error: "Travel guide not found" });
    clearCachePattern("cache:/api/travel-guides*");
    res.json(updated);
  } catch (e: any) {
    logger.error({ error: e.message }, "Travel guide update error");
    res.status(500).json({ error: "Failed to update travel guide: " + e.message });
  }
});

// DELETE /admin/travel-guides/:id — delete
router.delete("/travel-guides/:id", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    await db.delete(travelGuidesTable).where(eq(travelGuidesTable.id, Number(req.params.id)));
    clearCachePattern("cache:/api/travel-guides*");
    res.json({ message: "Travel guide deleted" });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete travel guide" });
  }
});


// ─────────────────────────────────────────────────────────────
// HOTELS — Full Admin CRUD (OTA)
// ─────────────────────────────────────────────────────────────

// GET /admin/hotels — all hotels with destination & owner info
router.get("/hotels", requirePermission("PACKAGES"), async (req, res) => {
  try {
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
      .orderBy(desc(hotelsTable.createdAt));

    res.json(results.map(r => ({
      ...r.hotel,
      destinationName: r.destinationName,
      ownerName: r.ownerName,
      ownerEmail: r.ownerEmail,
    })));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch hotels" });
  }
});

// POST /admin/hotels — admin creates a hotel directly
router.post("/hotels", requirePermission("PACKAGES"), async (req: AuthenticatedRequest, res) => {
  try {
    const data = { ...req.body };
    if (!data.slug && data.name) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString().slice(-6);
    }
    if (!data.ownerId) data.ownerId = req.user!.id;
    if (!data.destinationId) {
      const [firstDest] = await db.select().from(destinationsTable).limit(1);
      data.destinationId = firstDest?.id || 1;
    }
    delete data.id; delete data.createdAt; delete data.updatedAt;

    const [inserted] = await db.insert(hotelsTable).values(data as any).returning();
    // Create default policies
    await db.execute(sql`INSERT INTO hotel_policies (hotel_id) VALUES (${inserted.id}) ON CONFLICT DO NOTHING`);
    res.status(201).json(inserted);
  } catch (e: any) {
    logger.error({ error: e.message }, "Admin hotel creation error");
    res.status(500).json({ error: "Failed to create hotel: " + e.message });
  }
});

// GET /admin/hotels/:id — full hotel detail
router.get("/hotels/:id", requirePermission("PACKAGES"), async (req, res) => {
  try {
    const [hotel] = await db.select().from(hotelsTable).where(eq(hotelsTable.id, Number(req.params.id))).limit(1);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });
    const rooms = await db.select().from(hotelRoomsTable).where(eq(hotelRoomsTable.hotelId, hotel.id));
    const [policies] = await db.select().from(hotelPoliciesTable).where(eq(hotelPoliciesTable.hotelId, hotel.id)).limit(1);
    res.json({ ...hotel, rooms, policies: policies || null });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch hotel" });
  }
});

// PATCH /admin/hotels/:id — edit any field
router.patch("/hotels/:id", requirePermission("PACKAGES"), async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id; delete data.slug; delete data.ownerId; delete data.createdAt;
    const [updated] = await db.update(hotelsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(hotelsTable.id, Number(req.params.id)))
      .returning();
      
    if (data.status === "APPROVED") {
      const [owner] = await db.select().from(usersTable).where(eq(usersTable.id, updated.ownerId)).limit(1);
      if (owner) {
        await notifyVendorOfApproval(owner.email, updated.name);
      }
    }
    
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update hotel" });
  }
});

// DELETE /admin/hotels/:id
router.delete("/hotels/:id", requirePermission("PACKAGES"), async (req, res) => {
  try {
    await db.delete(hotelsTable).where(eq(hotelsTable.id, Number(req.params.id)));
    res.json({ message: "Hotel deleted" });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete hotel" });
  }
});

// GET /admin/hotels/:id/rooms
router.get("/hotels/:id/rooms", requirePermission("PACKAGES"), async (req, res) => {
  try {
    const rooms = await db.select().from(hotelRoomsTable).where(eq(hotelRoomsTable.hotelId, Number(req.params.id)));
    res.json(rooms);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

// POST /admin/hotels/:id/rooms
router.post("/hotels/:id/rooms", requirePermission("PACKAGES"), async (req, res) => {
  try {
    const hotelId = Number(req.params.id);
    const [room] = await db.insert(hotelRoomsTable).values({ hotelId, ...req.body } as any).returning();
    await db.execute(sql`UPDATE hotels SET total_rooms = (SELECT count(*) FROM hotel_rooms WHERE hotel_id = ${hotelId}) WHERE id = ${hotelId}`);
    res.status(201).json(room);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to add room: " + e.message });
  }
});

// PATCH /admin/hotels/:id/rooms/:roomId
router.patch("/hotels/:id/rooms/:roomId", requirePermission("PACKAGES"), async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id; delete data.hotelId;
    const [updated] = await db.update(hotelRoomsTable)
      .set(data as any)
      .where(and(eq(hotelRoomsTable.id, Number(req.params.roomId)), eq(hotelRoomsTable.hotelId, Number(req.params.id))))
      .returning();
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update room" });
  }
});

// DELETE /admin/hotels/:id/rooms/:roomId
router.delete("/hotels/:id/rooms/:roomId", requirePermission("PACKAGES"), async (req, res) => {
  try {
    const hotelId = Number(req.params.id);
    await db.delete(hotelRoomsTable)
      .where(and(eq(hotelRoomsTable.id, Number(req.params.roomId)), eq(hotelRoomsTable.hotelId, hotelId)));
    await db.execute(sql`UPDATE hotels SET total_rooms = (SELECT count(*) FROM hotel_rooms WHERE hotel_id = ${hotelId}) WHERE id = ${hotelId}`);
    res.json({ message: "Room deleted" });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete room" });
  }
});

// GET /admin/hotel-bookings — all hotel bookings with guest, hotel and room details
router.get("/hotel-bookings", requirePermission("HOTELS"), async (req, res) => {
  try {
    const { status, hotelId, limit = "100", offset = "0" } = req.query;
    const rows = await db.execute(sql`
      SELECT
        b.id, b.status, b.payment_status AS "paymentStatus",
        b.travel_date AS "travelDate", b.travelers_count AS "travelersCount",
        b.adults_count AS "adultsCount", b.children_count AS "childrenCount",
        b.total_amount AS "totalAmount", b.final_paid_amount AS "finalPaidAmount",
        b.meal_plan AS "mealPlan", b.special_requests AS "specialRequests",
        b.created_at AS "createdAt", b.booking_type AS "bookingType",
        u.name AS "guestName", u.email AS "guestEmail", u.phone AS "guestPhone",
        h.name AS "hotelName", h.city AS "hotelCity",
        r.name AS "roomName", r.type AS "roomType"
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN hotels h ON b.hotel_id = h.id
      LEFT JOIN hotel_rooms r ON b.room_id = r.id
      WHERE b.booking_type = 'HOTEL'
        ${status ? sql`AND b.status = ${String(status)}` : sql``}
        ${hotelId ? sql`AND b.hotel_id = ${Number(hotelId)}` : sql``}
      ORDER BY b.created_at DESC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `);
    res.json(rows.rows);
  } catch (e: any) {
    logger.error({ error: e.message }, "Failed to fetch hotel bookings");
    res.status(500).json({ error: "Failed to fetch hotel bookings" });
  }
});

// PATCH /admin/hotel-bookings/:id — update booking status
router.patch("/hotel-bookings/:id", requirePermission("HOTELS"), async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const [updated] = await db.update(bookingsTable)
      .set({ ...(status && { status }), ...(paymentStatus && { paymentStatus }), updatedAt: new Date() })
      .where(eq(bookingsTable.id, Number(req.params.id)))
      .returning();
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update booking" });
  }
});

// ─────────────────────────────────────────────────────────────
// PENDING CITY REQUESTS — Admin Alert System
// Vendors submit custom cities not in our CMS — admin reviews and resolves
// ─────────────────────────────────────────────────────────────

// GET /admin/pending-cities — list with vendor info
router.get("/pending-cities", requirePermission("PACKAGES"), async (req, res) => {
  try {
    const { status = "PENDING" } = req.query;
    const rows = await db.execute(sql`
      SELECT 
        pcr.id, pcr.city_name as "cityName", pcr.state_name as "stateName",
        pcr.country_name as "countryName", pcr.status, pcr.hotel_id as "hotelId",
        pcr.state_id as "stateId", pcr.country_id as "countryId",
        pcr.admin_note as "adminNote", pcr.created_at as "createdAt",
        pcr.resolved_at as "resolvedAt",
        u.name as "vendorName", u.email as "vendorEmail",
        h.name as "hotelName", h.slug as "hotelSlug"
      FROM pending_city_requests pcr
      LEFT JOIN users u ON pcr.vendor_id = u.id
      LEFT JOIN hotels h ON pcr.hotel_id = h.id
      WHERE pcr.status = ${status as string}
      ORDER BY pcr.created_at DESC
      LIMIT 100
    `) as any;

    // Count for alert badge
    const countRow = await db.execute(sql`
      SELECT COUNT(*)::int as count FROM pending_city_requests WHERE status = 'PENDING'
    `) as any;

    res.json({
      requests: rows.rows || [],
      pendingCount: Number(countRow.rows?.[0]?.count || 0),
    });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch pending city requests" });
  }
});

// PATCH or POST /admin/pending-cities/:id — resolve (accept/approve or reject)
const resolvePendingCity = async (req: AuthenticatedRequest, res: import("express").Response) => {
  try {
    const { id } = req.params;
    const { action, adminNote, destinationData, existingDestinationId } = req.body;
    // action: 'ACCEPT' | 'APPROVE' or 'REJECT'

    const pcrResult = await db.execute(sql`
      SELECT * FROM pending_city_requests WHERE id = ${Number(id)}
    `) as any;
    const request = pcrResult.rows?.[0];
    if (!request) return res.status(404).json({ error: "Request not found" });

    const isApprove = action === "ACCEPT" || action === "APPROVE";

    if (isApprove) {
      let resolvedDestId: number;
      let resolvedDestSlug: string;
      let resolvedStateId: number | null = null;
      let resolvedCountryId: number | null = null;
      let resolvedStateSlug: string | null = null;
      let resolvedCountrySlug: string | null = null;

      if (existingDestinationId) {
        // Link to existing destination
        const [existingDest] = await db.select().from(destinationsTable)
          .where(eq(destinationsTable.id, Number(existingDestinationId))).limit(1);
        if (!existingDest) return res.status(400).json({ error: "Existing destination not found" });

        resolvedDestId = existingDest.id;
        resolvedDestSlug = existingDest.slug;
        resolvedStateId = existingDest.stateId;
        resolvedCountryId = existingDest.countryId;
      } else {
        // Create new destination in CMS
        const data = destinationData || {};
        const name = data.name || request.cityName;
        const newDestSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-");

        const [newDest] = await db.insert(destinationsTable).values({
          name,
          slug: data.slug || newDestSlug,
          stateId: data.stateId || request.stateId || null,
          countryId: data.countryId || request.countryId || null,
          description: data.description || null,
          isActive: true,
          isFeatured: false,
          packageCount: 0,
          displayOrder: 0,
        } as any).returning();

        resolvedDestId = newDest.id;
        resolvedDestSlug = newDest.slug;
        resolvedStateId = newDest.stateId;
        resolvedCountryId = newDest.countryId;
      }

      // Resolve state and country slugs
      if (resolvedStateId) {
        const [st] = await db.select({ slug: statesTable.slug, countryId: statesTable.countryId })
          .from(statesTable).where(eq(statesTable.id, resolvedStateId)).limit(1);
        if (st) {
          resolvedStateSlug = st.slug;
          if (st.countryId && !resolvedCountryId) resolvedCountryId = st.countryId;
        }
      }
      if (resolvedCountryId) {
        const [cn] = await db.select({ slug: countriesTable.slug })
          .from(countriesTable).where(eq(countriesTable.id, resolvedCountryId)).limit(1);
        if (cn) { resolvedCountrySlug = cn.slug; }
      }

      // Update the hotel to use the new proper destination
      if (request.hotel_id) {
        await db.execute(sql`
          UPDATE hotels SET
            destination_id = ${resolvedDestId},
            destination_slug = ${resolvedDestSlug},
            state_id = ${resolvedStateId},
            state_slug = ${resolvedStateSlug},
            country_id = ${resolvedCountryId},
            country_slug = ${resolvedCountrySlug},
            custom_city = NULL
          WHERE id = ${request.hotel_id}
        `);
      }

      // Mark request as resolved
      await db.execute(sql`
        UPDATE pending_city_requests SET
          status = 'ADDED',
          resolved_by_id = ${req.user!.id},
          resolved_destination_id = ${resolvedDestId},
          admin_note = ${adminNote || null},
          resolved_at = NOW()
        WHERE id = ${Number(id)}
      `);

      clearCachePattern("cache:/api/hotels*");
      clearCachePattern("cache:/api/ota/home/top-destinations*");

      res.json({ message: "City resolved and hotel updated", destinationId: resolvedDestId });
    } else {
      // REJECT
      await db.execute(sql`
        UPDATE pending_city_requests SET
          status = 'REJECTED',
          resolved_by_id = ${req.user!.id},
          admin_note = ${adminNote || null},
          resolved_at = NOW()
        WHERE id = ${Number(id)}
      `);
      res.json({ message: "Request rejected" });
    }
  } catch (e: any) {
    logger.error({ error: e.message }, "Pending city resolution error");
    res.status(500).json({ error: "Failed to resolve city request: " + e.message });
  }
};

router.post("/pending-cities/:id", requirePermission("PACKAGES"), resolvePendingCity);
router.patch("/pending-cities/:id", requirePermission("PACKAGES"), resolvePendingCity);

// ─────────────────────────────────────────────────────────────────────────────
// TRANSPORT VEHICLES — Admin CRUD (GET all, PATCH status/featured)
// Admin panel calls: GET /admin/transport-vehicles
//                   PATCH /admin/transport-vehicles/:id
// ─────────────────────────────────────────────────────────────────────────────

// GET /admin/transport-vehicles — all vehicles with owner + city name + vendor info
router.get("/transport-vehicles", requirePermission("TRANSPORT"), async (req: AuthenticatedRequest, res) => {
  try {
    const vehicles = await db.execute(sql`
      SELECT
        tv.*,
        u.name              AS owner_name,
        u.email             AS owner_email,
        tv2.business_name   AS vendor_business_name_full,
        COALESCE(d.name, tv.custom_city) AS city_name
      FROM transport_vehicles tv
      LEFT JOIN users u            ON tv.owner_id   = u.id
      LEFT JOIN transport_vendors tv2 ON tv.vendor_id = tv2.id
      LEFT JOIN destinations d     ON tv.destination_id = d.id
      ORDER BY tv.created_at DESC
    `);
    res.json(vehicles.rows);
  } catch (e: any) {
    logger.error({ error: e.message }, "Admin transport-vehicles GET error");
    res.status(500).json({ error: "Failed to fetch transport vehicles" });
  }
});

// PATCH /admin/transport-vehicles/:id — update status, isFeatured, adminNote, etc.
router.patch("/transport-vehicles/:id", requirePermission("TRANSPORT"), async (req: AuthenticatedRequest, res) => {
  try {
    const vehicleId = Number(req.params.id);
    const data: any = { ...req.body, updatedAt: new Date() };
    // Strip immutable fields
    delete data.id; delete data.ownerId; delete data.vendorId;
    delete data.slug; delete data.createdAt;
    delete data.owner_name; delete data.owner_email; delete data.city_name; delete data.vendor_business_name_full;

    // Safe-coerce array fields (avoid Drizzle "value.map is not a function")
    if ("features" in data) data.features = toStringArray(data.features, ",");
    if ("images"   in data) data.images   = toStringArray(data.images,   "\n");

    // Numeric coercions
    if (data.minPrice          != null) data.minPrice          = Number(data.minPrice);
    if (data.basePricePerKm    != null) data.basePricePerKm    = Number(data.basePricePerKm);
    if (data.basePricePerDay   != null) data.basePricePerDay   = Number(data.basePricePerDay);
    if (data.seatingCapacity   != null) data.seatingCapacity   = Number(data.seatingCapacity);
    if (data.luggageCapacity   != null) data.luggageCapacity   = Number(data.luggageCapacity);
    if (data.displayOrder      != null) data.displayOrder      = Number(data.displayOrder);

    const [updated] = await db
      .update(transportVehiclesTable)
      .set(data)
      .where(eq(transportVehiclesTable.id, vehicleId))
      .returning();

    if (!updated) return res.status(404).json({ error: "Vehicle not found" });
    await clearCachePattern("cache:/api/transport*");
    res.json(updated);
  } catch (e: any) {
    logger.error({ error: e.message }, "Admin transport-vehicles PATCH error");
    res.status(500).json({ error: "Failed to update vehicle: " + e.message });
  }
});

// DELETE /admin/transport-vehicles/:id — soft delete (set to DRAFT)
router.delete("/transport-vehicles/:id", requirePermission("TRANSPORT"), async (req: AuthenticatedRequest, res) => {
  try {
    await db.update(transportVehiclesTable)
      .set({ status: "DRAFT" } as any)
      .where(eq(transportVehiclesTable.id, Number(req.params.id)));
    await clearCachePattern("cache:/api/transport*");
    res.json({ message: "Vehicle delisted successfully" });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete vehicle" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TRANSPORT VENDORS — Admin CRUD (GET all, PATCH status/commission)
// Admin panel calls: GET /admin/transport-vendors
//                   PATCH /admin/transport-vendors/:id
// ─────────────────────────────────────────────────────────────────────────────

// GET /admin/transport-vendors — all vendors with owner info
router.get("/transport-vendors", requirePermission("TRANSPORT"), async (req: AuthenticatedRequest, res) => {
  try {
    const vendors = await db.execute(sql`
      SELECT
        tv.*,
        u.name  AS owner_name,
        u.email AS owner_email,
        (SELECT COUNT(*) FROM transport_vehicles tvh WHERE tvh.vendor_id = tv.id) AS vehicle_count
      FROM transport_vendors tv
      LEFT JOIN users u ON tv.user_id = u.id
      ORDER BY tv.created_at DESC
    `);
    res.json(vendors.rows);
  } catch (e: any) {
    logger.error({ error: e.message }, "Admin transport-vendors GET error");
    res.status(500).json({ error: "Failed to fetch transport vendors" });
  }
});

// PATCH /admin/transport-vendors/:id — update status, commissionPct, adminNote
router.patch("/transport-vendors/:id", requirePermission("TRANSPORT"), async (req: AuthenticatedRequest, res) => {
  try {
    const vendorId = Number(req.params.id);
    const data: any = { ...req.body, updatedAt: new Date() };
    delete data.id; delete data.userId; delete data.createdAt;
    delete data.owner_name; delete data.owner_email; delete data.vehicle_count;

    if (data.commissionPct != null) data.commissionPct = Number(data.commissionPct);

    // Auto-stamp approval timestamp
    if (data.status === "APPROVED" && !data.approvedAt) {
      data.approvedAt = new Date();
    }

    const [updated] = await db
      .update(transportVendorsTable)
      .set(data)
      .where(eq(transportVendorsTable.id, vendorId))
      .returning();

    if (!updated) return res.status(404).json({ error: "Vendor not found" });

    // Notify vendor on approval
    if (data.status === "APPROVED") {
      try {
        const [owner] = await db.select().from(usersTable)
          .where(eq(usersTable.id, updated.userId)).limit(1);
        if (owner?.email) {
          await notifyVendorOfVerification(owner.email, updated.businessName || "your business");
        }
      } catch { /* non-critical */ }
    }

    res.json(updated);
  } catch (e: any) {
    logger.error({ error: e.message }, "Admin transport-vendors PATCH error");
    res.status(500).json({ error: "Failed to update vendor: " + e.message });
  }
});

export default router;

