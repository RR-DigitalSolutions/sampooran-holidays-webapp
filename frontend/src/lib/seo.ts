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
