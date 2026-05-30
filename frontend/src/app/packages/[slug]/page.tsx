import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { PackageDetailsPage } from "@/components/pages/PackageDetailsPage";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080/api";

async function getPackageBySlug(slug: string) {
  try {
    const res = await fetch(`${API_URL}/destinations/resolve-slug/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.type !== "package") return null;
    return data.data;
  } catch (error) {
    console.error("Error fetching package:", error);
    return null;
  }
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  props: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await props.params;
  const pkg = await getPackageBySlug(params.slug);

  if (!pkg) {
    return { title: "Package Not Found | Sampooran Holidays" };
  }

  const title = pkg.metaTitle || `${pkg.name} | Sampooran Holidays`;
  const description =
    pkg.metaDescription ||
    pkg.shortDescription ||
    `Explore ${pkg.name} with Sampooran Holidays.`;
  const image = pkg.imageUrl || "/default-og.jpg";

  return {
    title,
    description,
    keywords: pkg.metaKeywords || pkg.tags?.join(", ") || "",
    openGraph: {
      title,
      description,
      images: [image],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function PackageDetailPage(props: Props) {
  const params = await props.params;
  const pkg = await getPackageBySlug(params.slug);

  if (!pkg) {
    notFound();
  }

  // Schema.org Structured Data for SEO/AEO/AIO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: pkg.name,
    description: pkg.shortDescription || pkg.description,
    image: pkg.imageUrl,
    touristType: pkg.category,
    itinerary: {
      "@type": "ItemList",
      itemListElement: pkg.itinerary?.map((day: any, i: number) => ({
        "@type": "ListItem",
        position: i + 1,
        name: day.title || `Day ${i + 1}`,
        description: day.description,
      })),
    },
    offers: {
      "@type": "Offer",
      price: pkg.pricePerPerson,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <main className="w-full flex flex-col min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PackageDetailsPage packageData={pkg} />
    </main>
  );
}
