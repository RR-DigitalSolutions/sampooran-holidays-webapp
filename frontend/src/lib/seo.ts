/**
 * SEO Utilities for Sampooran Holidays
 * Generates Schema.org compliant JSON-LD for AI and Search indexing.
 */

export function generateTourSchema(pkg: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Tour",
    "name": pkg.name,
    "description": pkg.shortDescription || pkg.name,
    "image": pkg.imageUrl,
    "tourDuration": `P${pkg.duration}D`,
    "offers": {
      "@type": "Offer",
      "price": pkg.pricePerPerson,
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "url": `https://sampooranholidays.com/packages/${pkg.slug}`
    },
    "itinerary": pkg.itinerary?.map((item: any, index: number) => ({
      "@type": "TourItinerary",
      "name": `Day ${index + 1}: ${item.title}`,
      "description": item.description
    })),
    "provider": {
      "@type": "TravelAgency",
      "name": "Sampooran Holidays",
      "url": "https://sampooranholidays.com",
      "logo": "https://sampooranholidays.com/logo.png"
    },
    "aggregateRating": pkg.reviewCount > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": pkg.rating || 4.5,
      "reviewCount": pkg.reviewCount
    } : undefined
  };
}

export function generateDestinationSchema(dest: any) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    "name": dest.name || dest.metaTitle,
    "description": dest.metaDescription || dest.description || dest.name,
    "image": dest.imageUrl,
    "touristType": "Sightseeing",
    "publicAccess": true,
    "geo": (dest.altitude || dest.latitude) ? {
      "@type": "GeoCoordinates",
      "elevation": dest.altitude,
      "latitude": dest.latitude,
      "longitude": dest.longitude
    } : undefined,
    "containsPlace": dest.localAttractions?.map((attr: string) => ({
      "@type": "Place",
      "name": attr
    }))
  };
}

export function generateFAQSchema(faqs: any[]) {
  if (!faqs || faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq: any) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

export function generateBreadcrumbSchema(items: { name: string; item: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `https://sampooranholidays.com${item.item}`
    }))
  };
}

export async function getPageMetadata(
  pageKey: string,
  fallback: { title: string; description: string; keywords?: string }
) {
  try {
    const { getApiUrl } = await import("./api-url");
    const res = await fetch(`${getApiUrl()}/ota/settings`, { next: { revalidate: 60 } });
    if (!res.ok) {
      return {
        title: fallback.title,
        description: fallback.description,
        keywords: fallback.keywords,
      };
    }
    const settings = await res.json();

    // Check if there is page metadata key, e.g. meta_home, meta_about
    const metaStr = settings[`meta_${pageKey}`];
    let title = fallback.title;
    let description = fallback.description;
    let keywords = fallback.keywords;

    if (metaStr) {
      try {
        const meta = typeof metaStr === "string" ? JSON.parse(metaStr) : metaStr;
        if (meta.title) title = meta.title;
        if (meta.description) description = meta.description;
        if (meta.keywords) keywords = meta.keywords;
      } catch (e) {
        console.error(`Error parsing JSON metadata for key meta_${pageKey}`, e);
      }
    }

    const ogBanner = settings.og_banner || "/logo.png";

    return {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        images: [{ url: ogBanner, alt: title }],
        type: "website",
      },
    };
  } catch (error) {
    console.error(`Error fetching page metadata for ${pageKey}`, error);
    return {
      title: fallback.title,
      description: fallback.description,
      keywords: fallback.keywords,
    };
  }
}
