"use client";

import Link from "next/link";
import { useListStates, useListPackages } from "@workspace/api-client-react";
import { useState } from "react";
import { ChevronRight, List as ListIcon, LayoutGrid, MapPin, Sparkles } from "lucide-react";
import { PackageCard } from "@/components/PackageCard";
import { motion } from "framer-motion";

const PLACEHOLDER = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmMmY1Ii8+PC9zdmc+";

const STATES = [
  { name: "Himachal Pradesh", slug: "himachal-pradesh", tagline: "Land of Gods", imageUrl: PLACEHOLDER, packages: "50+" },
  { name: "Leh Ladakh", slug: "ladakh", tagline: "Land of High Passes", imageUrl: PLACEHOLDER, packages: "30+" },
  { name: "Kashmir", slug: "kashmir", tagline: "Paradise on Earth", imageUrl: PLACEHOLDER, packages: "25+" },
  { name: "Uttarakhand", slug: "uttarakhand", tagline: "Devbhoomi", imageUrl: PLACEHOLDER, packages: "20+" },
  { name: "Rajasthan", slug: "rajasthan", tagline: "Land of Kings", imageUrl: PLACEHOLDER, packages: "20+" },
  { name: "Goa", slug: "goa", tagline: "Pearl of the Orient", imageUrl: PLACEHOLDER, packages: "15+" },
  { name: "Kerala", slug: "kerala", tagline: "God's Own Country", imageUrl: PLACEHOLDER, packages: "10+" },
];

