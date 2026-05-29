import B2BClient from "@/components/pages/B2BClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sampooran Holidays | B2B",
  description: "Book premium holiday packages with Sampooran Holidays."
};

export default function Page() {
  return <B2BClient />;
}
