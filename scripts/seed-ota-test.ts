/**
 * Sampooran Holidays — Advanced Content Seed Script
 * Seeds Countries, States, and Destinations with high-quality content.
 * Features: Nepal, Bali, Thailand, Maldives, Himachal, Uttarakhand.
 * Run with: npx tsx seed-ota-test.ts
 */
import "dotenv/config";

const BASE = "http://localhost:8080/api/admin";
const CONTACT_PHONE = "8595513009";

async function login() {
  const username = process.env.ADMIN_EMAIL || process.env.ADMIN_NAME || "admin";
  const password = process.env.ADMIN_PASS || "admin@sampooran";
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json() as any;
  if (!data.token) throw new Error("Login failed: " + JSON.stringify(data));
  return data.token;
}

async function get(token: string, path: string): Promise<any[]> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await res.json();
}

async function patch(token: string, path: string, body: object): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return await res.json();
}

async function postOrUpdate(token: string, path: string, body: any, existingItems: any[]): Promise<any> {
  const existing = existingItems.find(item => item.slug === body.slug);
  if (existing) {
    console.log(`  Updating existing: ${body.slug}`);
    return await patch(token, `${path}/${existing.id}`, body);
  }
  
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch(e) { throw new Error(`POST ${path} failed. Status: ${res.status}. Body: ${text.substring(0, 100)}`); }
  
  if (!res.ok) {
    throw new Error(`POST ${path} failed: ${JSON.stringify(data)}`);
  }
  return data;
}

