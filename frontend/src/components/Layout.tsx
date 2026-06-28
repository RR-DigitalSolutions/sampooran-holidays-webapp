"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MapPin, Phone, Mail, Menu, X, ChevronDown, Facebook, Instagram,
  Youtube, User, LogOut, Ticket, Building2, Share2, Linkedin, Shield,
  Hotel, Compass, ChevronRight, Plane, Search
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { MegaNav } from "./MegaNav";
import { InclusionsSection } from "./InclusionsSection";
import { BottomNav } from "./BottomNav";
import { MobileNav } from "./MobileNav";
import dynamic from "next/dynamic";
import PremiumSearchTabs from "./PremiumSearchTabs";

const ChatWidget = dynamic(() => import("./ChatWidget"), { ssr: false });

// ─── Footer Link Data ────────────────────────────────────────────────────────

const FOOTER_COLS = [
  {
    title: "Discover Us",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Guests Reviews", href: "#" },
      { label: "Our Team", href: "#" },
      { label: "Tour Managers", href: "#" },
      { label: "Sales Partners", href: "#" },
      { label: "Become A Sales Partner", href: "#" },
      { label: "Careers", href: "#" },
      { label: "CSR Policy", href: "#" },
      { label: "Create Your Travel Portfolio", href: "#" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact Us", href: "/contact" },
      { label: "Leave Your Feedback", href: "#" },
      { label: "How To Book", href: "#" },
      { label: "FAQ", href: "#" },
      { label: "Travel Deals", href: "#" },
      { label: "Public Notice", href: "#" },
      { label: "Annual Return", href: "#" },
      { label: "Corporate Governance", href: "#" },
    ],
  },
  {
    title: "Hotels & Stays",
    links: [
      { label: "Browse All Hotels", href: "/hotels" },
      { label: "Luxury Resorts", href: "/hotels?type=Resort" },
      { label: "Cottages & Chalets", href: "/hotels?type=Cottage" },
      { label: "Homestays", href: "/hotels?type=Homestay" },
      { label: "Camps & Glamping", href: "/hotels?type=Camp" },
      { label: "List Your Property →", href: "/partner/register", accent: true },
      { label: "Partner Login", href: "/partner/login" },
      { label: "Blog", href: "/blog" },
      { label: "Travel Planners", href: "#" },
    ],
  },
];

const SOCIAL = [
  { icon: Facebook, color: "bg-[#1877F2]", label: "Facebook", href: "#" },
  { icon: Youtube, color: "bg-[#FF0000]", label: "YouTube", href: "#" },
  { icon: Linkedin, color: "bg-[#0A66C2]", label: "LinkedIn", href: "#" },
  { icon: Instagram, color: "bg-gradient-to-tr from-[#F58529] via-[#D62976] to-[#962FBF]", label: "Instagram", href: "#" },
];

// ─── Main Layout ─────────────────────────────────────────────────────────────

