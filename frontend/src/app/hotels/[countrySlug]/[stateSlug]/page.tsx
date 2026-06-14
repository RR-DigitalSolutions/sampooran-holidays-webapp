import type { Metadata } from "next";
import { getApiUrl } from "@/lib/api-url";
import HotelsClient from "@/components/pages/HotelsClient";

const API_URL = getApiUrl();

type Props = { params: Promise<{ countrySlug: string; stateSlug: string }> };

async function getStateInfo(stateSlug: string) {
  try {
    const res = await fetch(`${API_URL}/states/${stateSlug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countrySlug, stateSlug } = await props.params;
  const state = await getStateInfo(stateSlug);

  const stateName = state?.name || stateSlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const countryName = state?.countryName || countrySlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

  const title = `Hotels in ${stateName}, ${countryName} | Best Stays & Resorts | Sampooran Holidays`;
  const description = state?.description
    ? state.description.slice(0, 160)
    : `Browse and book the best hotels, resorts, homestays and cottages in ${stateName}, ${countryName}. Verified properties, best price guarantee with Sampooran Holidays.`;

  const canonicalUrl = `https://sampooranholidays.com/hotels/${countrySlug}/${stateSlug}`;

  return {
    title,
    description,
    keywords: `hotels in ${stateName}, ${stateName} hotels, resorts in ${stateName}, ${stateName} accommodation, best hotels ${stateName} ${countryName}, book hotel ${stateName}`,
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: state?.imageUrl || "/logo.png", width: 1200, height: 630, alt: `Hotels in ${stateName}` }],
    },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: canonicalUrl },
    robots: { index: true, follow: true },
  };
}

export default async function HotelsByStatePage(props: Props) {
  const { countrySlug, stateSlug } = await props.params;
  const state = await getStateInfo(stateSlug);

  const stateName = state?.name || stateSlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const countryName = state?.countryName || countrySlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

  // Breadcrumb JSON-LD for AEO/GEO
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://sampooranholidays.com" },
      { "@type": "ListItem", position: 2, name: "Hotels", item: "https://sampooranholidays.com/hotels" },
      { "@type": "ListItem", position: 3, name: countryName, item: `https://sampooranholidays.com/hotels/${countrySlug}` },
      { "@type": "ListItem", position: 4, name: `Hotels in ${stateName}`, item: `https://sampooranholidays.com/hotels/${countrySlug}/${stateSlug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {/* Pass geo filters to the hotels client */}
      <HotelsClient
        geoFilter={{ country: countrySlug, state: stateSlug }}
        pageTitle={`Hotels in ${stateName}`}
        pageSubtitle={`${countryName} • Find & Book Verified Properties`}
        breadcrumbs={[
          { label: "Hotels", href: "/hotels" },
          { label: countryName, href: `/hotels/${countrySlug}` },
          { label: `Hotels in ${stateName}`, href: `/hotels/${countrySlug}/${stateSlug}` },
        ]}
      />
    </>
  );
}
