"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useListTestimonials } from "@workspace/api-client-react";
import { PackageCard } from "@/components/PackageCard";
import { getApiUrl } from "@/lib/api-url";
import { Star, Phone, Shield, Headphones, Award, Users, CheckCircle, ChevronRight, ChevronLeft, Search, Calendar, MapPin, Mountain, Waves, Sunset, TreePine, Heart, Zap, Globe, Camera, Coffee, Clock, ArrowRight, TrendingUp, Percent, Navigation, Sparkles } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Fade from "embla-carousel-fade";
import PremiumSearchTabs from "@/components/PremiumSearchTabs";
import dynamic from "next/dynamic";

const TopDestinations = dynamic(() => import("@/components/TopDestinations"), { ssr: true });
const ThemeMarquee = dynamic(() => import("@/components/ThemeMarquee").then(mod => mod.ThemeMarquee), { ssr: true });
const OffersSection = dynamic(() => import("@/components/OffersSection").then(mod => mod.OffersSection), { ssr: true });
const PopularPackagesCarousel = dynamic(() => import("@/components/PopularPackagesCarousel").then(mod => mod.PopularPackagesCarousel), { ssr: true });
const InclusionsSection = dynamic(() => import("@/components/InclusionsSection").then(mod => mod.InclusionsSection), { ssr: true });
const SponsoredAdsSection = dynamic(() => import("@/components/SponsoredAdsSection").then(mod => mod.SponsoredAdsSection), { ssr: true });
const TrendingHotelsSection = dynamic(() => import("@/components/TrendingHotelsSection"), { ssr: true });
const VendorCTA = dynamic(() => import("@/components/VendorCTA"), { ssr: true });



