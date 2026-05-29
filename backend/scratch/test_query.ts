import { db, homePageCategoriesTable, packagesTable } from "../src/lib/db";
import { eq, and, asc, ne, sql, inArray, or, ilike } from "drizzle-orm";

async function test() {
  try {
    console.log("Testing Categories Query...");
    const categories = await db.select({
      id: homePageCategoriesTable.id,
      label: homePageCategoriesTable.label,
      packageCount: sql<number>`count(${packagesTable.id})::int`.as('packageCount'),
      startingPrice: sql<number>`min(${packagesTable.pricePerPerson})`.as('startingPrice')
    })
    .from(homePageCategoriesTable)
    .leftJoin(packagesTable, or(
      ilike(packagesTable.category, sql`'%' || ${homePageCategoriesTable.label} || '%'`),
      ilike(homePageCategoriesTable.label, sql`'%' || ${packagesTable.category} || '%'`)
    ))
    .where(eq(homePageCategoriesTable.isActive, true))
    .groupBy(homePageCategoriesTable.id, homePageCategoriesTable.label);
    
    console.log("Categories found:", categories.length);
    console.log("First category sample:", categories[0]);
  } catch (err) {
    console.error("Categories Query FAILED:", err);
  }
}

test();
