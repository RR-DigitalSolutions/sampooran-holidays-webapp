import { db, offersTable } from "./src/index";
import { pool } from "./src/index";

async function seedOffers() {
  console.log("Seeding offers...");
  
  const offers = [
    {
      title: "Flat 20% OFF on Domestic Flights",
      description: "Use code FLY20 to get flat 20% off on all domestic flights.",
      category: "FLIGHTS",
      imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80",
      ctaText: "Book Now",
      ctaLink: "/flights",
      termsAndConditions: "Valid till end of month.",
      displayOrder: 1,
      isActive: true,
    },
    {
      title: "Luxury Hotels starting at ₹4999",
      description: "Experience luxury stay at affordable prices in Goa, Kerala, and more.",
      category: "HOTELS",
      imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
      ctaText: "Explore Stays",
      ctaLink: "/hotels",
      termsAndConditions: "Subject to availability.",
      displayOrder: 2,
      isActive: true,
    },
    {
      title: "Himachal Holiday Package - Buy 1 Get 1 Free",
      description: "Special honeymoon package for couples. Limited time offer.",
      category: "HOLIDAYS",
      imageUrl: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&q=80",
      ctaText: "View Packages",
      ctaLink: "/packages",
      termsAndConditions: "Valid for selected dates.",
      displayOrder: 3,
      isActive: true,
    },
    {
      title: "Get 15% Cashback with HDFC Cards",
      description: "Pay with HDFC Credit or Debit cards and enjoy extra savings on your bookings.",
      category: "BANK",
      imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&q=80",
      ctaText: "Know More",
      ctaLink: "/",
      termsAndConditions: "Max cashback ₹2500.",
      displayOrder: 4,
      isActive: true,
    }
  ];

  for (const offer of offers) {
    await db.insert(offersTable).values(offer).returning();
  }

  console.log("Offers seeded successfully.");
  pool.end();
}

seedOffers().catch(console.error);
