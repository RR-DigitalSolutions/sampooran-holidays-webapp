import HotelDetailClient from "@/components/pages/HotelDetailClient";
import type { Metadata } from "next";
import { getApiUrl } from "@/lib/api-url";

const API_URL = getApiUrl();

type Props = { params: Promise<{ slug: string }> };

// Fetch hotel data server-side for rich SEO metadata
async function getHotelMeta(slug: string) {
  try {
    const res = await fetch(`${API_URL}/hotels/${slug}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  if (!slug) return { title: "Hotel | Sampooran Holidays" };

  const hotel = await getHotelMeta(slug);

  if (!hotel) {
    const hotelName = slug
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    return {
      title: `${hotelName} | Hotel Booking | Sampooran Holidays`,
      description: `Book your stay at ${hotelName}. Best rates, verified reviews, and exclusive deals with Sampooran Holidays.`,
    };
  }

  const title = `${hotel.name} — ${hotel.type || "Hotel"} in ${hotel.city || hotel.destinationName || "Himalayas"} | Sampooran Holidays`;
  const description = hotel.description
    ? hotel.description.slice(0, 160)
    : `Book ${hotel.name}, a ${hotel.starRating}-star ${hotel.type || "property"} in ${hotel.city || "Himachal Pradesh"}. Starting from ₹${hotel.minPrice?.toLocaleString() || "3,500"}/night. Free cancellation on select rooms.`;

  const image = hotel.images?.[0] || "/logo.png";

  return {
    title,
    description,
    keywords: [
      hotel.name,
      `${hotel.name} booking`,
      `${hotel.city || ""} hotels`,
      `${hotel.type || "hotel"} ${hotel.city || "Himachal Pradesh"}`,
      "best hotels Himachal Pradesh",
      "Sampooran Holidays hotel booking",
    ]
      .filter(Boolean)
      .join(", "),
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: hotel.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: `https://sampooranholidays.com/hotels/${slug}`,
    },
  };
}

export default async function Page(props: Props) {
  const { slug } = await props.params;
  const hotel = await getHotelMeta(slug);

  // Build JSON-LD structured data for Google rich results
  const jsonLd = hotel ? {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "name": hotel.name,
    "description": hotel.description || undefined,
    "url": `https://sampooranholidays.com/hotels/${slug}`,
    "image": hotel.images?.[0] || undefined,
    "starRating": hotel.starRating ? {
      "@type": "Rating",
      "ratingValue": hotel.starRating,
      "bestRating": 5,
    } : undefined,
    "priceRange": hotel.minPrice ? `From ₹${hotel.minPrice.toLocaleString()}/night` : undefined,
    "address": hotel.address ? {
      "@type": "PostalAddress",
      "streetAddress": hotel.address,
      "addressLocality": hotel.city || undefined,
      "addressCountry": "IN",
    } : undefined,
    "geo": (hotel.latitude && hotel.longitude) ? {
      "@type": "GeoCoordinates",
      "latitude": hotel.latitude,
      "longitude": hotel.longitude,
    } : undefined,
    "telephone": "+918595513009",
    "checkinTime": hotel.checkInTime || "14:00",
    "checkoutTime": hotel.checkOutTime || "12:00",
    "amenityFeature": hotel.amenities?.map((a: string) => ({ "@type": "LocationFeatureSpecification", "name": a })) || [],
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <HotelDetailClient slug={slug} />
    </>
  );
}
