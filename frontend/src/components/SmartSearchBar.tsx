"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, MapPin, Building2, Map, X, ArrowRight, Loader2 } from "lucide-react";
import { getApiUrl } from "@/lib/api-url";
import { getHotelImageUrl } from "@/lib/utils";

const API_BASE = getApiUrl();

interface SearchHotel {
  id: number;
  name: string;
  slug: string;
  type: string;
  starRating: number;
  city?: string;
  minPrice: number;
  isFeatured: boolean;
  countrySlug?: string;
  stateSlug?: string;
  destinationSlug?: string;
  destinationName?: string;
  primaryImageUrl?: string;
  avgRating?: number;
}

interface SearchSuggestion {
  type: "destination" | "state";
  name: string;
  subtitle: string;
  href: string;
}

interface SearchResult {
  hotels: SearchHotel[];
  suggestions: SearchSuggestion[];
  query: string;
}

interface SmartSearchBarProps {
  placeholder?: string;
  geoFilter?: { country?: string; state?: string; city?: string };
  className?: string;
  variant?: "hero" | "inline" | "compact";
}

function buildHotelUrl(hotel: SearchHotel): string {
  if (hotel.countrySlug && hotel.stateSlug && hotel.destinationSlug) {
    return `/hotels/${hotel.countrySlug}/${hotel.stateSlug}/hotels-in-${hotel.destinationSlug}/${hotel.slug}`;
  }
  return `/hotels/${hotel.slug}`;
}

