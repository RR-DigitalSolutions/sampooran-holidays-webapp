/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Sampooran Holidays — Smart Chat Bot Engine v2.0
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Rule-based NLP pre-screening bot designed by architecture principles from
 * MakeMyTrip, Booking.com, Salesforce CRM chat systems.
 *
 * Features:
 *  - Transparent AI disclosure (client always knows it's a bot)
 *  - Intent detection for 5 departments: TOUR, HOTEL, TAXI, B2B, GENERAL
 *  - Structured requirement gathering per department
 *  - Multi-layer spam & bot detection (timing, patterns, heuristics)
 *  - Rate limiting per session
 *  - Graceful human escalation
 *
 * Architecture note for scale:
 *  - botSessions Map is in-process memory (fine for single-node)
 *  - For horizontal scale (10,000 concurrent), replace with Redis Hash:
 *    HSET chat:bot:{sessionId} state INTENT intent TOUR ...
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type BotState =
  | "GREETING"      // Initial state – ask intent
  | "INTENT"        // Waiting for user to pick category
  | "COLLECTING"    // Asking department-specific questions
  | "SUMMARY"       // Summarizing and asking to connect human
  | "ESCALATED"     // Handed off to human agent
  | "BOT_RESOLVED"; // Resolved without human (FAQ / simple answers)

export type ChatCategory = "TOUR" | "HOTEL" | "TAXI" | "B2B" | "B2C" | "GENERAL";

export interface BotSession {
  state: BotState;
  intent: ChatCategory | null;
  questionIndex: number;      // Which question we are on
  collectedData: Record<string, string>; // Answers collected so far
  guestName: string;

  // Spam & security tracking
  messageTimestamps: number[]; // Last N message timestamps (ms)
  messageContents: string[];   // Last N message contents (for repeat detection)
  spamScore: number;           // 0-100
  botPatternScore: number;     // 0-100 (automated bot likelihood)
  isFlagged: boolean;
  isBlocked: boolean;

  // Timestamps
  createdAt: number;
  lastActiveAt: number;
}

export interface BotResponse {
  message: string;             // Text to send to guest
  quickReplies?: QuickReply[]; // Tap-to-select buttons
  isBot: true;
  shouldEscalate: boolean;     // True = hand off to human supervisor
  shouldBlock: boolean;        // True = ban this session
  spamScore: number;
  category: ChatCategory;
  requirementData: Record<string, string>; // What was collected
  newState: BotState;
}

export interface QuickReply {
  id: string;
  label: string;
  value: string;              // Sent as message when tapped
}

// ─── Bot Flow Definitions ─────────────────────────────────────────────────────

interface FlowQuestion {
  key: string;
  ask: string;
  quickReplies?: QuickReply[];
  optional?: boolean;
}

const BOT_FLOWS: Record<ChatCategory, FlowQuestion[]> = {
  TOUR: [
    {
      key: "destination",
      ask: "✈️ Which destination are you planning to visit?\n_(e.g. Kerala, Rajasthan, Goa, Himachal, Manali, Andaman…)_",
    },
    {
      key: "travelDates",
      ask: "📅 What are your preferred travel dates?\n_(Approximate dates are fine, e.g. \"Mid-August for 7 days\")_",
    },
    {
      key: "travelers",
      ask: "👥 How many travelers? Please share:\n• Adults: ___\n• Children (below 12): ___\n• Infants: ___",
    },
    {
      key: "budget",
      ask: "💰 What is your approximate budget per person?\n_(This helps us suggest the best packages)_",
      quickReplies: [
        { id: "b1", label: "Below ₹10,000", value: "Below ₹10,000" },
        { id: "b2", label: "₹10,000–₹25,000", value: "₹10,000–₹25,000" },
        { id: "b3", label: "₹25,000–₹50,000", value: "₹25,000–₹50,000" },
        { id: "b4", label: "₹50,000+", value: "₹50,000+" },
      ],
    },
    {
      key: "specialRequests",
      ask: "🌟 Any special requirements?\n_(Honeymoon couple, senior citizens, wheelchair access, vegetarian meals, etc.)_",
      optional: true,
    },
  ],
  HOTEL: [
    {
      key: "city",
      ask: "🏨 Which city/destination do you need a hotel in?",
    },
    {
      key: "checkIn",
      ask: "📅 What is your check-in date?",
    },
    {
      key: "checkOut",
      ask: "📅 What is your check-out date?",
    },
    {
      key: "rooms",
      ask: "🛏️ How many rooms do you need? And any preference?\n_(e.g. 1 Deluxe Room, 2 AC Rooms)_",
    },
    {
      key: "starPreference",
      ask: "⭐ Star rating preference?",
      quickReplies: [
        { id: "s2", label: "2 Star / Budget", value: "2 Star / Budget" },
        { id: "s3", label: "3 Star", value: "3 Star" },
        { id: "s4", label: "4 Star", value: "4 Star" },
        { id: "s5", label: "5 Star / Luxury", value: "5 Star / Luxury" },
        { id: "sa", label: "Any / Best value", value: "Best value" },
      ],
    },
    {
      key: "budget",
      ask: "💰 What is your budget per room per night?",
      quickReplies: [
        { id: "h1", label: "Below ₹1,500", value: "Below ₹1,500" },
        { id: "h2", label: "₹1,500–₹3,500", value: "₹1,500–₹3,500" },
        { id: "h3", label: "₹3,500–₹7,000", value: "₹3,500–₹7,000" },
        { id: "h4", label: "₹7,000+", value: "₹7,000+" },
      ],
    },
  ],
  TAXI: [
    {
      key: "from",
      ask: "📍 Pickup location?\n_(City/Area/Hotel name)_",
    },
    {
      key: "to",
      ask: "🏁 Drop location?\n_(City/Area/Hotel name)_",
    },
    {
      key: "date",
      ask: "📅 Travel date and preferred time?\n_(e.g. 15 Aug, 8:00 AM)_",
    },
    {
      key: "tripType",
      ask: "🔄 Trip type?",
      quickReplies: [
        { id: "t1", label: "One Way", value: "One Way" },
        { id: "t2", label: "Round Trip", value: "Round Trip" },
        { id: "t3", label: "Multi-day", value: "Multi-day" },
      ],
    },
    {
      key: "vehicleType",
      ask: "🚗 Vehicle preference?",
      quickReplies: [
        { id: "v1", label: "Sedan (4 Pax)", value: "Sedan" },
        { id: "v2", label: "SUV (6 Pax)", value: "SUV" },
        { id: "v3", label: "Tempo Traveller (12 Pax)", value: "Tempo Traveller" },
        { id: "v4", label: "Bus (20+ Pax)", value: "Bus" },
      ],
    },
  ],
  B2B: [
    {
      key: "company",
      ask: "🏢 Please share your company name and type:\n_(e.g. XYZ Travel Agency, Corporate, School, NGO)_",
    },
    {
      key: "location",
      ask: "📍 Your city and state?",
    },
    {
      key: "agentType",
      ask: "What best describes your business?",
      quickReplies: [
        { id: "a1", label: "Travel Agency / DMC", value: "Travel Agency / DMC" },
        { id: "a2", label: "Corporate Travel", value: "Corporate Travel" },
        { id: "a3", label: "School / Institution", value: "School / Institution" },
        { id: "a4", label: "Event / MICE", value: "Event / MICE" },
        { id: "a5", label: "Other", value: "Other" },
      ],
    },
    {
      key: "volume",
      ask: "📊 Approximate monthly booking volume?\n_(This helps us offer the right commission slab)_",
      quickReplies: [
        { id: "m1", label: "1–5 bookings", value: "1–5 bookings/month" },
        { id: "m2", label: "5–20 bookings", value: "5–20 bookings/month" },
        { id: "m3", label: "20–50 bookings", value: "20–50 bookings/month" },
        { id: "m4", label: "50+ bookings", value: "50+ bookings/month" },
      ],
    },
    {
      key: "services",
      ask: "🛎️ Which services are you interested in?",
      quickReplies: [
        { id: "sr1", label: "Tour Packages", value: "Tour Packages" },
        { id: "sr2", label: "Hotels", value: "Hotels" },
        { id: "sr3", label: "Transport / Taxi", value: "Transport" },
        { id: "sr4", label: "All Services", value: "All Services" },
      ],
    },
  ],
  B2C: [
    {
      key: "issue",
      ask: "📝 Please describe how we can help you today.\n_(Tell us your query and we'll connect you with the right person)_",
    },
  ],
  GENERAL: [
    {
      key: "issue",
      ask: "📝 Please describe your query and we'll get the right person to help you.",
    },
  ],
};

// ─── Quick Replies for intent selection ──────────────────────────────────────

const INTENT_QUICK_REPLIES: QuickReply[] = [
  { id: "q_tour",    label: "🏔️ Tour Package",     value: "Tour Package"   },
  { id: "q_hotel",   label: "🏨 Hotel Booking",     value: "Hotel Booking"  },
  { id: "q_taxi",    label: "🚗 Taxi / Transport",  value: "Taxi"           },
  { id: "q_b2b",     label: "🤝 B2B Partnership",   value: "B2B"            },
  { id: "q_other",   label: "💬 Other Query",        value: "Other"          },
];

// ─── Spam Detection ───────────────────────────────────────────────────────────

/**
 * Multi-layer spam scoring engine.
 * Returns a score 0–100. Higher = more suspicious.
 * Design principles from Google reCAPTCHA v3 and Salesforce fraud detection.
 */
function calculateSpamScore(
  message: string,
  session: BotSession
): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  const now = Date.now();
  const recentTimestamps = session.messageTimestamps.filter(t => now - t < 60_000);

  // ── Rate: Too many messages in 60 seconds ──────────────────────────────────
  if (recentTimestamps.length > 20) { score += 40; reasons.push("rate_flood"); }
  else if (recentTimestamps.length > 10) { score += 20; reasons.push("rate_high"); }

  // ── Speed: Message too fast (< 800ms from last) ──────────────────────────
  const lastTs = session.messageTimestamps.at(-1) ?? 0;
  const timeSinceLast = now - lastTs;
  if (timeSinceLast < 300) { score += 35; reasons.push("too_fast_300ms"); }
  else if (timeSinceLast < 800) { score += 15; reasons.push("too_fast_800ms"); }

  // ── Repeat: Same message sent 2+ times ───────────────────────────────────
  const recentContents = session.messageContents.slice(-10);
  const repeatCount = recentContents.filter(c => c.toLowerCase() === message.toLowerCase()).length;
  if (repeatCount >= 3) { score += 40; reasons.push("repeat_x3"); }
  else if (repeatCount >= 2) { score += 20; reasons.push("repeat_x2"); }

  // ── Gibberish: No vowels, random character sequences ─────────────────────
  const stripped = message.replace(/\s/g, "").toLowerCase();
  const vowelRatio = (stripped.match(/[aeiou]/g) || []).length / (stripped.length || 1);
  if (stripped.length > 5 && vowelRatio < 0.05) { score += 25; reasons.push("gibberish_no_vowels"); }

  // ── Gibberish: Excessive consonant clusters ───────────────────────────────
  if (/[bcdfghjklmnpqrstvwxyz]{6,}/i.test(message)) { score += 20; reasons.push("consonant_cluster"); }

  // ── Spam keywords ─────────────────────────────────────────────────────────
  const spamPatterns = [
    /\b(test|testing|asdf|qwerty|lorem|ipsum|blah|xyz123)\b/i,
    /(.)\1{4,}/,         // aaaaaaa, xxxxxxxx
    /^[\W\d\s]+$/,       // Only special chars/numbers, no real words
  ];
  for (const pattern of spamPatterns) {
    if (pattern.test(message)) { score += 15; reasons.push(`spam_pattern:${pattern.source.slice(0,20)}`); break; }
  }

  // ── Bot pattern: Uniform timing (all messages within 100ms of each other) ─
  if (recentTimestamps.length >= 5) {
    const intervals = recentTimestamps.slice(1).map((t, i) => t - recentTimestamps[i]);
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev < 50 && recentTimestamps.length > 8) { score += 30; reasons.push("bot_uniform_timing"); }
  }

  // ── Length: Extremely short or extremely long ──────────────────────────────
  if (message.length > 2000) { score += 10; reasons.push("msg_too_long"); }
  if (message.trim().length < 1) { score += 20; reasons.push("empty_message"); }

  return { score: Math.min(score, 100), reason: reasons.join(",") };
}

