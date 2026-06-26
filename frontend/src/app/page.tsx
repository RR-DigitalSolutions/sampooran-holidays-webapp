import HomeClient from "@/components/HomeClient";
import type { Metadata } from "next";
import { getApiUrl } from "@/lib/api-url";

import { getPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const fallback = {
    title: "Sampooran Holidays — #1 Himalayan Travel Agency | Manali, Ladakh, Kashmir & Shimla",
    description: "Book premium, all-inclusive holiday packages for Manali, Leh Ladakh, Kashmir, Shimla, & Spiti Valley. Trusted by 5000+ travelers. Best B2B & B2C tour operators with 24/7 support.",
    keywords: "Manali holiday packages, Leh Ladakh tour, Kashmir honeymoon package, Shimla tour, Spiti Valley expedition, Himachal Pradesh travel, B2B travel agent India, best travel agency Himachal",
    openGraph: {
      title: "Sampooran Holidays — Your Himalayan Travel Experts",
      description: "Discover the magic of the Himalayas with curated tour packages. Manali, Ladakh, Kashmir, and more.",
      images: [{ url: "/logo.png", width: 800, height: 600, alt: "Sampooran Holidays" }],
      type: "website" as const,
    },
  };
  return getPageMetadata("home", fallback);
}

async function getHomeConfig() {
  const API_URL = getApiUrl();
  console.log(`[SSR] getHomeConfig starting with API_URL: ${API_URL}`);
  
  const safeFetch = async (url: string, options?: RequestInit, retries = 0) => {
    const startTime = Date.now();
    console.log(`[SSR] Fetching: ${url}`);
    for (let i = 0; i <= retries; i++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn(`[SSR] Fetch timeout (2s) reached for: ${url}`);
        controller.abort();
      }, 2000);

      try {
        const res = await fetch(url, { 
          ...options, 
          signal: controller.signal 
        });
        clearTimeout(timeoutId);
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log(`[SSR] Fetch success [${Date.now() - startTime}ms]: ${url}`);
        return data;
      } catch (e: any) {
        clearTimeout(timeoutId);
        const isConnRefused = e?.cause?.code === 'ECONNREFUSED' || e?.message?.includes('ECONNREFUSED');
        if (i === retries) {
          if (!isConnRefused) {
            console.error(`[SSR] Fetch failed for ${url}:`, e instanceof Error ? e.message : e);
          } else {
            console.warn(`[SSR] Connection refused for: ${url}`);
          }
          return null;
        }
        console.log(`[SSR] Retrying fetch [${i+1}/${retries}] for: ${url}`);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  };

  try {
    const promises = [
      safeFetch(`${API_URL}/ota/home/config`, { next: { revalidate: 120 } }),
      safeFetch(`${API_URL}/packages?limit=6&featured=true`, { next: { revalidate: 120 } }),
      safeFetch(`${API_URL}/packages?limit=12&trending=true`, { next: { revalidate: 120 } }),
      safeFetch(`${API_URL}/testimonials`, { next: { revalidate: 120 } }),
      safeFetch(`${API_URL}/ota/home/top-destinations`, { next: { revalidate: 120 } }),
      safeFetch(`${API_URL}/ota/home/trending-hotels`, { next: { revalidate: 120 } }),
      safeFetch(`${API_URL}/ota/transport`, { next: { revalidate: 120 } })
    ];

    const [config, pkgData, trendingData, testimonialData, topDestinations, trendingHotelsData, transportData] = await Promise.all(promises);
    console.log(`[SSR] All fetches resolved!`);

    return { 
      config: config || {}, 
      pkgData: pkgData || { packages: [] }, 
      trendingData: trendingData || { packages: [] }, 
      testimonialData: testimonialData || { testimonials: [] },
      topDestinations: topDestinations || { international: [], domestic: [], all: [] },
      trendingHotelsData: trendingHotelsData || [],
      transportData: transportData || []
    };
  } catch (error) {
    console.error("[SSR] Error during Promise.all:", error);
    return { config: {}, pkgData: { packages: [] }, trendingData: { packages: [] }, testimonialData: { testimonials: [] }, topDestinations: { international: [], domestic: [], all: [] }, trendingHotelsData: [], transportData: [] };
  }
}

export default async function Home() {
  const data = await getHomeConfig();
  return <HomeClient initialData={data} />;
}
