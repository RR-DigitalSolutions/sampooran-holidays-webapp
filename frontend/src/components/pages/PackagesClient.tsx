"use client";

import { useListPackages } from "@workspace/api-client-react";
import { PackageCard } from "@/components/PackageCard";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Search, SlidersHorizontal, X, LayoutGrid, LayoutList,
  ChevronDown, MapPin, Clock, IndianRupee, Star,
  Plane, Shield, Headphones, Zap, TrendingUp, Filter,
  CheckCircle2, ArrowRight, Sparkles, Mountain, Heart,
  Users, Briefcase, Trees, Camera, Globe, BookOpen,
} from "lucide-react";
import { getApiUrl } from "@/lib/api-url";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, any> = {
  All: Globe,
  Adventure: Mountain,
  Honeymoon: Heart,
  Family: Users,
  Corporate: Briefcase,
  Cultural: Camera,
  Luxury: Sparkles,
  Budget: IndianRupee,
  Wildlife: Trees,
  Religious: BookOpen,
  Group: Users,
  International: Globe,
};

const DURATIONS = [
  { label: "Any Duration", min: 0, max: 999 },
  { label: "1–3 Days", min: 1, max: 3 },
  { label: "4–6 Days", min: 4, max: 6 },
  { label: "7–10 Days", min: 7, max: 10 },
  { label: "11+ Days", min: 11, max: 999 },
];

const BUDGETS = [
  { label: "Any Budget", min: 0, max: 999999 },
  { label: "Under ₹10,000", min: 0, max: 10000 },
  { label: "₹10,000 – ₹20,000", min: 10000, max: 20000 },
  { label: "₹20,000 – ₹35,000", min: 20000, max: 35000 },
  { label: "₹35,000 – ₹50,000", min: 35000, max: 50000 },
  { label: "Above ₹50,000", min: 50000, max: 999999 },
];

const RATINGS = [
  { label: "Any Rating", val: 0 },
  { label: "4★ & Above", val: 4 },
  { label: "4.5★ & Above", val: 4.5 },
  { label: "4.8★ & Above", val: 4.8 },
];

const DESTINATIONS = [
  "All Destinations", "Manali", "Leh Ladakh", "Kashmir", "Shimla",
  "Spiti Valley", "Rishikesh", "Jaipur", "Goa", "Kerala", "Andaman",
  "Thailand", "Bhutan", "Nepal", "Dubai", "Singapore",
];

const normaliseDestination = (val: string | null) => {
  if (!val) return "All Destinations";
  const cleaned = val.toLowerCase().replace(/-/g, " ").trim();
  const matched = DESTINATIONS.find(d => d.toLowerCase() === cleaned);
  if (matched) return matched;

  // Custom checks for common slugs
  if (cleaned === "leh" || cleaned === "ladakh" || cleaned === "leh ladakh") return "Leh Ladakh";
  if (cleaned === "spiti" || cleaned === "spiti valley") return "Spiti Valley";

  // Capitalise first letter of each word as fallback
  return val.split(/[- ]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

const SORT_OPTIONS = [
  { label: "Most Popular", value: "popular" },
  { label: "Trending Now", value: "trending" },
  { label: "Highest Rated", value: "rating" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
];

const TRUST_BADGES = [
  { icon: Shield, label: "Verified & Safe", color: "text-emerald-600 bg-emerald-50" },
  { icon: Headphones, label: "24/7 Support", color: "text-blue-600 bg-blue-50" },
  { icon: Zap, label: "Instant Confirmation", color: "text-amber-600 bg-amber-50" },
  { icon: TrendingUp, label: "Best Price Guarantee", color: "text-rose-600 bg-rose-50" },
];

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm animate-pulse">
      <div className="h-48 bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-slate-200 rounded w-1/3" />
        <div className="h-5 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-full" />
        <div className="h-3 bg-slate-200 rounded w-2/3" />
        <div className="flex justify-between pt-2">
          <div className="h-7 bg-slate-200 rounded w-1/3" />
          <div className="h-7 bg-slate-200 rounded w-10" />
        </div>
      </div>
    </div>
  );
}

// ─── Filter Pill ──────────────────────────────────────────────────────────────

function FilterPill({
  active, onClick, children, className,
}: { active: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all duration-200 whitespace-nowrap",
        active
          ? "bg-primary text-white border-primary shadow-md shadow-primary/20 scale-105"
          : "bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary",
        className
      )}
    >
      {children}
    </button>
  );
}

