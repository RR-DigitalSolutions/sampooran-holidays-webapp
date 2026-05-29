import { Router } from "express";
import { cacheMiddleware } from "../lib/cache";
import { db, hotelsTable, transportServicesTable } from "@workspace/db";
import { eq, and, sql, asc, desc } from "drizzle-orm";

const router = Router();

// GET /api/ota/hotels
router.get("/hotels", cacheMiddleware(300), async (req, res) => {
  try {
    const list = await db.select().from(hotelsTable).where(eq(hotelsTable.status, "APPROVED"));
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch hotels" });
  }
});

// GET /api/ota/hotels/featured — Public endpoint for CMS-managed best hotels (no auth required)
router.get("/hotels/featured", cacheMiddleware(300), async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const list = await db
      .select({
        id: hotelsTable.id,
        name: hotelsTable.name,
        slug: hotelsTable.slug,
        type: hotelsTable.type,
        address: hotelsTable.address,
        images: hotelsTable.images,
        starRating: hotelsTable.starRating,
        isFeatured: hotelsTable.isFeatured,
        description: hotelsTable.description,
      })
      .from(hotelsTable)
      .where(eq(hotelsTable.status, "APPROVED"))
      .orderBy(desc(hotelsTable.isFeatured), asc(hotelsTable.displayOrder), desc(hotelsTable.starRating))
      .limit(Number(limit));
    res.json(list);
  } catch (e) {
    console.error("Featured hotels error:", e);
    res.status(500).json({ error: "Failed to fetch featured hotels" });
  }
});

// GET /api/ota/hotels/nearby — MUST be before /:slug to avoid route collision
router.get("/hotels/nearby", cacheMiddleware(60), async (req, res) => {
  try {
    const { lat, lng, radius = 50, sort = "distance" } = req.query; // radius in KM
    if (!lat || !lng) return res.status(400).json({ error: "Latitude and Longitude are required" });

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const rad = parseFloat(radius as string);

    // Haversine formula for distance calculation in SQL
    // 6371 is Earth's radius in KM
    const distanceSql = sql<number>`(6371 * acos(LEAST(1.0, cos(radians(${latitude})) * cos(radians(COALESCE(latitude, 0))) * cos(radians(COALESCE(longitude, 0)) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(COALESCE(latitude, 0))))))`;

    // Smart Ranking Logic: (displayOrder reversed) + (starRating * 10) - (distance / 5)
    const smartScoreSql = sql<number>`((1000 - ${hotelsTable.displayOrder}) + (${hotelsTable.starRating} * 20) - (${distanceSql} * 2))`;

    let orderBy: any = asc(distanceSql);
    if (sort === "rating") orderBy = desc(hotelsTable.starRating);
    if (sort === "popular") orderBy = desc(smartScoreSql);
    if (sort === "smart") orderBy = desc(smartScoreSql);

    const list = await db
      .select({
        id: hotelsTable.id,
        name: hotelsTable.name,
        slug: hotelsTable.slug,
        type: hotelsTable.type,
        address: hotelsTable.address,
        images: hotelsTable.images,
        starRating: hotelsTable.starRating,
        distance: distanceSql,
      })
      .from(hotelsTable)
      .where(
        and(
          eq(hotelsTable.status, "APPROVED"),
          sql`latitude IS NOT NULL`,
          sql`longitude IS NOT NULL`,
          sql`${distanceSql} <= ${rad}`
        )
      )
      .orderBy(orderBy);

    res.json(list);
  } catch (e) {
    console.error("Nearby search error:", e);
    res.status(500).json({ error: "Failed to fetch nearby hotels" });
  }
});

// GET /api/ota/hotels/:slug
router.get("/hotels/:slug", cacheMiddleware(300), async (req, res) => {
  try {
    const [hotel] = await db.select().from(hotelsTable).where(
      and(eq(hotelsTable.slug, req.params.slug), eq(hotelsTable.status, "APPROVED"))
    ).limit(1);
    
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });
    res.json(hotel);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch hotel details" });
  }
});

// GET /api/ota/transport
router.get("/transport", cacheMiddleware(300), async (req, res) => {
  try {
    const list = await db.select().from(transportServicesTable).where(eq(transportServicesTable.status, "APPROVED"));
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch transport" });
  }
});

export default router;
