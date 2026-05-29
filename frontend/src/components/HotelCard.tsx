"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Building2, Utensils, Wifi, Coffee, Heart, Info, Sparkles, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

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
}

export function HotelCard({ hotel }: { hotel: Hotel }) {
  const [wishlisted, setWishlisted] = useState(false);
  const imageUrl = hotel.images?.[0] || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmMmY1Ii8+PC9zdmc+";

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group"
    >
      <Link href={`/hotels/${hotel.slug}`}>
        <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-500 cursor-pointer h-full flex flex-col relative group">
          {/* Image Section */}
          <div className="relative overflow-hidden h-64">
            <motion.img
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.6 }}
              src={imageUrl}
              alt={hotel.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
            
            <div className="absolute top-4 left-4 flex gap-2 flex-wrap z-10">
              <div className="bg-white/90 backdrop-blur-md text-primary text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                {hotel.type}
              </div>
              {hotel.starRating >= 4 && (
                <div className="bg-accent text-accent-foreground text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Premium Choice
                </div>
              )}
            </div>

            <button
              onClick={(e) => { e.preventDefault(); setWishlisted(!wishlisted); }}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/20 backdrop-blur-md hover:bg-white transition-all z-10 border border-white/30"
            >
              <Heart className={`h-4 w-4 ${wishlisted ? "fill-red-500 text-red-500" : "text-white"}`} />
            </button>

            <div className="absolute bottom-4 left-4 right-4 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-white/90">
                  <MapPin className="h-3.5 w-3.5 text-accent" />
                  <span className="text-xs font-bold tracking-tight">{hotel.destinationName || 'Himalayas'}</span>
                </div>
                <div className="flex items-center gap-1 bg-amber-500 text-white px-2 py-0.5 rounded-lg border border-white/20 shadow-lg">
                  <Star className="h-3 w-3 fill-current" />
                  <span className="text-xs font-black">{hotel.starRating}.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 flex flex-col flex-1 relative bg-white">
            <div className="flex justify-between items-start mb-2">
               <h3 className="font-serif font-black text-xl text-primary group-hover:text-primary/80 transition-colors line-clamp-1 leading-tight">{hotel.name}</h3>
            </div>
            
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-6">
               <ShieldCheck className="h-3 w-3 text-emerald-500" /> Sampooran Verified Property
            </p>

            <div className="flex gap-5 mb-8">
              {[
                { icon: Wifi, label: "Free Wifi" },
                { icon: Utensils, label: "Kitchen" },
                { icon: Coffee, label: "Lounge" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-slate-400 group-hover:text-primary transition-colors">
                  <item.icon className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-5 border-t border-slate-50 flex items-center justify-between">
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Starting from</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-primary tracking-tighter">₹{(hotel.startingPrice || 2500).toLocaleString()}</span>
                  <span className="text-xs font-bold text-slate-400">/ night</span>
                </div>
              </div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm"
              >
                <Info className="h-5 w-5" />
              </motion.div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
