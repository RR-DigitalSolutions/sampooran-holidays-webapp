import type { Metadata } from "next";
import { PackageListingPage } from "@/components/pages/PackageListingPage";
import { fetchPackageRouteData, titleCaseSlug } from "../../../route-utils";

type Props = { params: Promise<{ countrySlug: string; stateSlug: string; destinationSlug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { countrySlug, stateSlug, destinationSlug } = await params;
  const destination = await fetchPackageRouteData<any>(`/destinations/${destinationSlug}`);
  return {
    title: destination.metaTitle || `${destination.name} Tour Packages | Sampooran Holidays`,
    description: destination.metaDescription || destination.description || `Explore tour packages in ${destination.name}.`,
    alternates: { canonical: `https://sampooranholidays.com/packages/${countrySlug}/${stateSlug}/${destinationSlug}-tour-packages` },
  };
}

export default async function DestinationPackagesPage({ params, searchParams }: Props) {
  const { countrySlug, stateSlug, destinationSlug } = await params;
  const destination = await fetchPackageRouteData<any>(`/destinations/${destinationSlug}`);
  return <PackageListingPage entityType="destination" entityData={{ ...destination, name: destination.name || titleCaseSlug(destinationSlug), slug: destinationSlug, stateName: titleCaseSlug(stateSlug), countrySlug }} searchParams={await searchParams} />;
}