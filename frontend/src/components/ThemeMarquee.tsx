"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Mountain, Heart, Users, TreePine, Waves,
  Coffee, Zap, Camera, TrendingUp, Globe,
  Sunset, Clock, Navigation, User, Building2,
  ChevronLeft, ChevronRight
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

const ICON_MAP: Record<string, any> = {
  Mountain, Heart, Users, TreePine, Waves,
  Coffee, Zap, Camera, TrendingUp, Globe,
  Sunset, Clock, Navigation, User, Building2
};

interface Theme {
  id: number;
  label: string;
  iconName: string;
  imageUrl?: string;
  image_url?: string; // Support snake_case from DB
  href: string;
  color?: string;
  packageCount?: number;
  startingPrice?: number;
  name?: string;
  slug?: string;
}

const DEFAULT_IMAGES: Record<string, string> = {};

export function ThemeMarquee({ themes, title, subtitle, loading }: { themes: Theme[], title?: string, subtitle?: string, loading?: boolean }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: false,
    loop: true,
  }, [
    Autoplay({
      delay: 3000,
      stopOnInteraction: false,
      stopOnMouseEnter: true
    })
  ]);

  const scrollPrev = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollNext();
  }, [emblaApi]);

  if (loading) return <ThemeMarqueeSkeleton />;
  if (!themes.length) return null;

  return (
    <div className="container mx-auto px-2 md:px-4 my-6">
      <section className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] py-2">
        <div className="px-6 py-2 flex items-end justify-between mb-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">

              <p className="text-accent font-bold text-xs uppercase tracking-[0.2em] font-['Poppins',sans-serif]">
                {subtitle || "Handpicked Collections"}
              </p>
            </div>
            <h2 className="text-2xl md:text-4xl font-['Raleway',sans-serif] font-bold text-primary leading-tight">
              {(() => {
                const t = title || "Explore by Themes";
                const words = t.split(" ");
                const lastWord = words.pop();
                return (
                  <>
                    {words.join(" ")}{words.length > 0 && " "}
                    <span className="text-accent italic font-light">{lastWord}</span>
                  </>
                );
              })()}
            </h2>
          </div>

          {/* Navigation Arrows */}
          <div className="flex gap-2">
            <button
              onClick={scrollPrev}
              className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all bg-white shadow-sm"
              aria-label="Previous themes"
              title="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollNext}
              className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all bg-white shadow-sm"
              aria-label="Next themes"
              title="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div>
          <div className="cursor-grab active:cursor-grabbing overflow-hidden" ref={emblaRef}>
            <div className="flex gap-2 md:gap-2">
              {themes.map((theme, idx) => {
                const themeLabel = theme.label || theme.name || "";
                const finalImageUrl = theme.imageUrl || theme.image_url || DEFAULT_IMAGES[themeLabel];
                const linkHref = theme.href || `/packages?theme=${theme.slug || themeLabel}`;

                return (
                  <div key={theme.id || idx} className="flex-none w-[110px] md:w-[125px]">
                    <Link href={linkHref} className="flex flex-col items-center gap-3 group">

                      <div className="relative p-[2px] rounded-full flex items-center justify-center">
                        {/* Theme Colors & Pink Glow (Behind) - Adjusted scale to prevent cutting */}
                        <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#0D1B3E,#FFD700,#E1306C,#0D1B3E)] animate-[spin_4s_linear_infinite] opacity-0 group-hover:opacity-60 blur-lg transition-all duration-500 scale-125 -z-10" />

                        {/* Clean Instagram-style Solid Ring with Pink */}
                        <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#0D1B3E,#FFD700,#E1306C,#0D1B3E)] animate-[spin_4s_linear_infinite] opacity-80 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Main Circle Container */}
                        <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full bg-white p-[3px] z-10 shadow-sm group-hover:shadow-xl transition-all duration-300">
                          <div className="w-full h-full rounded-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                            {finalImageUrl ? (
                              <Image
                                src={finalImageUrl}
                                alt={theme.label}
                                fill
                                sizes="(max-width: 768px) 100px, 120px"
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                            ) : (
                              <div className="text-slate-300">
                                {ICON_MAP[theme.iconName] ? React.createElement(ICON_MAP[theme.iconName], { className: "w-8 h-8" }) : <Mountain className="w-8 h-8" />}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Theme Title & Dynamic Data */}
                      <div className="flex flex-col items-center ">
                        <span
                          className="text-[12px] md:text-[13px] font-black text-primary tracking-[0.12em] uppercase group-hover:text-accent transition-colors text-center leading-tight"
                          style={{ fontFamily: "'Poppins', sans-serif" }}
                        >
                          {theme.label}
                        </span>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-black text-accent bg-accent/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                            {theme.packageCount || 0} Tours
                          </span>
                          <span className="text-[9px] font-bold text-slate-400">
                            From ₹{theme.startingPrice?.toLocaleString('en-IN') || "9,999"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section >
    </div >
  );
}

export function ThemeMarqueeSkeleton() {
  return (
    <div className="container mx-auto px-2 md:px-4 my-6">
      <section className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] py-2">
        <div className="px-6 py-2 flex items-end justify-between mb-4">
          <div className="flex flex-col gap-2">
            <div className="h-4 w-32 bg-slate-100 animate-pulse rounded" />
            <div className="h-8 w-64 bg-slate-100 animate-pulse rounded" />
          </div>
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden px-6 pb-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex-none w-[120px] md:w-[150px] flex flex-col items-center gap-3">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-slate-100 animate-pulse" />
              <div className="h-4 w-20 bg-slate-100 animate-pulse rounded" />
              <div className="h-3 w-16 bg-slate-100 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
