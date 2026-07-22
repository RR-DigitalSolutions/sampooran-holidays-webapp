/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Sampooran Holidays — Sampoorna AI Concierge v3.0
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Design principles:
 *  - Natural persona: "Sampoorna, your travel concierge" — warm, NOT robotic
 *  - No direct AI self-labelling inside messages (handled by UI banner)
 *  - Fuzzy NLP: Levenshtein + Indian travel glossary (50 entries)
 *  - Typing delay calculated per message length for human-feel pacing
 *  - FAQ knowledge base: 30+ common travel questions answered inline
 *  - Complaint / Feedback flow with auto ticket # + URGENT escalation
 *  - 10-min engagement: travel tips, trivia, customization, proactive nudges
 *  - Smart customization flow: themes, meal prefs, special occasions
 *  - Returning user awareness: personalized greetings, topic callbacks
 *  - Spam / bot detection (8 layers)
 *
 * Scale note:
 *  - botSessions Map = in-process (single node, handles ~5000 concurrent)
 *  - Replace with Redis HASH for horizontal scale:
 *    HSET chat:bot:{sessionId} state INTENT intent TOUR EX 86400
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─── Static DB import (used for recommendation cards) ───────────────────────
import { db, packagesTable, hotelsTable, transportVehiclesTable } from "@workspace/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BotState =
  | "GREETING"       // Initial — send welcome
  | "INTENT"         // Waiting for category selection
  | "COLLECTING"     // Gathering requirement fields
  | "PROBING"        // Follow-up on vague answer
  | "FAQ"            // Answering a direct question
  | "COMPLAINT"      // Collecting complaint details
  | "CUSTOMIZING"    // Collecting customization preferences (post-summary)
  | "ENGAGING"       // 10-minute engagement loop (tips, trivia, suggestions)
  | "SUMMARY"        // Summary + confirm connect
  | "ESCALATED"      // Handed to human
  | "BOT_RESOLVED";  // Resolved by bot (FAQ / simple)

export type ChatCategory =
  | "TOUR"
  | "HOTEL"
  | "TAXI"
  | "B2B"
  | "B2C"
  | "COMPLAINT"
  | "GENERAL";

export interface BotSession {
  state: BotState;
  intent: ChatCategory | null;
  questionIndex: number;
  collectedData: Record<string, string>;
  guestName: string;
  lastAnswer: string;           // Previous answer (for probing logic)
  probingCount: number;         // How many times we've probed this question
  faqAnswered: string[];        // FAQ keys already answered
  ticketId: string | null;      // Complaint ticket #

  // Engagement engine
  engagementTipsSent: number[];   // tip indices already sent (no repeats)
  engagementRound: number;         // how many engagement rounds completed
  customizationData: Record<string, string>; // themes, meals, occasions
  customizationStep: number;       // which customization question we're on
  isReturning: boolean;            // is this a returning user?
  lastTopic: string;               // topic from last session (for callbacks)
  summaryShown: boolean;           // have we shown the summary?

  // Spam & security
  messageTimestamps: number[];
  messageContents: string[];
  spamScore: number;
  botPatternScore: number;
  isFlagged: boolean;
  isBlocked: boolean;
  violationCount?: number;
  mutedUntil?: number | null;

  createdAt: number;
  lastActiveAt: number;
}

export interface RecommendationCard {
  id: number | string;
  type: "PACKAGE" | "HOTEL" | "TAXI";
  title: string;
  subtitle?: string;
  location?: string;
  price: string;
  originalPrice?: string;
  rating?: number;
  image?: string;
  url?: string;
}

export interface BotResponse {
  message: string;
  quickReplies?: QuickReply[];
  recommendations?: RecommendationCard[];
  isBot: true;
  shouldEscalate: boolean;
  shouldBlock: boolean;
  spamScore: number;
  category: ChatCategory;
  requirementData: Record<string, string>;
  newState: BotState;
  typingDelayMs: number;        // How long to show typing indicator before sending
  urgency?: "NORMAL" | "URGENT";
  isMuted?: boolean;
  mutedUntil?: number | null;
}

export interface QuickReply {
  id: string;
  label: string;
  value: string;
}

// ─── Typing Delay ─────────────────────────────────────────────────────────────

export function calcTypingDelay(message: string): number {
  const words   = message.split(/\s+/).filter(Boolean).length;
  const base    = 1200;
  const perWord = Math.min(words * 48, 2000);
  const jitter  = Math.floor(Math.random() * 300);
  return Math.min(base + perWord + jitter, 4000);
}

// ─── Fuzzy NLP ────────────────────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

const TRAVEL_GLOSSARY: Record<string, string> = {
  "rajsthan": "rajasthan", "rajshthan": "rajasthan", "rajastha": "rajasthan",
  "kerla": "kerala", "karela": "kerala", "kerela": "kerala", "kerel": "kerala",
  "goa": "goa", "go a": "goa",
  "himachal": "himachal pradesh", "himchal": "himachal", "himachel": "himachal",
  "manalli": "manali", "manaly": "manali", "manaali": "manali",
  "kashmir": "kashmir", "kasmir": "kashmir", "cashmere": "kashmir",
  "andeman": "andaman", "andman": "andaman", "andaman nicobar": "andaman",
  "ooty": "ooty", "oooty": "ooty",
  "munnar": "munnar", "munar": "munnar",
  "shimla": "shimla", "simla": "shimla", "shimmla": "shimla",
  "dalhousie": "dalhousie", "dalhuse": "dalhousie",
  "rishikesh": "rishikesh", "rushikesh": "rishikesh",
  "haridwar": "haridwar", "haridwaar": "haridwar",
  "agra": "agra",
  "varanasi": "varanasi", "benaras": "varanasi", "benares": "varanasi",
  "darjeeling": "darjeeling", "darjiling": "darjeeling",
  "honeymun": "honeymoon", "honeymooon": "honeymoon", "hunimoon": "honeymoon",
  "pkg": "package", "packge": "package", "pakage": "package",
  "acco": "accommodation", "accomodation": "accommodation", "acommodation": "accommodation",
  "tfr": "transfer", "tranfer": "transfer",
  "cab": "taxi", "cabs": "taxi", "car hire": "taxi",
  "toure": "tour", "tur": "tour",
  "hotell": "hotel", "hotal": "hotel", "hotl": "hotel",
  "boking": "booking", "bookng": "booking", "bking": "booking",
  "cancell": "cancel", "cancle": "cancel", "cancellation": "cancel",
  "refnd": "refund", "refund": "refund",
  "vizaa": "visa", "viza": "visa",
  "itenary": "itinerary", "itinerary": "itinerary", "itenery": "itinerary",
  "sightseein": "sightseeing", "sitseeing": "sightseeing",
  "chekout": "checkout", "check out": "checkout",
  "chekin": "checkin", "check in": "checkin",
  "buget": "budget", "bugget": "budget",
  "prce": "price", "prizze": "price",
};

export function fuzzyNormalize(text: string): string {
  let lower = text.toLowerCase().trim();
  const words = lower.split(/\s+/);
  const fixed = words.map(word => {
    if (TRAVEL_GLOSSARY[word]) return TRAVEL_GLOSSARY[word];
    for (const [misspelled, canonical] of Object.entries(TRAVEL_GLOSSARY)) {
      if (word.length >= 4 && levenshtein(word, misspelled) <= 1) return canonical;
    }
    return word;
  });
  return fixed.join(" ");
}

// ─── Intent Detection ──────────────────────────────────────────────────────────

