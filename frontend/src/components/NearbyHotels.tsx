"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Star, Building2, Navigation, ArrowRight, ChevronRight } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface NearbyHotel {
  id: number;
  name: string;
  slug: string;
  type: string;
  address: string;
  images: string[];
  starRating: number;
  distance?: number;
  isFeatured?: boolean;
}

interface NearbyHotelsProps {
  lat: number;
  lng: number;
  title?: string;
  subtitle?: string;
}

export function NearbyHotels({ lat, lng, title, subtitle }: NearbyHotelsProps) {
  const [hotels, setHotels] = useState<NearbyHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(50);
  const [sort, setSort] = useState("smart");
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    async function fetchNearby() {
      try {
        setLoading(true);
        setIsFallback(false);
        const res = await fetch(`/api/ota/hotels/nearby?lat=${lat}&lng=${lng}&radius=${radius}&sort=${sort}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setHotels(data);
        } else {
          // No nearby hotels found — fall back to CMS best hotels
          await fetchBestHotels();
        }
      } catch (err) {
        console.error("Failed to fetch nearby hotels:", err);
        await fetchBestHotels();
      } finally {
        setLoading(false);
      }
    }

    async function fetchBestHotels() {
      try {
        const res = await fetch("/api/ota/hotels/featured?limit=8");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setHotels(data.map((h: any) => ({ ...h, distance: undefined })));
          setIsFallback(true);
        } else {
          setHotels([]);
        }
      } catch (err) {
        console.error("Failed to fetch best hotels:", err);
        setHotels([]);
      }
    }

    if (lat && lng) fetchNearby();
  }, [lat, lng, radius, sort]);

  if (loading) return (
    <div className="container mx-auto px-4 py-14">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-64 bg-slate-100 rounded-3xl" />)}
        </div>
      </div>
    </div>
  );

  // Dynamic heading based on whether we found nearby hotels or fell back to CMS
  const sectionTitle = isFallback
    ? (title || "Best Hotels, Curated for You")
    : (title || "Stays Near You.");
  const sectionSubtitle = isFallback
    ? (subtitle || "No hotels found in your immediate area — here are our top-rated properties managed by Sampooran Holidays.")
    : (subtitle || "Experience luxury and comfort in your immediate vicinity, curated by Sampooran Holidays.");

  return (
    <section className="py-20 bg-slate-50 overflow-hidden">
      <div className="container mx-auto px-4">
        
        {/* Header with Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-8">
          <div className="max-w-xl">
            <p className="text-accent font-black text-[10px] uppercase tracking-[0.4em] mb-4 flex items-center gap-2 font-['Poppins',sans-serif]">
              <Navigation className="w-3.5 h-3.5" /> {isFallback ? "Editor's Pick" : "Discovery Engine"}
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-primary italic leading-none font-['Raleway',sans-serif]">{sectionTitle}</h2>
            <p className="text-slate-400 mt-4 text-sm font-medium font-['Poppins',sans-serif]">{sectionSubtitle}</p>
          </div>

          {/* Only show radius/sort controls when NOT showing fallback CMS hotels */}
          {!isFallback && (
          <div className="flex flex-wrap items-center gap-4">
             {/* Radius Filter */}
             <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                {[10, 25, 50].map((r) => (
                  <button 
                    key={r}
                    onClick={() => setRadius(r)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      radius === r ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-primary"
                    )}
                  >
                    {r}km
                  </button>
                ))}
             </div>

             {/* Sort Filter */}
             <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                {[
                  { id: "smart", label: "Recommended" },
                  { id: "distance", label: "Proximity" },
                  { id: "rating", label: "Top Rated" }
                ].map((s) => (
                  <button 
                    key={s.id}
                    onClick={() => setSort(s.id)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      sort === s.id ? "bg-accent text-accent-foreground shadow-lg" : "text-slate-400 hover:text-primary"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
             </div>
          </div>
          )}
        </div>

        {hotels.length > 0 ? (
          <div className="flex gap-8 overflow-x-auto pb-12 no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
            {hotels.map((hotel) => (
              <div key={hotel.id} className="min-w-[320px] w-[320px] bg-white rounded-[3rem] border border-slate-100 overflow-hidden shrink-0 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-700 group relative p-3">
                <div className="relative h-60 overflow-hidden rounded-[2.5rem]">
                  <Image 
                    src={hotel.images?.[0] || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmMmY1Ii8+PC9zdmc+"} 
                    alt={hotel.name}
                    fill
                    className="object-cover transition-transform duration-[2s] group-hover:scale-110" 
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                  
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-black flex items-center gap-1 shadow-2xl">
                     <Star className="w-3 h-3 text-accent fill-accent" /> {hotel.starRating || 3} STAR
                  </div>
                  
                  <div className="absolute bottom-5 left-6 text-white">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">Located in</p>
                     <p className="text-sm font-bold truncate max-w-[200px]">{hotel.address?.split(',').pop()?.trim() || "India"}</p>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-primary text-xl group-hover:text-accent transition-colors truncate pr-4 italic font-['Raleway',sans-serif]">{hotel.name}</h3>
                  </div>
                  
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-6 flex items-center gap-2 font-['Poppins',sans-serif]">
                    <MapPin className="w-3.5 h-3.5 text-accent" />
                    {hotel.distance !== undefined
                      ? `${hotel.distance.toFixed(1)} km from your location`
                      : (hotel.address?.split(',')[0]?.trim() || "Top Rated Property")}
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1 font-['Poppins',sans-serif]">Best Rate From</span>
                        <span className="text-primary font-black text-2xl tracking-tighter font-['Poppins',sans-serif]">₹2,499<span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">/ Night</span></span>
                     </div>
                     <Link href={`/hotels/${hotel.slug}`}>
                       <button className="bg-[#0A0B1A] text-white w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-accent hover:scale-110 transition-all shadow-xl shadow-slate-200 active:scale-95" aria-label={`View details for ${hotel.name}`}>
                          <ArrowRight className="w-6 h-6" />
                       </button>
                     </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[4rem] border border-dashed border-slate-200">
             <Building2 className="w-16 h-16 text-slate-100 mx-auto mb-6" />
             <h3 className="text-2xl font-serif font-black text-primary italic mb-2">No hotels available right now.</h3>
             <p className="text-slate-400 font-medium mb-10 max-w-sm mx-auto">Check back soon for amazing stays curated by Sampooran Holidays.</p>
             <Link href="/hotels"><button className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl shadow-primary/20">Browse All Hotels</button></Link>
          </div>
        )}

        <div className="mt-12 flex justify-center">
           <Link href="/hotels">
             <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 hover:text-primary transition-all group">
                Browse Global Collection <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
             </button>
           </Link>
        </div>
      </div>
    </section>
  );
}
