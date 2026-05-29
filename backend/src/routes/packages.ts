import { Router, type IRouter } from "express";
import { cacheMiddleware } from "../lib/cache";
import { eq, sql, and, gte, lte, or, ilike } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db, packagesTable, destinationsTable, statesTable, countriesTable, attractionsTable, diningPointsTable, packageThemesTable, themesTable } from "@workspace/db";
import { inArray } from "drizzle-orm";
import {
  ListPackagesQueryParams,
  GetPackageParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const packageStates = alias(statesTable, "package_states");
const packageCountries = alias(countriesTable, "package_countries");

async function getPackageWithJoins(filters: any[] = []) {
  const query = db
    .select({
      id: packagesTable.id,
      name: packagesTable.name,
      slug: packagesTable.slug,
      destinationId: packagesTable.destinationId,
      stateId: packagesTable.stateId,
      countryId: packagesTable.countryId,
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

  if (filters.length > 0) {
    return query.where(and(...filters));
  }
  return query;
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
  };
}

router.get("/packages", cacheMiddleware(300), async (req, res): Promise<void> => {
  const params = ListPackagesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { destinationSlug, state, country, category, minDays, maxDays, minPrice, maxPrice, type, featured, limit = 50, offset = 0, search } = params.data;

  const filters: any[] = [];
  if (featured !== undefined) filters.push(eq(packagesTable.isFeatured, featured));
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

  const queryResult = await getPackageWithJoins(filters);
  const total = queryResult.length;
  const paged = queryResult.slice(Number(offset), Number(offset) + Number(limit));

  res.json({ packages: paged, total });
});

router.get("/packages/featured", cacheMiddleware(300), async (_req, res): Promise<void> => {
  const packages = await getPackageWithJoins([eq(packagesTable.isFeatured, true)]);
  res.json({ packages: packages.slice(0, 8) });
});

router.get("/packages/trending", cacheMiddleware(300), async (_req, res): Promise<void> => {
  const packages = await getPackageWithJoins([eq(packagesTable.isTrending, true)]);
  res.json({ packages: packages.slice(0, 6) });
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

export default router;
