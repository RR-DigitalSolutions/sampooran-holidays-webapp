import TransportClient from "@/components/pages/TransportClient";
import type { Metadata } from "next";

import { getPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const fallback = {
    title: "Premium Fleet & Transport | Sampooran Holidays",
    description: "Book luxury cabs, tempo travellers, and buses for your Himalayan adventure with Sampooran Holidays. Professional drivers and best rates.",
  };
  return getPageMetadata("transport", fallback);
}

export default function Page() {
  return <TransportClient />;
}
