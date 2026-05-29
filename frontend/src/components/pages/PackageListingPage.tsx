"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Calendar, MapPin, Loader2, Star, Clock, Filter, SlidersHorizontal, Search, Info, X, Mountain, Activity, Sparkles, ShieldCheck, Utensils, Compass, LayoutGrid, List as ListIcon, BookOpen, Globe, CloudSun, Bus, CreditCard, MessageCircle, Heart, PhoneCall, ShoppingBag, Briefcase, ChevronDown, HelpCircle, ChevronLeft, Quote } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PackageCard } from "@/components/PackageCard";
import { Youtube } from "lucide-react";
import { cn, validateImageUrl, getYouTubeId } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

export function PackageListingPage({ entityType, entityData, searchParams }: { entityType: string, entityData: any, searchParams: any }) {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [childPlaces, setChildPlaces] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [activeTab, setActiveTab] = useState("cities");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showDetails, setShowDetails] = useState(false);


  useEffect(() => {
    async function fetchPackages() {
      try {
        setLoading(true);
        // Construct query based on entity type
        let queryStr = "";
        const cleanName = entityData.name.split('(')[0].trim();

        if (entityType === "country") queryStr = `country=${encodeURIComponent(cleanName)}`;
        else if (entityType === "state") queryStr = `state=${encodeURIComponent(cleanName)}`;
        else if (entityType === "destination") queryStr = `destinationSlug=${entityData.slug}`;
        else if (entityType === "theme") queryStr = `category=${entityData.name}`;

        const res = await fetch(`/api/packages?${queryStr}`);
        if (res.ok) {
          const data = await res.json();
          setPackages(data.packages || []);
        }
      } catch (err) {
        console.error("Failed to fetch packages", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPackages();
  }, [entityData.slug, entityType, entityData.name]);

  useEffect(() => {
    async function fetchPlaces() {
      try {
        const cleanName = entityData.name.split('(')[0].trim();
        let url = '/api/destinations?limit=24';

        if (entityType === 'country') {
          url += `&country=${encodeURIComponent(cleanName)}`;
        } else if (entityType === 'state') {
          url += `&state=${encodeURIComponent(cleanName)}`;
        } else if (entityType === 'destination' && entityData.stateName) {
          url += `&state=${encodeURIComponent(entityData.stateName.split('(')[0].trim())}`;
        } else {
          return;
        }

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const placesArray = data.destinations || (Array.isArray(data) ? data : []);
          const filtered = placesArray.filter((d: any) => d.id !== entityData.id);
          setChildPlaces(filtered);
        }
      } catch (err) {
        console.error("Failed to fetch child places", err);
      }
    }
    fetchPlaces();
  }, [entityType, entityData.name, entityData.id]);

  return (
    <div className="w-full flex flex-col font-sans">
      {/* Dynamic Destination Hero */}
      <div className="bg-primary text-white pt-16 md:pt-18 pb-0 md:pb-0 relative overflow-hidden">
        {/* Background Image with theme overlay */}
        {entityData.imageUrl && (
          <>
            <Image
              src={validateImageUrl(entityData.imageUrl)}
              alt=""
              fill
              className="object-cover absolute inset-0 z-0 pointer-events-none opacity-85"
              priority
            />
            {/* Shade with theme color */}
            <div className="absolute inset-0 bg-primary/60 z-0 pointer-events-none mix-blend-multiply" />
            <div className="absolute inset-0 bg-primary/60 z-0 pointer-events-none" />
          </>
        )}
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 items-center">
            {/* Left Content */}
            <div className="flex flex-col space-y-3 md:space-y-6">
              <h1 className="text-2xl md:text-5xl font-bold font-serif capitalize leading-tight">
                {entityData.name} Tour Packages
              </h1>
              <p className="text-sm md:text-base font-normal opacity-90 max-w-xl line-clamp-2 md:line-clamp-none">
                {entityData.shortDescription || `Explore curated itineraries and best deals for ${entityData.name}`}
              </p>

              {/* Dynamic Price Range — hidden on mobile to keep hero compact */}
              {!loading && packages.length > 0 && packages.some(p => Number(p.price) > 0) && (
                <div className="hidden md:inline-flex bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex-col w-fit">
                  <span className="text-sm text-accent font-bold mb-1">Package Pricing</span>
                  <div className="flex items-center gap-2 text-2xl font-bold">
                    <span>₹{Math.min(...packages.filter(p => Number(p.price) > 0).map(p => Number(p.price))).toLocaleString('en-IN')}</span>
                    <span className="text-lg text-white/60">to</span>
                    <span>₹{Math.max(...packages.filter(p => Number(p.price) > 0).map(p => Number(p.price))).toLocaleString('en-IN')}</span>
                  </div>
                  <span className="text-xs text-white/70 mt-1">Based on {packages.length} curated packages</span>
                </div>
              )}

            </div>

            {/* Right Media — compact on mobile, full on desktop */}
            <div className="w-full relative aspect-video rounded-2xl md:rounded-3xl overflow-hidden border-2 md:border-4 border-white/10 shadow-xl md:shadow-2xl bg-black">
              {entityData.heroVideoUrl ? (
                (() => {
                  const ytId = getYouTubeId(entityData.heroVideoUrl);
                  if (ytId) {
                    return (
                      <iframe
                        src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1&rel=0&iv_load_policy=3`}
                        className="absolute inset-0 w-full h-full scale-[1.02]"
                        allow="autoplay; encrypted-media"
                        title="Destination Video"
                      />
                    );
                  }
                  return (
                    <video
                      src={entityData.heroVideoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  );
                })()
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800">
                  <Youtube className="w-20 h-20 text-white/10 animate-pulse" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Integrated Auto-Sliding Carousel — Places to Cover */}
        {childPlaces.length > 0 && (
          <div className="w-full bg-black/20 backdrop-blur-md border-t border-white/10 overflow-hidden mt-6 md:mt-10">
            <div className="flex items-center">
              <div className="px-4 py-2.5 shrink-0 border-r border-white/20 hidden md:flex flex-col">
                <p className="text-[11px] font-bold text-accent">Top Places</p>
                <p className="text-xs font-bold text-white">To Cover</p>
              </div>
              {/* Mobile label */}
              <div className="px-3 py-2 shrink-0 border-r border-white/20 md:hidden">
                <p className="text-[9px] font-black text-accent uppercase tracking-wider">Places</p>
              </div>

              {/* Marquee */}
              <div className="relative flex-1 overflow-hidden py-2.5">
                <motion.div
                  className="flex gap-2 md:gap-4 px-3 md:px-4 whitespace-nowrap"
                  animate={{ x: [0, -1000] }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear", repeatType: "loop" }}
                  style={{ width: "fit-content" }}
                >
                  {[...childPlaces, ...childPlaces, ...childPlaces].map((place, idx) => (
                    <Link
                      key={idx}
                      href={`/${place.slug}-tour-packages`}
                      className="inline-flex items-center gap-2 md:gap-3 bg-white/10 active:bg-white/20 px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-white/10 transition-colors group"
                    >
                      <div className="relative w-7 h-7 md:w-10 md:h-10 rounded-md md:rounded-lg overflow-hidden shrink-0 border border-white/20">
                        <Image src={validateImageUrl(place.thumbnailUrl || place.imageUrl)} alt="" fill className="object-cover" sizes="40px" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] md:text-xs font-bold text-white group-hover:text-accent transition-colors">{place.name}</span>
                        <span className="text-[8px] md:text-[9px] font-medium text-white/60">Starts ₹{place.lowestPrice || "9,999"}</span>
                      </div>
                    </Link>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </div>





      {/* Breadcrumbs */}
      <div className="bg-white border-b border-slate-200 py-1">
        <div className="container mx-auto px-4 flex items-center gap-2 text-slate-500 text-xs">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href={`/${entityData.slug}-tourism`} className="hover:text-primary transition-colors capitalize">{entityData.name}</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-800">Packages</span>
        </div>
      </div>

      {/* Listing Section */}
      <section className="py-3 md:py-4 pt-2 bg-[#f4f4f4]">
        <div className="container mx-auto px-3 md:px-4">

          {/* Mobile Filter Chips — horizontal scroll, replaces sidebar on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3 md:hidden no-scrollbar">
            <span className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-full">
              <Filter className="w-3 h-3" /> Filters
            </span>
            {["Honeymoon", "Family", "Adventure", "Luxury", "Under ₹10k", "4-6 Days"].map((f, i) => (
              <button key={i} className="shrink-0 px-3 py-1.5 bg-white border border-slate-200 text-xs font-semibold text-slate-600 rounded-full active:bg-primary active:text-white transition-colors">{f}</button>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-4 md:gap-6">

            {/* Left Sidebar (Filters) — desktop only */}
            <div className="hidden lg:block w-full lg:w-1/4 shrink-0">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 sticky top-24 overflow-hidden">
                <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <Filter className="w-4 h-4" /> Filters
                  </h3>
                  <span className="text-xs text-primary font-bold cursor-pointer hover:underline">Reset</span>
                </div>
                <div className="p-5 border-b border-slate-100">
                  <h4 className="font-bold text-sm text-slate-800 mb-4">Pricing (Per Person)</h4>
                  <div className="space-y-3">
                    {["Under ₹10,000", "₹10,000 - ₹20,000", "₹20,000 - ₹40,000", "Above ₹40,000"].map((label, i) => (
                      <label key={i} className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 accent-primary" />
                        <span className="text-sm text-slate-600 group-hover:text-slate-900">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="p-5 border-b border-slate-100">
                  <h4 className="font-bold text-sm text-slate-800 mb-4">Duration</h4>
                  <div className="space-y-3">
                    {["1 to 3 Days", "4 to 6 Days", "7 to 9 Days", "10+ Days"].map((label, i) => (
                      <label key={i} className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 accent-primary" />
                        <span className="text-sm text-slate-600 group-hover:text-slate-900">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="font-bold text-sm text-slate-800 mb-4">Themes</h4>
                  <div className="space-y-3">
                    {["Honeymoon", "Family", "Adventure", "Wildlife", "Luxury"].map((label, i) => (
                      <label key={i} className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 accent-primary" />
                        <span className="text-sm text-slate-600 group-hover:text-slate-900">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content Area */}
            <div className="w-full lg:w-3/4 flex flex-col gap-3 md:gap-5">
              {/* Sort Bar — compact on mobile */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-3 py-2 md:p-1 md:px-2 flex items-center justify-between gap-2">
                <h2 className="text-sm md:text-xl font-bold text-slate-800 md:mx-2 flex-1">
                  <span className="text-primary">{packages.length}</span> <span className="hidden sm:inline">Packages in {entityData.name}</span><span className="sm:hidden">Packages</span>
                </h2>

                {/* View Mode Toggle (Desktop only) */}
                <div className="hidden md:flex items-center bg-slate-50 p-1 rounded-lg border border-slate-200 mr-2">
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn("p-1.5 rounded-md transition-colors", viewMode === "list" ? "bg-white shadow-sm text-primary" : "text-slate-400 hover:text-slate-600")}
                    title="List View"
                  >
                    <ListIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn("p-1.5 rounded-md transition-colors", viewMode === "grid" ? "bg-white shadow-sm text-primary" : "text-slate-400 hover:text-slate-600")}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200">
                  <label htmlFor="sortPackages" className="text-[10px] font-bold text-slate-500 pl-2 hidden sm:block">SORT BY:</label>
                  <select id="sortPackages" aria-label="Sort packages by" className="bg-transparent text-xs md:text-sm font-bold text-slate-800 outline-none pr-2 md:pr-4 py-1.5 cursor-pointer">
                    <option>Popularity</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                    <option>Duration: Short to Long</option>
                  </select>
                </div>
              </div>

              {/* Packages List */}
              {loading ? (
                <div className="flex justify-center items-center py-20 bg-white rounded-xl shadow-sm border border-slate-200">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
              ) : packages.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-xl my-6 font-bold text-slate-800 mb-2">No packages found</h3>
                  <p className="text-slate-500 max-w-md">We are currently updating our packages for {entityData.name}. Please try removing some filters or check back later.</p>
                </div>
              ) : (
                <div className={cn("gap-5", viewMode === "list" ? "flex flex-col" : "grid grid-cols-1 md:grid-cols-2")}>
                  {packages.slice(0, visibleCount).map((pkg) => (
                    <PackageCard key={pkg.id} pkg={pkg} variant={viewMode === "list" ? "horizontal" : "default"} />
                  ))}

                  {visibleCount < packages.length && (
                    <div className={cn("flex justify-center mt-4 pb-4", viewMode === "grid" && "md:col-span-2")}>
                      <button
                        onClick={() => setVisibleCount(prev => prev + 10)}
                        className="w-full md:w-auto bg-white active:bg-slate-50 text-primary font-bold px-6 md:px-10 py-3.5 rounded-2xl border-2 border-primary/20 transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
                      >
                        Load More · {packages.length - visibleCount} remaining
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Popular City Packages Section — Exact Design Match */}
      {childPlaces.length > 0 && (
        <section className="py-12 bg-white border-t border-slate-100">
          <div className="container mx-auto px-4 max-w-6xl">

            {/* Tab Switcher — matches screenshot exactly */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex rounded-full border border-slate-200 overflow-hidden shadow-sm">
                <button
                  onClick={() => setActiveTab("cities")}
                  className={cn(
                    "px-6 py-2.5 text-sm font-bold transition-all",
                    activeTab === "cities"
                      ? "bg-primary text-white"
                      : "bg-white text-slate-500 hover:text-slate-700"
                  )}
                >
                  Popular {entityData.name} City Packages
                </button>
                <button
                  onClick={() => setActiveTab("similar")}
                  className={cn(
                    "px-6 py-2.5 text-sm font-bold transition-all border-l border-slate-200",
                    activeTab === "similar"
                      ? "bg-primary text-white"
                      : "bg-white text-slate-500 hover:text-slate-700"
                  )}
                >
                  Similar Packages
                </button>
              </div>
            </div>

            {activeTab === "cities" && (
              <div>
                {/* 4-Column Masonry Grid — explicit index placement */}
                {childPlaces.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 items-start">
                    {/* Col 1: Items at index 0, 4 — two short cards */}
                    <div className="flex flex-col gap-4">
                      {[childPlaces[0], childPlaces[4]].filter(Boolean).map(place => (
                        <MasonryCard key={place.id} place={place} tall={false} />
                      ))}
                    </div>
                    {/* Col 2: Item at index 1 — one tall card */}
                    <div className="flex flex-col gap-4">
                      {[childPlaces[1]].filter(Boolean).map(place => (
                        <MasonryCard key={place.id} place={place} tall={true} />
                      ))}
                    </div>
                    {/* Col 3: Items at index 2, 5 — two short cards (fixes empty slot below Khajjiar) */}
                    <div className="flex flex-col gap-4">
                      {[childPlaces[2], childPlaces[5]].filter(Boolean).map(place => (
                        <MasonryCard key={place.id} place={place} tall={false} />
                      ))}
                    </div>
                    {/* Col 4: Item at index 3 — one tall card */}
                    <div className="flex flex-col gap-4">
                      {[childPlaces[3]].filter(Boolean).map(place => (
                        <MasonryCard key={place.id} place={place} tall={true} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Pill Tags for remaining destinations */}
                {childPlaces.length > 7 && (
                  <div className="mt-8 flex flex-wrap justify-center gap-2.5">
                    {childPlaces.slice(7).map(place => (
                      <Link
                        key={place.id}
                        href={`/${place.slug}-tour-packages`}
                        className="px-5 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 hover:border-primary hover:text-primary transition-all shadow-sm hover:shadow-md"
                      >
                        {place.name} Tour Packages
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "similar" && (
              <div className="py-16 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Coming Soon</h3>
                <p className="text-slate-500 text-sm mt-2">We're curating similar packages based on your interests.</p>
              </div>
            )}

          </div>
        </section>
      )}
      {/* Inline Detailed Rich Content (SEO/AEO friendly) */}
      <section className={cn("bg-white border-t border-slate-100 transition-all duration-500", showDetails ? "pt-16 pb-6" : "py-16")}>
        <div className="container mx-auto px-4 max-w-6xl">
          <div className={cn("text-center max-w-5xl mx-auto", showDetails ? "mb-10" : "mb-0")}>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-4">
              More About {entityData.name}
            </h2>
            <p className="text-slate-600">{entityData.longDescription || entityData.description}</p>

            {!showDetails && (
              <button
                onClick={() => setShowDetails(true)}
                className="mt-8 inline-flex items-center gap-2 px-8 py-3 bg-white text-primary border-2 border-primary rounded-full font-bold shadow-sm hover:bg-primary hover:text-white transition-all duration-300 group"
              >
                Know More in Detail <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </section>

      <motion.div
        initial={false}
        animate={{
          height: showDetails ? 'auto' : 0,
          opacity: showDetails ? 1 : 0
        }}
        className="overflow-hidden"
      >
        <section className="pb-16 bg-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-slate-700 font-sans">
              {/* Essential Info & Guidelines */}
              <div className="space-y-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold font-serif text-slate-900 border-b pb-2">Essential Info</h3>

                  {entityData.bestTimeToVisit && (
                    <div>
                      <h4 className="text-sm font-bold text-accent flex items-center gap-2 mb-2"><Calendar className="w-4 h-4" /> Best Time to Visit</h4>
                      <p className="font-medium text-slate-800">{entityData.bestTimeToVisit}</p>
                    </div>
                  )}
                  {entityData.altitude && (
                    <div>
                      <h4 className="text-sm font-bold text-accent flex items-center gap-2 mb-2"><Mountain className="w-4 h-4" /> Altitude</h4>
                      <p className="text-sm font-medium">{entityData.altitude}</p>
                    </div>
                  )}
                  {entityData.howToReach && (
                    <div>
                      <h4 className="text-sm font-bold text-accent flex items-center gap-2 mb-2"><MapPin className="w-4 h-4" /> How to Reach</h4>
                      <p className="text-sm whitespace-pre-wrap">{entityData.howToReach}</p>
                    </div>
                  )}
                </div>

                {/* Safety & Tips (If available) */}
                {(entityData.safetyInfo || (entityData.travelTips && entityData.travelTips.length > 0)) && (
                  <div className="space-y-4 pt-4">
                    {entityData.safetyInfo && (
                      <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                        <h4 className="text-xs font-bold text-red-600 flex items-center gap-2 mb-2"><ShieldCheck className="w-4 h-4" /> Safety Information</h4>
                        <p className="text-sm text-red-900 whitespace-pre-wrap">{entityData.safetyInfo}</p>
                      </div>
                    )}
                    {entityData.travelTips && entityData.travelTips.length > 0 && (
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                        <h4 className="text-xs font-bold text-amber-600 flex items-center gap-2 mb-2"><Info className="w-4 h-4" /> Travel Tips</h4>
                        <ul className="space-y-1">
                          {entityData.travelTips.map((t: string, i: number) => (
                            <li key={i} className="text-sm text-amber-900 flex gap-2"><span className="text-amber-500">•</span> {t}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Highlights & Experience */}
              <div className="space-y-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold font-serif text-slate-900 border-b pb-2">Experience {entityData.name}</h3>

                  {entityData.highlights && entityData.highlights.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-accent flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4" /> Key Highlights</h4>
                      <ul className="space-y-2">
                        {entityData.highlights.map((h: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm font-medium text-slate-800">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Local Attractions */}
                  {entityData.localAttractions && entityData.localAttractions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-accent flex items-center gap-2 mb-3"><Compass className="w-4 h-4" /> Local Attractions</h4>
                      <div className="flex flex-wrap gap-2">
                        {entityData.localAttractions.map((t: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100 shadow-sm">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activities & Things to Do */}
                  {(entityData.activities || entityData.thingsToDo) && (
                    <div>
                      <h4 className="text-sm font-bold text-accent flex items-center gap-2 mb-3"><Activity className="w-4 h-4" /> Top Activities</h4>
                      <div className="flex flex-wrap gap-2">
                        {(entityData.activities || entityData.thingsToDo).map((t: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Local Cuisine */}
                  {entityData.localCuisine && entityData.localCuisine.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-accent flex items-center gap-2 mb-3"><Utensils className="w-4 h-4" /> Local Cuisine</h4>
                      <ul className="space-y-2">
                        {entityData.localCuisine.map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm font-medium text-slate-800">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0 inline-block" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Famous For */}
                  {entityData.famousFor && entityData.famousFor.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-accent flex items-center gap-2 mb-2"><Star className="w-4 h-4" /> Famous For</h4>
                      <p className="text-sm font-medium text-slate-600">
                        {Array.isArray(entityData.famousFor) ? entityData.famousFor.join(', ') : entityData.famousFor}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Advanced Traveler Knowledge Base */}
        {(entityData.historyAndCulture || entityData.geography || entityData.weatherAndClimate || entityData.transportation || entityData.currencyAndPayments || entityData.languageAndCommunication || entityData.localEtiquette || entityData.healthTips || entityData.emergencyNumbers || entityData.packingList || entityData.shopping) && (
          <section className="py-16 bg-slate-50 border-t border-slate-100">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="mb-10 text-center max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-4">
                  Traveler's Knowledge Base
                </h2>
                <p className="text-slate-600">Everything you need to know before visiting {entityData.name}.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-slate-700 font-sans">

                {/* General Background */}
                {(entityData.historyAndCulture || entityData.geography || entityData.weatherAndClimate) && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold font-serif text-slate-900 border-b pb-2">Background</h3>

                    {entityData.historyAndCulture && (
                      <div>
                        <h4 className="text-sm font-bold text-accent flex items-center gap-2 mb-2"><BookOpen className="w-4 h-4" /> History & Culture</h4>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{entityData.historyAndCulture}</p>
                      </div>
                    )}
                    {entityData.geography && (
                      <div>
                        <h4 className="text-sm font-bold text-accent flex items-center gap-2 mb-2"><Globe className="w-4 h-4" /> Geography</h4>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{entityData.geography}</p>
                      </div>
                    )}
                    {entityData.weatherAndClimate && (
                      <div>
                        <h4 className="text-sm font-bold text-accent flex items-center gap-2 mb-2"><CloudSun className="w-4 h-4" /> Weather & Climate</h4>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{entityData.weatherAndClimate}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Practical Info */}
                {(entityData.transportation || entityData.currencyAndPayments || entityData.languageAndCommunication || entityData.localEtiquette) && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold font-serif text-slate-900 border-b pb-2">Practical Info</h3>

                    {entityData.transportation && (
                      <div>
                        <h4 className="text-sm font-bold text-accent flex items-center gap-2 mb-2"><Bus className="w-4 h-4" /> Getting Around</h4>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{entityData.transportation}</p>
                      </div>
                    )}
                    {entityData.currencyAndPayments && (
                      <div>
                        <h4 className="text-sm font-bold text-accent flex items-center gap-2 mb-2"><CreditCard className="w-4 h-4" /> Currency & Payments</h4>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{entityData.currencyAndPayments}</p>
                      </div>
                    )}
                    {entityData.languageAndCommunication && (
                      <div>
                        <h4 className="text-sm font-bold text-accent flex items-center gap-2 mb-2"><MessageCircle className="w-4 h-4" /> Language</h4>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{entityData.languageAndCommunication}</p>
                      </div>
                    )}
                    {entityData.localEtiquette && (
                      <div>
                        <h4 className="text-sm font-bold text-accent flex items-center gap-2 mb-2"><Heart className="w-4 h-4" /> Local Etiquette</h4>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{entityData.localEtiquette}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tips & Specifics */}
                {(entityData.healthTips || entityData.emergencyNumbers || entityData.packingList || entityData.shopping) && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold font-serif text-slate-900 border-b pb-2">Tips & Specifics</h3>

                    {entityData.healthTips && (
                      <div>
                        <h4 className="text-sm font-bold text-accent flex items-center gap-2 mb-2"><ShieldCheck className="w-4 h-4" /> Health & Safety</h4>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{entityData.healthTips}</p>
                      </div>
                    )}
                    {entityData.emergencyNumbers && (
                      <div>
                        <h4 className="text-sm font-bold text-accent flex items-center gap-2 mb-2"><PhoneCall className="w-4 h-4" /> Emergency Numbers</h4>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{entityData.emergencyNumbers}</p>
                      </div>
                    )}
                    {entityData.shopping && (
                      <div>
                        <h4 className="text-sm font-bold text-accent flex items-center gap-2 mb-2"><ShoppingBag className="w-4 h-4" /> Shopping</h4>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{entityData.shopping}</p>
                      </div>
                    )}
                    {entityData.packingList && (
                      <div>
                        <h4 className="text-sm font-bold text-accent flex items-center gap-2 mb-2"><Briefcase className="w-4 h-4" /> Packing List</h4>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{entityData.packingList}</p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </section>
        )}

        <div className="bg-slate-50 pb-16 flex justify-center border-t border-slate-200 pt-8">
          <button
            onClick={() => setShowDetails(false)}
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-slate-600 border border-slate-300 rounded-full font-bold shadow-sm hover:bg-slate-100 transition-all duration-300"
          >
            Show Less
          </button>
        </div>
      </motion.div>

      {/* ─── FAQ SECTION — Always visible, below Knowledge Base ─── */}
      {(() => {
        const rawFaqs = entityData.faqs;
        const faqs: Array<{ question: string; answer: string }> = (() => {
          if (!rawFaqs) return [];
          if (Array.isArray(rawFaqs)) return rawFaqs.filter((f: any) => f && f.question);
          try { const p = JSON.parse(rawFaqs); return Array.isArray(p) ? p.filter((f: any) => f && f.question) : []; }
          catch { return []; }
        })();
        if (faqs.length === 0) return null;
        return <FaqSection faqs={faqs} entityName={entityData.name} />;
      })()}
    </div>
  );
}

// ─── Masonry Card — Text BELOW image, matches reference screenshot ────────────
function MasonryCard({ place, tall }: { place: any; tall: boolean }) {
  return (
    <Link href={`/${place.slug}-tour-packages`} className="group block">
      {/* Image container with fixed height */}
      <div className={cn(
        "relative w-full overflow-hidden rounded-xl border border-slate-100 shadow-sm transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-0.5",
        tall ? "h-[220px] md:h-[300px] lg:h-[340px]" : "h-[120px] md:h-[140px] lg:h-[160px]"
      )}>
        <Image
          src={validateImageUrl(place.imageUrl || place.thumbnailUrl)}
          alt={`${place.name} Tour Packages`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        {/* Subtle hover overlay */}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300" />
      </div>
      {/* Text below image — exact match to reference */}
      <p className="mt-2 text-sm font-semibold text-slate-800 group-hover:text-primary transition-colors px-0.5 leading-snug">
        {place.name} Tour Packages
      </p>
    </Link>
  );
}

// ─── Static fallback reviews ────────────────────────────────────────────────────
const FALLBACK_REVIEWS = [
  { id: "r1", name: "Shahid Abbas", location: "Delhi", rating: 5, content: "Good service provider for holiday and vacations. Really good service and value for money experience. Mrs. Neha helped us make our Egypt holiday very vibrant and memorable.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Shahid" },
  { id: "r2", name: "Greeshma Sabu", location: "Bangalore", rating: 5, content: "Really great service. I booked a trip to Malaysia for my parents. The package was very affordable including food and accommodation. They really enjoyed it with the whole group.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Greeshma" },
  { id: "r3", name: "Deepak Kumar", location: "Mumbai", rating: 5, content: "The visa process for my Thailand trip went smoothly. The staff was very professional and made each step easy by providing clear guidance. I highly recommend their services.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Deepak" },
  { id: "r4", name: "Anjali Sharma", location: "Jaipur", rating: 5, content: "Amazing Shimla trip organized by Sampooran Holidays. Every detail was taken care of, from the luxury car to the best hotel rooms with stunning mountain views.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali" },
  { id: "r5", name: "Rohit Verma", location: "Lucknow", rating: 5, content: "Booked a Leh Ladakh package and it was beyond our expectations. The team coordinated everything flawlessly even in remote locations. Truly a trip of a lifetime!", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rohit" },
  { id: "r6", name: "Priya Nair", location: "Kochi", rating: 5, content: "Kerala backwaters trip was magical. The houseboat stay, Ayurvedic treatments and cuisine were all world-class. Sampooran Holidays exceeded every expectation!", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya" },
];

// ─── Premium Animated FAQ Section ─────────────────────────────────────────────
function FaqSection({ faqs, entityName }: { faqs: Array<{ question: string; answer: string }>; entityName: string }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [reviews, setReviews] = useState<any[]>(FALLBACK_REVIEWS);
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", slidesToScroll: 1 },
    [Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true })]
  );

  useEffect(() => {
    fetch("/api/testimonials?limit=8&featured=true")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.testimonials?.length > 0) setReviews(data.testimonials);
      })
      .catch(() => {});
  }, []);

  const toggle = (idx: number) => setOpenIdx(prev => prev === idx ? null : idx);

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-white to-slate-50 border-t border-slate-100">
      <div className="container mx-auto px-4 max-w-4xl">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 rounded-full mb-5">
            <HelpCircle className="w-4 h-4 text-primary" />
            <span className="text-xs font-black uppercase tracking-[0.25em] text-primary">Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-primary mb-4">
            Got Questions About{" "}
            <span className="text-accent italic">{entityName}?</span>
          </h2>
          <p className="text-slate-500 text-base max-w-xl mx-auto">
            Everything you need to know before planning your trip.
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.06, ease: "easeOut" }}
              >
                <div
                  className={cn(
                    "rounded-2xl border overflow-hidden transition-all duration-300",
                    isOpen
                      ? "border-primary/30 bg-white shadow-lg shadow-primary/5"
                      : "border-slate-200 bg-white hover:border-primary/20 hover:shadow-md shadow-sm"
                  )}
                >
                  {/* Question Row */}
                  <button
                    onClick={() => toggle(idx)}
                    className="w-full flex items-start gap-4 px-6 py-5 text-left group"
                    aria-expanded={isOpen}
                  >
                    <span
                      className={cn(
                        "shrink-0 w-7 h-7 rounded-full text-xs font-black flex items-center justify-center mt-0.5 transition-all duration-300",
                        isOpen
                          ? "bg-primary text-white"
                          : "bg-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary"
                      )}
                    >
                      {idx + 1}
                    </span>
                    <span
                      className={cn(
                        "flex-1 font-bold text-base leading-snug transition-colors duration-200",
                        isOpen ? "text-primary" : "text-slate-800 group-hover:text-primary"
                      )}
                    >
                      {faq.question}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className={cn(
                        "shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 transition-colors duration-200",
                        isOpen ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-400"
                      )}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.32, ease: [0.04, 0.62, 0.23, 0.98] }}
                        style={{ overflow: "hidden" }}
                      >
                        <div className="px-6 pb-6 pl-[4.25rem]">
                          <div className="h-px bg-slate-100 mb-5" />
                          <p className="text-slate-600 text-sm leading-relaxed font-medium whitespace-pre-line">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Happy Clients Reviews Carousel ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 -mx-4 px-4 py-10 bg-slate-50/30 border-t border-slate-100 rounded-3xl overflow-hidden"
        >
          {/* Header — exact match to /customized-holidays */}
          <div className="flex items-center justify-between mb-12">
            <h3 className="text-xl md:text-2xl font-black text-primary uppercase tracking-tight flex items-center gap-3">
              What customers <span className="text-accent">says about us</span>
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => emblaApi?.scrollPrev()}
                className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 hover:bg-primary hover:text-white transition-all flex items-center justify-center"
                aria-label="Previous review"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => emblaApi?.scrollNext()}
                className="w-8 h-8 rounded-full bg-primary text-white hover:bg-accent hover:text-primary transition-all flex items-center justify-center shadow-lg shadow-primary/20"
                aria-label="Next review"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Embla Carousel — exact same structure as /customized-holidays */}
          <div className="relative">
            <div className="overflow-hidden px-4 -mx-4" ref={emblaRef}>
              <div className="flex gap-8">
                {reviews.map((rev, i) => (
                  <div key={rev.id || i} className="flex-[0_0_90%] sm:flex-[0_0_45%] lg:flex-[0_0_31%] min-w-0 py-4">
                    <div className="relative bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-50 h-full flex flex-col">

                      {/* Avatar badge — overlapping top-left corner */}
                      <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                        <img
                          src={rev.avatar || rev.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(rev.name)}`}
                          alt={rev.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Review text — NOT italic */}
                      <div className="flex-1 pt-4">
                        <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed line-clamp-4 relative">
                          &ldquo;{rev.content || rev.comment}&rdquo;
                          {(rev.content || rev.comment)?.length > 150 && (
                            <span className="text-accent font-black ml-1 cursor-pointer">Read more</span>
                          )}
                        </p>
                      </div>

                      {/* Stars + Name — bottom right */}
                      <div className="mt-8 flex flex-col items-end">
                        <div className="flex gap-0.5 mb-2">
                          {[...Array(5)].map((_, si) => (
                            <Star
                              key={si}
                              className={cn(
                                "w-3 h-3",
                                si < (rev.rating || 5) ? "fill-accent text-accent" : "fill-slate-200 text-slate-200"
                              )}
                            />
                          ))}
                        </div>
                        <h4 className="text-[11px] font-black text-primary uppercase tracking-wider">{rev.name}</h4>
                        {rev.location && (
                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{rev.location}</p>
                        )}
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
