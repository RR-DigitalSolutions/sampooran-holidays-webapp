"use client";

import Link from "next/link";
import { Star, MapPin, Utensils, Wifi, Coffee, Heart, ArrowRight, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { getHotelImageUrl, validateImageUrl } from "@/lib/utils";

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

export function HotelCard({ hotel }: { hotel: Hotel }) {
  const [wishlisted, setWishlisted] = useState(false);
  const rawImage = hotel.images?.[0] || "";
  const imageUrl = rawImage && rawImage.trim() 
    ? validateImageUrl(rawImage, 400, 300, "4:3")
    : "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800";

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-full flex w-full"
    >
      <div className="group w-full bg-primary rounded-xl overflow-hidden border border-primary/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 flex flex-col h-full relative">
        {/* Visual Container */}
        <div className="relative h-48 sm:h-56 overflow-hidden shrink-0 w-full">
          <motion.img
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6 }}
            src={imageUrl}
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80" />
          
          {/* Floating Badges */}
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap z-10">
            <span className="bg-white/90 backdrop-blur-md text-primary text-[7px] font-medium px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs font-sans">
              {hotel.type || "Hotel"}
            </span>
            {hotel.starRating >= 4 && (
              <span className="bg-[#ff8f00] text-white text-[7px] font-medium px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-0.5 font-sans">
                Premium Stay
              </span>
            )}
            {hotel.isVerified && (
              <span className="bg-emerald-500 text-white text-[7px] font-medium px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-0.5 font-sans">
                <ShieldCheck className="h-2.5 w-2.5" /> Certified
              </span>
            )}
          </div>

          <button
            onClick={(e) => { e.preventDefault(); setWishlisted(!wishlisted); }}
            className="absolute top-3 right-3 p-2 rounded-xl bg-white/25 backdrop-blur-md hover:bg-white hover:text-red-500 transition-all z-10 border border-white/20 text-white"
          >
            <Heart className={`h-3.5 w-3.5 ${wishlisted ? "fill-red-500 text-red-500" : ""}`} />
          </button>

          {/* Location & Star Rating Overlay */}
          <div className="absolute bottom-3 inset-x-3.5 z-10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-white/95 max-w-[70%]">
              <MapPin className="h-3 w-3 text-[#ff8f00] shrink-0" />
              <span className="text-[8.5px] font-medium truncate uppercase tracking-wide font-sans">
                {hotel.destinationName || hotel.address?.split(',').pop()?.trim() || 'Himalayas'}
              </span>
            </div>
            <div className="flex items-center gap-0.5 bg-[#ff8f00] text-white px-2 py-0.5 rounded-lg shadow-sm border border-white/10 shrink-0">
              <Star className="h-2.5 w-2.5 fill-current" />
              <span className="text-[8px] font-medium font-sans">{hotel.starRating || 3}.0</span>
            </div>
          </div>
        </div>

        {/* Info Area */}
        <div className="p-4 flex flex-col flex-1 bg-primary text-white">
          <h3 className="font-sans font-bold text-sm sm:text-base text-white group-hover:text-accent transition-colors line-clamp-1 leading-tight mb-4">
            {hotel.name}
          </h3>

          {/* Quick Specs */}
          <div className="flex gap-4 mb-5 mt-1 font-sans">
            {[
              { icon: Wifi, label: "Wifi" },
              { icon: Utensils, label: "Meals" },
              { icon: Coffee, label: "Lounge" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-white/70 group-hover:text-white transition-colors" title={item.label}>
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/5 border border-white/10 text-accent shrink-0">
                  <item.icon className="h-3 w-3" />
                </div>
                <span className="text-[8px] font-medium uppercase tracking-wider">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Footer Area */}
          <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between w-full">
            <div className="font-sans">
              <p className="text-[8px] text-white/50 uppercase font-black tracking-widest mb-0.5">Best Rate From</p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-lg md:text-xl font-bold text-white tracking-tighter font-sans">₹{(hotel.startingPrice || 2500).toLocaleString('en-IN')}</span>
                <span className="text-[9px] font-black text-white/50 uppercase font-sans">/ Night</span>
              </div>
            </div>
            <Link href={`/hotels/${hotel.slug}`}>
              <button
                className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white group-hover:bg-accent group-hover:text-primary hover:scale-105 transition-all shadow-xs border border-white/10"
                aria-label={`View details for ${hotel.name}`}
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
