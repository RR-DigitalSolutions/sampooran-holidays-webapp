"use client";

import Link from "next/link";
import { useListCountries, useListPackages } from "@workspace/api-client-react";
import { PackageCard } from "@/components/PackageCard";

const PLACEHOLDER = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmMmY1Ii8+PC9zdmc+";

const ASIA_COUNTRIES = [
  { name: "Thailand", imageUrl: PLACEHOLDER, packages: 10, highlights: "Bangkok, Phuket, Pattaya, Chiang Mai" },
  { name: "Bhutan", imageUrl: PLACEHOLDER, packages: 8, highlights: "Thimphu, Paro, Punakha, Tiger's Nest" },
  { name: "Nepal", imageUrl: PLACEHOLDER, packages: 10, highlights: "Kathmandu, Pokhara, Everest Base Camp" },
  { name: "Sri Lanka", imageUrl: PLACEHOLDER, packages: 6, highlights: "Colombo, Sigiriya, Galle, Kandy" },
  { name: "Dubai", imageUrl: PLACEHOLDER, packages: 8, highlights: "Burj Khalifa, Desert Safari, Dubai Mall" },
  { name: "Singapore", imageUrl: PLACEHOLDER, packages: 6, highlights: "Marina Bay, Sentosa, Gardens by the Bay" },
  { name: "Malaysia", imageUrl: PLACEHOLDER, packages: 6, highlights: "Kuala Lumpur, Penang, Langkawi" },
  { name: "Maldives", imageUrl: PLACEHOLDER, packages: 5, highlights: "Water villas, Snorkeling, Luxury resorts" },
];

export default function Asia() {
  const { data: countriesData } = useListCountries();
  const { data: pkgData } = useListPackages({ country: "international" });
  
  const countries = countriesData?.countries ?? [];
  const displayCountries = countries.length > 0 ? countries : ASIA_COUNTRIES;
  const packages = pkgData?.packages ?? [];

  return (
    <>
      <div className="bg-primary text-white py-14 px-4">
        <div className="container mx-auto">
          <nav className="text-white/70 text-sm mb-4 flex gap-2">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <span className="text-white">International / Asia</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">International Packages</h1>
          <p className="text-white/80 text-lg">Explore Asia and beyond â€” Thailand, Bhutan, Dubai, Nepal, Singapore & more</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-serif font-bold text-primary mb-8">Explore by Country</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-16">
          {displayCountries.map((c: any) => (
            <Link key={c.name} href={`/packages?country=${encodeURIComponent(c.name)}`}>
              <div className="group rounded-2xl overflow-hidden border hover:shadow-xl transition-all duration-300 cursor-pointer bg-white h-full flex flex-col">
                <div className="relative h-40 overflow-hidden shrink-0">
                  <img src={c.imageUrl || PLACEHOLDER} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <h3 className="absolute bottom-3 left-3 text-white font-serif font-bold text-lg">{c.name}</h3>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2 font-medium">
                    {c.highlights || c.description || "Top sights, cultural wonders & local cuisine"}
                  </p>
                  <p className="text-accent font-black text-[10px] uppercase tracking-wider mt-auto">{c.packageCount || c.packages || "0"}+ Packages &rarr;</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {packages.length > 0 && (
          <section>
            <h2 className="text-2xl font-serif font-bold text-primary mb-6">International Packages</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
            </div>
          </section>
        )}

        <div className="mt-12 bg-primary/5 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-serif font-black text-primary mb-3">Looking for a Custom International Package?</h3>
          <p className="text-muted-foreground mb-6 font-medium">We create bespoke international tours tailored to your budget, duration, and interests.</p>
          <Link href="/customized-holidays">
            <button className="bg-primary text-white rounded-2xl px-8 py-4 font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-primary/20">Build Custom Package</button>
          </Link>
        </div>
      </div>
    </>
  );
}
