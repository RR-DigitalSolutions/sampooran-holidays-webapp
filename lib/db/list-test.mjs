import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_n1xbisRJ5zqX@ep-proud-grass-a1nmqtqr.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function listAssetsTest() {
  console.log("🚀 Seeding Live Hotel & Transporter into DB for UI testing...");
  try {
    const users = await sql`SELECT id FROM users WHERE email = 'admin@sampooran.com' LIMIT 1`;
    const vendorId = users[0].id;

    // 1. Insert Hotel
    const hotelName = "Royal Himalayan Oasis " + Math.floor(Math.random() * 1000);
    console.log(`🏨 Listing Hotel: ${hotelName}`);
    await sql`
      INSERT INTO hotels (owner_id, name, slug, type, star_rating, address, description, images, amenities, status, updated_at) 
      VALUES (${vendorId}, ${hotelName}, 'royal-himalayan-oasis', 'Luxury Resort', 5, 'Kufri Hills, Shimla', 'Experience unmatched luxury among the snow peaks. Perfect test listing.', '{"https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800"}', '{"Spa", "Heated Pool", "Helipad"}', 'APPROVED', NOW())
    `;

    // 2. Insert Transporter
    const transportName = "Apex Range Rovers " + Math.floor(Math.random() * 1000);
    console.log(`🚗 Listing Transporter: ${transportName}`);
    await sql`
      INSERT INTO transport_services (owner_id, name, type, capacity, price_per_day, images, features, status, updated_at)
      VALUES (${vendorId}, ${transportName}, 'Luxury SUV', 5, 8500, '{"https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800"}', '{"4x4 Capability", "Sunroof", "Chauffeur Driven"}', 'APPROVED', NOW())
    `;

    console.log("✅ Assets Live! Check http://localhost:3000/hotels and http://localhost:3000/transport");
  } catch (err) {
    console.error(err);
  }
}

listAssetsTest();
