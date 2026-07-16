"use client";

import Link from "next/link";
import {
  Star, MapPin, Heart, ArrowRight, ShieldCheck,
  Wifi, Coffee, Mountain, Wind, Car, Flame, Tv, Bell, Activity, Sparkles, Check
} from "lucide-react";
import { useState } from "react";
import { validateImageUrl } from "@/lib/utils";
import { getAmenityInfo, COMPREHENSIVE_AMENITIES } from "@/lib/amenities-config";

interface Hotel {
  id: number;
  name: string;
  slug: string;
  type: string;
  starRating: number;
  destinationName?: string;
  stateName?: string;
  images?: string[];
  address: string;
  amenities?: string[];
  highlights?: string[];
  startingPrice?: number;
  isVerified?: boolean;
}

// Default fallback highlights shown when hotel has none set
const FALLBACK_HIGHLIGHTS = ["Free Wi-Fi", "In-House Restaurant", "Hot Water 24/7", "Free Parking"];

// Helper to dynamically resolve custom text highlights into matching Lucide icons
const getHighlightIconAndLabel = (text: string) => {
  const normalized = text.toLowerCase();
  
  if (normalized.includes("wifi") || normalized.includes("wi-fi") || normalized.includes("internet") || normalized.includes("wi fi")) {
    return { icon: Wifi, label: text };
  }
  if (normalized.includes("pool") || normalized.includes("swim")) {
    return { icon: Activity, label: text };
  }
  if (normalized.includes("food") || normalized.includes("breakfast") || normalized.includes("restaurant") || normalized.includes("dining") || normalized.includes("meal") || normalized.includes("tea") || normalized.includes("coffee") || normalized.includes("drink") || normalized.includes("kitchen")) {
    return { icon: Coffee, label: text };
  }
  if (normalized.includes("ac") || normalized.includes("air cond") || normalized.includes("cooling")) {
    return { icon: Wind, label: text };
  }
  if (normalized.includes("view") || normalized.includes("valley") || normalized.includes("mountain") || normalized.includes("hill") || normalized.includes("lake") || normalized.includes("river") || normalized.includes("scen") || normalized.includes("forest")) {
    return { icon: Mountain, label: text };
  }
  if (normalized.includes("park") || normalized.includes("car") || normalized.includes("valet") || normalized.includes("parking")) {
    return { icon: Car, label: text };
  }
  if (normalized.includes("heat") || normalized.includes("warm") || normalized.includes("fire") || normalized.includes("geyser") || normalized.includes("hot water") || normalized.includes("winter") || normalized.includes("heater")) {
    return { icon: Flame, label: text };
  }
  if (normalized.includes("tv") || normalized.includes("television") || normalized.includes("screen")) {
    return { icon: Tv, label: text };
  }
  if (normalized.includes("service") || normalized.includes("staff") || normalized.includes("bell") || normalized.includes("reception") || normalized.includes("security") || normalized.includes("housekeeping")) {
    return { icon: Bell, label: text };
  }
  if (normalized.includes("spa") || normalized.includes("massag") || normalized.includes("wellness") || normalized.includes("gym") || normalized.includes("fitness")) {
    return { icon: Activity, label: text };
  }
  if (normalized.includes("premium") || normalized.includes("luxury") || normalized.includes("special") || normalized.includes("free") || normalized.includes("best") || normalized.includes("star") || normalized.includes("gold")) {
    return { icon: Sparkles, label: text };
  }
  
  return { icon: Check, label: text };
};

