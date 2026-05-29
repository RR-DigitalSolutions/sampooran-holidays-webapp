/**
 * Sampooran Holidays — Professional Seed Script
 * Seeds Countries, States, Destinations and one showcase Package via the Admin API.
 * Run with: npx tsx seed-destinations.ts
 */

const BASE = "http://localhost:8080/api/admin";

async function login() {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin@sampooran" }),
  });
  const data = await res.json() as any;
  if (!data.token) throw new Error("Login failed: " + JSON.stringify(data));
  console.log("✅ Logged in as", data.username);
  return data.token;
}

async function post(token: string, path: string, body: object): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch(e) {
    throw new Error(`Failed to parse JSON for ${path}. Status: ${res.status}. Body: ${text.substring(0, 500)}`);
  }
  if (!res.ok) {
    if (data.error?.includes("unique") || data.error?.includes("duplicate")) {
      console.log(`  ℹ️  Already exists, skipping: ${path}`);
      return null;
    }
    throw new Error(`POST ${path} failed: ${JSON.stringify(data)}`);
  }
  return data;
}

async function seed() {
  const token = await login();

  // ─── COUNTRIES ────────────────────────────────────────────────────────────────
  console.log("\n📍 Seeding Countries...");

  const india = await post(token, "/countries", {
    name: "India", code: "IN", slug: "india",
    description: "A land of incredible diversity — from the snow-capped Himalayas to golden beaches, ancient temples to vibrant cities.",
    capital: "New Delhi", currency: "INR", language: "Hindi, English",
    timezone: "IST (UTC+5:30)", bestTimeToVisit: "October to March",
    visaInfo: "e-Visa available for 167+ countries. On-arrival visa available at major airports.",
    highlights: ["Taj Mahal", "Himalayan Ranges", "Backwaters of Kerala", "Thar Desert", "Ancient Temples"],
    metaTitle: "India Travel Packages | Best Tours & Holidays | Sampooran Holidays",
    metaDescription: "Explore India with Sampooran Holidays. Best travel packages to Manali, Ladakh, Kashmir, Rajasthan and more. Book customized India tours at best prices.",
    metaKeywords: "India travel packages, India tours, Manali packages, Kashmir tours, Ladakh trip, Rajasthan holiday",
    isFeatured: true, isActive: true,
    faqs: [
      { question: "What is the best time to visit India?", answer: "October to March is ideal for most destinations. Summer (April–June) is best for Himalayas. Monsoon (July–Sept) is great for Kerala." },
      { question: "Do I need a visa to visit India?", answer: "Most nationalities can apply for an e-Visa online at indianvisaonline.gov.in. The process takes 3–5 business days." }
    ]
  });
  console.log("  ✅ India:", india?.id || "skipped");

  // ─── STATES ───────────────────────────────────────────────────────────────────
  console.log("\n🗺️  Seeding States...");

  if (!india?.id) {
    console.log("  ⚠️  Skipping states — India not created. Run again after clearing duplicates.");
    return;
  }

  const hp = await post(token, "/states", {
    name: "Himachal Pradesh", slug: "himachal-pradesh", countryId: india.id,
    description: "The 'Dev Bhoomi' (Land of Gods) — known for its stunning mountain passes, apple orchards, colonial hill stations, and spiritual retreats.",
    capital: "Shimla", region: "North India",
    bestTimeToVisit: "March to June / September to November",
    howToReach: "Nearest airports: Kullu–Manali Airport (Bhuntar), Shimla Airport. Well connected by road from Delhi, Chandigarh.",
    highlights: ["Rohtang Pass", "Spiti Valley", "Dalhousie", "McLeod Ganj", "Kasol"],
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    metaTitle: "Himachal Pradesh Tour Packages | Manali, Shimla, Spiti | Sampooran Holidays",
    metaDescription: "Book best Himachal Pradesh holiday packages. Explore Manali, Shimla, Kasol, Spiti Valley. Customized HP tours starting ₹8,999. Expert local guides.",
    metaKeywords: "Himachal Pradesh tour packages, Manali holiday, Shimla trip, Spiti Valley, Dharamshala",
    isFeatured: true, isActive: true,
    faqs: [
      { question: "What is the road condition in Himachal Pradesh?", answer: "Major roads like Manali Highway (NH3) are well-maintained. Mountain roads can be tricky in monsoon (July–Aug) and heavy snowfall (Dec–Feb)." },
      { question: "Can I visit Himachal in winter?", answer: "Yes! Winter (Nov–Feb) is magical for snow lovers. Manali, Kufri, and Solang Valley get heavy snowfall. Carry heavy woolens." }
    ]
  });
  console.log("  ✅ Himachal Pradesh:", hp?.id || "skipped");

  const kashmir = await post(token, "/states", {
    name: "Jammu & Kashmir", slug: "jammu-kashmir", countryId: india.id,
    description: "The 'Paradise on Earth' — lush valleys, charming houseboats, saffron fields, and some of the world's most dramatic landscapes.",
    capital: "Srinagar (Summer) / Jammu (Winter)", region: "North India (Union Territory)",
    bestTimeToVisit: "March to October",
    howToReach: "Direct flights to Srinagar from Delhi, Mumbai, Bengaluru. Road accessible via Jammu and Udhampur.",
    highlights: ["Dal Lake", "Gulmarg Gondola", "Pahalgam", "Sonamarg", "Saffron Fields of Pampore"],
    imageUrl: "https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=800",
    metaTitle: "Kashmir Tour Packages | Dal Lake, Gulmarg, Pahalgam | Sampooran Holidays",
    metaDescription: "Explore the paradise of Kashmir with Sampooran Holidays. Houseboat stays, Gulmarg skiing, Pahalgam valleys. Book customized Kashmir packages online.",
    metaKeywords: "Kashmir tour packages, Gulmarg skiing, Srinagar houseboat, Dal Lake, Pahalgam, Kashmir tour",
    isFeatured: true, isActive: true,
  });
  console.log("  ✅ Jammu & Kashmir:", kashmir?.id || "skipped");

  const ladakh = await post(token, "/states", {
    name: "Ladakh", slug: "ladakh", countryId: india.id,
    description: "The 'Land of High Passes' — a cold desert union territory with Buddhist monasteries, pristine lakes, and the world's highest motorable roads.",
    capital: "Leh", region: "North India (Union Territory)",
    bestTimeToVisit: "May to September",
    howToReach: "Direct flights to Leh (Kushok Bakula Rimpochee Airport) from Delhi, Mumbai, Srinagar. Road from Manali (Manali–Leh Highway) or Srinagar.",
    highlights: ["Pangong Tso Lake", "Khardung La Pass", "Nubra Valley", "Thikse Monastery", "Magnetic Hill"],
    imageUrl: "https://images.unsplash.com/photo-1571835535550-3dab6e4c1e83?w=800",
    metaTitle: "Ladakh Tour Packages | Leh, Pangong Lake, Nubra Valley | Sampooran Holidays",
    metaDescription: "Experience Ladakh with expert guides. Pangong Lake, Nubra Valley, Khardung La bike trips. Book best Ladakh packages at Sampooran Holidays.",
    metaKeywords: "Ladakh tour packages, Leh Ladakh trip, Pangong Lake, bike trip Ladakh, Manali Leh highway",
    isFeatured: true, isActive: true,
  });
  console.log("  ✅ Ladakh:", ladakh?.id || "skipped");

  const rajasthan = await post(token, "/states", {
    name: "Rajasthan", slug: "rajasthan", countryId: india.id,
    description: "The 'Land of Kings' — magnificent forts, golden deserts, Rajput palaces, and one of India's richest cultural heritages.",
    capital: "Jaipur", region: "West India",
    bestTimeToVisit: "October to March",
    howToReach: "Jaipur International Airport connects to major Indian cities. Well connected by train (Rajdhani, Shatabdi) and road from Delhi.",
    highlights: ["Jaipur Pink City", "Jaisalmer Desert", "Udaipur Lake Palace", "Jodhpur Blue City", "Ranthambore Tiger Reserve"],
    imageUrl: "https://images.unsplash.com/photo-1477587458883-47145ed6736c?w=800",
    metaTitle: "Rajasthan Tour Packages | Jaipur, Jodhpur, Udaipur, Jaisalmer | Sampooran Holidays",
    metaDescription: "Discover royal Rajasthan with Sampooran Holidays. Heritage hotels, camel safaris, desert camps. Book best Rajasthan holiday packages online.",
    metaKeywords: "Rajasthan tour packages, Jaipur tour, golden triangle, Udaipur trip, desert Safari Jaisalmer",
    isFeatured: true, isActive: true,
  });
  console.log("  ✅ Rajasthan:", rajasthan?.id || "skipped");

  // ─── DESTINATIONS / PLACES ────────────────────────────────────────────────────
  console.log("\n🏔️  Seeding Destinations/Places...");

  const manali = await post(token, "/destinations", {
    name: "Manali", slug: "manali", stateId: hp.id,
    description: "A breathtaking Himalayan resort town nestled in the Beas River valley — a year-round destination famous for adventure sports, snow, and stunning scenery.",
    longDescription: "Manali, sitting at an altitude of 2,050m, is the crown jewel of Himachal Pradesh. Known for its snow-covered peaks, lush green valleys, and vibrant adventure sports scene, Manali attracts honeymooners, trekkers, bikers, and nature lovers alike. The town is divided into Old Manali (backpacker haven with cafes and guesthouses) and the main Manali market. Key attractions include the famous Rohtang Pass (3,978m), Solang Valley (zero point), Hadimba Temple, and the Mall Road.",
    imageUrl: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800",
    isFeatured: true, isActive: true,
    altitude: "2,050 m (6,726 ft)", temperature: "Summer: 10–25°C | Winter: -10 to 5°C",
    bestTimeToVisit: "October–June (Snow: Dec–Feb, Greenery: Jul–Sept)",
    nearestAirport: "Kullu–Manali Airport, Bhuntar (52 km)",
    nearestRailway: "Joginder Nagar Narrow Gauge Railway (130 km) / Chandigarh (310 km)",
    distanceFromCapital: "544 km from New Delhi (12–14 hrs by road)",
    highlights: ["Rohtang Pass at 3,978m", "Solang Valley Snow Point", "Beas Kund Trek", "Old Manali Cafes", "Hadimba Devi Temple"],
    thingsToDo: ["Skiing at Solang Valley", "Paragliding over Dobhi", "River Rafting on Beas", "Snowboarding at Rohtang", "Trekking to Beas Kund", "Shopping at Mall Road", "Visit to Naggar Castle"],
    localAttractions: ["Hadimba Temple", "Manu Temple", "Naggar Castle", "Vashisht Hot Springs", "Tibetan Monastery", "Arjun Gufa"],
    activities: ["Skiing", "Snowboarding", "Paragliding", "River Rafting", "Mountain Biking", "Trekking", "Camping"],
    famousFor: ["Snow Activities", "Honeymoon Destination", "Bike Trips to Leh", "Apple Orchards", "River Rafting"],
    localCuisine: ["Dham (Himachali feast)", "Sidu (local bread)", "Chana Madra", "Bhey", "Babru", "Mittha"],
    howToReach: "By Air: Fly to Bhuntar Airport, then taxi to Manali (1.5 hrs). By Road: HRTC Volvo buses from Delhi, Chandigarh, Dharamshala. By Rail: No direct train, alight at Chandigarh then take bus.",
    travelTips: ["Carry warm clothes even in summer — evenings are cold", "Book Rohtang Pass permit online (rothanpermit.nic.in)", "Acclimatize for 1 day if going to Rohtang directly", "Carry cash — ATMs can be unreliable in season"],
    safetyInfo: "Generally very safe. Avoid Rohtang Pass in heavy snowfall or rain. Follow NDMA guidelines for high-altitude treks. Carry altitude sickness medication.",
    latitude: "32.2396", longitude: "77.1887",
    metaTitle: "Manali Tour Packages 2025 | Rohtang Pass, Solang Valley | Sampooran Holidays",
    metaDescription: "Book best Manali tour packages from Delhi. Volvo, Innova, Tempo Traveller. Rohtang Pass, Solang Valley, Hadimba Temple. All-inclusive packages from ₹7,499.",
    metaKeywords: "Manali tour package, Manali Volvo package, Rohtang Pass permit, Solang Valley, Manali honeymoon, Manali trip from Delhi",
    schemaType: "TouristDestination",
    faqs: [
      { question: "Is Manali safe for solo female travelers?", answer: "Yes, Manali is considered safe. Old Manali and tourist areas are well-patrolled. Always carry emergency numbers and inform your hotel of your plans." },
      { question: "When does Rohtang Pass open?", answer: "Rohtang Pass typically opens in May (after snowmelt) and closes in November. Permits are required and must be booked online or through a registered tour operator." },
      { question: "How many days are enough for Manali?", answer: "4–5 days is ideal: 1 day arrival + local sightseeing, 1 day Rohtang/Solang, 1 day Old Manali + Vashisht, 1 day leisure/shopping, 1 day departure." },
      { question: "What is the best mode of transport to reach Manali?", answer: "HRTC Volvo buses from Delhi (ISBT Kashmere Gate) are popular (overnight, ₹900–1500). Self-drive via NH3 is also scenic. Flying to Bhuntar is fastest." }
    ]
  });
  console.log("  ✅ Manali:", manali?.id || "skipped");

  const gulmarg = await post(token, "/destinations", {
    name: "Gulmarg", slug: "gulmarg", stateId: kashmir.id,
    description: "Asia's premier ski resort and a meadow of flowers — Gulmarg enchants visitors with its world-class gondola, winter snow, and stunning views of Nanga Parbat.",
    imageUrl: "https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=800",
    isFeatured: true, isActive: true,
    altitude: "2,650 m (8,694 ft)", temperature: "Summer: 5–20°C | Winter: -15 to 2°C",
    bestTimeToVisit: "December–February (Skiing) | April–June (Sightseeing)",
    nearestAirport: "Sheikh ul-Alam International Airport, Srinagar (56 km)",
    distanceFromCapital: "544 km from New Delhi via Srinagar",
    highlights: ["Gulmarg Gondola (Phase 1 & 2)", "Ski slopes", "Kongdori Valley", "St. Mary's Church", "Strawberry Valley"],
    thingsToDo: ["Skiing & Snowboarding", "Gondola Ride to 3,980m", "Horse Riding", "Snow Trekking", "Photography"],
    activities: ["Skiing", "Snowboard", "Gondola Ride", "Trekking", "Photography"],
    famousFor: ["Best Ski Resort in India", "Gondola Ride", "Snow Sports", "Views of Nanga Parbat"],
    localCuisine: ["Wazwan multi-course feast", "Rogan Josh", "Yakhni", "Noon Chai (pink tea)", "Harissa"],
    howToReach: "Fly to Srinagar, then hire a taxi to Gulmarg (1.5–2 hrs). No public transport directly to Gulmarg.",
    metaTitle: "Gulmarg Tour Packages | Kashmir Skiing & Gondola | Sampooran Holidays",
    metaDescription: "Explore Gulmarg with Sampooran Holidays — Asia's top ski resort. Book gondola, ski lessons, and snow activities. Kashmir packages from ₹12,999.",
    metaKeywords: "Gulmarg tour, Gulmarg skiing, Gulmarg gondola, Kashmir winter package, snow activities Gulmarg",
    latitude: "34.0494", longitude: "74.3800",
    faqs: [
      { question: "Is prior skiing experience required at Gulmarg?", answer: "No. Gulmarg has slopes for beginners, intermediate, and advanced skiers. Ski schools and certified instructors are available for beginners." },
      { question: "What is the best time to ski in Gulmarg?", answer: "December to February offers the best skiing conditions with fresh powder snow. January is peak skiing month." }
    ]
  });
  console.log("  ✅ Gulmarg:", gulmarg?.id || "skipped");

  const leh = await post(token, "/destinations", {
    name: "Leh", slug: "leh", stateId: ladakh.id,
    description: "The capital of Ladakh — a high-altitude desert town surrounded by barren mountains, ancient monasteries, and the serene Indus River.",
    imageUrl: "https://images.unsplash.com/photo-1571835535550-3dab6e4c1e83?w=800",
    isFeatured: true, isActive: true,
    altitude: "3,524 m (11,562 ft)", temperature: "Summer: 3–25°C | Winter: -20 to -5°C",
    bestTimeToVisit: "May to September",
    nearestAirport: "Kushok Bakula Rimpochee Airport, Leh (4 km from city center)",
    distanceFromCapital: "1,077 km from New Delhi (38 hrs by road via Manali or 90 min by air)",
    highlights: ["Pangong Tso Lake (4,350m)", "Khardung La Pass (5,359m)", "Nubra Valley & Bactrian Camels", "Thikse Monastery", "Magnetic Hill"],
    thingsToDo: ["Bike Trip to Khardung La", "Visit Pangong Lake", "Camel Safari in Nubra", "Monastery Hopping", "Zanskar River Rafting"],
    activities: ["Bike Trip", "Trekking", "River Rafting", "Camping", "Buddhist monastery visits"],
    famousFor: ["World's Highest Motorable Roads", "Pangong Lake", "Monastery Circuit", "Bike Trips"],
    howToReach: "By Air: Direct flights from Delhi, Mumbai, Chandigarh (IndiGo, Air India). By Road: Manali–Leh Highway (2 days, opens May). Srinagar–Leh Highway (2 days).",
    travelTips: ["Acclimatize for 2 full days before venturing to high passes", "Carry Diamox for altitude sickness prevention", "Inner Line Permit required for Nubra, Pangong, Tso Moriri", "Fuel up in Leh — no pumps beyond"],
    safetyInfo: "High altitude destination (3,524m+). Risk of Acute Mountain Sickness (AMS). Do not fly directly from sea-level without acclimatization. Keep hydrated.",
    metaTitle: "Leh Ladakh Tour Packages 2025 | Pangong, Nubra, Khardung La | Sampooran Holidays",
    metaDescription: "Book Leh Ladakh tour packages from Delhi. 7-day, 10-day itineraries covering Pangong Lake, Nubra Valley, Khardung La. Expert guides. Group & private tours.",
    metaKeywords: "Leh Ladakh tour, Pangong Lake trip, Ladakh bike trip, Nubra Valley tour, Ladakh package from Delhi",
    latitude: "34.1526", longitude: "77.5771",
    faqs: [
      { question: "Do I need a permit for Ladakh?", answer: "Indian nationals need Inner Line Permits (ILP) for restricted areas like Nubra Valley, Pangong Tso, and Tso Moriri. Foreign nationals need a Protected Area Permit (PAP)." },
      { question: "How do I avoid altitude sickness in Leh?", answer: "Rest for 2 days on arrival. Drink 3–4L water daily. Avoid alcohol for first 48 hrs. Carry Diamox (consult doctor). Descend immediately if severe symptoms appear." }
    ]
  });
  console.log("  ✅ Leh:", leh?.id || "skipped");

  const jaipur = await post(token, "/destinations", {
    name: "Jaipur", slug: "jaipur", stateId: rajasthan.id,
    description: "The 'Pink City' and capital of Rajasthan — a royal city of magnificent forts, opulent palaces, vibrant bazaars, and world-class heritage hotels.",
    imageUrl: "https://images.unsplash.com/photo-1477587458883-47145ed6736c?w=800",
    isFeatured: true, isActive: true,
    altitude: "431 m (1,414 ft)", temperature: "Summer: 20–42°C | Winter: 5–25°C",
    bestTimeToVisit: "October to March",
    nearestAirport: "Jaipur International Airport (12 km from city center)",
    distanceFromCapital: "281 km from New Delhi (5–6 hrs by road/train)",
    highlights: ["Amber Fort", "Hawa Mahal", "City Palace", "Jantar Mantar (UNESCO)", "Nahargarh Fort"],
    thingsToDo: ["Elephant Ride at Amber Fort", "Shopping at Johari Bazaar", "Light & Sound Show", "Rajasthani cooking class", "Visit Jal Mahal"],
    activities: ["Heritage walk", "Hot air balloon", "Camel ride", "Cooking class", "Shopping"],
    famousFor: ["Pink City Architecture", "Gemstones & Jewelry", "Block Printing", "Rajasthali Handicrafts", "Golden Triangle Tour"],
    localCuisine: ["Dal Baati Churma", "Laal Maas", "Ghevar", "Pyaaz Kachori", "Rajasthali Thali"],
    howToReach: "By Air: Jaipur Airport connected to Delhi, Mumbai, Bengaluru. By Train: Shatabdi Express from Delhi (4.5 hrs). By Road: NH48 highway, well connected.",
    metaTitle: "Jaipur Tour Packages | Pink City Heritage Tours | Sampooran Holidays",
    metaDescription: "Explore royal Jaipur with Sampooran Holidays. Visit Amber Fort, Hawa Mahal, City Palace. Book Jaipur day tours and Rajasthan holiday packages.",
    metaKeywords: "Jaipur tour package, Pink City tours, Amber Fort visit, Rajasthan heritage, golden triangle tour",
    latitude: "26.9124", longitude: "75.7873",
    faqs: [
      { question: "How many days are ideal for Jaipur?", answer: "2–3 days is perfect. Day 1: Amber Fort, Nahargarh, Jal Mahal. Day 2: City Palace, Hawa Mahal, Jantar Mantar, Bazaars. Day 3: Day trip to Abhaneri or Ranthambore." },
      { question: "Is Jaipur safe for tourists?", answer: "Yes, Jaipur is very tourist-friendly. Stick to registered rickshaws, avoid sharing auto-rickshaws at night, and use hotel-recommended guides." }
    ]
  });
  console.log("  ✅ Jaipur:", jaipur?.id || "skipped");

  // ─── PACKAGE ──────────────────────────────────────────────────────────────────
  console.log("\n📦 Seeding Professional Package...");

  if (!manali?.id) {
    console.log("  ⚠️  Skipping package — Manali destination not found.");
    return;
  }

  const pkg = await post(token, "/packages", {
    name: "Manali Honeymoon Special — Snow, Romance & Adventure",
    slug: "manali-honeymoon-special-5d4n",
    destinationId: manali.id,
    destinationIds: [manali.id],
    category: "Honeymoon",
    duration: 5,
    nights: 4,
    pricePerPerson: 14999,
    originalPrice: 19999,
    discountPercent: 25,
    imageUrl: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800",
    packageType: "both",
    isFeatured: true,
    isTrending: true,
    rating: 4.8,
    reviewCount: 127,
    tourType: "Private",
    groupSize: "2 Persons (Couple)",
    pickupPoint: "Chandigarh / Delhi (Volvo drop-off)",
    shortDescription: "5 Days / 4 Nights romantic getaway to Manali — snow activities, luxurious stays, candlelit dinners and thrilling experiences for couples.",
    longDescription: `Experience the magic of the Himalayas on your honeymoon! This carefully curated 5D/4N Manali package is designed exclusively for couples who want the perfect blend of romance, adventure, and mountain tranquility.

From the moment you arrive, you'll be wrapped in luxury — stay at hand-picked boutique resorts with valley views, enjoy couple spa treatments, and dine under the stars with mountain views. During the day, your private car and guide will take you to Rohtang Pass (snow activities), Solang Valley (paragliding & skiing), the serene Hadimba Temple, and the charming Old Manali cafes.

Every detail is taken care of — decorated room on arrival, complimentary welcome drinks, romantic candlelight dinner, and memory-filled experiences that will last a lifetime.`,

    highlights: [
      "Rohtang Pass Snow Adventure (Subject to permit availability)",
      "Solang Valley Paragliding & Zorbing",
      "Decorated Room on Arrival with Welcome Drinks",
      "Romantic Candlelight Dinner with Himalayan View",
      "Hadimba Temple & Mall Road Sightseeing",
      "Old Manali Cafe Hopping & Local Market",
      "Private Vehicle for All Transfers"
    ],

    cities: ["Manali", "Solang Valley", "Rohtang Pass"],

    tags: ["honeymoon", "couple", "snow", "adventure", "manali", "himachal", "romantic", "private"],

    inclusions: [
      "4 Nights accommodation in 3-Star deluxe/boutique hotel",
      "Daily breakfast + welcome dinner (Day 1)",
      "Romantic candlelight dinner (1 night)",
      "Room decoration on arrival with flowers & balloons",
      "Private cab (Innova/Ertiga) for all sightseeing",
      "Rohtang Pass permit fee (if applicable)",
      "Snow activities at Solang Valley (Zorbing)",
      "Local guide for Manali sightseeing",
      "All toll taxes, driver allowance, parking charges",
      "24x7 customer support"
    ],

    exclusions: [
      "Airfare / train tickets to Chandigarh or Manali",
      "Paragliding, horse riding, and other paid adventure activities",
      "Personal expenses and shopping",
      "Travel insurance (highly recommended)",
      "Rohtang Pass jeep rental (charged separately ~₹3,500/jeep)",
      "Any activity/service not mentioned in inclusions",
      "GST (5%) applicable on the total package cost"
    ],

    importantNotes: [
      "Rohtang Pass is subject to NGT permit availability and weather — alternate sightseeing will be arranged if closed",
      "Carry government ID proof (Aadhaar/Passport) for all guests",
      "Hotel check-in at 2:00 PM; check-out at 11:00 AM",
      "Package is valid for 2 adults — extra person charges apply",
      "Advance booking of 7 days required for hotel decoration"
    ],

    cancellationPolicy: `30+ days before: Full refund minus ₹2,000 processing fee.
15–30 days before: 50% refund on package cost.
7–14 days before: 25% refund.
Less than 7 days: No refund.
No-show: No refund.
Changes (date/hotel): ₹1,500 amendment fee (subject to availability).`,

    itinerary: [
      {
        day: 1, title: "Arrival in Manali — Check-in & Mall Road",
        description: "Arrive at Manali (transferred from Volvo drop-point). Check into your beautifully decorated hotel room. Freshen up and explore the famous Mall Road, Hadimba Temple, and the local market. Evening romantic candlelight dinner at a valley-view restaurant. Overnight stay in Manali.",
        meals: ["Welcome Drinks", "Dinner"], accommodation: "3-Star Boutique Hotel, Manali",
        activities: ["Mall Road walk", "Hadimba Temple", "Hotel Room Decoration"]
      },
      {
        day: 2, title: "Solang Valley — Adventure & Snow Day",
        description: "Post breakfast, drive to Solang Valley (14 km) — the adventure hub of Manali. Enjoy zorbing, snow tubing, rope activities (subject to season), and optional paragliding over the lush valley (₹2,500 extra). Return to Manali by afternoon and relax with a couple spa treatment at the hotel.",
        meals: ["Breakfast"], accommodation: "3-Star Boutique Hotel, Manali",
        activities: ["Zorbing", "Paragliding (optional)", "Snow Activities", "Couple Spa"]
      },
      {
        day: 3, title: "Rohtang Pass — Top of the World",
        description: "Early morning drive to Rohtang Pass (3,978m) — one of the most iconic Himalayan mountain passes. Experience surreal snow landscapes, glacier views, and take stunning photos. Rohtang Pass permit must be booked in advance (included). Jeep rental at Rohtang charged separately. Return by 3 PM as per NGT guidelines. Evening at leisure in Old Manali.",
        meals: ["Breakfast"], accommodation: "3-Star Boutique Hotel, Manali",
        activities: ["Rohtang Pass Snow", "Glacier viewpoint", "Old Manali Cafe"]
      },
      {
        day: 4, title: "Vashisht Hot Springs & Naggar Castle",
        description: "Day at leisure. Visit the Vashisht Village hot water springs (natural geothermal) — a great way to relax aching muscles! Explore Naggar Castle (15th century) for panoramic valley views. Afternoon: shopping on Mall Road for pashmina shawls, dry fruits, and Himachali woolens. Special candlelight dinner at your hotel's private terrace.",
        meals: ["Breakfast", "Special Candlelight Dinner"], accommodation: "3-Star Boutique Hotel, Manali",
        activities: ["Vashisht Hot Springs", "Naggar Castle", "Mall Road Shopping", "Candlelight Dinner"]
      },
      {
        day: 5, title: "Departure — Take the Mountains Home",
        description: "Post breakfast check-out. Transfer to Volvo pick-up point / bus stand / airport. Bid farewell to the mountains with a heart full of memories! Drive carefully on mountain roads or take the scenic Chandigarh Volvo.",
        meals: ["Breakfast"], accommodation: "",
        activities: ["Hotel Check-out", "Transfer to bus/airport"]
      }
    ],

    hotels: [
      { city: "Manali", hotelName: "The White Meadows Hotel", category: "3-Star Boutique", nights: 4, roomType: "Deluxe Valley View Room", imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400" }
    ],

    faqs: [
      { question: "Is this package available year-round?", answer: "Yes! Winter (Dec–Feb) = snowfall & skiing. Summer (Mar–Jun) = greenery & Rohtang. Monsoon (Jul–Sept) = Rohtang may close but valley is lush." },
      { question: "Can I customize this package?", answer: "Absolutely! Add extra nights, upgrade hotel to 4-star, add a side trip to Kasol or Kheerganga. Contact our team for custom quotes." },
      { question: "Is the package for couples only?", answer: "This specific package is designed for 2 persons. For family or group bookings, we have separate packages with adjusted pricing." },
      { question: "What documents do we need to carry?", answer: "Valid government ID proof (Aadhaar Card or Passport) for all guests. Required for hotel check-in and Rohtang Pass permit." }
    ]
  });
  console.log("  ✅ Package 'Manali Honeymoon Special':", pkg?.id || "skipped");

  console.log("\n🎉 Seeding Complete!");
  console.log("   🌏 Countries: 1 (India)");
  console.log("   🗺️  States: 4 (Himachal Pradesh, J&K, Ladakh, Rajasthan)");
  console.log("   📍 Destinations: 4 (Manali, Gulmarg, Leh, Jaipur)");
  console.log("   📦 Packages: 1 (Manali Honeymoon Special)");
  console.log("\n   👉 Admin: http://localhost:5173/destinations");
  console.log("   👉 Package: http://localhost:5173/packages");
  console.log("   👉 Website: http://localhost:3000/packages/manali-honeymoon-special-5d4n");
}

seed().catch(e => {
  console.error("❌ Seed failed:", e.message);
  process.exit(1);
});
