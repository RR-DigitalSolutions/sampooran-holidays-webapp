"use client";

import { useSubmitInquiry } from "@workspace/api-client-react";
import Link from "next/link";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  CheckCircle,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  CalendarHeart,
  Headset,
  PlaneTakeoff,
  HeartHandshake,
  Search,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Globe,
  Map,
  Users,
  Eye,
  Calendar,
  Hotel,
  Utensils,
  Car,
  ShieldCheck,
  Award,
  Headphones,
  Info,
  ChevronLeft,
  Clock,
  CircleDollarSign,
  Star,
  Zap,
  Quote
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { PackageCard } from "@/components/PackageCard";

// Detailed Location Data
const LOCATION_DATA = {
  countries: ["India", "Thailand", "Bhutan", "Nepal", "Dubai (UAE)", "Singapore", "Bali (Indonesia)", "Vietnam", "Maldives", "Switzerland", "France", "Australia", "New Zealand", "USA", "Canada"],
  states: ["Himachal Pradesh", "Uttarakhand", "Jammu & Kashmir", "Ladakh", "Rajasthan", "Kerala", "Goa", "Sikkim", "Meghalaya", "Assam", "Arunachal Pradesh", "Gujarat", "Karnataka", "Tamil Nadu", "Maharashtra"],
  destinations: ["Manali", "Shimla", "Dharamshala", "Dalhousie", "Spiti Valley", "Leh", "Nubra Valley", "Srinagar", "Gulmarg", "Pahalgam", "Mussoorie", "Nainital", "Rishikesh", "Jaipur", "Jodhpur", "Udaipur", "Jaisalmer", "Munnar", "Alleppey", "Wayanad", "Gangtok", "Pelling", "Tawang", "Shillong"],
  attractions: ["Rohtang Pass", "Solang Valley", "Pangong Lake", "Khardung La", "Dal Lake", "Amber Fort", "Hawa Mahal", "Taj Mahal", "Golden Temple", "Statue of Unity", "Living Root Bridges", "Tiger's Nest", "Burj Khalifa", "Eiffel Tower", "Swiss Alps"]
};

const HOME_FEATURES = [
  { icon: Award, title: "12+ Yrs Exp.", desc: "Legacy of travel trust." },
  { icon: Hotel, title: "Hotels", desc: "Premium handpicked stays." },
  { icon: CircleDollarSign, title: "Best Price", desc: "No hidden costs guaranteed." },
  { icon: Utensils, title: "All Meals", desc: "Fresh local delicacies included." },
  { icon: Car, title: "Transport", desc: "Private seamless luxury transfers." },
  { icon: Users, title: "Managers", desc: "Expert on-ground local support." },
  { icon: Headphones, title: "24/7 Help", desc: "Round the clock assistance." },
  { icon: ShieldCheck, title: "Secure", desc: "Verified 100% safe travel." },
  { icon: Globe, title: "B2B Net.", desc: "Trusted by 500+ agents." }
];

