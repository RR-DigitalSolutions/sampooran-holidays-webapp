"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useListTestimonials } from "@workspace/api-client-react";
import { PackageCard } from "@/components/PackageCard";
import { getApiUrl } from "@/lib/api-url";
import { validateImageUrl } from "@/lib/utils";
import { Star, Phone, Shield, Headphones, Award, Users, CheckCircle, ChevronRight, ChevronLeft, Search, Calendar, MapPin, Mountain, Waves, Sunset, TreePine, Heart, Zap, Globe, Camera, Coffee, Clock, ArrowRight, TrendingUp, Percent, Navigation, Sparkles, Building2, Truck, ShieldCheck, Handshake } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Fade from "embla-carousel-fade";
import PremiumSearchTabs from "@/components/PremiumSearchTabs";
import TopDestinations from "@/components/TopDestinations";
import { ThemeMarquee } from "@/components/ThemeMarquee";
import { OffersSection } from "@/components/OffersSection";
import { PopularPackagesCarousel } from "@/components/PopularPackagesCarousel";
import { InclusionsSection } from "@/components/InclusionsSection";
import { SponsoredAdsSection } from "@/components/SponsoredAdsSection";
import TrendingHotelsSection from "@/components/TrendingHotelsSection";
import ServiceVendorSection from "@/components/ServiceVendorSection";
import TransportFleetSection from "@/components/TransportFleetSection";
import { useSiteSettings } from "@/context/SiteSettingsContext";



// Icon mapping for dynamic categories
const ICON_MAP: Record<string, any> = {
  Mountain, Waves, Sunset, TreePine, Heart, Zap, Globe, Camera, Coffee, TrendingUp, Percent, Users, Star, Phone, Shield, Headphones, Award, CheckCircle, Search, Calendar, MapPin, Clock, ArrowRight, Navigation, Building2, Truck, Handshake
};



