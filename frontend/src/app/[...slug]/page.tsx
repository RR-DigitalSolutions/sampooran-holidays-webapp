import { cache } from "react";
import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { PackageListingPage } from "@/components/pages/PackageListingPage";
import { PackageDetailsPage } from "@/components/pages/PackageDetailsPage";
import { ThemeDetailPage } from "@/components/pages/ThemeDetailPage";
import { getApiUrl } from "@/lib/api-url";

const API_URL = getApiUrl();

/**
 * ⚡ React cache() — deduplicates the API call within a single render pass.
 * Both generateMetadata() and DynamicSlugPage() call this function, but React
 * ensures only ONE network request is made per slug per request.
 * 
 * Previously: 2 fetch calls per page click (metadata + page = double latency)
 * Now: 1 fetch call shared between both via React request memoization.
 */
const resolveSlug = cache(async (slug: string): Promise<{
  type: string;
  data: Record<string, any>;
} | null> => {
  try {
    const res = await fetch(`${API_URL}/destinations/resolve-slug/${slug}`, {
      // ISR: Next.js serves from its cache and revalidates in background every 2 min.
      // User always gets an instant response after first visit.
      next: { revalidate: 120 },
      // ⚡ Reduced timeout: backend now responds in <200ms (was 15s).
      // 5s is generous — covers Render cold-start without blocking users.
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error: any) {
    // Log but don't retry — the loading skeleton is already showing.
    // A retry would only make the user wait longer.
    console.error(`[resolveSlug] Failed for "${slug}":`, error?.message);
    return null;
  }
});

/**
 * Normalize a URL slug to a canonical lookup slug.
 * Strips suffixes like "-tourism", "-tour-packages" that we append to URLs
 * for SEO but don't exist in the DB.
 */
function normalizeSlug(rawSlug: string): string {
  if (rawSlug.endsWith("-holiday-tour-packages"))
    return rawSlug.replace("-holiday-tour-packages", "");
  if (rawSlug.endsWith("-tour-packages"))
    return rawSlug.replace("-tour-packages", "");
  if (rawSlug.endsWith("-tourism"))
    return rawSlug.replace("-tourism", "");
  return rawSlug;
}

type Props = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  props: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await props.params;

  if (!params.slug || params.slug.length === 0) {
    return { title: "Sampooran Holidays" };
  }

  const lastSlug = params.slug[params.slug.length - 1];
  const lookupSlug = normalizeSlug(lastSlug);

  // React cache() ensures this shares the same fetch as DynamicSlugPage
  let resolved = await resolveSlug(lookupSlug);

  // Fallback: if stripped slug doesn't exist, try exact URL slug
  if ((!resolved || !resolved.data) && lookupSlug !== lastSlug) {
    resolved = await resolveSlug(lastSlug);
  }

  if (!resolved?.data) return { title: "Not Found" };

  const { data, type } = resolved;
  const title =
    data.metaTitle ||
    data.name + (type === "package" ? " Tour Package" : " Tourism");
  const description =
    data.metaDescription ||
    data.shortDescription ||
    data.description ||
    `Explore the best of ${data.name} with Sampooran Holidays.`;
  const image = data.imageUrl || data.ogImageUrl || "/default-og.jpg";

  return {
    title,
    description,
    keywords: data.metaKeywords || data.tags?.join(", ") || "",
    openGraph: { title, description, images: [image], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function DynamicSlugPage(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  if (!params.slug || params.slug.length === 0) {
    return null; // Home page handled by app/page.tsx
  }

  const lastSlug = params.slug[params.slug.length - 1];
  const lookupSlug = normalizeSlug(lastSlug);

  // ⚡ React cache() — same call as generateMetadata, zero extra network request
  let resolved = await resolveSlug(lookupSlug);

  // Fallback: try exact URL slug if normalized one wasn't found
  if ((!resolved || !resolved.data) && lookupSlug !== lastSlug) {
    resolved = await resolveSlug(lastSlug);
  }

  if (!resolved?.data) {
    notFound();
  }

  const { type, data } = resolved;

  // Schema.org Structured Data (AEO/AIO — helps with AI search engines)
  const jsonLd = {
    "@context": "https://schema.org",
    ...(type === "package"
      ? {
          "@type": "TouristTrip",
          name: data.name,
          description: data.shortDescription || data.description,
          image: data.imageUrl,
          touristType: data.category,
          itinerary: {
            "@type": "ItemList",
            itemListElement: data.itinerary?.map((day: any, i: number) => ({
              "@type": "ListItem",
              position: i + 1,
              name: day.title || `Day ${i + 1}`,
              description: day.description,
            })),
          },
          offers: {
            "@type": "Offer",
            price: data.pricePerPerson,
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
          },
        }
      : {
          "@type": data.schemaType || "TouristDestination",
          name: data.name,
          description: data.description,
          image: data.imageUrl,
        }),
  };

  return (
    <main className="w-full flex flex-col min-h-screen bg-slate-50">
      {/* Structured Data for SEO/AEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {type === "package" && <PackageDetailsPage packageData={data} />}

      {type === "theme" && (
        <ThemeDetailPage entityData={data} searchParams={searchParams} />
      )}

      {(type === "country" || type === "state" || type === "destination") && (
        <PackageListingPage
          entityType={type}
          entityData={data}
          searchParams={searchParams}
        />
      )}
    </main>
  );
}
