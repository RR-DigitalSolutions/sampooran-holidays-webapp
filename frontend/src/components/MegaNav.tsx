"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, MapPin, Globe, ChevronRight, Briefcase, Plane, BookOpen, Handshake, Building2, GraduationCap, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// --- DATA STRUCTURES ---

const INDIA_DATA = {
  topRecommended: [
    { name: "Jammu and Kashmir", href: "/packages/india/jammu-and-kashmir-tour-packages" },
    { name: "Leh Ladakh", href: "/packages/india/ladakh-tour-packages" },
    { name: "Sikkim Darjeeling", href: "/packages/india/sikkim-darjeeling-tour-packages" },
    { name: "North East", href: "/packages/india/north-east-tour-packages" },
    { name: "Kerala", href: "/packages/india/kerala-tour-packages" },
    { name: "Andaman and Nicobar", href: "/packages/india/andaman-tour-packages" },
    { name: "Himachal Pradesh", href: "/packages/india/himachal-pradesh-tour-packages" },
  ],
  regions: [] as any[]
};

const WORLD_DATA = {
  topRecommended: [
    { name: "Europe", href: "/packages/europe-tour-packages" },
    { name: "South East Asia", href: "/packages/south-east-asia-tour-packages" },
    { name: "Japan China Korea", href: "/packages/east-asia-tour-packages" },
    { name: "Australia New Zealand", href: "/packages/australia-new-zealand-tour-packages" },
    { name: "Africa", href: "/packages/africa-tour-packages" },
    { name: "America", href: "/packages/america-tour-packages" },
  ],
  regions: [] as any[]
};

