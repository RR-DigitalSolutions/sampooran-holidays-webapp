"use client";


import { useListPackages } from "@workspace/api-client-react";
import { PackageCard } from "@/components/PackageCard";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { Search, SlidersHorizontal, Star, X, LayoutGrid, LayoutList, CheckCircle } from "lucide-react";
import { getApiUrl } from "@/lib/api-url";

const CATEGORIES = ["All", "Adventure", "Honeymoon", "Family", "Cultural", "Luxury", "Budget", "Wildlife", "Religious", "Group"];
const DURATIONS = [
  { label: "Any Duration", min: 0, max: 999 },
  { label: "1â€“3 Days", min: 1, max: 3 },
  { label: "4â€“6 Days", min: 4, max: 6 },
  { label: "7â€“10 Days", min: 7, max: 10 },
  { label: "11+ Days", min: 11, max: 999 },
];
const BUDGETS = [
  { label: "Any Budget", min: 0, max: 999999 },
  { label: "Under â‚¹10,000", min: 0, max: 10000 },
  { label: "â‚¹10,000â€“â‚¹20,000", min: 10000, max: 20000 },
  { label: "â‚¹20,000â€“â‚¹35,000", min: 20000, max: 35000 },
  { label: "â‚¹35,000â€“â‚¹50,000", min: 35000, max: 50000 },
  { label: "Above â‚¹50,000", min: 50000, max: 999999 },
];

const DESTINATIONS = ["All Destinations", "Manali", "Leh Ladakh", "Kashmir", "Shimla", "Spiti Valley", "Rishikesh", "Jaipur", "Goa", "Thailand", "Bhutan", "Nepal", "Dubai"];

// Removed FALLBACK_PACKAGES so we don't show demo data when API fails

