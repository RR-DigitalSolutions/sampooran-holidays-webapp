import { Router } from "express";
import { cacheMiddleware } from "../lib/cache";
import { db, countriesTable, statesTable, destinationsTable, homePageSlidesTable, homePageCategoriesTable, homePageSectionsTable, themesTable, packagesTable, packageThemesTable, offersTable, hotelsTable, settingsTable } from "@workspace/db";
import { eq, and, asc, desc, ne, sql, inArray, or, ilike } from "drizzle-orm";
import { logger } from "../lib/logger";
import { getCollection, COLLECTIONS } from "../lib/mongodb";
import type { MongoHomeConfig } from "../lib/mongoSync";

const router = Router();

/**
 * GET /api/ota/home/site-settings
 * ⚡ PUBLIC — No auth required.
 * Returns all platform settings as a flat { key: value } object.
 * Powers the frontend's dynamic contact info, social links, and brand details.
 * Cached for 60 seconds so admin changes propagate quickly after a save.
 */
router.get("/site-settings", cacheMiddleware(60), async (req, res) => {
  try {
    const rows = await db.select().from(settingsTable);
    const settingsMap: Record<string, string> = {};
    rows.forEach((row) => {
      settingsMap[row.key] = row.value ?? "";
    });
    res.json(settingsMap);
  } catch (error: any) {
    logger.error({ error: error.message }, "Error fetching site settings");
    // Return empty object so frontend gracefully falls back to defaults
    res.json({});
  }
});


/**
 * GET /api/ota/home/config
 * ⚡ Reads from MongoDB Atlas first (single document, no JOINs).
 * Falls back to PostgreSQL if MongoDB is unavailable or empty.
 */
router.get("/config", cacheMiddleware(600), async (req, res) => {
  // ── MongoDB fast path ───────────────────────────────────────────────
  try {
    const col = await getCollection<MongoHomeConfig>(COLLECTIONS.HOME_CONFIG);
    if (col) {
      const doc = await col.findOne({ _type: "homeConfig" }, { projection: { _id: 0, _type: 0 } });
      if (doc && doc.slides?.length > 0) {
        res.setHeader("X-Data-Source", "mongodb");
        return void res.json(doc);
      }
    }
  } catch (err) {
    logger.warn({ err }, "MongoDB read failed for /config — falling back to PG");
  }

  // ── PostgreSQL fallback ────────────────────────────────────────────────
  try {
    const [slides, categories, sections, themes, offers] = await Promise.all([
      db.select({
        id: homePageSlidesTable.id,
        title: homePageSlidesTable.title,
        subtitle: homePageSlidesTable.subtitle,
        imageUrl: homePageSlidesTable.imageUrl,
        image_url: homePageSlidesTable.imageUrl,
        videoUrl: homePageSlidesTable.videoUrl,
        tag: homePageSlidesTable.tag,
        ctaText: homePageSlidesTable.ctaText,
        ctaLink: homePageSlidesTable.ctaLink,
        displayOrder: homePageSlidesTable.displayOrder,
        isActive: homePageSlidesTable.isActive
      }).from(homePageSlidesTable).where(eq(homePageSlidesTable.isActive, true)).orderBy(asc(homePageSlidesTable.displayOrder)),
      
      db.select({
        id: homePageCategoriesTable.id,
        label: homePageCategoriesTable.label,
        slug: homePageCategoriesTable.slug,
        description: homePageCategoriesTable.description,
        content: homePageCategoriesTable.content,
        iconName: homePageCategoriesTable.iconName,
        imageUrl: homePageCategoriesTable.imageUrl,
        image_url: homePageCategoriesTable.imageUrl,
        href: homePageCategoriesTable.href,
        color: homePageCategoriesTable.color,
        displayOrder: homePageCategoriesTable.displayOrder,
        isActive: homePageCategoriesTable.isActive,
        metaTitle: homePageCategoriesTable.metaTitle,
        metaDescription: homePageCategoriesTable.metaDescription,
        metaKeywords: homePageCategoriesTable.metaKeywords,
        packageCount: sql<number>`count(${packagesTable.id})::int`.as('packageCount'),
        startingPrice: sql<number>`min(${packagesTable.pricePerPerson})`.as('startingPrice')
      })
      .from(homePageCategoriesTable)
      .leftJoin(packagesTable, or(
        ilike(packagesTable.category, sql`concat('%', ${homePageCategoriesTable.label}, '%')`),
        ilike(homePageCategoriesTable.label, sql`concat('%', ${packagesTable.category}, '%')`)
      ))
      .where(eq(homePageCategoriesTable.isActive, true))
      .groupBy(
        homePageCategoriesTable.id, homePageCategoriesTable.label, homePageCategoriesTable.slug,
        homePageCategoriesTable.description, homePageCategoriesTable.content,
        homePageCategoriesTable.iconName, homePageCategoriesTable.imageUrl,
        homePageCategoriesTable.href, homePageCategoriesTable.color,
        homePageCategoriesTable.displayOrder, homePageCategoriesTable.isActive,
        homePageCategoriesTable.metaTitle, homePageCategoriesTable.metaDescription, homePageCategoriesTable.metaKeywords
      )
      .orderBy(asc(homePageCategoriesTable.displayOrder)),
      
      db.select({
        id: homePageSectionsTable.id,
        sectionType: homePageSectionsTable.sectionType,
        title: homePageSectionsTable.title,
        subtitle: homePageSectionsTable.subtitle,
        displayOrder: homePageSectionsTable.displayOrder,
        isActive: homePageSectionsTable.isActive,
        config: homePageSectionsTable.config
      }).from(homePageSectionsTable).where(eq(homePageSectionsTable.isActive, true)).orderBy(asc(homePageSectionsTable.displayOrder)),
      
      db.select({
        id: themesTable.id,
        name: themesTable.name,
        slug: themesTable.slug,
        imageUrl: themesTable.imageUrl,
        image_url: themesTable.imageUrl,
        description: themesTable.description,
        isActive: themesTable.isActive,
        displayOrder: themesTable.displayOrder,
        packageCount: sql<number>`count(${packagesTable.id})::int`.as('packageCount'),
        startingPrice: sql<number>`min(${packagesTable.pricePerPerson})`.as('startingPrice')
      })
      .from(themesTable)
      .leftJoin(packagesTable, or(
        ilike(packagesTable.category, sql`concat('%', ${themesTable.name}, '%')`),
        ilike(themesTable.name, sql`concat('%', ${packagesTable.category}, '%')`)
      ))
      .where(eq(themesTable.isActive, true))
      .groupBy(
        themesTable.id, themesTable.name, themesTable.slug, themesTable.imageUrl,
        themesTable.description, themesTable.isActive, themesTable.displayOrder
      )
      .orderBy(asc(themesTable.displayOrder)),

      db.select().from(offersTable).where(eq(offersTable.isActive, true)).orderBy(asc(offersTable.displayOrder)),
    ]);

    res.setHeader("X-Data-Source", "postgresql");
    res.json({ slides, categories, sections, themes, offers });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error fetching home config");
    res.status(500).json({ error: "Failed to fetch home configuration", details: error.message });
  }
});

