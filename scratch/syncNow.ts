import { syncHomeConfig } from "../backend/src/lib/mongoSync";
import { clearCachePattern } from "../backend/src/lib/cache";
import { getCollection, COLLECTIONS } from "../backend/src/lib/mongodb";

async function main() {
  console.log("Syncing home config to MongoDB...");
  await syncHomeConfig();
  await clearCachePattern("cache:/api/ota/home/config*");

  const col = await getCollection(COLLECTIONS.HOME_CONFIG);
  if (col) {
    const doc: any = await col.findOne({ _type: "homeConfig" });
    console.log("=== SYNCED MONGO HOME CONFIG CATEGORIES ===");
    if (doc?.categories) {
      console.log(doc.categories.map((c: any) => ({
        id: c.id,
        label: c.label,
        packageCount: c.packageCount,
        startingPrice: c.startingPrice
      })));
    }
  }
  process.exit(0);
}

main().catch(console.error);
