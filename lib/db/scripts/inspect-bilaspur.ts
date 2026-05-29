import { db, destinationsTable, eq } from "../src";

async function main() {
  const [d] = await db.select().from(destinationsTable).where(eq(destinationsTable.slug, "bilaspur-tour-packages")).limit(1);
  if (!d) {
    console.log("Not found");
    return;
  }
  console.log(JSON.stringify(d, null, 2));
}

main().catch(console.error);
