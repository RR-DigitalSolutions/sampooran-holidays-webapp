import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageDetailsPage } from "@/components/pages/PackageDetailsPage";
import { getApiUrl } from "@/lib/api-url";

type Props = { params: Promise<{ countrySlug: string; stateSlug: string; destinationSlug: string; packageSlug: string }> };

async function getPackage(params: Awaited<Props["params"]>) {
  const response = await fetch(`${getApiUrl()}/packages/by-path/${params.countrySlug}/${params.stateSlug}/${params.destinationSlug}/${params.packageSlug}`, { next: { revalidate: 120 } });
  if (!response.ok) return null;
  return response.json();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const routeParams = await params;
  const resolved = await getPackage(routeParams);
  if (!resolved) return { title: "Package Not Found | Sampooran Holidays" };
  return {
    title: resolved.metaTitle || `${resolved.name} | Sampooran Holidays`,
    description: resolved.metaDescription || resolved.shortDescription || `Explore ${resolved.name} with Sampooran Holidays.`,
    alternates: {
      canonical: `https://sampooranholidays.com/packages/${routeParams.countrySlug}/${routeParams.stateSlug}/${routeParams.destinationSlug}/${routeParams.packageSlug}`,
    },
  };
}

export default async function CanonicalPackagePage({ params }: Props) {
  const resolved = await getPackage(await params);
  if (!resolved) notFound();
  return <main className="w-full flex flex-col min-h-screen bg-slate-50"><PackageDetailsPage packageData={resolved} /></main>;
}