export default function IndiaClient() {
  const { data: statesData } = useListStates();
  const { data: pkgData } = useListPackages(); // Fetch all packages

  const states = statesData?.states ?? [];
  const displayStates = states.length > 0 ? states : STATES;
  const packages = pkgData?.packages || [];

  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedState, setSelectedState] = useState<string | null>(null);

  const filteredPackages = selectedState 
    ? packages.filter((pkg: any) => pkg.stateName?.toLowerCase() === selectedState.toLowerCase())
    : packages;

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      {/* â”€â”€ HERO SECTION â”€â”€ */}
      <section className="relative overflow-hidden bg-[#0A0B1A] text-white pt-24 pb-16 md:pt-32 md:pb-24">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(14,165,233,0.15),_transparent_60%)]" />
           <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(139,92,246,0.1),_transparent_60%)]" />
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-5xl">
            <nav className="text-white/50 text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex flex-wrap items-center gap-2">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-accent">India</span>
            </nav>

            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-accent mb-4 border border-accent/30 bg-accent/10 px-4 py-1.5 rounded-full inline-block backdrop-blur-md">
              Incredible India
            </p>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-black leading-[0.9] tracking-tight mb-8">
              Discover <span className="block text-accent">The Magic.</span>
            </h1>
            
            <p className="max-w-2xl text-slate-300 text-lg md:text-xl font-medium leading-relaxed mb-10">
              Explore India through premium tour packages designed for luxury travellers, adventurous families, honeymooners and cultural explorers. 
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="#packages" className="inline-flex items-center justify-center rounded-xl bg-accent px-8 py-4 text-[11px] font-black uppercase tracking-widest text-white shadow-2xl shadow-accent/20 hover:bg-accent/90 transition-all hover:-translate-y-1">
                Browse Packages
              </Link>
              <Link href="/customized-holidays" className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 backdrop-blur-md px-8 py-4 text-[11px] font-black uppercase tracking-widest text-white hover:border-white/50 hover:bg-white/10 transition-all">
                Build Custom Trip
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ MAIN CONTENT â”€â”€ */}
      <main className="container mx-auto px-4 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16">
          
          {/* â”€â”€ SIDEBAR (Filters) â”€â”€ */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Filter Widget */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
              <h3 className="text-2xl font-serif font-black text-primary italic mb-6">Filter by <span className="text-accent not-italic">State.</span></h3>
              
              <div className="space-y-1">
                <button 
                  onClick={() => setSelectedState(null)}
                  className={`w-full text-left flex items-center justify-between p-3 rounded-xl transition-all ${selectedState === null ? "bg-accent/10 text-accent font-bold" : "text-slate-500 font-medium hover:bg-slate-50 hover:text-primary"}`}
                >
                  <span>All India Packages</span>
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-400 font-bold">{packages.length}</span>
                </button>

                {displayStates.map((state: any) => {
                  const count = packages.filter((p: any) => p.stateName?.toLowerCase() === state.name.toLowerCase()).length;
                  if (count === 0 && !selectedState) return null; // Hide empty states unless filtered
                  
                  return (
                    <button 
                      key={state.slug}
                      onClick={() => setSelectedState(state.name)}
                      className={`w-full text-left flex items-center justify-between p-3 rounded-xl transition-all ${selectedState === state.name ? "bg-accent/10 text-accent font-bold" : "text-slate-500 font-medium hover:bg-slate-50 hover:text-primary"}`}
                    >
                      <span className="line-clamp-1">{state.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${selectedState === state.name ? "bg-accent text-white" : "bg-slate-100 text-slate-400"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Support Widget */}
            <div className="bg-[#0A0B1A] text-white rounded-[2rem] p-8 shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
               <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Sparkles className="h-40 w-40 text-accent" />
               </div>
               <div className="relative z-10 text-center">
                  <h3 className="text-2xl font-serif font-black mb-4 italic">Need Advice?</h3>
                  <p className="text-slate-300 font-medium text-sm mb-8">Our local experts can help you choose the perfect destination in India.</p>
                  <a href="tel:+918595513009" className="block w-full bg-white text-primary rounded-xl py-3.5 font-black uppercase text-[10px] tracking-widest shadow-lg hover:scale-105 transition-transform">
                     Contact Expert
                  </a>
               </div>
            </div>
          </div>

          {/* â”€â”€ RIGHT COLUMN â”€â”€ */}
          <div className="lg:col-span-9 space-y-16">
            
            {/* Packages Header & Toggles */}
            <section id="packages" className="scroll-mt-32">
               <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-6">
                 <div>
                   <h2 className="text-4xl font-serif font-black text-primary leading-tight">
                     {selectedState ? `${selectedState} ` : "India "}
                     <span className="text-accent italic">Packages.</span>
                   </h2>
                   <p className="text-slate-500 font-medium mt-2">Showing {filteredPackages.length} curated itineraries.</p>
                 </div>

                 {/* View Mode Toggle */}
                 <div className="flex items-center bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit">
                    <button 
                      onClick={() => setViewMode("list")}
                      className={`p-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "list" ? "bg-primary text-white shadow-md" : "text-slate-400 hover:text-primary"}`}
                    >
                      <ListIcon className="w-4 h-4" /> <span className="hidden sm:inline">List</span>
                    </button>
                    <button 
                      onClick={() => setViewMode("grid")}
                      className={`p-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "grid" ? "bg-primary text-white shadow-md" : "text-slate-400 hover:text-primary"}`}
                    >
                      <LayoutGrid className="w-4 h-4" /> <span className="hidden sm:inline">Grid</span>
                    </button>
                 </div>
               </div>

               {/* Packages Grid/List */}
               {filteredPackages.length > 0 ? (
                 <div className={viewMode === "list" ? "flex flex-col gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-8"}>
                   {filteredPackages.map((pkg: any, idx: number) => (
                     <motion.div 
                       key={pkg.id}
                       initial={{ opacity: 0, y: 20 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                       viewport={{ once: true }}
                     >
                       <PackageCard pkg={pkg} variant={viewMode === "list" ? "horizontal" : "default"} />
                     </motion.div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                   <MapPin className="h-16 w-16 text-slate-200 mx-auto mb-6" />
                   <h3 className="text-2xl font-serif font-black text-primary italic mb-3">No packages found.</h3>
                   <p className="text-slate-500 font-medium">Try selecting a different state or view all packages.</p>
                   <button 
                     onClick={() => setSelectedState(null)}
                     className="mt-8 bg-primary text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform"
                   >
                     View All India Packages
                   </button>
                 </div>
               )}
            </section>

            {/* Popular States Grid (Visual Navigation) */}
            {selectedState === null && (
              <section className="pt-10 border-t border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-1 bg-accent rounded-full" />
                   <span className="text-accent text-[11px] font-black uppercase tracking-[0.3em]">Destinations</span>
                </div>
                <h2 className="text-4xl font-serif font-black text-primary italic mb-10">Popular States.</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayStates.map((state: any) => (
                    <Link key={state.slug} href={`/india/${state.slug}`}>
                      <div className="group overflow-hidden rounded-3xl bg-slate-900 shadow-xl shadow-slate-200/50 relative h-64">
                        <img 
                          src={state.imageUrl || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600"} 
                          alt={state.name} 
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B1A] via-transparent to-transparent" />
                        <div className="absolute bottom-5 left-5 right-5">
                          <span className="inline-block bg-accent/20 backdrop-blur-md border border-accent/30 text-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] rounded-full mb-3">
                            {state.tagline || "Explore"}
                          </span>
                          <h3 className="text-2xl font-serif font-black text-white italic">{state.name}</h3>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            
          </div>
        </div>
      </main>
    </div>
  );
}
