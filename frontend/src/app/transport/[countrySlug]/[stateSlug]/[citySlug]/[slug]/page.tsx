import type { Metadata } from "next";
import { getApiUrl } from "@/lib/api-url";
import VehicleDetailClient from "@/components/pages/VehicleDetailClient";
import { DEMO_FLEET } from "@/lib/demo-fleet";

const API_URL = getApiUrl();

type Props = { params: Promise<{ countrySlug: string; stateSlug: string; citySlug: string; slug: string }> };

async function getVehicleFromApi(slug: string) {
  try {
    const res = await fetch(`${API_URL}/transport/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data && (data.id || data.slug) ? data : null;
  } catch {
    return null;
  }
}

// Shape API vehicle to match DemoVehicle interface
function normalizeApiVehicle(data: any, countrySlug: string, stateSlug: string): any {
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    type: data.type,
    make: data.make || "",
    model: data.model || "",
    year: data.year || 2022,
    capacity: data.seating_capacity || data.capacity || 4,
    luggageCapacity: data.luggage_capacity || 2,
    transmission: data.transmission || "Manual",
    fuelType: data.fuel_type || "Diesel",
    isAc: data.is_ac !== false,
    pricePerKm: data.price_per_km || 18,
    pricePerDay: data.base_price_per_day || data.pricePerDay || 4500,
    images: data.images || [],
    features: data.features || [],
    highlights: data.highlights || [],
    description: data.description || "",
    category: data.category || "standard",
    rating: data.avgRating || 4.5,
    reviewCount: data.reviewCount || 10,
    ownerName: data.owner_name || data.ownerName || "Fleet Owner",
    businessName: data.business_name || data.businessName || "Transport Services",
    operatingSince: data.operating_since || data.operatingSince || 2018,
    isVerified: data.is_verified !== false,
    badge: data.badge,
    countrySlug,
    stateSlug,
    destinationSlug: data.city_slug || data.destinationSlug || "manali",
    cityName: data.city_name || data.cityName || "Manali",
  };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, countrySlug, stateSlug } = await props.params;

  // Try API first, then demo data
  const apiData = await getVehicleFromApi(slug);
  const vehicle = apiData
    ? normalizeApiVehicle(apiData, countrySlug, stateSlug)
    : DEMO_FLEET.find(v => v.slug === slug);

  if (!vehicle) return { title: "Vehicle Details | Sampooran Holidays" };

  const title = `Book ${vehicle.name} in ${vehicle.cityName} — ₹${vehicle.pricePerDay.toLocaleString("en-IN")}/day | Sampooran Holidays`;
  const description = `Hire ${vehicle.make} ${vehicle.model} (${vehicle.capacity} seats) with professional driver in ${vehicle.cityName}. ${vehicle.isAc ? "Full AC." : ""} ${vehicle.transmission} transmission. Best rates from ₹${vehicle.pricePerDay.toLocaleString("en-IN")}/day. Verified fleet, 24/7 support.`;

  return {
    title,
    description,
    keywords: `${vehicle.name} on rent, ${vehicle.make} ${vehicle.model} hire ${vehicle.cityName}, cab booking ${vehicle.cityName}, tempo traveller ${vehicle.cityName}`,
    openGraph: {
      title,
      description,
      images: [{ url: vehicle.images?.[0] || "/logo.png", width: 1200, height: 630, alt: vehicle.name }],
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
    alternates: {
      canonical: `https://sampooranholidays.com/transport/${countrySlug}/${stateSlug}/transport-in-${vehicle.destinationSlug}/${slug}`,
    },
  };
}

export default async function VehicleDetailPage(props: Props) {
  const { countrySlug, stateSlug, citySlug, slug } = await props.params;

  // Try API first, then fall back to demo data
  const apiData = await getVehicleFromApi(slug);
  const vehicle = apiData
    ? normalizeApiVehicle(apiData, countrySlug, stateSlug)
    : DEMO_FLEET.find(v => v.slug === slug) || null;

  // Related vehicles: same type, exclude current
  const related = DEMO_FLEET
    .filter(v => v.slug !== slug && (!vehicle || v.type === vehicle.type))
    .slice(0, 4);

  // JSON-LD schema
  const productSchema = vehicle ? {
    "@context": "https://schema.org",
    "@type": "Product",
    name: vehicle.name,
    description: vehicle.description,
    brand: { "@type": "Brand", name: vehicle.make },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: vehicle.pricePerDay,
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: vehicle.businessName },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: vehicle.rating,
      reviewCount: vehicle.reviewCount,
      bestRating: 5,
    },
    image: vehicle.images,
  } : null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://sampooranholidays.com" },
      { "@type": "ListItem", position: 2, name: "Transport", item: "https://sampooranholidays.com/transport" },
      { "@type": "ListItem", position: 3, name: vehicle?.cityName || "City", item: `https://sampooranholidays.com/transport/${countrySlug}/${stateSlug}/${citySlug}` },
      { "@type": "ListItem", position: 4, name: vehicle?.name || "Vehicle", item: "" },
    ],
  };

  return (
    <>
      {productSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <VehicleDetailClient
        vehicle={vehicle}
        countrySlug={countrySlug}
        stateSlug={stateSlug}
        citySlug={citySlug}
        related={related}
      />
    </>
  );
}

export const dynamic = "force-dynamic";
