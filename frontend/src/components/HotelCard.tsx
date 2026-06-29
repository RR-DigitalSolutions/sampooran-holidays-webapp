"use client";

import Link from "next/link";
import { Star, MapPin, Heart, ArrowRight, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
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
  startingPrice?: number;
  isVerified?: boolean;
}

// Default fallback amenity keys shown when hotel has none set
const FALLBACK_AMENITY_KEYS = ["WIFI", "RESTAURANT", "HOT_WATER"];

export function HotelCard({ hotel }: { hotel: Hotel }) {
  const [wishlisted, setWishlisted] = useState(false);
  const rawImage = hotel.images?.[0] || "";
  const imageUrl = rawImage && rawImage.trim()
    ? validateImageUrl(rawImage, 400, 300, "4:3")
    : "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800";

  // ── Dynamic amenities: show up to 3 from hotel.amenities, fallback if empty ──
  const amenityKeys = hotel.amenities && hotel.amenities.length > 0
    ? hotel.amenities.slice(0, 3)
    : FALLBACK_AMENITY_KEYS;

  const displayAmenities = amenityKeys
    .map((key) => getAmenityInfo(key))
    .filter(Boolean)
    .slice(0, 3) as { key: string; label: string; icon: any }[];

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-full flex w-full"
    >
      <div className="group w-full bg-primary rounded-lg overflow-hidden border border-primary/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 flex flex-col h-full relative">

        {/* Image Area */}
        <div className="relative h-28 xs:h-32 sm:h-52 overflow-hidden shrink-0 w-full">
          <motion.img
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6 }}
            src={imageUrl}
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80" />

          {/* Badges */}
          <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 flex gap-0.5 sm:gap-1.5 flex-wrap z-10">
            <span className="bg-white/90 backdrop-blur-md text-primary text-[6px] sm:text-[7px] font-semibold px-1 py-0.5 sm:px-2 sm:py-0.5 rounded-full uppercase tracking-wide shadow-xs font-sans leading-tight">
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
        <div className="p-2 sm:p-4 flex flex-col flex-1 bg-primary text-white">
          <h3 className="font-sans font-bold text-[10px] sm:text-sm text-white group-hover:text-accent transition-colors line-clamp-1 leading-tight mb-1.5 sm:mb-3">
            {hotel.name}
          </h3>

          {/* Dynamic Inclusions: icon above label */}
          <div className="flex gap-2 sm:gap-4 mb-2 sm:mb-4 mt-0.5 font-sans">
            {displayAmenities.map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5 text-white/70 group-hover:text-white transition-colors" title={item.label}>
                <div className="flex items-center justify-center w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-white/5 border border-white/10 text-accent shrink-0">
                  <item.icon className="h-2 w-2 sm:h-3 sm:w-3" />
                </div>
                <span className="text-[5.5px] sm:text-[6.5px] font-medium uppercase tracking-wide leading-none text-center max-w-[36px] truncate">
                  {item.label.split(" ")[0]}
                </span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-auto pt-2 sm:pt-3 border-t border-white/10 flex items-center justify-between w-full">
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
    </motion.div>
  );
}