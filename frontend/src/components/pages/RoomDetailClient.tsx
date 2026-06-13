"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Star, MapPin, ChevronLeft, ChevronRight, Bed, Users, Building2,
  Check, X, Calendar, Phone, MessageSquare, Wifi, Coffee, Utensils,
  Waves, Dumbbell, Flame, Car, Tv, ShieldCheck, ArrowLeft, ChevronDown,
  Wind, Bath, Maximize, Eye, Layers, Clock, Sparkles, AlertTriangle, Plus, Minus,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { API_BASE } from "@/context/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RoomConfig {
  adults: number;
  children: number;
}

// Icon map for amenities/facilities
const FEATURE_ICONS: Record<string, any> = {
  "Wi-Fi": Wifi, "Wifi": Wifi, "WIFI": Wifi,
  "Pool": Waves, "Swimming Pool": Waves,
  "Restaurant": Utensils, "Dining": Utensils,
  "Parking": Car, "Free Parking": Car,
  "Gym": Dumbbell, "Fitness Center": Dumbbell,
  "Spa": Flame,
  "Coffee": Coffee, "Coffee Maker": Coffee, "Tea/Coffee": Coffee,
  "TV": Tv, "Flat-screen TV": Tv, "Television": Tv,
  "AC": Wind, "Air Conditioning": Wind, "Air-conditioning": Wind,
  "Bathtub": Bath, "Bath": Bath,
  "Safe": ShieldCheck, "In-room Safe": ShieldCheck,
  "Balcony": Maximize, "Private Balcony": Maximize,
  "Mountain View": Eye, "Pool View": Eye, "Garden View": Eye, "Sea View": Eye,
};

const getIcon = (name: string) => FEATURE_ICONS[name] || Check;

