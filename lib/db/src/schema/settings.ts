import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const settingsTable = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // e.g., 'SIGNUP_BONUS_AMOUNT', 'REFERRAL_PERCENT_REFERRER'
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});