async function seed() {
  const token = await login();
  console.log("🚀 Starting Advanced Content Seeding...");

  // ─── COUNTRIES ────────────────────────────────────────────────────────────────
  const existingCountries = await get(token, "/countries");
  const countries = [
    { name: "India", code: "IN", slug: "india", displayOrder: 1, isFeatured: true, description: "Discover the magic of India — from the peaks of the Himalayas to the backwaters of Kerala. For bookings, call us at " + CONTACT_PHONE + "." },
    { name: "Nepal", code: "NP", slug: "nepal", displayOrder: 2, isFeatured: true, description: "The roof of the world. Explore ancient temples and the mighty Everest. Expert guides available at " + CONTACT_PHONE + "." },
    { name: "Indonesia", code: "ID", slug: "indonesia", displayOrder: 3, isFeatured: true, description: "Home to Bali, the Island of Gods. Crystal waters and lush jungles await. Reach us at " + CONTACT_PHONE + " for custom Bali trips." },
    { name: "Thailand", code: "TH", slug: "thailand", displayOrder: 4, isFeatured: true, description: "The Land of Smiles. Vibrant markets, stunning beaches, and world-class hospitality. Book now: " + CONTACT_PHONE + "." },
    { name: "Maldives", code: "MV", slug: "maldives", displayOrder: 5, isFeatured: true, description: "Pure luxury. Turquoise lagoons and private overwater villas. Experience paradise with a call to " + CONTACT_PHONE + "." }
  ];

  const countryIds: Record<string, number> = {};
  for (const c of countries) {
    const res = await postOrUpdate(token, "/countries", { ...c, isActive: true }, existingCountries);
    countryIds[c.slug] = res.id;
    console.log(`🌍 Country: ${c.name}`);
  }

  // ─── STATES ───────────────────────────────────────────────────────────────────
  const existingStates = await get(token, "/states");
  const states = [
    { name: "Himachal Pradesh", slug: "himachal-pradesh", countryId: countryIds["india"], displayOrder: 1, isFeatured: true, description: "Dev-Bhoomi: The land of mountains and tranquility. For Shimla/Manali tours, call " + CONTACT_PHONE + "." },
    { name: "Uttarakhand", slug: "uttarakhand", countryId: countryIds["india"], displayOrder: 2, isFeatured: true, description: "The spiritual heart of India. Rishikesh, Mussoorie, and the Char Dham. Contact " + CONTACT_PHONE + " for pilgrimage and adventure." },
    { name: "Bali Province", slug: "bali", countryId: countryIds["indonesia"], displayOrder: 1, isFeatured: true, description: "The ultimate tropical getaway. Explore Ubud, Seminyak, and Uluwatu." },
    { name: "Bagmati Province", slug: "bagmati", countryId: countryIds["nepal"], displayOrder: 1, isFeatured: true, description: "The cultural heart of Nepal, featuring Kathmandu Valley." }
  ];

  const stateIds: Record<string, number> = {};
  for (const s of states) {
    const res = await postOrUpdate(token, "/states", { ...s, isActive: true }, existingStates);
    stateIds[s.slug] = res.id;
    console.log(`🗺️  State: ${s.name}`);
  }

  // ─── DESTINATIONS ─────────────────────────────────────────────────────────────
  const existingDests = await get(token, "/destinations");
  const destinations = [
    // Himachal
    { name: "Manali", slug: "manali", stateId: stateIds["himachal-pradesh"], displayOrder: 1, isFeatured: true, isActive: true, 
      description: "A breathtaking Himalayan resort town nestled in the Beas River valley. Perfect for adventure and honeymooners.",
      longDescription: "Manali is India's premier mountain destination, offering a mix of adventure and spiritual tranquility. From the snow-capped Rohtang Pass to the ancient Hadimba Temple, every corner is a discovery. Book your private Volvo package with Sampooran Holidays at " + CONTACT_PHONE + ".",
      imageUrl: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800",
      highlights: ["Rohtang Pass", "Solang Valley", "Old Manali Cafes", "Beas River Rafting"],
      bestTimeToVisit: "October to June", activities: ["Skiing", "Paragliding", "Trekking"],
      faqs: [{ question: "Is Manali safe for couples?", answer: "Yes, Manali is very safe and is India's top honeymoon destination. Call " + CONTACT_PHONE + " for customized couple packages." }]
    },
    { name: "Shimla", slug: "shimla", stateId: stateIds["himachal-pradesh"], displayOrder: 2, isFeatured: true, isActive: true, 
      description: "The Queen of Hills. Famous for British colonial architecture and the historic toy train.",
      imageUrl: "https://images.unsplash.com/photo-1597079910443-60c43ca4f02f?w=800",
      highlights: ["The Ridge", "Mall Road", "Jakhu Temple", "Kalka-Shimla Toy Train"],
      bestTimeToVisit: "March to May / October to December"
    },
    { name: "Dharamshala", slug: "dharamshala", stateId: stateIds["himachal-pradesh"], displayOrder: 3, isFeatured: true, isActive: true, 
      description: "Spiritual home of the Dalai Lama. Peace, monasteries, and stunning views of the Dhauladhar range.",
      imageUrl: "https://images.unsplash.com/photo-1526481280693-3bfa7563ee0c?w=800",
      highlights: ["McLeod Ganj", "Namgyal Monastery", "Bhagsunag Falls", "Cricket Stadium"],
      faqs: [{ question: "How to reach Dharamshala?", answer: "Gaggal Airport is the nearest. We provide private cabs from Chandigarh at " + CONTACT_PHONE + "." }]
    },
    // Uttarakhand
    { name: "Rishikesh", slug: "rishikesh", stateId: stateIds["uttarakhand"], displayOrder: 1, isFeatured: true, isActive: true, 
      description: "Yoga Capital of the World. A perfect blend of spirituality and adventure.",
      imageUrl: "https://images.unsplash.com/photo-1545105511-9210901e16db?w=800",
      highlights: ["Laxman Jhula", "Ram Jhula", "Ganga Aarti", "River Rafting"],
      activities: ["River Rafting", "Bungee Jumping", "Yoga", "Meditation"]
    },
    { name: "Mussoorie", slug: "mussoorie", stateId: stateIds["uttarakhand"], displayOrder: 2, isFeatured: true, isActive: true, 
      description: "The Queen of Malibar. Stunning viewpoints and the famous Camel Back Road.",
      imageUrl: "https://images.unsplash.com/photo-1634305417949-6f43277028ed?w=800",
      highlights: ["Kempty Falls", "Mall Road", "Gun Hill", "Lal Tibba"]
    },
    // Nepal
    { name: "Kathmandu", slug: "kathmandu", stateId: stateIds["bagmati"], displayOrder: 1, isFeatured: true, isActive: true, 
      description: "A city of temples and heritage. The cultural heartbeat of Nepal.",
      imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800",
      highlights: ["Pashupatinath Temple", "Boudhanath Stupa", "Durbar Square", "Swayambhunath"]
    },
    // Bali
    { name: "Ubud", slug: "ubud", stateId: stateIds["bali"], displayOrder: 1, isFeatured: true, isActive: true, 
      description: "The cultural hub of Bali. Rice terraces, artisans, and tropical serenity.",
      imageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800",
      highlights: ["Monkey Forest", "Tegalalang Rice Terrace", "Ubud Royal Palace"]
    },
    // Thailand
    { name: "Phuket", slug: "phuket", countryId: countryIds["thailand"], displayOrder: 1, isFeatured: true, isActive: true, 
      description: "Thailand's largest island. Pristine beaches, vibrant nightlife, and luxury resorts.",
      imageUrl: "https://images.unsplash.com/photo-1589394815804-964ed9be2eb3?w=800",
      highlights: ["Patong Beach", "Big Buddha", "Phi Phi Islands Tour"],
      faqs: [{ question: "When is the best time for Phuket?", answer: "November to April is the dry season, perfect for beach activities. Book with us at " + CONTACT_PHONE + "." }]
    },
    // Maldives
    { name: "Male Atoll", slug: "male-atoll", countryId: countryIds["maldives"], displayOrder: 1, isFeatured: true, isActive: true, 
      description: "The gateway to Maldivian paradise. Crystal clear lagoons and white sand beaches.",
      imageUrl: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800",
      highlights: ["Overwater Villas", "Snorkeling", "Sunset Cruises", "Underwater Dining"]
    }
  ];

  for (const d of destinations) {
    const res = await postOrUpdate(token, "/destinations", d, existingDests);
    console.log(`🏔️  Destination: ${d.name}`);
  }

  console.log("\n✅ Seeding Complete! Call " + CONTACT_PHONE + " for website support.");
}

seed().catch(e => { console.error("❌ Error:", e.message); process.exit(1); });
