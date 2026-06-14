import type { Metadata } from "next";
import { getApiUrl } from "@/lib/api-url";
import HotelsClient from "@/components/pages/HotelsClient";

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

  // citySlug is "hotels-in-manali" → strip "hotels-in-" prefix
  const rawCity = citySlug.replace(/^hotels-in-/, "");
  const [city, state] = await Promise.all([getCityInfo(rawCity), getStateInfo(stateSlug)]);

  const cityName = city?.name || rawCity.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const stateName = state?.name || stateSlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const countryName = city?.countryName || state?.countryName || countrySlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

  const title = `Hotels in ${cityName}, ${stateName} | Book Best Hotels & Resorts | Sampooran Holidays`;
  const description = city?.description
    ? city.description.slice(0, 160)
    : `Find and book the best hotels, luxury resorts, boutique homestays, and cottages in ${cityName}, ${stateName}. Best rates guaranteed with Sampooran Holidays OTA.`;

  const canonicalUrl = `https://sampooranholidays.com/hotels/${countrySlug}/${stateSlug}/${citySlug}`;

  return {
    title,
    description,
    keywords: `hotels in ${cityName}, ${cityName} hotels, resorts in ${cityName}, best hotels ${cityName}, ${cityName} accommodation, book hotel ${cityName} ${stateName}, ${cityName} ${stateName} hotels`,
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: city?.imageUrl || "/logo.png", width: 1200, height: 630, alt: `Hotels in ${cityName}` }],
    },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: canonicalUrl },
    robots: { index: true, follow: true },
  };
}

export default async function HotelsInCityPage(props: Props) {
  const { countrySlug, stateSlug, citySlug } = await props.params;

  // citySlug format is "hotels-in-manali" — strip prefix to get destination slug
  const rawCity = citySlug.replace(/^hotels-in-/, "");
  const [city, state] = await Promise.all([getCityInfo(rawCity), getStateInfo(stateSlug)]);

  const cityName = city?.name || rawCity.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const stateName = state?.name || stateSlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const countryName = city?.countryName || state?.countryName || countrySlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

  // ItemList + Breadcrumb JSON-LD for GEO/AEO
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://sampooranholidays.com" },
      { "@type": "ListItem", position: 2, name: "Hotels", item: "https://sampooranholidays.com/hotels" },
      { "@type": "ListItem", position: 3, name: countryName, item: `https://sampooranholidays.com/hotels/${countrySlug}` },
      { "@type": "ListItem", position: 4, name: `Hotels in ${stateName}`, item: `https://sampooranholidays.com/hotels/${countrySlug}/${stateSlug}` },
      { "@type": "ListItem", position: 5, name: `Hotels in ${cityName}`, item: `https://sampooranholidays.com/hotels/${countrySlug}/${stateSlug}/${citySlug}` },
    ],
  };

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    "name": cityName,
    "description": city?.description || `Hotels and accommodations in ${cityName}, ${stateName}`,
    "url": `https://sampooranholidays.com/hotels/${countrySlug}/${stateSlug}/${citySlug}`,
    ...(city?.latitude && city?.longitude ? {
      "geo": { "@type": "GeoCoordinates", "latitude": city.latitude, "longitude": city.longitude }
    } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }} />
      <HotelsClient
        geoFilter={{ country: countrySlug, state: stateSlug, city: rawCity }}
        pageTitle={`Hotels in ${cityName}`}
        pageSubtitle={`${stateName}, ${countryName} • Verified Properties`}
        breadcrumbs={[
          { label: "Hotels", href: "/hotels" },
          { label: countryName, href: `/hotels/${countrySlug}` },
          { label: `Hotels in ${stateName}`, href: `/hotels/${countrySlug}/${stateSlug}` },
          { label: `Hotels in ${cityName}`, href: `/hotels/${countrySlug}/${stateSlug}/${citySlug}` },
        ]}
        cityInfo={city}
      />
    </>
  );
}
