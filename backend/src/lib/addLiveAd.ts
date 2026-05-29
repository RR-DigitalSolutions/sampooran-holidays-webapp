import { db, offersTable } from "@workspace/db";

async function addLiveAd() {
  try {
    // Add a small ad
    await db.insert(offersTable).values({
      title: "Premium Travel Insurance",
      description: "Secure your journey with our comprehensive coverage starting at just ₹49/day.",
      category: "SPONSORED_SMALL",
      imageUrl: "https://images.unsplash.com/photo-1454165833767-027ffea9e778?w=200&h=200&q=80",
      ctaText: "Explore",
      ctaLink: "/insurance",
      displayOrder: 1,
      isActive: true
    });

    // Add a banner ad
    await db.insert(offersTable).values({
      title: "Exclusive Maldives Getaway",
      description: "Up to 40% OFF on Luxury Overwater Villas. All-inclusive packages with seaplane transfers.",
      category: "SPONSORED_BANNER",
      imageUrl: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1600&h=400&q=80",
      ctaText: "Book Your Dream",
      ctaLink: "/packages/maldives-luxury-escape",
      termsAndConditions: "LIMITED TIME OFFER",
      displayOrder: 1,
      isActive: true
    });

    console.log("✅ Live Sponsored Ads added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to add live ads:", error);
    process.exit(1);
  }
}

addLiveAd();
