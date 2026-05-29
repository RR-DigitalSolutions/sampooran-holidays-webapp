"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useListPackages } from "@workspace/api-client-react";
import { PackageCard } from "@/components/PackageCard";
import { ChevronRight, CheckCircle2, Sparkles, Phone, List as ListIcon, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const REGION_DATA: Record<string, any> = {
  "asia": {
    name: "Asia", tagline: "Mystical Lands",
    description: "Explore the diverse cultures, ancient history, and stunning landscapes of Asia.",
    imageUrl: "https://images.unsplash.com/photo-1535139262971-c51845709a48?w=1920",
    highlights: ["Rich Cultural Heritage", "Exotic Cuisines", "Ancient Temples", "Vibrant Cities"],
    countries: [
      { name: "Japan", slug: "japan-tourism", desc: "Land of the Rising Sun" },
      { name: "Thailand", slug: "thailand-tourism", desc: "Land of Smiles" },
      { name: "Vietnam", slug: "vietnam-tourism", desc: "Breathtaking landscapes" },
    ],
  },
  "europe": {
    name: "Europe", tagline: "Old World Charm",
    description: "Discover the romance, history, and architectural marvels of Europe.",
    imageUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1920",
    highlights: ["Historical Monuments", "Art Museums", "Scenic Train Rides", "Culinary Delights"],
    countries: [
      { name: "France", slug: "france-tourism", desc: "Romance and culture" },
      { name: "Italy", slug: "italy-tourism", desc: "Art, history, and food" },
      { name: "Switzerland", slug: "switzerland-tourism", desc: "Alpine wonders" },
    ],
  }
};

export default function RegionPageClient({ regionSlug: propRegionSlug }: { regionSlug?: string }) {
  const params = useParams<{ continent: string }>();
  const regionSlug = propRegionSlug || params?.continent || "asia";
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  
  const s = REGION_DATA[regionSlug] || REGION_DATA["asia"];
  const { data: pkgData } = useListPackages();
  const packages = pkgData?.packages || [];

  return (
    <div className="bg-slate-50 font-sans min-h-screen">
      <section className="relative h-[65vh] min-h-[480px] max-h-[720px] overflow-hidden -mt-24 md:-mt-28 group">
        <motion.div initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 2 }} className="absolute inset-0">
          <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B1A] via-[#0A0B1A]/40 to-transparent" />
        </motion.div>

        <div className="absolute inset-x-0 bottom-0 pb-20 z-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                <nav className="flex items-center gap-2 text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                  <Link href="/" className="hover:text-white transition-colors">Home</Link>
                  <ChevronRight className="h-3 w-3 opacity-50" />
                  <Link href="/world-tourism" className="hover:text-white transition-colors">World</Link>
                  <ChevronRight className="h-3 w-3 opacity-50" />
                  <span className="text-accent underline underline-offset-4 decoration-2">{s.name}</span>
                </nav>

                <p className="text-accent text-[11px] font-black uppercase tracking-[0.4em] mb-4">{s.tagline}</p>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-black text-white mb-6 leading-[0.92] tracking-tight drop-shadow-2xl">
                  {s.name} <span className="text-accent">.</span>
                </h1>
                <p className="max-w-2xl text-base md:text-xl text-slate-100 font-medium leading-relaxed mb-10">
                  {s.description}
                </p>

                <div className="flex flex-wrap gap-4">
                  <Link href="#packages" className="inline-flex items-center justify-center rounded-full bg-accent px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-accent/30 hover:bg-accent/90 transition-all">
                    Explore Packages
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16">
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
              <h3 className="text-2xl font-serif font-black text-primary italic mb-6">Explore <span className="text-accent not-italic">Countries.</span></h3>
              <div className="space-y-2">
                {s.countries?.map((country: any, idx: number) => (
                  <Link 
                    key={idx} 
                    href={`/world-tourism/${regionSlug}/${country.slug}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <span className="font-bold text-slate-600 group-hover:text-primary">{country.name}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-accent transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="bg-[#0A0B1A] text-white rounded-[2rem] p-8 shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Sparkles className="h-32 w-32 text-accent" />
               </div>
               <div className="relative z-10">
                  <h3 className="text-2xl font-serif font-black mb-6 italic">Expert <span className="text-accent not-italic">Highlights.</span></h3>
                  <div className="space-y-4">
                    {s.highlights?.map((h: string, i: number) => (
                      <div key={i} className="flex items-start gap-4 group/item">
                        <div className="mt-1 shrink-0 w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover/item:bg-accent transition-all">
                           <CheckCircle2 className="h-3 w-3 text-accent group-hover/item:text-white" />
                        </div>
                        <span className="text-sm font-bold text-white/80 group-hover/item:text-white transition-colors leading-snug">{h}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>

          <div className="lg:col-span-9 space-y-16">
            <section id="packages" className="scroll-mt-32">
               <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-6">
                 <div>
                   <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-1 bg-accent rounded-full" />
                      <span className="text-accent text-[10px] font-black uppercase tracking-[0.3em]">Tours & Packages</span>
                   </div>
                   <h2 className="text-4xl md:text-5xl font-serif font-black text-primary italic leading-[1]">Featured <span className="text-accent not-italic">Packages.</span></h2>
                 </div>

                 <div className="flex items-center bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit">
                    <button onClick={() => setViewMode("list")} className={`p-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "list" ? "bg-primary text-white shadow-md" : "text-slate-400 hover:text-primary"}`}>
                      <ListIcon className="w-4 h-4" /> <span className="hidden sm:inline">List</span>
                    </button>
                    <button onClick={() => setViewMode("grid")} className={`p-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "grid" ? "bg-primary text-white shadow-md" : "text-slate-400 hover:text-primary"}`}>
                      <LayoutGrid className="w-4 h-4" /> <span className="hidden sm:inline">Grid</span>
                    </button>
                 </div>
               </div>

               {packages.length > 0 ? (
                 <div className={viewMode === "list" ? "flex flex-col gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-8"}>
                   {packages.slice(0,4).map((pkg: any, idx: number) => (
                     <motion.div key={pkg.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} viewport={{ once: true }}>
                       <PackageCard pkg={pkg} variant={viewMode === "list" ? "horizontal" : "default"} />
                     </motion.div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                   <Sparkles className="h-16 w-16 text-slate-200 mx-auto mb-6" />
                   <h3 className="text-2xl font-serif font-black text-primary italic mb-3">Packages arriving soon.</h3>
                   <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8">Our curators are currently crafting exclusive deals for {s.name}.</p>
                 </div>
               )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
