"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Car, Search, ShieldCheck, MapPin, PhoneCall, LayoutGrid, List,
  Star, ArrowRight, ChevronRight, SlidersHorizontal, X, Zap, Users, Clock,
  Calculator, ArrowLeftRight, Check, Tag, Shield, Clock4, Compass
} from "lucide-react";
import { VehicleCard } from "@/components/VehicleCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE } from "@/context/AuthContext";
import { DEMO_FLEET, DEMO_ROUTES } from "@/lib/demo-fleet";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

// ─── Fuzzy Match Typo Tolerance Helpers ─────────────────────────────────────

function getBigrams(str: string): string[] {
  const s = str.toLowerCase().replace(/[^a-z0-9]/g, "");
  const bigrams: string[] = [];
  for (let i = 0; i < s.length - 1; i++) {
    bigrams.push(s.slice(i, i + 2));
  }
  return bigrams;
}

function stringSimilarity(str1: string, str2: string): number {
  const pairs1 = getBigrams(str1);
  const pairs2 = getBigrams(str2);
  if (pairs1.length === 0 && pairs2.length === 0) return 1;
  if (pairs1.length === 0 || pairs2.length === 0) return 0;
  const union = pairs1.length + pairs2.length;
  let hits = 0;
  for (const x of pairs1) {
    const idx = pairs2.indexOf(x);
    if (idx !== -1) {
      hits++;
      pairs2.splice(idx, 1);
    }
  }
  return (2.0 * hits) / union;
}

export function isFuzzyMatch(term: string | null | undefined, query: string): boolean {
  if (!term) return false;
  const t = term.toLowerCase().trim();
  const q = query.toLowerCase().trim();
  
  // Direct match
  if (t.includes(q) || q.includes(t)) return true;
  
  // Word level matches
  const qWords = q.split(/\s+/).filter(w => w.length > 2);
  if (qWords.length > 0) {
    const tWords = t.split(/\s+/).filter(w => w.length > 2);
    for (const qw of qWords) {
      if (tWords.some(tw => tw.includes(qw) || qw.includes(tw))) return true;
      if (tWords.some(tw => stringSimilarity(tw, qw) >= 0.5)) return true;
    }
  }
  
  // Whole string similarity
  if (q.length > 3 && t.length > 3) {
    if (stringSimilarity(t, q) >= 0.45) return true;
  }
  
  return false;
}

interface TransportClientProps {
  geoFilter?: { country: string; state: string; city: string };
  pageTitle?: string;
}

const CATEGORIES = ["Cab", "Tempo", "Coach"] as const;
type Category = typeof CATEGORIES[number] | null;

const SORT_OPTIONS = [
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "capacity", label: "Capacity: High to Low" },
];

const STATS = [
  { icon: Car, value: "200+", label: "Verified Vehicles" },
  { icon: ShieldCheck, value: "100%", label: "Safety Checked" },
  { icon: Star, value: "4.8★", label: "Average Rating" },
  { icon: Users, value: "15,000+", label: "Happy Travellers" },
];

