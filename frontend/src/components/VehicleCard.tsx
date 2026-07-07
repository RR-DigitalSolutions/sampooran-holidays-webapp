"use client";

import { Car, Users, Gauge, Heart, ArrowRight, Star, Fuel } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { DemoVehicle } from "@/lib/demo-fleet";

type Vehicle = Partial<DemoVehicle> & {
  id?: number;
  name: string;
  type: string;
  capacity?: number;
  seating_capacity?: number;
  pricePerKm?: number;
  pricePerDay?: number;
  base_price_per_day?: number;
  images?: string[];
  features?: string[];
  ownerName?: string;
  // SEO slugs
  slug?: string;
  countrySlug?: string;
  stateSlug?: string;
  destinationSlug?: string;
  cityName?: string;
  badge?: string;
  rating?: number;
  isAc?: boolean;
};

const TYPE_COLORS: Record<string, string> = {
  Cab: "bg-blue-500",
  Tempo: "bg-purple-500",
  Coach: "bg-amber-500",
  Bike: "bg-green-500",
};

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const [wishlisted, setWishlisted] = useState(false);

  const imageUrl =
    vehicle.images?.[0] ||
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80";

  const price = vehicle.pricePerDay || vehicle.base_price_per_day || 2500;
  const seats = vehicle.capacity || vehicle.seating_capacity || 4;
  const rating = vehicle.rating || 4.5;

  const href =
    vehicle.slug && vehicle.destinationSlug && vehicle.stateSlug && vehicle.countrySlug
      ? `/transport/${vehicle.countrySlug}/${vehicle.stateSlug}/transport-in-${vehicle.destinationSlug}/${vehicle.slug}`
      : "/transport";

  const typeColor = TYPE_COLORS[vehicle.type] || "bg-primary";

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="h-full flex w-full"
    >
      <div className="group w-full bg-primary rounded-xl overflow-hidden border border-primary/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 flex flex-col h-full relative">

        {/* ── Image Area ── */}
        <div className="relative h-28 xs:h-32 sm:h-48 overflow-hidden shrink-0 w-full">
          <motion.img
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.5 }}
            src={imageUrl}
            alt={vehicle.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80" />

          {/* Badges */}
          <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 flex gap-1 flex-wrap z-10">
            <span className={`${typeColor} text-white text-[6px] sm:text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide shadow-sm font-sans leading-tight`}>
              {vehicle.type}
            </span>
            {vehicle.badge && (
              <span className="bg-amber-500 text-white text-[6px] sm:text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide shadow-sm font-sans leading-tight">
                {vehicle.badge}
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={e => { e.preventDefault(); setWishlisted(!wishlisted); }}
            className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 p-1 sm:p-1.5 rounded-md bg-white/20 backdrop-blur-sm hover:bg-white hover:text-red-500 transition-all z-10 border border-white/20 text-white"
          >
            <Heart className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${wishlisted ? "fill-red-500 text-red-500" : ""}`} />
          </button>

          {/* Status row */}
          <div className="absolute bottom-1.5 inset-x-2 sm:bottom-2 sm:inset-x-2.5 z-10 flex items-center justify-between gap-1">
            <div className="flex items-center gap-0.5 text-white/95">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[6px] sm:text-[8px] font-bold uppercase tracking-wide font-sans">Available</span>
            </div>
            {vehicle.isAc && (
              <span className="text-[6px] sm:text-[7px] font-bold bg-blue-500/80 text-white px-1.5 py-0.5 rounded-full">AC</span>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="p-2 sm:p-3.5 flex flex-col flex-1 bg-primary text-white">
          <h3 className="font-sans font-bold text-[10px] sm:text-[13px] text-white group-hover:text-accent transition-colors line-clamp-1 leading-tight mb-1.5 sm:mb-2.5">
            {vehicle.name}
          </h3>

          {/* Specs row */}
          <div className="flex gap-2 sm:gap-3 mb-2 sm:mb-3 font-sans">
            {[
              { icon: Users, label: `${seats}`, tooltip: "Seats" },
              { icon: Fuel, label: vehicle.isAc ? "AC" : "Non-AC", tooltip: "AC" },
              { icon: Gauge, label: "GPS", tooltip: "GPS Tracked" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5 text-white/70 group-hover:text-white transition-colors" title={item.tooltip}>
                <div className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/8 border border-white/10 text-accent shrink-0">
                  <item.icon className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                </div>
                <span className="text-[6px] sm:text-[7px] font-medium uppercase tracking-wide leading-none">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-2 sm:mb-3">
            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
            <span className="text-[8px] sm:text-[9px] font-bold text-amber-300">{rating.toFixed(1)}</span>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-2 sm:pt-2.5 border-t border-white/10 flex items-center justify-between w-full font-sans">
            <div>
              <p className="text-[6px] sm:text-[7px] text-white/50 font-black uppercase tracking-widest mb-0.5">From / Day</p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-xs sm:text-base font-black text-white tracking-tighter font-sans">₹{price.toLocaleString("en-IN")}</span>
              </div>
            </div>
            <Link href={href} aria-label={`View details for ${vehicle.name}`}>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 flex items-center justify-center text-white group-hover:bg-accent group-hover:text-primary hover:scale-110 transition-all shadow-sm border border-white/10">
                <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
