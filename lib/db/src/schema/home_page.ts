import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const homePageSlidesTable = pgTable("home_page_slides", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  imageUrl: text("image_url").notNull(),
  videoUrl: text("video_url"),
  tag: text("tag"), // e.g., 'POPULAR', 'TRENDING'
  ctaText: text("cta_text"),
  ctaLink: text("cta_link"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const homePageCategoriesTable = pgTable("home_page_categories", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  slug: text("slug").unique(), // Added for SEO friendly URLs
  description: text("description"), // Brief summary
  content: text("content"), // Rich content for detail pages
  iconName: text("icon_name"), // Lucide icon name (now optional)
  imageUrl: text("image_url"), // Added for Instagram style themes
  href: text("href").notNull(),
  color: text("color"), // Tailwind color class or hex
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  // SEO Fields
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
});

export const homePageSectionsTable = pgTable("home_page_sections", {
  id: serial("id").primaryKey(),
  sectionType: text("section_type").notNull(), // 'HERO', 'CATEGORIES', 'FEATURED_PACKAGES', 'TRENDING_PACKAGES', 'NEARBY_HOTELS', 'STATS', 'WHY_CHOOSE_US', 'TESTIMONIALS'
  title: text("title"),
  subtitle: text("subtitle"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  config: jsonb("config"), // Any extra configuration
});

export const insertSlideSchema = createInsertSchema(homePageSlidesTable).omit({ id: true, createdAt: true });
export const insertCategorySchema = createInsertSchema(homePageCategoriesTable).omit({ id: true });
export const insertSectionSchema = createInsertSchema(homePageSectionsTable).omit({ id: true });