function detectIntent(raw: string): ChatCategory | null {
  const text = fuzzyNormalize(raw);

  if (/\b(complaint|complain|problem|issue|bad experience|not happy|unhappy|upset|refund|cancel|cancellation|money back|cheated|fraud|scam|wrong|mistake|disappointe|terrible|horrible|worst|pathetic)\b/.test(text)) return "COMPLAINT";
  if (/\b(feedback|review|suggestion|happy|satisfied|great experience|loved it|amazing)\b/.test(text)) return "COMPLAINT";
  if (/\b(tour|package|trip|holiday|vacation|itinerary|honeymoon|sightseeing|travel|yatra|darshan|getaway|destination|kashmir|kerala|rajasthan|goa|andaman|manali|himachal|ooty|munnar|shimla|rishikesh|haridwar|varanasi|darjeeling)\b/.test(text)) return "TOUR";
  if (/\b(hotel|room|stay|accommodation|resort|hostel|lodge|checkin|checkout|property|inn|villa|suite|bed and breakfast)\b/.test(text)) return "HOTEL";
  if (/\b(taxi|cab|car|vehicle|transport|pickup|drop|driver|tempo|bus|transfer|airport|railway|cab hire|self drive|chauffeur)\b/.test(text)) return "TAXI";
  if (/\b(b2b|agency|agent|corporate|partnership|commission|bulk|school|college|institution|business|company|dmc|mice|event|franchise)\b/.test(text)) return "B2B";

  const qrMap: Record<string, ChatCategory> = {
    "tour package": "TOUR", "hotel booking": "HOTEL", "taxi": "TAXI",
    "b2b": "B2B", "share feedback or complaint": "COMPLAINT", "other": "GENERAL",
  };
  const lower = text.toLowerCase().trim();
  if (qrMap[lower]) return qrMap[lower];
  return null;
}

// ─── FAQ Knowledge Base ────────────────────────────────────────────────────────

interface FAQEntry { patterns: RegExp[]; answer: string; }

const FAQ_KB: FAQEntry[] = [
  {
    patterns: [/\b(visa|visa required|do i need visa|passport)\b/i],
    answer: `Great question! For domestic Indian destinations (Goa, Kerala, Rajasthan, Himachal, etc.) — **no visa is needed** for Indian citizens. 🇮🇳\n\nFor international destinations, visa requirements depend on your nationality and destination. Our team can guide you through the complete visa process.\n\nShall I connect you with our expert who can advise based on your specific destination?`,
  },
  {
    patterns: [/\b(best time|best season|when to visit|which month|ideal time)\b/i],
    answer: `Here are the best times for popular destinations:\n\n🏔️ **Himachal / Manali**: Oct–Jun (avoid monsoon)\n🌴 **Kerala / Goa**: Nov–Mar (perfect weather)\n🏜️ **Rajasthan**: Oct–Mar (cool & pleasant)\n🏝️ **Andaman**: Nov–Apr (calm seas)\n🗻 **Kashmir**: Apr–Oct (beautiful meadows)\n\nWhich destination are you planning to visit? I can give you more specific timing! 😊`,
  },
  {
    patterns: [/\b(price|cost|how much|rate|charges|expensive|cheap|affordable|tariff)\b/i],
    answer: `Our packages are designed for every budget! 💰\n\nTypical ranges:\n• **Economy**: ₹8,000–₹15,000 per person\n• **Standard**: ₹15,000–₹35,000 per person\n• **Deluxe**: ₹35,000–₹60,000 per person\n• **Luxury**: ₹60,000+ per person\n\nActual pricing depends on destination, dates, number of travelers, and inclusions. To get an accurate quote, could you share a bit more about your plan?`,
  },
  {
    patterns: [/\b(include|inclusions|what is included|meals included|breakfast|flight|flights included)\b/i],
    answer: `Our standard tour packages typically include:\n\n✅ Accommodation (as per category)\n✅ Daily breakfast (some include all meals)\n✅ Sightseeing as per itinerary\n✅ AC vehicle for transfers\n✅ Experienced tour guide\n\nFlights / trains are usually optional add-ons.\n\n💡 We'll send you a detailed inclusions list once we finalize your package. Want to proceed?`,
  },
  {
    patterns: [/\b(cancellation|cancel policy|refund policy|if i cancel|money back)\b/i],
    answer: `Our standard cancellation policy:\n\n📋 **30+ days before travel**: 90% refund\n📋 **15–30 days**: 70% refund\n📋 **7–15 days**: 50% refund\n📋 **0–7 days**: No refund (or credit note)\n\nNote: Policies may vary by package and season. Our team will share the exact policy for your specific booking.\n\nDo you have an existing booking concern, or are you planning a new trip?`,
  },
  {
    patterns: [/\b(group discount|group booking|group tour|family tour|large group)\b/i],
    answer: `Absolutely! We offer excellent group discounts 🎉\n\n• **6–10 pax**: 5–8% discount\n• **11–20 pax**: 10–15% discount\n• **20+ pax**: Custom pricing + dedicated group manager\n\nWe specialize in:\n• Family holidays 👨‍👩‍👧‍👦\n• Corporate retreats 🏢\n• School / college trips 🎓\n• Wedding groups 💍\n\nHow many people are traveling with you?`,
  },
  {
    patterns: [/\b(emi|installment|pay later|payment plan|advance|how to pay)\b/i],
    answer: `Great news — we have flexible payment options! 💳\n\n✅ **25% advance** to confirm booking\n✅ Balance on or before departure\n✅ EMI available via major credit cards\n✅ UPI, Net Banking, Bank Transfer accepted\n\nOur team will guide you through the payment process once your itinerary is finalized. Shall I connect you?`,
  },
  {
    patterns: [/\b(honeymoon|couple|romantic|anniversary|newly married|newly wed)\b/i],
    answer: `Congratulations! 🎊 We absolutely love creating magical honeymoon experiences!\n\nOur popular honeymoon destinations:\n\n🌴 **Kerala backwaters** — serene & romantic\n🏔️ **Kashmir / Manali** — snowy romance\n🏝️ **Andaman** — crystal-clear beaches\n🌺 **Bali / Maldives** — international luxury\n\nWe include special touches: candlelight dinners, flower decorations, couple spa, and more! ❤️\n\nWhich type of destination appeals to you both?`,
  },
  {
    patterns: [/\b(senior citizen|elderly|old age|wheelchair|disabled|handicapped)\b/i],
    answer: `We take special care of our senior travelers! 🙏\n\nFor senior citizens, we arrange:\n\n✅ Comfortable, non-strenuous itineraries\n✅ Ground-floor rooms where possible\n✅ Dedicated assistance at airports & hotels\n✅ Medical emergency support on tour\n✅ Wheelchair-friendly vehicles on request\n\nPlease let our team know about any specific medical needs — we'll tailor the trip accordingly. Shall I connect you with our specialist?`,
  },
  {
    patterns: [/\b(custom|customized|tailor|made to order|personalized|own itinerary)\b/i],
    answer: `Absolutely! Custom tours are our specialty. 🎯\n\nYou tell us:\n• Destinations you want to cover\n• Number of days\n• Your budget\n• Special preferences\n\n...and we'll craft a perfect, personalized itinerary just for you!\n\nNo two trips are the same at Sampooran Holidays. 🌟 Shall I connect you with our package designer?`,
  },
];

function checkFAQ(text: string, session: BotSession): FAQEntry | null {
  const normalized = fuzzyNormalize(text);
  for (const entry of FAQ_KB) {
    const key = entry.patterns[0].source;
    if (session.faqAnswered.includes(key)) continue;
    if (entry.patterns.some(p => p.test(normalized) || p.test(text))) return entry;
  }
  return null;
}

// ─── Travel Tips & Trivia (10-minute Engagement Engine) ───────────────────────
// 20 cards — rotated non-repeatably per session

