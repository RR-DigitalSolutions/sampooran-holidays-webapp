"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Calendar, MapPin, Loader2, Star, Clock, Filter, SlidersHorizontal, Search, Info, X, Mountain, Activity, Sparkles, ShieldCheck, Utensils, Compass, LayoutGrid, List as ListIcon, BookOpen, Globe, CloudSun, Bus, CreditCard, MessageCircle, Heart, PhoneCall, ShoppingBag, Briefcase, ChevronDown, HelpCircle, ChevronLeft, Quote, Hotel, Car, Bed, Binoculars, ArrowDown, Camera, User, Headset, IndianRupee, Check, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PackageCard } from "@/components/PackageCard";
import { Youtube } from "lucide-react";
import { cn, validateImageUrl, getYouTubeId } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

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
            : "bg-white border border-slate-205 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg hover:border-primary/40 focus:ring-2 focus:ring-accent/40 font-medium"
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
          <button
            type="button"
            onClick={() => {
              onChange([]);
              setIsOpen(false);
            }}
            className="w-full flex items-center justify-between px-2 py-1.5 text-left text-xs font-semibold rounded-md hover:bg-slate-50 transition-colors text-slate-700"
          >
            <span>All Places</span>
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

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 pb-2 mb-2 last:border-0 last:mb-0 last:pb-0">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 mb-1">{title}</p>
      {children}
    </div>
  );
}


