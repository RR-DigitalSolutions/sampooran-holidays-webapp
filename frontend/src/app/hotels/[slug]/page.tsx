import HotelDetailClient from "@/components/pages/HotelDetailClient";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  // Gracefully handle missing slug
  if (!slug) return { title: "Hotel | Sampooran Holidays" };
  const hotelName = slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  return {
    title: `${hotelName} | Luxury Stay | Sampooran Holidays`,
    description: `Book your stay at ${hotelName}. Premium amenities, verified reviews, and best rates guaranteed with Sampooran Holidays.`,
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <HotelDetailClient slug={slug} />;
}

