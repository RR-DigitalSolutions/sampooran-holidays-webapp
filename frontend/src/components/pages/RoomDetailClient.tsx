"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Star, MapPin, ChevronLeft, ChevronRight, Bed, Users, Building2,
  Check, X, Calendar, Phone, MessageSquare, Wifi, Coffee, Utensils,
  Waves, Dumbbell, Flame, Car, Tv, ShieldCheck, ArrowLeft, ChevronDown,
  Wind, Bath, Maximize, Eye, Layers, Clock, Sparkles, AlertTriangle, Plus,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { API_BASE } from "@/context/AuthContext";
import { toast } from "sonner";
import { cn, getHotelImageUrl } from "@/lib/utils";

interface RoomConfig {
  adults: number;
  childrenWithBed: number;
  childrenWithoutBed: number;
}

interface MealPlanOption {
  code: string;
  label: string;
  adultPrice?: number;
  childPrice?: number;
  isBase?: boolean;
}

interface CustomPricing {
  extraAdultPrice?: number;
  extraChildWithBedPrice?: number;
  extraChildWithoutBedPrice?: number;
  extraChildPrice?: number;
  mealPlanOptions?: MealPlanOption[];
  [key: string]: unknown;
}

interface CalendarRecord {
  date: string;
  basePrice?: number;
  discountType?: string;
  discountPercent?: number;
  discountFlat?: number;
  availableCount?: number | string;
  isBlocked?: boolean;
  customPricing?: CustomPricing;
}

interface RoomData {
  id: string | number;
  name?: string;
  type?: string;
  images?: string[];
  basePrice?: number;
  weekendPrice?: number;
  weekendDays?: string[];
  discountType?: string;
  discountPercent?: number;
  discountFlat?: number;
  mealPlanOptions?: MealPlanOption[];
  baseAdults?: number;
  baseChildren?: number;
  extraAdultPrice?: number;
  extraChildWithBedPrice?: number;
  extraChildPrice?: number;
  extraChildWithoutBedPrice?: number;
  maxAdults?: number;
  maxChildren?: number;
  highlights?: string[];
  viewType?: string;
  sizeSqft?: number | string;
  bedType?: string;
  floorNumber?: number | string;
  amenities?: string[];
  facilities?: string[];
  description?: string;
  refundable?: boolean;
  cancellationHours?: number;
  totalRooms?: number;
  [key: string]: unknown;
}

interface HotelData {
  rooms?: RoomData[];
  images?: string[];
  name?: string;
  city?: string;
  address?: string;
  checkInTime?: string;
  checkOutTime?: string;
  [key: string]: unknown;
}

