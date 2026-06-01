import { Router } from "express";
import { db, usersTable, rewardTransactionsTable, settingsTable, hotelsTable, transportServicesTable, packagesTable, countriesTable, statesTable, destinationsTable, homePageSlidesTable, homePageCategoriesTable, homePageSectionsTable, offersTable, conversationsTable, messagesTable, attractionsTable, activitiesTable, diningPointsTable, travelGuidesTable, regionsTable } from "@workspace/db";
import { eq, desc, sql, or, and, asc } from "drizzle-orm";
import { authenticate, authorize, AuthenticatedRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/permissions";
import { logger } from "../lib/logger";
import { notifyVendorOfApproval } from "../lib/notifications";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { clearCachePattern } from "../lib/cache";

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
    const passwordHash = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASS || "changeme_on_first_login", 10);
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, "admin@sampooran.com")).limit(1);
    
    if (existing.length > 0) {
      await db.update(usersTable).set({ passwordHash, role: "SUPERADMIN", name: "admin" }).where(eq(usersTable.id, existing[0].id));
      res.json({ message: "Admin user updated." });
    } else {
      await db.insert(usersTable).values({
        name: "admin",
        email: "admin@sampooran.com",
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

    const ALLOWED_ROLES = ["ADMIN", "SUPERADMIN"];
    if (!user || !ALLOWED_ROLES.includes(user.role)) {
      return res.status(401).json({ error: "Access denied. Not an administrator." });
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
router.use(authorize(["ADMIN", "SUPERADMIN"]));

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
    const { role, badge, pointsBalance, name, adminPermissions } = req.body;

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
        adminPermissions: adminPermissions ? JSON.stringify(adminPermissions) : currentUser.adminPermissions,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, Number(id)))
      .returning();

    res.json(updated);
  } catch (e: any) {
    logger.error({ error: e.message }, "Admin user update error");
    res.status(500).json({ error: "Failed to update user" });
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
    const list = await db.select().from(hotelsTable).where(eq(hotelsTable.status, "PENDING"));
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
    const data = req.body;
    // Basic slug generation if not provided
    if (!data.slug && data.name) {
      data.slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    }
    const [inserted] = await db.insert(packagesTable).values(data).returning();
    clearCachePattern("cache:/api/packages*");
    clearCachePattern("cache:/api/ota/home/config*");
    res.status(201).json(inserted);
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
    const [updated] = await db
      .update(packagesTable)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(packagesTable.id, Number(id)))
      .returning();
    clearCachePattern("cache:/api/packages*");
    clearCachePattern("cache:/api/ota/home/config*");
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
    clearCachePattern("cache:/api/ota/home/config*");
    res.json({ message: "Package deleted successfully" });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete package" });
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
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update destination" });
  }
});

router.delete("/destinations/:id", requirePermission("DESTINATIONS"), async (req, res) => {
  try {
    await db.delete(destinationsTable).where(eq(destinationsTable.id, Number(req.params.id)));
    clearCachePattern("cache:/api/ota/home/top-destinations*");
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
    res.status(201).json(inserted);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to create slide" });
  }
});

router.patch("/home/slides/:id", requirePermission("SETTINGS"), async (req, res) => {
  try {
    const [updated] = await db.update(homePageSlidesTable).set(req.body).where(eq(homePageSlidesTable.id, Number(req.params.id))).returning();
    clearCachePattern("cache:/api/ota/home/config*");
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update slide" });
  }
});

router.delete("/home/slides/:id", requirePermission("SETTINGS"), async (req, res) => {
  try {
    await db.delete(homePageSlidesTable).where(eq(homePageSlidesTable.id, Number(req.params.id)));
    clearCachePattern("cache:/api/ota/home/config*");
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
    res.json(updated);
  } catch (e: any) {
    logger.error({ error: e.message, stack: e.stack, body: req.body, id: req.params.id }, "Failed to update offer");
    res.status(500).json({ error: "Failed to update offer: " + e.message });
  }
});


router.delete("/home/offers/:id", requirePermission("SETTINGS"), async (req, res) => {
  try {
    await db.delete(offersTable).where(eq(offersTable.id, Number(req.params.id)));
    res.json({ message: "Offer deleted" });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete offer" });
  }
});

// ─────────────────────────────────────────────────────────────
// HOTEL MANAGEMENT
// ─────────────────────────────────────────────────────────────

router.get("/hotels", requirePermission("PACKAGES"), async (req, res) => {
  try {
    const list = await db.select({
      hotel: hotelsTable,
      destinationName: destinationsTable.name,
      ownerName: usersTable.name,
    })
    .from(hotelsTable)
    .leftJoin(destinationsTable, eq(hotelsTable.destinationId, destinationsTable.id))
    .leftJoin(usersTable, eq(hotelsTable.ownerId, usersTable.id))
    .orderBy(desc(hotelsTable.createdAt));
    res.json(list.map(l => ({ ...l.hotel, destinationName: l.destinationName, ownerName: l.ownerName })));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch hotels" });
  }
});

router.post("/hotels", requirePermission("PACKAGES"), async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.slug && data.name) {
      data.slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    }
    const [inserted] = await db.insert(hotelsTable).values(data).returning();
    res.status(201).json(inserted);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to create hotel: " + e.message });
  }
});

router.patch("/hotels/:id", requirePermission("PACKAGES"), async (req, res) => {
  try {
    const [updated] = await db.update(hotelsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(hotelsTable.id, Number(req.params.id))).returning();
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update hotel" });
  }
});

router.delete("/hotels/:id", requirePermission("PACKAGES"), async (req, res) => {
  try {
    await db.delete(hotelsTable).where(eq(hotelsTable.id, Number(req.params.id)));
    res.json({ message: "Hotel deleted" });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete hotel" });
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

// PATCH /admin/conversations/:id/assign — staff claims or assigns a conversation
router.patch("/conversations/:id/assign", async (req: AuthenticatedRequest, res) => {
  try {
    const staffId = req.body.staffId ?? req.user!.id; // assign to self if no staffId provided
    const [updated] = await db
      .update(conversationsTable)
      .set({ assignedStaffId: staffId })
      .where(eq(conversationsTable.id, Number(req.params.id)))
      .returning();
    
    // Get staff name for response
    const [staff] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, staffId)).limit(1);
    res.json({ ...updated, assignedStaffName: staff?.name || "Unknown" });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to assign conversation" });
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

export default router;

// Trigger restart
