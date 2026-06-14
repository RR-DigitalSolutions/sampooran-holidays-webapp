import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { db, countriesTable, statesTable, destinationsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

async function run() {
  try {
    console.log("Setting default hotels navbar visibility flags...");

    // 1. Countries
    const targetCountries = ["india", "thailand", "indonesia", "maldives", "nepal"];
    for (let i = 0; i < targetCountries.length; i++) {
      const slug = targetCountries[i];
      await db.update(countriesTable)
        .set({ showInHotelsMenu: true, hotelsMenuOrder: i + 1 })
        .where(eq(countriesTable.slug, slug));
      console.log(`Updated country: ${slug} (Order: ${i + 1})`);
    }

    // 2. States / Regions
    const targetStates = [
      { slug: "himachal-pradesh", order: 1 },
      { slug: "jammu-kashmir", order: 2 },
      { slug: "rajasthan", order: 3 },
      { slug: "uttarakhand", order: 4 },
      { slug: "ladakh", order: 5 },
      { slug: "keralam-kerala", order: 6 },
      { slug: "bali", order: 7 }
    ];
    for (const s of targetStates) {
      await db.update(statesTable)
        .set({ showInHotelsMenu: true, hotelsMenuOrder: s.order })
        .where(eq(statesTable.slug, s.slug));
      console.log(`Updated state: ${s.slug} (Order: ${s.order})`);
    }

    // 3. Places / Cities
    const targetPlaces = [
      { slug: "manali", order: 1 },
      { slug: "shimla", order: 2 },
      { slug: "dharamshala-tour-packages", order: 3 },
      { slug: "jaipur", order: 4 },
      { slug: "leh", order: 5 },
      { slug: "gulmarg", order: 6 },
      { slug: "rishikesh", order: 7 },
      { slug: "mussoorie", order: 8 },
      { slug: "ubud", order: 9 },
      { slug: "phuket", order: 10 },
      { slug: "male-atoll", order: 11 }
    ];
    for (const p of targetPlaces) {
      await db.update(destinationsTable)
        .set({ showInHotelsMenu: true, hotelsMenuOrder: p.order })
        .where(eq(destinationsTable.slug, p.slug));
      console.log(`Updated place: ${p.slug} (Order: ${p.order})`);
    }

    console.log("Seeding hotels navbar visibility completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding hotels menu visibility:", error);
    process.exit(1);
  }
}

run();
