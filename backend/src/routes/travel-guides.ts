import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, travelGuidesTable } from "@workspace/db";

const router: IRouter = Router();

/**
 * PUBLIC TRAVEL GUIDE ROUTES
 *
 * These routes serve the frontend website.
 * Travel Guides are completely independent from the Destinations/package listing data.
 */

// GET /travel-guides — list all published travel guides
router.get("/travel-guides", async (_req, res): Promise<void> => {
  try {
    const guides = await db
      .select({
        id: travelGuidesTable.id,
        slug: travelGuidesTable.slug,
        title: travelGuidesTable.title,
        entityType: travelGuidesTable.entityType,
        entityId: travelGuidesTable.entityId,
        heroImageUrl: travelGuidesTable.heroImageUrl,
        shortDescription: travelGuidesTable.shortDescription,
        bestTimeToVisit: travelGuidesTable.bestTimeToVisit,
        famousFor: travelGuidesTable.famousFor,
        isPublished: travelGuidesTable.isPublished,
        publishedAt: travelGuidesTable.publishedAt,
        displayOrder: travelGuidesTable.displayOrder,
      })
      .from(travelGuidesTable)
      .where(eq(travelGuidesTable.isPublished, true))
      .orderBy(travelGuidesTable.displayOrder, travelGuidesTable.title);

    res.json({ guides, total: guides.length });
  } catch (error) {
    console.error("Travel guides list error:", error);
    res.status(500).json({ error: "Failed to fetch travel guides" });
  }
});

// GET /travel-guides/:slug — single published travel guide by slug
router.get("/travel-guides/:slug", async (req, res): Promise<void> => {
  try {
    const { slug } = req.params;
    const [guide] = await db
      .select()
      .from(travelGuidesTable)
      .where(and(
        eq(travelGuidesTable.slug, slug),
        eq(travelGuidesTable.isPublished, true)
      ))
      .limit(1);

    if (!guide) {
      res.status(404).json({ error: "Travel guide not found" });
      return;
    }

    res.json(guide);
  } catch (error) {
    console.error("Travel guide fetch error:", error);
    res.status(500).json({ error: "Failed to fetch travel guide" });
  }
});

export default router;
