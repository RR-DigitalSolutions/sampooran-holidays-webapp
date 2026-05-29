import HotelsClient from "@/components/pages/HotelsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stays & Resorts | Sampooran Holidays",
  description: "Discover and book premium hotels, resorts, and homestays across the Himalayas with Sampooran Holidays."
};

export default function Page() {
  return <HotelsClient />;
}
