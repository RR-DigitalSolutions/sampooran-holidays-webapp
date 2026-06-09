import "dotenv/config";
import { eq } from 'drizzle-orm';
import { db, usersTable, hotelsTable, transportServicesTable } from './lib/db/src/index.ts';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const API_URL = "http://localhost:8080/api";

async function runTest() {
  console.log("🚀 Starting OTA Listing Live API Test...");

  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@sampooran.com";
    const password = process.env.ADMIN_PASS || "admin@sampooran";

    console.log("🔐 Authenticating Admin Backend Flow...");
    const adminLoginRes = await fetch(`${API_URL}/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: adminEmail, password: password })
    });

    if (!adminLoginRes.ok) {
        throw new Error("Admin login failed. Please verify credentials." + await adminLoginRes.text());
    }
    const adminData = await adminLoginRes.json();
    const adminToken = adminData.token;
    console.log("✅ Admin Logged in successfully.");

    // 2. Setup a new test vendor directly in DB (simulating sign up)
    const testVendorEmail = `testvendor_${Date.now()}@example.com`;
    const pwdHash = await bcrypt.hash("vendorpass123", 10);
    const [vendor] = await db.insert(usersTable).values({
        name: "Test Valley Vendor",
        email: testVendorEmail,
        passwordHash: pwdHash,
        role: "HOTEL_OWNER",
        vendorVerified: true
    }).returning();
    console.log("👤 Test Vendor created:", vendor.email);

    // Provide token manually for Vendor since Vendor API uses the same JWT auth
    const vendorToken = jwt.sign(
        { id: vendor.id, email: vendor.email, role: vendor.role },
        process.env.JWT_SECRET || "sh_enterprise_secret_2026_unicorn_scale",
        { expiresIn: "1h" }
    );

    // 3. Vendor Submits a Hotel
    console.log("🏨 Vendor submitting a new Hotel...");
    const hotelRes = await fetch(`${API_URL}/vendor/hotels`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${vendorToken}`
        },
        body: JSON.stringify({
            name: "SkyHigh Boutique Hotel " + Date.now(),
            type: "Boutique",
            starRating: 4,
            address: "Near Mall Road, Shimla",
            description: "A beautiful property with stunning mountain views.",
            images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600"],
            amenities: ["Free Wi-Fi", "Mountain View Rooms", "Breakfast Included"],
            destinationName: "Himalayas" // Generic fallback for UI
        })
    });
    const newHotel = await hotelRes.json();
    console.log("✅ Hotel Submitted! Status:", newHotel.status); // Should be PENDING

    // 4. Vendor Submits a Transport
    console.log("🚗 Vendor submitting a new Transport vehicle...");
    const transportRes = await fetch(`${API_URL}/vendor/transport`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${vendorToken}`
        },
        body: JSON.stringify({
            name: "Premium Innova Crysta " + Date.now(),
            type: "SUV",
            capacity: 6,
            pricePerDay: 4500,
            features: ["AC", "Carrier", "Water Bottles"],
            images: ["https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600"]
        })
    });
    const newTransport = await transportRes.json();
    console.log("✅ Transport Submitted! Status:", newTransport.status); // Should be PENDING

    // 5. Admin Approves the Hotel
    console.log("⚖️ Admin Approving Hotel...");
    const approveHotelRes = await fetch(`${API_URL}/admin/approvals/hotels/${newHotel.id}`, {
        method: "PATCH",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: "APPROVED" })
    });
    if (!approveHotelRes.ok) throw new Error("Could not approve hotel");
    console.log("✅ Admin Approved Hotel");

    // 6. Admin Approves Transport
    console.log("⚖️ Admin Approving Transport...");
    const approveTransRes = await fetch(`${API_URL}/admin/approvals/transport/${newTransport.id}`, {
        method: "PATCH",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: "APPROVED" })
    });
    if (!approveTransRes.ok) throw new Error("Could not approve transport: " + await approveTransRes.text());
    console.log("✅ Admin Approved Transport");

    // 7. Verify Data on Public API
    console.log("🌐 Verifying Public API (Simulating Website Load)...");
    const publicHotelsRes = await fetch(`${API_URL}/ota/hotels`);
    const publicHotels = await publicHotelsRes.json();
    const isHotelListed = publicHotels.some((h: any) => h.id === newHotel.id);

    const publicTransRes = await fetch(`${API_URL}/ota/transport`);
    const publicTrans = await publicTransRes.json();
    const isTransListed = publicTrans.some((t: any) => t.id === newTransport.id);

    console.log(`\n================ TEST RESULTS ================`);
    console.log(`🏨 Hotel Listed on Website:  ${isHotelListed ? "PASS ✅" : "FAIL ❌"}`);
    console.log(`🚗 Transport Listed on Website: ${isTransListed ? "PASS ✅" : "FAIL ❌"}`);
    console.log(`==============================================`);

    // Clean up
    console.log("🧹 Cleaning up test data...");
    await db.delete(hotelsTable).where(eq(hotelsTable.id, newHotel.id));
    await db.delete(transportServicesTable).where(eq(transportServicesTable.id, newTransport.id));
    await db.delete(usersTable).where(eq(usersTable.id, vendor.id));
    console.log("✨ Test sequence completed successfully.");
    process.exit(0);

  } catch (error) {
    console.error("❌ Test Failed:", error);
    process.exit(1);
  }
}

runTest();
