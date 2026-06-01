import "dotenv/config";
import { db, regionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function main() {
  const regionsToSeed = [
    { name: "Europe", slug: "europe", displayOrder: 1 },
    { name: "South East Asia", slug: "south-east-asia", displayOrder: 2 },
    { name: "Japan China Korea", slug: "japan-china-korea", displayOrder: 3 },
    { name: "Australia New Zealand", slug: "australia-new-zealand", displayOrder: 4 },
    { name: "Africa", slug: "africa", displayOrder: 5 },
    { name: "America", slug: "america", displayOrder: 6 },
  ];

  for (const r of regionsToSeed) {
    const [existing] = await db.select().from(regionsTable).where(eq(regionsTable.slug, r.slug));
    if (!existing) {
      await db.insert(regionsTable).values({
        name: r.name,
        slug: r.slug,
        isActive: true,
        displayOrder: r.displayOrder,
      });
      console.log(`Inserted Region: ${r.name}`);
    } else {
      console.log(`Region ${r.name} already exists`);
    }
  }

  console.log("Seeding complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to seed regions:", err);
  process.exit(1);
});
