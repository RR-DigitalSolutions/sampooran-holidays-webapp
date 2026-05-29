import { db } from "../../../lib/db/src";
import { packagesTable, destinationsTable } from "../../../lib/db/src/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Seeding Manali Honeymoon Special...");

  // Get or create a state/destination for Manali
  let manaliDest = await db.query.destinationsTable.findFirst({
    where: eq(destinationsTable.slug, "manali")
  });

  if (!manaliDest) {
    const inserted = await db.insert(destinationsTable).values({
      name: "Manali",
      slug: "manali",
      type: "city",
      isActive: true
    }).returning();
    manaliDest = inserted[0];
  }

  const packageData = {
    name: "Manali Honeymoon Special — Snow, Romance & Adventure",
    slug: "manali-honeymoon-special",
    destinationId: manaliDest.id,
    destinationIds: [manaliDest.id],
    imageUrl: "https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=1200",
    shortDescription: "A romantic escape into the snow-capped Himalayas. Experience candle-light dinners, Solang Valley adventure, and breathtaking Rohtang views.",
    longDescription: "<p>Celebrate your love in the magical snow-capped peaks of Manali. This curated honeymoon package offers the perfect blend of romance, adventure, and relaxation. From private transfers and candle-light dinners to thrilling snow activities in Solang Valley, every detail is handled.</p><p>Stay in premium handpicked resorts with valley views, enjoy flower-bed decorations, and create memories that will last a lifetime.</p>",
    duration: 5,
    nights: 4,
    pricePerPerson: 14999,
    originalPrice: 19999,
    discountPercent: 25,
    category: "Honeymoon",
    packageType: "both",
    isFeatured: true,
    isTrending: true,
    rating: 4.8,
    reviewCount: 142,
    highlights: ["Solang Valley Adventure", "Rohtang Pass (Subject to weather)", "Candle Light Dinner", "Private Cab", "Flower Decoration"],
    cities: ["Delhi", "Kullu", "Manali"],
    tags: ["Romantic", "Snow", "Mountains", "Couples"],
    inclusions: [
      "Welcome Drink on Arrival",
      "4 Nights accommodation in a Premium Valley View Room",
      "Daily Breakfast and Dinner",
      "One special Candle Light Dinner",
      "Honeymoon Cake & Room Flower Decoration",
      "Private AC Sedan/SUV for all sightseeing and transfers",
      "Pickup and Drop from Delhi (Volvo/Cab depending on selection)",
      "All toll taxes, parking fees, and driver allowances"
    ],
    exclusions: [
      "Any airfare/train tickets",
      "Lunch during the stay",
      "Entry tickets to monuments, parks, and activities",
      "Rohtang Pass permit and vehicle charges (paid directly)",
      "Personal expenses like laundry, tips, phone calls",
      "Travel Insurance",
      "5% GST"
    ],
    inclusionIcons: ["flight", "hotel", "meals", "transfers", "sightseeing"],
    itinerary: [
      {
        day: 1,
        title: "Arrival in Manali & Local Sightseeing",
        description: "Arrive in Manali and check-in to your premium romantic resort. Rest for a while. In the afternoon, visit the famous Hadimba Devi Temple, Club House, Vashisht Hot Springs, and Tibetan Monastery. Evening free to stroll on Mall Road.",
        meals: ["Dinner"],
        accommodation: "Snow Valley Resort or similar",
        activities: ["Hadimba Temple", "Mall Road Walk"]
      },
      {
        day: 2,
        title: "Solang Valley Adventure",
        description: "After a delicious breakfast, proceed to Solang Valley. Enjoy breathtaking views of glaciers and snow-capped peaks. You can indulge in adventure activities like Paragliding, Zorbing, and Snow Scooters (at extra cost). Return to the hotel for a romantic candle-light dinner.",
        meals: ["Breakfast", "Dinner (Candle Light)"],
        accommodation: "Snow Valley Resort or similar",
        activities: ["Snow Activities", "Paragliding", "Photography"]
      },
      {
        day: 3,
        title: "Kullu & Manikaran Excursion",
        description: "Post breakfast, embark on a full-day excursion to Kullu and Manikaran. Visit the Vaishno Devi Temple in Kullu, enjoy River Rafting (optional), and explore the famous Kullu Shawl factories. Continue to Manikaran to visit the Gurudwara and natural hot water springs.",
        meals: ["Breakfast", "Dinner"],
        accommodation: "Snow Valley Resort or similar",
        activities: ["River Rafting", "Hot Springs", "Temple Visit"]
      },
      {
        day: 4,
        title: "Rohtang Pass / Snow Point (Subject to Permit)",
        description: "Early morning departure for Rohtang Pass (subject to weather and NGT permit). Play in the snow, enjoy the majestic panoramic views of the Pir Panjal range. On the way back, visit the beautiful Rahala Waterfalls and Marhi.",
        meals: ["Breakfast", "Dinner"],
        accommodation: "Snow Valley Resort or similar",
        activities: ["Snow Play", "Mountain Views", "Photography"]
      },
      {
        day: 5,
        title: "Departure from Manali",
        description: "Enjoy your final breakfast in the mountains. Check out from the hotel and board your transport back to Delhi with unforgettable romantic memories.",
        meals: ["Breakfast"],
        accommodation: "",
        activities: ["Shopping", "Departure"]
      }
    ],
    cancellationPolicy: "<ul><li><strong>30 days or more before travel:</strong> 20% cancellation charge.</li><li><strong>15 - 29 days before travel:</strong> 50% cancellation charge.</li><li><strong>7 - 14 days before travel:</strong> 75% cancellation charge.</li><li><strong>Less than 7 days:</strong> 100% cancellation charge (No Refund).</li></ul><p>Please note: Flight/Train cancellations are strictly as per airline/railway rules.</p>",
    faqs: [
      {
        question: "Is the Rohtang Pass entry included?",
        answer: "No, Rohtang Pass is subject to availability of permits from the NGT and weather conditions. The permit cost and local vehicle charges are to be paid directly."
      },
      {
        question: "Will it be too cold in Manali?",
        answer: "Manali can be quite cold, especially during winter (Nov - Feb). We recommend carrying heavy woolens, thermals, and waterproof jackets. In summer (May - June), light woolens are sufficient."
      },
      {
        question: "Can we customize the honeymoon inclusions?",
        answer: "Absolutely! We can arrange special room decorations, private bonfires, or photography sessions. Just let your travel expert know during booking."
      },
      {
        question: "Is travel insurance included?",
        answer: "No, travel insurance is not included. However, we highly recommend adding it to your package for complete peace of mind."
      }
    ]
  };

  const existing = await db.query.packagesTable.findFirst({
    where: eq(packagesTable.slug, packageData.slug)
  });

  if (existing) {
    await db.update(packagesTable)
      .set(packageData)
      .where(eq(packagesTable.id, existing.id));
    console.log("Updated existing Manali package");
  } else {
    await db.insert(packagesTable).values(packageData);
    console.log("Inserted new Manali package");
  }

  console.log("Done seeding!");
  process.exit(0);
}

main().catch(err => {
  console.error("Error seeding:", err);
  process.exit(1);
});
