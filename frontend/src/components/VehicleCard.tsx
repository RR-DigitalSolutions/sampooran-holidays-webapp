"use client";

import { Car, Users, Gauge, Luggage, ShieldCheck, Heart, Sparkles, ArrowRight } from "lucide-react";
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
        <div className="group w-full bg-primary rounded-lg overflow-hidden border border-primary/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 flex flex-col h-full relative">
          {/* Visual Section */}
          <div className="relative h-28 xs:h-36 sm:h-56 overflow-hidden shrink-0 w-full">
            <motion.img 
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.6 }}
              src={imageUrl} 
              alt={vehicle.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80" />
            
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex gap-1 sm:gap-1.5 flex-wrap z-10">
               <span className="bg-white/90 backdrop-blur-md text-primary text-[7px] font-medium px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full uppercase tracking-wider shadow-xs font-sans">
                  {vehicle.type}
               </span>
               <span className="bg-emerald-500 text-white text-[7px] font-medium px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-0.5 font-sans">
                  <ShieldCheck className="h-2.5 w-2.5" /> Certified
               </span>
            </div>

            <button
              onClick={(e) => { e.preventDefault(); setWishlisted(!wishlisted); }}
              className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/25 backdrop-blur-md hover:bg-white hover:text-red-500 transition-all z-10 border border-white/20 text-white"
            >
              <Heart className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${wishlisted ? "fill-red-500 text-red-500" : ""}`} />
            </button>

            {/* Availability overlay */}
            <div className="absolute bottom-2 inset-x-2 sm:bottom-3 sm:inset-x-3.5 z-10 flex items-center gap-1.5">
              <div className="flex items-center gap-1 text-white/95">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[7.5px] sm:text-[8.5px] font-medium truncate uppercase tracking-wide font-sans">
                  Available Today
                </span>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-2.5 sm:p-4 flex flex-col flex-1 bg-primary text-white">
            <h3 className="font-sans font-bold text-[11px] sm:text-base text-white group-hover:text-accent transition-colors line-clamp-1 leading-tight mb-2 sm:mb-4">
              {vehicle.name}
            </h3>

            {/* Quick Specs */}
            <div className="flex gap-1.5 sm:gap-4 mb-3 sm:mb-5 mt-0.5 sm:mt-1 font-sans">
              {[
                { icon: Users, label: `${vehicle.capacity} Seats`, shortLabel: `${vehicle.capacity} Seats` },
                { icon: Luggage, label: "Cargo Space", shortLabel: "Cargo" },
                { icon: Gauge, label: "Aircon", shortLabel: "AC" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1 sm:gap-1.5 text-white/70 group-hover:text-white transition-colors" title={item.label}>
                  <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/5 border border-white/10 text-accent shrink-0">
                    <item.icon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </div>
                  <span className="hidden sm:inline-block text-[8px] font-medium uppercase tracking-wider">{item.label}</span>
                  <span className="hidden min-[380px]:inline-block sm:hidden text-[7px] font-medium uppercase tracking-wider">{item.shortLabel}</span>
                </div>
              ))}
            </div>

            {/* Footer Area */}
            <div className="mt-auto pt-2.5 sm:pt-4 border-t border-white/10 flex items-center justify-between w-full font-sans">
               <div>
                  <p className="text-[7px] sm:text-[8px] text-white/50 font-black uppercase tracking-widest mb-0.5">Starting Daily</p>
                  <div className="flex items-baseline gap-0.5">
                     <span className="text-sm sm:text-xl font-bold text-white tracking-tighter font-sans">₹{(vehicle.pricePerDay || 2500).toLocaleString('en-IN')}</span>
                     <span className="text-[7.5px] sm:text-[9px] font-black text-white/50 uppercase">
                        <span className="sm:hidden">/ D</span>
                        <span className="hidden sm:inline">/ Day</span>
                     </span>
                  </div>
               </div>
               <Link href="/transport">
                 <button
                   className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/10 flex items-center justify-center text-white group-hover:bg-accent group-hover:text-primary hover:scale-105 transition-all shadow-xs border border-white/10"
                   aria-label={`View details for ${vehicle.name}`}
                 >
                   <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                 </button>
               </Link>
            </div>
          </div>
        </div>
      </motion.div>
  );
}
