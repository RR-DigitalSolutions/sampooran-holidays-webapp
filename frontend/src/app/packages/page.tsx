import { Suspense } from "react";
import Packages from "@/components/pages/PackagesClient";
import { Metadata } from "next";

import { getPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const fallback = {
    title: "Tour Packages | Sampooran Holidays",
    description: "Browse and filter our curated selection of tour packages for Shimla, Manali, Ladakh, and Kashmir. Get best deals on family and honeymoon packages.",
  };
  return getPageMetadata("packages", fallback);
}

export default function PackagesPage() {
  return (
    <Suspense fallback={<div className="pt-32 pb-16 text-center">Loading packages...</div>}>
      <Packages />
    </Suspense>
  );
}
