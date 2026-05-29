import { db, statesTable, destinationsTable, packagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Seeding mock packages...");

  // Assume Himachal Pradesh state exists (it usually has slug "himachal-pradesh")
  const [hpState] = await db.select().from(statesTable).where(eq(statesTable.slug, "himachal-pradesh"));
  let stateId = hpState?.id;

  if (!stateId) {
    if (hpState) stateId = hpState.id;
    else {
      // Find any state id for fallback if not found
      const [anyState] = await db.select().from(statesTable).limit(1);
      stateId = anyState?.id || null;
      console.log("Himachal Pradesh not found, using state fallback: ", stateId);
    }
  }

  const packagesToAdd = [
    {
      name: "Shimla Elegance Retreat",
      slug: "shimla-elegance-retreat",
      destSlug: "shimla",
      category: "Leisure",
      duration: 4,
      nights: 3,
      price: 18500,
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200",
      description: "Discover the colonial heritage and pristine mountain views of Shimla.",
      isFeatured: true
    },
    {
      name: "Manali Adventure Express",
      slug: "manali-adventure-express",
      destSlug: "manali",
      category: "Adventure",
      duration: 5,
      nights: 4,
      price: 22000,
      image: "https://images.unsplash.com/photo-1605649487212-4d4ce77fd2f8?w=1200",
      description: "Experience the thrill of Solang Valley and snow-capped peaks of Manali.",
      isFeatured: true
    },
    {
      name: "Jibhi Hidden Woods",
      slug: "jibhi-hidden-woods",
      destSlug: "jibhi",
      category: "Leisure",
      duration: 3,
      nights: 2,
      price: 12000,
      image: "https://images.unsplash.com/photo-1626207865181-4ba2b0c9f170?w=1200",
      description: "A serene getaway to the cozy pine forests and waterfalls of Jibhi.",
      isFeatured: false
    },
    {
      name: "Spiti Valley Expedition",
      slug: "spiti-valley-expedition",
      destSlug: "spiti-valley",
      category: "Adventure",
      duration: 8,
      nights: 7,
      price: 35000,
      image: "https://images.unsplash.com/photo-1616035252516-723bc11de753?w=1200",
      description: "Conquer the cold desert rugged terrains of Spiti on an epic road trip.",
      isFeatured: true
    }
  ];

  for (const pkg of packagesToAdd) {
    const [dest] = await db.select().from(destinationsTable).where(eq(destinationsTable.slug, pkg.destSlug));
    const destId = dest?.id || null;
    
    // Upsert package
    const existing = await db.select().from(packagesTable).where(eq(packagesTable.slug, pkg.slug));
    if (existing.length === 0) {
      await db.insert(packagesTable).values({
        name: pkg.name,
        slug: pkg.slug,
        stateId: stateId,
        destinationId: destId,
        destinationIds: destId ? [destId] : [],
        category: pkg.category,
        duration: pkg.duration,
        nights: pkg.nights,
        pricePerPerson: pkg.price,
        imageUrl: pkg.image,
        shortDescription: pkg.description,
        isFeatured: pkg.isFeatured,
      });
      console.log(`Inserted package: ${pkg.name}`);
    } else {
      console.log(`Package ${pkg.name} already exists. Skipping.`);
    }
  }

  process.exit(0);
}

main().catch(console.error);
