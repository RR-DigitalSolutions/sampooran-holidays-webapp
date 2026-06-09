import type { Metadata } from "next";
import { VendorAuthProvider } from "@/context/VendorAuthContext";

export const metadata: Metadata = {
  title: "Partner Portal | Sampooran Holidays",
  description: "List your hotel, resort, cottage or homestay with Sampooran Holidays and reach thousands of travellers across the Himalayas.",
};

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <VendorAuthProvider>
      {children}
    </VendorAuthProvider>
  );
}
