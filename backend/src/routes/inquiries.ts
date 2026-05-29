import { Router, type IRouter } from "express";
import { db, inquiriesTable } from "@workspace/db";
import { SubmitInquiryBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";
import { notifyVendorOfInquiry } from "../lib/notifications";
import { usersTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/inquiries", async (req, res): Promise<void> => {
  const parsed = SubmitInquiryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [inquiry] = await db
    .insert(inquiriesTable)
    .values({
      ...parsed.data,
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
