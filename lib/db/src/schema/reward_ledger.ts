import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";

export const rewardTransactionsTable = pgTable("reward_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: real("amount").notNull(),
  type: text("type").notNull(), // 'SIGNUP_BONUS', 'REFERRAL_EARNING', 'BOOKING_REBATE', 'REDEMPTION'
  description: text("description"),
  relatedBookingId: integer("related_booking_id"),
  createdAt: timestamp("created_at").defaultNow(),
});
