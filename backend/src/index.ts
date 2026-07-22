import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { db, messagesTable, conversationsTable, chatAgentsTable, chatBlocklistTable, chatNotesTable } from "@workspace/db";
import { eq, sql, and, desc } from "drizzle-orm";
import { seedAdmin } from "./lib/seedAdmin";
import { warmCache } from "./lib/cache";
import { getMongoDB, ensureMongoIndexes, closeMongoDB } from "./lib/mongodb";
import { runInitialSync } from "./lib/mongoSync";
import { processBotMessage, getBotSession, createBotSession } from "./lib/chatBot";

/**
 * Safe startup migration: creates travel_guides table if it doesn't exist yet.
 * Uses the backend's already-established DB connection (avoids drizzle-kit push issues).
 * This is idempotent — safe to run on every restart.
 */
async function runStartupMigrations() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS travel_guides (
        id SERIAL PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        entity_type TEXT NOT NULL DEFAULT 'place',
        entity_id INTEGER,
        hero_image_url TEXT,
        hero_video_url TEXT,
        gallery_images TEXT[],
        short_description TEXT,
        full_content TEXT,
        best_time_to_visit TEXT,
        how_to_reach TEXT,
        nearest_airport TEXT,
        nearest_railway TEXT,
        local_language TEXT,
        currency TEXT,
        timezone TEXT,
        highlights TEXT[],
        things_to_do TEXT[],
        top_attractions TEXT[],
        local_cuisine TEXT[],
        activities TEXT[],
        festivals TEXT[],
        famous_for TEXT[],
        packing_list TEXT[],
        travel_tips TEXT[],
        history_and_culture TEXT,
        geography TEXT,
        weather_and_climate TEXT,
        transportation TEXT,
        currency_and_payments TEXT,
        language_and_communication TEXT,
        local_etiquette TEXT,
        health_tips TEXT,
        safety_info TEXT,
        emergency_numbers TEXT,
        shopping TEXT,
        visa_info TEXT,
        faqs JSONB,
        meta_title TEXT,
        meta_description TEXT,
        meta_keywords TEXT,
        canonical_url TEXT,
        og_image_url TEXT,
        is_published BOOLEAN NOT NULL DEFAULT false,
        published_at TIMESTAMP,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS travel_guides_slug_idx ON travel_guides(slug)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS travel_guides_entity_idx ON travel_guides(entity_type, entity_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS travel_guides_published_idx ON travel_guides(is_published)`);
    // Standardize dirty region names from the database
    await db.execute(sql`UPDATE states SET region = 'North India' WHERE region = 'North India (Union Territory)'`);
    await db.execute(sql`UPDATE states SET region = 'Rajasthan, West & Central India' WHERE region = 'West India'`);

    // Add show_in_menu to destinations
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='destinations' AND column_name='show_in_menu') THEN
          ALTER TABLE destinations ADD COLUMN show_in_menu BOOLEAN NOT NULL DEFAULT false;
        END IF;
      END
      $$;
    `);

    // ── Extend packages table with package_code ──
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='packages' AND column_name='package_code') THEN
          ALTER TABLE packages ADD COLUMN package_code TEXT UNIQUE;
        END IF;
      END
      $$;
    `);

    // ── Extend packages table with capacity and group pricing columns ──
    const newPackageCols: [string, string][] = [
      ["min_guests", "INTEGER NOT NULL DEFAULT 2"],
      ["max_guests", "INTEGER NOT NULL DEFAULT 10"],
      ["is_group_pricing", "BOOLEAN NOT NULL DEFAULT false"],
      ["group_base_capacity", "INTEGER NOT NULL DEFAULT 2"],
      ["extra_person_price", "REAL NOT NULL DEFAULT 0"],
      ["extra_child_price", "REAL NOT NULL DEFAULT 0"],
    ];
    for (const [col, def] of newPackageCols) {
      const check = await db.execute(sql`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='packages' AND column_name=${col}
      `);
      if (check.rowCount === 0) {
        await db.execute(sql.raw(`ALTER TABLE packages ADD COLUMN ${col} ${def}`));
      }
    }

    // Backfill package_code for existing packages
    await db.execute(sql`
      UPDATE packages 
      SET package_code = 'SH-' || COALESCE(UPPER(SUBSTRING(category FROM 1 FOR 3)), 'PKG') || '-' || LPAD(id::text, 4, '0') 
      WHERE package_code IS NULL
    `);

    // ── Create package_calendar_inventory table ──
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS package_calendar_inventory (
        id SERIAL PRIMARY KEY,
        package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        rate_type TEXT NOT NULL DEFAULT 'regular',
        price_modifier_type TEXT DEFAULT 'fixed',
        price_modifier_value REAL DEFAULT 0,
        discount_type TEXT DEFAULT 'none',
        discount_value REAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT unq_package_date UNIQUE(package_id, date)
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS package_date_idx ON package_calendar_inventory(package_id, date)`);

    // ── Create package_price_history table ──
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS package_price_history (
        id SERIAL PRIMARY KEY,
        package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        rate_type TEXT NOT NULL,
        price REAL NOT NULL,
        action TEXT NOT NULL,
        changed_by TEXT NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ── Extend bookings table with adults_count, children_count, infants_count ──
    const newBookingCols: [string, string][] = [
      ["adults_count", "INTEGER DEFAULT 2"],
      ["children_count", "INTEGER DEFAULT 0"],
      ["infants_count", "INTEGER DEFAULT 0"],
    ];
    for (const [col, def] of newBookingCols) {
      const check = await db.execute(sql`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='bookings' AND column_name=${col}
      `);
      if (check.rowCount === 0) {
        await db.execute(sql.raw(`ALTER TABLE bookings ADD COLUMN ${col} ${def}`));
      }
    }

    logger.info("✅ Startup migration: travel_guides, packages, and calendar tables ready");
  } catch (err: any) {
    logger.warn({ err: err.message }, "Startup migration warning (non-fatal)");
  }
}

