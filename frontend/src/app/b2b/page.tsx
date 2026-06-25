import B2BClient from "@/components/pages/B2BClient";
import type { Metadata } from "next";

import { getPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const fallback = {
    title: "B2B Travel Agent Portal | Sampooran Holidays",
    description: "Grow your travel agency business with our premium B2B tour portal. Get the best rates for Himachal Pradesh, Ladakh, and Kashmir holiday packages.",
  };
  return getPageMetadata("b2b", fallback);
}

export default function Page() {
  return <B2BClient />;
}
