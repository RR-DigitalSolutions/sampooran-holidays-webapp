/**
 * Seed: Himachal Pradesh Transport Demo Vendors
 * Creates 2 transporter accounts, vendor profiles, 5 vehicles each (Shimla & Manali),
 * and fixed-route pricing rules.
 *
 * Run via: POST /api/admin/seed-himachal-transport  (with x-seed-secret header)
 */

import { db, usersTable, transportVendorsTable, transportVehiclesTable, transportPricingRulesTable, destinationsTable, statesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { logger } from "./logger";

// ─── Credentials (returned to admin after seeding) ───────────────────────────
export const DEMO_VENDORS = [
  {
    name: "Himachal Cab Service (Shimla)",
    email: "shimla.transport@sampooran.demo",
    password: "Shimla@Demo2025",
    phone: "9816101010",
    city: "Shimla",
    citySlug: "shimla",
    stateSlug: "himachal-pradesh",
    businessName: "Himachal Cab Service",
    description: "Premium cab and tempo traveller service in Shimla covering all major Himachal destinations.",
    vehicles: [
      {
        name: "Swift Dzire AC Sedan – Shimla",
        slug: "swift-dzire-sedan-shimla-demo",
        type: "CAB", subType: "Sedan",
        make: "Maruti Suzuki", model: "Swift Dzire",
        year: 2022, color: "White",
        seatingCapacity: 4, luggageCapacity: 2,
        fuelType: "CNG", transmission: "MANUAL", isAC: true,
        features: ["MUSIC", "CHARGING_PORT", "GPS", "FIRST_AID"],
        basePricePerKm: 14, basePricePerDay: 2800, minimumKm: 80,
        minPrice: 1120, registrationNumber: "HP01CA1001",
        description: "Comfortable AC sedan ideal for couples and small families exploring Shimla and nearby hills.",
        isFeatured: true,
        routes: [
          { name: "Shimla → Kufri", from: "Shimla", to: "Kufri", km: 20, price: 800, rt: 1300 },
          { name: "Shimla → Manali", from: "Shimla", to: "Manali", km: 270, price: 3800, rt: 6500 },
          { name: "Shimla → Chandigarh", from: "Shimla", to: "Chandigarh", km: 115, price: 1800, rt: 3200 },
        ]
      },
      {
        name: "Toyota Etios AC Cab – Shimla",
        slug: "toyota-etios-cab-shimla-demo",
        type: "CAB", subType: "Sedan",
        make: "Toyota", model: "Etios",
        year: 2021, color: "Silver",
        seatingCapacity: 4, luggageCapacity: 2,
        fuelType: "DIESEL", transmission: "MANUAL", isAC: true,
        features: ["MUSIC", "CHARGING_PORT", "GPS"],
        basePricePerKm: 13, basePricePerDay: 2600, minimumKm: 80,
        minPrice: 1040, registrationNumber: "HP01CB1002",
        description: "Reliable diesel sedan perfect for airport transfers and Shimla sightseeing.",
        isFeatured: false,
        routes: [
          { name: "Shimla → Dharamsala", from: "Shimla", to: "Dharamsala", km: 220, price: 3000, rt: 5200 },
          { name: "Shimla → Narkanda", from: "Shimla", to: "Narkanda", km: 65, price: 1200, rt: 2000 },
        ]
      },
      {
        name: "Mahindra Scorpio N SUV – Shimla",
        slug: "mahindra-scorpio-suv-shimla-demo",
        type: "CAB", subType: "SUV",
        make: "Mahindra", model: "Scorpio N",
        year: 2023, color: "Black",
        seatingCapacity: 7, luggageCapacity: 4,
        fuelType: "DIESEL", transmission: "MANUAL", isAC: true,
        features: ["MUSIC", "CHARGING_PORT", "GPS", "WATER_BOTTLE"],
        basePricePerKm: 18, basePricePerDay: 3800, minimumKm: 80,
        minPrice: 1440, registrationNumber: "HP01CC1003",
        description: "Powerful 7-seater SUV for group travel across mountain terrain around Shimla.",
        isFeatured: true,
        routes: [
          { name: "Shimla → Manali SUV", from: "Shimla", to: "Manali", km: 270, price: 5500, rt: 9800 },
          { name: "Shimla → Chail", from: "Shimla", to: "Chail", km: 45, price: 1200, rt: 2000 },
        ]
      },
      {
        name: "Toyota Innova Crysta SUV – Shimla",
        slug: "toyota-innova-crysta-shimla-demo",
        type: "CAB", subType: "SUV",
        make: "Toyota", model: "Innova Crysta",
        year: 2023, color: "Pearl White",
        seatingCapacity: 7, luggageCapacity: 4,
        fuelType: "DIESEL", transmission: "MANUAL", isAC: true,
        features: ["MUSIC", "CHARGING_PORT", "GPS", "BLANKET", "WATER_BOTTLE"],
        basePricePerKm: 20, basePricePerDay: 4200, minimumKm: 80,
        minPrice: 1600, registrationNumber: "HP01CD1004",
        description: "Most popular SUV for Himachal tours — premium comfort for 7 passengers.",
        isFeatured: true,
        routes: [
          { name: "Shimla → Manali Innova", from: "Shimla", to: "Manali", km: 270, price: 5800, rt: 10500 },
          { name: "Shimla → Spiti", from: "Shimla", to: "Kaza (Spiti)", km: 412, price: 8500, rt: 15000 },
        ]
      },
      {
        name: "Force Tempo Traveller 12-Seater – Shimla",
        slug: "force-tempo-traveller-12-shimla-demo",
        type: "TEMPO_TRAVELLER", subType: "Mini Bus",
        make: "Force", model: "Traveller 3350",
        year: 2022, color: "White",
        seatingCapacity: 12, luggageCapacity: 8,
        fuelType: "DIESEL", transmission: "MANUAL", isAC: true,
        features: ["MUSIC", "CHARGING_PORT", "GPS", "RECLINER", "WATER_BOTTLE", "FIRST_AID"],
        basePricePerKm: 28, basePricePerDay: 7000, minimumKm: 100,
        minPrice: 2800, registrationNumber: "HP01CE1005",
        description: "12-seater tempo traveller ideal for group trips and corporate travel from Shimla.",
        isFeatured: true,
        routes: [
          { name: "Shimla → Manali Group", from: "Shimla", to: "Manali", km: 270, price: 9500, rt: 17000 },
          { name: "Shimla Full Day", from: "Shimla", to: "Shimla Sightseeing", km: 100, price: 4500, rt: 4500 },
        ]
      },
    ]
  },
  {
    name: "Manali Adventures Transport",
    email: "manali.transport@sampooran.demo",
    password: "Manali@Demo2025",
    phone: "9816202020",
    city: "Manali",
    citySlug: "manali",
    stateSlug: "himachal-pradesh",
    businessName: "Manali Adventures Transport",
    description: "Specialist in high-altitude mountain cabs, SUVs and Tempo Travellers covering Manali, Leh-Ladakh, Spiti Valley and Rohtang Pass.",
    vehicles: [
      {
        name: "Maruti Ertiga AC Cab – Manali",
        slug: "maruti-ertiga-cab-manali-demo",
        type: "CAB", subType: "MPV",
        make: "Maruti Suzuki", model: "Ertiga",
        year: 2022, color: "Magma Grey",
        seatingCapacity: 6, luggageCapacity: 3,
        fuelType: "CNG", transmission: "MANUAL", isAC: true,
        features: ["MUSIC", "CHARGING_PORT", "GPS"],
        basePricePerKm: 15, basePricePerDay: 3000, minimumKm: 80,
        minPrice: 1200, registrationNumber: "HP10CA2001",
        description: "6-seater AC MPV perfect for small groups exploring Manali and Kullu valley.",
        isFeatured: true,
        routes: [
          { name: "Manali → Solang Valley", from: "Manali", to: "Solang Valley", km: 14, price: 700, rt: 1200 },
          { name: "Manali → Rohtang Pass", from: "Manali", to: "Rohtang Pass", km: 51, price: 2000, rt: 3500 },
        ]
      },
      {
        name: "Hyundai Creta SUV – Manali",
        slug: "hyundai-creta-suv-manali-demo",
        type: "CAB", subType: "SUV",
        make: "Hyundai", model: "Creta",
        year: 2023, color: "Deep Forest",
        seatingCapacity: 5, luggageCapacity: 3,
        fuelType: "DIESEL", transmission: "AUTOMATIC", isAC: true,
        features: ["MUSIC", "CHARGING_PORT", "GPS", "WATER_BOTTLE"],
        basePricePerKm: 17, basePricePerDay: 3500, minimumKm: 80,
        minPrice: 1360, registrationNumber: "HP10CB2002",
        description: "Modern automatic SUV with excellent hill performance for Manali explorations.",
        isFeatured: false,
        routes: [
          { name: "Manali → Naggar", from: "Manali", to: "Naggar", km: 22, price: 900, rt: 1500 },
          { name: "Manali → Chandigarh", from: "Manali", to: "Chandigarh", km: 310, price: 5500, rt: 9800 },
        ]
      },
      {
        name: "Toyota Fortuner Premium SUV – Manali",
        slug: "toyota-fortuner-suv-manali-demo",
        type: "CAB", subType: "Premium SUV",
        make: "Toyota", model: "Fortuner",
        year: 2024, color: "Attitude Black",
        seatingCapacity: 7, luggageCapacity: 4,
        fuelType: "DIESEL", transmission: "AUTOMATIC", isAC: true,
        features: ["MUSIC", "CHARGING_PORT", "GPS", "BLANKET", "WATER_BOTTLE", "RECLINER"],
        basePricePerKm: 25, basePricePerDay: 6000, minimumKm: 100,
        minPrice: 2500, registrationNumber: "HP10CC2003",
        description: "Flagship Fortuner for premium Manali to Leh-Ladakh expeditions — unmatched high-altitude capability.",
        isFeatured: true,
        routes: [
          { name: "Manali → Leh Premium", from: "Manali", to: "Leh", km: 479, price: 14000, rt: 26000 },
          { name: "Manali → Spiti Valley", from: "Manali", to: "Kaza (Spiti)", km: 198, price: 7500, rt: 13000 },
        ]
      },
      {
        name: "Toyota Innova Crysta SUV – Manali",
        slug: "toyota-innova-crysta-manali-demo",
        type: "CAB", subType: "SUV",
        make: "Toyota", model: "Innova Crysta",
        year: 2023, color: "Super White",
        seatingCapacity: 7, luggageCapacity: 4,
        fuelType: "DIESEL", transmission: "MANUAL", isAC: true,
        features: ["MUSIC", "CHARGING_PORT", "GPS", "BLANKET", "WATER_BOTTLE", "FIRST_AID"],
        basePricePerKm: 20, basePricePerDay: 4500, minimumKm: 80,
        minPrice: 1600, registrationNumber: "HP10CD2004",
        description: "Classic Innova — the most trusted vehicle for Manali, Rohtang, and Leh trips.",
        isFeatured: true,
        routes: [
          { name: "Manali → Leh Innova", from: "Manali", to: "Leh", km: 479, price: 11500, rt: 21000 },
          { name: "Manali → Delhi", from: "Manali", to: "Delhi", km: 540, price: 12000, rt: 22000 },
        ]
      },
      {
        name: "Force Tempo Traveller 17-Seater – Manali",
        slug: "force-tempo-traveller-17-manali-demo",
        type: "TEMPO_TRAVELLER", subType: "Luxury Mini Bus",
        make: "Force", model: "Traveller Luxury",
        year: 2023, color: "White",
        seatingCapacity: 17, luggageCapacity: 12,
        fuelType: "DIESEL", transmission: "MANUAL", isAC: true,
        features: ["MUSIC", "CHARGING_PORT", "GPS", "RECLINER", "BLANKET", "WATER_BOTTLE", "FIRST_AID"],
        basePricePerKm: 38, basePricePerDay: 10000, minimumKm: 100,
        minPrice: 3800, registrationNumber: "HP10CE2005",
        description: "Luxury 17-seater tempo traveller with recliner seats — perfect for large groups on Manali-Leh or Spiti circuits.",
        isFeatured: true,
        routes: [
          { name: "Manali → Leh Group", from: "Manali", to: "Leh", km: 479, price: 22000, rt: 40000 },
          { name: "Manali Circuit", from: "Manali", to: "Manali Circuit Tour", km: 200, price: 12000, rt: 12000 },
        ]
      },
    ]
  }
];

// ─── Main Seed Function ───────────────────────────────────────────────────────
export async function seedHimachalTransport() {
  const results: any[] = [];

  for (const vendor of DEMO_VENDORS) {
    try {
      // 1. Resolve destination ID
      const [dest] = await db
        .select({ id: destinationsTable.id, stateId: destinationsTable.stateId, countryId: destinationsTable.countryId })
        .from(destinationsTable)
        .where(eq(destinationsTable.slug, vendor.citySlug))
        .limit(1);

      const destinationId = dest?.id ?? null;
      const stateId = dest?.stateId ?? null;
      const countryId = dest?.countryId ?? null;

      // 2. Upsert User (TRANSPORTER role)
      const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, vendor.email)).limit(1);
      let userId: number;

      if (existing.length > 0) {
        userId = existing[0].id;
        logger.info({ email: vendor.email }, "Transporter user already exists — reusing");
      } else {
        const passwordHash = await bcrypt.hash(vendor.password, 10);
        const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const [newUser] = await db.insert(usersTable).values({
          name: vendor.name,
          email: vendor.email,
          phoneNumber: vendor.phone,
          passwordHash,
          role: "TRANSPORTER",
          referralCode,
          vendorBusinessName: vendor.businessName,
        }).returning({ id: usersTable.id });
        userId = newUser.id;
        logger.info({ email: vendor.email, userId }, "Created TRANSPORTER user");
      }

      // 3. Upsert Vendor Profile (APPROVED from the start)
      const existingVendor = await db.select({ id: transportVendorsTable.id }).from(transportVendorsTable).where(eq(transportVendorsTable.userId, userId)).limit(1);
      let vendorId: number;

      if (existingVendor.length > 0) {
        vendorId = existingVendor[0].id;
      } else {
        const [newVendor] = await db.insert(transportVendorsTable).values({
          userId,
          businessName: vendor.businessName,
          businessType: "PROPRIETORSHIP",
          phone: vendor.phone,
          email: vendor.email,
address: `Main Road, ${vendor.city}, Himachal Pradesh`,
          city: vendor.city,
          state: "Himachal Pradesh",
          pincode: vendor.city === "Shimla" ? "171001" : "175131",
          operatingSince: 2015,
          operatingCities: [vendor.city, "Manali", "Shimla", "Chandigarh"],
          vehicleTypes: ["CAB", "SUV", "TEMPO_TRAVELLER"],
          description: vendor.description,
          status: "PENDING",
          commissionPct: 12,
        }).returning({ id: transportVendorsTable.id });
        vendorId = newVendor.id;
        logger.info({ vendorId, city: vendor.city }, "Created transport vendor profile");
      }

      const vehicleResults = [];

      // 4. Create Vehicles
      for (const v of vendor.vehicles) {
        const existingVehicle = await db.select({ id: transportVehiclesTable.id }).from(transportVehiclesTable).where(eq(transportVehiclesTable.slug, v.slug)).limit(1);

        let vehicleId: number;
        if (existingVehicle.length > 0) {
          vehicleId = existingVehicle[0].id;
          logger.info({ slug: v.slug }, "Vehicle already exists — skipping");
        } else {
          const [newVehicle] = await db.insert(transportVehiclesTable).values({
            vendorId,
            ownerId: userId,
            destinationId,
            stateId,
            countryId,
            destinationSlug: vendor.citySlug,
            stateSlug: vendor.stateSlug,
            countrySlug: "india",
            customCity: vendor.city,
            name: v.name,
            slug: v.slug,
            type: v.type,
            subType: v.subType,
            description: v.description,
            make: v.make,
            model: v.model,
            year: v.year,
            color: v.color,
            registrationNumber: v.registrationNumber,
            seatingCapacity: v.seatingCapacity,
            luggageCapacity: v.luggageCapacity,
            fuelType: v.fuelType as any,
            transmission: v.transmission as any,
            isAC: v.isAC,
            features: v.features,
            bookingType: "INSTANT",
            basePricePerKm: v.basePricePerKm,
            basePricePerDay: v.basePricePerDay,
            minimumKm: v.minimumKm,
            waitingChargePerHour: 100,
            driverAllowancePerDay: 500,
            nightChargePercent: 10,
            minPrice: v.minPrice,
            advanceBookingHours: 4,
            maxPassengers: v.seatingCapacity,
            status: "PENDING",        // Admin must manually approve
            isFeatured: false,         // Admin sets featured after approval
            displayOrder: 0,
            metaTitle: `${v.name} | Sampooran Holidays`,
            metaDescription: v.description,
          }).returning({ id: transportVehiclesTable.id });

          vehicleId = newVehicle.id;
          logger.info({ vehicleId, name: v.name }, "Created transport vehicle");
        }

        // 5. Create Pricing Rules for this vehicle
        for (const route of v.routes) {
          const existing = await db.select({ id: transportPricingRulesTable.id })
            .from(transportPricingRulesTable)
            .where(and(
              eq(transportPricingRulesTable.vehicleId, vehicleId),
              eq(transportPricingRulesTable.name, route.name)
            ))
            .limit(1);

          if (existing.length === 0) {
            await db.insert(transportPricingRulesTable).values({
              vehicleId,
              vendorId,
              name: route.name,
              ruleType: "FIXED_ROUTE",
              fromCity: route.from,
              toCity: route.to,
              estimatedDistanceKm: route.km,
              price: route.price,
              priceType: "FIXED",
              isRoundTrip: false,
              roundTripPrice: route.rt,
              includes: ["DRIVER_ALLOWANCE", "FUEL", "TOLLS"],
              excludes: ["PARKING", "ENTRY_FEES"],
              isActive: true,
              displayOrder: 0,
            });
          }
        }

        vehicleResults.push({ id: vehicleId, name: v.name, slug: v.slug, type: v.type });
      }

      results.push({
        city: vendor.city,
        userId,
        vendorId,
        email: vendor.email,
        password: vendor.password,
        vehicles: vehicleResults,
      });

    } catch (err: any) {
      logger.error({ err: err.message, vendor: vendor.email }, "Seed error for vendor");
      throw err;
    }
  }

  return results;
}
