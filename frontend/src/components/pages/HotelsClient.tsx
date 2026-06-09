"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search, MapPin, Building2, SlidersHorizontal, Star, ChevronRight,
  ShieldCheck, X, Filter, Wifi, Coffee, Car, UtensilsCrossed, Waves,
  Dumbbell, ArrowUpDown, Grid3X3, LayoutList, Sparkles, ChevronDown, Check, AlertCircle
} from "lucide-react";
import { cn, validateImageUrl } from "@/lib/utils";
import { getApiUrl } from "@/lib/api-url";

const API_BASE = getApiUrl();

const PROPERTY_TYPES = ["Hotel", "Resort", "Cottage", "Homestay", "Villa", "Camp", "Hostel", "Apartment"];
const STAR_OPTS = [5, 4, 3, 2, 1];
const AMENITY_ICONS: Record<string, any> = {
  WIFI: Wifi, POOL: Waves, RESTAURANT: UtensilsCrossed, PARKING: Car,
  GYM: Dumbbell, SPA: Sparkles, CAFE: Coffee,
};
const SORT_OPTS = [
  { val: "recommended", label: "Recommended" },
  { val: "price_asc", label: "Price: Low to High" },
  { val: "price_desc", label: "Price: High to Low" },
  { val: "rating", label: "Top Rated" },
  { val: "newest", label: "Newly Listed" },
];

interface Hotel {
  id: number;
  name: string;
  slug: string;
  type: string;
  starRating: number;
  address: string;
  city?: string;
  images?: string[];
  amenities?: string[];
  minPrice: number;
  isFeatured: boolean;
  avgRating?: number;
  reviewCount?: number;
  destinationName?: string;
  bookingType?: string;
  breakfastIncluded?: boolean;
  checkInTime?: string;
  checkOutTime?: string;
}