export function HotelCard({ hotel }: { hotel: Hotel }) {
  const [wishlisted, setWishlisted] = useState(false);
  const rawImage = hotel.images?.[0] || "";
  const imageUrl = rawImage && rawImage.trim()
    ? validateImageUrl(rawImage, 400, 300, "4:3")
    : "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800";

  // Normalize amenityKeys
  const normalizeAmenityKey = (val: any): string => {
    if (!val) return "";
    if (typeof val === "object") {
      return normalizeAmenityKey(val.key || val.name || val.label);
    }
    return String(val).trim().toUpperCase();
  };

  const highlightItems = hotel.highlights && hotel.highlights.length > 0
    ? hotel.highlights.slice(0, 4)
    : FALLBACK_HIGHLIGHTS;

  const displayAmenities = highlightItems.map(getHighlightIconAndLabel);

  return (
    <div className="h-full flex w-full card-mobile-margin card-gpu-fix group hover:-translate-y-1.5 transition-transform duration-300 ease-out">
      <div className="w-full bg-primary rounded-2xl overflow-hidden border border-primary/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 flex flex-col h-full relative">

        {/* Image Area */}
        <div className="relative h-28 xs:h-32 sm:h-52 overflow-hidden shrink-0 w-full">
          <img
            src={imageUrl}
            alt={hotel.name}
            className="w-full h-full object-cover card-img-zoom"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80" />

          {/* Badges */}
          <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 flex gap-0.5 sm:gap-1.5 flex-wrap z-10">
            <span className="bg-white/90 text-primary text-[6px] sm:text-[7px] font-semibold px-1 py-0.5 sm:px-2 sm:py-0.5 rounded-full uppercase tracking-wide shadow-xs font-sans leading-tight">
              {hotel.type || "Hotel"}
            </span>
            {hotel.starRating >= 4 && (
              <span className="bg-[#ff8f00] text-white text-[6px] sm:text-[7px] font-semibold px-1 py-0.5 sm:px-2 sm:py-0.5 rounded-full uppercase tracking-wide shadow-xs font-sans leading-tight">
                Premium
              </span>
            )}
            {hotel.isVerified && (
              <span className="bg-emerald-500 text-white text-[6px] sm:text-[7px] font-semibold px-1 py-0.5 sm:px-2 sm:py-0.5 rounded-full uppercase tracking-wide shadow-xs flex items-center gap-0.5 font-sans leading-tight">
                <ShieldCheck className="h-2 w-2 sm:h-2.5 sm:w-2.5" /> Verified
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={(e) => { e.preventDefault(); setWishlisted(!wishlisted); }}
            className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-white/25 backdrop-blur-md hover:bg-white hover:text-red-500 transition-all z-10 border border-white/20 text-white"
          >
            <Heart className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${wishlisted ? "fill-red-500 text-red-500" : ""}`} />
          </button>

          {/* Location & Star */}
          <div className="absolute bottom-1.5 inset-x-2 sm:bottom-3 sm:inset-x-3.5 z-10 flex items-center justify-between gap-1">
            <div className="flex items-center gap-0.5 text-white/95 max-w-[70%]">
              <MapPin className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-[#ff8f00] shrink-0" />
              <span className="text-[6.5px] sm:text-[8px] font-medium truncate uppercase tracking-wide font-sans">
                {hotel.destinationName || hotel.address?.split(",").pop()?.trim() || "Himalayas"}
              </span>
            </div>
            <div className="flex items-center gap-0.5 bg-[#ff8f00] text-white px-1 py-0.5 sm:px-2 sm:py-0.5 rounded-md shadow-sm border border-white/10 shrink-0">
              <Star className="h-2 w-2 sm:h-2.5 sm:w-2.5 fill-current" />
              <span className="text-[6px] sm:text-[7.5px] font-medium font-sans">{hotel.starRating || 3}.0</span>
            </div>
          </div>
        </div>

        {/* Info Area */}
        <div className="p-3 sm:p-4 flex flex-col flex-1 bg-primary text-white">
          <h3 className="font-sans font-bold text-[10px] sm:text-sm text-white group-hover:text-accent transition-colors line-clamp-1 leading-tight mb-1">
            {hotel.name}
          </h3>

          {/* Amenities — dynamic horizontal scroll row (icons only) */}
          {displayAmenities && displayAmenities.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-2.5 pb-1 whitespace-nowrap w-full scroll-smooth touch-pan-x">
              {displayAmenities.map((info, index) => {
                const Icon = info.icon;
                return (
                  <span key={`${info.key}-${index}`} className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 text-white bg-white/10 hover:bg-white/20 rounded-full border border-white/10 shrink-0 select-none transition-colors" title={info.label}>
                    {Icon && <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent" />}
                  </span>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto pt-2.5 border-t border-white/10 flex items-center justify-between w-full">
            <div className="font-sans">
              <p className="text-[6px] sm:text-[7px] text-white/50 uppercase font-black tracking-widest mb-0.5">Best Rate From</p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-xs sm:text-lg font-bold text-white tracking-tighter font-sans">
                  Rs.{(hotel.startingPrice || 2500).toLocaleString("en-IN")}
                </span>
                <span className="text-[6px] sm:text-[8px] font-black text-white/50 uppercase font-sans">
                  <span className="sm:hidden">/ Nt</span>
                  <span className="hidden sm:inline">/ Night</span>
                </span>
              </div>
            </div>
            <Link href={`/hotels/${hotel.slug}`}>
              <button
                className="w-7 h-7 sm:w-9 sm:h-9 rounded-md sm:rounded-lg bg-white/10 flex items-center justify-center text-white group-hover:bg-accent group-hover:text-primary hover:scale-105 transition-all shadow-xs border border-white/10"
                aria-label={`View details for ${hotel.name}`}
              >
                <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}