export function PackageListingPage({ entityType, entityData, searchParams }: { entityType: string, entityData: any, searchParams: any }) {
  const router = useRouter();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const placesContainerRef = useRef<HTMLDivElement>(null);

  const scrollPlacesLeft = () => {
    if (placesContainerRef.current) {
      placesContainerRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  };

  const scrollPlacesRight = () => {
    if (placesContainerRef.current) {
      placesContainerRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  const [childPlaces, setChildPlaces] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [activeTab, setActiveTab] = useState("cities");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [showDetails, setShowDetails] = useState(false);

  // Dynamic filter states
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [maxBudget, setMaxBudget] = useState(100000);
  const [maxDuration, setMaxDuration] = useState(15);
  const [selectedTheme, setSelectedTheme] = useState("All");
  const [minRating, setMinRating] = useState(0);
  const [citySearch, setCitySearch] = useState("");
  const [showAllCities, setShowAllCities] = useState(false);
  const [sortBy, setSortBy] = useState("Popularity");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setHeaderScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleCity = (city: string) => {
    setSelectedCities(prev =>
      prev.includes(city) ? prev.filter(x => x !== city) : [...prev, city]
    );
  };

  const resetFilters = () => {
    setSelectedCities([]);
    setMaxBudget(100000);
    setMaxDuration(15);
    setSelectedTheme("All");
    setMinRating(0);
    setCitySearch("");
    setShowAllCities(false);
  };

  const hasFilters = selectedCities.length > 0 || maxBudget !== 100000 || maxDuration !== 15 || selectedTheme !== "All" || minRating > 0;

  const activeFilterCount = [
    selectedCities.length > 0,
    maxBudget !== 100000,
    maxDuration !== 15,
    selectedTheme !== "All",
    minRating > 0,
  ].filter(Boolean).length;

  // Extract all available cities from the packages loaded on the page
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    packages.forEach(p => {
      const citiesList = p.cities || (p.destinationName ? [p.destinationName] : []);
      citiesList.forEach((c: string) => {
        if (c && c.trim()) {
          set.add(c.trim());
        }
      });
    });
    return Array.from(set).sort();
  }, [packages]);

  // Compute package counts per city from original packages
  const cityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    packages.forEach(p => {
      const citiesList = p.cities || (p.destinationName ? [p.destinationName] : []);
      const uniqueInPkg = new Set<string>(citiesList.map((c: any) => c.trim()).filter(Boolean));
      uniqueInPkg.forEach((c) => {
        counts[c] = (counts[c] || 0) + 1;
      });
    });
    return counts;
  }, [packages]);

  // Filter available cities by the search query
  const displayedCities = useMemo(() => {
    if (!citySearch.trim()) return availableCities;
    const lowerQuery = citySearch.toLowerCase().trim();
    return availableCities.filter(c => c.toLowerCase().includes(lowerQuery));
  }, [availableCities, citySearch]);

  const visibleCitiesList = useMemo(() => {
    if (showAllCities || citySearch.trim()) {
      return displayedCities;
    }
    return displayedCities.slice(0, 5);
  }, [displayedCities, showAllCities, citySearch]);

  const availableDestinations = useMemo(() => {
    return availableCities.map(name => ({
      name,
      count: cityCounts[name] || 0
    }));
  }, [availableCities, cityCounts]);

  const FilterContent = (
    <div className="space-y-0">
      {availableCities.length > 0 && (
        <FilterSection title="Cities / Places">
          <MultiSelectDropdown
            options={availableDestinations}
            selected={selectedCities}
            onChange={setSelectedCities}
            placeholder="All Places"
          />
        </FilterSection>
      )}

      <FilterSection title="Theme / Category">
        <select
          value={selectedTheme}
          onChange={e => setSelectedTheme(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/40 bg-white font-medium cursor-pointer"
        >
          {["All", "Honeymoon", "Family", "Adventure", "Wildlife", "Luxury"].map(theme => (
            <option key={theme} value={theme}>{theme}</option>
          ))}
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
          <div className="flex justify-between text-[9px] text-slate-450 font-semibold px-0.5">
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
          <div className="flex justify-between text-[9px] text-slate-450 font-semibold px-0.5">
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
          <div className="flex justify-between text-[9px] text-slate-455 font-semibold px-0.5">
            <span>Any</span>
            <span>3★</span>
            <span>4★</span>
            <span>5★</span>
          </div>
        </div>
      </FilterSection>

      <div className="rounded-xl bg-gradient-to-br from-primary via-[#0D1B3E] to-[#0B1528] p-3 text-white mt-2">
        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#F5A623] mb-1.5">Why Book With Us</p>
        <div className="space-y-2">
          {[
            { icon: ShieldCheck, text: "Verified stays & verified transfers" },
            { icon: Zap, text: "Instant booking confirmation" },
            { icon: Headset, text: "24/7 dedicated travel support" },
            { icon: CreditCard, text: "Best price guaranteed — always" },
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
          Get Custom Itinerary <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );

  const filteredPackages = useMemo(() => {
    let result = [...packages];

    // Filter by Cities/Places
    if (selectedCities.length > 0) {
      result = result.filter(p => {
        const citiesList = p.cities || (p.destinationName ? [p.destinationName] : []);
        return citiesList.some((c: string) => selectedCities.includes(c.trim()));
      });
    }

    // Filter by Budget slider
    if (maxBudget < 100000) {
      result = result.filter(p => {
        const price = Number(p.pricePerPerson || p.price || 0);
        return price <= maxBudget;
      });
    }

    // Filter by Duration slider
    if (maxDuration < 15) {
      result = result.filter(p => {
        const dur = p.duration || 0;
        return dur <= maxDuration;
      });
    }

    // Filter by Theme select
    if (selectedTheme !== "All") {
      result = result.filter(p => {
        const cat = (p.category || "").toLowerCase().trim();
        const sc = selectedTheme.toLowerCase().trim();
        return cat.includes(sc) || sc.includes(cat);
      });
    }

    // Filter by Guest Rating slider
    if (minRating > 0) {
      result = result.filter(p => (p.rating || 4.8) >= minRating);
    }

    // Sort packages
    if (sortBy === "Price: Low to High") {
      result.sort((a, b) => Number(a.pricePerPerson || 0) - Number(b.pricePerPerson || 0));
    } else if (sortBy === "Price: High to Low") {
      result.sort((a, b) => Number(b.pricePerPerson || 0) - Number(a.pricePerPerson || 0));
    } else if (sortBy === "Duration: Short to Long") {
      result.sort((a, b) => Number(a.duration || 0) - Number(b.duration || 0));
    } else {
      result.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }

    return result;
  }, [packages, selectedCities, maxBudget, maxDuration, selectedTheme, minRating, sortBy]);


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

  // Scroll to results when filter state changes to prevent losing focus to bottom elements
  useEffect(() => {
    if (hasFilters) {
      const el = document.getElementById('packages-section');
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [selectedCities, maxBudget, maxDuration, selectedTheme, minRating]);

  return (
    <div className="w-full flex flex-col font-sans">
      {/* Dynamic Destination Hero */}
      <div className="bg-primary text-white pt-16 md:pt-18 pb-0 md:pb-0 relative overflow-hidden">
        {/* Background Image with theme overlay */}
        {entityData.imageUrl && (
          <>
            <Image
              src={validateImageUrl(entityData.imageUrl, 1920, 800, "24:10")}
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
            <div className="flex flex-col space-y-2 md:space-y-5 text-center lg:text-left">
              <h1 className="text-lg md:text-2xl font-bold font-serif capitalize leading-tight text-center lg:text-left">
                {entityData.name} Tour Packages
              </h1>
              <p className="text-xs md:text-sm font-normal max-w-xl line-clamp-2 md:line-clamp-none text-white/95 text-center lg:text-left mx-auto lg:mx-0">
                {entityData.shortDescription || `Explore curated itineraries and best deals for ${entityData.name}`}
              </p>

              {/* Dynamic Inclusions & Pricing Card */}
              {(() => {
                if (loading || !packages || packages.length === 0) return null;
                const prices = packages
                  .map(p => Number(p.pricePerPerson || p.price || 0))
                  .filter(price => price > 0);
                if (prices.length === 0) return null;
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);

                const inclusions = [
                  { label: "Cab", Icon: Car },
                  { label: "Stay", Icon: Hotel },
                  { label: "Sightseeing", Icon: Camera },
                  { label: "Meals", Icon: Utensils },
                  { label: "Trip Expert", Icon: User },
                  { label: "24*7 Support", Icon: Headset },
                  { label: "Secured", Icon: ShieldCheck }
                ];

                return (
                  <div className="flex flex-col space-y-3 mt-1.5 z-20">
                    {/* Inclusions Row - flex-nowrap to prevent wrap and maintain single line */}
                    <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3.5 pb-2 justify-center lg:justify-start flex-nowrap overflow-x-auto no-scrollbar w-full max-w-full">
                      {inclusions.map((inc) => (
                        <div key={inc.label} className="flex flex-col items-center text-center space-y-1 group/inc shrink-0">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all group-hover/inc:bg-white/20 group-hover/inc:scale-105">
                            <inc.Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-accent stroke-[1.8]" />
                          </div>
                          <span className="text-[7.5px] sm:text-[9px] md:text-[10px] text-white/90 whitespace-nowrap">{inc.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Pricing Card - professional horizontal layout, lower height, wider width */}
                    <div className="relative bg-white/95 backdrop-blur-md rounded-xl py-2 px-4 border-l-4 border-l-accent border-y border-r border-slate-100 shadow-xl flex items-center justify-between gap-4 max-w-md w-full text-slate-800 transition-all duration-300 mx-auto lg:mx-0">
                      <div className="flex flex-col text-left">
                        <span className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-wider">Packages Starting From</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-base md:text-lg font-extrabold text-[#1B3A6B] tracking-tight">
                            ₹{minPrice.toLocaleString('en-IN')} - ₹{maxPrice.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[8px] md:text-[9px] text-slate-400 font-semibold uppercase tracking-wider ml-1">
                            / Person
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          document.getElementById('packages-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-accent text-primary hover:bg-accent/90 active:scale-95 transition-all touch-manipulation cursor-pointer rounded-lg shadow-md shadow-accent/20 font-bold text-xs shrink-0"
                        title="Scroll to packages"
                        aria-label="Scroll to packages"
                      >
                        View <span className="hidden sm:inline">Packages</span> <ArrowDown className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Breadcrumbs */}
              <div className="flex items-center gap-1.5 text-white/70 text-[9px] md:text-xs mt-3 justify-center lg:justify-start">
                <Link href="/" className="hover:text-accent transition-colors">Home</Link>
                <ChevronRight className="w-3 h-3 text-white/50" />
                <Link href={`/${entityData.slug}-tourism`} className="hover:text-accent transition-colors capitalize">{entityData.name}</Link>
                <ChevronRight className="w-3 h-3 text-white/50" />
                <span className="text-white font-medium">Packages</span>
              </div>

            </div>

            {/* Right Media — compact on mobile, full on desktop */}
            <div className="w-full relative aspect-video rounded-lg md:rounded-lg overflow-hidden border-1 border-white/10 shadow-lg md:shadow-2xl bg-accent">
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
      </div>

      {/* Places to Cover Swipeable & Button-scrollable List — Sticky below Navbar */}
      {childPlaces.length > 0 && (
        <div className={cn("w-full z-40 bg-[#0B1E42]/95 backdrop-blur-md border-b border-white/10 overflow-hidden sticky transition-all duration-300 shadow-md", headerScrolled ? "top-[55px]" : "top-[61px]")}>
          <div className="flex items-center">
            <div className="px-4 py-2.5 shrink-0 border-r border-white/20 hidden md:flex flex-col">
              <p className="text-[11px] font-bold text-accent">Top Places</p>
              <p className="text-xs font-bold text-white">To Cover</p>
            </div>
            {/* Mobile label */}
            <div className="px-2 py-2 shrink-0 border-r border-white/20 md:hidden">
              <p className="text-[7.5px] font-black text-accent uppercase tracking-wider">Places</p>
              <p className="text-[8.5px] font-black text-white uppercase tracking-wider">Covered</p>
            </div>

            {/* Swipeable Flex Row Container */}
            <div
              ref={placesContainerRef}
              className="flex-1 overflow-x-auto flex gap-2 px-4 py-2.5 no-scrollbar scroll-smooth snap-x snap-mandatory select-none"
            >
              {childPlaces.map((place, idx) => (
                <Link
                  key={idx}
                  href={`/${place.slug}-tour-packages`}
                  onTouchStart={() => router.prefetch(`/${place.slug}-tour-packages`)}
                  onMouseEnter={() => router.prefetch(`/${place.slug}-tour-packages`)}
                  className="inline-flex items-center gap-1.5 bg-white/10 active:bg-white/20 p-1 pr-2.5 rounded-md border border-white/10 transition-colors group shrink-0 snap-start"
                >
                  <div className="relative w-8 h-8 md:w-9 md:h-9 rounded-sm overflow-hidden shrink-0 border border-white/20">
                    <Image src={validateImageUrl(place.thumbnailUrl || place.imageUrl, 150, 150, "1:1")} alt="" fill className="object-cover" sizes="36px" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] md:text-xs font-medium text-white group-hover:text-accent transition-colors">{place.name} Trip</span>
                    <span className="text-[8px] md:text-[9px] font-medium text-primary bg-accent rounded-[2px] px-1 w-fit">Starts Only ₹{place.lowestPrice || "9,999"}/-</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop Nav Chevrons for Mouse Users */}
            {childPlaces.length > 4 && (
              <div className="hidden md:flex gap-1 px-4 border-l border-white/20 shrink-0">
                <button
                  onClick={scrollPlacesLeft}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white flex items-center justify-center cursor-pointer border border-white/10"
                  aria-label="Scroll left"
                  title="Previous Places"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={scrollPlacesRight}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white flex items-center justify-center cursor-pointer border border-white/10"
                  aria-label="Scroll right"
                  title="Next Places"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Listing Section */}
      <section id="packages-section" className="pt-2.5 md:pt-3 pb-3 md:pb-6 bg-[#f4f4f4]">
        <div className="container mx-auto px-3 md:px-4">

          {/* Mobile filter button and Active chips */}
          <div className="space-y-3 mb-4 md:hidden">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-sm active:scale-95 transition-all touch-manipulation animate-in fade-in"
              >
                <Filter className="w-3.5 h-3.5" /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="shrink-0 px-3 py-1.5 text-xs font-bold text-red-500 bg-red-50 border border-red-200 rounded-lg active:scale-95 transition-all touch-manipulation"
                >
                  Reset All
                </button>
              )}
            </div>

            {hasFilters && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {selectedCities.map(city => (
                  <span key={city} className="inline-flex items-center gap-1 bg-primary/8 text-primary text-[10px] font-semibold px-2.5 py-1 rounded-full border border-primary/10">
                    <MapPin className="w-2.5 h-2.5 text-primary/80" /> {city}
                    <button onClick={() => toggleCity(city)} className="hover:text-red-500 ml-0.5"><X className="w-2.5 h-2.5" /></button>
                  </span>
                ))}
                {maxBudget !== 100000 && (
                  <span className="inline-flex items-center gap-1 bg-primary/8 text-primary text-[10px] font-semibold px-2.5 py-1 rounded-full border border-primary/10">
                    Up to ₹{maxBudget.toLocaleString("en-IN")}
                    <button onClick={() => setMaxBudget(100000)} className="hover:text-red-500 ml-0.5"><X className="w-2.5 h-2.5" /></button>
                  </span>
                )}
                {maxDuration !== 15 && (
                  <span className="inline-flex items-center gap-1 bg-primary/8 text-primary text-[10px] font-semibold px-2.5 py-1 rounded-full border border-primary/10">
                    Up to {maxDuration} Days
                    <button onClick={() => setMaxDuration(15)} className="hover:text-red-500 ml-0.5"><X className="w-2.5 h-2.5" /></button>
                  </span>
                )}
                {selectedTheme !== "All" && (
                  <span className="inline-flex items-center gap-1 bg-primary/8 text-primary text-[10px] font-semibold px-2.5 py-1 rounded-full border border-primary/10">
                    {selectedTheme}
                    <button onClick={() => setSelectedTheme("All")} className="hover:text-red-500 ml-0.5"><X className="w-2.5 h-2.5" /></button>
                  </span>
                )}
                {minRating > 0 && (
                  <span className="inline-flex items-center gap-1 bg-primary/8 text-primary text-[10px] font-semibold px-2.5 py-1 rounded-full border border-primary/10">
                    <Star className="w-2.5 h-2.5 text-primary/80" /> {minRating}+ Stars
                    <button onClick={() => setMinRating(0)} className="hover:text-red-500 ml-0.5"><X className="w-2.5 h-2.5" /></button>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-4 md:gap-6">

            {/* Left Sidebar (Filters) — desktop only */}
            <div className="hidden lg:block w-full lg:w-1/4 shrink-0">
              <div className={cn(
                "bg-white rounded-lg shadow-sm border border-slate-200 sticky transition-all duration-300 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar",
                childPlaces.length > 0
                  ? (headerScrolled ? "top-[130px]" : "top-[138px]")
                  : (headerScrolled ? "top-[75px]" : "top-[83px]")
              )}>
                <div className="py-2.5 px-4 border-b border-slate-100 bg-white flex items-center justify-between">
                  <h3 className="font-bold text-sm tracking-wide text-slate-800 uppercase">
                    Filters
                  </h3>
                  {hasFilters && (
                    <button
                      onClick={resetFilters}
                      className="text-xs font-bold text-primary hover:text-primary-dark transition-colors cursor-pointer uppercase tracking-wider"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="p-3.5">
                  {FilterContent}
                </div>
              </div>
            </div>

            {/* Right Content Area */}
            <div className="w-full lg:w-3/4 flex flex-col gap-3 md:gap-5">
              {/* Sort Bar — static on scroll */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 px-3 py-2 md:p-1.5 md:px-3 flex items-center justify-between gap-2 transition-all mb-1">
                <h2 className="text-xs md:text-sm font-bold text-slate-800 md:mx-2 flex-1">
                  <span className="text-primary">{filteredPackages.length}</span> <span className="hidden sm:inline">Packages in {entityData.name}</span><span className="sm:hidden">Packages</span>
                </h2>

                {/* View Mode Toggle (Desktop only) */}
                <div className="hidden md:flex items-center bg-slate-50 p-1 rounded-lg border border-slate-200 mr-2">
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn("p-1.5 rounded-md transition-colors", viewMode === "list" ? "bg-white shadow-sm text-primary" : "text-slate-550 hover:text-slate-750")}
                    title="List View"
                  >
                    <ListIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn("p-1.5 rounded-md transition-colors", viewMode === "grid" ? "bg-white shadow-sm text-primary" : "text-slate-550 hover:text-slate-750")}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200">
                  <label htmlFor="sortPackages" className="text-[10px] font-bold text-slate-600 pl-2 hidden sm:block">SORT BY:</label>
                  <select
                    id="sortPackages"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    aria-label="Sort packages by"
                    className="bg-transparent text-xs md:text-sm font-bold text-slate-800 outline-none pr-2 md:pr-4 py-1.5 cursor-pointer"
                  >
                    <option>Popularity</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                    <option>Duration: Short to Long</option>
                  </select>
                </div>
              </div>

              {/* Desktop Active Chips */}
              {hasFilters && (
                <div className="hidden md:flex flex-wrap gap-2 mb-2 items-center">
                  {selectedCities.map(city => (
                    <span key={city} className="inline-flex items-center gap-1.5 bg-primary/8 text-primary text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/15 animate-in fade-in slide-in-from-top-1">
                      <MapPin className="w-3 h-3 text-primary/80" /> {city}
                      <button onClick={() => toggleCity(city)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                  {maxBudget !== 100000 && (
                    <span className="inline-flex items-center gap-1.5 bg-primary/8 text-primary text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/15 animate-in fade-in slide-in-from-top-1">
                      Up to ₹{maxBudget.toLocaleString("en-IN")}
                      <button onClick={() => setMaxBudget(100000)}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {maxDuration !== 15 && (
                    <span className="inline-flex items-center gap-1.5 bg-primary/8 text-primary text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/15 animate-in fade-in slide-in-from-top-1">
                      Up to {maxDuration} Days
                      <button onClick={() => setMaxDuration(15)}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {selectedTheme !== "All" && (
                    <span className="inline-flex items-center gap-1.5 bg-primary/8 text-primary text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/15 animate-in fade-in slide-in-from-top-1">
                      {selectedTheme}
                      <button onClick={() => setSelectedTheme("All")}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {minRating > 0 && (
                    <span className="inline-flex items-center gap-1.5 bg-primary/8 text-primary text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/15 animate-in fade-in slide-in-from-top-1">
                      <Star className="w-3 h-3 text-primary/80" /> {minRating}+ Stars
                      <button onClick={() => setMinRating(0)}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  <button onClick={resetFilters} className="text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors px-2">
                    Clear all
                  </button>
                </div>
              )}

              {/* Packages List */}
              {loading ? (
                <div className="flex justify-center items-center py-20 bg-white rounded-lg shadow-sm border border-slate-200">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
              ) : filteredPackages.length === 0 ? (
                <div className="bg-white rounded-lg p-12 text-center border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-xl my-6 font-bold text-slate-800 mb-2">No packages found</h3>
                  <p className="text-slate-600 max-w-md">We are currently updating our packages for {entityData.name}. Please try removing some filters or check back later.</p>
                </div>
              ) : (
                <div className={cn("gap-5", viewMode === "list" ? "flex flex-col" : "grid grid-cols-1 md:grid-cols-2")}>
                  {filteredPackages.slice(0, visibleCount).map((pkg) => (
                    <PackageCard key={pkg.id} pkg={pkg} variant={viewMode === "list" ? "horizontal" : "default"} />
                  ))}

                  {visibleCount < filteredPackages.length && (
                    <div className={cn("flex justify-center mt-4 pb-4", viewMode === "grid" && "md:col-span-2")}>
                      <button
                        onClick={() => setVisibleCount(prev => prev + 10)}
                        className="w-full md:w-auto bg-white active:bg-slate-50 text-primary font-bold px-6 md:px-10 py-3 rounded-lg border-2 border-primary/20 transition-all flex items-center justify-center gap-2 shadow-sm text-sm cursor-pointer touch-manipulation"
                      >
                        Load More · {filteredPackages.length - visibleCount} remaining
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>
        </div>
      </section>

      {/* Popular City Packages Section — Exact Design Match (Full width layout so sidebar filters remain sticky just above it) */}
      {childPlaces.length > 0 && (
        <section className="py-8 md:py-12 bg-white border-t border-slate-100">
          <div className="container mx-auto px-4 max-w-6xl">
            {/* Tab Switcher — matches screenshot exactly */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                <button
                  onClick={() => setActiveTab("cities")}
                  className={cn(
                    "px-3.5 py-2 md:px-6 md:py-2.5 text-xs md:text-sm font-bold transition-all",
                    activeTab === "cities"
                      ? "bg-primary text-white"
                      : "bg-white text-slate-500 hover:text-slate-700"
                  )}
                >
                  <span className="hidden sm:inline">Popular {entityData.name} City Packages</span>
                  <span className="sm:hidden">City Packages</span>
                </button>
                <button
                  onClick={() => setActiveTab("similar")}
                  className={cn(
                    "px-3.5 py-2 md:px-6 md:py-2.5 text-xs md:text-sm font-bold transition-all border-l border-slate-200",
                    activeTab === "similar"
                      ? "bg-primary text-white"
                      : "bg-white text-slate-500 hover:text-slate-700"
                  )}
                >
                  <span className="hidden sm:inline">Similar Packages</span>
                  <span className="sm:hidden">Similar</span>
                </button>
              </div>
            </div>

            {activeTab === "cities" && (() => {
              const gridPlaces = childPlaces.slice(0, 20);
              const tagPlaces = childPlaces.slice(20);
              return (
                <div>
                  {/* Mobile 2-Column Balanced Masonry (md:hidden) */}
                  {gridPlaces.length > 0 && (
                    <div className="md:hidden grid grid-cols-2 gap-2.5 items-start">
                      {/* Left Column (Short, Tall, Short, Tall... indices 0, 2, 4...) */}
                      <div className="flex flex-col gap-2.5">
                        {gridPlaces.filter((_, idx) => idx % 2 === 0).map((place, subIdx) => (
                          <MasonryCard key={place.id} place={place} tall={subIdx % 2 !== 0} />
                        ))}
                      </div>
                      {/* Right Column (Tall, Short, Tall, Short... indices 1, 3, 5...) */}
                      <div className="flex flex-col gap-2.5">
                        {gridPlaces.filter((_, idx) => idx % 2 !== 0).map((place, subIdx) => (
                          <MasonryCard key={place.id} place={place} tall={subIdx % 2 === 0} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Desktop 4-Column Masonry (hidden md:grid) */}
                  {gridPlaces.length > 0 && (
                    <div className="hidden md:grid md:grid-cols-4 gap-4 md:gap-5 items-start">
                      {/* Col 1 */}
                      <div className="flex flex-col gap-4">
                        {gridPlaces.filter((_, idx) => idx % 4 === 0).map((place, subIdx) => (
                          <MasonryCard key={place.id} place={place} tall={subIdx % 2 !== 0} />
                        ))}
                      </div>
                      {/* Col 2 */}
                      <div className="flex flex-col gap-4">
                        {gridPlaces.filter((_, idx) => idx % 4 === 1).map((place, subIdx) => (
                          <MasonryCard key={place.id} place={place} tall={subIdx % 2 === 0} />
                        ))}
                      </div>
                      {/* Col 3 */}
                      <div className="flex flex-col gap-4">
                        {gridPlaces.filter((_, idx) => idx % 4 === 2).map((place, subIdx) => (
                          <MasonryCard key={place.id} place={place} tall={subIdx % 2 !== 0} />
                        ))}
                      </div>
                      {/* Col 4 */}
                      <div className="flex flex-col gap-4">
                        {gridPlaces.filter((_, idx) => idx % 4 === 3).map((place, subIdx) => (
                          <MasonryCard key={place.id} place={place} tall={subIdx % 2 === 0} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pill Tags for remaining destinations */}
                  {tagPlaces.length > 0 && (
                    <div className="mt-8 flex flex-wrap justify-center gap-2 md:gap-2.5">
                      {tagPlaces.map(place => (
                        <Link
                          key={place.id}
                          href={`/${place.slug}-tour-packages`}
                          className="px-3 py-1.5 md:px-4 md:py-2.5 bg-white border border-slate-200 rounded-md text-[11px] md:text-[13px] font-semibold md:font-medium text-slate-600 hover:border-primary hover:text-primary transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        >
                          {place.name} Tour Packages
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {activeTab === "similar" && (
              <div className="py-16 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Coming Soon</h3>
                <p className="text-slate-600 text-sm mt-2">We're curating similar packages based on your interests.</p>
              </div>
            )}
          </div>
        </section>
      )}
      {/* Inline Detailed Rich Content (SEO/AEO friendly) */}
      <section className={cn("bg-white border-t border-slate-100 transition-all duration-500", showDetails ? "pt-6 pb-3 md:pt-12 md:pb-4" : "py-6 md:py-12")}>
        <div className="container mx-auto px-4 max-w-6xl">
          <div className={cn("text-center max-w-5xl mx-auto", showDetails ? "mb-6 md:mb-8" : "mb-0")}>
            <h2 className="text-lg md:text-xl font-sans font-bold text-primary mb-3">
              More About {entityData.name}
            </h2>
            <p className="text-slate-600 text-xs md:text-xs leading-relaxed font-medium font-sans">{entityData.longDescription || entityData.description}</p>

            {!showDetails && (
              <button
                onClick={() => setShowDetails(true)}
                className="mt-4 md:mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-white text-primary border-2 border-primary rounded-lg font-bold text-xs md:text-sm shadow-sm hover:bg-primary hover:text-white transition-all duration-300 group"
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
        <section className="pb-8 md:pb-12 bg-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 text-slate-655 font-sans">
              {/* Essential Info & Guidelines */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-850 border-b pb-1.5 font-sans">Essential Info</h3>

                  {entityData.bestTimeToVisit && (
                    <div>
                      <h4 className="text-xs font-bold text-accent flex items-center gap-2 mb-1.5 uppercase tracking-wider font-sans"><Calendar className="w-3.5 h-3.5" /> Best Time to Visit</h4>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed font-sans">{entityData.bestTimeToVisit}</p>
                    </div>
                  )}
                  {entityData.altitude && (
                    <div>
                      <h4 className="text-xs font-bold text-accent flex items-center gap-2 mb-1.5 uppercase tracking-wider font-sans"><Mountain className="w-3.5 h-3.5" /> Altitude</h4>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed font-sans">{entityData.altitude}</p>
                    </div>
                  )}
                  {entityData.howToReach && (
                    <div>
                      <h4 className="text-xs font-bold text-accent flex items-center gap-2 mb-1.5 uppercase tracking-wider font-sans"><MapPin className="w-3.5 h-3.5" /> How to Reach</h4>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap font-sans">{entityData.howToReach}</p>
                    </div>
                  )}
                </div>

                {/* Safety & Tips (If available) */}
                {(entityData.safetyInfo || (entityData.travelTips && entityData.travelTips.length > 0)) && (
                  <div className="space-y-4 pt-2">
                    {entityData.safetyInfo && (
                      <div className="bg-red-50/50 p-3.5 rounded-lg border border-red-100/60">
                        <h4 className="text-xs font-bold text-red-650 flex items-center gap-2 mb-1.5 uppercase tracking-wider font-sans"><ShieldCheck className="w-3.5 h-3.5" /> Safety Information</h4>
                        <p className="text-xs text-red-800 font-medium leading-relaxed whitespace-pre-wrap font-sans">{entityData.safetyInfo}</p>
                      </div>
                    )}
                    {entityData.travelTips && entityData.travelTips.length > 0 && (
                      <div className="bg-amber-50/50 p-3.5 rounded-lg border border-amber-100/60">
                        <h4 className="text-xs font-bold text-amber-700 flex items-center gap-2 mb-1.5 uppercase tracking-wider font-sans"><Info className="w-3.5 h-3.5" /> Travel Tips</h4>
                        <ul className="space-y-1">
                          {entityData.travelTips.map((t: string, i: number) => (
                            <li key={i} className="text-xs text-amber-800 font-medium leading-relaxed font-sans flex gap-1.5"><span className="text-amber-500 font-bold">•</span> {t}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Highlights & Experience */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-850 border-b pb-1.5 font-sans">Experience {entityData.name}</h3>

                  {entityData.highlights && entityData.highlights.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-accent flex items-center gap-2 mb-2 uppercase tracking-wider font-sans"><Sparkles className="w-3.5 h-3.5" /> Key Highlights</h4>
                      <ul className="space-y-1.5">
                        {entityData.highlights.map((h: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-xs font-medium text-slate-600 font-sans">
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
                      <h4 className="text-xs font-bold text-accent flex items-center gap-2 mb-2 uppercase tracking-wider font-sans"><Compass className="w-3.5 h-3.5" /> Local Attractions</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {entityData.localAttractions.map((t: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] md:text-xs font-semibold border border-blue-100/60 shadow-sm font-sans">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activities & Things to Do */}
                  {(entityData.activities || entityData.thingsToDo) && (
                    <div>
                      <h4 className="text-xs font-bold text-accent flex items-center gap-2 mb-2 uppercase tracking-wider font-sans"><Activity className="w-3.5 h-3.5" /> Top Activities</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {(entityData.activities || entityData.thingsToDo).map((t: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-655 rounded-md text-[10px] md:text-xs font-medium font-sans">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Local Cuisine */}
                  {entityData.localCuisine && entityData.localCuisine.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-accent flex items-center gap-2 mb-2 uppercase tracking-wider font-sans"><Utensils className="w-3.5 h-3.5" /> Local Cuisine</h4>
                      <ul className="space-y-1.5">
                        {entityData.localCuisine.map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-xs font-medium text-slate-600 font-sans">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Famous For */}
                  {entityData.famousFor && entityData.famousFor.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-accent flex items-center gap-2 mb-1.5 uppercase tracking-wider font-sans"><Star className="w-3.5 h-3.5" /> Famous For</h4>
                      <p className="text-xs font-medium text-slate-600 font-sans">
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
          <section className="py-12 bg-slate-50 border-t border-slate-100">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="mb-8 text-center max-w-3xl mx-auto">
                <h2 className="text-lg md:text-xl font-sans font-bold text-primary mb-2">
                  Traveler's Knowledge Base
                </h2>
                <p className="text-xs text-slate-500 font-sans">Everything you need to know before visiting {entityData.name}.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 text-slate-655 font-sans">

                {/* General Background */}
                {(entityData.historyAndCulture || entityData.geography || entityData.weatherAndClimate) && (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-slate-850 border-b pb-1.5 font-sans">Background</h3>

                    {entityData.historyAndCulture && (
                      <div>
                        <h4 className="text-xs font-bold text-accent flex items-center gap-2 mb-1.5 uppercase tracking-wider font-sans"><BookOpen className="w-3.5 h-3.5" /> History & Culture</h4>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap font-sans">{entityData.historyAndCulture}</p>
                      </div>
                    )}
                    {entityData.geography && (
                      <div>
                        <h4 className="text-xs font-bold text-accent flex items-center gap-2 mb-1.5 uppercase tracking-wider font-sans"><Globe className="w-3.5 h-3.5" /> Geography</h4>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap font-sans">{entityData.geography}</p>
                      </div>
                    )}
                    {entityData.weatherAndClimate && (
                      <div>
                        <h4 className="text-xs font-bold text-accent flex items-center gap-2 mb-1.5 uppercase tracking-wider font-sans"><CloudSun className="w-3.5 h-3.5" /> Weather & Climate</h4>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap font-sans">{entityData.weatherAndClimate}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Practical Info */}
                {(entityData.transportation || entityData.currencyAndPayments || entityData.languageAndCommunication || entityData.localEtiquette) && (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-slate-850 border-b pb-1.5 font-sans">Practical Info</h3>

                    {entityData.transportation && (
                      <div>
                        <h4 className="text-xs font-bold text-accent flex items-center gap-2 mb-1.5 uppercase tracking-wider font-sans"><Bus className="w-3.5 h-3.5" /> Getting Around</h4>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap font-sans">{entityData.transportation}</p>
                      </div>
                    )}
                    {entityData.currencyAndPayments && (
                      <div>
                        <h4 className="text-xs font-bold text-accent flex items-center gap-2 mb-1.5 uppercase tracking-wider font-sans"><CreditCard className="w-3.5 h-3.5" /> Currency & Payments</h4>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap font-sans">{entityData.currencyAndPayments}</p>
                      </div>
                    )}
                    {entityData.languageAndCommunication && (
                      <div>
                        <h4 className="text-xs font-bold text-accent flex items-center gap-2 mb-1.5 uppercase tracking-wider font-sans"><MessageCircle className="w-3.5 h-3.5" /> Language</h4>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap font-sans">{entityData.languageAndCommunication}</p>
                      </div>
                    )}
                    {entityData.localEtiquette && (
                      <div>
                        <h4 className="text-xs font-bold text-accent flex items-center gap-2 mb-1.5 uppercase tracking-wider font-sans"><Heart className="w-3.5 h-3.5" /> Local Etiquette</h4>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap font-sans">{entityData.localEtiquette}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tips & Specifics */}
                {(entityData.healthTips || entityData.emergencyNumbers || entityData.packingList || entityData.shopping) && (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-slate-850 border-b pb-1.5 font-sans">Tips & Specifics</h3>

                    {entityData.healthTips && (
                      <div>
                        <h4 className="text-xs font-bold text-accent flex items-center gap-2 mb-1.5 uppercase tracking-wider font-sans"><ShieldCheck className="w-3.5 h-3.5" /> Health & Safety</h4>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap font-sans">{entityData.healthTips}</p>
                      </div>
                    )}
                    {entityData.emergencyNumbers && (
                      <div>
                        <h4 className="text-xs font-bold text-accent flex items-center gap-2 mb-1.5 uppercase tracking-wider font-sans"><PhoneCall className="w-3.5 h-3.5" /> Emergency Numbers</h4>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap font-sans">{entityData.emergencyNumbers}</p>
                      </div>
                    )}
                    {entityData.shopping && (
                      <div>
                        <h4 className="text-xs font-bold text-accent flex items-center gap-2 mb-1.5 uppercase tracking-wider font-sans"><ShoppingBag className="w-3.5 h-3.5" /> Shopping</h4>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap font-sans">{entityData.shopping}</p>
                      </div>
                    )}
                    {entityData.packingList && (
                      <div>
                        <h4 className="text-xs font-bold text-accent flex items-center gap-2 mb-1.5 uppercase tracking-wider font-sans"><Briefcase className="w-3.5 h-3.5" /> Packing List</h4>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap font-sans">{entityData.packingList}</p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </section>
        )}

        <div className="bg-slate-50 pb-8 md:pb-16 flex justify-center border-t border-slate-200 pt-6 md:pt-8">
          <button
            onClick={() => setShowDetails(false)}
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-slate-600 border border-slate-300 rounded-lg font-bold shadow-sm hover:bg-slate-100 transition-all duration-300"
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

      {/* Mobile Fullscreen Filter Drawer */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFilterOpen(false)}
              className="fixed inset-0 bg-black z-50 md:hidden"
            />
            {/* Drawer Body */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-x-0 bottom-0 top-16 bg-white z-50 rounded-t-lg flex flex-col md:hidden overflow-hidden shadow-2xl border-t border-slate-200"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" /> Filter Packages
                </h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={resetFilters}
                    className="text-xs text-primary font-bold hover:underline py-1.5 px-3 touch-manipulation"
                  >
                    Reset All
                  </button>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 touch-manipulation"
                    aria-label="Close filters"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Filters Content */}
              <div className="flex-1 overflow-y-auto p-5 pb-24">
                {FilterContent}
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="bg-white border-t border-slate-100 p-4 shrink-0 flex items-center justify-between gap-3 shadow-[0_-8px_30px_rgb(0,0,0,0.06)] border-t border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Matching Packages</span>
                  <span className="text-base font-black text-primary">{filteredPackages.length} Available</span>
                </div>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="bg-primary text-white hover:bg-accent hover:text-slate-900 transition-all font-bold text-sm px-6 py-3 rounded-lg flex-1 text-center shadow-lg shadow-primary/10 touch-manipulation active:scale-95"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Masonry Card — Text BELOW image, matches reference screenshot ────────────
function MasonryCard({ place, tall }: { place: any; tall: boolean }) {
  return (
    <Link href={`/${place.slug}-tour-packages`} className="group block">
      {/* Image container with fixed height */}
      <div className={cn(
        "relative w-full overflow-hidden rounded-lg border border-slate-100 shadow-sm transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-0.5",
        tall ? "h-[180px] md:h-[300px] lg:h-[340px]" : "h-[105px] md:h-[140px] lg:h-[160px]"
      )}>
        <Image
          src={validateImageUrl(place.imageUrl || place.thumbnailUrl, 400, tall ? 600 : 300, tall ? "2:3" : "4:3")}
          alt={`${place.name} Tour Packages`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        {/* Subtle hover overlay */}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300" />
      </div>
      {/* Text below image — exact match to reference */}
      <p className="mt-1 text-[11px] md:text-sm font-bold md:font-semibold text-slate-800 group-hover:text-primary transition-colors px-0.5 leading-snug">
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
      .catch(() => { });
  }, []);

  const toggle = (idx: number) => setOpenIdx(prev => prev === idx ? null : idx);

  return (
    <section className="py-8 md:py-16 bg-gradient-to-b from-white to-slate-50 border-t border-slate-100">
      <div className="container mx-auto px-4 max-w-4xl">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-6 md:mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 rounded-lg mb-5">
            <HelpCircle className="w-4 h-4 text-primary" />
            <span className="text-xs font-black uppercase tracking-[0.25em] text-primary">Frequently Asked Questions</span>
          </div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-serif font-bold text-primary mb-4">
            Got Questions About{" "}
            <span className="text-accent">{entityName}?</span>
          </h2>
          <p className="text-slate-600 text-xs md:text-sm max-w-xl mx-auto">
            Everything you need to know before planning your trip.
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-2 md:space-y-3">
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
                    "rounded-lg border overflow-hidden transition-all duration-300",
                    isOpen
                      ? "border-primary/30 bg-white shadow-lg shadow-primary/5"
                      : "border-slate-200 bg-white hover:border-primary/20 hover:shadow-md shadow-sm"
                  )}
                >
                  {/* Question Row */}
                  <button
                    onClick={() => toggle(idx)}
                    className="w-full flex items-start gap-3 md:gap-4 px-4 py-4 md:px-6 md:py-5 text-left group"
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
                        "flex-1 font-bold text-sm leading-snug transition-colors duration-200",
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
                        <div className="px-4 pb-4 pl-[3rem] md:px-6 md:pb-6 md:pl-[4.25rem]">
                          <div className="h-px bg-slate-100 mb-5" />
                          <p className="text-slate-600 text-xs md:text-sm leading-relaxed font-medium whitespace-pre-line">
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
          className="mt-8 md:mt-16 -mx-4 px-4 py-6 md:py-10 bg-slate-50/30 border-t border-slate-100 rounded-lg overflow-hidden"
        >
          {/* Header — exact match to /customized-holidays */}
          <div className="flex items-center justify-between mb-6 md:mb-10">
            <h3 className="text-base md:text-lg font-black text-primary uppercase tracking-tight flex items-center gap-3">
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
                    <div className="relative bg-white rounded-lg p-5 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-50 h-full flex flex-col">

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
                        <p className="text-slate-700 text-[11px] md:text-xs font-medium leading-relaxed line-clamp-4 relative">
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
                        <h4 className="text-[10px] font-black text-primary uppercase tracking-wider">{rev.name}</h4>
                        {rev.location && (
                          <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">{rev.location}</p>
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
