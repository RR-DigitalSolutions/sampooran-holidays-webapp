import { db, statesTable } from "@workspace/db";

async function main() {
  const states = await db.select().from(statesTable);
  const regions = new Set(states.map(s => s.region));
  console.log("Distinct regions in DB:", Array.from(regions));
  process.exit(0);
}

main().catch(console.error);
