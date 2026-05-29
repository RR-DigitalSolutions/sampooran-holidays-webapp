"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import * as Tabs from "@radix-ui/react-tabs";
import {
  Star,
  Check,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Phone,
  Download,
  Share2,
  Heart,
  Building2,
  Utensils,
  Plane,
  Car,
  Camera,
  Ticket,
  Zap,
  Users,
  Coffee,
  CheckCircle,
  MapPin,
} from "lucide-react";
import { validateImageUrl, cn } from "@/lib/utils";
import { AttractionActivityModal } from "../modals/AttractionActivityModal";
import { HeroImageSlider } from "../HeroImageSlider";

type PackageItineraryDay = {
  day?: number;
  title?: string;
  location?: string;
  meals?: unknown;
  description?: string;
  content?: string;
  accommodation?: string;
  sightseeing?: string;
  attractions?: unknown;
  activities?: unknown;
  enrouteDiningStops?: unknown;
  diningStops?: unknown;
  transport?: string;
  cab?: string;
};

type PackageFaq = {
  question?: string;
  answer?: string;
};

type HotelOption = {
  city?: string;
  hotelName?: string;
  category?: string;
  nights?: number;
  roomType?: string;
};

type PackageData = {
  itinerary?: string | PackageItineraryDay[];
  faqs?: string | PackageFaq[];
  galleryImages?: string[];
  imageUrl?: string;
  pricePerPerson?: number | string;
  originalPrice?: number | string;
  discountPercent?: number;
  reviewCount?: number;
  name?: string;
  category?: string;
  shortDescription?: string;
  longDescription?: string;
  duration?: string | number;
  nights?: string | number;
  rating?: number;
  hotelCategory?: string;
  mealsIncluded?: string;
  transportMode?: string;
  groupSize?: string;
  tourType?: string;
  packageType?: string;
  inclusions?: string[];
  exclusions?: string[];
  paymentPolicy?: string;
  cancellationPolicy?: string;
  cities?: string[] | string;
  departureCity?: string;
  startCity?: string;
  destinationName?: string;
  stateName?: string;
  countryName?: string;
  seatsAvailable?: string;
  pickupPoint?: string;
  importantNotes?: string[];
  hotels?: HotelOption[];
  relatedPackages?: unknown[];
  highlights?: string[];
  tags?: string[];
  inclusionIcons?: string[];
  themes?: unknown[];
};

type PackageDetailsPageProps = {
  packageData: PackageData;
};