function HotelCard({ hotel }: { hotel: Hotel }) {
  const [imgErr, setImgErr] = useState(false);
  const img = !imgErr && hotel.images?.[0] ? validateImageUrl(hotel.images[0]) : null;

  return (
    <Link href={`/hotels/${hotel.slug}`} className="group block bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1">
      {/* Image — using next/image for lazy loading + WebP optimization */}
      <div className="relative h-52 bg-slate-100 overflow-hidden">
        {img ? (
          <Image
            src={img}
            alt={hotel.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgErr(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <Building2 className="w-12 h-12 text-slate-300" />
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {hotel.isFeatured && (
            <span className="bg-accent text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow">
              ★ Featured
            </span>
          )}
          {hotel.breakfastIncluded && (
            <span className="bg-emerald-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow">
              Breakfast Incl.
            </span>
          )}
        </div>
        {hotel.bookingType === "INSTANT" && (
          <div className="absolute top-3 right-3">
            <span className="bg-blue-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Instant Book
            </span>
          </div>
        )}
        {/* Rating overlay */}
        {hotel.avgRating && (
          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-2.5 py-1.5 flex items-center gap-1 shadow-lg">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-black text-slate-800">{hotel.avgRating}</span>
            {hotel.reviewCount ? <span className="text-[10px] text-slate-400">({hotel.reviewCount})</span> : null}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-3 h-3 ${i < hotel.starRating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
          ))}
          <span className="text-[10px] text-slate-400 ml-1 font-semibold">{hotel.type}</span>
        </div>

        <h3 className="font-black text-slate-900 text-base leading-tight mb-1.5 group-hover:text-primary transition-colors line-clamp-1">
          {hotel.name}
        </h3>

        <div className="flex items-center gap-1 text-slate-400 mb-3">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="text-xs font-medium truncate">
            {hotel.city || hotel.destinationName || hotel.address.slice(0, 30)}
          </span>
        </div>

        {/* Amenities */}
        {hotel.amenities && hotel.amenities.length > 0 && (
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {hotel.amenities.slice(0, 4).map(ame => {
              const Icon = AMENITY_ICONS[ame.toUpperCase()] || null;
              return (
                <span key={ame} className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                  {Icon && <Icon className="w-2.5 h-2.5" />}
                  {ame.charAt(0) + ame.slice(1).toLowerCase()}
                </span>
              );
            })}
            {hotel.amenities.length > 4 && (
              <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                +{hotel.amenities.length - 4}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
          <div>
            {hotel.minPrice ? (
              <>
                <span className="text-xs text-slate-400">From </span>
                <span className="text-lg font-black text-primary">₹{hotel.minPrice.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400 font-medium">/night</span>
              </>
            ) : (
              <span className="text-sm text-slate-400 font-medium">Price on request</span>
            )}
          </div>
          <span className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-full group-hover:bg-primary group-hover:text-white transition-all">
            View <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function FilterSidebar({
  filters,
  onChange,
  onClose,
}: {
  filters: any;
  onChange: (k: string, v: any) => void;
  onClose?: () => void;
}) {
  return (
    <div className="space-y-6">
      {onClose && (
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-black text-slate-900">Filters</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Property Type */}
      <div>
        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Property Type</h4>
        <div className="space-y-2">
          {PROPERTY_TYPES.map(t => (
            <label key={t} className="flex items-center gap-2.5 cursor-pointer group">
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${filters.type === t ? "bg-primary border-primary" : "border-slate-200 group-hover:border-primary"}`}
                onClick={() => onChange("type", filters.type === t ? "" : t)}>
                {filters.type === t && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
              </div>
              <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{t}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Star Rating */}
      <div>
        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Star Rating</h4>
        <div className="space-y-2">
          {STAR_OPTS.map(s => (
            <label key={s} className="flex items-center gap-2.5 cursor-pointer group">
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${filters.starRating === s ? "bg-primary border-primary" : "border-slate-200 group-hover:border-primary"}`}
                onClick={() => onChange("starRating", filters.starRating === s ? "" : s)}>
                {filters.starRating === s && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
              </div>
              <span className="flex items-center gap-1">
                {[...Array(s)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Budget Per Night</h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Under ₹2K", val: "0-2000" },
            { label: "₹2K–5K", val: "2000-5000" },
            { label: "₹5K–10K", val: "5000-10000" },
            { label: "₹10K+", val: "10000-999999" },
          ].map(p => (
            <button key={p.val} onClick={() => onChange("priceRange", filters.priceRange === p.val ? "" : p.val)}
              className={`text-xs font-semibold py-2 px-3 rounded-xl border transition-all ${filters.priceRange === p.val ? "bg-primary text-white border-primary" : "border-slate-200 text-slate-600 hover:border-primary hover:text-primary"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reset */}
      <button onClick={() => { onChange("type", ""); onChange("starRating", ""); onChange("priceRange", ""); }}
        className="w-full text-xs text-slate-500 hover:text-red-500 font-semibold py-2 border border-slate-100 rounded-xl hover:border-red-100 transition-colors">
        Clear All Filters
      </button>
    </div>
  );
}

export default function HotelsClient() {
  const searchParams = useSearchParams();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState("recommended");
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [filters, setFilters] = useState({
    type: searchParams.get("type") || "",
    starRating: searchParams.get("starRating") ? Number(searchParams.get("starRating")) : "",
    priceRange: searchParams.get("priceRange") || "",
  });
  const [page, setPage] = useState(0);
  const LIMIT = 12;

  // ⚡ Debounce search input — only fires API after 350ms of no typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const updateFilter = (k: string, v: any) => { setFilters(f => ({ ...f, [k]: v })); setPage(0); };

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (filters.type) params.set("type", filters.type);
    if (filters.starRating) params.set("starRating", String(filters.starRating));
    if (filters.priceRange) {
      const [min, max] = (filters.priceRange as string).split("-");
      params.set("minPrice", min);
      params.set("maxPrice", max);
    }
    params.set("sort", sort);
    params.set("limit", String(LIMIT));
    params.set("offset", String(page * LIMIT));
    return params.toString();
  }, [debouncedSearch, filters, sort, page]);

  useEffect(() => {
    // ⚡ AbortController — cancels stale in-flight requests
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`${API_BASE}/hotels?${buildQuery()}`, { signal: controller.signal })
      .then(r => r.json())
      .then(d => { setHotels(d.hotels || []); setTotal(d.total || 0); })
      .catch(e => { if (e.name !== "AbortError") setError("Failed to load hotels. Please try again."); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [buildQuery]);


  const destinations = Array.from(new Set(hotels.map(h => h.destinationName || h.city || "Himalayas").filter(Boolean)));
  const activeFilterCount = [filters.type, filters.starRating, filters.priceRange].filter(Boolean).length;

  return (
    <div className="bg-slate-50 min-h-screen pb-32">
      {/* ── Hero ── */}
      <div className="relative bg-[#0A0D17] pt-32 pb-44 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600"
            className="w-full h-full object-cover opacity-30 grayscale-[0.3]" alt="Himalayan stays" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0D17] via-transparent to-[#0A0D17]" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-2 rounded-full border border-white/10">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Himalayan Luxury Collection</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-serif font-black text-white tracking-tighter leading-none italic">
              Extraordinary <span className="text-accent not-italic">Stays.</span>
            </h1>
            <p className="text-slate-300 text-lg font-medium max-w-2xl mx-auto leading-relaxed opacity-80">
              Hotels, Resorts, Cottages, Homestays & more — verified and curated across the Himalayas.
            </p>

            {/* Search Bar */}
            <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-3 shadow-2xl flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                <input placeholder="Search hotel, resort, location..."
                  className="w-full bg-white/5 border-none h-14 pl-14 pr-6 rounded-3xl text-white font-semibold placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                  value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
              </div>
              <button className="h-14 px-10 rounded-3xl bg-accent text-white font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-accent/20">
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters Toolbar ── */}
      <div className="container mx-auto px-4 -mt-10 relative z-20">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Destination quick-filters */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full lg:w-auto pb-1 lg:pb-0">
              <button onClick={() => updateFilter("type", "")}
                className={cn("px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  !filters.type ? "bg-primary text-white shadow-lg" : "bg-slate-50 text-slate-500 hover:bg-slate-100")}>
                All Types
              </button>
              {PROPERTY_TYPES.slice(0, 6).map(t => (
                <button key={t} onClick={() => updateFilter("type", filters.type === t ? "" : t)}
                  className={cn("px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    filters.type === t ? "bg-primary text-white shadow-lg" : "bg-slate-50 text-slate-500 hover:bg-slate-100")}>
                  {t}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-4 w-full lg:w-auto">
              {/* Sort */}
              <div className="relative flex-1 lg:flex-none">
                <select value={sort} onChange={e => setSort(e.target.value)}
                  className="appearance-none pl-4 pr-8 py-2.5 rounded-2xl bg-slate-50 text-slate-600 text-xs font-bold border border-slate-100 focus:outline-none focus:border-primary cursor-pointer">
                  {SORT_OPTS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                </select>
                <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Filter button */}
              <button onClick={() => setShowFilters(!showFilters)}
                className={cn("flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold border transition-all",
                  showFilters ? "bg-primary text-white border-primary" : "bg-slate-50 text-slate-600 border-slate-100 hover:border-primary")}>
                <Filter className="w-3.5 h-3.5" /> Filters
                {activeFilterCount > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* View toggle */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl">
                <button onClick={() => setViewMode("grid")} className={cn("p-2 rounded-lg transition-all", viewMode === "grid" ? "bg-white shadow text-primary" : "text-slate-400")}>
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode("list")} className={cn("p-2 rounded-lg transition-all", viewMode === "list" ? "bg-white shadow text-primary" : "text-slate-400")}>
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="container mx-auto px-4 py-10">
        <div className="flex gap-8">
          {/* Filter Sidebar (desktop) */}
          {showFilters && (
            <div className="hidden lg:block shrink-0 bg-white rounded-3xl border border-slate-100 p-6 self-start sticky top-28" style={{ width: 280 }}>
              <FilterSidebar filters={filters} onChange={updateFilter} />
            </div>
          )}

          {/* Hotel Grid / List */}
          <div className="flex-1 min-w-0">
            {/* Results header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                {loading ? (
                  <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
                ) : (
                  <p className="text-sm font-semibold text-slate-500">
                    <span className="text-slate-900 font-black">{total}</span> properties found
                    {search && <> for "<span className="text-primary">{search}</span>"</>}
                  </p>
                )}
              </div>
            </div>

            {error ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-red-100">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-300" />
                <h3 className="text-lg font-black text-slate-700 mb-2">Something went wrong</h3>
                <p className="text-slate-400 text-sm mb-4">{error}</p>
                <button onClick={() => { setError(""); setPage(0); }}
                  className="px-6 py-2 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary/90 transition-colors">
                  Retry
                </button>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
                    <div className="h-52 bg-slate-100 animate-pulse" />
                    <div className="p-5 space-y-3">
                      <div className="h-5 bg-slate-100 rounded w-3/4 animate-pulse" />
                      <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse" />
                      <div className="h-10 bg-slate-50 rounded-xl animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : hotels.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-slate-200">
                <Building2 className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                <h3 className="text-2xl font-black text-slate-700 mb-2">No properties found</h3>
                <p className="text-slate-400 text-sm mb-6">Try different search terms or clear your filters.</p>
                <button onClick={() => { setSearch(""); setFilters({ type: "", starRating: "", priceRange: "" }); setPage(0); }}
                  className="px-8 py-3 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary/90 transition-colors">
                  Reset Filters
                </button>
              </div>
            ) : (
              <div>
                <div className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                    : "flex flex-col gap-4"
                )}>
                  {hotels.map(hotel => (
                    viewMode === "grid" ? (
                      <HotelCard key={hotel.id} hotel={hotel} />
                    ) : (
                      <Link key={hotel.id} href={`/hotels/${hotel.slug}`}
                        className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all flex gap-0">
                        <div className="w-48 h-36 relative shrink-0 overflow-hidden">
                          {hotel.images?.[0] ? (
                            <Image
                              src={validateImageUrl(hotel.images[0])}
                              alt={hotel.name}
                              fill
                              sizes="192px"
                              className="object-cover group-hover:scale-105 transition-transform"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                              <Building2 className="w-8 h-8 text-slate-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 p-4 flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              {[...Array(5)].map((_, i) => <Star key={i} className={`w-2.5 h-2.5 ${i < hotel.starRating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />)}
                              <span className="text-[10px] text-slate-400 ml-1">{hotel.type}</span>
                            </div>
                            <h3 className="font-black text-slate-900 group-hover:text-primary transition-colors">{hotel.name}</h3>
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" /> {hotel.city || hotel.destinationName}
                            </p>
                            {hotel.amenities && (
                              <div className="flex gap-1 mt-2 flex-wrap">
                                {hotel.amenities.slice(0, 5).map(a => (
                                  <span key={a} className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">{a}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-4 shrink-0">
                            {hotel.minPrice ? (
                              <>
                                <p className="text-xl font-black text-primary">₹{hotel.minPrice.toLocaleString()}</p>
                                <p className="text-[10px] text-slate-400">/night onwards</p>
                              </>
                            ) : (
                              <p className="text-sm text-slate-400">On request</p>
                            )}
                            {hotel.avgRating && (
                              <div className="flex items-center justify-end gap-1 mt-2">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span className="text-xs font-bold">{hotel.avgRating}</span>
                              </div>
                            )}
                            <span className="text-[10px] text-primary font-bold mt-2 inline-block">View Details →</span>
                          </div>
                        </div>
                      </Link>
                    )
                  ))}
                </div>

                {/* Pagination */}
                {total > LIMIT && (
                  <div className="flex items-center justify-center gap-3 mt-10">
                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                      className="px-5 py-2 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:border-primary hover:text-primary disabled:opacity-40 transition-all">
                      ← Previous
                    </button>
                    <span className="text-sm text-slate-500 font-medium">
                      Page {page + 1} of {Math.ceil(total / LIMIT)}
                    </span>
                    <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * LIMIT >= total}
                      className="px-5 py-2 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:border-primary hover:text-primary disabled:opacity-40 transition-all">
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Partner CTA ── */}
      <div className="container mx-auto px-4 mt-8">
        <div className="bg-gradient-to-br from-[#0B1F4E] to-[#1B3A6B] rounded-lg p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 px-4 py-1.5 rounded-full mb-4 text-xs font-bold uppercase tracking-widest">
              <Building2 className="w-3.5 h-3.5 text-accent" /> Property Owners
            </div>
            <h2 className="text-3xl font-black leading-tight mb-2">
              List Your Property on <span className="text-accent">Sampooran Holidays</span>
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Hotels, Resorts, Cottages, Homestays & more. Free to list, no upfront costs.
              Reach 50,000+ monthly travellers planning Himalayan getaways.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <Link href="/partner/register"
              className="px-8 py-4 bg-accent text-white font-black rounded-2xl shadow-xl shadow-amber-500/20 hover:scale-105 transition-all text-center">
              Start for Free →
            </Link>
            <Link href="/partner/login"
              className="px-8 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-2xl hover:bg-white/20 transition-all text-center text-sm">
              Partner Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
