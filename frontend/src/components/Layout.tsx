"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MapPin, Phone, Mail, Menu, X, ChevronDown, Facebook, Instagram, Twitter, Youtube, User, LogOut, Ticket, MessageCircle, Sparkles, Zap, ShieldCheck, Globe, Star, Building2, Share2, Linkedin, Shield, Hotel, Utensils, Car, UserCheck, ClipboardList, Headphones, Navigation, Compass } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { MegaNav } from "./MegaNav";
import { InclusionsSection } from "./InclusionsSection";
import { BottomNav } from "./BottomNav";
import { MobileNav } from "./MobileNav";
import dynamic from "next/dynamic";

const ChatWidget = dynamic(() => import("./ChatWidget"), { ssr: false });


const NAV: Array<{
  label: string;
  href: string;
  isMega: boolean;
  columns?: Array<{ links: Array<{ label: string; href: string; icon: ReactNode }> }>;
}> = [
    {
      label: "India",
      href: "/india-tour-packages",
      isMega: true,
    },
    {
      label: "World",
      href: "/world-tour-packages",
      isMega: true,
    },
    {
      label: "Customized Holidays",
      href: "/customized-holidays",
      isMega: false,
    },
    {
      label: "Corporate Travel",
      href: "/corporate-travel",
      isMega: false,
    },
    {
      label: "Inbound",
      href: "/inbound",
      isMega: false,
    },
    {
      label: "Travel Guide",
      href: "/travel-guide",
      isMega: false,
    },
    {
      label: "B2B",
      href: "/b2b",
      isMega: false,
    },
    {
      label: "Contact Us",
      href: "/contact",
      isMega: false,
    },
  ];

