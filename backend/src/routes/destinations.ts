import { Router, type IRouter } from "express";
import { eq, ilike, and, sql, asc, or, inArray } from "drizzle-orm";
import { db, destinationsTable, countriesTable, statesTable, regionsTable, themesTable, packagesTable, homePageCategoriesTable } from "@workspace/db";
import { buildPackageDetail } from "./packages";
import {
  ListDestinationsQueryParams,
  GetDestinationParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/destinations", async (req, res): Promise<void> => {
  const params = ListDestinationsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { country, state, featured, limit = 50, offset = 0 } = params.data;

  const allDestinations = await db
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
    .limit(Number(limit))
    .offset(Number(offset));

  let filtered = allDestinations;
  if (featured !== undefined) {
    filtered = filtered.filter(d => d.isFeatured === featured);
  }
  if (state) {
    filtered = filtered.filter(d => d.stateName?.toLowerCase() === String(state).toLowerCase());
  }
  if (country) {
    filtered = filtered.filter(d => d.countryName?.toLowerCase() === String(country).toLowerCase());
  }

  res.json({ destinations: filtered, total: filtered.length });
});

router.get("/destinations/featured", async (_req, res): Promise<void> => {
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

  res.json({ destinations });
});

router.get("/destinations/countries", async (_req, res): Promise<void> => {
  const countries = await db.select().from(countriesTable);
  res.json({ countries });
});

router.get("/destinations/mega-menu", async (_req, res): Promise<void> => {
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
    
    const worldRegions = regions.map(region => ({
      ...region,
      countries: allCountries.filter(c => c.regionId === region.id && c.slug !== "india")
    })).filter(r => r.countries.length > 0);

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
    console.error("Mega menu error:", error);
    res.status(500).json({ error: "Failed to fetch mega menu data" });
  }
});

router.get("/destinations/resolve-slug/:slug", async (req, res): Promise<void> => {
  const { slug } = req.params;
  try {
    // Check HomePage Category FIRST (Dynamic Theme Landing Page from CMS)
    // Check both slug and exact href (e.g. if href is "/family-tours")
    const [category] = await db.select({
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
    .where(
      or(
        eq(homePageCategoriesTable.slug, slug),
        eq(homePageCategoriesTable.href, `/${slug}`)
      )
    )
    .groupBy(
      homePageCategoriesTable.id,
      homePageCategoriesTable.label,
      homePageCategoriesTable.slug,
      homePageCategoriesTable.description,
      homePageCategoriesTable.content,
      homePageCategoriesTable.iconName,
      homePageCategoriesTable.imageUrl,
      homePageCategoriesTable.href,
      homePageCategoriesTable.color,
      homePageCategoriesTable.isActive
    )
    .limit(1);

    if (category && category.id) {
      return void res.json({ 
        type: "theme", 
        data: {
          ...category,
          name: category.label, // Normalize to themesTable interface
        } 
      });
    }

    // Fallback to older Theme table
    const [theme] = await db.select({
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
    .groupBy(
      themesTable.id,
      themesTable.name,
      themesTable.slug,
      themesTable.imageUrl,
      themesTable.description,
      themesTable.isActive
    )
    .limit(1);
    if (theme && theme.id) return void res.json({ type: "theme", data: theme });

    // Check Package
    const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.slug, slug)).limit(1);
    if (pkg) {
      const detailed = await buildPackageDetail(pkg);
      return void res.json({ type: "package", data: detailed });
    }

    // Check Country
    const [country] = await db.select().from(countriesTable).where(eq(countriesTable.slug, slug)).limit(1);
    if (country) return void res.json({ type: "country", data: country });

    // Check State
    const [state] = await db.select().from(statesTable).where(eq(statesTable.slug, slug)).limit(1);
    if (state) return void res.json({ type: "state", data: state });

    // Check Destination
    const [destination] = await db.select().from(destinationsTable).where(eq(destinationsTable.slug, slug)).limit(1);
    if (destination) return void res.json({ type: "destination", data: destination });

    res.status(404).json({ error: "Slug not found" });
  } catch (error) {
    console.error("Resolve slug error:", error);
    res.status(500).json({ error: "Failed to resolve slug" });
  }
});

router.get("/destinations/states", async (req, res): Promise<void> => {
  const countryParam = req.query.country as string | undefined;
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
  if (countryParam) {
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
