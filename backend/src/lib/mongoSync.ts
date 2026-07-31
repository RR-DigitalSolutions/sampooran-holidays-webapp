/**
 * lib/mongoSync.ts
 *
 * Write-Through Sync Engine — PostgreSQL → MongoDB
 *
 * Architecture:
 *   Admin writes to PostgreSQL (ACID, relational integrity).
 *   After every successful PG write, we async-sync the denormalized
 *   document to MongoDB so public reads never need JOINs.
 *
 * Pattern: Fire-and-forget (non-blocking)
 *   - The HTTP response is returned to admin immediately after PG write.
 *   - MongoDB sync happens in the background.
 *   - If Mongo sync fails, Redis cache is also cleared so the next
 *     public read falls back to PG (which is always authoritative).
 *
 * Safety:
 *   - All sync functions are try/catch wrapped — they NEVER throw.
 *   - MongoDB is always secondary; PostgreSQL is the source of truth.
 *   - Sync failures are logged but do not affect the write response.
 */

import {
  db,
  packagesTable,
  destinationsTable,
  countriesTable,
  statesTable,
  themesTable,
  homePageSlidesTable,
  homePageCategoriesTable,
  homePageSectionsTable,
  offersTable,
  packageCalendarInventoryTable,
} from "@workspace/db";
import { eq, asc, sql, or, ilike } from "drizzle-orm";
import { getCollection, COLLECTIONS } from "./mongodb";
import { logger } from "./logger";

// ─── Type Definitions ─────────────────────────────────────────────────────────
// These types define the denormalized MongoDB document shapes.
// Denormalization is intentional: no JOINs = faster reads.

export interface MongoPackage {
  pgId: number;
  slug: string;
  name: string;
  packageCode: string | null;
  shortDescription: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;      // DB column is integer (days)
  nights: number | null;
  pricePerPerson: number | null;
  originalPrice: number | null;
  discountPercent: number | null;
  minGuests: number | null;
  maxGuests: number | null;
  isGroupPricing: boolean | null;
  groupBaseCapacity: number | null;
  extraPersonPrice: number | null;
  extraChildPrice: number | null;
  childWithBedPrice: number | null;
  childWithoutBedPrice: number | null;
  infantPrice: number | null;
  category: string | null;
  packageType: string | null;
  isFeatured: boolean | null;
  isTrending: boolean | null;
  rating: number | string | null;  // PG numeric column — Drizzle may return number or string
  reviewCount: number | null;
  highlights: any;
  cities: any;
  tags: any;
  inclusionIcons: any;
  // Denormalized from JOINs (no JOIN needed at read time)
  destinationId: number | null;
  destinationName: string | null;
  destinationIds?: number[] | null;
  stateId: number | null;
  stateName: string | null;
  stateIds?: number[] | null;
  countryId: number | null;
  countryName: string | null;
  countryIds?: number[] | null;
  syncedAt: Date;
}

export interface MongoDestination {
  pgId: number;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  isFeatured: boolean | null;
  packageCount: number | null;
  bestTimeToVisit: string | null;
  altitude: string | null;
  temperature: string | null;
  stateId: number | null;
  stateName: string | null;
  countryId: number | null;
  countryName: string | null;
  syncedAt: Date;
}

export interface MongoHomeConfig {
  _type: "homeConfig";
  slides: any[];
  categories: any[];
  sections: any[];
  themes: any[];
  offers: any[];
  syncedAt: Date;
}

// ─── Package Sync ─────────────────────────────────────────────────────────────

/**
 * Sync a single package (by PG ID) to MongoDB after an admin write.
 * Fetches fresh data from PG with all JOINs, builds denormalized doc.
 * Fire-and-forget: call without await from admin routes.
 */
