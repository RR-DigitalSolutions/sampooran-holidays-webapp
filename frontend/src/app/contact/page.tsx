import ContactClient from "@/components/pages/ContactClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sampooran Holidays | Contact",
  description: "Book premium holiday packages with Sampooran Holidays."
};

export default function Page() {
  return <ContactClient />;
}
