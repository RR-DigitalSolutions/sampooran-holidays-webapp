"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, List as ListIcon, LayoutGrid, MapPin, Sparkles, Globe } from "lucide-react";
import { PackageCard } from "@/components/PackageCard";
import { motion } from "framer-motion";
import { useListPackages } from "@workspace/api-client-react";

const CONTINENTS = [
  { name: "Asia", slug: "asia", tagline: "Mystical Lands", imageUrl: "https://images.unsplash.com/photo-1535139262971-c51845709a48?w=600" },
  { name: "Europe", slug: "europe", tagline: "Old World Charm", imageUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600" },
  { name: "Middle East", slug: "middle-east", tagline: "Desert Marvels", imageUrl: "https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=600" },
  { name: "Americas", slug: "americas", tagline: "New World Wonders", imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600" },
];

export default function WorldClient() {
  const { data: pkgData } = useListPackages();
  const packages = pkgData?.packages || []; // Filter to international packages if you have a flag, otherwise all packages.
  
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null);

  // For demonstration, let's just use all packages or ideally filter by regionId/countryId.
  const filteredPackages = selectedContinent 
    ? packages.filter((pkg: any) => pkg.category?.toLowerCase() === selectedContinent.toLowerCase()) // Adjust this condition based on how continents map to packages
    : packages;

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <section className="relative overflow-hidden bg-[#0A0B1A] text-white pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(14,165,233,0.15),_transparent_60%)]" />
           <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(139,92,246,0.1),_transparent_60%)]" />
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-5xl">
            <nav className="text-white/50 text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex flex-wrap items-center gap-2">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-accent">World</span>
            </nav>

            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-accent mb-4 border border-accent/30 bg-accent/10 px-4 py-1.5 rounded-full inline-block backdrop-blur-md">
              International Travel
            </p>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-black leading-[0.9] tracking-tight mb-8">
              Explore <span className="block text-accent">The Globe.</span>
            </h1>
            
            <p className="max-w-2xl text-slate-300 text-lg md:text-xl font-medium leading-relaxed mb-10">
              Discover breathtaking international destinations curated for every type of traveler. Unforgettable experiences await.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="#packages" className="inline-flex items-center justify-center rounded-xl bg-accent px-8 py-4 text-[11px] font-black uppercase tracking-widest text-white shadow-2xl shadow-accent/20 hover:bg-accent/90 transition-all hover:-translate-y-1">
                Browse Packages
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16">
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
              <h3 className="text-2xl font-serif font-black text-primary italic mb-6">Filter by <span className="text-accent not-italic">Region.</span></h3>
              
              <div className="space-y-1">
                <button 
                  onClick={() => setSelectedContinent(null)}
                  className={`w-full text-left flex items-center justify-between p-3 rounded-xl transition-all ${selectedContinent === null ? "bg-accent/10 text-accent font-bold" : "text-slate-500 font-medium hover:bg-slate-50 hover:text-primary"}`}
                >
                  <span>All World Packages</span>
                </button>

                {CONTINENTS.map((cont: any) => (
                    <button 
                      key={cont.slug}
                      onClick={() => setSelectedContinent(cont.name)}
                      className={`w-full text-left flex items-center justify-between p-3 rounded-xl transition-all ${selectedContinent === cont.name ? "bg-accent/10 text-accent font-bold" : "text-slate-500 font-medium hover:bg-slate-50 hover:text-primary"}`}
                    >
                      <span className="line-clamp-1">{cont.name}</span>
                    </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-9 space-y-16">
            <section id="packages" className="scroll-mt-32">
               <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-6">
                 <div>
                   <h2 className="text-4xl font-serif font-black text-primary leading-tight">
                     {selectedContinent ? `${selectedContinent} ` : "World "}
                     <span className="text-accent italic">Packages.</span>
                   </h2>
                   <p className="text-slate-500 font-medium mt-2">Showing curated itineraries.</p>
                 </div>

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
                   <Globe className="h-16 w-16 text-slate-200 mx-auto mb-6" />
                   <h3 className="text-2xl font-serif font-black text-primary italic mb-3">No packages found.</h3>
                   <p className="text-slate-500 font-medium">Try selecting a different region or view all packages.</p>
                   <button 
                     onClick={() => setSelectedContinent(null)}
                     className="mt-8 bg-primary text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform"
                   >
                     View All World Packages
                   </button>
                 </div>
               )}
            </section>

            {selectedContinent === null && (
              <section className="pt-10 border-t border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-1 bg-accent rounded-full" />
                   <span className="text-accent text-[11px] font-black uppercase tracking-[0.3em]">Regions</span>
                </div>
                <h2 className="text-4xl font-serif font-black text-primary italic mb-10">Popular Continents.</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {CONTINENTS.map((cont: any) => (
                    <Link key={cont.slug} href={`/world-tourism/${cont.slug}`}>
                      <div className="group overflow-hidden rounded-3xl bg-slate-900 shadow-xl shadow-slate-200/50 relative h-64">
                        <img 
                          src={cont.imageUrl} 
                          alt={cont.name} 
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B1A] via-transparent to-transparent" />
                        <div className="absolute bottom-5 left-5 right-5">
                          <span className="inline-block bg-accent/20 backdrop-blur-md border border-accent/30 text-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] rounded-full mb-3">
                            {cont.tagline || "Explore"}
                          </span>
                          <h3 className="text-2xl font-serif font-black text-white italic">{cont.name}</h3>
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