export default function Packages() {
  const searchParams = useSearchParams();
  const initCategory = searchParams.get("category") ?? searchParams.get("theme") ?? "All";
  const searchQuery = searchParams.get("q") ?? "";

  const [category, setCategory] = useState(initCategory);
  const [durationIdx, setDurationIdx] = useState(0);
  const [budgetIdx, setBudgetIdx] = useState(0);
  const [destination, setDestination] = useState("All Destinations");
  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [q, setQ] = useState(searchQuery);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [dynamicCategories, setDynamicCategories] = useState<string[]>(CATEGORIES);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch(`${getApiUrl()}/ota/home/config`);
        if (res.ok) {
          const data = await res.json();
          const cats = data.categories?.filter((c:any) => c.isActive).map((c: any) => c.label) || [];
          const themes = data.themes?.map((t: any) => t.name) || [];
          const unique = Array.from(new Set([...cats, ...themes]));
          if (unique.length > 0) {
            setDynamicCategories(["All", ...unique]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch dynamic categories", err);
      }
    }
    fetchConfig();
  }, []);

  const { data, isLoading } = useListPackages({ limit: 500 } as any);
  const allPackages = data?.packages || [];

  const filtered = useMemo(() => {
    let result = [...allPackages];
    if (q) result = result.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || (p.destinationName ?? "").toLowerCase().includes(q.toLowerCase()) || (p.shortDescription ?? "").toLowerCase().includes(q.toLowerCase()));
    if (category !== "All") {
      result = result.filter(p => {
        if (!p.category) return false;
        const pc = p.category.toLowerCase().trim();
        const sc = category.toLowerCase().trim();
        return pc.includes(sc) || sc.includes(pc);
      });
    }
    if (destination !== "All Destinations") result = result.filter(p => p.destinationName?.includes(destination) || p.stateName?.includes(destination));
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

  const hasFilters = category !== "All" || durationIdx !== 0 || budgetIdx !== 0 || destination !== "All Destinations" || q || minRating > 0;
  const resetFilters = () => { setCategory("All"); setDurationIdx(0); setBudgetIdx(0); setDestination("All Destinations"); setQ(""); setMinRating(0); };
  const featuredPackages = allPackages.filter(pkg => (pkg as any).isFeatured).slice(0, 4);
  const trendingPackages = allPackages.filter(pkg => (pkg as any).isTrending).slice(0, 4);

  return (
    <>
      <div className="relative overflow-hidden bg-[#0A0B1A] text-white pt-24 md:pt-32 pb-12 md:pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.15),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
        
        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-accent mb-3">Explore & Discover</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-black leading-[1.1] mb-6">
            Find your perfect <span className="text-accent italic font-light drop-shadow-[0_0_15px_rgba(245,166,35,0.5)]">Holiday.</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base font-medium leading-relaxed mb-8 max-w-2xl mx-auto">
            Discover curated itineraries, verified stays, and flexible pricing across India and beyond.
          </p>

          <div className="bg-white p-2 rounded-full shadow-2xl shadow-primary/10 border border-white/20 backdrop-blur-md max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-2">
            <div className="flex-1 flex items-center gap-3 px-4 py-2 w-full">
              <Search className="h-5 w-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search packages, destinations..."
                className="w-full bg-transparent text-slate-900 placeholder:text-slate-500 font-medium outline-none text-sm"
              />
              {q && (
                <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="text-slate-400 hover:text-slate-800 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="hidden sm:block w-px h-8 bg-slate-200" />
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="bg-transparent text-slate-700 font-bold text-sm outline-none px-4 py-2 w-full sm:w-auto cursor-pointer appearance-none"
            >
              {dynamicCategories.map(cat => <option key={cat} value={cat}>{cat === "All" ? "All Categories" : cat}</option>)}
            </select>
            <button type="button" onClick={resetFilters} className="w-full sm:w-auto shrink-0 rounded-full bg-primary px-6 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-accent hover:text-primary transition-colors shadow-md">
              Reset
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm font-bold text-slate-300">
             <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-accent" /> Verified Stays</div>
             <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-accent" /> 24/7 Support</div>
             <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-accent" /> Custom Itineraries</div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block">
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-500 mb-1">Filter Packages</p>
                    <h2 className="text-2xl font-bold text-slate-900">Refine search</h2>
                  </div>
                  {hasFilters && <button onClick={resetFilters} className="text-sm text-primary hover:underline">Clear</button>}
                </div>
                <div className="space-y-5">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Destination</p>
                    <select aria-label="Destination" value={destination} onChange={e => setDestination(e.target.value)} className="w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20">
                      {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Duration</p>
                    <div className="grid gap-2">
                      {DURATIONS.map((d, i) => (
                        <button key={d.label} type="button" onClick={() => setDurationIdx(i)} className={`text-left rounded-3xl px-4 py-3 text-sm transition ${durationIdx === i ? 'bg-primary text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Budget</p>
                    <div className="grid gap-2">
                      {BUDGETS.map((b, i) => (
                        <button key={b.label} type="button" onClick={() => setBudgetIdx(i)} className={`text-left rounded-3xl px-4 py-3 text-sm transition ${budgetIdx === i ? 'bg-primary text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Minimum Rating</p>
                    <div className="grid gap-2">
                      {[[0, 'Any Rating'], [4, '4+ Stars'], [4.5, '4.5+ Stars'], [4.8, '4.8+ Stars']].map(([val, label]) => (
                        <button key={String(val)} type="button" onClick={() => setMinRating(Number(val))} className={`text-left rounded-3xl px-4 py-3 text-sm transition ${minRating === val ? 'bg-primary text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-500 mb-4">Why Sampooran?</p>
                <div className="space-y-4 text-sm text-slate-600">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-100 text-primary font-bold">âœ“</span>
                    <div>
                      <p className="font-semibold text-slate-900">Verified hotels & transfers</p>
                      <p>Handpicked stays and comfortable transport for every route.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-100 text-primary font-bold">âœ“</span>
                    <div>
                      <p className="font-semibold text-slate-900">Flexible payment options</p>
                      <p>Pay using secure methods and book with confidence.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-100 text-primary font-bold">âœ“</span>
                    <div>
                      <p className="font-semibold text-slate-900">24/7 travel support</p>
                      <p>Expert assistance before and during your holiday.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="space-y-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Showing <span className="font-semibold text-slate-900">{filtered.length}</span> packages</p>
                <h2 className="text-3xl font-bold text-slate-900">Best packages for every traveller</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm text-slate-500" htmlFor="package-sort">Sort by</label>
                <select id="package-sort" aria-label="Sort packages" value={sortBy} onChange={e => setSortBy(e.target.value)} className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="popular">Most Popular</option>
                  <option value="trending">Trending</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
                <div className="inline-flex rounded-3xl border border-slate-200 overflow-hidden">
                  <button onClick={() => setViewMode("grid")} aria-label="Grid view" className={`px-4 py-3 text-sm ${viewMode === "grid" ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'}`}><LayoutGrid className="h-4 w-4" /></button>
                  <button onClick={() => setViewMode("list")} aria-label="List view" className={`px-4 py-3 text-sm ${viewMode === "list" ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'}`}><LayoutList className="h-4 w-4" /></button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-5" : "space-y-4"}>
                {[1,2,3,4].map(i => <div key={i} className="bg-slate-100 animate-pulse rounded-3xl h-80" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-16 text-center">
                <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500 mb-3">No results</p>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">No packages match your filters</h3>
                <p className="text-slate-600 mb-5">Try changing the budget, duration, or category to widen your search.</p>
                <button onClick={resetFilters} className="rounded-3xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">Reset filters</button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filtered.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map(pkg => <PackageCard key={pkg.id} pkg={pkg} variant="horizontal" />)}
              </div>
            )}

            {filtered.length > 0 && (
              <div className="rounded-[2rem] border border-primary/20 bg-primary/5 p-8 text-slate-900 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-primary font-bold mb-2">Still unsure?</p>
                  <h3 className="text-2xl font-bold">Get a personalized itinerary from our experts.</h3>
                </div>
                <Link href="/customized-holidays" className="inline-flex items-center justify-center rounded-3xl bg-primary px-7 py-4 text-sm font-bold text-white hover:bg-accent transition-colors">
                  Request Custom Plan
                </Link>
              </div>
            )}

            {featuredPackages.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500 mb-2">Featured deals</p>
                    <h3 className="text-3xl font-bold text-slate-900">Top curated packages</h3>
                  </div>
                  <Link href="/packages?sort=popular" className="text-sm font-semibold text-primary hover:underline">View all</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {featuredPackages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
                </div>
              </section>
            )}

            {trendingPackages.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500 mb-2">Trending now</p>
                    <h3 className="text-3xl font-bold text-slate-900">What travellers are booking</h3>
                  </div>
                  <Link href="/packages?sort=trending" className="text-sm font-semibold text-primary hover:underline">Browse all trending</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                  {trendingPackages.map(pkg => (
                    <div key={pkg.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-lg transition-shadow">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <span className="rounded-3xl bg-primary/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">{pkg.category}</span>
                        <span className="text-xs text-slate-500">{pkg.rating} â˜…</span>
                      </div>
                      <h4 className="text-lg font-semibold text-slate-900 mb-3">{pkg.name}</h4>
                      <p className="text-sm text-slate-600 mb-5 line-clamp-3">{pkg.shortDescription}</p>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-slate-900">â‚¹{pkg.pricePerPerson.toLocaleString()}</span>
                        <Link href={`/packages/${pkg.slug}`} className="text-primary text-sm font-semibold hover:underline">View package</Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