export function Layout({ children }: { children: ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();
  const [devModalOpen, setDevModalOpen] = useState(false);
  const [modalCount, setModalCount] = useState(0);

  useEffect(() => {
    // Show first modal 5 seconds after load
    const initialTimer = setTimeout(() => {
      setDevModalOpen(true);
      setModalCount(1);
    }, 5000);

    return () => clearTimeout(initialTimer);
  }, []);

  useEffect(() => {
    if (modalCount > 0 && modalCount < 5) {
      const interval = setInterval(() => {
        setDevModalOpen(true);
        setModalCount(prev => prev + 1);
      }, 120000); // 2 minutes

      return () => clearInterval(interval);
    }
  }, [modalCount]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsNavigating(false);
    setMobileOpen(false);
    setHeaderSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor) {
        const href = anchor.getAttribute("href");
        if (
          href &&
          href.startsWith("/") &&
          !href.startsWith("/#") &&
          !href.includes("#") &&
          anchor.getAttribute("target") !== "_blank" &&
          !e.defaultPrevented &&
          e.button === 0 &&
          !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        ) {
          const cleanHref = href.split("?")[0].split("#")[0];
          const cleanCurrent = window.location.pathname;
          
          if (cleanHref !== cleanCurrent) {
            setIsNavigating(true);
          }
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);
    return () => document.removeEventListener("click", handleAnchorClick);
  }, []);

  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [openFooterCol, setOpenFooterCol] = useState<number | null>(null);

  const isHome = pathname === "/";
  const isDashboardRoute = pathname?.startsWith("/partner") || pathname?.startsWith("/admin");

  const headerClass = cn(
    "fixed top-0 z-50 w-full transition-all duration-500",
    scrolled
      ? "bg-white/95 backdrop-blur-xl border-b border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
      : "bg-gradient-to-b from-black/40 via-black/20 to-transparent border-transparent py-1 md:py-1"
  );

  if (isDashboardRoute) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-slate-50 font-sans selection:bg-primary selection:text-white">
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white font-sans selection:bg-primary selection:text-white">
      {/* ─── Header ────────────────────────────────────────────────────── */}
      <header className={headerClass}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <div className="relative flex items-center justify-center w-14 h-14 select-none">
                {/* Rotating tagline ring */}
                <motion.svg
                  animate={{ rotate: 360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 100 100"
                >
                  <path id="logo-curve" d="M 50,50 m -38.5,0 a 38.5,38.5 0 1,1 77,0 a 38.5,38.5 0 1,1 -77,0" fill="none" />
                  <text className={cn("text-[8px] font-extrabold uppercase tracking-[0.16em]", !scrolled ? "fill-white" : "fill-[#1B3A6B]")}>
                    <textPath href="#logo-curve" startOffset="0%">
                      Sampooran Holidays • Sampooran Holidays •
                    </textPath>
                  </text>
                </motion.svg>
                {/* Compass core */}
                <motion.div
                  animate={{ rotate: scrolled ? 360 : 0, scale: [1, 1.05, 1] }}
                  transition={{ rotate: { duration: 1, type: "spring" }, scale: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 z-10",
                    !scrolled
                      ? "bg-white/10 text-white border border-white/20 backdrop-blur-sm"
                      : "bg-[#1B3A6B] text-[#F5A623] border border-[#1B3A6B]/20"
                  )}
                >
                  <Compass className={cn("w-5 h-5 transition-colors duration-300", !scrolled ? "text-white" : "text-[#F5A623]")} />
                </motion.div>
                {/* Accent dot */}
                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#F5A623] rounded-full border border-white z-20 animate-pulse" />
              </div>
            </Link>

            {/* Compact Search Bar in Header (Mobile only, visible on scroll) */}
            {scrolled && (
              <div className="flex-1 mx-3 lg:hidden block animate-in fade-in slide-in-from-top-2 duration-300">
                <button 
                  onClick={() => setHeaderSearchOpen(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-full bg-slate-100/80 border border-slate-200/60 text-slate-500 text-left hover:bg-slate-200/50 transition-all shadow-xs active:scale-[0.97]"
                >
                  <Search className="w-3.5 h-3.5 text-primary stroke-[2.5] shrink-0" />
                  <span className="text-[10px] font-bold text-slate-700 truncate">Search packages, hotels...</span>
                </button>
              </div>
            )}

            {/* Desktop Nav */}
            <MegaNav />

            {/* Action Group */}
            <div className="flex items-center gap-3">
              {/* Account */}
              <div
                className="relative hidden sm:block"
                onMouseEnter={() => { if (user) setProfileOpen(true); else setLoginOpen(true); }}
                onMouseLeave={() => { setProfileOpen(false); setLoginOpen(false); }}
              >
                {isLoading ? (
                  <div className="w-24 h-9 bg-slate-100 animate-pulse rounded-lg" />
                ) : user ? (
                  <>
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all hover:scale-105 active:scale-95",
                      !scrolled ? "border-white/30 bg-white/10 text-white hover:bg-white/20" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-primary/5"
                    )}>
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                        {user.name.slice(0, 1).toUpperCase()}
                      </div>
                      <span className="text-[10px] font-bold tracking-tight">{user.name.split(" ")[0]}</span>
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </div>
                    <AnimatePresence>
                      {profileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-2xl border border-slate-100 overflow-hidden z-50"
                        >
                          <div className="bg-primary/5 p-4 border-b border-slate-100">
                            <p className="text-slate-800 font-extrabold text-sm truncate">{user.name}</p>
                            <p className="text-slate-400 text-[10px] truncate mt-0.5">{user.email}</p>
                            {user.role && (
                              <span className="inline-block mt-2 text-[8px] font-black uppercase tracking-wider bg-accent/20 text-primary px-2 py-0.5 rounded-full">
                                {user.role.replace("_", " ")}
                              </span>
                            )}
                          </div>
                          <div className="p-2 space-y-0.5">
                            <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-slate-700 hover:bg-slate-50 transition-colors group">
                              <User className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                              <span className="text-xs font-bold">My Dashboard</span>
                            </Link>
                            {user.role === "HOTEL_OWNER" && (
                              <Link href="/partner/bookings" className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-slate-700 hover:bg-slate-50 transition-colors group">
                                <Building2 className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                                <span className="text-xs font-bold">Manage Bookings</span>
                              </Link>
                            )}
                            <button
                              onClick={() => logout()}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-red-600 hover:bg-red-50 transition-colors group text-left"
                            >
                              <LogOut className="w-4 h-4 text-red-500 group-hover:text-red-600" />
                              <span className="text-xs font-bold">Logout</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <>
                    <button className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg border transition-all hover:scale-105 active:scale-95 group",
                      !scrolled
                        ? "border-white/30 bg-white/10 text-white hover:bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                        : "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/30"
                    )}>
                      <User className="w-4 h-4 transition-transform group-hover:scale-110" />
                    </button>
                    <AnimatePresence>
                      {loginOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-2xl border border-slate-100 overflow-hidden z-50"
                        >
                          <div className="bg-primary p-4">
                            <p className="text-white font-bold text-sm">Welcome to Sampooran Holidays</p>
                            <p className="text-white/70 text-xs mt-0.5">Choose how you'd like to login</p>
                          </div>
                          <div className="p-3 space-y-1">
                            <Link href="/login" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                              <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">Traveler Login</p>
                                <p className="text-xs text-slate-500">Manage bookings & itineraries</p>
                              </div>
                            </Link>
                            <Link href="/my-hotel-bookings" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                              <div className="w-10 h-10 rounded-md bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                                <Hotel className="w-5 h-5 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">My Hotel Bookings</p>
                                <p className="text-xs text-slate-500">View & manage stay history</p>
                              </div>
                            </Link>
                            <Link href="/b2b" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                              <div className="w-10 h-10 rounded-md bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                                <Ticket className="w-5 h-5 text-emerald-600" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">Travel Agent / B2B</p>
                                <p className="text-xs text-slate-500">Access rates, packages & bookings</p>
                              </div>
                            </Link>
                          </div>
                          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
                            <Link href="/register" className="text-xs text-primary font-semibold hover:underline">
                              New here? Create a free account →
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>

              <Link href="/customized-holidays" className="hidden xl:block">
                <button className="px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all bg-accent text-accent-foreground shadow-accent/25">
                  Plan Trip
                </button>
              </Link>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={cn(
                  "lg:hidden w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                  !scrolled ? "text-white hover:bg-white/10" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <BottomNav />

      {/* Compact Search Modal Drawer */}
      <AnimatePresence>
        {headerSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
            onClick={() => setHeaderSearchOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: -20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: -20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white rounded-xl shadow-2xl border border-slate-100 p-4 w-full max-w-lg relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header of Modal */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h3 className="font-sans font-bold text-xs uppercase text-primary tracking-widest flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-accent animate-[spin_8s_linear_infinite]" /> Find Your Next Journey
                </h3>
                <button 
                  onClick={() => setHeaderSearchOpen(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Close search"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Tabs inside Modal */}
              <div className="py-2">
                <PremiumSearchTabs />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className={cn("flex-1", "pb-20 lg:pb-0")}>{children}</main>

      {isHome && <InclusionsSection />}

      {/* ─── Footer ────────────────────────────────────────────────────── */}
      <footer className="bg-gradient-to-b from-[#0B1528] via-[#0D1B3E] to-[#0B1528] text-white">

        {/* Quick Contact Bar */}
        <div className="bg-white/5 border-b border-white/10">
          <div className="container mx-auto px-4 py-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-5">

              {/* Offices */}
              <div className="flex items-center gap-2.5">
                <div className="w-7.5 h-7.5 sm:w-9 sm:h-9 bg-white/5 rounded-md flex items-center justify-center shrink-0 border border-white/10">
                  <Building2 className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-[#F5A623]" />
                </div>
                <div>
                  <p className="font-bold text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 mb-0.5">Our Offices</p>
                  <Link href="/contact" className="text-[#F5A623] font-bold text-[9.5px] sm:text-[10px] hover:underline transition-colors">
                    Locate Us →
                  </Link>
                </div>
              </div>

              {/* Call Us */}
              <div className="flex items-center gap-2.5">
                <div className="w-7.5 h-7.5 sm:w-9 sm:h-9 bg-white/5 rounded-md flex items-center justify-center shrink-0 border border-white/10">
                  <Phone className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-[#F5A623]" />
                </div>
                <div>
                  <p className="font-bold text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 mb-0.5">Call Us</p>
                  <a href="tel:+918595513009" className="text-white font-bold text-[11px] sm:text-xs hover:text-[#F5A623] transition-colors">
                    +91 85955 13009
                  </a>
                </div>
              </div>

              {/* Write to us */}
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 sm:w-9 sm:h-9 bg-white/5 rounded-md flex items-center justify-center shrink-0 border border-white/10">
                  <Mail className="w-3 h-3 sm:w-4.5 sm:h-4.5 text-[#F5A623]" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[8px] sm:text-[10px] uppercase tracking-widest text-slate-400 mb-0.5">Write to Us</p>
                  <a href="mailto:info@sampooranholidays.com" className="text-white/80 font-semibold text-[8.5px] sm:text-xs hover:text-[#F5A623] transition-colors truncate block">
                    info@sampooranholidays.com
                  </a>
                </div>
              </div>

              {/* Social */}
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 sm:w-9 sm:h-9 bg-white/5 rounded-md flex items-center justify-center shrink-0 border border-white/10">
                  <Share2 className="w-3 h-3 sm:w-4.5 sm:h-4.5 text-[#F5A623]" />
                </div>
                <div>
                  <p className="font-bold text-[8px] sm:text-[10px] uppercase tracking-widest text-slate-400 mb-0.5">Follow Us</p>
                  <div className="flex items-center gap-1">
                    {SOCIAL.map((s) => (
                      <a key={s.label} href={s.href} aria-label={s.label}
                        className={cn("w-4.5 h-4.5 sm:w-6.5 sm:h-6.5 rounded-full flex items-center justify-center text-white transition-all hover:scale-105", s.color)}>
                        <s.icon className="w-2 h-2 sm:w-3 sm:h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Footer Body */}
        <div className="container mx-auto px-4 pt-10 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-10">

            {/* Brand + Newsletter Column */}
            <div className="lg:col-span-5 space-y-6">

              {/* Logo — mirrors the header */}
              <Link href="/" className="flex items-center gap-3 group w-fit">
                <div className="relative flex items-center justify-center w-12 h-12 select-none">
                  <motion.svg
                    animate={{ rotate: 360 }}
                    transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 100 100"
                  >
                    <path id="footer-logo-curve" d="M 50,50 m -38.5,0 a 38.5,38.5 0 1,1 77,0 a 38.5,38.5 0 1,1 -77,0" fill="none" />
                    <text className="text-[8px] font-extrabold uppercase tracking-[0.16em] fill-[#F5A623]/60">
                      <textPath href="#footer-logo-curve" startOffset="0%">
                        Sampooran Holidays • Sampooran Holidays •
                      </textPath>
                    </text>
                  </motion.svg>
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center z-10 group-hover:bg-[#F5A623]/20 transition-all">
                    <Compass className="w-4.5 h-4.5 text-[#F5A623]" />
                  </div>
                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#F5A623] rounded-full border border-white z-20 animate-pulse" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-serif font-semibold text-xl text-white leading-tight">Sampooran</span>
                  <span className="text-[10px] font-bold text-[#F5A623] tracking-[0.22em] uppercase mt-0.5">Holidays</span>
                </div>
              </Link>

              {/* Newsletter */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Keep travelling all year round!</h3>
                  <p className="text-white/50 text-[11px] leading-relaxed">
                    Subscribe to our newsletter for travel inspiration, deals & guides.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Full Name*"
                    className="bg-white/8 border border-white/12 rounded-lg px-3.5 py-2 text-[11px] focus:outline-none focus:border-[#F5A623]/60 transition-colors placeholder:text-white/30 text-white"
                  />
                  <input
                    type="email"
                    placeholder="Email ID*"
                    className="bg-white/8 border border-white/12 rounded-lg px-3.5 py-2 text-[11px] focus:outline-none focus:border-[#F5A623]/60 transition-colors placeholder:text-white/30 text-white"
                  />
                  <div className="sm:col-span-2 flex gap-2 items-stretch">
                    <div className="flex-1 flex items-center gap-2 bg-white/8 border border-white/12 rounded-lg px-3 py-2">
                      <img src="https://flagcdn.com/w20/in.png" className="w-4 h-auto rounded-sm shrink-0" alt="" />
                      <span className="text-[11px] font-medium border-r border-white/15 pr-2 text-white/70">+91</span>
                      <input
                        type="tel"
                        placeholder="Mobile No.*"
                        className="bg-transparent border-none focus:outline-none text-[11px] w-full placeholder:text-white/30 text-white"
                      />
                    </div>
                    <button className="bg-[#F5A623] text-[#0B1528] font-bold uppercase text-[10px] tracking-widest px-4 py-2 rounded-lg hover:brightness-110 transition-all shadow-lg shadow-[#F5A623]/20 shrink-0 whitespace-nowrap">
                      Subscribe
                    </button>
                  </div>
                </div>
              </div>

              {/* Associations */}
              <div className="space-y-2 pt-2">
                <p className="text-[9px] font-semibold text-white/40 uppercase tracking-widest">Associated with</p>
                <div className="flex flex-wrap gap-2 items-center opacity-60 hover:opacity-100 transition-all">
                  {["IATA", "TAFI", "OTOAI", "ADTOI"].map((a) => (
                    <div key={a} className="px-2.5 py-1 bg-white/8 rounded text-[9px] font-semibold tracking-tighter border border-white/10 text-white/80">
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Links Grid — Desktop: 3 columns side by side; Mobile: accordion */}
            <div className="lg:col-span-7">
              {/* Desktop */}
              <div className="hidden md:grid grid-cols-3 gap-6">
                {FOOTER_COLS.map((col) => (
                  <div key={col.title} className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-white border-b border-[#F5A623]/30 pb-2">
                      {col.title}
                    </h4>
                    <ul className="space-y-2">
                      {col.links.map((link) => (
                        <li key={link.label}>
                          <Link
                            href={link.href}
                            className={cn(
                              "text-[11px] font-normal transition-colors hover:text-[#F5A623]",
                              (link as any).accent ? "text-[#F5A623] font-bold" : "text-white/60"
                            )}
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Mobile: accordion */}
              <div className="md:hidden space-y-1">
                {FOOTER_COLS.map((col, idx) => (
                  <div key={col.title} className="border border-white/10 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setOpenFooterCol(openFooterCol === idx ? null : idx)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <span className="text-[11px] font-bold uppercase tracking-widest text-white">{col.title}</span>
                      <ChevronRight className={cn("w-4 h-4 text-[#F5A623] transition-transform shrink-0", openFooterCol === idx && "rotate-90")} />
                    </button>
                    <AnimatePresence>
                      {openFooterCol === idx && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2">
                            {col.links.map((link) => (
                              <Link
                                key={link.label}
                                href={link.href}
                                className={cn(
                                  "text-[11px] transition-colors hover:text-[#F5A623]",
                                  (link as any).accent ? "text-[#F5A623] font-bold col-span-2" : "text-white/60"
                                )}
                              >
                                {link.label}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Caution Notice */}
          <div className="bg-white/5 rounded-lg p-3 mb-6 border border-white/8">
            <p className="text-[9px] md:text-[10px] text-white/50 leading-relaxed">
              <span className="text-[#F5A623] font-semibold uppercase mr-2">⚠ Caution:</span>
              Beware of fake promotions or offers! Do not engage with any promotional emails, SMS or web-links asking you to fill in your details.
              All Sampooran Holidays authorized communications are from domain{" "}
              <span className="text-white/70 font-medium">@sampooranholidays.com</span>.
              Sampooran Holidays bears no liability for fraudulent communications.
            </p>
          </div>

          {/* Bottom Bar */}
          <div className="pt-5 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] font-medium text-white/40 tracking-wider">
            <p>© {new Date().getFullYear()} Sampooran Holidays Pvt Ltd. All Rights Reserved.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
              <Link href="/sitemap" className="hover:text-white transition-colors">Site Map</Link>
            </div>
            <div className="flex items-center gap-1.5 opacity-50">
              <Shield className="w-3 h-3" />
              <span>Secure Payments</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Live Support Chat */}
      <ChatWidget />

      {/* Fullscreen Travel-Themed Page Transition Loader Overlay */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-gradient-to-tr from-slate-50 via-white to-slate-50 flex flex-col items-center justify-center p-6 select-none"
          >
            <TravelLoader onCancel={() => setIsNavigating(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Temporary Development Notification Modal */}
      <AnimatePresence>
        {devModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setDevModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-md bg-gradient-to-br from-[#0B1528] to-[#1B3A6B] text-white rounded-2xl p-6 shadow-2xl border border-white/10 overflow-hidden"
            >
              {/* Decorative backgrounds */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#F5A623]/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#1B3A6B]/50 rounded-full blur-2xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setDevModalOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-all cursor-pointer z-10"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-[#F5A623]/20 border border-[#F5A623]/30 flex items-center justify-center shadow-lg shadow-[#F5A623]/10">
                  <Plane className="w-7 h-7 text-[#F5A623] -rotate-45" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center space-y-3.5 relative z-10">
                <div className="inline-block px-3 py-1 bg-[#F5A623]/15 border border-[#F5A623]/30 rounded-full">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#F5A623]">Under Development</span>
                </div>
                <h3 className="text-lg md:text-xl font-bold font-serif text-white tracking-wide">
                  Welcome to Sampooran Holidays!
                </h3>
                <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-medium">
                  This webapp is currently under active development. We are extremely thankful for your visit! Kindly pay attention as we are working hard to soon bring you the absolute best travel platform for all travel communities, built with the best <span className="text-[#F5A623] font-bold">GENUINE</span> services.
                </p>
              </div>

              {/* Action Button */}
              <div className="mt-6 flex justify-center relative z-10">
                <button
                  onClick={() => setDevModalOpen(false)}
                  className="w-full py-2.5 px-6 bg-accent text-accent-foreground hover:bg-accent/90 active:scale-98 transition-all font-bold text-xs md:text-sm rounded-xl shadow-lg shadow-accent/15 cursor-pointer text-center"
                >
                  Explore Current Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-Component: Dynamic Travel Facts Loader ──────────────────────────────
const TRAVEL_FACTS = [
  "Did you know? Hikkim in Himachal Pradesh houses the world's highest post office at 14,400 feet!",
  "UNESCO Heritage Toy Train: The Kalka-Shimla rail route has 103 tunnels and over 800 bridges!",
  "Khajjiar (Chamba) is India's 'Mini Switzerland', featuring a floating island in the center of its lake.",
  "High Altitude Cricket: Dharamshala hosts the world's highest altitude international cricket stadium at 4,780 feet.",
  "Bir Billing is the paragliding capital of India and paragliding world cup host.",
  "Spiti Valley is home to Key Monastery, a majestic 1,000-year-old Tibetan Buddhist training center.",
  "Did you know? Dharamshala is the holy residence of His Holiness the Dalai Lama."
];

function TravelLoader({ onCancel }: { onCancel: () => void }) {
  const [factIdx, setFactIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFactIdx(prev => (prev + 1) % TRAVEL_FACTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-8 max-w-md w-full px-4 text-slate-800">
      {/* Premium Orbiting Loader */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Orbiting Airplane */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Plane className="w-5 h-5 text-accent transform rotate-90 fill-accent" />
          </div>
        </motion.div>

        {/* Outer Ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
          className="w-18 h-18 rounded-full border-2 border-dashed border-primary/20 flex items-center justify-center relative"
        >
          <span className="absolute top-0.5 text-[8px] font-black text-primary/40">N</span>
          <span className="absolute right-0.5 text-[8px] font-black text-primary/40">E</span>
          <span className="absolute bottom-0.5 text-[8px] font-black text-primary/40">S</span>
          <span className="absolute left-0.5 text-[8px] font-black text-primary/40">W</span>
        </motion.div>

        {/* Compass needle inside */}
        <motion.div
          animate={{ rotate: [0, -15, 10, -5, 12, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="absolute w-1 h-12 bg-gradient-to-b from-red-500 via-red-500 to-slate-300 rounded-full flex items-center justify-center"
        >
          <div className="w-2 h-2 rounded-full bg-white border border-red-500 z-10" />
        </motion.div>
      </div>

      {/* Main Loading text */}
      <div className="text-center space-y-1">
        <h3 className="text-base md:text-lg font-black text-primary uppercase tracking-widest animate-pulse">
          Mapping Your Journey...
        </h3>
        <p className="text-xs text-slate-500 font-bold">Please wait while we pack your itinerary</p>
      </div>

      {/* Knowledge Fact Box */}
      <div className="bg-white rounded-lg p-5 border border-slate-100 shadow-md w-full relative overflow-hidden flex flex-col items-center justify-center min-h-[92px]">
        {/* Border accent strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-accent" />
        <AnimatePresence mode="wait">
          <motion.div
            key={factIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="text-xs md:text-sm text-slate-700 font-semibold text-center leading-relaxed"
          >
            {TRAVEL_FACTS[factIdx]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Manual Cancel Button */}
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 rounded-lg font-bold text-xs md:text-sm shadow-sm active:scale-95 transition-all touch-manipulation cursor-pointer"
      >
        Cancel & Go Back
      </button>
    </div>
  );
}
