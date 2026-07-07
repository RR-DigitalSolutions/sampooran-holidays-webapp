"use client";

import { useState } from "react";
import {
  Users, Briefcase, Compass, Star, MapPin, ChevronLeft, ChevronRight,
  ShieldCheck, Award, Calendar, Phone, MessageCircle, Fuel, Thermometer,
  Gauge, CheckCircle2, Clock, ArrowRight, Share2, Heart, BadgeCheck,
  Zap, Navigation, Car, X, Shield
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  economy: { label: "Economy", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  standard: { label: "Standard", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  premium: { label: "Premium", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  luxury: { label: "Luxury", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
};

export default function VehicleDetailClient({
  vehicle, countrySlug, stateSlug, citySlug, related
}: VehicleDetailClientProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [tripDate, setTripDate] = useState("");
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

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

  return (
    <div className="bg-slate-50 min-h-screen font-sans">

      {/* ── Lightbox ── */}
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
              className="max-h-[85vh] max-w-full object-contain rounded-lg"
              onClick={e => e.stopPropagation()}
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2" onClick={e => { e.stopPropagation(); nextImage(); }}>
              <ChevronRight className="w-8 h-8" />
            </button>
            <p className="absolute bottom-4 text-white/50 text-sm font-medium">
              {activeImageIdx + 1} / {images.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sub Header / Breadcrumb Sticky bar ── */}
      <div className="bg-white border-b border-slate-200/60 sticky top-14 md:top-[74px] z-40">
        <div className="container mx-auto px-4 h-12 flex items-center justify-between gap-4">
          <nav className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-widest font-black overflow-hidden">
            <Link href="/transport" className="hover:text-primary transition-colors whitespace-nowrap">Transport</Link>
            <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
            <Link href={`/transport/${countrySlug}/${stateSlug}/transport-in-${vehicle.destinationSlug}`} className="hover:text-primary transition-colors whitespace-nowrap hidden sm:block">
              {vehicle.cityName}
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300 shrink-0 hidden sm:block" />
            <span className="text-slate-800 truncate max-w-[140px] sm:max-w-xs">{vehicle.name}</span>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setWishlisted(!wishlisted)}
              className={`p-2 rounded-xl border transition-all ${wishlisted ? "bg-red-50 border-red-200 text-red-500" : "border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-400"}`}
            >
              <Heart className={`w-3.5 h-3.5 ${wishlisted ? "fill-red-500" : ""}`} />
            </button>
            <button
              onClick={() => navigator.share?.({ title: vehicle.name, url: window.location.href })}
              className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:border-primary hover:text-primary transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Detail Presentation ── */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* LEFT: Content (8 columns) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Gallery card with overlay navigation */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-3 shadow-sm">
              <div
                className="relative w-full rounded-2xl overflow-hidden bg-slate-900 cursor-zoom-in group"
                style={{ paddingBottom: "52%" }}
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
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors z-10"
                    >
                      <ChevronLeft className="w-5.5 h-5.5" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); nextImage(); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors z-10"
                    >
                      <ChevronRight className="w-5.5 h-5.5" />
                    </button>
                  </>
                )}

                <div className="absolute top-4 left-4 flex gap-2 z-10">
                  <span className="bg-primary text-white text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-widest">
                    {vehicle.type}
                  </span>
                  {vehicle.badge && (
                    <span className="bg-amber-500 text-slate-950 text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-widest">
                      {vehicle.badge}
                    </span>
                  )}
                </div>

                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full">
                  {activeImageIdx + 1} / {images.length}
                </div>
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`shrink-0 w-16 h-12 md:w-20 md:h-14 rounded-xl overflow-hidden border-2 transition-all ${
                        activeImageIdx === idx ? "border-primary shadow-sm scale-95" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vehicle Metadata Profile */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[9px] font-black uppercase border px-2.5 py-0.5 rounded-full ${cat.color}`}>
                  {cat.label} Class
                </span>
                {vehicle.isVerified && (
                  <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    <BadgeCheck className="w-3.5 h-3.5" /> Verified Logistics Partner
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {vehicle.name}
              </h1>

              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(vehicle.rating) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                ))}
                <span className="text-xs font-black text-slate-700 ml-1.5">{vehicle.rating}</span>
                <span className="text-xs text-slate-400 font-medium">({vehicle.reviewCount} verified reviews)</span>
              </div>

              {/* Specifications row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {[
                  { icon: Users, label: "Capacity", value: `${vehicle.capacity} Seats` },
                  { icon: Briefcase, label: "Luggage Limit", value: `${vehicle.luggageCapacity} Bags` },
                  { icon: Compass, label: "Transmission", value: vehicle.transmission },
                  { icon: Fuel, label: "Fuel System", value: vehicle.fuelType },
                ].map((spec, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center gap-1 hover:border-slate-200 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mb-1 text-primary">
                      <spec.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{spec.label}</span>
                    <span className="text-xs font-black text-slate-800">{spec.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {vehicle.isAc && (
                  <span className="flex items-center gap-1.5 text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/25 px-3 py-1.5 rounded-full">
                    <Thermometer className="w-3.5 h-3.5" /> Climate Control AC
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200/60 px-3 py-1.5 rounded-full">
                  <Calendar className="w-3.5 h-3.5" /> Model Year {vehicle.year} ({vehicleAge === 0 ? "New" : `${vehicleAge}y`})
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200/60 px-3 py-1.5 rounded-full">
                  <Gauge className="w-3.5 h-3.5" /> Base Rate ₹{vehicle.pricePerKm}/km
                </span>
              </div>
            </div>

            {/* Description card */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-5 md:p-6 shadow-sm space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">Fleet details & services</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {vehicle.description}
              </p>
            </div>

            {/* Amenities Grid */}
            {vehicle.features && vehicle.features.length > 0 && (
              <div className="bg-white border border-slate-200/60 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {vehicle.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-xs font-semibold text-slate-700">{feature.replace(/_/g, " ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transporter Details */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">Logistics Vendor</h2>
              <div className="flex items-center gap-4 bg-slate-900 text-white rounded-2xl p-4 md:p-5">
                <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shrink-0">
                  {vehicle.businessName?.[0] || "L"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm md:text-base truncate">{vehicle.businessName}</p>
                  <p className="text-slate-400 text-xs mt-0.5">Contact: {vehicle.ownerName} · Active since {vehicle.operatingSince}</p>
                </div>
                {vehicle.isVerified && (
                  <div className="shrink-0 flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </div>
                )}
              </div>
            </div>

            {/* Digital Safety Log Checklist */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">Inspection Log</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {SAFETY_CHECKS.map((item, idx) => (
                  <div key={idx} className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-3.5 flex flex-col items-center text-center gap-1.5">
                    <span className="text-base">{item.icon}</span>
                    <span className="text-[9px] text-slate-500 font-bold block leading-tight">{item.label}</span>
                    <span className="text-[10px] font-black text-emerald-600 block">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT: Booking Desk Panel (4 columns) */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 space-y-4">

              <div className="bg-white border border-slate-200/60 rounded-3xl shadow-xl overflow-hidden">
                {/* Price block */}
                <div className="bg-slate-950 p-5 md:p-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
                  <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">Starting Daily Fare</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">₹{vehicle.pricePerDay.toLocaleString("en-IN")}</span>
                    <span className="text-white/50 text-xs font-bold">/day</span>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/10 text-[10px] text-white/60">
                    <span>Base rate: ₹{vehicle.pricePerKm}/km</span>
                    <span className="flex items-center gap-1 text-emerald-400 font-bold">
                      <Zap className="w-3.5 h-3.5" /> Instant Booking
                    </span>
                  </div>
                </div>

                {/* Form fields */}
                <div className="p-5 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Check Availability</h3>

                  {bookingSubmitted ? (
                    <div className="flex flex-col items-center gap-3 py-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      </div>
                      <p className="font-bold text-slate-900 text-sm">Query Submitted!</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">Our transport desk will verify fleet availability and driver details within 15 minutes.</p>
                      <button onClick={() => setBookingSubmitted(false)} className="text-[11px] font-bold text-primary hover:underline">Submit another query</button>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Trip Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="date"
                            value={tripDate}
                            onChange={e => setTripDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-9 pr-3 h-11 text-xs font-semibold focus:outline-none focus:border-primary transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Pickup Address</label>
                        <div className="relative">
                          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={pickup}
                            onChange={e => setPickup(e.target.value)}
                            placeholder="e.g. Hotel / Airport / Station"
                            className="w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-9 pr-3 h-11 text-xs font-semibold focus:outline-none focus:border-primary transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Drop Location</label>
                        <div className="relative">
                          <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={drop}
                            onChange={e => setDrop(e.target.value)}
                            placeholder="Destination city or hotel"
                            className="w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-9 pr-3 h-11 text-xs font-semibold focus:outline-none focus:border-primary transition-all"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => { if (tripDate || pickup || drop) setBookingSubmitted(true); }}
                        className="w-full bg-primary hover:bg-primary/95 text-white font-black h-11 rounded-xl transition-all shadow-lg shadow-primary/20 text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <Calendar className="w-4 h-4" /> Submit Enquiry
                      </button>
                    </div>
                  )}

                  <p className="text-[9px] text-center text-slate-400 leading-tight">
                    Driver credentials and vehicle contacts will be shared 12 hours prior to scheduled departure.
                  </p>
                </div>
              </div>

              {/* Instant support card */}
              <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm space-y-3.5">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Immediate booking help</p>
                <div className="grid grid-cols-1 gap-2.5">
                  <a
                    href="tel:+919805001916"
                    className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3 hover:border-primary transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Call Agent</p>
                      <p className="text-xs font-black text-slate-800">+91 98050-01916</p>
                    </div>
                  </a>

                  <a
                    href="https://wa.me/919805001916"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3 hover:border-green-500 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-500 group-hover:text-white transition-colors">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">WhatsApp</p>
                      <p className="text-xs font-black text-slate-800">Chat with Logistics Desk</p>
                    </div>
                  </a>
                </div>
              </div>

              {/* Security Badge bar */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: ShieldCheck, label: "100% Secure" },
                  { icon: Clock, label: "24/7 Helpdesk" },
                  { icon: Award, label: "Lowest Price" },
                ].map((b, i) => (
                  <div key={i} className="bg-white border border-slate-200/60 rounded-2xl p-2 flex flex-col items-center gap-1 text-center shadow-xs">
                    <b.icon className="w-4 h-4 text-primary" />
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wide leading-none">{b.label}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>

        {/* Similar Fleet Section */}
        {related.length > 0 && (
          <section className="mt-12 pt-10 border-t border-slate-200/60">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                Recommended Alternative Fleets
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
                        <span className="text-[10px] font-bold text-slate-500">{rv.rating}</span>
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
    </div>
  );
}