// ─── Intent Detection ─────────────────────────────────────────────────────────

function detectIntent(text: string): ChatCategory | null {
  const lower = text.toLowerCase();

  const patterns: Array<{ regex: RegExp; category: ChatCategory }> = [
    // Tour patterns
    { regex: /\b(tour|package|trip|holiday|vacation|itinerary|honeymoon|sightseeing|travel|yatra|darshan)\b/, category: "TOUR" },
    // Hotel patterns
    { regex: /\b(hotel|room|stay|accommodation|resort|hostel|lodge|check.?in|check.?out|booking|property)\b/, category: "HOTEL" },
    // Taxi patterns
    { regex: /\b(taxi|cab|car|vehicle|transport|pickup|drop|driver|tempo|bus|transfer|airport)\b/, category: "TAXI" },
    // B2B patterns
    { regex: /\b(b2b|agency|agent|corporate|partnership|commission|bulk|group|school|college|institution|business|company)\b/, category: "B2B" },
    // Quick reply values
    { regex: /^tour package$/i, category: "TOUR" },
    { regex: /^hotel booking$/i, category: "HOTEL" },
    { regex: /^taxi$/i, category: "TAXI" },
    { regex: /^b2b$/i, category: "B2B" },
  ];

  for (const { regex, category } of patterns) {
    if (regex.test(lower)) return category;
  }

  return null;
}

