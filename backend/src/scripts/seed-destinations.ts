import { db, countriesTable, statesTable, destinationsTable, themesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Seeding India, Himachal Pradesh, and Manali...");

  // 1. Add India
  let [india] = await db.select().from(countriesTable).where(eq(countriesTable.slug, "india"));
  if (!india) {
    [india] = await db.insert(countriesTable).values({
      name: "India",
      slug: "india",
      code: "IN",
      description: "Incredible India",
      imageUrl: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da",
      isActive: true,
      displayOrder: 1,
    }).returning();
    console.log("Created India.");
  } else {
    console.log("India already exists.");
  }

  // 2. Add Himachal Pradesh
  let [himachal] = await db.select().from(statesTable).where(eq(statesTable.slug, "himachal-pradesh"));
  if (!himachal) {
    [himachal] = await db.insert(statesTable).values({
      name: "Himachal Pradesh",
      slug: "himachal-pradesh",
      countryId: india.id,
      description: "The land of snow and mountains",
      imageUrl: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23",
      isActive: true,
      displayOrder: 1,
      region: "North India"
    }).returning();
    console.log("Created Himachal Pradesh.");
  } else {
    console.log("Himachal Pradesh already exists.");
  }

  // 3. Add Manali
  let [manali] = await db.select().from(destinationsTable).where(eq(destinationsTable.slug, "manali"));
  if (!manali) {
    [manali] = await db.insert(destinationsTable).values({
      name: "Manali",
      slug: "manali",
      stateId: himachal.id,
      description: "A high-altitude Himalayan resort town.",
      imageUrl: "https://images.unsplash.com/photo-1605649487212-4dcb18c0cb81",
      isActive: true,
      displayOrder: 1,
    }).returning();
    console.log("Created Manali.");
  } else {
    console.log("Manali already exists.");
  }

  // 4. Add some sample themes
  const themeNames = [
    { name: "Honeymoon", slug: "honeymoon", icon: "❤️" },
    { name: "Adventure", slug: "adventure", icon: "🏔️" },
    { name: "Family", slug: "family", icon: "👨‍👩‍👧‍👦" }
  ];

  for (const theme of themeNames) {
    const [existingTheme] = await db.select().from(themesTable).where(eq(themesTable.slug, theme.slug));
    if (!existingTheme) {
      await db.insert(themesTable).values({
        name: theme.name,
        slug: theme.slug,
        description: `${theme.name} tour packages`,
        isActive: true,
        displayOrder: 1,
        imageUrl: ""
      });
      console.log(`Created theme ${theme.name}.`);
    }
  }

  console.log("Seeding complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
