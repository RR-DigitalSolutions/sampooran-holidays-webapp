import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { PackageListingPage } from "@/components/pages/PackageListingPage";
import { PackageDetailsPage } from "@/components/pages/PackageDetailsPage";
import { ThemeDetailPage } from "@/components/pages/ThemeDetailPage";
import { getApiUrl } from "@/lib/api-url";

const API_URL = getApiUrl();

// Function to resolve slug from backend with retry for Render cold-start
async function resolveSlug(slug: string, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${API_URL}/destinations/resolve-slug/${slug}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(15000), // 15s timeout for Render cold starts
      });
      
      if (!res.ok) return null;
      return await res.json();
    } catch (error: any) {
      console.error(`[resolveSlug] Attempt ${attempt + 1}/${retries + 1} failed for "${slug}":`, error?.message || error);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000)); // Wait 1s between retries
      }
    }
  }
  return null;
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
    return { title: 'Sampooran Holidays' };
  }

  const lastSlug = params.slug[params.slug.length - 1];
  
  let lookupSlug = lastSlug;
  if (lastSlug.endsWith('-tourism')) lookupSlug = lastSlug.replace('-tourism', '');
  else if (lastSlug.endsWith('-holiday-tour-packages')) lookupSlug = lastSlug.replace('-holiday-tour-packages', '');
  else if (lastSlug.endsWith('-tour-packages')) lookupSlug = lastSlug.replace('-tour-packages', '');

  let resolved = await resolveSlug(lookupSlug);
  
  // Fallback: If stripped slug doesn't exist, try the exact raw slug (in case they explicitly set 'family-tours' etc. in CMS)
  if ((!resolved || !resolved.data) && lookupSlug !== lastSlug) {
    resolved = await resolveSlug(lastSlug);
  }

  if (!resolved || !resolved.data) {
    return { title: 'Not Found' };
  }

  const { data, type } = resolved;
  
  // Basic SEO/AEO/AIO Data
  const title = data.metaTitle || data.name + (type === 'package' ? ' Tour Package' : ' Tourism');
  const description = data.metaDescription || data.shortDescription || data.description || `Explore the best of ${data.name} with Sampooran Holidays.`;
  const image = data.imageUrl || data.ogImageUrl || '/default-og.jpg';

  return {
    title,
    description,
    keywords: data.metaKeywords || data.tags?.join(', ') || '',
    openGraph: {
      title,
      description,
      images: [image],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    }
  };
}

export default async function DynamicSlugPage(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  // If no slug, this would be the home page, but the home page has its own app/page.tsx.
  if (!params.slug || params.slug.length === 0) {
    return null; // Handled by app/page.tsx
  }

  const lastSlug = params.slug[params.slug.length - 1];
  
  // Optional: Based on naming conventions (Veena World style)
  // e.g. "-tourism", "-tour-packages", "-holiday-tour-packages"
  const isTourismPage = lastSlug.endsWith('-tourism');
  const isPackagesPage = lastSlug.includes('-tour-packages');

  let lookupSlug = lastSlug;
  if (isTourismPage) lookupSlug = lastSlug.replace('-tourism', '');
  else if (lastSlug.endsWith('-holiday-tour-packages')) lookupSlug = lastSlug.replace('-holiday-tour-packages', '');
  else if (lastSlug.endsWith('-tour-packages')) lookupSlug = lastSlug.replace('-tour-packages', '');

  let resolved = await resolveSlug(lookupSlug);

  // Fallback: If stripped slug doesn't exist, try the exact raw slug
  if ((!resolved || !resolved.data) && lookupSlug !== lastSlug) {
    resolved = await resolveSlug(lastSlug);
  }

  if (!resolved || !resolved.data) {
    notFound();
  }

  const { type, data } = resolved;

  // Schema.org Structured Data for AEO/AIO
  const jsonLd = {
    '@context': 'https://schema.org',
    ...(type === 'package' ? {
      '@type': 'TouristTrip',
      name: data.name,
      description: data.shortDescription || data.description,
      image: data.imageUrl,
      touristType: data.category,
      itinerary: {
        '@type': 'ItemList',
        itemListElement: data.itinerary?.map((day: any, i: number) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: day.title || `Day ${i+1}`,
          description: day.description
        }))
      },
      offers: {
        '@type': 'Offer',
        price: data.pricePerPerson,
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock'
      }
    } : {
      '@type': data.schemaType || 'TouristDestination',
      name: data.name,
      description: data.description,
      image: data.imageUrl
    })
  };

  return (
    <main className="w-full flex flex-col min-h-screen bg-slate-50">
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {type === 'package' && <PackageDetailsPage packageData={data} />}
      
      {type === 'theme' && <ThemeDetailPage entityData={data} searchParams={searchParams} />}
      
      {/* Package Listing for all destination areas and explicit package URLs */}
      {(type === 'country' || type === 'state' || type === 'destination') && type !== 'package' && type !== 'theme' && (
        <PackageListingPage entityType={type} entityData={data} searchParams={searchParams} />
      )}
    </main>
  );
}