// ─── In-Memory Session Store ─────────────────────────────────────────────────
// TODO: Replace with Redis HASH for horizontal scaling (10,000+ concurrent sessions)
// Pattern: HSET chat:bot:{sessionId} field value EX 86400

const botSessions = new Map<string, BotSession>();

// Cleanup stale sessions every 30 minutes to prevent memory leak
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
  for (const [key, session] of botSessions.entries()) {
    if (session.lastActiveAt < cutoff) {
      botSessions.delete(key);
    }
  }
}, 30 * 60 * 1000);

// ─── Public API ──────────────────────────────────────────────────────────────

export function getBotSession(sessionId: string): BotSession | undefined {
  return botSessions.get(sessionId);
}

export function createBotSession(sessionId: string, guestName: string): BotSession {
  const session: BotSession = {
    state: "GREETING",
    intent: null,
    questionIndex: 0,
    collectedData: {},
    guestName,
    messageTimestamps: [],
    messageContents: [],
    spamScore: 0,
    botPatternScore: 0,
    isFlagged: false,
    isBlocked: false,
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  };
  botSessions.set(sessionId, session);
  return session;
}

/**
 * Main bot processing function.
 * Call this for every incoming USER message BEFORE forwarding to human agents.
 *
 * Returns a BotResponse that tells the socket handler what to do next.
 */
