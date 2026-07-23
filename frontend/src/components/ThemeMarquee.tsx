"use client";

import React, { useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn, validateImageUrl } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  Mountain, Heart, Users, TreePine, Waves,
  Coffee, Zap, Camera, TrendingUp, Globe,
  Sunset, Clock, Navigation, User, Building2,
  ChevronLeft, ChevronRight, ArrowRight
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useCarouselGuide } from "@/hooks/useCarouselGuide";

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
  image_url?: string;
  href: string;
  color?: string;
  packageCount?: number;
  startingPrice?: number;
  name?: string;
  slug?: string;
}

const DEFAULT_IMAGES: Record<string, string> = {};

export function ThemeMarquee({ themes, title, subtitle, loading }: { themes: Theme[], title?: string, subtitle?: string, loading?: boolean }) {
  const router = useRouter();
  const sectionRef = useRef<HTMLDivElement>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: false,
    loop: true,
  });

  const { showHint } = useCarouselGuide({ emblaRef: sectionRef, emblaApi, sectionId: "themes", waitMs: 3000 });

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
    <div ref={sectionRef} className="container mx-auto px-2 md:px-4 my-6">
      <section className="bg-white rounded-lg overflow-hidden border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] py-2">
        <div className="px-2 flex items-end justify-between mb-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <p className="text-accent font-bold text-[9px] md-text-[12px] uppercase tracking-[0.1em] font-sans">
                {subtitle || "Handpicked Collections"}
              </p>
            </div>
            <h2 className="text-xl md:text-3xl font-serif font-bold text-primary leading-tight">
              {(() => {
                const t = title || "Explore by Themes";
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
          {/* One-time Swipe Hint Pill */}
          <div className="relative">
            {showHint && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                <div className="flex items-center gap-1.5 bg-primary/90 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg animate-bounce">
                  <span>Swipe to explore</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            )}
            <div className="cursor-grab active:cursor-grabbing overflow-hidden" ref={emblaRef}>
              <div className="flex gap-1 md:gap-4">
                {themes.map((theme, idx) => {
                  const themeLabel = theme.label || theme.name || "Theme";
                  const rawThemeImage = theme.imageUrl?.trim() || theme.image_url?.trim();
                  const finalImageUrl = rawThemeImage ? validateImageUrl(rawThemeImage, 200, 200, "1:1") : "";
                  const linkHref = (theme.href && theme.href !== "/" && theme.href !== "#" && theme.href.trim() !== "")
                    ? theme.href
                    : `/packages?category=${encodeURIComponent(themeLabel)}`;

                  return (
                    <div key={theme.id || idx} className="flex-none w-[82px] md:w-[125px]">
                      <Link
                        href={linkHref}
                        onTouchStart={() => router.prefetch(linkHref)}
                        onMouseEnter={() => router.prefetch(linkHref)}
                        className="flex flex-col items-center gap-1.5 md:gap-2 group"
                      >
                        <div className="relative p-[1.5px] md:p-[2px] rounded-full flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#0D1B3E,#FFD700,#E1306C,#0D1B3E)] animate-[spin_4s_linear_infinite] opacity-0 group-hover:opacity-60 blur-lg transition-all duration-500 scale-125 -z-10" />
                          <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#0D1B3E,#FFD700,#E1306C,#0D1B3E)] animate-[spin_4s_linear_infinite] opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="relative w-16 h-16 md:w-28 md:h-28 rounded-full bg-white p-[2px] md:p-[3px] z-10 shadow-sm group-hover:shadow-xl transition-all duration-300">
                            <div className="w-full h-full rounded-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                              {finalImageUrl ? (
                                <Image
                                  src={finalImageUrl}
                                  alt={theme.label || theme.name || "Theme image"}
                                  fill
                                  sizes="(max-width: 768px) 64px, 120px"
                                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                              ) : (
                                <div className="text-slate-300">
                                  {ICON_MAP[theme.iconName] ? React.createElement(ICON_MAP[theme.iconName], { className: "w-6 h-6 md:w-8 md:h-8" }) : <Mountain className="w-6 h-6 md:w-8 md:h-8" />}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-center min-w-0 w-full">
                          <span
                            className="text-[9px] md:text-[11px] font-black text-primary uppercase group-hover:text-accent transition-colors text-center truncate w-full px-1"
                            style={{ fontFamily: "'Poppins', sans-serif" }}
                          >
                            {themeLabel}
                          </span>
                          <div className="flex flex-col items-center">
                            <span className="text-[7.5px] md:text-[9px] font-black text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                              {(theme.packageCount || 0) > 0 ? `${theme.packageCount} + Tours` : "Explore Tours"}
                            </span>
                            <span className="text-[7.5px] md:text-[9px] font-bold text-slate-600">
                              {theme.startingPrice ? `From Rs.${Number(theme.startingPrice).toLocaleString("en-IN")}` : "Best Deals"}
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
        </div>
      </section>
    </div>
  );
}

export function ThemeMarqueeSkeleton() {
  return (
    <div className="container mx-auto px-2 md:px-4 my-6">
      <section className="bg-white rounded-lg overflow-hidden border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] py-2">
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
        <div className="flex gap-1 md:gap-4 overflow-hidden px-2 md:px-6 pb-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex-none w-[82px] md:w-[125px] flex flex-col items-center gap-2">
              <div className="w-16 h-16 md:w-28 md:h-28 rounded-full bg-slate-100 animate-pulse" />
              <div className="h-3 w-14 bg-slate-100 animate-pulse rounded" />
              <div className="h-2 w-10 bg-slate-100 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}