// Icon mapping for dynamic categories
const ICON_MAP: Record<string, any> = {
  Mountain, Waves, Sunset, TreePine, Heart, Zap, Globe, Camera, Coffee, TrendingUp, Percent, Users, Star, Phone, Shield, Headphones, Award, CheckCircle, Search, Calendar, MapPin, Clock, ArrowRight, Navigation
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
    if (initialData?.config) return;

    // 2. Client-side Config Fetch for real-time CMS sync
    const fetchConfig = async () => {
      setIsConfigLoading(true);
      try {
        const baseUrl = getApiUrl();
        const res = await fetch(`${baseUrl}/ota/home/config`);
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
  }, [initialData?.config]);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 60 }, [
    Autoplay({ delay: 6000, stopOnInteraction: false }),
    Fade()
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
        el.style.animation = 'none';
        el.style.transform = 'scale(1)';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.animation = '';
            el.style.transform = '';
            el.style.animationName = 'heroKenBurns';
            el.style.animationDuration = '10000ms';
            el.style.animationTimingFunction = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            el.style.animationFillMode = 'both';
            el.style.animationIterationCount = '1';
          });
        });
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
    let list = config?.sections?.filter((s: any) => s.isActive) || [];

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
      { sectionType: "VENDOR_CTA" },
      { sectionType: "B2B" }
    ];

    if (list.length === 0) return defaultSections;

    // Ensure SPONSORED_ADS is present if it's not in the CMS list
    if (!list.some((s: any) => s.sectionType === "SPONSORED_ADS")) {
      const offersIdx = list.findIndex((s: any) => s.sectionType === "OFFERS");
      const insertIdx = offersIdx !== -1 ? offersIdx + 1 : 2;
      list.splice(insertIdx, 0, {
        sectionType: "SPONSORED_ADS",
        title: "Exclusive Sponsored Deals",
        subtitle: "Handpicked Collections"
      });
    }

    return list;
  }, [config]);

  const offers = config?.offers || [];
  const packages = pkgData?.packages || initialData?.pkgData?.packages || [];
  const trending = trendingData?.packages || initialData?.trendingData?.packages || [];
  const trendingHotels = initialData?.trendingHotelsData || [];
  const testimonials = testimonialData?.testimonials?.length ? testimonialData.testimonials : (initialData?.testimonialData?.testimonials || []);

  return (
    <>
      {sections.filter((s: any) => s.sectionType !== "NEARBY_HOTELS").map((section: any, idx: number) => {
        switch (section.sectionType) {
          case "HERO":
            return (
              <section key={idx} className="relative h-[75vh] min-h-[520px] md:h-screen md:min-h-[600px] max-h-[960px] flex flex-col justify-center overflow-hidden">
                <div className="absolute inset-0 z-0 overflow-hidden" ref={emblaRef}>
                  <div className="flex h-full w-full">
                    {slides.map((slide: any, i: number) => (
                      <div key={i} className="relative flex-[0_0_100%] min-w-0 h-full">
                        {slide.videoUrl ? (
                          <video src={slide.videoUrl} autoPlay muted loop playsInline className="w-full h-full object-cover select-none pointer-events-none" />
                        ) : (
                          <div
                            ref={el => { zoomDivsRef.current[i] = el; }}
                            className="absolute inset-0"
                            style={{
                              animationName: 'heroKenBurns',
                              animationDuration: '10000ms',
                              animationTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                              animationFillMode: 'both',
                              animationIterationCount: '1',
                              willChange: 'transform',
                            }}
                          >
                            <Image
                              src={slide.imageUrl || slide.image_url}
                              alt={slide.title}
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
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/25 to-black/80 z-[1] pointer-events-none" />
                <div className="relative z-10 container mx-auto px-4 text-center text-white pt-24 md:pt-32 mt-8 md:mt-0">
                  <div className="inline-block bg-accent text-accent-foreground text-[10px] md:text-xs font-bold px-3 py-1 md:px-4 md:py-1.5 rounded-full mb-3 md:mb-6 shadow-lg">
                    {slides[heroIdx]?.tag || "Explore"} Destinations
                  </div>
                  <h1 className="text-3xl md:text-7xl lg:text-8xl font-serif font-bold mb-2 md:mb-4 leading-tight drop-shadow-2xl animate-in slide-in-from-bottom-6 px-2">
                    {slides[heroIdx]?.title}
                  </h1>
                  <p className="text-sm md:text-xl text-white/85 mb-6 md:mb-10 max-w-2xl mx-auto font-light leading-relaxed animate-in slide-in-from-bottom-8 line-clamp-2 md:line-clamp-none">
                    {slides[heroIdx]?.subtitle}
                  </p>
                  <div className="relative z-20">
                    <PremiumSearchTabs />
                  </div>
                  <div className="mt-8 hidden md:flex flex-wrap gap-3 justify-center items-center pb-4">
                    <span className="text-[11px] font-bold text-white/60">Popular:</span>
                    {["Manali Package", "Ladakh Tour", "Kashmir Honeymoon", "Spiti Expedition", "Family Tour"].map(q => (
                      <button key={q} onClick={() => router.push(`/packages?q=${encodeURIComponent(q)}`)} className="bg-white/10 border border-white/20 text-white text-xs px-5 py-2 rounded-full hover:bg-white/20 hover:border-white/40 transition-all backdrop-blur-md font-light tracking-wide">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
                <style>{`
                  @keyframes heroKenBurns {
                    from { transform: scale(1.00); }
                    to   { transform: scale(1.10); }
                  }
                `}</style>

                <div className="absolute bottom-4 md:bottom-8 left-0 right-0 flex justify-center gap-2 z-10">
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
            );

          case "TRENDING_HOTELS":
            return <TrendingHotelsSection key={idx} hotels={trendingHotels} />;
          case "VENDOR_CTA":
            return <VendorCTA key={idx} />;
          case "STATS":
            return (
              <div key={idx} className="bg-gradient-to-r from-primary via-[#0A1931] to-primary text-white">
                <div className="container mx-auto px-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
                    {[["12+", "Years Experience"], ["5,000+", "Happy Travelers"], ["120+", "Tour Packages"], ["500+", "Travel Agent Partners"]].map(([v, l]) => (
                      <div key={l} className="py-2 text-center">
                        <div className="text-2xl md:text-3xl font-bold text-accent">{v}</div>
                        <div className="text-white/70 text-xs mt-0.5">{l}</div>
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

          case "NEARBY_HOTELS":
            return null; // Removed section

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
          case "TRANSPORT":
            return (
              <section key={idx} className="pt-4 pb-4 bg-white">
                <div className="container mx-auto px-4">
                  <div className="rounded-lg bg-gradient-to-r from-primary to-[#163175] overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                      <div className="p-10 md:p-14 flex flex-col justify-center text-white">
                        <p className="text-accent font-bold text-sm mb-3">{section.subtitle || "Reliable Fleet"}</p>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 font-['Raleway',sans-serif]">{section.title || "Transport Services"}</h2>
                        <p className="text-white/70 mb-6 italic">"Expert mountain drivers, AC Taxis, and luxury coaches for Himalayan road trips."</p>
                        <div className="flex gap-4">
                          <Link href="/transport"><button className="bg-accent text-accent-foreground rounded-xl px-8 py-4 font-bold hover:scale-105 transition-all shadow-lg shadow-accent/20">Book Transport</button></Link>
                          <a href="tel:+918595513009"><button className="border border-white/30 text-white rounded-xl px-8 py-4 font-bold hover:bg-white/10 transition-all">Call Expert</button></a>
                        </div>
                      </div>
                      <div className="hidden lg:grid grid-cols-2 gap-3 p-6 self-center">
                        {["https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400", "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400", "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400", "https://images.unsplash.com/photo-1557223562-6c77ef16210f?w=400"].map((src, i) => (
                          <div key={i} className="relative h-36 w-full rounded-xl overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                            <Image src={src} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 200px" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );

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
                    <h2 className="text-3xl md:text-4xl font-bold text-primary font-['Raleway',sans-serif]">What Our <span className="text-accent italic">Travelers</span> Say</h2>
                    <p className="text-slate-400 mt-3 text-sm max-w-xl mx-auto">Join thousands of happy travelers who've experienced the Sampooran difference.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {testimonials.slice(0, 3).map((t: any, i: number) => (
                      <div key={t.id} className="relative bg-white p-7 rounded-3xl border border-slate-100 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all text-left group">
                        <div className="absolute -top-4 left-7">
                          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
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
            return (
              <div key={idx} className="container mx-auto px-2 md:px-4 mt-6 mb-2 md:my-6">
                <section className="py-10 md:py-12 bg-primary relative overflow-hidden rounded-[1rem] shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
                  <div className="px-4 md:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                      <div className="text-white">
                        <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 px-4 py-1.5 rounded-full mb-4">
                          <Sparkles className="w-4 h-4 text-accent" />
                          <span className="text-accent text-xs font-black uppercase tracking-widest">B2B Partnership</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 font-['Raleway',sans-serif]">Are You a <span className="text-accent">Travel Agent</span>?</h2>
                        <p className="text-white/70 mb-8 leading-relaxed">Join our B2B network and unlock exclusive net rates, dedicated booking support, and marketing tools to grow your travel business.</p>
                        <div className="flex flex-wrap gap-4">
                          <Link href="/b2b"><button className="bg-accent text-primary rounded-xl px-8 py-3 font-bold hover:scale-105 transition-all shadow-xl shadow-accent/30">Register Now</button></Link>
                          <a href="tel:+918595513009"><button className="border border-white/30 text-white rounded-xl px-8 py-3 font-bold hover:bg-white/10 transition-all">Call Us</button></a>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {[["500+", "B2B Partners", "globe"], ["₹0", "Registration Fee", "check"], ["24/7", "Dedicated Support", "headphone"], ["Best", "Net Rates", "tag"]].map(([val, label]) => (
                          <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center hover:bg-white/10 transition-all">
                            <div className="text-2xl font-black text-accent mb-1">{val}</div>
                            <div className="text-white/70 text-xs font-bold uppercase tracking-wider">{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            );

          default:
            return null;
        }
      })}

      {/* Removed NearbyHotels section */}
    </>
  );
}
