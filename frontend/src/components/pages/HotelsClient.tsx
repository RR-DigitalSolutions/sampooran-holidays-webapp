"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin, Building2, SlidersHorizontal, Star, ChevronRight,
  X, Filter, Wifi, Coffee, Car, UtensilsCrossed, Waves,
  Dumbbell, ChevronDown, Check, AlertCircle, Sparkles, Zap,
  IndianRupee, Shield, Flame, LayoutGrid, LayoutList, Compass,
  Wind, Tv, Bell, Activity
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

const TOP_DESTINATIONS = [
  "Manali", "Kashmir", "Ladakh", "Leh", "Shimla", "Spiti",
  "Rishikesh", "Jaipur", "Goa", "Kerala", "Andaman",
  "Thailand", "Bhutan", "Nepal", "Dubai", "Singapore"
];

function correctTypo(query: string): string {
  const q = query.toLowerCase().trim();
  if (!q) return query;
  for (const dest of TOP_DESTINATIONS) {
    const d = dest.toLowerCase();
    if (d.includes(q) || q.includes(d)) return dest;
    if (stringSimilarity(d, q) >= 0.45) {
      return dest;
    }
  }
  return query;
}
import { cn, getHotelImageUrl } from "@/lib/utils";
import { getApiUrl } from "@/lib/api-url";
import SmartSearchBar from "@/components/SmartSearchBar";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = getApiUrl();

const PROPERTY_TYPES = [
  { label: "All Types", val: "" },
  { label: "Hotel", val: "Hotel" },
  { label: "Resort", val: "Resort" },
  { label: "Cottage", val: "Cottage" },
  { label: "Homestay", val: "Homestay" },
  { label: "Villa", val: "Villa" },
  { label: "Camp", val: "Camp" },
  { label: "Hostel", val: "Hostel" },
  { label: "Apartment", val: "Apartment" },
];

const PRICE_PRESETS = [
  { label: "Any Budget", val: "" },
  { label: "Under ₹2K", val: "0-2000" },
  { label: "₹2K - ₹5K", val: "2000-5000" },
  { label: "₹5K - ₹10K", val: "5000-10000" },
  { label: "₹10K - ₹20K", val: "10000-20000" },
  { label: "₹20K+", val: "20000-999999" },
];

const AMENITY_OPTS = [
  { key: "WIFI", label: "Free WiFi", Icon: Wifi },
  { key: "POOL", label: "Swimming Pool", Icon: Waves },
  { key: "RESTAURANT", label: "Restaurant", Icon: UtensilsCrossed },
  { key: "PARKING", label: "Free Parking", Icon: Car },
  { key: "GYM", label: "Fitness Centre", Icon: Dumbbell },
  { key: "SPA", label: "Spa & Wellness", Icon: Sparkles },
  { key: "CAFE", label: "Café / Bar", Icon: Coffee },
];

const SORT_OPTS = [
  { val: "recommended", label: "Recommended" },
  { val: "price_asc", label: "Price: Low to High" },
  { val: "price_desc", label: "Price: High to Low" },
  { val: "rating", label: "Top Rated" },
  { val: "newest", label: "Newly Listed" },
];

const STAR_OPTS = [5, 4, 3, 2, 1];

interface Hotel {
  id: number;
  name: string;
  slug: string;
  type: string;
  starRating: number;
  address: string;
  city?: string;
  images?: string[];
  primaryImageUrl?: string;
  amenities?: string[];
  highlights?: string[];
  minPrice: number;
  isFeatured: boolean;
  avgRating?: number;
  reviewCount?: number;
  destinationName?: string;
  destinationSlug?: string;
  stateSlug?: string;
  countrySlug?: string;
  customCity?: string;
  bookingType?: string;
  breakfastIncluded?: boolean;
}

interface GeoFilter { country?: string; state?: string; city?: string; }
interface Breadcrumb { label: string; href: string; }

