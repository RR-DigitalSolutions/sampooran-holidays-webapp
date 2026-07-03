import type { Metadata } from "next";
import { getApiUrl } from "@/lib/api-url";
import TransportClient from "@/components/pages/TransportClient";

const API_URL = getApiUrl();

type Props = { params: Promise<{ countrySlug: string; stateSlug: string; citySlug: string }> };

async function getCityInfo(citySlug: string) {
  try {
    const res = await fetch(`${API_URL}/destinations/${citySlug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function getStateInfo(stateSlug: string) {
  try {
    const res = await fetch(`${API_URL}/states/${stateSlug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countrySlug, stateSlug, citySlug } = await props.params;

  // citySlug is "transport-in-manali" → strip "transport-in-" prefix
  const rawCity = citySlug.replace(/^transport-in-/, "");
  const [city, state] = await Promise.all([getCityInfo(rawCity), getStateInfo(stateSlug)]);

  const cityName = city?.name || rawCity.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const stateName = state?.name || stateSlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const countryName = city?.countryName || state?.countryName || countrySlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

  const title = `Premium Cabs, Tempo Travellers & Buses in ${cityName}, ${stateName} | Sampooran Holidays`;
  const description = `Rent local/outstation cabs, luxury SUV cars, tempo travellers (12-seater/17-seater), and Volvo buses in ${cityName}, ${stateName}. Safe, professional drivers at best rates.`;

  const canonicalUrl = `https://sampooranholidays.com/transport/${countrySlug}/${stateSlug}/${citySlug}`;

  return {
    title,
    description,
    keywords: `cabs in ${cityName}, car rental ${cityName}, tempo traveller ${cityName}, bus booking ${cityName}, transport services ${cityName}`,
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: city?.imageUrl || "/logo.png", width: 1200, height: 630, alt: `Transport in ${cityName}` }],
    },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: canonicalUrl },
    robots: { index: true, follow: true },
  };
}

export default async function TransportInCityPage(props: Props) {
  const { countrySlug, stateSlug, citySlug } = await props.params;

  const rawCity = citySlug.replace(/^transport-in-/, "");
  const [city, state] = await Promise.all([getCityInfo(rawCity), getStateInfo(stateSlug)]);

  const cityName = city?.name || rawCity.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const stateName = state?.name || stateSlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const countryName = city?.countryName || state?.countryName || countrySlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://sampooranholidays.com" },
      { "@type": "ListItem", position: 2, name: "Transport", item: "https://sampooranholidays.com/transport" },
      { "@type": "ListItem", position: 3, name: countryName, item: `https://sampooranholidays.com/transport/${countrySlug}` },
      { "@type": "ListItem", position: 4, name: `Transport in ${stateName}`, item: `https://sampooranholidays.com/transport/${countrySlug}/${stateSlug}` },
      { "@type": "ListItem", position: 5, name: `Transport in ${cityName}`, item: `https://sampooranholidays.com/transport/${countrySlug}/${stateSlug}/${citySlug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <TransportClient
        geoFilter={{ country: countrySlug, state: stateSlug, city: rawCity }}
        pageTitle={`Transport Fleet in ${cityName}`}
      />
    </>
  );
}
