"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { HotelCard } from "@/components/HotelCard";
import { useCarouselGuide } from "@/hooks/useCarouselGuide";

interface TrendingHotel {
  id: number;
  name: string;
  slug: string;
  imageUrl: string;
  starRating: number;
  city: string;
  startingPrice: number;
  countrySlug?: string;
  stateSlug?: string;
  destinationSlug?: string;
  highlights?: string[];
  amenities?: string[];
}

interface TrendingHotelsSectionProps {
  hotels: TrendingHotel[];
}

export default function TrendingHotelsSection({ hotels }: TrendingHotelsSectionProps) {
  const [currentMonth, setCurrentMonth] = useState("");
  const sectionRef = useRef<HTMLDivElement>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    loop: true,
  });

  const { showHint } = useCarouselGuide({ emblaRef: sectionRef, emblaApi, sectionId: "hotels", waitMs: 3000 });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    setCurrentMonth(format(new Date(), "MMMM yyyy"));
  }, []);

  if (!hotels || hotels.length === 0) return null;

  return (
    <div ref={sectionRef} className="container mx-auto px-2 md:px-4 my-6">
      <section className="bg-white relative overflow-hidden rounded-md border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl p-2 md:p-2">
              <div className="flex items-center gap-2">
                <p className="text-accent font-bold text-[9px] md:text-[12px] uppercase tracking-[0.1em] font-sans">
                  Premium Stays
                </p>
              </div>
              <h2 className="text-xl md:text-3xl font-serif font-bold text-primary leading-tight">
                Trending Hotels in <span className="text-accent font-light">{currentMonth}</span>
              </h2>
              <p className="text-slate-500 text-[10px] sm:text-xs md:text-sm">
                Discover top-rated luxury resorts, premium boutique stays, and exclusive budget hotel deals for your perfect holiday getaway.
              </p>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 p-4">
              <button
                onClick={scrollPrev}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-primary hover:text-white flex items-center justify-center transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={scrollNext}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-primary hover:text-white flex items-center justify-center transition-colors"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Embla Carousel Container */}
          <div className="relative">
            {showHint && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                <div className="flex items-center gap-1.5 bg-primary/90 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg animate-bounce">
                  <span>Swipe to explore</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            )}
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex -ml-2 md:-ml-3 pb-2 pt-4">
            {hotels.map((hotel) => {
              // Map TrendingHotel shape to HotelCard shape
              const mappedHotel = {
                id: hotel.id,
                name: hotel.name,
                slug: hotel.slug,
                type: "Hotel",
                starRating: hotel.starRating,
                destinationName: hotel.city,
                images: [hotel.imageUrl],
                address: hotel.city,
                startingPrice: hotel.startingPrice,
                isVerified: true,
                countrySlug: hotel.countrySlug || "india",
                stateSlug: hotel.stateSlug || "himachal-pradesh",
                destinationSlug: hotel.destinationSlug || "manali",
                highlights: hotel.highlights || [],
                amenities: hotel.amenities || []
              };

              return (
                <div key={hotel.id} className="flex-[0_0_47%] xs:flex-[0_0_46%] sm:flex-[0_0_46%] lg:flex-[0_0_25%] min-w-0 pl-2 md:pl-3">
                  <HotelCard hotel={mappedHotel} />
                </div>
              );
            })}
          </div>
        </div>
        </div>
        </div>
      </section>
    </div>
  );
}
