import { Suspense } from "react";
import HotelsClient from "@/components/pages/HotelsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hotels, Resorts & Homestays | Book Best Stays | Sampooran Holidays",
  description: "Discover and book the best hotels, luxury resorts, boutique cottages, and unique homestays across India's top destinations. Best rates guaranteed with Sampooran Holidays OTA.",
  keywords: "book hotels India, luxury resorts Manali, Shimla hotels, Ladakh homestays, Kashmir resorts, Himachal Pradesh hotels, best hotel deals India, OTA hotel booking",
  openGraph: {
    title: "Browse Premium Hotels & Resorts | Sampooran Holidays",
    description: "Find and book verified hotels, resorts, cottages and homestays at the best prices. 500+ properties across the Himalayas.",
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "Sampooran Holidays Hotels" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hotels & Resorts | Sampooran Holidays",
    description: "Discover and book premium stays at the best prices across India's top destinations.",
  },
  alternates: {
    canonical: "https://sampooranholidays.com/hotels",
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <HotelsClient />
    </Suspense>
  );
}
