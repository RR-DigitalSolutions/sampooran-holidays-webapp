import { db, homePageSlidesTable, homePageCategoriesTable, homePageSectionsTable } from "./index";

async function seedHome() {
  console.log("Seeding home page config...");

  // Slides
  await db.insert(homePageSlidesTable).values([
    {
      title: "Discover Manali",
      subtitle: "Snow peaks, adventure sports & Himalayan magic",
      imageUrl: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1920&q=80",
      tag: "TRENDING",
      displayOrder: 1
    },
    {
      title: "Leh Ladakh",
      subtitle: "Azure lakes, ancient monasteries & high altitude passes",
      imageUrl: "https://images.unsplash.com/photo-1585136917228-84d90aa03a77?w=1920&q=80",
      tag: "POPULAR",
      displayOrder: 2
    },
    {
      title: "Kashmir — Paradise",
      subtitle: "Dal Lake houseboats, Mughal gardens & meadows",
      imageUrl: "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?w=1920&q=80",
      tag: "HOT DEAL",
      displayOrder: 3
    }
  ]).onConflictDoNothing();

  // Categories
  await db.insert(homePageCategoriesTable).values([
    { label: "Adventure", iconName: "Mountain", href: "/packages?category=Adventure", color: "text-orange-600 bg-orange-50", displayOrder: 1 },
    { label: "Honeymoon", iconName: "Heart", href: "/packages?category=Honeymoon", color: "text-pink-600 bg-pink-50", displayOrder: 2 },
    { label: "Family", iconName: "Users", href: "/packages?category=Family", color: "text-blue-600 bg-blue-50", displayOrder: 3 },
    { label: "Wildlife", iconName: "TreePine", href: "/packages?category=Wildlife", color: "text-green-600 bg-green-50", displayOrder: 4 },
  ]).onConflictDoNothing();

  // Sections
  await db.insert(homePageSectionsTable).values([
    { sectionType: "HERO", displayOrder: 1 },
    { sectionType: "STATS", displayOrder: 2 },
    { sectionType: "CATEGORIES", displayOrder: 3 },
    { sectionType: "NEARBY_HOTELS", title: "Recommended Properties Near You", subtitle: "Handpicked hotels and stays based on your location", displayOrder: 4 },
    { sectionType: "TOP_DESTINATIONS", displayOrder: 5 },
    { sectionType: "FEATURED_PACKAGES", title: "Trending Holiday Packages", subtitle: "Curated for you", displayOrder: 6 },
    { sectionType: "TRENDING_PACKAGES", title: "Trending This Season", subtitle: "Hot Right Now", displayOrder: 7 },
  ]).onConflictDoNothing();

  console.log("Seeding complete!");
}

seedHome().catch(console.error);