export function PackageDetailsPage({ packageData }: PackageDetailsPageProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0]));
  const [selectedAttraction, setSelectedAttraction] = useState<any>(null);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activitiesMap, setActivitiesMap] = useState<Map<string, any>>(new Map());
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  const handleAttractionClick = async (name: string) => {
    setLoadingDetail(true);
    try {
      const response = await fetch(`/api/attractions?limit=100`);
      const attractions = await response.json();
      const found = attractions.find(
        (a: any) => a.name.toLowerCase() === name.toLowerCase()
      );
      if (found) {
        setSelectedAttraction(found);
      }
    } catch (error) {
      console.error("Failed to fetch attraction:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleActivityClick = async (name: string) => {
    const activity = activitiesMap.get(name.toLowerCase());
    if (activity) {
      setSelectedActivity(activity);
    } else {
      setLoadingDetail(true);
      try {
        const response = await fetch(`/api/activities?limit=100`);
        if (!response.ok) {
          console.error(`Failed to fetch activities: HTTP ${response.status}`);
          return;
        }
        const activities = await response.json();
        if (!Array.isArray(activities)) {
          console.error("Invalid activities response");
          return;
        }
        const found = activities.find(
          (a: any) => a?.name?.toLowerCase() === name.toLowerCase()
        );
        if (found) {
          setSelectedActivity(found);
        }
      } catch (error) {
        console.error("Failed to fetch activity:", error);
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  const parsedItinerary = useMemo(() => {
    try {
      const data =
        typeof packageData.itinerary === "string"
          ? JSON.parse(packageData.itinerary)
          : packageData.itinerary;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }, [packageData.itinerary]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(`/api/activities?limit=1000`);
        if (!response.ok) {
          console.error(`Failed to fetch activities: HTTP ${response.status}`);
          return;
        }
        const activities = await response.json();
        if (!Array.isArray(activities)) {
          console.error("Invalid activities response format");
          return;
        }
        const map = new Map();
        activities.forEach((activity: any) => {
          if (activity?.name) {
            map.set(activity.name.toLowerCase(), activity);
          }
        });
        setActivitiesMap(map);
      } catch (error) {
        console.error("Failed to fetch activities:", error);
      }
    };
    fetchActivities();
  }, []);

  const normalizeTextItem = (item: unknown): string => {
    if (item === undefined || item === null) return "";
    if (typeof item === "string") return item.trim();
    if (typeof item === "number") return String(item);
    if (typeof item === "boolean") return item ? "Yes" : "No";
    if (Array.isArray(item)) return item.map(normalizeTextItem).filter(Boolean).join(", ");
    if (typeof item === "object") {
      const obj = item as Record<string, unknown>;
      const diningPoint = obj.diningPoint as Record<string, unknown> | undefined;
      const primaryText = normalizeTextItem(obj.name ?? obj.title ?? obj.venueName ?? obj.notes ?? diningPoint?.name ?? diningPoint?.title);
      if (primaryText) return primaryText;
      const fallback = Object.values(obj)
        .map(normalizeTextItem)
        .filter(Boolean)
        .join(", ");
      return fallback || JSON.stringify(item);
    }
    return String(item);
  };

  const dedupeStrings = (items: string[]) => Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));

  const normalizeList = (v: unknown): string[] => {
    if (v === undefined || v === null) return [];
    if (Array.isArray(v)) return dedupeStrings(v.map(normalizeTextItem).filter(Boolean));
    if (typeof v === "string") {
      const hasComma = v.includes(",");
      const hasNewline = v.includes("\n");
      const values = hasComma
        ? v.split(",")
        : hasNewline
          ? v.split(/\r?\n/)
          : [v];
      return dedupeStrings(values.map((s) => s.trim()).filter(Boolean));
    }
    if (typeof v === "object") {
      return dedupeStrings(normalizeTextItem(v).split(",").map((s) => s.trim()).filter(Boolean));
    }
    return [String(v)];
  };

  const normalizeMeals = (raw: unknown): string[] => {
    const canonicalizeMeal = (text: string): string => {
      const cleaned = normalizeTextItem(text).replace(/\s+/g, " ").trim();
      const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
      const found = mealTypes.find((type) => new RegExp(`\\b${type}\\b`, "i").test(cleaned));
      if (found) return found.charAt(0).toUpperCase() + found.slice(1);
      return cleaned;
    };

    if (raw === undefined || raw === null) return [];
    if (Array.isArray(raw)) return dedupeStrings(raw.map((item) => canonicalizeMeal(normalizeTextItem(item))).filter(Boolean));
    if (typeof raw === "object") {
      const obj = raw as Record<string, unknown>;
      const entries = Object.entries(obj)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => {
          const mealLabel = String(key).replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
          if (typeof value === "boolean") return value ? mealLabel : "";
          if (typeof value === "object") {
            const mealObj = value as Record<string, unknown>;
            if (mealObj.included === false) return "";
            return mealLabel;
          }
          const text = normalizeTextItem(value);
          return text ? canonicalizeMeal(text) : mealLabel;
        })
        .filter(Boolean);
      return dedupeStrings(entries);
    }
    return normalizeList(raw);
  };

  const normalizeDiningStops = (raw: unknown): string[] => {
    if (raw === undefined || raw === null) return [];
    if (Array.isArray(raw)) {
      return dedupeStrings(
        raw
          .map((item) => {
            if (typeof item === "string") return item.trim();
            if (typeof item === "object" && item !== null) {
              const obj = item as Record<string, unknown>;
              const diningPoint = obj.diningPoint as Record<string, unknown> | undefined;
              const venue = obj.venueName || diningPoint?.name || diningPoint?.title;
              const notes = obj.notes ? String(obj.notes).trim() : undefined;
              const output = [venue, notes].filter(Boolean).join(" • ");
              return output || normalizeTextItem(item);
            }
            return String(item).trim();
          })
          .filter(Boolean)
      );
    }
    return dedupeStrings(normalizeTextItem(raw).split(",").map((s) => s.trim()).filter(Boolean));
  };

  const normalizedItinerary = useMemo<PackageItineraryDay[]>(() => {
    const normalizeDay = (d: Record<string, unknown>): PackageItineraryDay => {
      const altAttractions = d["attraction"] ?? d["sights"] ?? d["sightseeingList"];
      const altActivities = d["activities"] ?? d["activity"] ?? d["activityList"];
      const altEnroute = d["diningStops"] ?? d["enrouteStops"] ?? d["enroute"];
      const altMeals = d["meals"] ?? d["meal"] ?? d["mealsProvided"] ?? d["mealsIncluded"];
      const altSight = d["sightSeeing"] ?? d["sight"] ?? d["todaySightseeing"];

      return {
        title: normalizeTextItem(d["title"] ?? d["name"] ?? d["heading"]),
        location: normalizeTextItem(d["location"] ?? d["city"] ?? d["place"] ?? d["destination"]),
        day: typeof d["day"] === "number" ? Number(d["day"]) : d["day"] ? Number(String(d["day"])) : undefined,
        description: normalizeTextItem(d["description"] ?? d["content"] ?? d["detail"]),
        accommodation: normalizeTextItem(d["accommodation"] ?? d["hotel"] ?? d["stay"] ?? d["nightStay"]),
        sightseeing: normalizeTextItem(d["sightseeing"] ?? altSight),
        attractions: normalizeList(d["attractions"] ?? altAttractions),
        meals: normalizeMeals(altMeals),
        enrouteDiningStops: normalizeDiningStops(d["enrouteDiningStops"] ?? altEnroute),
        transport: normalizeTextItem(d["transport"] ?? d["cab"] ?? d["vehicle"] ?? d["travelMode"]),
        cab: normalizeTextItem(d["cab"] ?? d["vehicle"]),
        activities: normalizeList(altActivities),
      };
    };

    return parsedItinerary.map((d) => {
      if (!d || typeof d !== "object") return {} as PackageItineraryDay;
      return normalizeDay(d as Record<string, unknown>);
    });
  }, [parsedItinerary]);

  const activeDayIndex = normalizedItinerary.length ? Math.min(selectedDayIndex, normalizedItinerary.length - 1) : 0;

  const faqs = useMemo<PackageFaq[]>(() => {
    try {
      const data =
        typeof packageData.faqs === "string"
          ? JSON.parse(packageData.faqs)
          : packageData.faqs;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }, [packageData.faqs]);

  const galleryImages = useMemo(() => {
    const data = Array.isArray(packageData.galleryImages)
      ? packageData.galleryImages.filter(Boolean)
      : [];
    const heroImage = packageData.imageUrl ? [packageData.imageUrl] : [];
    return Array.from(new Set([...heroImage, ...data])).slice(0, 6);
  }, [packageData.galleryImages, packageData.imageUrl]);

  const pricePerPerson = Number(packageData.pricePerPerson || 0);
  const originalPrice = Number(packageData.originalPrice || pricePerPerson);
  const savings = Math.max(0, originalPrice - pricePerPerson);
  const packageHighlights = packageData.highlights || [];
  const packageTags = packageData.tags || [];
  const packageThemes = Array.isArray(packageData.themes)
    ? packageData.themes
      .map((theme) => (typeof theme === "string" ? theme : String((theme as any).name || (theme as any).label || (theme as any).slug || "")))
      .filter(Boolean)
    : [];
  const inclusionIcons = packageData.inclusionIcons || [];
  const packageInclusions = packageData.inclusions || [];
  const packageExclusions = packageData.exclusions || [];
  const packageHotels = packageData.hotels || [];
  const importantNotes = packageData.importantNotes || [];
  const priceLabel = pricePerPerson > 0 ? `₹${pricePerPerson.toLocaleString("en-IN")}` : "Price on request";

  // Hero badges: only show themes from CMS — no duplication of category / tourType which are shown elsewhere
  const heroBadges = Array.from(new Set(packageThemes)).filter(Boolean) as string[];

  // Build package detail rows only when CMS data is actually available (no wrong fallback values)
  const packageDetailRows = [
    packageData.pickupPoint ? { label: "Pickup", value: packageData.pickupPoint } : null,
    packageData.mealsIncluded ? { label: "Meals", value: packageData.mealsIncluded } : null,
    packageData.transportMode ? { label: "Transport", value: packageData.transportMode } : null,
    packageData.hotelCategory ? { label: "Hotel", value: packageData.hotelCategory } : null,
    packageData.packageType ? { label: "Package Type", value: packageData.packageType } : null,
    packageData.tourType ? { label: "Tour Type", value: packageData.tourType } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const ratingLabel = packageData.rating !== undefined ? packageData.rating.toFixed(1) : "4.5";
  const summaryBadges = [packageData.tourType, packageData.packageType, packageData.groupSize]
    .filter(Boolean)
    .map((value) => String(value));

  const guestCount = Number(String(packageData.groupSize || "").match(/\d+/)?.[0]) || 2;
  const guestCountLabel = packageData.groupSize
    ? `${String(packageData.groupSize)} Guests`
    : `${guestCount} Guests`;
  const totalPackageCost = Math.round(pricePerPerson * guestCount);
  const totalOriginalCost = Math.round(originalPrice * guestCount);
  const totalSavings = Math.max(0, totalOriginalCost - totalPackageCost);
  const priceAfterDiscount = totalPackageCost;
  const gstAmount = Math.round(priceAfterDiscount * 0.05);
  const grandTotal = priceAfterDiscount + gstAmount;
  const discountLabel = packageData.discountPercent
    ? `${packageData.discountPercent}% OFF`
    : totalSavings > 0
      ? "Discount applied"
      : "No discount";

  // Map inclusion string to an icon component from lucide
  const getInclusionIcon = (name: string) => {
    const n = (name || "").toLowerCase();
    if (n.includes("flight") || n.includes("plane")) return Plane;
    if (n.includes("hotel") || n.includes("stay") || n.includes("accommodation")) return Building2;
    if (n.includes("meal") || n.includes("breakfast") || n.includes("dinner") || n.includes("food")) return Utensils;
    if (n.includes("transfer") || n.includes("car") || n.includes("cab") || n.includes("taxi")) return Car;
    if (n.includes("sight") || n.includes("tour") || n.includes("camera") || n.includes("sightseeing")) return Camera;
    if (n.includes("ticket") || n.includes("entry") || n.includes("pass")) return Ticket;
    if (n.includes("insurance") || n.includes("shield") || n.includes("safe")) return ShieldCheck;
    if (n.includes("activity") || n.includes("sport") || n.includes("trek")) return Zap;
    if (n.includes("guide") || n.includes("manager") || n.includes("tour manager")) return Users;
    if (n.includes("drink") || n.includes("coffee") || n.includes("beverage")) return Coffee;
    return CheckCircle;
  };

  const inclusionItems = (packageData.inclusionIcons && Array.isArray(packageData.inclusionIcons) && packageData.inclusionIcons.length > 0)
    ? packageData.inclusionIcons.map((inc: string) => ({ id: inc, label: inc, Icon: getInclusionIcon(inc) }))
    : [];

  // Normalize cities array for the daywise locations strip
  const cityList: string[] = useMemo(() => {
    const c = packageData.cities;
    if (!c) {
      if (packageData.destinationName) return [packageData.destinationName];
      return [];
    }
    if (Array.isArray(c)) return c.map(String).filter(Boolean);
    if (typeof c === "string") {
      // split on common separators
      return c.split(/--->|->|,|\||\\/).map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }, [packageData.cities, packageData.destinationName]);

  useEffect(() => {
    const handleScroll = () => setShowStickyBar(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeLightboxIndex === null) return;
      if (e.key === "Escape") setActiveLightboxIndex(null);
      if (e.key === "ArrowRight") {
        setActiveLightboxIndex((prev) => (prev !== null ? (prev + 1) % galleryImages.length : 0));
      }
      if (e.key === "ArrowLeft") {
        setActiveLightboxIndex((prev) => (prev !== null ? (prev - 1 + galleryImages.length) % galleryImages.length : 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeLightboxIndex, galleryImages.length]);

  const departureCities = Array.isArray(packageData.cities)
    ? packageData.cities.join(" • ")
    : packageData.cities || packageData.destinationName || packageData.stateName || packageData.countryName || "India";

  return (
    <div className="w-full min-h-screen bg-[#F4F5F7] text-slate-900">
      {/* ═══════════════════════════════════════════
           HERO SECTION — Full-screen image slider
           with smooth Ken Burns zoom animation
      ════════════════════════════════════════════ */}
      <section className="relative min-h-[78vh] overflow-hidden flex items-end">
        {/* Full-screen image slider background */}
        <div className="absolute inset-0">
          <HeroImageSlider
            images={galleryImages.length > 0 ? galleryImages : [packageData.imageUrl || "/default-hero.jpg"]}
            alt={packageData.name || "Package"}
          />
          {/* Layered gradient: bottom-up + stronger left fade for legible text */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          {/* Extra spotlight behind the left content column */}
          <div className="absolute inset-y-0 left-0 w-[65%] bg-gradient-to-r from-black/60 to-transparent" />
        </div>

        <div className="relative z-10 w-full container mx-auto px-4 lg:px-8 pt-32 pb-8 lg:pb-12">
          <div className="grid gap-3 xl:gap-4 xl:grid-cols-[1fr_330px] items-end">

            {/* ── LEFT: Informative content ── */}
            <div className="text-white flex flex-col items-start gap-3.5 max-w-2xl">

              {/* Duration + nights + themes + places chips in a single row (placed above title) */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                {packageData.duration && (
                  <span className="rounded-full bg-white/12 backdrop-blur-sm border border-white/20 px-4 py-1.5">
                    {packageData.duration} {Number(packageData.duration) === 1 ? "Day" : "Days"}
                  </span>
                )}
                {packageData.nights && (
                  <span className="rounded-full bg-white/12 backdrop-blur-sm border border-white/20 px-4 py-1.5">
                    {packageData.nights} {Number(packageData.nights) === 1 ? "Night" : "Nights"}
                  </span>
                )}
                {packageData.category && (
                  <span className="rounded-full bg-accent/90 px-4 py-1.5 text-white shadow tracking-wide uppercase">
                    {packageData.category}
                  </span>
                )}
                {heroBadges.map((badge, idx) => (
                  <span key={idx} className="rounded-full bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-1.5 text-white/90">
                    {badge}
                  </span>
                ))}
                {departureCities && (
                  <span className="inline-flex items-center gap-1.5 text-white/90 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm border border-white/10">
                    <MapPin className="w-3.5 h-3.5" />
                    {departureCities}
                  </span>
                )}
              </div>

              {/* Combined Title & Description with single background and reduced spacing */}
              <div className="bg-black/30 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/10 shadow-xl flex flex-col gap-2">
                <h1 className="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight drop-shadow-lg text-white">
                  {packageData.name}
                </h1>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                  {packageData.shortDescription || packageData.longDescription?.slice(0, 200) || "A curated escape with premium stays and local experiences."}
                </p>
              </div>

            </div>

            {/* ── RIGHT: Price card + quick CTA ── */}
            <aside>
              {/* Combined Price panel + Trust indicators */}
              <div className="rounded-3xl bg-black/30 backdrop-blur-md border border-white/20 p-5 sm:p-6 text-white shadow-2xl flex flex-col gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/60 mb-1">Starting from</p>
                  <div className="flex items-end gap-3">
                    <p className="text-4xl font-extrabold tracking-tight">{priceLabel}</p>
                    {savings > 0 && (
                      <p className="text-sm text-white/50 line-through mb-1">₹{originalPrice.toLocaleString("en-IN")}</p>
                    )}
                  </div>
                  <p className="text-xs text-white/60 mt-1">Per person · Twin sharing</p>

                  {savings > 0 && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-xs font-bold text-emerald-300">
                      You save ₹{savings.toLocaleString("en-IN")}
                      {packageData.discountPercent ? ` · ${packageData.discountPercent}% OFF` : ""}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Primary CTA */}
                  <Link
                    href="#enquire"
                    className="flex w-full items-center justify-center rounded-xl bg-accent py-3 text-sm font-bold text-white shadow-lg hover:bg-accent/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Book This Package
                  </Link>

                  {/* Secondary CTA */}
                  <button
                    onClick={() => {
                      const el = document.getElementById("enquire");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 py-2.5 text-sm font-semibold text-white/85 hover:bg-white/10 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Request a Callback
                  </button>
                </div>

                {/* Trust indicators + rating / download / share */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between flex-wrap gap-2 text-xs text-white/80">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Secure booking</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <a href="#reviews" className="flex items-center gap-1 hover:text-white transition-colors">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="font-bold text-white">{ratingLabel}</span>
                    </a>
                    <button className="flex items-center gap-1 hover:text-white transition-colors">
                      <Download className="w-3.5 h-3.5" /> <span>PDF</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-white transition-colors">
                      <Share2 className="w-3.5 h-3.5" /> <span>Share</span>
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 lg:px-8 py-10">
        <div className="grid gap-8 xl:grid-cols-[1.75fr_0.75fr] items-start">
          <main className="space-y-8">
            {/* Unified Package Overview Highlights, Gallery & Inclusions Card */}
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Left side: Highlights */}
                {packageHighlights.length > 0 && (
                  <div className="flex flex-col h-[280px]">
                    <h3 className="text-lg font-bold text-slate-900 mb-3 shrink-0">Tour Highlights</h3>
                    <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                      {packageHighlights.map((highlight, idx) => (
                        <div key={idx} className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-700 font-medium border border-slate-100/80 hover:bg-slate-100/50 transition-colors">
                          • {highlight}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Right side: Gallery */}
                {galleryImages.length > 0 && (
                  <div className="flex flex-col h-[280px]">
                    <h3 className="text-lg font-bold text-slate-900 mb-3 shrink-0">Tour Gallery</h3>
                    <div className="flex-1 grid grid-cols-2 gap-2 overflow-hidden rounded-xl">
                      {galleryImages.slice(0, 4).map((image, idx) => {
                        const isLast = idx === 3;
                        const hasMore = galleryImages.length > 4;
                        return (
                          <div
                            key={idx}
                            onClick={() => setActiveLightboxIndex(idx)}
                            className="relative w-full h-full overflow-hidden bg-slate-100 group cursor-pointer"
                          >
                            <Image
                              src={validateImageUrl(image)}
                              alt={`${packageData.name} photo ${idx + 1}`}
                              fill
                              sizes="(max-width: 768px) 50vw, 25vw"
                              className="object-cover transition duration-500 group-hover:scale-105"
                            />
                            {isLast && hasMore && (
                              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white font-extrabold text-sm md:text-base backdrop-blur-[2px] transition group-hover:bg-black/55">
                                <span className="text-xl md:text-2xl">+{galleryImages.length - 4}</span>
                                <span className="text-[10px] uppercase tracking-wider text-white/80 font-bold mt-0.5">Photos</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom side: Inclusions (separated by a light border) */}
              {inclusionItems.length > 0 && (
                <div className="pt-5 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Key Inclusions</h3>
                  <div className="flex flex-wrap gap-3">
                    {inclusionItems.map((item, idx) => {
                      const IconComponent = item.Icon;
                      return (
                        <div key={idx} className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 hover:border-primary/20 transition-all">
                          <div className="w-8 h-8 rounded-lg bg-[#1B3A6B] text-[#E5F1FF] flex items-center justify-center shadow-sm shrink-0">
                            <IconComponent className="w-4.5 h-4.5" />
                          </div>
                          <span className="text-[11px] font-extrabold text-slate-800 tracking-wider uppercase">
                            {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            <section id="overview" className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Package Overview</h2>
                  <p className="mt-2 text-sm text-slate-500">A complete summary of what’s included in your journey.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  <Check className="h-4 w-4" />
                  Trusted itinerary
                </div>
              </div>
              <div className="mt-6 prose prose-slate max-w-none text-sm leading-7" dangerouslySetInnerHTML={{ __html: packageData.longDescription || packageData.shortDescription || "No overview available." }} />
            </section>

            {/* Itinerary Section with Timeline Accordion Design */}
            {normalizedItinerary.length > 0 && (
              <section id="itinerary" className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-2xl pl-8 font-bold text-slate-900 mb-8">Itinerary</h2>

                <div className="space-y-0">
                  {normalizedItinerary.map((day, idx) => {
                    const isExpanded = expandedDays.has(idx);
                    const attractions = normalizeList(day.attractions);
                    const activities = normalizeList(day.activities);
                    const uniqueActivities = activities.filter((activity) => !attractions.some((attr) => attr.toLowerCase() === activity.toLowerCase()));
                    const mealItems = normalizeMeals(day.meals);
                    const enrouteStops = normalizeDiningStops(day.enrouteDiningStops || day.diningStops);
                    const dayHeader = day.title || day.location || `Day ${idx + 1}`;
                    const showSightseeing = Boolean(day.sightseeing || uniqueActivities.length > 0 || attractions.length > 0);
                    const formattedAccommodation = day.accommodation
                      ? `${day.accommodation}${/or similar$/i.test(day.accommodation) ? "" : " or similar"}`
                      : "";

                    const handleToggle = () => {
                      const newSet = new Set(expandedDays);
                      if (newSet.has(idx)) {
                        newSet.delete(idx);
                      } else {
                        newSet.add(idx);
                      }
                      setExpandedDays(newSet);
                    };

                    return (
                      <div key={idx} className="relative pb-6">
                        {/* Timeline line and dot */}
                        {idx < normalizedItinerary.length - 1 && (
                          <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-slate-300" />
                        )}
                        <div className="absolute left-0 top-6 h-12 w-12 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center z-10">
                          <MapPin className="h-5 w-5 text-blue-600" />
                        </div>

                        {/* Day header with expand button */}
                        <button
                          onClick={handleToggle}
                          className="w-full pl-20 pr-6 py-4 hover:bg-slate-50 rounded-lg transition flex items-start justify-between gap-4"
                        >
                          <div className="text-left flex-1">
                            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                              Day {idx + 1} / {String(day.title || '').match(/\d+ \w+, \d+/)?.[0] || 'TBA'}
                            </p>
                            <h3 className="mt-1 text-lg font-semibold text-slate-900">
                              {day.title || `Day ${idx + 1}`}
                            </h3>
                          </div>
                          <div className="mt-0.5 flex-shrink-0">
                            {isExpanded ? (
                              <ChevronUp className="h-6 w-6 text-slate-400" />
                            ) : (
                              <ChevronDown className="h-6 w-6 text-slate-400" />
                            )}
                          </div>
                        </button>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div className="pl-10 pr-6 pb-6 space-y-4">
                            {/* Main description */}
                            {(day.description || day.content) && (
                              <p className="text-sm text-slate-700 leading-relaxed">
                                {day.description || day.content}
                              </p>
                            )}

                            {/* Today's Sightseeing */}
                            {showSightseeing && (
                              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center gap-3 mb-4">
                                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                    <Camera className="h-5 w-5" />
                                  </span>
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">Sightseeing and Attractions</p>
                                    <p className="text-xs text-slate-500">Plans, sights and experiences curated for the day.</p>
                                  </div>
                                </div>
                                {day.sightseeing ? (
                                  <p className="text-sm text-slate-700">{day.sightseeing}</p>
                                ) : (
                                  <div className="space-y-3">
                                    {attractions.length > 0 && (
                                      <div>
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">Attractions</p>
                                        <div className="flex flex-wrap gap-2">
                                          {attractions.map((item, attrIdx) => (
                                            <button
                                              key={attrIdx}
                                              onClick={() => handleAttractionClick(item)}
                                              className="rounded-full border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:text-blue-700 transition cursor-pointer"
                                              disabled={loadingDetail}
                                            >
                                              {item}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {uniqueActivities.length > 0 && (
                                      <div>
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">Activities</p>
                                        <div className="flex flex-wrap gap-2">
                                          {uniqueActivities.map((item, activityIdx) => {
                                            const activity = activitiesMap.get(item.toLowerCase());
                                            const priceRange = activity && activity.priceMin && activity.priceMax
                                              ? `₹${activity.priceMin.toLocaleString()}-${activity.priceMax.toLocaleString()}`
                                              : null;
                                            return (
                                              <div key={activityIdx} className="relative">
                                                <button
                                                  onClick={() => handleActivityClick(item)}
                                                  className="rounded-full border border-slate-200 bg-white hover:bg-green-50 hover:border-green-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:text-green-700 transition cursor-pointer"
                                                  disabled={loadingDetail}
                                                >
                                                  {item}
                                                </button>
                                                {priceRange && (
                                                  <span className="absolute -top-2 -right-1 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700 border border-green-200">
                                                    {priceRange}
                                                  </span>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Enroute Dining Stops */}
                            {enrouteStops.length > 0 && (
                              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-50">
                                    <Coffee className="h-5 w-5 text-orange-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">Enroute Dining</p>
                                    <p className="text-xs text-slate-500">Flexible stop details based on the day’s route.</p>
                                  </div>
                                </div>
                                <p className="text-sm text-slate-700 ml-13">{enrouteStops.join(', ')}</p>
                              </div>
                            )}

                            {/* Meals */}
                            {mealItems.length > 0 && (
                              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center gap-3 mb-4">
                                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                    <Utensils className="h-5 w-5" />
                                  </span>
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">Delicious Dining</p>
                                    <p className="text-xs text-slate-500">Mouthwatering meals carefully chosen for your tour.</p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {mealItems.map((meal, mealIdx) => (
                                    <span key={mealIdx} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                                      {meal}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Transport info */}
                            {(day.transport || day.cab) && (
                              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                                    <Car className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <h4 className="text-sm font-semibold text-slate-900">Travel Details</h4>
                                </div>
                                <div className="text-sm text-slate-700 ml-13 space-y-2">
                                  {day.transport && <p>{day.transport}</p>}
                                  {day.cab && <p>{day.cab}</p>}
                                </div>
                              </div>
                            )}

                            {/* Night Stay */}
                            {formattedAccommodation && (
                              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
                                    <Building2 className="h-5 w-5 text-amber-600" />
                                  </div>
                                  <h4 className="text-sm font-semibold text-slate-900">Night Stay in {day.location || 'TBA'}</h4>
                                </div>
                                <p className="text-sm text-slate-700 ml-13">{formattedAccommodation}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {(packageInclusions.length > 0 || packageExclusions.length > 0) && (
              <section id="inclusions" className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="grid gap-6 lg:grid-cols-2">
                  {packageInclusions.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-4">Inclusions</h3>
                      <ul className="list-disc pl-5 space-y-3 text-sm text-slate-700">
                        {packageInclusions.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {packageExclusions.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-4">Exclusions</h3>
                      <ul className="list-disc pl-5 space-y-3 text-sm text-slate-700">
                        {packageExclusions.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            <section id="policies" className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-5">Policies</h2>
              <div className="space-y-6 text-sm text-slate-700 leading-7">
                <div>
                  <p className="font-semibold text-slate-900 mb-2">Payment Policy</p>
                  <div dangerouslySetInnerHTML={{ __html: packageData.paymentPolicy || "Payment policy details will be updated soon." }} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 mb-2">Cancellation Policy</p>
                  <div dangerouslySetInnerHTML={{ __html: packageData.cancellationPolicy || "Cancellation policy details will be updated soon." }} />
                </div>
              </div>
            </section>

            {importantNotes.length > 0 && (
              <section id="important-notes" className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-5">Important Notes</h2>
                <ul className="list-disc pl-5 space-y-3 text-sm text-slate-700">
                  {importantNotes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </section>
            )}

            {packageHotels.length > 0 && (
              <section id="hotels" className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-5">Hotels &amp; Stay</h2>
                <div className="space-y-4">
                  {packageHotels.map((hotel, idx) => (
                    <div key={idx} className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                      <p className="text-base font-semibold text-slate-900">{hotel.hotelName || 'Hotel'}</p>
                      <p className="mt-2 text-sm text-slate-600">{hotel.city || 'Location'} • {hotel.category || 'Category'} • {hotel.nights ?? '-'} Nights</p>
                      {hotel.roomType && <p className="mt-2 text-sm text-slate-600">Room type: {hotel.roomType}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {faqs.length > 0 && (
              <section id="faqs" className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm pb-16">
                <h2 className="text-2xl font-bold text-slate-900 mb-5">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {faqs.map((faq, idx) => (
                    <div key={idx} className="rounded-[28px] border border-slate-200 overflow-hidden">
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                        className="w-full flex items-center justify-between gap-4 p-5 bg-slate-50 hover:bg-slate-100 transition"
                      >
                        <span className="text-sm font-semibold text-slate-900">{faq.question}</span>
                        {expandedFaq === idx ? <ChevronUp className="w-5 h-5 text-[#1B3A6B]" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                      </button>
                      {expandedFaq === idx && (
                        <div className="p-5 border-t border-slate-200 text-sm text-slate-700">{faq.answer}</div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

          </main>

          <aside className="space-y-4 xl:sticky xl:top-20">
            {/* ── Compact Fare Summary Card ── */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
              {/* Header row */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fare Summary</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5 leading-tight">Book this package</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">
                  <Users className="w-3 h-3 text-slate-500" />
                  {guestCountLabel}
                </span>
              </div>

              {/* Price rows — ultra compact */}
              <div className="px-4 py-3 space-y-1.5 text-sm">
                {/* Base cost */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500 text-xs">Package Cost</span>
                  <span className="font-semibold text-slate-800 text-xs">₹{totalPackageCost.toLocaleString('en-IN')}</span>
                </div>

                {/* Discount row */}
                {totalSavings > 0 && (
                  <div className="flex items-center justify-between py-1 rounded-lg bg-emerald-50 px-2 -mx-2">
                    <span className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white text-[9px]">✓</span>
                      {discountLabel}
                    </span>
                    <span className="font-bold text-emerald-700 text-xs">−₹{totalSavings.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* After discount */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500 text-xs">After Discount</span>
                  <span className="font-semibold text-slate-800 text-xs">₹{priceAfterDiscount.toLocaleString('en-IN')}</span>
                </div>

                {/* GST */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500 text-xs">GST (5%)</span>
                  <span className="font-semibold text-slate-800 text-xs">₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-slate-200 my-1" />

                {/* Grand Total */}
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Grand Total</p>
                    <p className="text-2xl font-extrabold text-slate-900 leading-tight">₹{grandTotal.toLocaleString('en-IN')}</p>
                  </div>
                  {totalSavings > 0 && (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                      Save ₹{totalSavings.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                {/* EMI chip */}
                <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-slate-800 to-[#1B3A6B] px-3 py-2.5 mt-1">
                  <div>
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">No-cost EMI</p>
                    <p className="text-sm font-extrabold text-white">₹{Math.round(grandTotal / 3).toLocaleString('en-IN')}<span className="text-[10px] font-normal text-white/60"> /mo × 3</span></p>
                  </div>
                  <span className="rounded-lg bg-white/15 border border-white/20 px-2.5 py-1 text-[10px] font-bold text-white tracking-wide">EMI AVAILABLE</span>
                </div>
              </div>

              {/* CTA buttons — pushed to bottom */}
              <div className="px-4 pb-4 grid gap-2 mt-auto">
                <Link
                  href="#enquire"
                  className="block w-full rounded-xl bg-[#1B3A6B] px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-[#152e55] transition-all hover:shadow-md active:scale-[0.98]"
                >
                  Book Now
                </Link>
                <Link
                  href="#enquire"
                  className="block w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-center text-sm font-bold text-white hover:from-amber-600 hover:to-orange-600 transition-all hover:shadow-md active:scale-[0.98]"
                >
                  ✦ Customize My Trip
                </Link>
                <a
                  href={`https://wa.me/919000000000?text=I'm interested in ${encodeURIComponent(packageData.name || 'this package')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-all"
                >
                  Chat on WhatsApp
                </a>
              </div>
            </div>

            {/* ── Why book with us ── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Why book with us</p>
              <ul className="space-y-2.5">
                {[
                  { Icon: Check, text: "Curated hotel stays with verified amenities." },
                  { Icon: ShieldCheck, text: "End-to-end support from enquiry to return." },
                  { Icon: Phone, text: "Direct local assistance throughout the tour." },
                ].map(({ Icon, text }, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1B3A6B]/10 text-[#1B3A6B]">
                      <Icon className="h-3 w-3" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Support / Call ── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Support</p>
              <p className="text-xs text-slate-600 mb-3">We are here to help you book confidently with expert travel guidance.</p>
              <a
                href="tel:+919000000000"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B3A6B] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#152e55] transition-all hover:shadow-md"
              >
                <Phone className="w-3.5 h-3.5" />
                Call +91 900 000 0000
              </a>
            </div>
          </aside>
        </div>
      </section>

      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 p-3 flex items-center justify-between transition-transform duration-300 lg:hidden shadow-[0_-10px_20px_rgba(0,0,0,0.05)]",
          showStickyBar ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Starting Price</span>
          <span className="text-xl font-bold text-slate-900 leading-none">{priceLabel}</span>
        </div>
        <div className="flex gap-2">
          <Link href="#enquire" className="bg-gradient-to-r from-[#1B3A6B] to-blue-700 text-white px-8 h-12 rounded-xl flex items-center justify-center font-bold text-sm shadow-md shadow-blue-900/20 active:scale-95 transition-transform">
            Book Now
          </Link>
        </div>
      </div>

      <AttractionActivityModal
        type="attraction"
        data={selectedAttraction}
        isOpen={!!selectedAttraction}
        onClose={() => setSelectedAttraction(null)}
      />

      <AttractionActivityModal
        type="activity"
        data={selectedActivity}
        isOpen={!!selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />

      {/* Lightbox Modal */}
      {activeLightboxIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 md:p-6 transition-all duration-300">
          {/* Header */}
          <div className="flex items-center justify-between text-white z-[110]">
            <span className="text-xs font-bold tracking-wider uppercase bg-white/10 px-3 py-1 rounded-full">
              {activeLightboxIndex + 1} / {galleryImages.length}
            </span>
            <button
              onClick={() => setActiveLightboxIndex(null)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Main Slide Area */}
          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            {/* Left Button */}
            <button
              onClick={() => setActiveLightboxIndex((prev) => (prev !== null ? (prev - 1 + galleryImages.length) % galleryImages.length : 0))}
              className="absolute left-2 md:left-4 z-[120] w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90 cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Main Image */}
            <div className="relative w-full max-w-4xl h-[60vh] md:h-[70vh] flex items-center justify-center">
              <Image
                src={validateImageUrl(galleryImages[activeLightboxIndex])}
                alt={`${packageData.name} photo`}
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Right Button */}
            <button
              onClick={() => setActiveLightboxIndex((prev) => (prev !== null ? (prev + 1) % galleryImages.length : 0))}
              className="absolute right-2 md:right-4 z-[120] w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90 cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Thumbnails strip at bottom */}
          <div className="w-full max-w-4xl mx-auto overflow-x-auto py-2 no-scrollbar flex justify-center gap-2 shrink-0 z-[110]">
            {galleryImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveLightboxIndex(idx)}
                className={cn(
                  "relative w-16 h-12 md:w-20 md:h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer",
                  activeLightboxIndex === idx ? "border-accent scale-105" : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <Image
                  src={validateImageUrl(img)}
                  alt="thumbnail"
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
