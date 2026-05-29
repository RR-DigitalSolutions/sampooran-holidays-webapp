import { Router, type IRouter } from "express";
import healthRouter from "./health";
import destinationsRouter from "./destinations";
import packagesRouter from "./packages";
import transportRouter from "./transport";
import inquiriesRouter from "./inquiries";
import testimonialsRouter from "./testimonials";
import blogRouter from "./blog";
import mediaRouter from "./media";
import authRouter from "./auth";
import bookingsRouter from "./bookings";
import adminRouter from "./admin";
import vendorRouter from "./vendor";
import otaRouter from "./ota";
import otaHomeRouter from "./ota-home";
import attractionsRouter from "./attractions";
import activitiesRouter from "./activities";
import diningRouter from "./dining";
import travelGuidesRouter from "./travel-guides";

// Inline public chat-history route
import { db, messagesTable, conversationsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

// GET /api/chat/history?sessionId=xxx — public, for guest history restore
router.get("/chat/history", async (req: any, res: any) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.json([]);
  try {
    const [conv] = await db.select().from(conversationsTable)
      .where(eq(conversationsTable.guestSessionId, String(sessionId))).limit(1);
    if (!conv) return res.json([]);
    const msgs = await db.select().from(messagesTable)
      .where(eq(messagesTable.conversationId, conv.id))
      .orderBy(asc(messagesTable.createdAt));
    res.json(msgs);
  } catch { res.json([]); }
});

router.use(healthRouter);
router.use(destinationsRouter);
router.use(packagesRouter);
router.use(transportRouter);
router.use(inquiriesRouter);
router.use(testimonialsRouter);
router.use(blogRouter);
router.use("/media", mediaRouter);
router.use("/auth", authRouter);
router.use("/bookings", bookingsRouter);
router.use("/admin", adminRouter);
router.use("/vendor", vendorRouter);
router.use("/ota", otaRouter);
router.use("/ota/home", otaHomeRouter);
router.use(attractionsRouter);
router.use(activitiesRouter);
router.use(diningRouter);
router.use(travelGuidesRouter);

export default router;
