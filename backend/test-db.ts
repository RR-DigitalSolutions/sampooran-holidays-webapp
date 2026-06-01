import "dotenv/config";
import { db, countriesTable } from "@workspace/db";

async function test() {
  try {
    const list = await db.select().from(countriesTable);
    console.log("Success! Found", list.length, "countries");
  } catch(e: any) {
    console.error("DB Error:", e);
  }
  process.exit(0);
}
test();
