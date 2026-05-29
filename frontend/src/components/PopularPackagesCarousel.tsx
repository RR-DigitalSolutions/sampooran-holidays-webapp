"use client";

import { useEffect, useCallback, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MessageSquareText, PhoneCall, Sparkles, Send } from "lucide-react";
import { PackageCard } from "./PackageCard";
import { motion } from "framer-motion";

export function PopularPackagesCarousel({ packages, loading }: { packages: any[], loading?: boolean }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    containScroll: "trimSnaps",
    dragFree: false, // Changed for better snapping
  }, [Autoplay({ delay: 5000, stopOnInteraction: true })]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const [inquiryName, setInquiryName] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate submission for UI
    setTimeout(() => {
      setIsSubmitting(false);
      setInquiryName("");
      setInquiryPhone("");
      alert("Thanks! Our travel expert will contact you shortly.");
    }, 1000);
  };

  if (loading) return <PopularPackagesCarouselSkeleton />;
  if (!packages || packages.length === 0) return null;

  return (
    <div className="container mx-auto px-2 md:px-4 my-6">
      <section className="py-2 md:py-4 bg-white relative overflow-hidden rounded-[2rem] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">

        <div className="px-2 md:px-2 relative z-10">

          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl px-2 md:px-2">
              <div className="flex items-center gap-2">
                <span className="h-[2px] w-8 bg-accent" />
                <p className="text-accent font-bold text-xs uppercase tracking-[0.2em] font-['Poppins',sans-serif]">Trending Now</p>
              </div>
              <h2 className="text-2xl md:text-4xl font-['Raleway',sans-serif] font-bold text-primary mb-1 leading-tight">
                Trending Holiday <span className="text-accent italic font-light">Packages</span>
              </h2>
              <p className="text-slate-500 text-xs md:text-xs">
                Explore our most sought-after destinations. Handpicked, premium itineraries designed for unforgettable experiences.
              </p>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex flex-col items-end gap-6 pb-2">
              <Link href="/packages" className="text-primary font-bold text-sm hover:text-accent flex items-center gap-1.5 group transition-colors">
                All Holiday Packages <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex items-center gap-2">
                <button onClick={scrollPrev} className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary hover:shadow-sm transition-all focus:outline-none">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button onClick={scrollNext} className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary hover:shadow-sm transition-all focus:outline-none">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Embla Carousel */}
          <div className="overflow-hidden -mx-4 px-4 sm:mx-0 sm:px-0" ref={emblaRef}>
            <div className="flex -ml-4 md:-ml-6 pb-2 pt-4">
              {packages.map((pkg) => (
                <div key={pkg.id} className="flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_24%] min-w-0 pl-4 md:pl-6">
                  <PackageCard pkg={pkg} variant="carousel" />
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center justify-center gap-4 mb-10">
            <button onClick={scrollPrev} className="w-11 h-11 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center text-slate-600 active:scale-95">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button onClick={scrollNext} className="w-11 h-11 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center text-slate-600 active:scale-95">
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Integrated CTA & Inquiry Banner */}
          <div className="mt-4 relative rounded-2xl overflow-hidden bg-primary shadow-2xl shadow-primary/20">
            {/* Banner Background */}
            <div className="absolute inset-0 bg-primary/20 bg-cover bg-center opacity-10 mix-blend-overlay" />
            <div className="absolute inset-0 bg-primary/95" />

            <div className="relative z-10 p-4 md:p-4 flex flex-col lg:flex-row items-center justify-between gap-10">
              {/* Left: Text Content */}
              <div className="w-full lg:w-1/2 text-center lg:text-left">
                <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full text-accent text-xs font-bold mb-4 backdrop-blur-sm border border-white/10">
                  <Sparkles className="w-3.5 h-3.5" /> Customize Your Trip
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-2 font-['Raleway',sans-serif]">
                  Can't find the <span className="text-accent italic font-light">Perfect Package?</span>
                </h3>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-lg mx-auto lg:mx-0">
                  Let our travel experts craft a personalized itinerary just for you. Drop your details below and we'll get back to you within 24 hours with a custom quote!
                </p>
              </div>

              {/* Right: Quick Inquiry Form */}
              <div className="w-full lg:w-[45%] bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl">
                <form onSubmit={handleQuickInquiry} className="flex flex-col gap-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Your Name"
                        required
                        value={inquiryName}
                        onChange={(e) => setInquiryName(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm"
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        required
                        value={inquiryPhone}
                        onChange={(e) => setInquiryPhone(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-accent text-primary font-bold py-2 rounded-xl hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      "Sending Request..."
                    ) : (
                      <>Get Custom Quote <Send className="w-4 h-4 ml-1" /></>
                    )}
                  </button>
                  <div className="text-center mt-2 flex items-center justify-center gap-2 text-white/60 text-[11px] font-medium">
                    <PhoneCall className="w-3 h-3" /> Prefer to call? <a href="tel:+919876543210" className="text-accent hover:underline">+91 98765 43210</a>
                  </div>
                </form>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}

export function PopularPackagesCarouselSkeleton() {
  return (
    <div className="container mx-auto px-2 md:px-4 my-6">
      <section className="py-8 bg-white relative overflow-hidden rounded-[2rem] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="px-6">
          <div className="max-w-3xl mb-8">
            <div className="h-4 w-32 bg-slate-100 animate-pulse rounded mb-2" />
            <div className="h-10 w-80 bg-slate-100 animate-pulse rounded mb-4" />
            <div className="h-4 w-full bg-slate-50 animate-pulse rounded" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[4/5] bg-slate-100 animate-pulse rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