export default function TransportClient({ geoFilter, pageTitle }: TransportClientProps) {
  const searchParams = useSearchParams();
  const initType = searchParams?.get("category") || searchParams?.get("type") || null;
  const initQuery = searchParams?.get("q") || "";

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>(DEMO_ROUTES);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<Category>(() => {
    if (initType === "Cab" || initType === "Tempo" || initType === "Coach") return initType;
    return null;
  });
  const [searchQuery, setSearchQuery] = useState(initQuery);
  const [sortBy, setSortBy] = useState("rating");

  // Sync state with URL search parameters
  useEffect(() => {
    const qParam = searchParams?.get("q") || "";
    const typeParam = searchParams?.get("category") || searchParams?.get("type") || null;
    if (qParam !== searchQuery) setSearchQuery(qParam);
    if (typeParam && (typeParam === "Cab" || typeParam === "Tempo" || typeParam === "Coach")) {
      setType(typeParam);
    } else if (!typeParam) {
      setType(null);
    }
  }, [searchParams]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  // New Sidebar filters
  const [minSeats, setMinSeats] = useState(0);
  const [acFilter, setAcFilter] = useState("ALL");
  const [maxPrice, setMaxPrice] = useState(25000);

  // Route Price Calculator state
  const [calcFrom, setCalcFrom] = useState("");
  const [calcTo, setCalcTo] = useState("");
  const [calcVehicleType, setCalcVehicleType] = useState("ALL");
  const [calcResults, setCalcResults] = useState<any[]>([]);
  const [calcSearched, setCalcSearched] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);

  useEffect(() => {
    fetchTransport();
    const onScroll = () => setHeaderScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const searchRoutePrices = async () => {
    if (!calcFrom.trim() || !calcTo.trim()) return;
    setCalcLoading(true);
    setCalcSearched(true);
    try {
      const params = new URLSearchParams({
        from: calcFrom.trim(),
        to: calcTo.trim(),
        ...(calcVehicleType !== "ALL" ? { vehicleType: calcVehicleType } : {})
      });
      const res = await fetch(`${API_BASE}/ota/route-prices?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCalcResults(Array.isArray(data) ? data : []);
      } else {
        setCalcResults([]);
      }
    } catch {
      setCalcResults([]);
    } finally {
      setCalcLoading(false);
    }
  };

  const swapFromTo = () => {
    setCalcFrom(calcTo);
    setCalcTo(calcFrom);
    setCalcResults([]);
    setCalcSearched(false);
  };

  const fetchTransport = async () => {
    try {
      const url = geoFilter
        ? `${API_BASE}/ota/transport?country=${geoFilter.country}&state=${geoFilter.state}&city=${geoFilter.city}`
        : `${API_BASE}/ota/transport`;
      const res = await fetch(url);
      const data = await res.json();
      setVehicles(Array.isArray(data) && data.length > 0 ? data : DEMO_FLEET);

      try {
        const routesRes = await fetch(`${API_BASE}/ota/routes`);
        if (routesRes.ok) {
          const routesData = await routesRes.json();
          if (Array.isArray(routesData) && routesData.length > 0) {
            setRoutes(routesData);
          }
        }
      } catch { /* keep DEMO_ROUTES */ }
    } catch {
      setVehicles(DEMO_FLEET);
    } finally {
      setLoading(false);
    }
  };

  const resetAllFilters = () => {
    setType(null);
    setSearchQuery("");
    setMinSeats(0);
    setAcFilter("ALL");
    setMaxPrice(25000);
  };

  const hasActiveFilters = type !== null || searchQuery !== "" || minSeats > 0 || acFilter !== "ALL" || maxPrice < 25000;

  // Filter + sort
  const filtered = useMemo(() => {
    let list = [...vehicles];
    if (type) list = list.filter(v => v.type === type);
    if (searchQuery.trim()) {
      list = list.filter(v =>
        isFuzzyMatch(v.name, searchQuery) ||
        isFuzzyMatch(v.make, searchQuery) ||
        isFuzzyMatch(v.model, searchQuery) ||
        isFuzzyMatch(v.type, searchQuery) ||
        isFuzzyMatch(v.cityName, searchQuery)
      );
    }
    // Sidebar filters
    if (minSeats > 0) {
      list = list.filter(v => (v.capacity || v.seating_capacity || 0) >= minSeats);
    }
    if (acFilter === "AC") {
      list = list.filter(v => v.isAc !== false);
    } else if (acFilter === "NON_AC") {
      list = list.filter(v => v.isAc === false);
    }
    list = list.filter(v => (v.pricePerDay || v.base_price_per_day || 0) <= maxPrice);

    switch (sortBy) {
      case "price_asc": return list.sort((a, b) => (a.pricePerDay || a.base_price_per_day || 0) - (b.pricePerDay || b.base_price_per_day || 0));
      case "price_desc": return list.sort((a, b) => (b.pricePerDay || b.base_price_per_day || 0) - (a.pricePerDay || a.base_price_per_day || 0));
      case "capacity": return list.sort((a, b) => (b.capacity || b.seating_capacity || 0) - (a.capacity || a.seating_capacity || 0));
      case "rating": return list.sort((a, b) => (b.rating || b.avgRating || 4) - (a.rating || a.avgRating || 4));
      default: return list;
    }
  }, [vehicles, type, searchQuery, sortBy, minSeats, acFilter, maxPrice]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    vehicles.forEach(v => { counts[v.type] = (counts[v.type] || 0) + 1; });
    return counts;
  }, [vehicles]);

  const FilterContent = (
    <div className="space-y-5">
      {/* Vehicle Type */}
      <div>
        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Vehicle Class</h3>
        <div className="space-y-2">
          {["Cab", "Tempo", "Coach"].map(cat => (
            <label key={cat} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 hover:text-primary transition-colors">
              <input
                type="checkbox"
                checked={type === cat}
                onChange={() => setType(type === cat ? null : cat as Category)}
                className="rounded border-slate-300 text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
              />
              {cat}s
            </label>
          ))}
        </div>
      </div>

      {/* AC / Climate */}
      <div>
        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Air Conditioning</h3>
        <select
          value={acFilter}
          onChange={e => setAcFilter(e.target.value)}
          className="w-full h-9 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold px-2.5 focus:outline-none focus:border-primary cursor-pointer"
        >
          <option value="ALL">AC & Non-AC</option>
          <option value="AC">AC Only</option>
          <option value="NON_AC">Non-AC Only</option>
        </select>
      </div>

      {/* Seating Capacity */}
      <div>
        <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
          <span>Min Seating Capacity</span>
          <span className="text-primary font-bold">{minSeats > 0 ? `${minSeats} Seats` : "Any"}</span>
        </div>
        <input
          type="range"
          min="0"
          max="20"
          step="1"
          value={minSeats}
          onChange={e => setMinSeats(Number(e.target.value))}
          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-[8px] text-slate-400 font-semibold px-0.5 mt-1">
          <span>Any</span>
          <span>10 seats</span>
          <span>20+</span>
        </div>
      </div>

      {/* Daily Price */}
      <div>
        <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
          <span>Max Daily Budget</span>
          <span className="text-primary font-bold">₹{maxPrice.toLocaleString("en-IN")}</span>
        </div>
        <input
          type="range"
          min="3000"
          max="25000"
          step="1000"
          value={maxPrice}
          onChange={e => setMaxPrice(Number(e.target.value))}
          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-[8px] text-slate-400 font-semibold px-0.5 mt-1">
          <span>₹3,000</span>
          <span>₹14K</span>
          <span>₹25K+</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen">

      {/* ── Rich Hero Section ── */}
      <div className="bg-slate-950 text-white relative overflow-hidden">
        {/* Animated glowing mesh gradients */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary rounded-full blur-[160px] animate-pulse duration-[6000ms]" />
          <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-amber-500 rounded-full blur-[140px] animate-pulse duration-[8000ms]" />
        </div>

        <div className="container mx-auto px-4 pt-16 pb-16 md:pt-24 md:pb-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left side text fold */}
            <div className="lg:col-span-7 space-y-5 md:space-y-6">
              {geoFilter && (
                <nav className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">
                  <Link href="/transport" className="hover:text-primary transition-colors whitespace-nowrap">Transport</Link>
                  <ChevronRight className="w-3 h-3 text-white/20" />
                  <span className="text-white/70">{geoFilter.city.replace(/-/g, " ")}</span>
                </nav>
              )}

              <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-3 py-1">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span className="text-primary font-black text-[10px] uppercase tracking-widest">Premium Transport Network</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] font-sans">
                {pageTitle ? (
                  <>
                    Rent Premium <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-500">{pageTitle}</span>
                  </>
                ) : (
                  <>
                    Explore the Himalayas <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-500">with Absolute Comfort.</span>
                  </>
                )}
              </h1>

              <p className="text-white/60 text-sm md:text-base font-medium max-w-xl leading-relaxed">
                From adventure-ready 4×4 SUVs to luxury tempo travellers and Volvo coaches — professional drivers, verified fleet.
              </p>

              {/* Trust pills */}
              <div className="flex flex-wrap gap-2 pt-2">
                {STATS.map((stat, i) => (
                  <div key={i} className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl backdrop-blur-md">
                    <stat.icon className="text-amber-400 h-4 w-4 shrink-0" />
                    <span className="text-[10px] md:text-xs font-bold font-sans">
                      <span className="text-white">{stat.value}</span>
                      <span className="text-white/40 ml-1 font-medium">{stat.label}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side Instant Calculator */}
            <div className="lg:col-span-5">
              <div className="bg-white/10 border border-white/20 backdrop-blur-xl p-5 md:p-6 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="space-y-1 mb-4">
                  <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-400 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider">
                    <Calculator className="w-3 h-3" /> Fare Estimate
                  </span>
                  <h3 className="text-base font-bold text-white tracking-tight">Instant Route Calculator</h3>
                  <p className="text-[10px] text-white/55">Get accurate route pricing for all vehicle fleets instantly.</p>
                </div>

                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                    {/* From */}
                    <div className="relative">
                      <label className="block text-[9px] text-white/40 font-bold uppercase tracking-widest mb-1">From</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-400" />
                        <input
                          list="from-city-list"
                          value={calcFrom}
                          onChange={e => setCalcFrom(e.target.value)}
                          placeholder="e.g. Shimla"
                          className="w-full pl-9 pr-3 h-11 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-white/30 text-xs font-semibold focus:outline-none focus:border-amber-500 transition-colors"
                        />
                        <datalist id="from-city-list">
                          {["Shimla","Manali","Dharamsala","Chandigarh","Delhi","Kufri","Solang Valley","Rohtang Pass","Leh","Kaza (Spiti)","Naggar","Narkanda","Chail"].map(c => <option key={c} value={c}>{c}</option>)}
                        </datalist>
                      </div>
                    </div>

                    {/* Swap button inside inputs on desktop/mobile */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 mt-2.5 hidden sm:block">
                      <button onClick={swapFromTo} className="h-7 w-7 rounded-full bg-slate-800 border border-white/15 text-white/60 hover:text-amber-400 hover:border-amber-400 transition-colors flex items-center justify-center shadow-lg active:scale-90">
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* To */}
                    <div className="relative">
                      <label className="block text-[9px] text-white/40 font-bold uppercase tracking-widest mb-1">To</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-400" />
                        <input
                          list="to-city-list"
                          value={calcTo}
                          onChange={e => setCalcTo(e.target.value)}
                          placeholder="e.g. Manali"
                          className="w-full pl-9 pr-3 h-11 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-white/30 text-xs font-semibold focus:outline-none focus:border-amber-500 transition-colors"
                        />
                        <datalist id="to-city-list">
                          {["Manali","Shimla","Dharamsala","Leh","Kaza (Spiti)","Rohtang Pass","Solang Valley","Chandigarh","Delhi","Kufri","Naggar","Narkanda","Chail"].map(c => <option key={c} value={c}>{c}</option>)}
                        </datalist>
                      </div>
                    </div>
                  </div>

                  {/* Swap button for mobile */}
                  <div className="flex sm:hidden justify-center -my-2.5">
                    <button onClick={swapFromTo} className="text-white/40 hover:text-amber-400 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider transition-colors">
                      <ArrowLeftRight className="h-3 w-3" /> Swap Locations
                    </button>
                  </div>

                  {/* Select fleet */}
                  <div>
                    <label className="block text-[9px] text-white/40 font-bold uppercase tracking-widest mb-1">Fleet Category</label>
                    <select
                      value={calcVehicleType}
                      onChange={e => setCalcVehicleType(e.target.value)}
                      className="w-full h-11 rounded-xl bg-slate-900/60 border border-white/10 text-white text-xs font-semibold px-3 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="CAB">Cab / Sedan / SUV</option>
                      <option value="TEMPO_TRAVELLER">Tempo Traveller</option>
                      <option value="BUS">Bus / Coach</option>
                      <option value="LUXURY">Luxury Fleet</option>
                    </select>
                  </div>

                  {/* Submit CTA */}
                  <button
                    onClick={searchRoutePrices}
                    disabled={!calcFrom.trim() || !calcTo.trim() || calcLoading}
                    className="w-full h-11 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    {calcLoading ? <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" /> : <Search className="h-4 w-4" />}
                    Calculate Fare
                  </button>
                </div>

                {/* Inline Results Container */}
                {calcSearched && (
                  <div className="mt-4 pt-4 border-t border-white/10 max-h-40 overflow-y-auto space-y-2 no-scrollbar">
                    {calcLoading ? (
                      <div className="space-y-1.5 animate-pulse">
                        <div className="h-8 bg-white/5 rounded-lg w-full" />
                        <div className="h-8 bg-white/5 rounded-lg w-full" />
                      </div>
                    ) : calcResults.length === 0 ? (
                      <p className="text-[10px] text-center text-white/40 py-2">No fixed routes found. Contact us for custom rates.</p>
                    ) : (
                      calcResults.map((r, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-900/50 border border-white/5 rounded-lg text-[11px] group">
                          <div>
                            <p className="font-bold text-white">{r.vehicleName || r.name}</p>
                            <p className="text-[9px] text-white/40 uppercase font-black">{r.vehicleType || r.type} · {r.seatingCapacity || r.capacity} seats</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-white/30 block uppercase font-bold">One-way</span>
                            <span className="font-black text-amber-400">₹{Number(r.price).toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Filters Toolbar ── */}
      <div className={cn("bg-white border-b sticky z-30 shadow-sm transition-all duration-300", headerScrolled ? "top-[55px]" : "top-[61px]")}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-2 md:gap-6 py-1.5 md:h-11">

            {/* Category tabs */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
              <button
                onClick={() => setType(null)}
                className={`whitespace-nowrap rounded-xl font-bold text-[9px] uppercase tracking-wider px-3.5 py-1.5 transition-all ${!type ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
              >
                All ({vehicles.length})
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setType(type === cat ? null : cat)}
                  className={`whitespace-nowrap rounded-xl font-bold text-[9px] uppercase tracking-wider px-3.5 py-1.5 transition-all ${type === cat ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  {cat}s {typeCounts[cat] ? `(${typeCounts[cat]})` : ""}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              {/* Desktop search */}
              <div className="hidden md:flex flex-1 min-w-[180px] max-w-xs relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search model, make..."
                  className="rounded-xl pl-8 h-8 bg-muted/40 border-none text-[11px] font-semibold placeholder:text-muted-foreground/50 focus-visible:ring-1"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="hidden sm:block text-[9px] font-black uppercase text-muted-foreground bg-muted/30 border border-muted rounded-xl px-3 py-1.5 cursor-pointer focus:outline-none hover:bg-muted transition-colors"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              {/* Filter toggle (mobile) */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-1 bg-muted/40 rounded-xl px-2.5 py-1.5 text-[9px] font-black uppercase text-muted-foreground"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filter
              </button>

              {/* View toggle */}
              <div className="hidden md:flex items-center gap-0.5 border border-muted rounded-xl p-0.5">
                <button onClick={() => setViewMode("grid")} className={`p-1 rounded ${viewMode === "grid" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"} transition-all`}>
                  <LayoutGrid className="h-3 w-3" />
                </button>
                <button onClick={() => setViewMode("list")} className={`p-1 rounded ${viewMode === "list" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"} transition-all`}>
                  <List className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile filter panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-muted lg:hidden"
              >
                <div className="py-4 space-y-4 px-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search by vehicle name or make..."
                      className="pl-9 h-10 rounded-xl bg-muted/30 border-muted text-xs font-semibold"
                    />
                  </div>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="w-full text-xs font-semibold bg-muted/30 border border-muted rounded-xl px-3 py-2.5 focus:outline-none"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {FilterContent}
                  {hasActiveFilters && (
                    <button
                      onClick={resetAllFilters}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black uppercase tracking-wider h-10 rounded-xl transition-colors"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Fleet Grid / Layout with Desktop Sidebar ── */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex gap-6 items-start relative">

          {/* ─── DESKTOP SIDEBAR ────────────────────────────────────── */}
          <aside className="hidden lg:block w-[250px] shrink-0 sticky top-28 self-start">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-primary" />
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">Filters</h2>
                </div>
                {hasActiveFilters && (
                  <button onClick={resetAllFilters} className="text-[10px] font-black uppercase text-primary hover:underline">
                    Clear All
                  </button>
                )}
              </div>
              <div className="p-4">
                {FilterContent}
              </div>
            </div>

            {/* Trust box on sidebar */}
            <div className="bg-gradient-to-br from-primary to-[#0A1D3B] text-white p-4 rounded-2xl shadow-sm mt-4">
              <span className="text-[8px] font-black uppercase tracking-widest text-[#F5A623] block mb-2">Sampooran Transfer Trust</span>
              <div className="space-y-3">
                {[
                  { title: "Safe & Sanitized", desc: "Every fleet vehicle sanitized prior to boarding." },
                  { title: "No Hidden Costs", desc: "Toll tax, fuel, state permit included in estimates." },
                  { title: "Expert Drivers", desc: "Himalayan experts certified in mountain paths." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <ShieldCheck className="w-4 h-4 text-[#F5A623] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[10px] font-bold text-white">{item.title}</h4>
                      <p className="text-[9px] text-white/50 leading-tight mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* ─── RESULTS AREA ───────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="h-64 bg-muted rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 md:p-16 text-center max-w-2xl mx-auto shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-accent/10 to-transparent rounded-br-full" />
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-5 border border-accent/20">
                  <Compass className="w-8 h-8 text-accent animate-[spin_10s_linear_infinite]" />
                </div>
                <h3 className="text-xl md:text-2xl font-black text-primary tracking-tight mb-3">Unexplored Horizons Await! 🌍</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 max-w-md mx-auto">
                  Our travel curators are currently mapping out private transfers and coach routes in {searchQuery ? <strong className="text-primary">"{searchQuery}"</strong> : "this destination"}. We haven't launched this route yet, but we are boarding soon! In the meantime, let's customize a bespoke experience for you.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/customized-holidays"
                    className="w-full sm:w-auto bg-[#F5A623] hover:bg-yellow-500 text-primary font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center"
                  >
                    Request Custom Itinerary
                  </Link>
                  <button
                    onClick={resetAllFilters}
                    className="w-full sm:w-auto border border-slate-200 hover:border-slate-300 bg-white text-slate-600 font-bold text-xs px-6 py-3.5 rounded-xl transition-all active:scale-95"
                  >
                    Explore Popular Escapes
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider mb-4">
                  Showing {filtered.length} vehicle{filtered.length !== 1 ? "s" : ""}
                  {type ? ` in ${type}s` : ""}
                  {searchQuery ? ` matching "${searchQuery}"` : ""}
                </p>
                <div className={`grid gap-4 ${
                  viewMode === "grid"
                    ? "grid-cols-2 md:grid-cols-2 xl:grid-cols-3"
                    : "grid-cols-1 md:grid-cols-2"
                }`}>
                  {filtered.map(vehicle => <VehicleCard key={vehicle.id || vehicle.slug} vehicle={vehicle} />)}
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {/* ── Popular Routes Section ── */}
      {routes.length > 0 && (
        <section id="routes" className="container mx-auto px-4 pb-10 md:pb-14">
          <div className="bg-slate-100 rounded-3xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-3">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider">
                  <MapPin className="w-3 h-3" /> Himalayan Circuits
                </span>
                <h2 className="text-2xl font-black tracking-tight">
                  Popular Road <span className="text-primary italic">Routes.</span>
                </h2>
              </div>
              <p className="text-muted-foreground text-xs font-semibold max-w-xs">Fair pricing based on distance and terrain. No hidden charges.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {routes.map(route => (
                <div key={route.id} className="bg-white border border-black/5 rounded-2xl p-4 flex items-center justify-between hover:shadow-lg transition-all group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/5 rounded-xl flex items-center justify-center group-hover:bg-primary transition-colors shrink-0">
                      <MapPin className="h-4 w-4 text-primary group-hover:text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-xs md:text-sm">{route.from} <span className="text-muted-foreground font-normal text-xs">to</span> {route.to}</p>
                        {route.isPopular && <span className="bg-orange-100 text-orange-600 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full">Hot</span>}
                      </div>
                      <p className="text-[9px] text-muted-foreground font-black uppercase tracking-wider mt-0.5 flex items-center gap-1.5">
                        <span>{route.distance} KM</span>
                        <span className="text-muted-foreground/40">•</span>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{route.estimatedTime}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[8px] text-muted-foreground font-black tracking-wider uppercase">From</p>
                    <p className="text-sm md:text-base font-black text-primary">₹{route.startingPrice?.toLocaleString("en-IN")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA / Support Section ── */}
      <section className="container mx-auto px-4 pb-12 md:pb-16">
        <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-2 text-center md:text-left relative z-10">
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight">
              Need a customized transport plan?
            </h3>
            <p className="text-white/50 text-xs font-semibold max-w-md leading-relaxed">
              Our transport experts are online 24/7. Best rates for bulk bookings, custom Himalayan circuits & corporate logistics.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 relative z-10 w-full md:w-auto">
            <a href="tel:+919805001916" className="flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-primary text-white font-bold text-xs uppercase tracking-widest hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20">
              <PhoneCall className="h-4 w-4" /> Call Transport Desk
            </a>
            <a href="https://wa.me/919805001916" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 h-11 px-6 rounded-xl border border-white/20 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all">
              WhatsApp Query
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
