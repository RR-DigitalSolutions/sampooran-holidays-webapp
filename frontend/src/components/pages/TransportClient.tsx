"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Car, Search, ShieldCheck, MapPin, PhoneCall, LayoutGrid, List,
  Star, ArrowRight, ChevronRight, SlidersHorizontal, X, Zap, Users, Clock,
  Calculator, ArrowLeftRight, Tag, CheckCircle2
} from "lucide-react";
import { VehicleCard } from "@/components/VehicleCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE } from "@/context/AuthContext";
import { DEMO_FLEET, DEMO_ROUTES } from "@/lib/demo-fleet";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

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
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>(DEMO_ROUTES);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<Category>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  // Route Price Calculator state
  const [calcFrom, setCalcFrom] = useState("");
  const [calcTo, setCalcTo] = useState("");
  const [calcVehicleType, setCalcVehicleType] = useState("ALL");
  const [calcResults, setCalcResults] = useState<any[]>([]);
  const [calcSearched, setCalcSearched] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);

  useEffect(() => {
    fetchTransport();
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
      // Use demo fleet if backend is empty or errored
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

  // Filter + sort
  const filtered = useMemo(() => {
    let list = [...vehicles];
    if (type) list = list.filter(v => v.type === type);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(v =>
        v.name?.toLowerCase().includes(q) ||
        v.make?.toLowerCase().includes(q) ||
        v.model?.toLowerCase().includes(q) ||
        v.type?.toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case "price_asc": return list.sort((a, b) => (a.pricePerDay || a.base_price_per_day || 0) - (b.pricePerDay || b.base_price_per_day || 0));
      case "price_desc": return list.sort((a, b) => (b.pricePerDay || b.base_price_per_day || 0) - (a.pricePerDay || a.base_price_per_day || 0));
      case "capacity": return list.sort((a, b) => (b.capacity || b.seating_capacity || 0) - (a.capacity || a.seating_capacity || 0));
      case "rating": return list.sort((a, b) => (b.rating || b.avgRating || 4) - (a.rating || a.avgRating || 4));
      default: return list;
    }
  }, [vehicles, type, searchQuery, sortBy]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    vehicles.forEach(v => { counts[v.type] = (counts[v.type] || 0) + 1; });
    return counts;
  }, [vehicles]);

  return (
    <div className="bg-background min-h-screen">

      {/* ── Hero / Header ── */}
      <div className="bg-[#0A0A0B] text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="container mx-auto px-4 pt-14 pb-12 md:pt-20 md:pb-16 relative z-10">
          {/* Breadcrumb */}
          {geoFilter && (
            <nav className="flex items-center gap-1.5 text-[10px] text-white/40 uppercase tracking-widest font-bold mb-6">
              <Link href="/transport" className="hover:text-white/70 transition-colors">Transport</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white/70">{geoFilter.city.replace(/-/g, " ")}</span>
            </nav>
          )}

          <div className="max-w-3xl space-y-4 md:space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-3 py-1">
              <Zap className="w-3 h-3 text-primary" />
              <span className="text-primary font-bold text-[10px] uppercase tracking-widest">Premium Transport Network</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black tracking-tighter leading-tight">
              {pageTitle || (
                <>
                  Explore the Himalayas with{" "}
                  <span className="text-primary italic">Absolute Comfort.</span>
                </>
              )}
            </h1>

            <p className="text-white/50 text-sm md:text-base font-medium max-w-xl leading-relaxed">
              From adventure-ready 4×4 SUVs to luxury tempo travellers and Volvo coaches — professional drivers, verified fleet.
            </p>

            {/* Trust pills */}
            <div className="flex flex-wrap gap-2 md:gap-3 pt-2">
              {STATS.map((stat, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 md:px-4 md:py-2.5 rounded-xl backdrop-blur-sm">
                  <stat.icon className="text-primary h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                  <span className="text-[10px] md:text-xs font-bold">
                    <span className="text-white">{stat.value}</span>
                    <span className="text-white/40 ml-1">{stat.label}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Filter Bar ── */}
      <div className="bg-white border-b sticky top-14 md:top-[74px] z-30 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-2 md:gap-6 py-3 md:h-20">

            {/* Category tabs — scrollable on mobile */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
              <button
                onClick={() => setType(null)}
                className={`whitespace-nowrap rounded-lg font-bold text-[10px] md:text-[11px] uppercase tracking-widest px-3 md:px-5 py-2 transition-all ${!type ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
              >
                All ({vehicles.length})
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setType(type === cat ? null : cat)}
                  className={`whitespace-nowrap rounded-lg font-bold text-[10px] md:text-[11px] uppercase tracking-widest px-3 md:px-5 py-2 transition-all ${type === cat ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  {cat}s {typeCounts[cat] ? `(${typeCounts[cat]})` : ""}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {/* Desktop search */}
              <div className="hidden md:flex flex-1 min-w-[200px] max-w-xs relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search model, make..."
                  className="rounded-lg pl-9 h-9 bg-muted/40 border-none text-sm font-medium placeholder:text-muted-foreground/50 focus-visible:ring-1"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="hidden sm:block text-[11px] font-bold uppercase text-muted-foreground bg-muted/30 border border-muted rounded-lg px-3 py-2 cursor-pointer focus:outline-none hover:bg-muted transition-colors"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              {/* Filter toggle (mobile) */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden flex items-center gap-1.5 bg-muted/40 rounded-lg px-3 py-2 text-[11px] font-bold uppercase text-muted-foreground"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filter
              </button>

              {/* View toggle */}
              <div className="hidden md:flex items-center gap-1 border border-muted rounded-lg p-1">
                <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded ${viewMode === "grid" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"} transition-all`}>
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setViewMode("list")} className={`p-1.5 rounded ${viewMode === "list" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"} transition-all`}>
                  <List className="h-3.5 w-3.5" />
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
                className="overflow-hidden border-t border-muted"
              >
                <div className="py-3 flex flex-col gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search by vehicle name or make..."
                      className="pl-9 h-10 rounded-lg bg-muted/30 border-muted text-sm font-medium"
                    />
                  </div>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="w-full text-sm font-medium bg-muted/30 border border-muted rounded-lg px-3 py-2.5 focus:outline-none"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Fleet Grid ── */}
      <div className="container mx-auto px-4 py-8 md:py-14">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="h-64 md:h-80 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 md:py-40 bg-muted/10 rounded-3xl border border-dashed border-primary/10">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Car className="h-8 w-8 md:h-10 md:w-10 text-primary opacity-20" />
            </div>
            <h3 className="text-lg md:text-xl font-serif font-bold mb-2 tracking-tight">No vehicles match your search</h3>
            <p className="text-muted-foreground text-sm font-medium mb-6">Try adjusting your filters or search terms.</p>
            <Button onClick={() => { setType(null); setSearchQuery(""); }} className="rounded-xl font-bold uppercase tracking-wider text-xs px-6">
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-4 md:mb-6">
              Showing {filtered.length} vehicle{filtered.length !== 1 ? "s" : ""}
              {type ? ` in ${type}s` : ""}
              {searchQuery ? ` matching "${searchQuery}"` : ""}
            </p>
            <div className={`grid gap-3 md:gap-6 ${
              viewMode === "grid"
                ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                : "grid-cols-1 sm:grid-cols-2"
            }`}>
              {filtered.map(vehicle => <VehicleCard key={vehicle.id || vehicle.slug} vehicle={vehicle} />)}
            </div>
          </>
        )}
      </div>

      {/* ── Route Price Calculator ── */}
      <section className="container mx-auto px-4 pb-8 md:pb-12">
        <div className="bg-gradient-to-br from-[#0e1b3d] to-[#122456] rounded-2xl md:rounded-3xl p-6 md:p-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 bg-white/10 text-white/80 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                  <Calculator className="w-3 h-3" /> Instant Fare Estimate
                </span>
                <h2 className="text-2xl md:text-3xl font-serif font-black text-white tracking-tight">
                  Check Route <span className="text-primary italic">Prices.</span>
                </h2>
                <p className="text-white/50 text-sm font-medium">Enter any two locations to see available vehicles with exact pricing.</p>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              {/* From */}
              <div className="md:col-span-1 relative">
                <label className="block text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1.5">From</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/70" />
                  <input
                    list="from-city-list"
                    value={calcFrom}
                    onChange={e => setCalcFrom(e.target.value)}
                    placeholder="e.g. Shimla"
                    className="w-full pl-10 pr-4 h-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 text-sm font-medium focus:outline-none focus:border-primary focus:bg-white/15 transition-all"
                  />
                  <datalist id="from-city-list">
                    {["Shimla","Manali","Dharamsala","Chandigarh","Delhi","Kufri","Solang Valley","Rohtang Pass","Leh","Kaza (Spiti)","Naggar","Narkanda","Chail"].map(c => <option key={c} value={c}>{c}</option>)}
                  </datalist>
                </div>
              </div>

              {/* Swap button */}
              <div className="hidden md:flex items-end justify-center pb-0.5">
                <button
                  onClick={swapFromTo}
                  className="h-12 w-12 rounded-xl bg-white/10 border border-white/20 hover:bg-primary/30 hover:border-primary transition-all flex items-center justify-center text-white/60 hover:text-primary"
                  title="Swap"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </button>
              </div>

              {/* To */}
              <div className="md:col-span-1 relative">
                <label className="block text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1.5">To</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                  <input
                    list="to-city-list"
                    value={calcTo}
                    onChange={e => setCalcTo(e.target.value)}
                    placeholder="e.g. Manali"
                    className="w-full pl-10 pr-4 h-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 text-sm font-medium focus:outline-none focus:border-primary focus:bg-white/15 transition-all"
                  />
                  <datalist id="to-city-list">
                    {["Manali","Shimla","Dharamsala","Leh","Kaza (Spiti)","Rohtang Pass","Solang Valley","Chandigarh","Delhi","Kufri","Naggar","Narkanda","Chail"].map(c => <option key={c} value={c}>{c}</option>)}
                  </datalist>
                </div>
              </div>

              {/* Vehicle type filter */}
              <div>
                <label className="block text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1.5">Vehicle Type</label>
                <select
                  value={calcVehicleType}
                  onChange={e => setCalcVehicleType(e.target.value)}
                  className="w-full h-12 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-medium px-4 focus:outline-none focus:border-primary transition-all"
                >
                  <option value="ALL" className="bg-[#122456]">All Vehicles</option>
                  <option value="CAB" className="bg-[#122456]">Cab / Sedan / SUV</option>
                  <option value="TEMPO_TRAVELLER" className="bg-[#122456]">Tempo Traveller</option>
                  <option value="BUS" className="bg-[#122456]">Bus / Coach</option>
                  <option value="LUXURY" className="bg-[#122456]">Luxury</option>
                </select>
              </div>

              {/* Search button — full width on mobile */}
              <button
                onClick={searchRoutePrices}
                disabled={!calcFrom.trim() || !calcTo.trim() || calcLoading}
                className="md:col-start-4 md:col-span-1 h-12 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/30 active:scale-95"
              >
                {calcLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="h-4 w-4" />}
                Get Prices
              </button>
            </div>

            {/* Swap on mobile */}
            <div className="flex md:hidden justify-center -mt-1 mb-3">
              <button onClick={swapFromTo} className="text-white/40 hover:text-primary flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors">
                <ArrowLeftRight className="h-3 w-3" /> Swap Locations
              </button>
            </div>

            {/* Results */}
            {calcSearched && (
              <div className="mt-4 border-t border-white/10 pt-5">
                {calcLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[1,2,3].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />)}
                  </div>
                ) : calcResults.length === 0 ? (
                  <div className="text-center py-8 text-white/30">
                    <Car className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No fixed routes found for this combination.</p>
                    <p className="text-xs mt-1">Try different cities or contact us for a custom quote.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-3">
                      {calcResults.length} option{calcResults.length !== 1 ? "s" : ""} found for {calcFrom} → {calcTo}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {calcResults.map((r: any, idx: number) => (
                        <div key={idx} className="bg-white/8 border border-white/15 hover:border-primary/40 rounded-xl p-4 transition-all group">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <p className="font-bold text-white text-sm leading-tight">{r.vehicleName || r.name}</p>
                              <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-0.5">{r.vehicleType || r.type} • {r.seatingCapacity || r.capacity} Pax</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[9px] text-white/30 font-bold uppercase">One-way</p>
                              <p className="text-lg font-black text-primary">₹{Number(r.price).toLocaleString("en-IN")}</p>
                            </div>
                          </div>
                          {r.roundTripPrice && (
                            <div className="flex items-center justify-between border-t border-white/10 pt-2 mt-2">
                              <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Round Trip</span>
                              <span className="text-sm font-bold text-white/70">₹{Number(r.roundTripPrice).toLocaleString("en-IN")}</span>
                            </div>
                          )}
                          {r.estimatedDistanceKm && (
                            <p className="text-[10px] text-white/30 font-medium mt-1.5 flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5" />
                              {r.estimatedDistanceKm} km • {r.includes?.includes("FUEL") ? "Fuel incl." : ""}{r.includes?.includes("DRIVER_ALLOWANCE") ? " Driver incl." : ""}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-white/25 font-medium mt-4 text-center">
                      Prices are indicative. Final fare confirmed at booking. Tolls & parking may be extra.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Popular Routes Section ── */}
      {routes.length > 0 && (
        <section id="routes" className="container mx-auto px-4 pb-10 md:pb-16">
          <div className="bg-slate-50 rounded-2xl md:rounded-3xl p-6 md:p-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-10 gap-3">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                  <MapPin className="w-3 h-3" /> Himalayan Circuits
                </span>
                <h2 className="text-2xl md:text-3xl font-serif font-black tracking-tight">
                  Popular Road <span className="text-primary italic">Routes.</span>
                </h2>
              </div>
              <p className="text-muted-foreground text-sm font-medium max-w-xs">Fair pricing based on distance and terrain. No hidden charges.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {routes.map(route => (
                <div key={route.id} className="bg-white border border-black/5 rounded-xl md:rounded-2xl p-4 md:p-5 flex items-center justify-between hover:shadow-lg transition-all group cursor-pointer">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-9 h-9 md:w-11 md:h-11 bg-primary/5 rounded-xl flex items-center justify-center group-hover:bg-primary transition-colors shrink-0">
                      <MapPin className="h-4 w-4 md:h-5 md:w-5 text-primary group-hover:text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm md:text-base">{route.from} <span className="text-muted-foreground font-normal text-xs">to</span> {route.to}</p>
                        {route.isPopular && <span className="bg-orange-100 text-orange-600 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full">Hot</span>}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1.5">
                        <span>{route.distance} KM</span>
                        <span className="text-muted-foreground/40">•</span>
                        <Clock className="w-3 h-3" />
                        <span>{route.estimatedTime}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-wider">From</p>
                    <p className="text-base md:text-xl font-black text-primary">₹{route.startingPrice?.toLocaleString("en-IN")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA / Support Section ── */}
      <section className="container mx-auto px-4 pb-14 md:pb-24">
        <div className="bg-gradient-to-br from-[#0A0A0B] to-[#1a1a2e] rounded-2xl md:rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-3 text-center md:text-left relative z-10">
            <h3 className="text-xl md:text-2xl font-serif font-black text-white tracking-tight">
              Need a customized transport <br className="hidden md:block" />plan for your group?
            </h3>
            <p className="text-white/50 text-sm font-medium max-w-md leading-relaxed">
              Our transport experts are online 24/7. Best rates for bulk bookings, custom Himalayan circuits & corporate logistics.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 relative z-10 w-full md:w-auto">
            <a href="tel:+919805001916" className="flex items-center justify-center gap-2 h-12 md:h-14 px-6 md:px-8 rounded-xl bg-primary text-white font-bold text-xs uppercase tracking-widest hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20">
              <PhoneCall className="h-4 w-4" /> Call Transport Desk
            </a>
            <a href="https://wa.me/919805001916" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 h-12 md:h-14 px-6 md:px-8 rounded-xl border border-white/20 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all">
              WhatsApp Query
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
