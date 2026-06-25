import ContactClient from "@/components/pages/ContactClient";
import type { Metadata } from "next";

import { getPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const fallback = {
    title: "Contact Us | Sampooran Holidays - Himalayan Travel Planners",
    description: "Get in touch with Sampooran Holidays to plan your custom travel itinerary. Call us, email us, or visit our office to book your dream vacation today.",
  };
  return getPageMetadata("contact", fallback);
}

export default function Page() {
  return <ContactClient />;
}