/**
 * Chat System v2 Migrations — idempotent, safe to run every restart.
 * Adds all new columns and tables for the Smart Chat & CRM system.
 */
async function runChatMigrations() {
  try {
    // ── Extend conversations table ─────────────────────────────────────────
    const convCols: [string, string][] = [
      ["assigned_vendor_id",  "INTEGER"],
      ["assigned_department", "TEXT DEFAULT 'UNASSIGNED'"],
      ["category",            "TEXT DEFAULT 'GENERAL'"],
      ["priority",            "TEXT DEFAULT 'NORMAL'"],
      ["bot_state",           "TEXT DEFAULT 'GREETING'"],
      ["bot_handled",         "BOOLEAN DEFAULT false"],
      ["bot_escalated",       "BOOLEAN DEFAULT false"],
      ["requirement_data",    "JSONB"],
      ["spam_score",          "INTEGER DEFAULT 0"],
      ["is_banned",           "BOOLEAN DEFAULT false"],
      ["tags",                "TEXT[]"],
      ["closed_at",           "TIMESTAMP"],
    ];
    for (const [col, def] of convCols) {
      const check = await db.execute(sql`
        SELECT 1 FROM information_schema.columns
        WHERE table_name='conversations' AND column_name=${col}
      `);
      if (check.rowCount === 0) {
        await db.execute(sql.raw(`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ${col} ${def}`));
      }
    }
    // Migrate old status values: "OPEN" stays, anything without bot_escalated set is now BOT
    await db.execute(sql`
      UPDATE conversations
      SET status = 'OPEN'
      WHERE status NOT IN ('BOT', 'OPEN', 'ASSIGNED', 'CLOSED', 'SPAM')
    `);

    // ── Extend messages table ──────────────────────────────────────────────
    const msgCheck = await db.execute(sql`
      SELECT 1 FROM information_schema.columns
      WHERE table_name='messages' AND column_name='metadata'
    `);
    if (msgCheck.rowCount === 0) {
      await db.execute(sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB`);
    }
    // Add BOT to valid senderRole values (text column, no enum)
    // Already fine — just document.

    // ── Create chat_agents table ───────────────────────────────────────────
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS chat_agents (
        id                   SERIAL PRIMARY KEY,
        user_id              INTEGER NOT NULL UNIQUE,
        department           TEXT NOT NULL DEFAULT 'GENERAL',
        is_supervisor        BOOLEAN DEFAULT false,
        is_available         BOOLEAN DEFAULT true,
        max_concurrent_chats INTEGER DEFAULT 5,
        display_name         TEXT,
        created_at           TIMESTAMP DEFAULT NOW(),
        updated_at           TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_chat_agents_user ON chat_agents(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_chat_agents_dept ON chat_agents(department)`);

    // ── Create chat_notes table (internal staff notes) ────────────────────
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS chat_notes (
        id              SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL,
        author_id       INTEGER NOT NULL,
        author_name     TEXT,
        content         TEXT NOT NULL,
        created_at      TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_chat_notes_conv ON chat_notes(conversation_id)`);

    // ── Create chat_blocklist table ───────────────────────────────────────
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS chat_blocklist (
        id         SERIAL PRIMARY KEY,
        type       TEXT NOT NULL,
        value      TEXT NOT NULL UNIQUE,
        reason     TEXT,
        blocked_by INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_chat_blocklist_val ON chat_blocklist(value)`);

    // ── Performance indexes for support dashboard queries ─────────────────
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_conv_status ON conversations(status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_conv_dept ON conversations(assigned_department)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_conv_staff ON conversations(assigned_staff_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_conv_category ON conversations(category)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_conv_spam ON conversations(spam_score)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_conv_last_msg ON conversations(last_message_at DESC)`);

    logger.info("✅ Chat System v2 migrations complete");
  } catch (err: any) {
    logger.warn({ err: err.message }, "Chat migration warning (non-fatal)");
  }
}

/**
 * OTA Hotel System Migrations — idempotent, safe to run on every restart.
 * Adds new columns to hotels/hotel_rooms and creates all new OTA hotel tables.
 */
async function runHotelMigrations() {
  try {
    // ── Extend hotels table with OTA columns ─────────────────────────────────
    const hotelCols: [string, string][] = [
      ["city", "TEXT"],
      ["pincode", "TEXT"],
      ["phone", "TEXT"],
      ["email", "TEXT"],
      ["website", "TEXT"],
      ["total_rooms", "INTEGER DEFAULT 0"],
      ["min_price", "REAL DEFAULT 0"],
      ["booking_type", "TEXT DEFAULT 'INSTANT'"],
      ["check_in_time", "TEXT DEFAULT '14:00'"],
      ["check_out_time", "TEXT DEFAULT '12:00'"],
      ["breakfast_included", "BOOLEAN DEFAULT false"],
      ["vendor_commission_pct", "REAL DEFAULT 15.0"],
      ["meta_title", "TEXT"],
      ["meta_description", "TEXT"],
    ];
    for (const [col, def] of hotelCols) {
      const check = await db.execute(sql`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='hotels' AND column_name=${col}
      `);
      if (check.rowCount === 0) {
        await db.execute(sql.raw(`ALTER TABLE hotels ADD COLUMN ${col} ${def}`));
      }
    }

    // ── Extend hotel_rooms table ──────────────────────────────────────────────
    const roomCols: [string, string][] = [
      ["description", "TEXT"],
      ["bed_type", "TEXT DEFAULT 'DOUBLE'"],
      ["max_adults", "INTEGER DEFAULT 2"],
      ["max_children", "INTEGER DEFAULT 1"],
      ["size_sqft", "INTEGER"],
      ["floor_number", "INTEGER"],
      ["extra_adult_price", "REAL DEFAULT 0"],
      ["extra_child_price", "REAL DEFAULT 0"],
      ["tax_included", "BOOLEAN DEFAULT false"],
      ["meal_plan", "TEXT DEFAULT 'EP'"],
      ["refundable", "BOOLEAN DEFAULT true"],
      ["cancellation_hours", "INTEGER DEFAULT 24"],
      ["is_active", "BOOLEAN DEFAULT true"],
      ["discount_type", "TEXT DEFAULT 'PERCENT'"],
      ["discount_percent", "INTEGER DEFAULT 0"],
      ["discount_flat", "INTEGER DEFAULT 0"],
    ];
    for (const [col, def] of roomCols) {
      const check = await db.execute(sql`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='hotel_rooms' AND column_name=${col}
      `);
      if (check.rowCount === 0) {
        await db.execute(sql.raw(`ALTER TABLE hotel_rooms ADD COLUMN ${col} ${def}`));
      }
    }

    // ── Create hotel_room_inventory table ─────────────────────────────────────
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS hotel_room_inventory (
        id SERIAL PRIMARY KEY,
        room_id INTEGER NOT NULL,
        hotel_id INTEGER NOT NULL,
        date DATE NOT NULL,
        available_count INTEGER NOT NULL DEFAULT 0,
        price_override REAL,
        is_blocked BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(room_id, date)
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hotel_inv_room_date ON hotel_room_inventory(room_id, date)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hotel_inv_hotel_date ON hotel_room_inventory(hotel_id, date)`);

    // Add discount columns to hotel_room_inventory if they don't exist
    const invCols: [string, string][] = [
      ["discount_type", "TEXT DEFAULT 'PERCENT'"],
      ["discount_percent", "INTEGER DEFAULT 0"],
      ["discount_flat", "INTEGER DEFAULT 0"],
    ];
    for (const [col, def] of invCols) {
      const check = await db.execute(sql`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='hotel_room_inventory' AND column_name=${col}
      `);
      if (check.rowCount === 0) {
        await db.execute(sql.raw(`ALTER TABLE hotel_room_inventory ADD COLUMN ${col} ${def}`));
      }
    }

    // ── Create hotel_policies table ───────────────────────────────────────────
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS hotel_policies (
        id SERIAL PRIMARY KEY,
        hotel_id INTEGER NOT NULL UNIQUE,
        check_in_time TEXT DEFAULT '14:00',
        check_out_time TEXT DEFAULT '12:00',
        early_check_in TEXT,
        late_check_out TEXT,
        cancellation_policy TEXT DEFAULT 'FREE',
        cancellation_deadline_hours INTEGER DEFAULT 24,
        cancellation_penalty_pct REAL DEFAULT 0,
        cancellation_details TEXT,
        children_allowed BOOLEAN DEFAULT true,
        child_age_limit INTEGER DEFAULT 12,
        extra_bed_available BOOLEAN DEFAULT false,
        extra_bed_price REAL DEFAULT 0,
        pets_allowed BOOLEAN DEFAULT false,
        smoking_allowed BOOLEAN DEFAULT false,
        unmarried_couples_allowed BOOLEAN DEFAULT true,
        alcohol_allowed BOOLEAN DEFAULT true,
        payment_methods TEXT[],
        pay_at_hotel_allowed BOOLEAN DEFAULT true,
        house_rules TEXT,
        important_info TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ── Create hotel_reviews table ────────────────────────────────────────────
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS hotel_reviews (
        id SERIAL PRIMARY KEY,
        hotel_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        booking_id INTEGER,
        rating REAL NOT NULL,
        cleanliness_rating REAL,
        comfort_rating REAL,
        location_rating REAL,
        facilities_rating REAL,
        service_rating REAL,
        value_rating REAL,
        title TEXT,
        body TEXT,
        travel_type TEXT,
        stay_date DATE,
        photos TEXT[],
        is_verified BOOLEAN DEFAULT false,
        is_published BOOLEAN DEFAULT true,
        vendor_reply TEXT,
        vendor_replied_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hotel_reviews_hotel ON hotel_reviews(hotel_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hotel_reviews_published ON hotel_reviews(is_published)`);

    // ── Create hotel_photos table ─────────────────────────────────────────────
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS hotel_photos (
        id SERIAL PRIMARY KEY,
        hotel_id INTEGER NOT NULL,
        room_id INTEGER,
        url TEXT NOT NULL,
        caption TEXT,
        category TEXT DEFAULT 'EXTERIOR',
        is_primary BOOLEAN DEFAULT false,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hotel_photos_hotel ON hotel_photos(hotel_id)`);

    // ⚡ Performance indexes for hotel search queries
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hotels_status ON hotels(status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hotels_status_featured ON hotels(status, is_featured, display_order)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hotels_city ON hotels(city)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hotels_type ON hotels(type)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hotels_star_rating ON hotels(star_rating)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hotels_min_price ON hotels(min_price)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hotels_destination ON hotels(destination_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hotels_owner ON hotels(owner_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hotel_reviews_rating ON hotel_reviews(hotel_id, is_published)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_bookings_user_hotel ON bookings(user_id, booking_type)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hotel_rooms_hotel ON hotel_rooms(hotel_id, is_active)`);

    logger.info("✅ Hotel OTA migrations complete: inventory, policies, reviews, photos tables ready");

  } catch (err: any) {
    logger.warn({ err: err.message }, "Hotel migration warning (non-fatal)");
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = createServer(app);

// ─── Socket.io: Secure CORS (never wildcard in production) ───────────────────
const ALLOWED_WS_ORIGINS = (
  process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim()).filter(Boolean)
    : []
).concat([
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://localhost:5175",
  "https://sampooran-admin.pages.dev",
  "https://sampooranholidays.com",
  "https://www.sampooranholidays.com",
  "https://sampooran-holidays-webapp-frontend.vercel.app",
]);

const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, cb) => {
      if (!origin || ALLOWED_WS_ORIGINS.includes(origin) || process.env.NODE_ENV !== "production") {
        return cb(null, true);
      }
      logger.warn({ origin }, "Socket.io CORS rejected");
      cb(new Error("WS CORS rejected"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Performance: allow both transports, prefer websocket
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ─── Per-session message rate limiter (in-memory) ────────────────────────────
// For horizontal scale: replace with Redis sorted set ZADD/ZCOUNT pattern
const sessionMsgTimestamps = new Map<string, number[]>();
function checkRateLimit(key: string, maxPerMinute = 30): boolean {
  const now = Date.now();
  const timestamps = (sessionMsgTimestamps.get(key) || []).filter(t => now - t < 60_000);
  timestamps.push(now);
  sessionMsgTimestamps.set(key, timestamps);
  return timestamps.length <= maxPerMinute;
}
// Cleanup stale rate limit entries every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - 65_000;
  for (const [k, ts] of sessionMsgTimestamps.entries()) {
    if (ts.every(t => t < cutoff)) sessionMsgTimestamps.delete(k);
  }
}, 5 * 60 * 1000);

// ─── Socket.io Connection Handler ────────────────────────────────────────────
io.on("connection", async (socket) => {
  logger.info({ socketId: socket.id }, "New WS client connected");

  const userId    = socket.handshake.query.userId as string;
  const sessionId = socket.handshake.query.sessionId as string;
  const agentId   = socket.handshake.query.agentId as string; // staff/agent login

  // ── Guest room ────────────────────────────────────────────────────────────
  if (sessionId) socket.join(`session:${sessionId}`);

  // ── Logged-in user room ───────────────────────────────────────────────────
  if (userId) socket.join(`user:${userId}`);

  // ── Staff / Admin join: supervisor OR department-specific room ────────────
  socket.on("admin:join", async (data?: { agentId?: number }) => {
    try {
      const staffId = data?.agentId || (userId ? Number(userId) : null);
      if (!staffId) {
        // Unauthenticated — join generic supervisors room (backward compat)
        socket.join("supervisors");
        // Legacy support
        socket.join("admins");
        return;
      }

      // Look up this agent's department assignment
      const [agentRecord] = await db
        .select()
        .from(chatAgentsTable)
        .where(eq(chatAgentsTable.userId, staffId))
        .limit(1);

      if (!agentRecord || agentRecord.isSupervisor) {
        // Supervisor: joins supervisor room (sees ALL conversations)
        socket.join("supervisors");
        socket.join("admins"); // legacy
        logger.info({ staffId }, "Supervisor joined chat");
      } else {
        // Department agent: joins their department room AND personal room
        socket.join(`dept:${agentRecord.department}`);
        socket.join(`agent:${staffId}`);
        logger.info({ staffId, dept: agentRecord.department }, "Agent joined dept room");
      }
    } catch (err) {
      // Fallback for unauthenticated or error cases
      socket.join("supervisors");
      socket.join("admins");
    }
  });

  // ── Guest typing → supervisors + assigned agent ───────────────────────────
  socket.on("chat:typing", (data: { sessionId?: string; userId?: string; isTyping: boolean }) => {
    io.to("supervisors").emit("chat:typing", data);
    // Also notify the assigned agent if known
    if (data.sessionId) {
      // Supervisor will be notified — agent is notified when conversation is open
      io.to("admins").emit("chat:typing", data);
    }
  });

  // ── Guest Heartbeat ───────────────────────────────────────────────────────
  socket.on("chat:heartbeat", async (data: { sessionId?: string }) => {
    if (data.sessionId) {
      await db.update(conversationsTable)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversationsTable.guestSessionId, data.sessionId));
    }
  });

  // ── Staff typing → guest ──────────────────────────────────────────────────
  socket.on("admin:typing", (data: {
    conversationId: number;
    targetSessionId?: string;
    targetUserId?: string;
    isTyping: boolean;
  }) => {
    if (data.targetUserId)    io.to(`user:${data.targetUserId}`).emit("chat:typing_admin", data);
    if (data.targetSessionId) io.to(`session:${data.targetSessionId}`).emit("chat:typing_admin", data);
  });

  // ── Main message handler ──────────────────────────────────────────────────
  socket.on("chat:message", async (msg) => {
    try {
      const rateKey = msg.sessionId || msg.userId || socket.id;

      // ── 1. Rate limiting ───────────────────────────────────────────────────
      if (!checkRateLimit(rateKey, 30)) {
        socket.emit("chat:error", {
          code: "RATE_LIMITED",
          message: "You are sending messages too quickly. Please wait a moment.",
        });
        return;
      }

      const resolvedUserId = msg.userId ? Number(msg.userId) : null;
      const isAdmin = ["ADMIN", "SUPERADMIN", "AGENT"].includes(msg.role);

      // ── 2. Find or create conversation ────────────────────────────────────
      let [conversation] = resolvedUserId && !msg.sessionId
        ? await db.select().from(conversationsTable).where(eq(conversationsTable.userId, resolvedUserId)).limit(1)
        : await db.select().from(conversationsTable).where(eq(conversationsTable.guestSessionId, msg.sessionId || "")).limit(1);

      const isNew = !conversation;

      if (!conversation) {
        [conversation] = await db.insert(conversationsTable).values({
          userId: resolvedUserId || 0,
          guestSessionId: msg.sessionId || null,
          guestName:  msg.guestName  || null,
          guestPhone: msg.guestPhone || null,
          guestEmail: msg.guestEmail || null,
          status: "BOT",
          botState: "GREETING",
        }).returning();
      }

      // ── 3. Spam / blocklist check for guest messages ───────────────────────
      if (!isAdmin && msg.sessionId) {
        const [blockEntry] = await db
          .select()
          .from(chatBlocklistTable)
          .where(eq(chatBlocklistTable.value, msg.sessionId))
          .limit(1);
        if (blockEntry) {
          socket.emit("chat:error", { code: "BLOCKED", message: "Your session has been blocked. Contact support@sampooranholidays.com" });
          return;
        }
        // Also check phone/email
        if (msg.guestPhone) {
          const [phoneBan] = await db.select().from(chatBlocklistTable)
            .where(eq(chatBlocklistTable.value, msg.guestPhone)).limit(1);
          if (phoneBan) {
            socket.emit("chat:error", { code: "BLOCKED", message: "Access restricted." });
            return;
          }
        }
      }

      // ── 4. Save user/admin message ─────────────────────────────────────────
      const [savedUserMsg] = await db.insert(messagesTable).values({
        conversationId: conversation.id,
        senderId: resolvedUserId,
        senderRole: isAdmin ? (msg.role || "ADMIN") : "USER",
        content: msg.text || "",
      }).returning();

      const userPayload = {
        ...savedUserMsg,
        text: savedUserMsg.content,
        conversationId: conversation.id,
        guestName: conversation.guestName,
        sessionId: msg.sessionId,
        isBot: false,
      };

      // ── 5. Admin/agent reply — broadcast and return ────────────────────────
      if (isAdmin) {
        if (msg.sessionId) io.to(`session:${msg.sessionId}`).emit("chat:message", userPayload);
        if (resolvedUserId && msg.userId) io.to(`user:${msg.userId}`).emit("chat:message", userPayload);
        io.to("supervisors").emit("chat:message", userPayload);
        io.to("admins").emit("chat:message", userPayload);
        // Notify assigned agent
        if (conversation.assignedStaffId) {
          io.to(`agent:${conversation.assignedStaffId}`).emit("chat:message", userPayload);
        }
        await db.update(conversationsTable)
          .set({ lastMessageAt: new Date() })
          .where(eq(conversationsTable.id, conversation.id));
        return;
      }

      // Echo user message immediately back to client so user message appears right away!
      if (msg.sessionId) io.to(`session:${msg.sessionId}`).emit("chat:message", userPayload);

      // ── 6. Bot processing for guest messages ──────────────────────────────
      if (!conversation.botEscalated) {
        const botResult = await processBotMessage(
          msg.sessionId || String(conversation.id),
          msg.text || "",
          msg.guestName || conversation.guestName || "Guest"
        );

        // Update conversation with bot's assessment
        const updateData: Record<string, any> = {
          lastMessageAt: new Date(),
          spamScore: botResult.spamScore,
          category: botResult.category || conversation.category,
          botState: botResult.newState,
        };

        if (botResult.mutedUntil) {
          updateData.mutedUntil = new Date(botResult.mutedUntil);
        }

        if (botResult.urgency === "URGENT") {
          updateData.priority = "URGENT";
        }

        if (botResult.shouldBlock) {
          updateData.status = "SPAM";
          updateData.isBanned = true;
          // Add to blocklist
          await db.insert(chatBlocklistTable).values({
            type: "SESSION",
            value: msg.sessionId || "",
            reason: `Auto-blocked: severe policy violation / spam score ${botResult.spamScore}`,
          }).onConflictDoNothing();
        } else if (botResult.shouldEscalate) {
          updateData.botEscalated = true;
          updateData.status = "OPEN";
          updateData.requirementData = botResult.requirementData;
          updateData.category = botResult.category;
          updateData.assignedDepartment = "UNASSIGNED";
        }

        await db.update(conversationsTable)
          .set(updateData)
          .where(eq(conversationsTable.id, conversation.id));

        // If policy muted, emit mute error event to client right away
        if (botResult.isMuted && msg.sessionId) {
          io.to(`session:${msg.sessionId}`).emit("chat:error", {
            code: "MUTED",
            message: botResult.message,
            mutedUntil: botResult.mutedUntil,
          });
        }

        // Natural typing delay & bot reply
        if (botResult.message && !botResult.shouldBlock) {
          // Emit typing indicator to guest session
          if (msg.sessionId) {
            io.to(`session:${msg.sessionId}`).emit("chat:typing_bot", { isTyping: true });
          }

          // Delay for natural feel
          const delayMs = botResult.typingDelayMs || 1500;
          await new Promise((res) => setTimeout(res, delayMs));

          if (msg.sessionId) {
            io.to(`session:${msg.sessionId}`).emit("chat:typing_bot", { isTyping: false });
          }

          const metaObj: Record<string, any> = {};
          if (botResult.quickReplies) metaObj.quickReplies = botResult.quickReplies;
          if (botResult.recommendations) metaObj.recommendations = botResult.recommendations;

          const [botMsg] = await db.insert(messagesTable).values({
            conversationId: conversation.id,
            senderId: null,
            senderRole: "BOT",
            content: botResult.message,
            metadata: Object.keys(metaObj).length > 0 ? JSON.stringify(metaObj) : null,
          }).returning();

          const botPayload = {
            ...botMsg,
            text: botMsg.content,
            conversationId: conversation.id,
            isBot: true,
            quickReplies: botResult.quickReplies,
            recommendations: botResult.recommendations,
          };

          if (msg.sessionId) io.to(`session:${msg.sessionId}`).emit("chat:message", botPayload);
        }

        // Notify supervisors when bot escalates to human
        if (botResult.shouldEscalate) {
          const freshConv = { ...conversation, ...updateData };
          io.to("supervisors").emit("chat:new_conversation", {
            ...freshConv,
            lastMessage: msg.text,
            requirementData: botResult.requirementData,
            category: botResult.category,
            status: "OPEN",
          });
          io.to("admins").emit("chat:new_conversation", {
            ...freshConv,
            lastMessage: msg.text,
          });
          logger.info({ convId: conversation.id, category: botResult.category }, "Bot escalated to human");
        }
      } else {
        // Already escalated — conversation is with human agent
        io.to("supervisors").emit("chat:message", userPayload);
        io.to("admins").emit("chat:message", userPayload);
        if (conversation.assignedStaffId) {
          io.to(`agent:${conversation.assignedStaffId}`).emit("chat:message", userPayload);
        }
        if (conversation.assignedVendorId) {
          io.to(`vendor:${conversation.assignedVendorId}`).emit("chat:message", userPayload);
        }
        await db.update(conversationsTable)
          .set({ lastMessageAt: new Date() })
          .where(eq(conversationsTable.id, conversation.id));
      }

      // ── 7. Notify admins of a brand new conversation ──────────────────────
      if (isNew && !conversation.botEscalated) {
        // New conversation — only log, bot will handle first
        logger.info({ convId: conversation.id }, "New chat conversation started — bot handling");
      }

    } catch (error) {
      logger.error({ error }, "Error processing chat message");
      socket.emit("chat:error", { code: "SERVER_ERROR", message: "Something went wrong. Please try again." });
    }
  });

  // ── Supervisor assigns conversation to agent/vendor ────────────────────────
  socket.on("chat:assign", async (data: {
    conversationId: number;
    staffId?: number;
    vendorId?: number;
    department?: string;
  }) => {
    try {
      const updateData: Record<string, any> = {
        status: "ASSIGNED",
        assignedDepartment: data.department || "GENERAL",
      };
      if (data.staffId)  updateData.assignedStaffId  = data.staffId;
      if (data.vendorId) updateData.assignedVendorId = data.vendorId;

      const [updated] = await db
        .update(conversationsTable)
        .set(updateData)
        .where(eq(conversationsTable.id, data.conversationId))
        .returning();

      // Notify the assigned agent/vendor
      if (data.staffId) {
        io.to(`agent:${data.staffId}`).emit("chat:assigned", updated);
      }
      if (data.vendorId) {
        io.to(`vendor:${data.vendorId}`).emit("chat:assigned", updated);
      }

      // Notify all supervisors of the assignment change
      io.to("supervisors").emit("chat:conversation_updated", updated);
      io.to("admins").emit("chat:conversation_updated", updated);

    } catch (err) {
      logger.error({ err }, "Error assigning conversation");
    }
  });

  socket.on("disconnect", () => {
    logger.info({ socketId: socket.id }, "Client disconnected");
  });
});

/**
 * OTA Transport System Migrations — idempotent, safe on every restart.
 * Creates all transport tables if they don't exist.
 */
async function runTransportMigrations() {
  try {
    // ── Transport Vendors (KYC + Business Profile) ─────────────────────────
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS transport_vendors (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        business_name TEXT NOT NULL,
        business_type TEXT NOT NULL DEFAULT 'PROPRIETORSHIP',
        phone TEXT NOT NULL,
        alternate_phone TEXT,
        email TEXT NOT NULL,
        website TEXT,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        pincode TEXT NOT NULL,
        gst_number TEXT,
        pan_number TEXT,
        gst_certificate_url TEXT,
        pan_card_url TEXT,
        business_registration_url TEXT,
        address_proof_url TEXT,
        operating_since INTEGER,
        operating_cities TEXT[],
        vehicle_types TEXT[],
        bank_account_name TEXT,
        bank_account_number TEXT,
        bank_ifsc_code TEXT,
        bank_name TEXT,
        logo_url TEXT,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING',
        admin_note TEXT,
        approved_at TIMESTAMP,
        commission_pct REAL DEFAULT 15.0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ── Transport Vehicles (core listing entity with SEO geo slugs) ─────────
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS transport_vehicles (
        id SERIAL PRIMARY KEY,
        vendor_id INTEGER NOT NULL,
        owner_id INTEGER NOT NULL,
        destination_id INTEGER,
        state_id INTEGER,
        country_id INTEGER,
        destination_slug TEXT,
        state_slug TEXT,
        country_slug TEXT,
        custom_city TEXT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        sub_type TEXT,
        description TEXT,
        make TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER,
        color TEXT,
        registration_number TEXT,
        seating_capacity INTEGER NOT NULL,
        luggage_capacity INTEGER,
        fuel_type TEXT DEFAULT 'DIESEL',
        transmission TEXT DEFAULT 'MANUAL',
        is_ac BOOLEAN DEFAULT true,
        features TEXT[],
        documents JSONB DEFAULT '{}',
        condition_report JSONB DEFAULT '{}',
        last_inspection_date TIMESTAMP,
        images TEXT[],
        booking_type TEXT NOT NULL DEFAULT 'INSTANT',
        base_price_per_km REAL,
        base_price_per_day REAL,
        minimum_km INTEGER DEFAULT 0,
        waiting_charge_per_hour REAL,
        driver_allowance_per_day REAL,
        night_charge_percent REAL DEFAULT 0,
        min_price REAL DEFAULT 0,
        advance_booking_hours INTEGER DEFAULT 24,
        max_passengers INTEGER DEFAULT 4,
        status TEXT NOT NULL DEFAULT 'PENDING',
        is_featured BOOLEAN DEFAULT false,
        display_order INTEGER NOT NULL DEFAULT 0,
        admin_note TEXT,
        meta_title TEXT,
        meta_description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_tv_owner ON transport_vehicles(owner_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_tv_vendor ON transport_vehicles(vendor_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_tv_geo ON transport_vehicles(country_slug, state_slug, destination_slug)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_tv_status ON transport_vehicles(status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_tv_type ON transport_vehicles(type)`);

    // ── Transport Drivers ──────────────────────────────────────────────────
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS transport_drivers (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER NOT NULL,
        vendor_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        alternate_phone TEXT,
        photo_url TEXT,
        license_number TEXT NOT NULL,
        license_expiry TEXT,
        license_url TEXT,
        experience_years INTEGER,
        languages_known TEXT[],
        is_available BOOLEAN DEFAULT true,
        is_verified BOOLEAN DEFAULT false,
        rating REAL DEFAULT 0,
        total_trips INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ── Transport Availability (date-range blocks) ─────────────────────────
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS transport_availability (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER NOT NULL,
        vendor_id INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'BLOCKED',
        reason TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_ta_vehicle_date ON transport_availability(vehicle_id, start_date, end_date)`);

    // ── Transport Pricing Rules ────────────────────────────────────────────
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS transport_pricing_rules (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER NOT NULL,
        vendor_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        rule_type TEXT NOT NULL,
        from_city TEXT,
        to_city TEXT,
        estimated_distance_km INTEGER,
        start_date TEXT,
        end_date TEXT,
        price REAL NOT NULL,
        price_type TEXT NOT NULL DEFAULT 'FIXED',
        is_round_trip BOOLEAN DEFAULT false,
        round_trip_price REAL,
        includes TEXT[],
        excludes TEXT[],
        is_active BOOLEAN DEFAULT true,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ── Transport Bookings ─────────────────────────────────────────────────
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS transport_bookings (
        id SERIAL PRIMARY KEY,
        booking_ref TEXT NOT NULL UNIQUE,
        user_id INTEGER NOT NULL,
        vehicle_id INTEGER NOT NULL,
        vendor_id INTEGER NOT NULL,
        driver_id INTEGER,
        journey_type TEXT NOT NULL DEFAULT 'ONE_WAY',
        pickup_date TEXT NOT NULL,
        pickup_time TEXT NOT NULL,
        return_date TEXT,
        return_time TEXT,
        pickup_address TEXT NOT NULL,
        drop_address TEXT NOT NULL,
        pickup_lat REAL,
        pickup_lng REAL,
        drop_lat REAL,
        drop_lng REAL,
        estimated_distance_km INTEGER,
        estimated_duration TEXT,
        adults INTEGER NOT NULL DEFAULT 1,
        children INTEGER DEFAULT 0,
        luggage INTEGER DEFAULT 0,
        base_amount REAL NOT NULL,
        extra_charges JSONB DEFAULT '{}',
        discount_amount REAL DEFAULT 0,
        total_amount REAL NOT NULL,
        platform_fee REAL DEFAULT 0,
        vendor_earning REAL DEFAULT 0,
        payment_status TEXT DEFAULT 'PENDING',
        payment_details JSONB,
        status TEXT NOT NULL DEFAULT 'PENDING',
        special_requests TEXT,
        flight_number TEXT,
        vendor_note TEXT,
        cancelled_reason TEXT,
        rating_given BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_tb_user ON transport_bookings(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_tb_vendor ON transport_bookings(vendor_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_tb_vehicle ON transport_bookings(vehicle_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_tb_status ON transport_bookings(status)`);

    // ── Transport Reviews ──────────────────────────────────────────────────
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS transport_reviews (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER NOT NULL,
        vendor_id INTEGER NOT NULL,
        booking_id INTEGER,
        user_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        title TEXT,
        comment TEXT,
        driver_rating INTEGER,
        cleanliness_rating INTEGER,
        punctuality_rating INTEGER,
        value_rating INTEGER,
        is_verified BOOLEAN DEFAULT false,
        admin_approved BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ── Extend transport_routes table with new fields ──────────────────────
    const routeCols: [string, string][] = [
      ["from_slug", "TEXT"],
      ["to_slug", "TEXT"],
      ["description", "TEXT"],
      ["highlights", "TEXT[]"],
      ["image_url", "TEXT"],
      ["display_order", "INTEGER DEFAULT 0"],
    ];
    for (const [col, def] of routeCols) {
      const check = await db.execute(sql`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='transport_routes' AND column_name=${col}
      `);
      if (check.rowCount === 0) {
        await db.execute(sql.raw(`ALTER TABLE transport_routes ADD COLUMN IF NOT EXISTS ${col} ${def}`));
      }
    }

    // ── Extend destination tables with Transport Menu settings ────────────────
    const destTables = ["countries", "states", "destinations"];
    for (const table of destTables) {
      // show_in_transport_menu
      const checkBool = await db.execute(sql.raw(`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='${table}' AND column_name='show_in_transport_menu'
      `));
      if (checkBool.rowCount === 0) {
        await db.execute(sql.raw(`ALTER TABLE ${table} ADD COLUMN show_in_transport_menu BOOLEAN NOT NULL DEFAULT false`));
      }

      // transport_menu_order
      const checkOrder = await db.execute(sql.raw(`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='${table}' AND column_name='transport_menu_order'
      `));
      if (checkOrder.rowCount === 0) {
        await db.execute(sql.raw(`ALTER TABLE ${table} ADD COLUMN transport_menu_order INTEGER NOT NULL DEFAULT 0`));
      }
    }

    logger.info("✅ Transport migration: all transport tables and destination settings ready");
  } catch (err: any) {
    logger.warn({ err: err.message }, "Transport migration warning (non-fatal)");
  }
}

function startRateExpiryCheckScheduler() {
  const checkRateExpirations = async () => {
    try {
      logger.info("Checking package calendar rate expirations...");
      const { packagesTable, packageCalendarInventoryTable } = await import("@workspace/db");
      
      const today = new Date();
      // Look ahead 30 days
      const lookaheadDate = new Date();
      lookaheadDate.setDate(today.getDate() + 30);
      
      const todayStr = today.toISOString().split("T")[0];
      const lookaheadStr = lookaheadDate.toISOString().split("T")[0];

      // Query packages
      const packages = await db.select().from(packagesTable);

      for (const pkg of packages) {
        const pricedRows = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(packageCalendarInventoryTable)
          .where(
            and(
              eq(packageCalendarInventoryTable.packageId, pkg.id),
              sql`${packageCalendarInventoryTable.date} >= ${todayStr}`,
              sql`${packageCalendarInventoryTable.date} <= ${lookaheadStr}`
            )
          );

        const pricedCount = pricedRows[0]?.count ?? 0;
        
        if (pricedCount < 10) {
          logger.warn(
            { packageId: pkg.id, name: pkg.name, pricedCount },
            `⚠️ Alert: Package "${pkg.name}" (${pkg.packageCode || "NO CODE"}) has upcoming unpriced dates (${30 - pricedCount} days missing in next 30 days). Please configure rates.`
          );
        }
      }
    } catch (err: any) {
      logger.error({ err: err.message }, "Error during rate expiry check");
    }
  };

  // Run 15 seconds after startup
  setTimeout(checkRateExpirations, 15_000);
  // Run every 24 hours
  setInterval(checkRateExpirations, 24 * 60 * 60 * 1000);
}

server.listen(port, () => {
  logger.info({ port }, "Server listening (HTTP & WebSocket) on all interfaces");
  if (process.env.NODE_ENV !== "production" || process.env.FORCE_SEED_ADMIN === "true") {
    seedAdmin();
  }
  // Create any new tables that don't exist yet (idempotent).
  runStartupMigrations();
  // OTA Hotel system — create new tables and extend existing ones (idempotent).
  runHotelMigrations();
  // OTA Transport system — create transport tables (idempotent).
  runTransportMigrations();
  // Chat System v2 — create chat agents, notes, blocklist tables + new columns.
  runChatMigrations();
  // Start the daily pricing calendar alert scheduler
  startRateExpiryCheckScheduler();
  // ⚡ Pre-warm Redis cache for the top public routes after startup
  // Runs async in background — never blocks server from accepting requests
  const baseUrl = `http://127.0.0.1:${port}`;
  setTimeout(() => warmCache(baseUrl), 3000); // 3s delay to let DB warm up first

  // ⚡ MongoDB: connect, ensure indexes, run initial sync
  // All async — never blocks server startup
  setTimeout(async () => {
    try {
      await getMongoDB(); // Establish connection pool
      await ensureMongoIndexes(); // Create indexes (idempotent)
      await runInitialSync(); // Bulk sync PG → Mongo if collections are empty
    } catch (err) {
      logger.error({ err }, "MongoDB startup sequence failed — server continues without MongoDB");
    }
  }, 5000); // 5s delay: let PG warm up before reading from it
});

// ── Graceful Shutdown ──────────────────────────────────────────────────────────────────────────────
async function gracefulShutdown(signal: string) {
  logger.info({ signal }, "Received shutdown signal, closing connections...");
  server.close(async () => {
    await closeMongoDB();
    logger.info("All connections closed. Process exiting.");
    process.exit(0);
  });
  // Force exit after 10s if graceful shutdown hangs
  setTimeout(() => process.exit(1), 10_000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
