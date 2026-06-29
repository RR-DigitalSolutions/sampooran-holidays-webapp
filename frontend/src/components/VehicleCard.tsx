"use client";

import { Car, Users, Gauge, Luggage, ShieldCheck, Heart, ArrowRight } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface Vehicle {
  id: number;
  name: string;
  type: string;
  capacity: number;
  pricePerKm?: number;
  pricePerDay?: number;
  images?: string[];
  features?: string[];
  ownerName?: string;
}

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const [wishlisted, setWishlisted] = useState(false);
  const imageUrl = vehicle.images?.[0] || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80";

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-full flex w-full"
    >
      {/* ── Card wrapper: rounded-lg matches PackageCard ── */}
      <div className="group w-full bg-primary rounded-lg overflow-hidden border border-primary/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 flex flex-col h-full relative">

        {/* ── Image Area ── */}
        <div className="relative h-28 xs:h-32 sm:h-52 overflow-hidden shrink-0 w-full">
          <motion.img
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6 }}
            src={imageUrl}
            alt={vehicle.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80" />

          {/* Badges — tighter padding on mobile */}
          <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 flex gap-0.5 sm:gap-1.5 flex-wrap z-10">
            <span className="bg-white/90 backdrop-blur-md text-primary text-[6px] sm:text-[7px] font-semibold px-1 py-0.5 sm:px-2 sm:py-0.5 rounded-full uppercase tracking-wide shadow-xs font-sans leading-tight">
              {vehicle.type}
            </span>
            <span className="bg-emerald-500 text-white text-[6px] sm:text-[7px] font-semibold px-1 py-0.5 sm:px-2 sm:py-0.5 rounded-full uppercase tracking-wide shadow-xs flex items-center gap-0.5 font-sans leading-tight">
              <ShieldCheck className="h-2 w-2 sm:h-2.5 sm:w-2.5" /> Verified
            </span>
          </div>

          {/* Wishlist button */}
          <button
            onClick={(e) => { e.preventDefault(); setWishlisted(!wishlisted); }}
            className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-white/25 backdrop-blur-md hover:bg-white hover:text-red-500 transition-all z-10 border border-white/20 text-white"
          >
            <Heart className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${wishlisted ? "fill-red-500 text-red-500" : ""}`} />
          </button>

          {/* Availability overlay */}
          <div className="absolute bottom-1.5 inset-x-2 sm:bottom-3 sm:inset-x-3.5 z-10 flex items-center gap-1">
            <div className="flex items-center gap-0.5 text-white/95">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[6.5px] sm:text-[8px] font-medium truncate uppercase tracking-wide font-sans">
                Available Today
              </span>
            </div>
          </div>
        </div>

        {/* ── Content Area ── */}
        <div className="p-2 sm:p-4 flex flex-col flex-1 bg-primary text-white">
          <h3 className="font-sans font-bold text-[10px] sm:text-sm text-white group-hover:text-accent transition-colors line-clamp-1 leading-tight mb-1.5 sm:mb-3">
            {vehicle.name}
          </h3>

          {/* ── Inclusions: icon ABOVE label, smaller text on mobile ── */}
          <div className="flex gap-2 sm:gap-4 mb-2 sm:mb-4 mt-0.5 font-sans">
            {[
              { icon: Users, label: `${vehicle.capacity} Seats`, shortLabel: `${vehicle.capacity} Seats` },
              { icon: Luggage, label: "Cargo", shortLabel: "Cargo" },
              { icon: Gauge, label: "Aircon", shortLabel: "AC" }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5 text-white/70 group-hover:text-white transition-colors" title={item.label}>
                {/* Icon circle — smaller on mobile */}
                <div className="flex items-center justify-center w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-white/5 border border-white/10 text-accent shrink-0">
                  <item.icon className="h-2 w-2 sm:h-3 sm:w-3" />
                </div>
                {/* Label below icon */}
                <span className="text-[6px] sm:text-[7px] font-medium uppercase tracking-wide leading-none">{item.shortLabel}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-auto pt-2 sm:pt-3 border-t border-white/10 flex items-center justify-between w-full font-sans">
            <div>
              <p className="text-[6px] sm:text-[7px] text-white/50 font-black uppercase tracking-widest mb-0.5">Starting Daily</p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-xs sm:text-lg font-bold text-white tracking-tighter font-sans">₹{(vehicle.pricePerDay || 2500).toLocaleString('en-IN')}</span>
                <span className="text-[6px] sm:text-[8px] font-black text-white/50 uppercase">
                  <span className="sm:hidden">/ D</span>
                  <span className="hidden sm:inline">/ Day</span>
                </span>
              </div>
            </div>
            <Link href="/transport">
              <button
                className="w-7 h-7 sm:w-9 sm:h-9 rounded-md sm:rounded-lg bg-white/10 flex items-center justify-center text-white group-hover:bg-accent group-hover:text-primary hover:scale-105 transition-all shadow-xs border border-white/10"
                aria-label={`View details for ${vehicle.name}`}
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
