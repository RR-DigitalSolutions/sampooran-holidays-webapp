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
  Users, Briefcase, Trees, Camera, Globe, BookOpen, Check,
  Compass,
} from "lucide-react";

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
  { icon: Shield, label: "Verified & Safe", shortLabel: "Verified & Safe", color: "text-emerald-600 bg-emerald-50" },
  { icon: Headphones, label: "24/7 Support", shortLabel: "24/7 Support", color: "text-blue-600 bg-blue-50" },
  { icon: Zap, label: "Instant Confirmation", shortLabel: "Instant Confirm", color: "text-amber-600 bg-amber-50" },
  { icon: TrendingUp, label: "Best Price Guarantee", shortLabel: "Best Price", color: "text-rose-600 bg-rose-50" },
];

// ─── MultiSelect Dropdown ───────────────────────────────────────────────────

interface MultiSelectDropdownProps {
  options: { name: string; count: number }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  darkTheme?: boolean;
}

function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder,
  darkTheme = false,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (name: string) => {
    if (selected.includes(name)) {
      onChange(selected.filter(item => item !== name));
    } else {
      onChange([...selected, name]);
    }
  };

  const isAllSelected = selected.length === 0;

  const displayValue = isAllSelected
    ? placeholder
    : selected.join(", ");

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-1 transition-all duration-200 text-left cursor-pointer",
          darkTheme
            ? "bg-transparent text-white font-bold text-xs border-0 py-0.5"
            : "bg-white border border-slate-200 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg hover:border-primary/40 focus:ring-2 focus:ring-accent/40 font-medium"
        )}
      >
        <span className={cn("truncate", darkTheme ? "max-w-[120px] md:max-w-[150px]" : "max-w-[200px]")}>
          {displayValue}
        </span>
        <ChevronDown className={cn("w-3 h-3 shrink-0 opacity-60 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-1.5 w-full max-h-60 overflow-y-auto rounded-lg border shadow-xl bg-white p-1.5 space-y-0.5 border-slate-200"
          )}
        >
          {/* "All Destinations" option */}
          <button
            type="button"
            onClick={() => {
              onChange([]);
              setIsOpen(false);
            }}
            className="w-full flex items-center justify-between px-2 py-1.5 text-left text-xs font-semibold rounded-md hover:bg-slate-50 transition-colors text-slate-700"
          >
            <span>All Destinations</span>
            {isAllSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
          </button>

          <div className="border-t border-slate-100 my-1" />

          {options.map(opt => {
            const isChecked = selected.includes(opt.name);
            return (
              <button
                key={opt.name}
                type="button"
                onClick={() => toggleOption(opt.name)}
                className={cn(
                  "w-full flex items-center justify-between px-2 py-1.5 text-left text-xs rounded-md hover:bg-slate-50 transition-colors font-medium text-slate-700",
                  isChecked && "bg-primary/5 text-primary"
                )}
              >
                <span className="truncate pr-2">{opt.name} ({opt.count})</span>
                {isChecked && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
    <div className="border-b border-slate-100 pb-2 mb-2 last:border-0 last:mb-0 last:pb-0">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 mb-1">{title}</p>
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

  const [category, setCategory] = useState(initCategory);
  const [maxDuration, setMaxDuration] = useState(15);
  const [maxBudget, setMaxBudget] = useState(100000);
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(() => {
    if (!initDestinationParam) return [];
    return initDestinationParam.split(",").map(d => normaliseDestination(d)).filter(d => d !== "All Destinations");
  });
  const [sortBy, setSortBy] = useState(initSort);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [q, setQ] = useState(searchQuery);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [startingFrom, setStartingFrom] = useState("New Delhi");
  const [startDate, setStartDate] = useState("2026-08-10");
  const [roomsGuests, setRoomsGuests] = useState("2 Adults");
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([
    "All", "Adventure", "Honeymoon", "Family", "Cultural", "Luxury", "Budget", "Wildlife", "Religious", "Group",
  ]);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const catScrollRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setHeaderScrolled(window.scrollY > 20);
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
      } catch { }
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
    setSortBy(sortParam);
    if (destParam) {
      const parsed = destParam.split(",").map(d => normaliseDestination(d)).filter(d => d !== "All Destinations");
      setSelectedDestinations(parsed);
    } else {
      setSelectedDestinations([]);
    }
  }, [searchParams, dynamicCategories]);

  const { data, isLoading } = useListPackages({ limit: 500 } as any);
  const allPackages = data?.packages || [];

  // Dynamically compute destinations that actually exist in packages
  const availableDestinations = useMemo(() => {
    const counts: Record<string, number> = {};
    allPackages.forEach(p => {
      const places = new Set<string>();
      if (p.destinationName) places.add(p.destinationName.trim());
      if (p.stateName) places.add(p.stateName.trim());
      if (p.cities && Array.isArray(p.cities)) {
        p.cities.forEach((c: string) => {
          if (c) places.add(c.trim());
        });
      }
      places.forEach(place => {
        counts[place] = (counts[place] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [allPackages]);

  const filtered = useMemo(() => {
    let result = [...allPackages];
    if (q) {
      result = result.filter(p =>
        isFuzzyMatch(p.name, q) ||
        isFuzzyMatch(p.destinationName, q) ||
        isFuzzyMatch(p.shortDescription, q) ||
        isFuzzyMatch(p.stateName, q)
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
    if (selectedDestinations.length > 0) {
      result = result.filter(p =>
        selectedDestinations.some(dest =>
          p.destinationName?.toLowerCase().includes(dest.toLowerCase()) ||
          p.stateName?.toLowerCase().includes(dest.toLowerCase()) ||
          (p as any).cities?.some((c: string) => c.toLowerCase().includes(dest.toLowerCase()))
        )
      );
    }
    // Filter by max duration slider
    if (maxDuration < 15) {
      result = result.filter(p => p.duration <= maxDuration);
    }
    // Filter by max budget slider
    if (maxBudget < 100000) {
      result = result.filter(p => p.pricePerPerson <= maxBudget);
    }
    if (minRating > 0) result = result.filter(p => (p.rating ?? 0) >= minRating);
    if (sortBy === "price_asc") result.sort((a, b) => a.pricePerPerson - b.pricePerPerson);
    else if (sortBy === "price_desc") result.sort((a, b) => b.pricePerPerson - a.pricePerPerson);
    else if (sortBy === "rating") result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    else if (sortBy === "trending") result.sort((a, b) => ((b as any).isTrending ? 1 : 0) - ((a as any).isTrending ? 1 : 0));
    else result.sort((a, b) => ((b as any).isFeatured ? 1 : 0) - ((a as any).isFeatured ? 1 : 0));
    return result;
  }, [allPackages, q, category, selectedDestinations, maxDuration, maxBudget, minRating, sortBy]);

  const hasFilters = category !== "All" || maxDuration !== 15 || maxBudget !== 100000 ||
    selectedDestinations.length > 0 || !!q || minRating > 0;

  const activeFilterCount = [
    category !== "All",
    maxDuration !== 15,
    maxBudget !== 100000,
    selectedDestinations.length > 0,
    minRating > 0,
  ].filter(Boolean).length;

  const resetFilters = useCallback(() => {
    setCategory("All");
    setMaxDuration(15);
    setMaxBudget(100000);
    setSelectedDestinations([]);
    setQ("");
    setMinRating(0);
    setStartingFrom("New Delhi");
    setStartDate("2026-08-10");
    setRoomsGuests("2 Adults");
  }, []);

  // ─── Sidebar Filter Content ────────────────────────────────────────────────

  const FilterContent = (
    <div className="space-y-0">
      <FilterSection title="Destination">
        <MultiSelectDropdown
          options={availableDestinations}
          selected={selectedDestinations}
          onChange={setSelectedDestinations}
          placeholder="All Destinations"
        />
      </FilterSection>

      <FilterSection title="Theme / Category">
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/40 bg-white font-medium cursor-pointer"
        >
          {dynamicCategories.map(cat => {
            const count = allPackages.filter(p => {
              if (cat === "All") return true;
              if (!p.category) return false;
              const pc = p.category.toLowerCase().trim();
              const sc = cat.toLowerCase().trim();
              return pc.includes(sc) || sc.includes(pc);
            }).length;
            return (
              <option key={cat} value={cat}>
                {cat} ({count})
              </option>
            );
          })}
        </select>
      </FilterSection>

      <FilterSection title="Duration">
        <div className="space-y-1 py-0.5">
          <div className="flex items-center justify-between text-xs text-slate-700 font-bold">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary opacity-80" />
              {maxDuration === 15 ? "Any Duration" : `Up to ${maxDuration} Days`}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="15"
            step="1"
            value={maxDuration}
            onChange={e => setMaxDuration(Number(e.target.value))}
            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#F5A623]"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-semibold px-0.5">
            <span>1 Day</span>
            <span>7d</span>
            <span>15d+</span>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Budget per Person">
        <div className="space-y-1 py-0.5">
          <div className="flex items-center justify-between text-xs text-slate-700 font-bold">
            <span className="flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-primary opacity-80" />
              {maxBudget === 100000 ? "Any Budget" : `Up to ₹${maxBudget.toLocaleString("en-IN")}`}
            </span>
          </div>
          <input
            type="range"
            min="5000"
            max="100000"
            step="5000"
            value={maxBudget}
            onChange={e => setMaxBudget(Number(e.target.value))}
            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#F5A623]"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-semibold px-0.5">
            <span>₹5K</span>
            <span>₹50K</span>
            <span>₹1L+</span>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Guest Rating">
        <div className="space-y-1 py-0.5">
          <div className="flex items-center justify-between text-xs text-slate-700 font-bold">
            <span className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-primary opacity-80" />
              {minRating === 0 ? "Any Rating" : `${minRating}★ & Above`}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={minRating}
            onChange={e => setMinRating(Number(e.target.value))}
            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#F5A623]"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-semibold px-0.5">
            <span>Any</span>
            <span>3★</span>
            <span>4★</span>
            <span>5★</span>
          </div>
        </div>
      </FilterSection>

      {/* Why Choose Us - sidebar widget */}
      <div className="rounded-xl bg-gradient-to-br from-primary via-[#0D1B3E] to-[#0B1528] p-3 text-white mt-2">
        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#F5A623] mb-1.5">Why Book With Us</p>
        <div className="space-y-2">
          {[
            { icon: Shield, text: "Verified stays & verified transfers" },
            { icon: Zap, text: "Instant booking confirmation" },
            { icon: Headphones, text: "24/7 dedicated travel support" },
            { icon: TrendingUp, text: "Best price guaranteed — always" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-5 h-5 rounded bg-white/10 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <item.icon className="w-3 h-3 text-[#F5A623]" />
              </div>
              <p className="text-white/80 text-[10px] leading-tight font-medium">{item.text}</p>
            </div>
          ))}
        </div>
        <Link
          href="/customized-holidays"
          className="mt-3 flex items-center justify-center gap-1.5 w-full bg-[#F5A623] text-primary font-extrabold text-[10px] py-1.5 rounded-md hover:brightness-110 transition-all shadow-sm"
        >
          Get Custom Itinerary <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className={cn("min-h-screen bg-[#F5F7FA] transition-all duration-300", headerScrolled ? "pt-[55px]" : "pt-[61px]")}>

      {/* ─── STICKY SEARCH BAR ──────────────────────────────────────────────── */}
      <div className={cn("sticky z-30 bg-[#0B1E42] border-b border-white/10 text-white w-full shadow-md transition-all duration-300", headerScrolled ? "top-[55px]" : "top-[61px]")}>

        {/* ── MOBILE: Full-width keyword search (hidden on scroll to prevent double sticky search bar) ── */}
        <div className={cn("lg:hidden px-3 py-2", headerScrolled && "hidden")}>
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
            <input
              ref={searchRef}
              type="search"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search packages, destinations…"
              className="w-full bg-white/10 border border-white/15 text-white placeholder:text-white/40 text-sm font-medium pl-10 pr-10 py-2.5 rounded-xl focus:outline-none focus:border-accent/50 focus:bg-white/15 transition-all"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── DESKTOP: 4-column bar ── */}
        <div className="hidden lg:flex container mx-auto px-4 items-center justify-between gap-3 text-xs py-1.5">
          <div className="flex-1 grid grid-cols-4 gap-4 divide-x divide-white/10">
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">Start From</span>
              <select
                value={startingFrom}
                onChange={e => setStartingFrom(e.target.value)}
                className="bg-transparent text-white font-bold outline-none w-full cursor-pointer text-xs"
              >
                {["New Delhi", "Mumbai", "Bangalore", "Kolkata", "Chennai", "Hyderabad", "Ahmedabad"].map(city => (
                  <option key={city} value={city} className="text-slate-800">{city}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col min-w-0 pl-3">
              <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">Going To</span>
              <MultiSelectDropdown
                options={availableDestinations}
                selected={selectedDestinations}
                onChange={setSelectedDestinations}
                placeholder="Any Destination"
                darkTheme={true}
              />
            </div>
            <div className="flex flex-col min-w-0 pl-3">
              <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">Start Date</span>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-transparent text-white font-bold outline-none w-full cursor-pointer text-xs [color-scheme:dark]"
              />
            </div>
            <div className="flex flex-col min-w-0 pl-3">
              <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">Guests</span>
              <select
                value={roomsGuests}
                onChange={e => setRoomsGuests(e.target.value)}
                className="bg-transparent text-white font-bold outline-none w-full cursor-pointer text-xs"
              >
                {["1 Adult", "2 Adults", "3 Adults", "4 Adults", "2 Adults, 1 Room", "4 Adults, 2 Rooms"].map(opt => (
                  <option key={opt} value={opt} className="text-slate-800">{opt}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={() => { if (hasFilters) resetFilters(); }}
            className="bg-accent hover:brightness-110 text-primary font-bold text-[10px] px-4 py-1.5 rounded-lg transition-colors shrink-0"
          >
            {hasFilters ? "Reset" : "SEARCH"}
          </button>
        </div>
      </div>


      {/* ─── MAIN CONTENT AREA ──────────────────────────────────────── */}
      <div className="container mx-auto px-4 py-4 lg:py-5">
        <div className="flex gap-4 lg:gap-5 relative items-start">

          {/* ─── DESKTOP SIDEBAR ────────────────────────────────────── */}
          <aside className="hidden lg:block w-[250px] shrink-0 sticky top-[calc(50vh-270px)] transition-all duration-300 self-start">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-3.5 border-b border-slate-100">
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
              <div className="p-3.5">
                {FilterContent}
              </div>
            </div>
          </aside>

          {/* ─── RESULTS AREA ───────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
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
                {selectedDestinations.map(dest => (
                  <span key={dest} className="inline-flex items-center gap-1.5 bg-primary/8 text-primary text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/15 animate-in fade-in slide-in-from-top-1">
                    <MapPin className="w-3 h-3 text-primary/80" /> {dest}
                    <button onClick={() => setSelectedDestinations(selectedDestinations.filter(d => d !== dest))} className="hover:text-red-500 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {maxDuration !== 15 && (
                  <span className="inline-flex items-center gap-1.5 bg-primary/8 text-primary text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/15">
                    <Clock className="w-3 h-3" /> Up to {maxDuration} Days
                    <button onClick={() => setMaxDuration(15)}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {maxBudget !== 100000 && (
                  <span className="inline-flex items-center gap-1.5 bg-primary/8 text-primary text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/15">
                    Up to ₹{maxBudget.toLocaleString("en-IN")}
                    <button onClick={() => setMaxBudget(100000)}><X className="w-3 h-3" /></button>
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
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 max-w-[1200px] gap-4 md:gap-5"
                  : "flex flex-col gap-3 md:gap-4"
              )}>
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-slate-200 bg-white p-8 md:p-16 text-center max-w-2xl mx-auto shadow-xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-accent/10 to-transparent rounded-br-full" />
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-5 border border-accent/20">
                  <Compass className="w-8 h-8 text-accent animate-[spin_10s_linear_infinite]" />
                </div>
                <h3 className="text-xl md:text-2xl font-black text-primary tracking-tight mb-3">Unexplored Horizons Await! 🌍</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 max-w-md mx-auto">
                  Our travel curators are currently mapping out hidden gems and elite itineraries for {q ? <strong className="text-primary">"{q}"</strong> : "this route"}. We haven't launched this route yet, but we are boarding soon! In the meantime, let's customize a bespoke experience for you.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/customized-holidays"
                    className="w-full sm:w-auto bg-[#F5A623] hover:bg-yellow-500 text-primary font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all shadow-md active:scale-95"
                  >
                    Request Custom Itinerary
                  </Link>
                  <button
                    onClick={resetFilters}
                    className="w-full sm:w-auto border border-slate-200 hover:border-slate-300 bg-white text-slate-600 font-bold text-xs px-6 py-3.5 rounded-xl transition-all active:scale-95"
                  >
                    Explore Popular Escapes
                  </button>
                </div>
              </motion.div>
            ) : viewMode === "grid" ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 max-w-[1200px] gap-4 md:gap-5"
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
              <div className="flex flex-col gap-3 md:gap-4">
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
