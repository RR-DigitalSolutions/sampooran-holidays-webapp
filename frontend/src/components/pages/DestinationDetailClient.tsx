"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useGetDestination, useListPackages } from "@workspace/api-client-react";
import {
  MapPin, Clock, Thermometer, Mountain, ChevronRight,
  CheckCircle, Plane, Train, Globe, LayoutGrid, List as ListIcon, Play
} from "lucide-react";
import { PackageCard } from "@/components/PackageCard";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Fallback data for development
const FALLBACK_DESTINATIONS: Record<string, any> = {
  "manali": {
    name: "Manali",
    slug: "manali",
    stateName: "Himachal Pradesh",
    countryName: "India",
    imageUrl: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1920",
    description: "The adventure capital of India, offering thrilling experiences and stunning mountain landscapes.",
    longDescription: "Nestled in the picturesque Beas River valley, Manali is a high-altitude Himalayan resort town in India's northern Himachal Pradesh state. It has a reputation as a backpacking center and honeymoon destination.",
    highlights: ["Rohtang Pass (13,050 ft)", "Solang Valley Adventure Sports", "Hadimba Devi Temple", "Beas River Rafting"],
    activities: ["Mountain Biking", "Paragliding", "Trekking", "River Rafting", "Skiing in Winter"],
    localAttractions: ["Jogini Waterfall", "Naggar Castle", "Kullu Valley", "Van Vihar National Park"],
    altitude: "2,050 m",
    temperature: "-15Â°C to 25Â°C",
    bestTimeToVisit: "October to February",
    nearestAirport: "Bhuntar (50 km)",
    nearestRailway: "Chandigarh (240 km)",
    howToReach: "Accessible by air via Bhuntar airport, or by road from Delhi (14 hours) or Chandigarh (8 hours).",
    rating: 4.8,
    reviewCount: 320,
    galleryImages: [
      "https://images.unsplash.com/photo-1605649487212-4d4b23b8f6bc?w=600",
      "https://images.unsplash.com/photo-1596525164807-6bb302bb6071?w=600",
      "https://images.unsplash.com/photo-1622308644420-a006c3d4a6f7?w=600",
      "https://images.unsplash.com/photo-1581793745862-f9d45e454911?w=600"
    ]
  },
};

