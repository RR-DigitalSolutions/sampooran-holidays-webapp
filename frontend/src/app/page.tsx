import HomeClient from "@/components/HomeClient";
import type { Metadata } from "next";
import { getApiUrl } from "@/lib/api-url";

export const metadata: Metadata = {
  title: "Sampooran Holidays — #1 Himalayan Travel Agency | Manali, Ladakh, Kashmir & Shimla",
  description: "Book premium, all-inclusive holiday packages for Manali, Leh Ladakh, Kashmir, Shimla, & Spiti Valley. Trusted by 5000+ travelers. Best B2B & B2C tour operators with 24/7 support.",
  keywords: "Manali holiday packages, Leh Ladakh tour, Kashmir honeymoon package, Shimla tour, Spiti Valley expedition, Himachal Pradesh travel, B2B travel agent India, best travel agency Himachal",
  openGraph: {
    title: "Sampooran Holidays — Your Himalayan Travel Experts",
    description: "Discover the magic of the Himalayas with curated tour packages. Manali, Ladakh, Kashmir, and more.",
    images: [{ url: "/logo.png", width: 800, height: 600, alt: "Sampooran Holidays" }],
    type: "website",
  },
};

async function getHomeConfig() {
  const API_URL = getApiUrl();
  
  const safeFetch = async (url: string, options?: RequestInit, retries = 1) => {
    for (let i = 0; i <= retries; i++) {
      try {
        const res = await fetch(url, { ...options, signal: AbortSignal.timeout(5000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (e: any) {
        const isConnRefused = e?.cause?.code === 'ECONNREFUSED' || e?.message?.includes('ECONNREFUSED');
        if (i === retries) {
          // Only log real errors, not expected startup connection failures
          if (!isConnRefused) {
            console.error(`[SSR] Fetch failed for ${url}:`, e instanceof Error ? e.message : e);
          }
          return null;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  try {
    const [config, pkgData, trendingData, testimonialData, topDestinations, trendingHotelsData] = await Promise.all([
      safeFetch(`${API_URL}/ota/home/config`, { next: { revalidate: 120 } }),
      safeFetch(`${API_URL}/packages?limit=6&featured=true`, { next: { revalidate: 120 } }),
      safeFetch(`${API_URL}/packages?limit=12&trending=true`, { next: { revalidate: 120 } }),
      safeFetch(`${API_URL}/testimonials`, { next: { revalidate: 120 } }),
      safeFetch(`${API_URL}/ota/home/top-destinations`, { next: { revalidate: 120 } }),
      safeFetch(`${API_URL}/ota/home/trending-hotels`, { next: { revalidate: 120 } })
    ]);

    return { 
      config: config || {}, 
      pkgData: pkgData || { packages: [] }, 
      trendingData: trendingData || { packages: [] }, 
      testimonialData: testimonialData || { testimonials: [] },
      topDestinations: topDestinations || { international: [], domestic: [], all: [] },
      trendingHotelsData: trendingHotelsData || []
    };
  } catch (error) {
    return { config: {}, pkgData: { packages: [] }, trendingData: { packages: [] }, testimonialData: { testimonials: [] }, topDestinations: { international: [], domestic: [], all: [] }, trendingHotelsData: [] };
  }
}

export default async function Home() {
  const data = await getHomeConfig();
  return <HomeClient initialData={data} />;
}