export async function syncPackage(pgId: number): Promise<void> {
  try {
    const col = await getCollection<MongoPackage>(COLLECTIONS.PACKAGES);
    if (!col) return;

    // Fetch fresh denormalized package from PG
    const rows = await db
      .select({
        id: packagesTable.id,
        slug: packagesTable.slug,
        name: packagesTable.name,
        packageCode: packagesTable.packageCode,
        shortDescription: packagesTable.shortDescription,
        imageUrl: packagesTable.imageUrl,
        thumbnailUrl: packagesTable.thumbnailUrl,
        duration: packagesTable.duration,
        nights: packagesTable.nights,
        pricePerPerson: packagesTable.pricePerPerson,
        originalPrice: packagesTable.originalPrice,
        discountPercent: packagesTable.discountPercent,
        minGuests: packagesTable.minGuests,
        maxGuests: packagesTable.maxGuests,
        isGroupPricing: packagesTable.isGroupPricing,
        groupBaseCapacity: packagesTable.groupBaseCapacity,
        extraPersonPrice: packagesTable.extraPersonPrice,
        extraChildPrice: packagesTable.extraChildPrice,
        childWithBedPrice: packagesTable.childWithBedPrice,
        childWithoutBedPrice: packagesTable.childWithoutBedPrice,
        infantPrice: packagesTable.infantPrice,
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
        destinationId: packagesTable.destinationId,
        destinationIds: packagesTable.destinationIds,
        stateId: packagesTable.stateId,
        stateIds: packagesTable.stateIds,
        countryId: packagesTable.countryId,
        countryIds: packagesTable.countryIds,
        destinationName: destinationsTable.name,
        stateName: statesTable.name,
        countryName: countriesTable.name,
      })
      .from(packagesTable)
      .leftJoin(destinationsTable, eq(packagesTable.destinationId, destinationsTable.id))
      .leftJoin(statesTable, eq(destinationsTable.stateId, statesTable.id))
      .leftJoin(countriesTable, eq(statesTable.countryId, countriesTable.id))
      .where(eq(packagesTable.id, pgId))
      .limit(1);

    if (!rows[0]) {
      // Package was deleted — remove from Mongo too
      await col.deleteOne({ pgId });
      const calendarCol = await getCollection(COLLECTIONS.PACKAGE_CALENDAR);
      if (calendarCol) await calendarCol.deleteMany({ packageId: pgId });
      logger.debug({ pgId }, "MongoDB: package deleted (not found in PG)");
      return;
    }

    const row = rows[0];
    const doc: MongoPackage = {
      pgId: row.id,
      slug: row.slug,
      name: row.name,
      packageCode: row.packageCode,
      shortDescription: row.shortDescription,
      imageUrl: row.imageUrl,
      thumbnailUrl: row.thumbnailUrl,
      duration: row.duration,
      nights: row.nights,
      pricePerPerson: row.pricePerPerson,
      originalPrice: row.originalPrice,
      discountPercent: row.discountPercent,
      minGuests: row.minGuests,
      maxGuests: row.maxGuests,
      isGroupPricing: row.isGroupPricing,
      groupBaseCapacity: row.groupBaseCapacity,
      extraPersonPrice: row.extraPersonPrice,
      extraChildPrice: row.extraChildPrice,
      childWithBedPrice: row.childWithBedPrice,
      childWithoutBedPrice: row.childWithoutBedPrice,
      infantPrice: row.infantPrice,
      category: row.category,
      packageType: row.packageType,
      isFeatured: row.isFeatured,
      isTrending: row.isTrending,
      rating: row.rating,
      reviewCount: row.reviewCount,
      highlights: row.highlights,
      cities: row.cities,
      tags: row.tags,
      inclusionIcons: row.inclusionIcons,
      destinationId: row.destinationId,
      destinationName: row.destinationName,
      destinationIds: row.destinationIds,
      stateId: row.stateId,
      stateName: row.stateName,
      stateIds: row.stateIds,
      countryId: row.countryId,
      countryName: row.countryName,
      countryIds: row.countryIds,
      syncedAt: new Date(),
    };

    await col.replaceOne({ pgId }, doc, { upsert: true });
    logger.debug({ pgId, slug: doc.slug }, "✅ MongoDB: package synced");
  } catch (err) {
    logger.error({ err, pgId }, "MongoDB syncPackage failed — non-fatal");
  }
}

