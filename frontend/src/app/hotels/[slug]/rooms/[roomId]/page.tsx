import type { Metadata } from "next";
import { getApiUrl } from "@/lib/api-url";
import RoomDetailClient from "@/components/pages/RoomDetailClient";

const API_URL = getApiUrl();

type Props = { params: Promise<{ slug: string; roomId: string }> };

/** Fetch hotel + room data for SSR metadata and JSON-LD */
async function getHotelAndRoom(slug: string, roomId: string) {
  try {
    const res = await fetch(`${API_URL}/hotels/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const hotel = await res.json();
    const room = (hotel.rooms || []).find(
      (r: any) => String(r.id) === roomId
    );
    return { hotel, room: room || null };
  } catch {
    return null;
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, roomId } = await props.params;
  const data = await getHotelAndRoom(slug, roomId);

  if (!data || !data.room) {
    return { title: "Room Details | Sampooran Holidays" };
  }

  const { hotel, room } = data;
  const roomName = room.name;
  const hotelName = hotel.name;
  const city = hotel.city || hotel.destinationName || "Himachal Pradesh";

  const title = `${roomName} — ${hotelName} | ${city} Room Booking | Sampooran Holidays`;
  const description = room.description
    ? room.description.slice(0, 160)
    : `Book the ${roomName} at ${hotelName} in ${city}. ${room.bedType} bed, sleeps up to ${room.maxAdults || 2} adults. Starting from ₹${(room.basePrice || 0).toLocaleString()}/night. Free cancellation available.`;

  const image = room.images?.[0] || hotel.images?.[0] || "/logo.png";

  return {
    title,
    description,
    keywords: [
      roomName,
      `${roomName} ${hotelName}`,
      `${hotelName} rooms`,
      `${city} hotel rooms`,
      `book ${roomName} ${city}`,
      "Sampooran Holidays hotel booking",
      room.type,
      room.bedType,
    ]
      .filter(Boolean)
      .join(", "),
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: roomName }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: `https://sampooranholidays.com/hotels/${slug}/rooms/${roomId}`,
    },
  };
}

export default async function RoomDetailPage(props: Props) {
  const { slug, roomId } = await props.params;
  const data = await getHotelAndRoom(slug, roomId);

  // JSON-LD Schema for the room (HotelRoom type)
  const jsonLd =
    data?.room && data?.hotel
      ? {
          "@context": "https://schema.org",
          "@type": "HotelRoom",
          name: data.room.name,
          description: data.room.description || undefined,
          url: `https://sampooranholidays.com/hotels/${slug}/rooms/${roomId}`,
          image: data.room.images?.[0] || undefined,
          bed: {
            "@type": "BedDetails",
            numberOfBeds: 1,
            typeOfBed: data.room.bedType || "Double",
          },
          occupancy: {
            "@type": "QuantitativeValue",
            maxValue: data.room.maxAdults || 2,
          },
          floorLevel: data.room.floorNumber ? String(data.room.floorNumber) : undefined,
          amenityFeature: (data.room.amenities || []).map((a: string) => ({
            "@type": "LocationFeatureSpecification",
            name: a,
            value: true,
          })),
          containedInPlace: {
            "@type": "Hotel",
            name: data.hotel.name,
            url: `https://sampooranholidays.com/hotels/${slug}`,
            address: {
              "@type": "PostalAddress",
              streetAddress: data.hotel.address,
              addressLocality: data.hotel.city || undefined,
              addressCountry: "IN",
            },
          },
          offers: {
            "@type": "Offer",
            price: data.room.basePrice,
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
          },
        }
      : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <RoomDetailClient slug={slug} roomId={roomId} />
    </>
  );
}
