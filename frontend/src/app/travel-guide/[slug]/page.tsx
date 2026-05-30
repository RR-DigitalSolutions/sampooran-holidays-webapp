import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { TravelGuidePage } from "@/components/pages/TravelGuidePage";
import { getApiUrl } from "@/lib/api-url";

async function resolveSlug(slug: string) {
  try {
    const res = await fetch(`${getApiUrl()}/destinations/resolve-slug/${slug}`, {
      next: { revalidate: 3600 } 
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error resolving slug:", error);
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
  const resolved = await resolveSlug(params.slug);

  if (!resolved || !resolved.data) {
    return { title: 'Travel Guide Not Found' };
  }

  const { data } = resolved;
  const title = `${data.name} Travel Guide | Sampooran Holidays`;
  const description = data.shortDescription || data.description || `Read our complete travel guide for ${data.name}.`;
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [data.imageUrl || '/default-og.jpg'],
    }
  };
}

export default async function DynamicTravelGuidePage(props: Props) {
  const params = await props.params;
  const resolved = await resolveSlug(params.slug);

  if (!resolved || !resolved.data) {
    notFound();
  }

  const { type, data } = resolved;

  // Render the travel guide component
  return <TravelGuidePage guide={{ ...data, title: data.name || data.title, entityType: type }} />;
}
