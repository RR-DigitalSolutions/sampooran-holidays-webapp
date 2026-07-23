import { db, homePageCategoriesTable, packagesTable, themesTable } from "../lib/db/src/index";
import { eq, asc, sql, or, ilike } from "drizzle-orm";

async function main() {
  console.log("=== TESTING POSTGRESQL QUERY ===");

  const categories = await db.select({
    id: homePageCategoriesTable.id,
    label: homePageCategoriesTable.label,
    slug: homePageCategoriesTable.slug,
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
    homePageCategoriesTable.id, homePageCategoriesTable.label, homePageCategoriesTable.slug
  )
  .orderBy(asc(homePageCategoriesTable.displayOrder));

  console.log("Categories with Package Counts:");
  console.log(categories);

  const themes = await db.select({
    id: themesTable.id,
    name: themesTable.name,
    packageCount: sql<number>`count(${packagesTable.id})::int`.as('packageCount'),
    startingPrice: sql<number>`min(${packagesTable.pricePerPerson})`.as('startingPrice')
  })
  .from(themesTable)
  .leftJoin(packagesTable, or(
    ilike(packagesTable.category, sql`concat('%', ${themesTable.name}, '%')`),
    ilike(themesTable.name, sql`concat('%', ${packagesTable.category}, '%')`)
  ))
  .where(eq(themesTable.isActive, true))
  .groupBy(themesTable.id, themesTable.name)
  .orderBy(asc(themesTable.displayOrder));

  console.log("Themes with Package Counts:");
  console.log(themes);

  process.exit(0);
}

main().catch(console.error);
