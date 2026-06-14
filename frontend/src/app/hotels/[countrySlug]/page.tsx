/**
 * OLD HOTEL SLUG ROUTE — Redirects to new hierarchical URL
 * /hotels/[slug] → /hotels/[country]/[state]/hotels-in-[city]/[slug]
 *
 * This page fetches the hotel's location slugs and performs a server-side
 * permanent redirect to the new canonical URL structure.
 */
import { redirect, notFound } from "next/navigation";
import { getApiUrl } from "@/lib/api-url";

const API_URL = getApiUrl();

type Props = { params: Promise<{ countrySlug: string }> };

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

export default async function OldHotelSlugRedirect(props: Props) {
  const { countrySlug: slug } = await props.params;
  const data = await getHotelLocationSlugs(slug);

  if (!data) notFound();

  const { countrySlug, stateSlug, destinationSlug, customCity, hotelSlug } = data;

  // Build the new canonical URL
  if (countrySlug && stateSlug && (destinationSlug || customCity)) {
    const cityPart = destinationSlug
      ? `hotels-in-${destinationSlug}`
      : `hotels-in-${(customCity || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

    redirect(`/hotels/${countrySlug}/${stateSlug}/${cityPart}/${hotelSlug}`);
  }

  // Fallback: if no geo info, show the hotel detail via the new generic path
  // This handles hotels that still don't have geo slugs assigned
  notFound();
}
