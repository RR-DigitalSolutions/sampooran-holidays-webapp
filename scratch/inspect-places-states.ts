import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { db, destinationsTable, statesTable, countriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function run() {
  try {
    const list = await db
      .select({
        id: destinationsTable.id,
        name: destinationsTable.name,
        slug: destinationsTable.slug,
        stateId: destinationsTable.stateId,
        stateName: statesTable.name,
        countryName: countriesTable.name,
        showInHotelsMenu: destinationsTable.showInHotelsMenu,
      })
      .from(destinationsTable)
      .leftJoin(statesTable, eq(destinationsTable.stateId, statesTable.id))
      .leftJoin(countriesTable, eq(statesTable.countryId, countriesTable.id));

    console.log("Places detail:");
    list.forEach(p => {
      console.log(`  - ${p.name} (slug: ${p.slug}, stateId: ${p.stateId}, state: ${p.stateName}, country: ${p.countryName}, showInHotelsMenu: ${p.showInHotelsMenu})`);
    });
    process.exit(0);
  } catch (error) {
    console.error("Error inspecting places:", error);
    process.exit(1);
  }
}

run();
