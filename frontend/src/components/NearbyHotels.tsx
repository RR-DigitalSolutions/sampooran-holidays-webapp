"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Navigation, ArrowRight, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { HotelCard } from "@/components/HotelCard";

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

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    loop: true,
  }, [
    Autoplay({
      delay: 5000,
      stopOnInteraction: false,
      stopOnMouseEnter: true
    })
  ]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

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
    <div className="container mx-auto px-2 md:px-4 my-6">
      <section className="bg-white relative overflow-hidden rounded-lg border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] py-4">
        <div className="px-4 lg:px-8">
        
        {/* Header with Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-4 md:mb-8 gap-6">
          <div className="max-w-xl">
            <p className="text-accent font-black text-[10px] uppercase tracking-[0.4em] mb-2 flex items-center gap-2 font-sans">
              <Navigation className="w-3.5 h-3.5" /> {isFallback ? "Editor's Pick" : "Discovery Engine"}
            </p>
            <h2 className="text-2xl md:text-5xl font-black text-primary leading-none font-serif">{sectionTitle}</h2>
            <p className="text-slate-500 mt-2 text-xs md:text-sm font-medium font-sans">{sectionSubtitle}</p>
          </div>

          {/* Controls & Nav area */}
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-end">
            {/* Only show radius/sort controls when NOT showing fallback CMS hotels */}
            {!isFallback && (
              <div className="flex flex-wrap gap-2">
                {/* Radius Filter */}
                <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-xs">
                  {[10, 25, 50].map((r) => (
                    <button 
                      key={r}
                      onClick={() => setRadius(r)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                        radius === r ? "bg-primary text-white shadow-xs" : "text-slate-400 hover:text-primary"
                      )}
                    >
                      {r}km
                    </button>
                  ))}
                </div>

                {/* Sort Filter */}
                <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-xs">
                  {[
                    { id: "smart", label: "Recommended" },
                    { id: "distance", label: "Proximity" },
                    { id: "rating", label: "Top Rated" }
                  ].map((s) => (
                    <button 
                      key={s.id}
                      onClick={() => setSort(s.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                        sort === s.id ? "bg-accent text-accent-foreground shadow-xs" : "text-slate-400 hover:text-primary"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Carousel navigation buttons */}
            <div className="flex gap-1.5 md:gap-2">
              <button
                onClick={scrollPrev}
                className="w-8 h-8 md:w-11 md:h-11 rounded-xl md:rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all bg-white shadow-xs"
                aria-label="Previous hotel"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button
                onClick={scrollNext}
                className="w-8 h-8 md:w-11 md:h-11 rounded-xl md:rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all bg-white shadow-xs"
                aria-label="Next hotel"
                title="Next"
              >
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </div>

        {hotels.length > 0 ? (
          /* Embla Carousel Container */
          <div className="overflow-hidden -mx-4 px-4 sm:mx-0 sm:px-0" ref={emblaRef}>
            <div className="flex -ml-4 md:-ml-6 pb-2 pt-2">
              {hotels.map((hotel) => {
                const mappedHotel = {
                  id: hotel.id,
                  name: hotel.name,
                  slug: hotel.slug,
                  type: hotel.type || "Hotel",
                  starRating: hotel.starRating || 3,
                  destinationName: hotel.address?.split(',').pop()?.trim() || "Himalayas",
                  images: hotel.images,
                  address: hotel.address,
                  startingPrice: 2499, // default nearby starting rate
                  isVerified: hotel.isFeatured
                };

                return (
                  <div key={hotel.id} className="flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_24%] min-w-0 pl-4 md:pl-6">
                    <HotelCard hotel={mappedHotel} />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
             <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
             <h3 className="text-xl font-serif font-black text-primary mb-1">No hotels available right now.</h3>
             <p className="text-slate-400 text-xs font-medium mb-6 max-w-xs mx-auto">Check back soon for amazing stays curated by Sampooran Holidays.</p>
             <Link href="/hotels">
               <button className="bg-primary text-white px-8 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-transform shadow-md shadow-primary/20">
                 Browse All Hotels
               </button>
             </Link>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <Link href="/hotels">
            <button className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 hover:text-primary transition-all group font-sans">
              Browse Global Collection <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>
        </div>
      </section>
    </div>
  );
}
