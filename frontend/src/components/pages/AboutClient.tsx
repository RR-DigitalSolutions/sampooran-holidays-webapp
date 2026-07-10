"use client";

import Link from "next/link";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { useState, useEffect, useRef } from "react";
import {
  Phone, Mail, MapPin, ArrowRight, Compass, Mountain,
  Shield, Plane, Leaf, Globe2,
  Sparkles, Star, TreePine, Wind, Heart, 
  CheckCircle, Network, Handshake, Clock, ChevronRight,
} from "lucide-react";

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCount({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const step = Math.ceil(target / (1800 / 16));
          let current = 0;
          const timer = setInterval(() => {
            current = Math.min(current + step, target);
            setCount(current);
            if (current >= target) clearInterval(timer);
          }, 16);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Office Badge ─────────────────────────────────────────────────────────────
function OfficeBadge({
  city,
  type,
  isHQ = false,
}: {
  city: string;
  type: string;
  isHQ?: boolean;
}) {
  return (
    <div
      className={`relative flex items-center gap-2.5 px-3 py-3 rounded-2xl border transition-all duration-300 cursor-default ${
        isHQ
          ? "bg-gradient-to-br from-[#1B3A6B] to-[#2a519b] border-[#1B3A6B]/30 text-white shadow-md shadow-[#1B3A6B]/20"
          : "bg-white border-slate-100 shadow-sm hover:border-primary/20 hover:shadow-md active:scale-95"
      }`}
    >
      {isHQ && (
        <div className="absolute -top-1.5 -right-1.5 bg-[#F5A623] text-[#0B1528] text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full shadow">
          HQ
        </div>
      )}
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
          isHQ ? "bg-white/15" : "bg-primary/8"
        }`}
      >
        <MapPin className={`w-3.5 h-3.5 ${isHQ ? "text-[#F5A623]" : "text-primary"}`} />
      </div>
      <div className="min-w-0">
        <p
          className={`font-black text-xs leading-tight truncate ${
            isHQ ? "text-white" : "text-slate-800"
          }`}
        >
          {city}
        </p>
        <p
          className={`text-[9px] font-semibold uppercase tracking-wider mt-0.5 ${
            isHQ ? "text-white/60" : "text-slate-400"
          }`}
        >
          {type}
        </p>
      </div>
    </div>
  );
}

// ─── Model Card ───────────────────────────────────────────────────────────────
function ModelCard({
  icon: Icon,
  title,
  description,
  gradient,
}: {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="group flex gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-300">
      <div
        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h3 className="font-black text-slate-800 text-sm mb-1 leading-tight">{title}</h3>
        <p className="text-slate-500 text-xs leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ─── Eco Card ─────────────────────────────────────────────────────────────────
function EcoCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<any>;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 active:scale-[0.98] transition-all">
      <div className="w-9 h-9 rounded-xl bg-emerald-400/20 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-emerald-300" />
      </div>
      <div className="min-w-0">
        <p className="font-bold text-white text-sm mb-0.5">{title}</p>
        <p className="text-white/60 text-xs leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 mb-3">
      <div className="w-5 h-0.5 bg-[#F5A623] rounded-full" />
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
        {children}
      </span>
      <div className="w-5 h-0.5 bg-[#F5A623] rounded-full" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function About() {
  const s = useSiteSettings();
  const about = s.about_content;
  const currentYear = new Date().getFullYear();

  const whyPoints =
    about.whyChooseUs && about.whyChooseUs.length > 0
      ? about.whyChooseUs
      : [
          {
            title: "Quality Over Numbers",
            description:
              "Every itinerary is crafted with care. We don't chase volume — we chase perfect experiences.",
          },
          {
            title: "24/7 Travel Support",
            description:
              "Round-the-clock assistance — before your trip, during it, and after. We never leave you alone.",
          },
          {
            title: "Genuine Local Experience",
            description:
              "We partner with local DMCs and guides to deliver authentic moments at every destination.",
          },
          {
            title: "Safe, Vetted Travel",
            description:
              "Every route, partner, and destination is vetted for safety, reliability and quality.",
          },
        ];

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════ HERO */}
      <div className="relative flex flex-col justify-center overflow-hidden bg-gradient-to-br from-[#050d1a] via-[#0d1f3c] to-[#0B1528]"
        style={{ minHeight: "100svh" }}>

        {/* Mountain SVG */}
        <div className="absolute inset-x-0 bottom-0 pointer-events-none select-none">
          <svg viewBox="0 0 1440 280" preserveAspectRatio="none" className="w-full"
            style={{ height: "clamp(120px, 28vw, 260px)" }}>
            <path fill="#0B1528" opacity="0.95"
              d="M0,280 L0,170 L180,65 L320,140 L460,50 L600,160 L730,30 L880,120 L1010,20 L1180,130 L1340,55 L1440,90 L1440,280 Z" />
            <path fill="#1B3A6B" opacity="0.4"
              d="M0,280 L0,210 L140,115 L300,180 L430,90 L570,190 L700,75 L850,165 L990,60 L1150,155 L1310,80 L1440,120 L1440,280 Z" />
          </svg>
        </div>

        {/* Glowing orbs — hidden on small screens for perf */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-600/12 blur-[80px] pointer-events-none hidden sm:block" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-[#F5A623]/8 blur-[60px] pointer-events-none hidden sm:block" />

        {/* Floating dots */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="absolute w-1 h-1 rounded-full bg-[#F5A623]/50 animate-pulse"
            style={{ top: `${12 + i * 14}%`, left: `${8 + i * 18}%`, animationDelay: `${i * 0.6}s` }} />
        ))}

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center py-16 sm:py-24">
          {/* Breadcrumb */}
          <nav className="flex items-center justify-center gap-1.5 text-white/50 text-[11px] mb-6">
            <Link href="/" className="hover:text-white/80 transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/80">About Us</span>
          </nav>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F5A623]/15 border border-[#F5A623]/30 rounded-full mb-5">
            <Compass className="w-3 h-3 text-[#F5A623] animate-[spin_8s_linear_infinite]" />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.18em] text-[#F5A623]">
              Est. 2014 &nbsp;·&nbsp; Bilaspur, Himachal Pradesh
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-4 sm:mb-6 leading-[1.1]">
            Where Every<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5A623] via-amber-300 to-[#F5A623]">
              Journey Begins
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-white/65 max-w-xl mx-auto leading-relaxed mb-8 px-2">
            {about.missionStatement ||
              "Connecting every traveller, every destination, and every genuine experience — under one trusted roof since 2014."}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center px-2">
            <Link href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-[#F5A623] text-[#0B1528] px-7 py-3.5 rounded-xl font-black text-sm hover:bg-amber-400 active:scale-95 transition-all shadow-lg shadow-[#F5A623]/25">
              Plan Your Journey <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/packages"
              className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white px-7 py-3.5 rounded-xl font-bold text-sm hover:bg-white/18 active:scale-95 transition-all">
              Explore Packages
            </Link>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-30">
          <div className="w-0.5 h-6 bg-white rounded-full animate-bounce" />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ STATS */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100">
            {[
              { label: "Years of Excellence", value: currentYear - 2014, suffix: "+", sub: "Since 2014" },
              { label: "Destinations", value: 200, suffix: "+", sub: "& counting" },
              { label: "Office Locations", value: 9, suffix: "+", sub: "Pan India" },
              { label: "Happy Travellers", value: 50000, suffix: "+", sub: "Memories Made" },
            ].map((stat) => (
              <div key={stat.label} className="text-center px-3 py-4 sm:px-4">
                <p className="text-2xl sm:text-3xl md:text-4xl font-black text-primary mb-0.5">
                  <AnimatedCount target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-[9px] sm:text-[10px] font-black text-slate-700 uppercase tracking-wider leading-tight">{stat.label}</p>
                <p className="text-[9px] text-slate-400 mt-0.5 hidden sm:block">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ OUR STORY */}
      <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* Text */}
          <div>
            <SectionLabel>Our Story</SectionLabel>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-slate-800 mb-5 leading-tight">
              A Vision Born in the<br className="hidden sm:block" />
              <span className="text-primary"> Heart of the Himalayas</span>
            </h2>
            <div className="space-y-3 text-slate-600 leading-relaxed text-sm">
              <p>
                <span className="font-bold text-slate-800">Sampooran Holidays</span> was founded in{" "}
                <span className="font-bold text-primary">{about.foundingYear || "2014"}</span> with a single, clear vision
                — to create a travel ecosystem where every traveller, every destination, and every genuine service provider
                comes together under one trusted platform.
              </p>
              <p>
                {about.story ||
                  "From our headquarters in Bilaspur, Himachal Pradesh, we have grown our network across India and beyond. We specialise in North India, curate all-India journeys, and craft Asia & international packages — introducing new places every day."}
              </p>
              <p>
                We connect <span className="font-semibold text-slate-800">DMCs, travel agents, vendors, B2B partners,
                activity operators</span> and local experts in a single seamless chain — delivering real value directly
                to every traveller.
              </p>
            </div>
            {about.founderName && (
              <div className="mt-5 flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <span className="text-primary font-black text-lg">{about.founderName[0]}</span>
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{about.founderName}</p>
                  <p className="text-xs text-slate-500">Founder, Sampooran Holidays</p>
                </div>
              </div>
            )}
          </div>

          {/* Info card */}
          <div className="relative">
            <div className="absolute inset-0 translate-x-2 translate-y-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl" />
            <div className="relative bg-gradient-to-br from-primary to-[#1a3d7a] rounded-3xl p-6 sm:p-8 text-white overflow-hidden shadow-xl">
              {/* bg deco */}
              <svg viewBox="0 0 400 120" className="absolute bottom-0 inset-x-0 w-full opacity-8 pointer-events-none" preserveAspectRatio="none">
                <path fill="white" d="M0,120 L0,70 L80,20 L140,60 L200,10 L280,55 L340,15 L400,45 L400,120 Z" />
              </svg>
              <div className="relative z-10 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F5A623]/20 flex items-center justify-center">
                    <Compass className="w-5 h-5 text-[#F5A623]" />
                  </div>
                  <div>
                    <p className="font-black text-base leading-tight">Sampooran Holidays</p>
                    <p className="text-white/55 text-xs">Complete Travel Solutions</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { icon: Mountain, label: "North India", value: "HP · J&K · Uttarakhand" },
                    { icon: Globe2, label: "All India & Asia", value: "400+ Routes" },
                    { icon: Network, label: "B2B Network", value: "DMCs · Agents · Vendors" },
                    { icon: Sparkles, label: "Experiences", value: "Genuine & Safe" },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/8 rounded-xl p-3 border border-white/10">
                      <item.icon className="w-4 h-4 text-[#F5A623] mb-1.5" />
                      <p className="text-[9px] font-black uppercase tracking-wider text-white/55 mb-0.5">{item.label}</p>
                      <p className="text-xs font-bold text-white leading-tight">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-2 pt-1 border-t border-white/10">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-white/65 leading-relaxed">Trusted by 50,000+ happy travellers across India & beyond</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ HOW WE WORK */}
      <div className="bg-slate-100/60 border-y border-slate-100 py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <SectionLabel>How We Work</SectionLabel>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-slate-800 mb-3">
              One Platform. Every Travel Need.
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed px-2">
              We connect DMCs, agents, activity providers, transport operators and hoteliers into one seamless chain —
              delivering the best possible experience to every traveller.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[
              { icon: Network, title: "Connected Ecosystem", description: "DMCs, agents, local vendors — all in one platform. No gaps, no missed connections.", gradient: "from-blue-500 to-indigo-600" },
              { icon: Handshake, title: "B2B & Agent Network", description: "Competitive rates, real-time inventory, and dedicated support for every travel partner.", gradient: "from-emerald-500 to-teal-600" },
              { icon: MapPin, title: "Local DMC Expertise", description: "Authentic local knowledge at every destination — from Spiti Valley to the beaches of Kochi.", gradient: "from-amber-500 to-orange-500" },
              { icon: Sparkles, title: "Curated Experiences", description: "Adventure, culture, wellness, pilgrimages — genuine, safe, and unforgettable activities.", gradient: "from-purple-500 to-violet-600" },
              { icon: Shield, title: "Quality Guaranteed", description: "Every partner and route is vetted. We believe in quality over numbers — every booking matters.", gradient: "from-rose-500 to-pink-600" },
              { icon: Clock, title: "24/7 Travel Support", description: "Round-the-clock support from real travel experts — before, during, and after your trip.", gradient: "from-cyan-500 to-sky-600" },
            ].map((card) => (
              <ModelCard key={card.title} {...card} />
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ SPECIALISATIONS */}
      <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <SectionLabel>What We Do Best</SectionLabel>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-slate-800 mb-3">Our Specialisations</h2>
          <p className="text-slate-500 text-xs sm:text-sm max-w-lg mx-auto px-2">
            From the peaks of Himachal to the beaches of Kochi — we introduce new destinations every day.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* North India — large card */}
          <div className="group relative bg-gradient-to-br from-[#0d1f3c] to-[#1B3A6B] rounded-3xl p-6 sm:p-8 text-white overflow-hidden shadow-xl md:row-span-2 flex flex-col justify-between min-h-[280px] sm:min-h-[340px] active:scale-[0.99] transition-all">
            <svg viewBox="0 0 400 200" className="absolute inset-0 w-full h-full opacity-8 pointer-events-none" preserveAspectRatio="none">
              <path fill="white" d="M0,200 L0,100 L100,40 L180,80 L260,20 L340,70 L400,30 L400,200 Z" />
            </svg>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#F5A623]/10 blur-2xl" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#F5A623]/20 flex items-center justify-center mb-4">
                <Mountain className="w-6 h-6 text-[#F5A623]" />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-[#F5A623] border border-[#F5A623]/30 px-2 py-1 rounded-full mb-3 inline-block">Core Speciality</span>
              <h3 className="text-xl sm:text-2xl font-serif font-bold mb-2">North India</h3>
              <p className="text-white/60 text-xs sm:text-sm leading-relaxed mb-4">
                Himachal Pradesh, J&K, Uttarakhand, Punjab, Rajasthan — deep-rooted expertise from our home state, with 100+ destinations and growing every week.
              </p>
            </div>
            <div className="relative z-10 flex flex-wrap gap-1.5">
              {["Manali", "Spiti", "Kashmir", "Shimla", "Leh-Ladakh", "Rishikesh", "Jaipur", "Amritsar"].map((tag) => (
                <span key={tag} className="text-[9px] font-bold px-2 py-0.5 bg-white/10 rounded-full border border-white/15 text-white/75">{tag}</span>
              ))}
            </div>
          </div>

          {/* All India */}
          <div className="group bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm hover:shadow-lg active:scale-[0.99] transition-all overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-emerald-500/5 blur-xl" />
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-md">
              <Globe2 className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">All India Destinations</h3>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              From the golden deserts of Rajasthan to the backwaters of Kerala — every corner of incredible India, carefully curated.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["South India", "Goa", "Kerala", "Northeast", "Andaman"].map((tag) => (
                <span key={tag} className="text-[9px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">{tag}</span>
              ))}
            </div>
          </div>

          {/* Asia & International */}
          <div className="group bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm hover:shadow-lg active:scale-[0.99] transition-all overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-violet-500/5 blur-xl" />
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-md">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Asia & International</h3>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              Thailand, Bali, Dubai, Bhutan, Nepal, Europe and beyond — international packages blending adventure with comfort.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Thailand", "Bali", "Dubai", "Bhutan", "Nepal", "Europe"].map((tag) => (
                <span key={tag} className="text-[9px] font-semibold px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ OFFICE NETWORK */}
      <div className="bg-white border-y border-slate-100 py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <SectionLabel>Our Presence</SectionLabel>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-slate-800 mb-3">Pan-India Network</h2>
            <p className="text-slate-500 text-xs sm:text-sm max-w-lg mx-auto px-2">
              Our offices and partner branches span across India — and we're expanding rapidly.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 mb-8">
            <OfficeBadge city="Bilaspur, HP" type="Head Office" isHQ />
            <OfficeBadge city="Manali" type="Branch Office" />
            <OfficeBadge city="Chandigarh" type="Branch Office" />
            <OfficeBadge city="Delhi" type="Partner Office" />
            <OfficeBadge city="Jaipur" type="Partner Office" />
            <OfficeBadge city="Mumbai" type="Partner Office" />
            <OfficeBadge city="Kochi" type="Partner Office" />
            <OfficeBadge city="Rishikesh" type="Partner Office" />
            <div className="flex items-center justify-center p-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 cursor-default">
              <div className="text-center">
                <Sparkles className="w-4 h-4 mx-auto mb-1" />
                <p className="text-[9px] font-black uppercase tracking-wider leading-tight">More<br />Coming Soon</p>
              </div>
            </div>
          </div>

          {/* Contact row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a href={`tel:${s.phone.replace(/[^+\d]/g, "")}`}
              className="flex items-center gap-3 px-4 py-3.5 bg-primary/5 border border-primary/15 rounded-2xl hover:bg-primary/10 active:scale-98 transition-all">
              <Phone className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-wider text-primary/60">Call Us Anytime</p>
                <p className="font-bold text-slate-800 text-xs sm:text-sm truncate">{s.phone}</p>
              </div>
            </a>
            <a href={`mailto:${s.email}`}
              className="flex items-center gap-3 px-4 py-3.5 bg-primary/5 border border-primary/15 rounded-2xl hover:bg-primary/10 active:scale-98 transition-all">
              <Mail className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-wider text-primary/60">Email Us</p>
                <p className="font-bold text-slate-800 text-xs sm:text-sm truncate">{s.email}</p>
              </div>
            </a>
            <div className="flex items-center gap-3 px-4 py-3.5 bg-primary/5 border border-primary/15 rounded-2xl">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-wider text-primary/60">Head Office</p>
                <p className="font-bold text-slate-800 text-xs sm:text-sm">Bilaspur, Himachal Pradesh</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ WHY CHOOSE US */}
      <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <SectionLabel>The Difference</SectionLabel>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-slate-800">
            Why Travellers Choose Us
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-3xl mx-auto">
          {whyPoints.map((item, i) => {
            const gradients = [
              "from-blue-500 to-indigo-600",
              "from-emerald-500 to-teal-600",
              "from-amber-500 to-orange-500",
              "from-purple-500 to-violet-600",
              "from-rose-500 to-pink-600",
              "from-cyan-500 to-sky-600",
            ];
            return (
              <div key={i} className="group flex gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center text-white font-black text-base shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-slate-800 text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ ECO INITIATIVE */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0a2a14] via-[#0f3d1f] to-[#0d2d1a] py-14 sm:py-20">
        <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-emerald-500/8 blur-[80px] pointer-events-none" />
        <svg viewBox="0 0 1440 160" preserveAspectRatio="none"
          className="absolute bottom-0 inset-x-0 w-full opacity-8 pointer-events-none" style={{ height: "80px" }}>
          <path fill="white" d="M0,160 L0,100 L180,45 L360,90 L540,25 L720,75 L900,15 L1080,60 L1260,20 L1440,50 L1440,160 Z" />
        </svg>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/25 rounded-full">
              <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">Green Initiative</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-3 leading-tight px-2">
              We Travel the World.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300">
                We Protect It Too.
              </span>
            </h2>
            <p className="text-white/55 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed px-2">
              Our Earth is not just a destination — it is our home, our temple, our living God.
              At Sampooran Holidays, every journey carries a commitment to leave the world a little better.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
            <EcoCard icon={TreePine} title="Plantation Drives"
              desc="We plant new trees every season — our staff, partners, and travellers join hands at each destination." />
            <EcoCard icon={Wind} title="Eco-Clean Mountains"
              desc="We organise regular cleaning drives at top mountain destinations — collecting waste left by tourism." />
            <EcoCard icon={Leaf} title="Responsible Tourism"
              desc="Every itinerary encourages a minimal environmental footprint and respects local ecosystems." />
            <EcoCard icon={Heart} title="Nature is Our God"
              desc="We believe the Earth is alive. Our team creates memories that last without leaving damage behind." />
          </div>

          {/* Quote */}
          <div className="max-w-xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center">
              <div className="text-3xl text-emerald-400/40 font-serif leading-none mb-3">"</div>
              <p className="text-white/75 text-sm sm:text-base font-medium italic leading-relaxed">
                Nature is not a place to visit — it is home. We travel to experience it, and we have a duty to protect it for those who come after us.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="w-8 h-0.5 bg-emerald-400/40 rounded-full" />
                <span className="text-emerald-400/60 text-[9px] font-black uppercase tracking-widest">Sampooran Holidays</span>
                <div className="w-8 h-0.5 bg-emerald-400/40 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ CORE VALUES */}
      <div className="bg-white border-y border-slate-100 py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <SectionLabel>What We Stand For</SectionLabel>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-slate-800">Our Core Values</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { icon: Star, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100",
                title: "Quality over Quantity",
                desc: "We don't chase booking volumes. Every trip is crafted with intention — every guest matters, every itinerary is personal." },
              { icon: Network, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100",
                title: "One Connected Chain",
                desc: "DMCs, vendors, transport, hotels and activity providers — unified in one network, delivering real value to travellers." },
              { icon: Heart, color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-100",
                title: "Long-lasting Memories",
                desc: "Our team creates moments, not bookings. Stories you tell for years — that is the Sampooran promise." },
            ].map((v) => (
              <div key={v.title}
                className={`p-6 rounded-3xl border ${v.border} ${v.bg} hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-300`}>
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-4 shadow-sm">
                  <v.icon className={`w-6 h-6 ${v.color}`} />
                </div>
                <h3 className="font-black text-slate-800 text-base sm:text-lg mb-2">{v.title}</h3>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ CTA */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-[#1e4a8a] to-[#0d2a5c] py-16 sm:py-20 md:py-24">
        <div className="absolute inset-0 pointer-events-none">
          <svg viewBox="0 0 1440 280" preserveAspectRatio="none" className="absolute bottom-0 w-full opacity-5">
            <path fill="white" d="M0,280 L0,140 L200,70 L400,140 L600,50 L800,120 L1000,30 L1200,110 L1440,55 L1440,280 Z" />
          </svg>
          <div className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-white/4 blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-36 h-36 rounded-full bg-[#F5A623]/8 blur-2xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 bg-[#F5A623]/20 border border-[#F5A623]/30 rounded-full">
            <Plane className="w-3 h-3 text-[#F5A623]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-[#F5A623]">Ready to Travel?</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-4 leading-tight px-2">
            Your Next Adventure<br />
            <span className="text-[#F5A623]">Starts Here</span>
          </h2>
          <p className="text-white/65 max-w-lg mx-auto mb-8 text-xs sm:text-sm leading-relaxed px-4">
            Whether you are a solo explorer, a family seeking memories, or a travel agent building your portfolio —
            Sampooran Holidays is your one-stop partner for everything travel.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center px-4">
            <Link href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-[#F5A623] text-[#0B1528] px-8 py-4 rounded-xl font-black text-sm hover:bg-amber-400 active:scale-95 transition-all shadow-xl shadow-[#F5A623]/25">
              Plan My Trip <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/b2b"
              className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/25 text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-white/18 active:scale-95 transition-all">
              Join as B2B Partner <Handshake className="w-4 h-4" />
            </Link>
            <a href={`tel:${s.phone.replace(/[^+\d]/g, "")}`}
              className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/25 text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-white/18 active:scale-95 transition-all">
              <Phone className="w-4 h-4 text-[#F5A623]" /> {s.phone}
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}
