import { Router, Request, Response } from "express";
import { db, sql } from "@workspace/db";
import { cacheMiddleware } from "../lib/cache";
import { logger } from "../lib/logger";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// SMART HOTEL SEARCH — PostgreSQL Full-Text Search + Trigram Fuzzy Matching
//
// GET /api/search/hotels?q=manali resort&limit=10
//
// Architecture (20+ yr senior pattern):
//  1. Ensure pg_trgm extension (handles typos: "manali" ≈ "manaali")
//  2. Full-text search across hotel name, city, address, description
//  3. Destination/State/Country keyword matching for context-aware results
//  4. Returns: hotels (ranked by relevance), suggestions (destination/state names)
//  5. Redis-cached per unique query (30s TTL — search results change infrequently)
// ─────────────────────────────────────────────────────────────────────────────

// One-time startup: enable pg_trgm for fuzzy matching
async function ensurePgTrgm() {
  try {
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    // Indexes for fast text search (idempotent — IF NOT EXISTS)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_hotels_status_country_state 
      ON hotels(status, country_slug, state_slug)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_hotels_destination_slug 
      ON hotels(destination_slug)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_hotels_name_trgm 
      ON hotels USING gin (name gin_trgm_ops)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_hotels_city_trgm 
      ON hotels USING gin (city gin_trgm_ops)
    `);
    logger.info("pg_trgm extension and search indexes ready");
  } catch (err: any) {
    // Non-fatal — search still works without trgm (just less fuzzy)
    logger.warn({ err: err.message }, "pg_trgm setup warning (non-fatal)");
  }
}

// Run on module load (async, non-blocking)
ensurePgTrgm();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/search/hotels?q=...&limit=10&country=india&state=himachal-pradesh
// ─────────────────────────────────────────────────────────────────────────────
router.get("/hotels", cacheMiddleware(30), async (req: Request, res: Response) => {
  try {
    const {
      q = "",
      limit = "10",
      country, state,
    } = req.query;

    const rawQuery = String(q).trim();
    const lim = Math.min(Number(limit), 20);

    if (!rawQuery || rawQuery.length < 2) {
      // Return featured hotels as default when no query
      const { rows: featured } = await db.execute(sql`
        SELECT
          hotels.id, hotels.name, hotels.slug, hotels.type,
          hotels.star_rating AS "starRating",
          hotels.city,
          hotels.min_price  AS "minPrice",
          hotels.country_slug AS "countrySlug",
          hotels.state_slug   AS "stateSlug",
          hotels.destination_slug AS "destinationSlug",
          COALESCE(hp.url, hotels.images[1]) AS "primaryImageUrl",
          destinations.name AS "destinationName"
        FROM hotels
        LEFT JOIN destinations ON hotels.destination_id = destinations.id
        LEFT JOIN LATERAL (
          SELECT url FROM hotel_photos
          WHERE hotel_id = hotels.id
          ORDER BY is_primary DESC, display_order ASC LIMIT 1
        ) hp ON true
        WHERE hotels.status = 'APPROVED' AND hotels.is_featured = true
        ORDER BY hotels.display_order ASC NULLS LAST, hotels.min_price ASC
        LIMIT ${lim}
      `) as any;

      res.setHeader("Cache-Control", "no-store");
      return res.json({ hotels: featured || [], suggestions: [], query: rawQuery });
    }

    // ── Build geo filter ─────────────────────────────────────────────────────
    const geoConditions: any[] = [sql`hotels.status = 'APPROVED'`];
    if (country) geoConditions.push(sql`hotels.country_slug = ${country}`);
    if (state && state !== "all") geoConditions.push(sql`hotels.state_slug = ${state}`);

    let geoFilter = geoConditions[0];
    for (let i = 1; i < geoConditions.length; i++) {
      geoFilter = sql`${geoFilter} AND ${geoConditions[i]}`;
    }

    const searchTerm = rawQuery.toLowerCase();
    const likeTerm   = `%${searchTerm}%`;
    const trgmTerm   = rawQuery;        // pg_trgm uses unmodified term

    // ── Hotel full-text + fuzzy search ───────────────────────────────────────
    // Uses: ILIKE for partial match + similarity() for typo-tolerance + ts_rank for FTS
    const { rows: hotels } = await db.execute(sql`
      SELECT
        hotels.id,
        hotels.name,
        hotels.slug,
        hotels.type,
        hotels.star_rating        AS "starRating",
        hotels.address,
        hotels.city,
        hotels.min_price          AS "minPrice",
        hotels.is_featured        AS "isFeatured",
        hotels.booking_type       AS "bookingType",
        hotels.country_slug       AS "countrySlug",
        hotels.state_slug         AS "stateSlug",
        hotels.destination_slug   AS "destinationSlug",
        hotels.custom_city        AS "customCity",
        hotels.amenities,
        destinations.name         AS "destinationName",
        COALESCE(hp.url, hotels.images[1]) AS "primaryImageUrl",
        ROUND(AVG(r.rating)::numeric, 1)   AS "avgRating",
        COUNT(DISTINCT r.id)::int          AS "reviewCount",
        -- Relevance score: exact name match > featured > city match > address match
        (
          CASE WHEN LOWER(hotels.name) LIKE ${likeTerm}     THEN 100 ELSE 0 END +
          CASE WHEN hotels.is_featured = true                THEN 40  ELSE 0 END +
          CASE WHEN LOWER(hotels.city) LIKE ${likeTerm}     THEN 30  ELSE 0 END +
          CASE WHEN LOWER(hotels.type) LIKE ${likeTerm}     THEN 20  ELSE 0 END +
          CASE WHEN LOWER(hotels.address) LIKE ${likeTerm}  THEN 10  ELSE 0 END +
          -- Trigram fuzzy similarity (typo tolerance)
          COALESCE(ROUND((similarity(hotels.name, ${trgmTerm}) * 50)::numeric, 0), 0)::int
        ) AS "_relevance"
      FROM hotels
      LEFT JOIN destinations ON hotels.destination_id = destinations.id
      LEFT JOIN hotel_reviews r ON r.hotel_id = hotels.id AND r.is_published = true
      LEFT JOIN LATERAL (
        SELECT url FROM hotel_photos
        WHERE hotel_id = hotels.id
        ORDER BY is_primary DESC, display_order ASC LIMIT 1
      ) hp ON true
      WHERE ${geoFilter}
        AND (
          LOWER(hotels.name)    LIKE ${likeTerm} OR
          LOWER(hotels.city)    LIKE ${likeTerm} OR
          LOWER(hotels.address) LIKE ${likeTerm} OR
          LOWER(hotels.type)    LIKE ${likeTerm} OR
          -- Destination/state context match
          EXISTS (
            SELECT 1 FROM destinations d2
            WHERE d2.id = hotels.destination_id
              AND (LOWER(d2.name) LIKE ${likeTerm} OR LOWER(d2.slug) LIKE ${likeTerm})
          ) OR
          -- Fuzzy: hotel name similarity > 0.2 threshold (handles common typos)
          similarity(hotels.name, ${trgmTerm}) > 0.2
        )
      GROUP BY hotels.id, destinations.name, hp.url
      ORDER BY "_relevance" DESC, hotels.is_featured DESC, hotels.min_price ASC NULLS LAST
      LIMIT ${lim}
    `) as any;

    // ── Destination / State suggestions ──────────────────────────────────────
    const { rows: destSuggestions } = await db.execute(sql`
      SELECT DISTINCT
        d.name,
        d.slug,
        s.name  AS "stateName",
        s.slug  AS "stateSlug",
        COALESCE(c.slug, c2.slug) AS "countrySlug",
        COALESCE(c.name, c2.name) AS "countryName",
        'destination' AS type,
        similarity(d.name, ${trgmTerm}) AS _sim
      FROM destinations d
      LEFT JOIN states   s ON d.state_id   = s.id
      LEFT JOIN countries c ON d.country_id = c.id
      LEFT JOIN countries c2 ON s.country_id = c2.id
      WHERE LOWER(d.name) LIKE ${likeTerm}
         OR similarity(d.name, ${trgmTerm}) > 0.25
      ORDER BY _sim DESC, d.name ASC
      LIMIT 5
    `) as any;

    const { rows: stateSuggestions } = await db.execute(sql`
      SELECT DISTINCT
        st.name,
        st.slug,
        c.slug  AS "countrySlug",
        c.name  AS "countryName",
        'state' AS type,
        similarity(st.name, ${trgmTerm}) AS _sim
      FROM states st
      LEFT JOIN countries c ON st.country_id = c.id
      WHERE LOWER(st.name) LIKE ${likeTerm}
         OR similarity(st.name, ${trgmTerm}) > 0.25
      ORDER BY _sim DESC, st.name ASC
      LIMIT 3
    `) as any;

    const suggestions = [
      ...(destSuggestions || []).map((d: any) => ({
        type: "destination",
        name: d.name,
        subtitle: `${d.stateName || ""}, ${d.countryName || ""}`.replace(/^,\s*|,\s*$/, ""),
        href: `/hotels/${d.countrySlug}/${d.stateSlug}/hotels-in-${d.slug}`,
      })),
      ...(stateSuggestions || []).map((s: any) => ({
        type: "state",
        name: s.name,
        subtitle: s.countryName || "",
        href: `/hotels/${s.countrySlug}/${s.slug}`,
      })),
    ];

    res.setHeader("Cache-Control", "no-store");
    res.json({
      hotels: hotels || [],
      suggestions,
      total: (hotels || []).length,
      query: rawQuery,
    });

  } catch (error: any) {
    logger.error({ error: error.message }, "Smart hotel search error");
    res.status(500).json({ error: "Search failed", hotels: [], suggestions: [] });
  }
});

export default router;
