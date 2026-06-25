import AboutClient from "@/components/pages/AboutClient";
import type { Metadata } from "next";

import { getPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const fallback = {
    title: "About Us | Sampooran Holidays",
    description: "Learn more about Sampooran Holidays, the leading tour package planner in Himachal Pradesh and across India. We offer best B2B and B2C custom packages.",
  };
  return getPageMetadata("about", fallback);
}

export default function Page() {
  return <AboutClient />;
}
