import { MetadataRoute } from 'next';
import { getApiUrl } from '@/lib/api-url';

const BASE_URL = 'https://sampooranholidays.com';

// Mark as dynamic so it runs at request time (not at build time)
// This prevents the DB connection timeout during static export
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch dynamic pages from backend API (not directly from DB)
  let packageRoutes: MetadataRoute.Sitemap = [];
  let destinationRoutes: MetadataRoute.Sitemap = [];

  try {
    const backendBase = getApiUrl();

    const [pkgRes, destRes] = await Promise.allSettled([
      fetch(`${backendBase}/packages?limit=500`, { next: { revalidate: 3600 } }),
      fetch(`${backendBase}/destinations?limit=500`, { next: { revalidate: 3600 } }),
    ]);

    if (pkgRes.status === 'fulfilled' && pkgRes.value.ok) {
      const pkgData = await pkgRes.value.json();
      const packages: Array<{ slug: string; updatedAt?: string; createdAt?: string }> =
        pkgData.packages || [];
      packageRoutes = packages.map((pkg) => ({
        url: `${BASE_URL}/packages/${pkg.slug}`,
        lastModified: pkg.updatedAt || pkg.createdAt || new Date().toISOString(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }

    if (destRes.status === 'fulfilled' && destRes.value.ok) {
      const destData = await destRes.value.json();
      const destinations: Array<{ slug: string; updatedAt?: string; createdAt?: string }> =
        destData.destinations || [];
      destinationRoutes = destinations.map((dest) => ({
        url: `${BASE_URL}/destinations/${dest.slug}`,
        lastModified: dest.updatedAt || dest.createdAt || new Date().toISOString(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }));
    }
  } catch {
    // If backend is unavailable during build, serve a minimal sitemap
    // Dynamic entries will be available at runtime
  }

  // Static routes — always included
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/india',
    '/asia',
    '/transport',
    '/b2b',
    '/about',
    '/contact',
    '/blog',
    '/customize',
    '/packages',
    '/destinations',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.9,
  }));

  return [...staticRoutes, ...packageRoutes, ...destinationRoutes];
}