export function processBotMessage(
  sessionId: string,
  text: string,
  guestName: string
): BotResponse {
  // Get or create session
  let session = botSessions.get(sessionId);
  if (!session) {
    session = createBotSession(sessionId, guestName);
  }

  session.lastActiveAt = Date.now();

  // ── SPAM & BOT DETECTION ─────────────────────────────────────────────────
  const spamResult = calculateSpamScore(text, session);
  session.spamScore = Math.min(100, session.spamScore + spamResult.score * 0.3 + spamResult.score * 0.7);
  session.messageTimestamps = [...session.messageTimestamps.slice(-50), Date.now()];
  session.messageContents = [...session.messageContents.slice(-20), text];

  if (session.spamScore >= 90 || session.isBlocked) {
    session.isBlocked = true;
    return makeResponse(session, {
      message: "⚠️ Your session has been flagged for unusual activity. Please try again later or contact us at support@sampooranholidays.com",
      shouldEscalate: false,
      shouldBlock: true,
      newState: session.state,
    });
  }

  if (session.spamScore >= 70 && !session.isFlagged) {
    session.isFlagged = true;
    // Don't block yet, but flag for supervisor review
  }

  // ── Check if user explicitly wants human ─────────────────────────────────
  const wantsHuman = /\b(human|agent|person|staff|real person|speak to someone|connect me|help me now|urgent)\b/i.test(text);

  // ── Handle ESCALATED state (already with human) ───────────────────────────
  if (session.state === "ESCALATED") {
    // Pass through to human agent - bot does nothing
    return makeResponse(session, {
      message: "",
      shouldEscalate: false,
      shouldBlock: false,
      newState: "ESCALATED",
    });
  }

  // ── GREETING state — send welcome and ask intent ──────────────────────────
  if (session.state === "GREETING") {
    session.state = "INTENT";
    return makeResponse(session, {
      message: `Hello ${guestName.split(" ")[0]}! 👋 Welcome to **Sampooran Holidays**.\n\n🤖 _I'm Sampoorna, your AI Travel Assistant. I'm here to gather your requirements before connecting you with our expert team._\n\nHow can I help you today? Please select one:`,
      quickReplies: INTENT_QUICK_REPLIES,
      shouldEscalate: false,
      shouldBlock: false,
      newState: "INTENT",
    });
  }

  // ── INTENT state — detect what the user wants ─────────────────────────────
  if (session.state === "INTENT") {
    const detected = detectIntent(text);
    if (!detected) {
      // Didn't understand — ask again with quick replies
      return makeResponse(session, {
        message: `🤔 I didn't quite catch that. Please choose one of the options below to help me assist you better:`,
        quickReplies: INTENT_QUICK_REPLIES,
        shouldEscalate: false,
        shouldBlock: false,
        newState: "INTENT",
      });
    }

    session.intent = detected;
    session.questionIndex = 0;
    session.state = "COLLECTING";

    // Ask first question
    const questions = BOT_FLOWS[detected];
    const firstQ = questions[0];
    return makeResponse(session, {
      message: `Great choice! 🌟 Let me collect a few details to help our **${getDeptLabel(detected)} team** assist you perfectly.\n\n${firstQ.ask}`,
      quickReplies: firstQ.quickReplies,
      shouldEscalate: false,
      shouldBlock: false,
      newState: "COLLECTING",
    });
  }

  // ── COLLECTING state — gather answers ────────────────────────────────────
  if (session.state === "COLLECTING") {
    const intent = session.intent!;
    const questions = BOT_FLOWS[intent];
    const currentQuestion = questions[session.questionIndex];

    // Save the answer
    if (text.trim()) {
      session.collectedData[currentQuestion.key] = text.trim();
    }

    session.questionIndex++;

    // Check if user wants human agent mid-flow
    if (wantsHuman) {
      return escalateToHuman(session, sessionId);
    }

    // Check if we've asked all questions
    if (session.questionIndex >= questions.length) {
      // Move to SUMMARY
      session.state = "SUMMARY";
      const summary = buildSummary(session);

      return makeResponse(session, {
        message: `✅ **Perfect! Here's a summary of your requirement:**\n\n${summary}\n\n---\n🤖 _You're chatting with Sampoorna AI — not a human agent._\n\nShall I connect you with our **${getDeptLabel(intent)} expert** who can provide customized options and pricing?`,
        quickReplies: [
          { id: "yes_connect", label: "✅ Yes, connect me!", value: "Yes, connect me to an agent" },
          { id: "edit",        label: "✏️ Edit details",    value: "I want to change something" },
          { id: "no_wait",     label: "⏳ Not yet",         value: "Not yet, I have more questions" },
        ],
        shouldEscalate: false,
        shouldBlock: false,
        newState: "SUMMARY",
      });
    }

    // Ask next question
    const nextQ = questions[session.questionIndex];
    return makeResponse(session, {
      message: nextQ.ask,
      quickReplies: nextQ.quickReplies,
      shouldEscalate: false,
      shouldBlock: false,
      newState: "COLLECTING",
    });
  }

  // ── SUMMARY state — user confirms or edits ───────────────────────────────
  if (session.state === "SUMMARY") {
    const lower = text.toLowerCase();

    // User wants to connect to human
    if (lower.includes("yes") || lower.includes("connect") || lower.includes("agent") || wantsHuman) {
      return escalateToHuman(session, sessionId);
    }

    // User wants to edit
    if (lower.includes("edit") || lower.includes("change") || lower.includes("wrong")) {
      session.questionIndex = 0;
      session.state = "COLLECTING";
      const questions = BOT_FLOWS[session.intent!];
      return makeResponse(session, {
        message: `No problem! Let's update your details. Let's start over:\n\n${questions[0].ask}`,
        quickReplies: questions[0].quickReplies,
        shouldEscalate: false,
        shouldBlock: false,
        newState: "COLLECTING",
      });
    }

    // User has more questions — still in SUMMARY, but answer their query and suggest connecting
    return makeResponse(session, {
      message: `I understand! 😊 For detailed information and customized options, our travel expert would be best placed to help.\n\n_🤖 Remember: I'm Sampoorna AI, not a human. For personalized advice, please connect with our team._\n\nWould you like me to connect you with our **${getDeptLabel(session.intent!)} specialist**?`,
      quickReplies: [
        { id: "yes_connect", label: "✅ Yes, connect me!", value: "Yes, connect me to an agent" },
        { id: "no_wait",     label: "⏳ No, not yet",     value: "Not yet" },
      ],
      shouldEscalate: false,
      shouldBlock: false,
      newState: "SUMMARY",
    });
  }

  // Fallback — shouldn't normally reach here
  return escalateToHuman(session, sessionId);
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function escalateToHuman(session: BotSession, sessionId: string): BotResponse {
  session.state = "ESCALATED";
  botSessions.set(sessionId, session);

  const hasData = Object.keys(session.collectedData).length > 0;
  const deptLabel = session.intent ? getDeptLabel(session.intent) : "Support";

  return makeResponse(session, {
    message: `🔗 **Connecting you to a ${deptLabel} expert...**\n\n${hasData ? `_Your requirement summary has been shared with our team._\n\n` : ""}⏱️ _Typical response time: < 3 minutes during business hours (9 AM – 7 PM IST)_\n\n✅ A team member will reply shortly. You can continue typing your questions!`,
    shouldEscalate: true,
    shouldBlock: false,
    newState: "ESCALATED",
  });
}

function buildSummary(session: BotSession): string {
  const intent = session.intent!;
  const data = session.collectedData;
  const questions = BOT_FLOWS[intent];

  return questions
    .filter(q => data[q.key])
    .map(q => {
      const label = q.key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, s => s.toUpperCase())
        .trim();
      return `• **${label}**: ${data[q.key]}`;
    })
    .join("\n");
}

function getDeptLabel(category: ChatCategory): string {
  const labels: Record<ChatCategory, string> = {
    TOUR: "Tour Packages",
    HOTEL: "Hotel Bookings",
    TAXI: "Transport",
    B2B: "B2B Sales",
    B2C: "Customer Support",
    GENERAL: "Support",
  };
  return labels[category] || "Support";
}

function makeResponse(
  session: BotSession,
  overrides: Partial<BotResponse> & { message: string; shouldEscalate: boolean; shouldBlock: boolean; newState: BotState }
): BotResponse {
  // Persist session state
  session.state = overrides.newState;

  return {
    isBot: true,
    message: overrides.message,
    quickReplies: overrides.quickReplies,
    shouldEscalate: overrides.shouldEscalate,
    shouldBlock: overrides.shouldBlock,
    spamScore: Math.round(session.spamScore),
    category: session.intent || "GENERAL",
    requirementData: session.collectedData,
    newState: overrides.newState,
  };
}

export function destroyBotSession(sessionId: string): void {
  botSessions.delete(sessionId);
}
