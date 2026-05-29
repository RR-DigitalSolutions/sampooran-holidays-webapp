import { db, destinationsTable } from "../src";

async function main() {
  const all = await db.select().from(destinationsTable);
  console.log("Destinations in DB:");
  all.forEach(d => {
    console.log(`- ${d.name} (${d.slug})`);
    console.log(`  Highlights: ${d.highlights?.length || 0}`);
    console.log(`  Things to do: ${d.thingsToDo?.length || 0}`);
    console.log(`  Local Cuisine: ${d.localCuisine?.length || 0}`);
    console.log(`  Reach: ${d.howToReach ? "Yes" : "No"}`);
    console.log(`  Long Desc: ${d.longDescription ? "Yes" : "No"}`);
    console.log(`  Famous For: ${d.famousFor?.length || 0}`);
    console.log(`  Gallery: ${d.galleryImages?.length || 0}`);
    console.log(`  FAQs: ${d.faqs ? "Yes" : "No"}`);
  });
}

main().catch(console.error);