export function MegaNav() {
  const [activeMenu, setActiveMenu] = useState<'india' | 'world' | 'services' | 'hotels' | 'transport' | null>(null);
  const [activeRegion, setActiveRegion] = useState<string>("north-india");
  const navRef = useRef<HTMLElement | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const [dynamicData, setDynamicData] = useState<any>(null);
  const [hotelsData, setHotelsData] = useState<any>(null);
  const [transportMenuData, setTransportMenuData] = useState<any>(null);

  const fetchMegaMenuData = async () => {
    if (dynamicData) return;
    try {
      const res = await fetch('/api/destinations/mega-menu');
      if (!res.ok) {
        console.warn(`Mega menu fetch failed with status: ${res.status}`);
        return;
      }
      const text = await res.text();
      const data = JSON.parse(text);
      if (data && data.indiaZones) {
        setDynamicData(data);
        if (data.indiaZones.length > 0) {
          setActiveRegion(data.indiaZones[0].name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        }
      }
    } catch (err) {
      console.warn("Failed to load mega menu data:", err);
    }
  };

  const fetchHotelsMenuData = async () => {
    if (hotelsData) return;
    try {
      const res = await fetch('/api/hotels/mega-menu');
      if (!res.ok) {
        console.warn(`Hotels mega menu fetch failed with status: ${res.status}`);
        return;
      }
      const text = await res.text();
      const data = JSON.parse(text);
      if (data && (data.indiaZones || data.worldRegions)) {
        setHotelsData(data);
      }
    } catch (err) {
      console.warn("Failed to load hotels mega menu data:", err);
    }
  };

  const fetchTransportMenuData = async () => {
    if (transportMenuData) return;
    try {
      const res = await fetch('/api/transport/mega-menu');
      if (!res.ok) {
        console.warn(`Transport mega menu fetch failed with status: ${res.status}`);
        return;
      }
      const text = await res.text();
      const data = JSON.parse(text);
      if (data) {
        setTransportMenuData(data);
      }
    } catch (err) {
      console.warn("Failed to load transport mega menu data:", err);
    }
  };

  const toggleMenu = async (menu: 'india' | 'world' | 'services' | 'hotels' | 'transport') => {
    if (activeMenu === menu) {
      setActiveMenu(null);
      return;
    }

    if (menu === 'india' || menu === 'world') {
      await fetchMegaMenuData();
    }

    if (menu === 'hotels') {
      await fetchHotelsMenuData();
    }

    if (menu === 'transport') {
      await fetchTransportMenuData();
      await fetchHotelsMenuData(); // reuse hotels hierarchy as fallback
    }

    setActiveMenu(menu);
  };

  useEffect(() => {
    if (!activeMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [activeMenu]);

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setActiveMenu(null);
    }, 250);
  };

  const renderMegaMenu = (type: 'india' | 'world') => {
    let data = type === 'india' ? INDIA_DATA : WORLD_DATA;

    if (type === 'india' && dynamicData?.indiaZones) {
      data = {
        topRecommended: INDIA_DATA.topRecommended,
        regions: dynamicData.indiaZones.map((zone: any) => ({
          id: zone.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name: zone.name,
          groups: zone.states.map((state: any) => ({
            title: state.title,
            slug: state.slug,
            items: state.items
          }))
        }))
      };
    } else if (type === 'world' && dynamicData?.worldRegions && dynamicData.worldRegions.length > 0) {
      data = {
        topRecommended: WORLD_DATA.topRecommended,
        regions: dynamicData.worldRegions.map((region: any) => ({
          id: region.slug || region.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name: region.name,
          groups: region.countries.map((country: any) => ({
            title: country.name,
            slug: country.slug,
            items: country.destinations || []
          }))
        }))
      };
    }

    const currentRegionData = data.regions.find(r => r.id === activeRegion) || data.regions[0];

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="fixed top-[74px] left-0 w-full bg-white border-t border-slate-200 shadow-2xl z-[100] min-h-[500px]"
        onMouseEnter={() => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }}
        onMouseLeave={handleMouseLeave}
      >
        <div className="container mx-auto">
          {/* Top Bar Navigation */}
          <div className="flex items-center gap-6 px-6 py-3 border-b border-slate-100 overflow-x-auto no-scrollbar bg-slate-50">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">
              Top Recommended:
            </span>
            {data.topRecommended.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-[11px] font-medium text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap"
              >
                {item.name.toLowerCase().endsWith('tours') ? item.name : `${item.name} Tours`}
              </Link>
            ))}
          </div>

          <div className="flex">
            {/* Left Sidebar */}
            <div className="w-[280px] bg-slate-50 border-r border-slate-100 py-6">
              {data.regions.map((region) => {
                if (!region) return null;
                return (
                  <div
                    key={region.id}
                    onClick={() => setActiveRegion(region.id)}
                    className={cn(
                      "px-8 py-3.5 cursor-pointer flex items-center justify-between transition-all group",
                      activeRegion === region.id
                        ? "bg-white text-slate-900 border-r-4 border-primary shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <span className="text-[13px] font-semibold">{region.name}</span>
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-transform",
                      activeRegion === region.id ? "translate-x-1 text-accent opacity-100" : "opacity-0 group-hover:opacity-100"
                    )} />
                  </div>
                )
              })}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-8 bg-white min-h-[400px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
                {currentRegionData?.groups?.map((group: any) => {
                  const groupSlug = group.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
                  const groupHref = type === 'india'
                    ? `/packages/india/${group.slug || groupSlug}-tour-packages`
                    : `/packages/${group.slug || groupSlug}-tour-packages`;
                  return (
                    <div key={group.title} className="space-y-3">
                      <h4 className="text-[13px] font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-4 tracking-tight transition-colors">
                        <Link href={groupHref}>
                          {group.title.toLowerCase().endsWith('tours') ? group.title : `${group.title} Tours`}
                        </Link>
                      </h4>
                      <ul className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-hidden hover:overflow-y-auto pr-2 pb-2">
                        {group.items.map((item: any, index: number) => {
                          const itemName = typeof item === 'string' ? item : item?.name;
                          if (!itemName) return null;
                          const itemSlug = typeof item === 'string' ? item.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') : item?.slug;
                          return (
                            <li key={itemSlug || index}>
                              {(() => {
                                const itemHref = type === 'india'
                                  ? `/packages/india/${group.slug || groupSlug}/${itemSlug}-tour-packages`
                                  : `/packages/${group.slug || groupSlug}/${item?.stateSlug || 'destinations'}/${itemSlug}-tour-packages`;
                                return (
                              <Link
                                href={itemHref}
                                className="group flex items-center gap-1.5 text-[13px] text-slate-600 hover:text-primary transition-colors py-0.5"
                              >
                                <MapPin className="w-3 h-3 text-slate-300 group-hover:text-accent transition-colors shrink-0" />
                                <span className="truncate">{itemName.toLowerCase().endsWith('tours') ? itemName : `${itemName} Tours`}</span>
                              </Link>
                                );
                              })()}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
                {!currentRegionData && (
                  <div className="col-span-full py-10 flex justify-center text-slate-400">
                    Loading regions...
                  </div>
                )}

                {/* View All Link */}
                {currentRegionData && (
                  <div className="col-span-full pt-6 mt-6 border-t border-slate-100 flex justify-start">
                    <Link
                      href={type === 'india' ? "/packages/india-tour-packages" : "/packages/world-tour-packages"}
                      className="flex items-center gap-2 text-accent font-semibold text-[13px] hover:underline group"
                    >
                      View All {currentRegionData.name} Packages
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderHotelsMegaMenu = () => {
    if (!hotelsData) return null;

    const regions: any[] = [];

    if (hotelsData.indiaZones) {
      hotelsData.indiaZones.forEach((zone: any) => {
        regions.push({
          id: zone.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name: zone.name,
          isIndia: true,
          groups: zone.states.map((state: any) => ({
            title: state.title,
            slug: state.slug,
            countrySlug: "india",
            items: state.items
          }))
        });
      });
    }

    if (hotelsData.worldRegions) {
      hotelsData.worldRegions.forEach((region: any) => {
        regions.push({
          id: region.slug || region.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name: region.name,
          isIndia: false,
          groups: region.countries.map((country: any) => ({
            title: country.name,
            slug: country.slug,
            countrySlug: country.slug,
            items: country.destinations || []
          }))
        });
      });
    }

    const currentRegionData = regions.find(r => r.id === activeRegion) || regions[0];

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="fixed top-[74px] left-0 w-full bg-white border-t border-slate-200 shadow-2xl z-[100] min-h-[500px]"
        onMouseEnter={() => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }}
        onMouseLeave={handleMouseLeave}
      >
        <div className="container mx-auto">
          <div className="flex items-center gap-6 px-6 py-3 border-b border-slate-100 overflow-x-auto no-scrollbar bg-slate-50">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">
              Hotels Directory:
            </span>
            <Link
              href="/hotels"
              className="text-[11px] font-medium text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              All Hotels
            </Link>
            <Link
              href="/hotels/india"
              className="text-[11px] font-medium text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Hotels in India
            </Link>
          </div>

          <div className="flex flex-col">
            <div className="flex">
              <div className="w-[280px] bg-slate-50 border-r border-slate-100 py-6 max-h-[450px] overflow-y-auto">
                {regions.map((region) => {
                  if (!region) return null;
                  return (
                    <div
                      key={region.id}
                      onClick={() => setActiveRegion(region.id)}
                      className={cn(
                        "px-8 py-3.5 cursor-pointer flex items-center justify-between transition-all group",
                        activeRegion === region.id
                          ? "bg-white text-slate-900 border-r-4 border-primary shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <span className="text-[13px] font-semibold">{region.name} Hotels</span>
                      <ChevronRight className={cn(
                        "w-4 h-4 transition-transform",
                        activeRegion === region.id ? "translate-x-1 text-accent opacity-100" : "opacity-0 group-hover:opacity-100"
                      )} />
                    </div>
                  )
                })}
              </div>

              <div className="flex-1 p-8 bg-white min-h-[400px] max-h-[450px] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
                  {currentRegionData?.groups?.map((group: any) => {
                    const stateOrCountryHref = currentRegionData.isIndia
                      ? `/hotels/india/${group.slug}`
                      : `/hotels/${group.slug}`;

                    return (
                      <div key={group.title} className="space-y-3">
                        <h4 className="text-[13px] font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-4 tracking-tight hover:text-accent transition-colors">
                          <Link href={stateOrCountryHref}>
                            {group.title.toLowerCase().endsWith('hotels') ? group.title : `${group.title} Hotels`}
                          </Link>
                        </h4>
                        <ul className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-hidden hover:overflow-y-auto pr-2 pb-2">
                          {group.items.map((item: any, index: number) => {
                            const itemName = typeof item === 'string' ? item : item?.name;
                            if (!itemName) return null;
                            const itemSlug = typeof item === 'string' ? item.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') : item?.slug;
                            const countrySlug = currentRegionData.isIndia ? "india" : group.slug;
                            
                            let stateSlug = "all";
                            if (currentRegionData.isIndia) {
                              stateSlug = group.slug;
                            } else if (item.stateSlug) {
                              stateSlug = item.stateSlug;
                            }

                            const isStateItem = item.isState;
                            const itemHref = isStateItem
                              ? `/hotels/${countrySlug}/${itemSlug}`
                              : `/hotels/${countrySlug}/${stateSlug}/hotels-in-${itemSlug}`;

                            return (
                              <li key={itemSlug || index}>
                                <Link
                                  href={itemHref}
                                  className="group flex items-center gap-1.5 text-[13px] text-slate-600 hover:text-primary transition-colors py-0.5"
                                >
                                  <MapPin className="w-3.5 h-3.5 text-slate-300 group-hover:text-accent transition-colors shrink-0" />
                                  <span className="truncate">{itemName.toLowerCase().endsWith('hotels') ? itemName : `${itemName} Hotels`}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                  {!currentRegionData && (
                    <div className="col-span-full py-10 flex justify-center text-slate-400">
                      Loading regions...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Partner Portal Banner */}
            <div className="border-t border-slate-100 bg-slate-50/80 px-8 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">🏨</span>
                <div>
                  <h5 className="text-[12.5px] font-bold text-slate-800 flex items-center gap-2">
                    Hotel Partner Portal 
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Property Listing</span>
                  </h5>
                  <p className="text-[11px] text-slate-500 font-medium">List your rooms, manage bookings, set dynamic pricing, and reach thousands of customers instantly.</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Need help?</p>
                  <p className="text-slate-800 font-bold text-[12px]">+91 98050-01916</p>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <Link
                  href="/partner"
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-emerald-800 text-white text-[12px] font-bold px-4 py-2 rounded-sm hover:opacity-90 shadow-sm transition-all"
                >
                  Become a Partner <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderTransportMegaMenu = () => {
    // ── Step 1: Try transport-specific data (admin-configured states) ──────────
    const regions: any[] = [];

    if (transportMenuData?.indiaZones) {
      transportMenuData.indiaZones.forEach((zone: any) => {
        if (zone.states && zone.states.length > 0) {
          regions.push({
            id: zone.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: zone.name,
            isIndia: true,
            groups: zone.states.map((state: any) => ({
              title: state.title,
              slug: state.slug,
              items: state.items || []
            }))
          });
        }
      });
    }
    if (transportMenuData?.worldRegions) {
      transportMenuData.worldRegions.forEach((region: any) => {
        if (region.countries && region.countries.length > 0) {
          regions.push({
            id: region.slug || region.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: region.name,
            isIndia: false,
            groups: region.countries.map((country: any) => ({
              title: country.name,
              slug: country.slug,
              items: country.destinations || []
            }))
          });
        }
      });
    }

    // ── Step 2: Fall back to Hotels data (same hierarchy, different links) ────
    if (regions.length === 0 && hotelsData) {
      if (hotelsData.indiaZones) {
        hotelsData.indiaZones.forEach((zone: any) => {
          regions.push({
            id: zone.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: zone.name,
            isIndia: true,
            groups: zone.states.map((state: any) => ({
              title: state.title,
              slug: state.slug,
              items: state.items || []
            }))
          });
        });
      }
      if (hotelsData.worldRegions) {
        hotelsData.worldRegions.forEach((region: any) => {
          regions.push({
            id: region.slug || region.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: region.name,
            isIndia: false,
            groups: region.countries.map((country: any) => ({
              title: country.name,
              slug: country.slug,
              items: country.destinations || []
            }))
          });
        });
      }
    }

    const topRoutes = transportMenuData?.popularRoutes || [
      { from: "Chandigarh", to: "Manali" }, { from: "Delhi", to: "Manali" },
      { from: "Chandigarh", to: "Shimla" }, { from: "Manali", to: "Leh" },
      { from: "Delhi", to: "Leh" }, { from: "Chandigarh", to: "Dharamshala" },
    ];

    const transportActiveRegion = activeRegion || regions[0]?.id;
    const currentRegionData = regions.find(r => r.id === transportActiveRegion) || regions[0];

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="fixed top-[74px] left-0 w-full bg-white border-t border-slate-200 shadow-2xl z-[100] min-h-[500px]"
        onMouseEnter={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }}
        onMouseLeave={handleMouseLeave}
      >
        <div className="container mx-auto">
          {/* Top Bar */}
          <div className="flex items-center gap-6 px-6 py-3 border-b border-slate-100 overflow-x-auto no-scrollbar bg-slate-50">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">
              Transport Directory:
            </span>
            <Link href="/transport" className="text-[11px] font-medium text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap">
              All Transport
            </Link>
            {topRoutes.map((route: any) => (
              <Link
                key={`${route.from}-${route.to}`}
                href="/transport"
                className="text-[11px] font-medium text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap"
              >
                {route.from} → {route.to}
              </Link>
            ))}
          </div>

          <div className="flex flex-col">
            <div className="flex">
              {/* Left Sidebar — India Zones + World Regions */}
              <div className="w-[280px] bg-slate-50 border-r border-slate-100 py-6 max-h-[450px] overflow-y-auto">
                {regions.filter(r => r.isIndia).map((region) => (
                  <div
                    key={region.id}
                    onClick={() => setActiveRegion(region.id)}
                    className={cn(
                      "px-8 py-3.5 cursor-pointer flex items-center justify-between transition-all group",
                      transportActiveRegion === region.id
                        ? "bg-white text-slate-900 border-r-4 border-primary shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <span className="text-[13px] font-semibold">{region.name} Transport</span>
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-transform",
                      transportActiveRegion === region.id ? "translate-x-1 text-accent opacity-100" : "opacity-0 group-hover:opacity-100"
                    )} />
                  </div>
                ))}
                {regions.filter(r => !r.isIndia).length > 0 && (
                  <div className="mx-8 my-3 border-t border-slate-200" />
                )}
                {regions.filter(r => !r.isIndia).map((region) => (
                  <div
                    key={region.id}
                    onClick={() => setActiveRegion(region.id)}
                    className={cn(
                      "px-8 py-3.5 cursor-pointer flex items-center justify-between transition-all group",
                      transportActiveRegion === region.id
                        ? "bg-white text-slate-900 border-r-4 border-primary shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <span className="text-[13px] font-semibold">{region.name} Transport</span>
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-transform",
                      transportActiveRegion === region.id ? "translate-x-1 text-accent opacity-100" : "opacity-0 group-hover:opacity-100"
                    )} />
                  </div>
                ))}
                {regions.length === 0 && (
                  <div className="px-8 py-6 text-[12px] text-slate-400">Loading...</div>
                )}
              </div>

              {/* Main Content Area — States → Cities Grid */}
              <div className="flex-1 p-8 bg-white min-h-[400px] max-h-[450px] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
                  {currentRegionData?.groups?.map((group: any) => {
                    const stateHref = currentRegionData.isIndia
                      ? `/transport?state=${group.slug}&country=india`
                      : `/transport?country=${group.slug}`;
                    return (
                      <div key={group.title} className="space-y-3">
                        <h4 className="text-[13px] font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-4 tracking-tight hover:text-accent transition-colors">
                          <Link href={stateHref}>
                            {group.title} Transport
                          </Link>
                        </h4>
                        <ul className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-hidden hover:overflow-y-auto pr-2 pb-2">
                          {group.items.map((item: any, index: number) => {
                            const itemName = typeof item === 'string' ? item : item?.name;
                            if (!itemName) return null;
                            const itemSlug = typeof item === 'string'
                              ? item.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
                              : item?.slug;
                            const cityHref = currentRegionData.isIndia
                              ? `/transport?city=${itemSlug}&state=${group.slug}&country=india`
                              : `/transport?city=${itemSlug}&country=${group.slug}`;
                            return (
                              <li key={itemSlug || index}>
                                <Link
                                  href={cityHref}
                                  className="group flex items-center gap-1.5 text-[13px] text-slate-600 hover:text-primary transition-colors py-0.5"
                                >
                                  <MapPin className="w-3.5 h-3.5 text-slate-300 group-hover:text-accent transition-colors shrink-0" />
                                  <span className="truncate">{itemName} Transport</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                  {!currentRegionData && (
                    <div className="col-span-full py-10 flex justify-center text-slate-400 text-sm">
                      Loading transport regions...
                    </div>
                  )}
                </div>
                {currentRegionData && (
                  <div className="pt-6 mt-6 border-t border-slate-100 flex justify-start">
                    <Link
                      href="/transport"
                      className="flex items-center gap-2 text-accent font-semibold text-[13px] hover:underline group"
                    >
                      View All {currentRegionData.name} Transport
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Partner Portal Banner */}
            <div className="border-t border-slate-100 bg-slate-50/80 px-8 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">🚕</span>
                <div>
                  <h5 className="text-[12.5px] font-bold text-slate-800 flex items-center gap-2">
                    Transport Partner Portal 
                    <span className="text-[9px] bg-blue-100 text-blue-800 font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Fleet Registration</span>
                  </h5>
                  <p className="text-[11px] text-slate-500 font-medium">Register your fleet, set dynamic outstation pricing, manage bookings, and start earning today.</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Need help?</p>
                  <p className="text-slate-800 font-bold text-[12px]">+91 98050-01916</p>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <Link
                  href="/transport-partner"
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-primary to-[#1e3a8a] text-white text-[12px] font-bold px-4 py-2 rounded-sm hover:opacity-90 shadow-sm transition-all"
                >
                  Become a Partner <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
      <nav ref={navRef} className="hidden lg:flex items-center gap-0.5 xl:gap-1.5 h-full relative font-sans">
      {/* INDIA */}
      <div className="h-full flex items-center px-0.5">
        <button
          onClick={() => toggleMenu('india')}
          className={cn(
            "group flex items-center gap-1 xl:gap-1.5 font-bold text-[11px] xl:text-[12.5px] transition-all py-2 px-2 xl:px-2.5 rounded-sm",
            activeMenu === 'india'
              ? 'text-white bg-gradient-to-br from-primary to-[#1e3a8a] shadow-md'
              : 'text-slate-700 hover:text-white hover:bg-gradient-to-br hover:from-primary hover:to-[#1e3a8a] hover:shadow-md'
          )}
        >
          <MapPin className={cn("w-3.5 h-3.5 transition-colors shrink-0", activeMenu === 'india' ? "text-accent" : "text-primary group-hover:text-accent")} />
          India Tours <ChevronDown className={cn("w-3 h-3 transition-transform opacity-70", activeMenu === 'india' && "rotate-180")} />
        </button>
      </div>

      {/* WORLD */}
      <div className="h-full flex items-center px-0.5">
        <button
          onClick={() => toggleMenu('world')}
          className={cn(
          "group flex items-center gap-1 xl:gap-1.5 font-bold text-[11px] xl:text-[12.5px] transition-all py-2 px-2 xl:px-2.5 rounded-sm",
          activeMenu === 'world'
            ? 'text-white bg-gradient-to-br from-primary to-[#1e3a8a] shadow-md'
            : 'text-slate-700 hover:text-white hover:bg-gradient-to-br hover:from-primary hover:to-[#1e3a8a] hover:shadow-md'
        )}>
          <Globe className={cn("w-3.5 h-3.5 transition-colors shrink-0", activeMenu === 'world' ? "text-accent" : "text-primary group-hover:text-accent")} />
          World Tours <ChevronDown className={cn("w-3 h-3 transition-transform opacity-70", activeMenu === 'world' && "rotate-180")} />
        </button>
      </div>

      {/* SERVICES DROPDOWN */}
      <div className="h-full flex items-center px-0.5 relative">
        <button
          onClick={() => toggleMenu('services')}
          className={cn(
          "group flex items-center gap-1 xl:gap-1.5 font-bold text-[11px] xl:text-[12.5px] transition-all py-2 px-2 xl:px-2.5 rounded-sm",
          activeMenu === 'services'
            ? 'text-white bg-gradient-to-br from-primary to-[#1e3a8a] shadow-md'
            : 'text-slate-700 hover:text-white hover:bg-gradient-to-br hover:from-primary hover:to-[#1e3a8a] hover:shadow-md'
        )}>
          <Briefcase className={cn("w-3.5 h-3.5 transition-colors shrink-0", activeMenu === 'services' ? "text-accent" : "text-primary group-hover:text-accent")} />
          Group Tours <ChevronDown className={cn("w-3 h-3 transition-transform opacity-70", activeMenu === 'services' && "rotate-180")} />
        </button>

        <AnimatePresence>
          {activeMenu === 'services' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-[80%] left-0 mt-2 w-64 bg-white rounded-md shadow-xl border border-slate-100 overflow-hidden z-[100]"
            >
              <div className="p-2 space-y-1">
                <Link href="/customized-holidays" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-slate-700 hover:text-white hover:bg-gradient-to-br hover:from-primary hover:to-[#1e3a8a] transition-all group">
                  <MapPin className="w-4 h-4 text-primary group-hover:text-accent shrink-0 transition-colors" />
                  <span className="text-[13px] font-semibold">Customize Holidays</span>
                </Link>
                <Link href="/corporate-travel" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-slate-700 hover:text-white hover:bg-gradient-to-br hover:from-primary hover:to-[#1e3a8a] transition-all group">
                  <Briefcase className="w-4 h-4 text-primary group-hover:text-accent shrink-0 transition-colors" />
                  <span className="text-[13px] font-semibold">Corporate Travel</span>
                </Link>
                <Link href="/school-collage-trip" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-slate-700 hover:text-white hover:bg-gradient-to-br hover:from-primary hover:to-[#1e3a8a] transition-all group">
                  <GraduationCap className="w-4 h-4 text-primary group-hover:text-accent shrink-0 transition-colors" />
                  <span className="text-[13px] font-semibold">School & Collage Trip</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* INBOUND */}
      <div className="h-full flex items-center px-0.5">
        <Link href="/inbound" className="group flex items-center gap-1 xl:gap-1.5 font-bold text-[11px] xl:text-[12.5px] text-slate-700 hover:text-white hover:bg-gradient-to-br hover:from-primary hover:to-[#1e3a8a] transition-all py-2 px-2 xl:px-2.5 rounded-sm">
          <Plane className="w-3.5 h-3.5 text-primary group-hover:text-accent transition-colors shrink-0" />
          Inbound
        </Link>
      </div>

      {/* TRAVEL GUIDE */}
      <div className="h-full flex items-center px-0.5">
        <Link href="/travel-guide" className="group flex items-center gap-1 xl:gap-1.5 font-bold text-[11px] xl:text-[12.5px] text-slate-700 hover:text-white hover:bg-gradient-to-br hover:from-primary hover:to-[#1e3a8a] transition-all py-2 px-2 xl:px-2.5 rounded-sm">
          <BookOpen className="w-3.5 h-3.5 text-primary group-hover:text-accent transition-colors shrink-0" />
          Travel Guide
        </Link>
      </div>

      {/* HOTELS */}
      <div className="h-full flex items-center px-0.5">
        <button
          onClick={() => toggleMenu('hotels')}
          className={cn(
          "group flex items-center gap-1 xl:gap-1.5 font-bold text-[11px] xl:text-[12.5px] transition-all py-2 px-2 xl:px-2.5 rounded-sm",
          activeMenu === 'hotels'
            ? 'text-white bg-gradient-to-br from-primary to-[#1e3a8a] shadow-md'
            : 'text-slate-700 hover:text-white hover:bg-gradient-to-br hover:from-primary hover:to-[#1e3a8a] hover:shadow-md'
        )}>
          <Building2 className={cn("w-3.5 h-3.5 transition-colors shrink-0", activeMenu === 'hotels' ? "text-accent" : "text-primary group-hover:text-accent")} />
          Hotels <ChevronDown className={cn("w-3 h-3 transition-transform opacity-70", activeMenu === 'hotels' && "rotate-180")} />
        </button>
      </div>

      {/* TRANSPORT */}
      <div className="h-full flex items-center px-0.5">
        <button
          onClick={() => toggleMenu('transport')}
          className={cn(
          "group flex items-center gap-1 xl:gap-1.5 font-bold text-[11px] xl:text-[12.5px] transition-all py-2 px-2 xl:px-2.5 rounded-sm",
          activeMenu === 'transport'
            ? 'text-white bg-gradient-to-br from-primary to-[#1e3a8a] shadow-md'
            : 'text-slate-700 hover:text-white hover:bg-gradient-to-br hover:from-primary hover:to-[#1e3a8a] hover:shadow-md'
        )}>
          <Car className={cn("w-3.5 h-3.5 transition-colors shrink-0", activeMenu === 'transport' ? "text-accent" : "text-primary group-hover:text-accent")} />
          Transport <ChevronDown className={cn("w-3 h-3 transition-transform opacity-70", activeMenu === 'transport' && "rotate-180")} />
        </button>
      </div>

      {/* B2B */}
      <div className="h-full flex items-center px-0.5">
        <Link href="/b2b" className="group flex items-center gap-1 xl:gap-1.5 font-bold text-[11px] xl:text-[12.5px] text-slate-700 hover:text-white hover:bg-gradient-to-br hover:from-primary hover:to-[#1e3a8a] transition-all py-2 px-2 xl:px-2.5 rounded-sm">
          <Handshake className="w-3.5 h-3.5 text-primary group-hover:text-accent transition-colors shrink-0" />
          B2B
        </Link>
      </div>

      <AnimatePresence>
        {(activeMenu === 'india' || activeMenu === 'world') && renderMegaMenu(activeMenu as 'india' | 'world')}
        {activeMenu === 'hotels' && renderHotelsMegaMenu()}
        {activeMenu === 'transport' && renderTransportMegaMenu()}
      </AnimatePresence>

    </nav>
  );
}
