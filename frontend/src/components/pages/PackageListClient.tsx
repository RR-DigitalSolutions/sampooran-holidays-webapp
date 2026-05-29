"use client";

import { useListPackages } from "@workspace/api-client-react";
import { PackageCard } from "@/components/PackageCard";
import { useState } from "react";
import { List as ListIcon, LayoutGrid, Filter, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function PackageListClient({ slug }: { slug: string }) {
  const { data } = useListPackages();
  const packages = data?.packages || [];
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // In a real scenario, the API would handle the `slug` filtering (e.g. `himachal-holiday-tour-packages`).
  // For now, we'll do a simple substring match on the frontend to demonstrate functionality.
  const query = slug.replace("-holiday-tour-packages", "").replace("-tour-packages", "").toLowerCase();
  
  const filteredPackages = packages.filter(p => 
    p.name.toLowerCase().includes(query) || 
    p.stateName?.toLowerCase().includes(query) ||
    p.destinationName?.toLowerCase().includes(query) ||
    p.cities?.some(c => c.toLowerCase().includes(query))
  );

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <div className="bg-[#0A0B1A] pt-32 pb-16 text-center text-white">
         <h1 className="text-4xl md:text-6xl font-serif font-black mb-4 capitalize">{slug.replace(/-/g, " ")}</h1>
         <p className="text-slate-400 font-medium max-w-xl mx-auto">Explore our carefully curated selection of packages tailored for your perfect getaway.</p>
      </div>

      <main className="container mx-auto px-4 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
           <div className="text-slate-500 font-bold">
             Found <span className="text-primary">{filteredPackages.length}</span> packages
           </div>
           
           <div className="flex items-center gap-4">
             <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold shadow-sm hover:border-primary transition-colors">
               <Filter className="w-4 h-4"/> Filter
             </button>
             <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold shadow-sm hover:border-primary transition-colors">
               <SlidersHorizontal className="w-4 h-4"/> Sort
             </button>
             <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-slate-100 text-primary" : "text-slate-400"}`}>
                  <ListIcon className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-slate-100 text-primary" : "text-slate-400"}`}>
                  <LayoutGrid className="w-4 h-4" />
                </button>
             </div>
           </div>
        </div>

        {filteredPackages.length > 0 ? (
          <div className={viewMode === "list" ? "flex flex-col gap-6" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"}>
            {filteredPackages.map((pkg: any, i: number) => (
               <motion.div key={pkg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                 <PackageCard pkg={pkg} variant={viewMode === "list" ? "horizontal" : "default"} />
               </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <h3 className="text-2xl font-serif font-black text-primary mb-2">No packages found</h3>
            <p className="text-slate-500 mb-6">We couldn't find any packages matching "{slug}".</p>
            <Link href="/packages">
              <button className="bg-primary text-white px-6 py-3 rounded-lg font-bold">View All Packages</button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
