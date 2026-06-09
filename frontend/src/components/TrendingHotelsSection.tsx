"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Star, MapPin, Building2, ArrowRight } from "lucide-react";
import { cn, validateImageUrl } from "@/lib/utils";

interface TrendingHotel {
  id: number;
  name: string;
  slug: string;
  imageUrl: string;
  starRating: number;
  city: string;
  startingPrice: number;
}

interface TrendingHotelsSectionProps {
  hotels: TrendingHotel[];
}

export default function TrendingHotelsSection({ hotels }: TrendingHotelsSectionProps) {
  const [currentMonth, setCurrentMonth] = useState("");

  useEffect(() => {
    // Client-side only to avoid hydration mismatch
    setCurrentMonth(format(new Date(), "MMMM yyyy"));
  }, []);

  if (!hotels || hotels.length === 0) return null;

  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-[#ff8f00] mb-3 block">
              PREMIUM STAYS
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-[#1B3A6B] tracking-tight">
              Trending Hotels in <span className="text-[#ff8f00] italic font-serif font-light">{currentMonth}</span>
            </h2>
            <p className="text-slate-500 mt-4 max-w-2xl text-sm font-medium">
              Discover top-rated luxury resorts, premium boutique stays, and exclusive budget hotel deals for your perfect holiday getaway.
            </p>
          </div>
          <Link href="/hotels">
            <button className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-3 rounded-2xl text-sm font-bold text-[#1B3A6B] hover:bg-slate-50 hover:shadow-lg transition-all group shrink-0">
              All Hotels
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {hotels.map((hotel) => (
            <Link key={hotel.id} href={`/hotels/${hotel.slug}`} className="block group">
              <div className="relative h-[220px] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500">
                <Image
                  src={validateImageUrl(hotel.imageUrl)}
                  alt={hotel.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
                
                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B1A]/90 via-[#0A0B1A]/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B1A] via-transparent to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
                
                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col justify-end h-full">
                  <div className="flex justify-between items-end mb-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <h3 className="text-white font-black text-xl tracking-tight leading-none drop-shadow-md">
                      {hotel.name}
                    </h3>
                    <div className="bg-[#ff8f00] text-white px-2 py-1 rounded-lg text-xs font-black shadow-lg">
                      ₹{hotel.startingPrice.toLocaleString('en-IN')}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-white/20 pt-3 opacity-90 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1.5 text-white/90">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        {hotel.city}
                      </span>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: hotel.starRating || 3 }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-[#ff8f00] text-[#ff8f00]" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
