from pathlib import Path

file_path = Path(r"c:\Users\Raman K Singh\Documents\RR Digital Solutions\Sampooran Holidays\sampooran-holidays-source\frontend\src\components\pages\PackageDetailsPage.tsx")
content = r'''
"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight, Calendar, MapPin, Star, Clock, Check, X, Shield,
  Plane, Utensils, Hotel, Coffee, Car, Camera, Ticket, ShieldCheck, Zap, Users, FileText, CheckCircle,
  ChevronDown, ChevronUp, Info, HelpCircle, AlertCircle, Phone, MessageSquare, CreditCard
} from "lucide-react";
import { validateImageUrl, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function PackageDetailsPage({ packageData }: { packageData: any }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const itinerary = useMemo(() => {
    try {
      const data = typeof packageData.itinerary === 'string' ? JSON.parse(packageData.itinerary) : packageData.itinerary;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }, [packageData.itinerary]);

  const [openDays, setOpenDays] = useState<number[]>([]);

  const faqs = useMemo(() => {
    try {
      const data = typeof packageData.faqs === 'string' ? JSON.parse(packageData.faqs) : packageData.faqs;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }, [packageData.faqs]);

  const galleryImages = useMemo(() => {
    const data = Array.isArray(packageData.galleryImages) ? packageData.galleryImages.filter(Boolean) : [];
    const heroImage = packageData.imageUrl ? [packageData.imageUrl] : [];
    return Array.from(new Set([...heroImage, ...data])).slice(0, 6);
  }, [packageData.galleryImages, packageData.imageUrl]);

  const pricePerPerson = Number(packageData.pricePerPerson || 0);
  const originalPrice = Number(packageData.originalPrice || pricePerPerson);
  const savings = Math.max(0, originalPrice - pricePerPerson);
  const allDaysExpanded = itinerary.length > 0 && openDays.length === itinerary.length;

  const toggleDay = (dayIndex: number) => {
    setOpenDays((current) =>
      current.includes(dayIndex)
        ? current.filter((idx) => idx !== dayIndex)
        : [...current, dayIndex]
    );
  };

  const toggleAllDays = () => {
    setOpenDays(allDaysExpanded ? [] : itinerary.map((_, idx) => idx));
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) setShowStickyBar(true);
      else setShowStickyBar(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getInclusionIcon = (text: string) => {
    const t = text.toLowerCase();
    if (t.includes("flight") || t.includes("plane")) return Plane;
    if (t.includes("hotel") || t.includes("stay") || t.includes("accommodation")) return Hotel;
    if (t.includes("meal") || t.includes("breakfast") || t.includes("dinner") || t.includes("food")) return Utensils;
    if (t.includes("transfer") || t.includes("car") || t.includes("cab") || t.includes("taxi")) return Car;
    if (t.includes("sightseeing") || t.includes("tour") || t.includes("camera")) return Camera;
    if (t.includes("ticket") || t.includes("entry") || t.includes("pass")) return Ticket;
    if (t.includes("insurance") || t.includes("safe") || t.includes("shield")) return ShieldCheck;
    if (t.includes("activity") || t.includes("sport") || t.includes("trek")) return Zap;
    return CheckCircle;
  };

  const getInclusionIconById = (id: string) => {
    switch (id.toLowerCase()) {
      case "flight": return Plane;
      case "hotel": return Hotel;
      case "meals": return Utensils;
      case "transfers": return Car;
      case "sightseeing": return Camera;
      case "ticket": return Ticket;
      case "insurance": return ShieldCheck;
      case "activities": return Zap;
      case "guide": return Users;
      case "visa": return FileText;
      case "drinks": return Coffee;
      default: return CheckCircle;
    }
  };

  const highlights = useMemo(() => {
    if (Array.isArray(packageData.highlights)) return packageData.highlights;
    if (typeof packageData.highlights === 'string' && packageData.highlights.trim()) return [packageData.highlights];
    return [];
  }, [packageData.highlights]);

  const inclusionList = (packageData.inclusionIcons && packageData.inclusionIcons.length > 0)
    ? packageData.inclusionIcons.map((id: string) => ({ id, label: id, Icon: getInclusionIconById(id) }))
    : (packageData.inclusions || []).slice(0, 6).map((text: string) => ({ id: text, label: text.split(' ')[0], Icon: getInclusionIcon(text) }));

  const departureCities = Array.isArray(packageData.cities)
    ? packageData.cities.join(' • ')
    : packageData.cities || packageData.destinationName || packageData.stateName || packageData.countryName || 'India';

  return (
    <div className="w-full flex flex-col font-sans bg-[#F4F5F7] min-h-screen">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-slate-950/70" />
        <div className="relative h-[520px] lg:h-[620px]">
          <Image
            src={validateImageUrl(galleryImages[0] || packageData.imageUrl || '/default-hero.jpg')}
            alt={packageData.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-slate-950/90" />
          <div className="container mx-auto px-4 lg:px-8 h-full relative z-10 flex items-end pb-10">
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 text-white">
                {packageData.category && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/90 font-semibold mb-4">
                    {packageData.category}
                  </span>
                )}
                <p className="text-xs uppercase tracking-[0.24em] text-slate-200/80 mb-4">
                  {departureCities}
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-5 max-w-3xl">
                  {packageData.name}
                </h1>
                <p className="max-w-3xl text-sm sm:text-base text-slate-200/90 leading-7 mb-6">
                  {packageData.shortDescription || packageData.longDescription?.slice(0, 200) || 'Explore this premium holiday package with curated stays, transfers, and sightseeing experiences.'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-200 text-[13px] font-semibold">
                  <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-200/70 mb-2">Duration</p>
                    <p className="text-base">{packageData.duration || '7'} Days</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-200/70 mb-2">Nights</p>
                    <p className="text-base">{packageData.nights || '6'} Nights</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-200/70 mb-2">Starting Price</p>
                    <p className="text-base">₹{pricePerPerson.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-200/70 mb-2">Rating</p>
                    <p className="inline-flex items-center gap-2 text-base">
                      <Star className="w-4 h-4 text-amber-400" />
                      {packageData.rating?.toFixed(1) || '4.5'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4">
                <div className="rounded-[32px] border border-white/15 bg-white/95 backdrop-blur-xl shadow-2xl shadow-slate-950/10 p-6 lg:p-8 text-slate-900">
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Best Price</p>
                      <p className="text-3xl font-bold">₹{pricePerPerson.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="rounded-2xl bg-[#E8F8F2] text-green-700 px-3 py-2 text-xs font-bold uppercase">
                      {savings > 0 ? 'Save' : 'Fixed'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 mb-6">
                    <div className="rounded-3xl bg-slate-50 p-3">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Room</p>
                      <p className="font-semibold">{packageData.hotelCategory || 'Deluxe'}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-3">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Meals</p>
                      <p className="font-semibold">{packageData.mealsIncluded || 'CP / MAP'}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-3">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Transport</p>
                      <p className="font-semibold">{packageData.transportMode || 'AC Coach'}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-3">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Group</p>
                      <p className="font-semibold">{packageData.groupSize || '20 pax'}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Link href="#enquire" className="block w-full bg-[#1B3A6B] hover:bg-[#152e55] text-white text-center py-3 rounded-2xl font-bold transition">
                      Book Now
                    </Link>
                    <a href={`https://wa.me/919000000000?text=I’m interested in ${packageData.name}`} target="_blank" rel="noreferrer" className="block w-full border border-slate-200 text-slate-900 text-center py-3 rounded-2xl font-semibold hover:bg-slate-50 transition">
                      Enquire on WhatsApp
                    </a>
                  </div>
                  <div className="mt-6 rounded-3xl bg-slate-50 p-4 text-[13px] text-slate-700">
                    <p className="font-semibold mb-2">Need Assistance?</p>
                    <a href="tel:+919000000000" className="font-bold text-[#1B3A6B]">+91 900 000 0000</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      <div className="container mx-auto px-4 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {galleryImages.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {galleryImages.slice(0, 3).map((image, idx) => (
                  <div key={idx} className="relative rounded-[28px] overflow-hidden aspect-[4/3] shadow-lg">
                    <Image
                      src={validateImageUrl(image)}
                      alt={`${packageData.name} gallery ${idx + 1}`}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            )}

            <section id="overview" className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Package Overview</h2>
                  <p className="text-sm text-slate-500 mt-1">Everything included in this tour package.</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-green-50 text-green-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]">
                  {packageData.tourType || 'Regular Tour'}
                </span>
              </div>
              <div className="prose prose-slate max-w-none text-slate-700 leading-7 text-sm"
                dangerouslySetInnerHTML={{ __html: packageData.longDescription || packageData.shortDescription || 'No overview available.' }} />
            </section>

            <section id="itinerary" className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Itinerary</h2>
                  <p className="text-sm text-slate-500 mt-1">View each day&apos;s plan in detail.</p>
                </div>
                <button onClick={toggleAllDays} className="text-sm font-semibold text-[#1B3A6B] hover:underline">
                  {allDaysExpanded ? 'Collapse All' : 'Expand All'}
                </button>
              </div>
              <div className="space-y-5">
                {itinerary.map((day: any, idx: number) => {
                  const isOpen = openDays.includes(idx);
                  const meals = Array.isArray(day.meals) ? day.meals : typeof day.meals === 'string' ? [day.meals] : [];
                  return (
                    <div key={idx} className="rounded-3xl border border-slate-200 overflow-hidden">
                      <button
                        onClick={() => toggleDay(idx)}
                        className="w-full flex items-center justify-between gap-4 p-5 bg-slate-50 hover:bg-slate-100 transition"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B3A6B] to-blue-600 text-white font-bold">
                            Day {idx + 1}
                          </div>
                          <div className="text-left">
                            <h3 className="text-base font-semibold text-slate-900">{day.title || `Day ${idx + 1}`}</h3>
                            <p className="text-sm text-slate-500">{day.location || 'Location details'}</p>
                          </div>
                        </div>
                        <div className="text-slate-500">{isOpen ? 'Hide' : 'View'}</div>
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="p-6 border-t border-slate-200 bg-white">
                            <div className="space-y-4 text-slate-700 text-sm leading-7" dangerouslySetInnerHTML={{ __html: day.description || day.content || '' }} />
                            {day.accommodation && (
                              <div className="rounded-3xl bg-slate-50 p-4 border border-slate-200">
                                <p className="text-sm font-semibold text-slate-900 mb-2">Accommodation</p>
                                <p className="text-sm text-slate-600">{day.accommodation}</p>
                              </div>
                            )}
                            {meals.length > 0 && (
                              <div className="rounded-3xl bg-slate-50 p-4 border border-slate-200">
                                <p className="text-sm font-semibold text-slate-900 mb-2">Meals</p>
                                <p className="text-sm text-slate-600">{meals.join(', ')}</p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </section>

            <section id="inclusions" className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-5">Inclusions & Exclusions</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">What&apos;s Included</h3>
                  <ul className="space-y-3">
                    {(packageData.inclusions || []).map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                        <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-50 text-green-600"><Check className="w-4 h-4" /></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">What&apos;s Not Included</h3>
                  <ul className="space-y-3">
                    {(packageData.exclusions || []).map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                        <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-600"><X className="w-4 h-4" /></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section id="policies" className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-5">Policies</h2>
              <div className="space-y-6 text-sm text-slate-700 leading-7">
                <div>
                  <p className="font-semibold text-slate-900 mb-2">Payment Policy</p>
                  <div dangerouslySetInnerHTML={{ __html: packageData.paymentPolicy || 'Payment policy details will be updated soon.' }} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 mb-2">Cancellation Policy</p>
                  <div dangerouslySetInnerHTML={{ __html: packageData.cancellationPolicy || 'Cancellation policy details will be updated soon.' }} />
                </div>
              </div>
            </section>

            {faqs.length > 0 && (
              <section id="faqs" className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-5">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {faqs.map((faq: any, idx: number) => (
                    <div key={idx} className="rounded-3xl border border-slate-200 overflow-hidden">
                      <button onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)} className="w-full flex items-center justify-between gap-4 p-5 bg-slate-50 hover:bg-slate-100 transition">
                        <span className="text-sm font-semibold text-slate-900">{faq.question}</span>
                        {expandedFaq === idx ? <ChevronUp className="w-5 h-5 text-[#1B3A6B]" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                      </button>
                      {expandedFaq === idx && (
                        <div className="p-5 border-t border-slate-200 text-sm text-slate-700">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-28 space-y-6">
              <div className="rounded-[32px] bg-white border border-slate-200 p-6 shadow-sm">
                <div className="mb-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Package summary</p>
                  <p className="text-2xl font-bold text-slate-900 mt-3">₹{pricePerPerson.toLocaleString('en-IN')}</p>
                  <p className="text-sm text-slate-500">per person on twin sharing</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-700 mb-6">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-slate-500">Duration</p>
                    <p className="font-semibold">{packageData.duration} Days</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-slate-500">Nights</p>
                    <p className="font-semibold">{packageData.nights} Nights</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-slate-500">Departure</p>
                    <p className="font-semibold">{packageData.departureCity || packageData.startCity || 'Delhi'}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-slate-500">Seats</p>
                    <p className="font-semibold">{packageData.seatsAvailable || 'Limited'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Link href="#enquire" className="block w-full bg-[#1B3A6B] text-white text-center py-3 rounded-2xl font-bold">
                    Enquire Now
                  </Link>
                  <a href={`https://wa.me/919000000000?text=I’m interested in ${packageData.name}`} target="_blank" rel="noreferrer" className="block w-full border border-slate-200 text-center py-3 rounded-2xl font-semibold text-slate-900 hover:bg-slate-50 transition">
                    Chat on WhatsApp
                  </a>
                </div>
              </div>

              <div className="rounded-[32px] bg-white border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Why Book With Us?</h3>
                <ul className="space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-3"><span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Check className="w-4 h-4" /></span> Handpicked stays & transfers</li>
                  <li className="flex items-start gap-3"><span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600"><ShieldCheck className="w-4 h-4" /></span> Trusted booking support</li>
                  <li className="flex items-start gap-3"><span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Phone className="w-4 h-4" /></span> 24/7 travel assistance</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 p-3 flex items-center justify-between transition-transform duration-300 lg:hidden shadow-[0_-10px_20px_rgba(0,0,0,0.05)]",
        showStickyBar ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Starting Price</span>
          <span className="text-xl font-bold text-slate-900 leading-none">₹{packageData.pricePerPerson?.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex gap-2">
          <Link href="#enquire" className="bg-gradient-to-r from-[#1B3A6B] to-blue-700 text-white px-8 h-12 rounded-xl flex items-center justify-center font-bold text-sm shadow-md shadow-blue-900/20 active:scale-95 transition-transform">
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}
'''
file_path.write_text(content, encoding='utf-8')
print(f"Rewritten {file_path}")
