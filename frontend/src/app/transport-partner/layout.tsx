import type { Metadata } from "next";
import { VendorAuthProvider } from "@/context/VendorAuthContext";

export const metadata: Metadata = {
  title: "Transporter Partner Portal | Sampooran Holidays",
  description: "Register your fleet, cabs, luxury cars, tempo travellers, and buses. Direct client bookings, digital inspection logs, and transparent payouts.",
};

export default function TransportPartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <VendorAuthProvider>
      {children}
    </VendorAuthProvider>
  );
}
