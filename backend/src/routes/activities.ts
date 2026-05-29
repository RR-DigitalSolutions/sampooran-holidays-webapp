import { Router } from "express";
import { db, activitiesTable, destinationsTable } from "@workspace/db";
import { eq, and, asc, desc } from "drizzle-orm";
import { cacheMiddleware } from "../lib/cache";

const router = Router();

// ─── PUBLIC: List activities ─────────────────────────────────────────────────
// GET /api/activities?destinationId=&type=&featured=true
router.get("/activities", cacheMiddleware(300), async (req, res) => {
  try {
    const { destinationId, type, featured, limit = "50" } = req.query as Record<string, string>;
    const filters: any[] = [eq(activitiesTable.isActive, true)];

    if (destinationId) filters.push(eq(activitiesTable.destinationId, Number(destinationId)));
    if (type) filters.push(eq(activitiesTable.type, type));
    if (featured === "true") filters.push(eq(activitiesTable.isFeatured, true));

    const list = await db
      .select({
        activity: activitiesTable,
        destinationName: destinationsTable.name,
        destinationSlug: destinationsTable.slug,
      })
      .from(activitiesTable)
      .leftJoin(destinationsTable, eq(activitiesTable.destinationId, destinationsTable.id))
      .where(and(...filters))
      .orderBy(asc(activitiesTable.displayOrder), asc(activitiesTable.name))
      .limit(Number(limit));

    res.json(list.map((r) => ({ ...r.activity, destinationName: r.destinationName, destinationSlug: r.destinationSlug })));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch activities: " + e.message });
  }
});

// ─── PUBLIC: Single activity ────────────────────────────────────────────────
// GET /api/activities/:id
router.get("/activities/:id", cacheMiddleware(600), async (req, res) => {
  try {
    const [row] = await db
      .select({
        activity: activitiesTable,
        destinationName: destinationsTable.name,
        destinationSlug: destinationsTable.slug,
      })
      .from(activitiesTable)
      .leftJoin(destinationsTable, eq(activitiesTable.destinationId, destinationsTable.id))
      .where(eq(activitiesTable.id, Number(req.params.id)))
      .limit(1);

    if (!row) return res.status(404).json({ error: "Activity not found" });
    res.json({ ...row.activity, destinationName: row.destinationName, destinationSlug: row.destinationSlug });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

export default router;
