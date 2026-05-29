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
  // Bootstrap: only creates the SUPERADMIN account if it doesn't exist yet.
  // This is a safe, idempotent check — it never overwrites existing data.
  // To seed home config (themes, sections) for the first time, run:
  //   npx tsx backend/src/scripts/seed-home-config.ts
  seedAdmin();
  // Create any new tables that don't exist yet (idempotent).
  runStartupMigrations();
});
