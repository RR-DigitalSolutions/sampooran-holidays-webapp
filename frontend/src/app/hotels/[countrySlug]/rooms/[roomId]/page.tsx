/**
 * OLD ROOM ROUTE — Redirects to new hierarchical URL
 * /hotels/[slug]/rooms/[roomId] → /hotels/[country]/[state]/hotels-in-[city]/[slug]/[roomSlug]
 */
import { redirect, notFound } from "next/navigation";
import { getApiUrl } from "@/lib/api-url";

const API_URL = getApiUrl();

type Props = { params: Promise<{ countrySlug: string; roomId: string }> };

export default async function OldRoomRedirect(props: Props) {
  const { countrySlug: slug, roomId } = await props.params;

  try {
    const res = await fetch(`${API_URL}/hotels/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) notFound();
    const hotel = await res.json();

    const { countrySlug, stateSlug, destinationSlug, customCity } = hotel;

    // Find the room by ID to get its slug
    const room = (hotel.rooms || []).find((r: any) => String(r.id) === roomId);
    const roomSlug = room?.slug || roomId;

    if (countrySlug && stateSlug && (destinationSlug || customCity)) {
      const cityPart = destinationSlug
        ? `hotels-in-${destinationSlug}`
        : `hotels-in-${(customCity || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

      redirect(`/hotels/${countrySlug}/${stateSlug}/${cityPart}/${slug}/${roomSlug}`);
    }
  } catch { /* fall through */ }

  notFound();
}
