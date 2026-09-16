import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PackageListingPage } from "@/components/pages/PackageListingPage";
import { getDestinationPackageUrl } from "@/lib/utils";
import { fetchPackageDestinationRouteData, titleCaseSlug } from "../../../route-utils";

type Props = { params: Promise<{ countrySlug: string; stateSlug: string; destinationSlug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
type DestinationRouteData = {
  id?: number;
  name: string;
  slug: string;
  packagePageSlug?: string | null;
  countrySlug?: string | null;
  countryName?: string | null;
  stateSlug?: string | null;
  stateName?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  description?: string | null;
  [key: string]: unknown;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { countrySlug, destinationSlug } = await params;
  const destination = await fetchPackageDestinationRouteData<DestinationRouteData>(countrySlug, destinationSlug);
  return {
    title: destination.metaTitle || `${destination.name} Tour Packages | Sampooran Holidays`,
    description: destination.metaDescription || destination.description || `Explore tour packages in ${destination.name}.`,
    alternates: { canonical: `https://sampooranholidays.com${getDestinationPackageUrl(destination)}` },
  };
}

export default async function DestinationPackagesPage({ params, searchParams }: Props) {
  const { countrySlug, stateSlug, destinationSlug } = await params;
  const destination = await fetchPackageDestinationRouteData<DestinationRouteData>(countrySlug, destinationSlug);
  const requestedPath = `/packages/${countrySlug}/${stateSlug}/${destinationSlug}-tour-packages`;
  const canonicalPath = getDestinationPackageUrl(destination);

  if (canonicalPath !== requestedPath) redirect(canonicalPath);

  return <PackageListingPage entityType="destination" entityData={{ ...destination, name: destination.name || titleCaseSlug(destinationSlug), slug: destinationSlug, stateName: destination.stateName || titleCaseSlug(stateSlug), countrySlug: destination.countrySlug || countrySlug }} searchParams={await searchParams} />;
}