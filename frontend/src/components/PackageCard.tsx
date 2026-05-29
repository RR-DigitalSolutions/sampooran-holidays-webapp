"use client";

import Link from "next/link";
import { 
  Star, MapPin, Clock, CheckCircle, Sparkles, Zap, 
  ArrowRight, Plane, Hotel, Car, Utensils, Camera, Ticket, ShieldCheck,
  CheckCircle2, Users, FileText, Coffee
} from "lucide-react";
import Image from "next/image";
import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const MotionImage = motion(Image);

interface Pkg {
  id: number;
  name: string;
  slug: string;
  destinationName?: string;
  stateName?: string;
  imageUrl?: string;
  shortDescription?: string;
  duration: number;
  nights: number;
  pricePerPerson: number;
  originalPrice?: number;
  discountPercent?: number;
  category?: string;
  packageType?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  rating?: number;
  reviewCount?: number;
  highlights?: string[] | null;
  cities?: string[] | null;
  tags?: string[] | null;
  inclusions?: string[] | null;
  inclusionIcons?: string[] | null;
}

function PackageCardComponent({
  pkg,
  variant = "default",
}: {
  pkg: Pkg;
  variant?: "default" | "compact" | "horizontal" | "carousel";
}) {
  const [wishlisted, setWishlisted] = useState(false);
  const [hovered, setHovered] = useState(false);

  const discount =
    pkg.discountPercent ??
    (pkg.originalPrice && pkg.originalPrice > pkg.pricePerPerson
      ? Math.round((1 - pkg.pricePerPerson / pkg.originalPrice) * 100)
      : 0);

  const displayHighlights = pkg.highlights?.slice(0, 4) || [
    "Expert Guided Tours",
    "Luxury Accommodation",
    "All Transfers Included",
    "Scenic Sightseeing",
  ];

  const displayInclusions = pkg.inclusions?.slice(0, 4) || [
    "Hotel", "Meals", "Transfers", "Sightseeing"
  ];

  const getInclusionIcon = (text: string) => {
    const t = text.toLowerCase();
    if (t.includes("flight") || t.includes("plane")) return Plane;
    if (t.includes("hotel") || t.includes("stay") || t.includes("accommodation")) return Hotel;
    if (t.includes("meal") || t.includes("breakfast") || t.includes("dinner") || t.includes("food")) return Utensils;
    if (t.includes("transfer") || t.includes("car") || t.includes("cab") || t.includes("taxi")) return Car;
    if (t.includes("sightseeing") || t.includes("tour") || t.includes("camera")) return Camera;
    if (t.includes("ticket") || t.includes("entry") || t.includes("pass")) return Ticket;
    if (t.includes("insurance") || t.includes("safe") || t.includes("shield")) return ShieldCheck;
    if (t.includes("activity") || t.includes("sport") || t.includes("trek")) return Zap;
    return CheckCircle;
  };

  const getInclusionIconById = (id: string) => {
    switch (id.toLowerCase()) {
      case "flight": return Plane;
      case "hotel": return Hotel;
      case "meals": return Utensils;
      case "transfers": return Car;
      case "sightseeing": return Camera;
      case "ticket": return Ticket;
      case "insurance": return ShieldCheck;
      case "activities": return Zap;
      case "guide": return Users;
      case "visa": return FileText;
      case "drinks": return Coffee;
      default: return CheckCircle;
    }
  };

  const inclusionList = (pkg.inclusionIcons && pkg.inclusionIcons.length > 0)
    ? pkg.inclusionIcons.slice(0, 5).map(id => ({ id, label: id, Icon: getInclusionIconById(id) }))
    : displayInclusions.map(text => ({ id: text, label: text.split(' ')[0], Icon: getInclusionIcon(text) }));

  const citiesList = pkg.cities || (pkg.destinationName ? [pkg.destinationName] : []);

  /* ── Horizontal variant (List View) ── */
  if (variant === "horizontal") {
    return (
      <Link href={`/packages/${pkg.slug}`}>
        <div
          className="group relative rounded-2xl overflow-hidden bg-white border border-slate-200 hover:border-primary/30 hover:shadow-2xl transition-all duration-500 cursor-pointer flex flex-col md:flex-row h-full min-h-[220px]"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Image Panel */}
          <div className="relative w-full md:w-[32%] shrink-0 overflow-hidden h-52 md:h-auto">
            <MotionImage
              animate={{ scale: hovered ? 1.1 : 1 }}
              transition={{ duration: 0.6 }}
              src={pkg.imageUrl ?? "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmMmY1Ii8+PC9zdmc+"}
              alt={pkg.name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {pkg.isTrending && (
                <div className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-lg backdrop-blur-sm">
                  <Zap className="w-2.5 h-2.5 fill-current" /> Trending
                </div>
              )}
              {pkg.isFeatured && (
                <div className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-lg backdrop-blur-sm">
                  <Sparkles className="w-2.5 h-2.5 text-accent" /> Featured
                </div>
              )}
            </div>

            {discount > 0 && (
              <div className="absolute bottom-3 left-3 bg-red-600 text-white text-[11px] font-bold px-2 py-1 rounded shadow-lg">
                {discount}% OFF
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className="flex-1 p-5 md:p-6 flex flex-col justify-between bg-white border-r border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-accent mb-1.5">
                <Clock className="w-3 h-3" />
                {pkg.nights} Nights / {pkg.duration} Days
              </div>
              <h3 className="text-xl md:text-2xl font-semibold text-primary group-hover:text-accent transition-colors leading-tight mb-2">
                {pkg.name}
              </h3>
              
              {/* Route/Cities */}
              {citiesList.length > 0 && (
                <div className="flex items-center flex-wrap gap-2 mb-4">
                  {citiesList.map((city, i) => (
                    <div key={i} className="flex items-center">
                      <span className="text-sm font-bold text-slate-600">{city}</span>
                      {i < citiesList.length - 1 && <ArrowRight className="w-3 h-3 mx-1.5 text-slate-300" />}
                    </div>
                  ))}
                </div>
              )}

              {/* Highlights */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                   <Hotel className="w-3 h-3 text-primary" /> Stay
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                   <Car className="w-3 h-3 text-primary" /> Transfers
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                   <Plane className="w-3 h-3 text-primary" /> Sightseeing
                </div>
              </div>
              
              <ul className="space-y-1.5">
                {displayHighlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-500 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Price Panel — desktop only side panel */}
          <div className="hidden md:flex w-[25%] p-6 flex-col justify-center items-end bg-gradient-to-l from-slate-50 to-white text-right shrink-0">
            <div className="mb-4">
              <div className="flex items-center justify-end gap-1 mb-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold text-slate-700">{pkg.rating || 4.8}</span>
                <span className="text-[10px] text-slate-400">({pkg.reviewCount || 120} reviews)</span>
              </div>
              {pkg.originalPrice && pkg.originalPrice > pkg.pricePerPerson && (
                <p className="text-sm text-slate-400 line-through mb-0.5">₹{pkg.originalPrice.toLocaleString("en-IN")}</p>
              )}
              <div className="flex flex-col items-end">
                <span className="text-3xl font-bold text-primary leading-none">₹{pkg.pricePerPerson.toLocaleString("en-IN")}</span>
                <span className="text-[10px] text-slate-500 font-bold mt-1">Per Person</span>
              </div>
            </div>
            <button className="w-full bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-accent hover:text-slate-900 transition-all duration-300 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm">
              View Details <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-green-600 font-bold mt-2">✓ Best Price Guaranteed</p>
          </div>
        </div>

        {/* Mobile-only: compact price + CTA row pinned at the bottom */}
        <div className="flex md:hidden items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-[10px] font-bold text-slate-600">{pkg.rating || 4.8} · {pkg.reviewCount || 120} reviews</span>
            </div>
            {pkg.originalPrice && pkg.originalPrice > pkg.pricePerPerson && (
              <span className="text-[10px] text-slate-400 line-through leading-none">₹{pkg.originalPrice.toLocaleString("en-IN")}</span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-primary leading-tight">₹{pkg.pricePerPerson.toLocaleString("en-IN")}</span>
              <span className="text-[9px] text-slate-500 font-semibold">/person</span>
            </div>
          </div>
          <button className="shrink-0 bg-primary text-white font-bold py-2.5 px-5 rounded-xl text-sm flex items-center gap-1.5 shadow-md shadow-primary/20 active:scale-95 transition-transform">
            View Details <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </Link>
    );
  }

  /* ── Carousel / Premium variant ── */
  if (variant === "carousel") {
    const formatRoute = (cities: string[]) => {
      if (!cities || cities.length === 0) return pkg.destinationName || "";
      // Format as "Shimla (2) → Manali (3)"
      return cities.slice(0, 3).map(c => `${c} (${Math.max(1, Math.floor(pkg.nights / Math.max(1, cities.length)))})`).join(" → ");
    };

    return (
      <Link href={`/packages/${pkg.slug}`} className="block h-[380px] w-full group relative rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-transform hover:-translate-y-1.5 duration-300">
        {/* Top Image Section (65%) */}
        <div className="absolute top-0 left-0 right-0 h-[65%] w-full">
          <MotionImage
            src={pkg.imageUrl ?? "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmMmY1Ii8+PC9zdmc+"}
            alt={pkg.name}
            fill
            className="object-cover"
            animate={{ scale: hovered ? 1.05 : 1 }}
            transition={{ duration: 0.8 }}
          />
          {/* Enhanced gradient for text readability and theme matching */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#1B3A6B] to-transparent opacity-90" />
          
          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
            {pkg.isTrending && (
              <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-accent/95 backdrop-blur-sm text-primary text-[9px] font-bold px-2.5 py-1 rounded shadow-lg flex items-center gap-1 border border-accent/20">
                <Zap className="w-2.5 h-2.5 fill-current" /> TRENDING
              </motion.div>
            )}
          </div>

          {/* Discount Badge */}
          {discount > 0 && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ 
                scale: 1, 
                opacity: 1,
                rotate: [0, -5, 5, -5, 5, 0]
              }} 
              transition={{ 
                scale: { type: "spring", stiffness: 400, damping: 25 },
                rotate: { duration: 0.6, repeat: Infinity, repeatDelay: 2.5, delay: 1 }
              }}
              className="absolute top-3 right-3 bg-red-600 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-1 rounded shadow-lg z-20 shadow-red-600/30 border border-red-500/50"
            >
              {discount}% OFF
            </motion.div>
          )}

          <h3 className="absolute bottom-3 left-4 right-4 text-white text-[17px] md:text-lg font-bold leading-tight z-10 shadow-black/50 drop-shadow-lg line-clamp-2">
            {pkg.name}
          </h3>
        </div>

        {/* Bottom Solid Block (35%) */}
        <div className="absolute bottom-0 left-0 right-0 h-[35%] w-full p-4 flex flex-col justify-between z-10 bg-primary">
           <div className="flex items-center gap-2 mb-2">
             <div className="bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-2.5 py-1 rounded flex items-center justify-center shrink-0">
               {pkg.duration}D & {pkg.nights}N
             </div>
             <div className="text-white/80 text-[11px] font-medium truncate">
               {formatRoute(citiesList)}
             </div>
           </div>

           {/* Inclusions Icons */}
           <div className="flex items-center gap-1.5 mb-1">
             {inclusionList.slice(0, 4).map((inc, i) => (
               <div key={i} className="flex items-center justify-center w-6 h-6 rounded-full bg-white/5 border border-white/10 text-accent group-hover:bg-white/10 transition-colors" title={inc.label}>
                 <inc.Icon className="w-3 h-3" />
               </div>
             ))}
           </div>

           <div className="flex items-end justify-between mt-auto">
             <div className="flex flex-col">
               {pkg.originalPrice && pkg.originalPrice > pkg.pricePerPerson ? (
                 <span className="text-white/50 text-[10px] line-through font-semibold leading-none mb-0.5">
                   ₹{pkg.originalPrice.toLocaleString("en-IN")}/-
                 </span>
               ) : <span className="h-3" />}
               <span className="text-white text-[20px] font-bold leading-none tracking-tight">
                 ₹{pkg.pricePerPerson.toLocaleString("en-IN")}/-
               </span>
             </div>
             <button className="bg-white text-primary text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors shadow-sm active:scale-95 shrink-0">
               View Details
             </button>
           </div>
        </div>
      </Link>
    );
  }

  /* ── Default / Grid variant ── */
  return (
    <Link href={`/packages/${pkg.slug}`} className="h-full block group perspective-1000">
      <motion.div
        whileHover={{ y: -10, scale: 1.015 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "relative h-full flex flex-col bg-white rounded-[2rem] overflow-hidden border transition-all duration-500 transform-gpu",
          hovered 
            ? "shadow-[0_30px_60px_-15px_rgba(27,58,107,0.2)] border-primary/30" 
            : "shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border-slate-100"
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Glow Effect */}
        <div 
          className={cn(
            "absolute inset-0 pointer-events-none z-20 transition-opacity duration-700 bg-gradient-to-tr from-white/0 via-white/20 to-white/0",
            hovered ? "opacity-100" : "opacity-0"
          )}
        />
        {/* Image Section */}
        <div className="relative h-48 md:h-52 overflow-hidden">
          <MotionImage
            animate={{ scale: hovered ? 1.08 : 1 }}
            transition={{ type: "tween", ease: "easeOut", duration: 0.7 }}
            src={pkg.imageUrl ?? "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmMmY1Ii8+PC9zdmc+"}
            alt={pkg.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/10" />
          
          {/* Top Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {pkg.isTrending && (
              <div className="bg-orange-500/90 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <Zap className="w-2.5 h-2.5 fill-current" /> Trending
              </div>
            )}
            {pkg.isFeatured && (
              <div className="bg-primary/90 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg border border-white/20">
                <Sparkles className="w-2.5 h-2.5 text-accent" /> Top Rated
              </div>
            )}
          </div>

          {/* Discount */}
          {discount > 0 && (
            <div className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg border border-white/20">
              {discount}% OFF
            </div>
          )}


          {/* Destination & Cities Overlay */}
          <div className="absolute bottom-4 left-4 right-4">
             <div className="flex items-center gap-1.5 text-white/90 text-[10px] font-bold mb-1">
                <MapPin className="w-3 h-3 text-accent" />
                {pkg.stateName || "Himachal"}
             </div>
             <div className="flex flex-wrap items-center gap-2">
                {citiesList.slice(0, 3).map((city, i) => (
                  <span key={i} className="text-white text-[11px] font-bold bg-black/20 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                    {city}
                  </span>
                ))}
             </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                   {[1,2,3,4,5].map(s => (
                     <Star key={s} className={cn("w-2.5 h-2.5", s <= (pkg.rating || 5) ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
                   ))}
                </div>
                <span className="text-[9px] font-bold text-slate-400 ml-1">{pkg.reviewCount || 150}+ Reviews</span>
             </div>
             <div className="flex items-center gap-1 text-[9px] font-bold text-primary px-2 py-0.5 bg-primary/5 rounded-lg border border-primary/10">
                <Clock className="w-3 h-3 text-accent" /> {pkg.nights}N/{pkg.duration}D
             </div>
          </div>

          <h3 className="text-[15px] font-bold text-primary leading-tight mb-3 group-hover:text-accent transition-colors line-clamp-1">
            {pkg.name}
          </h3>

          <div className="flex items-center gap-3 mb-3 py-1.5 border-y border-slate-50">
            {inclusionList.map((inc, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5 group/inc">
                <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center group-hover/inc:bg-primary/10 transition-colors">
                  <inc.Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-[7px] font-bold text-slate-400">{inc.label}</span>
              </div>
            ))}
          </div>

          {/* Tour Highlights */}
          <div className="space-y-1.5 mb-3">
            <p className="text-[9px] font-bold text-slate-300 px-1 mb-0.5">Tour Highlights</p>
            <div className="grid grid-cols-1 gap-1">
              {displayHighlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-[10px] text-slate-500 font-semibold">
                  <div className="w-1 h-1 rounded-full bg-accent mt-1.5 shrink-0" />
                  <span className="line-clamp-1 leading-tight">{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-3 border-t border-slate-100 flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-bold">Starting from</span>
              {pkg.originalPrice && pkg.originalPrice > pkg.pricePerPerson ? (
                <span className="text-[10px] text-slate-300 line-through font-bold leading-none mb-0.5">₹{pkg.originalPrice.toLocaleString()}</span>
              ) : null}
              <div className="flex items-baseline gap-0.5">
                <span className="text-xl font-bold text-primary leading-none">₹{pkg.pricePerPerson.toLocaleString()}</span>
                <span className="text-[9px] text-slate-400 font-bold">/ PP</span>
              </div>
            </div>
            
            <motion.div
              animate={{ x: hovered ? 4 : 0 }}
              className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 group-hover:bg-accent transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export const PackageCard = memo(PackageCardComponent);