const ENGAGEMENT_TIPS: string[] = [
  `🌟 **Did you know?** Rajasthan has more palaces than any other state in India — over 400 of them! Many are now heritage hotels where you can live like royalty. 👑`,
  `💡 **Pro Tip**: Booking your holiday 60+ days in advance typically saves 15–25% on package costs. And you get first pick of the best room categories! 📅`,
  `🏔️ **Adventure Fact**: Manali to Leh is one of the world's highest motorable roads (3,978m+). The views are absolutely breathtaking — a bucket-list experience for sure! 🚗`,
  `🌊 **Beach Secret**: Havelock Island in Andaman has been rated Asia's best beach by TIME magazine. The water is so clear you can see the bottom at 15 feet! 🐠`,
  `🍛 **Food Explorer**: Kerala's Sadhya feast — 28 dishes served on a banana leaf — is a UNESCO intangible cultural heritage. Our packages can include this experience! 🌿`,
  `💰 **Budget Trick**: Traveling in shoulder season (Apr–Jun for hill stations, Sep–Oct for beaches) gives you 20–30% lower prices AND fewer crowds. Smart move! 😎`,
  `🎭 **Culture Note**: India has 40 UNESCO World Heritage Sites — more than most countries combine! From Taj Mahal to Living Root Bridges in Meghalaya. 🏛️`,
  `🦋 **Wildlife Gem**: Jim Corbett National Park has one of India's highest tiger densities. A dawn safari jeep ride is an experience you'll never forget! 🐯`,
  `🚂 **Train Magic**: The Darjeeling Himalayan Railway — a UNESCO site — is one of the world's last operating steam locomotives. The toy train experience is pure joy! 🚂`,
  `🏠 **Stay Different**: Have you considered a houseboat stay in Kerala backwaters? Waking up to mist over water with traditional Kerala breakfast is something truly special! ⛵`,
  `⭐ **Hidden Gem**: Chopta in Uttarakhand is called "India's Mini Switzerland" — but most tourists don't know about it! Pristine snow, meadows, and peace. 🏔️`,
  `📸 **Photography Tip**: Golden hour (6–7 AM) at the Taj Mahal has zero crowds and magical light. We can arrange an early-morning access slot for you! ✨`,
  `🌺 **Festival Travel**: Rajasthan's Pushkar Camel Fair (Nov) or Kerala's Thrissur Pooram (April) make for unforgettable cultural travel experiences! 🎪`,
  `🌿 **Wellness Escape**: A 5-day Ayurveda retreat in Kerala can genuinely reset your health. We partner with certified Ayurvedic resorts — it's life-changing! 🧘`,
  `🚁 **Luxury Add-on**: Helicopter rides over the Kashmir valley or a sunrise flight over Manali add just ₹3,000–₹8,000 to a package — completely worth it! 🚁`,
  `🎒 **Pack Smart**: For hill stations, always pack layers — mornings can be 8°C even in summer! A windcheater is your best friend in Himachal. 🧥`,
  `🛕 **Spiritual Circuit**: The Char Dham Yatra (Badrinath, Kedarnath, Gangotri, Yamunotri) is a once-in-a-lifetime journey. We handle all logistics! 🙏`,
  `🐬 **Marine Wonder**: Snorkeling in Andaman's Neil Island lets you swim alongside sea turtles! It's child-safe and requires zero experience — we provide equipment. 🤿`,
  `🌄 **Sunrise Experience**: Watching sunrise from Tiger Hill in Darjeeling with Kanchenjunga in the background is rated one of the world's top 10 natural spectacles! ☀️`,
  `🍵 **Tea Trail**: A guided walk through Darjeeling or Munnar tea estates with a tasting session is a unique add-on we include in many packages. Pure bliss! 🌱`,
];

// ─── Customization Questions (post-summary engagement) ─────────────────────────

interface CustomizationQuestion {
  key: string;
  ask: string;
  quickReplies?: QuickReply[];
}

const CUSTOMIZATION_FLOW: CustomizationQuestion[] = [
  {
    key: "tripTheme",
    ask: `Now let me make this trip truly **yours**! ✨\n\nWhat kind of experience are you looking for?`,
    quickReplies: [
      { id: "c1", label: "🧘 Relaxation & Peace", value: "Relaxation" },
      { id: "c2", label: "🏄 Adventure & Thrills", value: "Adventure" },
      { id: "c3", label: "🏛️ Culture & Heritage", value: "Culture" },
      { id: "c4", label: "👨‍👩‍👧 Family Fun", value: "Family" },
      { id: "c5", label: "💑 Romantic Getaway", value: "Romantic" },
      { id: "c6", label: "🌈 Mix of Everything!", value: "Mixed" },
    ],
  },
  {
    key: "mealPreference",
    ask: `Great choice! 🍽️ Any meal preferences we should keep in mind?`,
    quickReplies: [
      { id: "m1", label: "🥦 Pure Vegetarian", value: "Pure Vegetarian" },
      { id: "m2", label: "🍗 Non-Veg OK", value: "Non-Vegetarian" },
      { id: "m3", label: "🍱 Jain Food Only", value: "Jain" },
      { id: "m4", label: "🌍 Open to Local Cuisine", value: "Local Cuisine" },
      { id: "m5", label: "💁 No Preference", value: "No Preference" },
    ],
  },
  {
    key: "specialOccasion",
    ask: `Is this trip celebrating a special occasion? 🎉\n_(We'll arrange lovely surprises — completely on us for certain packages!)_`,
    quickReplies: [
      { id: "o1", label: "💍 Honeymoon", value: "Honeymoon" },
      { id: "o2", label: "🎂 Birthday", value: "Birthday" },
      { id: "o3", label: "💑 Anniversary", value: "Anniversary" },
      { id: "o4", label: "🎓 Graduation Trip", value: "Graduation" },
      { id: "o5", label: "🏢 Corporate Trip", value: "Corporate" },
      { id: "o6", label: "🙂 Just a Holiday!", value: "Regular Holiday" },
    ],
  },
];

// ─── Department Flows ──────────────────────────────────────────────────────────

interface FlowQuestion {
  key: string;
  ask: string;
  quickReplies?: QuickReply[];
  optional?: boolean;
  probe?: string;
}

