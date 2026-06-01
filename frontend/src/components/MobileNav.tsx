import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, MapPin, Globe, Sparkles, Building2, User, Phone, Briefcase, Compass, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---
type DynamicData = {
  indiaZones?: any[];
  worldRegions?: any[];
};

type ViewState = 'main' | 'india' | 'world';

export function MobileNav({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [view, setView] = useState<ViewState>('main');
  const [data, setData] = useState<DynamicData | null>(null);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8080/api/destinations/mega-menu")
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  // Reset view when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setView('main');
        setExpandedRegion(null);
      }, 300);
    }
  }, [isOpen]);

  const slideVariants = {
    initial: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] lg:hidden bg-slate-900/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-white flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white">
              <Link href="/" onClick={onClose} className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <img src="/logo.png" className="w-5 h-5 brightness-0 invert" alt="Logo" />
                </div>
                <span className="font-serif font-bold text-primary text-lg leading-none">Sampooran</span>
              </Link>
              <button 
                onClick={onClose} 
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Action - Fixed at top */}
            <div className="p-5 border-b border-slate-50 bg-slate-50/50">
              <Link href="/login" onClick={onClose} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Login / Sign Up</p>
                  <p className="text-[11px] text-slate-500">Manage your bookings</p>
                </div>
              </Link>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-x-hidden overflow-y-auto relative bg-white">
              <AnimatePresence initial={false} custom={view === 'main' ? -1 : 1}>
                {view === 'main' && (
                  <motion.div
                    key="main"
                    custom={-1}
                    variants={slideVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="absolute inset-0 w-full h-fit p-5 space-y-2"
                  >
                    <button 
                      onClick={() => setView('india')}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm active:scale-95 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-slate-700 text-[15px]">India</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>

                    <button 
                      onClick={() => setView('world')}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm active:scale-95 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Globe className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-slate-700 text-[15px]">World</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>

                    <div className="pt-4 pb-2">
                      <div className="h-px bg-slate-100 w-full mb-4"></div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-3">More Links</h4>
                      <div className="space-y-1">
                        {[
                          { icon: Sparkles, label: "Customized Holidays", href: "/customized-holidays" },
                          { icon: Briefcase, label: "Corporate Travel", href: "/corporate-travel" },
                          { icon: Compass, label: "Travel Guide", href: "/travel-guide" },
                          { icon: Building2, label: "B2B Login", href: "/b2b" },
                          { icon: Phone, label: "Contact Us", href: "/contact" }
                        ].map(item => (
                          <Link 
                            key={item.label} 
                            href={item.href}
                            onClick={onClose}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"
                          >
                            <item.icon className="w-4 h-4 text-slate-400" />
                            <span className="font-semibold text-[14px]">{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {view === 'india' && (
                  <motion.div
                    key="india"
                    custom={1}
                    variants={slideVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="absolute inset-0 w-full h-fit bg-white"
                  >
                    <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 p-4 border-b border-slate-100 flex items-center gap-3">
                      <button onClick={() => setView('main')} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-slate-100">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="font-bold text-slate-800 text-lg">India Destinations</span>
                    </div>
                    <div className="p-4 space-y-3">
                      {data?.indiaZones ? data.indiaZones.map((zone: any) => (
                        <div key={zone.name} className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                          <button 
                            onClick={() => setExpandedRegion(expandedRegion === zone.name ? null : zone.name)}
                            className="w-full flex items-center justify-between p-4 bg-white"
                          >
                            <span className="font-bold text-slate-700">{zone.name}</span>
                            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", expandedRegion === zone.name && "rotate-180")} />
                          </button>
                          
                          <AnimatePresence>
                            {expandedRegion === zone.name && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 pt-2 space-y-4">
                                  {zone.states.map((state: any) => (
                                    <div key={state.title}>
                                      <Link 
                                        href={`/${state.slug}-tour-packages`} 
                                        onClick={onClose}
                                        className="text-[13px] font-bold text-primary block mb-2"
                                      >
                                        {state.title}
                                      </Link>
                                      <div className="flex flex-wrap gap-2">
                                        {state.items.map((item: any) => (
                                          <Link
                                            key={item.slug || item.name}
                                            href={`/${item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-tour-packages`}
                                            onClick={onClose}
                                            className="text-[11px] font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full"
                                          >
                                            {item.name}
                                          </Link>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )) : (
                        <div className="p-8 text-center text-slate-400 text-sm">Loading destinations...</div>
                      )}
                      
                      <div className="pt-4">
                        <Link href="/india-tour-packages" onClick={onClose} className="w-full block text-center py-3 rounded-xl bg-orange-50 text-orange-600 font-bold text-[13px]">
                          View All India Packages
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}

                {view === 'world' && (
                  <motion.div
                    key="world"
                    custom={1}
                    variants={slideVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="absolute inset-0 w-full h-fit bg-white"
                  >
                    <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 p-4 border-b border-slate-100 flex items-center gap-3">
                      <button onClick={() => setView('main')} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-slate-100">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="font-bold text-slate-800 text-lg">World Destinations</span>
                    </div>
                    <div className="p-4 space-y-3">
                      {data?.worldRegions ? data.worldRegions.map((region: any) => (
                        <div key={region.name} className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                          <button 
                            onClick={() => setExpandedRegion(expandedRegion === region.name ? null : region.name)}
                            className="w-full flex items-center justify-between p-4 bg-white"
                          >
                            <span className="font-bold text-slate-700">{region.name}</span>
                            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", expandedRegion === region.name && "rotate-180")} />
                          </button>
                          
                          <AnimatePresence>
                            {expandedRegion === region.name && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 pt-2 space-y-4">
                                  {region.countries.map((country: any) => (
                                    <div key={country.name}>
                                      <Link 
                                        href={`/${country.slug}-tour-packages`} 
                                        onClick={onClose}
                                        className="text-[13px] font-bold text-primary block mb-2"
                                      >
                                        {country.name}
                                      </Link>
                                      {country.destinations && country.destinations.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                          {country.destinations.map((dest: any) => (
                                            <Link
                                              key={dest.slug || dest.name}
                                              href={`/${dest.slug || dest.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-tour-packages`}
                                              onClick={onClose}
                                              className="text-[11px] font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full"
                                            >
                                              {dest.name}
                                            </Link>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )) : (
                        <div className="p-8 text-center text-slate-400 text-sm">Loading destinations...</div>
                      )}
                      
                      <div className="pt-4">
                        <Link href="/world-tour-packages" onClick={onClose} className="w-full block text-center py-3 rounded-xl bg-blue-50 text-blue-600 font-bold text-[13px]">
                          View All World Packages
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-100 bg-white flex gap-3 pb-safe">
              <a href="tel:+918595513009" className="flex-1 bg-slate-100 text-slate-700 py-3.5 rounded-xl font-bold uppercase text-[11px] tracking-widest text-center flex items-center justify-center gap-2 transition-colors active:bg-slate-200">
                <Phone className="w-3.5 h-3.5" /> Call Expert
              </a>
              <Link href="/customized-holidays" onClick={onClose} className="flex-1 bg-accent text-accent-foreground py-3.5 rounded-xl font-bold uppercase text-[11px] tracking-widest text-center shadow-lg shadow-accent/20 active:scale-95 transition-all">
                Enquire Now
              </Link>
            </div>
          </motion.div>
          
          {/* Invisible click area to close */}
          <div className="absolute inset-y-0 right-0 w-[15%]" onClick={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
