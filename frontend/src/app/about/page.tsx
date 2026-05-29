import AboutClient from "@/components/pages/AboutClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sampooran Holidays | About",
  description: "Book premium holiday packages with Sampooran Holidays."
};

export default function Page() {
  return <AboutClient />;
}
