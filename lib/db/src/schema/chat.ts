import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";

export const conversationsTable = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().default(0),
  guestSessionId: text("guest_session_id"),
  guestName: text("guest_name"),
  guestPhone: text("guest_phone"),
  guestEmail: text("guest_email"),
  assignedStaffId: integer("assigned_staff_id"),  // staff member handling this chat
  status: text("status").default("OPEN"),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  senderId: integer("sender_id"), // Null if system message, or references usersTable.id
  senderRole: text("sender_role"), // 'USER', 'AGENT', 'ADMIN'
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