export default function HomeClient({ initialData }: { initialData?: any }) {
  const [heroIdx, setHeroIdx] = useState(0);
  const [config, setConfig] = useState<any>(initialData?.config || null);
  const [isConfigLoading, setIsConfigLoading] = useState(!initialData?.config);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const router = useRouter();

  // Ken Burns zoom refs — one per slide, restarted via rAF on slide change
  const zoomDivsRef = useRef<(HTMLDivElement | null)[]>([]);

  const pkgData = initialData?.pkgData || { packages: [] };
  const isPkgLoading = false;

  const trendingData = initialData?.trendingData || { packages: [] };
  const isTrendingLoading = false;

  const testimonialData = initialData?.testimonialData || { testimonials: [] };
  const isTestimonialLoading = false;

  useEffect(() => {
    // 1. Fetch Geolocation
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
          // Geolocation access denied, using default location
          // Default to New Delhi coordinates
          setCoords({ lat: 28.6139, lng: 77.2090 });
        }
      );
    } else {
      // Default to New Delhi coordinates
      setCoords({ lat: 28.6139, lng: 77.2090 });
    }
  }, []);

  useEffect(() => {
    // Client-side Config Fetch for real-time CMS sync - query the standard endpoint (served instantly from backend Redis cache)
    // and pass { cache: 'no-store' } to ensure the browser fetches the latest cache state from the server.
    const fetchConfig = async () => {
      setIsConfigLoading(true);
      try {
        const baseUrl = getApiUrl();
        const res = await fetch(`${baseUrl}/ota/home/config`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
        } else {
          console.error("Config fetch returned non-ok status:", res.status);
        }
      } catch (error) {
        console.error("Failed to fetch fresh config on client:", error);
      } finally {
        setIsConfigLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 25 }, [
    Autoplay({ delay: 5000, stopOnInteraction: false })
  ]);

  const [featuredRef, featuredApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
    breakpoints: {
      "(min-width: 768px)": { slidesToScroll: 2 },
      "(min-width: 1024px)": { slidesToScroll: 3 }
    }
  }, [Autoplay({ delay: 5000, stopOnInteraction: false })]);

  const [trendingRef, trendingApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
  }, [Autoplay({ delay: 4000, stopOnInteraction: false })]);

  const [slidesPerView, setSlidesPerView] = useState(1);

  useEffect(() => {
    const updateSlides = () => {
      if (window.innerWidth >= 1024) setSlidesPerView(3);
      else if (window.innerWidth >= 768) setSlidesPerView(2);
      else setSlidesPerView(1);
    };
    updateSlides();
    window.addEventListener("resize", updateSlides);
    return () => window.removeEventListener("resize", updateSlides);
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      const idx = emblaApi.selectedScrollSnap();
      setHeroIdx(idx);

      const el = zoomDivsRef.current[idx];
      if (el) {
        el.classList.remove("hero-slide");
        void el.offsetWidth;
        el.classList.add("hero-slide");
      }
    };
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi]);

  const slides = useMemo(() => {
    return config?.slides?.filter((s: any) => s.isActive) || [];
  }, [config]);

  const categories = useMemo(() => {
    let list = [...(config?.categories?.filter((c: any) => c.isActive) || [])];

    // Normalize snake_case to camelCase for categories
    list = list.map((c: any) => ({
      ...c,
      imageUrl: c.imageUrl || c.image_url
    }));

    if (config?.themes?.length) {
      // Map themes to category format if they don't already exist in categories
      const themeCats = config.themes.map((t: any) => ({
        id: t.id + 10000, // Large offset to avoid ID conflict
        label: t.name,
        iconName: "Globe", // Default icon
        imageUrl: t.imageUrl || t.image_url,
        href: `/${t.slug}-tour-packages`,
        packageCount: t.packageCount,
        startingPrice: t.startingPrice,
        isActive: true
      }));

      // Merge but avoid duplicates by label
      const existingLabels = new Set(list.map((c: any) => c.label.toLowerCase()));
      themeCats.forEach((tc: any) => {
        if (!existingLabels.has(tc.label.toLowerCase())) {
          list.push(tc);
        }
      });
    }

    return list;
  }, [config]);

  const sections = useMemo(() => {
    const rawSections = Array.isArray(config?.sections)
      ? config.sections.filter((s: any) => s.isActive)
      : [];

    const defaultSections = [
      { sectionType: "HERO" },
      { sectionType: "STATS" },
      { sectionType: "OFFERS" },
      { sectionType: "SPONSORED_ADS" },
      { sectionType: "CATEGORIES" },
      { sectionType: "TRENDING_HOTELS" },
      { sectionType: "TOP_DESTINATIONS" },
      { sectionType: "FEATURED_PACKAGES" },
      { sectionType: "INTERNATIONAL" },
      { sectionType: "TRANSPORT" },
      { sectionType: "TESTIMONIALS" },
      { sectionType: "B2B" }
    ];

    const list = rawSections.length > 0 ? rawSections : defaultSections;

    const uniqueSections = new Map<string, any>();
    for (const section of list) {
      if (!uniqueSections.has(section.sectionType)) {
        uniqueSections.set(section.sectionType, section);
      }
    }
    const dedupedSections = Array.from(uniqueSections.values());

    // Ensure OFFERS and SPONSORED_ADS are placed just above CATEGORIES
    let offersObj = dedupedSections.find((s: any) => s.sectionType === "OFFERS");
    let sponsoredObj = dedupedSections.find((s: any) => s.sectionType === "SPONSORED_ADS");

    if (!offersObj) {
      offersObj = { sectionType: "OFFERS", title: "Special Offers", subtitle: "Exclusive Deals" };
    }
    if (!sponsoredObj) {
      sponsoredObj = {
        sectionType: "SPONSORED_ADS",
        title: "Exclusive Sponsored Deals",
        subtitle: "Handpicked Collections"
      };
    }

    // Filter out OFFERS and SPONSORED_ADS from their current locations
    let reordered = dedupedSections.filter(
      (s: any) => s.sectionType !== "OFFERS" && s.sectionType !== "SPONSORED_ADS"
    );

    // Find the index of CATEGORIES
    const categoriesIdx = reordered.findIndex((s: any) => s.sectionType === "CATEGORIES");
    if (categoriesIdx !== -1) {
      // Insert OFFERS and SPONSORED_ADS just above CATEGORIES
      reordered.splice(categoriesIdx, 0, offersObj, sponsoredObj);
    } else {
      // Fallback: put them at index 2 (just after stats)
      reordered.splice(2, 0, offersObj, sponsoredObj);
    }

    // Ensure TRENDING_HOTELS is placed below FEATURED_PACKAGES
    let trendingHotelsObj = reordered.find((s: any) => s.sectionType === "TRENDING_HOTELS");

    if (!trendingHotelsObj) {
      trendingHotelsObj = { sectionType: "TRENDING_HOTELS" };
    }

    reordered = reordered.filter(
      (s: any) => s.sectionType !== "TRENDING_HOTELS" && s.sectionType !== "NEARBY_HOTELS"
    );

    const featuredIdx = reordered.findIndex((s: any) => s.sectionType === "FEATURED_PACKAGES");
    if (featuredIdx !== -1) {
      reordered.splice(featuredIdx + 1, 0, trendingHotelsObj);
    } else {
      reordered.splice(6, 0, trendingHotelsObj);
    }

    // Ensure the vendor CTA section is always available on the homepage.
    if (!reordered.some((s: any) => s.sectionType === "VENDOR_CTA")) {
      const insertIdx = reordered.findIndex((s: any) => s.sectionType === "B2B");
      const position = insertIdx !== -1 ? insertIdx : reordered.length;
      reordered.splice(position, 0, { sectionType: "VENDOR_CTA" });
    }

    return reordered;
  }, [config]);

  const offers = config?.offers || [];
  const packages = pkgData?.packages || initialData?.pkgData?.packages || [];
  const trending = trendingData?.packages || initialData?.trendingData?.packages || [];
  const trendingHotels = initialData?.trendingHotelsData || [];
  const transport = initialData?.transportData || [];
  const testimonials = testimonialData?.testimonials?.length ? testimonialData.testimonials : (initialData?.testimonialData?.testimonials || []);

  const { partner_network } = useSiteSettings();

  const serviceVendorCards = useMemo(() => {
    const list = partner_network || [];
    return list.map((card) => {
      let IconComponent = Handshake; // fallback
      if (card.iconName && ICON_MAP[card.iconName]) {
        IconComponent = ICON_MAP[card.iconName];
      } else if (card.iconName === "Building2") {
        IconComponent = Building2;
      } else if (card.iconName === "Truck") {
        IconComponent = Truck;
      }
      return {
        title: card.title,
        subtitle: card.subtitle,
        detail: card.detail,
        tag: card.tag,
        Icon: IconComponent,
        imageSrc: card.imageSrc,
        imageAlt: card.imageAlt,
        ctaLabel: card.ctaLabel,
        ctaHref: card.ctaHref,
        secondaryCtaLabel: card.secondaryCtaLabel,
        secondaryCtaHref: card.secondaryCtaHref
      };
    });
  }, [partner_network]);

  let serviceSectionRendered = false;

  return (
    <>
      {sections.map((section: any, idx: number) => {
        switch (section.sectionType) {
          case "HERO":
            return (
              <div key={idx} className="relative bg-gradient-to-r from-primary via-[#0A1931] to-primary pb-3 sm:pb-4 md:pb-6 mb-0">
                <section className="relative h-[38vh] xs:h-[44vh] sm:h-[55vh] md:h-[80vh] lg:h-screen min-h-[320px] md:min-h-[600px] max-h-[960px] flex flex-col justify-center overflow-hidden">
                  <div className="absolute inset-0 z-0 overflow-hidden" ref={emblaRef}>
                    <div className="flex h-full w-full">
                      {slides.map((slide: any, i: number) => (
                        <div key={i} className="relative flex-[0_0_100%] min-w-0 h-full overflow-hidden">
                          {slide.videoUrl ? (
                            <video src={slide.videoUrl} autoPlay muted loop playsInline className="w-full h-full object-cover select-none pointer-events-none" />
                          ) : (
                            <div
                              ref={el => { zoomDivsRef.current[i] = el; }}
                              className="absolute inset-0 transition-transform duration-[8s] ease-out scale-105 group-hover:scale-110"
                            >
                              <Image
                                src={validateImageUrl(slide.imageUrl || slide.image_url, 1600, 900, "16:9")}
                                alt={slide.title || "Slide image"}
                                fill
                                className="object-cover select-none pointer-events-none"
                                priority={i === 0}
                                sizes="100vw"
                                loading={i === 0 ? "eager" : "lazy"}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/30 to-black/85 z-[1] pointer-events-none" />
                  
                  {/* Hero Text Content with catchy animated transitions */}
                  <div className="relative z-10 container mx-auto px-4 text-center text-white pt-14 md:pt-24 mt-2 md:mt-0">
                    <div key={`hero-text-${heroIdx}`} className="transition-all duration-700 ease-out animate-in fade-in slide-in-from-bottom-5">
                      <div className="inline-flex items-center gap-1.5 bg-accent/90 backdrop-blur-md text-primary text-[10px] md:text-xs font-black px-3.5 py-1 md:px-5 md:py-1.5 rounded-full mb-2 md:mb-6 shadow-xl uppercase tracking-wider">
                        <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-primary animate-pulse" />
                        {slides[heroIdx]?.tag || "Explore"} Destinations
                      </div>
                      <h1 className="text-2xl xs:text-3xl md:text-7xl lg:text-8xl font-serif font-black mb-2 md:mb-4 leading-[1.1] tracking-tight text-white drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)] px-2">
                        {slides[heroIdx]?.title}
                      </h1>
                      <p className="text-xs xs:text-sm md:text-xl text-white/90 mb-4 md:mb-8 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-md line-clamp-2 md:line-clamp-none px-4">
                        {slides[heroIdx]?.subtitle}
                      </p>
                    </div>
                    <div className="mt-6 hidden md:flex flex-wrap gap-3 justify-center items-center pb-4">
                      <span className="text-[11px] font-bold text-white/60 uppercase tracking-widest">Popular:</span>
                      {["Manali Package", "Ladakh Tour", "Kashmir Honeymoon", "Spiti Expedition", "Family Tour"].map(q => (
                        <button key={q} onClick={() => router.push(`/packages?q=${encodeURIComponent(q)}`)} className="bg-white/10 border border-white/20 text-white text-xs px-5 py-2 rounded-full hover:bg-accent hover:text-primary hover:border-accent transition-all duration-300 backdrop-blur-md font-bold tracking-wide shadow-md">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="absolute bottom-14 xs:bottom-18 sm:bottom-24 md:bottom-8 left-0 right-0 flex justify-center gap-2 z-10">
                    {slides.map((_: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => emblaApi?.scrollTo(i)}
                        className={`transition-all duration-300 rounded-full ${i === heroIdx ? "w-8 h-2 bg-accent shadow-[0_0_10px_rgba(245,166,35,0.8)]" : "w-2 h-2 bg-white/50 hover:bg-white/80"}`}
                        aria-label={`Go to slide ${i + 1}`}
                        title={`Slide ${i + 1}`}
                      />
                    ))}
                  </div>
                </section>
                
                {/* Search Engine overlapping bottom transition */}
                <div className="relative z-20 -mt-10 xs:-mt-14 sm:-mt-20 md:-mt-28 lg:-mt-32 container mx-auto px-4">
                  <PremiumSearchTabs />
                </div>
              </div>
            );

          case "TRENDING_HOTELS":
            return <TrendingHotelsSection key={idx} hotels={trendingHotels} />;
          case "TRANSPORT":
            return <TransportFleetSection key={idx} vehicles={transport} />;
          case "VENDOR_CTA":
          case "B2B":
            if (serviceSectionRendered) return null;
            serviceSectionRendered = true;
            return (
              <ServiceVendorSection
                key={idx}
                badge="Partner Network"
                title={section.title || "Partner With Sampooran Holidays"}
                description="Explore hotel, transport, and B2B partner services in one compact slider. Swipe each card to see tailored register and login actions for every service."
                cards={serviceVendorCards}
              />
            );
          case "STATS":
            return (
              <div key={idx} className="bg-gradient-to-r from-primary via-[#0A1931] to-primary text-white relative -mt-[1px] z-10">
                <div className="container mx-auto px-2 xs:px-4">
                  <div className="grid grid-cols-4 divide-x divide-white/10">
                    {[["12+", "Years Experience"], ["5,000+", "Happy Travelers"], ["120+", "Tour Packages"], ["500+", "Travel Agent Partners"]].map(([v, l]) => (
                      <div key={l} className="py-1 px-0.5 md:py-1.5 text-center">
                        <div className="text-xs xs:text-sm md:text-2xl font-bold text-accent">{v}</div>
                        <div className="text-white/70 text-[7.5px] xs:text-[9px] md:text-[10px] leading-tight mt-0">{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );

          case "OFFERS":
            return (
              <OffersSection
                key={idx}
                offers={offers}
                title={section.title}
                subtitle={section.subtitle}
              />
            );

          case "CATEGORIES":
            return (
              <ThemeMarquee
                key={idx}
                themes={categories}
                title={section.title}
                subtitle={section.subtitle}
                loading={isConfigLoading}
              />
            );



          case "TOP_DESTINATIONS":
            return <TopDestinations key={idx} initialData={initialData?.topDestinations} />;

          case "FEATURED_PACKAGES":
            return <PopularPackagesCarousel key={idx} packages={trending.length ? trending : packages} loading={isTrendingLoading || isPkgLoading} />;

          case "SPONSORED_ADS": {
            const bannerAds = offers
              .filter((o: any) => o.category === "SPONSORED_BANNER")
              .map((o: any) => ({ ...o, link: o.ctaLink, tag: o.termsAndConditions, ctaText: o.ctaText }));
            return (
              <SponsoredAdsSection
                key={idx}
                bannerAds={bannerAds.length ? bannerAds : undefined}
              />
            );
          }

          case "TRENDING_PACKAGES":
            return null; // Removed — trending packages are now shown in FEATURED_PACKAGES section

          case "INTERNATIONAL":
            return null;
          case "WHY_CHOOSE_US":
            return null; // Handled in Layout.tsx

          case "TESTIMONIALS":
            return testimonials.length > 0 && (
              <section key={idx} className="py-16 bg-gradient-to-b from-primary/5 to-white">
                <div className="container mx-auto px-4">
                  <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className="h-[2px] w-8 bg-accent" />
                      <p className="text-accent font-bold text-xs uppercase tracking-[0.2em]">Real Experiences</p>
                      <span className="h-[2px] w-8 bg-accent" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-primary font-serif">What Our <span className="text-accent italic">Travelers</span> Say</h2>
                    <p className="text-slate-400 mt-3 text-sm max-w-xl mx-auto">Join thousands of happy travelers who've experienced the Sampooran difference.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {testimonials.slice(0, 3).map((t: any, i: number) => (
                      <div key={t.id} className="relative bg-white p-7 rounded-lg border border-slate-100 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all text-left group">
                        <div className="absolute -top-4 left-7">
                          <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="text-accent font-black text-xl leading-none">"</span>
                          </div>
                        </div>
                        <div className="flex gap-1 mb-4 text-accent pt-4">
                          {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-current" />)}
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-4 italic">"{t.review}"</p>
                        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-black text-white text-sm shadow-md">
                            {t.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-primary text-sm">{t.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t.destination || "Happy Traveler"}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );

          case "INCLUSIONS":
            return null; // Handled in Layout.tsx

          case "B2B":
            return null;

          default:
            return null;
        }
      })}

      {/* Removed NearbyHotels section */}
    </>
  );
}