export const BOT_FLOWS: Record<ChatCategory, FlowQuestion[]> = {
  TOUR: [
    {
      key: "destination",
      ask: "Which destination are you planning to visit? 🗺️\n_(e.g. Kerala, Rajasthan, Goa, Himachal, Kashmir, Andaman…)_",
      probe: "Could you share a bit more? Are you thinking of a domestic destination or international? Any specific region or state in mind?",
    },
    {
      key: "travelDates",
      ask: "Wonderful choice! 🌟 When are you planning to travel?\n_(Even approximate dates work — like \"mid-August for 7 days\" or \"October\")_",
      probe: "No worries if you're flexible! Could you share at least the approximate month and how many days you'd like to travel?",
    },
    {
      key: "travelers",
      ask: "How many people will be traveling? 👥\nPlease share:\n• Adults: ___\n• Children (under 12): ___\n• Infants: ___",
      probe: "Could you confirm the number of adults? That helps us choose the right package and room configuration.",
    },
    {
      key: "budget",
      ask: "What's your approximate budget per person? 💰\n_(This helps us suggest the best-value packages for you)_",
      quickReplies: [
        { id: "b1", label: "Below ₹10,000", value: "Below ₹10,000" },
        { id: "b2", label: "₹10,000–₹25,000", value: "₹10,000–₹25,000" },
        { id: "b3", label: "₹25,000–₹50,000", value: "₹25,000–₹50,000" },
        { id: "b4", label: "₹50,000+", value: "₹50,000+" },
      ],
    },
    {
      key: "specialRequests",
      ask: "Almost done! 😊 Any special requirements or preferences?\n_(Honeymoon couple, senior citizens, wheelchair access, vegetarian meals, adventure activities, etc.)_",
      optional: true,
    },
  ],

  HOTEL: [
    {
      key: "city",
      ask: "Which city or destination do you need a hotel in? 🏨",
      probe: "Could you share the city name? For example: Goa, Mumbai, Jaipur, Shimla…",
    },
    {
      key: "checkIn",
      ask: "Perfect! What is your check-in date? 📅",
      probe: "Even an approximate date is fine — we'll check availability!",
    },
    {
      key: "checkOut",
      ask: "And your check-out date? 📅\n_(How many nights in total?)_",
    },
    {
      key: "rooms",
      ask: "How many rooms do you need? 🛏️\n_(And any specific preference — double bed, twin beds, suite, etc.)_",
    },
    {
      key: "starPreference",
      ask: "What's your star rating preference? ⭐",
      quickReplies: [
        { id: "s2", label: "2 Star / Budget", value: "2 Star / Budget" },
        { id: "s3", label: "3 Star / Mid-range", value: "3 Star" },
        { id: "s4", label: "4 Star / Premium", value: "4 Star" },
        { id: "s5", label: "5 Star / Luxury", value: "5 Star / Luxury" },
        { id: "sa", label: "Best value", value: "Best value" },
      ],
    },
    {
      key: "budget",
      ask: "What's your budget per room per night? 💰",
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
      ask: "Sure, I can help with that! 🚗 What's your pickup location?\n_(City, area, or hotel name)_",
      probe: "Could you share the city and area? E.g. 'Jaipur Airport' or 'Connaught Place, Delhi'",
    },
    {
      key: "to",
      ask: "And your drop location? 🏁",
      probe: "Could you share the destination? E.g. 'Amber Fort, Jaipur' or 'Mumbai Central'",
    },
    {
      key: "date",
      ask: "What date and time do you need the vehicle? 📅\n_(e.g. 15 Aug, 8:00 AM)_",
    },
    {
      key: "tripType",
      ask: "What type of trip is this? 🔄",
      quickReplies: [
        { id: "t1", label: "One Way", value: "One Way" },
        { id: "t2", label: "Round Trip", value: "Round Trip" },
        { id: "t3", label: "Multi-day / Full Day", value: "Multi-day" },
      ],
    },
    {
      key: "vehicleType",
      ask: "Which type of vehicle would you prefer? 🚘",
      quickReplies: [
        { id: "v1", label: "Sedan (upto 4 pax)", value: "Sedan" },
        { id: "v2", label: "SUV / Innova (upto 6 pax)", value: "SUV" },
        { id: "v3", label: "Tempo Traveller (upto 12 pax)", value: "Tempo Traveller" },
        { id: "v4", label: "Bus / Coach (20+ pax)", value: "Bus" },
      ],
    },
  ],

  B2B: [
    {
      key: "company",
      ask: "Welcome! 🤝 We're excited about the possibility of partnering with you.\n\nCould you share your company/agency name and what you do?\n_(e.g. XYZ Travel Agency, Corporate travel, School tours…)_",
    },
    {
      key: "location",
      ask: "Great! Which city and state are you based in? 📍",
    },
    {
      key: "agentType",
      ask: "What best describes your business? 🏢",
      quickReplies: [
        { id: "a1", label: "Travel Agency / DMC", value: "Travel Agency / DMC" },
        { id: "a2", label: "Corporate Travel", value: "Corporate Travel" },
        { id: "a3", label: "School / Institution", value: "School / Institution" },
        { id: "a4", label: "Events / MICE", value: "Events / MICE" },
        { id: "a5", label: "Other", value: "Other" },
      ],
    },
    {
      key: "volume",
      ask: "Approximately how many bookings do you handle per month? 📊\n_(This helps us offer the right commission structure)_",
      quickReplies: [
        { id: "m1", label: "1–5 bookings", value: "1–5 bookings/month" },
        { id: "m2", label: "5–20 bookings", value: "5–20 bookings/month" },
        { id: "m3", label: "20–50 bookings", value: "20–50 bookings/month" },
        { id: "m4", label: "50+ bookings", value: "50+ bookings/month" },
      ],
    },
    {
      key: "services",
      ask: "Which services are you looking to partner with us for? 🛎️",
      quickReplies: [
        { id: "sr1", label: "Tour Packages", value: "Tour Packages" },
        { id: "sr2", label: "Hotel Bookings", value: "Hotels" },
        { id: "sr3", label: "Transport / Taxi", value: "Transport" },
        { id: "sr4", label: "All Services", value: "All Services" },
      ],
    },
  ],

  COMPLAINT: [
    {
      key: "bookingRef",
      ask: "I'm really sorry to hear you're facing an issue. 🙏 We take every concern seriously.\n\nCould you please share your **booking reference or order ID**?\n_(If you don't have it, that's okay — just type 'no booking ref')_",
      probe: "No worries if you don't have the reference number. Can you at least share your name or the approximate booking date so we can locate your booking?",
    },
    {
      key: "issueType",
      ask: "Thank you. Could you briefly describe the issue? 📝\n_(e.g. cancellation problem, payment not refunded, hotel quality issue, driver no-show, etc.)_",
      probe: "Please share a bit more detail — any description you provide helps us resolve this faster for you.",
    },
    {
      key: "resolution",
      ask: "What resolution are you expecting? 🎯",
      quickReplies: [
        { id: "r1", label: "Full Refund", value: "Full refund" },
        { id: "r2", label: "Partial Refund", value: "Partial refund" },
        { id: "r3", label: "Reschedule / Change Dates", value: "Reschedule" },
        { id: "r4", label: "Formal Apology", value: "Formal apology" },
        { id: "r5", label: "Other", value: "Other resolution" },
      ],
    },
  ],

  B2C: [
    {
      key: "issue",
      ask: "I'd be happy to help! 😊 Could you tell me a bit more about what you're looking for?\n_(Share your query and I'll make sure the right person gets back to you)_",
    },
  ],

  GENERAL: [
    {
      key: "issue",
      ask: "Happy to help! 😊 Please share your query and our team will get back to you with the best guidance.",
    },
  ],
};

// ─── Conversation Bridge Phrases ───────────────────────────────────────────────

const BRIDGES = [
  "Got it! ",
  "Perfect! ",
  "Great, noted! ",
  "Wonderful! ",
  "Thanks for sharing! ",
  "Understood! ",
  "Noted! ",
  "Excellent! ",
  "Lovely! ",
  "Fantastic! ",
];

function bridge(): string {
  return BRIDGES[Math.floor(Math.random() * BRIDGES.length)];
}

// ─── Intent Quick Replies ──────────────────────────────────────────────────────

const INTENT_QUICK_REPLIES: QuickReply[] = [
  { id: "q_tour",      label: "🏔️ Tour Package",           value: "Tour Package"              },
  { id: "q_hotel",     label: "🏨 Hotel Booking",           value: "Hotel Booking"             },
  { id: "q_taxi",      label: "🚗 Taxi / Transport",        value: "Taxi"                      },
  { id: "q_b2b",       label: "🤝 B2B Partnership",         value: "B2B"                       },
  { id: "q_complaint", label: "📝 Feedback / Complaint",    value: "Share Feedback or Complaint" },
  { id: "q_other",     label: "💬 Other Query",             value: "Other"                     },
];

// ─── Spam Detection ───────────────────────────────────────────────────────────

function calculateSpamScore(message: string, session: BotSession): number {
  let score = 0;
  const now = Date.now();
  const recentTs = session.messageTimestamps.filter(t => now - t < 60_000);

  if (recentTs.length > 20) score += 40;
  else if (recentTs.length > 10) score += 20;

  const lastTs = session.messageTimestamps.at(-1) ?? 0;
  const gap = now - lastTs;
  if (gap < 300 && session.messageTimestamps.length > 1) score += 35;
  else if (gap < 800 && session.messageTimestamps.length > 1) score += 10;

  const repeatCount = session.messageContents.slice(-10).filter(c => c.toLowerCase() === message.toLowerCase()).length;
  if (repeatCount >= 3) score += 40;
  else if (repeatCount >= 2) score += 20;

  const stripped = message.replace(/\s/g, "").toLowerCase();
  const vowelRatio = (stripped.match(/[aeiouaeiou]/g) || []).length / (stripped.length || 1);
  if (stripped.length > 5 && vowelRatio < 0.05) score += 25;
  if (/[bcdfghjklmnpqrstvwxyz]{6,}/i.test(message)) score += 20;
  if (/(.)\\1{4,}/.test(message)) score += 15;
  if (/^[\W\d\s]+$/.test(message)) score += 15;

  if (recentTs.length >= 5) {
    const intervals = recentTs.slice(1).map((t, i) => t - recentTs[i]);
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const std = Math.sqrt(intervals.reduce((a, b) => a + (b - avg) ** 2, 0) / intervals.length);
    if (std < 50 && recentTs.length > 8) score += 30;
  }

  if (message.trim().length < 1) score += 20;
  return Math.min(score, 100);
}

// ─── In-Memory Session Store ──────────────────────────────────────────────────

