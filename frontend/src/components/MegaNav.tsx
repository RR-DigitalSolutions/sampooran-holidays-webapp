"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, MapPin, Globe, ChevronRight, Briefcase, Send, CircleDollarSign, Gift, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// --- DATA STRUCTURES ---

const INDIA_DATA = {
  topRecommended: [
    { name: "Jammu and Kashmir", href: "/kashmir-tour-packages" },
    { name: "Leh Ladakh", href: "/leh-ladakh-tour-packages" },
    { name: "Sikkim Darjeeling", href: "/sikkim-darjeeling-tour-packages" },
    { name: "North East", href: "/north-east-tour-packages" },
    { name: "Kerala", href: "/kerala-tour-packages" },
    { name: "Andaman and Nicobar", href: "/andaman-tour-packages" },
    { name: "Himachal Pradesh", href: "/himachal-tour-packages" },
  ],
  regions: []
};

const WORLD_DATA = {
  topRecommended: [
    { name: "Europe", href: "/europe-tour-packages" },
    { name: "South East Asia", href: "/south-east-asia-tour-packages" },
    { name: "Japan China Korea", href: "/east-asia-tour-packages" },
    { name: "Australia New Zealand", href: "/australia-nz-tour-packages" },
    { name: "Africa", href: "/africa-tour-packages" },
    { name: "America", href: "/america-tour-packages" },
  ],
  regions: [
    {
      id: "europe",
      name: "Europe",
      groups: [
        {
          title: "Western Europe",
          items: ["Switzerland", "France", "Netherlands", "Belgium"]
        },
        {
          title: "Central Europe",
          items: ["Germany", "Austria", "Hungary", "Czech Republic"]
        },
        {
          title: "Mediterranean",
          items: ["Italy", "Greece", "Spain", "Portugal"]
        },
        {
          title: "Scandinavia",
          items: ["Norway", "Sweden", "Finland", "Denmark", "Iceland"]
        }
      ]
    },
    {
      id: "asia",
      name: "Asia",
      groups: [
        {
          title: "South East Asia",
          items: ["Thailand", "Singapore", "Malaysia", "Vietnam", "Bali"]
        },
        {
          title: "Far East",
          items: ["Japan", "South Korea", "China", "Taiwan"]
        },
        {
          title: "Middle East",
          items: ["Dubai", "Abu Dhabi", "Jordan", "Israel", "Turkey"]
        }
      ]
    },
    {
      id: "africa",
      name: "Africa",
      groups: [
        {
          title: "South Africa",
          items: ["Cape Town", "Johannesburg", "Kruger National Park", "Sun City"]
        },
        {
          title: "East Africa",
          items: ["Kenya", "Tanzania", "Masai Mara"]
        },
        {
          title: "North Africa",
          items: ["Egypt", "Morocco"]
        }
      ]
    },
    {
      id: "americas",
      name: "Americas",
      groups: [
        {
          title: "North America",
          items: ["USA East Coast", "USA West Coast", "Canada", "Alaska"]
        },
        {
          title: "South America",
          items: ["Brazil", "Argentina", "Peru", "Chile"]
        }
      ]
    }
  ]
};

