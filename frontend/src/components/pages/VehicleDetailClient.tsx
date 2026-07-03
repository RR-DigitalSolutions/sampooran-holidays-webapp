"use client";

import { useState } from "react";
import {
  Users, Briefcase, Compass, Star, MapPin, ChevronLeft, ChevronRight,
  ShieldCheck, Award, Calendar, Phone, MessageCircle, Fuel, Thermometer,
  Gauge, CheckCircle2, Clock, ArrowRight, Share2, Heart, BadgeCheck,
  Zap, Navigation, Car, X
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
  economy: { label: "Economy", color: "bg-emerald-100 text-emerald-700" },
  standard: { label: "Standard", color: "bg-blue-100 text-blue-700" },
  premium: { label: "Premium", color: "bg-orange-100 text-orange-700" },
  luxury: { label: "Luxury", color: "bg-purple-100 text-purple-700" },
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 px-4">
        <Car className="w-16 h-16 text-primary/30" />
        <h2 className="text-xl font-bold text-center">Vehicle Details Not Found</h2>
        <p className="text-muted-foreground text-center text-sm max-w-xs">
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
    <div className="bg-background min-h-screen font-sans">

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

      {/* ── Top Nav Bar ── */}
      <div className="bg-white border-b border-slate-100 sticky top-14 md:top-[74px] z-40">
        <div className="container mx-auto px-4 h-12 flex items-center justify-between gap-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-widest font-bold overflow-hidden">
            <Link href="/transport" className="hover:text-primary transition-colors whitespace-nowrap">Transport</Link>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <Link href={`/transport/${countrySlug}/${stateSlug}/transport-in-${vehicle.destinationSlug}`} className="hover:text-primary transition-colors whitespace-nowrap hidden sm:block">
              {vehicle.cityName}
            </Link>
            <ChevronRight className="w-3 h-3 shrink-0 hidden sm:block" />
            <span className="text-slate-800 truncate max-w-[140px] sm:max-w-xs">{vehicle.name}</span>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setWishlisted(!wishlisted)}
              className={`p-2 rounded-lg border transition-all ${wishlisted ? "bg-red-50 border-red-200 text-red-500" : "border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-400"}`}
            >
              <Heart className={`w-4 h-4 ${wishlisted ? "fill-red-500" : ""}`} />
            </button>
            <button
              onClick={() => navigator.share?.({ title: vehicle.name, url: window.location.href })}
              className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:border-primary hover:text-primary transition-all"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">

          {/* ── LEFT: Main Content ── */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">

            {/* ── Photo Gallery ── */}
            <div>
              {/* Main Image */}
              <div
                className="relative w-full rounded-2xl overflow-hidden bg-slate-100 cursor-zoom-in"
                style={{ paddingBottom: "56.25%" }}
                onClick={() => setLightboxOpen(true)}
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImageIdx}
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    src={images[activeImageIdx] || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80"}
                    alt={vehicle.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </AnimatePresence>

                {/* Image Nav Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={e => { e.stopPropagation(); prevImage(); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); nextImage(); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                  <span className="bg-primary text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider">
                    {vehicle.type}
                  </span>
                  {vehicle.badge && (
                    <span className="bg-amber-500 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider">
                      {vehicle.badge}
                    </span>
                  )}
                </div>

                {/* Image counter */}
                <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                  {activeImageIdx + 1} / {images.length}
                </div>
              </div>

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`shrink-0 w-16 h-12 md:w-20 md:h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        activeImageIdx === idx ? "border-primary shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Vehicle Identity ── */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${cat.color}`}>
                  {cat.label}
                </span>
                {vehicle.isVerified && (
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                    <BadgeCheck className="w-3 h-3" /> Verified Fleet
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight text-slate-900">
                {vehicle.name}
              </h1>

              <div className="flex items-center gap-1.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-4 h-4 ${s <= Math.round(vehicle.rating) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                ))}
                <span className="text-sm font-bold text-slate-700 ml-1">{vehicle.rating}</span>
                <span className="text-sm text-muted-foreground">({vehicle.reviewCount} reviews)</span>
              </div>

              {/* Key Specs Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
                {[
                  { icon: Users, label: "Seating", value: `${vehicle.capacity} Seats` },
                  { icon: Briefcase, label: "Luggage", value: `${vehicle.luggageCapacity} Bags` },
                  { icon: Compass, label: "Gearbox", value: vehicle.transmission },
                  { icon: Fuel, label: "Fuel", value: vehicle.fuelType },
                ].map((spec, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-3 md:p-4 flex flex-col items-center text-center gap-1.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <spec.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{spec.label}</span>
                    <span className="text-xs md:text-sm font-black text-slate-900">{spec.value}</span>
                  </div>
                ))}
              </div>

              {/* Additional badges */}
              <div className="flex flex-wrap gap-2">
                {vehicle.isAc && (
                  <span className="flex items-center gap-1 text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-full">
                    <Thermometer className="w-3 h-3" /> Air Conditioned
                  </span>
                )}
                <span className="flex items-center gap-1 text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-full">
                  <Calendar className="w-3 h-3" /> Year {vehicle.year} ({vehicleAge === 0 ? "Brand New" : `${vehicleAge}yr old`})
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-full">
                  <Gauge className="w-3 h-3" /> ₹{vehicle.pricePerKm}/km
                </span>
              </div>
            </div>

            {/* ── Description ── */}
            <div className="border-t border-slate-100 pt-6 space-y-3">
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900">About This Vehicle</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {vehicle.description}
              </p>
            </div>

            {/* ── Features ── */}
            {vehicle.features && vehicle.features.length > 0 && (
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Features & Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
                  {vehicle.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-3 py-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-xs font-medium text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Transporter Profile ── */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Transporter Profile</h2>
              <div className="flex items-center gap-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-primary flex items-center justify-center text-white font-black text-lg shrink-0">
                  {vehicle.businessName?.[0] || "H"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm md:text-base truncate">{vehicle.businessName}</p>
                  <p className="text-slate-400 text-xs mt-0.5">Owner: {vehicle.ownerName} · Est. {vehicle.operatingSince}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-amber-400 text-xs font-black">{vehicle.rating}</span>
                    <span className="text-slate-500 text-xs ml-1">· {vehicle.reviewCount} reviews</span>
                  </div>
                </div>
                {vehicle.isVerified && (
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    <span className="text-[9px] text-emerald-400 font-black uppercase tracking-wide">Verified</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Safety Checklist ── */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Digital Safety Log</h2>
              </div>
              <p className="text-xs text-muted-foreground">Condition checklist verified by inspection desk on last service.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
                {SAFETY_CHECKS.map((item, idx) => (
                  <div key={idx} className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex flex-col items-center text-center gap-1.5">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-[9px] text-slate-500 font-medium block leading-tight">{item.label}</span>
                    <span className="text-[10px] font-black text-emerald-600 block">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Route Info ── */}
            <div className="border-t border-slate-100 pt-6">
              <div className="bg-slate-900 rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Based in</p>
                    <p className="text-white font-bold text-sm">{vehicle.cityName}, Himachal Pradesh</p>
                  </div>
                </div>
                <Link
                  href={`/transport/${vehicle.countrySlug}/${vehicle.stateSlug}/transport-in-${vehicle.destinationSlug}`}
                  className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  More vehicles in {vehicle.cityName}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>

          {/* ── RIGHT: Booking Sidebar ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 md:top-32 space-y-4">

              {/* Price Card */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                {/* Price Header */}
                <div className="bg-gradient-to-br from-primary to-[#1e3a8a] p-5 md:p-6">
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Starting Daily Rate</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl md:text-4xl font-black text-white">₹{vehicle.pricePerDay.toLocaleString("en-IN")}</span>
                    <span className="text-white/50 text-sm font-medium">/day</span>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-white/70 text-xs font-medium">₹{vehicle.pricePerKm}/km outstation</span>
                    <span className="text-white/40 text-xs">•</span>
                    <span className="flex items-center gap-1 text-emerald-300 text-xs font-bold">
                      <Zap className="w-3 h-3" /> Instant Confirm
                    </span>
                  </div>
                </div>

                {/* Booking Form */}
                <div className="p-5 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Check Availability</h3>

                  {bookingSubmitted ? (
                    <div className="flex flex-col items-center gap-3 py-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      </div>
                      <p className="font-bold text-slate-800 text-sm">Query Received!</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Our team will confirm availability and driver details within 30 minutes.
                      </p>
                      <button
                        onClick={() => setBookingSubmitted(false)}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Make another enquiry
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1.5">Trip Start Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <input
                            type="date"
                            value={tripDate}
                            onChange={e => setTripDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1.5">Pickup Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <input
                            type="text"
                            value={pickup}
                            onChange={e => setPickup(e.target.value)}
                            placeholder="Hotel name or landmark"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-300"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1.5">Drop Location</label>
                        <div className="relative">
                          <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <input
                            type="text"
                            value={drop}
                            onChange={e => setDrop(e.target.value)}
                            placeholder="Destination or hotel"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-300"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => { if (tripDate || pickup || drop) setBookingSubmitted(true); }}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-black py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 text-xs uppercase tracking-widest active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Calendar className="w-4 h-4" /> Submit Enquiry
                      </button>
                    </div>
                  )}

                  <p className="text-[10px] text-center text-muted-foreground">
                    Driver profile shared 12 hrs before pickup. Free cancellation up to 24 hrs.
                  </p>
                </div>
              </div>

              {/* Quick Contact */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Instant Support</p>
                <a
                  href="tel:+919805001916"
                  className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-primary hover:shadow-sm transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                    <Phone className="w-4 h-4 text-primary group-hover:text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Call Now</p>
                    <p className="text-sm font-black text-slate-900">+91 98050-01916</p>
                  </div>
                </a>
                <a
                  href="https://wa.me/919805001916"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-green-400 hover:shadow-sm transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-500 transition-colors">
                    <MessageCircle className="w-4 h-4 text-green-600 group-hover:text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">WhatsApp</p>
                    <p className="text-sm font-black text-slate-900">Chat with Us</p>
                  </div>
                </a>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: ShieldCheck, label: "Verified" },
                  { icon: Clock, label: "24/7 Support" },
                  { icon: Award, label: "Best Price" },
                ].map((b, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-col items-center gap-1.5 text-center">
                    <b.icon className="w-4 h-4 text-primary" />
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wide leading-tight">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* ── Related Vehicles ── */}
        {related.length > 0 && (
          <section className="mt-12 md:mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
                Similar Vehicles
              </h2>
              <Link
                href="/transport"
                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {related.map(rv => (
                <Link
                  key={rv.id}
                  href={`/transport/${rv.countrySlug}/${rv.stateSlug}/transport-in-${rv.destinationSlug}/${rv.slug}`}
                  className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  <div className="relative h-32 sm:h-36 overflow-hidden bg-slate-100">
                    <img
                      src={rv.images?.[0]}
                      alt={rv.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className="absolute bottom-2 left-2 text-[9px] font-black text-white uppercase bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
                      {rv.type}
                    </span>
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-xs font-black text-slate-900 line-clamp-1">{rv.name}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-[10px] font-bold text-slate-600">{rv.rating}</span>
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
