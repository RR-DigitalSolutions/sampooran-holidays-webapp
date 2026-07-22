import { pgTable, text, serial, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSATIONS TABLE
// One row per guest/user conversation thread.
// ─────────────────────────────────────────────────────────────────────────────
export const conversationsTable = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().default(0),
  guestSessionId: text("guest_session_id"),

  // Guest contact info (collected by bot pre-form)
  guestName: text("guest_name"),
  guestPhone: text("guest_phone"),
  guestEmail: text("guest_email"),

  // ── Assignment (controlled exclusively by Supervisor/Admin) ──────────────
  assignedStaffId: integer("assigned_staff_id"),   // staff member ID handling this chat
  assignedVendorId: integer("assigned_vendor_id"), // optional: vendor looped in
  assignedDepartment: text("assigned_department").default("UNASSIGNED"), // TOURS | HOTELS | TAXI | B2B | B2C | GENERAL | UNASSIGNED

  // ── Classification (set by AI bot + can be overridden by supervisor) ──────
  category: text("category").default("GENERAL"), // TOUR | HOTEL | TAXI | B2B | B2C | GENERAL
  priority: text("priority").default("NORMAL"),   // LOW | NORMAL | HIGH | URGENT

  // ── AI Bot metadata ────────────────────────────────────────────────────────
  botState: text("bot_state").default("GREETING"), // GREETING | INTENT | COLLECTING | SUMMARY | ESCALATED
  botHandled: boolean("bot_handled").default(false),   // true = bot fully resolved without human
  botEscalated: boolean("bot_escalated").default(false), // true = bot requested human handoff
  requirementData: jsonb("requirement_data"),           // structured JSON collected by bot

  // ── Security & Spam ────────────────────────────────────────────────────────
  spamScore: integer("spam_score").default(0), // 0-100; >70 = suspected, >90 = auto-blocked
  isBanned: boolean("is_banned").default(false),
  violationCount: integer("violation_count").default(0),
  mutedUntil: timestamp("muted_until"),
  tags: text("tags").array(),                  // e.g. ["spam", "bot", "verified", "lead", "urgent"]

  // ── Status & Lifecycle ────────────────────────────────────────────────────
  status: text("status").default("BOT"), // BOT | OPEN | ASSIGNED | CLOSED | SPAM

  // ── Timestamps ────────────────────────────────────────────────────────────
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGES TABLE
// Individual messages within a conversation.
// ─────────────────────────────────────────────────────────────────────────────
export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  senderId: integer("sender_id"),   // null = BOT/system; references usersTable.id for staff
  senderRole: text("sender_role"),  // 'USER' | 'BOT' | 'AGENT' | 'ADMIN' | 'SYSTEM'
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),

  // Rich message metadata (quick replies, file attachments, etc.)
  metadata: jsonb("metadata"),

  createdAt: timestamp("created_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// CHAT AGENTS TABLE
// Maps admin/staff users to departments for chat assignment.
// Only SUPERADMIN can create entries here.
// ─────────────────────────────────────────────────────────────────────────────
export const chatAgentsTable = pgTable("chat_agents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // references usersTable.id
  department: text("department").notNull().default("GENERAL"), // TOURS | HOTELS | TAXI | B2B | B2C | GENERAL | ALL
  isSupervisor: boolean("is_supervisor").default(false), // supervisors see ALL conversations
  isAvailable: boolean("is_available").default(true),
  maxConcurrentChats: integer("max_concurrent_chats").default(5),
  displayName: text("display_name"),  // friendly name shown to clients
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL NOTES TABLE
// Staff-only notes on a conversation (not visible to guest)
// ─────────────────────────────────────────────────────────────────────────────
export const chatNotesTable = pgTable("chat_notes", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  authorId: integer("author_id").notNull(), // references usersTable.id
  authorName: text("author_name"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// SPAM BLOCKLIST TABLE
// Permanently banned sessions/phones/emails
// ─────────────────────────────────────────────────────────────────────────────
export const chatBlocklistTable = pgTable("chat_blocklist", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'SESSION' | 'PHONE' | 'EMAIL' | 'IP'
  value: text("value").notNull(),
  reason: text("reason"),
  blockedBy: integer("blocked_by"), // admin user ID
  createdAt: timestamp("created_at").defaultNow(),
});
