import { Router, type IRouter } from "express";
import { db, inquiriesTable } from "@workspace/db";
import { SubmitInquiryBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";
import { notifyVendorOfInquiry } from "../lib/notifications";
import { usersTable } from "@workspace/db";
import rateLimit from "express-rate-limit";

const router: IRouter = Router();

// 5 inquiries per 15 min per IP — prevents spam bots flooding CRM/email
const inquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many inquiries submitted. Please wait before sending another." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/inquiries", inquiryLimiter, async (req, res): Promise<void> => {
  // ── Smart Bot/Spam Protection ──
  // 1. Honeypot check (hidden fields filled by bots)
  if (req.body.website || req.body.address_confirm || req.body.honeypot) {
    // Return mock successful response to trick the bot into stopping
    res.status(201).json({
      id: 9999,
      name: "Verification",
      status: "new",
      message: "Genuine inquiry simulated",
      createdAt: new Date().toISOString(),
    });
    return;
  }

  // 2. Quick-submit time check (humans take > 1.5s to submit, bots are instant)
  const submitDuration = req.body.submitDuration ? parseInt(req.body.submitDuration) : null;
  if (submitDuration !== null && submitDuration < 1500) {
    res.status(201).json({
      id: 9999,
      name: "Verification",
      status: "new",
      message: "Speed limit exceeded",
      createdAt: new Date().toISOString(),
    });
    return;
  }

  const parsed = SubmitInquiryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [inquiry] = await db
    .insert(inquiriesTable)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || "",
      inquiryType: parsed.data.inquiryType || "general",
      packageId: parsed.data.packageId,
      hotelId: parsed.data.hotelId,
      transportId: parsed.data.transportId,
      vendorId: parsed.data.vendorId,
      destination: parsed.data.destination,
      travelDate: parsed.data.travelDate,
      numberOfPersons: (parsed.data.adults || 0) + (parsed.data.children || 0),
      message: parsed.data.message || "",
      budget: parsed.data.budget ? parseFloat(parsed.data.budget) : null,
      status: "new",
    })
    .returning();

  // Notification Logic
  if (inquiry.vendorId) {
    const [vendor] = await db.select().from(usersTable).where(eq(usersTable.id, inquiry.vendorId)).limit(1);
    if (vendor && vendor.email) {
      notifyVendorOfInquiry(vendor.email, inquiry.name, inquiry.message || "New general inquiry");
    }
  }

  res.status(201).json({
    ...inquiry,
    createdAt: inquiry.createdAt?.toISOString() ?? new Date().toISOString(),
  });
});

export default router;
