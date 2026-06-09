import { db, homePageCategoriesTable } from "./index";
import { sql } from "drizzle-orm";

const THEMES = [
  { label: "Adventure", iconName: "Mountain", color: "text-orange-600 bg-orange-50", href: "/packages?theme=Adventure" },
  { label: "Honeymoon", iconName: "Heart", color: "text-pink-600 bg-pink-50", href: "/packages?theme=Honeymoon" },
  { label: "Family", iconName: "Users", color: "text-blue-600 bg-blue-50", href: "/packages?theme=Family" },
  { label: "Wildlife", iconName: "TreePine", color: "text-green-600 bg-green-50", href: "/packages?theme=Wildlife" },
  { label: "Beach", iconName: "Waves", color: "text-cyan-600 bg-cyan-50", href: "/packages?theme=Beach" },
  { label: "Pilgrimage", iconName: "Coffee", color: "text-amber-600 bg-amber-50", href: "/packages?theme=Religious" },
  { label: "Luxury", iconName: "Zap", color: "text-purple-600 bg-purple-50", href: "/packages?theme=Luxury" },
  { label: "Photography", iconName: "Camera", color: "text-yellow-600 bg-yellow-50", href: "/packages?theme=Photography" },
  { label: "Trekking", iconName: "TrendingUp", color: "text-emerald-600 bg-emerald-50", href: "/packages?theme=Trekking" },
  { label: "Cultural", iconName: "Globe", color: "text-indigo-600 bg-indigo-50", href: "/packages?theme=Cultural" },
  { label: "Hill Station", iconName: "Sunset", color: "text-rose-600 bg-rose-50", href: "/packages?theme=Hill-Station" },
  { label: "Weekend", iconName: "Clock", color: "text-slate-600 bg-slate-50", href: "/packages?theme=Weekend" },
  { label: "Road Trip", iconName: "Navigation", color: "text-blue-700 bg-blue-50", href: "/packages?theme=Road-Trip" },
  { label: "Wellness", iconName: "Heart", color: "text-teal-600 bg-teal-50", href: "/packages?theme=Wellness" },
  { label: "Solo", iconName: "User", color: "text-violet-600 bg-violet-50", href: "/packages?theme=Solo" },
  { label: "Corporate", iconName: "Building2", color: "text-gray-700 bg-gray-50", href: "/packages?theme=Corporate" },
  { label: "Camping", iconName: "TreePine", color: "text-lime-600 bg-lime-50", href: "/packages?theme=Camping" },
  { label: "Cruise", iconName: "Waves", color: "text-sky-600 bg-sky-50", href: "/packages?theme=Cruise" },
  { label: "Desert", iconName: "Sunset", color: "text-orange-700 bg-orange-50", href: "/packages?theme=Desert" },
  { label: "Winter", iconName: "Mountain", color: "text-blue-400 bg-blue-50", href: "/packages?theme=Winter" },
];

export async function seedThemes() {
  console.log("Seeding 20+ professional themes...");
  
  // Clear existing to avoid duplicates during this task
  await db.delete(homePageCategoriesTable);

  for (let i = 0; i < THEMES.length; i++) {
    await db.insert(homePageCategoriesTable).values({
      ...THEMES[i],
      displayOrder: i + 1,
      isActive: true
    });
  }
  
  console.log("Themes seeded successfully!");
}
