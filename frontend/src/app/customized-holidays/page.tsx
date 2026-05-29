import CustomizedHolidaysClient from "@/components/pages/CustomizedHolidaysClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customized Holidays | Sampooran Holidays",
  description: "Book customized tour packages and personalized vacations tailored exactly to your budget and travel needs."
};

export default function Page() {
  return <CustomizedHolidaysClient />;
}
