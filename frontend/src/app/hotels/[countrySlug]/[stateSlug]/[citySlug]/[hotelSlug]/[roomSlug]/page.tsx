import React from "react";
import type { Metadata } from "next";
import { getApiUrl } from "@/lib/api-url";
import RoomDetailClient from "@/components/pages/RoomDetailClient";

const API_URL = getApiUrl();

type Props = {
  params: Promise<{
    countrySlug: string;
    stateSlug: string;
    citySlug: string;
    hotelSlug: string;
    roomSlug: string;
  }>;
};

async function getHotelAndRoom(hotelSlug: string, roomSlug: string) {
  try {
    // Fetch hotel (includes all rooms)
    const res = await fetch(`${API_URL}/hotels/${hotelSlug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const hotel = await res.json();

    // Find room by slug first; fall back to numeric ID if roomSlug is a number
    let room = (hotel.rooms || []).find((r: any) => r.slug === roomSlug);
    if (!room && !isNaN(Number(roomSlug))) {
      room = (hotel.rooms || []).find((r: any) => String(r.id) === roomSlug);
    }
    return { hotel, room: room || null };
  } catch { return null; }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countrySlug, stateSlug, citySlug, hotelSlug, roomSlug } = await props.params;
  const data = await getHotelAndRoom(hotelSlug, roomSlug);

  const rawCity = citySlug.replace(/^hotels-in-/, "");
  const cityName = data?.hotel?.destinationName || rawCity.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const stateName = stateSlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

  if (!data?.room) {
    return { title: "Room Details | Sampooran Holidays" };
  }

  const { hotel, room } = data;
  const title = `${room.name} — ${hotel.name} | ${cityName}, ${stateName} | Sampooran Holidays`;
  const description = room.description
    ? room.description.slice(0, 160)
    : `Book the ${room.name} at ${hotel.name} in ${cityName}, ${stateName}. ${room.bedType || "Double"} bed, sleeps up to ${room.maxAdults || 2} adults. From ₹${(room.basePrice || 0).toLocaleString()}/night.`;

  const image = room.images?.[0] || hotel.images?.[0] || "/logo.png";
  const canonicalUrl = `https://sampooranholidays.com/hotels/${countrySlug}/${stateSlug}/${citySlug}/${hotelSlug}/${roomSlug}`;

  return {
    title,
    description,
    keywords: [
      room.name, `${room.name} ${hotel.name}`, `${hotel.name} rooms`, `${cityName} hotel rooms`,
      `book ${room.name} ${cityName}`, "Sampooran Holidays hotel", room.type, room.bedType,
    ].filter(Boolean).join(", "),
    openGraph: { title, description, type: "website", images: [{ url: image, width: 1200, height: 630, alt: room.name }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    alternates: { canonical: canonicalUrl },
    robots: { index: true, follow: true },
  };
}

export default async function RoomDetailPage(props: Props) {
  const { countrySlug, stateSlug, citySlug, hotelSlug, roomSlug } = await props.params;
  const data = await getHotelAndRoom(hotelSlug, roomSlug);

  const rawCity = citySlug.replace(/^hotels-in-/, "");
  const cityName = data?.hotel?.destinationName || rawCity.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const stateName = stateSlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const countryName = countrySlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

  const canonicalUrl = `https://sampooranholidays.com/hotels/${countrySlug}/${stateSlug}/${citySlug}/${hotelSlug}/${roomSlug}`;
  const hotelUrl = `https://sampooranholidays.com/hotels/${countrySlug}/${stateSlug}/${citySlug}/${hotelSlug}`;

  // JSON-LD HotelRoom schema
  const jsonLd = data?.room && data?.hotel ? {
    "@context": "https://schema.org",
    "@type": "HotelRoom",
    "name": data.room.name,
    "description": data.room.description || undefined,
    "url": canonicalUrl,
    "image": data.room.images?.[0] || undefined,
    "bed": { "@type": "BedDetails", "numberOfBeds": 1, "typeOfBed": data.room.bedType || "Double" },
    "occupancy": { "@type": "QuantitativeValue", "maxValue": data.room.maxAdults || 2 },
    "floorLevel": data.room.floorNumber ? String(data.room.floorNumber) : undefined,
    "amenityFeature": (data.room.amenities || []).map((a: string) => ({
      "@type": "LocationFeatureSpecification", "name": a, "value": true,
    })),
    "containedInPlace": {
      "@type": "LodgingBusiness",
      "name": data.hotel.name,
      "url": hotelUrl,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": data.hotel.address,
        "addressLocality": cityName,
        "addressRegion": stateName,
        "addressCountry": countrySlug === "india" ? "IN" : countrySlug.toUpperCase(),
      },
    },
    "offers": {
      "@type": "Offer",
      "price": data.room.basePrice,
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
    },
  } : null;

  // Full Breadcrumb JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://sampooranholidays.com" },
      { "@type": "ListItem", position: 2, name: "Hotels", item: "https://sampooranholidays.com/hotels" },
      { "@type": "ListItem", position: 3, name: countryName, item: `https://sampooranholidays.com/hotels/${countrySlug}` },
      { "@type": "ListItem", position: 4, name: `Hotels in ${stateName}`, item: `https://sampooranholidays.com/hotels/${countrySlug}/${stateSlug}` },
      { "@type": "ListItem", position: 5, name: `Hotels in ${cityName}`, item: `https://sampooranholidays.com/hotels/${countrySlug}/${stateSlug}/${citySlug}` },
      { "@type": "ListItem", position: 6, name: data?.hotel?.name || hotelSlug, item: hotelUrl },
      { "@type": "ListItem", position: 7, name: data?.room?.name || roomSlug, item: canonicalUrl },
    ],
  };

  // Determine roomId for the RoomDetailClient (it still uses numeric ID internally for bookings)
  const roomId = data?.room?.id ? String(data.room.id) : roomSlug;

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <RoomDetailClient
        slug={hotelSlug}
        roomId={roomId}
      />
    </>
  );
}