// Icon map for amenities/facilities
const FEATURE_ICONS: Record<string, LucideIcon> = {
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
  const [hotel, setHotel] = useState<HotelData | null>(null);
  const [room, setRoom] = useState<RoomData | null>(null);
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
  const [roomsConfig, setRoomsConfig] = useState<RoomConfig[]>([{ adults: 2, childrenWithBed: 0, childrenWithoutBed: 0 }]);
  const [selectedMealPlan, setSelectedMealPlan] = useState<string>("");
  const [guestPopoverOpen, setGuestPopoverOpen] = useState(false);

  useEffect(() => {
    if (room) {
      setSelectedMealPlan("");
    }
  }, [room]);

  const popoverRef = useRef<HTMLDivElement>(null);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const [calendarData, setCalendarData] = useState<CalendarRecord[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState<boolean>(true);

  const getDailyPrice = (dateStr: string) => {
    const record = calendarData.find((x) => x.date === dateStr);

    const dayName = new Date(dateStr).toLocaleDateString("en-US", { weekday: "long" });
    const weekendDays = room?.weekendDays || ["Friday", "Saturday"];
    const isWeekend = weekendDays.includes(dayName);

    let base = record?.basePrice ?? room?.basePrice ?? 0;
    if (isWeekend && !record && room?.weekendPrice !== null && room?.weekendPrice !== undefined && room?.weekendPrice > 0) {
      base = room.weekendPrice;
    }

    const discountType = record?.discountType ?? room?.discountType ?? "PERCENT";
    const discountPercent = record?.discountPercent ?? room?.discountPercent ?? 0;
    const discountFlat = record?.discountFlat ?? room?.discountFlat ?? 0;

    let final = base;
    if (discountType === "PERCENT" && discountPercent > 0) {
      final = Math.max(0, base - (base * discountPercent) / 100);
    } else if (discountType === "FLAT" && discountFlat > 0) {
      final = Math.max(0, base - discountFlat);
    }
    return final;
  };

  const getOriginalDailyPrice = (dateStr: string) => {
    const record = calendarData.find((x) => x.date === dateStr);
    const dayName = new Date(dateStr).toLocaleDateString("en-US", { weekday: "long" });
    const weekendDays = room?.weekendDays || ["Friday", "Saturday"];
    const isWeekend = weekendDays.includes(dayName);

    let base = record?.basePrice ?? room?.basePrice ?? 0;
    if (isWeekend && !record && room?.weekendPrice !== null && room?.weekendPrice !== undefined && room?.weekendPrice > 0) {
      base = room.weekendPrice;
    }
    return base;
  };

  const pricingBreakdown = useMemo(() => {
    if (!room || !checkIn) {
      return {
        nights: 0,
        roomsCount: roomsConfig.length,
        baseTotal: 0,
        extraAdultTotal: 0,
        extraChildWithBedTotal: 0,
        extraChildWithoutBedTotal: 0,
        mealPlanTotal: 0,
        selectedPlanObj: { code: "EP", label: "Room Only", adultPrice: 0, childPrice: 0, isBase: true },
        originalSubtotal: 0,
        subtotal: 0,
        gst: 0,
        grandTotal: 0,
      };
    }

    let baseTotal = 0;
    let extraAdultTotal = 0;
    let extraChildWithBedTotal = 0;
    let extraChildWithoutBedTotal = 0;
    let mealPlanTotal = 0;
    let originalBaseTotal = 0;

    const start = new Date(checkIn);
    const end = checkOut ? new Date(checkOut) : new Date(start.getTime() + 86400000);
    const dates: string[] = [];
    const current = new Date(start);
    while (current < end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }

    const basePlanCode = "EP";
    const basePlanLabel = "Room Only";
    const mealPlans: MealPlanOption[] = [
      { code: basePlanCode, label: basePlanLabel, adultPrice: 0, childPrice: 0, isBase: true },
      ...((room.mealPlanOptions || []) as MealPlanOption[]).filter((o) => o.code !== basePlanCode),
    ];
    const selectedPlanObj = mealPlans.find((m) => m.code === selectedMealPlan) || mealPlans[0];

    const baseAdults = room.baseAdults ?? 2;
    const baseChildren = room.baseChildren ?? 0;

    for (const config of roomsConfig) {
      for (const dStr of dates) {
        const basePrice = getDailyPrice(dStr);
        baseTotal += basePrice;
        originalBaseTotal += getOriginalDailyPrice(dStr);

        const record = calendarData.find((x) => x.date === dStr);
        const cp = record?.customPricing as CustomPricing | undefined;

        const dateExtraAdultPrice = cp && cp.extraAdultPrice !== undefined && cp.extraAdultPrice !== null
          ? Number(cp.extraAdultPrice)
          : (room.extraAdultPrice || 0);
        const extraAdults = Math.max(0, config.adults - baseAdults);
        extraAdultTotal += extraAdults * dateExtraAdultPrice;

        const dateExtraChildWithBedPrice = cp && cp.extraChildWithBedPrice !== undefined && cp.extraChildWithBedPrice !== null
          ? Number(cp.extraChildWithBedPrice)
          : (room.extraChildWithBedPrice || room.extraChildPrice || 0);
        const extraKidsWithBed = Math.max(0, (config.childrenWithBed || 0) - baseChildren);
        extraChildWithBedTotal += extraKidsWithBed * dateExtraChildWithBedPrice;

        const dateExtraChildWithoutBedPrice = cp && cp.extraChildWithoutBedPrice !== undefined && cp.extraChildWithoutBedPrice !== null
          ? Number(cp.extraChildWithoutBedPrice)
          : (room.extraChildWithoutBedPrice || 0);
        const remainingBaseChildren = Math.max(0, baseChildren - (config.childrenWithBed || 0));
        const extraKidsWithoutBed = Math.max(0, (config.childrenWithoutBed || 0) - remainingBaseChildren);
        extraChildWithoutBedTotal += extraKidsWithoutBed * dateExtraChildWithoutBedPrice;

        const rawDayOptions = cp && Array.isArray(cp.mealPlanOptions) && cp.mealPlanOptions.length > 0
          ? cp.mealPlanOptions
          : (room.mealPlanOptions && Array.isArray(room.mealPlanOptions) && room.mealPlanOptions.length > 0
            ? room.mealPlanOptions
            : []);

        const dayMealPlans: MealPlanOption[] = [
          { code: basePlanCode, label: basePlanLabel, adultPrice: 0, childPrice: 0, isBase: true },
          ...(rawDayOptions as MealPlanOption[]).filter((o) => o.code !== basePlanCode),
        ];
        const daySelectedPlanObj = dayMealPlans.find((m) => m.code === selectedMealPlan) || dayMealPlans[0];

        const kidsTotal = (config.childrenWithBed || 0) + (config.childrenWithoutBed || 0);
        mealPlanTotal += (config.adults * (daySelectedPlanObj.adultPrice || 0)) + (kidsTotal * (daySelectedPlanObj.childPrice || 0));
      }
    }

    const subtotal = baseTotal + extraAdultTotal + extraChildWithBedTotal + extraChildWithoutBedTotal + mealPlanTotal;
    const originalSubtotal = Math.max(0, originalBaseTotal + extraAdultTotal + extraChildWithBedTotal + extraChildWithoutBedTotal + mealPlanTotal);
    const gst = Math.round(subtotal * 0.12);
    const grandTotal = subtotal + gst;

    return {
      nights: dates.length,
      roomsCount: roomsConfig.length,
      baseTotal,
      extraAdultTotal,
      extraChildWithBedTotal,
      extraChildWithoutBedTotal,
      mealPlanTotal,
      selectedPlanObj,
      originalSubtotal,
      subtotal,
      gst,
      grandTotal,
    };
  }, [room, checkIn, checkOut, roomsConfig, calendarData, selectedMealPlan]);

  // Mobile bottom-sheet state for booking engine & price breakout
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [sheetTranslate, setSheetTranslate] = useState<number>(0);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number | null>(null);
  const startTranslate = useRef<number>(0);
  const sheetHeightRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateHeight = () => {
      const h = Math.round(window.innerHeight * 0.78);
      sheetHeightRef.current = h;
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  useEffect(() => {
    if (!sheetRef.current) return;
    const el = sheetRef.current as HTMLDivElement;
    el.style.height = '78vh';
    if (touchStartY.current !== null) {
      el.style.transform = `translateY(${sheetTranslate}px)`;
      el.style.transition = 'none';
    } else {
      el.style.transform = mobileSheetOpen ? 'translateY(0)' : 'translateY(100%)';
      el.style.transition = 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)';
    }
  }, [sheetTranslate, mobileSheetOpen]);

  const onSheetTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(".sheet-header")) return;

    if (typeof window !== "undefined") {
      sheetHeightRef.current = Math.round(window.innerHeight * 0.78);
    }
    touchStartY.current = e.touches[0].clientY;
    startTranslate.current = mobileSheetOpen ? 0 : (sheetHeightRef.current || 600);
  };

  const onSheetTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current == null) return;
    const delta = touchStartY.current - e.touches[0].clientY; // positive = swipe up
    let newTranslate = startTranslate.current - delta;
    newTranslate = Math.max(0, Math.min(sheetHeightRef.current || 600, newTranslate));
    setSheetTranslate(newTranslate);
  };

  const onSheetTouchEnd = () => {
    if (touchStartY.current == null) return;
    const threshold = (sheetHeightRef.current || 600) / 3;
    if (sheetTranslate > threshold) {
      setMobileSheetOpen(false);
    } else {
      setMobileSheetOpen(true);
    }
    touchStartY.current = null;
  };

  const openMobileSheet = () => setMobileSheetOpen(true);
  const closeMobileSheet = () => setMobileSheetOpen(false);

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
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setGuestPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/hotels/${slug}`);
      if (!res.ok) throw new Error("Hotel not found");
      const data = (await res.json()) as HotelData & { rooms?: RoomData[] };
      setHotel(data);
      const foundRoom = (data.rooms || []).find((r) => String(r.id) === roomId);
      if (!foundRoom) throw new Error("Room not found");
      setRoom(foundRoom);
    } catch (e) {
      console.error(e);
      toast.error("Could not load room details.");
    } finally {
      setLoading(false);
    }
  }, [slug, roomId]);

  const fetchCalendar = useCallback(async () => {
    setLoadingCalendar(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const firstDay = new Date(year, month, 1).toISOString().split("T")[0];
      const lastDay = new Date(year, month + 1, 0).toISOString().split("T")[0];

      const res = await fetch(`${API_BASE}/hotels/${slug}/rooms/${roomId}/calendar?startDate=${firstDay}&endDate=${lastDay}`);
      if (res.ok) {
        setCalendarData((await res.json()) as CalendarRecord[]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCalendar(false);
    }
  }, [slug, roomId, currentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (slug && roomId) {
      // Limit calendar fetches to the next 6 months only
      fetchCalendar();
    }
  }, [fetchCalendar, slug, roomId]);

  // When a user selects a date we want to auto-scroll the booking widget into view on mobile
  useEffect(() => {
    if (!checkIn) return;
    // If checkOut is also selected, scroll to booking widget
    if (checkOut) {
      // Only auto-scroll on narrow viewports (mobile)
      if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
        // Use a small delay to allow mobile layout adjustments
        setTimeout(() => {
          const el = document.getElementById("booking-widget");
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 200);
      }
    }
  }, [checkIn, checkOut]);

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

  // Today's date and latest selectable date (6 months window)
  const _today = new Date();
  const calendarMaxDateObj = new Date(_today.getFullYear(), _today.getMonth() + 6, 0);
  const calendarMaxDateStr = calendarMaxDateObj.toISOString().split("T")[0];

  const stayTotal = pricingBreakdown.subtotal;
  const maxTotalPerRoom = (room.maxAdults || 2) + (room.maxChildren || 1);
  const isOccupancyExceeded = roomsConfig.some((c) => {
    const totalGuests = c.adults + (c.childrenWithBed ?? 0) + (c.childrenWithoutBed ?? 0);
    return c.adults > (room.maxAdults || 2) || totalGuests > maxTotalPerRoom;
  });
  const renderInteractiveCalendar = (isCompact: boolean = false) => {
    if (loadingCalendar) {
      return (
        <div className="col-span-7 flex flex-col items-center justify-center py-6 min-h-[140px]">
          <div className="w-6 h-6 border-[3px] border-[#1B3A6B] border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-[10px] text-slate-400 font-semibold">Loading availability…</p>
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

      const availableCount = record ? Number(record.availableCount ?? 0) : Number(room.totalRooms ?? 1);
      const isBlocked = record ? Boolean(record.isBlocked) : false;
      const basePrice = record ? Number(record.basePrice ?? 0) : Number(room.basePrice ?? 0);
      const discountType = record?.discountType ?? room.discountType ?? "PERCENT";
      const discountPercent = Number(record?.discountPercent ?? room.discountPercent ?? 0);
      const discountFlat = Number(record?.discountFlat ?? room.discountFlat ?? 0);

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
          ? `${discountPercent}%`
          : `₹${Math.round(savedAmount).toLocaleString()}`)
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
        selected:      { wrap: "bg-[#1B3A6B] border-[#1B3A6B] text-white shadow-sm",              dayNum: "text-white",          cursor: "cursor-pointer" },
        inrange:       { wrap: "bg-[#1B3A6B]/10 border-[#1B3A6B]/20",                             dayNum: "text-[#1B3A6B]",      cursor: "cursor-pointer" },
        past:          { wrap: "bg-gray-50 border-gray-100 opacity-40",                            dayNum: "text-gray-300",       cursor: "cursor-not-allowed" },
        blocked:       { wrap: "bg-rose-50 border-rose-105 opacity-60",                            dayNum: "text-rose-455",       cursor: "cursor-not-allowed" },
        soldout:       { wrap: "bg-slate-100 border-slate-200 opacity-50",                         dayNum: "text-slate-400",      cursor: "cursor-not-allowed" },
        lowstock_deal: { wrap: "bg-amber-50 border-amber-200 hover:border-amber-400",             dayNum: "text-slate-800",      cursor: "cursor-pointer" },
        lowstock:      { wrap: "bg-amber-50 border-amber-200 hover:border-amber-400",             dayNum: "text-amber-900",      cursor: "cursor-pointer" },
        deal:          { wrap: "bg-emerald-50 border-emerald-200 hover:border-emerald-400",       dayNum: "text-emerald-900",    cursor: "cursor-pointer" },
        today:         { wrap: "bg-blue-50 border-blue-200 hover:border-blue-400",                 dayNum: "text-blue-800",       cursor: "cursor-pointer" },
        normal:        { wrap: "bg-white border-slate-200 hover:border-[#1B3A6B]/40 hover:shadow-xs", dayNum: "text-slate-700", cursor: "cursor-pointer" },
      };
      const S = CELL[cellStatus];

      if (isCompact) {
        dayCells.push(
          <button
            key={d}
            type="button"
            disabled={!isSelectable}
            onClick={() => handleDateClick(dateStr, isSelectable)}
            className={cn(
              "relative rounded-md border flex flex-col items-center justify-between transition-all select-none overflow-hidden",
              "min-h-[44px] py-1 px-0.5",
              S.wrap, isSelectable ? "cursor-pointer" : "cursor-not-allowed"
            )}
          >
            {/* compact top row: day number + discount label if any */}
            <div className="w-full flex items-center justify-between px-1">
              <span className={cn("text-[9px] font-bold leading-none", S.dayNum)}>{d}</span>
              {isSelectable && hasDiscount && (
                <span className={cn("text-[6.5px] font-bold px-0.5 rounded leading-none shrink-0", isSelectedEdge ? "bg-white/20 text-white" : "bg-emerald-555 text-white")}>
                  {discountPercent}%
                </span>
              )}
            </div>

            {/* compact middle row: Price */}
            {isSelectable && (
              <div className="flex flex-col items-center justify-center leading-none my-0.5">
                <span className={cn("text-[8.5px] font-extrabold tracking-tight leading-none", isSelectedEdge ? "text-white" : "text-slate-700")}>
                  ₹{Math.round(discountedPrice).toLocaleString()}
                </span>
              </div>
            )}

            {/* compact bottom row: Status abbreviation */}
            {!isSelectable && (
              <span className="text-[7.5px] font-semibold leading-none text-slate-400 mt-auto mb-0.5">
                {isPast ? "" : isBlocked ? "Block" : "Sold"}
              </span>
            )}

            {isSelectedEdge && (
              <span className="text-[6.5px] font-extrabold uppercase text-white/95 leading-none mt-auto">
                {isCheckIn ? "In" : "Out"}
              </span>
            )}
          </button>
        );
      } else {
        dayCells.push(
          <div
            key={d}
            onClick={() => handleDateClick(dateStr, isSelectable)}
            className={cn(
              "relative rounded-xl border transition-all duration-150 select-none overflow-hidden flex flex-col",
              "min-h-[72px] md:min-h-[90px]",
              S.wrap, S.cursor
            )}
          >
            {/* TOP ROW: Day number + primary badge */}
            <div className="flex items-start justify-between px-2 pt-2 pb-0.5 gap-0.5">
              <span className={cn("text-[10px] md:text-[11px] font-semibold leading-none shrink-0", S.dayNum)}>{d}</span>

              {/* Right side badges */}
              <div className="flex flex-col items-end gap-0.5 min-w-0">
                {isSelectable && hasDiscount && (
                  <span className={cn(
                    "text-[7px] font-semibold leading-none px-1.5 py-0.5 rounded-full whitespace-nowrap",
                    isSelectedEdge ? "bg-white/20 text-white" : "bg-emerald-500 text-white"
                  )}>
                    {discountBadgeText}
                  </span>
                )}
                {isBlocked && !isPast && (
                  <Lock className={cn("w-2.5 h-2.5 shrink-0", isSelectedEdge ? "text-white" : "text-rose-455")} />
                )}
                {isSoldOut && (
                  <span className="text-[7px] font-black text-white bg-slate-500 px-1.5 py-0.5 rounded-full leading-none">Full</span>
                )}
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
                  isBlocked ? (isSelectedEdge ? "text-white/60" : "text-rose-455") : "text-slate-400"
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
                    <span className="text-[7px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full leading-none">
                      ⚡ {availableCount} left
                    </span>
                  )}
                  {!isBlocked && !isSoldOut && !isLowAvailability && (
                    <span className={cn(
                      "text-[7px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full leading-none",
                      hasDiscount ? "text-emerald-700 bg-emerald-100" : "text-slate-400 bg-slate-100"
                    )}>
                      {hasDiscount ? "Deal" : "Available"}
                    </span>
                  )}
                  {isSoldOut && (
                    <span className="text-[7px] font-semibold uppercase text-slate-500">Sold Out</span>
                  )}
                  {isBlocked && (
                    <span className="text-[7px] font-semibold uppercase text-rose-500">Blocked</span>
                  )}
                </>
              )}
              {isSelectedEdge && (
                <span className="text-[7px] font-semibold uppercase text-white/70">
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
    }

    return [...padding, ...dayCells];
  };

  const handleBookNow = (e?: React.MouseEvent) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    if (isOccupancyExceeded) {
      toast.error(`Your guest config exceeds the limits of this room.`);
      return;
    }
    const roomsStr = encodeURIComponent(JSON.stringify(roomsConfig));
    router.push(`/hotels/${slug}/book?roomId=${room.id}&checkIn=${checkIn}&checkOut=${checkOut}&rooms=${roomsStr}&mealPlan=${selectedMealPlan}`);
  };



  const formatCancellation = (hours?: number) => {
    if (!hours) return "Free cancellation";
    if (hours % 168 === 0) return `Free cancellation up to ${hours / 168} week${hours / 168 > 1 ? "s" : ""} before check-in`;
    if (hours % 24 === 0) return `Free cancellation up to ${hours / 24} day${hours / 24 > 1 ? "s" : ""} before check-in`;
    return `Free cancellation up to ${hours} hours before check-in`;
  };

  const roomImages = room.images ?? [];
  const hotelImages = hotel.images ?? [];
  const rawImages =
    roomImages.length > 0
      ? roomImages
      : hotelImages.length > 0
        ? hotelImages
        : [];
  const images: string[] = rawImages.length > 0 ? rawImages : [null as any];

  const amenities = Array.isArray(room.amenities) ? room.amenities : [];
  const facilities = Array.isArray(room.facilities) ? room.facilities : [];
  const otherRooms = hotel.rooms?.filter((r) => String(r.id) !== roomId) ?? [];

  const allHighlights: string[] = [
    ...(room.highlights || []),
    room.viewType && `${room.viewType}`,
    room.sizeSqft && `${room.sizeSqft} sq.ft`,
    room.bedType && `${room.bedType} Bed`,
    room.floorNumber && `Floor ${room.floorNumber}`,
  ].filter(Boolean) as string[];

  return (
    <div className="bg-slate-50 min-h-screen pb-24 text-slate-900 font-sans overflow-x-hidden">
      {/* ─── Breadcrumb Section (Navbar Offset Included) ─────────── */}
      <div className="container mx-auto px-4 pt-16 pb-3">
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
        <div className="md:hidden relative aspect-[16/9] min-h-[220px] rounded-xl overflow-hidden shadow-md bg-slate-100">
          <div className="flex h-full overflow-x-auto snap-x snap-mandatory no-scrollbar">
            {images.map((img: string, idx: number) => (
              <div
                key={idx}
                onClick={() => { setActiveImageIndex(idx); setGalleryOpen(true); }}
                className="w-full h-full shrink-0 snap-center relative cursor-pointer"
              >
                <Image src={getHotelImageUrl(img, 800, 450, "16:9")} alt={`Cover ${idx}`} fill sizes="100vw" className="object-cover" />
                {idx === 0 && (
                  <>
                    {/* Shadow overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-5" />
                    <div className="absolute bottom-5 left-5 right-5 text-white z-10">
                      {room.type && (
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className="bg-white/20 text-white backdrop-blur-md border-none text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                            {room.type}
                          </Badge>
                        </div>
                      )}
                      <h1 className="text-xl font-black uppercase tracking-tight leading-tight mb-2 drop-shadow-md">
                        {room.name}
                      </h1>
                      <p className="text-white/80 text-[10px] font-semibold flex items-center gap-1.5 drop-shadow-sm">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        {hotel.name} · {hotel.city}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-white/80 font-semibold tracking-wide">
                        {room.viewType && <span className="bg-white/10 px-2 py-1 rounded-sm">{room.viewType}</span>}
                        {room.bedType && <span className="bg-white/10 px-2 py-1 rounded-sm">{room.bedType} Bed</span>}
                        {room.sizeSqft && <span className="bg-white/10 px-2 py-1 rounded-sm">{room.sizeSqft} sq.ft</span>}
                      </div>
                      <div className="mt-3">
                        <Link href={`/hotels/${slug}`} className="inline-flex items-center gap-2 text-[11px] font-semibold text-white/80 hover:text-white transition-colors">
                          <ArrowLeft className="w-3.5 h-3.5" /> Back to {hotel.name}
                        </Link>
                      </div>
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
        <div className="hidden md:grid grid-cols-5 gap-3 min-h-[420px] rounded-xl overflow-hidden shadow-md">
          {/* Main Cover Image (col-span-3) */}
          <div
            onClick={() => { setActiveImageIndex(0); setGalleryOpen(true); }}
            className="col-span-3 relative overflow-hidden group cursor-pointer h-full"
          >
            <Image src={getHotelImageUrl(images[0], 1200, 675, "16:9")} alt={room.name ?? "Room image"} fill sizes="100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-8" />

            {/* Overlay Details */}
            <div className="absolute bottom-8 left-8 right-8 text-white z-10">
              {room.type && (
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-white/20 text-white backdrop-blur-md border-none text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full">
                    {room.type}
                  </Badge>
                </div>
              )}
              <h1 className="text-3.5xl font-black uppercase tracking-tight leading-none mb-3 drop-shadow-md">
                {room.name}
              </h1>
              <p className="text-white/90 text-xs font-semibold flex items-center gap-1.5 drop-shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                {hotel.name} · {hotel.city}, {hotel.address || ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-white/80 font-semibold tracking-wide">
                {room.viewType && <span className="bg-white/10 px-2 py-1 rounded-sm">{room.viewType}</span>}
                {room.bedType && <span className="bg-white/10 px-2 py-1 rounded-sm">{room.bedType} Bed</span>}
                {room.sizeSqft && <span className="bg-white/10 px-2 py-1 rounded-sm">{room.sizeSqft} sq.ft</span>}
              </div>
              <div className="mt-3">
                <Link href={`/hotels/${slug}`} className="inline-flex items-center gap-2 text-[11px] font-semibold text-white/80 hover:text-white transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to {hotel.name}
                </Link>
              </div>
            </div>
          </div>

          {/* Side images */}
          <div className="hidden md:grid md:col-span-2 grid-rows-2 gap-3 h-full">
            <div
              className="relative overflow-hidden group cursor-pointer h-full"
              onClick={() => { setActiveImageIndex(1); setGalleryOpen(true); }}
            >
              <Image src={getHotelImageUrl(images[1] || images[0], 800, 600, "4:3")} alt="Room view 2" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div
              className="relative overflow-hidden group cursor-pointer h-full"
              onClick={() => setGalleryOpen(true)}
            >
              <Image src={getHotelImageUrl(images[2] || images[0], 800, 600, "4:3")} alt="Room view 3" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105 brightness-90" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <Button variant="outline" className="text-white border-white/40 hover:bg-white/20 font-bold rounded-xl backdrop-blur-md text-xs shadow-md">
                  + View All Photos ({images.length})
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content + Booking Widget ──────────────────────────── */}
      <div className="container mx-auto px-4 mt-6 flex flex-col lg:flex-row gap-8">

        {/* LEFT: Room Detail Content */}
        <div className="flex-1 space-y-6">


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

          {/* Room Images Gallery */}
          {roomImages.length > 0 && (
            <div className="bg-white rounded-xl p-2 md:p-4 border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-sky-500" /> Room Gallery
                </h3>
                <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  {Math.min(roomImages.length, 5)} / 5 Photos
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {roomImages.slice(0, 5).map((img: string, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => { setActiveImageIndex(idx); setGalleryOpen(true); }}
                    className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer bg-slate-200 border border-slate-100 hover:border-[#1B3A6B]/30 transition-all shadow-sm"
                  >
                    <div className="relative w-full h-full">
                      <Image
                        src={getHotelImageUrl(img, 400, 400, "1:1")}
                        alt={`Room image ${idx + 1}`}
                        fill
                        sizes="(max-width: 640px) 100vw, 20vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="absolute top-2 right-2 text-[10px] font-bold text-white bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md">
                      {idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description - About This Room */}
          <div className="bg-white rounded-xl p-2 md:p-4 border border-slate-100 shadow-xs space-y-3">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#1B3A6B]" /> About This Room
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {room.description || `Experience the finest comfort in our ${room.name}. This beautifully appointed room features a ${room.bedType} bed, climate control, and everything you need for a perfect stay at ${hotel.name} in ${hotel.city}.`}
            </p>
          </div>

          {/* In-Room Amenities */}
          {amenities.length > 0 && (
            <div className="bg-white rounded-xl p-2 md:p-4 border border-slate-100 shadow-xs space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-500" /> Room Amenities
              </h3>
              <div className="flex flex-wrap gap-2">
                {amenities.map((amenity: string, i: number) => {
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
          {facilities.length > 0 && (
            <div className="bg-white rounded-xl p-2 md:p-4 border border-slate-100 shadow-xs space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-500" /> In-Room Facilities
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {facilities.map((facility: string, i: number) => {
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

          {/* Other Rooms at this Hotel - Room Upgrade Section */}
          {otherRooms.length > 0 && (
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-5 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Explore Other Rooms</h3>
                <span className="text-[10px] font-semibold uppercase text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">Upgrade Available</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {otherRooms.map((r: RoomData) => {
                  const roomPrice = r.basePrice || 0;
                  const currentPrice = room.basePrice || 0;
                  const priceComparison = roomPrice > currentPrice;
                  const priceDiff = Math.abs(roomPrice - currentPrice);
                  return (
                    <Link
                      key={r.id}
                      href={`/hotels/${slug}/rooms/${r.id}`}
                      className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:border-[#1B3A6B]/50 transition-all duration-300 flex flex-col hover:-translate-y-1"
                    >
                      {/* Top Image Section */}
                      <div className="relative h-36 md:h-44 bg-slate-100 overflow-hidden">
                        {r.images?.[0] ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={getHotelImageUrl(r.images?.[0])}
                              alt={r.name ?? "Room image"}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-100">
                            <Building2 className="w-10 h-10 text-slate-400" />
                          </div>
                        )}
                        {/* Price Tag */}
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-white/50">
                            <p className="text-[9px] text-slate-500 font-semibold">
                              FROM <span className="text-sm font-black text-[#1B3A6B] leading-none">₹ {roomPrice.toLocaleString()}</span>
                            </p>
                          </div>
                        {/* Upgrade Badge */}
                        {priceComparison && (
                          <div className="absolute bottom-3 left-3">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500 text-white px-3 py-1 rounded-full shadow-md">
                              +₹{priceDiff.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Room Details */}
                      <div className="flex-1 p-4 flex flex-col">
                        <h4 className="text-base font-bold text-slate-900 mb-2 group-hover:text-[#1B3A6B] transition-colors leading-tight">
                          {r.name}
                        </h4>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline" className="text-[8px] font-semibold rounded-md px-2 py-0.5 border-slate-200 text-slate-600 bg-slate-50">
                            <Bed className="w-3 h-3 mr-0.5" /> {r.bedType}
                          </Badge>
                          <Badge variant="outline" className="text-[8px] font-semibold rounded-md px-2 py-0.5 border-slate-200 text-slate-600 bg-slate-50">
                            {r.type}
                          </Badge>
                          {r.sizeSqft && (
                            <Badge variant="outline" className="text-[8px] font-semibold rounded-md px-2 py-0.5 border-slate-200 text-slate-600 bg-slate-50">
                              {r.sizeSqft} sq.ft
                            </Badge>
                          )}
                        </div>
                        {r.viewType && (
                          <p className="text-xs text-slate-600 mb-3 font-medium italic flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {r.viewType}
                          </p>
                        )}
                        <div className="mt-auto pt-3 border-t border-slate-100">
                          <Button className="w-full h-10 bg-[#1B3A6B] text-white font-bold text-sm rounded-lg hover:bg-[#0F1E3D] transition-colors flex items-center justify-center gap-2 group/btn shadow-sm">
                            View & Upgrade
                            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                          </Button>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

{/* RIGHT: Booking Engine (sticky) */}
        <div className="hidden lg:block lg:w-[380px] space-y-4">
          <div className="lg:sticky lg:top-[80px] space-y-4">
            
            {/* Card 1: Rate Calendar Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#1B3A6B]">Rate Calendar</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">Click dates to check-in/out</p>
                </div>
                <div className="flex items-center gap-1 bg-slate-50 mb-0.5">
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
                    className="p-1 border border-slate-200 rounded hover:bg-slate-50 text-xs font-bold disabled:opacity-30"
                  >
                    &larr;
                  </button>
                  <span className="text-xs font-bold text-slate-700 min-w-[70px] text-center font-mono">
                    {currentMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const maxMonth = new Date(today.getFullYear(), today.getMonth() + 5, 1);
                      const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
                      if (next <= maxMonth) setCurrentMonth(next);
                    }}
                    disabled={
                      currentMonth.getFullYear() === new Date(new Date().getFullYear(), new Date().getMonth() + 5, 1).getFullYear() &&
                      currentMonth.getMonth() === new Date(new Date().getFullYear(), new Date().getMonth() + 5, 1).getMonth()
                    }
                    className="p-1 border border-slate-200 rounded hover:bg-slate-50 text-xs font-bold disabled:opacity-30"
                  >
                    &rarr;
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 border-b border-slate-100 pb-1.5 uppercase tracking-wider">
                <div>Su</div>
                <div>Mo</div>
                <div>Tu</div>
                <div>We</div>
                <div>Th</div>
                <div>Fr</div>
                <div>Sa</div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {renderInteractiveCalendar(true)}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-between gap-y-1.5 pt-2 border-t border-slate-100 text-[8px] font-bold text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#1B3A6B]" /> Selected</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-50 border border-emerald-250" /> Deal</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-50 border border-amber-250" /> Low Stock</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-100 border border-slate-200" /> Sold</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-50 border border-rose-200" /> Block</span>
              </div>
            </div>

            {/* Card 2: Booking Engine Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
              {/* Daily / Starting Rate Display */}
              <div className="border-b border-slate-100 pb-3">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Starting from</p>
                {(() => {
                  const displayDate = checkIn || new Date().toISOString().split("T")[0];
                  const livePrice = getDailyPrice(displayDate);
                  const originalPrice = getOriginalDailyPrice(displayDate);
                  const savings = Math.max(0, originalPrice - livePrice);
                  const hasLiveDiscount = savings > 0;
                  const discountBadge = hasLiveDiscount ? `Save ₹${Math.round(savings).toLocaleString()}` : null;
                  return (
                    <div className="flex items-baseline gap-1.5 mt-1.5 flex-wrap">
                      {hasLiveDiscount && (
                        <span className="text-xs text-slate-400 line-through font-medium">₹{Math.round(originalPrice).toLocaleString()}</span>
                      )}
                      <span className="text-2xl font-black text-[#1B3A6B]">₹{Math.round(livePrice).toLocaleString()}</span>
                      <span className="text-[10px] text-slate-400 font-bold">/night</span>
                      {hasLiveDiscount && (
                        <span className="text-[8px] font-bold bg-rose-50 border border-rose-100 text-rose-600 px-1.5 py-0.5 rounded">
                          {discountBadge}
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Dates view */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">Check-in</span>
                  <div className="h-10 rounded border border-slate-200 bg-slate-50/50 px-3 flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-[#1B3A6B]" />
                    <span>{checkIn ? new Date(checkIn).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Select above"}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">Check-out</span>
                  <div className="h-10 rounded border border-slate-200 bg-slate-50/50 px-3 flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-[#1B3A6B]" />
                    <span>{checkOut ? new Date(checkOut).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Select above"}</span>
                  </div>
                </div>
              </div>

              {/* Guests Popover */}
              <div className="space-y-1 relative">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">Guests & Rooms</span>
                <button
                  onClick={() => setGuestPopoverOpen(!guestPopoverOpen)}
                  className="w-full h-10 rounded border border-slate-200 bg-white text-slate-700 px-3 text-left text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-[#1B3A6B]" />
                    {roomsConfig.length} Room{roomsConfig.length > 1 ? "s" : ""} · {roomsConfig.reduce((a, c) => a + c.adults, 0)} Adult{roomsConfig.reduce((a, c) => a + c.adults, 0) > 1 ? "s" : ""}
                    {roomsConfig.reduce((a, c) => a + (c.childrenWithBed ?? 0) + (c.childrenWithoutBed ?? 0), 0) > 0 && (
                      <span>
                        {" "}· {roomsConfig.reduce((a, c) => a + (c.childrenWithBed ?? 0) + (c.childrenWithoutBed ?? 0), 0)} Child
                      </span>
                    )}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {guestPopoverOpen && (
                  <div ref={popoverRef} className="absolute z-[100] left-0 right-0 top-full mt-2 bg-white text-slate-800 rounded-xl border border-slate-200 shadow-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <h4 className="font-bold text-[10px] text-[#1B3A6B] uppercase tracking-wider">Occupancy Config</h4>
                      <button onClick={() => setGuestPopoverOpen(false)} aria-label="Close occupancy panel" className="p-0.5 hover:bg-slate-100 rounded text-slate-400"><X className="w-3.5 h-3.5" /></button>
                    </div>

                    <div className="bg-sky-50 border border-sky-100 rounded-lg p-2 text-[9px] text-sky-700 font-medium leading-relaxed">
                      Base rate covers {room.baseAdults ?? 2} adult{(room.baseAdults ?? 2) !== 1 ? "s" : ""}. Max room capacity: <span className="font-bold">{room.maxAdults || 2} adults + {room.maxChildren || 1} kids</span>.
                    </div>

                    <div className="max-h-52 overflow-y-auto space-y-2.5">
                      {roomsConfig.map((config, index) => {
                        const totalInRoom = config.adults + (config.childrenWithBed ?? 0) + (config.childrenWithoutBed ?? 0);
                        const roomOverCapacity = config.adults > (room.maxAdults || 2) || totalInRoom > maxTotalPerRoom;
                        return (
                          <div key={index} className={`p-2.5 rounded-lg border space-y-2 ${roomOverCapacity ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-100"}`}>
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                              <span>Room {index + 1}</span>
                              <div className="flex items-center gap-1.5">
                                {roomOverCapacity && <span className="text-[8px] text-rose-600 font-bold">Over Capacity</span>}
                                {roomsConfig.length > 1 && (
                                  <button onClick={() => setRoomsConfig(prev => prev.filter((_, i) => i !== index))} className="text-rose-500 text-[9px] hover:underline">Remove</button>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                              {([
                                { label: "Adults", key: "adults" as const, min: 1, max: room.maxAdults || 4 },
                                { label: "Child (Bed)", key: "childrenWithBed" as const, min: 0, max: room.maxChildren || 3 },
                                { label: "Child (No Bed)", key: "childrenWithoutBed" as const, min: 0, max: room.maxChildren || 3 },
                              ]).map(({ label, key, min, max }) => (
                                <div key={key} className="flex flex-col items-center justify-between bg-white p-1 rounded border border-slate-100 text-center">
                                  <span className="text-[8px] font-semibold text-slate-500 leading-tight mb-1">{label}</span>
                                  <div className="flex items-center gap-1 mt-auto">
                                    <button
                                      type="button"
                                      onClick={() => setRoomsConfig(prev => prev.map((c, i) => i === index ? { ...c, [key]: Math.max(min, c[key] - 1) } : c))}
                                      className="w-4.5 h-4.5 bg-slate-100 hover:bg-slate-200 rounded flex items-center justify-center font-bold text-[10px]"
                                    >
                                      -
                                    </button>
                                    <span className="text-[10px] font-bold w-3 text-center">{config[key] ?? 0}</span>
                                    <button
                                      type="button"
                                      onClick={() => setRoomsConfig(prev => prev.map((c, i) =>
                                        i === index ? { ...c, [key]: Math.min(max, c[key] + 1) } : c
                                      ))}
                                      className="w-4.5 h-4.5 bg-slate-100 hover:bg-slate-200 rounded flex items-center justify-center font-bold text-[10px]"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {roomsConfig.length < 5 && (
                      <button onClick={() => setRoomsConfig(prev => [...prev, { adults: 2, childrenWithBed: 0, childrenWithoutBed: 0 }])} className="w-full text-[10px] font-bold py-1.5 border border-slate-200 rounded-lg text-[#1B3A6B] hover:bg-slate-50 transition-colors flex items-center justify-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Add Room
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Meal plan selector */}
              {room.mealPlanOptions && room.mealPlanOptions.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">Meal Plan</span>
                  <select
                    value={selectedMealPlan}
                    onChange={(e) => setSelectedMealPlan(e.target.value)}
                    className="w-full h-10 rounded border border-slate-200 bg-white text-slate-700 px-3 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="">EP (Room Only)</option>
                    {room.mealPlanOptions.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.label} {option.adultPrice ? `(+₹${option.adultPrice}/adult)` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Price Breakdown */}
              {checkOut && (
                <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Room base stay ({pricingBreakdown.nights} night(s) × {pricingBreakdown.roomsCount} room(s))</span>
                    <span className="text-slate-800 font-bold">₹{pricingBreakdown.baseTotal.toLocaleString()}</span>
                  </div>
                  {pricingBreakdown.extraAdultTotal > 0 && (
                    <div className="flex justify-between">
                      <span>Extra adult charges</span>
                      <span className="text-slate-800 font-bold">₹{pricingBreakdown.extraAdultTotal.toLocaleString()}</span>
                    </div>
                  )}
                  {pricingBreakdown.extraChildWithBedTotal > 0 && (
                    <div className="flex justify-between">
                      <span>Child bed charges</span>
                      <span className="text-slate-800 font-bold">₹{pricingBreakdown.extraChildWithBedTotal.toLocaleString()}</span>
                    </div>
                  )}
                  {pricingBreakdown.extraChildWithoutBedTotal > 0 && (
                    <div className="flex justify-between">
                      <span>Child no bed charges</span>
                      <span className="text-slate-800 font-bold">₹{pricingBreakdown.extraChildWithoutBedTotal.toLocaleString()}</span>
                    </div>
                  )}
                  {pricingBreakdown.mealPlanTotal > 0 && (
                    <div className="flex justify-between">
                      <span>Meal plan total</span>
                      <span className="text-slate-800 font-bold">₹{pricingBreakdown.mealPlanTotal.toLocaleString()}</span>
                    </div>
                  )}
                  {pricingBreakdown.originalSubtotal > pricingBreakdown.subtotal && (
                    <div className="flex justify-between text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-100 font-bold text-[10px]">
                      <span>Discount saved</span>
                      <span>-₹{(pricingBreakdown.originalSubtotal - pricingBreakdown.subtotal).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1.5 border-t border-slate-100 font-bold text-slate-800 text-sm">
                    <span>Subtotal</span>
                    <span>₹{pricingBreakdown.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span>GST (12%)</span>
                    <span>₹{pricingBreakdown.gst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-100 font-black text-[#1B3A6B] text-base">
                    <span>Grand Total</span>
                    <span>₹{pricingBreakdown.grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Book Now Button */}
              <div>
                {isOccupancyExceeded ? (
                  <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold p-3 rounded-lg text-center">
                    Occupancy exceeds room limit.
                  </div>
                ) : !checkOut ? (
                  <Button disabled className="w-full h-11 rounded-lg bg-slate-100 text-slate-400 font-bold uppercase tracking-wider text-xs">
                    Select checkout date above
                  </Button>
                ) : (
                  <Button onClick={handleBookNow} className="w-full h-11 rounded-lg bg-[#1B3A6B] hover:bg-[#152e55] text-white font-bold uppercase tracking-wider text-xs shadow-md">
                    Book Room Direct ⚡
                  </Button>
                )}
              </div>

              {/* Inquiry & WhatsApp desk */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <a href="tel:+918595513009" className="flex-1 h-10 rounded-lg border border-[#1B3A6B] font-bold text-xs text-[#1B3A6B] hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors">
                  <Phone className="w-3.5 h-3.5 text-[#1B3A6B]" /> Call Desk
                </a>
                <button onClick={() => toast.success("Opening inquiry...")} className="flex-1 h-10 rounded-lg border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-55 flex items-center justify-center gap-1.5 transition-colors">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" /> Custom Inquiry
                </button>
              </div>
            </div>

            {/* Card 3: Trust Badges */}
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm grid grid-cols-3 gap-3 text-center">
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
            <button onClick={() => setGalleryOpen(false)} aria-label="Close gallery" className="p-2 hover:bg-white/10 rounded-full text-white/80"><X className="w-6 h-6" /></button>
          </div>
          <div className="relative flex-1 flex items-center justify-center max-h-[80vh]">
            <button onClick={() => setActiveImageIndex(p => (p - 1 + images.length) % images.length)} aria-label="Previous gallery image" className="absolute left-0 md:left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <Image
              src={getHotelImageUrl(images[activeImageIndex], 1200, 800, "3:2")}
              alt="Room gallery"
              fill
              sizes="100vw"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
            <button onClick={() => setActiveImageIndex(p => (p + 1) % images.length)} aria-label="Next gallery image" className="absolute right-0 md:right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          <div className="flex gap-2.5 overflow-x-auto justify-center pb-2 pt-4 max-w-2xl mx-auto">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                title={`View gallery image ${idx + 1}`}
                onClick={() => setActiveImageIndex(idx)}
                className={cn("w-14 h-10 rounded-lg overflow-hidden shrink-0 border-2 transition-all opacity-60 hover:opacity-100", activeImageIndex === idx ? "border-sky-400 scale-105 opacity-100" : "border-transparent")}
              >
                <div className="relative w-full h-full">
                  <Image src={getHotelImageUrl(img, 150, 150, "1:1")} alt={`Gallery thumbnail ${idx + 1}`} fill sizes="56px" className="object-cover" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Sticky Mobile Bottom Bar ─── */}
      <div 
        className="lg:hidden fixed bottom-16 left-0 right-0 z-40 bg-white border-t-2 border-[#1B3A6B] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] px-4 py-2.5 flex items-center justify-between cursor-pointer" 
        onClick={openMobileSheet}
      >
        <div className="flex items-center gap-2">
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              Starting at <ChevronDown className="w-3.5 h-3.5 rotate-180 text-sky-600 animate-bounce" />
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-[#1B3A6B]">₹{(room.basePrice || 0).toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 font-semibold">/night</span>
            </div>
          </div>
        </div>
        {isOccupancyExceeded ? (
          <Button disabled className="bg-slate-200 text-slate-400 font-bold rounded-xl h-11 px-5 text-xs">
            Limit Exceeded
          </Button>
        ) : (
          <Button 
            onClick={(e) => handleBookNow(e)} 
            className="bg-[#1B3A6B] hover:bg-[#0f2548] text-white font-bold rounded-xl h-11 px-7 text-xs shadow-md transition-all"
          >
            Book Now
          </Button>
        )}
      </div>

      {/* Backdrop */}
      {mobileSheetOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-45 transition-opacity duration-300"
          onClick={closeMobileSheet}
        />
      )}

      {/* Mobile Booking Bottom Sheet */}
      <div
        ref={sheetRef}
        className="lg:hidden fixed left-0 right-0 bottom-0 z-50"
        onTouchStart={onSheetTouchStart}
        onTouchMove={onSheetTouchMove}
        onTouchEnd={onSheetTouchEnd}
      >
        <div className="h-full bg-white rounded-t-2xl border-t-4 border-[#1B3A6B] shadow-2xl overflow-hidden flex flex-col">
          <div className="p-3 border-b border-slate-200 sheet-header cursor-row-resize select-none">
            <div className="w-10 h-1.5 bg-slate-200 rounded mx-auto mb-2" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800">Booking & Price Breakup</p>
                <p className="text-xs text-slate-500">Swipe down to close</p>
              </div>
              <button 
                onClick={closeMobileSheet} 
                className="text-slate-500 font-semibold text-xs py-1 px-3 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>

          <div className="p-4 overflow-auto">
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Subtotal</p>
                  <p className="text-lg font-black text-slate-900">₹{pricingBreakdown.subtotal.toLocaleString()}</p>
                  <p className="text-[11px] text-slate-400">{pricingBreakdown.nights} night(s) · {pricingBreakdown.roomsCount} room(s)</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-sky-600">₹{pricingBreakdown.grandTotal.toLocaleString()}</p>
                  <p className="text-[11px] text-slate-400">Grand Total</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <div className="flex justify-between text-sm text-slate-600"><span>Base</span><span>₹{pricingBreakdown.baseTotal.toLocaleString()}</span></div>
                {pricingBreakdown.extraAdultTotal > 0 && <div className="flex justify-between text-sm text-slate-600"><span>Extra adults</span><span>₹{pricingBreakdown.extraAdultTotal.toLocaleString()}</span></div>}
                {pricingBreakdown.extraChildWithBedTotal > 0 && <div className="flex justify-between text-sm text-slate-600"><span>Extra child (with bed)</span><span>₹{pricingBreakdown.extraChildWithBedTotal.toLocaleString()}</span></div>}
                {pricingBreakdown.extraChildWithoutBedTotal > 0 && <div className="flex justify-between text-sm text-slate-600"><span>Child (no bed)</span><span>₹{pricingBreakdown.extraChildWithoutBedTotal.toLocaleString()}</span></div>}
                {pricingBreakdown.mealPlanTotal > 0 && <div className="flex justify-between text-sm text-slate-600"><span>Meal plan</span><span>₹{pricingBreakdown.mealPlanTotal.toLocaleString()}</span></div>}
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-100"><span>GST (12%)</span><span>₹{pricingBreakdown.gst.toLocaleString()}</span></div>
              </div>

              {/* Dates & Guests (compact) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-1">Check-in</label>
                  <div className="relative">
                    <input
                      type="date"
                      aria-label="Check-in"
                      value={checkIn}
                      onChange={(e) => {
                        setCheckIn(e.target.value);
                        if (checkOut && new Date(e.target.value) >= new Date(checkOut)) {
                          const d = new Date(e.target.value);
                          d.setDate(d.getDate() + 1);
                          setCheckOut(d.toISOString().split("T")[0]);
                        }
                      }}
                      min={new Date().toISOString().split("T")[0]}
                      max={calendarMaxDateStr}
                      className="w-full h-11 rounded-md bg-white border border-slate-200 text-slate-800 pl-3 pr-2 text-xs font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-1">Check-out</label>
                  <div className="relative">
                    <input
                      type="date"
                      aria-label="Check-out"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      min={checkIn}
                      max={calendarMaxDateStr}
                      className="w-full h-11 rounded-md bg-white border border-slate-200 text-slate-800 pl-3 pr-2 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-semibold">Guests & Rooms</div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                    <div>{roomsConfig.length} Room(s)</div>
                    <div>{roomsConfig.reduce((a, c) => a + c.adults, 0)} Adult(s)</div>
                  </div>
                </div>
              </div>

              <div>
                {isOccupancyExceeded ? (
                  <div className="bg-rose-50 text-rose-600 p-3 rounded-md text-center font-bold">Guest count exceeds room capacity</div>
                ) : !checkOut ? (
                  <Button disabled className="w-full h-12 rounded-md bg-slate-200 text-slate-400 font-black uppercase tracking-wider text-sm">Select Check-out Date</Button>
                ) : (
                  <Button 
                    onClick={(e) => handleBookNow(e)} 
                    className="w-full h-12 rounded-md bg-[#1B3A6B] text-white font-black uppercase tracking-wider text-sm"
                  >
                    Book Now — ₹{pricingBreakdown.grandTotal.toLocaleString()}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
