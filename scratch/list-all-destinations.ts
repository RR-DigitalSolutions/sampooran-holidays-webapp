import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { db, countriesTable, statesTable, destinationsTable } from "@workspace/db";

async function run() {
  try {
    const countries = await db.select({ id: countriesTable.id, name: countriesTable.name, slug: countriesTable.slug }).from(countriesTable);
    const states = await db.select({ id: statesTable.id, name: statesTable.name, slug: statesTable.slug }).from(statesTable);
    const places = await db.select({ id: destinationsTable.id, name: destinationsTable.name, slug: destinationsTable.slug }).from(destinationsTable);

    console.log("Countries:");
    countries.forEach(c => console.log(`  - ${c.name} (${c.slug})`));
    console.log("\nStates:");
    states.forEach(s => console.log(`  - ${s.name} (${s.slug})`));
    console.log("\nPlaces/Cities:");
    places.forEach(p => console.log(`  - ${p.name} (${p.slug})`));
    process.exit(0);
  } catch (error) {
    console.error("Error inspecting database:", error);
    process.exit(1);
  }
}

run();
