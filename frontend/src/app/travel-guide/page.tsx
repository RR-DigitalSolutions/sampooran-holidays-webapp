import { Metadata } from "next";
import Link from "next/link";
import { Compass, Map, Globe, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: 'Travel Guides | Sampooran Holidays',
  description: 'Explore comprehensive travel guides for destinations across India and the World. Find the best time to visit, how to reach, and top attractions.',
};

async function getTopDestinations() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api'}/ota/home/top-destinations`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch top destinations for travel guide hub:", error);
    return null;
  }
}

export default async function TravelGuideHub() {
  const data = await getTopDestinations();
  const domestic = data?.domestic || [];
  const international = data?.international || [];

  return (
    <main className="w-full flex flex-col min-h-screen bg-slate-50 font-sans">
      {/* Hero */}
      <section className="bg-primary text-white py-20 px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold font-serif mb-6">Explore the World</h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto font-medium opacity-90">
          Discover comprehensive travel guides covering everything you need to know before your next adventure.
        </p>
      </section>

      <section className="py-16 container mx-auto px-4">
        {/* Domestic Guides */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold font-serif text-slate-900 mb-8 flex items-center gap-3">
            <Map className="w-8 h-8 text-accent" /> Incredible India Guides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {domestic.map((dest: any) => (
              <div key={dest.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                <div className="relative h-48 overflow-hidden">
                  <img src={dest.imageUrl} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-2">{dest.name} Travel Guide</h3>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2">Discover the best places to visit, local cuisine, and hidden gems in {dest.name}.</p>
                  
                  <Link href={`/travel-guide/${dest.slug}`} className="text-accent font-bold text-sm uppercase tracking-wider flex items-center gap-1 hover:text-primary transition-colors">
                    Read Guide <ChevronRight className="w-4 h-4" />
                  </Link>
                  
                  {dest.gallery && dest.gallery.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                      {dest.gallery.slice(0, 3).map((place: any) => (
                        <Link key={place.slug} href={`/travel-guide/${place.slug || place.name.toLowerCase().replace(/\s+/g, '-')}`} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200">
                          {place.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* International Guides */}
        {international.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold font-serif text-slate-900 mb-8 flex items-center gap-3">
              <Globe className="w-8 h-8 text-accent" /> International Guides
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {international.map((dest: any) => (
                <div key={dest.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                  <div className="relative h-48 overflow-hidden">
                    <img src={dest.imageUrl} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-primary mb-2">{dest.name} Travel Guide</h3>
                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">Plan your perfect international getaway to {dest.name} with our detailed guide.</p>
                    
                    <Link href={`/travel-guide/${dest.slug}`} className="text-accent font-bold text-sm uppercase tracking-wider flex items-center gap-1 hover:text-primary transition-colors">
                      Read Guide <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
