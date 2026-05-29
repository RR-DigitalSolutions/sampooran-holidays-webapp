import { Router } from "express";
import { db, attractionsTable, destinationsTable } from "@workspace/db";
import { eq, and, asc, desc } from "drizzle-orm";
import { cacheMiddleware } from "../lib/cache";

const router = Router();

// ─── PUBLIC: List attractions ─────────────────────────────────────────────────
// GET /api/attractions?destinationId=&type=&featured=true
router.get("/attractions", cacheMiddleware(300), async (req, res) => {
  try {
    const { destinationId, type, featured, limit = "50" } = req.query as Record<string, string>;
    const filters: any[] = [eq(attractionsTable.isActive, true)];

    if (destinationId) filters.push(eq(attractionsTable.destinationId, Number(destinationId)));
    if (type) filters.push(eq(attractionsTable.type, type));
    if (featured === "true") filters.push(eq(attractionsTable.isFeatured, true));

    const list = await db
      .select({
        attraction: attractionsTable,
        destinationName: destinationsTable.name,
        destinationSlug: destinationsTable.slug,
      })
      .from(attractionsTable)
      .leftJoin(destinationsTable, eq(attractionsTable.destinationId, destinationsTable.id))
      .where(and(...filters))
      .orderBy(asc(attractionsTable.displayOrder), asc(attractionsTable.name))
      .limit(Number(limit));

    res.json(list.map((r) => ({ ...r.attraction, destinationName: r.destinationName, destinationSlug: r.destinationSlug })));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch attractions: " + e.message });
  }
});

// ─── PUBLIC: Single attraction ────────────────────────────────────────────────
// GET /api/attractions/:id
router.get("/attractions/:id", cacheMiddleware(600), async (req, res) => {
  try {
    const [row] = await db
      .select({
        attraction: attractionsTable,
        destinationName: destinationsTable.name,
        destinationSlug: destinationsTable.slug,
      })
      .from(attractionsTable)
      .leftJoin(destinationsTable, eq(attractionsTable.destinationId, destinationsTable.id))
      .where(eq(attractionsTable.id, Number(req.params.id)))
      .limit(1);

    if (!row) return res.status(404).json({ error: "Attraction not found" });
    res.json({ ...row.attraction, destinationName: row.destinationName, destinationSlug: row.destinationSlug });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch attraction" });
  }
});

export default router;