export function Layout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [showFullSEO, setShowFullSEO] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setActiveMenu(null);
  }, [pathname]);

  const isHome = pathname === "/";

  const headerClass = cn(
    "fixed top-0 z-50 w-full transition-all duration-500",
    scrolled
      ? "bg-white/95 backdrop-blur-xl border-b border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
      : "bg-gradient-to-b from-black/40 via-black/20 to-transparent border-transparent py-1 md:py-1"
  );

  const isDashboardRoute = pathname?.startsWith("/partner") || pathname?.startsWith("/admin");

  if (isDashboardRoute) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-slate-50 font-sans selection:bg-primary selection:text-white">
        <main className="flex-1 pb-20 lg:pb-0">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white font-sans selection:bg-primary selection:text-white">
      <header className={headerClass}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Mega Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-14 h-14 select-none">
                {/* Rotating Tagline SVG around logo */}
                <motion.svg
                  animate={{ rotate: 360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 100 100"
                >
                  <path
                    id="logo-curve"
                    d="M 50, 50 m -38.5, 0 a 38.5,38.5 0 1,1 77,0 a 38.5,38.5 0 1,1 -77,0"
                    fill="none"
                  />
                  <text className={cn("text-[8px] font-extrabold uppercase tracking-[0.16em]", !scrolled ? "fill-white" : "fill-[#1B3A6B]")}>
                    <textPath href="#logo-curve" startOffset="0%">
                      Sampooran Holidays • Sampooran Holidays •
                    </textPath>
                  </text>
                </motion.svg>

                {/* FAB-style Premium Compass Icon Core with Scroll Rotation */}
                <motion.div
                  animate={{
                    rotate: scrolled ? 360 : 0,
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    rotate: { duration: 1, type: "spring" },
                    scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 z-10",
                    !scrolled
                      ? "bg-white/10 text-white border border-white/20 backdrop-blur-sm shadow-white/5"
                      : "bg-[#1B3A6B] text-[#F5A623] border border-[#1B3A6B]/20"
                  )}
                >
                  <Compass className={cn("w-5.5 h-5.5 transition-colors duration-300", !scrolled ? "text-white" : "text-[#F5A623]")} />
                </motion.div>

                {/* Accent status dot */}
                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#F5A623] rounded-full border border-white z-20 animate-pulse" />
              </div>
            </Link>

            {/* Premium Nav */}
            <MegaNav />

            {/* Action Group */}
            <div className="flex items-center gap-3">

              {/* My Account / Login */}
              <div className="relative hidden sm:block"
                onMouseEnter={() => {
                  if (user) {
                    setProfileOpen(true);
                  } else {
                    setLoginOpen(true);
                  }
                }}
                onMouseLeave={() => {
                  setProfileOpen(false);
                  setLoginOpen(false);
                }}
              >
                {isLoading ? (
                  <div className="w-24 h-9 bg-slate-100 animate-pulse rounded-lg" />
                ) : user ? (
                  <>
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all hover:scale-105 active:scale-95",
                      !scrolled
                        ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-primary/5"
                    )}>
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                        {user.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex flex-col leading-none text-left">
                        <span className="text-[10px] font-bold tracking-tight">{user.name.split(' ')[0]}</span>
                      </div>
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </div>

                    {/* Profile Dropdown */}
                    <AnimatePresence>
                      {profileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-200"
                        >
                          <div className="bg-primary/5 p-4 border-b border-slate-100">
                            <p className="text-slate-800 font-extrabold text-sm truncate">{user.name}</p>
                            <p className="text-slate-400 text-[10px] truncate mt-0.5">{user.email}</p>
                            {user.role && (
                              <span className="inline-block mt-2 text-[8px] font-black uppercase tracking-wider bg-accent/20 text-primary px-2 py-0.5 rounded-full">
                                {user.role.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                          <div className="p-2 space-y-0.5">
                            <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-slate-700 hover:bg-slate-50 transition-colors group">
                              <User className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                              <span className="text-xs font-bold">My Dashboard</span>
                            </Link>

                            {user.role === 'HOTEL_OWNER' && (
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
                        : "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/30 shadow-[0_4px_10px_rgba(0,0,0,0.05)]"
                    )}>
                      <User className="w-4 h-4 transition-transform group-hover:scale-110" />
                    </button>

                    {/* Role-based Login Dropdown */}
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
                <button className={cn(
                  "px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all",
                  "bg-accent text-accent-foreground shadow-accent/25"
                )}>
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

      <main className={cn("flex-1", "pb-20 lg:pb-0")}>
        {children}
      </main>

      {isHome && <InclusionsSection />}

      {/* Footer Section */}
      <footer className="bg-gradient-to-b from-primary via-[#0A1121] to-primary text-white">
        {/* Quick Action Bar */}
        <div className="bg-white text-primary py-2 border-b border-slate-100">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Offices */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm uppercase tracking-widest mb-1 text-slate-900">Our Offices</h4>
                  <p className="text-slate-600 text-[9px] leading-relaxed mb-1">Located across the country, ready to plan your dream vacation today!</p>
                  <Link href="/contact" className="text-primary font-medium text-xs underline underline-offset-4 hover:text-accent transition-colors">Locate Us</Link>
                </div>
              </div>

              {/* Call Us */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm uppercase tracking-widest mb-1 text-slate-900">Call us</h4>
                  <p className="text-slate-600 text-[8px] leading-relaxed mb-1">Request a quote or chat - we're here to help anytime!</p>
                  <a href="tel:+918595513009" className="text-primary font-semibold text-lg hover:text-accent transition-colors tracking-tight">+91 85955 13009</a>
                </div>
              </div>

              {/* Write to us */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm uppercase tracking-widest mb-1 text-slate-900">Write to us</h4>
                  <p className="text-slate-600 text-[8px] leading-relaxed mb-1.5">We're always happy to help!</p>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-normal text-slate-700">For Feedback: <a href="mailto:feedback@sampooranholidays.com" className="text-primary hover:text-accent transition-colors font-medium">feedback@sampooranholidays.com</a></p>
                    <p className="text-[9px] font-normal text-slate-700">For Enquiries: <a href="mailto:info@sampooranholidays.com" className="text-primary hover:text-accent transition-colors font-medium">info@sampooranholidays.com</a></p>
                  </div>
                </div>
              </div>

              {/* Social */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <h4 className="font-semibold text-sm uppercase tracking-widest mb-3 text-slate-900">Connect with us</h4>
                  <div className="flex items-center gap-3">
                    {[
                      { icon: Facebook, color: "bg-[#1877F2]" },
                      { icon: Youtube, color: "bg-[#FF0000]" },
                      { icon: Linkedin, color: "bg-[#0A66C2]" },
                      { icon: Instagram, color: "bg-gradient-to-tr from-[#F58529] via-[#D62976] to-[#962FBF]" }
                    ].map((Social, i) => (
                      <button key={i} className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110", Social.color)}>
                        <Social.icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="pt-14 pb-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 mb-12">
              {/* Brand & Newsletter */}
              <div className="lg:col-span-5 space-y-10">
                <Link href="/" className="flex items-center gap-3 group">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-md group-hover:bg-white/20 transition-all">
                    <img src="/logo.png" className="w-7 h-7 brightness-0 invert" alt="" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-serif font-medium text-2xl leading-none">Sampooran</span>
                    <span className="text-[10px] font-semibold text-accent tracking-[0.2em] mt-1 uppercase">Holidays</span>
                  </div>
                </Link>

                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Keep travelling all year round!</h3>
                    <p className="text-blue-100/60 text-xs font-normal">Subscribe to our newsletter to find travel inspiration in your inbox.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input type="text" placeholder="Full Name*" className="bg-white/10 border border-white/10 rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:border-accent transition-colors placeholder:text-blue-100/40" />
                    <input type="email" placeholder="Email ID*" className="bg-white/10 border border-white/10 rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:border-accent transition-colors placeholder:text-blue-100/40" />
                    <div className="sm:col-span-2 flex gap-3 items-end">
                      <div className="flex-1 space-y-1.5">
                        <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest pl-1">Mobile No.*</label>
                        <div className="flex items-center gap-2 bg-white/10 border border-white/10 rounded-lg px-3 py-2.5">
                          <img src="https://flagcdn.com/w20/in.png" className="w-4 h-auto rounded-sm" alt="" />
                          <span className="text-xs font-medium border-r border-white/10 pr-2">+91</span>
                          <input type="tel" className="bg-transparent border-none focus:outline-none text-xs w-full placeholder:text-blue-100/40" />
                        </div>
                      </div>
                      <button className="bg-accent text-primary font-semibold uppercase text-xs tracking-widest px-6 py-3 rounded-lg hover:brightness-110 transition-all shadow-lg shadow-accent/10 shrink-0">
                        Subscribe
                      </button>
                    </div>
                  </div>
                </div>

                {/* Associations */}
                <div className="space-y-3 pt-4">
                  <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">Associated with</p>
                  <div className="flex flex-wrap gap-4 items-center opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
                    {/* Placeholder for association logos */}
                    <div className="px-3 py-1.5 bg-white/10 rounded font-semibold text-[10px] tracking-tighter border border-white/5">IATA</div>
                    <div className="px-3 py-1.5 bg-white/10 rounded font-semibold text-[10px] tracking-tighter border border-white/5">TAFI</div>
                    <div className="px-3 py-1.5 bg-white/10 rounded font-semibold text-[10px] tracking-tighter border border-white/5">OTOAI</div>
                    <div className="px-3 py-1.5 bg-white/10 rounded font-semibold text-[10px] tracking-tighter border border-white/5">ADTOI</div>
                  </div>
                </div>
              </div>

              {/* Links Grid */}
              <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8">
                <div className="space-y-6">
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-white border-b border-accent/30 pb-2 inline-block">Discover us</h4>
                  <ul className="space-y-2.5">
                    {["Guests Reviews", "About Us", "Our Team", "Tour Managers", "Sales Partners", "Become A Sales Partner", "Careers", "CSR Policy", "Create Your Travel Portfolio"].map(l => (
                      <li key={l}><Link href="#" className="text-blue-100/70 text-xs font-normal hover:text-accent transition-colors">{l}</Link></li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-6">
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-white border-b border-accent/30 pb-2 inline-block">Support</h4>
                  <ul className="space-y-2.5">
                    {["Contact Us", "Leave Your Feedback", "How To Book", "FAQ", "Travel Deals", "Public Notice", "Annual Return", "Corporate Governance"].map(l => (
                      <li key={l}><Link href="#" className="text-blue-100/70 text-xs font-normal hover:text-accent transition-colors">{l}</Link></li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-6">
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-white border-b border-accent/30 pb-2 inline-block">Hotels & Stays</h4>
                  <ul className="space-y-2.5">
                    <li><Link href="/hotels" className="text-blue-100/70 text-xs font-normal hover:text-accent transition-colors">Browse All Hotels</Link></li>
                    <li><Link href="/hotels?type=Resort" className="text-blue-100/70 text-xs font-normal hover:text-accent transition-colors">Luxury Resorts</Link></li>
                    <li><Link href="/hotels?type=Cottage" className="text-blue-100/70 text-xs font-normal hover:text-accent transition-colors">Cottages & Chalets</Link></li>
                    <li><Link href="/hotels?type=Homestay" className="text-blue-100/70 text-xs font-normal hover:text-accent transition-colors">Homestays</Link></li>
                    <li><Link href="/hotels?type=Camp" className="text-blue-100/70 text-xs font-normal hover:text-accent transition-colors">Camps & Glamping</Link></li>
                    <li className="pt-1 border-t border-white/10">
                      <Link href="/partner/register" className="text-accent text-xs font-bold hover:underline transition-colors flex items-center gap-1">
                        🏨 List Your Property →
                      </Link>
                    </li>
                    <li>
                      <Link href="/partner/login" className="text-blue-100/70 text-xs font-normal hover:text-accent transition-colors">Partner Login</Link>
                    </li>
                    <li><Link href="#" className="text-blue-100/70 text-xs font-normal hover:text-accent transition-colors">Blog</Link></li>
                    <li><Link href="#" className="text-blue-100/70 text-xs font-normal hover:text-accent transition-colors">Travel Planners</Link></li>
                  </ul>
                </div>
              </div>
            </div>
            {/* Caution Bar */}
            <div className="bg-white/10 rounded-md p-2 mb-6 border border-white/10">
              <p className="text-[9px] md:text-[10px] text-blue-100/60 leading-relaxed">
                <span className="text-accent font-semibold uppercase not-italic mr-2">Caution:</span>
                Beware of Fake Promotions or Offers! Please do not believe or engage with any promotional emails, SMS or Web-links which ask you to click on a link and fill in your details. All Sampooran Holidays authorized email communications are delivered from domain @sampooranholidays.com. Sampooran Holidays bears no liability or responsibility whatsoever for any communication which is fraudulent or misleading in nature and not received from registered domain.
              </p>
            </div>

            {/* Bottom Bar */}
            <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-medium text-blue-100/50 tracking-wider">
              <p>&copy; {new Date().getFullYear()} Sampooran Holidays Pvt Ltd. All Rights Reserved.</p>
              <div className="flex gap-6">
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
                <Link href="/sitemap" className="hover:text-white transition-colors">Site Map</Link>
              </div>
              <div className="flex items-center gap-2 opacity-40">
                <Shield className="w-2.5 h-2.5" />
                <span>Secure Payments</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp FAB removed per UX request */}

      {/* Live Support Chat */}
      <ChatWidget />
    </div>
  );
}
