"use client";

import { Badge } from "@/components/ui/badge";
import { Car, Users, Gauge, Luggage, MapPin, ShieldCheck, Heart, Sparkles, Info } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
  const imageUrl = vehicle.images?.[0] || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmMmY1Ii8+PC9zdmc+";

  return (
    <motion.div
      whileHover={{ y: -10 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="h-full"
    >
      <div className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 hover:shadow-[0_30px_60px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col h-full relative">
        {/* Visual Section */}
        <div className="relative h-64 overflow-hidden">
          <motion.img 
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6 }}
            src={imageUrl} 
            alt={vehicle.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-70 group-hover:opacity-80 transition-opacity" />
          
          <div className="absolute top-5 left-5 flex gap-2 z-10">
             <div className="bg-white/90 backdrop-blur-md text-primary font-black uppercase tracking-widest text-[9px] px-3 py-1.5 rounded-full shadow-sm">
               {vehicle.type}
             </div>
             <div className="bg-emerald-500 text-white font-black uppercase tracking-[0.2em] text-[8px] px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/20 flex items-center gap-1">
               <ShieldCheck className="h-3 w-3" /> Certified Fleet
             </div>
          </div>

          <button
            onClick={(e) => { e.preventDefault(); setWishlisted(!wishlisted); }}
            className="absolute top-5 right-5 p-2.5 rounded-2xl bg-white/20 hover:bg-white transition-all backdrop-blur-md border border-white/30 z-10"
          >
            <Heart className={`h-4 w-4 ${wishlisted ? "fill-red-500 text-red-500" : "text-white"}`} />
          </button>

          <div className="absolute bottom-6 left-6 right-6 z-10">
             <div>
               <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <p className="text-white/60 text-[9px] font-black tracking-widest uppercase">Available Today</p>
               </div>
               <h4 className="text-white font-serif font-black text-3xl tracking-tighter leading-none uppercase italic group-hover:text-accent transition-colors">
                  {vehicle.name}
               </h4>
             </div>
          </div>
        </div>

        {/* content Section */}
        <div className="p-8 flex flex-col flex-1 space-y-8">
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
             {[
               { icon: Users, val: `${vehicle.capacity} Seats`, label: "Capacity" },
               { icon: Luggage, val: "Large Cargo", label: "Storage" },
               { icon: Gauge, val: "High Terrain", label: "Performance" },
               { icon: Sparkles, val: "Premium Kit", label: "Features" },
             ].map((stat, i) => (
               <div key={i} className="flex items-center gap-3 group/stat">
                 <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover/stat:text-primary group-hover/stat:bg-primary/5 transition-colors">
                   <stat.icon className="h-4 w-4" />
                 </div>
                 <div>
                    <p className="text-sm font-black text-primary/80 leading-none tracking-tight">{stat.val}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{stat.label}</p>
                 </div>
               </div>
             ))}
          </div>

          <div className="flex flex-wrap gap-2">
             {(vehicle.features || ["GPS Tracked", "All India Permit", "Dual Aircon"]).map((f, i) => (
               <span key={i} className="text-[10px] font-bold text-slate-400 border border-slate-100 px-3 py-1.5 rounded-xl bg-slate-50/50 whitespace-nowrap">
                 {f}
               </span>
             ))}
          </div>

          <div className="mt-auto pt-8 border-t border-slate-50 flex items-center justify-between">
             <div>
               <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Starting Daily</p>
               <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-primary tracking-tighter italic">₹{(vehicle.pricePerDay || 2500).toLocaleString()}</span>
                  <span className="text-xs font-black text-slate-300 italic">/ day</span>
               </div>
             </div>
             <motion.button 
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               className="bg-black text-white hover:bg-primary font-black uppercase tracking-[0.2em] text-[10px] h-14 px-8 rounded-2xl shadow-xl shadow-black/10 active:scale-95 transition-all"
             >
               Reserve Now
             </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