export default function SmartSearchBar({
  placeholder = "Search hotels, destinations, resorts…",
  geoFilter,
  className = "",
  variant = "inline",
}: SmartSearchBarProps) {
  const router = useRouter();
  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState<SearchResult | null>(null);
  const [loading, setLoading]       = useState(false);
  const [open, setOpen]             = useState(false);
  const [activeIdx, setActiveIdx]   = useState(-1);
  const inputRef   = useRef<HTMLInputElement>(null);
  const dropRef    = useRef<HTMLDivElement>(null);
  const debounceId = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Fetch search results ─────────────────────────────────────────────────
  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, limit: "6" });
      if (geoFilter?.country) params.set("country", geoFilter.country);
      if (geoFilter?.state)   params.set("state", geoFilter.state);

      const res = await fetch(`${API_BASE}/search/hotels?${params}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error("Search failed");
      const data: SearchResult = await res.json();
      setResults(data);
      setOpen(true);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [geoFilter?.country, geoFilter?.state]);

  // ── Debounce input ───────────────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(debounceId.current);
    if (query.trim().length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }
    debounceId.current = setTimeout(() => search(query), 200);
    return () => clearTimeout(debounceId.current);
  }, [query, search]);

  // ── Close on outside click ───────────────────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropRef.current && !dropRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Keyboard navigation ──────────────────────────────────────────────────
  const allItems = [
    ...(results?.suggestions || []),
    ...(results?.hotels || []),
  ];

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && activeIdx < results!.suggestions.length) {
        router.push(results!.suggestions[activeIdx].href);
        setOpen(false);
      } else if (activeIdx >= (results?.suggestions.length || 0)) {
        const hotelIdx = activeIdx - (results?.suggestions.length || 0);
        const hotel = results!.hotels[hotelIdx];
        if (hotel) { router.push(buildHotelUrl(hotel)); setOpen(false); }
      } else {
        // Submit full search
        if (query.trim()) {
          router.push(`/hotels?q=${encodeURIComponent(query.trim())}`);
          setOpen(false);
        }
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const hasResults = results && (results.hotels.length > 0 || results.suggestions.length > 0);

  return (
    <div className={`relative ${className}`}>
      {/* Input */}
      <div className={`relative flex items-center bg-white rounded-2xl shadow-lg border-2 transition-all ${
        open ? "border-primary shadow-primary/20" : "border-transparent shadow-slate-200/80"
      } ${variant === "hero" ? "h-16" : "h-12"}`}>
        <div className="pl-4 text-slate-400 shrink-0">
          {loading
            ? <Loader2 className="w-5 h-5 animate-spin text-primary" />
            : <Search className={`${variant === "hero" ? "w-6 h-6" : "w-5 h-5"} text-slate-400`} />
          }
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveIdx(-1); setOpen(true); }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`flex-1 bg-transparent outline-none px-3 text-slate-800 placeholder:text-slate-400 ${
            variant === "hero" ? "text-lg font-medium" : "text-sm font-medium"
          }`}
          autoComplete="off"
          spellCheck={false}
          aria-autocomplete="list"
          aria-controls="search-dropdown"
          aria-expanded={open}
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults(null); setOpen(false); inputRef.current?.focus(); }}
            className="px-3 text-slate-300 hover:text-slate-500 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {variant === "hero" && (
          <button
            onClick={() => { if (query.trim()) router.push(`/hotels?q=${encodeURIComponent(query.trim())}`); }}
            className="shrink-0 mr-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            Search <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && hasResults && (
        <div
          ref={dropRef}
          id="search-dropdown"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl shadow-slate-200/60 border border-slate-100 z-50 overflow-hidden"
        >
          {/* Destination / State suggestions */}
          {results!.suggestions.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 pt-3 pb-1">
                Destinations
              </p>
              {results!.suggestions.map((s, idx) => (
                <button
                  key={`${s.type}-${idx}`}
                  role="option"
                  aria-selected={activeIdx === idx}
                  onClick={() => { router.push(s.href); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left ${
                    activeIdx === idx ? "bg-primary/5" : ""
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    s.type === "destination" ? "bg-blue-50" : "bg-purple-50"
                  }`}>
                    {s.type === "destination"
                      ? <MapPin className="w-4 h-4 text-blue-500" />
                      : <Map className="w-4 h-4 text-purple-500" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{s.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{s.subtitle}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 ml-auto shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Hotel results */}
          {results!.hotels.length > 0 && (
            <div className={results!.suggestions.length > 0 ? "border-t border-slate-50" : ""}>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 pt-3 pb-1">
                Properties
              </p>
              {results!.hotels.map((hotel, idx) => {
                const globalIdx = (results?.suggestions.length || 0) + idx;
                const imgUrl = getHotelImageUrl(hotel.primaryImageUrl || undefined, 80, 60, "4:3");
                const isSvg = imgUrl.startsWith("data:");
                return (
                  <button
                    key={hotel.id}
                    role="option"
                    aria-selected={activeIdx === globalIdx}
                    onClick={() => { router.push(buildHotelUrl(hotel)); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left ${
                      activeIdx === globalIdx ? "bg-primary/5" : ""
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-10 rounded-xl overflow-hidden shrink-0 bg-slate-100 relative">
                      {!isSvg ? (
                        <Image
                          src={imgUrl}
                          alt={hotel.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 truncate">{hotel.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {hotel.city || hotel.destinationName} · {hotel.type}
                        {hotel.minPrice ? ` · ₹${hotel.minPrice.toLocaleString()}/night` : ""}
                      </p>
                    </div>
                    {hotel.isFeatured && (
                      <span className="shrink-0 text-[9px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">
                        Featured
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* View all results */}
          <div className="border-t border-slate-50 px-4 py-2.5">
            <button
              onClick={() => { router.push(`/hotels?q=${encodeURIComponent(query.trim())}`); setOpen(false); }}
              className="w-full text-center text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              View all results for "{query}"
            </button>
          </div>
        </div>
      )}

      {/* No results */}
      {open && query.length >= 2 && !loading && results && !hasResults && (
        <div
          ref={dropRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 px-4 py-6 text-center"
        >
          <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-200" />
          <p className="text-sm font-semibold text-slate-500">No results for "{query}"</p>
          <p className="text-xs text-slate-400 mt-1">Try "Manali", "Shimla resort", or "boutique hotel"</p>
        </div>
      )}
    </div>
  );
}