export function MegaNav() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<string>("north-india");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [dynamicData, setDynamicData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/destinations/mega-menu')
      .then(res => res.json())
      .then(data => {
        if (data && data.indiaZones) {
          setDynamicData(data);
          if (data.indiaZones.length > 0) {
            setActiveRegion(data.indiaZones[0].name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
          }
        }
      })
      .catch(err => console.error("Failed to load mega menu data:", err));
  }, []);

  const handleMouseEnter = (menu: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveMenu(menu);
    // Default region based on menu
    if (menu === 'india') setActiveRegion('north');
    if (menu === 'world') setActiveRegion('europe');
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 200);
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
          <div className="flex items-center gap-6 px-6 py-3 border-b border-slate-100 overflow-x-auto no-scrollbar bg-slate-50/50">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
              Top Recommended:
            </span>
            {data.topRecommended.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-[13px] font-bold text-slate-700 hover:text-primary transition-colors whitespace-nowrap"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex">
            {/* Left Sidebar */}
            <div className="w-[280px] bg-slate-50/30 border-r border-slate-100 py-6">
              {data.regions.map((region) => {
                if (!region) return null;
                return (
                <div
                  key={region.id}
                  onMouseEnter={() => setActiveRegion(region.id)}
                  className={cn(
                    "px-8 py-3.5 cursor-pointer flex items-center justify-between transition-all group",
                    activeRegion === region.id 
                      ? "bg-white text-primary border-r-4 border-accent shadow-sm" 
                      : "text-slate-500 hover:bg-slate-100/50 hover:text-primary"
                  )}
                >
                  <span className="text-[14px] font-bold">{region.name}</span>
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-transform",
                    activeRegion === region.id ? "translate-x-1 text-accent opacity-100" : "opacity-0 group-hover:opacity-100"
                  )} />
                </div>
              )})}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-8 bg-white min-h-[400px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
                {currentRegionData?.groups?.map((group: any) => {
                  const groupSlug = group.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
                  return (
                    <div key={group.title} className="space-y-3">
                      <h4 className="text-[14px] font-black text-primary border-b border-slate-100 pb-2 mb-4 tracking-tight group-hover:text-accent transition-colors">
                        <Link href={`/${groupSlug}-tour-packages`}>
                          {group.title}
                        </Link>
                      </h4>
                      <ul className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-hidden hover:overflow-y-auto pr-2 pb-2">
                        {group.items.map((item: any, index: number) => {
                          const itemName = typeof item === 'string' ? item : item?.name;
                          if (!itemName) return null;
                          const itemSlug = typeof item === 'string' ? item.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') : item?.slug;
                          return (
                            <li key={itemSlug || index}>
                              <Link 
                                href={`/${itemSlug}-tour-packages`} 
                                className="text-[13px] text-slate-500 hover:text-primary hover:font-bold transition-all block py-0.5"
                              >
                                {itemName}
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
                
                {/* View All Link */}
                {currentRegionData && (
                  <div className="col-span-full pt-6 mt-6 border-t border-slate-100 flex justify-start">
                    <Link 
                      href={type === 'india' ? "/india-tour-packages" : "/world-tour-packages"}
                      className="flex items-center gap-2 text-accent font-bold text-[13px] hover:underline group"
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

  return (
    <nav className="hidden lg:flex items-center gap-1 xl:gap-2 h-full relative font-sans">
      
      {/* INDIA */}
      <div 
        className="h-full flex items-center px-1"
        onMouseEnter={() => handleMouseEnter('india')}
        onMouseLeave={handleMouseLeave}
      >
        <button className={cn(
          "flex items-center gap-1.5 font-bold text-[13px] transition-all py-2 px-2 rounded-lg",
          activeMenu === 'india' ? 'text-accent bg-slate-50 shadow-sm' : 'text-slate-700 hover:bg-slate-50'
        )}>
          India <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", activeMenu === 'india' && "rotate-180")} />
        </button>
      </div>

      {/* WORLD */}
      <div 
        className="h-full flex items-center px-1"
        onMouseEnter={() => handleMouseEnter('world')}
        onMouseLeave={handleMouseLeave}
      >
        <button className={cn(
          "flex items-center gap-1.5 font-bold text-[13px] transition-all py-2 px-2 rounded-lg",
          activeMenu === 'world' ? 'text-accent bg-slate-50 shadow-sm' : 'text-slate-700 hover:bg-slate-50'
        )}>
          World <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", activeMenu === 'world' && "rotate-180")} />
        </button>
      </div>

      {/* CUSTOMIZED HOLIDAYS */}
      <div className="h-full flex items-center px-1">
        <Link href="/customized-holidays" className="flex items-center gap-1.5 font-bold text-[13px] text-slate-700 hover:text-accent transition-all py-2 px-2 rounded-lg hover:bg-slate-50">
          Customized Holidays
        </Link>
      </div>

      {/* CORPORATE TRAVEL */}
      <div className="h-full flex items-center px-1">
        <Link href="/corporate-travel" className="flex items-center gap-1.5 font-bold text-[13px] text-slate-700 hover:text-accent transition-all py-2 px-2 rounded-lg hover:bg-slate-50">
          Corporate Travel
        </Link>
      </div>

      {/* INBOUND */}
      <div className="h-full flex items-center px-1">
        <Link href="/inbound" className="flex items-center gap-1.5 font-bold text-[13px] text-slate-700 hover:text-accent transition-all py-2 px-2 rounded-lg hover:bg-slate-50">
          Inbound
        </Link>
      </div>

      {/* TRAVEL GUIDE */}
      <div className="h-full flex items-center px-1">
        <Link href="/travel-guide" className="flex items-center gap-1.5 font-bold text-[13px] text-slate-700 hover:text-accent transition-all py-2 px-2 rounded-lg hover:bg-slate-50">
          Travel Guide
        </Link>
      </div>

      {/* B2B */}
      <div className="h-full flex items-center px-1">
        <Link href="/b2b" className="flex items-center gap-1.5 font-bold text-[13px] text-slate-700 hover:text-accent transition-all py-2 px-2 rounded-lg hover:bg-slate-50">
          B2B
        </Link>
      </div>

      {/* CONTACT US */}
      <div className="h-full flex items-center px-1">
        <Link href="/contact" className="flex items-center gap-1.5 font-bold text-[13px] text-slate-700 hover:text-accent transition-all py-2 px-2 rounded-lg hover:bg-slate-50">
          Contact Us
        </Link>
      </div>

      <AnimatePresence>
        {(activeMenu === 'india' || activeMenu === 'world') && renderMegaMenu(activeMenu as 'india' | 'world')}
      </AnimatePresence>

    </nav>
  );
}
