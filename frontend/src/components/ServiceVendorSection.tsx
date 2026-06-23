"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Building2, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, validateImageUrl } from "@/lib/utils";

export type ServiceVendorCard = {
  title: string;
  subtitle: string;
  detail: string;
  tag?: string;
  Icon?: typeof ShieldCheck;
  imageSrc: string;
  imageAlt: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
};

export interface ServiceVendorSectionProps {
  badge: string;
  title: string;
  description: string;
  cards: ServiceVendorCard[];
}

const THEME_STYLE = {
  accent: "text-[#2b7cd3]",
  bg: "bg-gradient-to-r from-slate-950 via-slate-900 to-[#11264d]",
  cardBg: "bg-white/95",
  button: "bg-[#2b7cd3] hover:bg-[#3f8ee0] text-white"
};

export default function ServiceVendorSection({ badge, title, description, cards }: ServiceVendorSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeCard = cards[activeIndex];
  const themeStyle = THEME_STYLE;
  const autoSlideRef = useRef<number | null>(null);

  useEffect(() => {
    autoSlideRef.current = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % cards.length);
    }, 5500);

    return () => {
      if (autoSlideRef.current) {
        window.clearInterval(autoSlideRef.current);
      }
    };
  }, [cards.length]);

  return (
    <section className={cn("py-4 md:py-5", themeStyle.bg)}>
      <div className="container mx-auto px-3 lg:px-4">
        <div className="rounded-[1.75rem] overflow-hidden border border-white/10 bg-slate-950/95 shadow-[0_24px_50px_rgba(15,23,42,0.28)]">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr] items-center p-4 md:p-5">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/80 mb-2">
                <span className={themeStyle.accent}>{badge}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-serif font-black tracking-tight leading-tight mb-2">{title}</h2>
              <p className="text-sm text-slate-200/90 leading-6 mb-4 max-w-xl">{description}</p>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="rounded-[1.5rem] border border-white/10 bg-slate-900/80 p-4 shadow-[0_18px_35px_rgba(15,23,42,0.2)]"
                >
                  <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400 mb-2">{activeCard.subtitle}</p>
                  <div className="text-2xl md:text-[1.85rem] font-serif font-semibold text-white leading-tight mb-2">{activeCard.title}</div>
                  <p className="text-sm text-slate-300 leading-6 mb-3">{activeCard.detail}</p>
                  <div className="flex flex-wrap gap-2">
                    <Link href={activeCard.ctaHref} className={cn("inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition duration-200 shadow-lg shadow-black/20", themeStyle.button)}>
                      {activeCard.ctaLabel}
                    </Link>
                    <Link href={activeCard.secondaryCtaHref} className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 transition duration-200 hover:bg-white/15">
                      {activeCard.secondaryCtaLabel}
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-900/80 h-[240px] sm:h-[280px] md:h-[320px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-black/25 via-transparent to-black/55" />
                  <div className="relative h-full w-full">
                    <Image
                      src={validateImageUrl(activeCard.imageSrc, 1200, 800, "16:9")}
                      alt={activeCard.imageAlt || activeCard.title || "Vendor card image"}
                      fill
                      sizes="(max-width: 768px) 100vw, 90vw"
                      className="object-cover"
                    />
                  </div>

                  {/* Navigation Arrows */}
                  <button
                    onClick={() => setActiveIndex((prev) => (prev - 1 + cards.length) % cards.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-all duration-200 shadow-lg"
                    aria-label="Previous vendor"
                    title="Previous vendor"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setActiveIndex((prev) => (prev + 1) % cards.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-all duration-200 shadow-lg"
                    aria-label="Next vendor"
                    title="Next vendor"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  {/* Indicator Dots */}
                  <div className="absolute top-3 right-3 z-10 flex gap-1">
                    {cards.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveIndex(index)}
                        className={cn(
                          "h-2 rounded-full transition-all duration-300",
                          index === activeIndex
                            ? "w-6 bg-accent shadow-lg"
                            : "w-2 bg-white/40 hover:bg-white/60"
                        )}
                        aria-label={`Vendor ${index + 1}`}
                        title={`Vendor ${index + 1}`}
                      />
                    ))}
                  </div>

                  <div className="absolute inset-x-4 bottom-4 rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-4 shadow-xl backdrop-blur-xl">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.35em] text-slate-300">{activeCard.tag || activeCard.subtitle}</p>
                        <p className="text-sm font-semibold text-white mt-1">{activeCard.title}</p>
                      </div>
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-3xl bg-white/10 text-white shadow-sm">
                        {(() => {
                          const OverlayIcon = activeCard.Icon || ShieldCheck;
                          return <OverlayIcon className="h-5 w-5" />;
                        })()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
