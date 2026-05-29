import { Router } from "express";
import { db, diningPointsTable, destinationsTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { cacheMiddleware } from "../lib/cache";

const router = Router();

// ─── PUBLIC: List dining points ──────────────────────────────────────────────
// GET /api/dining?destinationId=&type=&enroute=true&suitableFor=lunch
router.get("/dining", cacheMiddleware(300), async (req, res) => {
  try {
    const { destinationId, type, enroute, featured, limit = "100" } = req.query as Record<string, string>;
    const filters: any[] = [eq(diningPointsTable.isActive, true)];

    if (destinationId) filters.push(eq(diningPointsTable.destinationId, Number(destinationId)));
    if (type) filters.push(eq(diningPointsTable.type, type));
    if (enroute === "true") filters.push(eq(diningPointsTable.isEnrouteStop, true));
    if (featured === "true") filters.push(eq(diningPointsTable.isFeatured, true));

    const list = await db
      .select({
        dining: diningPointsTable,
        destinationName: destinationsTable.name,
        destinationSlug: destinationsTable.slug,
      })
      .from(diningPointsTable)
      .leftJoin(destinationsTable, eq(diningPointsTable.destinationId, destinationsTable.id))
      .where(and(...filters))
      .orderBy(asc(diningPointsTable.displayOrder), asc(diningPointsTable.name))
      .limit(Number(limit));

    res.json(list.map((r) => ({ ...r.dining, destinationName: r.destinationName, destinationSlug: r.destinationSlug })));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch dining points: " + e.message });
  }
});

// ─── PUBLIC: Single dining point ─────────────────────────────────────────────
// GET /api/dining/:id
router.get("/dining/:id", cacheMiddleware(600), async (req, res) => {
  try {
    const [row] = await db
      .select({
        dining: diningPointsTable,
        destinationName: destinationsTable.name,
        destinationSlug: destinationsTable.slug,
      })
      .from(diningPointsTable)
      .leftJoin(destinationsTable, eq(diningPointsTable.destinationId, destinationsTable.id))
      .where(eq(diningPointsTable.id, Number(req.params.id)))
      .limit(1);

    if (!row) return res.status(404).json({ error: "Dining point not found" });
    res.json({ ...row.dining, destinationName: row.destinationName, destinationSlug: row.destinationSlug });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch dining point" });
  }
});

export default router;