/**
 * Delete a package from MongoDB when admin deletes it from PG.
 */
export async function deleteMongoPackage(pgId: number): Promise<void> {
  try {
    const col = await getCollection<MongoPackage>(COLLECTIONS.PACKAGES);
    if (!col) return;
    await col.deleteOne({ pgId });
    
    // Also delete associated calendar entries
    const calendarCol = await getCollection(COLLECTIONS.PACKAGE_CALENDAR);
    if (calendarCol) {
      await calendarCol.deleteMany({ packageId: pgId });
    }
    
    logger.debug({ pgId }, "MongoDB: package and calendar removed");
  } catch (err) {
    logger.error({ err, pgId }, "MongoDB deleteMongoPackage failed — non-fatal");
  }
}

export interface MongoPackageCalendar {
  packageId: number;
  date: string; // YYYY-MM-DD
  rateType: string;
  priceModifierType: string | null;
  priceModifierValue: number | null;
  discountType: string | null;
  discountValue: number | null;
  syncedAt: Date;
}

/**
 * Sync all daily pricing rules for a package from PostgreSQL to MongoDB.
 */
export async function syncPackageCalendar(packageId: number): Promise<void> {
  try {
    const col = await getCollection<MongoPackageCalendar>(COLLECTIONS.PACKAGE_CALENDAR);
    if (!col) return;

    // Fetch all current custom pricing entries for this package from PG
    const pgRows = await db
      .select({
        packageId: packageCalendarInventoryTable.packageId,
        date: packageCalendarInventoryTable.date,
        rateType: packageCalendarInventoryTable.rateType,
        priceModifierType: packageCalendarInventoryTable.priceModifierType,
        priceModifierValue: packageCalendarInventoryTable.priceModifierValue,
        discountType: packageCalendarInventoryTable.discountType,
        discountValue: packageCalendarInventoryTable.discountValue,
      })
      .from(packageCalendarInventoryTable)
      .where(eq(packageCalendarInventoryTable.packageId, packageId));

    // First delete existing records for this package in Mongo
    await col.deleteMany({ packageId });

    if (pgRows.length > 0) {
      const docs: MongoPackageCalendar[] = pgRows.map((row) => ({
        packageId: row.packageId,
        date: row.date,
        rateType: row.rateType,
        priceModifierType: row.priceModifierType,
        priceModifierValue: row.priceModifierValue,
        discountType: row.discountType,
        discountValue: row.discountValue,
        syncedAt: new Date(),
      }));

      await col.insertMany(docs);
    }
    logger.debug({ packageId, count: pgRows.length }, "✅ MongoDB: package calendar synced");
  } catch (err) {
    logger.error({ err, packageId }, "MongoDB syncPackageCalendar failed — non-fatal");
  }
}

// ─── Destination Sync ─────────────────────────────────────────────────────────

export async function syncDestination(pgId: number): Promise<void> {
  try {
    const col = await getCollection<MongoDestination>(COLLECTIONS.DESTINATIONS);
    if (!col) return;

    const rows = await db
      .select({
        id: destinationsTable.id,
        slug: destinationsTable.slug,
        name: destinationsTable.name,
        description: destinationsTable.description,
        imageUrl: destinationsTable.imageUrl,
        thumbnailUrl: destinationsTable.thumbnailUrl,
        isFeatured: destinationsTable.isFeatured,
        packageCount: destinationsTable.packageCount,
        bestTimeToVisit: destinationsTable.bestTimeToVisit,
        altitude: destinationsTable.altitude,
        temperature: destinationsTable.temperature,
        stateId: destinationsTable.stateId,
        stateName: statesTable.name,
        countryId: statesTable.countryId,
        countryName: countriesTable.name,
      })
      .from(destinationsTable)
      .leftJoin(statesTable, eq(destinationsTable.stateId, statesTable.id))
      .leftJoin(countriesTable, eq(statesTable.countryId, countriesTable.id))
      .where(eq(destinationsTable.id, pgId))
      .limit(1);

    if (!rows[0]) {
      await col.deleteOne({ pgId });
      return;
    }

    const row = rows[0];
    await col.replaceOne(
      { pgId },
      { ...row, pgId: row.id, syncedAt: new Date() } as MongoDestination,
      { upsert: true }
    );
    logger.debug({ pgId }, "✅ MongoDB: destination synced");
  } catch (err) {
    logger.error({ err, pgId }, "MongoDB syncDestination failed — non-fatal");
  }
}

