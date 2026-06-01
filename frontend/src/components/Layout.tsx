"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MapPin, Phone, Mail, Menu, X, ChevronDown, Facebook, Instagram, Twitter, Youtube, User, LogOut, Ticket, MessageCircle, Sparkles, Zap, ShieldCheck, Globe, Star, Building2, Share2, Linkedin, Shield, Hotel, Utensils, Car, UserCheck, ClipboardList, Headphones } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { MegaNav } from "./MegaNav";
import { InclusionsSection } from "./InclusionsSection";
import { BottomNav } from "./BottomNav";
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
      ? "bg-white/95 backdrop-blur-xl border-b border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] py-1 md:py-2"
      : "bg-gradient-to-b from-black/40 via-black/20 to-transparent border-transparent py-3 md:py-6"
  );

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white font-sans selection:bg-primary selection:text-white">
      <header className={headerClass}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Mega Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="relative">
                <motion.div
                  animate={{ rotate: scrolled ? 360 : 0 }}
                  transition={{ duration: 1, type: "spring" }}
                  className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20"
                >
                  <img src="/logo.png" alt="S" className="w-7 h-7 object-contain brightness-0 invert" />
                </motion.div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-white" />
              </div>
              <div className="flex flex-col">
                <span className={cn(
                  "font-serif font-bold text-xl leading-none tracking-tight transition-colors duration-500",
                  !scrolled ? "text-white" : "text-primary"
                )}>Sampooran</span>
                <span className={cn(
                  "text-[10px] font-bold tracking-widest leading-none mt-1 transition-colors duration-500",
                  !scrolled ? "text-white/80" : "text-accent"
                )}>Holidays</span>
              </div>
            </Link>

            {/* Premium Nav */}
            <MegaNav />

            {/* Action Group */}
            <div className="flex items-center gap-3">

              {/* My Account / Login */}
              <div className="relative hidden sm:block"
                onMouseEnter={() => setLoginOpen(true)}
                onMouseLeave={() => setLoginOpen(false)}
              >
                {isLoading ? (
                  <div className="w-24 h-9 bg-slate-100 animate-pulse rounded-xl" />
                ) : user ? (
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all",
                      !scrolled
                        ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-primary/5"
                    )}>
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] text-white font-bold">
                        {user.name.slice(0, 1)}
                      </div>
                      <div className="flex flex-col leading-none">
                        <span className={cn("text-[10px] font-semibold", !scrolled ? "text-white/60" : "text-slate-400")}>Hi,</span>
                        <span className="text-xs font-bold">{user.name.split(' ')[0]}</span>
                      </div>
                    </div>
                    <button onClick={() => logout()} className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                      !scrolled ? "bg-white/10 text-white hover:bg-red-500" : "bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-600"
                    )} aria-label="Logout">
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-xl border text-sm font-semibold transition-all",
                      !scrolled
                        ? "border-white/40 text-white hover:bg-white/15"
                        : "border-slate-200 text-slate-700 hover:border-primary hover:text-primary"
                    )}>
                      <User className="w-4 h-4" />
                      Login
                      <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", loginOpen && "rotate-180")} />
                    </button>

                    {/* Role-based Login Dropdown */}
                    <AnimatePresence>
                      {loginOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                        >
                          <div className="bg-primary p-4">
                            <p className="text-white font-bold text-sm">Welcome to Sampooran Holidays</p>
                            <p className="text-white/70 text-xs mt-0.5">Choose how you'd like to login</p>
                          </div>
                          <div className="p-3 space-y-1">
                            <Link href="/login" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">Traveler Login</p>
                                <p className="text-xs text-slate-500">Manage bookings & itineraries</p>
                              </div>
                            </Link>
                            <Link href="/b2b" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                                <Ticket className="w-5 h-5 text-emerald-600" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">Travel Agent / B2B</p>
                                <p className="text-xs text-slate-500">Access rates, packages & bookings</p>
                              </div>
                            </Link>
                            <Link href="/login?role=vendor" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                                <MapPin className="w-5 h-5 text-orange-600" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">Property / Vendor</p>
                                <p className="text-xs text-slate-500">List hotels, cabs & manage assets</p>
                              </div>
                            </Link>
                          </div>
                          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
                            <Link href="/register" className="text-xs text-primary font-semibold hover:underline">
                              New here? Create a free account â†’
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
                  "px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all",
                  "bg-accent text-accent-foreground shadow-accent/25"
                )}>
                  Plan My Trip
                </button>
              </Link>

                <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={cn(
                  "lg:hidden w-10 h-10 rounded-xl flex items-center justify-center transition-all",
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
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            className="fixed inset-0 z-[60] lg:hidden bg-white overflow-y-auto"
          >
            <div className="p-6 flex items-center justify-between border-b">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <img src="/logo.png" className="w-5 h-5 brightness-0 invert" alt="" />
                </div>
                <span className="font-serif font-bold text-primary">Sampooran</span>
              </Link>
              <button onClick={() => setMobileOpen(false)} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center" aria-label="Close menu">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 pb-24">
              {NAV.map((item) => (
                <div key={item.label} className="mb-6">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{item.label}</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {item.isMega ? (
                      item.columns?.flatMap(c => c.links).map(l => (
                        <Link key={l.label} href={l.href} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="text-lg">{l.icon}</span>
                          <span className="font-bold text-slate-700">{l.label}</span>
                        </Link>
                      ))
                    ) : (
                      (item as any).children?.map((c: any) => (
                        <Link key={c.label} href={c.href} className="font-bold text-slate-700 pl-4">{c.label}</Link>
                      )) || (
                        <Link href={item.href} className="font-bold text-slate-700 px-4 py-3 bg-slate-50 rounded-2xl">{item.label}</Link>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t flex gap-4">
              {/* Mobile Call button uses correct number */}
              <a href="tel:+918595513009" className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold uppercase text-xs tracking-widest text-center">Call Expert</a>
              <Link href="/customized-holidays" className="flex-1 bg-accent text-accent-foreground py-4 rounded-2xl font-bold uppercase text-xs tracking-widest text-center">Enquire Now</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
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
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
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
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
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
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
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
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md group-hover:bg-white/20 transition-all">
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
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-white border-b border-accent/30 pb-2 inline-block">Resources</h4>
                  <ul className="space-y-2.5">
                    {["Tour Status", "Blog", "Podcasts", "Video Blogs", "Articles By Experts", "Travel Planners"].map(l => (
                      <li key={l}><Link href="#" className="text-blue-100/70 text-xs font-normal hover:text-accent transition-colors">{l}</Link></li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
{/* Caution Bar */}
            <div className="bg-white/10 rounded-xl p-2 mb-6 border border-white/10">
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

      {/* WhatsApp FAB */}
      <a href="https://wa.me/918595513009" target="_blank" rel="noopener noreferrer"
        className="fixed bottom-36 right-6 lg:bottom-24 z-50 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
        aria-label="WhatsApp">
        <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </a>

      {/* Live Support Chat */}
      <ChatWidget />
    </div>
  );
}
