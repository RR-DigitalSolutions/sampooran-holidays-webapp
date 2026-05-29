"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Filter, Search, Loader2 } from "lucide-react";
import { PackageCard } from "@/components/PackageCard";
import { validateImageUrl } from "@/lib/utils";
import { motion } from "framer-motion";

export function ThemeDetailPage({ entityData, searchParams }: { entityData: any, searchParams: any }) {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    async function fetchPackages() {
      try {
        setLoading(true);
        // Using the category filter which maps to theme/category name
        const res = await fetch(`/api/packages?category=${encodeURIComponent(entityData.name)}`);
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
  }, [entityData.name]);

  return (
    <div className="w-full flex flex-col font-sans bg-[#f4f4f4] min-h-screen">
       {/* ── Premium Hero Banner ── */}
      <section className="relative h-[45vh] min-h-[380px] max-h-[480px] overflow-hidden group">
        <motion.div 
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          <img 
            src={validateImageUrl(entityData.imageUrl || 'https://images.unsplash.com/photo-1502086223501-7ea244b05fe6?w=1920&q=80')} 
            alt={entityData.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B1A] via-[#0A0B1A]/40 to-transparent" />
        </motion.div>

        <div className="absolute inset-x-0 bottom-0 pb-16 md:pb-20 z-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                <nav className="flex items-center gap-2 text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mb-4 md:mb-6">
                  <Link href="/" className="hover:text-white transition-colors">Home</Link>
                  <ChevronRight className="h-3 w-3 opacity-50" />
                  <Link href="/packages" className="hover:text-white transition-colors">Themes</Link>
                  <ChevronRight className="h-3 w-3 opacity-50" />
                  <span className="text-accent underline underline-offset-4 decoration-2">{entityData.name}</span>
                </nav>

                <p className="text-accent text-[11px] font-black uppercase tracking-[0.4em] mb-3 md:mb-4">{entityData.packageCount || packages.length || 0} Curated Packages</p>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-black text-white mb-4 leading-[0.92] tracking-tight drop-shadow-2xl">
                  {entityData.name} <span className="text-accent">Holidays.</span>
                </h1>
                {entityData.description && (
                  <p className="max-w-2xl text-base md:text-xl text-slate-100 font-medium leading-relaxed mb-8">
                    {entityData.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-4">
                  <button onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })} className="inline-flex items-center justify-center rounded-full bg-accent px-8 py-4 text-xs font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-accent/30 hover:bg-accent/90 transition-all">
                    View Packages
                  </button>
                  {entityData.startingPrice && (
                    <div className="flex flex-col border-l border-white/20 pl-4">
                      <span className="text-[10px] uppercase tracking-widest text-white/60 font-black">Starting From</span>
                      <span className="text-xl font-bold text-white">₹{Number(entityData.startingPrice).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Listing Section */}
      <section className="py-6 md:py-8">
        <div className="container mx-auto px-4">
          
          {/* Mobile Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 md:hidden no-scrollbar">
            <span className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-full">
              <Filter className="w-3 h-3" /> Filters
            </span>
            {["Duration", "Budget", "Sub-theme"].map((f, i) => (
              <button key={i} className="shrink-0 px-3 py-1.5 bg-white border border-slate-200 text-xs font-semibold text-slate-600 rounded-full active:bg-primary active:text-white transition-colors">{f}</button>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Left Sidebar (Filters) */}
            <div className="hidden lg:block w-full lg:w-[280px] shrink-0">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 sticky top-24 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                    <Filter className="w-4 h-4" /> Filters
                  </h3>
                  <span className="text-xs text-primary font-bold cursor-pointer hover:underline">Reset</span>
                </div>
                
                <div className="p-5 border-b border-slate-100">
                  <h4 className="font-bold text-sm text-slate-800 mb-3">Price Range</h4>
                  <div className="space-y-2.5">
                    {["Under ₹20,000", "₹20,000 - ₹50,000", "₹50,000 - ₹1,00,000", "Above ₹1,00,000"].map((label, i) => (
                      <label key={i} className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 accent-primary" />
                        <span className="text-sm text-slate-600 group-hover:text-slate-900">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="p-5 border-b border-slate-100">
                  <h4 className="font-bold text-sm text-slate-800 mb-3">Duration</h4>
                  <div className="space-y-2.5">
                    {["1 to 3 Days", "4 to 6 Days", "7 to 9 Days", "10 to 12 Days", "13+ Days"].map((label, i) => (
                      <label key={i} className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 accent-primary" />
                        <span className="text-sm text-slate-600 group-hover:text-slate-900">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content Area */}
            <div className="w-full flex-1 flex flex-col gap-4">
              
              {/* Sort Bar */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 md:px-5 md:py-3 flex items-center justify-between gap-4">
                <h2 className="text-sm md:text-lg font-bold text-slate-800">
                  <span className="text-primary">{packages.length}</span> {entityData.name} Tour Packages
                </h2>
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200 px-2 py-1">
                  <label htmlFor="sortPackages" className="text-[10px] font-bold text-slate-500 hidden sm:block">SORT BY:</label>
                  <select id="sortPackages" className="bg-transparent text-xs md:text-sm font-bold text-slate-800 outline-none cursor-pointer">
                    <option>Popularity</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                    <option>Duration: Short to Long</option>
                  </select>
                </div>
              </div>

              {/* Packages List */}
              {loading ? (
                <div className="flex justify-center items-center py-32 bg-white rounded-xl shadow-sm border border-slate-200">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
              ) : packages.length === 0 ? (
                <div className="bg-white rounded-xl p-16 text-center border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">No packages found</h3>
                  <p className="text-slate-500 max-w-md">We are currently updating our packages for {entityData.name}. Please check back later.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {packages.slice(0, visibleCount).map((pkg) => (
                    <PackageCard key={pkg.id} pkg={pkg} variant="horizontal" />
                  ))}

                  {visibleCount < packages.length && (
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={() => setVisibleCount(prev => prev + 10)}
                        className="bg-white active:bg-slate-50 text-primary font-bold px-8 py-3 rounded-xl border border-primary/20 hover:border-primary transition-all shadow-sm text-sm"
                      >
                        Load More Packages
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </section>
      
      {/* Description Section if exists */}
      {entityData.content && (
         <section className="py-12 bg-white border-t border-slate-200">
            <div className="container mx-auto px-4 max-w-4xl">
               <h2 className="text-2xl font-bold text-slate-800 mb-6">About {entityData.name} Holidays</h2>
               <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: entityData.content }} />
            </div>
         </section>
      )}
    </div>
  );
}
