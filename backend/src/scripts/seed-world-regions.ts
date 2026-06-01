import "dotenv/config";
import { db, regionsTable, countriesTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

async function main() {
  const regionsToSeed = [
    { name: "Africa", slug: "africa", displayOrder: 1, isActive: true },
    { name: "America", slug: "america", displayOrder: 2, isActive: true },
    { name: "Asia", slug: "asia", displayOrder: 3, isActive: true },
    { name: "Australia & New Zealand", slug: "australia-new-zealand", displayOrder: 4, isActive: true },
    { name: "Europe", slug: "europe", displayOrder: 5, isActive: true },
    { name: "Middle East", slug: "middle-east", displayOrder: 6, isActive: true },
    { name: "Antarctica", slug: "antarctica", displayOrder: 7, isActive: true },
    
    // Deactivate old regions
    { name: "South East Asia", slug: "south-east-asia", displayOrder: 99, isActive: false },
    { name: "Japan China Korea", slug: "japan-china-korea", displayOrder: 99, isActive: false }
  ];

  for (const r of regionsToSeed) {
    const [existing] = await db.select().from(regionsTable).where(eq(regionsTable.slug, r.slug));
    if (!existing) {
      await db.insert(regionsTable).values({
        name: r.name,
        slug: r.slug,
        isActive: r.isActive,
        displayOrder: r.displayOrder,
      });
      console.log(`Inserted Region: ${r.name}`);
    } else {
      await db.update(regionsTable).set({
        name: r.name,
        isActive: r.isActive,
        displayOrder: r.displayOrder,
      }).where(eq(regionsTable.id, existing.id));
      console.log(`Updated Region: ${r.name}`);
    }
  }

  // Now, re-assign countries from old Asian regions to the new "Asia" region
  const [asiaRegion] = await db.select().from(regionsTable).where(eq(regionsTable.slug, "asia"));
  const oldRegions = await db.select().from(regionsTable).where(inArray(regionsTable.slug, ["south-east-asia", "japan-china-korea"]));
  
  if (asiaRegion && oldRegions.length > 0) {
    const oldRegionIds = oldRegions.map(r => r.id);
    const result = await db.update(countriesTable)
      .set({ regionId: asiaRegion.id })
      .where(inArray(countriesTable.regionId, oldRegionIds))
      .returning();
    
    console.log(`Reassigned ${result.length} countries to the new 'Asia' region.`);
  }

  console.log("Seeding complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to seed regions:", err);
  process.exit(1);
});