/**
 * GET /api/ota/home/top-destinations
 * Returns grouped and featured destinations for the home page.
 */
router.get("/top-destinations", cacheMiddleware(600), async (req, res) => {
  try {
    // 1. Fetch Featured Countries & States
    const [featuredCountries, featuredStates] = await Promise.all([
      db.select({ 
        id: countriesTable.id, 
        name: countriesTable.name, 
        slug: countriesTable.slug, 
        imageUrl: countriesTable.imageUrl, 
        displayOrder: countriesTable.displayOrder, 
        packageCount: sql<number>`count(${packagesTable.id})::int`.as('packageCount'),
        startingPrice: sql<number>`min(${packagesTable.pricePerPerson})`.as('startingPrice')
      })
        .from(countriesTable)
        .leftJoin(packagesTable, eq(packagesTable.countryId, countriesTable.id))
        .where(and(eq(countriesTable.isFeatured, true), eq(countriesTable.isActive, true), ne(countriesTable.slug, 'india')))
        .groupBy(
          countriesTable.id, 
          countriesTable.name, 
          countriesTable.slug, 
          countriesTable.imageUrl, 
          countriesTable.displayOrder
        )
        .orderBy(asc(countriesTable.displayOrder)),
      db.select({ 
        id: statesTable.id, 
        name: statesTable.name, 
        slug: statesTable.slug, 
        imageUrl: statesTable.imageUrl, 
        displayOrder: statesTable.displayOrder, 
        packageCount: sql<number>`count(${packagesTable.id})::int`.as('packageCount'),
        startingPrice: sql<number>`min(${packagesTable.pricePerPerson})`.as('startingPrice'),
        countryId: statesTable.countryId, 
        countryName: countriesTable.name, 
        countrySlug: countriesTable.slug 
      })
        .from(statesTable)
        .leftJoin(countriesTable, eq(statesTable.countryId, countriesTable.id))
        .leftJoin(packagesTable, eq(packagesTable.stateId, statesTable.id))
        .where(and(eq(statesTable.isFeatured, true), eq(statesTable.isActive, true)))
        .groupBy(
          statesTable.id, 
          statesTable.name, 
          statesTable.slug, 
          statesTable.imageUrl, 
          statesTable.displayOrder, 
          statesTable.countryId, 
          countriesTable.name, 
          countriesTable.slug
        )
        .orderBy(asc(statesTable.displayOrder))
    ]);

    // 2. Collect all IDs for bulk fetching sub-places
    const countryIds = featuredCountries.map(c => c.id);
    const stateIds = featuredStates.map(s => s.id);

    if (countryIds.length === 0 && stateIds.length === 0) {
      return res.json({ international: [], domestic: [], all: [] });
    }

    // 3. Fetch ALL sub-places for these states/countries in one go
    // We use a LEFT JOIN to ensure we get destinations even if state info is missing
    const orFilters = [];
    if (stateIds.length > 0) orFilters.push(inArray(destinationsTable.stateId, stateIds));
    if (countryIds.length > 0) orFilters.push(inArray(destinationsTable.countryId, countryIds));

    const allSubPlaces = await db.select({ 
      id: destinationsTable.id, 
      name: destinationsTable.name, 
      slug: destinationsTable.slug, 
      imageUrl: destinationsTable.imageUrl,
      stateId: destinationsTable.stateId,
      countryId: destinationsTable.countryId,
      packageCount: sql<number>`count(${packagesTable.id})::int`.as('packageCount'),
      startingPrice: sql<number>`min(${packagesTable.pricePerPerson})`.as('startingPrice')
    })
    .from(destinationsTable)
    .leftJoin(packagesTable, eq(packagesTable.destinationId, destinationsTable.id))
    .where(and(
      eq(destinationsTable.isActive, true),
      eq(destinationsTable.isFeatured, true),
      or(...orFilters)
    ))
    .groupBy(
      destinationsTable.id,
      destinationsTable.name,
      destinationsTable.slug,
      destinationsTable.imageUrl,
      destinationsTable.stateId,
      destinationsTable.countryId
    );

    // 4. Group sub-places by country/state
    const placesByState: Record<number, any[]> = {};
    const placesByCountry: Record<number, any[]> = {};

    allSubPlaces.forEach(p => {
      if (p.stateId) {
        if (!placesByState[p.stateId]) placesByState[p.stateId] = [];
        if (placesByState[p.stateId].length < 6) placesByState[p.stateId].push(p);
      }
      if (p.countryId) {
        if (!placesByCountry[p.countryId]) placesByCountry[p.countryId] = [];
        if (placesByCountry[p.countryId].length < 6) placesByCountry[p.countryId].push(p);
      }
    });

    // 5. Process International
    const processedInternational = [
      ...featuredCountries.map(c => ({
        ...c,
        type: "international",
        places: (placesByCountry[c.id] || []).map(p => p.name),
        gallery: (placesByCountry[c.id] || []).map(p => ({ 
          name: p.name, 
          image: p.imageUrl || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400", 
          slug: p.slug,
          packageCount: p.packageCount || 0,
          startingPrice: p.startingPrice || 0
        }))
      })),
      ...featuredStates.filter(s => s.countrySlug !== 'india').map(s => ({
        ...s,
        type: "international",
        places: (placesByState[s.id] || []).map(p => p.name),
        gallery: (placesByState[s.id] || []).map(p => ({ 
          name: p.name, 
          image: p.imageUrl || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400", 
          slug: p.slug,
          packageCount: p.packageCount || 0,
          startingPrice: p.startingPrice || 0
        }))
      }))
    ];

    // 6. Process Domestic
    const processedDomestic = featuredStates.filter(s => s.countrySlug === 'india').map(s => ({
      ...s,
      type: "domestic",
      places: (placesByState[s.id] || []).map(p => p.name),
      gallery: (placesByState[s.id] || []).map(p => ({ 
        name: p.name, 
        image: p.imageUrl || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400", 
        slug: p.slug,
        packageCount: p.packageCount || 0,
        startingPrice: p.startingPrice || 0
      }))
    }));

    res.json({
      international: processedInternational.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
      domestic: processedDomestic.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
      all: [...processedInternational, ...processedDomestic].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error fetching top destinations");
    res.status(500).json({ error: "Failed to fetch top destinations: " + error.message });
  }
});

/**
 * GET /api/ota/home/trending-hotels
 * Returns top destinations grouped by hotels for the homepage.
 */
router.get("/trending-hotels", cacheMiddleware(600), async (req, res) => {
  try {
    const trendingHotels = await db.select({
      id: hotelsTable.id,
      name: hotelsTable.name,
      slug: hotelsTable.slug,
      images: hotelsTable.images,
      starRating: hotelsTable.starRating,
      city: hotelsTable.city,
      startingPrice: hotelsTable.minPrice,
      highlights: hotelsTable.highlights,
      amenities: hotelsTable.amenities
    })
    .from(hotelsTable)
    .where(and(
      eq(hotelsTable.status, "APPROVED"),
      eq(hotelsTable.showOnFrontend, true),
      eq(hotelsTable.isFeatured, true)
    ))
    .orderBy(desc(hotelsTable.createdAt))
    .limit(8);

    const formattedHotels = trendingHotels.map(h => ({
      id: h.id,
      name: h.name,
      slug: h.slug,
      imageUrl: Array.isArray(h.images) && h.images.length > 0 ? h.images[0] : "https://images.unsplash.com/photo-1542314831-c6a4d14d837e?w=800",
      starRating: h.starRating || 3,
      city: h.city || "Unknown",
      startingPrice: h.startingPrice || 0,
      highlights: h.highlights || [],
      amenities: h.amenities || []
    }));

    res.json(formattedHotels);
  } catch (error: any) {
    logger.error({ error: error.message }, "Error fetching trending hotels");
    res.status(500).json({ error: "Failed to fetch trending hotels" });
  }
});

export default router;
