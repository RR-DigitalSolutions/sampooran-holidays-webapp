"use client";

import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight, Info } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

interface SponsoredAd {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  tag?: string;
  ctaText?: string;
}

const PLACEHOLDER = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmMmY1Ii8+PC9zdmc+";

const DEFAULT_BANNER_ADS: SponsoredAd[] = [
  {
    id: 1,
    title: "Exclusive Himalayan Expedition",
    description: "Available with Easy EMI options starting from ₹3333/month. Pre-book now for limited slots.",
    imageUrl: PLACEHOLDER,
    link: "/packages/himalayan-expedition",
    tag: "LIMITED OFFER",
    ctaText: "Pre-book Now"
  },
  {
    id: 2,
    title: "Maldives Luxury Getaway",
    description: "Overwater villas, seaplane transfers & all-inclusive packages. Up to 40% OFF this season.",
    imageUrl: PLACEHOLDER,
    link: "/packages/maldives-luxury",
    tag: "BEST SELLER",
    ctaText: "Explore Now"
  },
  {
    id: 3,
    title: "Golden Triangle — India's Heritage",
    description: "Delhi, Agra & Jaipur in 6 nights. Expert guides, luxury hotels & seamless transfers.",
    imageUrl: PLACEHOLDER,
    link: "/packages/golden-triangle",
    tag: "TRENDING",
    ctaText: "Book Now"
  },
];

export function SponsoredAdsSection({
  bannerAds,
}: {
  /** Array of SPONSORED_BANNER offers from the CMS. Falls back to defaults if empty. */
  bannerAds?: SponsoredAd[];
  /** Legacy prop kept for backward-compat — ignored */
  smallAds?: any[];
  /** Legacy prop kept for backward-compat — ignored */
  bannerAd?: any;
}) {
  const ads = bannerAds && bannerAds.length > 0 ? bannerAds : DEFAULT_BANNER_ADS;

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, duration: 40 },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (!ads.length) return null;

  return (
    <section className="bg-slate-50 overflow-hidden">
      <div className="container mx-auto px-4">

        {/* Banner Carousel */}
        <div className="relative group/banner rounded-2xl overflow-hidden shadow-xl border border-slate-200">
          {/* Embla viewport */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {ads.map((ad) => (
                <div key={ad.id} className="flex-[0_0_100%] min-w-0">
                  <Link href={ad.link || "/"}>
                    <div className="relative aspect-[3/1] md:aspect-[8/1] w-full bg-slate-900 cursor-pointer">
                      <Image
                        src={ad.imageUrl}
                        alt={ad.title}
                        fill
                        className="object-cover opacity-90 group-hover/banner:scale-105 transition-transform duration-[2000ms]"
                        sizes="100vw"
                        priority
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />

                      {/* Text content — left */}
                      <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-14 text-white">
                        <div className="max-w-xl">
                          {ad.tag && (
                            <span className="inline-block bg-accent text-accent-foreground text-[8px] md:text-[10px] font-black px-2 py-0.5 md:px-3 md:py-1 rounded-full mb-2 md:mb-3 tracking-widest uppercase shadow-lg">
                              {ad.tag}
                            </span>
                          )}
                          <h3 className="text-lg md:text-3xl lg:text-4xl font-black mb-1 md:mb-2 leading-tight tracking-tight drop-shadow-lg">
                            {ad.title}
                          </h3>
                          <p className="text-white/80 text-[10px] md:text-sm font-medium max-w-[85%] md:max-w-md line-clamp-2 md:line-clamp-3 italic">
                            {ad.description}
                          </p>
                        </div>
                      </div>

                      {/* CTA — right (desktop only) */}
                      <div className="absolute right-8 md:right-14 top-1/2 -translate-y-1/2 hidden md:flex">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 px-7 py-5 rounded-2xl flex flex-col items-center gap-3 group-hover/banner:bg-white/20 transition-all">
                          <button className="bg-white text-primary font-black text-xs px-7 py-3 rounded-xl hover:bg-accent hover:text-accent-foreground transition-all flex items-center gap-2 shadow-xl whitespace-nowrap">
                            {ad.ctaText || "Explore Now"}
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* "Ad" watermark */}
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/10">
                        <span className="text-[9px] font-bold text-white/60 tracking-wider">Ad</span>
                        <Info className="w-2.5 h-2.5 text-white/40" />
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Prev / Next arrows — appear on hover */}
          <button
            onClick={scrollPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-black/60 transition-all z-10 opacity-0 group-hover/banner:opacity-100 -translate-x-1 group-hover/banner:translate-x-0 duration-200"
            aria-label="Previous ad"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-black/60 transition-all z-10 opacity-0 group-hover/banner:opacity-100 translate-x-1 group-hover/banner:translate-x-0 duration-200"
            aria-label="Next ad"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dot indicators — bottom-center */}
          {ads.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {ads.map((_, i) => (
                <button
                  key={i}
                  onClick={() => emblaApi?.scrollTo(i)}
                  className={`rounded-full transition-all duration-300 ${i === selectedIndex
                      ? "bg-accent w-6 h-2"
                      : "bg-white/50 hover:bg-white/80 w-2 h-2"
                    }`}
                  aria-label={`Go to ad ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