export default function RoomDetailClient({ slug, roomId }: { slug: string; roomId: string }) {
  const router = useRouter();
  const [hotel, setHotel] = useState<any>(null);
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);

  // Booking state
  const [checkIn, setCheckIn] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [checkOut, setCheckOut] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  });
  const [roomsConfig, setRoomsConfig] = useState<RoomConfig[]>([{ adults: 2, children: 0 }]);
  const [guestPopoverOpen, setGuestPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState<boolean>(true);

  const handleDateClick = (dateStr: string, isSelectable: boolean) => {
    if (!isSelectable) return;
    
    // If checkIn is not set, or both are set (resetting search)
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(dateStr);
      setCheckOut("");
      toast.info("Check-in date set. Now click checkout date in calendar.");
    } else {
      // checkIn is set, but checkOut is not set
      if (new Date(dateStr) <= new Date(checkIn)) {
        // If clicked date is before/on checkIn, reset checkIn to this date
        setCheckIn(dateStr);
        setCheckOut("");
      } else {
        setCheckOut(dateStr);
        toast.success(`Selected stay dates: ${checkIn} to ${dateStr}`);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [slug, roomId]);

  useEffect(() => {
    if (slug && roomId) {
      fetchCalendar();
    }
  }, [slug, roomId, currentMonth]);

  const fetchCalendar = async () => {
    setLoadingCalendar(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const firstDay = new Date(year, month, 1).toISOString().split("T")[0];
      const lastDay = new Date(year, month + 1, 0).toISOString().split("T")[0];

      const res = await fetch(`${API_BASE}/hotels/${slug}/rooms/${roomId}/calendar?startDate=${firstDay}&endDate=${lastDay}`);
      if (res.ok) {
        setCalendarData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCalendar(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setGuestPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE}/hotels/${slug}`);
      if (!res.ok) throw new Error("Hotel not found");
      const data = await res.json();
      setHotel(data);
      const foundRoom = (data.rooms || []).find((r: any) => String(r.id) === roomId);
      if (!foundRoom) throw new Error("Room not found");
      setRoom(foundRoom);
    } catch (e) {
      console.error(e);
      toast.error("Could not load room details.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-4 pt-20">
        <div className="w-12 h-12 border-4 border-[#1B3A6B] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-600 font-bold animate-pulse">Loading room details…</p>
      </div>
    );
  }

  if (!hotel || !room) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-4 pt-20">
        <AlertTriangle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold text-slate-800">Room Not Found</h2>
        <Button onClick={() => router.push(`/hotels/${slug}`)} className="bg-[#1B3A6B] text-white">
          Back to Hotel
        </Button>
      </div>
    );
  }

  const isValidDateRange = checkIn && checkOut && new Date(checkOut) > new Date(checkIn);
  const nights = isValidDateRange
    ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 1;

  const getDailyPrice = (dateStr: string) => {
    const record = calendarData.find((x) => x.date === dateStr);
    const base = record ? record.basePrice : room.basePrice;
    const discountType = record ? record.discountType : (room.discountType || "PERCENT");
    const discountPercent = record ? record.discountPercent : (room.discountPercent || 0);
    const discountFlat = record ? record.discountFlat : (room.discountFlat || 0);

    let final = base;
    if (discountType === "PERCENT" && discountPercent > 0) {
      final = Math.max(0, base - (base * discountPercent) / 100);
    } else if (discountType === "FLAT" && discountFlat > 0) {
      final = Math.max(0, base - discountFlat);
    }
    return final;
  };

  const calculatePrice = () => {
    let total = 0;
    const start = new Date(checkIn);
    const end = checkOut ? new Date(checkOut) : new Date(start.getTime() + 86400000);
    
    // Generate dates in range
    const dates: string[] = [];
    const current = new Date(start);
    while (current < end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }

    for (const config of roomsConfig) {
      let configTotal = 0;
      for (const dStr of dates) {
        let daily = getDailyPrice(dStr);
        if (config.adults > 2) daily += (config.adults - 2) * (room.extraAdultPrice || 0);
        if (config.children > 0) daily += config.children * (room.extraChildPrice || 0);
        configTotal += daily;
      }
      total += configTotal;
    }
    return total;
  };

  const stayTotal = calculatePrice();
  const isOccupancyExceeded = roomsConfig.some(
    (c) => c.adults > (room.maxAdults || room.maxOccupancy || 2) || c.children > (room.maxChildren || 1)
  );

  const renderInteractiveCalendar = () => {
    if (loadingCalendar) {
      return (
        <div className="col-span-7 flex flex-col items-center justify-center py-12 min-h-[200px]">
          <div className="w-8 h-8 border-[3px] border-[#1B3A6B] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-[11px] text-slate-400 font-semibold">Loading availability…</p>
        </div>
      );
    }

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const today = new Date().toISOString().split("T")[0];

    const padding: React.ReactNode[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      padding.push(<div key={`pad-${i}`} />);
    }

    const dayCells: React.ReactNode[] = [];

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const record = calendarData.find((x) => x.date === dateStr);
      const isPast = dateStr < today;
      const isToday = dateStr === today;

      const availableCount = record ? Number(record.availableCount) : (room.totalRooms || 1);
      const isBlocked = record ? Boolean(record.isBlocked) : false;
      const basePrice = record ? Number(record.basePrice) : room.basePrice;
      const discountType = record ? record.discountType : (room.discountType || "PERCENT");
      const discountPercent = record ? Number(record.discountPercent) : Number(room.discountPercent || 0);
      const discountFlat = record ? Number(record.discountFlat) : Number(room.discountFlat || 0);

      // Price calculation
      let discountedPrice = basePrice;
      if (discountType === "PERCENT" && discountPercent > 0) {
        discountedPrice = Math.max(0, basePrice - (basePrice * discountPercent) / 100);
      } else if (discountType === "FLAT" && discountFlat > 0) {
        discountedPrice = Math.max(0, basePrice - discountFlat);
      }
      const hasDiscount = discountedPrice < basePrice;
      const savedAmount = basePrice - discountedPrice;

      // Discount badge text shows both % and ₹ savings
      const discountBadgeText = hasDiscount
        ? (discountType === "PERCENT"
          ? `${discountPercent}% · ₹${Math.round(savedAmount).toLocaleString()}`
          : `₹${Math.round(savedAmount).toLocaleString()} off`)
        : null;

      // Status
      const isSelectable = !isBlocked && !isPast && availableCount > 0;
      const isLowAvailability = isSelectable && availableCount <= 2;
      const isSoldOut = !isBlocked && !isPast && availableCount === 0;

      // Selection state
      const isCheckIn = dateStr === checkIn;
      const isCheckOut = dateStr === checkOut;
      const isInRange = checkIn && checkOut && dateStr > checkIn && dateStr < checkOut;
      const isSelectedEdge = isCheckIn || isCheckOut;

      // Cell styles by priority
      type CellStatus = "selected" | "inrange" | "past" | "blocked" | "soldout" | "lowstock_deal" | "lowstock" | "deal" | "today" | "normal";
      let cellStatus: CellStatus = "normal";
      if (isCheckIn || isCheckOut) cellStatus = "selected";
      else if (isInRange) cellStatus = "inrange";
      else if (isPast) cellStatus = "past";
      else if (isBlocked) cellStatus = "blocked";
      else if (isSoldOut) cellStatus = "soldout";
      else if (isLowAvailability && hasDiscount) cellStatus = "lowstock_deal";
      else if (isLowAvailability) cellStatus = "lowstock";
      else if (hasDiscount) cellStatus = "deal";
      else if (isToday) cellStatus = "today";

      const CELL: Record<CellStatus, { wrap: string; dayNum: string; cursor: string }> = {
        selected:      { wrap: "bg-[#1B3A6B] border-[#1B3A6B] shadow-lg",                         dayNum: "text-white",          cursor: "cursor-pointer" },
        inrange:       { wrap: "bg-[#1B3A6B]/10 border-[#1B3A6B]/30",                             dayNum: "text-[#1B3A6B]",      cursor: "cursor-pointer" },
        past:          { wrap: "bg-gray-50 border-gray-100 opacity-50",                            dayNum: "text-gray-300",       cursor: "cursor-not-allowed" },
        blocked:       { wrap: "bg-rose-50 border-rose-200 opacity-70",                            dayNum: "text-rose-400",       cursor: "cursor-not-allowed" },
        soldout:       { wrap: "bg-slate-100 border-slate-200 opacity-60",                         dayNum: "text-slate-400",      cursor: "cursor-not-allowed" },
        lowstock_deal: { wrap: "bg-gradient-to-br from-amber-50 to-emerald-50 border-amber-300 hover:shadow-md hover:-translate-y-0.5", dayNum: "text-slate-800", cursor: "cursor-pointer" },
        lowstock:      { wrap: "bg-amber-50 border-amber-300 hover:shadow-md hover:-translate-y-0.5", dayNum: "text-amber-900",  cursor: "cursor-pointer" },
        deal:          { wrap: "bg-emerald-50 border-emerald-300 hover:shadow-md hover:-translate-y-0.5", dayNum: "text-emerald-900", cursor: "cursor-pointer" },
        today:         { wrap: "bg-blue-50 border-blue-200 hover:shadow-md hover:-translate-y-0.5", dayNum: "text-blue-800",    cursor: "cursor-pointer" },
        normal:        { wrap: "bg-white border-slate-200 hover:border-[#1B3A6B]/40 hover:shadow-md hover:-translate-y-0.5", dayNum: "text-slate-700", cursor: "cursor-pointer" },
      };
      const S = CELL[cellStatus];

      dayCells.push(
        <div
          key={d}
          onClick={() => handleDateClick(dateStr, isSelectable)}
          className={cn(
            "relative rounded-xl border transition-all duration-150 select-none overflow-hidden flex flex-col",
            "min-h-[80px] md:min-h-[90px]",
            S.wrap, S.cursor
          )}
        >
          {/* TOP ROW: Day number + primary badge */}
          <div className="flex items-start justify-between px-2 pt-2 pb-0.5 gap-0.5">
            <span className={cn("text-[11px] md:text-sm font-black leading-none shrink-0", S.dayNum)}>{d}</span>

            {/* Right side badges */}
            <div className="flex flex-col items-end gap-0.5 min-w-0">
              {/* Discount badge — shows BOTH % and ₹ saved */}
              {isSelectable && hasDiscount && (
                <span className={cn(
                  "text-[7px] font-black leading-none px-1.5 py-0.5 rounded-full whitespace-nowrap",
                  isSelectedEdge ? "bg-white/20 text-white" : "bg-emerald-500 text-white"
                )}>
                  {discountBadgeText}
                </span>
              )}
              {/* Blocked icon */}
              {isBlocked && !isPast && (
                <Lock className={cn("w-2.5 h-2.5 shrink-0", isSelectedEdge ? "text-white" : "text-rose-400")} />
              )}
              {/* Sold out */}
              {isSoldOut && (
                <span className="text-[7px] font-black text-white bg-slate-500 px-1.5 py-0.5 rounded-full leading-none">Full</span>
              )}
              {/* Today marker */}
              {isToday && !isSelectedEdge && (
                <span className="text-[7px] font-black text-blue-700 bg-blue-200 px-1.5 py-0.5 rounded-full leading-none">Today</span>
              )}
            </div>
          </div>

          {/* MIDDLE: Price display */}
          <div className="flex flex-col justify-center flex-1 px-2">
            {!isBlocked && !isSoldOut && !isPast ? (
              <>
                {hasDiscount ? (
                  <>
                    <span className={cn("text-[9px] leading-none line-through", isSelectedEdge ? "text-white/50" : "text-slate-400")}>
                      ₹{basePrice.toLocaleString()}
                    </span>
                    <span className={cn("text-[11px] md:text-[12px] font-black leading-tight mt-0.5", isSelectedEdge ? "text-white" : "text-emerald-700")}>
                      ₹{Math.round(discountedPrice).toLocaleString()}
                    </span>
                  </>
                ) : (
                  <span className={cn("text-[11px] md:text-[12px] font-black leading-tight", isSelectedEdge ? "text-white" : "text-slate-800")}>
                    ₹{basePrice.toLocaleString()}
                  </span>
                )}
              </>
            ) : (
              <span className={cn("text-[9px] font-semibold leading-none italic",
                isBlocked ? (isSelectedEdge ? "text-white/60" : "text-rose-400") : "text-slate-400"
              )}>
                {isPast ? "" : isBlocked ? "Blocked" : "Sold Out"}
              </span>
            )}
          </div>

          {/* BOTTOM ROW: Status label */}
          <div className="px-2 pb-2">
            {!isPast && !isSelectedEdge && (
              <>
                {isLowAvailability && (
                  <span className="text-[7px] font-black uppercase tracking-wide text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full leading-none">
                    ⚡ {availableCount} left
                  </span>
                )}
                {!isBlocked && !isSoldOut && !isLowAvailability && (
                  <span className={cn(
                    "text-[7px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full leading-none",
                    hasDiscount ? "text-emerald-700 bg-emerald-100" : "text-slate-400 bg-slate-100"
                  )}>
                    {hasDiscount ? "Deal" : "Available"}
                  </span>
                )}
                {isSoldOut && (
                  <span className="text-[7px] font-black uppercase text-slate-500">Sold Out</span>
                )}
                {isBlocked && (
                  <span className="text-[7px] font-black uppercase text-rose-500">Blocked</span>
                )}
              </>
            )}
            {isSelectedEdge && (
              <span className="text-[7px] font-black uppercase text-white/70">
                {isCheckIn ? "Check-in" : "Check-out"}
              </span>
            )}
          </div>

          {/* Range indicator strip */}
          {isInRange && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1B3A6B]/25" />}
          {isCheckIn && <div className="absolute bottom-0 right-0 top-0 w-0.5 bg-white/20" />}
        </div>
      );
    }

    return [...padding, ...dayCells];
  };

  const images: string[] =
    room.images?.length > 0
      ? room.images
      : hotel.images?.length > 0
        ? hotel.images
        : ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200"];

  const handleBookNow = () => {
    if (isOccupancyExceeded) {
      toast.error(`Your guest config exceeds the limits of this room.`);
      return;
    }
    const roomsStr = encodeURIComponent(JSON.stringify(roomsConfig));
    router.push(`/hotels/${slug}/book?roomId=${room.id}&checkIn=${checkIn}&checkOut=${checkOut}&rooms=${roomsStr}`);
  };

  const formatCancellation = (hours: number) => {
    if (!hours) return "Free cancellation";
    if (hours % 168 === 0) return `Free cancellation up to ${hours / 168} week${hours / 168 > 1 ? "s" : ""} before check-in`;
    if (hours % 24 === 0) return `Free cancellation up to ${hours / 24} day${hours / 24 > 1 ? "s" : ""} before check-in`;
    return `Free cancellation up to ${hours} hours before check-in`;
  };

  const allHighlights: string[] = [
    ...(room.highlights || []),
    room.viewType && `${room.viewType}`,
    room.sizeSqft && `${room.sizeSqft} sq.ft`,
    room.bedType && `${room.bedType} Bed`,
    room.floorNumber && `Floor ${room.floorNumber}`,
  ].filter(Boolean) as string[];

  return (
    <div className="bg-slate-50 min-h-screen pb-24 text-slate-900 font-sans">
      {/* ─── Breadcrumb Section (Navbar Offset Included) ─────────── */}
      <div className="container mx-auto px-4 pt-24 pb-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/hotels" className="hover:text-[#1B3A6B] transition-colors">Hotels</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/hotels/${slug}`} className="hover:text-[#1B3A6B] transition-colors">{hotel.name}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-800 font-semibold">{room.name}</span>
        </div>
      </div>

      {/* ─── Hero Image Gallery (Top OTA Layout) ────────────────────── */}
      <div className="container mx-auto px-4">
        {/* Mobile View: Swipeable Carousel */}
        <div className="md:hidden relative h-[300px] rounded-2xl overflow-hidden shadow-md bg-slate-100">
          <div className="flex h-full overflow-x-auto snap-x snap-mandatory no-scrollbar">
            {images.map((img: string, idx: number) => (
              <div
                key={idx}
                onClick={() => { setActiveImageIndex(idx); setGalleryOpen(true); }}
                className="w-full h-full shrink-0 snap-center relative cursor-pointer"
              >
                <img src={img} alt={`Cover ${idx}`} className="w-full h-full object-cover" />
                {idx === 0 && (
                  <>
                    {/* Shadow overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-5" />
                    <div className="absolute bottom-5 left-5 right-5 text-white z-10">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className="bg-white/20 text-white backdrop-blur-md border-none text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                          {room.type}
                        </Badge>
                        {room.viewType && (
                          <Badge className="bg-white/20 text-white backdrop-blur-md border-none text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                            {room.viewType}
                          </Badge>
                        )}
                      </div>
                      <h1 className="text-xl font-black uppercase tracking-tight leading-tight mb-2 drop-shadow-md">
                        {room.name}
                      </h1>
                      <p className="text-white/80 text-[10px] font-semibold flex items-center gap-1.5 drop-shadow-sm">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        {hotel.name} · {hotel.city}
                      </p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          {images.length > 1 && (
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-3 py-1.5 rounded-xl pointer-events-none">
              Swipe for all {images.length} Photos
            </div>
          )}
        </div>

        {/* Desktop View: Grid Layout */}
        <div className="hidden md:grid grid-cols-5 gap-3 h-[420px] rounded-xl overflow-hidden shadow-md">
          {/* Main Cover Image (col-span-3) */}
          <div
            onClick={() => { setActiveImageIndex(0); setGalleryOpen(true); }}
            className="col-span-3 relative overflow-hidden group cursor-pointer h-full"
          >
            <img src={images[0]} alt={room.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-8" />

            {/* Overlay Details */}
            <div className="absolute bottom-8 left-8 right-8 text-white z-10">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-white/20 text-white backdrop-blur-md border-none text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full">
                  {room.type}
                </Badge>
                {room.viewType && (
                  <Badge className="bg-white/20 text-white backdrop-blur-md border-none text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full">
                    {room.viewType}
                  </Badge>
                )}
              </div>
              <h1 className="text-3.5xl font-black uppercase tracking-tight leading-none mb-3 drop-shadow-md">
                {room.name}
              </h1>
              <p className="text-white/90 text-xs font-semibold flex items-center gap-1.5 drop-shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                {hotel.name} · {hotel.city}, {hotel.address || ""}
              </p>
            </div>
          </div>

          {/* Side images */}
          <div className="hidden md:grid md:col-span-2 grid-rows-2 gap-3 h-full">
            <div
              className="relative overflow-hidden group cursor-pointer h-full"
              onClick={() => { setActiveImageIndex(1); setGalleryOpen(true); }}
            >
              <img src={images[1] || images[0]} alt="Room view 2" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div
              className="relative overflow-hidden group cursor-pointer h-full"
              onClick={() => setGalleryOpen(true)}
            >
              <img src={images[2] || images[0]} alt="Room view 3" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 brightness-90" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <Button variant="outline" className="text-white border-white/40 hover:bg-white/20 font-bold rounded-2xl backdrop-blur-md text-xs shadow-md">
                  + View All Photos ({images.length})
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content + Booking Widget ──────────────────────────── */}
      <div className="container mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8">

        {/* LEFT: Room Detail Content */}
        <div className="flex-1 space-y-6">

          {/* Quick Specs Strip */}
          <div className="bg-white rounded-xl p-2 md:p-4 border border-slate-100 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Link href={`/hotels/${slug}`} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#1B3A6B] transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to {hotel.name}
              </Link>
            </div>
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{room.name}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="rounded-lg text-slate-600 border-slate-200 font-medium text-xs">
                    <Bed className="w-3 h-3 mr-1" /> {room.bedType} Bed
                  </Badge>
                  <Badge variant="outline" className="rounded-lg text-slate-600 border-slate-200 font-medium text-xs">
                    <Users className="w-3 h-3 mr-1" /> Max {room.maxAdults || 2} Adults
                  </Badge>
                  {room.sizeSqft && (
                    <Badge variant="outline" className="rounded-lg text-slate-600 border-slate-200 font-medium text-xs">
                      <Maximize className="w-3 h-3 mr-1" /> {room.sizeSqft} sq.ft
                    </Badge>
                  )}
                  {room.floorNumber && (
                    <Badge variant="outline" className="rounded-lg text-slate-600 border-slate-200 font-medium text-xs">
                      <Layers className="w-3 h-3 mr-1" /> Floor {room.floorNumber}
                    </Badge>
                  )}
                  {room.viewType && (
                    <Badge variant="outline" className="rounded-lg text-[#1B3A6B] border-[#1B3A6B]/20 bg-[#1B3A6B]/5 font-medium text-xs">
                      <Eye className="w-3 h-3 mr-1" /> {room.viewType}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Starting at</p>
                <p className="text-3xl font-black text-[#1B3A6B]">₹{(room.basePrice || 0).toLocaleString()}</p>
                <p className="text-xs text-slate-400 italic">/night</p>
              </div>
            </div>
          </div>

          {/* Highlights */}
          {allHighlights.length > 0 && (
            <div className="bg-white rounded-xl p-2 md:p-4 border border-slate-100 shadow-xs space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" /> Room Highlights
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {allHighlights.map((h, i) => {
                  const Icon = getIcon(h);
                  return (
                    <div key={i} className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-sm p-2">
                      <div className="p-1.5 bg-[#1B3A6B]/10 rounded-lg shrink-0">
                        <Icon className="w-4 h-4 text-[#1B3A6B]" />
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{h}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="bg-white rounded-xl p-2 md:p-4 border border-slate-100 shadow-xs space-y-3">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#1B3A6B]" /> About This Room
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {room.description || `Experience the finest comfort in our ${room.name}. This beautifully appointed room features a ${room.bedType} bed, climate control, and everything you need for a perfect stay at ${hotel.name} in ${hotel.city}.`}
            </p>

            {/* Meal Plan Banner */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-sm p-2 flex items-center gap-3 mt-2">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <Utensils className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-black text-emerald-700 uppercase tracking-wider">Meal Plan Included</p>
                <p className="text-sm font-semibold text-emerald-800">
                  {room.mealPlan === "CP" ? "Continental Breakfast (CP)" :
                    room.mealPlan === "MAP" ? "Breakfast & Dinner (MAP)" :
                      room.mealPlan === "AP" ? "All Meals Included (AP)" :
                        "Room Only (EP) — No meals"}
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Month-Wise Price Calendar */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0F1E3D] to-[#1B3A6B] px-5 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-300" /> Rate Calendar
                  </h3>
                  <p className="text-[11px] text-white/50 mt-0.5">
                    Click any date to select check-in, then pick checkout. Live prices &amp; deals shown.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                      const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
                      if (prev >= minMonth) setCurrentMonth(prev);
                    }}
                    disabled={
                      currentMonth.getFullYear() === new Date().getFullYear() &&
                      currentMonth.getMonth() === new Date().getMonth()
                    }
                    className="p-2 hover:bg-white/15 rounded-lg disabled:opacity-30 transition-colors"
                    aria-label="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>
                  <span className="text-xs font-black text-white min-w-[130px] text-center">
                    {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const maxMonth = new Date(today.getFullYear(), today.getMonth() + 11, 1);
                      const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
                      if (next <= maxMonth) setCurrentMonth(next);
                    }}
                    disabled={
                      currentMonth.getFullYear() === new Date(new Date().getFullYear(), new Date().getMonth() + 11, 1).getFullYear() &&
                      currentMonth.getMonth() === new Date(new Date().getFullYear(), new Date().getMonth() + 11, 1).getMonth()
                    }
                    className="p-2 hover:bg-white/15 rounded-lg disabled:opacity-30 transition-colors"
                    aria-label="Next Month"
                  >
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 md:p-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <div key={d} className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-1">{d}</div>
                ))}
              </div>

              {/* Calendar cells */}
              <div className="grid grid-cols-7 gap-1 md:gap-1.5">
                {renderInteractiveCalendar()}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-3 mt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#1B3A6B] rounded" />
                  <span className="text-[9px] font-bold text-slate-500">Selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-slate-100 border border-slate-200 rounded" />
                  <span className="text-[9px] font-bold text-slate-500">Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-emerald-100 border border-emerald-300 rounded" />
                  <span className="text-[9px] font-bold text-slate-500">Deal / Promo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-amber-100 border border-amber-300 rounded" />
                  <span className="text-[9px] font-bold text-slate-500">⚡ Low Stock (≤2)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-slate-200 rounded" />
                  <span className="text-[9px] font-bold text-slate-500">Sold Out</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-rose-100 border border-rose-200 rounded" />
                  <span className="text-[9px] font-bold text-slate-500">Blocked</span>
                </div>
              </div>
            </div>
          </div>

          {/* In-Room Amenities */}
          {room.amenities?.length > 0 && (
            <div className="bg-white rounded-xl p-2 md:p-4 border border-slate-100 shadow-xs space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-500" /> Room Amenities
              </h3>
              <div className="flex flex-wrap gap-2">
                {room.amenities.map((amenity: string, i: number) => {
                  const Icon = getIcon(amenity);
                  return (
                    <div key={i} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-sm px-3 py-2">
                      <Icon className="w-3.5 h-3.5 text-[#1B3A6B]" />
                      <span className="text-xs font-semibold text-slate-700">{amenity}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Facilities */}
          {room.facilities?.length > 0 && (
            <div className="bg-white rounded-xl p-2 md:p-4 border border-slate-100 shadow-xs space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-500" /> In-Room Facilities
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {room.facilities.map((facility: string, i: number) => {
                  const Icon = getIcon(facility);
                  return (
                    <div key={i} className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <div className="p-1.5 bg-sky-50 rounded-lg shrink-0">
                        <Icon className="w-3.5 h-3.5 text-sky-600" />
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{facility}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cancellation & Policies */}
          <div className="bg-white rounded-xl p-2 md:p-4 border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" /> Cancellation Policy
            </h3>
            <div className="space-y-3">
              {room.refundable ? (
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-sm p-2">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0 stroke-[3]" />
                  <div>
                    <p className="text-sm font-bold text-emerald-700">{formatCancellation(room.cancellationHours)}</p>
                    <p className="text-xs text-emerald-600 mt-0.5">Full refund if cancelled within the allowed window.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 rounded-xl p-2">
                  <X className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-rose-700">Non-Refundable</p>
                    <p className="text-xs text-rose-500 mt-0.5">This room type does not support cancellations or refunds.</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-slate-500 p-3 bg-slate-50 rounded-sm border border-slate-100">
                <Clock className="w-4 h-4 text-slate-400" />
                Check-in: <strong className="text-slate-700">{hotel.checkInTime || "14:00"}</strong>
                <span className="mx-2">·</span>
                Check-out: <strong className="text-slate-700">{hotel.checkOutTime || "12:00"}</strong>
              </div>
            </div>
          </div>

          {/* Other Rooms at this Hotel */}
          {hotel.rooms?.filter((r: any) => String(r.id) !== roomId).length > 0 && (
            <div className="bg-white rounded-xl p-2 md:p-4 border border-slate-100 shadow-xs space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Other Rooms at {hotel.name}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {hotel.rooms.filter((r: any) => String(r.id) !== roomId).map((r: any) => (
                  <Link
                    key={r.id}
                    href={`/hotels/${slug}/rooms/${r.id}`}
                    className="flex gap-3 items-center bg-slate-50 border border-slate-100 rounded-sm p-2 hover:border-[#1B3A6B]/30 hover:bg-[#1B3A6B]/5 transition-all group"
                  >
                    <div className="w-14 h-14 rounded-sm overflow-hidden shrink-0 bg-slate-200">
                      {r.images?.[0] ? (
                        <img src={r.images[0]} alt={r.name} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-6 h-6 text-slate-400 m-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate group-hover:text-[#1B3A6B] transition-colors">{r.name}</p>
                      <p className="text-xs text-slate-500">{r.bedType} · {r.type}</p>
                      <p className="text-xs font-black text-[#1B3A6B] mt-0.5">₹{(r.basePrice || 0).toLocaleString()}/night</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1B3A6B] shrink-0 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Booking Engine (sticky) */}
        <div className="w-full lg:w-[380px] space-y-4">
          <div className="lg:sticky lg:top-[80px] space-y-4">
            {/* Map Card — compact above booking widget */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm overflow-hidden">
              <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#1B3A6B]" /> Property Location
              </h4>
              <div className="relative w-full h-[120px] bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                <iframe
                  title="Hotel Location Map"
                  width="100%" height="100%" frameBorder="0"
                  src={`https://maps.google.com/maps?q=${hotel.latitude && hotel.longitude ? `${hotel.latitude},${hotel.longitude}` : encodeURIComponent(`${hotel.name}, ${hotel.city || ""}`)}&z=15&output=embed`}
                  className="rounded-xl"
                />
              </div>
              <p className="mt-2 text-[10px] text-slate-500 flex items-start gap-1 leading-normal">
                <MapPin className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                <span className="truncate">{hotel.address || `${hotel.city || ""}, ${hotel.state || ""}`}</span>
              </p>
              <Link
                href={`/hotels/${slug}#location`}
                className="mt-2 text-[10px] font-bold text-[#1B3A6B] hover:underline flex items-center gap-0.5"
              >
                View full details <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Booking Widget */}
            <div className="bg-[#0F1E3D] text-white rounded-xl p-4 space-y-5 shadow-xl">
              <div>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mb-1">Starting from</p>
                {(() => {
                  // Show live discounted price for check-in date, or today if not selected
                  const displayDate = checkIn || new Date().toISOString().split("T")[0];
                  const livePrice = getDailyPrice(displayDate);
                  const hasLiveDiscount = livePrice < room.basePrice;
                  return (
                    <div className="flex items-baseline gap-2 flex-wrap">
                      {hasLiveDiscount && (
                        <span className="text-base text-white/40 line-through font-bold tracking-tight">₹{(room.basePrice || 0).toLocaleString()}</span>
                      )}
                      <span className="text-4xl font-black tracking-tight">₹{Math.round(livePrice).toLocaleString()}</span>
                      <span className="text-xs text-white/40 font-bold italic">/night</span>
                      {hasLiveDiscount && (
                        <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Save ₹{Math.round(room.basePrice - livePrice).toLocaleString()}
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Dates */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-white/40 ml-1">Check-in</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-sky-400 absolute left-3.5 top-4 pointer-events-none" />
                      <input
                        type="date" aria-label="Check-in" value={checkIn}
                        onChange={(e) => {
                          setCheckIn(e.target.value);
                          if (checkOut && new Date(e.target.value) >= new Date(checkOut)) {
                            const d = new Date(e.target.value);
                            d.setDate(d.getDate() + 1);
                            setCheckOut(d.toISOString().split("T")[0]);
                          }
                        }}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full h-12 rounded-sm bg-white/5 border border-white/10 text-white pl-10 pr-2 text-xs font-bold focus:outline-none focus:border-sky-400 cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-white/40 ml-1">Check-out</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-sky-400 absolute left-3.5 top-4 pointer-events-none" />
                      <input
                        type="date" aria-label="Check-out" value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)} min={checkIn}
                        className="w-full h-12 rounded-sm bg-white/5 border border-white/10 text-white pl-10 pr-2 text-xs font-bold focus:outline-none focus:border-sky-400 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Guests Popover */}
                <div className="space-y-1.5 relative">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-white/40 ml-1">Guests & Rooms</label>
                  <button
                    onClick={() => setGuestPopoverOpen(!guestPopoverOpen)}
                    className="w-full h-12 rounded-sm bg-white/5 border border-white/10 text-white px-4 text-left text-xs font-bold hover:bg-white/10 transition-colors flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-sky-400" />
                      {roomsConfig.length} Room{roomsConfig.length > 1 ? "s" : ""} · {roomsConfig.reduce((a, c) => a + c.adults, 0)} Adult{roomsConfig.reduce((a, c) => a + c.adults, 0) > 1 ? "s" : ""}
                    </span>
                    <ChevronDown className="w-4 h-4 text-white/40" />
                  </button>

                  {guestPopoverOpen && (
                    <div ref={popoverRef} className="absolute z-30 left-0 right-0 top-full mt-2 bg-white text-slate-800 rounded-2xl border border-slate-200 shadow-xl p-5 space-y-4 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h4 className="font-bold text-xs text-[#1B3A6B] uppercase tracking-wider">Occupancy Setup</h4>
                        <button onClick={() => setGuestPopoverOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                        {roomsConfig.map((config, index) => (
                          <div key={index} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                              <span>Room {index + 1}</span>
                              {roomsConfig.length > 1 && (
                                <button onClick={() => setRoomsConfig(prev => prev.filter((_, i) => i !== index))} className="text-rose-500 text-[10px] hover:underline">Remove</button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              {[
                                { label: "Adults", key: "adults", min: 1, max: 4 },
                                { label: "Kids", key: "children", min: 0, max: 3 },
                              ].map(({ label, key, min, max }) => (
                                <div key={key} className="flex items-center justify-between bg-white px-2 py-1.5 rounded-lg border border-slate-100">
                                  <span className="text-[11px] font-semibold text-slate-500">{label}</span>
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => setRoomsConfig(prev => prev.map((c, i) => i === index ? { ...c, [key]: Math.max(min, (c as any)[key] - 1) } : c))} className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center font-bold text-xs">-</button>
                                    <span className="text-xs font-bold w-4 text-center">{(config as any)[key]}</span>
                                    <button onClick={() => setRoomsConfig(prev => prev.map((c, i) => i === index ? { ...c, [key]: Math.min(max, (c as any)[key] + 1) } : c))} className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center font-bold text-xs">+</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      {roomsConfig.length < 5 && (
                        <button onClick={() => setRoomsConfig(prev => [...prev, { adults: 2, children: 0 }])} className="w-full text-xs font-bold py-2 border border-slate-200 rounded-xl text-[#1B3A6B] hover:bg-slate-50 transition-colors flex items-center justify-center gap-1">
                          <Plus className="w-3.5 h-3.5" /> Add Another Room
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Price Summary */}
              <div className="pt-2 border-t border-white/10 space-y-2 text-xs text-white/70">
                <div className="flex justify-between"><span>Base rate</span><span className="text-white font-bold">₹{(room.basePrice || 0).toLocaleString()}/night</span></div>
                <div className="flex justify-between">
                  <span>Stay ({checkOut ? `${nights} night${nights > 1 ? "s" : ""}` : "Select Check-out"} × {roomsConfig.length} room{roomsConfig.length > 1 ? "s" : ""})</span>
                  <span className="text-white font-bold">₹{stayTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-white/40"><span>+ 12% GST</span><span>Billed separately</span></div>
              </div>
 
              {/* CTA */}
              {isOccupancyExceeded ? (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold p-3 rounded-sm text-center">
                  Guest count exceeds room capacity. Please adjust above.
                </div>
              ) : !checkOut ? (
                <Button disabled className="w-full h-14 rounded-sm bg-white/20 text-white/40 font-black uppercase tracking-wider text-xs cursor-not-allowed">
                  Select Check-out Date
                </Button>
              ) : (
                <Button onClick={handleBookNow} className="w-full h-14 rounded-sm bg-white text-[#0F1E3D] hover:bg-white/90 font-black uppercase tracking-wider text-xs shadow-lg">
                  Book Now — ₹{stayTotal.toLocaleString()}
                </Button>
              )}

              <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                <a href="tel:+918595513009" className="flex-1 h-11 rounded-sm border border-white/10 font-bold text-xs text-white hover:bg-white/5 flex items-center justify-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-sky-400" /> Call Desk
                </a>
                <button onClick={() => toast.success("Opening inquiry form...")} className="flex-1 h-11 rounded-sm border border-white/10 font-bold text-xs text-white hover:bg-white/5 flex items-center justify-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-sky-400" /> Inquiry
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg p-2 border border-slate-100 shadow-xs grid grid-cols-3 gap-3 text-center">
              {[
                { icon: ShieldCheck, label: "Secure Booking", color: "text-emerald-500" },
                { icon: Check, label: "Instant Confirm", color: "text-sky-500" },
                { icon: Star, label: "Verified Stay", color: "text-amber-400" },
              ].map((t, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <t.icon className={cn("w-5 h-5", t.color)} />
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Fullscreen Gallery Modal ────────────────────────────────── */}
      {galleryOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 md:p-8">
          <div className="flex justify-between items-center text-white">
            <span className="text-xs font-bold tracking-widest uppercase">{room.name} — Photo {activeImageIndex + 1}/{images.length}</span>
            <button onClick={() => setGalleryOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-white/80"><X className="w-6 h-6" /></button>
          </div>
          <div className="relative flex-1 flex items-center justify-center max-h-[80vh]">
            <button onClick={() => setActiveImageIndex(p => (p - 1 + images.length) % images.length)} className="absolute left-0 md:left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <img src={images[activeImageIndex]} alt="Room gallery" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
            <button onClick={() => setActiveImageIndex(p => (p + 1) % images.length)} className="absolute right-0 md:right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          <div className="flex gap-2.5 overflow-x-auto justify-center pb-2 pt-4 max-w-2xl mx-auto">
            {images.map((img, idx) => (
              <button key={idx} onClick={() => setActiveImageIndex(idx)} className={cn("w-14 h-10 rounded-lg overflow-hidden shrink-0 border-2 transition-all opacity-60 hover:opacity-100", activeImageIndex === idx ? "border-sky-400 scale-105 opacity-100" : "border-transparent")}>
                <img src={img} alt="Thumb" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Sticky Mobile Bottom Bar ─── */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] px-5 py-3.5 flex items-center justify-between">
        <div>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Starting at</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-[#1B3A6B]">₹{(room.basePrice || 0).toLocaleString()}</span>
            <span className="text-[10px] text-slate-400 font-semibold">/night</span>
          </div>
        </div>
        {isOccupancyExceeded ? (
          <Button disabled className="bg-slate-200 text-slate-400 font-bold rounded-xl h-11 px-5 text-xs">
            Limit Exceeded
          </Button>
        ) : (
          <Button onClick={handleBookNow} className="bg-[#1B3A6B] hover:bg-[#0f2548] text-white font-bold rounded-xl h-11 px-7 text-xs shadow-md transition-all">
            Book Now
          </Button>
        )}
      </div>
    </div>
  );
}
