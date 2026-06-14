import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { db, statesTable } from "@workspace/db";

async function run() {
  try {
    const states = await db.select({
      id: statesTable.id,
      name: statesTable.name,
      slug: statesTable.slug,
      region: statesTable.region,
      showInHotelsMenu: statesTable.showInHotelsMenu
    }).from(statesTable);

    console.log("States detail:");
    states.forEach(s => {
      console.log(`  - ${s.name} (slug: ${s.slug}, region: ${s.region}, showInHotelsMenu: ${s.showInHotelsMenu})`);
    });
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

run();
