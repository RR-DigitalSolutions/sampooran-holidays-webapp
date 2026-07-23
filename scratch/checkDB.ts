import { db, homePageCategoriesTable, packagesTable, themesTable } from "../lib/db/src/index";

async function main() {
  const cats = await db.select().from(homePageCategoriesTable);
  console.log("=== HOME PAGE CATEGORIES ===");
  console.log(cats.map(c => ({ id: c.id, label: c.label, slug: c.slug })));

  const themes = await db.select().from(themesTable);
  console.log("=== THEMES TABLE ===");
  console.log(themes.map(t => ({ id: t.id, name: t.name, slug: t.slug })));

  const pkgs = await db.select({ id: packagesTable.id, name: packagesTable.name, category: packagesTable.category }).from(packagesTable);
  console.log("=== PACKAGES (sample 10) ===");
  console.log(pkgs.slice(0, 10));

  process.exit(0);
}

main().catch(console.error);