export default function DestinationDetailClient({ slug: propSlug }: { slug?: string }) {
  const params = useParams<{ slug?: string; place?: string }>();
  const slug = propSlug || params?.slug || params?.place || "";

  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  // Fetch from API or use fallback
  const { data: apiDestination } = useGetDestination(slug, {
    query: { enabled: !!slug },
  } as any);

  const fallback = FALLBACK_DESTINATIONS[slug] || FALLBACK_DESTINATIONS["manali"];

  // Safely parse faqs from either JSONB array or raw JSON string
  const parseFaqs = (v: any): Array<{ question: string; answer: string }> => {
    if (!v) return [];
    if (Array.isArray(v)) return v.filter((f: any) => f && f.question);
    try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
  };

  const d = {
    ...(apiDestination || fallback),
    faqs: parseFaqs((apiDestination || fallback)?.faqs),
  };

  const { data: packagesData } = useListPackages({}, {
    query: { enabled: !!slug },
  } as any);

  const relatedPackages = packagesData?.packages?.filter(
    (pkg: { destinationName?: string; stateName?: string; cities?: string[] }) => 
      pkg.destinationName?.toLowerCase() === d.name?.toLowerCase() ||
      pkg.stateName?.toLowerCase() === d.stateName?.toLowerCase() ||
      pkg.cities?.some(c => c.toLowerCase() === d.name?.toLowerCase())
  ) || [];

  return (
    <div className="bg-slate-50 font-sans min-h-screen">
      {/* â•â•â•â•â•â•â•â• HERO SECTION â•â•â•â•â•â•â•â• */}
      <section className="relative h-[65vh] min-h-[500px] max-h-[800px] overflow-hidden -mt-24 md:-mt-28">
        {/* Background Image / Video */}
        {d.heroVideoUrl ? (
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover"
            src={d.heroVideoUrl}
          />
        ) : (
          <Image
            src={d.imageUrl || "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1920"}
            alt={d.name || "Destination"}
            fill
            className="absolute inset-0 w-full h-full object-cover"
            priority
          />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B1A] via-[#0A0B1A]/40 to-transparent" />

        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 pb-16 z-20">
          <div className="container mx-auto px-4 lg:px-8">
            {/* Top Navigation */}
            <nav className="flex items-center gap-2 text-white/70 text-xs font-black uppercase tracking-[0.2em] mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="h-3 w-3 opacity-50" />
              <Link href="/destinations" className="hover:text-white transition-colors">Destinations</Link>
              <ChevronRight className="h-3 w-3 opacity-50" />
              <span className="text-accent underline underline-offset-4 decoration-2">{d.name}</span>
            </nav>

            <div className="max-w-4xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="text-accent text-[11px] font-black uppercase tracking-[0.4em] bg-accent/10 px-3 py-1 rounded-full backdrop-blur-sm border border-accent/20">
                  {d.stateName} â€¢ {d.countryName || "India"}
                </div>
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-black text-white mb-6 leading-[0.92] tracking-tight drop-shadow-2xl">
                {d.name} <span className="text-accent">.</span>
              </h1>

              <p className="text-lg md:text-xl text-slate-200 max-w-2xl leading-relaxed mb-8 font-medium">
                {d.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â• MAIN CONTENT â•â•â•â•â•â•â•â• */}
      <main className="container mx-auto px-4 lg:px-8 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16">
          
          {/* â”€â”€ LEFT SIDEBAR (Filters & Info) â”€â”€ */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Key Info Widget */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
              <h3 className="text-2xl font-serif font-black text-primary italic mb-6">Quick <span className="text-accent not-italic">Info.</span></h3>
              <div className="space-y-6">
                {d.altitude && (
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Mountain className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Altitude</p>
                      <p className="font-bold text-slate-800">{d.altitude}</p>
                    </div>
                  </div>
                )}
                {d.temperature && (
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                      <Thermometer className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Temperature</p>
                      <p className="font-bold text-slate-800">{d.temperature}</p>
                    </div>
                  </div>
                )}
                {d.bestTimeToVisit && (
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Best Time</p>
                      <p className="font-bold text-slate-800">{d.bestTimeToVisit}</p>
                    </div>
                  </div>
                )}
                {(d as any).rating && (
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rating</p>
                      <p className="font-bold text-slate-800">{(d as any).rating}/5.0 <span className="text-xs text-slate-400 font-medium">({(d as any).reviewCount || 100} reviews)</span></p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* How to Reach Widget */}
            {(d.nearestAirport || d.nearestRailway) && (
              <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
                 <h3 className="text-2xl font-serif font-black text-primary italic mb-6">Transit.</h3>
                 <div className="space-y-5">
                   {d.nearestAirport && (
                     <div>
                       <div className="flex items-center gap-2 mb-1 text-slate-700 font-bold">
                         <Plane className="h-4 w-4 text-accent" /> Nearest Airport
                       </div>
                       <p className="text-sm text-slate-500 font-medium ml-6">{d.nearestAirport}</p>
                     </div>
                   )}
                   {d.nearestRailway && (
                     <div>
                       <div className="flex items-center gap-2 mb-1 text-slate-700 font-bold">
                         <Train className="h-4 w-4 text-accent" /> Nearest Railway
                       </div>
                       <p className="text-sm text-slate-500 font-medium ml-6">{d.nearestRailway}</p>
                     </div>
                   )}
                 </div>
              </div>
            )}
          </div>

          {/* â”€â”€ RIGHT COLUMN (Content & Packages) â”€â”€ */}
          <div className="lg:col-span-9 space-y-16">
             
            {/* About Section */}
            {(d.longDescription || d.description) && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-1 bg-accent rounded-full" />
                   <span className="text-accent text-xs font-black uppercase tracking-[0.3em]">About</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-serif font-black text-primary italic mb-8">Discover <span className="text-accent not-italic">{d.name}.</span></h2>
                <div className="prose prose-lg prose-slate max-w-none text-slate-600 font-medium leading-relaxed">
                  <p className="first-letter:text-6xl first-letter:font-black first-letter:text-accent first-letter:mr-3 first-letter:float-left first-letter:leading-[0.8]">
                    {d.longDescription || d.description}
                  </p>
                  {d.howToReach && (
                    <div className="mt-8 bg-slate-100 p-6 rounded-2xl border border-slate-200">
                       <h4 className="font-bold text-primary mb-2 flex items-center gap-2"><MapPin className="h-4 w-4 text-accent"/> How to reach</h4>
                       <p className="text-sm">{d.howToReach}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Gallery Section */}
            {d.galleryImages && d.galleryImages.length > 0 && (
               <section>
                 <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-1 bg-accent rounded-full" />
                   <span className="text-accent text-xs font-black uppercase tracking-[0.3em]">Gallery</span>
                 </div>
                 <h2 className="text-4xl md:text-5xl font-serif font-black text-primary italic mb-8">Visual <span className="text-accent not-italic">Tour.</span></h2>
                 
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {d.galleryImages.slice(0, 4).map((img: string, idx: number) => (
                      <div key={idx} className={`relative rounded-2xl overflow-hidden group ${idx === 0 ? "col-span-2 row-span-2 h-64 md:h-80" : "h-32 md:h-36"}`}>
                         <img src={img} alt={`${d.name} gallery ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                         <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                      </div>
                    ))}
                 </div>
               </section>
            )}

            {/* Attractions / Highlights */}
            <div className="grid md:grid-cols-2 gap-8">
              {d.highlights && d.highlights.length > 0 && (
                <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/30">
                  <h3 className="text-2xl font-serif font-black text-primary mb-6 flex items-center gap-3">
                     <CheckCircle className="h-6 w-6 text-accent" /> Highlights
                  </h3>
                  <ul className="space-y-4">
                    {d.highlights.map((h: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 text-slate-600 font-medium">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              
              {d.activities && d.activities.length > 0 && (
                <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/30">
                  <h3 className="text-2xl font-serif font-black text-primary mb-6 flex items-center gap-3">
                     <Play className="h-6 w-6 text-accent" /> Activities
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {d.activities.map((act: string, idx: number) => (
                      <span key={idx} className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700">
                        {act}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* â”€â”€ PACKAGES SECTION (OTA Style) â”€â”€ */}
            <section id="packages" className="scroll-mt-32 pt-10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-10 h-1 bg-accent rounded-full" />
                     <span className="text-accent text-xs font-black uppercase tracking-[0.3em]">Packages</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-serif font-black text-primary italic leading-[1]">Curated <br/><span className="text-accent not-italic">Itineraries.</span></h2>
                </div>
                
                {/* View Toggle */}
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

              {relatedPackages.length > 0 ? (
                <div className={viewMode === "list" ? "flex flex-col gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-8"}>
                  {relatedPackages.map((pkg: any) => (
                    <motion.div 
                      key={pkg.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                    >
                       <PackageCard pkg={pkg} variant={viewMode === "list" ? "horizontal" : "default"} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                  <h3 className="text-2xl font-serif font-black text-primary italic mb-3">No packages available yet.</h3>
                  <p className="text-slate-500 font-medium">Our travel experts are crafting the perfect itineraries for {d.name}.</p>
                  <Link href="/customized-holidays">
                    <button className="mt-8 bg-primary text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform">
                      Request Custom Itinerary
                    </button>
                  </Link>
                </div>
              )}
            </section>

            {/* ── FAQs ── Powered by CMS JSONB data */}
            {d.faqs?.length > 0 && (
              <section id="faq" className="scroll-mt-32 pt-10 border-t border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-1 bg-accent rounded-full" />
                  <span className="text-accent text-[11px] font-black uppercase tracking-[0.25em]">Common Queries</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-serif font-black text-primary italic mb-10">
                  Travel <span className="text-accent not-italic">FAQs.</span>
                </h2>

                <Accordion type="single" collapsible className="w-full space-y-3">
                  {d.faqs.map((faq: { question: string; answer: string }, i: number) => (
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
