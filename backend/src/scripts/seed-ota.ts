import { db, usersTable, hotelsTable, transportServicesTable, inquiriesTable, bookingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seedLiveTest() {
  console.log("🌱 Seeding Live Test OTA Data (Backend Context)...");

  try {
    // 1. Create a Test Vendor (if doesn't exist)
    const email = "partner@solang.com";
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    
    let vendorId;
    if (!existing) {
      const passwordHash = await bcrypt.hash("password123", 12);
      const referralCode = "TEST" + Math.random().toString(36).substring(2, 7).toUpperCase();
      const [vendor] = await db.insert(usersTable).values({
        name: "Solang Valley Suites",
        email: email,
        passwordHash: passwordHash,
        role: "HOTEL_OWNER",
        vendorVerified: true,
        referralCode: referralCode,
        isFirstLogin: false
      }).returning();
      vendorId = vendor.id;
      console.log("✅ Created new test vendor");
    } else {
      vendorId = existing.id;
      console.log("ℹ️ Test vendor already exists");
    }

    // 2. Create an Approved Hotel
    const hotelSlug = "grand-solang-luxury-resort";
    const [existingHotel] = await db.select().from(hotelsTable).where(eq(hotelsTable.slug, hotelSlug)).limit(1);
    
    if (!existingHotel) {
      await db.insert(hotelsTable).values({
        ownerId: vendorId,
        name: "Grand Solang Luxury Resort",
        slug: hotelSlug,
        type: "Luxury Resort",
        starRating: 5,
        address: "Solang Valley, Manali, HP",
        description: "A premium resort offering the best views of the Solang slopes. Handpicked for enterprise travelers.",
        images: ["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200"],
        amenities: JSON.stringify(["Spa", "Ski-in/Ski-out", "Fine Dining", "Organic Garden"]),
        status: "APPROVED"
      });
      console.log("✅ Created Grand Solang Luxury Resort");
    }

    // 3. Create an Approved Transport service
    const transportName = "Luxury Himachal Limos";
    const [existingTransport] = await db.select().from(transportServicesTable).where(eq(transportServicesTable.name, transportName)).limit(1);

    if (!existingTransport) {
      await db.insert(transportServicesTable).values({
        ownerId: vendorId,
        name: transportName,
        type: "SUV",
        capacity: 7,
        pricePerDay: 5500,
        images: ["https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800"],
        features: JSON.stringify(["Leather Seats", "Professional Driver", "Stocked Minibar"]),
        status: "APPROVED"
      });
      console.log("✅ Created Luxury Himachal Limos service");
    }

    // 4. Create an Inquiry
    await db.insert(inquiriesTable).values({
      name: "Raman Singh",
      email: "raman@example.com",
      phone: "9876543210",
      vendorId: vendorId,
      message: "Looking for a luxury stay for 3 nights in June.",
      status: "PENDING"
    });
    console.log("✅ Created sample Inquiry");

    // 5. Create a Mock Booking
    await db.insert(bookingsTable).values({
      userId: vendorId,
      vendorId: vendorId,
      bookingType: "HOTEL",
      assetId: 1, 
      totalAmount: 16500,
      status: "CONFIRMED"
    });
    console.log("✅ Created sample Booking");

    console.log("✨ Live Test Data Seeded successfully!");
    process.exit(0);
  } catch (e) {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  }
}

seedLiveTest();
