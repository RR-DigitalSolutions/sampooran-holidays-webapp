"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MapPin, Phone, Mail, Menu, X, ChevronDown, Facebook, Instagram,
  Youtube, User, LogOut, Ticket, Building2, Share2, Linkedin, Shield,
  Hotel, Compass, ChevronRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { MegaNav } from "./MegaNav";
import { InclusionsSection } from "./InclusionsSection";
import { BottomNav } from "./BottomNav";
import { MobileNav } from "./MobileNav";
import dynamic from "next/dynamic";

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [openFooterCol, setOpenFooterCol] = useState<number | null>(null);
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
            <Link href="/" className="flex items-center gap-3">
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

      <main className={cn("flex-1", "pb-20 lg:pb-0")}>{children}</main>

      {isHome && <InclusionsSection />}

      {/* ─── Footer ────────────────────────────────────────────────────── */}
      <footer className="bg-gradient-to-b from-[#0B1528] via-[#0D1B3E] to-[#0B1528] text-white">

        {/* Quick Contact Bar */}
        <div className="bg-white/5 border-b border-white/10">
          <div className="container mx-auto px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

              {/* Offices */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-9 md:h-9 bg-white/10 rounded-lg flex items-center justify-center shrink-0 border border-white/10">
                  <Building2 className="w-4 h-4 text-[#F5A623]" />
                </div>
                <div>
                  <p className="font-semibold text-[10px] uppercase tracking-widest text-white/90 mb-0.5">Our Offices</p>
                  <Link href="/contact" className="text-[#F5A623] font-medium text-[10px] hover:underline transition-colors">
                    Locate Us →
                  </Link>
                </div>
              </div>

              {/* Call Us */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-9 md:h-9 bg-white/10 rounded-lg flex items-center justify-center shrink-0 border border-white/10">
                  <Phone className="w-4 h-4 text-[#F5A623]" />
                </div>
                <div>
                  <p className="font-semibold text-[10px] uppercase tracking-widest text-white/90 mb-0.5">Call Us</p>
                  <a href="tel:+918595513009" className="text-white font-semibold text-xs hover:text-[#F5A623] transition-colors">
                    +91 85955 13009
                  </a>
                </div>
              </div>

              {/* Write to us */}
              <div className="flex items-center gap-3 col-span-2 md:col-span-1">
                <div className="w-8 h-8 md:w-9 md:h-9 bg-white/10 rounded-lg flex items-center justify-center shrink-0 border border-white/10">
                  <Mail className="w-4 h-4 text-[#F5A623]" />
                </div>
                <div>
                  <p className="font-semibold text-[10px] uppercase tracking-widest text-white/90 mb-0.5">Write to Us</p>
                  <a href="mailto:info@sampooranholidays.com" className="text-white/70 text-[10px] hover:text-[#F5A623] transition-colors">
                    info@sampooranholidays.com
                  </a>
                </div>
              </div>

              {/* Social */}
              <div className="flex items-center gap-3 col-span-2 md:col-span-1">
                <div className="w-8 h-8 md:w-9 md:h-9 bg-white/10 rounded-lg flex items-center justify-center shrink-0 border border-white/10">
                  <Share2 className="w-4 h-4 text-[#F5A623]" />
                </div>
                <div>
                  <p className="font-semibold text-[10px] uppercase tracking-widest text-white/90 mb-1.5">Follow Us</p>
                  <div className="flex items-center gap-2">
                    {SOCIAL.map((s) => (
                      <a key={s.label} href={s.href} aria-label={s.label}
                        className={cn("w-6 h-6 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 hover:shadow-lg", s.color)}>
                        <s.icon className="w-3 h-3" />
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
    </div>
  );
}
