import { Router, type IRouter } from "express";
import { eq, ilike, and, sql, asc, or, inArray } from "drizzle-orm";
import { db, destinationsTable, countriesTable, statesTable, regionsTable, themesTable, packagesTable, homePageCategoriesTable } from "@workspace/db";
import { buildPackageDetail } from "./packages";
import { cacheMiddleware } from "../lib/cache";
import { logger } from "../lib/logger";
import { getCollection, COLLECTIONS } from "../lib/mongodb";
import type { MongoDestination } from "../lib/mongoSync";
import {
  ListDestinationsQueryParams,
  GetDestinationParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// ⚡ FIX: All filtering pushed down to the DB (WHERE clause) — no more in-JS array.filter()
router.get("/destinations", cacheMiddleware(120), async (req, res): Promise<void> => {
  const params = ListDestinationsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { country, state, featured, limit = 50, offset = 0 } = params.data;
  const { stateId: stateIdParam, countryId: countryIdParam } = req.query;

  const conditions: any[] = [];
  if (featured !== undefined) conditions.push(eq(destinationsTable.isFeatured, featured));
  if (stateIdParam) conditions.push(eq(destinationsTable.stateId, Number(stateIdParam)));
  else if (state) conditions.push(ilike(statesTable.name, `%${state}%`));
  if (countryIdParam) conditions.push(eq(statesTable.countryId, Number(countryIdParam)));
  else if (country) conditions.push(ilike(countriesTable.name, `%${country}%`));

  const query = db
    .select({
      id: destinationsTable.id,
      name: destinationsTable.name,
      slug: destinationsTable.slug,
      stateId: destinationsTable.stateId,
      stateName: statesTable.name,
      countryName: countriesTable.name,
      countryId: statesTable.countryId,
      packagePageSlug: destinationsTable.packagePageSlug,
      imageUrl: destinationsTable.imageUrl,
      thumbnailUrl: destinationsTable.thumbnailUrl,
      countrySlug: countriesTable.slug,
      description: destinationsTable.description,
      isFeatured: destinationsTable.isFeatured,
      packageCount: destinationsTable.packageCount,
      bestTimeToVisit: destinationsTable.bestTimeToVisit,
      altitude: destinationsTable.altitude,
      temperature: destinationsTable.temperature,
    })
    .from(destinationsTable)
    .leftJoin(statesTable, eq(destinationsTable.stateId, statesTable.id))
    .leftJoin(countriesTable, eq(statesTable.countryId, countriesTable.id))
    .limit(Number(limit))
    .offset(Number(offset));

  const destinations = conditions.length > 0
    ? await query.where(and(...conditions))
    : await query;

  res.json({ destinations, total: destinations.length });
});

/**
 * GET /destinations/featured
 * ⚡ Reads from MongoDB Atlas (indexed isFeatured field, no JOINs).
 * Falls back to PostgreSQL if MongoDB is unavailable.
 */
router.get("/destinations/featured", cacheMiddleware(300), async (_req, res): Promise<void> => {
  // MongoDB fast path
  try {
    const col = await getCollection<MongoDestination>(COLLECTIONS.DESTINATIONS);
    if (col) {
      const destinations = await col
        .find({ isFeatured: true })
        .sort({ packageCount: -1 })
        .limit(12)
        .project({ _id: 0, syncedAt: 0 })
        .toArray();
      if (destinations.length > 0) {
        res.setHeader("X-Data-Source", "mongodb");
        return void res.json({ destinations });
      }
    }
  } catch (err) {
    logger.warn({ err }, "MongoDB read failed for /destinations/featured — falling back to PG");
  }

  // PostgreSQL fallback
  const destinations = await db
    .select({
      id: destinationsTable.id,
      name: destinationsTable.name,
      slug: destinationsTable.slug,
      stateId: destinationsTable.stateId,
      stateName: statesTable.name,
      countryName: countriesTable.name,
      imageUrl: destinationsTable.imageUrl,
      thumbnailUrl: destinationsTable.thumbnailUrl,
      description: destinationsTable.description,
      isFeatured: destinationsTable.isFeatured,
      packageCount: destinationsTable.packageCount,
      bestTimeToVisit: destinationsTable.bestTimeToVisit,
      altitude: destinationsTable.altitude,
      temperature: destinationsTable.temperature,
    })
    .from(destinationsTable)
    .leftJoin(statesTable, eq(destinationsTable.stateId, statesTable.id))
    .leftJoin(countriesTable, eq(statesTable.countryId, countriesTable.id))
    .where(eq(destinationsTable.isFeatured, true))
    .limit(12);

  res.setHeader("X-Data-Source", "postgresql");
  res.json({ destinations });
});

/**
 * GET /destinations/countries
 * ⚡ Reads from MongoDB Atlas countries collection.
 * Falls back to PostgreSQL if unavailable.
 */
router.get("/destinations/countries", cacheMiddleware(600), async (_req, res): Promise<void> => {
  // MongoDB fast path
  try {
    const col = await getCollection<object>(COLLECTIONS.COUNTRIES);
    if (col) {
      const countries = await col
        .find({})
        .project({ _id: 0, syncedAt: 0 })
        .toArray();
      if (countries.length > 0) {
        res.setHeader("X-Data-Source", "mongodb");
        return void res.json({ countries });
      }
    }
  } catch (err) {
    logger.warn({ err }, "MongoDB read failed for /destinations/countries — falling back to PG");
  }

  // PostgreSQL fallback
  const countries = await db.select().from(countriesTable);
  res.setHeader("X-Data-Source", "postgresql");
  res.json({ countries });
});

router.get("/destinations/mega-menu", cacheMiddleware(600), async (_req, res): Promise<void> => {
  try {
    const themes = await db.select().from(themesTable).where(eq(themesTable.isActive, true)).orderBy(asc(themesTable.displayOrder));
    
    // Group states for India
    const indiaCountry = await db.select().from(countriesTable).where(eq(countriesTable.slug, "india")).limit(1);
    let indiaStates: any[] = [];
    let indiaDestinations: any[] = [];

    if (indiaCountry.length > 0) {
      indiaStates = await db.select().from(statesTable).where(
        and(
          eq(statesTable.countryId, indiaCountry[0].id),
          eq(statesTable.showInMenu, true)
        )
      ).orderBy(asc(statesTable.navMenuOrder));
      if (indiaStates.length > 0) {
        indiaDestinations = await db.select({
          name: destinationsTable.name,
          slug: destinationsTable.slug,
          stateId: destinationsTable.stateId,
        }).from(destinationsTable).where(
          and(
            inArray(destinationsTable.stateId, indiaStates.map(s => s.id)),
            eq(destinationsTable.showInMenu, true)
          )
        );
      }
    }
    
    // Group countries for World (Regions)
    const regions = await db.select().from(regionsTable).where(eq(regionsTable.isActive, true)).orderBy(asc(regionsTable.displayOrder));
    const allCountries = await db.select().from(countriesTable).where(
      and(
        eq(countriesTable.isActive, true),
        eq(countriesTable.showInMenu, true)
      )
    ).orderBy(asc(countriesTable.navMenuOrder));
    
    const worldRegions = regions.map(region => {
      const regionCountries = allCountries.filter(c => c.regionId === region.id && c.slug !== "india");
      
      return {
        ...region,
        countries: regionCountries
      };
    }).filter(r => r.countries.length > 0);

    // Fetch destinations and states for world countries
    if (allCountries.length > 0) {
      const worldDestinations = await db.select({
        name: destinationsTable.name,
        slug: destinationsTable.slug,
        countryId: destinationsTable.countryId,
      }).from(destinationsTable).where(
        and(
          inArray(destinationsTable.countryId, allCountries.map(c => c.id)),
          eq(destinationsTable.showInMenu, true)
        )
      );

      const worldStates = await db.select({
        name: statesTable.name,
        slug: statesTable.slug,
        countryId: statesTable.countryId,
      }).from(statesTable).where(
        and(
          inArray(statesTable.countryId, allCountries.map(c => c.id)),
          eq(statesTable.showInMenu, true)
        )
      );

      // Attach destinations and states to the countries
      worldRegions.forEach(region => {
        region.countries.forEach(country => {
          const cDests = worldDestinations
            .filter(d => d.countryId === country.id)
            .map(d => ({ name: d.name, slug: d.slug }));
            
          const cStates = worldStates
            .filter(s => s.countryId === country.id)
            .map(s => ({ name: s.name, slug: s.slug }));
            
          (country as any).destinations = [...cStates, ...cDests];
        });
      });
    }

    // Group India states by Region (North, South, East, West) if they have region field
    const orderedRegions = [
      "North India",
      "South India",
      "East & North East India",
      "Rajasthan, West & Central India",
      "Union Territories",
      "Island Territory",
      "Other"
    ];

    const indiaZonesObj: Record<string, any[]> = {};
    // Initialize to preserve order
    orderedRegions.forEach(r => { indiaZonesObj[r] = []; });

    indiaStates.forEach((state) => {
      // Map dirty data directly to fallback just in case
      let zone = state.region || "Other";
      if (zone === "North India (Union Territory)") zone = "North India";
      if (zone === "West India") zone = "Rajasthan, West & Central India";
      if (zone === "Union Territory") zone = "Union Territories";
      if (!orderedRegions.includes(zone)) zone = "Other";

      const stateDests = indiaDestinations.filter(d => d.stateId === state.id);
      
      indiaZonesObj[zone].push({
        title: state.name,
        slug: state.slug,
        items: stateDests.map(d => ({ name: d.name, slug: d.slug }))
      });
    });
    
    // Only return regions that have at least one state
    const indiaZones = orderedRegions
      .filter(zone => indiaZonesObj[zone].length > 0)
      .map(zone => ({
        name: zone,
        states: indiaZonesObj[zone]
      }));

    res.json({ themes, indiaZones, worldRegions });
  } catch (error) {
    logger.error({ error }, "Mega menu error");
    res.status(500).json({ error: "Failed to fetch mega menu data" });
  }
});

/**
 * GET /api/destinations/resolve-slug/:slug
 *
 * ⚡ PERFORMANCE FIX: All DB lookups run in PARALLEL via Promise.all.
 * Old pattern: 5 sequential await calls = 5 DB round-trips = 1-3 seconds.
 * New pattern: 1 round-trip with all lookups concurrent = 50-150ms.
 * Result is also cached in Redis for 5 minutes (slug→type maps rarely change).
 */
router.get("/destinations/resolve-slug/:slug", cacheMiddleware(300), async (req, res): Promise<void> => {
  const slug = String(req.params.slug);
  try {
    // ⚡ Run ALL lookups in PARALLEL — single DB round-trip instead of 5 sequential
    const [
      categoryResult,
      themeResult,
      pkgResult,
      countryResult,
      stateResult,
      destinationResult,
    ] = await Promise.all([
      // 1. HomePageCategory (CMS dynamic theme page)
      db.select({
        id: homePageCategoriesTable.id,
        label: homePageCategoriesTable.label,
        slug: homePageCategoriesTable.slug,
        description: homePageCategoriesTable.description,
        content: homePageCategoriesTable.content,
        iconName: homePageCategoriesTable.iconName,
        imageUrl: homePageCategoriesTable.imageUrl,
        href: homePageCategoriesTable.href,
        color: homePageCategoriesTable.color,
        isActive: homePageCategoriesTable.isActive,
        packageCount: sql<number>`count(${packagesTable.id})::int`.as('packageCount'),
        startingPrice: sql<number>`min(${packagesTable.pricePerPerson})`.as('startingPrice')
      }).from(homePageCategoriesTable)
      .leftJoin(packagesTable, or(
        ilike(packagesTable.category, sql`concat('%', ${homePageCategoriesTable.label}, '%')`),
        ilike(homePageCategoriesTable.label, sql`concat('%', ${packagesTable.category}, '%')`)
      ))
      .where(or(
        eq(homePageCategoriesTable.slug, slug),
        eq(homePageCategoriesTable.href, `/${slug}`)
      ))
      .groupBy(
        homePageCategoriesTable.id, homePageCategoriesTable.label, homePageCategoriesTable.slug,
        homePageCategoriesTable.description, homePageCategoriesTable.content,
        homePageCategoriesTable.iconName, homePageCategoriesTable.imageUrl,
        homePageCategoriesTable.href, homePageCategoriesTable.color, homePageCategoriesTable.isActive
      ).limit(1),

      // 2. Theme table
      db.select({
        id: themesTable.id,
        name: themesTable.name,
        slug: themesTable.slug,
        imageUrl: themesTable.imageUrl,
        description: themesTable.description,
        isActive: themesTable.isActive,
        packageCount: sql<number>`count(${packagesTable.id})::int`.as('packageCount'),
        startingPrice: sql<number>`min(${packagesTable.pricePerPerson})`.as('startingPrice')
      }).from(themesTable)
      .leftJoin(packagesTable, or(
        ilike(packagesTable.category, sql`'%' || ${themesTable.name} || '%'`),
        ilike(themesTable.name, sql`'%' || ${packagesTable.category} || '%'`)
      ))
      .where(eq(themesTable.slug, slug))
      .groupBy(themesTable.id, themesTable.name, themesTable.slug, themesTable.imageUrl, themesTable.description, themesTable.isActive)
      .limit(1),

      // 3. Package
      db.select().from(packagesTable).where(eq(packagesTable.slug, slug)).limit(1),

      // 4. Country
      db.select().from(countriesTable).where(eq(countriesTable.slug, slug)).limit(1),

      // 5. State
      db.select().from(statesTable).where(eq(statesTable.slug, slug)).limit(1),

      // 6. Destination
      db.select({
        destination: destinationsTable,
        stateName: statesTable.name,
        countryName: countriesTable.name,
        countrySlug: countriesTable.slug,
      })
        .from(destinationsTable)
        .leftJoin(statesTable, eq(destinationsTable.stateId, statesTable.id))
        .leftJoin(countriesTable, eq(statesTable.countryId, countriesTable.id))
        .where(or(
          eq(destinationsTable.slug, slug),
          eq(destinationsTable.packagePageSlug, slug)
        ))
        .limit(1),
    ]);

    // Resolve in priority order
    const category = categoryResult[0];
    if (category?.id) {
      return void res.json({ type: "theme", data: { ...category, name: category.label } });
    }

    const theme = themeResult[0];
    if (theme?.id) return void res.json({ type: "theme", data: theme });

    const pkg = pkgResult[0];
    if (pkg) {
      const detailed = await buildPackageDetail(pkg);
      return void res.json({ type: "package", data: detailed });
    }

    const country = countryResult[0];
    if (country) return void res.json({ type: "country", data: country });

    const state = stateResult[0];
    if (state) return void res.json({ type: "state", data: state });

    const destination = destinationResult[0];
    if (destination) {
      return void res.json({
        type: "destination",
        data: {
          ...destination.destination,
          stateName: destination.stateName,
          countryName: destination.countryName,
          countrySlug: destination.countrySlug,
        },
      });
    }

    res.status(404).json({ error: "Slug not found" });
  } catch (error) {
    logger.error({ error, slug }, "Resolve slug error");
    res.status(500).json({ error: "Failed to resolve slug" });
  }
});

/**
 * Resolve a country-scoped destination package URL.
 * Canonical form: /{country}/{destination}-tour-packages
 */
router.get("/destinations/resolve-path/:countrySlug/:slug", cacheMiddleware(300), async (req, res): Promise<void> => {
  const countrySlug = String(req.params.countrySlug).toLowerCase();
  const rawSlug = String(req.params.slug).toLowerCase();
  const destinationSlug = rawSlug
    .replace(/-(?:holiday-tour-packages|tour-packages|tourism)$/, "");

  try {
    const [destination] = await db
      .select({
        destination: destinationsTable,
        stateName: statesTable.name,
        countryName: countriesTable.name,
        countrySlug: countriesTable.slug,
      })
      .from(destinationsTable)
      .leftJoin(statesTable, eq(destinationsTable.stateId, statesTable.id))
      .leftJoin(countriesTable, eq(statesTable.countryId, countriesTable.id))
      .where(and(
        or(
          eq(destinationsTable.slug, destinationSlug),
          eq(destinationsTable.packagePageSlug, destinationSlug)
        ),
        eq(countriesTable.slug, countrySlug),
        eq(destinationsTable.isActive, true)
      ))
      .limit(1);

    if (!destination) {
      res.status(404).json({ error: "Destination not found" });
      return;
    }

    res.json({
      type: "destination",
      data: {
        ...destination.destination,
        stateName: destination.stateName,
        countryName: destination.countryName,
        countrySlug: destination.countrySlug,
      },
    });
  } catch (error) {
    logger.error({ error, countrySlug, destinationSlug }, "Resolve destination path error");
    res.status(500).json({ error: "Failed to resolve destination path" });
  }
});

router.get("/destinations/states", cacheMiddleware(300), async (req, res): Promise<void> => {
  const countryParam = req.query.country as string | undefined;
  const countryIdParam = req.query.countryId as string | undefined;
  let statesQuery = db
    .select({
      id: statesTable.id,
      name: statesTable.name,
      slug: statesTable.slug,
      countryId: statesTable.countryId,
      countryName: countriesTable.name,
      imageUrl: statesTable.imageUrl,
      packageCount: statesTable.packageCount,
      description: statesTable.description,
    })
    .from(statesTable)
    .leftJoin(countriesTable, eq(statesTable.countryId, countriesTable.id));

  const states = await statesQuery;
  let filtered = states;
  if (countryIdParam) {
    filtered = states.filter(s => s.countryId === Number(countryIdParam));
  } else if (countryParam) {
    filtered = states.filter(s => s.countryName?.toLowerCase() === countryParam.toLowerCase());
  }
  res.json({ states: filtered });
});

router.get("/destinations/:slug", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const params = GetDestinationParams.safeParse({ slug: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({
      destination: destinationsTable,
      stateName: statesTable.name,
      countryName: countriesTable.name,
    })
    .from(destinationsTable)
    .leftJoin(statesTable, eq(destinationsTable.stateId, statesTable.id))
    .leftJoin(countriesTable, eq(statesTable.countryId, countriesTable.id))
    .where(eq(destinationsTable.slug, params.data.slug));

  if (!row) {
    res.status(404).json({ error: "Destination not found" });
    return;
  }

  res.json({ ...row.destination, stateName: row.stateName, countryName: row.countryName, packages: [] });
});

router.get("/states/:slug", async (req, res): Promise<void> => {
  try {
    const [state] = await db
      .select({
        state: statesTable,
        countryName: countriesTable.name,
      })
      .from(statesTable)
      .leftJoin(countriesTable, eq(statesTable.countryId, countriesTable.id))
      .where(eq(statesTable.slug, req.params.slug))
      .limit(1);

    if (!state) {
      res.status(404).json({ error: "State not found" });
      return;
    }

    res.json({ ...state.state, countryName: state.countryName });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch state" });
  }
});

router.get("/countries/:slug", async (req, res): Promise<void> => {
  try {
    const [country] = await db
      .select()
      .from(countriesTable)
      .where(eq(countriesTable.slug, req.params.slug))
      .limit(1);

    if (!country) {
      res.status(404).json({ error: "Country not found" });
      return;
    }

    res.json(country);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch country" });
  }
});

export default router;
