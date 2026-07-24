"use client";

import { useState, useRef, useEffect } from "react";
import {
  Users, Briefcase, Compass, Star, MapPin, ChevronLeft, ChevronRight,
  ShieldCheck, Award, Calendar, Phone, MessageSquare, Fuel, Thermometer,
  Gauge, CheckCircle2, Clock, ArrowRight, Share2, Heart, BadgeCheck,
  Zap, Navigation, Car, X, Plus, MessageCircle, HelpCircle, ChevronDown
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { DemoVehicle } from "@/lib/demo-fleet";

interface VehicleDetailClientProps {
  vehicle: DemoVehicle | null;
  countrySlug: string;
  stateSlug: string;
  citySlug: string;
  related: DemoVehicle[];
}

const SAFETY_CHECKS = [
  { label: "Brake System", status: "Verified", icon: "🛞" },
  { label: "Tyre Condition", status: "Checked", icon: "⚙️" },
  { label: "AC Filter", status: "Active", icon: "❄️" },
  { label: "GPS Tracker", status: "Live", icon: "📍" },
  { label: "First Aid Kit", status: "Stocked", icon: "🩺" },
  { label: "Fire Safety", status: "Certified", icon: "🧯" },
  { label: "Insurance", status: "Valid", icon: "📋" },
  { label: "Pollution Check", status: "Clear", icon: "🌿" },
];

const categoryLabel: Record<string, { label: string; color: string }> = {
  economy: { label: "Economy", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  standard: { label: "Standard", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  premium: { label: "Premium", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  luxury: { label: "Luxury", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
};

export default function VehicleDetailClient({
  vehicle, countrySlug, stateSlug, citySlug, related
}: VehicleDetailClientProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  // Dynamic Fare Estimator State
  const [tripType, setTripType] = useState<"oneway" | "roundtrip" | "local">("roundtrip");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("10:00");
  const [returnDate, setReturnDate] = useState("");
  const [estKm, setEstKm] = useState<number>(250);
  const [pickupAddr, setPickupAddr] = useState("");
  const [dropAddr, setDropAddr] = useState("");
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  // Mobile drawer panel state
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [sheetTranslate, setSheetTranslate] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const sheetHeightRef = useRef<number>(600);
  const touchStartY = useRef<number | null>(null);
  const startTranslate = useRef<number>(0);

  const openMobileSheet = () => setMobileSheetOpen(true);
  const closeMobileSheet = () => setMobileSheetOpen(false);

  if (!vehicle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 gap-6 px-4">
        <Car className="w-16 h-16 text-primary/30" />
        <h2 className="text-xl font-bold text-center text-white">Vehicle Details Not Found</h2>
        <p className="text-slate-400 text-center text-sm max-w-xs">
          This vehicle may have been removed or the link is incorrect.
        </p>
        <Link
          href="/transport"
          className="inline-flex items-center gap-2 bg-primary text-white rounded-xl px-6 py-3 font-bold text-sm hover:bg-primary/90 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Fleet
        </Link>
      </div>
    );
  }

  const images = vehicle.images || [];
  const cat = categoryLabel[vehicle.category] || categoryLabel.standard;
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - vehicle.year;

  const prevImage = () => setActiveImageIdx(i => (i - 1 + images.length) % images.length);
  const nextImage = () => setActiveImageIdx(i => (i + 1) % images.length);

  // Calculate rental duration in days
  const calculateDays = () => {
    if (tripType !== "roundtrip") return 1;
    if (!pickupDate || !returnDate) return 1;
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  const rentalDays = calculateDays();

  // Minimim guarantee km rule defaults
  const getDefaultKm = (type: "oneway" | "roundtrip" | "local", days: number) => {
    if (type === "oneway") return 100;
    if (type === "local") return 80;
    return days * 250;
  };

  // Sync km limits when selection changes
  useEffect(() => {
    setEstKm(getDefaultKm(tripType, rentalDays));
  }, [tripType, rentalDays]);

  const displayKm = estKm || getDefaultKm(tripType, rentalDays);
  const baseRate = vehicle.pricePerDay;
  const kmRate = vehicle.pricePerKm;

  // Pricing calculations
  const basePriceTotal = baseRate * rentalDays;
  const coveredKm = getDefaultKm(tripType, rentalDays);
  const extraKm = Math.max(0, displayKm - coveredKm);
  const extraKmCharges = extraKm * kmRate;
  const driverAllowance = tripType === "local" ? 250 : 400 * rentalDays;
  const stateTaxEstimate = tripType === "local" ? 0 : 350 * rentalDays;

  const originalBaseTotal = basePriceTotal + extraKmCharges + driverAllowance + stateTaxEstimate;
  const discountPercent = vehicle.category === "luxury" ? 5 : 10;
  const discountAmount = Math.round((originalBaseTotal * discountPercent) / 100);

  const subtotal = originalBaseTotal - discountAmount;
  const gst = Math.round((subtotal * 5) / 100); // 5% GST for transportation
  const grandTotal = subtotal + gst;

  const handleBookNow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupDate) {
      toast.error("Please select a trip start date.");
      return;
    }
    if (!pickupAddr || !dropAddr) {
      toast.error("Please fill in both pickup address and drop location.");
      return;
    }
    setBookingSubmitted(true);
    toast.success("Logistics request submitted successfully!");
  };

  // Date parsing safely
  const formatDateSafe = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatDateSafeShort = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Drag handlers for mobile drawer sheet
  const onSheetTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartY.current = touch.clientY;
    startTranslate.current = mobileSheetOpen ? 0 : (sheetHeightRef.current || 600);
  };

  const onSheetTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touch = e.touches[0];
    const diff = touch.clientY - touchStartY.current;
    if (diff > 0) {
      setSheetTranslate(diff);
    }
  };

  const onSheetTouchEnd = () => {
    if (touchStartY.current == null) return;
    const threshold = (sheetHeightRef.current || 600) / 3;
    if (sheetTranslate > threshold) {
      setMobileSheetOpen(false);
    } else {
      setMobileSheetOpen(true);
    }
    setSheetTranslate(0);
    touchStartY.current = null;
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans antialiased text-slate-850 pb-16 lg:pb-0">
      
      {/* ── Lightbox Modal ── */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2" onClick={() => setLightboxOpen(false)}>
              <X className="w-6 h-6" />
            </button>
            <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2" onClick={e => { e.stopPropagation(); prevImage(); }}>
              <ChevronLeft className="w-8 h-8" />
            </button>
            <img
              src={images[activeImageIdx]}
              alt={vehicle.name}
              className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2" onClick={e => { e.stopPropagation(); nextImage(); }}>
              <ChevronRight className="w-8 h-8" />
            </button>
            <p className="absolute bottom-4 text-white/50 text-xs font-bold font-mono">
              {activeImageIdx + 1} / {images.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Detail Presentation ── */}
      <div className="container mx-auto px-4 pt-[78px] md:pt-[84px] pb-8 md:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* LEFT: Content Panel (8 columns) */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Gallery Frame */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-2.5 shadow-xs">
              <div
                className="relative w-full rounded-xl overflow-hidden bg-slate-900 cursor-zoom-in group"
                style={{ paddingBottom: "50%" }}
                onClick={() => setLightboxOpen(true)}
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImageIdx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    src={images[activeImageIdx] || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80"}
                    alt={vehicle.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </AnimatePresence>

                {images.length > 1 && (
                  <>
                    <button
                      onClick={e => { e.stopPropagation(); prevImage(); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors z-10"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); nextImage(); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors z-10"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                <div className="absolute top-3 left-3 flex gap-2 z-10">
                  <span className="bg-primary text-white text-[9px] font-semibold uppercase px-2.5 py-0.5 rounded-full tracking-wide shadow-sm">
                    {vehicle.type}
                  </span>
                  {vehicle.badge && (
                    <span className="bg-amber-500 text-slate-950 text-[9px] font-semibold uppercase px-2.5 py-0.5 rounded-full tracking-wide shadow-sm">
                      {vehicle.badge}
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[9px] font-medium px-2.5 py-0.5 rounded-full font-mono">
                  {activeImageIdx + 1} / {images.length}
                </div>
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 mt-2.5 overflow-x-auto no-scrollbar pb-0.5">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={cn(
                        "shrink-0 w-14 h-10 md:w-16 md:h-11 rounded-lg overflow-hidden border-2 transition-all",
                        activeImageIdx === idx ? "border-primary shadow-xs scale-95" : "border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Breadcrumbs & Share/Wishlist Bar (Moved below Hero Image) */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium overflow-hidden">
                <Link href="/transport" className="hover:text-primary transition-colors whitespace-nowrap">Transport</Link>
                <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                <Link href={`/transport/${countrySlug}/${stateSlug}/transport-in-${vehicle.destinationSlug}`} className="hover:text-primary transition-colors whitespace-nowrap hidden sm:block">
                  {vehicle.cityName}
                </Link>
                <ChevronRight className="w-3 h-3 text-slate-300 shrink-0 hidden sm:block" />
                <span className="text-slate-800 truncate max-w-[180px] sm:max-w-xs font-semibold">{vehicle.name}</span>
              </nav>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setWishlisted(!wishlisted);
                    toast.success(wishlisted ? "Removed from wishlist" : "Saved to wishlist!");
                  }}
                  className={cn(
                    "p-1.5 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-medium",
                    wishlisted ? "bg-red-50 border-red-200 text-red-500" : "border-slate-200 text-slate-500 hover:border-red-200 hover:text-red-500"
                  )}
                >
                  <Heart className={cn("w-3.5 h-3.5", wishlisted && "fill-red-500")} />
                  <span className="hidden sm:inline">{wishlisted ? "Saved" : "Wishlist"}</span>
                </button>
                <button
                  onClick={() => {
                    navigator.share?.({ title: vehicle.name, url: window.location.href });
                    toast.success("Shared successfully!");
                  }}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-primary hover:text-primary transition-all flex items-center gap-1.5 text-xs font-medium"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>
            </div>

            {/* Compact Sleek Features Strip immediately below Hero Gallery */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-2.5 sm:p-3 shadow-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700">
                <div className="flex items-center gap-2.5 bg-slate-50/80 rounded-xl px-2.5 py-2 border border-slate-100/80">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] text-slate-400 font-medium block leading-none">Capacity</span>
                    <span className="text-xs font-semibold text-slate-800 leading-tight block mt-0.5 truncate">{vehicle.capacity} Seats</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 bg-slate-50/80 rounded-xl px-2.5 py-2 border border-slate-100/80">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] text-slate-400 font-medium block leading-none">Luggage Limit</span>
                    <span className="text-xs font-semibold text-slate-800 leading-tight block mt-0.5 truncate">{vehicle.luggageCapacity} Bags</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 bg-slate-50/80 rounded-xl px-2.5 py-2 border border-slate-100/80">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Compass className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] text-slate-400 font-medium block leading-none">Transmission</span>
                    <span className="text-xs font-semibold text-slate-800 leading-tight block mt-0.5 truncate">{vehicle.transmission}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 bg-slate-50/80 rounded-xl px-2.5 py-2 border border-slate-100/80">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Fuel className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] text-slate-400 font-medium block leading-none">Fuel System</span>
                    <span className="text-xs font-semibold text-slate-800 leading-tight block mt-0.5 truncate">{vehicle.fuelType}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Title & Primary Metadata Profile */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs space-y-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("text-[10px] font-semibold border px-2.5 py-0.5 rounded-full", cat.color)}>
                  {cat.label} Class
                </span>
                {vehicle.isVerified && (
                  <span className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" /> Verified Logistics Partner
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                {vehicle.name}
              </h1>

              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={cn("w-3.5 h-3.5", s <= Math.round(vehicle.rating) ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
                ))}
                <span className="text-xs font-semibold text-slate-700 ml-1.5">{vehicle.rating}</span>
                <span className="text-xs text-slate-400 font-medium">({vehicle.reviewCount} verified reviews)</span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                {vehicle.isAc && (
                  <span className="flex items-center gap-1.5 text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100/80 px-2.5 py-1 rounded-full">
                    <Thermometer className="w-3.5 h-3.5 text-blue-500" /> Climate Control AC
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200/60 px-2.5 py-1 rounded-full">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> Model Year {vehicle.year} ({vehicleAge === 0 ? "New" : `${vehicleAge}y`})
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200/60 px-2.5 py-1 rounded-full">
                  <Gauge className="w-3.5 h-3.5 text-slate-500" /> Base Rate ₹{vehicle.pricePerKm}/km
                </span>
              </div>
            </div>

            {/* Description card */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs space-y-2.5">
              <h2 className="text-sm font-semibold text-slate-800">Fleet Details & Services</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                {vehicle.description}
              </p>
            </div>

            {/* Included / Excluded Fare Rules */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs space-y-3.5">
              <h2 className="text-sm font-semibold text-slate-800">Fare Inclusions & Exclusions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3.5">
                  <h3 className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Included in Fare
                  </h3>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside pl-0.5 font-normal">
                    <li>Fuel Charges & Maintenance</li>
                    <li>Commercial Vehicle Insurance</li>
                    <li>Professional Driver Allowance</li>
                    <li>Clean, Sanitized AC Cab</li>
                    <li>24/7 Helpline Support</li>
                  </ul>
                </div>
                <div className="space-y-2 bg-rose-500/5 border border-rose-500/10 rounded-xl p-3.5">
                  <h3 className="text-xs font-semibold text-rose-800 flex items-center gap-1.5">
                    <X className="w-4 h-4 text-rose-500" /> Excluded from Fare
                  </h3>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside pl-0.5 font-normal">
                    <li>Toll taxes & State Entry taxes</li>
                    <li>Parking fees (paid as actuals)</li>
                    <li>Night charges (after 10:00 PM)</li>
                    <li>Airport pick-up/drop tolls</li>
                    <li>GST (5% Service tax)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Amenities Grid */}
            {vehicle.features && vehicle.features.length > 0 && (
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs space-y-3.5">
                <h2 className="text-sm font-semibold text-slate-800">Vehicle Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {vehicle.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-xs font-medium text-slate-700">{feature.replace(/_/g, " ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Safety Log Checklist */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-semibold text-slate-800">Inspection Safety Log</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SAFETY_CHECKS.map((item, idx) => (
                  <div key={idx} className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 flex flex-col items-center text-center gap-1 hover:bg-emerald-500/10 transition-colors">
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-[10px] text-slate-500 font-medium block leading-tight">{item.label}</span>
                    <span className="text-[10px] font-semibold text-emerald-600 block">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Logistics Vendor Profile */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs space-y-3.5">
              <h2 className="text-sm font-semibold text-slate-800">Transporter Profile</h2>
              <div className="flex items-center gap-3.5 bg-slate-900 text-white rounded-xl p-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-semibold text-base shrink-0">
                  {vehicle.businessName?.[0] || "L"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{vehicle.businessName}</p>
                  <p className="text-slate-400 text-xs mt-0.5 font-normal">Logistics Vendor: {vehicle.ownerName} · Registered since {vehicle.operatingSince}</p>
                </div>
                {vehicle.isVerified && (
                  <div className="shrink-0 flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-medium shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </div>
                )}
              </div>
            </div>

            {/* Verified Client Reviews */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">Verified Client Reviews</h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Verified testimonials from recent rentals</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-semibold text-slate-800 ml-1">{vehicle.rating}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">/ 5.0</span>
                </div>
              </div>

              <div className="space-y-3.5">
                {[
                  { name: "Sanjay Kumar", date: "June 2026", rating: 5, comment: `Outstanding service! Car was super clean, AC was freezing, and the driver was extremely polite and professional. We took a round trip to Manali and felt completely safe throughout.` },
                  { name: "Neha Sharma", date: "May 2026", rating: 5, comment: `Highly recommended for family trips. The booking team coordinated everything seamlessly. Driver was experienced on mountain roads. The luggage carrier held all our bags easily.` },
                  { name: "Amanpreet Singh", date: "April 2026", rating: 4, comment: `Very neat interior, excellent sound system. We rented it for sightseeing. Driver knew all the short routes and scenic spots. Will book again.` },
                ].map((rev, i) => (
                  <div key={i} className="space-y-1.5 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#1B3A6B]/10 text-[#1B3A6B] font-semibold text-xs flex items-center justify-center">
                          {rev.name[0]}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{rev.name}</p>
                          <p className="text-[10px] text-slate-400 font-normal">{rev.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={cn("w-3 h-3", s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT: Booking Desk Card (4 columns) - Desktop Sticky */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="lg:sticky lg:top-[82px] space-y-4 z-30">
              
              <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                {/* Header starting price — Compact 2-Line Header */}
                <div className="bg-[#1B3A6B] p-3.5 sm:p-4 text-white relative overflow-hidden space-y-2">
                  <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full blur-xl pointer-events-none" />
                  
                  {/* Line 1: Title & Instant Booking Badge */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/80 font-medium tracking-wide">Starting Rental Fee</span>
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <Zap className="w-3 h-3 fill-emerald-400" /> Instant Booking
                    </span>
                  </div>

                  {/* Line 2: Big Price & Base Rate Badge */}
                  <div className="flex items-baseline justify-between pt-0.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl font-bold text-white leading-none">
                        ₹{vehicle.pricePerDay.toLocaleString("en-IN")}
                      </span>
                      <span className="text-white/70 text-xs font-medium">/day</span>
                    </div>
                    <span className="text-white/90 text-[11px] font-semibold bg-white/10 px-2.5 py-1 rounded-lg border border-white/15">
                      Base: ₹{vehicle.pricePerKm}/km
                    </span>
                  </div>
                </div>

                {/* Booking Inputs & Calculations */}
                <div className="p-4 space-y-3.5">
                  <h3 className="text-xs font-semibold text-slate-800">Dynamic Fare Calculator</h3>

                  {bookingSubmitted ? (
                    <div className="flex flex-col items-center gap-2.5 py-5 text-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </div>
                      <p className="font-semibold text-slate-900 text-sm">Booking Query Submitted!</p>
                      <p className="text-xs text-slate-500 leading-relaxed font-normal">Our transport coordinator will verify fleet availability and driver logs, sending details within 15 minutes.</p>
                      <button type="button" onClick={() => setBookingSubmitted(false)} className="text-xs font-medium text-[#1B3A6B] hover:underline">Submit another query</button>
                    </div>
                  ) : (
                    <form onSubmit={handleBookNow} className="space-y-3">
                      
                      {/* Trip Type selection pills */}
                      <div className="grid grid-cols-3 gap-1 bg-slate-100 rounded-lg p-0.5 text-xs font-medium text-slate-600">
                        {([
                          { label: "One-Way", value: "oneway" as const },
                          { label: "Round Trip", value: "roundtrip" as const },
                          { label: "Local Tour", value: "local" as const },
                        ] as const).map(tab => (
                          <button
                            key={tab.value}
                            type="button"
                            onClick={() => setTripType(tab.value)}
                            className={cn(
                              "py-1 rounded-md transition-all text-center",
                              tripType === tab.value ? "bg-white text-slate-900 shadow-xs font-semibold" : "hover:text-slate-800"
                            )}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {/* Pickup Date & Time Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Pickup Date</label>
                          <div className="relative">
                            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                              type="date"
                              required
                              value={pickupDate}
                              onChange={e => setPickupDate(e.target.value)}
                              min={new Date().toISOString().split("T")[0]}
                              className="w-full h-8.5 bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1B3A6B] transition-colors"
                            />
                          </div>
                        </div>
                        {tripType === "roundtrip" ? (
                          <div>
                            <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Return Date</label>
                            <div className="relative">
                              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                              <input
                                type="date"
                                required
                                value={returnDate}
                                onChange={e => setReturnDate(e.target.value)}
                                min={pickupDate || new Date().toISOString().split("T")[0]}
                                className="w-full h-8.5 bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1B3A6B] transition-colors"
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Pickup Time</label>
                            <div className="relative">
                              <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                              <input
                                type="time"
                                required
                                value={pickupTime}
                                onChange={e => setPickupTime(e.target.value)}
                                className="w-full h-8.5 bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1B3A6B] transition-colors"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Travel distance selection if roundtrip/oneway */}
                      {tripType !== "local" && (
                        <div>
                          <div className="flex justify-between items-center mb-0.5">
                            <label className="text-[10px] font-medium text-slate-500">Est. Distance: {displayKm} km</label>
                            <span className="text-[9px] text-slate-400">(Covered: {coveredKm}km)</span>
                          </div>
                          <input
                            type="range"
                            min={coveredKm}
                            max={coveredKm + 1500}
                            step={50}
                            value={displayKm}
                            onChange={e => setEstKm(Number(e.target.value))}
                            className="w-full accent-[#1B3A6B] h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                          />
                        </div>
                      )}

                      {/* Pickup & Drop inputs */}
                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Pickup Address</label>
                          <div className="relative">
                            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                              type="text"
                              required
                              value={pickupAddr}
                              placeholder="Hotel / Airport / Residence"
                              onChange={e => setPickupAddr(e.target.value)}
                              className="w-full h-8.5 bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1B3A6B] transition-colors"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Drop Destination</label>
                          <div className="relative">
                            <Navigation className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                              type="text"
                              required
                              value={dropAddr}
                              placeholder="Sightseeing city or hotel"
                              onChange={e => setDropAddr(e.target.value)}
                              className="w-full h-8.5 bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1B3A6B] transition-colors"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Pricing Breakout */}
                      {pickupDate && (
                        <div className="border-t border-slate-100 pt-2 space-y-1 text-xs text-slate-600 font-normal">
                          <div className="flex justify-between">
                            <span>Base Rate ({rentalDays} d)</span>
                            <span className="text-slate-800 font-medium">₹{basePriceTotal.toLocaleString()}</span>
                          </div>
                          {extraKmCharges > 0 && (
                            <div className="flex justify-between">
                              <span>Extra distance ({extraKm} km)</span>
                              <span className="text-slate-800 font-medium">₹{extraKmCharges.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Driver allowance</span>
                            <span className="text-slate-800 font-medium">₹{driverAllowance.toLocaleString()}</span>
                          </div>
                          {stateTaxEstimate > 0 && (
                            <div className="flex justify-between">
                              <span>State tax & toll allowance</span>
                              <span className="text-slate-800 font-medium">₹{stateTaxEstimate.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-rose-600 bg-rose-50/60 px-1.5 py-0.5 rounded border border-rose-100 font-medium text-[10px] mt-1">
                            <span>Category discount ({discountPercent}%)</span>
                            <span>-₹{discountAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-100 font-semibold text-slate-800 text-xs">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-slate-400 text-[10px]">
                            <span>GST (5%)</span>
                            <span>₹{gst.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between pt-1.5 border-t border-slate-100 font-bold text-[#1B3A6B] text-sm">
                            <span>Est. Grand Total</span>
                            <span>₹{grandTotal.toLocaleString()}</span>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="space-y-1.5">
                        <Button type="submit" className="w-full h-9.5 rounded-lg bg-[#1B3A6B] hover:bg-[#142d54] text-white font-semibold text-xs tracking-wide shadow-xs">
                          Request Fleet Booking ⚡
                        </Button>
                      </div>

                    </form>
                  )}

                  <p className="text-[9px] text-center text-slate-400 leading-tight">
                    *Toll taxes, parking fees, and borders entry taxes are directly paid to driver on actual ticket receipt.
                  </p>
                </div>
              </div>

              {/* Call desk cards */}
              <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-xs space-y-2.5">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Immediate Helpline Desk</p>
                <div className="grid grid-cols-1 gap-2">
                  <a href="tel:+918595513009" className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-xl p-2.5 hover:border-[#1B3A6B] transition-all group">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1B3A6B] flex items-center justify-center group-hover:bg-[#1B3A6B] group-hover:text-white transition-colors shrink-0">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-medium">Call Transport Head</p>
                      <p className="text-xs font-semibold text-slate-800">+91 85955-13009</p>
                    </div>
                  </a>
                  <a href="https://wa.me/918595513009" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-xl p-2.5 hover:border-emerald-500 transition-all group">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors shrink-0">
                      <MessageCircle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-medium">WhatsApp Desk</p>
                      <p className="text-xs font-semibold text-slate-800">Instant Chat Connection</p>
                    </div>
                  </a>
                </div>
              </div>

              {/* Security assurances */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: ShieldCheck, label: "100% Secure" },
                  { icon: Clock, label: "24/7 Desk" },
                  { icon: Award, label: "Lowest price" },
                ].map((b, i) => (
                  <div key={i} className="bg-white border border-slate-200/60 rounded-xl p-2 flex flex-col items-center gap-0.5 text-center shadow-xs">
                    <b.icon className="w-3.5 h-3.5 text-[#1B3A6B]" />
                    <span className="text-[9px] font-medium text-slate-500 leading-none">{b.label}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>

        {/* Recommended alternative fleet */}
        {related.length > 0 && (
          <section className="mt-12 pt-10 border-t border-slate-200/60">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                Recommended Fleet Options
              </h2>
              <Link
                href="/transport"
                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
              >
                View All Vehicles <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
              {related.map(rv => (
                <Link
                  key={rv.id}
                  href={`/transport/${rv.countrySlug}/${rv.stateSlug}/transport-in-${rv.destinationSlug}/${rv.slug}`}
                  className="group bg-white border border-slate-200/60 rounded-2xl overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="relative h-28 sm:h-36 overflow-hidden bg-slate-100">
                    <img
                      src={rv.images?.[0]}
                      alt={rv.name}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent" />
                    <span className="absolute bottom-2.5 left-2.5 text-[8px] font-black text-white uppercase bg-black/40 backdrop-blur-sm px-2.5 py-0.5 rounded-full tracking-widest">
                      {rv.type}
                    </span>
                  </div>
                  <div className="p-3.5 space-y-1.5">
                    <p className="text-xs font-bold text-slate-800 line-clamp-1 leading-tight">{rv.name}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-[10px] font-bold text-slate-505">{rv.rating}</span>
                      </div>
                      <span className="text-xs font-black text-primary">₹{rv.pricePerDay.toLocaleString("en-IN")}/d</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Mobile Sticky Action Footer Bar ── */}
      {!mobileSheetOpen && (
        <div 
          className="lg:hidden fixed z-[90] left-0 right-0 bg-slate-900 border-t border-white/10 p-2.5 shadow-[0_-10px_30px_rgba(0,0,0,0.2)] cursor-pointer"
          style={{ bottom: "64px" }}
          onClick={openMobileSheet}
        >
          <div className="container mx-auto flex items-center justify-between gap-3">
            <div className="flex flex-col shrink-0 text-white">
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Starting From</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-black text-white leading-none">
                  ₹{vehicle.pricePerDay.toLocaleString("en-IN")}
                </span>
                <span className="text-[9px] text-slate-400 font-semibold">/day</span>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-[#1B3A6B] text-white px-3 py-1.5 rounded-md font-bold text-xs shadow-sm">
              <span>Choose Dates / Book</span>
              <ChevronDown className="w-3.5 h-3.5 rotate-180" />
            </div>
          </div>
        </div>
      )}

      {/* Backdrop overlay for mobile drawer */}
      {mobileSheetOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-45 transition-opacity duration-300"
          onClick={closeMobileSheet}
        />
      )}

      {/* Mobile pull-up drawer sheet */}
      <div
        ref={sheetRef}
        className="lg:hidden fixed left-0 right-0 bottom-0 z-50 bg-white rounded-t-2xl border-t-4 border-[#1B3A6B] shadow-2xl overflow-hidden flex flex-col"
        style={{
          height: '80vh',
          transform: touchStartY.current !== null 
            ? `translateY(${sheetTranslate}px)` 
            : mobileSheetOpen 
              ? 'translateY(0)' 
              : 'translateY(100%)',
          transition: touchStartY.current !== null 
            ? 'none' 
            : 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onTouchStart={onSheetTouchStart}
        onTouchMove={onSheetTouchMove}
        onTouchEnd={onSheetTouchEnd}
      >
        {/* Header */}
        <div className="p-3 border-b border-slate-200 sheet-header cursor-row-resize select-none shrink-0 bg-white">
          <div className="w-10 h-1.5 bg-slate-200 rounded mx-auto mb-2" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800">Configure Trip Details</p>
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

        {/* Content (Scrollable) */}
        <div className="p-4 overflow-y-auto flex-1 pb-24 space-y-4">
          
          {/* Trip overview */}
          <div className="flex items-baseline justify-between border-b border-slate-100 pb-2">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Subtotal</p>
              <p className="text-lg font-black text-slate-900">₹{subtotal.toLocaleString()}</p>
              <p className="text-[11px] text-slate-400">{rentalDays} rental day(s) · {displayKm} est. km</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-[#1B3A6B]">₹{grandTotal.toLocaleString()}</p>
              <p className="text-[11px] text-slate-400">Grand Total (GST Incl.)</p>
            </div>
          </div>

          {/* Stay Dates banner */}
          <div className="bg-[#1B3A6B]/5 border border-[#1B3A6B]/10 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-[#1B3A6B]" />
              <span>{pickupDate ? formatDateSafe(pickupDate) : "Select pickup date"}</span>
            </div>
            {tripType === "roundtrip" && (
              <>
                <span className="text-[#1B3A6B]/40 font-bold">➔</span>
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-[#1B3A6B]" />
                  <span>{returnDate ? formatDateSafe(returnDate) : "Select return date"}</span>
                </div>
              </>
            )}
          </div>

          {/* Form details */}
          <div className="space-y-3.5">
            {/* Trip type selector pills */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 rounded-lg p-0.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
              {([
                { label: "One-Way", value: "oneway" as const },
                { label: "Round Trip", value: "roundtrip" as const },
                { label: "Local Tour", value: "local" as const },
              ] as const).map(tab => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setTripType(tab.value)}
                  className={cn(
                    "py-1.5 rounded-md transition-all text-center",
                    tripType === tab.value ? "bg-white text-slate-800 shadow-3xs font-black" : "hover:text-slate-700"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Date picking grid */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Pickup Date</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={pickupDate}
                    onChange={e => setPickupDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2 text-xs font-bold text-slate-750 focus:outline-none"
                  />
                </div>
              </div>
              {tripType === "roundtrip" ? (
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Return Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="date"
                      required
                      value={returnDate}
                      onChange={e => setReturnDate(e.target.value)}
                      min={pickupDate || new Date().toISOString().split("T")[0]}
                      className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2 text-xs font-bold text-slate-750 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Pickup Time</label>
                  <div className="relative">
                    <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="time"
                      required
                      value={pickupTime}
                      onChange={e => setPickupTime(e.target.value)}
                      className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2 text-xs font-bold text-slate-750 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Travel range slider */}
            {tripType !== "local" && (
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <label className="text-[9px] font-black uppercase text-slate-400">Est. Distance: {displayKm} km</label>
                  <span className="text-[8px] font-bold text-slate-400">(Covered: {coveredKm}km)</span>
                </div>
                <input
                  type="range"
                  min={coveredKm}
                  max={coveredKm + 1500}
                  step={50}
                  value={displayKm}
                  onChange={e => setEstKm(Number(e.target.value))}
                  className="w-full accent-[#1B3A6B] h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {/* Pickup drop inputs */}
            <div className="space-y-2">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Pickup Point Address</label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={pickupAddr}
                    placeholder="Hotel / Airport / Residence"
                    onChange={e => setPickupAddr(e.target.value)}
                    className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2 text-xs font-bold text-slate-750 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Drop Destination</label>
                <div className="relative">
                  <Navigation className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={dropAddr}
                    placeholder="Sightseeing city or hotel"
                    onChange={e => setDropAddr(e.target.value)}
                    className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2 text-xs font-bold text-slate-750 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Pricing details breakout inside mobile sheet */}
            {pickupDate && (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs text-slate-650">
                <div className="flex justify-between"><span>Base Stay Rate ({rentalDays} d)</span><span>₹{basePriceTotal.toLocaleString()}</span></div>
                {extraKmCharges > 0 && <div className="flex justify-between"><span>Extra distance ({extraKm} km)</span><span>₹{extraKmCharges.toLocaleString()}</span></div>}
                <div className="flex justify-between"><span>Driver allowance</span><span>₹{driverAllowance.toLocaleString()}</span></div>
                {stateTaxEstimate > 0 && <div className="flex justify-between"><span>State tax & toll allowance</span><span>₹{stateTaxEstimate.toLocaleString()}</span></div>}
                <div className="flex justify-between font-bold text-rose-600 pt-1.5 border-t border-slate-200"><span>Category discount ({discountPercent}%)</span><span>-₹{discountAmount.toLocaleString()}</span></div>
                <div className="flex justify-between font-bold pt-1.5 border-t border-slate-200 text-slate-800"><span>GST (5%)</span><span>₹{gst.toLocaleString()}</span></div>
              </div>
            )}
          </div>

        </div>

        {/* Sticky footer actions for Mobile sheet */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 z-30 shrink-0 grid grid-cols-2 gap-2">
          <Button onClick={handleBookNow} className="w-full h-10 rounded-lg bg-[#1B3A6B] hover:bg-[#152e55] text-white font-black uppercase tracking-wider text-xs shadow-md">
            Request Booking ⚡
          </Button>
          <a href="tel:+918595513009" className="h-10 rounded-lg border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-55 flex items-center justify-center gap-1.5 transition-colors">
            <Phone className="w-3.5 h-3.5 text-[#1B3A6B]" /> Call Desk
          </a>
        </div>

      </div>

    </div>
  );
}
