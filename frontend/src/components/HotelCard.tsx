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

  // Selected Amenities (rendered as circular icons)
  const selectedAmenities = hotel.amenities && hotel.amenities.length > 0
    ? hotel.amenities.slice(0, 4)
    : ["WIFI", "PARKING", "RESTAURANT", "POOL"]; // default fallback amenities

  const displayAmenities = selectedAmenities.map(ame => {
    const keyStr = String(ame).trim().toUpperCase();
    const found = COMPREHENSIVE_AMENITIES.find(a => a.key === keyStr || a.label.toUpperCase() === keyStr);
    if (found) {
      return { icon: found.icon, label: found.label };
    }
    return getHighlightIconAndLabel(String(ame));
  });

  // Hotel Highlights (rendered below amenities as a list of bullet points)
  const displayHighlights = hotel.highlights && hotel.highlights.length > 0
    ? hotel.highlights.slice(0, 4)
    : FALLBACK_HIGHLIGHTS;

  return (
    <div className="h-full flex w-full card-mobile-margin card-gpu-fix group hover:-translate-y-1.5 transition-transform duration-300 ease-out">
      <div className="w-full bg-primary rounded-2xl overflow-hidden border border-primary/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 flex flex-col h-full relative">

        {/* Image Area */}
        <div className="relative h-36 xs:h-40 sm:h-48 overflow-hidden shrink-0 w-full">
          <img
            src={imageUrl}
            alt={hotel.name}
            className="w-full h-full object-cover card-img-zoom"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80" />

          {/* Badges */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex gap-1 sm:gap-1.5 flex-wrap z-10">
            <span className="bg-white/90 text-primary text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-md uppercase tracking-wider shadow-sm font-sans leading-none">
              {hotel.type || "Hotel"}
            </span>
            {hotel.starRating >= 4 && (
              <span className="bg-[#ff8f00] text-white text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-md uppercase tracking-wider shadow-sm font-sans leading-none">
                Premium
              </span>
            )}
            {hotel.isVerified && (
              <span className="bg-emerald-500 text-white text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-md uppercase tracking-wider shadow-sm flex items-center gap-0.5 font-sans leading-none">
                <ShieldCheck className="h-2.5 w-2.5" /> Verified
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={(e) => { e.preventDefault(); setWishlisted(!wishlisted); }}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 rounded-lg bg-white/25 backdrop-blur-md hover:bg-white hover:text-red-500 transition-all z-10 border border-white/20 text-white"
          >
            <Heart className={`h-3 w-3 ${wishlisted ? "fill-red-500 text-red-500" : ""}`} />
          </button>

          {/* Location & Star */}
          <div className="absolute bottom-2 inset-x-2 sm:bottom-3 sm:inset-x-3 z-10 flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 text-white/95 max-w-[70%]">
              <MapPin className="h-3 w-3 text-accent shrink-0" />
              <span className="text-[9px] sm:text-[10.5px] font-bold truncate uppercase tracking-wider font-sans">
                {hotel.destinationName || hotel.address?.split(",").pop()?.trim() || "Himalayas"}
              </span>
            </div>
            <div className="flex items-center gap-0.5 bg-[#ff8f00] text-white px-1.5 py-0.5 rounded-md shadow-sm border border-white/10 shrink-0">
              <Star className="h-2.5 w-2.5 fill-current" />
              <span className="text-[8px] sm:text-[9px] font-bold font-sans">{hotel.starRating || 3}.0</span>
            </div>
          </div>
        </div>

        {/* Info Area */}
        <div className="p-3 sm:p-3.5 flex flex-col flex-1 bg-primary text-white">
          <h3 className="font-sans font-bold text-xs sm:text-sm text-white group-hover:text-accent transition-colors line-clamp-1 leading-tight mb-2">
            {hotel.name}
          </h3>

          {/* Amenities — dynamic horizontal scroll row matching PackageCard inclusions */}
          {displayAmenities && displayAmenities.length > 0 && (
            <div className="flex items-center gap-1 sm:gap-1.5 mb-2.5 overflow-x-auto scrollbar-none w-full">
              {displayAmenities.map((info, index) => {
                const Icon = info.icon;
                return (
                  <div key={index} className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-md px-1.5 py-0.5 shrink-0" title={info.label}>
                    <div className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/5 text-accent shrink-0">
                      {Icon && <Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                    </div>
                    <span className="text-[8.5px] sm:text-[9.5px] text-white/80 font-medium capitalize truncate max-w-[65px]">{info.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Hotel Highlights — matching PackageCard checkmark bullet style & font size */}
          {displayHighlights && displayHighlights.length > 0 && (
            <ul className="space-y-1 mb-3">
              {displayHighlights.slice(0, 3).map((h, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[9.5px] sm:text-[10.5px] text-white/90 font-normal leading-tight">
                  <Check className="w-3 h-3 text-accent shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{h}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Footer */}
          <div className="mt-auto pt-2 border-t border-white/10 flex items-center justify-between w-full">
            <div className="font-sans">
              <p className="text-[7px] sm:text-[8px] text-white/50 uppercase font-black tracking-widest mb-0.5">Starting From</p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-sm sm:text-base font-bold text-white tracking-tight font-sans">
                  ₹{(hotel.startingPrice || 2500).toLocaleString("en-IN")}
                </span>
                <span className="text-[7px] sm:text-[9px] font-black text-white/50 uppercase font-sans">
                  / Night
                </span>
              </div>
            </div>
            <Link href={`/hotels/${hotel.slug}`}>
              <button
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 flex items-center justify-center text-white group-hover:bg-accent group-hover:text-primary hover:scale-105 transition-all shadow-xs border border-white/10"
                aria-label={`View details for ${hotel.name}`}
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}