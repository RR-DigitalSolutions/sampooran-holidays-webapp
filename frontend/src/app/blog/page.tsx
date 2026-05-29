import BlogClient from "@/components/pages/BlogClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sampooran Holidays | Blog",
  description: "Book premium holiday packages with Sampooran Holidays."
};

export default function Page() {
  return <BlogClient />;
}
