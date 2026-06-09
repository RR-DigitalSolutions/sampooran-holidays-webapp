import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { processSignupBonus } from "../lib/rewards";
import { logger } from "../lib/logger";
import { sendWelcomeEmail } from "../lib/notifications";
import { authLimiter } from "../middleware/rate-limit";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable is required");

// Utility to generate a 6-character referral code
const generateReferralCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// Registration Logic
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phoneNumber, role, referredByCode, companyName, gstNumber } = req.body;

    // 1. Check if user already exists
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing) return res.status(400).json({ error: "Email already registered" });

    // 2. Hash password & Generate referral code
    const passwordHash = await bcrypt.hash(password, 10);
    const referralCode = generateReferralCode();

    // 3. Resolve referrer if code provided
    let referredById = null;
    if (referredByCode) {
      const [referrer] = await db.select().from(usersTable).where(eq(usersTable.referralCode, referredByCode.toUpperCase())).limit(1);
      if (referrer) referredById = referrer.id;
    }

    // 4. Create the User
    const [user] = await db.insert(usersTable).values({
      name,
      email,
      phoneNumber,
      passwordHash,
      role: role || "USER",
      referralCode,
      referredById,
      companyName,
      gstNumber,
      badge: role === "AGENT" ? "BRONZE" : null
    }).returning();

    // 5. Trigger ₹1,000 Signup Bonus LOGIC!
    const bonusCredited = await processSignupBonus(user.id);
    
    // 6. Send Welcome Email
    sendWelcomeEmail(user.email, user.name, user.role);

    // 6. Respond with success
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "8h" });
    
    res.status(201).json({
      message: "Registration successful",
      user: { id: user.id, name: user.name, email: user.email, role: user.role, pointsBalance: bonusCredited },
      token
    });

  } catch (error: any) {
    logger.error({ error: error.message }, "Registration error");
    res.status(500).json({ error: "Internal server error during registration" });
  }
});

// Login Logic — rate limited to prevent brute force
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    // Check if it's the first login ever to trigger bonus (in case registration bonus failed)
    if (user.isFirstLogin) {
      await processSignupBonus(user.id);
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "8h" });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        pointsBalance: user.pointsBalance,
        referralCode: user.referralCode,
        badge: user.badge
      },
      token
    });

  } catch (error: any) {
    logger.error({ error: error.message }, "Login error");
    res.status(500).json({ error: "Internal server error during login" });
  }
});


// ─────────────────────────────────────────────────────────────
// VENDOR / HOTEL OWNER Registration
// ─────────────────────────────────────────────────────────────
router.post("/vendor/register", async (req, res) => {
  try {
    const {
      name, email, password, phoneNumber,
      vendorBusinessName, vendorBusinessAddress,
      companyName, gstNumber,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing) return res.status(400).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const referralCode = "VND" + Math.random().toString(36).substring(2, 7).toUpperCase();

    const [vendor] = await db.insert(usersTable).values({
      name,
      email,
      phoneNumber,
      passwordHash,
      role: "HOTEL_OWNER",
      vendorBusinessName,
      vendorBusinessAddress,
      companyName,
      gstNumber,
      referralCode,
      vendorVerified: true, // Auto-approved for dashboard access, property requires verification
      isFirstLogin: false,
    }).returning();

    const token = jwt.sign(
      { id: vendor.id, email: vendor.email, role: vendor.role },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(201).json({
      message: "Vendor account created successfully.",
      vendor: {
        id: vendor.id,
        name: vendor.name,
        email: vendor.email,
        role: vendor.role,
        vendorVerified: vendor.vendorVerified,
      },
      token,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Vendor registration error");
    res.status(500).json({ error: "Registration failed" });
  }
});

// VENDOR Login — rate limited
router.post("/vendor/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    // Only allow HOTEL_OWNER / TRANSPORTER roles
    const VENDOR_ROLES = ["HOTEL_OWNER", "TRANSPORTER"];
    if (!VENDOR_ROLES.includes(user.role)) {
      return res.status(403).json({ error: "Access denied. This login is for property vendors only." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        vendorBusinessName: user.vendorBusinessName,
        vendorVerified: user.vendorVerified,
        companyName: user.companyName,
        profilePicUrl: user.profilePicUrl,
      },
      token,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Vendor login error");
    res.status(500).json({ error: "Login failed" });
  }
});

// VENDOR: Get own profile (authenticated via middleware)
router.get("/vendor/me", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
    if (!user) return res.status(404).json({ error: "Vendor not found" });
    const { passwordHash, ...safe } = user;
    res.json(safe);
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
