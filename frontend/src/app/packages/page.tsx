import { Suspense } from "react";
import Packages from "@/components/pages/PackagesClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tour Packages | Sampooran Holidays",
  description: "Browse and filter our curated selection of tour packages.",
};

export default function PackagesPage() {
  return (
    <Suspense fallback={<div className="pt-32 pb-16 text-center">Loading packages...</div>}>
      <Packages />
    </Suspense>
  );
}
