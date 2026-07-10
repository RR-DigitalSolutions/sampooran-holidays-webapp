import { Router } from "express";
import { db, bookingsTable, usersTable, packagesTable, packageCalendarInventoryTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";
import { processReferralEarnings } from "../lib/rewards";
import { logger } from "../lib/logger";
import rateLimit from "express-rate-limit";

const router = Router();

// 10 bookings per 15 min per IP — even authenticated users shouldn't flood bookings
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many booking requests. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Create a new booking with automatic referral logic
router.post("/", bookingLimiter, authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { packageId, travelDate, travelersCount, adultsCount, childrenCount, infantsCount, specialRequests } = req.body;

    // 1. Fetch package details for pricing
    const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, packageId)).limit(1);
    if (!pkg) return res.status(404).json({ error: "Package not found" });

    // Enforce travelers age details fallbacks
    const adults = Number(adultsCount) || Number(travelersCount) || 2;
    const children = Number(childrenCount) || 0;
    const infants = Number(infantsCount) || 0;

    // Enforce rule: minimum 2 adults required to add children or infants
    if (adults < 2 && (children > 0 || infants > 0)) {
      return res.status(400).json({ error: "A minimum of 2 adults is required to add children or infants to the booking." });
    }

    // Min/Max guest size validations
    const totalGuests = adults + children;
    const minGuests = pkg.minGuests ?? 2;
    const maxGuests = pkg.maxGuests ?? 10;
    if (totalGuests < minGuests) {
      return res.status(400).json({ error: `This package requires a minimum of ${minGuests} travelers.` });
    }
    if (totalGuests > maxGuests) {
      return res.status(400).json({ error: `This package allows a maximum of ${maxGuests} travelers.` });
    }

    // ── Calculate dynamic pricing from calendar overrides ──
    const d = new Date(travelDate);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const [override] = await db
      .select()
      .from(packageCalendarInventoryTable)
      .where(
        and(
          eq(packageCalendarInventoryTable.packageId, packageId),
          eq(packageCalendarInventoryTable.date, dateStr)
        )
      )
      .limit(1);

    let pricePerPerson = pkg.pricePerPerson;

    if (override) {
      if (override.rateType === "blackout") {
        return res.status(400).json({ error: "The selected date is sold out (blackout date)." });
      }
      if (override.rateType === "price-on-request") {
        return res.status(400).json({ error: "This package requires a custom quote for the selected date. Please use the inquiry form." });
      }

      // Calculate modified price
      const modVal = Number(override.priceModifierValue) || 0;
      if (override.priceModifierType === "fixed") {
        pricePerPerson = modVal;
      } else if (override.priceModifierType === "percentage") {
        pricePerPerson = pkg.pricePerPerson * (1 + modVal / 100);
      } else if (override.priceModifierType === "value") {
        pricePerPerson = pkg.pricePerPerson + modVal;
      }

      // Apply discount
      const discVal = Number(override.discountValue) || 0;
      if (override.discountType === "percentage") {
        pricePerPerson = pricePerPerson * (1 - discVal / 100);
      } else if (override.discountType === "flat") {
        pricePerPerson = Math.max(0, pricePerPerson - discVal);
      }
    }

    // Calculate final cost based on group pricing or standard pricing
    let totalAmount = 0;
    if (pkg.isGroupPricing) {
      const baseCap = pkg.groupBaseCapacity ?? 2;
      const adultsInBase = Math.min(adults, baseCap);
      const childrenInBase = Math.min(children, baseCap - adultsInBase);
      const extraAdults = adults - adultsInBase;
      const extraChildren = children - childrenInBase;

      const baseCost = baseCap * pricePerPerson;
      const extraAdultsCost = extraAdults * Number(pkg.extraPersonPrice || 0);
      const extraChildrenCost = extraChildren * Number(pkg.extraChildPrice || 0);

      totalAmount = baseCost + extraAdultsCost + extraChildrenCost;
    } else {
      const adultsCost = adults * pricePerPerson;
      const childrenCost = children * Math.round(pricePerPerson * 0.5);
      totalAmount = adultsCost + childrenCost;
    }

    // 2. Create the booking record
    const [booking] = await db.insert(bookingsTable).values({
      userId,
      packageId,
      travelDate: new Date(travelDate),
      travelersCount: totalGuests,
      adultsCount: adults,
      childrenCount: children,
      infantsCount: infants,
      totalAmount,
      finalPaidAmount: totalAmount, // For now, assume full payment
      status: "PENDING",
      specialRequests
    }).returning();

    // 3. SECURE REFERRAL LOGIC: Check if user was referred
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    
    if (user && user.referredById) {
      // Automatic calculation and crediting of referral percentages to both sides!
      await processReferralEarnings(user.referredById, userId, totalAmount, booking.id);
    }

    // 4. Update Agent stats if applicable
    if (user.role === 'AGENT') {
      await db.update(usersTable)
        .set({ lifetimeSalesCount: (user.lifetimeSalesCount || 0) + 1 })
        .where(eq(usersTable.id, userId));
      
      // TODO: Implement Badge upgrade milestone checks here
    }

    res.status(201).json({
      message: "Booking created successfully and rewards processed",
      booking
    });

  } catch (error: any) {
    logger.error({ error: error.message }, "Booking creation error");
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// Get user's bookings
router.get("/my", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const myBookings = await db.select().from(bookingsTable).where(eq(bookingsTable.userId, userId));
    res.json(myBookings);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

export default router;
