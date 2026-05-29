"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Palmtree,
  Building2,
  Truck,
  Bus,
  Calendar,
  MapPin,
  Users,
  ChevronDown,
  Navigation,
  Sparkles,
  Compass,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const TABS = [
  {
    id: "packages",
    label: "Holidays",
    sub: "Tour Packages",
    icon: Palmtree,
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    id: "hotels",
    label: "Hotels",
    sub: "Resorts & Villas",
    icon: Building2,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    id: "transport",
    label: "Transport",
    sub: "Cab, Tempo, SUV",
    icon: Truck,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
  {
    id: "bus",
    label: "Bus",
    sub: "Luxury Coaches",
    icon: Bus,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
];

export default function PremiumSearchTabs() {
  const [activeTab, setActiveTab] = useState("packages");
  const [query, setQuery] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [guests, setGuests] = useState(2);
  const router = useRouter();

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const basePath = activeTab === "packages"
      ? `/india-holiday-tour-packages`
      : `/${activeTab}`;
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (guests) params.set("guests", String(guests));
    if (date) params.set("date", date.toISOString());
    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 md:px-0">
      {/* Search Tabs Selector */}
      <div className="flex justify-center -mb-px relative z-10">
        <div className="flex w-full md:w-auto md:inline-flex bg-primary backdrop-blur-3xl rounded-t-[1.2rem] md:rounded-t-[2rem] shadow-2xl border-x border-t border-white/10 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 md:flex-none flex items-center justify-center gap-2 md:gap-3 px-3 md:px-7 py-1 md:py-1.5 transition-all duration-500 relative group shrink-0",
                  isActive
                    ? "bg-accent text-primary shadow-[0_-5px_20px_rgba(255,215,0,0.4)] z-20"
                    : "hover:bg-white/5 text-white/80"
                )}
              >
                <div className={cn(
                  "w-6 h-6 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center transition-all duration-500",
                  isActive ? "bg-white/30" : "bg-white/10 group-hover:bg-white/15"
                )}>
                  <Icon className={cn("w-3.5 h-3.5 md:w-4 md:h-4", isActive ? "text-primary stroke-[2.5]" : "text-white/80")} />
                </div>
                <div className="text-left">
                  <p className={cn("text-[9px] md:text-[11px] font-black uppercase tracking-widest", isActive ? "text-primary" : "text-white/90")}>
                    {tab.label}
                  </p>
                  <p className={cn("text-[8px] md:text-[9px] font-bold whitespace-nowrap hidden lg:block", isActive ? "text-primary/60" : "text-white/40")}>
                    {tab.sub}
                  </p>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute -bottom-1 left-0 right-0 h-1 bg-primary z-30"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Search Panel */}
      <div className="bg-white rounded-b-[1.5rem] rounded-t-none md:rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.4)] p-0.5 md:p-1.5 relative group/panel border-x border-b border-white/20">
        <div className="bg-slate-50/20 rounded-b-[1.3rem] rounded-t-none md:rounded-[2.3rem] p-0.5 md:p-1.5 border-x border-b border-slate-100">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-slate-100 bg-white rounded-b-[1.2rem] rounded-t-none md:rounded-[2rem] shadow-sm">

            {/* Destination Section */}
            <div
              className="flex-[1.4] w-full p-2 md:p-5 relative group/field hover:bg-slate-50/50 transition-all cursor-text"
              onClick={() => document.getElementById('search-dest')?.focus()}
            >
              <div className="flex items-center gap-2 md:gap-2.5 mb-1 md:mb-1.5">
                <div className="w-4 h-4 md:w-6 md:h-6 rounded-md md:rounded-lg bg-orange-50 flex items-center justify-center">
                  <MapPin className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-orange-500" />
                </div>
                <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {activeTab === "transport" ? "Pickup Point" : "Going To"}
                </span>
              </div>
              <div className="flex items-center gap-2 pl-6 md:pl-8.5">
                <input
                  id="search-dest"
                  type="text"
                  placeholder={activeTab === "hotels" ? "Search Stays..." : "Where to next?"}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent text-sm md:text-2xl font-black focus:outline-none placeholder:text-slate-200 text-primary pb-0.5 truncate font-serif"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if ("geolocation" in navigator) {
                      navigator.geolocation.getCurrentPosition((pos) => {
                        setQuery("Near Me");
                      });
                    }
                  }}
                  className="p-1 hover:bg-slate-200 rounded-full text-primary transition-colors flex-shrink-0"
                >
                  <Navigation className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-20 group-hover/field:opacity-100" />
                </button>
              </div>
              <p className="pl-6 md:pl-8.5 text-[9px] md:text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5 md:mt-1 truncate opacity-60">
                <Sparkles className="w-2.5 h-2.5 text-accent shrink-0" />
                Manali, Ladakh, Kashmir
              </p>
            </div>

            {/* Date Section */}
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex-1 w-full p-2 md:p-5 relative group/field hover:bg-slate-50/50 transition-all cursor-pointer text-left md:min-w-[180px]">
                  <div className="flex items-center gap-2 md:gap-2.5 mb-1 md:mb-1.5">
                    <div className="w-4 h-4 md:w-6 md:h-6 rounded-md md:rounded-lg bg-blue-50 flex items-center justify-center">
                      <Calendar className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-blue-500" />
                    </div>
                    <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {activeTab === "hotels" ? "Check-In" : "Travel Date"}
                    </span>
                    <ChevronDown className="w-3 h-3 md:w-4 md:h-4 ml-auto text-slate-200" />
                  </div>
                  <div className="pl-6 md:pl-8.5">
                    <div className="text-sm md:text-2xl font-black text-primary flex items-baseline gap-1 md:gap-2 font-serif">
                      {date ? (
                        <>
                          {format(date, "dd")} <span className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">{format(date, "MMM yyyy")}</span>
                        </>
                      ) : (
                        <span className="text-sm md:text-xl">Select</span>
                      )}
                    </div>
                    <p className="text-[9px] md:text-[10px] font-bold text-slate-400 mt-0.5 md:mt-1 opacity-60">{date ? format(date, "EEEE") : "Any day"}</p>
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-screen max-w-[350px] p-0 z-50 rounded-[1.5rem] shadow-2xl border-none" align="start">
                <CalendarUI
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="p-3 md:p-4 bg-white rounded-[1.5rem]"
                />
              </PopoverContent>
            </Popover>

            {/* Guests Section */}
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex-1 w-full p-2 md:p-5 relative group/field hover:bg-slate-50/50 transition-all cursor-pointer text-left md:min-w-[160px] md:rounded-r-[2.8rem]">
                  <div className="flex items-center gap-2 md:gap-2.5 mb-1 md:mb-1.5">
                    <div className="w-4 h-4 md:w-6 md:h-6 rounded-md md:rounded-lg bg-indigo-50 flex items-center justify-center">
                      <Users className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-indigo-500" />
                    </div>
                    <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Guests
                    </span>
                    <ChevronDown className="w-3 h-3 md:w-4 md:h-4 ml-auto text-slate-200" />
                  </div>
                  <div className="pl-6 md:pl-8.5">
                    <div className="text-sm md:text-2xl font-black text-primary flex items-baseline gap-1 md:gap-2 font-serif">
                      {guests} <span className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">{guests > 1 ? "Travelers" : "Traveler"}</span>
                    </div>
                    <p className="text-[9px] md:text-[10px] font-bold text-slate-400 mt-0.5 md:mt-1 opacity-60">1 Room</p>
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-screen max-w-[320px] p-4 md:p-6 z-50 rounded-[1.5rem] shadow-2xl border-none" align="end">
                <div className="space-y-4 md:space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-primary text-[10px] md:text-sm uppercase tracking-widest">Adults</h4>
                      <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase">12+ years</p>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4">
                      <button type="button" onClick={() => setGuests(Math.max(1, guests - 1))} className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl border border-slate-100 flex items-center justify-center hover:bg-slate-50 text-primary transition-all font-bold">-</button>
                      <span className="w-4 text-center font-black text-primary text-base md:text-lg">{guests}</span>
                      <button type="button" onClick={() => setGuests(guests + 1)} className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl border border-slate-100 flex items-center justify-center hover:bg-slate-50 text-primary transition-all font-bold">+</button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

          </form>
        </div>

        {/* Search Button (Professional Compact Style) */}
        <div className="absolute -bottom-4 md:-bottom-7 left-1/2 -translate-x-1/2 w-[95%] md:w-auto">
          <div className="animate-bounce w-full">
            <button
              type="button"
              onClick={() => handleSearch()}
              className={cn(
                "group relative w-full md:px-6 py-2 md:py-2 rounded-full font-black text-[10px] md:text-lg tracking-[0.2em] uppercase transition-all overflow-hidden active:scale-95",
                "bg-gradient-to-r from-accent via-[#FFD700] to-accent text-primary shadow-[0_10px_20px_-10px_rgba(255,215,0,0.5)] md:shadow-[0_15px_40px_-10px_rgba(255,215,0,0.5)] border border-white md:border-4"
              )}
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
              <span className="relative flex items-center justify-center gap-1.5 md:gap-3">
                <Search className="w-3.5 h-3.5 md:w-5 md:h-5 stroke-[3]" />
                Search Now
                <Compass className="w-4 h-4 md:w-5 md:h-5 hidden md:block animate-[spin_4s_linear_infinite]" />
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