function buildHotelUrl(hotel: Hotel): string {
  const { countrySlug, stateSlug, destinationSlug, customCity } = hotel;
  if (countrySlug && stateSlug && (destinationSlug || customCity)) {
    const cityPart = destinationSlug
      ? `hotels-in-${destinationSlug}`
      : `hotels-in-${(customCity || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    return `/hotels/${countrySlug}/${stateSlug}/${cityPart}/${hotel.slug}`;
  }
  return `/hotels/${hotel.slug}`;
}

function SkeletonCard() {
  return (
    <div className="bg-primary rounded-2xl border border-primary/30 overflow-hidden animate-pulse">
      <div className="h-48 bg-white/5" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-white/10 rounded w-1/3" />
        <div className="h-5 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
        <div className="flex gap-2 pt-2">
          <div className="h-6 bg-white/5 rounded-full w-14" />
          <div className="h-6 bg-white/5 rounded-full w-14" />
        </div>
        <div className="flex justify-between pt-2">
          <div className="h-6 bg-white/10 rounded w-1/3" />
          <div className="h-8 bg-white/10 rounded-full w-16" />
        </div>
      </div>
    </div>
  );
}

// Default fallback highlights shown when hotel has none set
const FALLBACK_HIGHLIGHTS = ["Free Wi-Fi", "In-House Restaurant", "Hot Water 24/7", "Free Parking"];

// Helper to dynamically resolve custom text highlights into matching Lucide icons
const getHighlightIconAndLabel = (text: string) => {
  const normalized = text.toLowerCase();
  
  if (normalized.includes("wifi") || normalized.includes("wi-fi") || normalized.includes("internet") || normalized.includes("wi fi")) {
    return { icon: Wifi, label: text };
  }
  if (normalized.includes("pool") || normalized.includes("swim")) {
    return { icon: Waves, label: text };
  }
  if (normalized.includes("food") || normalized.includes("breakfast") || normalized.includes("restaurant") || normalized.includes("dining") || normalized.includes("meal") || normalized.includes("tea") || normalized.includes("coffee") || normalized.includes("drink") || normalized.includes("kitchen")) {
    return { icon: Coffee, label: text };
  }
  if (normalized.includes("ac") || normalized.includes("air cond") || normalized.includes("cooling")) {
    return { icon: Wind, label: text };
  }
  if (normalized.includes("view") || normalized.includes("valley") || normalized.includes("mountain") || normalized.includes("hill") || normalized.includes("lake") || normalized.includes("river") || normalized.includes("scen") || normalized.includes("forest")) {
    return { icon: Compass, label: text };
  }
  if (normalized.includes("park") || normalized.includes("car") || normalized.includes("valet") || normalized.includes("parking")) {
    return { icon: Car, label: text };
  }
  if (normalized.includes("heat") || normalized.includes("warm") || normalized.includes("fire") || normalized.includes("geyser") || normalized.includes("hot water") || normalized.includes("winter") || normalized.includes("heater")) {
    return { icon: Flame, label: text };
  }
  if (normalized.includes("tv") || normalized.includes("television") || normalized.includes("screen")) {
    return { icon: Tv, label: text };
  }
  if (normalized.includes("service") || normalized.includes("staff") || normalized.includes("bell") || normalized.includes("reception") || normalized.includes("security") || normalized.includes("housekeeping")) {
    return { icon: Bell, label: text };
  }
  if (normalized.includes("spa") || normalized.includes("massag") || normalized.includes("wellness") || normalized.includes("gym") || normalized.includes("fitness")) {
    return { icon: Activity, label: text };
  }
  if (normalized.includes("premium") || normalized.includes("luxury") || normalized.includes("special") || normalized.includes("free") || normalized.includes("best") || normalized.includes("star") || normalized.includes("gold")) {
    return { icon: Sparkles, label: text };
  }
  
  return { icon: Check, label: text };
};

function HotelListingCard({ hotel, priority = false }: { hotel: Hotel; priority?: boolean }) {
  const [imgErr, setImgErr] = useState(false);
  const rawImg = !imgErr ? (hotel.primaryImageUrl || hotel.images?.[0]) : undefined;
  const img = getHotelImageUrl(rawImg, 400, 300, "4:3");
  const hotelUrl = buildHotelUrl(hotel);

  const selectedAmenities = hotel.amenities && hotel.amenities.length > 0
    ? hotel.amenities.slice(0, 4)
    : ["WIFI", "PARKING", "RESTAURANT", "POOL"];

  const displayAmenities = selectedAmenities.map(ame => {
    const keyStr = String(ame).trim().toUpperCase();
    const found = COMPREHENSIVE_AMENITIES.find(a => a.key === keyStr || a.label.toUpperCase() === keyStr);
    if (found) {
      return { icon: found.icon, label: found.label };
    }
    return getHighlightIconAndLabel(String(ame));
  });

  const displayHighlights = hotel.highlights && hotel.highlights.length > 0
    ? hotel.highlights.slice(0, 4)
    : FALLBACK_HIGHLIGHTS;

  return (
    <Link
      href={hotelUrl}
      className="group block bg-primary rounded-2xl border border-primary/30 overflow-hidden hover:shadow-[0_20px_50px_rgba(27,58,107,0.35)] hover:-translate-y-1 transition-all duration-300 card-gpu-fix"
    >
      <div className="relative h-48 bg-slate-950 overflow-hidden shrink-0">
        {img ? (
          <Image
            src={img}
            alt={hotel.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover card-img-zoom"
            onError={() => setImgErr(true)}
            loading={priority ? "eager" : "lazy"}
            priority={priority}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
            <Building2 className="w-10 h-10 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {hotel.isFeatured && (
            <span className="bg-accent text-primary text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow">
              Featured
            </span>
          )}
          {hotel.breakfastIncluded && (
            <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow">
              Breakfast Incl.
            </span>
          )}
        </div>
        {hotel.bookingType === "INSTANT" && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Instant Book
            </span>
          </div>
        )}
        {hotel.avgRating && (
          <div className="absolute bottom-2.5 right-2.5 bg-primary/90 rounded-xl px-2 py-1 flex items-center gap-1 shadow-lg border border-white/10 z-10">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-[11px] font-black text-white">{hotel.avgRating}</span>
            {hotel.reviewCount ? <span className="text-[9px] text-white/40">({hotel.reviewCount})</span> : null}
          </div>
        )}
      </div>
      <div className="p-3 sm:p-3.5 bg-primary text-white">
        <div className="flex items-center gap-0.5 mb-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-2.5 h-2.5 ${i < hotel.starRating ? "fill-amber-400 text-amber-400" : "text-white/20"}`} />
          ))}
          <span className="text-[9px] text-white/40 ml-1 font-semibold">{hotel.type}</span>
        </div>
        <h3 className="font-black text-white text-sm leading-tight mb-1 group-hover:text-accent transition-colors line-clamp-1">
          {hotel.name}
        </h3>
        <div className="flex items-center gap-1 text-white/50 mb-2">
          <MapPin className="w-3 h-3 shrink-0 text-accent" />
          <span className="text-[11px] font-medium truncate">
            {hotel.city || hotel.destinationName || hotel.address.slice(0, 30)}
          </span>
        </div>
        {displayAmenities && displayAmenities.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-2 whitespace-nowrap w-full scroll-smooth touch-pan-x">
            {displayAmenities.map((info, idx) => {
              const Icon = info.icon;
              return (
                <span key={idx} className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 text-white bg-white/10 hover:bg-white/20 rounded-full border border-white/10 shrink-0 select-none transition-colors" title={info.label}>
                  {Icon && <Icon className="w-3.5 h-3.5 text-accent" />}
                </span>
              );
            })}
          </div>
        )}

        {/* Hotel Highlights */}
        {displayHighlights && displayHighlights.length > 0 && (
          <div className="space-y-0.5 mb-2.5">
            <p className="text-[7.5px] sm:text-[8px] font-semibold text-accent px-0.5 mb-0.5 uppercase tracking-wider font-sans">Hotel Highlights</p>
            <div className="grid grid-cols-1 gap-0.5 px-0.5">
              {displayHighlights.map((h, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[8.5px] sm:text-[9.5px] text-white/95 font-medium leading-tight">
                  <div className="w-1 h-1 rounded-full bg-accent mt-1.5 shrink-0" />
                  <span className="line-clamp-1">{h}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div>
            {hotel.minPrice ? (
              <>
                <span className="text-[10px] text-white/40">From </span>
                <span className="text-base font-black text-white">₹{hotel.minPrice.toLocaleString()}</span>
                <span className="text-[9px] text-white/40 font-medium">/night</span>
              </>
            ) : (
              <span className="text-xs text-white/40">Price on request</span>
            )}
          </div>
          <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-accent px-2.5 py-1.5 rounded-full group-hover:bg-white transition-all">
            View <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 pb-3 mb-3 last:border-0 last:mb-0 last:pb-0">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 mb-2">{title}</p>
      {children}
    </div>
  );
}

interface FilterState {
  type: string;
  starRating: string | number;
  priceRange: string;
  amenities: string[];
  bookingType: string;
  breakfastIncluded: string | boolean;
  isFeatured: string | boolean;
}

function FilterContent({
  filters,
  sort,
  onFilter,
  onSort,
  onReset,
  hasFilters,
}: {
  filters: FilterState;
  sort: string;
  onFilter: (k: string, v: any) => void;
  onSort: (v: string) => void;
  onReset: () => void;
  hasFilters: boolean;
}) {
  return (
    <div>
      <FilterSection title="Sort By">
        <div className="space-y-0.5">
          {SORT_OPTS.map(o => (
            <button
              key={o.val}
              onClick={() => onSort(o.val)}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                sort === o.val ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {o.label}
              {sort === o.val && <Check className="w-3 h-3" />}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Property Type">
        <div className="space-y-0.5">
          {PROPERTY_TYPES.map(t => (
            <button
              key={t.val}
              onClick={() => onFilter("type", filters.type === t.val ? "" : t.val)}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                filters.type === t.val ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              {t.label}
              {filters.type === t.val && <Check className="w-3 h-3" />}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Star Rating">
        <div className="space-y-0.5">
          <button
            onClick={() => onFilter("starRating", "")}
            className={cn(
              "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
              !filters.starRating ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            Any Rating {!filters.starRating && <Check className="w-3 h-3" />}
          </button>
          {STAR_OPTS.map(s => (
            <button
              key={s}
              onClick={() => onFilter("starRating", filters.starRating === s ? "" : s)}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all",
                filters.starRating === s ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <span className="flex items-center gap-1">
                {[...Array(s)].map((_, i) => (
                  <Star key={i} className={`w-3 h-3 ${filters.starRating === s ? "fill-amber-300 text-amber-300" : "fill-amber-400 text-amber-400"}`} />
                ))}
                <span className="text-xs font-semibold ml-0.5">{s} Star{s > 1 ? "s" : ""}</span>
              </span>
              {filters.starRating === s && <Check className="w-3 h-3" />}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Budget Per Night">
        <div className="space-y-0.5">
          {PRICE_PRESETS.map(p => (
            <button
              key={p.val}
              onClick={() => onFilter("priceRange", filters.priceRange === p.val ? "" : p.val)}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                filters.priceRange === p.val ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              {p.label}
              {filters.priceRange === p.val && <Check className="w-3 h-3" />}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Amenities">
        <div className="space-y-0.5">
          {AMENITY_OPTS.map(({ key, label, Icon }) => {
            const active = (filters.amenities as string[]).includes(key);
            return (
              <button
                key={key}
                onClick={() => {
                  const cur = filters.amenities as string[];
                  onFilter("amenities", active ? cur.filter((a: string) => a !== key) : [...cur, key]);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  active ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5 shrink-0", active ? "text-accent" : "text-slate-400")} />
                <span className="flex-1 text-left">{label}</span>
                {active && <Check className="w-3 h-3 shrink-0" />}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Special Offers">
        <div className="space-y-0.5">
          {[
            { key: "bookingType", val: "INSTANT", label: "Instant Booking", Icon: Zap },
            { key: "breakfastIncluded", val: true, label: "Breakfast Included", Icon: Coffee },
            { key: "isFeatured", val: true, label: "Featured Properties", Icon: Flame },
          ].map(({ key, val, label, Icon }) => {
            const active = filters[key as keyof FilterState] === val;
            return (
              <button
                key={key}
                onClick={() => onFilter(key, active ? "" : val)}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  active ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5 shrink-0", active ? "text-accent" : "text-slate-400")} />
                <span className="flex-1 text-left">{label}</span>
                {active && <Check className="w-3 h-3 shrink-0" />}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <div className="rounded-xl bg-gradient-to-br from-primary via-[#0D1B3E] to-[#0B1528] p-3 text-white mt-2">
        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-accent mb-1.5">Why Book With Us</p>
        <div className="space-y-1.5">
          {[
            { Icon: Shield, text: "Verified properties only" },
            { Icon: Zap, text: "Instant booking confirmation" },
            { Icon: IndianRupee, text: "Best price guaranteed" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                <item.Icon className="w-2.5 h-2.5 text-accent" />
              </div>
              <p className="text-white/80 text-[10px] font-medium leading-tight">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={onReset}
          className="w-full text-xs font-bold text-red-500 hover:text-red-600 py-2 mt-3 border border-red-100 rounded-lg hover:border-red-200 transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
}

export default function HotelsClient({
  geoFilter: geoFilterProp,
  pageTitle,
  pageSubtitle,
  breadcrumbs,
  cityInfo,
}: {
  geoFilter?: GeoFilter;
  pageTitle?: string;
  pageSubtitle?: string;
  breadcrumbs?: Breadcrumb[];
  cityInfo?: any;
} = {}) {
  const searchParams = useSearchParams();

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sort, setSort] = useState("recommended");
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [filters, setFilters] = useState<FilterState>({
    type: searchParams.get("type") || "",
    starRating: searchParams.get("starRating") ? Number(searchParams.get("starRating")) : "",
    priceRange: searchParams.get("priceRange") || "",
    amenities: [],
    bookingType: "",
    breakfastIncluded: "",
    isFeatured: "",
  });
  const [page, setPage] = useState(0);
  const LIMIT = 12;

  const geoFilter = useMemo(() => geoFilterProp, [
    geoFilterProp?.country, geoFilterProp?.state, geoFilterProp?.city,
  ]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const updateFilter = useCallback((k: string, v: any) => {
    setFilters(f => ({ ...f, [k]: v }));
    setPage(0);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ type: "", starRating: "", priceRange: "", amenities: [], bookingType: "", breakfastIncluded: "", isFeatured: "" });
    setSort("recommended");
    setSearch("");
    setPage(0);
  }, []);

  const hasFilters = !!(
    filters.type || filters.starRating || filters.priceRange ||
    filters.amenities.length > 0 || filters.bookingType ||
    filters.breakfastIncluded || filters.isFeatured || debouncedSearch
  );
  const activeFilterCount = [
    filters.type, filters.starRating, filters.priceRange,
    filters.amenities.length > 0, filters.bookingType,
    filters.breakfastIncluded, filters.isFeatured,
  ].filter(Boolean).length;

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    const queryToUse = correctTypo(debouncedSearch);
    if (queryToUse) params.set("q", queryToUse);
    if (filters.type) params.set("type", filters.type);
    if (filters.starRating) params.set("starRating", String(filters.starRating));
    if (filters.priceRange) {
      const [min, max] = (filters.priceRange as string).split("-");
      params.set("minPrice", min);
      params.set("maxPrice", max);
    }
    if (filters.bookingType) params.set("bookingType", filters.bookingType as string);
    if (filters.breakfastIncluded) params.set("breakfastIncluded", "true");
    if (filters.isFeatured) params.set("isFeatured", "true");
    if (filters.amenities.length > 0) params.set("amenities", filters.amenities.join(","));
    if (geoFilter?.country) params.set("country", geoFilter.country);
    if (geoFilter?.state && geoFilter.state !== "all") params.set("state", geoFilter.state);
    if (geoFilter?.city) params.set("city", geoFilter.city);
    params.set("sort", sort);
    params.set("limit", String(LIMIT));
    params.set("offset", String(page * LIMIT));
    return params.toString();
  }, [debouncedSearch, filters, sort, page, geoFilter?.country, geoFilter?.state, geoFilter?.city]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const endpoint = geoFilter
      ? `${API_BASE}/hotels/by-location?${buildQuery()}`
      : `${API_BASE}/hotels?${buildQuery()}`;
    fetch(endpoint, { signal: controller.signal, cache: "no-store" })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { setHotels(d.hotels || []); setTotal(d.total || 0); })
      .catch(e => { if (e.name !== "AbortError") setError("Failed to load hotels. Please try again."); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildQuery]);

  const activeChips: { label: string; onRemove: () => void }[] = [
    ...(filters.type ? [{ label: filters.type, onRemove: () => updateFilter("type", "") }] : []),
    ...(filters.starRating ? [{ label: `${filters.starRating} Stars`, onRemove: () => updateFilter("starRating", "") }] : []),
    ...(filters.priceRange ? [{ label: PRICE_PRESETS.find(p => p.val === filters.priceRange)?.label || (filters.priceRange as string), onRemove: () => updateFilter("priceRange", "") }] : []),
    ...filters.amenities.map((a: string) => ({
      label: AMENITY_OPTS.find(o => o.key === a)?.label || a,
      onRemove: () => updateFilter("amenities", filters.amenities.filter((x: string) => x !== a)),
    })),
    ...(filters.bookingType ? [{ label: "Instant Book", onRemove: () => updateFilter("bookingType", "") }] : []),
    ...(filters.breakfastIncluded ? [{ label: "Breakfast Incl.", onRemove: () => updateFilter("breakfastIncluded", "") }] : []),
    ...(filters.isFeatured ? [{ label: "Featured", onRemove: () => updateFilter("isFeatured", "") }] : []),
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-28">

      {/* Hero */}
      <div className="relative bg-[#0A0D17] pt-24 pb-20 md:pt-36 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={cityInfo?.imageUrl || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600"}
            className="w-full h-full object-cover opacity-30 grayscale-[0.3]"
            alt={pageTitle || "Himalayan stays"}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0D17] via-transparent to-[#0A0D17]" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center justify-center gap-1.5 text-[9px] sm:text-[10px] text-white/40 uppercase tracking-widest font-black mb-6">
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.href} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight className="w-3 h-3 text-white/20" />}
                  {i === breadcrumbs.length - 1 ? (
                    <span className="text-white/70">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-white/70 transition-colors">{crumb.label}</Link>
                  )}
                </span>
              ))}
            </nav>
          )}
          <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-2 rounded-full border border-white/10">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">
                {pageSubtitle || "Himalayan Luxury Collection"}
              </span>
            </div>
            <h1 className="text-2xl xs:text-3xl md:text-5xl lg:text-6xl font-serif font-black text-white tracking-tight leading-none">
              {pageTitle ? (
                <>{pageTitle.split(" ").slice(0, -1).join(" ")} <span className="text-accent not-italic">{pageTitle.split(" ").slice(-1)[0]}.</span></>
              ) : (
                <>Extraordinary <span className="text-accent not-italic">Stays.</span></>
              )}
            </h1>
            <p className="text-slate-300 text-xs xs:text-sm md:text-base leading-relaxed opacity-80 max-w-xl mx-auto">
              {cityInfo?.description
                ? cityInfo.description.slice(0, 180)
                : "Hotels, Resorts, Cottages, Homestays & more — verified and curated across the Himalayas."}
            </p>
            <div className="max-w-2xl mx-auto">
              <SmartSearchBar
                placeholder="Search hotel, destination, resort..."
                geoFilter={geoFilter}
                variant="hero"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="flex gap-5 items-start">

          {/* Desktop Sticky Sidebar */}
          <aside className="hidden lg:block w-[248px] shrink-0 sticky top-28 self-start">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-primary" />
                  <h2 className="text-sm font-bold text-slate-900">Filter Hotels</h2>
                  {activeFilterCount > 0 && (
                    <span className="bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
                  )}
                </div>
                {hasFilters && (
                  <button onClick={resetFilters} className="text-xs font-semibold text-primary hover:underline">
                    Reset
                  </button>
                )}
              </div>
              <div className="p-3.5 max-h-[calc(100vh-180px)] overflow-y-auto no-scrollbar">
                <FilterContent
                  filters={filters}
                  sort={sort}
                  onFilter={updateFilter}
                  onSort={setSort}
                  onReset={resetFilters}
                  hasFilters={hasFilters}
                />
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">

            {/* Results toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                {loading ? (
                  <div className="h-6 w-40 bg-slate-200 rounded animate-pulse" />
                ) : (
                  <span className="text-lg font-bold text-slate-900">
                    {total} <span className="text-slate-500 font-normal text-base">properties found</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Mobile filter btn */}
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold"
                >
                  <Filter className="w-3.5 h-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="w-4 h-4 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center">{activeFilterCount}</span>
                  )}
                </button>

                {/* Sort desktop */}
                <div className="hidden lg:block relative">
                  <select
                    value={sort}
                    onChange={e => { setSort(e.target.value); setPage(0); }}
                    className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    {SORT_OPTS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>

                {/* View toggle */}
                <div className="hidden sm:flex items-center rounded-lg border border-slate-200 overflow-hidden bg-white">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn("p-2 transition-colors", viewMode === "grid" ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50")}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn("p-2 transition-colors", viewMode === "list" ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50")}
                  >
                    <LayoutList className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {activeChips.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {activeChips.map((chip, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/20">
                    {chip.label}
                    <button onClick={chip.onRemove} className="hover:text-red-500 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <button onClick={resetFilters} className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors px-2">
                  Clear all
                </button>
              </div>
            )}

            {/* Grid / List / Empty / Error */}
            {error ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-red-100">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-300" />
                <h3 className="text-lg font-black text-slate-700 mb-2">Something went wrong</h3>
                <p className="text-slate-400 text-sm mb-4">{error}</p>
                <button onClick={() => { setError(""); setPage(0); }} className="px-6 py-2 bg-primary text-white rounded-2xl font-bold text-sm">Retry</button>
              </div>
            ) : loading ? (
              <div className={cn(viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" : "flex flex-col gap-3")}>
                {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : hotels.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 md:p-16 text-center max-w-2xl mx-auto shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-accent/10 to-transparent rounded-br-full" />
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-5 border border-accent/20">
                  <Compass className="w-8 h-8 text-accent animate-[spin_10s_linear_infinite]" />
                </div>
                <h3 className="text-xl md:text-2xl font-black text-primary tracking-tight mb-3">Unexplored Horizons Await! 🌍</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 max-w-md mx-auto">
                  Our travel curators are currently mapping out unique stays and boutique hotels in {debouncedSearch ? <strong className="text-primary">"{debouncedSearch}"</strong> : "this destination"}. We haven't launched this route yet, but we are boarding soon! In the meantime, let's customize a bespoke experience for you.
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
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {hotels.map((hotel, idx) => (
                  <HotelListingCard key={hotel.id} hotel={hotel} priority={idx < 3} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {hotels.map(hotel => {
                  const selectedAmenities = hotel.amenities && hotel.amenities.length > 0
                    ? hotel.amenities.slice(0, 4)
                    : ["WIFI", "PARKING", "RESTAURANT", "POOL"];

                  const displayAmenities = selectedAmenities.map(ame => {
                    const keyStr = String(ame).trim().toUpperCase();
                    const found = COMPREHENSIVE_AMENITIES.find(a => a.key === keyStr || a.label.toUpperCase() === keyStr);
                    if (found) {
                      return { icon: found.icon, label: found.label };
                    }
                    return getHighlightIconAndLabel(String(ame));
                  });

                  const displayHighlights = hotel.highlights && hotel.highlights.length > 0
                    ? hotel.highlights.slice(0, 4)
                    : FALLBACK_HIGHLIGHTS;

                  return (
                    <Link
                      key={hotel.id}
                      href={buildHotelUrl(hotel)}
                      className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all flex"
                    >
                      <div className="w-36 sm:w-48 h-32 sm:h-36 relative shrink-0 overflow-hidden">
                        <Image
                          src={getHotelImageUrl(hotel.primaryImageUrl || hotel.images?.[0], 400, 300, "4:3")}
                          alt={hotel.name}
                          fill
                          sizes="192px"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 p-3 sm:p-4 flex justify-between items-start min-w-0">
                        <div className="min-w-0">
                          <div className="flex items-center gap-0.5 mb-1">
                            {[...Array(5)].map((_, i) => <Star key={i} className={`w-2.5 h-2.5 ${i < hotel.starRating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />)}
                            <span className="text-[9px] text-slate-400 ml-1">{hotel.type}</span>
                          </div>
                          <h3 className="font-black text-slate-900 group-hover:text-primary transition-colors text-sm leading-tight line-clamp-1">{hotel.name}</h3>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 mb-2">
                            <MapPin className="w-3 h-3 shrink-0 text-accent" /> {hotel.city || hotel.destinationName}
                          </p>

                          {/* Selected Amenities (icons only row) */}
                          {displayAmenities && displayAmenities.length > 0 && (
                            <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-2 pb-0.5 whitespace-nowrap w-full">
                              {displayAmenities.map((info, idx) => {
                                const Icon = info.icon;
                                return (
                                  <span key={idx} className="inline-flex items-center justify-center w-6 h-6 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-150 shrink-0 select-none transition-colors" title={info.label}>
                                    {Icon && <Icon className="w-3.5 h-3.5 text-[#1B3A6B]" />}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {/* Hotel Highlights (packages style bullet list) */}
                          {displayHighlights && displayHighlights.length > 0 && (
                            <div className="space-y-0.5">
                              <p className="text-[7.5px] sm:text-[8px] font-semibold text-accent uppercase tracking-wider">Hotel Highlights</p>
                              <div className="grid grid-cols-1 gap-0.5">
                                {displayHighlights.map((h, i) => (
                                  <div key={i} className="flex items-start gap-1.5 text-[8.5px] sm:text-[9px] text-slate-600 font-medium leading-tight">
                                    <div className="w-1 h-1 rounded-full bg-accent mt-1.5 shrink-0" />
                                    <span className="line-clamp-1">{h}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-3 shrink-0">
                          {hotel.minPrice ? (
                            <>
                              <p className="text-lg font-black text-primary">₹{hotel.minPrice.toLocaleString()}</p>
                              <p className="text-[10px] text-slate-400">/night onwards</p>
                            </>
                          ) : <p className="text-sm text-slate-400">On request</p>}
                          {hotel.avgRating && (
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span className="text-xs font-bold">{hotel.avgRating}</span>
                            </div>
                          )}
                          <span className="text-[10px] text-primary font-bold mt-1.5 inline-block">View Details</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {!loading && total > LIMIT && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-5 py-2 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:border-primary hover:text-primary disabled:opacity-40 transition-all"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-500 font-medium">Page {page + 1} of {Math.ceil(total / LIMIT)}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={(page + 1) * LIMIT >= total}
                  className="px-5 py-2 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:border-primary hover:text-primary disabled:opacity-40 transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Partner CTA */}
      <div className="container mx-auto px-4 mt-8">
        <div className="bg-gradient-to-br from-[#0B1F4E] to-[#1B3A6B] rounded-lg p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 px-4 py-1.5 rounded-full mb-4 text-xs font-bold uppercase tracking-widest">
              <Building2 className="w-3.5 h-3.5 text-accent" /> Property Owners
            </div>
            <h2 className="text-2xl sm:text-3xl font-black leading-tight mb-2">
              List Your Property on <span className="text-accent">Sampooran Holidays</span>
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Hotels, Resorts, Cottages, Homestays and more. Free to list, no upfront costs.
              Reach 50,000+ monthly travellers planning Himalayan getaways.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <Link href="/partner/register" className="px-8 py-4 bg-accent text-white font-black rounded-2xl shadow-xl shadow-amber-500/20 hover:scale-105 transition-all text-center">
              Start for Free
            </Link>
            <Link href="/partner/login" className="px-8 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-2xl hover:bg-white/20 transition-all text-center text-sm">
              Partner Login
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      <div className="fixed bottom-20 right-4 z-40 lg:hidden">
        {!mobileFilterOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setMobileFilterOpen(true)}
            className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-4 py-3 rounded-full shadow-xl shadow-primary/30 border border-white/10"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-accent text-primary text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center">{activeFilterCount}</span>
            )}
          </motion.button>
        )}
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFilterOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
            />
            <motion.div
              key="drawer"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl shadow-2xl lg:hidden max-h-[88vh] flex flex-col"
            >
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 bg-slate-200 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-bold text-slate-900">Filter Hotels</h2>
                  {activeFilterCount > 0 && (
                    <span className="bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
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
              <div className="overflow-y-auto flex-1 px-5 py-4">
                <FilterContent
                  filters={filters}
                  sort={sort}
                  onFilter={updateFilter}
                  onSort={v => { setSort(v); setPage(0); }}
                  onReset={resetFilters}
                  hasFilters={hasFilters}
                />
              </div>
              <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full bg-primary text-white font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-primary/20"
                >
                  Show {total} Properties
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
