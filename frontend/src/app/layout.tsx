import type { Metadata } from "next";
import { Poppins, Raleway } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Layout } from "@/components/Layout";
import { Toaster } from "@/components/ui/toaster";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-raleway",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sampooranholidays.com"),
  title: "Sampooran Holidays - Best Travel Agency in Himachal Pradesh",
  description: "Sampooran Holidays specializes in curated B2B & B2C tour packages across Himachal Pradesh, Leh Ladakh, Kashmir, Uttarakhand, and International destinations.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sampooran",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport = {
  themeColor: "#0D1B3E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${raleway.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col pt-0 font-sans">
        <Providers>
          <Layout>
            {children}
          </Layout>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
