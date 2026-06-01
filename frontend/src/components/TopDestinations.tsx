"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, MapPin, Star, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { customFetch } from "@workspace/api-client-react";

const PLACEHOLDER = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmMmY1Ii8+PC9zdmc+";

type Destination = {
  id: number;
  name: string;
  slug: string;
  imageUrl: string;
  packageCount: number;
  startingPrice?: number;
  places: string[];
  gallery: { name: string; image: string; slug: string; packageCount?: number; startingPrice?: number }[];
  type: string;
};

type TopDestinationsData = {
  international: Destination[];
  domestic: Destination[];
  all: Destination[];
};

export default function TopDestinations() {
  const [activeTab, setActiveTab] = useState<"all" | "international" | "domestic">("all");
  const [data, setData] = useState<TopDestinationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null);
  const [hoveredPlace, setHoveredPlace] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleSelectDest = (dest: Destination) => {
    setSelectedDest(dest);
    // Smooth auto-scroll to content on mobile devices
    if (window.innerWidth < 1024 && contentRef.current) {
      setTimeout(() => {
        contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const json = await customFetch<TopDestinationsData>("/api/ota/home/top-destinations");
        setData(json);
        if (json.all?.length > 0) {
          setSelectedDest(json.all[0]);
        }
      } catch (error) {
        console.error("Failed to fetch top destinations", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (data) {
      const filtered = data[activeTab] || [];
      if (filtered.length > 0) {
        setSelectedDest(filtered[0]);
      } else {
        setSelectedDest(null);
      }
    }
  }, [activeTab, data]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="h-96 w-full bg-slate-100 animate-pulse rounded-3xl" />
      </div>
    );
  }

  const destinations = data ? data[activeTab] : [];

  return (
    <div className="container mx-auto px-2 md:px-4 my-6">
      <section className="py-4 md:py-4 bg-white overflow-hidden rounded-[2rem] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="px-2 md:px-4">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4 md:gap-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-2 mb-1">
                <p className="text-accent font-bold text-xs uppercase tracking-[0.2em]">World Explorer</p>
              </div>
              <h2 className="text-2xl md:text-4xl font-serif font-bold text-primary">
                Top Popular <span className="text-accent italic font-light">Destinations</span>
              </h2>
            </motion.div>

            {/* Futuristic Tabs */}
            <div className="flex w-full md:w-auto overflow-x-auto no-scrollbar p-1.5 bg-slate-100 rounded-2xl border border-slate-200 backdrop-blur-sm">
              {(["all", "international", "domestic"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative shrink-0 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab ? "text-white" : "text-slate-500 hover:text-primary"
                    }`}
                >
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary rounded-xl shadow-lg shadow-primary/20"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">{tab === "all" ? "All" : tab}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left Column: Destination List */}
            <div className="lg:col-span-4 max-h-[300px] overflow-y-auto lg:max-h-[650px] lg:pr-2 custom-scrollbar grid grid-cols-2 lg:flex lg:flex-col gap-2 md:gap-3 pb-4 lg:pb-0">
              <AnimatePresence mode="popLayout">
                {destinations.map((dest, idx) => (
                  <motion.div
                    key={dest.slug}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleSelectDest(dest)}
                    onMouseEnter={() => {
                      if (window.innerWidth > 1024) setSelectedDest(dest);
                    }}
                    className={`group relative p-2 rounded-2xl border transition-all cursor-pointer w-full ${selectedDest?.slug === dest.slug
                      ? "bg-primary border-primary shadow-xl shadow-primary/10"
                      : "bg-white border-slate-100 hover:border-accent/30 hover:bg-slate-50/50"
                      }`}
                  >
                    <div className="flex items-center gap-1 md:gap-1">
                      <div className="relative h-12 w-12 md:h-14 md:w-14 rounded-xl overflow-hidden shrink-0 border-2 border-white/20 shadow-sm">
                        <Image src={dest.imageUrl || PLACEHOLDER} alt={dest.name || "Destination"} fill className="object-cover transition-transform duration-700 group-hover:scale-125" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h3 className={`font-bold truncate text-sm md:text-base ${selectedDest?.slug === dest.slug ? "text-white" : "text-primary group-hover:text-accent"}`}>
                            {dest.name}
                          </h3>
                          {selectedDest?.slug === dest.slug && (
                            <motion.div layoutId="play-icon">
                              <ArrowUpRight className="h-4 w-4 text-accent" />
                            </motion.div>
                          )}
                        </div>
                        <p className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider ${selectedDest?.slug === dest.slug ? "text-white/80" : "text-slate-400"}`}>
                          {dest.type} • {dest.packageCount} Packages • Starts ₹{dest.startingPrice?.toLocaleString('en-IN') || "9,999"}
                        </p>
                      </div>
                    </div>

                    {/* Subtle Glow Ring */}
                    {selectedDest?.slug === dest.slug && (
                      <motion.div
                        layoutId="active-ring"
                        className="absolute inset-0 rounded-2xl ring-2 ring-accent/50 ring-offset-2 ring-offset-white"
                        aria-hidden="true"
                      />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Right Column: Dynamic Content Grid */}
            <div className="lg:col-span-8 scroll-mt-24" ref={contentRef}>
              <AnimatePresence mode="wait">
                {selectedDest ? (
                  <motion.div
                    key={selectedDest.slug}
                    initial={{ opacity: 0, scale: 0.98, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 1.02, x: -20 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                  >
                    {/* Featured Card Header */}
                    <div className="relative h-[180px] md:h-[240px] rounded-[1.5rem] overflow-hidden mb-2 shadow-2xl group/header">
                      <Image
                        src={selectedDest.imageUrl || PLACEHOLDER}
                        alt={selectedDest.name || "Destination"}
                        fill
                        priority
                        className="object-cover transition-transform duration-1000 group-hover/header:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      <div className="absolute top-4 left-4 md:top-6 md:left-6 flex flex-wrap gap-1.5 md:gap-2 pr-4">
                        <span className="bg-accent/90 backdrop-blur-md text-accent-foreground text-[8px] md:text-[10px] font-black px-2 md:px-3 py-1 md:py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                          Featured Destination
                        </span>
                        <span className="bg-white/10 backdrop-blur-md text-white border border-white/20 text-[8px] md:text-[10px] font-black px-2 md:px-3 py-1 md:py-1.5 rounded-full uppercase tracking-widest">
                          {selectedDest.packageCount} Packages Available
                        </span>
                      </div>

                      <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-8 md:right-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-3 md:gap-0">
                        <div className="flex flex-col gap-1 w-full md:w-auto">
                          {selectedDest.startingPrice && (
                            <span className="text-white font-black text-[10px] md:text-xs uppercase tracking-widest bg-black/50 w-fit px-2 py-0.5 rounded drop-shadow-md">
                              Starts at ₹{selectedDest.startingPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                          <h2 className="text-3xl md:text-5xl font-serif font-bold text-white leading-tight md:leading-none drop-shadow-md break-words">
                            {selectedDest.name}
                          </h2>
                          <p className="text-white/80 text-xs md:text-sm max-w-md hidden md:block mt-1">
                            Explore the most enchanting corners of {selectedDest.name}. A journey curated for the modern traveler.
                          </p>
                        </div>
                        <Link href={
                          selectedDest.type === 'international'
                            ? `/packages?country=${selectedDest.slug}`
                            : `/${selectedDest.slug}-tour-packages`
                        }>
                          <button className="bg-white text-primary hover:bg-accent hover:text-accent-foreground px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-xl hover:-translate-y-1 active:scale-95 flex items-center gap-2 whitespace-nowrap">
                            Explore <ChevronRight className="h-4 w-4" />
                          </button>
                        </Link>
                      </div>
                    </div>

                    {/* Places/Attractions Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedDest.gallery?.length > 0 ? (
                        selectedDest.gallery.slice(0, 6).map((place, pIdx) => (
                          <Link
                            key={place.slug || place.name}
                            href={`/${place.slug || place.name.toLowerCase().replace(/\s+/g, '-')}-tour-packages`}
                            className="group/place relative h-40 md:h-48 rounded-2xl overflow-hidden block"
                          >
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: pIdx * 0.1 }}
                              onMouseEnter={() => setHoveredPlace(place.name)}
                              onMouseLeave={() => setHoveredPlace(null)}
                              className="w-full h-full"
                            >
                              <Image
                                src={place.image || PLACEHOLDER}
                                alt={place.name}
                                fill
                                className="object-cover transition-transform duration-700 group-hover/place:scale-110"
                              />
                              <div className={`absolute inset-0 transition-opacity duration-300 ${hoveredPlace === place.name ? "bg-black/50" : "bg-black/25"}`} />

                              <div className="absolute bottom-3 left-3 right-3 md:bottom-4 md:left-4 md:right-4">
                                <h4 className="text-white font-bold text-sm md:text-base mb-0.5 drop-shadow-md">{place.name}</h4>
                                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                  {(place.packageCount ?? 0) > 0 && (
                                    <span className="text-white/90 text-[9px] md:text-[10px] font-semibold tracking-wide drop-shadow-sm">{place.packageCount} Packages</span>
                                  )}
                                  {(place.startingPrice ?? 0) > 0 && (
                                    <>
                                      <span className="text-white/50 text-[8px]">•</span>
                                      <span className="text-accent text-[9px] md:text-[10px] font-black tracking-wide drop-shadow-sm">Starts ₹{place.startingPrice?.toLocaleString('en-IN')}</span>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover/place:opacity-100 transition-all translate-y-2 group-hover/place:translate-y-0 duration-300">
                                  <span className="text-[9px] md:text-[10px] text-white font-bold uppercase tracking-wider">Explore</span>
                                  <ArrowUpRight className="h-3 w-3 text-white" />
                                </div>
                              </div>
                            </motion.div>
                          </Link>
                        ))
                      ) : (
                        // Fallback if no sub-places found
                        <div className="col-span-3 py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                          <p className="text-slate-400 text-sm">Experience the magic of {selectedDest.name}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-300 italic">
                    Select a destination to explore
                  </div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