export async function deleteMongoDestination(pgId: number): Promise<void> {
  try {
    const col = await getCollection<MongoDestination>(COLLECTIONS.DESTINATIONS);
    if (!col) return;
    await col.deleteOne({ pgId });
  } catch (err) {
    logger.error({ err, pgId }, "MongoDB deleteMongoDestination failed — non-fatal");
  }
}

// ─── Home Config Sync ─────────────────────────────────────────────────────────

/**
 * Sync the entire home page config to a single MongoDB document.
 * Called whenever admin updates slides, categories, sections, themes, or offers.
 * The frontend reads this one document instead of 5 PG table joins.
 */
export async function syncHomeConfig(): Promise<void> {
  try {
    const col = await getCollection<MongoHomeConfig>(COLLECTIONS.HOME_CONFIG);
    if (!col) return;

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

      db.select().from(homePageSectionsTable).where(eq(homePageSectionsTable.isActive, true)).orderBy(asc(homePageSectionsTable.displayOrder)),

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

    const doc: MongoHomeConfig = {
      _type: "homeConfig",
      slides,
      categories,
      sections,
      themes,
      offers,
      syncedAt: new Date(),
    };

    await col.replaceOne({ _type: "homeConfig" }, doc, { upsert: true });
    logger.debug("✅ MongoDB: homeConfig synced with dynamic counts");
  } catch (err) {
    logger.error({ err }, "MongoDB syncHomeConfig failed — non-fatal");
  }
}

// ─── Bulk Initial Sync ────────────────────────────────────────────────────────

/**
 * Full bulk sync — copies ALL packages, destinations from PG to MongoDB.
 * Run on server startup to ensure MongoDB is never empty after a fresh deploy.
 * Uses batched upserts for efficiency.
 */
export async function runInitialSync(): Promise<void> {
  const mongoDb = await getCollection<MongoPackage>(COLLECTIONS.PACKAGES);
  if (!mongoDb) {
    logger.warn("MongoDB not available — skipping initial sync");
    return;
  }

  logger.info("🔄 Starting initial MongoDB sync from PostgreSQL...");

  try {
    await Promise.all([
      syncAllPackages(),
      syncAllDestinations(),
      syncAllCountries(),
      syncHomeConfig(),
    ]);
    logger.info("✅ Initial MongoDB sync complete");
  } catch (err) {
    logger.error({ err }, "Initial MongoDB sync failed — non-fatal, will sync on next write");
  }
}

async function syncAllCountries(): Promise<void> {
  try {
    const col = await getCollection<object>(COLLECTIONS.COUNTRIES);
    if (!col) return;
    const rows = await db.select().from(countriesTable);
    if (!rows.length) return;
    const ops = rows.map((row) => ({
      replaceOne: {
        filter: { pgId: (row as any).id },
        replacement: { ...row, pgId: (row as any).id, syncedAt: new Date() },
        upsert: true,
      },
    }));
    await col.bulkWrite(ops as any, { ordered: false });
    logger.info({ count: rows.length }, "✅ MongoDB: countries bulk synced");
  } catch (err) {
    logger.error({ err }, "syncAllCountries failed");
  }
}

