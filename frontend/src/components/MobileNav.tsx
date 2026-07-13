import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { X, ChevronRight, ChevronLeft, MapPin, Globe, Sparkles, Building2, User, Phone, Briefcase, Compass, ChevronDown, GraduationCap, Plane, Handshake, BookOpen, Car } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---
type DynamicData = {
  indiaZones?: any[];
  worldRegions?: any[];
};

type ViewState = 'main' | 'india' | 'world' | 'services' | 'hotels' | 'transport';

export function MobileNav({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [view, setView] = useState<ViewState>('main');
  const [data, setData] = useState<DynamicData | null>(null);
  const [hotelsData, setHotelsData] = useState<any>(null);
  const [transportData, setTransportData] = useState<any>(null);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const [expandedSubRegion, setExpandedSubRegion] = useState<string | null>(null);

  const toggleSubRegion = (key: string) => {
    setExpandedSubRegion(expandedSubRegion === key ? null : key);
  };

  useEffect(() => {
    fetch("/api/destinations/mega-menu")
      .then(async res => {
        if (!res.ok) return null;
        const text = await res.text();
        try { return JSON.parse(text); } catch { return null; }
      })
      .then(data => { if (data) setData(data); })
      .catch(err => console.warn("Failed to load mega menu:", err));
  }, []);

  useEffect(() => {
    fetch("/api/hotels/mega-menu")
      .then(async res => {
        if (!res.ok) return null;
        const text = await res.text();
        try { return JSON.parse(text); } catch { return null; }
      })
      .then(data => { if (data) setHotelsData(data); })
      .catch(err => console.warn("Failed to load hotels mega menu:", err));
  }, []);

  useEffect(() => {
    fetch("/api/transport/mega-menu")
      .then(async res => {
        if (!res.ok) return null;
        const text = await res.text();
        try { return JSON.parse(text); } catch { return null; }
      })
      .then(data => { if (data) setTransportData(data); })
      .catch(err => console.warn("Failed to load transport mega menu:", err));
  }, []);

  // Reset view when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setView('main');
        setExpandedRegion(null);
        setExpandedSubRegion(null);
      }, 300);
    }
  }, [isOpen]);

  // Reset expanded subregion when the main region/view changes
  useEffect(() => {
    setExpandedSubRegion(null);
  }, [expandedRegion, view]);

  const slideVariants: Variants = {
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
                aria-label="Close menu"
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
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#1e3a8a] flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                          <MapPin className="w-5 h-5 text-accent" />
                        </div>
                        <span className="font-semibold text-slate-800 text-[14px]">India Tours</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>

                    <button 
                      onClick={() => setView('world')}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm active:scale-95 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#1e3a8a] flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                          <Globe className="w-5 h-5 text-accent" />
                        </div>
                        <span className="font-semibold text-slate-800 text-[14px]">World Tours</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>

                    <button 
                      onClick={() => setView('hotels')}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm active:scale-95 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#1e3a8a] flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                          <Building2 className="w-5 h-5 text-accent" />
                        </div>
                        <span className="font-semibold text-slate-800 text-[14px]">Hotels</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>

                    <button 
                      onClick={() => setView('transport')}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm active:scale-95 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#1e3a8a] flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                          <Car className="w-5 h-5 text-accent" />
                        </div>
                        <span className="font-semibold text-slate-800 text-[14px]">Transport</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>

                    <button 
                      onClick={() => setView('services')}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm active:scale-95 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#1e3a8a] flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                          <Briefcase className="w-5 h-5 text-accent" />
                        </div>
                        <span className="font-semibold text-slate-800 text-[14px]">Group Tours</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>

                    <div className="pt-4 pb-2">
                      <div className="h-px bg-slate-100 w-full mb-4"></div>
                      <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-2 mb-3">More Links</h4>
                      <div className="space-y-1">
                        {[
                          { icon: Plane, label: "Inbound", href: "/inbound" },
                          { icon: BookOpen, label: "Travel Guide", href: "/travel-guide" },
                          { icon: Handshake, label: "B2B", href: "/b2b" },
                          { icon: Phone, label: "Contact Us", href: "/contact" },
                        ].map(item => (
                          <Link 
                            key={item.label} 
                            href={item.href}
                            onClick={onClose}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-[#1e3a8a] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                              <item.icon className="w-4 h-4 text-accent" />
                            </div>
                            <span className="font-medium text-[14px] text-slate-700 group-hover:text-primary transition-colors">{item.label}</span>
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
                      <button onClick={() => setView('main')} aria-label="Back to menu" className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-slate-100">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="font-semibold text-slate-900 text-base">India Destinations</span>
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
                                  {zone.states.map((state: any) => {
                                    const subRegionKey = `india-${state.slug}`;
                                    const isSubExpanded = expandedSubRegion === subRegionKey;
                                    return (
                                      <div key={state.title} className="border-b border-slate-100/80 last:border-0 pb-3 last:pb-0">
                                        <button 
                                          onClick={() => toggleSubRegion(subRegionKey)}
                                          className="w-full flex items-center justify-between py-2 text-left"
                                        >
                                          <span className="text-[13px] font-semibold text-slate-900 hover:text-primary transition-colors">
                                            {state.title.toLowerCase().endsWith('tours') ? state.title : `${state.title} Tours`}
                                          </span>
                                          <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", isSubExpanded && "rotate-180")} />
                                        </button>
                                        
                                        <AnimatePresence>
                                          {isSubExpanded && (
                                            <motion.div
                                              initial={{ height: 0, opacity: 0 }}
                                              animate={{ height: "auto", opacity: 1 }}
                                              exit={{ height: 0, opacity: 0 }}
                                              className="overflow-hidden"
                                            >
                                              <div className="pt-2 pb-1">
                                                <div className="flex flex-wrap gap-2">
                                                  <Link 
                                                    href={`/${state.slug}-tour-packages`} 
                                                    onClick={onClose}
                                                    className="group flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-full hover:bg-primary hover:text-white transition-all"
                                                  >
                                                    <Sparkles className="w-3 h-3 text-accent shrink-0" />
                                                    <span>All {state.title} Packages</span>
                                                  </Link>
                                                  {state.items.map((item: any) => (
                                                    <Link
                                                      key={item.slug || item.name}
                                                      href={`/${item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-tour-packages`}
                                                      onClick={onClose}
                                                      className="group flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:border-primary hover:text-primary transition-all"
                                                    >
                                                      <MapPin className="w-3 h-3 text-slate-400 group-hover:text-accent transition-colors shrink-0" />
                                                      <span>{item.name.toLowerCase().endsWith('tours') ? item.name : `${item.name} Tours`}</span>
                                                    </Link>
                                                  ))}
                                                </div>
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    );
                                  })}
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

                {view === 'services' && (
                  <motion.div
                    key="services"
                    custom={1}
                    variants={slideVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="absolute inset-0 w-full h-fit bg-white"
                  >
                    <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 p-4 border-b border-slate-100 flex items-center gap-3">
                      <button onClick={() => setView('main')} aria-label="Back to menu" className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-slate-100">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="font-semibold text-slate-900 text-base">Group Tours</span>
                    </div>
                    <div className="p-4 space-y-2">
                        {[
                          { icon: MapPin, label: "Customize Holidays", href: "/customized-holidays" },
                          { icon: Briefcase, label: "Corporate Travel", href: "/corporate-travel" },
                          { icon: GraduationCap, label: "School & Collage Trip", href: "/school-collage-trip" }
                        ].map(item => (
                          <Link 
                            key={item.label} 
                            href={item.href}
                            onClick={onClose}
                            className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 shadow-sm active:scale-95 transition-all bg-white group hover:border-primary/20"
                          >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#1e3a8a] flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform">
                              <item.icon className="w-5 h-5 text-accent" />
                            </div>
                            <span className="font-semibold text-slate-900 text-[14px] group-hover:text-primary transition-colors">{item.label}</span>
                          </Link>
                        ))}
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
                      <button onClick={() => setView('main')} aria-label="Back to menu" className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-slate-100">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="font-semibold text-slate-900 text-base">World Destinations</span>
                    </div>
                    <div className="p-4 space-y-3">
                      {data?.worldRegions ? data.worldRegions.map((region: any) => (
                        <div key={region.name} className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                          <button 
                            onClick={() => setExpandedRegion(expandedRegion === region.name ? null : region.name)}
                            className="w-full flex items-center justify-between p-4 bg-white"
                          >
                            <span className="font-semibold text-slate-900">{region.name}</span>
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
                                  {region.countries.map((country: any) => {
                                    const subRegionKey = `world-${country.slug}`;
                                    const isSubExpanded = expandedSubRegion === subRegionKey;
                                    return (
                                      <div key={country.name} className="border-b border-slate-100/80 last:border-0 pb-3 last:pb-0">
                                        <button 
                                          onClick={() => toggleSubRegion(subRegionKey)}
                                          className="w-full flex items-center justify-between py-2 text-left"
                                        >
                                          <span className="text-[13px] font-semibold text-slate-900 hover:text-primary transition-colors">
                                            {country.name.toLowerCase().endsWith('tours') ? country.name : `${country.name} Tours`}
                                          </span>
                                          <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", isSubExpanded && "rotate-180")} />
                                        </button>
                                        
                                        <AnimatePresence>
                                          {isSubExpanded && (
                                            <motion.div
                                              initial={{ height: 0, opacity: 0 }}
                                              animate={{ height: "auto", opacity: 1 }}
                                              exit={{ height: 0, opacity: 0 }}
                                              className="overflow-hidden"
                                            >
                                              <div className="pt-2 pb-1">
                                                <div className="flex flex-wrap gap-2">
                                                  <Link 
                                                    href={`/${country.slug}-tour-packages`} 
                                                    onClick={onClose}
                                                    className="group flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-full hover:bg-primary hover:text-white transition-all"
                                                  >
                                                    <Sparkles className="w-3 h-3 text-accent shrink-0" />
                                                    <span>All {country.name} Packages</span>
                                                  </Link>
                                                  {country.destinations && country.destinations.map((dest: any) => (
                                                    <Link
                                                      key={dest.slug || dest.name}
                                                      href={`/${dest.slug || dest.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-tour-packages`}
                                                      onClick={onClose}
                                                      className="group flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:border-primary hover:text-primary transition-all"
                                                    >
                                                      <MapPin className="w-3 h-3 text-slate-400 group-hover:text-accent transition-colors shrink-0" />
                                                      <span>{dest.name.toLowerCase().endsWith('tours') ? dest.name : `${dest.name} Tours`}</span>
                                                    </Link>
                                                  ))}
                                                </div>
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    );
                                  })}
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

                {view === 'transport' && (
                  <motion.div
                    key="transport"
                    custom={1}
                    variants={slideVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="absolute inset-0 w-full h-fit bg-white"
                  >
                    <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 p-4 border-b border-slate-100 flex items-center gap-3">
                      <button onClick={() => setView('main')} aria-label="Back to menu" className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-slate-100">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="font-semibold text-slate-900 text-base">Transport Directory</span>
                    </div>
                    <div className="p-4 space-y-3">
                      {/* India Zones */}
                      {(() => {
                        const regionsToRender = (transportData?.indiaZones && transportData.indiaZones.length > 0) || (transportData?.worldRegions && transportData.worldRegions.length > 0)
                          ? transportData
                          : hotelsData;

                        if (!regionsToRender) {
                          return <div className="p-8 text-center text-slate-400 text-sm">Loading transport regions...</div>;
                        }

                        return (
                          <>
                            {regionsToRender.indiaZones && regionsToRender.indiaZones.length > 0 && (
                              <>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 pb-1">🇮🇳 India</p>
                                {regionsToRender.indiaZones.map((zone: any) => (
                                  <div key={zone.name} className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                                    <button
                                      onClick={() => setExpandedRegion(expandedRegion === zone.name ? null : zone.name)}
                                      className="w-full flex items-center justify-between p-4 bg-white"
                                    >
                                      <span className="font-bold text-slate-700">{zone.name} Transport</span>
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
                                            {zone.states && zone.states.map((state: any) => {
                                              const subRegionKey = `transport-india-${state.slug}`;
                                              const isSubExpanded = expandedSubRegion === subRegionKey;
                                              return (
                                                <div key={state.title} className="border-b border-slate-100/80 last:border-0 pb-3 last:pb-0">
                                                  <button
                                                    onClick={() => toggleSubRegion(subRegionKey)}
                                                    className="w-full flex items-center justify-between py-2 text-left"
                                                  >
                                                    <span className="text-[13px] font-semibold text-slate-900 hover:text-primary transition-colors">
                                                      {state.title} Transport
                                                    </span>
                                                    <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", isSubExpanded && "rotate-180")} />
                                                  </button>
                                                  
                                                  <AnimatePresence>
                                                    {isSubExpanded && (
                                                      <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                      >
                                                        <div className="pt-2 pb-1">
                                                          <div className="flex flex-wrap gap-2">
                                                            <Link
                                                              href={`/transport?state=${state.slug}&country=india`}
                                                              onClick={onClose}
                                                              className="group flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-full hover:bg-primary hover:text-white transition-all"
                                                            >
                                                              <Sparkles className="w-3 h-3 text-accent shrink-0" />
                                                              <span>All {state.title} Transport</span>
                                                            </Link>
                                                            {state.items && state.items.map((item: any) => {
                                                              const itemSlug = typeof item === 'string' ? item.toLowerCase().replace(/[^a-z0-9]+/g, '-') : item?.slug;
                                                              const itemName = typeof item === 'string' ? item : item?.name;
                                                              return (
                                                                <Link
                                                                  key={itemSlug || itemName}
                                                                  href={`/transport?city=${itemSlug}&state=${state.slug}&country=india`}
                                                                  onClick={onClose}
                                                                  className="group flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:border-primary hover:text-primary transition-all"
                                                                >
                                                                  <MapPin className="w-3 h-3 text-slate-400 group-hover:text-accent transition-colors shrink-0" />
                                                                  <span>{itemName} Transport</span>
                                                                </Link>
                                                              );
                                                            })}
                                                          </div>
                                                        </div>
                                                      </motion.div>
                                                    )}
                                                  </AnimatePresence>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                ))}
                              </>
                            )}

                            {regionsToRender.worldRegions && regionsToRender.worldRegions.length > 0 && (
                              <>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 pt-2 pb-1">🌍 World</p>
                                {regionsToRender.worldRegions.map((region: any) => (
                                  <div key={region.name} className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                                    <button
                                      onClick={() => setExpandedRegion(expandedRegion === region.name ? null : region.name)}
                                      className="w-full flex items-center justify-between p-4 bg-white"
                                    >
                                      <span className="font-semibold text-slate-900">{region.name} Transport</span>
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
                                            {region.countries && region.countries.map((country: any) => {
                                              const subRegionKey = `transport-world-${country.slug}`;
                                              const isSubExpanded = expandedSubRegion === subRegionKey;
                                              return (
                                                <div key={country.name} className="border-b border-slate-100/80 last:border-0 pb-3 last:pb-0">
                                                  <button
                                                    onClick={() => toggleSubRegion(subRegionKey)}
                                                    className="w-full flex items-center justify-between py-2 text-left"
                                                  >
                                                    <span className="text-[13px] font-semibold text-slate-900 hover:text-primary transition-colors">
                                                      {country.name} Transport
                                                    </span>
                                                    <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", isSubExpanded && "rotate-180")} />
                                                  </button>
                                                  
                                                  <AnimatePresence>
                                                    {isSubExpanded && (
                                                      <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                      >
                                                        <div className="pt-2 pb-1">
                                                          <div className="flex flex-wrap gap-2">
                                                            <Link
                                                              href={`/transport?country=${country.slug}`}
                                                              onClick={onClose}
                                                              className="group flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-full hover:bg-primary hover:text-white transition-all"
                                                            >
                                                              <Sparkles className="w-3 h-3 text-accent shrink-0" />
                                                              <span>All {country.name} Transport</span>
                                                            </Link>
                                                            {country.destinations && country.destinations.map((dest: any) => (
                                                              <Link
                                                                key={dest.slug || dest.name}
                                                                href={`/transport?city=${dest.slug}&country=${country.slug}`}
                                                                onClick={onClose}
                                                                className="group flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:border-primary hover:text-primary transition-all"
                                                              >
                                                                <MapPin className="w-3 h-3 text-slate-400 group-hover:text-accent transition-colors shrink-0" />
                                                                <span>{dest.name} Transport</span>
                                                              </Link>
                                                            ))}
                                                          </div>
                                                        </div>
                                                      </motion.div>
                                                    )}
                                                  </AnimatePresence>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                ))}
                              </>
                            )}
                          </>
                        );
                      })()}

                      <div className="pt-4">
                        <Link href="/transport" onClick={onClose} className="w-full block text-center py-3 rounded-xl bg-primary/10 text-primary font-bold text-[13px]">
                          View All Transport
                        </Link>
                      </div>
                      <div className="pt-1">
                        <Link href="/transport-partner" onClick={onClose} className="w-full block text-center py-3 rounded-xl bg-accent/10 text-accent font-bold text-[13px]">
                          Become a Transport Partner
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}

                {view === 'hotels' && (
                  <motion.div
                    key="hotels"
                    custom={1}
                    variants={slideVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="absolute inset-0 w-full h-fit bg-white"
                  >
                    <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 p-4 border-b border-slate-100 flex items-center gap-3">
                      <button onClick={() => setView('main')} aria-label="Back to menu" className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-slate-100">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="font-semibold text-slate-900 text-base">Hotels Directory</span>
                    </div>
                    <div className="p-4 space-y-3">
                      {hotelsData?.indiaZones ? hotelsData.indiaZones.map((zone: any) => (
                        <div key={zone.name} className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                          <button 
                            onClick={() => setExpandedRegion(expandedRegion === zone.name ? null : zone.name)}
                            className="w-full flex items-center justify-between p-4 bg-white"
                          >
                            <span className="font-semibold text-slate-900">{zone.name} Hotels</span>
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
                                  {zone.states.map((state: any) => {
                                    const subRegionKey = `hotels-india-${state.slug}`;
                                    const isSubExpanded = expandedSubRegion === subRegionKey;
                                    return (
                                      <div key={state.title} className="border-b border-slate-100/80 last:border-0 pb-3 last:pb-0">
                                        <button
                                          onClick={() => toggleSubRegion(subRegionKey)}
                                          className="w-full flex items-center justify-between py-2 text-left"
                                        >
                                          <span className="text-[13px] font-semibold text-slate-900 hover:text-primary transition-colors">
                                            {state.title.toLowerCase().endsWith('hotels') ? state.title : `${state.title} Hotels`}
                                          </span>
                                          <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", isSubExpanded && "rotate-180")} />
                                        </button>
                                        
                                        <AnimatePresence>
                                          {isSubExpanded && (
                                            <motion.div
                                              initial={{ height: 0, opacity: 0 }}
                                              animate={{ height: "auto", opacity: 1 }}
                                              exit={{ height: 0, opacity: 0 }}
                                              className="overflow-hidden"
                                            >
                                              <div className="pt-2 pb-1">
                                                <div className="flex flex-wrap gap-2">
                                                  <Link
                                                    href={`/hotels/india/${state.slug}`}
                                                    onClick={onClose}
                                                    className="group flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-full hover:bg-primary hover:text-white transition-all"
                                                  >
                                                    <Sparkles className="w-3 h-3 text-accent shrink-0" />
                                                    <span>All {state.title.toLowerCase().endsWith('hotels') ? state.title : `${state.title} Hotels`}</span>
                                                  </Link>
                                                  {state.items.map((item: any) => {
                                                    const itemSlug = typeof item === 'string' ? item.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') : item?.slug;
                                                    const stateSlug = item.stateSlug || state.slug;
                                                    const isStateItem = item.isState;
                                                    
                                                    const href = isStateItem
                                                      ? `/hotels/india/${itemSlug}`
                                                      : `/hotels/india/${stateSlug}/hotels-in-${itemSlug}`;

                                                    return (
                                                      <Link
                                                        key={itemSlug}
                                                        href={href}
                                                        onClick={onClose}
                                                        className="group flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:border-primary hover:text-primary transition-all"
                                                      >
                                                        <MapPin className="w-3 h-3 text-slate-400 group-hover:text-accent transition-colors shrink-0" />
                                                        <span>{item.name.toLowerCase().endsWith('hotels') ? item.name : `${item.name} Hotels`}</span>
                                                      </Link>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )) : null}

                      {hotelsData?.worldRegions ? hotelsData.worldRegions.map((region: any) => (
                        <div key={region.name} className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                          <button 
                            onClick={() => setExpandedRegion(expandedRegion === region.name ? null : region.name)}
                            className="w-full flex items-center justify-between p-4 bg-white"
                          >
                            <span className="font-semibold text-slate-900">{region.name} Hotels</span>
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
                                  {region.countries.map((country: any) => {
                                    const subRegionKey = `hotels-world-${country.slug}`;
                                    const isSubExpanded = expandedSubRegion === subRegionKey;
                                    return (
                                      <div key={country.name} className="border-b border-slate-100/80 last:border-0 pb-3 last:pb-0">
                                        <button
                                          onClick={() => toggleSubRegion(subRegionKey)}
                                          className="w-full flex items-center justify-between py-2 text-left"
                                        >
                                          <span className="text-[13px] font-semibold text-slate-900 hover:text-primary transition-colors">
                                            {country.name.toLowerCase().endsWith('hotels') ? country.name : `${country.name} Hotels`}
                                          </span>
                                          <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", isSubExpanded && "rotate-180")} />
                                        </button>
                                        
                                        <AnimatePresence>
                                          {isSubExpanded && (
                                            <motion.div
                                              initial={{ height: 0, opacity: 0 }}
                                              animate={{ height: "auto", opacity: 1 }}
                                              exit={{ height: 0, opacity: 0 }}
                                              className="overflow-hidden"
                                            >
                                              <div className="pt-2 pb-1">
                                                <div className="flex flex-wrap gap-2">
                                                  <Link
                                                    href={`/hotels/${country.slug}`}
                                                    onClick={onClose}
                                                    className="group flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-full hover:bg-primary hover:text-white transition-all"
                                                  >
                                                    <Sparkles className="w-3 h-3 text-accent shrink-0" />
                                                    <span>All {country.name.toLowerCase().endsWith('hotels') ? country.name : `${country.name} Hotels`}</span>
                                                  </Link>
                                                  {country.destinations && country.destinations.map((dest: any) => {
                                                    const destSlug = dest.slug;
                                                    const stateSlug = dest.stateSlug || "all";
                                                    const isStateItem = dest.isState;

                                                    const href = isStateItem
                                                      ? `/hotels/${country.slug}/${destSlug}`
                                                      : `/hotels/${country.slug}/${stateSlug}/hotels-in-${destSlug}`;

                                                    return (
                                                      <Link
                                                        key={destSlug}
                                                        href={href}
                                                        onClick={onClose}
                                                        className="group flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:border-primary hover:text-primary transition-all"
                                                      >
                                                        <MapPin className="w-3 h-3 text-slate-400 group-hover:text-accent transition-colors shrink-0" />
                                                        <span>{dest.name.toLowerCase().endsWith('hotels') ? dest.name : `${dest.name} Hotels`}</span>
                                                      </Link>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )) : null}

                      {(!hotelsData?.indiaZones && !hotelsData?.worldRegions) && (
                        <div className="p-8 text-center text-slate-400 text-sm">Loading hotels directory...</div>
                      )}

                      <div className="pt-4">
                        <Link href="/hotels" onClick={onClose} className="w-full block text-center py-3 rounded-xl bg-blue-50 text-blue-600 font-bold text-[13px]">
                          View All Hotels
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