const DEFAULT_BANNER_ADS = [
  { id: "default-1", title: "Exclusive Himalayan Expedition", description: "Easy EMI options starting from ₹3333/month.", imageUrl: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800", link: "/packages", tag: "LIMITED", ctaText: "Book Now" },
  { id: "default-2", title: "Maldives Luxury Getaway", description: "Overwater villas & seaplane transfers.", imageUrl: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800", link: "/packages", tag: "BEST SELLER", ctaText: "Explore" }
];

const DEFAULT_REVIEWS = [
  { id: "rev-1", name: "Shahid Abbas", rating: 5, content: "Good service provider for holiday and vacations. Really good service and value for money experience with the staff. Mrs. Neha was really good and helped us to make a Egypt holiday trip with family very vibrant and memorable.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Shahid" },
  { id: "rev-2", name: "Greeshma Sabu", rating: 5, content: "Really great service. I booked a trip to Malaysia for my parents with them. The package was very affordable including food and accommodation. They really enjoyed it with the whole group and tour manager. Jicky assisted me through out the whole process...", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Greeshma" },
  { id: "rev-3", name: "Deepak Kumar", rating: 5, content: "The visa process for my Thailand trip went smoothly. The staff was very professional and made each step easy by providing clear guidance. I highly recommend their services for anyone looking for hassle-free travel planning.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Deepak" },
  { id: "rev-4", name: "Anjali Sharma", rating: 5, content: "Amazing Shimla trip organized by Sampooran Holidays. Every detail was taken care of, from the luxury car to the best hotel rooms with views. We will definitely book our next family trip with them again!", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali" }
];

export default function CustomizedHolidaysClient() {
  const submitInquiry = useSubmitInquiry();
  const [step, setStep] = useState(1);
  const [activePopularTab, setActivePopularTab] = useState<'india' | 'world'>('india');
  const [form, setForm] = useState({
    destination: "", travelDate: "", duration: "5", persons: "2", budget: "",
    interests: [] as string[], hotelCategory: "3-star", theme: "",
    name: "", phone: "", email: "", message: "",
    callbackPhone: "", callbackPhone_2: "", callbackTime: "Morning"
  });
  const [submitted, setSubmitted] = useState(false);
  const [callbackRequested, setCallbackRequested] = useState(false);
  const [themes, setThemes] = useState<any[]>([]);
  const [popularPlaces, setPopularPlaces] = useState<{ domestic: any[], international: any[] }>({ domestic: [], international: [] });
  const [sponsoredAds, setSponsoredAds] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [activeTheme, setActiveTheme] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const [testimonials, setTestimonials] = useState<any[]>([]);

  const [emblaAdRef, emblaAdApi] = useEmblaCarousel({ loop: true, duration: 40 }, [Autoplay({ delay: 5000 })]);
  const [emblaInspireRef, emblaInspireApi] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps', dragFree: true });
  const [emblaThemeFilterRef, emblaThemeFilterApi] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps', dragFree: true });
  const [emblaPackageRef, emblaPackageApi] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps', dragFree: true });
  const [emblaReviewRef, emblaReviewApi] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps', dragFree: true });

  // Fetch initial config & destinations
  useEffect(() => {
    async function fetchConfig() {
      try {
        const configRes = await fetch("/api/ota/home/config");
        if (configRes.ok) {
          const data = await configRes.json();
          let fetchedThemes: any[] = [];
          if (data.categories) { fetchedThemes = [...data.categories.filter((c: any) => c.isActive).map((c: any) => ({ label: c.label, imageUrl: c.imageUrl || c.image_url }))]; }
          if (data.themes) { data.themes.forEach((t: any) => { if (!fetchedThemes.find(c => c.label === t.name)) { fetchedThemes.push({ label: t.name, imageUrl: t.imageUrl || t.image_url }); } }); }
          setThemes(fetchedThemes);
          if (data.offers && data.offers.filter((o: any) => o.type === 'SPONSORED_BANNER' && o.isActive).length > 0) { setSponsoredAds(data.offers.filter((o: any) => o.type === 'SPONSORED_BANNER' && o.isActive)); }
          else { setSponsoredAds(DEFAULT_BANNER_ADS); }
        } else { setSponsoredAds(DEFAULT_BANNER_ADS); }
        const destRes = await fetch("/api/ota/home/top-destinations");
        if (destRes.ok) { const data = await destRes.json(); setPopularPlaces({ domestic: data.domestic || [], international: data.international || [] }); }

        // Fetch testimonials
        const testRes = await fetch("/api/testimonials?limit=6&featured=true");
        if (testRes.ok) {
          const data = await testRes.json();
          setTestimonials(data.testimonials?.length > 0 ? data.testimonials : DEFAULT_REVIEWS);
        } else {
          setTestimonials(DEFAULT_REVIEWS);
        }
      } catch (err) { console.error("Config fetch failed", err); setSponsoredAds(DEFAULT_BANNER_ADS); setTestimonials(DEFAULT_REVIEWS); }
    }
    fetchConfig();
  }, []);

  // SMART FETCH: Correct endpoint to /api/packages
  useEffect(() => {
    async function fetchPackages() {
      setLoadingPackages(true);
      try {
        const baseUrl = "/api/packages?limit=20";
        const url = activeTheme === "All" ? baseUrl : `${baseUrl}&category=${encodeURIComponent(activeTheme)}`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setPackages(data.packages || []);
        }
      } catch (err) {
        console.error("Package fetch failed", err);
      } finally {
        setLoadingPackages(false);
      }
    }
    fetchPackages();
  }, [activeTheme]);

  // STRICT LIMIT: Always show exactly first 7 packages for the carousel
  const displayPackages = useMemo(() => {
    return packages.slice(0, 7);
  }, [packages]);

  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return null;
    return {
      countries: LOCATION_DATA.countries.filter(x => x.toLowerCase().includes(q)),
      states: LOCATION_DATA.states.filter(x => x.toLowerCase().includes(q)),
      destinations: LOCATION_DATA.destinations.filter(x => x.toLowerCase().includes(q)),
      attractions: LOCATION_DATA.attractions.filter(x => x.toLowerCase().includes(q))
    };
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitInquiry.mutateAsync({ data: { name: form.name, phone: form.phone, email: form.email, inquiryType: "customized", destination: form.destination, travelDate: form.travelDate, numberOfPersons: parseInt(form.persons), budget: parseFloat(form.budget.replace(/[^0-9]/g, "")) || undefined, message: `Request: ${form.destination} | Theme: ${form.theme} | ${form.persons} pax | Interests: ${form.interests.join(", ")}. ${form.message}` } as any });
      setSubmitted(true);
    } catch (err) { }
  };

  const handleCallbackRequest = (e: React.FormEvent) => { e.preventDefault(); setCallbackRequested(true); setTimeout(() => setCallbackRequested(false), 3000); };

  return (
    <div className="bg-white min-h-screen font-sans">

      {/* 1. Hero Section */}
      <section className="relative pt-20 pb-12 md:pt-28 md:pb-16 overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#0A1931] to-primary" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="inline-block bg-white/10 border border-white/20 px-4 py-1 rounded-full mb-4"><span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Bespoke Journeys</span></motion.div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight mb-4">Build Your <span className="text-accent italic font-light drop-shadow-lg">Signature Holiday.</span></h1>
          <p className="text-white/70 text-xs md:text-sm max-w-xl mx-auto font-medium">Personalized itineraries, expert guidance, and infinite memories. <br />Crafted exactly for the way you travel.</p>
        </div>
      </section>

      {/* 2. Inquiry Hub */}
      <section className="relative -mt-10 pb-12 z-20">
        <div className="container mx-auto px-2 md:px-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
              <div className="grid grid-cols-1 lg:grid-cols-12 flex-1">
                <div className="lg:col-span-8 p-3 md:p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-2">
                    <h2 className="text-base font-bold text-primary flex items-center gap-2"><div className="w-1.5 h-6 bg-accent rounded-full" />Plan My Trip</h2>
                    <div className="text-[10px] font-black text-primary/50 uppercase tracking-widest">Step {step} / 3</div>
                  </div>
                  <div className="flex-1">
                    {submitted ? (
                      <div className="text-center py-8"><CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" /><h3 className="text-lg font-bold text-primary mb-1">Inquiry Submitted</h3><p className="text-slate-500 text-sm mb-6">Our travel expert will connect with you shortly.</p><button onClick={() => setSubmitted(false)} className="text-xs font-black text-primary uppercase border-b-2 border-primary">Start New</button></div>
                    ) : (
                      <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); setStep(s => s + 1); }} className="space-y-4">
                        {step === 1 && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-slate-50/30">
                              <div className="md:col-span-6 relative border-r border-slate-100 p-2 px-4 group">
                                <label className="text-[9px] font-black text-slate-400 uppercase mb-0.5 block group-focus-within:text-primary transition-colors">Destination</label>
                                <div className="flex items-center gap-2"><Search className="w-3.5 h-3.5 text-slate-300" /><input type="text" placeholder="Where to go?" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setShowSearchDrop(true); }} className="w-full bg-transparent text-sm font-bold text-primary placeholder:text-slate-300 outline-none" /></div>
                                <AnimatePresence>{showSearchDrop && searchQuery && (<motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute top-full left-0 w-full bg-white rounded-xl shadow-2xl border border-slate-100 z-50 mt-1 max-h-[250px] overflow-y-auto no-scrollbar p-1">{searchResults?.countries.map(d => <button key={d} type="button" onClick={() => { setForm(f => ({ ...f, destination: d })); setSearchQuery(""); setShowSearchDrop(false); }} className="w-full text-left px-4 py-2 hover:bg-primary hover:text-white rounded-lg text-xs font-bold flex justify-between transition-colors">{d} <span className="text-[8px] uppercase opacity-50">Country</span></button>)}{searchResults?.states.map(d => <button key={d} type="button" onClick={() => { setForm(f => ({ ...f, destination: d })); setSearchQuery(""); setShowSearchDrop(false); }} className="w-full text-left px-4 py-2 hover:bg-primary hover:text-white rounded-lg text-xs font-bold flex justify-between transition-colors">{d} <span className="text-[8px] uppercase opacity-50">State</span></button>)}{searchResults?.destinations.map(d => <button key={d} type="button" onClick={() => { setForm(f => ({ ...f, destination: d })); setSearchQuery(""); setShowSearchDrop(false); }} className="w-full text-left px-4 py-2 hover:bg-primary hover:text-white rounded-lg text-xs font-bold flex justify-between transition-colors">{d} <span className="text-[8px] uppercase opacity-50">Place</span></button>)}</motion.div>)}</AnimatePresence>
                              </div>
                              <div className="md:col-span-3 border-r border-slate-100 p-2 px-4 group">
                                <label className="text-[9px] font-black text-slate-400 uppercase mb-0.5 block group-focus-within:text-primary transition-colors">Month</label>
                                <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-300" /><input type="month" required value={form.travelDate.slice(0, 7)} onChange={(e) => setForm(f => ({ ...f, travelDate: e.target.value }))} className="w-full bg-transparent text-sm font-bold text-primary outline-none cursor-pointer" /></div>
                              </div>
                              <div className="md:col-span-3 p-2 px-4 group relative">
                                <label className="text-[9px] font-black text-slate-400 uppercase mb-0.5 block group-focus-within:text-primary transition-colors">Vibe</label>
                                <div className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-slate-300" /><select value={form.theme} onChange={(e) => setForm(f => ({ ...f, theme: e.target.value }))} className="w-full bg-transparent text-sm font-bold text-primary appearance-none outline-none cursor-pointer"><option value="">Theme</option>{themes.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}</select><ChevronDown className="w-3 h-3 text-slate-300 pointer-events-none" /></div>
                              </div>
                            </div>
                            <div className="pt-2 border-t border-slate-50 relative">
                              <div className="flex items-center justify-between mb-2 px-1"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inspirations</span><div className="flex gap-4"><button type="button" onClick={() => setActivePopularTab('india')} className={cn("text-[10px] font-black uppercase transition-colors", activePopularTab === 'india' ? "text-primary border-b-2 border-primary" : "text-slate-300 hover:text-slate-400")}>India</button><button type="button" onClick={() => setActivePopularTab('world')} className={cn("text-[10px] font-black uppercase transition-colors", activePopularTab === 'world' ? "text-primary border-b-2 border-primary" : "text-slate-300 hover:text-slate-400")}>World</button></div></div>
                              <div className="relative group/carousel"><div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaInspireRef}><div className="flex gap-2">{(activePopularTab === 'india' ? popularPlaces.domestic : popularPlaces.international).map(item => (<div key={item.slug} className="flex-[0_0_15.5%] min-w-[100px] md:min-w-[120px]"><button type="button" onClick={() => { setForm(f => ({ ...f, destination: item.name })); setStep(1); }} className="group/card relative aspect-square rounded-xl overflow-hidden border border-slate-100 shadow-sm w-full"><img src={item.imageUrl} className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover/card:scale-110" /><div className="absolute inset-0 bg-primary/80 opacity-0 group-hover/card:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-1.5 text-center"><p className="text-[7px] font-black text-accent uppercase mb-0.5">Starting</p><p className="text-[9px] font-black text-white mb-1">₹{item.startingPrice?.toLocaleString('en-IN') || "9,999"}</p><div className="bg-white text-primary text-[7px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">VIEW <Eye className="w-2 h-2" /></div></div><div className="absolute inset-x-0 bottom-0 p-1.5 bg-black/40 backdrop-blur-[2px] group-hover/card:opacity-0 transition-opacity"><span className="text-[8px] font-black text-white uppercase tracking-tighter block text-center truncate">{item.name}</span></div></button></div>))}</div></div><button type="button" onClick={() => emblaInspireApi?.scrollPrev()} className="absolute -left-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white shadow-lg rounded-full flex items-center justify-center text-primary border border-slate-100 opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10"><ChevronLeft className="w-3.5 h-3.5" /></button><button type="button" onClick={() => emblaInspireApi?.scrollNext()} className="absolute -right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white shadow-lg rounded-full flex items-center justify-center text-primary border border-slate-100 opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10"><ChevronRight className="w-3.5 h-3.5" /></button></div>
                            </div>
                            <button type="submit" disabled={!form.destination} className="w-full bg-primary text-white hover:bg-accent hover:text-primary font-black uppercase tracking-[0.2em] text-[11px] py-3.5 rounded-xl transition-all duration-300 disabled:opacity-30 shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group/btn">Configure My Trip <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" /></button>
                          </div>
                        )}
                      </form>
                    )}
                  </div>
                </div>
                <div className="lg:col-span-4 bg-slate-50/80 p-3 md:p-4 border-l border-slate-100 flex flex-col gap-3">
                  <div className="bg-white/60 p-3 rounded-2xl border border-white shadow-sm">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-primary/40 mb-3 text-center">Why Choose Us</h3>
                    <div className="grid grid-cols-3 gap-1">
                      {HOME_FEATURES.map((item, idx) => (
                        <div key={`feature-${idx}`} className="flex flex-col items-center text-center p-1.5 rounded-xl border border-slate-50 bg-white/40 hover:bg-white transition-all group">
                          <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center mb-1 shadow-md shadow-primary/5 transition-transform group-hover:scale-110"><item.icon className="w-3 h-3 text-accent" /></div>
                          <h4 className="text-[8px] font-black text-primary uppercase tracking-tight leading-none mb-0.5 truncate w-full">{item.title}</h4>
                          <p className="text-[8px] text-slate-700 font-bold leading-none tracking-tight">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-primary rounded-2xl p-4 text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
                    <div className="relative z-10 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2"><Headset className="w-3 h-3 text-accent" /><h4 className="text-[9px] font-black uppercase tracking-widest text-white">Callback Request</h4></div>
                      {callbackRequested ? (
                        <div className="bg-green-500/20 border border-green-500/30 p-1.5 rounded-lg flex items-center justify-center gap-2 animate-in zoom-in-95"><CheckCircle className="w-2.5 h-2.5 text-green-400" /><span className="text-[8px] font-bold">Received!</span></div>
                      ) : (
                        <form onSubmit={handleCallbackRequest} className="space-y-1">
                          <div className="flex gap-1">
                            <div className="flex-1 bg-white/10 border border-white/5 rounded-lg px-2 py-1.5 flex items-center gap-1.5 focus-within:border-accent transition-colors"><Phone className="w-2.5 h-2.5 text-accent" /><input type="tel" required placeholder="Phone" value={form.callbackPhone} onChange={e => setForm(f => ({ ...f, callbackPhone: e.target.value }))} className="bg-transparent border-none outline-none text-[9px] font-bold placeholder:text-white/30 w-full" /></div>
                            <div className="bg-white/10 border border-white/5 rounded-lg px-2 py-1.5 flex items-center gap-1.5 focus-within:border-accent transition-colors"><Clock className="w-2.5 h-2.5 text-accent" /><select value={form.callbackTime} onChange={e => setForm(f => ({ ...f, callbackTime: e.target.value }))} className="bg-transparent border-none outline-none text-[9px] font-bold text-white appearance-none cursor-pointer"><option className="text-primary" value="Morning">AM</option><option className="text-primary" value="Afternoon">PM</option></select></div>
                          </div>
                          <button type="submit" className="w-full bg-accent text-primary text-[9px] font-black uppercase py-2 rounded-lg hover:bg-white transition-all">Submit Lead</button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {sponsoredAds.length > 0 && !submitted && (
                <div className="border-t border-slate-100">
                  <div className="relative group/ad overflow-hidden">
                    <div className="overflow-hidden" ref={emblaAdRef}>
                      <div className="flex">{sponsoredAds.map((ad) => (<div key={ad.id} className="flex-[0_0_100%] min-w-0"><Link href={ad.link || "/"}><div className="relative aspect-[8/1] w-full bg-primary overflow-hidden"><img src={ad.imageUrl} alt={ad.title} className="absolute inset-0 w-full h-full object-cover opacity-80" /><div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" /><div className="absolute inset-0 flex items-center justify-between px-10"><div className="flex items-center gap-4"><span className="bg-accent text-primary text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">{ad.tag || "OFFER"}</span><div className="flex flex-col"><h3 className="text-[11px] font-black text-white uppercase leading-none">{ad.title}</h3><p className="text-white/50 text-[7px] font-medium italic mt-0.5">{ad.description}</p></div></div><div className="hidden md:flex items-center gap-2"><span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Sponsored</span><div className="bg-white text-primary text-[8px] font-black px-5 py-1.5 rounded-lg flex items-center gap-2 shadow-xl uppercase tracking-tighter hover:bg-accent transition-colors">{ad.ctaText || "Check"} <ArrowRight className="w-3 h-3" /></div></div></div><div className="absolute bottom-0 right-0 flex items-center gap-0.5 bg-black/40 backdrop-blur-sm px-1 py-0.5 rounded-tl-md"><span className="text-[6px] font-bold text-white/40">Ad</span><Info className="w-1.5 h-1.5 text-white/20" /></div></div></Link></div>))}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Holiday Collections */}
      {themes.length > 0 && (
        <section className="py-12 bg-slate-50/50">
          <div className="container mx-auto px-4">
            <div className="mb-8 border-l-4 border-primary pl-4"><p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-1">Inspiration</p><h2 className="text-xl md:text-3xl font-serif font-black text-primary uppercase">Holiday Collections</h2></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {themes.slice(0, 20).map((theme) => (
                <button key={`coll-${theme.label}`} onClick={() => { setForm(f => ({ ...f, theme: theme.label })); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-100 hover:shadow-2xl transition-all duration-500">
                  <img src={theme.imageUrl || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmMmY1Ii8+PC9zdmc+"} className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-primary/90 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-4 z-10">
                    <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">Explore</p>
                    <h4 className="text-xs font-black text-white uppercase text-center mb-2 line-clamp-1 px-2">{theme.label} <span className="text-white/70">Tours</span></h4>
                    <div className="mt-auto bg-accent text-primary text-[9px] font-black px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">VIEW DETAILS <Eye className="w-3 h-3" /></div>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full p-2.5 bg-primary/95 backdrop-blur-sm border-t border-white/10 group-hover:opacity-0 transition-opacity"><p className="text-[10px] font-black text-accent uppercase tracking-tighter truncate text-center">{theme.label} <span className="text-white">Tours</span></p></div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. POPULAR THEME PACKAGES - HIGH PERFORMANCE CAROUSEL (7+1) */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="border-l-4 border-primary pl-4">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-2">Curated Experience</p>
              <h2 className="text-2xl md:text-4xl font-serif font-black text-primary uppercase leading-none">Popular Theme Packages</h2>
            </div>

            <div className="relative group/theme-slider max-w-full md:max-w-2xl">
              <div className="overflow-hidden" ref={emblaThemeFilterRef}>
                <div className="flex gap-2">
                  <div className="flex-[0_0_auto] min-w-fit">
                    <button onClick={() => setActiveTheme("All")} className={cn("px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", activeTheme === "All" ? "bg-primary text-white shadow-lg" : "bg-slate-50 text-slate-400 hover:bg-slate-100")}>All</button>
                  </div>
                  {themes.map(t => (
                    <div key={`theme-${t.label}`} className="flex-[0_0_auto] min-w-fit">
                      <button onClick={() => setActiveTheme(t.label)} className={cn("px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", activeTheme === t.label ? "bg-primary text-white shadow-lg" : "bg-slate-50 text-slate-400 hover:bg-slate-100")}>{t.label}</button>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => emblaThemeFilterApi?.scrollPrev()} className="absolute -left-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-white shadow-xl rounded-full flex items-center justify-center text-primary border border-slate-100 opacity-0 group-hover/theme-slider:opacity-100 transition-opacity z-10"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => emblaThemeFilterApi?.scrollNext()} className="absolute -right-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-white shadow-xl rounded-full flex items-center justify-center text-primary border border-slate-100 opacity-0 group-hover/theme-slider:opacity-100 transition-opacity z-10"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="relative group/pkg-carousel">
            <div className="overflow-hidden px-4 -mx-4" ref={emblaPackageRef}>
              <div className="flex gap-6">
                <AnimatePresence mode="popLayout">
                  {loadingPackages ? (
                    /* SKELETON LOADING */
                    [1, 2, 3, 4, 5, 6, 7].map(i => (
                      <div key={`skeleton-card-${i}`} className="flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_23%] min-w-0">
                        <div className="aspect-[3/4] bg-slate-50 rounded-[2rem] animate-pulse" />
                      </div>
                    ))
                  ) : (
                    <>
                      {displayPackages.map((pkg) => (
                        <div key={`pkg-slide-${pkg.id}`} className="flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_23%] min-w-0">
                          <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
                            <PackageCard pkg={pkg} />
                          </motion.div>
                        </div>
                      ))}

                      {/* PERSISTENT CUSTOM CTA CARD - ALWAYS LAST IN CAROUSEL */}
                      <div key="custom-cta-slide" className="flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_23%] min-w-0">
                        <motion.div layout className="group h-full min-h-[420px] rounded-[2rem] overflow-hidden bg-primary relative flex flex-col items-center justify-center p-8 text-center border-4 border-dashed border-white/10 hover:border-accent/30 transition-all duration-500 shadow-2xl">
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                          <div className="relative z-10">
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6 mx-auto backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform">
                              <Sparkles className="w-8 h-8 text-accent" />
                            </div>
                            <h3 className="text-xl font-serif font-black text-white mb-4 uppercase leading-tight">Can't find your <span className="text-accent italic">ideal tour?</span></h3>
                            <p className="text-white/60 text-xs font-medium mb-8 leading-relaxed">Let our experts craft a 100% custom itinerary tailored to your vision.</p>
                            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="bg-accent text-primary text-[10px] font-black uppercase tracking-widest py-3.5 px-6 rounded-2xl shadow-xl hover:bg-white transition-all flex items-center gap-2 mx-auto group/cta">
                              Customize Now <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/cta:translate-x-1" />
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Carousel Controls */}
            <button onClick={() => emblaPackageApi?.scrollPrev()} className="absolute -left-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-2xl rounded-full flex items-center justify-center text-primary border border-slate-100 opacity-0 group-hover/pkg-carousel:opacity-100 transition-all z-20 hover:bg-primary hover:text-white"><ChevronLeft className="w-6 h-6" /></button>
            <button onClick={() => emblaPackageApi?.scrollNext()} className="absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-2xl rounded-full flex items-center justify-center text-primary border border-slate-100 opacity-0 group-hover/pkg-carousel:opacity-100 transition-all z-20 hover:bg-primary hover:text-white"><ChevronRight className="w-6 h-6" /></button>
          </div>
        </div>
      </section>

      {/* 5. REVIEWS SECTION - MATCHING REFERENCE IMAGE */}
      <section className="py-20 bg-slate-50/30 overflow-hidden border-t border-slate-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-xl md:text-2xl font-black text-primary uppercase tracking-tight flex items-center gap-3">
              What customers <span className="text-accent">says about us</span>
            </h2>
            <div className="flex gap-2">
              <button onClick={() => emblaReviewApi?.scrollPrev()} className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 hover:bg-primary hover:text-white transition-all flex items-center justify-center"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={() => emblaReviewApi?.scrollNext()} className="w-8 h-8 rounded-full bg-primary text-white hover:bg-accent hover:text-primary transition-all flex items-center justify-center shadow-lg shadow-primary/20"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden px-4 -mx-4" ref={emblaReviewRef}>
              <div className="flex gap-8">
                {testimonials.map((rev) => (
                  <div key={rev.id} className="flex-[0_0_90%] sm:flex-[0_0_45%] lg:flex-[0_0_31%] min-w-0 py-4">
                    <div className="relative bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-50 h-full flex flex-col">
                      {/* Avatar Badge */}
                      <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                        <img src={rev.avatar || rev.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rev.name}`} alt={rev.name} className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1 pt-4">
                        <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed italic line-clamp-4 relative">
                          "{rev.content || rev.comment}"
                          {rev.content && rev.content.length > 150 && <span className="text-accent font-black ml-1 cursor-pointer">Read more</span>}
                        </p>
                      </div>

                      <div className="mt-8 flex flex-col items-end">
                        <div className="flex gap-0.5 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={cn("w-3 h-3 fill-accent text-accent", i >= (rev.rating || 5) && "fill-slate-200 text-slate-200")} />
                          ))}
                        </div>
                        <h4 className="text-[11px] font-black text-primary uppercase tracking-wider">{rev.name}</h4>
                        {rev.location && <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{rev.location}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
