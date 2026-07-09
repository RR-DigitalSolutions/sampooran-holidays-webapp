"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star, MapPin, Clock, CheckCircle, Sparkles, Zap,
  ArrowRight, Plane, Hotel, Car, Utensils, Camera, Ticket, ShieldCheck,
  CheckCircle2, Users, FileText, Coffee, Heart
} from "lucide-react";
import Image from "next/image";
import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
  const router = useRouter();
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
    ? pkg.inclusionIcons.slice(0, 5).map(id => ({ id, label: id.charAt(0).toUpperCase() + id.slice(1).toLowerCase(), Icon: getInclusionIconById(id) }))
    : displayInclusions.map(text => {
      const word = text.split(' ')[0];
      return { id: text, label: word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(), Icon: getInclusionIcon(text) };
    });

  const citiesList = pkg.cities || (pkg.destinationName ? [pkg.destinationName] : []);

  /* ── Horizontal variant (List View) ── */
  if (variant === "horizontal") {
    const href = `/packages/${pkg.slug}`;
    return (
      <Link
        href={href}
        onTouchStart={() => router.prefetch(href)}
        onMouseEnter={() => router.prefetch(href)}
      >
        <div
          className="group relative rounded-xl overflow-hidden bg-primary border border-primary/30 hover:border-accent/40 hover:shadow-[0_20px_50px_rgba(27,58,107,0.35)] transition-all duration-500 cursor-pointer flex flex-col md:flex-row"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Image Panel */}
          <div className="relative w-full md:w-[32%] shrink-0 overflow-hidden h-44 md:h-auto">
            <Image
              src={pkg.imageUrl && pkg.imageUrl.trim() ? pkg.imageUrl : "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmMmY1Ii8+PC9zdmc+"}
              alt={pkg.name || "Package image"}
              fill
              className="object-cover card-img-zoom"
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
                <div className="bg-accent text-primary text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-lg backdrop-blur-sm">
                  <Sparkles className="w-2.5 h-2.5" /> Featured
                </div>
              )}
            </div>

            {discount > 0 && (
              <div className="absolute bottom-3 left-3 bg-red-600 text-white text-[11px] font-bold px-2 py-1 rounded shadow-lg">
                {discount}% OFF
              </div>
            )}

            {/* Wishlist */}
            <button
              onClick={(e) => { e.preventDefault(); setWishlisted(!wishlisted); }}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/20 backdrop-blur-md hover:bg-white hover:text-red-500 transition-all z-10 border border-white/20 text-white"
            >
              <Heart className={`h-3 w-3 ${wishlisted ? "fill-red-500 text-red-500" : ""}`} />
            </button>
          </div>

          {/* Info Panel */}
          <div className="flex-1 p-4 md:p-4.5 flex flex-col justify-between bg-primary">
            <div>
              <div className="flex items-center gap-2 text-[9px] font-bold text-accent mb-1">
                <Clock className="w-2.5 h-2.5" />
                {pkg.nights} Nights / {pkg.duration} Days
              </div>
              <h3 className="text-lg md:text-[19px] font-semibold text-white group-hover:text-accent transition-colors leading-tight mb-1.5">
                {pkg.name}
              </h3>

              {/* Route/Cities */}
              {citiesList.length > 0 && (
                <div className="flex items-center flex-wrap gap-1.5 mb-2.5">
                  {citiesList.map((city, i) => (
                    <div key={i} className="flex items-center">
                      <span className="text-xs font-bold text-white/70">{city}</span>
                      {i < citiesList.length - 1 && <ArrowRight className="w-2.5 h-2.5 mx-1 text-accent/50" />}
                    </div>
                  ))}
                </div>
              )}

              {/* Highlights */}
              <div className="flex flex-wrap gap-2 mb-3">
                <div className="flex items-center gap-1 text-[10px] text-white/80 bg-white/10 px-2 py-0.5 rounded-md border border-white/10 font-semibold">
                  <Hotel className="w-2.5 h-2.5 text-accent" /> Stay
                </div>
                <div className="flex items-center gap-1 text-[10px] text-white/80 bg-white/10 px-2 py-0.5 rounded-md border border-white/10 font-semibold">
                  <Car className="w-2.5 h-2.5 text-accent" /> Transfers
                </div>
                <div className="flex items-center gap-1 text-[10px] text-white/80 bg-white/10 px-2 py-0.5 rounded-md border border-white/10 font-semibold">
                  <Camera className="w-2.5 h-2.5 text-accent" /> Sightseeing
                </div>
              </div>

              <ul className="space-y-1">
                {displayHighlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-white/90 font-normal">
                    <CheckCircle className="w-3 h-3 text-accent shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Price Panel — desktop only side panel */}
          <div className="hidden md:flex w-[25%] p-6 flex-col justify-center items-end bg-primary/90 border-l border-white/10 text-right shrink-0">
            <div className="mb-4">
              <div className="flex items-center justify-end gap-1 mb-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold text-white">{pkg.rating || 4.8}</span>
                <span className="text-[10px] text-white/70">({pkg.reviewCount || 120} reviews)</span>
              </div>
              {pkg.originalPrice && pkg.originalPrice > pkg.pricePerPerson && (
                <p className="text-sm text-white/50 line-through mb-0.5">₹{pkg.originalPrice.toLocaleString("en-IN")}</p>
              )}
              <div className="flex flex-col items-end">
                <span className="text-3xl font-bold text-white leading-none">₹{pkg.pricePerPerson.toLocaleString("en-IN")}</span>
                <span className="text-[10px] text-white/90 font-bold mt-1">Per Person</span>
              </div>
            </div>
            <button className="w-full bg-accent text-primary font-bold py-3 px-6 rounded-lg hover:bg-white hover:text-primary transition-all duration-300 shadow-lg shadow-black/20 flex items-center justify-center gap-2 text-sm">
              View Details <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-emerald-400 font-bold mt-2">✓ Best Price Guaranteed</p>
          </div>
        </div>

        {/* Mobile-only: compact price + CTA row pinned at the bottom */}
        <div className="flex md:hidden items-center justify-between gap-3 px-3 py-2 md:px-4 md:py-3 border-t border-white/10 bg-primary/95">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-[10px] font-medium text-white/90">{pkg.rating || 4.8} · {pkg.reviewCount || 120} reviews</span>
            </div>
            {pkg.originalPrice && pkg.originalPrice > pkg.pricePerPerson && (
              <span className="text-[10px] text-white/50 line-through leading-none">₹{pkg.originalPrice.toLocaleString("en-IN")}</span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-white leading-tight">₹{pkg.pricePerPerson.toLocaleString("en-IN")}</span>
              <span className="text-[9px] text-white/90 font-semibold">/person</span>
            </div>
          </div>
          <button className="shrink-0 bg-accent text-primary font-bold py-2.5 px-5 rounded-lg text-sm flex items-center gap-1.5 shadow-md shadow-black/20 active:scale-95 transition-transform">
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
      return cities.slice(0, 3).join(" → ");
    };

    const href = `/packages/${pkg.slug}`;
    return (
      <Link
        href={href}
        onTouchStart={() => router.prefetch(href)}
        onMouseEnter={() => router.prefetch(href)}
        className="block h-[210px] xs:h-[230px] sm:h-[310px] md:h-[365px] w-full group relative rounded-md overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-transform hover:-translate-y-1.5 duration-300 border border-primary/20 card-gpu-fix"
      >
        {/* Top Image Section (58%) */}
        <div className="absolute top-0 left-0 right-0 h-[58%] w-full">
          <Image
            src={pkg.imageUrl && pkg.imageUrl.trim() ? pkg.imageUrl : "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmMmY1Ii8+PC9zdmc+"}
            alt={pkg.name || "Package image"}
            fill
            className="object-cover card-img-zoom"
          />
          {/* Enhanced gradient for text readability and theme matching */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#1B3A6B] to-transparent opacity-90" />

          {/* Top Badges */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1.5 z-20">
            {pkg.isTrending && (
              <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-emerald-500 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded shadow-lg flex items-center gap-1 border border-emerald-500/25">
                <Zap className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-current" /> TRENDING
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
              className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-red-600 backdrop-blur-sm text-white text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded shadow-lg z-20 shadow-red-600/30 border border-red-500/50"
            >
              {discount}% OFF
            </motion.div>
          )}

          {/* Duration & Title Absolute Overlay */}
          <div className="absolute bottom-1.5 left-2 right-2 sm:bottom-2.5 sm:left-4 sm:right-4 z-10 flex flex-col items-start gap-1">
            <span className="bg-accent text-primary text-[7.5px] xs:text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm tracking-wider uppercase leading-none">
              {pkg.duration}D &amp; {pkg.nights}N
            </span>
            <h3 className="text-white text-[10px] xs:text-[11.5px] sm:text-[13px] md:text-[16px] font-bold leading-tight shadow-black/50 drop-shadow-lg line-clamp-2">
              {pkg.name}
            </h3>
          </div>
        </div>

        {/* Bottom Solid Block (42%) */}
        <div className="absolute bottom-0 left-0 right-0 h-[42%] w-full p-2 sm:p-3 flex flex-col justify-between z-10 bg-primary">
          {/* Covered Places: Touch-responsive horizontal scroll list */}
          <div className="w-full">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none touch-pan-x w-full py-0.5">
              {citiesList.length > 0 ? (
                citiesList.map((city, i) => (
                  <span key={i} className="flex items-center gap-0.5 shrink-0">
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-1.5 h-1.5 text-accent shrink-0" />
                      <span className="text-white/70 font-sans text-[5.5px] xs:text-[6px] sm:text-[7.5px] font-medium uppercase tracking-wide leading-none">
                        {city}
                      </span>
                    </span>
                    {i < citiesList.length - 1 && (
                      <span className="text-accent font-black text-[7px] xs:text-[8px] sm:text-[9px] shrink-0 mx-0.5">→</span>
                    )}
                  </span>
                ))
              ) : (
                <div className="flex items-center gap-0.5 shrink-0">
                  <MapPin className="w-1.5 h-1.5 text-accent shrink-0" />
                  <span className="text-white/70 font-sans text-[5.5px] xs:text-[6px] sm:text-[7.5px] font-medium uppercase tracking-wide leading-none">
                    {pkg.destinationName || "Himachal"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Inclusions Icons row */}
          <div className="flex items-center gap-1 sm:gap-1.5 my-1">
            {inclusionList.slice(0, 5).map((inc, i) => (
              <div key={i} className="flex items-center gap-0.5 sm:gap-1" title={inc.label}>
                <div className="flex items-center justify-center w-4 h-4 sm:w-5.5 sm:h-5.5 rounded-full bg-white/5 border border-white/10 text-accent group-hover:bg-white/10 transition-colors shrink-0">
                  <inc.Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </div>
                <span className="hidden xs:inline text-white/90 text-[6.5px] font-normal capitalize">{inc.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-end justify-between mt-auto">
            <div className="flex flex-col">
              {pkg.originalPrice && pkg.originalPrice > pkg.pricePerPerson ? (
                <span className="text-white/50 text-[7.5px] xs:text-[8px] sm:text-[9px] line-through font-semibold leading-none mb-0.5">
                  ₹{pkg.originalPrice.toLocaleString("en-IN")}/-
                </span>
              ) : <span className="h-2" />}
              <span className="text-white text-xs xs:text-sm sm:text-[16px] font-bold leading-none tracking-tight">
                ₹{pkg.pricePerPerson.toLocaleString("en-IN")}/-
              </span>
            </div>
            <button className="hidden sm:block bg-white text-primary text-[10px] font-bold px-2.5 py-1.5 rounded-sm hover:bg-accent transition-colors shadow-sm active:scale-95 shrink-0">
              Details
            </button>
          </div>
        </div>
      </Link>
    );
  }

  /* ── Default / Grid variant ── */
  const href = `/packages/${pkg.slug}`;
  return (
    <Link
      href={href}
      onTouchStart={() => router.prefetch(href)}
      onMouseEnter={() => router.prefetch(href)}
      className="h-full block group card-mobile-margin card-gpu-fix"
    >
      <div
        className={cn(
          "relative h-full flex flex-col bg-primary rounded-lg overflow-hidden border transition-all duration-300",
          hovered
            ? "shadow-[0_20px_50px_-10px_rgba(27,58,107,0.45)] border-accent/30 -translate-y-1.5"
            : "shadow-[0_8px_30px_-8px_rgba(0,0,0,0.25)] border-primary/30 translate-y-0"
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Shimmer / glow on hover */}
        <div
          className={cn(
            "absolute inset-0 pointer-events-none z-20 transition-opacity duration-700 bg-gradient-to-tr from-white/0 via-white/5 to-white/0",
            hovered ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Image Section */}
        <div className="relative h-40 md:h-44 overflow-hidden shrink-0">
          <Image
            src={pkg.imageUrl && pkg.imageUrl.trim() ? pkg.imageUrl : "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmMmY1Ii8+PC9zdmc+"}
            alt={pkg.name || "Package image"}
            fill
            className="object-cover card-img-zoom"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/5" />
          {/* Blue tint at bottom to blend into card body */}
          <div className="absolute bottom-0 inset-x-0 h-5 bg-gradient-to-t from-primary/90 to-transparent" />

          {/* Top Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            {pkg.isTrending && (
              <div className="bg-orange-500/90 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-lg">
                <Zap className="w-2.5 h-2.5 fill-current" /> Trending
              </div>
            )}
            {pkg.isFeatured && (
              <div className="bg-accent/90 backdrop-blur-md text-primary text-[9px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-lg border border-white/20">
                <Sparkles className="w-2.5 h-2.5" /> Top Rated
              </div>
            )}
          </div>

          {/* Discount */}
          {discount > 0 && (
            <div className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-lg border border-white/20 z-10">
              {discount}% OFF
            </div>
          )}

          {/* Wishlist button */}
          <button
            onClick={(e) => { e.preventDefault(); setWishlisted(!wishlisted); }}
            className={cn(
              "absolute top-4 right-4 p-1.5 rounded-lg backdrop-blur-md hover:bg-white/30 transition-all z-10 border border-white/20",
              discount > 0 ? "hidden" : "block",
              wishlisted ? "bg-red-500/80 text-white" : "bg-white/20 text-white"
            )}
          >
            <Heart className={`h-3 w-3 ${wishlisted ? "fill-white" : ""}`} />
          </button>

          {/* Destination & Cities Overlay */}
          <div className="absolute bottom-3 left-4 right-4 z-10">
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
        <div className="p-2.5 pt-1 md:p-3 md:pt-1 flex flex-col flex-1 bg-primary">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={cn("w-2.5 h-2.5", s <= (pkg.rating || 5) ? "fill-amber-400 text-amber-400" : "text-white/20")} />
                ))}
              </div>
              <span className="text-[8.5px] font-medium text-white/90 ml-1">{pkg.reviewCount || 150}+ Reviews</span>
            </div>
            <div className="flex items-center gap-1 text-[8.5px] font-bold text-accent px-1.5 py-0.5 bg-white/5 rounded-lg border border-white/10">
              <Clock className="w-2.5 h-2.5 text-accent" /> {pkg.nights}N/{pkg.duration}D
            </div>
          </div>

          <h3 className="text-xs font-semibold md:text-[13.5px] md:font-bold text-white leading-tight mb-1 group-hover:text-accent transition-colors line-clamp-1">
            {pkg.name}
          </h3>

          {/* Inclusions row */}
          <div className="flex items-center gap-1.5 md:gap-3 mb-1 py-0.5 border-y border-white/3">
            {inclusionList.map((inc, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5 group/inc">
                <div className="w-5.5 h-5.5 md:w-6 md:h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-colors group-hover/inc:bg-white/10">
                  <inc.Icon className="w-2.5 md:w-3 h-2.5 md:h-3 text-accent" />
                </div>
                <span className="text-[6.5px] md:text-[7px] font-normal text-white">{inc.label}</span>
              </div>
            ))}
          </div>

          {/* Tour Highlights */}
          <div className="space-y-0.5 mb-0.5">
            <p className="text-[8px] font-semibold text-accent px-1 mb-0.5 uppercase tracking-wider">Tour Highlights</p>
            <div className="grid grid-cols-1 gap-0.5">
              {displayHighlights.map((h, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[8.5px] md:text-[9px] text-white/90 font-normal">
                  <div className="w-1 h-1 rounded-full bg-accent mt-1 shrink-0" />
                  <span className="line-clamp-1 leading-tight">{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-1.5 border-t border-white/10 flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-[8px] text-white/40 font-bold uppercase tracking-wider">Starting from</span>
              {pkg.originalPrice && pkg.originalPrice > pkg.pricePerPerson ? (
                <span className="text-[9px] text-white/30 line-through font-bold leading-none mb-0.5">₹{pkg.originalPrice.toLocaleString()}</span>
              ) : null}
              <div className="flex items-baseline gap-0.5">
                <span className="text-[17px] font-bold text-white leading-none">₹{pkg.pricePerPerson.toLocaleString()}</span>
                <span className="text-[8px] text-white/50 font-bold">/ PP</span>
              </div>
            </div>

            <motion.div
              animate={{ x: hovered ? 4 : 0 }}
              className="w-8 h-8 rounded-md bg-accent text-primary flex items-center justify-center shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export const PackageCard = memo(PackageCardComponent);