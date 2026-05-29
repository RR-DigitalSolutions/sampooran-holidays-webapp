"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useListPackages, useListDestinations, customFetch } from "@workspace/api-client-react";
import { PackageCard } from "@/components/PackageCard";
import { MapPin, ChevronRight, CheckCircle2, Sparkles, Phone, MessageSquare, List as ListIcon, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const STATE_DATA: Record<string, any> = {
  "himachal-pradesh": {
    name: "Himachal Pradesh", tagline: "The Land of Gods",
    description: "Nestled in the western Himalayas, Himachal Pradesh is a paradise for adventure seekers, nature lovers, and spiritual pilgrims alike.",
    imageUrl: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1920",
    highlights: ["Rohtang Pass", "Solang Valley", "Kufri Snow Point", "Spiti Valley", "Dharamshala", "Dalhousie", "Kasauli"],
    cities: [
      { name: "Manali", slug: "manali", desc: "Adventure capital â€” snow peaks, river rafting, Rohtang Pass" },
      { name: "Shimla", slug: "shimla", desc: "Queen of Hills â€” Mall Road, Kufri, colonial heritage" },
      { name: "Dharamshala", slug: "dharamshala", desc: "Little Lhasa â€” Tibetan culture, cricket stadium, Triund trek" },
    ],
  },
};

export default function CountryPageClient({ countrySlug: propCountrySlug, regionSlug }: { countrySlug?: string; regionSlug?: string }) {
  const params = useParams<{ country: string; continent: string }>();
  const countrySlug = propCountrySlug || params?.country || "japan-tourism";
  const continentSlug = regionSlug || params?.continent || "asia";
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  
  // Dynamic state data from API
  const { data: dbState } = useQuery({
    queryKey: ["country", countrySlug],
    queryFn: () => customFetch<any>(`/api/countries/${countrySlug}`),
    enabled: !!countrySlug,
  });

  const staticFallback = STATE_DATA[countrySlug ?? ""] ?? STATE_DATA["himachal-pradesh"];

  const parseFaqs = (v: any): Array<{question: string; answer: string}> => {
    if (!v) return [];
    if (Array.isArray(v)) return v.filter((f: any) => f && f.question);
    try { const p = JSON.parse(v); return Array.isArray(p) ? p.filter((f: any) => f && f.question) : []; } catch { return []; }
  };
  
  // Merge dynamic data with static fallback
  const s = {
    ...staticFallback,
    ...(dbState || {}),
    name: dbState?.name || staticFallback.name,
    description: dbState?.description || staticFallback.description,
    longDescription: dbState?.longDescription,
    imageUrl: dbState?.imageUrl || staticFallback.imageUrl,
    heroVideoUrl: dbState?.heroVideoUrl || staticFallback.heroVideoUrl,
    highlights: dbState?.highlights || staticFallback.highlights,
    faqs: parseFaqs(dbState?.faqs),
  };

  const { data: pkgData } = useListPackages({ state: s.name }, { query: { enabled: !!s.name } } as any);
  const { data: destData } = useListDestinations();

  const apiPlaces = destData?.destinations?.filter((d: any) => d.stateName?.toLowerCase() === s.name.toLowerCase()) || [];
  const displayPlaces = apiPlaces.length > 0 ? apiPlaces : s.cities;
  const packages = pkgData?.packages || [];

  return (
    <div className="bg-slate-50 font-sans min-h-screen">
      {/* â”€â”€ Premium State Hero â”€â”€ */}
      <section className="relative h-[65vh] min-h-[480px] max-h-[720px] overflow-hidden -mt-24 md:-mt-28 group">
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2 }}
          className="absolute inset-0"
        >
          {s.heroVideoUrl ? (
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="w-full h-full object-cover"
              src={s.heroVideoUrl}
            />
          ) : (
            <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B1A] via-[#0A0B1A]/40 to-transparent" />
        </motion.div>

        {/* Hero Bottom Content */}
        <div className="absolute inset-x-0 bottom-0 pb-20 z-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                <nav className="flex items-center gap-2 text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                  <Link href="/" className="hover:text-white transition-colors">Home</Link>
                  <ChevronRight className="h-3 w-3 opacity-50" />
                  <Link href="/world-tourism" className="hover:text-white transition-colors">World</Link>
                  <ChevronRight className="h-3 w-3 opacity-50" />
                  <Link href={`/world-tourism/${continentSlug}`} className="hover:text-white transition-colors capitalize">{continentSlug}</Link>
                  <ChevronRight className="h-3 w-3 opacity-50" />
                  <span className="text-accent underline underline-offset-4 decoration-2">{s.name}</span>
                </nav>

                <p className="text-accent text-[11px] font-black uppercase tracking-[0.4em] mb-4">{s.tagline || "Tour Packages & Luxury Travel"}</p>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-black text-white mb-6 leading-[0.92] tracking-tight drop-shadow-2xl">
                  {s.name} <span className="text-accent">.</span>
                </h1>
                <p className="max-w-2xl text-base md:text-xl text-slate-100 font-medium leading-relaxed mb-10">
                  {s.description}
                </p>

                <div className="flex flex-wrap gap-4">
                  <Link href="#packages" className="inline-flex items-center justify-center rounded-full bg-accent px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-accent/30 hover:bg-accent/90 transition-all">
                    Explore Packages
                  </Link>
                  <Link href="/customized-holidays" className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-white hover:border-white hover:bg-white/15 transition-all backdrop-blur-sm">
                    Request a Quote
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16">
          
          {/* â”€â”€ LEFT SIDEBAR â”€â”€ */}
          <div className="lg:col-span-3 space-y-8">
            {/* Quick Links / Destinations Filter Widget */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
              <h3 className="text-2xl font-serif font-black text-primary italic mb-6">Explore <span className="text-accent not-italic">Places.</span></h3>
              <div className="space-y-2">
                {displayPlaces.map((city: any, idx: number) => (
                  <Link 
                    key={idx} 
                    href={`/world-tourism/${continentSlug}/${countrySlug}/${city.slug}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <span className="font-bold text-slate-600 group-hover:text-primary">{city.name}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-accent transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Highlights Card */}
            {s.highlights && s.highlights.length > 0 && (
              <div className="bg-[#0A0B1A] text-white rounded-[2rem] p-8 shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Sparkles className="h-32 w-32 text-accent" />
                 </div>
                 <div className="relative z-10">
                    <h3 className="text-2xl font-serif font-black mb-6 italic">Expert <span className="text-accent not-italic">Highlights.</span></h3>
                    <div className="space-y-4">
                      {s.highlights.map((h: string, i: number) => (
                        <div key={i} className="flex items-start gap-4 group/item">
                          <div className="mt-1 shrink-0 w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover/item:bg-accent transition-all">
                             <CheckCircle2 className="h-3 w-3 text-accent group-hover/item:text-white" />
                          </div>
                          <span className="text-sm font-bold text-white/80 group-hover/item:text-white transition-colors leading-snug">{h}</span>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>
            )}
            
            {/* CTA Contact */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-xl shadow-slate-200/40 text-center">
               <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-accent">
                  <Phone className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-serif font-black text-primary italic mb-4">Need Help?</h3>
               <p className="text-slate-500 font-medium text-sm mb-6">Talk to our experts for a tailored {s.name} trip.</p>
               <a href="tel:+918595513009">
                 <button className="w-full bg-primary text-white rounded-xl py-4 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 hover:bg-accent transition-colors">
                    Call Us Now
                 </button>
               </a>
            </div>
          </div>

          {/* â”€â”€ RIGHT MAIN CONTENT â”€â”€ */}
          <div className="lg:col-span-9 space-y-16">
            
            {/* About / Guide Details */}
            {s.longDescription && (
              <section id="about" className="scroll-mt-32">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-1 bg-accent rounded-full" />
                    <span className="text-accent text-xs font-black uppercase tracking-[0.3em]">The Guide</span>
                 </div>
                 <h2 className="text-4xl md:text-5xl font-serif font-black text-primary mb-8 italic leading-[1.1]">The Magic of <br /><span className="text-accent not-italic">{s.name}.</span></h2>
                 
                 <div className="prose prose-lg prose-slate max-w-none text-slate-600 font-medium leading-relaxed">
                   <p className="whitespace-pre-line first-letter:text-6xl first-letter:font-black first-letter:text-accent first-letter:mr-3 first-letter:float-left first-letter:leading-[0.8]">
                     {s.longDescription}
                   </p>
                 </div>
              </section>
            )}

            {/* Packages List */}
            <section id="packages" className="scroll-mt-32">
               <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-6">
                 <div>
                   <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-1 bg-accent rounded-full" />
                      <span className="text-accent text-[10px] font-black uppercase tracking-[0.3em]">Tours & Packages</span>
                   </div>
                   <h2 className="text-4xl md:text-5xl font-serif font-black text-primary italic leading-[1]">Featured <span className="text-accent not-italic">Packages.</span></h2>
                 </div>

                 {/* View Mode Toggle */}
                 <div className="flex items-center bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit">
                    <button 
                      onClick={() => setViewMode("list")}
                      className={`p-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "list" ? "bg-primary text-white shadow-md" : "text-slate-400 hover:text-primary"}`}
                    >
                      <ListIcon className="w-4 h-4" /> <span className="hidden sm:inline">List</span>
                    </button>
                    <button 
                      onClick={() => setViewMode("grid")}
                      className={`p-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "grid" ? "bg-primary text-white shadow-md" : "text-slate-400 hover:text-primary"}`}
                    >
                      <LayoutGrid className="w-4 h-4" /> <span className="hidden sm:inline">Grid</span>
                    </button>
                 </div>
               </div>

               {packages.length > 0 ? (
                 <div className={viewMode === "list" ? "flex flex-col gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-8"}>
                   {packages.map((pkg: any, idx: number) => (
                     <motion.div 
                       key={pkg.id}
                       initial={{ opacity: 0, y: 20 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       transition={{ delay: idx * 0.05 }}
                       viewport={{ once: true }}
                     >
                       <PackageCard pkg={pkg} variant={viewMode === "list" ? "horizontal" : "default"} />
                     </motion.div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                   <Sparkles className="h-16 w-16 text-slate-200 mx-auto mb-6" />
                   <h3 className="text-2xl font-serif font-black text-primary italic mb-3">Packages arriving soon.</h3>
                   <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8">Our curators are currently crafting exclusive deals for {s.name}.</p>
                   <Link href="/customized-holidays">
                     <button className="bg-primary text-white rounded-xl px-10 py-4 font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-primary/20">
                       Request Custom Tour
                     </button>
                   </Link>
                 </div>
               )}
            </section>

            {/* Popular Destinations Grid (Secondary now, Packages are primary) */}
            {displayPlaces.length > 0 && (
              <section id="places" className="scroll-mt-32 pt-10 border-t border-slate-200">
                 <div className="flex items-center justify-between mb-10">
                    <h2 className="text-3xl font-serif font-black text-primary italic">Popular Destinations.</h2>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayPlaces.map((city: any, idx: number) => (
                      <Link key={idx} href={`/world-tourism/${continentSlug}/${countrySlug}/${city.slug}`}>
                        <div className="group relative rounded-3xl overflow-hidden h-48 bg-slate-900 shadow-xl shadow-slate-200/50">
                           <img 
                             src={city.imageUrl || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600"} 
                             alt={city.name} 
                             className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" 
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B1A]/90 to-transparent" />
                           <div className="absolute bottom-4 left-6 right-4">
                              <h3 className="text-2xl font-serif font-black text-white italic mb-1">{city.name}</h3>
                              <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-accent group-hover:translate-x-2 transition-transform">
                                 Explore <ChevronRight className="h-3 w-3" />
                              </div>
                           </div>
                        </div>
                      </Link>
                    ))}
                 </div>
              </section>
            )}

            {/* FAQs — Animated Accordion */}
            {s.faqs?.length > 0 && (
              <section id="faq" className="scroll-mt-32 pt-10 border-t border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-1 bg-accent rounded-full" />
                  <span className="text-accent text-[11px] font-black uppercase tracking-[0.25em]">Common Queries</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-serif font-black text-primary italic mb-10">
                  Travel <span className="text-accent not-italic">FAQs.</span>
                </h2>

                <Accordion type="single" collapsible className="w-full space-y-3">
                  {s.faqs.map((faq: any, i: number) => (
                    <AccordionItem
                      key={i}
                      value={`faq-${i}`}
                      className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm data-[state=open]:border-primary/30 data-[state=open]:shadow-lg transition-all"
                    >
                      <AccordionTrigger className="hover:no-underline px-6 py-5 text-left text-slate-800 font-bold text-base data-[state=open]:text-primary [&>svg]:hidden">
                        <div className="flex items-center gap-4 w-full pr-4">
                          <span className="shrink-0 w-7 h-7 rounded-full bg-slate-100 text-slate-400 text-xs font-black flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="flex-1 text-left">{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6 pl-[4.25rem]">
                        <div className="h-px bg-slate-100 mb-4" />
                        <p className="text-slate-600 text-sm leading-relaxed font-medium whitespace-pre-line">
                          {faq.answer}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
