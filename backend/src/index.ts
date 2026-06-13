import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { db, messagesTable, conversationsTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";
import { seedAdmin } from "./lib/seedAdmin";

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

    logger.info("✅ Startup migration: travel_guides table ready");
  } catch (err: any) {
    // Table already exists or non-critical — log but don't crash server
    logger.warn({ err: err.message }, "Startup migration warning (non-fatal)");
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

// Initialize Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: "*", // Restrict this in production
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  logger.info({ socketId: socket.id }, "New client connected to Live Chat");

  const userId = socket.handshake.query.userId as string;
  const sessionId = socket.handshake.query.sessionId as string; // guest identifier

  // Join rooms: named user room (if logged in) OR session room (guest)
  if (userId) {
    socket.join(`user:${userId}`);
  }
  if (sessionId) {
    socket.join(`session:${sessionId}`);
  }

  // Admin joins the shared admin room
  socket.on("admin:join", () => {
    socket.join("admins");
    logger.info({ socketId: socket.id }, "Admin joined support room");
  });

  // Typing indicator — relay to admin room
  socket.on("chat:typing", (data: { sessionId?: string; userId?: string; isTyping: boolean }) => {
    io.to("admins").emit("chat:typing", data);
  });

  // Admin typing indicator — relay to user/session room
  socket.on("admin:typing", (data: { conversationId: number; targetSessionId?: string; targetUserId?: string; isTyping: boolean }) => {
    if (data.targetUserId) io.to(`user:${data.targetUserId}`).emit("chat:typing_admin", data);
    if (data.targetSessionId) io.to(`session:${data.targetSessionId}`).emit("chat:typing_admin", data);
  });

  socket.on("chat:message", async (msg) => {
    try {
      const guestId = msg.sessionId ? `guest_${msg.sessionId}` : null;
      const resolvedUserId = msg.userId ? Number(msg.userId) : null;

      // 1. Find or create conversation by userId OR sessionId stored in metadata
      let [conversation] = resolvedUserId
        ? await db.select().from(conversationsTable).where(eq(conversationsTable.userId, resolvedUserId)).limit(1)
        : await db.select().from(conversationsTable).where(eq(conversationsTable.guestSessionId, msg.sessionId)).limit(1);

      const isNew = !conversation;
      if (!conversation) {
        [conversation] = await db.insert(conversationsTable).values({
          userId: resolvedUserId || 0,
          guestSessionId: msg.sessionId || null,
          guestName: msg.guestName || null,
          guestPhone: msg.guestPhone || null,
          guestEmail: msg.guestEmail || null,
          status: "OPEN",
        }).returning();
      }

      // 2. Save message
      const [newMsg] = await db.insert(messagesTable).values({
        conversationId: conversation.id,
        senderId: resolvedUserId,
        senderRole: msg.role || "USER",
        content: msg.text,
      }).returning();

      // 3. Update lastMessageAt
      await db.update(conversationsTable)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversationsTable.id, conversation.id));

      const payload = {
        ...newMsg,
        text: newMsg.content,
        conversationId: conversation.id,
        guestName: conversation.guestName,
        sessionId: msg.sessionId,
      };

      // 4. Broadcast to user room, session room, and all admins
      if (resolvedUserId) io.to(`user:${resolvedUserId}`).emit("chat:message", payload);
      if (msg.sessionId) io.to(`session:${msg.sessionId}`).emit("chat:message", payload);
      io.to("admins").emit("chat:message", payload);

      // 5. Notify admins of a new conversation
      if (isNew) {
        io.to("admins").emit("chat:new_conversation", {
          ...conversation,
          lastMessage: msg.text,
        });
      }
    } catch (error) {
      logger.error({ error }, "Error processing chat message");
    }
  });

  socket.on("disconnect", () => {
    logger.info({ socketId: socket.id }, "Client disconnected");
  });
});

server.listen(port, () => {
  logger.info({ port }, "Server listening (HTTP & WebSocket) on all interfaces");
  if (process.env.NODE_ENV !== "production" || process.env.FORCE_SEED_ADMIN === "true") {
    seedAdmin();
  }
  // Create any new tables that don't exist yet (idempotent).
  runStartupMigrations();
  // OTA Hotel system — create new tables and extend existing ones (idempotent).
  runHotelMigrations();
});
