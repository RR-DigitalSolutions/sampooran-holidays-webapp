"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Building2, SlidersHorizontal, ArrowUpDown, Sparkles, Star, ChevronRight, ShieldCheck } from "lucide-react";
import { HotelCard } from "@/components/HotelCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function HotelsClient() {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDest, setSelectedDest] = useState<string | null>(null);

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      const res = await fetch(`${API_BASE}/ota/hotels`); 
      const data = await res.json();
      setHotels(data);
    } catch (e) {
      console.error("Failed to fetch stays:", e);
    } finally {
      setLoading(false);
    }
  };

  // Group by destination
  const destinations = Array.from(new Set(hotels.map(h => h.destinationName || 'Himalayas')));
  
  const filteredHotels = hotels.filter(h => {
    const name = h.name || "";
    const address = h.address || "";
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || 
                          address.toLowerCase().includes(search.toLowerCase());
    const matchesDest = !selectedDest || (h.destinationName || 'Himalayas') === selectedDest;
    return matchesSearch && matchesDest;
  });

  return (
    <div className="bg-slate-50 pb-32">
      {/* Premium Hero Header */}
      <div className="relative bg-[#0A0D17] pt-32 pb-44 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600" 
            className="w-full h-full object-cover opacity-30 grayscale-[0.5]" 
            alt="Search Hotels"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0D17] via-transparent to-[#0A0D17]" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 mx-auto">
               <Sparkles className="h-4 w-4 text-accent" />
               <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Himalayan Luxury Collection</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-serif font-black text-white tracking-tighter leading-none italic">
              Extraordinary <span className="text-accent not-italic">Stays.</span>
            </h1>
            
            <p className="text-slate-300 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed opacity-80">
              Discover a curated selection of Himachal's most iconic retreats, from boutique mountain lodges to grand luxury resorts.
            </p>

            <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-3 shadow-2xl flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                <input 
                  placeholder="Search by name, location or landmark..." 
                  className="w-full bg-white/5 border-none h-16 pl-14 pr-6 rounded-3xl text-white font-bold placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className="h-16 px-12 rounded-3xl bg-accent text-accent-foreground font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-accent/20">
                Explore Stays
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating Filter Bar */}
      <div className="container mx-auto px-4 -mt-10 relative z-20">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.05)] p-4 overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full lg:w-auto pb-2 lg:pb-0">
               <button 
                 onClick={() => setSelectedDest(null)}
                 className={cn(
                   "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                   !selectedDest ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                 )}
               >
                 All Destinations
               </button>
               {destinations.map(dest => (
                 <button 
                   key={dest}
                   onClick={() => setSelectedDest(dest)}
                   className={cn(
                     "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                     selectedDest === dest ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                   )}
                 >
                   {dest}
                 </button>
               ))}
            </div>

            <div className="flex items-center gap-4 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
               <button className="flex items-center gap-2 px-6 py-3 rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-primary transition-all group">
                  <ArrowUpDown className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Pricing</span>
               </button>
               <button className="flex items-center gap-2 px-6 py-3 rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-primary transition-all group">
                  <SlidersHorizontal className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Listing Section */}
      <div className="container mx-auto px-4 py-24">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10"
            >
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden space-y-4">
                   <div className="h-64 bg-slate-100 animate-pulse" />
                   <div className="p-6 space-y-4">
                      <div className="h-6 bg-slate-100 animate-pulse rounded-lg w-3/4" />
                      <div className="h-4 bg-slate-100 animate-pulse rounded-lg w-1/2" />
                      <div className="h-12 bg-slate-100 animate-pulse rounded-xl w-full" />
                   </div>
                </div>
              ))}
            </motion.div>
          ) : filteredHotels.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-40 bg-white rounded-[4rem] border border-dashed border-slate-200"
            >
               <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-inner">
                 <Building2 className="h-10 w-10 text-slate-300" />
               </div>
               <h3 className="text-4xl font-serif font-black text-primary mb-4 tracking-tight">No hideaways found.</h3>
               <p className="text-slate-400 font-medium max-w-sm mx-auto mb-10 leading-relaxed">We couldn't find any properties matching your exact search. Try exploring other Himalayan gems.</p>
               <button 
                 onClick={() => { setSearch(""); setSelectedDest(null); }} 
                 className="px-10 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
               >
                 Reset All Filters
               </button>
            </motion.div>
          ) : (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-32"
            >
              {selectedDest ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                  {filteredHotels.map(hotel => <HotelCard key={hotel.id} hotel={hotel} />)}
                </div>
              ) : (
                destinations.map((dest, idx) => {
                  const destHotels = filteredHotels.filter(h => (h.destinationName || 'Himalayas') === dest);
                  if (destHotels.length === 0) return null;
                  return (
                    <div key={dest} className="space-y-12">
                       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8 relative">
                          <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 bg-primary/5 px-4 py-1.5 rounded-full">
                               <MapPin className="text-primary h-3.5 w-3.5" />
                               <span className="text-[10px] font-black text-primary uppercase tracking-widest">{dest} Region</span>
                            </div>
                            <h2 className="text-5xl font-serif font-black tracking-tight leading-none italic">
                              Curated <span className="text-primary not-italic">{dest}.</span>
                            </h2>
                            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">
                               {destHotels.length} Luxury Properties Verified
                            </p>
                          </div>
                          <button className="group flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] group transition-all">
                             Discover More <ChevronRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
                          </button>
                          <div className="absolute -bottom-px left-0 w-32 h-[1px] bg-primary" />
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                          {destHotels.slice(0, 4).map(hotel => <HotelCard key={hotel.id} hotel={hotel} />)}
                       </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Premium CTA Section */}
      <div className="container mx-auto px-4 mt-20">
         <div className="bg-[#0A0D17] rounded-[4rem] p-12 md:p-24 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-1/2 h-full z-0 pointer-events-none opacity-30 bg-linear-to-l from-primary/40 to-transparent" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent/10 blur-[120px] rounded-full" />
            
            <div className="max-w-3xl space-y-10 relative z-10">
               <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-5 py-2 rounded-full backdrop-blur-md">
                  <Building2 className="h-4 w-4 text-accent" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Vendor Partnerships</span>
               </div>
               
               <h2 className="text-5xl md:text-7xl font-serif font-black leading-none tracking-tighter italic">
                 Elevate Your <br /><span className="text-accent not-italic">Hospitality Business.</span>
               </h2>
               
               <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed max-w-2xl">
                 Join the standard of Himalayan excellence. List your hotel, resort, or boutique stay on Himachal's most trusted travel ecosystem.
               </p>
               
               <div className="flex flex-wrap gap-6 pt-4">
                  <button className="bg-white text-primary px-12 h-16 rounded-[1.25rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-white/5 hover:scale-105 active:scale-95 transition-all">
                    Register Facility
                  </button>
                  <button className="bg-white/5 border border-white/10 text-white px-10 h-16 rounded-[1.25rem] font-bold tracking-tight hover:bg-white/10 transition-all flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-500" /> Professional Certification
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
