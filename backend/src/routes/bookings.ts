import { Router } from "express";
import { db, bookingsTable, usersTable, packagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";
import { processReferralEarnings } from "../lib/rewards";
import { logger } from "../lib/logger";

const router = Router();

// Create a new booking with automatic referral logic
router.post("/", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { packageId, travelDate, travelersCount, specialRequests } = req.body;

    // 1. Fetch package details for pricing
    const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, packageId)).limit(1);
    if (!pkg) return res.status(404).json({ error: "Package not found" });

    const totalAmount = pkg.pricePerPerson * travelersCount;

    // 2. Create the booking record
    const [booking] = await db.insert(bookingsTable).values({
      userId,
      packageId,
      travelDate: new Date(travelDate),
      travelersCount,
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