async function syncAllPackages(): Promise<void> {
  try {
    const col = await getCollection<MongoPackage>(COLLECTIONS.PACKAGES);
    if (!col) return;

    // Fetch all packages with denormalized JOIN data
    const rows = await db
      .select({
        id: packagesTable.id,
        slug: packagesTable.slug,
        name: packagesTable.name,
        shortDescription: packagesTable.shortDescription,
        imageUrl: packagesTable.imageUrl,
        thumbnailUrl: packagesTable.thumbnailUrl,
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
        destinationId: packagesTable.destinationId,
        stateId: packagesTable.stateId,
        countryId: packagesTable.countryId,
        destinationName: destinationsTable.name,
        stateName: statesTable.name,
        countryName: countriesTable.name,
      })
      .from(packagesTable)
      .leftJoin(destinationsTable, eq(packagesTable.destinationId, destinationsTable.id))
      .leftJoin(statesTable, eq(destinationsTable.stateId, statesTable.id))
      .leftJoin(countriesTable, eq(statesTable.countryId, countriesTable.id));

    if (!rows.length) return;

    // Batch upsert (bulk write for performance)
    const ops = rows.map((row) => ({
      replaceOne: {
        filter: { pgId: row.id },
        replacement: {
          pgId: row.id,
          slug: row.slug,
          name: row.name,
          shortDescription: row.shortDescription,
          imageUrl: row.imageUrl,
          thumbnailUrl: row.thumbnailUrl,
          duration: row.duration,
          nights: row.nights,
          pricePerPerson: row.pricePerPerson,
          originalPrice: row.originalPrice,
          discountPercent: row.discountPercent,
          category: row.category,
          packageType: row.packageType,
          isFeatured: row.isFeatured,
          isTrending: row.isTrending,
          rating: row.rating,
          reviewCount: row.reviewCount,
          highlights: row.highlights,
          cities: row.cities,
          tags: row.tags,
          inclusionIcons: row.inclusionIcons,
          destinationId: row.destinationId,
          destinationName: row.destinationName,
          stateId: row.stateId,
          stateName: row.stateName,
          countryId: row.countryId,
          countryName: row.countryName,
          syncedAt: new Date(),
        } as unknown as MongoPackage,
        upsert: true,
      },
    }));

    await col.bulkWrite(ops, { ordered: false });
    logger.info({ count: rows.length }, "✅ MongoDB: packages bulk synced");
  } catch (err) {
    logger.error({ err }, "syncAllPackages failed");
  }
}

async function syncAllDestinations(): Promise<void> {
  try {
    const col = await getCollection<MongoDestination>(COLLECTIONS.DESTINATIONS);
    if (!col) return;

    const rows = await db
      .select({
        id: destinationsTable.id,
        slug: destinationsTable.slug,
        name: destinationsTable.name,
        description: destinationsTable.description,
        imageUrl: destinationsTable.imageUrl,
        thumbnailUrl: destinationsTable.thumbnailUrl,
        isFeatured: destinationsTable.isFeatured,
        packageCount: destinationsTable.packageCount,
        bestTimeToVisit: destinationsTable.bestTimeToVisit,
        altitude: destinationsTable.altitude,
        temperature: destinationsTable.temperature,
        stateId: destinationsTable.stateId,
        stateName: statesTable.name,
        countryId: statesTable.countryId,
        countryName: countriesTable.name,
      })
      .from(destinationsTable)
      .leftJoin(statesTable, eq(destinationsTable.stateId, statesTable.id))
      .leftJoin(countriesTable, eq(statesTable.countryId, countriesTable.id));

    if (!rows.length) return;

    const ops = rows.map((row) => ({
      replaceOne: {
        filter: { pgId: row.id },
        replacement: {
          ...row,
          pgId: row.id,
          syncedAt: new Date(),
        } as MongoDestination,
        upsert: true,
      },
    }));

    await col.bulkWrite(ops, { ordered: false });
    logger.info({ count: rows.length }, "✅ MongoDB: destinations bulk synced");
  } catch (err) {
    logger.error({ err }, "syncAllDestinations failed");
  }
}
