import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getApiUrl } from "@/lib/api-url";
import HotelsClient from "@/components/pages/HotelsClient";

const API_URL = getApiUrl();

type Props = { params: Promise<{ countrySlug: string }> };

async function getCountryInfo(slug: string) {
  try {
    const res = await fetch(`${API_URL}/countries/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function getHotelLocationSlugs(slug: string) {
  try {
    const res = await fetch(`${API_URL}/hotels/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const hotel = await res.json();
    return {
      countrySlug: hotel.countrySlug,
      stateSlug: hotel.stateSlug,
      destinationSlug: hotel.destinationSlug,
      customCity: hotel.customCity,
      hotelSlug: hotel.slug,
    };
  } catch { return null; }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countrySlug: slug } = await props.params;
  const country = await getCountryInfo(slug);

  if (country) {
    const countryName = country.name || slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
    const title = `Hotels in ${countryName} | Best Stays & Resorts | Sampooran Holidays`;
    const description = `Find and book the best hotels, luxury resorts, homestays and cottages in ${countryName}. Verified properties, best price guarantee with Sampooran Holidays.`;
    const canonicalUrl = `https://sampooranholidays.com/hotels/${slug}`;

    return {
      title,
      description,
      alternates: { canonical: canonicalUrl },
      robots: { index: true, follow: true },
    };
  }

  const data = await getHotelLocationSlugs(slug);
  if (!data) return { title: 'Not Found' };

  const { countrySlug, stateSlug, destinationSlug, customCity, hotelSlug } = data;
  if (countrySlug && stateSlug && (destinationSlug || customCity)) {
    const cityPart = destinationSlug
      ? `hotels-in-${destinationSlug}`
      : `hotels-in-${(customCity || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    return {
      alternates: { canonical: `https://sampooranholidays.com/hotels/${countrySlug}/${stateSlug}/${cityPart}/${hotelSlug}` },
    };
  }

  return { title: 'Not Found' };
}

export default async function HotelsOrRedirectPage(props: Props) {
  const { countrySlug: slug } = await props.params;

  // 1. Check if slug belongs to a registered country
  const country = await getCountryInfo(slug);
  if (country) {
    const countryName = country.name || slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
    return (
      <HotelsClient
        geoFilter={{ country: slug }}
        pageTitle={`Hotels in ${countryName}`}
        pageSubtitle={`Explore & Book Verified Properties`}
        breadcrumbs={[
          { label: "Hotels", href: "/hotels" },
          { label: countryName, href: `/hotels/${slug}` },
        ]}
      />
    );
  }

  // 2. Otherwise assume it's a legacy hotel slug and redirect
  const data = await getHotelLocationSlugs(slug);

  if (!data) notFound();

  const { countrySlug, stateSlug, destinationSlug, customCity, hotelSlug } = data;

  if (countrySlug && stateSlug && (destinationSlug || customCity)) {
    const cityPart = destinationSlug
      ? `hotels-in-${destinationSlug}`
      : `hotels-in-${(customCity || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

    redirect(`/hotels/${countrySlug}/${stateSlug}/${cityPart}/${hotelSlug}`);
  }

  notFound();
}
