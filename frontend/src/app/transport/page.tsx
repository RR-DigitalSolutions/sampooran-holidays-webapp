import TransportClient from "@/components/pages/TransportClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Premium Fleet & Transport | Sampooran Holidays",
  description: "Book luxury cabs, tempo travellers, and buses for your Himalayan adventure with Sampooran Holidays."
};

export default function Page() {
  return <TransportClient />;
}
