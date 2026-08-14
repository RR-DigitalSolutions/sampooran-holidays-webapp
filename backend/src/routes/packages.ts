import { Router, type IRouter } from "express";
import { cacheMiddleware } from "../lib/cache";
import { eq, sql, and, gte, lte, or, ilike } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db, packagesTable, destinationsTable, statesTable, countriesTable, attractionsTable, diningPointsTable, packageThemesTable, themesTable, packageCalendarInventoryTable } from "@workspace/db";
import { inArray } from "drizzle-orm";
import { getCollection, COLLECTIONS } from "../lib/mongodb";
import type { MongoPackage } from "../lib/mongoSync";
import { logger } from "../lib/logger";
import {
  ListPackagesQueryParams,
  GetPackageParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const packageStates = alias(statesTable, "package_states");
const packageCountries = alias(countriesTable, "package_countries");

/**
 * Core package query with all joins.
 * Accepts optional limit/offset for DB-level pagination (avoids loading all rows into JS).
 */
async function getPackageWithJoins(filters: any[] = [], limit?: number, offset?: number) {
  const query = db
    .select({
      id: packagesTable.id,
      name: packagesTable.name,
      slug: packagesTable.slug,
      packageCode: packagesTable.packageCode,
      destinationId: packagesTable.destinationId,
      stateId: packagesTable.stateId,
      countryId: packagesTable.countryId,
      destinationIds: packagesTable.destinationIds,
      stateIds: packagesTable.stateIds,
      countryIds: packagesTable.countryIds,
      destinationName: destinationsTable.name,
      stateName: sql<string>`COALESCE(${packageStates.name}, ${statesTable.name})`.as("stateName"),
      countryName: sql<string>`COALESCE(${packageCountries.name}, ${countriesTable.name})`.as("countryName"),
      imageUrl: packagesTable.imageUrl,
      thumbnailUrl: packagesTable.thumbnailUrl,
      shortDescription: packagesTable.shortDescription,
      duration: packagesTable.duration,
      nights: packagesTable.nights,
      pricePerPerson: packagesTable.pricePerPerson,
      originalPrice: packagesTable.originalPrice,
      discountPercent: packagesTable.discountPercent,
      category: packagesTable.category,
      packageType: packagesTable.packageType,
      isFeatured: packagesTable.isFeatured,
      isTrending: packagesTable.isTrending,
      rating: packagesTable.rating,
      reviewCount: packagesTable.reviewCount,
      highlights: packagesTable.highlights,
      cities: packagesTable.cities,
      tags: packagesTable.tags,
      inclusionIcons: packagesTable.inclusionIcons,
    })
    .from(packagesTable)
    .leftJoin(packageStates, eq(packagesTable.stateId, packageStates.id))
    .leftJoin(packageCountries, eq(packagesTable.countryId, packageCountries.id))
    .leftJoin(destinationsTable, eq(packagesTable.destinationId, destinationsTable.id))
    .leftJoin(statesTable, eq(destinationsTable.stateId, statesTable.id))
    .leftJoin(countriesTable, eq(statesTable.countryId, countriesTable.id));

  const withFilters = filters.length > 0 ? query.where(and(...filters)) : query;

  if (limit !== undefined && offset !== undefined) {
    return withFilters.limit(limit).offset(offset);
  }
  if (limit !== undefined) {
    return withFilters.limit(limit);
  }
  return withFilters;
}

/** Count packages matching filters — used for pagination total. */
async function countPackages(filters: any[] = []): Promise<number> {
  const baseQuery = db
    .select({ count: sql<number>`count(*)::int` })
    .from(packagesTable)
    .leftJoin(packageStates, eq(packagesTable.stateId, packageStates.id))
    .leftJoin(packageCountries, eq(packagesTable.countryId, packageCountries.id))
    .leftJoin(destinationsTable, eq(packagesTable.destinationId, destinationsTable.id))
    .leftJoin(statesTable, eq(destinationsTable.stateId, statesTable.id))
    .leftJoin(countriesTable, eq(statesTable.countryId, countriesTable.id));

  const [result] = filters.length > 0
    ? await baseQuery.where(and(...filters))
    : await baseQuery;

  return Number(result?.count ?? 0);
}

async function hydratePackageItinerary(itinerary: any): Promise<any[]> {
  if (!Array.isArray(itinerary)) return [];

  const attractionIds = new Set<number>();
  const diningIds = new Set<number>();

  itinerary.forEach((day: any) => {
    if (Array.isArray(day.attractionIds)) {
      day.attractionIds.forEach((id: any) => {
        const value = typeof id === "string" ? Number(id) : id;
        if (typeof value === "number" && !Number.isNaN(value)) attractionIds.add(value);
      });
    }
    if (Array.isArray(day.diningStops)) {
      day.diningStops.forEach((stop: any) => {
        if (stop && typeof stop === "object") {
          const value = typeof stop.diningPointId === "string" ? Number(stop.diningPointId) : stop.diningPointId;
          if (typeof value === "number" && !Number.isNaN(value)) diningIds.add(value);
        }
      });
    }
  });

  const attractionsMap: Record<number, any> = {};
  if (attractionIds.size > 0) {
    const attrs = await db.select().from(attractionsTable).where(inArray(attractionsTable.id, Array.from(attractionIds)));
    attrs.forEach((a: any) => { attractionsMap[a.id] = a; });
  }

  const diningMap: Record<number, any> = {};
  if (diningIds.size > 0) {
    const dinings = await db.select().from(diningPointsTable).where(inArray(diningPointsTable.id, Array.from(diningIds)));
    dinings.forEach((d: any) => { diningMap[d.id] = d; });
  }

  return itinerary.map((day: any) => ({
    ...day,
    attractions: Array.isArray(day.attractionIds)
      ? day.attractionIds.map((id: any) => attractionsMap[typeof id === "string" ? Number(id) : id]).filter(Boolean)
      : Array.isArray(day.attractions)
      ? day.attractions
      : [],
    diningStops: Array.isArray(day.diningStops)
      ? day.diningStops.map((stop: any) => {
          if (stop && typeof stop === "object") {
            const diningPointId = typeof stop.diningPointId === "string" ? Number(stop.diningPointId) : stop.diningPointId;
            return {
              ...stop,
              diningPoint: stop.diningPoint || diningMap[diningPointId] || undefined,
            };
          }
          return stop;
        }).filter((stop: any) => stop && (stop.diningPoint || typeof stop === "string"))
      : day.diningStops,
  }));
}

async function loadPackageThemes(packageId: number) {
  const themeLinks = await db
    .select({ name: themesTable.name, slug: themesTable.slug })
    .from(packageThemesTable)
    .leftJoin(themesTable, eq(packageThemesTable.themeId, themesTable.id))
    .where(eq(packageThemesTable.packageId, packageId));

  return themeLinks.filter(Boolean);
}

export async function buildPackageDetail(pkg: any) {
  const rawPkg = await db.select().from(packagesTable).where(eq(packagesTable.id, pkg.id)).limit(1);
  const source = rawPkg[0] ?? {};
  const itinerary = await hydratePackageItinerary(pkg.itinerary ?? source.itinerary ?? []);
  const themes = pkg.themes ?? await loadPackageThemes(pkg.id);

  let locationData: any = {};
  if (!pkg.destinationName && pkg.destinationId) {
    const [location] = await db
      .select({
        destinationName: destinationsTable.name,
        stateName: statesTable.name,
        countryName: countriesTable.name,
      })
      .from(destinationsTable)
      .leftJoin(statesTable, eq(destinationsTable.stateId, statesTable.id))
      .leftJoin(countriesTable, eq(statesTable.countryId, countriesTable.id))
      .where(eq(destinationsTable.id, pkg.destinationId))
      .limit(1);

    if (location) {
      locationData = location;
    }
  }

  // ── Enrich stateIds + destinationIds for route strip (one-shot, no N+1) ──
  const stateIdArr: number[]  = Array.isArray(source.stateIds) ? source.stateIds.filter(Boolean) : [];
  const destIdArr: number[]   = Array.isArray(source.destinationIds) ? source.destinationIds.filter(Boolean) : [];

  // Also fold in the single stateId / destinationId if not already in arrays
  if (source.stateId && !stateIdArr.includes(source.stateId)) stateIdArr.push(source.stateId);
  if (source.destinationId && !destIdArr.includes(source.destinationId)) destIdArr.push(source.destinationId);

  let stateNames: { id: number; name: string; countryName: string }[] = [];
  let destinationsWithState: { id: number; name: string; stateId: number | null; stateName: string; countryName: string }[] = [];

  if (stateIdArr.length > 0) {
    const stateRows = await db
      .select({ id: statesTable.id, name: statesTable.name, countryName: countriesTable.name })
      .from(statesTable)
      .leftJoin(countriesTable, eq(statesTable.countryId, countriesTable.id))
      .where(inArray(statesTable.id, stateIdArr));
    stateNames = stateRows.map(r => ({ id: r.id, name: r.name, countryName: r.countryName ?? "" }));
  }

  if (destIdArr.length > 0) {
    const destRows = await db
      .select({
        id: destinationsTable.id,
        name: destinationsTable.name,
        stateId: destinationsTable.stateId,
        stateName: statesTable.name,
        countryName: countriesTable.name,
      })
      .from(destinationsTable)
      .leftJoin(statesTable, eq(destinationsTable.stateId, statesTable.id))
      .leftJoin(countriesTable, eq(statesTable.countryId, countriesTable.id))
      .where(inArray(destinationsTable.id, destIdArr));
    destinationsWithState = destRows.map(r => ({
      id: r.id,
      name: r.name,
      stateId: r.stateId ?? null,
      stateName: r.stateName ?? "",
      countryName: r.countryName ?? "",
    }));
  }

  return {
    ...source,
    ...pkg,
    ...locationData,
    itinerary,
    inclusions: source.inclusions ?? [],
    exclusions: source.exclusions ?? [],
    hotels: source.hotels ?? [],
    faqs: source.faqs ?? [],
    themes,
    // Enriched multi-location data for the route strip
    stateNames,               // [{id, name, countryName}] – all states this package covers
    destinationsWithState,    // [{id, name, stateId, stateName, countryName}] – all cities with parent state
  };
}

router.get("/packages", cacheMiddleware(300), async (req, res): Promise<void> => {
  const params = ListPackagesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { destinationSlug, state, country, category, minDays, maxDays, minPrice, maxPrice, type, featured, trending, limit = 50, offset = 0, search } = params.data;

  const filters: any[] = [];
  if (featured !== undefined) filters.push(eq(packagesTable.isFeatured, featured));
  if (trending !== undefined) filters.push(eq(packagesTable.isTrending, trending));
  if (state) filters.push(or(ilike(packageStates.name, `%${state}%`), ilike(statesTable.name, `%${state}%`)));
  if (country) filters.push(or(ilike(packageCountries.name, `%${country}%`), ilike(countriesTable.name, `%${country}%`)));
  if (category) {
    const cleanCat = category.replace(/-/g, ' ');
    const words = cleanCat.split(' ').filter((w: string) => w.length >= 3 && w.toLowerCase() !== 'tours' && w.toLowerCase() !== 'packages' && w.toLowerCase() !== 'holidays');
    const catConditions = [ilike(packagesTable.category, `%${cleanCat}%`)];
    for (const w of words) {
      catConditions.push(ilike(packagesTable.category, `%${w}%`));
    }
    filters.push(or(...catConditions));
  }
  if (type && type !== "both") filters.push(or(eq(packagesTable.packageType, type), eq(packagesTable.packageType, "both")));
  if (minDays) filters.push(gte(packagesTable.duration, Number(minDays)));
  if (maxDays) filters.push(lte(packagesTable.duration, Number(maxDays)));
  if (minPrice) filters.push(gte(packagesTable.pricePerPerson, Number(minPrice)));
  if (maxPrice) filters.push(lte(packagesTable.pricePerPerson, Number(maxPrice)));
  
  if (search) {
    const s = `%${search}%`;
    filters.push(or(
      ilike(packagesTable.name, s),
      ilike(destinationsTable.name, s),
      ilike(packageStates.name, s),
      ilike(statesTable.name, s)
    ));
  }

  if (destinationSlug) {
    const [dest] = await db.select().from(destinationsTable).where(eq(destinationsTable.slug, String(destinationSlug)));
    if (dest) filters.push(eq(packagesTable.destinationId, dest.id));
  }

  // ⚡ FIX: DB-level pagination — count + paginate in the database, not in JS
  const lim = Math.min(Number(limit), 100);
  const off = Number(offset);

  const [total, paged] = await Promise.all([
    countPackages(filters),
    getPackageWithJoins(filters, lim, off),
  ]);

  res.json({ packages: paged, total });
});

/**
 * GET /packages/featured
 * ⚡ Reads from MongoDB Atlas (no JOINs, indexed on isFeatured).
 * Falls back to PostgreSQL if MongoDB is unavailable.
 */
router.get("/packages/featured", cacheMiddleware(300), async (_req, res): Promise<void> => {
  try {
    const col = await getCollection<MongoPackage>(COLLECTIONS.PACKAGES);
    if (col) {
      const packages = await col
        .find({ isFeatured: true })
        .sort({ reviewCount: -1, rating: -1 })
        .limit(8)
        .project({ _id: 0, syncedAt: 0 })
        .toArray();

      if (packages.length > 0) {
        res.setHeader("X-Data-Source", "mongodb");
        return void res.json({ packages });
      }
    }
  } catch (err) {
    logger.warn({ err }, "MongoDB read failed for /packages/featured — falling back to PG");
  }

  // PostgreSQL fallback
  res.setHeader("X-Data-Source", "postgresql");
  const packages = await getPackageWithJoins([eq(packagesTable.isFeatured, true)], 8);
  res.json({ packages });
});

/**
 * GET /packages/trending
 * ⚡ Reads from MongoDB Atlas first, fallback to PostgreSQL.
 */
router.get("/packages/trending", cacheMiddleware(300), async (_req, res): Promise<void> => {
  try {
    const col = await getCollection<MongoPackage>(COLLECTIONS.PACKAGES);
    if (col) {
      const packages = await col
        .find({ isTrending: true })
        .sort({ reviewCount: -1 })
        .limit(12)
        .project({ _id: 0, syncedAt: 0 })
        .toArray();

      if (packages.length > 0) {
        res.setHeader("X-Data-Source", "mongodb");
        return void res.json({ packages });
      }
    }
  } catch (err) {
    logger.warn({ err }, "MongoDB read failed for /packages/trending — falling back to PG");
  }

  res.setHeader("X-Data-Source", "postgresql");
  const packages = await getPackageWithJoins([eq(packagesTable.isTrending, true)], 12);
  res.json({ packages });
});

router.get("/packages/stats", cacheMiddleware(300), async (_req, res): Promise<void> => {
  const [pkgCount] = await db.select({ count: db.$count(packagesTable) }).from(packagesTable);
  const [destCount] = await db.select({ count: db.$count(destinationsTable) }).from(destinationsTable);
  const [stateCount] = await db.select({ count: db.$count(statesTable) }).from(statesTable);
  const [countryCount] = await db.select({ count: db.$count(countriesTable) }).from(countriesTable);

  res.json({
    totalPackages: Number(pkgCount?.count ?? 0) || 120,
    totalDestinations: Number(destCount?.count ?? 0) || 45,
    totalStates: Number(stateCount?.count ?? 0) || 12,
    totalCountries: Number(countryCount?.count ?? 0) || 8,
    happyTravelers: 15000,
    yearsExperience: 12,
    avgRating: 4.8,
  });
});

router.get("/packages/:slug", cacheMiddleware(300), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const params = GetPackageParams.safeParse({ slug: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [pkg] = await getPackageWithJoins([eq(packagesTable.slug, params.data.slug)]);

  if (!pkg) {
    res.status(404).json({ error: "Package not found" });
    return;
  }

  const detailedPackage = await buildPackageDetail(pkg);

  let relatedPackages: any[] = [];
  if (pkg.destinationId) {
     relatedPackages = await getPackageWithJoins([eq(packagesTable.destinationId, pkg.destinationId)]);
     relatedPackages = relatedPackages.filter(r => r.id !== pkg.id).slice(0, 3);
  } else if (pkg.stateId) {
     relatedPackages = await getPackageWithJoins([eq(packagesTable.stateId, pkg.stateId)]);
     relatedPackages = relatedPackages.filter(r => r.id !== pkg.id).slice(0, 3);
  }

  res.json({
    ...detailedPackage,
    relatedPackages,
  });
});

// GET /packages/:slug/calendar-inventory
router.get("/packages/:slug/calendar-inventory", cacheMiddleware(300), async (req, res): Promise<void> => {
  try {
    const slug = String(req.params.slug);
    const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
    const endDate = req.query.endDate ? String(req.query.endDate) : undefined;

    const [pkg] = await db
      .select({ id: packagesTable.id })
      .from(packagesTable)
      .where(eq(packagesTable.slug, slug))
      .limit(1);

    if (!pkg) {
      res.status(404).json({ error: "Package not found" });
      return;
    }

    let query = db
      .select()
      .from(packageCalendarInventoryTable)
      .where(eq(packageCalendarInventoryTable.packageId, pkg.id));

    if (startDate && endDate) {
      query = db
        .select()
        .from(packageCalendarInventoryTable)
        .where(
          and(
            eq(packageCalendarInventoryTable.packageId, pkg.id),
            sql`${packageCalendarInventoryTable.date} >= ${startDate}`,
            sql`${packageCalendarInventoryTable.date} <= ${endDate}`
          )
        );
    }

    const list = await query;
    res.json(list);
  } catch (e: any) {
    logger.error({ error: e.message }, "Failed to fetch public calendar inventory");
    res.status(500).json({ error: "Failed to fetch calendar inventory" });
  }
});

export default router;