// ─── Sidebar Filter Section ───────────────────────────────────────────────────

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 pb-5 mb-5 last:border-0 last:mb-0 last:pb-0">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 mb-3">{title}</p>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PackagesPage() {
  const searchParams = useSearchParams();
  const initCategory = searchParams.get("category") ?? searchParams.get("theme") ?? "All";
  const searchQuery = searchParams.get("q") ?? "";
  const initSort = searchParams.get("sort") ?? searchParams.get("sortBy") ?? "popular";
  const initDestinationParam = searchParams.get("country") ?? searchParams.get("destination") ?? searchParams.get("destinationSlug") ?? "";
  const initDestination = normaliseDestination(initDestinationParam);

  const [category, setCategory] = useState(initCategory);
  const [durationIdx, setDurationIdx] = useState(0);
  const [budgetIdx, setBudgetIdx] = useState(0);
  const [destination, setDestination] = useState(initDestination);
  const [sortBy, setSortBy] = useState(initSort);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [q, setQ] = useState(searchQuery);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([
    "All", "Adventure", "Honeymoon", "Family", "Cultural", "Luxury", "Budget", "Wildlife", "Religious", "Group",
  ]);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const catScrollRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setHeaderScrolled(window.scrollY > 320);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch(`${getApiUrl()}/ota/home/config`);
        if (!res.ok) return;
        const data = await res.json();
        const cats = data.categories?.filter((c: any) => c.isActive).map((c: any) => c.label) || [];
        const themes = data.themes?.map((t: any) => t.name) || [];
        const unique = Array.from(new Set([...cats, ...themes])) as string[];
        if (unique.length > 0) setDynamicCategories(["All", ...unique]);
      } catch {}
    }
    fetchConfig();
  }, []);

  // Sync state with URL search parameters dynamically
  useEffect(() => {
    const categoryParam = searchParams.get("category") ?? searchParams.get("theme") ?? "All";
    const searchParam = searchParams.get("q") ?? "";
    const destParam = searchParams.get("country") ?? searchParams.get("destination") ?? searchParams.get("destinationSlug") ?? "";
    const sortParam = searchParams.get("sort") ?? searchParams.get("sortBy") ?? "popular";

    if (categoryParam) {
      const matchedCat = dynamicCategories.find(c => c.toLowerCase() === categoryParam.toLowerCase());
      if (matchedCat) {
        setCategory(matchedCat);
      } else {
        const capitalized = categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1);
        setCategory(capitalized);
      }
    }

    setQ(searchParam);
    setDestination(normaliseDestination(destParam));
    setSortBy(sortParam);
  }, [searchParams, dynamicCategories]);

  const { data, isLoading } = useListPackages({ limit: 500 } as any);
  const allPackages = data?.packages || [];

  const filtered = useMemo(() => {
    let result = [...allPackages];
    if (q) {
      const lq = q.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(lq) ||
        (p.destinationName ?? "").toLowerCase().includes(lq) ||
        (p.shortDescription ?? "").toLowerCase().includes(lq) ||
        (p.stateName ?? "").toLowerCase().includes(lq)
      );
    }
    if (category !== "All") {
      result = result.filter(p => {
        if (!p.category) return false;
        const pc = p.category.toLowerCase().trim();
        const sc = category.toLowerCase().trim();
        return pc.includes(sc) || sc.includes(pc);
      });
    }
    if (destination !== "All Destinations") {
      result = result.filter(p =>
        p.destinationName?.includes(destination) ||
        p.stateName?.includes(destination) ||
        (p as any).cities?.some((c: string) => c.includes(destination))
      );
    }
    const dur = DURATIONS[durationIdx];
    result = result.filter(p => p.duration >= dur.min && p.duration <= dur.max);
    const bud = BUDGETS[budgetIdx];
    result = result.filter(p => p.pricePerPerson >= bud.min && p.pricePerPerson <= bud.max);
    if (minRating > 0) result = result.filter(p => (p.rating ?? 0) >= minRating);
    if (sortBy === "price_asc") result.sort((a, b) => a.pricePerPerson - b.pricePerPerson);
    else if (sortBy === "price_desc") result.sort((a, b) => b.pricePerPerson - a.pricePerPerson);
    else if (sortBy === "rating") result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    else if (sortBy === "trending") result.sort((a, b) => ((b as any).isTrending ? 1 : 0) - ((a as any).isTrending ? 1 : 0));
    else result.sort((a, b) => ((b as any).isFeatured ? 1 : 0) - ((a as any).isFeatured ? 1 : 0));
    return result;
  }, [allPackages, q, category, destination, durationIdx, budgetIdx, minRating, sortBy]);

  const hasFilters = category !== "All" || durationIdx !== 0 || budgetIdx !== 0 ||
    destination !== "All Destinations" || !!q || minRating > 0;

  const activeFilterCount = [
    category !== "All",
    durationIdx !== 0,
    budgetIdx !== 0,
    destination !== "All Destinations",
    minRating > 0,
  ].filter(Boolean).length;

  const resetFilters = useCallback(() => {
    setCategory("All");
    setDurationIdx(0);
    setBudgetIdx(0);
    setDestination("All Destinations");
    setQ("");
    setMinRating(0);
  }, []);

  // ─── Sidebar Filter Content ────────────────────────────────────────────────

  const FilterContent = (
    <div className="space-y-0">
      <FilterSection title="Destination">
        <select
          value={destination}
          onChange={e => setDestination(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
        >
          {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </FilterSection>

      <FilterSection title="Duration">
        <div className="space-y-1.5">
          {DURATIONS.map((d, i) => (
            <button
              key={d.label}
              onClick={() => setDurationIdx(i)}
              className={cn(
                "w-full text-left rounded-lg px-3 py-2.5 text-sm font-medium flex items-center justify-between transition-all",
                durationIdx === i
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-primary"
              )}
            >
              <span className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 opacity-70" />
                {d.label}
              </span>
              {durationIdx === i && <CheckCircle2 className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Budget per Person">
        <div className="space-y-1.5">
          {BUDGETS.map((b, i) => (
            <button
              key={b.label}
              onClick={() => setBudgetIdx(i)}
              className={cn(
                "w-full text-left rounded-lg px-3 py-2.5 text-sm font-medium flex items-center justify-between transition-all",
                budgetIdx === i
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-primary"
              )}
            >
              <span className="flex items-center gap-2">
                <IndianRupee className="w-3.5 h-3.5 opacity-70" />
                {b.label}
              </span>
              {budgetIdx === i && <CheckCircle2 className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Guest Rating">
        <div className="space-y-1.5">
          {RATINGS.map(r => (
            <button
              key={r.label}
              onClick={() => setMinRating(r.val)}
              className={cn(
                "w-full text-left rounded-lg px-3 py-2.5 text-sm font-medium flex items-center justify-between transition-all",
                minRating === r.val
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-primary"
              )}
            >
              <span className="flex items-center gap-2">
                <Star className="w-3.5 h-3.5 opacity-70" />
                {r.label}
              </span>
              {minRating === r.val && <CheckCircle2 className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Why Sampooran - sidebar widget */}
      <div className="rounded-xl bg-gradient-to-br from-primary via-[#0D1B3E] to-[#0B1528] p-5 text-white mt-2">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#F5A623] mb-2">Why Book With Us</p>
        <div className="space-y-3">
          {[
            { icon: Shield, text: "Verified stays & verified transfers" },
            { icon: Zap, text: "Instant booking confirmation" },
            { icon: Headphones, text: "24/7 dedicated travel support" },
            { icon: TrendingUp, text: "Best price guaranteed — always" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-md bg-white/10 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <item.icon className="w-3.5 h-3.5 text-[#F5A623]" />
              </div>
              <p className="text-white/80 text-xs leading-snug">{item.text}</p>
            </div>
          ))}
        </div>
        <Link
          href="/customized-holidays"
          className="mt-4 flex items-center justify-center gap-2 w-full bg-[#F5A623] text-primary font-bold text-xs py-2.5 rounded-lg hover:brightness-110 transition-all"
        >
          Get Custom Itinerary <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA]">

      {/* ─── HERO SECTION ───────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-[#061226] via-[#0D1B3E] to-[#0B2050] pt-28 pb-16 md:pt-36 md:pb-20 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }}
        />
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#F5A623]/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.28em] text-[#F5A623] mb-4">
                <Sparkles className="w-3 h-3" /> Explore & Discover
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-black text-white leading-[1.1] mb-4">
                Find Your Perfect{" "}
                <span className="text-[#F5A623] italic font-light">Holiday.</span>
              </h1>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-8 max-w-xl mx-auto">
                Curated itineraries, verified stays & flexible pricing — across India and the world.
              </p>
            </motion.div>

            {/* ─── Search Box ───────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-white/10 p-2 md:p-3 flex flex-col sm:flex-row items-stretch gap-2 max-w-2xl mx-auto"
            >
              <div className="flex-1 flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Destination, package name..."
                  className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 font-medium outline-none text-sm"
                />
                {q && (
                  <button onClick={() => setQ("")} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="relative shrink-0">
                <select
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  className="appearance-none w-full sm:w-40 bg-slate-50 border border-slate-100 rounded-xl px-4 pr-8 py-2.5 text-sm text-slate-700 font-medium outline-none cursor-pointer"
                >
                  {DESTINATIONS.map(d => <option key={d} value={d}>{d === "All Destinations" ? "Any Destination" : d}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
              <button
                onClick={() => { if (hasFilters) resetFilters(); }}
                className="shrink-0 bg-primary hover:bg-[#1B3A6B] text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors shadow-lg shadow-primary/30"
              >
                {hasFilters ? "Reset" : "Search"}
              </button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-6 flex flex-wrap items-center justify-center gap-4 md:gap-6"
            >
              {TRUST_BADGES.map(b => (
                <div key={b.label} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                  <b.icon className="w-3.5 h-3.5 text-[#F5A623]" />
                  {b.label}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── STICKY CATEGORY STRIP ──────────────────────────────────── */}
      <div className={cn(
        "sticky top-[64px] z-30 bg-white border-b border-slate-200 transition-shadow duration-300",
        headerScrolled ? "shadow-md" : "shadow-none"
      )}>
        <div className="container mx-auto px-4">
          <div
            ref={catScrollRef}
            className="flex items-center gap-2 py-3 overflow-x-auto no-scrollbar"
          >
            {dynamicCategories.map(cat => {
              const Icon = CATEGORY_ICONS[cat] || Globe;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all duration-200 whitespace-nowrap",
                    category === cat
                      ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                      : "bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT AREA ──────────────────────────────────────── */}
      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="flex gap-6 lg:gap-8 relative items-start">

          {/* ─── DESKTOP SIDEBAR ────────────────────────────────────── */}
          <aside className="hidden lg:block w-[268px] shrink-0 sticky top-[124px] self-start">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-bold text-slate-900">Filter Packages</h2>
                </div>
                {hasFilters && (
                  <button onClick={resetFilters} className="text-xs font-semibold text-primary hover:underline">
                    Clear All
                  </button>
                )}
              </div>
              <div className="p-5">
                {FilterContent}
              </div>
            </div>
          </aside>

          {/* ─── RESULTS AREA ───────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                {isLoading ? (
                  <div className="h-6 w-40 bg-slate-200 rounded animate-pulse" />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-900">
                      {filtered.length} <span className="text-slate-500 font-normal text-base">packages found</span>
                    </span>
                    {hasFilters && (
                      <span className="text-xs text-primary font-semibold bg-primary/8 px-2 py-0.5 rounded-full border border-primary/15">
                        Filtered
                      </span>
                    )}
                  </div>
                )}
                {category !== "All" && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Showing <span className="font-semibold text-slate-700">{category}</span> packages
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Mobile filter button */}
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:border-primary/40 transition-colors"
                >
                  <Filter className="w-3.5 h-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-0.5 w-4 h-4 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Sort */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>

                {/* View toggle */}
                <div className="hidden sm:flex items-center rounded-lg border border-slate-200 overflow-hidden bg-white">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-2 transition-colors",
                      viewMode === "grid" ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50"
                    )}
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-2 transition-colors",
                      viewMode === "list" ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50"
                    )}
                    aria-label="List view"
                  >
                    <LayoutList className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {hasFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {q && (
                  <span className="inline-flex items-center gap-1.5 bg-primary/8 text-primary text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/15">
                    "{q}"
                    <button onClick={() => setQ("")}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {category !== "All" && (
                  <span className="inline-flex items-center gap-1.5 bg-primary/8 text-primary text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/15">
                    {category}
                    <button onClick={() => setCategory("All")}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {destination !== "All Destinations" && (
                  <span className="inline-flex items-center gap-1.5 bg-primary/8 text-primary text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/15">
                    <MapPin className="w-3 h-3" /> {destination}
                    <button onClick={() => setDestination("All Destinations")}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {durationIdx !== 0 && (
                  <span className="inline-flex items-center gap-1.5 bg-primary/8 text-primary text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/15">
                    <Clock className="w-3 h-3" /> {DURATIONS[durationIdx].label}
                    <button onClick={() => setDurationIdx(0)}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {budgetIdx !== 0 && (
                  <span className="inline-flex items-center gap-1.5 bg-primary/8 text-primary text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/15">
                    {BUDGETS[budgetIdx].label}
                    <button onClick={() => setBudgetIdx(0)}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {minRating > 0 && (
                  <span className="inline-flex items-center gap-1.5 bg-primary/8 text-primary text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/15">
                    <Star className="w-3 h-3" /> {minRating}+ Stars
                    <button onClick={() => setMinRating(0)}><X className="w-3 h-3" /></button>
                  </span>
                )}
                <button onClick={resetFilters} className="text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors px-2">
                  Clear all
                </button>
              </div>
            )}

            {/* ─── Package Grid/List ─────────────────────────────── */}
            {isLoading ? (
              <div className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5"
                  : "space-y-4"
              )}>
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 md:p-20 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
                  <Search className="w-7 h-7 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No packages match your search</h3>
                <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                  Try widening your filters — change the budget, duration, or destination to see more options.
                </p>
                <button
                  onClick={resetFilters}
                  className="bg-primary text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#1B3A6B] transition-colors shadow-lg shadow-primary/20"
                >
                  Reset All Filters
                </button>
              </motion.div>
            ) : viewMode === "grid" ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5"
              >
                {filtered.map((pkg, i) => (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  >
                    <PackageCard pkg={pkg} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="space-y-4">
                {filtered.map(pkg => <PackageCard key={pkg.id} pkg={pkg} variant="horizontal" />)}
              </div>
            )}

            {/* ─── CTA Banner ─────────────────────────────────────── */}
            {!isLoading && filtered.length > 0 && (
              <div className="mt-8 rounded-2xl overflow-hidden bg-gradient-to-r from-primary via-[#0D1B3E] to-[#0B2050] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-5 relative">
                <div className="absolute inset-0 opacity-[0.06]"
                  style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "28px 28px" }}
                />
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#F5A623]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative text-center md:text-left">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F5A623] block mb-1">
                    Can't find what you're looking for?
                  </span>
                  <h3 className="text-lg md:text-xl font-bold text-white">
                    Get a <span className="text-[#F5A623]">personalised itinerary</span> from our experts.
                  </h3>
                  <p className="text-white/60 text-xs mt-1">Free consultation · No obligation · Tailored just for you</p>
                </div>
                <Link
                  href="/customized-holidays"
                  className="relative shrink-0 flex items-center gap-2 bg-[#F5A623] hover:brightness-110 text-primary font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-lg shadow-[#F5A623]/20 whitespace-nowrap"
                >
                  Plan My Trip <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* ─── Bottom Trust Bar ────────────────────────────────── */}
            {!isLoading && (
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TRUST_BADGES.map(b => (
                  <div key={b.label} className={cn(
                    "flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white"
                  )}>
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", b.color)}>
                      <b.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 leading-tight">{b.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── MOBILE FILTER BOTTOM SHEET ─────────────────────────────── */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFilterOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60] lg:hidden backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl shadow-2xl lg:hidden max-h-[88vh] flex flex-col"
            >
              {/* Drawer handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 bg-slate-200 rounded-full" />
              </div>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-bold text-slate-900">Filter Packages</h2>
                  {activeFilterCount > 0 && (
                    <span className="bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {hasFilters && (
                    <button onClick={resetFilters} className="text-xs font-semibold text-red-500">Clear All</button>
                  )}
                  <button onClick={() => setMobileFilterOpen(false)}>
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
              </div>
              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1 px-5 py-4 pb-8">
                {FilterContent}
              </div>
              {/* Apply button */}
              <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full bg-primary text-white font-bold text-sm py-3.5 rounded-xl hover:bg-[#1B3A6B] transition-colors shadow-lg shadow-primary/20"
                >
                  Show {filtered.length} Package{filtered.length !== 1 ? "s" : ""}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── MOBILE STICKY BOTTOM BAR ────────────────────────────────── */}
      <div className="fixed bottom-[64px] left-0 right-0 z-40 lg:hidden pointer-events-none">
        <div className="container mx-auto px-4 pb-2 flex justify-end pointer-events-auto">
          {!mobileFilterOpen && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileFilterOpen(true)}
              className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-3 rounded-full shadow-xl shadow-primary/30 border border-white/10"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-white text-primary text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center ml-0.5">
                  {activeFilterCount}
                </span>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
