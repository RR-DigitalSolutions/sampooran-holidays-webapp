import type { Metadata } from "next";
import { PackageListingPage } from "@/components/pages/PackageListingPage";
import { fetchPackageRouteData, titleCaseSlug } from "../route-utils";

type Props = { params: Promise<{ countrySlug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { countrySlug } = await params;
  const country = await fetchPackageRouteData<any>(`/countries/${countrySlug}`);
  return {
    title: country.metaTitle || `${country.name} Tour Packages | Sampooran Holidays`,
    description: country.metaDescription || country.description || `Explore the best tour packages in ${country.name}.`,
    alternates: { canonical: `https://sampooranholidays.com/packages/${countrySlug}-tour-packages` },
  };
}

export default async function CountryPackagesPage({ params, searchParams }: Props) {
  const { countrySlug } = await params;
  const country = await fetchPackageRouteData<any>(`/countries/${countrySlug}`);
  return <PackageListingPage entityType="country" entityData={{ ...country, name: country.name || titleCaseSlug(countrySlug), slug: countrySlug }} searchParams={await searchParams} />;
}