const botSessions = new Map<string, BotSession>();

setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [key, session] of botSessions.entries()) {
    if (session.lastActiveAt < cutoff) botSessions.delete(key);
  }
}, 30 * 60 * 1000);

// ─── Severe Profanity & Abusive Words Filter ────────────────────────────────────

const PROFANITY_SEVERE_LIST = [
  "fuck", "bitch", "bastard", "cunt", "motherfucker", "asshole", "dick", "pussy",
  "bc", "mc", "bhosdike", "bhosdika", "madarchod", "behenchod", "bhenchod",
  "gandmarike", "chutiye", "chutiya", "gaand", "lauda", "loda", "lode",
  "harami", "kamine", "bsdk", "mkl", "randi", "saale", "kamina", "tatti", "gand"
];

export function containsSevereProfanity(text: string): boolean {
  const normalized = text.toLowerCase().replace(/[@$!#*]/g, "a");
  const words = normalized.split(/[\s\W_]+/);
  return words.some(w => PROFANITY_SEVERE_LIST.includes(w));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getBotSession(sessionId: string): BotSession | undefined {
  return botSessions.get(sessionId);
}

export function createBotSession(sessionId: string, guestName: string, isReturning = false, lastTopic = ""): BotSession {
  const session: BotSession = {
    state: "GREETING",
    intent: null,
    questionIndex: 0,
    collectedData: {},
    guestName,
    lastAnswer: "",
    probingCount: 0,
    faqAnswered: [],
    ticketId: null,
    engagementTipsSent: [],
    engagementRound: 0,
    customizationData: {},
    customizationStep: 0,
    isReturning,
    lastTopic,
    summaryShown: false,
    messageTimestamps: [],
    messageContents: [],
    spamScore: 0,
    botPatternScore: 0,
    isFlagged: false,
    isBlocked: false,
    violationCount: 0,
    mutedUntil: null,
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  };
  botSessions.set(sessionId, session);
  return session;
}

// ─── DB Recommendations Generator ─────────────────────────────────────────────

async function fetchRecommendations(
  intent: ChatCategory | null,
  text: string,
  collectedData: Record<string, string>
): Promise<RecommendationCard[]> {
  try {
    const cards: RecommendationCard[] = [];
    if (intent === "TOUR" || !intent) {
      const packages = await db.select().from(packagesTable).limit(3);
      for (const p of packages) {
        cards.push({
          id: p.id, type: "PACKAGE", title: p.name,
          subtitle: `${p.duration || 4} Days / ${p.nights || 3} Nights`,
          location: p.cities && p.cities.length > 0 ? p.cities.join(", ") : "Top Destination",
          price: `₹${(p.pricePerPerson || 12999).toLocaleString()}`,
          originalPrice: p.originalPrice ? `₹${p.originalPrice.toLocaleString()}` : undefined,
          rating: p.rating || 4.8,
          image: p.thumbnailUrl || p.imageUrl || "/placeholder-package.jpg",
          url: `/packages/${p.slug}`,
        });
      }
    } else if (intent === "HOTEL") {
      const hotels = await db.select().from(hotelsTable).limit(3);
      for (const h of hotels) {
        cards.push({
          id: h.id, type: "HOTEL", title: h.name,
          subtitle: `${h.starRating || 4}★ Star ${h.type || "Hotel"}`,
          location: h.city || h.address || "Prime Location",
          price: `₹${(h.minPrice || 2499).toLocaleString()} / night`,
          rating: 4.7,
          image: "/placeholder-hotel.jpg",
          url: `/hotels/${h.slug}`,
        });
      }
    } else if (intent === "TAXI") {
      const vehicles = await db.select().from(transportVehiclesTable).limit(3);
      for (const v of vehicles) {
        cards.push({
          id: v.id, type: "TAXI", title: v.name,
          subtitle: `${v.seatingCapacity || 6} Seats · ${v.isAC ? "AC" : "Non-AC"}`,
          location: v.customCity || "Airport & Local Transfers",
          price: `₹16 / km`,
          rating: 4.9,
          image: "/placeholder-car.jpg",
          url: `/transport/${v.slug}`,
        });
      }
    }
    return cards;
  } catch {
    return [];
  }
}

// ─── Get a fresh engagement tip ───────────────────────────────────────────────

function getNextTip(session: BotSession): string {
  const available = ENGAGEMENT_TIPS
    .map((tip, idx) => ({ tip, idx }))
    .filter(({ idx }) => !session.engagementTipsSent.includes(idx));
  if (available.length === 0) return ENGAGEMENT_TIPS[Math.floor(Math.random() * ENGAGEMENT_TIPS.length)];
  const pick = available[Math.floor(Math.random() * available.length)];
  session.engagementTipsSent.push(pick.idx);
  return pick.tip;
}

// ─── Build Customization Summary ──────────────────────────────────────────────

function buildCustomizationNote(data: Record<string, string>): string {
  const parts: string[] = [];
  if (data.tripTheme)       parts.push(`🎯 **Theme**: ${data.tripTheme}`);
  if (data.mealPreference)  parts.push(`🍽️ **Meals**: ${data.mealPreference}`);
  if (data.specialOccasion && data.specialOccasion !== "Regular Holiday")
                            parts.push(`🎉 **Occasion**: ${data.specialOccasion}`);
  return parts.length > 0 ? parts.join("\n") : "";
}

/**
 * Main processing function — v3.0
 */
export async function processBotMessage(
  sessionId: string,
  text: string,
  guestName: string,
  isReturning = false,
  lastTopic = ""
): Promise<BotResponse> {
  let session = botSessions.get(sessionId);
  if (!session) session = createBotSession(sessionId, guestName, isReturning, lastTopic);

  session.lastActiveAt = Date.now();

  // ── 0a. Mute check ──────────────────────────────────────────────────────────
  if (session.mutedUntil && Date.now() < session.mutedUntil) {
    const remainingMs = session.mutedUntil - Date.now();
    const remainingHours = Math.ceil(remainingMs / (3600 * 1000));
    return reply(session, {
      message: `🚫 Your chat session is suspended for ${remainingHours} more hour(s) due to policy violations (inappropriate language).`,
      shouldBlock: false, shouldEscalate: false, newState: session.state,
      isMuted: true, mutedUntil: session.mutedUntil,
    });
  }

  // ── 0b. Severe Profanity → Progressive Timeout ─────────────────────────────
  if (containsSevereProfanity(text)) {
    session.violationCount = (session.violationCount || 0) + 1;
    const count = session.violationCount;
    let muteHours = count === 1 ? 6 : count === 2 ? 12 : count === 3 ? 24 : 24 * 365;
    session.mutedUntil = Date.now() + muteHours * 3600 * 1000;
    session.spamScore = 100;
    if (count >= 4) {
      session.isBlocked = true;
      return reply(session, {
        message: "🚫 Your chat access has been permanently restricted due to repeated severe policy violations. Admin review requested.",
        shouldBlock: true, shouldEscalate: true, newState: "ESCALATED",
        category: "COMPLAINT", urgency: "URGENT", isMuted: true, mutedUntil: session.mutedUntil,
      });
    }
    return reply(session, {
      message: `🚫 Chat suspended for ${muteHours} hours due to use of prohibited/offensive language (Violation Strike ${count}/3). Please maintain polite and respectful communication.`,
      shouldBlock: false, shouldEscalate: count >= 3, newState: session.state,
      isMuted: true, mutedUntil: session.mutedUntil,
    });
  }

  // ── Spam detection ─────────────────────────────────────────────────────────
  const rawSpam = calculateSpamScore(text, session);
  session.spamScore = Math.min(100, session.spamScore * 0.7 + rawSpam * 0.3 + rawSpam * 0.1);
  session.messageTimestamps = [...session.messageTimestamps.slice(-50), Date.now()];
  session.messageContents   = [...session.messageContents.slice(-20), text];

  if (session.isBlocked || session.spamScore >= 90) {
    session.isBlocked = true;
    return reply(session, {
      message: "Your session has been temporarily restricted due to unusual activity. Please contact us directly at support@sampooranholidays.com.",
      shouldBlock: true, shouldEscalate: false, newState: session.state,
    });
  }
  if (session.spamScore >= 70 && !session.isFlagged) session.isFlagged = true;

  // ── Check explicit human request ───────────────────────────────────────────
  const wantsHuman = /\b(human|agent|person|staff|real person|speak to someone|connect me|help me now|urgent|talk to|representative|manager)\b/i.test(text);

  // ── Already escalated — bot stays silent; human agent handles it ───────────
  if (session.state === "ESCALATED") {
    return reply(session, { message: "", shouldEscalate: false, shouldBlock: false, newState: "ESCALATED" });
  }

  // ── FAQ check — intercept if user asks a common question ───────────────────
  if (!["GREETING", "ESCALATED"].includes(session.state) && session.intent !== "COMPLAINT") {
    const faq = checkFAQ(text, session);
    if (faq) {
      const key = faq.patterns[0].source;
      session.faqAnswered.push(key);
      const followUp = session.state === "COLLECTING"
        ? `\n\nNow, back to your ${getDeptLabel(session.intent || "GENERAL")} requirement — ${BOT_FLOWS[session.intent || "GENERAL"][session.questionIndex]?.ask || "shall we continue?"}`
        : "\n\nIs there anything else I can help you with, or shall I connect you with one of our experts?";
      return reply(session, {
        message: faq.answer + followUp,
        quickReplies: session.state === "INTENT" ? INTENT_QUICK_REPLIES : undefined,
        shouldEscalate: false, shouldBlock: false, newState: session.state,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE MACHINE v3.0
  // ═══════════════════════════════════════════════════════════════════════════

  // ── GREETING ───────────────────────────────────────────────────────────────
  if (session.state === "GREETING") {
    const firstName = guestName.split(" ")[0];
    session.state = "INTENT";

    if (session.isReturning && session.lastTopic) {
      // Warm, personalised welcome-back for returning users
      return reply(session, {
        message: `Welcome back, **${firstName}**! 🎉 It's great to have you with us again!\n\nI see you were looking into **${session.lastTopic}** during your last visit. Shall we continue from there, or is there something new I can help you with today? 😊`,
        quickReplies: [
          { id: "continue", label: `📌 Continue — ${session.lastTopic}`, value: session.lastTopic },
          { id: "new",      label: "✨ Something New",                   value: "new query"       },
          ...INTENT_QUICK_REPLIES.slice(0, 4),
        ],
        shouldEscalate: false, shouldBlock: false, newState: "INTENT",
      });
    }

    if (session.isReturning) {
      return reply(session, {
        message: `Welcome back, **${firstName}**! 🌟 So glad to see you again!\n\nI'm Sampoorna, your personal travel concierge. What travel dream can I help make real for you today? ✈️`,
        quickReplies: INTENT_QUICK_REPLIES,
        shouldEscalate: false, shouldBlock: false, newState: "INTENT",
      });
    }

    // Fresh new user — warm professional first impression
    return reply(session, {
      message: `Hello **${firstName}**! 👋 Welcome to **Sampooran Holidays**!\n\nI'm **Sampoorna**, your personal travel concierge. I'm here to understand exactly what you're dreaming of and connect you with our travel experts who'll craft the perfect trip for you.\n\n_While our team gets ready, I'll personally collect your requirements and share some curated options — it takes less than 2 minutes!_ 😊\n\nHow can I help you today?`,
      quickReplies: INTENT_QUICK_REPLIES,
      shouldEscalate: false, shouldBlock: false, newState: "INTENT",
    });
  }

  // ── INTENT ─────────────────────────────────────────────────────────────────
  if (session.state === "INTENT") {
    // Returning user chose to continue last topic
    if (/^(continue|yes continue|same as before)/i.test(text.trim())) {
      if (session.lastTopic) {
        // Re-detect intent from last topic
        const reDetected = detectIntent(session.lastTopic) || "GENERAL";
        session.intent = reDetected;
        session.questionIndex = 0;
        session.state = "COLLECTING";
        const firstQ = BOT_FLOWS[reDetected][0];
        return reply(session, {
          message: `Picking up where we left off! 🙌 Let's find you the perfect **${getDeptLabel(reDetected)}**.\n\n${firstQ.ask}`,
          quickReplies: firstQ.quickReplies,
          shouldEscalate: false, shouldBlock: false, newState: "COLLECTING",
        });
      }
    }

    if (/new query/i.test(text.trim())) {
      return reply(session, {
        message: `Of course! What would you like to explore today? 🗺️`,
        quickReplies: INTENT_QUICK_REPLIES,
        shouldEscalate: false, shouldBlock: false, newState: "INTENT",
      });
    }

    const normalized = fuzzyNormalize(text);
    const detected = detectIntent(normalized);

    if (!detected) {
      return reply(session, {
        message: `I'd love to help! Could you let me know what kind of assistance you're looking for? Feel free to tap one of the options below or simply type your query. 😊\n\n_Pro tip: You can also ask me about visa requirements, best travel seasons, group discounts, or payment options!_`,
        quickReplies: INTENT_QUICK_REPLIES,
        shouldEscalate: false, shouldBlock: false, newState: "INTENT",
      });
    }

    session.intent = detected;
    session.questionIndex = 0;
    session.state = detected === "COMPLAINT" ? "COMPLAINT" : "COLLECTING";

    const questions = BOT_FLOWS[detected];
    const firstQ = questions[0];
    const introPhrases: Record<ChatCategory, string> = {
      TOUR:      "Wonderful! Let me help plan your perfect holiday. 🌍",
      HOTEL:     "Sure! Let me find the best accommodation for you. 🏨",
      TAXI:      "Of course! Let me arrange reliable transport for you. 🚗",
      B2B:       "Exciting! Let's explore how we can work together. 🤝",
      COMPLAINT: "",
      B2C:       "Of course! Let me get the details to connect you with the right team.",
      GENERAL:   "Happy to help! Let me get a few details.",
    };

    return reply(session, {
      message: `${introPhrases[detected]}\n\n${firstQ.ask}`,
      quickReplies: firstQ.quickReplies,
      shouldEscalate: false, shouldBlock: false,
      newState: session.state,
    });
  }

  // ── COLLECTING (or COMPLAINT) ───────────────────────────────────────────────
  if (session.state === "COLLECTING" || session.state === "COMPLAINT") {
    const intent  = session.intent!;
    const questions = BOT_FLOWS[intent];
    const currentQ  = questions[session.questionIndex];

    const isAffirmation = /^(its?\s*correct|correct|yes|yeah|yep|sure|ok|okay|right|confirm|proceed|go\s*ahead|fine|agree|done)$/i.test(text.trim());
    if (isAffirmation && !session.collectedData[currentQ.key]) {
      return reply(session, {
        message: `Great! Glad we are aligned. 😊 ${currentQ.ask}`,
        quickReplies: currentQ.quickReplies,
        shouldEscalate: false, shouldBlock: false, newState: session.state,
      });
    }

    const isVague = text.trim().length < 3 && !currentQ.optional && !currentQ.quickReplies;
    if (isVague && currentQ.probe && session.probingCount < 1) {
      session.probingCount++;
      return reply(session, {
        message: currentQ.probe,
        quickReplies: currentQ.quickReplies,
        shouldEscalate: false, shouldBlock: false, newState: session.state,
      });
    }
    session.probingCount = 0;

    if (text.trim() && !isAffirmation) session.collectedData[currentQ.key] = text.trim();
    if (wantsHuman) return escalate(session, sessionId);

    session.questionIndex++;

    // Complaint flow — always escalate at end as URGENT
    if (intent === "COMPLAINT" && session.questionIndex >= questions.length) {
      const ticketId = `SH-${Date.now().toString(36).toUpperCase()}`;
      session.ticketId = ticketId;
      session.state = "ESCALATED";
      return reply(session, {
        message: `Thank you for bringing this to our attention. 🙏\n\nYour concern has been registered with ticket number: **${ticketId}**\n\nI'm connecting you immediately with our senior support team who will personally resolve this for you.\n\n⏱️ _Typical response time: under 30 minutes. If urgent, please also call our helpline._\n\nYour patience means a lot to us.`,
        shouldEscalate: true, shouldBlock: false, newState: "ESCALATED",
        urgency: "URGENT",
      });
    }

    // After answering destination (first question for TOUR) — show "checking" excitement
    if (intent === "TOUR" && currentQ.key === "destination" && text.trim().length > 2) {
      const destination = text.trim().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      const nextQ = questions[session.questionIndex];
      const excitementMsg = `🔍 Great choice — **${destination}** is absolutely stunning!\n\n_Sampoorna is checking the best packages available for you…_\n\n${nextQ.ask}`;
      return reply(session, {
        message: excitementMsg,
        quickReplies: nextQ.quickReplies,
        shouldEscalate: false, shouldBlock: false, newState: session.state,
      });
    }

    // All other flow questions done — move to CUSTOMIZING (not direct summary)
    if (session.questionIndex >= questions.length) {
      // Move to customization if it's a TOUR (most engagement-worthy)
      if (intent === "TOUR" || intent === "HOTEL") {
        session.state = "CUSTOMIZING";
        session.customizationStep = 0;
        const custQ = CUSTOMIZATION_FLOW[0];
        const collectedSoFar = Object.keys(session.collectedData).length;
        return reply(session, {
          message: `✨ You're almost there! I've noted all your key details (${collectedSoFar} requirements captured).\n\nBefore I prepare your personalized quote, let me ask one quick thing to make this trip extra special:\n\n${custQ.ask}`,
          quickReplies: custQ.quickReplies,
          shouldEscalate: false, shouldBlock: false, newState: "CUSTOMIZING",
        });
      }

      // For other intents, go straight to summary
      session.state = "SUMMARY";
      const summary = buildSummary(session);
      const recs = await fetchRecommendations(intent, text, session.collectedData);
      session.summaryShown = true;
      return reply(session, {
        message: `Here's a quick summary of what I've noted:\n\n${summary}\n\nBelow are a few top choices curated for you! 👇\n\nShall I connect you with our **${getDeptLabel(intent)} specialist** who can finalize your custom quote? 😊`,
        recommendations: recs,
        quickReplies: [
          { id: "yes",  label: "✅ Yes, connect me!",    value: "Yes, connect me to an agent" },
          { id: "edit", label: "✏️ Edit details",         value: "I want to change something"  },
          { id: "more", label: "❓ I have a question",    value: "I have a question first"     },
        ],
        shouldEscalate: false, shouldBlock: false, newState: "SUMMARY",
      });
    }

    // Ask next question with bridge phrase
    const nextQ = questions[session.questionIndex];
    return reply(session, {
      message: `${bridge()}${nextQ.ask}`,
      quickReplies: nextQ.quickReplies,
      shouldEscalate: false, shouldBlock: false, newState: session.state,
    });
  }

  // ── CUSTOMIZING ────────────────────────────────────────────────────────────
  if (session.state === "CUSTOMIZING") {
    const custQ = CUSTOMIZATION_FLOW[session.customizationStep];
    if (custQ && text.trim()) {
      session.customizationData[custQ.key] = text.trim();
    }
    session.customizationStep++;

    const nextCustQ = CUSTOMIZATION_FLOW[session.customizationStep];

    // Still more customization questions
    if (nextCustQ) {
      return reply(session, {
        message: `${bridge()}${nextCustQ.ask}`,
        quickReplies: nextCustQ.quickReplies,
        shouldEscalate: false, shouldBlock: false, newState: "CUSTOMIZING",
      });
    }

    // Customization done — build rich summary
    const intent = session.intent!;
    const summary = buildSummary(session);
    const custNote = buildCustomizationNote(session.customizationData);
    const recs = await fetchRecommendations(intent, text, session.collectedData);
    session.state = "ENGAGING";
    session.summaryShown = true;

    // Special occasion message
    const occasion = session.customizationData.specialOccasion;
    const occasionNote = occasion && occasion !== "Regular Holiday"
      ? `\n\n🎁 **Special**: We'll arrange a lovely ${occasion.toLowerCase()} surprise for you — completely on us for selected packages!`
      : "";

    return reply(session, {
      message: `🌟 **Your Personalized Travel Plan is Ready!**\n\n**Requirements:**\n${summary}\n\n**Your Preferences:**\n${custNote}${occasionNote}\n\nHere are our top picks curated just for you! 👇\n\n_Our travel expert is reviewing your profile and will connect shortly. Meanwhile, feel free to ask me anything!_`,
      recommendations: recs,
      quickReplies: [
        { id: "yes",   label: "✅ Connect me now!",        value: "Yes, connect me to an agent" },
        { id: "tip",   label: "💡 Share a travel tip",     value: "tell me a travel tip"        },
        { id: "faq",   label: "❓ Ask a question",         value: "I have a question"           },
        { id: "more",  label: "📋 More recommendations",   value: "show me more options"        },
      ],
      shouldEscalate: false, shouldBlock: false, newState: "ENGAGING",
    });
  }

  // ── ENGAGING (10-minute hold mode) ─────────────────────────────────────────
  if (session.state === "ENGAGING") {
    const lower = text.toLowerCase().trim();

    // User wants to connect now
    if (lower.includes("yes") || lower.includes("connect") || lower.includes("agent") || lower.includes("proceed") || wantsHuman) {
      return escalate(session, sessionId);
    }

    // User wants a travel tip
    if (/\b(tip|trick|fact|trivia|tell me|know|interesting|suggest)\b/i.test(text)) {
      session.engagementRound++;
      const tip = getNextTip(session);
      const roundMsg = session.engagementRound >= 3
        ? `\n\n💬 _Our travel expert will connect with you very shortly! While you wait, here's something interesting:_`
        : "";
      return reply(session, {
        message: `${roundMsg}\n\n${tip}\n\n_Want to hear another? Or shall I connect you with our expert now?_`,
        quickReplies: [
          { id: "another", label: "💡 Another Tip!",         value: "tell me a travel tip"        },
          { id: "connect", label: "🧑 Connect me now",        value: "connect me to an agent"      },
          { id: "question", label: "❓ I have a question",    value: "I have a question"           },
        ],
        shouldEscalate: false, shouldBlock: false, newState: "ENGAGING",
      });
    }

    // User asks for more recommendations
    if (/\b(more|other|different|another|show|options|alternatives)\b/i.test(text)) {
      const recs = await fetchRecommendations(session.intent, text, session.collectedData);
      return reply(session, {
        message: `Here are more hand-picked options for you! 🎒\n\n_Each of these can be customized to your exact preferences. Our expert will walk you through the details._`,
        recommendations: recs,
        quickReplies: [
          { id: "connect", label: "✅ Connect me now!",       value: "connect me to an agent"      },
          { id: "tip",     label: "💡 Travel Tip",            value: "tell me a travel tip"        },
        ],
        shouldEscalate: false, shouldBlock: false, newState: "ENGAGING",
      });
    }

    // Check FAQ
    const faq = checkFAQ(text, session);
    if (faq) {
      const key = faq.patterns[0].source;
      session.faqAnswered.push(key);
      return reply(session, {
        message: `${faq.answer}\n\n💬 _Feel free to ask anything else! Our ${getDeptLabel(session.intent!)} expert will join shortly for detailed personalized advice._`,
        quickReplies: [
          { id: "connect", label: "✅ Connect me now!",       value: "connect me to an agent"      },
          { id: "tip",     label: "💡 Travel Tip",            value: "tell me a travel tip"        },
          { id: "another", label: "❓ Another Question",      value: "I have another question"     },
        ],
        shouldEscalate: false, shouldBlock: false, newState: "ENGAGING",
      });
    }

    // General engagement response — keep the conversation warm
    session.engagementRound++;
    const tip = getNextTip(session);

    // After 4+ rounds, nudge toward escalation
    if (session.engagementRound >= 4) {
      return reply(session, {
        message: `${bridge()}I've really enjoyed our conversation! 🌟\n\nTo give you the most accurate pricing and availability, I'd love to connect you with our specialist now — they have access to exclusive deals not listed online!\n\n${tip}`,
        quickReplies: [
          { id: "yes",     label: "✅ Yes, connect me!",      value: "connect me to an agent"      },
          { id: "later",   label: "⏳ In a few minutes",      value: "wait a bit"                  },
        ],
        shouldEscalate: false, shouldBlock: false, newState: "ENGAGING",
      });
    }

    return reply(session, {
      message: `${bridge()}💡 While our expert gets ready for you:\n\n${tip}\n\nIs there anything specific about your trip I can answer in the meantime?`,
      quickReplies: [
        { id: "another", label: "💡 Another Tip!",           value: "tell me a travel tip"        },
        { id: "connect", label: "🧑 Connect me now",          value: "connect me to an agent"      },
        { id: "faq",     label: "❓ Ask a Question",          value: "I have a question"           },
      ],
      shouldEscalate: false, shouldBlock: false, newState: "ENGAGING",
    });
  }

  // ── SUMMARY ─────────────────────────────────────────────────────────────────
  if (session.state === "SUMMARY") {
    const lower = fuzzyNormalize(text).toLowerCase();

    if (lower.includes("yes") || lower.includes("connect") || lower.includes("agent") || lower.includes("proceed") || wantsHuman) {
      return escalate(session, sessionId);
    }

    if (lower.includes("edit") || lower.includes("change") || lower.includes("wrong") || lower.includes("incorrect")) {
      session.questionIndex = 0;
      session.state = "COLLECTING";
      session.collectedData = {};
      const qs = BOT_FLOWS[session.intent!];
      return reply(session, {
        message: `No problem at all! Let's go through the details again.\n\n${qs[0].ask}`,
        quickReplies: qs[0].quickReplies,
        shouldEscalate: false, shouldBlock: false, newState: "COLLECTING",
      });
    }

    const faq = checkFAQ(text, session);
    if (faq) {
      const key = faq.patterns[0].source;
      session.faqAnswered.push(key);
      return reply(session, {
        message: `${faq.answer}\n\nOnce you're ready, our ${getDeptLabel(session.intent!)} expert can answer all your specific questions in detail. Shall I connect you now?`,
        quickReplies: [
          { id: "yes",  label: "✅ Yes, connect me!", value: "Yes, connect me to an agent" },
          { id: "more", label: "❓ More questions",   value: "I have more questions"       },
        ],
        shouldEscalate: false, shouldBlock: false, newState: "SUMMARY",
      });
    }

    return reply(session, {
      message: `That's a great question! For detailed, personalized answers, our travel specialist would be the best person to help.\n\nThey'll review your requirements and get back to you with everything you need — accurate pricing, availability, and a tailored itinerary. 🌟\n\nShall I connect you now?`,
      quickReplies: [
        { id: "yes",  label: "✅ Yes, please!",   value: "Yes, connect me to an agent" },
        { id: "wait", label: "⏳ Not yet",         value: "Not yet"                    },
      ],
      shouldEscalate: false, shouldBlock: false, newState: "SUMMARY",
    });
  }

  // Fallback
  return escalate(session, sessionId);
}

// ─── Proactive Bot Nudge (called externally for idle users) ──────────────────

/**
 * Called by the server when a user has been idle for 90+ seconds in ENGAGING state.
 * Returns a gentle proactive message to re-engage them.
 */
export function getProactiveNudge(sessionId: string): BotResponse | null {
  const session = botSessions.get(sessionId);
  if (!session) return null;
  if (!["ENGAGING", "SUMMARY", "COLLECTING", "CUSTOMIZING"].includes(session.state)) return null;

  const idleMs = Date.now() - session.lastActiveAt;
  if (idleMs < 90_000) return null; // Less than 90 seconds — no nudge yet

  session.lastActiveAt = Date.now(); // Reset so we don't spam

  const tip = getNextTip(session);
  const firstName = session.guestName.split(" ")[0];

  const nudgeMessages = [
    `👋 Hey **${firstName}**, still there? I'm keeping your spot warm! 😊\n\n${tip}\n\n_Our expert will be with you shortly. Feel free to ask me anything!_`,
    `🌟 Just checking in, **${firstName}**! Your personalized travel plan is ready and waiting.\n\n${tip}\n\n_Type "connect me" whenever you're ready to speak with our expert!_`,
    `⏰ **${firstName}**, our travel expert is on their way! To make the most of your conversation with them:\n\n${tip}\n\n_Is there anything else I can clarify while you wait?_`,
  ];

  const msgIdx = Math.min(session.engagementRound, nudgeMessages.length - 1);
  const message = nudgeMessages[msgIdx];
  session.engagementRound++;

  return reply(session, {
    message,
    quickReplies: [
      { id: "connect", label: "✅ Connect me now!",     value: "connect me to an agent"  },
      { id: "tip",     label: "💡 Another Travel Tip",  value: "tell me a travel tip"    },
    ],
    shouldEscalate: false, shouldBlock: false, newState: session.state,
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escalate(session: BotSession, sessionId: string): BotResponse {
  session.state = "ESCALATED";
  botSessions.set(sessionId, session);

  const hasData  = Object.keys(session.collectedData).length > 0;
  const hasCust  = Object.keys(session.customizationData).length > 0;
  const dept     = session.intent ? getDeptLabel(session.intent) : "Support";
  const isCompl  = session.intent === "COMPLAINT";
  const custNote = hasCust ? buildCustomizationNote(session.customizationData) : "";

  const message = isCompl
    ? `Your concern has been escalated to our senior team. 🙏\n\nTicket: **${session.ticketId || "SH-" + Date.now().toString(36).toUpperCase()}**\n\nA team member will contact you within 30 minutes.`
    : `Connecting you with our **${dept} expert** now! 🔗\n\n${hasData ? "_Your requirement details have been shared with our team so they can prepare a tailored response._\n\n" : ""}${custNote ? `_Your preferences: ${custNote}_\n\n` : ""}⏱️ _Usual response time: under 3 minutes (9 AM – 7 PM IST, Mon–Sat)_\n\nFeel free to continue typing any additional details below!`;

  return reply(session, {
    message,
    shouldEscalate: true,
    shouldBlock: false,
    newState: "ESCALATED",
    urgency: isCompl ? "URGENT" : "NORMAL",
  });
}

function buildSummary(session: BotSession): string {
  const questions = BOT_FLOWS[session.intent!];
  const data = session.collectedData;
  return questions
    .filter(q => data[q.key])
    .map(q => {
      const label = q.key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()).trim();
      return `• **${label}**: ${data[q.key]}`;
    })
    .join("\n");
}

function getDeptLabel(category: ChatCategory): string {
  const labels: Record<ChatCategory, string> = {
    TOUR:      "Tour Package",
    HOTEL:     "Hotel",
    TAXI:      "Transport",
    B2B:       "B2B Partnership",
    B2C:       "Support",
    COMPLAINT: "Senior Support",
    GENERAL:   "Support",
  };
  return labels[category] || "Support";
}

function reply(
  session: BotSession,
  overrides: Partial<BotResponse> & {
    message: string;
    shouldEscalate: boolean;
    shouldBlock: boolean;
    newState: BotState;
  }
): BotResponse {
  session.state = overrides.newState;
  const msg = overrides.message;
  return {
    isBot: true,
    message: msg,
    quickReplies: overrides.quickReplies,
    recommendations: overrides.recommendations,
    shouldEscalate: overrides.shouldEscalate,
    shouldBlock: overrides.shouldBlock,
    spamScore: Math.round(session.spamScore),
    category: (overrides as any).category || session.intent || "GENERAL",
    requirementData: { ...session.collectedData, ...session.customizationData },
    newState: overrides.newState,
    typingDelayMs: msg ? calcTypingDelay(msg) : 0,
    urgency: overrides.urgency,
    isMuted: overrides.isMuted,
    mutedUntil: overrides.mutedUntil,
  };
}

export function destroyBotSession(sessionId: string): void {
  botSessions.delete(sessionId);
}
