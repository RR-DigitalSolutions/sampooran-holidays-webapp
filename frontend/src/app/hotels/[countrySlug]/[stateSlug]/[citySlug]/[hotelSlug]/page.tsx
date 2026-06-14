import React from "react";
import HotelDetailClient from "@/components/pages/HotelDetailClient";
import type { Metadata } from "next";
import { getApiUrl } from "@/lib/api-url";

const API_URL = getApiUrl();

type Props = { params: Promise<{ countrySlug: string; stateSlug: string; citySlug: string; hotelSlug: string }> };

async function getHotelMeta(hotelSlug: string) {
  try {
    const res = await fetch(`${API_URL}/hotels/${hotelSlug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countrySlug, stateSlug, citySlug, hotelSlug } = await props.params;
  const hotel = await getHotelMeta(hotelSlug);

  // Parse city name from "hotels-in-manali" → "Manali"
  const rawCity = citySlug.replace(/^hotels-in-/, "");
  const cityName = hotel?.destinationName || rawCity.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const stateName = stateSlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const countryName = countrySlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

  if (!hotel) {
    const hotelName = hotelSlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
    return {
      title: `${hotelName} | Book Hotel in ${cityName} | Sampooran Holidays`,
      description: `Book your stay at ${hotelName} in ${cityName}, ${stateName}. Best rates, verified reviews with Sampooran Holidays.`,
    };
  }

  const title = `${hotel.name} — ${hotel.type || "Hotel"} in ${cityName}, ${stateName} | Sampooran Holidays`;
  const description = hotel.description
    ? hotel.description.slice(0, 160)
    : `Book ${hotel.name}, a ${hotel.starRating}-star ${hotel.type || "property"} in ${cityName}, ${stateName}. Starting from ₹${hotel.minPrice?.toLocaleString() || "3,500"}/night. Free cancellation on select rooms.`;

  const image = hotel.images?.[0] || "/logo.png";
  const canonicalUrl = `https://sampooranholidays.com/hotels/${countrySlug}/${stateSlug}/${citySlug}/${hotelSlug}`;

  return {
    title,
    description,
    keywords: [
      hotel.name, `${hotel.name} booking`, `${cityName} hotels`, `best hotels ${cityName}`,
      `${hotel.type || "hotel"} ${cityName}`, `${stateName} hotels`, "Sampooran Holidays hotel booking",
    ].filter(Boolean).join(", "),
    openGraph: {
      title, description, type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: hotel.name }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    alternates: { canonical: canonicalUrl },
    robots: { index: true, follow: true },
  };
}

export default async function HotelDetailPage(props: Props) {
  const { countrySlug, stateSlug, citySlug, hotelSlug } = await props.params;
  const hotel = await getHotelMeta(hotelSlug);

  const rawCity = citySlug.replace(/^hotels-in-/, "");
  const cityName = hotel?.destinationName || rawCity.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const stateName = stateSlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const countryName = countrySlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

  const canonicalUrl = `https://sampooranholidays.com/hotels/${countrySlug}/${stateSlug}/${citySlug}/${hotelSlug}`;

  // Full JSON-LD structured data
  const jsonLd = hotel ? {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "name": hotel.name,
    "description": hotel.description || undefined,
    "url": canonicalUrl,
    "image": hotel.images?.[0] || undefined,
    "starRating": hotel.starRating ? { "@type": "Rating", "ratingValue": hotel.starRating, "bestRating": 5 } : undefined,
    "priceRange": hotel.minPrice ? `From ₹${hotel.minPrice.toLocaleString()}/night` : undefined,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": hotel.address,
      "addressLocality": cityName,
      "addressRegion": stateName,
      "addressCountry": countrySlug === "india" ? "IN" : countrySlug.toUpperCase(),
    },
    "geo": (hotel.latitude && hotel.longitude) ? {
      "@type": "GeoCoordinates", "latitude": hotel.latitude, "longitude": hotel.longitude,
    } : undefined,
    "telephone": "+918595513009",
    "checkinTime": hotel.checkInTime || "14:00",
    "checkoutTime": hotel.checkOutTime || "12:00",
    "amenityFeature": hotel.amenities?.map((a: string) => ({ "@type": "LocationFeatureSpecification", "name": a })) || [],
    "aggregateRating": hotel.ratingsSummary?.avg_rating ? {
      "@type": "AggregateRating",
      "ratingValue": hotel.ratingsSummary.avg_rating,
      "reviewCount": hotel.ratingsSummary.total || 0,
      "bestRating": 5,
    } : undefined,
  } : null;

  // Breadcrumb JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://sampooranholidays.com" },
      { "@type": "ListItem", position: 2, name: "Hotels", item: "https://sampooranholidays.com/hotels" },
      { "@type": "ListItem", position: 3, name: countryName, item: `https://sampooranholidays.com/hotels/${countrySlug}` },
      { "@type": "ListItem", position: 4, name: `Hotels in ${stateName}`, item: `https://sampooranholidays.com/hotels/${countrySlug}/${stateSlug}` },
      { "@type": "ListItem", position: 5, name: `Hotels in ${cityName}`, item: `https://sampooranholidays.com/hotels/${countrySlug}/${stateSlug}/${citySlug}` },
      { "@type": "ListItem", position: 6, name: hotel?.name || hotelSlug, item: canonicalUrl },
    ],
  };

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <HotelDetailClient
        slug={hotelSlug}
        breadcrumbs={[
          { label: "Hotels", href: "/hotels" },
          { label: countryName, href: `/hotels/${countrySlug}` },
          { label: `Hotels in ${stateName}`, href: `/hotels/${countrySlug}/${stateSlug}` },
          { label: `Hotels in ${cityName}`, href: `/hotels/${countrySlug}/${stateSlug}/${citySlug}` },
          { label: hotel?.name || hotelSlug, href: canonicalUrl },
        ]}
      />
    </>
  );
}
