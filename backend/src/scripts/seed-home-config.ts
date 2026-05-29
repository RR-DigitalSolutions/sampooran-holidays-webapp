/**
 * ─── ONE-TIME SETUP SCRIPT: Seed Home Page Config ────────────────────────────
 *
 * Run this ONCE on a fresh environment to populate the database with default
 * travel themes and homepage section layout.
 *
 * After running, all data is managed exclusively through the CMS Admin Panel.
 * DO NOT run this again on a live environment — it skips if data already exists.
 *
 * Usage:
 *   npx tsx backend/src/scripts/seed-home-config.ts
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import "dotenv/config";
import { db, homePageCategoriesTable, homePageSectionsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const DEFAULT_THEMES = [
  { label: "Adventure",    slug: "adventure",    iconName: "Mountain",    color: "text-orange-600 bg-orange-50",   href: "/packages?theme=Adventure" },
  { label: "Honeymoon",    slug: "honeymoon",    iconName: "Heart",       color: "text-pink-600 bg-pink-50",      href: "/packages?theme=Honeymoon" },
  { label: "Family",       slug: "family",       iconName: "Users",       color: "text-blue-600 bg-blue-50",      href: "/packages?theme=Family" },
  { label: "Wildlife",     slug: "wildlife",     iconName: "TreePine",    color: "text-green-600 bg-green-50",    href: "/packages?theme=Wildlife" },
  { label: "Beach",        slug: "beach",        iconName: "Waves",       color: "text-cyan-600 bg-cyan-50",      href: "/packages?theme=Beach" },
  { label: "Pilgrimage",   slug: "pilgrimage",   iconName: "Coffee",      color: "text-amber-600 bg-amber-50",    href: "/packages?theme=Religious" },
  { label: "Luxury",       slug: "luxury",       iconName: "Zap",         color: "text-purple-600 bg-purple-50",  href: "/packages?theme=Luxury" },
  { label: "Photography",  slug: "photography",  iconName: "Camera",      color: "text-yellow-600 bg-yellow-50",  href: "/packages?theme=Photography" },
  { label: "Trekking",     slug: "trekking",     iconName: "TrendingUp",  color: "text-emerald-600 bg-emerald-50", href: "/packages?theme=Trekking" },
  { label: "Cultural",     slug: "cultural",     iconName: "Globe",       color: "text-indigo-600 bg-indigo-50",  href: "/packages?theme=Cultural" },
  { label: "Hill Station", slug: "hill-station", iconName: "Sunset",      color: "text-rose-600 bg-rose-50",      href: "/packages?theme=Hill-Station" },
  { label: "Weekend",      slug: "weekend",      iconName: "Clock",       color: "text-slate-600 bg-slate-50",    href: "/packages?theme=Weekend" },
  { label: "Road Trip",    slug: "road-trip",    iconName: "Navigation",  color: "text-blue-700 bg-blue-50",      href: "/packages?theme=Road-Trip" },
  { label: "Wellness",     slug: "wellness",     iconName: "Heart",       color: "text-teal-600 bg-teal-50",      href: "/packages?theme=Wellness" },
  { label: "Solo",         slug: "solo",         iconName: "User",        color: "text-violet-600 bg-violet-50",  href: "/packages?theme=Solo" },
  { label: "Corporate",    slug: "corporate",    iconName: "Building2",   color: "text-gray-700 bg-gray-50",      href: "/packages?theme=Corporate" },
  { label: "Camping",      slug: "camping",      iconName: "TreePine",    color: "text-lime-600 bg-lime-50",      href: "/packages?theme=Camping" },
  { label: "Cruise",       slug: "cruise",       iconName: "Waves",       color: "text-sky-600 bg-sky-50",        href: "/packages?theme=Cruise" },
  { label: "Desert",       slug: "desert",       iconName: "Sunset",      color: "text-orange-700 bg-orange-50",  href: "/packages?theme=Desert" },
  { label: "Winter",       slug: "winter",       iconName: "Mountain",    color: "text-blue-400 bg-blue-50",      href: "/packages?theme=Winter" },
];

const DEFAULT_SECTIONS = [
  { sectionType: "HERO",              displayOrder: 1,  title: null,                          subtitle: null },
  { sectionType: "STATS",             displayOrder: 2,  title: null,                          subtitle: null },
  { sectionType: "OFFERS",            displayOrder: 3,  title: "Special Offers",              subtitle: "Best deals for your next trip" },
  { sectionType: "CATEGORIES",        displayOrder: 4,  title: "Explore by Themes",           subtitle: "Handpicked collections for your next escape" },
  { sectionType: "NEARBY_HOTELS",     displayOrder: 5,  title: "Stays Near You",              subtitle: "Curated properties in your vicinity" },
  { sectionType: "TOP_DESTINATIONS",  displayOrder: 6,  title: null,                          subtitle: null },
  { sectionType: "FEATURED_PACKAGES", displayOrder: 7,  title: "Trending Holiday Packages",   subtitle: "Hot Right Now" },
  { sectionType: "INTERNATIONAL",     displayOrder: 8,  title: null,                          subtitle: null },
  { sectionType: "TRANSPORT",         displayOrder: 9,  title: null,                          subtitle: null },
  { sectionType: "WHY_CHOOSE_US",     displayOrder: 10, title: null,                          subtitle: null },
  { sectionType: "TESTIMONIALS",      displayOrder: 11, title: null,                          subtitle: null },
  { sectionType: "B2B",               displayOrder: 12, title: null,                          subtitle: null },
];

async function run() {
  console.log("\n🌱 Sampooran Holidays — Home Config Seed Script");
  console.log("═".repeat(55));

  // ─── Travel Themes ──────────────────────────────────────────────────────────
  const [{ count: themeCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(homePageCategoriesTable);

  if (themeCount > 0) {
    console.log(`✅ Themes: ${themeCount} already exist — skipping (CMS data preserved)`);
  } else {
    console.log(`⏳ Themes: table is empty — seeding ${DEFAULT_THEMES.length} defaults...`);
    for (let i = 0; i < DEFAULT_THEMES.length; i++) {
      const t = DEFAULT_THEMES[i];
      await db
        .insert(homePageCategoriesTable)
        .values({
          label:        t.label,
          slug:         t.slug,
          iconName:     t.iconName,
          imageUrl:     null,       // Upload images via CMS Admin → Travel Themes
          color:        t.color,
          href:         t.href,
          displayOrder: i + 1,
          isActive:     true,
        })
        .onConflictDoNothing();
    }
    console.log(`✅ Themes: seeded ${DEFAULT_THEMES.length} defaults — upload images via CMS`);
  }

  // ─── Homepage Sections ──────────────────────────────────────────────────────
  const existingSections = await db
    .select({ sectionType: homePageSectionsTable.sectionType })
    .from(homePageSectionsTable);
  const existingTypes = new Set(existingSections.map(s => s.sectionType));

  const toInsert = DEFAULT_SECTIONS.filter(s => !existingTypes.has(s.sectionType));

  if (toInsert.length === 0) {
    console.log(`✅ Sections: all ${DEFAULT_SECTIONS.length} already exist — skipping`);
  } else {
    console.log(`⏳ Sections: inserting ${toInsert.length} missing section(s)...`);
    for (const section of toInsert) {
      await db.execute(
        sql`INSERT INTO home_page_sections (section_type, display_order, title, subtitle, is_active)
            VALUES (${section.sectionType}, ${section.displayOrder}, ${section.title}, ${section.subtitle}, true)
            ON CONFLICT DO NOTHING`
      );
    }
    console.log(`✅ Sections: inserted ${toInsert.length} section(s)`);
  }

  console.log("═".repeat(55));
  console.log("🎉 Done. All CMS data is now managed via Admin Panel.\n");
  process.exit(0);
}

run().catch(err => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
