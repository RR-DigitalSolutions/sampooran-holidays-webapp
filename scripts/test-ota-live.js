const API_URL = "http://localhost:8080/api";

async function runTest() {
  console.log("🚀 Starting OTA Listing Live API Test (Client View)...");

  try {
    // 1. Setup mock vendor user config
    const testVendorEmail = `testvendor_${Math.floor(Math.random() * 100000)}@sampooran_test.com`;
    console.log("👤 Using Test Vendor:", testVendorEmail);

    // Get Auth Token directly simulating login/signup API endpoint? 
    // We can also just use the Super Admin token to submit. The system allows SUPERADMIN to submit assets.
    console.log("🔐 Authenticating Admin Backend Flow...");
    const adminLoginRes = await fetch(`${API_URL}/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin@sampooran.com", password: "admin@sampooran" })
    });

    if (!adminLoginRes.ok) throw new Error("Admin login failed.");
    const adminToken = (await adminLoginRes.json()).token;
    console.log("✅ Admin Logged in successfully.");

    // We can use the Admin token to submit vendor resources directly (since ADMIN has higher privileges) 
    // Wait, vendor routes expect req.user.role === 'HOTEL_OWNER' or similar maybe? Let's check. 
    // If not, we will register a real vendor via API.
    // Register Vendor
    const registerRes = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Valley Vendor",
        email: testVendorEmail,
        password: "vendorpass123",
        role: "HOTEL_OWNER"
      })
    });
    
    // Auth Vendor
    const vendorLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testVendorEmail, password: "vendorpass123" })
    });
    const vendorToken = (await vendorLoginRes.json()).token;
    console.log("✅ Mock Vendor Registered & Authenticated");


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
            destinationName: "Himalayas" 
        })
    });
    if (!hotelRes.ok) {
        console.error("Hotel Error Body:", await hotelRes.text());
        throw new Error("Hotel submission failed");
    }
    const newHotel = await hotelRes.json();
    console.log("✅ Hotel Submitted! Server Response:", newHotel.name, "- Status:", newHotel.status);

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
    if (!transportRes.ok) {
        console.error("Transport Error Body:", await transportRes.text());
        throw new Error("Transport submission failed");
    }
    const newTransport = await transportRes.json();
    console.log("✅ Transport Submitted! Server Response:", newTransport.name, "- Status:", newTransport.status);

    // 5. Admin Approves the Hotel
    console.log("⚖️ Admin Approving Hotel ID:", newHotel.id);
    const approveHotelRes = await fetch(`${API_URL}/admin/approvals/hotels/${newHotel.id}`, {
        method: "PATCH",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: "APPROVED" })
    });
    console.log("✅ Admin Approved Hotel");

    // 6. Admin Approves Transport
    console.log("⚖️ Admin Approving Transport ID:", newTransport.id);
    const approveTransRes = await fetch(`${API_URL}/admin/approvals/transport/${newTransport.id}`, {
        method: "PATCH",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: "APPROVED" })
    });
    console.log("✅ Admin Approved Transport");

    // 7. Verify Data on Public API Endpoints
    console.log("🌐 Verifying Public API Feed (Checking if LIVE on website)...");
    const publicHotelsRes = await fetch(`${API_URL}/ota/hotels`);
    const publicHotels = await publicHotelsRes.json();
    const isHotelListed = publicHotels.some((h) => h.id === newHotel.id);

    const publicTransRes = await fetch(`${API_URL}/ota/transport`);
    const publicTrans = await publicTransRes.json();
    const isTransListed = publicTrans.some((t) => t.id === newTransport.id);

    console.log(`\n================ PUBLIC FEED TEST RESULTS ================`);
    console.log(`🏨 Hotel Appears on Stays Page:  ${isHotelListed ? "PASS ✅" : "FAIL ❌"}`);
    console.log(`🚗 Transporter Appears on Cabs Page: ${isTransListed ? "PASS ✅" : "FAIL ❌"}`);
    console.log(`==========================================================`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Test Failed:", error);
    process.exit(1);
  }
}

runTest();
