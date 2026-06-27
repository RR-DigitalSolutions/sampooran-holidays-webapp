"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { cn, validateImageUrl } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

interface Offer {
  id: number;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  termsAndConditions?: string;
}

interface OffersSectionProps {
  offers: Offer[];
  title?: string;
  subtitle?: string;
}

const CATEGORIES = [
  { id: "ALL", label: "All" },
  { id: "HOLIDAYS", label: "Holidays" },
  { id: "HOTELS", label: "Hotels" },
  { id: "FLIGHTS", label: "Flights" },
  { id: "TRAINS", label: "Trains" },
  { id: "CABS", label: "Cabs" },
  { id: "BANK", label: "Bank Offers" },
];

export function OffersSection({ offers, title, subtitle }: OffersSectionProps) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("ALL");

  const regularOffers = offers.filter(o => o.category !== "SPONSORED" && o.category !== "SPONSORED_BANNER");

  const filteredOffers = activeCategory === "ALL"
    ? regularOffers
    : regularOffers.filter(o => o.category === activeCategory);

  // Mobile Carousel Hook
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      dragFree: false,
      breakpoints: {
        "(min-width: 768px)": { active: false } // Disable on desktop
      }
    },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <section className="pb-4 bg-slate-50/50">
      <style>{`
        @keyframes badge-pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 166, 35, 0.7); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(245, 166, 35, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 166, 35, 0); }
        }
        .animate-badge-pulse {
          animation: badge-pulse 2s infinite;
        }
      `}</style>
      <div className="container mx-auto px-4 pt-2 md-pt-1 max-w-8xl">

        <div className="bg-white rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-100 px-2 pt-2 pb-2 md:px-2 md:pt-2 md:pb-2 lg:px-2 lg:pt-2 lg:pb-2 pr-0 relative">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-50 pb-1">
            <div className="flex items-end gap-6">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <p className="text-accent font-bold text-[9px] md-text-[12px] uppercase tracking-[0.1em] font-sans">
                    {subtitle || "Exclusive Deals"}
                  </p>
                </div>
                <h2 className="text-xl md:text-3xl font-serif font-bold text-primary leading-tight">
                  {(() => {
                    const t = title || "Special Offers";
                    const words = t.split(" ");
                    const lastWord = words.pop();
                    return (
                      <>
                        {words.join(" ")}{words.length > 0 && " "}
                        <span className="text-accent font-light">{lastWord}</span>
                      </>
                    );
                  })()}
                </h2>
              </div>

              {/* Desktop Tabs */}
              <div className="hidden lg:flex items-center gap-1 bg-slate-50/80 p-1 rounded-full mb-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-full transition-all",
                      activeCategory === cat.id
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden md:flex items-center pb-2 gap-3">
              <button onClick={scrollPrev} className="w-8 h-8 rounded-full border border-slate-100 text-slate-400 hover:text-primary hover:border-primary flex items-center justify-center transition-all shadow-sm">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={scrollNext} className="w-8 h-8 rounded-full border border-slate-100 text-slate-400 hover:text-primary hover:border-primary flex items-center justify-center transition-all shadow-sm">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Mobile Tabs */}
          <div className="md:hidden flex overflow-x-auto no-scrollbar gap-2 border-b border-slate-50/50 mb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] md-text-[12px] font-bold uppercase tracking-wider transition-all border-none",
                  activeCategory === cat.id
                    ? "bg-accent text-accent-foreground shadow-md"
                    : "text-slate-500 bg-slate-50/50 hover:bg-slate-100"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Carousel Viewport */}
          <div className="overflow-hidden md:overflow-visible" ref={emblaRef}>
            <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-2 pb-4 md:pb-2">
              {filteredOffers.length > 0 ? (
                filteredOffers.slice(0, 6).map((offer) => (
                  <div key={offer.id} className="flex-[0_0_88%] min-w-0 md:flex-auto">
                    <Link
                      key={offer.id}
                      href={offer.ctaLink || "/"}
                      onTouchStart={() => { if (offer.ctaLink?.startsWith("/")) router.prefetch(offer.ctaLink); }}
                      onMouseEnter={() => { if (offer.ctaLink?.startsWith("/")) router.prefetch(offer.ctaLink); }}
                      className="block group group/card"
                    >
                      <div className={cn(
                        "flex h-[130px] md:h-[150px] rounded-md overflow-hidden bg-white relative transition-all duration-500",
                        "border-0 md:border md:border-slate-100 hover:border-accent/40",
                        "shadow-[0_10px_35px_rgba(0,0,0,0.05)] md:shadow-none hover:shadow-2xl hover:shadow-accent/10"
                      )}>

                        {/* Left Image - Overlapping slightly to prevent seam lines */}
                        <div className="relative w-[41%] md:w-[44%] h-full overflow-hidden shrink-0 z-10">
                          <div className="absolute w-2 bg-white z-20  md:shadow-[-12px_0_20px_rgba(0,0,0,0.04)] transition-transform duration-500 group-hover/card:scale-x-125 origin-right" />
                          {offer.imageUrl && offer.imageUrl.trim() ? (
                            <Image
                              src={validateImageUrl(offer.imageUrl, 400, 300, "4:3")}
                              alt={offer.title || "Offer image"}
                              fill
                              sizes="(max-width: 768px) 45vw, 400px"
                              className="object-cover group-hover/card:scale-110 transition-transform duration-[1.5s] ease-out"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-100 flex items-center justify-center">
                              <svg className="w-8 h-8 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                              </svg>
                            </div>
                          )}
                          {offer.termsAndConditions && (
                            <div className="absolute top-2 left-2 z-30 bg-accent text-primary text-[6px] md:text-[8px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-lg animate-badge-pulse">
                              {offer.termsAndConditions}
                            </div>
                          )}
                        </div>

                        {/* Right Content - Negative margin to cover the seam */}
                        <div className="flex-1 p-1 md:p-2 flex flex-col justify-between border-l-0 relative z-0">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1 opacity-70">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                              <span className="text-[9px] font-bold text-primary tracking-widest uppercase">{offer.category}</span>
                            </div>
                            <h3 className="font-bold text-slate-800 text-[11px] md:text-[12px] leading-tight mb-1 line-clamp-2 font-serif tracking-tight group-hover/card:text-primary transition-colors">
                              {offer.title}
                            </h3>
                            <p className="text-slate-500 text-[9px] md:text-[10px] font-medium leading-relaxed line-clamp-2">
                              {offer.description}
                            </p>
                          </div>

                          {/* CTA Button - Compact */}
                          <div className="flex justify-end mt-1.5">
                            <div className="relative group/btn cursor-pointer">
                              <div className="relative bg-primary text-white text-[9px] md:text-[10px] font-bold px-2 py-1 md:px-2 md:py-1 rounded-full shadow-lg hover:bg-accent hover:text-primary transform transition-all duration-300 flex items-center gap-2 uppercase tracking-[0.15em]">
                                {offer.ctaText || "GRAB DEAL"}
                                <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-16 text-center bg-slate-50/50 rounded-3xl border-2 border-slate-100 border-dashed">
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-wider">No active promotions found.</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center border-t border-slate-50">
            <Link
              href="/offers"
              onTouchStart={() => router.prefetch("/offers")}
              onMouseEnter={() => router.prefetch("/offers")}
              className="text-primary font-bold uppercase tracking-widest text-[10px] hover:text-accent flex items-center gap-2 group"
            >
              View All Offers
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
