import type { Metadata } from "next";
import { PackageListingPage } from "@/components/pages/PackageListingPage";
import { fetchPackageRouteData, titleCaseSlug } from "../../route-utils";

type Props = { params: Promise<{ countrySlug: string; stateSlug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { countrySlug, stateSlug } = await params;
  const state = await fetchPackageRouteData<any>(`/states/${stateSlug}`);
  return {
    title: state.metaTitle || `${state.name} Tour Packages | Sampooran Holidays`,
    description: state.metaDescription || state.description || `Explore tour packages in ${state.name}.`,
    alternates: { canonical: `https://sampooranholidays.com/packages/${countrySlug}/${stateSlug}-tour-packages` },
  };
}

export default async function StatePackagesPage({ params, searchParams }: Props) {
  const { countrySlug, stateSlug } = await params;
  const state = await fetchPackageRouteData<any>(`/states/${stateSlug}`);
  return <PackageListingPage entityType="state" entityData={{ ...state, name: state.name || titleCaseSlug(stateSlug), slug: stateSlug }} searchParams={await searchParams} />;
}