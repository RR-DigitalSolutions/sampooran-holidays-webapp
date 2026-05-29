"use client";

import Image from "next/image";
import Link from "next/link";
import {
  MapPin, ChevronRight, Compass, Info, CheckCircle,
  Clock, Plane, Train, ShoppingBag, Heart, AlertTriangle,
  Globe, ChevronDown, ChevronUp, UtensilsCrossed, Camera,
  Zap, Users,
} from "lucide-react";
import { useState } from "react";

// ─── FAQ ACCORDION ─────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-slate-50 transition-colors"
      >
        <span className="font-semibold text-slate-800 text-sm pr-4">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-primary shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
          <p className="text-slate-600 text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

// ─── PILL LIST ─────────────────────────────────────────────────────────────────
function PillList({ items, color = "blue" }: { items: string[]; color?: "blue" | "green" | "amber" | "purple" | "rose" }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-green-50 text-green-700 border-green-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
  };
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span key={i} className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${colors[color]}`}>{item}</span>
      ))}
    </div>
  );
}

// ─── SECTION CARD ──────────────────────────────────────────────────────────────
function SectionCard({ icon: Icon, title, iconColor = "text-primary", children }: { icon: any; title: string; iconColor?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 font-serif">
        <Icon className={`w-5 h-5 ${iconColor}`} /> {title}
      </h3>
      {children}
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────

interface TravelGuideData {
  title: string;
  slug: string;
  entityType?: string;
  heroImageUrl?: string;
  heroVideoUrl?: string;
  shortDescription?: string;
  fullContent?: string;
  bestTimeToVisit?: string;
  howToReach?: string;
  nearestAirport?: string;
  nearestRailway?: string;
  localLanguage?: string;
  currency?: string;
  timezone?: string;
  visaInfo?: string;
  highlights?: string[];
  thingsToDo?: string[];
  topAttractions?: string[];
  localCuisine?: string[];
  activities?: string[];
  festivals?: string[];
  famousFor?: string[];
  packingList?: string[];
  travelTips?: string[];
  historyAndCulture?: string;
  geography?: string;
  weatherAndClimate?: string;
  transportation?: string;
  currencyAndPayments?: string;
  languageAndCommunication?: string;
  localEtiquette?: string;
  healthTips?: string;
  safetyInfo?: string;
  emergencyNumbers?: string;
  shopping?: string;
  faqs?: { question: string; answer: string }[];
  metaTitle?: string;
}

export function TravelGuidePage({ guide }: { guide: TravelGuideData }) {
  const hasItems = (arr?: string[]) => Array.isArray(arr) && arr.length > 0;
  const hasText = (t?: string) => !!t?.trim();

  const entityLabel = guide.entityType === "country" ? "Country Guide"
    : guide.entityType === "state" ? "Region Guide"
    : "Place Guide";

  return (
    <div className="w-full flex flex-col font-sans bg-slate-50 min-h-screen">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative w-full h-[60vh] min-h-[460px] flex items-end overflow-hidden">
        {guide.heroVideoUrl ? (
          <video src={guide.heroVideoUrl} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <Image
            src={guide.heroImageUrl || "/images/placeholder-hero.jpg"}
            alt={guide.title}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        <div className="relative z-10 container mx-auto px-4 pb-12 text-white">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-primary/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
              ✦ {entityLabel}
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black font-serif mb-3 leading-tight">
            {guide.title}
          </h1>
          <p className="text-lg md:text-xl max-w-2xl font-medium opacity-90 mb-6 leading-relaxed">
            {guide.shortDescription || `Your complete travel guide to ${guide.title}.`}
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-full text-sm font-semibold">
              <Globe className="w-4 h-4" /> Travel Guide
            </span>
            {guide.bestTimeToVisit && (
              <span className="flex items-center gap-1.5 bg-amber-500/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold">
                <Clock className="w-4 h-4" /> {guide.bestTimeToVisit}
              </span>
            )}
            <Link
              href={`/search?q=${encodeURIComponent(guide.title)}`}
              className="flex items-center gap-1.5 bg-white text-primary px-5 py-2 rounded-full text-sm font-bold hover:bg-accent hover:text-white transition-colors shadow-lg"
            >
              View Tour Packages →
            </Link>
          </div>
        </div>
      </section>

      {/* ── BREADCRUMBS ──────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 py-3">
        <div className="container mx-auto px-4 flex items-center gap-2 text-sm text-slate-500 font-medium flex-wrap">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/travel-guides" className="hover:text-primary transition-colors">Travel Guides</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-800">{guide.title}</span>
        </div>
      </div>

      {/* ── QUICK FACTS STRIP ────────────────────────────────── */}
      {(guide.currency || guide.localLanguage || guide.timezone || guide.nearestAirport) && (
        <div className="bg-primary text-white py-4">
          <div className="container mx-auto px-4 flex flex-wrap gap-6 justify-center">
            {guide.currency && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-primary-foreground/60 font-medium">Currency</span>
                <span className="font-bold">{guide.currency}</span>
              </div>
            )}
            {guide.localLanguage && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-primary-foreground/60 font-medium">Language</span>
                <span className="font-bold">{guide.localLanguage}</span>
              </div>
            )}
            {guide.timezone && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-white/60" />
                <span className="font-bold">{guide.timezone}</span>
              </div>
            )}
            {guide.nearestAirport && (
              <div className="flex items-center gap-2 text-sm">
                <Plane className="w-4 h-4 text-white/60" />
                <span className="font-bold">{guide.nearestAirport}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <section className="py-14">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* ── LEFT COLUMN (Main article) ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Full Content */}
            {hasText(guide.fullContent) && (
              <SectionCard icon={Compass} title={`About ${guide.title}`}>
                <div
                  className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-sans prose-headings:font-serif prose-headings:text-slate-900 prose-a:text-primary"
                  dangerouslySetInnerHTML={{ __html: guide.fullContent! }}
                />
              </SectionCard>
            )}

            {/* Highlights */}
            {hasItems(guide.highlights) && (
              <SectionCard icon={CheckCircle} title="Highlights" iconColor="text-green-600">
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {guide.highlights!.map((h, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0" />
                      <span className="text-slate-700 font-medium text-sm">{h}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {/* Things To Do */}
            {hasItems(guide.thingsToDo) && (
              <SectionCard icon={Zap} title="Top Things To Do" iconColor="text-amber-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {guide.thingsToDo!.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                      <span className="w-6 h-6 rounded-full bg-amber-400 text-white text-xs font-black flex items-center justify-center shrink-0">{i + 1}</span>
                      <span className="text-slate-700 font-medium text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Top Attractions */}
            {hasItems(guide.topAttractions) && (
              <SectionCard icon={Camera} title="Top Attractions" iconColor="text-rose-500">
                <PillList items={guide.topAttractions!} color="rose" />
              </SectionCard>
            )}

            {/* Activities */}
            {hasItems(guide.activities) && (
              <SectionCard icon={Zap} title="Activities & Experiences" iconColor="text-blue-500">
                <PillList items={guide.activities!} color="blue" />
              </SectionCard>
            )}

            {/* Local Cuisine */}
            {hasItems(guide.localCuisine) && (
              <SectionCard icon={UtensilsCrossed} title="Local Cuisine (Must Try)" iconColor="text-orange-500">
                <PillList items={guide.localCuisine!} color="amber" />
              </SectionCard>
            )}

            {/* Famous For */}
            {hasItems(guide.famousFor) && (
              <SectionCard icon={Heart} title="Famous For" iconColor="text-rose-500">
                <PillList items={guide.famousFor!} color="rose" />
              </SectionCard>
            )}

            {/* Festivals */}
            {hasItems(guide.festivals) && (
              <SectionCard icon={Users} title="Festivals & Events" iconColor="text-purple-500">
                <PillList items={guide.festivals!} color="purple" />
              </SectionCard>
            )}

            {/* History & Culture */}
            {hasText(guide.historyAndCulture) && (
              <SectionCard icon={Globe} title="History & Culture">
                <p className="text-slate-600 text-sm leading-relaxed">{guide.historyAndCulture}</p>
              </SectionCard>
            )}

            {/* Geography */}
            {hasText(guide.geography) && (
              <SectionCard icon={MapPin} title="Geography">
                <p className="text-slate-600 text-sm leading-relaxed">{guide.geography}</p>
              </SectionCard>
            )}

            {/* Weather */}
            {hasText(guide.weatherAndClimate) && (
              <SectionCard icon={Clock} title="Weather & Climate">
                <p className="text-slate-600 text-sm leading-relaxed">{guide.weatherAndClimate}</p>
              </SectionCard>
            )}

            {/* Shopping */}
            {hasText(guide.shopping) && (
              <SectionCard icon={ShoppingBag} title="Shopping" iconColor="text-purple-500">
                <p className="text-slate-600 text-sm leading-relaxed">{guide.shopping}</p>
              </SectionCard>
            )}

            {/* FAQs */}
            {hasItems(guide.faqs as any) && (guide.faqs as any[]).length > 0 && (
              <div>
                <h2 className="text-2xl font-bold font-serif text-slate-900 mb-5 flex items-center gap-2">
                  <Info className="w-6 h-6 text-primary" /> Frequently Asked Questions
                </h2>
                <div className="space-y-3">
                  {(guide.faqs as any[]).map((faq, i) => (
                    <FaqItem key={i} q={faq.question} a={faq.answer} />
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="space-y-6">

            {/* Essential Info Card */}
            <div className="bg-primary text-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold font-serif mb-5 flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-300" /> Essential Info
              </h3>
              <div className="space-y-3 text-sm font-medium">
                {guide.bestTimeToVisit && (
                  <div className="flex gap-3 pb-3 border-b border-white/10">
                    <Clock className="w-4 h-4 text-white/60 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white/60 text-xs mb-0.5">Best Time to Visit</p>
                      <p>{guide.bestTimeToVisit}</p>
                    </div>
                  </div>
                )}
                {guide.currency && (
                  <div className="flex gap-3 pb-3 border-b border-white/10">
                    <Globe className="w-4 h-4 text-white/60 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white/60 text-xs mb-0.5">Currency</p>
                      <p>{guide.currency}</p>
                    </div>
                  </div>
                )}
                {guide.localLanguage && (
                  <div className="flex gap-3 pb-3 border-b border-white/10">
                    <Globe className="w-4 h-4 text-white/60 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white/60 text-xs mb-0.5">Language</p>
                      <p>{guide.localLanguage}</p>
                    </div>
                  </div>
                )}
                {guide.nearestAirport && (
                  <div className="flex gap-3 pb-3 border-b border-white/10">
                    <Plane className="w-4 h-4 text-white/60 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white/60 text-xs mb-0.5">Nearest Airport</p>
                      <p>{guide.nearestAirport}</p>
                    </div>
                  </div>
                )}
                {guide.nearestRailway && (
                  <div className="flex gap-3">
                    <Train className="w-4 h-4 text-white/60 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white/60 text-xs mb-0.5">Nearest Railway</p>
                      <p>{guide.nearestRailway}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* How to Reach */}
            {hasText(guide.howToReach) && (
              <SectionCard icon={MapPin} title="How to Reach">
                <p className="text-slate-600 text-sm leading-relaxed">{guide.howToReach}</p>
              </SectionCard>
            )}

            {/* Visa Info */}
            {hasText(guide.visaInfo) && (
              <SectionCard icon={Globe} title="Visa Information">
                <p className="text-slate-600 text-sm leading-relaxed">{guide.visaInfo}</p>
              </SectionCard>
            )}

            {/* Safety */}
            {hasText(guide.safetyInfo) && (
              <SectionCard icon={AlertTriangle} title="Safety Info" iconColor="text-amber-500">
                <p className="text-slate-600 text-sm leading-relaxed">{guide.safetyInfo}</p>
              </SectionCard>
            )}

            {/* Health Tips */}
            {hasText(guide.healthTips) && (
              <SectionCard icon={Heart} title="Health Tips" iconColor="text-rose-500">
                <p className="text-slate-600 text-sm leading-relaxed">{guide.healthTips}</p>
              </SectionCard>
            )}

            {/* Packing List */}
            {hasItems(guide.packingList) && (
              <SectionCard icon={ShoppingBag} title="Packing List">
                <ul className="space-y-2">
                  {guide.packingList!.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {/* Travel Tips */}
            {hasItems(guide.travelTips) && (
              <SectionCard icon={Info} title="Travel Tips">
                <ul className="space-y-2">
                  {guide.travelTips!.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-primary font-bold shrink-0">✦</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {/* Emergency Numbers */}
            {hasText(guide.emergencyNumbers) && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                <h3 className="font-bold text-red-700 text-sm mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Emergency Numbers
                </h3>
                <p className="text-red-600 text-sm leading-relaxed">{guide.emergencyNumbers}</p>
              </div>
            )}

            {/* CTA Box */}
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="font-bold text-lg font-serif mb-2">Ready to Explore?</h3>
              <p className="text-sm text-white/90 mb-4">Browse our handpicked tour packages for {guide.title}.</p>
              <Link
                href={`/search?q=${encodeURIComponent(guide.title)}`}
                className="block w-full text-center bg-white text-orange-600 font-bold py-3 rounded-xl text-sm hover:bg-orange-50 transition-colors shadow"
              >
                View Tour Packages →
              </Link>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
