"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  Check,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Phone,
  Download,
  Share2,
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
  CheckCircle2,
  X,
  AlertTriangle,
  MapPin,
  Mountain,
  Sparkles,
  Home,
  Award,
  Headphones,
  Globe,
  Hotel,
} from "lucide-react";
import { validateImageUrl, cn } from "@/lib/utils";
import { AttractionActivityModal } from "../modals/AttractionActivityModal";
import { HeroImageSlider } from "../HeroImageSlider";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Sliders, Calendar, CreditCard, CalendarRange, Info, Clock, Tag, RefreshCw } from "lucide-react";

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
  id?: number;
  slug?: string;
  packageCode?: string;
  minGuests?: number;
  maxGuests?: number;
  isGroupPricing?: boolean;
  groupBaseCapacity?: number;
  extraPersonPrice?: number;
  extraChildPrice?: number;
  childWithBedPrice?: number;
  childWithoutBedPrice?: number;
  infantPrice?: number;
  // Enriched multi-location data from backend (for route strip)
  stateNames?: { id: number; name: string; countryName: string }[];
  destinationsWithState?: { id: number; name: string; stateId: number | null; stateName: string; countryName: string }[];
};

type AttractionActivityData = Record<string, unknown>;

type PackageDetailsPageProps = {
  packageData: PackageData;
};

function normalizeTextItem(item: unknown): string {
  if (item === undefined || item === null) return "";
  if (typeof item === "string") return item.trim();
  if (typeof item === "number") return String(item);
  if (typeof item === "boolean") return item ? "Yes" : "No";
  if (Array.isArray(item)) return item.map(normalizeTextItem).filter(Boolean).join(", ");
  if (typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const diningPoint = obj.diningPoint as Record<string, unknown> | undefined;
    const primaryText = normalizeTextItem(
      obj.name ?? obj.title ?? obj.venueName ?? obj.notes ?? diningPoint?.name ?? diningPoint?.title
    );
    if (primaryText) return primaryText;
    const fallback = Object.values(obj)
      .map(normalizeTextItem)
      .filter(Boolean)
      .join(", ");
    return fallback || JSON.stringify(item);
  }
  return String(item);
}

function dedupeStrings(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function normalizeList(v: unknown): string[] {
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
}

function normalizeMeals(raw: unknown): string[] {
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
}

function normalizeDiningStops(raw: unknown): string[] {
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
}

const renderPolicyContent = (text: string | null) => {
  if (!text) return <p className="text-xs text-slate-400 font-semibold">Policy details will be updated soon.</p>;

  if (text.includes("<") && text.includes(">")) {
    return (
      <div
        className="prose prose-slate prose-xs max-w-none text-slate-600 leading-relaxed font-semibold space-y-1.5
                   prose-p:m-0 prose-ul:my-1 prose-ul:pl-4 prose-li:my-0.5 prose-strong:text-slate-800"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  }

  const lines = text
    .split("\n")
    .map(line => line.trim().replace(/^[-*•\d+.]\s*/, ""))
    .filter(Boolean);

  if (lines.length === 0) {
    return <p className="text-xs text-slate-400 font-semibold">Policy details will be updated soon.</p>;
  }

  return (
    <ul className="space-y-2">
      {lines.map((line, idx) => (
        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-semibold leading-relaxed">
          <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1B3A6B]" />
          </span>
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
};

export function PackageDetailsPage({ packageData }: PackageDetailsPageProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0]));
  const [selectedAttraction, setSelectedAttraction] = useState<AttractionActivityData | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<AttractionActivityData | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<any | null>(null);
  const [selectedTransport, setSelectedTransport] = useState<any | null>(null);
  const [selectedDining, setSelectedDining] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activitiesMap, setActivitiesMap] = useState<Map<string, AttractionActivityData>>(new Map());
  const [hotelsMap, setHotelsMap] = useState<Map<string, any>>(new Map());
  const [transportMap, setTransportMap] = useState<Map<string, any>>(new Map());
  const [diningMap, setDiningMap] = useState<Map<string, any>>(new Map());
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [showBookingDrawer, setShowBookingDrawer] = useState(false);

  // ── Pricing Calendar States ──
  const [travelDate, setTravelDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarRates, setCalendarRates] = useState<any[]>([]);
  const [loadingCal, setLoadingCal] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  // ── Complete Direct Booking Engine Modal States ──
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState<"details" | "register" | "payment" | "confirmed">("details");

  // Registration & Login States inside Booking Modal
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regAuthMode, setRegAuthMode] = useState<"register" | "login">("register");
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Payment Checkout States
  const [payOption, setPayOption] = useState<"advance" | "full">("advance");
  const [payMethod, setPayMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [isProcessingPay, setIsProcessingPay] = useState(false);
  const [confirmedBookingData, setConfirmedBookingData] = useState<any>(null);

  // ── Customize Trip Modal & Inquiry Redirect State ──
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custDate, setCustDate] = useState("");
  const [custHotelPref, setCustHotelPref] = useState("4 Star Deluxe");
  const [custNotes, setCustNotes] = useState("");
  const [custBudget, setCustBudget] = useState("");
  const [custFormErrors, setCustFormErrors] = useState<Record<string, string>>({});
  const [isSubmittingCust, setIsSubmittingCust] = useState(false);
  const [customizeSubmitted, setCustomizeSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [custFormOpenTime, setCustFormOpenTime] = useState<number>(Date.now());

  // Countdown timer effect after inquiry submission
  useEffect(() => {
    let timer: any;
    if (customizeSubmitted) {
      setCountdown(5);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCustomizeSubmitted(false);
            setShowCustomizeModal(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [customizeSubmitted]);

  const handleCustomizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side field validation
    const errs: Record<string, string> = {};
    if (!custName.trim()) errs.name = "Full Name is required";
    if (!custPhone.trim()) errs.phone = "Phone number is required";
    if (!custEmail.trim() || !custEmail.includes("@")) errs.email = "Valid email address is required";

    if (Object.keys(errs).length > 0) {
      setCustFormErrors(errs);
      toast.error("Please fill in all required fields highlighted in red.");
      return;
    }

    setCustFormErrors({});
    setIsSubmittingCust(true);

    try {
      const elapsed = Date.now() - custFormOpenTime;
      const payload = {
        name: custName.trim(),
        email: custEmail.trim(),
        phone: custPhone.trim(),
        inquiryType: "customization",
        packageId: packageData?.id ? Number(packageData.id) : undefined,
        destination: packageData?.destinationName || packageData?.stateName || undefined,
        travelDate: travelDate || custDate || undefined,
        adults: adults,
        children: extraAdults + childWithBed + childWithoutBed,
        message: `CUSTOMIZATION INQUIRY for "${packageData?.name || 'Package'}" (Code: ${packageData?.packageCode || 'N/A'}).\n• Departure Date: ${travelDate || custDate || 'Flexible'}\n• Travelers: ${guestCountLabel}\n• Hotel Category Pref: ${custHotelPref}\n• Custom Notes: ${custNotes.trim()}`,
        budget: custBudget || undefined,
        submitDuration: Math.max(2500, elapsed)
      };

      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setCustomizeSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to submit customization request. Please check form inputs.");
      }
    } catch {
      toast.error("Network error. Please check your connection.");
    } finally {
      setIsSubmittingCust(false);
    }
  };
  // ── Guest Segment Counts ──
  const [adults, setAdults] = useState(2);
  const [extraAdults, setExtraAdults] = useState(0);
  const [childWithBed, setChildWithBed] = useState(0);
  const [childWithoutBed, setChildWithoutBed] = useState(0);
  const [childrenCount, setChildrenCount] = useState(0); // sync helper
  const [infantsCount, setInfantsCount] = useState(0);
  const [showGuestsEdit, setShowGuestsEdit] = useState(false);

  // ── Inquiry Form States ──
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryDate, setInquiryDate] = useState("");
  const [inquiryGuests, setInquiryGuests] = useState(2);
  const [inquiryBudget, setInquiryBudget] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [honeypotWebsite, setHoneypotWebsite] = useState("");
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [isLongDescExpanded, setIsLongDescExpanded] = useState(false);

  const { user, token, login } = useAuth();

  // ── Handlers for Direct Booking Engine Flow ──
  const handleProceedFromDetails = () => {
    if (!travelDate) {
      toast.warning("Please select your travel date from the calendar first!");
      return;
    }
    if (user) {
      // User is already logged in — go straight to payment step!
      setBookingStep("payment");
    } else {
      // User is NOT logged in — prompt registration/login step!
      setBookingStep("register");
    }
  };

  const handleRegisterOrLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!regEmail.trim() || !regEmail.includes("@")) {
      errs.email = "Valid email address is required";
    }
    if (!regPassword.trim() || regPassword.length < 6) {
      errs.password = "Password must be at least 6 characters";
    }

    if (regAuthMode === "register") {
      if (!regName.trim()) errs.name = "Full Name is required";
      if (!regPhone.trim()) errs.phone = "Phone number is required";
    }

    if (Object.keys(errs).length > 0) {
      setRegErrors(errs);
      toast.error("Please fill in all required fields.");
      return;
    }

    setRegErrors({});
    setIsSubmittingAuth(true);

    try {
      const endpoint = regAuthMode === "register" ? "/api/auth/register" : "/api/auth/login";
      const bodyPayload = regAuthMode === "register"
        ? { name: regName.trim(), email: regEmail.trim(), password: regPassword, phoneNumber: regPhone.trim() }
        : { email: regEmail.trim(), password: regPassword };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();
      if (res.ok && data.token && data.user) {
        login(data.user, data.token);
        toast.success(regAuthMode === "register" ? "Account created successfully!" : "Welcome back!");
        setBookingStep("payment");
      } else {
        toast.error(data.error || "Authentication failed. Please try again.");
      }
    } catch {
      toast.error("Network error during registration.");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!travelDate) {
      toast.error("Please select a valid travel date.");
      return;
    }

    setIsProcessingPay(true);
    try {
      const totalAdults = adults + extraAdults;
      const totalChildren = childWithBed + childWithoutBed;
      const totalGuests = totalAdults + totalChildren;
      const payableAmount = payOption === "advance" ? Math.round(grandTotal * 0.25) : grandTotal;

      const payload = {
        packageId: packageData.id,
        travelDate: travelDate,
        travelersCount: totalGuests,
        adultsCount: totalAdults,
        childrenCount: totalChildren,
        infantsCount: infantsCount,
        specialRequests: `Direct OTA Booking Engine. Payment Mode: ${payOption.toUpperCase()} (₹${payableAmount.toLocaleString('en-IN')}). Method: ${payMethod.toUpperCase()}`
      };

      const authToken = token || localStorage.getItem("sh_auth_token");
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.booking) {
        setConfirmedBookingData(data.booking);
        setBookingStep("confirmed");
        toast.success("🎉 Booking Confirmed & Guaranteed!");
      } else {
        toast.error(data.error || "Booking transaction failed. Please try again.");
      }
    } catch {
      toast.error("Network error during booking confirmation.");
    } finally {
      setIsProcessingPay(false);
    }
  };

  const featuresList = [
    {
      Icon: Award,
      title: "12+ Years Experience",
      desc: "Himalayan experts crafting perfect journeys since 2012.",
    },
    {
      Icon: Hotel,
      title: "Accommodation",
      desc: "Comfortable & convenient hotels cherry picked by our team.",
    },
    {
      Icon: Utensils,
      title: "All meals",
      desc: "Eat to your heart's content — Breakfast, Lunch, Dinner included.",
    },
    {
      Icon: Car,
      title: "On-tour transport",
      desc: "All rail, sea and road transport included for a tension-free trip.",
    },
    {
      Icon: Users,
      title: "Expert Tour Managers",
      desc: "Exclusive team of managers specialising in Himalayan and India tours.",
    },
    {
      Icon: Headphones,
      title: "24/7 Ground Support",
      desc: "Round-the-clock assistance to ensure a seamless travel experience.",
    },
    {
      Icon: ShieldCheck,
      title: "100% Secure & Trusted",
      desc: "Your safety and satisfaction are our top priority.",
    },
    {
      Icon: Globe,
      title: "B2B Agent Network",
      desc: "Trusted by over 500+ travel agent partners across India.",
    }
  ];

  const longDescParagraphs = useMemo(() => {
    const raw = packageData.longDescription || "";
    if (!raw.trim()) {
      const name = packageData.name || "Holiday Package";
      const dest = packageData.destinationName || packageData.stateName || "the Himalayas";
      const duration = packageData.duration ? `${packageData.duration} Days` : "";
      const nights = packageData.nights ? `${packageData.nights} Nights` : "";
      const durationText = [duration, nights].filter(Boolean).join(" and ");

      return [
        `Discover the ultimate travel experience with our signature ${name} designed specifically for discerning travelers. Handcrafted by local destination curators at Sampooran Holidays, this comprehensive ${durationText || "holiday"} journey showcases the very best of ${dest}, blending iconic sightseeing wonders with hidden regional secrets that generic operators miss.`,
        `Your premium all-inclusive tour includes cherry-picked accommodations offering exceptional hospitality and comfort, delicious daily regional meals, safe and expert on-ground transportation, and round-the-clock ground support from our expert tour managers. Every single detail is thoroughly structured, giving you absolute peace of mind so you can focus entirely on creating unforgettable memories with your loved ones.`,
        `At Sampooran Holidays, we pride ourselves on delivering standard-setting B2B and B2C Himalayan travel solutions. With over 12 years of specialized mountain operations and a trusted network of over 500+ agent partners across India, we guarantee the best rates, verified premium inclusions, and a seamless travel itinerary from arrival to departure. Book today to secure your slots!`
      ];
    }

    return raw
      .split(/\r?\n\r?\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }, [packageData.longDescription, packageData.name, packageData.destinationName, packageData.stateName, packageData.duration, packageData.nights]);

  const longDescTitle = useMemo(() => {
    const dest = packageData.destinationName || packageData.stateName || "Himalayan";
    return `Complete Travel Guide & Insights for ${packageData.name} in ${dest}`;
  }, [packageData.name, packageData.destinationName, packageData.stateName]);

  const fetchCalendarRates = async () => {
    if (!packageData.slug) return;
    setLoadingCal(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const firstDay = new Date(year, month - 1, 1).toISOString().split("T")[0];
      const lastDay = new Date(year, month + 2, 0).toISOString().split("T")[0];

      const res = await fetch(`/api/packages/${packageData.slug}/calendar-inventory?startDate=${firstDay}&endDate=${lastDay}`);
      if (res.ok) {
        const data = await res.json();
        setCalendarRates(data);
      }
    } catch (e) {
      console.error("Failed to load public calendar", e);
    } finally {
      setLoadingCal(false);
    }
  };

  useEffect(() => {
    fetchCalendarRates();
  }, [currentMonth, packageData.slug]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }

    const totalDays = lastDay.getDate();
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const monthDays = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);

  const selectedDateOverride = useMemo(() => {
    if (!travelDate) return null;
    return calendarRates.find(r => r.date === travelDate || (typeof r.date === "string" && r.date.split("T")[0] === travelDate));
  }, [travelDate, calendarRates]);

  const basePricePerPerson = Number(packageData.pricePerPerson || 0);

  const {
    dynamicPricePerPerson,
    isBlackout,
    isPriceOnReq,
    activeDiscountText
  } = useMemo(() => {
    let price = basePricePerPerson;
    let blackout = false;
    let priceOnReq = false;
    let discText = "";

    if (selectedDateOverride) {
      if (selectedDateOverride.rateType === "blackout") {
        blackout = true;
      } else if (selectedDateOverride.rateType === "price-on-request") {
        priceOnReq = true;
      } else {
        const mod = Number(selectedDateOverride.priceModifierValue) || 0;
        if (selectedDateOverride.priceModifierType === "fixed") {
          price = mod;
        } else if (selectedDateOverride.priceModifierType === "percentage") {
          price = basePricePerPerson * (1 + mod / 100);
        } else if (selectedDateOverride.priceModifierType === "value") {
          price = basePricePerPerson + mod;
        }

        const disc = Number(selectedDateOverride.discountValue) || 0;
        if (selectedDateOverride.discountType === "percentage") {
          price = price * (1 - disc / 100);
          discText = `${disc}% OFF`;
        } else if (selectedDateOverride.discountType === "flat") {
          price = Math.max(0, price - disc);
          discText = `-₹${disc}`;
        }
      }
    }

    return {
      dynamicPricePerPerson: Math.round(price),
      isBlackout: blackout,
      isPriceOnReq: priceOnReq,
      activeDiscountText: discText
    };
  }, [selectedDateOverride, basePricePerPerson]);

  // Synchronize inquiry default values
  useEffect(() => {
    if (travelDate) {
      setInquiryDate(travelDate);
    }
  }, [travelDate]);

  useEffect(() => {
    if (packageData.name) {
      setInquiryMessage(`I am interested in booking "${packageData.name}" (${packageData.packageCode || "N/A"}). Please share details.`);
    }
  }, [packageData.name, packageData.packageCode]);

  const handleBookNow = () => {
    const el = document.getElementById("enquire");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypotWebsite) {
      toast.error("Spam detected");
      return;
    }
    setIsSubmittingInquiry(true);
    try {
      const payload = {
        name: inquiryName,
        email: inquiryEmail,
        phone: inquiryPhone,
        travelDate: inquiryDate ? new Date(inquiryDate) : null,
        guestsCount: Number(inquiryGuests) || 2,
        budget: inquiryBudget ? Number(inquiryBudget) : null,
        message: inquiryMessage,
        source: "direct_inquiry",
        packageId: packageData.id || null
      };

      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Your inquiry has been submitted! Our expert will call you shortly.");
        setInquiryName("");
        setInquiryEmail("");
        setInquiryPhone("");
        setInquiryBudget("");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to submit inquiry");
      }
    } catch (err: any) {
      toast.error("Submission failed: " + err.message);
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  const handleDirectBooking = async () => {
    if (!travelDate) {
      toast.error("Please select a travel date from the calendar first.");
      return;
    }
    if (isBlackout) {
      toast.error("The selected date is sold out.");
      return;
    }
    if (isPriceOnReq) {
      toast.error("This package requires a custom quote for the selected date. Please submit an inquiry instead.");
      return;
    }
    if (!user) {
      toast.info("Please login to proceed with booking.");
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setIsBooking(true);
    try {
      const res = await fetch(`/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          packageId: packageData.id,
          travelDate: travelDate,
          travelersCount: guestCount,
          adultsCount: adults,
          childrenCount: childrenCount,
          infantsCount: infantsCount,
          specialRequests: `Direct booking via package detail calendar for ${travelDate}. Occupancy: ${adults} Adults, ${childrenCount} Children, ${infantsCount} Infants. Rate Type: ${selectedDateOverride?.rateType || "Regular"}`
        })
      });

      if (res.ok) {
        toast.success("Booking created successfully!");
        window.location.href = "/my-hotel-bookings";
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Failed to create booking.");
      }
    } catch (e: any) {
      toast.error("An error occurred: " + e.message);
    } finally {
      setIsBooking(false);
    }
  };

  const handleAttractionClick = async (name: string, rawData?: any) => {
    if (rawData && typeof rawData === 'object' && rawData.longDescription) {
      setSelectedAttraction(rawData);
      return;
    }
    setLoadingDetail(true);
    try {
      const response = await fetch(`/api/attractions?limit=500`);
      if (!response.ok) return;
      const attractions = await response.json();
      const normalizedName = name.toLowerCase().trim();
      const found = attractions.find(
        (a: AttractionActivityData) => String(a.name || "").toLowerCase().trim() === normalizedName
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

  const handleActivityClick = async (name: string, rawData?: any) => {
    if (rawData && typeof rawData === 'object' && rawData.longDescription) {
      setSelectedActivity(rawData);
      return;
    }
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
          (a: AttractionActivityData) => String(a?.name || "").toLowerCase() === name.toLowerCase()
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

  const handleHotelClick = async (name: string, rawData?: any) => {
    if (rawData && typeof rawData === 'object' && rawData.data) {
      setSelectedHotel(rawData.data);
      return;
    }
    const cleanName = name.replace(/\s+or\s+similar$/i, "").toLowerCase().trim();
    const hotel = hotelsMap.get(cleanName) || hotelsMap.get(name.toLowerCase().trim());
    if (hotel) {
      setSelectedHotel(hotel);
    } else {
      setLoadingDetail(true);
      try {
        const response = await fetch(`/api/hotels?q=${encodeURIComponent(cleanName)}`);
        if (response.ok) {
          const res = await response.json();
          const found = (res.hotels || []).find((h: any) => h.name.toLowerCase().trim() === cleanName || h.name.toLowerCase().trim() === name.toLowerCase().trim());
          if (found) setSelectedHotel(found);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  const handleTransportClick = async (name: string, rawData?: any) => {
    if (rawData && typeof rawData === 'object' && rawData.data) {
      setSelectedTransport(rawData.data);
      return;
    }
    const transport = transportMap.get(name.toLowerCase().trim());
    if (transport) {
      setSelectedTransport(transport);
    } else {
      setLoadingDetail(true);
      try {
        const response = await fetch(`/api/transport`);
        if (response.ok) {
          const res = await response.json();
          const found = (res.services || []).find((s: any) => s.name.toLowerCase().trim() === name.toLowerCase().trim());
          if (found) setSelectedTransport(found);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  const handleDiningClick = async (name: string, rawData?: any) => {
    if (rawData && typeof rawData === 'object' && rawData.data) {
      setSelectedDining(rawData.data);
      return;
    }
    const dining = diningMap.get(name.toLowerCase().trim());
    if (dining) {
      setSelectedDining(dining);
    } else {
      setLoadingDetail(true);
      try {
        const response = await fetch(`/api/dining?limit=500`);
        if (response.ok) {
          const res = await response.json();
          const found = res.find((d: any) => d.name.toLowerCase().trim() === name.toLowerCase().trim());
          if (found) setSelectedDining(found);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  const parseHotel = (name: string): any => {
    if (!name || name.toLowerCase() === "no accommodation" || name.toLowerCase() === "overnight journey") {
      return null;
    }
    const cleanName = name.replace(/\s+or\s+similar$/i, "").toLowerCase().trim();
    const hotelData = hotelsMap.get(cleanName) || hotelsMap.get(name.toLowerCase().trim());
    if (hotelData) {
      const image = hotelData.primaryImageUrl || (Array.isArray(hotelData.images) ? hotelData.images[0] : null);
      return {
        id: hotelData.id,
        name: name,
        image: image,
        starRating: hotelData.starRating,
        data: hotelData
      };
    }
    return { name: name };
  };

  const parseTransport = (name: string): any => {
    if (!name) return null;
    const transportData = transportMap.get(name.toLowerCase().trim());
    if (transportData) {
      return {
        id: transportData.id,
        name: name,
        image: transportData.imageUrl,
        type: transportData.type,
        capacity: transportData.capacity,
        data: transportData
      };
    }
    return { name: name };
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
    const fetchCmsData = async () => {
      try {
        const [activitiesRes, hotelsRes, transportRes, diningRes] = await Promise.all([
          fetch(`/api/activities?limit=2000`),
          fetch(`/api/hotels?limit=500`),
          fetch(`/api/transport`),
          fetch(`/api/dining?limit=500`)
        ]);

        if (activitiesRes.ok) {
          const activities = await activitiesRes.json();
          if (Array.isArray(activities)) {
            const map = new Map();
            activities.forEach((activity: AttractionActivityData) => {
              if (activity?.name) {
                map.set(String(activity.name).toLowerCase(), activity);
              }
            });
            setActivitiesMap(map);
          }
        }

        if (hotelsRes.ok) {
          const res = await hotelsRes.json();
          const map = new Map();
          (res.hotels || []).forEach((h: any) => {
            if (h.name) map.set(h.name.toLowerCase().trim(), h);
          });
          setHotelsMap(map);
        }

        if (transportRes.ok) {
          const res = await transportRes.json();
          const map = new Map();
          (res.services || []).forEach((s: any) => {
            if (s.name) map.set(s.name.toLowerCase().trim(), s);
          });
          setTransportMap(map);
        }

        if (diningRes.ok) {
          const res = await diningRes.json();
          if (Array.isArray(res)) {
            const map = new Map();
            res.forEach((d: any) => {
              if (d.name) map.set(d.name.toLowerCase().trim(), d);
            });
            setDiningMap(map);
          }
        }
      } catch (error) {
        console.error("Failed to fetch CMS metadata for itinerary hydration:", error);
      }
    };
    fetchCmsData();
  }, []);

  const normalizedItinerary = useMemo<any[]>(() => {
    const parseAttractions = (raw: any): any[] => {
      if (!raw) return [];
      const arr = Array.isArray(raw) ? raw : [raw];
      return arr.map(item => {
        if (typeof item === 'string') {
          return { name: item.trim() };
        }
        if (item && typeof item === 'object') {
          return {
            id: item.id,
            name: normalizeTextItem(item.name ?? item.title),
            coverImage: item.coverImage || null,
            type: item.type || 'sightseeing',
            timingInfo: item.timingInfo || null,
            entryFee: item.entryFee || null,
            duration: item.duration || null,
            bestTimeToVisit: item.bestTimeToVisit || null,
            highlights: item.highlights || [],
            tips: item.tips || [],
            famousFor: item.famousFor || [],
            shortDescription: item.shortDescription || null,
            longDescription: item.longDescription || null,
            address: item.address || null,
            latitude: item.latitude || null,
            longitude: item.longitude || null,
            data: item
          };
        }
        return { name: String(item) };
      }).filter(item => item.name);
    };

    const parseActivities = (raw: any): any[] => {
      if (!raw) return [];
      const arr = Array.isArray(raw) ? raw : [raw];
      return arr.map(item => {
        const name = typeof item === 'string' ? item.trim() : normalizeTextItem(item?.name ?? item?.title);
        const activityData = activitiesMap.get(name.toLowerCase());
        if (activityData) {
          return {
            id: activityData.id,
            name: name,
            coverImage: activityData.coverImage || null,
            type: activityData.type || 'adventure',
            timingInfo: activityData.timingInfo || null,
            entryFee: activityData.entryFee || null,
            duration: activityData.duration || null,
            bestTimeToVisit: activityData.bestTimeToVisit || null,
            priceMin: activityData.priceMin || null,
            priceMax: activityData.priceMax || null,
            highlights: activityData.highlights || [],
            tips: activityData.tips || [],
            famousFor: activityData.famousFor || [],
            shortDescription: activityData.shortDescription || null,
            longDescription: activityData.longDescription || null,
            address: activityData.address || null,
            latitude: activityData.latitude || null,
            longitude: activityData.longitude || null,
            data: activityData
          };
        }
        return { name: name };
      }).filter(item => item.name);
    };

    const parseDiningStops = (raw: any): any[] => {
      if (!raw) return [];
      const arr = Array.isArray(raw) ? raw : [raw];
      return arr.map(item => {
        if (typeof item === 'string') {
          return { name: item.trim() };
        }
        if (item && typeof item === 'object') {
          const diningPoint = item.diningPoint || {};
          const name = normalizeTextItem(diningPoint.name ?? diningPoint.title ?? item.venueName ?? item.name);
          return {
            id: diningPoint.id || item.diningPointId,
            name: name,
            coverImage: diningPoint.coverImage || null,
            type: diningPoint.type || 'restaurant',
            mealType: item.mealType || null,
            notes: item.notes || null,
            cuisine: diningPoint.cuisine || [],
            specialItems: diningPoint.specialItems || [],
            address: diningPoint.address || null,
            timingInfo: diningPoint.timingInfo || null,
            priceRange: diningPoint.priceRange || null,
            longDescription: diningPoint.longDescription || diningPoint.shortDescription || null,
            latitude: diningPoint.latitude || null,
            longitude: diningPoint.longitude || null,
            data: diningPoint
          };
        }
        return { name: String(item) };
      }).filter(item => item.name);
    };

    const normalizeDay = (d: Record<string, unknown>, idx: number, totalDays: number): any => {
      const rawAttractions = d["attractions"] ?? d["attraction"] ?? d["attractionList"];
      const altAttractions = d["placesToVisit"] ?? d["places"] ?? d["sights"];
      const altActivities = d["activities"] ?? d["activity"] ?? d["activityList"];
      const altEnroute =
        d["enrouteDiningStops"] ??
        d["diningStops"] ??
        d["enrouteStops"] ??
        d["enroute"];
      const altMeals = d["meals"] ?? d["meal"] ?? d["mealsProvided"] ?? d["mealsIncluded"];
      const altSight = d["sightSeeing"] ?? d["sight"] ?? d["todaySightseeing"];

      // ── Day Type Resolution & Auto-Detection ──────────────────────────────
      const rawDayType = typeof d["dayType"] === "string" ? String(d["dayType"]).toUpperCase().trim() : undefined;
      const titleText = normalizeTextItem(d["title"] ?? d["name"] ?? d["heading"]);
      const titleLower = titleText.toLowerCase();

      const fromCity = normalizeTextItem(d["fromCity"]);
      const toCity = normalizeTextItem(d["toCity"]);
      const hasFromTo = Boolean(fromCity && toCity);

      let dayType = rawDayType;

      // Smart auto-detect if dayType is missing or defaulted to generic SIGHTSEEING
      if (!dayType || dayType === "SIGHTSEEING") {
        if (titleLower.includes("departure") || titleLower.includes("depart") || titleLower.includes("drop at") || titleLower.includes("return home") || (idx === totalDays - 1 && totalDays > 1)) {
          dayType = "DEPARTURE";
        } else if (titleLower.includes("arrival") || titleLower.includes("arrive") || titleLower.includes("welcome to") || (idx === 0 && totalDays > 1)) {
          dayType = "ARRIVAL";
        } else if (hasFromTo || titleLower.includes("transit") || titleLower.includes("transfer") || titleLower.includes("drive to") || titleLower.includes("to manali") || titleLower.includes("to shimla")) {
          dayType = "TRANSIT";
        } else if (titleLower.includes("leisure") || titleLower.includes("free day")) {
          dayType = "LEISURE";
        } else {
          dayType = "SIGHTSEEING";
        }
      }

      const isTransit = dayType === "TRANSIT";
      const isDeparture = dayType === "DEPARTURE";
      const dayCities = Array.isArray(d["cities"])
        ? (d["cities"] as string[]).map(c => normalizeTextItem(c)).filter(Boolean)
        : [];

      // Construct complete route for transit & departure day: From -> Enroute Cities -> To
      let transitRouteArr: string[] = [];
      if (isTransit || isDeparture) {
        if (fromCity) transitRouteArr.push(fromCity);
        dayCities.forEach(c => {
          if (c !== fromCity && c !== toCity) transitRouteArr.push(c);
        });
        if (toCity) transitRouteArr.push(toCity);
        transitRouteArr = Array.from(new Set(transitRouteArr));
      }

      return {
        title: titleText,
        location: (isTransit || isDeparture) && transitRouteArr.length > 0
          ? transitRouteArr.join(" → ")
          : (dayCities.length > 0
            ? dayCities.join(" → ")
            : normalizeTextItem(d["location"] ?? d["city"] ?? d["place"] ?? d["destination"])),
        dayType,
        fromCity,
        toCity,
        cities: dayCities,
        isTransit,
        isDeparture,
        transitRoute: transitRouteArr.join(" → "),
        day: typeof d["day"] === "number" ? Number(d["day"]) : d["day"] ? Number(String(d["day"])) : idx + 1,
        description: normalizeTextItem(d["description"] ?? d["content"] ?? d["detail"]),
        accommodation: normalizeTextItem(d["accommodation"] ?? d["hotel"] ?? d["stay"] ?? d["nightStay"]),
        sightseeing: normalizeTextItem(d["sightseeing"] ?? altSight),
        attractions: parseAttractions(rawAttractions ?? altAttractions),
        meals: normalizeMeals(altMeals),
        enrouteDiningStops: parseDiningStops(altEnroute),
        transport: normalizeTextItem(d["transport"] ?? d["cab"] ?? d["vehicle"] ?? d["travelMode"]),
        cab: normalizeTextItem(d["cab"] ?? d["vehicle"]),
        activities: parseActivities(altActivities),
      };
    };

    const totalDaysCount = parsedItinerary.length;
    return parsedItinerary.map((d, idx) => {
      if (!d || typeof d !== "object") return {} as any;
      return normalizeDay(d as Record<string, unknown>, idx, totalDaysCount);
    });
  }, [parsedItinerary, activitiesMap, diningMap]);

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

  const activePricePerPerson = travelDate ? dynamicPricePerPerson : basePricePerPerson;
  const pricePerPerson = activePricePerPerson;

  const originalPrice = useMemo(() => {
    if (travelDate && selectedDateOverride) {
      let baseVal = basePricePerPerson;
      const mod = Number(selectedDateOverride.priceModifierValue) || 0;
      if (selectedDateOverride.priceModifierType === "fixed") baseVal = mod;
      else if (selectedDateOverride.priceModifierType === "percentage") baseVal = basePricePerPerson * (1 + mod / 100);
      else if (selectedDateOverride.priceModifierType === "value") baseVal = basePricePerPerson + mod;
      return Math.round(baseVal);
    }
    if (packageData.originalPrice && Number(packageData.originalPrice) > 0) {
      return Number(packageData.originalPrice);
    }
    if (packageData.discountPercent && packageData.discountPercent > 0) {
      return Math.round(basePricePerPerson / (1 - packageData.discountPercent / 100));
    }
    return basePricePerPerson;
  }, [travelDate, selectedDateOverride, basePricePerPerson, packageData]);

  const savings = Math.max(0, originalPrice - pricePerPerson);
  const packageHighlights = packageData.highlights || [];
  const packageThemes = Array.isArray(packageData.themes)
    ? packageData.themes
      .map((theme) => (typeof theme === "string" ? theme : normalizeTextItem(theme)))
      .filter(Boolean)
    : [];
  const packageInclusions = packageData.inclusions || [];
  const packageExclusions = packageData.exclusions || [];
  const packageHotels = packageData.hotels || [];
  const importantNotes = packageData.importantNotes || [];
  const priceLabel = pricePerPerson > 0 ? `₹${pricePerPerson.toLocaleString("en-IN")}` : "Price on request";
  // Hero badges: only show themes from CMS — no duplication of category / tourType which are shown elsewhere
  const heroBadges = Array.from(new Set(packageThemes)).filter(Boolean) as string[];

  // Build package detail rows only when CMS data is actually available (no wrong fallback values)
  const ratingLabel = packageData.rating !== undefined ? packageData.rating.toFixed(1) : "4.5";

  const minGuests = packageData.minGuests ?? 2;
  const maxGuests = packageData.maxGuests ?? 10;

  const { totalPackageCost, totalOriginalCost, totalSavings, priceAfterDiscount, gstAmount, grandTotal, guestCountLabel, categoryBreakdown, totalPayingGuests, baseRoomCost } = useMemo(() => {
    // 1. Effective Category Rate Tiers
    const adultRate = pricePerPerson;
    const extraAdultRate = Number(packageData.extraPersonPrice) > 0 ? Number(packageData.extraPersonPrice) : adultRate;
    const childWithBedRate = Number(packageData.childWithBedPrice) > 0 ? Number(packageData.childWithBedPrice) : Math.round(adultRate * 0.75);
    const childWithoutBedRate = Number(packageData.childWithoutBedPrice) > 0 ? Number(packageData.childWithoutBedPrice) : Math.round(adultRate * 0.50);
    const infantRate = Number(packageData.infantPrice) > 0 ? Number(packageData.infantPrice) : 0;

    // 2. Base Capacity & Extra Add-on Calculations
    const totalAdultsCount = adults + extraAdults;
    const baseRoomTotalCost = Math.max(totalAdultsCount, minGuests) <= minGuests
      ? minGuests * adultRate
      : minGuests * adultRate;

    const extraAdultsCountBilled = Math.max(0, totalAdultsCount - minGuests);
    const extraAdultsTotalCost = extraAdultsCountBilled * extraAdultRate;

    const childWithBedTotalCost = childWithBed * childWithBedRate;
    const childWithoutBedTotalCost = childWithoutBed * childWithoutBedRate;
    const infantTotalCost = infantsCount * infantRate;

    // 3. Subtotal & Savings
    const totalCost = baseRoomTotalCost + extraAdultsTotalCost + childWithBedTotalCost + childWithoutBedTotalCost + infantTotalCost;

    // Original prices without discount
    const origAdultRate = originalPrice;
    const origBaseRoomCost = Math.max(totalAdultsCount, minGuests) * origAdultRate;
    const origExtraAdultCost = extraAdultsCountBilled * (packageData.extraPersonPrice || origAdultRate);
    const origChildWithBedCost = childWithBed * (packageData.childWithBedPrice || Math.round(origAdultRate * 0.75));
    const origChildWithoutBedCost = childWithoutBed * (packageData.childWithoutBedPrice || Math.round(origAdultRate * 0.50));
    const originalCost = origBaseRoomCost + origExtraAdultCost + origChildWithBedCost + origChildWithoutBedCost + infantTotalCost;

    const savingsVal = Math.max(0, originalCost - totalCost);
    const gstVal = Math.round(totalCost * 0.05);
    const finalTotal = totalCost + gstVal;

    const payingGuestsCount = Math.max(totalAdultsCount, minGuests) + childWithBed + childWithoutBed;

    let countParts = [`${adults} Primary Adult${adults > 1 ? 's' : ''}`];
    if (extraAdults > 0) countParts.push(`${extraAdults} Extra Adult${extraAdults > 1 ? 's' : ''}`);
    if (childWithBed > 0) countParts.push(`${childWithBed} Child (Bed)`);
    if (childWithoutBed > 0) countParts.push(`${childWithoutBed} Child (No Bed)`);
    if (infantsCount > 0) countParts.push(`${infantsCount} Infant${infantsCount > 1 ? 's' : ''}`);

    return {
      totalPackageCost: totalCost,
      totalOriginalCost: originalCost,
      totalSavings: savingsVal,
      priceAfterDiscount: totalCost,
      gstAmount: gstVal,
      grandTotal: finalTotal,
      guestCountLabel: countParts.join(', '),
      totalPayingGuests: payingGuestsCount,
      baseRoomCost: baseRoomTotalCost,
      categoryBreakdown: [
        {
          label: `Base Room Capacity (${Math.min(totalAdultsCount, minGuests)}/${minGuests} Min Guests)`,
          count: Math.max(totalAdultsCount, minGuests),
          rate: adultRate,
          total: baseRoomTotalCost,
          isBaseRoom: true,
        },
        ...(extraAdultsCountBilled > 0 ? [{
          label: "Extra Adult Add-on",
          count: extraAdultsCountBilled,
          rate: extraAdultRate,
          total: extraAdultsTotalCost,
          isBaseRoom: false,
        }] : []),
        ...(childWithBed > 0 ? [{
          label: "Child with Bed (5-12 yrs)",
          count: childWithBed,
          rate: childWithBedRate,
          total: childWithBedTotalCost,
          isBaseRoom: false,
        }] : []),
        ...(childWithoutBed > 0 ? [{
          label: "Child w/o Bed (2-5 yrs)",
          count: childWithoutBed,
          rate: childWithoutBedRate,
          total: childWithoutBedTotalCost,
          isBaseRoom: false,
        }] : []),
        ...(infantsCount > 0 ? [{
          label: "Infant (Under 2 yrs)",
          count: infantsCount,
          rate: infantRate,
          total: infantTotalCost,
          isBaseRoom: false,
        }] : []),
      ]
    };
  }, [adults, extraAdults, childWithBed, childWithoutBed, infantsCount, pricePerPerson, originalPrice, packageData, minGuests]);

  const guestCount = adults + extraAdults + childWithBed + childWithoutBed;

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

  // ── Smart Night-Stay Route Strip (derived purely from normalizedItinerary) ──────
  // Builds an ordered list of city stops with correct night counts.
  // Night count = number of non-departure days where accommodation is set at that city.
  // Transit days contribute 0 nights; departure days contribute 0 nights.
  type StayStop = {
    city: string;
    nights: number;
    stateName: string;
    countryName: string;
    isTransit: boolean;
  };

  const stayRoute = useMemo<StayStop[]>(() => {
    if (!normalizedItinerary.length) return [];

    // Build a city→{stateName,countryName} lookup from the enriched backend data
    const cityStateLookup = new Map<string, { stateName: string; countryName: string }>();
    if (Array.isArray(packageData.destinationsWithState)) {
      packageData.destinationsWithState.forEach(d => {
        if (d.name) {
          cityStateLookup.set(d.name.trim().toLowerCase(), {
            stateName: d.stateName || packageData.stateName || "",
            countryName: d.countryName || packageData.countryName || "India",
          });
        }
      });
    }

    const getCityMeta = (city: string) => {
      const key = city.trim().toLowerCase();
      return cityStateLookup.get(key) || {
        stateName: packageData.stateName || "",
        countryName: packageData.countryName || "India",
      };
    };

    // Ordered unique city stops in trip sequence
    const orderedCities: string[] = [];
    const nightsMap = new Map<string, number>(); // city lowercase → nights

    normalizedItinerary.forEach(day => {
      const isDeparture = day.dayType === "DEPARTURE";
      const isTransit   = day.dayType === "TRANSIT";
      const hasStay     = Boolean(day.accommodation?.trim()) && !isDeparture;

      if (isTransit || isDeparture) {
        // Show transit fromCity → toCity as connectors (0 nights)
        [day.fromCity, day.toCity].filter(Boolean).forEach((c: string) => {
          const key = c.trim().toLowerCase();
          if (!nightsMap.has(key)) {
            nightsMap.set(key, 0);
            orderedCities.push(c.trim());
          }
        });
        return;
      }

      // For ARRIVAL / SIGHTSEEING / LEISURE — primary city is first in day.cities
      const primaryCity = (day.cities?.[0] || day.location || "").trim();
      if (!primaryCity) return;

      const key = primaryCity.toLowerCase();
      if (!nightsMap.has(key)) {
        nightsMap.set(key, 0);
        orderedCities.push(primaryCity);
      }
      if (hasStay) {
        nightsMap.set(key, (nightsMap.get(key) ?? 0) + 1);
      }
    });

    return orderedCities.map(city => {
      const key = city.toLowerCase();
      const nights = nightsMap.get(key) ?? 0;
      const meta = getCityMeta(city);
      return {
        city,
        nights,
        stateName: meta.stateName,
        countryName: meta.countryName,
        isTransit: nights === 0,
      };
    });
  }, [normalizedItinerary, packageData.destinationsWithState, packageData.stateName, packageData.countryName]);

  // Build hierarchical Country → [State → [City]] structure for the route strip header
  const routeHierarchy = useMemo(() => {
    if (!stayRoute.length) return [];

    // Unique countries (preserving order of first appearance)
    const countries: { name: string; states: { name: string; cities: StayStop[] }[] }[] = [];
    const countryIndex = new Map<string, number>();
    const stateIndex   = new Map<string, number>(); // "country::state" → idx within country.states

    stayRoute.forEach(stop => {
      const country = stop.countryName || "India";
      const state   = stop.stateName || "";

      if (!countryIndex.has(country)) {
        countryIndex.set(country, countries.length);
        countries.push({ name: country, states: [] });
      }
      const ci = countryIndex.get(country)!;
      const stateKey = `${country}::${state}`;

      if (state) {
        if (!stateIndex.has(stateKey)) {
          stateIndex.set(stateKey, countries[ci].states.length);
          countries[ci].states.push({ name: state, cities: [] });
        }
        const si = stateIndex.get(stateKey)!;
        countries[ci].states[si].cities.push(stop);
      } else {
        // No state info — place under an unnamed state group
        const unnamedKey = `${country}::__`;
        if (!stateIndex.has(unnamedKey)) {
          stateIndex.set(unnamedKey, countries[ci].states.length);
          countries[ci].states.push({ name: "", cities: [] });
        }
        const si = stateIndex.get(unnamedKey)!;
        countries[ci].states[si].cities.push(stop);
      }
    });

    return countries;
  }, [stayRoute]);

  return (
    <div className="w-full min-h-screen bg-[#F4F5F7] text-slate-900">
      {/* ═══════════════════════════════════════════
           HERO SECTION — Adaptive Image Slider & Details Flow
      ════════════════════════════════════════════ */}
      <section className="relative lg:min-h-[78vh] overflow-hidden flex flex-col lg:block bg-[#0B1528]">
        {/* Adaptive image slider background */}
        <div className="relative w-full h-[30vh] xs:h-[36vh] sm:h-[48vh] lg:absolute lg:inset-0 lg:h-full z-0">
          <HeroImageSlider
            images={galleryImages.length > 0 ? galleryImages : [packageData.imageUrl || "/default-hero.jpg"]}
            alt={packageData.name || "Package"}
          />
          {/* Layered gradient: gentle bottom-up + left fade so hero images breathe */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
          {/* Softer left spotlight for text legibility */}
          <div className="absolute inset-y-0 left-0 w-[65%] bg-gradient-to-r from-black/30 to-transparent" />
        </div>

        <div className="relative z-10 w-full container mx-auto px-4 lg:px-8 pt-6 pb-6 lg:pt-32 lg:pb-12 bg-[#0B1528] lg:bg-transparent">
          <div className="grid gap-4 lg:grid-cols-[1fr_330px] items-end">

            {/* ── LEFT: Informative content ── */}
            <div className="text-white flex flex-col items-start gap-3.5 max-w-2xl">

              {/* Duration + nights + themes + places chips in a single row (placed above title) */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                {(packageData.duration || packageData.nights) && (
                  <span className="rounded-md bg-white/12 backdrop-blur-sm border border-white/20 px-3.5 py-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>
                      {packageData.nights ? `${packageData.nights} ${Number(packageData.nights) === 1 ? "Night" : "Nights"}` : ""}
                      {packageData.nights && packageData.duration ? " / " : ""}
                      {packageData.duration ? `${packageData.duration} ${Number(packageData.duration) === 1 ? "Day" : "Days"}` : ""}
                    </span>
                  </span>
                )}
                {packageData.category && (
                  <span className="rounded-md bg-accent/90 px-3.5 py-1.5 text-white shadow tracking-wide uppercase">
                    {packageData.category}
                  </span>
                )}
                {heroBadges.map((badge, idx) => (
                  <span key={idx} className="rounded-md bg-white/15 backdrop-blur-sm border border-white/20 px-3.5 py-1.5 text-white/90">
                    {badge}
                  </span>
                ))}
                {packageData.packageCode && (
                  <span className="rounded-md bg-accent text-primary text-[10px] sm:text-xs font-mono font-bold px-3 py-1.5 border border-accent/20 shadow-sm uppercase shrink-0">
                    Code: {packageData.packageCode}
                  </span>
                )}
                {departureCities && (
                  <span className="inline-flex items-center gap-1.5 text-white/90 px-3 py-1.5 rounded-md bg-black/30 backdrop-blur-sm border border-white/10">
                    <MapPin className="w-3.5 h-3.5" />
                    {departureCities}
                  </span>
                )}
              </div>

              {/* Combined Title & Description with single background and reduced spacing */}
              <div className="bg-black/30 backdrop-blur-md rounded-md p-3 sm:p-4 border border-white/10 shadow-xl flex flex-col gap-2 w-full">
                <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                  <h1 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight drop-shadow-lg text-white">
                    {packageData.name}
                  </h1>
                </div>
                <p className="text-[11px] sm:text-xs text-white/80 leading-relaxed">
                  {packageData.shortDescription || packageData.longDescription?.slice(0, 200) || "A curated escape with premium stays and local experiences."}
                </p>
              </div>

            </div>

            {/* ── RIGHT: Price card + quick CTA ── */}
            <aside className="w-full hidden lg:block">
              {/* Combined Price panel + Trust indicators */}
              <div className="rounded-md bg-black/30 backdrop-blur-md border border-white/20 p-2 text-white shadow-2xl flex flex-col gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/60 mb-0.5">Starting from</p>
                  <div className="flex items-end gap-2.5">
                    <p className="text-2xl sm:text-3xl font-black tracking-tight">{priceLabel}</p>
                    {savings > 0 && (
                      <div className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300">
                        Save ₹{savings.toLocaleString("en-IN")}
                        {packageData.discountPercent ? ` · ${packageData.discountPercent}% OFF` : ""}
                      </div>
                    )}
                    {savings > 0 && (
                      <p className="text-xs text-white/40 line-through mb-0.5">₹{originalPrice.toLocaleString("en-IN")}</p>
                    )}
                  </div>
                  <p className="text-[10px] text-white/50 mt-1">Per person · Twin sharing</p>
                </div>

                <div className="space-y-3">
                  {/* Primary CTA */}
                  <Link
                    href="#enquire"
                    className="flex w-full items-center justify-center rounded-md bg-accent py-3 text-sm font-bold text-white shadow-lg hover:bg-accent/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Book This Package
                  </Link>

                  {/* Secondary CTA */}
                  <button
                    onClick={() => {
                      const el = document.getElementById("enquire");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-white/20 bg-white/5 py-2.5 text-sm font-semibold text-white/85 hover:bg-white/10 transition-all"
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
        <div className="grid gap-8 xl:grid-cols-[1.75fr_0.75fr] items-start w-full min-w-0">
          <main className="space-y-8 min-w-0 w-full overflow-hidden">
            {/* Unified Package Overview Highlights, Gallery & Inclusions Card */}
            <section className="rounded-md border border-slate-200 bg-white p-4 md:p-6 shadow-sm space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Left side: Highlights */}
                {packageHighlights.length > 0 && (
                  <div className="flex flex-col h-[280px]">
                    <h3 className="text-lg font-bold text-slate-900 mb-3 shrink-0">Tour Highlights</h3>
                    <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                      {packageHighlights.map((highlight, idx) => (
                        <div key={idx} className="rounded-md bg-slate-50 px-3 py-2 md:px-4 md:py-3 text-xs text-slate-700 font-medium border border-slate-100/80 hover:bg-slate-100/50 transition-colors">
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
                    <div className="flex-1 grid grid-cols-2 gap-2 overflow-hidden rounded-md">
                      {galleryImages.slice(0, 4).map((image, idx) => {
                        const isLast = idx === 3;
                        const hasMore = galleryImages.length > 4;
                        return (
                          <div
                            key={idx}
                            onClick={() => setActiveLightboxIndex(idx)}
                            className="relative w-full h-full overflow-hidden bg-slate-100 group cursor-pointer rounded-md"
                          >
                            <Image
                              src={validateImageUrl(image, 400, 300, "4:3")}
                              alt={`${packageData.name} photo ${idx + 1}`}
                              fill
                              sizes="(max-width: 768px) 50vw, 25vw"
                              className="object-cover transition duration-500 group-hover:scale-105"
                            />
                            {isLast && hasMore && (
                              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white font-extrabold text-sm md:text-base backdrop-blur-[2px] transition group-hover:bg-black/55 rounded-md">
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
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    {inclusionItems.map((item, idx) => {
                      const IconComponent = item.Icon;
                      return (
                        <div key={idx} className="flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 bg-slate-50 border border-slate-100 rounded-md px-2.5 py-1.5 sm:px-4 sm:py-2 hover:border-primary/20 transition-all">
                          <div className="w-6.5 h-6.5 sm:w-8 sm:h-8 rounded-md bg-[#1B3A6B] text-[#E5F1FF] flex items-center justify-center shadow-sm shrink-0">
                            <IconComponent className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                          </div>
                          <span className="text-[9px] sm:text-[11px] font-extrabold text-slate-800 tracking-wider uppercase">
                            {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            <section id="overview" className="rounded-md border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-900">Package Overview</h2>
                  <p className="mt-2 text-sm text-slate-500">A complete summary of what’s included in your journey.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                  <Check className="h-4 w-4" />
                  Trusted itinerary
                </div>
              </div>
              <div className="mt-4 prose prose-sm prose-slate max-w-none text-xs sm:text-sm leading-relaxed text-slate-600 animate-fade-in" dangerouslySetInnerHTML={{ __html: packageData.longDescription || packageData.shortDescription || "No overview available." }} />
            </section>

            {/* Itinerary Section with Timeline Accordion Design */}
            {normalizedItinerary.length > 0 && (
              <section id="itinerary" className="rounded-md border border-slate-200 bg-white p-3 md:p-4 shadow-sm w-full min-w-0 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-900">Itinerary</h2>
                  {stayRoute.length > 0 && (
                    <span className="text-xs text-slate-500 font-medium">
                      {packageData.nights ? `${packageData.nights}N` : ""}
                      {packageData.duration ? ` / ${packageData.duration}D` : ""}
                      {" · "}{stayRoute.filter(s => s.nights > 0).length} Stay Cities
                    </span>
                  )}
                </div>

                {/* ── Country → State → City Night-Stay Route Strip ── */}
                {routeHierarchy.length > 0 && (
                  <div className="mb-6 rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/40 p-3 md:p-4 overflow-hidden">
                    {/* Top: Countries row */}
                    {routeHierarchy.map((country, cIdx) => (
                      <div key={cIdx} className="mb-3 last:mb-0">
                        {/* Country header */}
                        <div className="flex items-center gap-2 mb-2.5">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1B3A6B] text-white text-[10px] font-bold uppercase tracking-widest shrink-0">
                            <Globe className="w-3 h-3" />
                            <span>{country.name}</span>
                          </div>
                          <div className="flex-1 h-px bg-gradient-to-r from-[#1B3A6B]/30 to-transparent" />
                        </div>

                        {/* States row */}
                        {country.states.map((stateGroup, sIdx) => (
                          <div key={sIdx} className={`${sIdx > 0 ? "mt-3" : ""}`}>
                            {/* State sub-header */}
                            {stateGroup.name && (
                              <div className="flex items-center gap-2 mb-2 ml-2">
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#1B3A6B]/10 text-[#1B3A6B] text-[10px] font-semibold uppercase tracking-wider border border-[#1B3A6B]/20 shrink-0">
                                  <MapPin className="w-2.5 h-2.5" />
                                  <span>{stateGroup.name}</span>
                                </div>
                                <div className="flex-1 h-px bg-[#1B3A6B]/10" />
                              </div>
                            )}

                            {/* Cities row — horizontally scrollable on mobile */}
                            <div className="flex items-center gap-0 ml-4 overflow-x-auto pb-1 scrollbar-hide">
                              {stateGroup.cities.map((stop, cityIdx) => (
                                <div key={cityIdx} className="flex items-center shrink-0">
                                  {/* City pill */}
                                  <div className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg border text-center ${
                                    stop.nights > 0
                                      ? "bg-white border-emerald-200 shadow-sm"
                                      : "bg-slate-50 border-slate-200 opacity-80"
                                  }`}>
                                    <span className="text-[11px] font-bold text-slate-800 whitespace-nowrap">
                                      {stop.city}
                                    </span>
                                    {stop.nights > 0 ? (
                                      <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                        {stop.nights}N
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-medium text-slate-400 whitespace-nowrap">transit</span>
                                    )}
                                  </div>
                                  {/* Arrow connector between cities */}
                                  {cityIdx < stateGroup.cities.length - 1 && (
                                    <div className="flex items-center shrink-0 mx-1">
                                      <div className="w-4 h-px bg-slate-300" />
                                      <ChevronRight className="w-3 h-3 text-slate-400 -ml-1" />
                                    </div>
                                  )}
                                </div>
                              ))}
                              {/* Arrow to next state group within same country */}
                              {sIdx < country.states.length - 1 && (
                                <div className="flex items-center shrink-0 mx-2">
                                  <div className="w-6 h-px bg-slate-300 border-dashed" />
                                  <ChevronRight className="w-3.5 h-3.5 text-[#1B3A6B]/50 -ml-1" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Arrow to next country */}
                        {cIdx < routeHierarchy.length - 1 && (
                          <div className="flex items-center gap-1.5 mt-3 ml-4">
                            <div className="w-8 h-px bg-[#1B3A6B]/30 border-t border-dashed" />
                            <ChevronRight className="w-4 h-4 text-[#1B3A6B]/40" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-0">
                  {normalizedItinerary.map((day, idx) => {
                    const isExpanded = expandedDays.has(idx);
                    const attractions = day.attractions || [];
                    const activities = day.activities || [];
                    // Keep attractions and activities STRICTLY SEPARATE — do not de-dup across them
                    const mealItems = normalizeMeals(day.meals);
                    const enrouteStops = day.enrouteDiningStops || [];
                    const hasSightseeingText = Boolean(day.sightseeing);
                    const hasAttractions = attractions.length > 0;
                    const hasActivities = activities.length > 0;
                    const hotelInfo = day.accommodation ? parseHotel(day.accommodation) : null;
                    const transportName = day.transport || day.cab;
                    const transportInfo = transportName ? parseTransport(transportName) : null;
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
                      <div key={idx} className="relative pb-3">
                        {/* Timeline line and dot */}
                        {idx < normalizedItinerary.length - 1 && (
                          <div className="absolute left-2.5 sm:left-4 top-5 sm:top-6 bottom-0 w-0.5 bg-slate-200" />
                        )}
                        {/* Timeline dot — dynamic icon based on day type */}
                        <div className={`absolute left-0 top-3 h-5 sm:h-8 w-5 sm:w-8 rounded-full border-2 flex items-center justify-center z-10 shadow-xs ${day.dayType === "TRANSIT"
                            ? "border-amber-300 bg-amber-50"
                            : day.dayType === "ARRIVAL"
                              ? "border-emerald-300 bg-emerald-50"
                              : day.dayType === "DEPARTURE"
                                ? "border-rose-300 bg-rose-50"
                                : day.dayType === "LEISURE"
                                  ? "border-purple-300 bg-purple-50"
                                  : "border-blue-300 bg-blue-50"
                          }`}>
                          {day.dayType === "TRANSIT" ? (
                            <Car className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-amber-600" />
                          ) : day.dayType === "ARRIVAL" ? (
                            <Plane className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-emerald-600" />
                          ) : day.dayType === "DEPARTURE" ? (
                            <Home className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-rose-600" />
                          ) : day.dayType === "LEISURE" ? (
                            <Sparkles className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-purple-600" />
                          ) : (
                            <Mountain className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-[#1B3A6B]" />
                          )}
                        </div>

                        {/* Day header with expand button */}
                        <button
                          onClick={handleToggle}
                          className="w-full pl-7 sm:pl-12 pr-3 sm:pr-4 py-1.5 sm:py-2 hover:bg-slate-50/50 rounded-md transition flex items-start justify-between gap-3"
                        >
                          <div className="text-left flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">
                                Day {idx + 1}
                              </p>
                              {/* Dynamic Day type badge — rendered for ALL day types */}
                              <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full leading-none border ${
                                day.dayType === "TRANSIT"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : day.dayType === "ARRIVAL"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : day.dayType === "DEPARTURE"
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : day.dayType === "LEISURE"
                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                        : "bg-blue-50 text-[#1B3A6B] border-blue-200"
                              }`}>
                                {day.dayType === "TRANSIT" ? "TRAVEL DAY"
                                  : day.dayType === "ARRIVAL" ? "ARRIVAL DAY"
                                    : day.dayType === "DEPARTURE" ? "DEPARTURE DAY"
                                      : day.dayType === "LEISURE" ? "LEISURE DAY"
                                        : "SIGHTSEEING DAY"}
                              </span>
                              {/* TRANSIT & DEPARTURE: From → Via → To route display (Single location above title) */}
                              {(day.isTransit || day.dayType === "DEPARTURE") && (day.transitRoute || (day.fromCity && day.toCity)) && (
                                <span className={`text-[8px] sm:text-[9px] font-semibold rounded-full px-2 py-0.5 flex items-center gap-1 leading-none border ${
                                  day.dayType === "DEPARTURE" 
                                    ? "text-rose-600 bg-rose-50 border-rose-200" 
                                    : "text-amber-600 bg-amber-50 border-amber-200"
                                }`}>
                                  <span>{day.transitRoute || `${day.fromCity} → ${day.toCity}`}</span>
                                </span>
                              )}
                            </div>
                            {/* Title — full wrap, no truncation, larger font on all screen sizes */}
                            <h3 className="mt-1 text-sm sm:text-base md:text-lg font-bold text-slate-800 leading-snug break-words">
                              {day.title || `Day ${idx + 1}`}
                            </h3>
                          </div>
                          <div className="mt-1 flex-shrink-0">
                            {isExpanded ? (
                              <ChevronUp className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-slate-400" />
                            ) : (
                              <ChevronDown className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-slate-400" />
                            )}
                          </div>
                        </button>


                        {/* Expanded content */}
                        {isExpanded && (
                          <div className="pl-7 pr-2 pb-2 sm:pl-12 sm:pr-4 space-y-1.5 w-full min-w-0 overflow-hidden">
                            {/* Main description */}
                            {(day.description || day.content) && (
                              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                {day.description || day.content}
                              </p>
                            )}

                            {/* ── CARD 1: Sightseeing (free-text field from admin) ── */}
                            {hasSightseeingText && (
                              <div className="rounded-lg border border-blue-100 bg-blue-50/20 p-2.5 sm:p-3">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Camera className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                  <p className="text-[10px] sm:text-xs font-bold text-slate-800 uppercase tracking-wider">Sightseeing Summary</p>
                                </div>
                                <p className="text-[11px] sm:text-xs text-slate-700 ml-5 leading-relaxed">{day.sightseeing}</p>
                              </div>
                            )}

                            {/* Attractions Section */}
                            {hasAttractions && (
                              <div className="rounded-lg border border-indigo-100 bg-indigo-50/20 p-2 sm:p-2.5 space-y-2">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <Ticket className="h-3.5 w-3.5 text-indigo-650 shrink-0" />
                                    <p className="text-[10px] sm:text-xs font-bold text-slate-800 uppercase tracking-wider">Attractions &amp; Sightseeing</p>
                                  </div>
                                  <p className="text-[9px] sm:text-[10px] text-slate-400 pl-5">Key attractions and experiences included in this day.</p>
                                </div>
                                <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 show-horizontal-scrollbar">
                                  {attractions.map((item: any, attrIdx: number) => (
                                    <button
                                      key={attrIdx}
                                      onClick={() => handleAttractionClick(item.name, item)}
                                      className="w-[90px] sm:w-[110px] h-[64px] sm:h-[75px] rounded-lg overflow-hidden relative border border-slate-100 hover:border-indigo-300 hover:shadow-md active:scale-95 transition-all text-left flex-shrink-0 cursor-pointer group shadow-sm disabled:opacity-50"
                                      disabled={loadingDetail}
                                    >
                                      {item.coverImage ? (
                                        <img
                                          src={item.coverImage}
                                          alt={item.name}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-650 flex items-center justify-center">
                                          <Camera className="w-4 h-4 text-white/30" />
                                        </div>
                                      )}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/5" />
                                      <div className="absolute bottom-1 left-1 right-1 text-white min-w-0">
                                        <p className="text-[5.5px] uppercase tracking-wider text-slate-350 font-bold leading-none truncate">
                                          {item.type || 'Sightseeing'}
                                        </p>
                                        <p className="text-[8px] sm:text-[9.5px] font-bold text-white leading-tight mt-0.5 truncate group-hover:text-indigo-200 transition-colors">
                                          {item.name}
                                        </p>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Activities Section */}
                            {hasActivities && (
                              <div className="rounded-lg border border-green-100 bg-green-50/20 p-2 sm:p-2.5 space-y-2">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <Zap className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                    <p className="text-[10px] sm:text-xs font-bold text-slate-800 uppercase tracking-wider">Activities</p>
                                  </div>
                                  <p className="text-[9px] sm:text-[10px] text-slate-400 pl-5">Curated experiences and adventures for this day.</p>
                                </div>
                                <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 show-horizontal-scrollbar">
                                  {activities.map((item: any, activityIdx: number) => (
                                    <button
                                      key={activityIdx}
                                      onClick={() => handleActivityClick(item.name, item)}
                                      className="w-[90px] sm:w-[110px] h-[64px] sm:h-[75px] rounded-lg overflow-hidden relative border border-green-100 hover:border-green-300 hover:shadow-md active:scale-95 transition-all text-left flex-shrink-0 cursor-pointer group shadow-sm disabled:opacity-50"
                                      disabled={loadingDetail}
                                    >
                                      {item.coverImage ? (
                                        <img
                                          src={item.coverImage}
                                          alt={item.name}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-650 flex items-center justify-center">
                                          <Zap className="w-4 h-4 text-white/30" />
                                        </div>
                                      )}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/5" />
                                      <div className="absolute bottom-1 left-1 right-1 text-white min-w-0">
                                        <p className="text-[5.5px] uppercase tracking-wider text-slate-300 font-bold leading-none truncate">
                                          {item.type || 'Activity'}
                                        </p>
                                        <p className="text-[8px] sm:text-[9.5px] font-bold text-white leading-tight mt-0.5 truncate group-hover:text-green-200 transition-colors">
                                          {item.name}
                                        </p>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Enroute Dining Stops */}
                            {enrouteStops.length > 0 && (
                              <div className="rounded-lg border border-orange-100 bg-orange-50/20 p-2 sm:p-2.5 space-y-2">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <Coffee className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                                    <p className="text-[10px] sm:text-xs font-bold text-slate-800 uppercase tracking-wider">Enroute Dining Stops</p>
                                  </div>
                                  <p className="text-[9px] sm:text-[10px] text-slate-400 pl-5">Best recommended food stops during travel journey.</p>
                                </div>
                                <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 show-horizontal-scrollbar">
                                  {enrouteStops.map((item: any, diningIdx: number) => (
                                    <button
                                      key={diningIdx}
                                      onClick={() => handleDiningClick(item.name, item)}
                                      className="w-[90px] sm:w-[110px] h-[64px] sm:h-[75px] rounded-lg overflow-hidden relative border border-slate-100 hover:border-orange-300 hover:shadow-md active:scale-95 transition-all text-left flex-shrink-0 cursor-pointer group shadow-sm disabled:opacity-50"
                                      disabled={loadingDetail}
                                    >
                                      {item.coverImage ? (
                                        <img
                                          src={item.coverImage}
                                          alt={item.name}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-650 flex items-center justify-center">
                                          <Coffee className="w-4 h-4 text-white/30" />
                                        </div>
                                      )}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/5" />
                                      <div className="absolute bottom-1 left-1 right-1 text-white min-w-0">
                                        <p className="text-[5.5px] uppercase tracking-wider text-slate-350 font-bold leading-none truncate">
                                          {item.mealType ? `${item.mealType} Stop` : 'Dining Stop'}
                                        </p>
                                        <p className="text-[8px] sm:text-[9.5px] font-bold text-white leading-tight mt-0.5 truncate group-hover:text-orange-200 transition-colors">
                                          {item.name}
                                        </p>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Transport info */}
                            {transportInfo && (
                              <div className="rounded-lg border border-blue-100 bg-blue-50/20 p-2 sm:p-2.5 space-y-2">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <Car className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                    <p className="text-[10px] sm:text-xs font-bold text-slate-800 uppercase tracking-wider">Travel Details</p>
                                  </div>
                                  <p className="text-[9px] sm:text-[10px] text-slate-400 pl-5">Transportation mode for this day.</p>
                                </div>
                                <button
                                  onClick={() => handleTransportClick(transportInfo.name, transportInfo)}
                                  className="w-[90px] sm:w-[110px] h-[64px] sm:h-[75px] rounded-lg overflow-hidden relative border border-slate-100 hover:border-blue-300 hover:shadow-md active:scale-95 transition-all text-left flex-shrink-0 cursor-pointer group shadow-sm disabled:opacity-50"
                                  disabled={loadingDetail}
                                >
                                  {transportInfo.image ? (
                                    <img
                                      src={transportInfo.image}
                                      alt={transportInfo.name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-650 flex items-center justify-center">
                                      <Car className="w-4 h-4 text-white/30" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/5" />
                                  <div className="absolute bottom-1 left-1 right-1 text-white min-w-0">
                                    <p className="text-[5.5px] uppercase tracking-wider text-slate-330 font-bold leading-none truncate">
                                      {transportInfo.type ? `${transportInfo.type} • ${transportInfo.capacity} Pax` : 'Cab Service'}
                                    </p>
                                    <p className="text-[8px] sm:text-[9.5px] font-bold text-white leading-tight mt-0.5 truncate group-hover:text-blue-200 transition-colors">
                                      {transportInfo.name}
                                    </p>
                                  </div>
                                </button>
                              </div>
                            )}

                            {/* Night Stay & Hotel Meals (or Departure Meals only) */}
                            {day.dayType === "DEPARTURE" ? (
                              <div className="rounded-lg border border-orange-200/70 bg-gradient-to-r from-orange-50/40 to-amber-50/30 p-2.5 sm:p-3 space-y-2">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <Utensils className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                                    <p className="text-[10px] sm:text-xs font-bold text-slate-800 uppercase tracking-wider">
                                      Meals at Hotel (No Night Stay)
                                    </p>
                                  </div>
                                  <p className="text-[9px] sm:text-[10px] text-slate-500 pl-5">
                                    Complimentary breakfast/meals provided at hotel prior to checkout & departure journey.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-1.5 items-center pl-5 pt-0.5">
                                  {(mealItems.length > 0 ? mealItems : ["Breakfast"]).map((meal, mealIdx) => (
                                    <span
                                      key={mealIdx}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-orange-200 bg-white text-[10px] font-bold text-orange-700 shadow-xs"
                                    >
                                      <span>🍽️</span> {meal}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              (hotelInfo || mealItems.length > 0) && (
                                <div className="rounded-lg border border-amber-100 bg-amber-50/20 p-2 sm:p-2.5 space-y-2">
                                  <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <Building2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                      <p className="text-[10px] sm:text-xs font-bold text-slate-800 uppercase tracking-wider">Night Stay &amp; Meals</p>
                                    </div>
                                    <p className="text-[9px] sm:text-[10px] text-slate-400 pl-5">Accommodation and meals included at the hotel stay.</p>
                                  </div>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    {hotelInfo && (
                                      <button
                                        onClick={() => handleHotelClick(hotelInfo.name, hotelInfo)}
                                        className="w-[90px] sm:w-[110px] h-[64px] sm:h-[75px] rounded-lg overflow-hidden relative border border-slate-100 hover:border-amber-300 hover:shadow-md active:scale-95 text-left flex-shrink-0 cursor-pointer group shadow-sm disabled:opacity-50"
                                        disabled={loadingDetail}
                                      >
                                        {hotelInfo.image ? (
                                          <img
                                            src={hotelInfo.image}
                                            alt={hotelInfo.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                          />
                                        ) : (
                                          <div className="w-full h-full bg-gradient-to-br from-amber-500 to-orange-650 flex items-center justify-center">
                                            <Building2 className="w-4 h-4 text-white/30" />
                                          </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/5" />
                                        <div className="absolute bottom-1 left-1 right-1 text-white min-w-0">
                                          <p className="text-[5.5px] uppercase tracking-wider text-slate-350 font-bold leading-none truncate">
                                            {hotelInfo.starRating ? `${hotelInfo.starRating} Star stay` : 'Hotel Stay'}
                                          </p>
                                          <p className="text-[8px] sm:text-[9.5px] font-bold text-white leading-tight mt-0.5 truncate group-hover:text-amber-200 transition-colors">
                                            {hotelInfo.name}
                                          </p>
                                        </div>
                                      </button>
                                    )}

                                    {mealItems.length > 0 && (
                                      <div className="flex-1 flex flex-wrap gap-1 items-center">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block w-full mb-0.5">Meals Included:</span>
                                        {mealItems.map((meal, mealIdx) => (
                                          <span key={mealIdx} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full border border-emerald-100 bg-white text-[9px] font-semibold text-emerald-700 shadow-xs">
                                            <span>🍽️</span> {meal}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
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
              <section id="inclusions" className="rounded-md border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
                <div className="grid gap-8 lg:grid-cols-2">

                  {/* ── Inclusions — green checkmarks ── */}
                  {packageInclusions.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-emerald-100">
                        What's Included
                      </h3>
                      <ul className="space-y-2.5">
                        {packageInclusions.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            </span>
                            <span className="text-sm text-slate-700 font-medium leading-snug">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* ── Exclusions — red cross icons ── */}
                  {packageExclusions.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-rose-100">
                        What's Not Included
                      </h3>
                      <ul className="space-y-2.5">
                        {packageExclusions.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center">
                              <X className="w-3 h-3 text-rose-600" />
                            </span>
                            <span className="text-sm text-slate-700 font-medium leading-snug">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              </section>
            )}

            <div id="policies" className="grid grid-cols-1 md:grid-cols-2 gap-6 scroll-mt-20">
              {/* Payment Policy Card */}
              <section className="rounded-md border border-slate-200 bg-white p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Payment &amp; Booking Policy</h3>
                  <p className="text-[9px] text-slate-400 font-bold tracking-wide uppercase mt-0.5">Securing your reservations</p>
                </div>
                <div className="border-t border-slate-100 pt-3 mt-4">
                  {renderPolicyContent(packageData.paymentPolicy || null)}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[9px] font-bold text-indigo-700 bg-indigo-50/40 px-2 py-1 rounded">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Safe &amp; Secure Payment Processing</span>
                </div>
              </section>

              {/* Cancellation Policy Card */}
              <section className="rounded-md border border-slate-200 bg-white p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Cancellation &amp; Refund Policy</h3>
                  <p className="text-[9px] text-slate-400 font-bold tracking-wide uppercase mt-0.5">Easy cancellation terms</p>
                </div>
                <div className="border-t border-slate-100 pt-3 mt-4">
                  {renderPolicyContent(packageData.cancellationPolicy || null)}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[9px] font-bold text-rose-700 bg-rose-50/40 px-2 py-1 rounded">
                  <Info className="w-3.5 h-3.5" />
                  <span>Refer to T&amp;C for detailed retention slabs</span>
                </div>
              </section>
            </div>

            {importantNotes.length > 0 && (
              <section id="important-notes" className="rounded-md border border-amber-100 bg-amber-50/40 p-4 md:p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-amber-200">
                  Important Notes
                </h2>
                <ul className="space-y-2.5">
                  {importantNotes.map((note, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                      </span>
                      <span className="text-sm text-slate-700 font-medium leading-snug">{note}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* ── Custom Lead Capture Inquiry Form ── */}
            <section id="enquire" className="rounded-md border border-slate-200 bg-white p-4 md:p-6 shadow-sm scroll-mt-20">
              <h2 className="text-lg sm:text-2xl font-bold text-slate-900">Enquire &amp; Customize Your Trip</h2>
              <p className="mt-2 text-sm text-slate-500 font-medium">Have special requirements or want a custom seasonal package quote? Fill out the details below and our destination expert will call you shortly.</p>

              <form onSubmit={handleInquirySubmit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Honeypot fields to prevent spam bots */}
                <input type="text" name="website" className="hidden" value={honeypotWebsite} onChange={e => setHoneypotWebsite(e.target.value)} />

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Your Name *</label>
                  <input required type="text" value={inquiryName} onChange={e => setInquiryName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1B3A6B] outline-none text-sm" placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Your Email *</label>
                  <input required type="email" value={inquiryEmail} onChange={e => setInquiryEmail(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1B3A6B] outline-none text-sm" placeholder="e.g. john@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number *</label>
                  <input required type="tel" value={inquiryPhone} onChange={e => setInquiryPhone(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1B3A6B] outline-none text-sm" placeholder="e.g. +91 9000000000" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Travel Date</label>
                  <input type="date" value={inquiryDate} onChange={e => setInquiryDate(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1B3A6B] outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Number of Persons</label>
                  <input type="number" min="1" value={inquiryGuests} onChange={e => setInquiryGuests(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1B3A6B] outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Your Budget (INR)</label>
                  <input type="number" value={inquiryBudget} onChange={e => setInquiryBudget(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1B3A6B] outline-none text-sm" placeholder="e.g. 50000" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Message / Special Requests</label>
                  <textarea value={inquiryMessage} onChange={e => setInquiryMessage(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1B3A6B] outline-none text-sm" placeholder="Tell us what you want to customize (e.g. hotel category, transport details)..." />
                </div>
                <div className="md:col-span-2">
                  <button type="submit" disabled={isSubmittingInquiry} className="w-full bg-[#1B3A6B] text-white py-3 rounded-lg font-bold hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 text-sm">
                    {isSubmittingInquiry ? "Submitting Inquiry..." : "Submit Inquiry"}
                  </button>
                </div>
              </form>
            </section>

            {packageHotels.length > 0 && (
              <section id="hotels" className="rounded-md border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
                <h2 className="text-lg sm:text-2xl font-bold text-slate-900 mb-4">Hotels &amp; Stay</h2>
                <div className="space-y-4">
                  {packageHotels.map((hotel, idx) => (
                    <div key={idx} className="rounded-md border border-slate-200 bg-slate-50 p-4 md:p-5">
                      <p className="text-base font-semibold text-slate-900">{hotel.hotelName || 'Hotel'}</p>
                      <p className="mt-2 text-sm text-slate-600">{hotel.city || 'Location'} • {hotel.category || 'Category'} • {hotel.nights ?? '-'} Nights</p>
                      {hotel.roomType && <p className="mt-2 text-sm text-slate-600">Room type: {hotel.roomType}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {faqs.length > 0 && (
              <section id="faqs" className="rounded-md border border-slate-200 bg-white p-4 md:p-6 shadow-sm pb-10">
                <h2 className="text-lg sm:text-2xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {faqs.map((faq, idx) => (
                    <div key={idx} className="rounded-md border border-slate-200 overflow-hidden">
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

          <aside className="space-y-2.5 xl:sticky xl:top-[76px]">
            {/* ── 1. Dynamic Rate Calendar Widget (TOP of Sidebar) ── */}
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm space-y-2.5 hidden xl:block">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#1B3A6B]">Step 1: Select Departure Date</p>
                  {travelDate ? (
                    <p className="text-[10px] font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Selected: {travelDate}
                    </p>
                  ) : (
                    <p className="text-[7px] text-slate-500 font-normal mt-0.5">Click any date to see exact rates</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                    className="p-1 border border-slate-200 rounded hover:bg-slate-50 text-[10px] font-bold leading-none"
                  >
                    &larr;
                  </button>
                  <span className="text-[11px] font-bold text-slate-700 min-w-[64px] text-center font-mono">
                    {currentMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                    className="p-1 border border-slate-200 rounded hover:bg-slate-50 text-[10px] font-bold leading-none"
                  >
                    &rarr;
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 text-center text-[9px] font-bold text-slate-400 border-b border-slate-100 pb-1 uppercase tracking-wider">
                <div>Su</div>
                <div>Mo</div>
                <div>Tu</div>
                <div>We</div>
                <div>Th</div>
                <div>Fr</div>
                <div>Sa</div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {monthDays.map((dayDate, idx) => {
                  const isCurrentMonth = dayDate.getMonth() === currentMonth.getMonth();
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isPast = dayDate < today;

                  const yyyy = dayDate.getFullYear();
                  const mm = String(dayDate.getMonth() + 1).padStart(2, "0");
                  const dd = String(dayDate.getDate()).padStart(2, "0");
                  const dateStr = `${yyyy}-${mm}-${dd}`;

                  const rule = calendarRates.find(r => r.date === dateStr || (typeof r.date === "string" && r.date.split("T")[0] === dateStr));
                  const isSelected = travelDate === dateStr;

                  let finalPrice = basePricePerPerson;
                  let originalPriceBeforeDiscount = originalPrice;
                  let isBlackout = false;
                  let isPriceOnReq = false;
                  let rateType = "regular";
                  let discountPercentVal = 0;

                  if (rule) {
                    rateType = rule.rateType || "regular";
                    if (rule.rateType === "blackout") isBlackout = true;
                    else if (rule.rateType === "price-on-request") isPriceOnReq = true;
                    else {
                      const mod = Number(rule.priceModifierValue) || 0;
                      if (rule.priceModifierType === "fixed") finalPrice = mod;
                      else if (rule.priceModifierType === "percentage") finalPrice = basePricePerPerson * (1 + mod / 100);
                      else if (rule.priceModifierType === "value") finalPrice = basePricePerPerson + mod;

                      originalPriceBeforeDiscount = finalPrice;

                      const disc = Number(rule.discountValue) || 0;
                      if (rule.discountType === "percentage") {
                        finalPrice = finalPrice * (1 - disc / 100);
                        discountPercentVal = disc;
                      } else if (rule.discountType === "flat") {
                        finalPrice = Math.max(0, finalPrice - disc);
                        discountPercentVal = Math.round((disc / originalPriceBeforeDiscount) * 100);
                      }
                    }
                  } else {
                    const disc = packageData.discountPercent || 0;
                    if (disc > 0) {
                      finalPrice = basePricePerPerson;
                      originalPriceBeforeDiscount = originalPrice;
                      discountPercentVal = disc;
                    }
                  }

                  const isDisabled = isPast || !isCurrentMonth || isBlackout;
                  const isPeak = rateType === "peak";
                  const isOff = rateType === "off-season";

                  let cellBgClass = "bg-white text-slate-800 border-slate-100 hover:bg-slate-50";
                  if (isSelected) {
                    cellBgClass = "bg-[#1B3A6B] text-white border-[#1B3A6B] shadow-md shadow-[#1B3A6B]/20 scale-[1.02]";
                  } else if (isBlackout) {
                    cellBgClass = "bg-slate-100 text-slate-450 line-through border-slate-200 pointer-events-none";
                  } else if (isPriceOnReq) {
                    cellBgClass = "bg-amber-50/70 text-amber-800 border-amber-250/70 hover:bg-amber-100";
                  } else if (isPeak) {
                    cellBgClass = "bg-rose-50/60 text-rose-800 border-rose-150/70 hover:bg-rose-100/70";
                  } else if (isOff) {
                    cellBgClass = "bg-sky-50/60 text-sky-850 border-sky-150/70 hover:bg-sky-100/70";
                  } else if (rule && rateType === "regular") {
                    cellBgClass = "bg-emerald-50/40 text-emerald-800 border-emerald-150/70 hover:bg-emerald-100/60";
                  }

                  return (
                    <button
                      type="button"
                      key={idx}
                      disabled={isDisabled}
                      onClick={() => {
                        setTravelDate(dateStr);
                      }}
                      className={`h-9 rounded-md flex flex-col justify-between items-center p-0.5 transition-all border ${cellBgClass}`}
                    >
                      <span className="text-[8.5px] leading-none font-bold">{dayDate.getDate()}</span>
                      {isCurrentMonth && !isPast && !isBlackout && !isPriceOnReq && (
                        <div className="flex flex-col items-center justify-center leading-none">
                          {discountPercentVal > 0 && !isSelected && (
                            <div className="flex items-center justify-center gap-0.5 leading-none scale-90 mb-0.5">
                              <span className="text-[5.5px] font-bold line-through text-[#1B3A6B]">
                                ₹{Math.round(originalPriceBeforeDiscount)}
                              </span>
                              <span className="text-[6px] text-rose-600 font-extrabold bg-rose-50 px-0.5 rounded border border-rose-100 leading-none">
                                -{discountPercentVal}%
                              </span>
                            </div>
                          )}
                          <span className={`text-[8.5px] font-extrabold tracking-tight leading-none ${isSelected ? "text-white" : discountPercentVal > 0 ? "text-emerald-700" : "text-slate-800"}`}>
                            ₹{Math.round(finalPrice)}
                          </span>
                        </div>
                      )}
                      {isBlackout && <span className="text-[6.5px] font-bold text-slate-400">Sold</span>}
                      {isPriceOnReq && <span className="text-[6.5px] font-bold text-amber-700">Req</span>}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Rates Color Legend */}
              <div className="flex flex-wrap items-center justify-between gap-y-1 pt-1.5 border-t border-slate-100 text-[8px] font-medium text-slate-500">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded bg-rose-50 border border-rose-150"></span> Peak</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded bg-sky-50 border border-sky-150"></span> Off-Season</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded bg-emerald-50/40 border border-emerald-150"></span> Regular</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded bg-amber-50 border border-amber-200"></span> Request</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded bg-slate-100 border border-slate-200"></span> Sold</span>
              </div>
            </div>

            {/* ── 2. Compact E-Commerce Price Breakout & CTA Box (BELOW Calendar) ── */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-md space-y-2.5 hidden xl:block">
              {/* Header with Date, Guest Count & Change Toggle */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#1B3A6B]">Step 2: Pricing Breakout</p>
                  <p className="text-[7px] font-bold text-slate-700 mt-0.5 flex items-center gap-1">
                    <span>{travelDate ? `📅 ${travelDate}` : 'Standard Rates'} • {guestCountLabel}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {totalSavings > 0 && (
                    <span className="text-[8.5px] font-black text-emerald-800 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      {discountLabel}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowGuestsEdit(!showGuestsEdit)}
                    className="text-[9px] font-bold text-[#1B3A6B] hover:underline bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded border border-slate-200"
                  >
                    {showGuestsEdit ? "Done" : "Edit Guests"}
                  </button>
                </div>
              </div>

              {/* Collapsible Occupancy Adjusters */}
              {showGuestsEdit && (
                <div className="space-y-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                  {/* Primary Adults */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Adults (Primary)</p>
                      <p className="text-[9px] text-slate-400">Base room capacity (Age 12+)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setAdults(prev => Math.max(1, prev - 1))} className="w-5.5 h-5.5 rounded-full border border-slate-300 bg-white flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 text-xs">−</button>
                      <span className="text-xs font-bold text-slate-900 w-4 text-center font-mono">{adults}</span>
                      <button type="button" onClick={() => {
                        if (guestCount >= maxGuests) { toast.error(`Maximum allowed guests is ${maxGuests}`); return; }
                        setAdults(prev => prev + 1);
                      }} className="w-5.5 h-5.5 rounded-full border border-slate-300 bg-white flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 text-xs">+</button>
                    </div>
                  </div>

                  {/* Extra Adult */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Extra Adult</p>
                      <p className="text-[9px] text-slate-400">Add-on guest in room</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setExtraAdults(prev => Math.max(0, prev - 1))} className="w-5.5 h-5.5 rounded-full border border-slate-300 bg-white flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 text-xs">−</button>
                      <span className="text-xs font-bold text-slate-900 w-4 text-center font-mono">{extraAdults}</span>
                      <button type="button" onClick={() => {
                        if (guestCount >= maxGuests) { toast.error(`Maximum allowed guests is ${maxGuests}`); return; }
                        setExtraAdults(prev => prev + 1);
                      }} className="w-5.5 h-5.5 rounded-full border border-slate-300 bg-white flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 text-xs">+</button>
                    </div>
                  </div>

                  {/* Child with Bed */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Child with Bed</p>
                      <p className="text-[9px] text-slate-400">Age 5–12 yrs (extra bed)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setChildWithBed(prev => Math.max(0, prev - 1))} className="w-5.5 h-5.5 rounded-full border border-slate-300 bg-white flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 text-xs">−</button>
                      <span className="text-xs font-bold text-slate-900 w-4 text-center font-mono">{childWithBed}</span>
                      <button type="button" onClick={() => {
                        if (adults < 1) { toast.warning("At least 1 adult required"); return; }
                        if (guestCount >= maxGuests) { toast.error(`Maximum allowed guests is ${maxGuests}`); return; }
                        setChildWithBed(prev => prev + 1);
                      }} className="w-5.5 h-5.5 rounded-full border border-slate-300 bg-white flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 text-xs">+</button>
                    </div>
                  </div>

                  {/* Child without Bed */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Child w/o Bed</p>
                      <p className="text-[9px] text-slate-400">Age 2–5 yrs (sharing bed)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setChildWithoutBed(prev => Math.max(0, prev - 1))} className="w-5.5 h-5.5 rounded-full border border-slate-300 bg-white flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 text-xs">−</button>
                      <span className="text-xs font-bold text-slate-900 w-4 text-center font-mono">{childWithoutBed}</span>
                      <button type="button" onClick={() => {
                        if (adults < 1) { toast.warning("At least 1 adult required"); return; }
                        if (guestCount >= maxGuests) { toast.error(`Maximum allowed guests is ${maxGuests}`); return; }
                        setChildWithoutBed(prev => prev + 1);
                      }} className="w-5.5 h-5.5 rounded-full border border-slate-300 bg-white flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 text-xs">+</button>
                    </div>
                  </div>

                  {/* Infants counter */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Infants</p>
                      <p className="text-[9px] text-slate-400">Under 2 yrs</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setInfantsCount(prev => Math.max(0, prev - 1))} className="w-5.5 h-5.5 rounded-full border border-slate-300 bg-white flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 text-xs">−</button>
                      <span className="text-xs font-bold text-slate-900 w-4 text-center font-mono">{infantsCount}</span>
                      <button type="button" onClick={() => setInfantsCount(prev => prev + 1)} className="w-5.5 h-5.5 rounded-full border border-slate-300 bg-white flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 text-xs">+</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Compact E-Commerce Style Line-Item Breakout */}
              <div className="text-[9.5px] space-y-0.5 bg-slate-50/80 p-2 rounded-lg border border-slate-100 font-normal">
                {categoryBreakdown.map((item, bIdx) => (
                  <div key={bIdx} className="flex items-center justify-between text-slate-650">
                    <span>{item.count}× {item.label} <span className="text-[8.5px] text-slate-400 font-normal">(@ ₹{item.rate.toLocaleString('en-IN')})</span></span>
                    <span className="font-semibold text-slate-800">₹{item.total.toLocaleString('en-IN')}</span>
                  </div>
                ))}

                <div className="pt-1 border-t border-slate-200/80 space-y-0.5">
                  <div className="flex justify-between text-slate-500 font-normal">
                    <span>Subtotal</span>
                    <span className="font-medium text-slate-700">₹{totalPackageCost.toLocaleString('en-IN')}</span>
                  </div>

                  {totalSavings > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50/80 px-1 py-0.5 rounded -mx-0.5 text-[9px]">
                      <span>Total Savings ({discountLabel})</span>
                      <span>−₹{totalSavings.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-500 font-normal pb-0.5 border-b border-dashed border-slate-200">
                    <span>GST (5%)</span>
                    <span className="font-medium text-slate-700">₹{gstAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Final Payable Price Highlight Box (Narrow Top-Bottom) */}
              <div className="bg-slate-950 text-white rounded-lg px-2.5 py-1.5 flex items-center justify-between border border-slate-900">
                <div>
                  <p className="text-[7.5px] font-medium uppercase tracking-wider text-slate-400">Final Payable Amount</p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-sm font-bold text-white">₹{grandTotal.toLocaleString('en-IN')}</span>
                    {totalSavings > 0 && totalOriginalCost > 0 && (
                      <span className="text-[10px] text-slate-400 line-through font-normal">
                        ₹{(totalOriginalCost + Math.round(totalOriginalCost * 0.05)).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
                {totalSavings > 0 && (
                  <span className="text-[8px] font-bold bg-emerald-400 text-slate-950 px-1.5 py-0.5 rounded font-mono uppercase">
                    Save ₹{totalSavings.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              {/* Action Buttons: Book Now & Customize Trip (Side-by-Side) */}
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setBookingStep("details");
                    setShowBookingModal(true);
                  }}
                  className="w-full bg-[#1B3A6B] hover:bg-[#275091] text-white py-1.5 rounded-md font-semibold text-[10px] uppercase tracking-wider shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1 text-center cursor-pointer"
                >
                  <span>Book Now</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustName("");
                    setCustPhone("");
                    setCustEmail("");
                    setCustDate(travelDate || "");
                    setCustHotelPref("4 Star Deluxe");
                    setCustNotes("");
                    setCustBudget("");
                    setCustomizeSubmitted(false);
                    setShowCustomizeModal(true);
                  }}
                  className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 py-1.5 rounded-md font-semibold text-[10px] flex items-center justify-center gap-1 transition text-center"
                >
                  <span>Customize Trip</span>
                </button>
              </div>
            </div>

            {/* ── Why book with us ── */}
            <div className="rounded-md border border-slate-200 bg-white p-3.5 shadow-sm">
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
            <div className="rounded-md border border-slate-200 bg-white p-3.5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Support</p>
              <p className="text-[7.5px] text-slate-600 mb-2">We are here to help you book confidently with expert travel guidance.</p>
              <a
                href="tel:+919000000000"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#1B3A6B] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#152e55] transition-all hover:shadow-md"
              >
                <Phone className="w-3.5 h-3.5" />
                Call +91 900 000 0000
              </a>
            </div>
          </aside>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
           ALL INCLUSIVE & LONG DESCRIPTION SECTION
      ════════════════════════════════════════════ */}
      <section className="bg-white border-t border-slate-200 py-10 md:py-16 mt-6">
        <div className="container mx-auto px-4 lg:px-8">

          {/* Top Header */}
          <div className="text-center mb-10">
            <p className="text-accent font-bold text-xs md:text-sm mb-2 uppercase tracking-widest">Why Choose Sampooran Holidays</p>
            <h2 className="text-xl md:text-3xl font-serif font-bold text-[#1B3A6B] mb-4 relative inline-block">
              Your Complete Travel Partner - All Inclusive Tours!
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-accent/20 rounded-full" />
              <div className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-accent rounded-full" />
            </h2>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-10 max-w-6xl mx-auto">
            {featuresList.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center text-center p-3 md:p-5 rounded-2xl border border-slate-100 hover:border-accent/20 hover:bg-slate-50/50 transition-all duration-500 group"
              >
                <div className="w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-[#1B3A6B] to-[#0a182e] rounded-lg md:rounded-xl flex items-center justify-center mb-2 md:mb-3 relative overflow-hidden transition-transform group-hover:scale-110 duration-500 shadow-md shadow-primary/20 shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <item.Icon className="w-4 h-4 md:w-6 md:h-6 text-accent transition-all duration-500 group-hover:scale-110" />
                </div>
                <h3 className="text-xs md:text-sm font-bold text-[#1B3A6B] tracking-tight leading-tight mb-1">
                  {item.title}
                </h3>
                <p className="text-slate-500 leading-relaxed text-[10px] md:text-xs font-medium line-clamp-3">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* SEO / Long Description Section */}
          <div className="max-w-6xl mx-auto border-t border-slate-100 pt-10">
            <h3 className="text-lg sm:text-xl font-bold text-[#1B3A6B] mb-4 font-serif">
              {longDescTitle}
            </h3>

            <div
              className={cn(
                "space-y-4 text-slate-600 leading-relaxed text-xs md:text-sm font-medium transition-all duration-500 overflow-hidden relative",
                !isLongDescExpanded && "max-h-[140px]"
              )}
            >
              {longDescParagraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}

              {!isLongDescExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
              )}
            </div>

            <button
              onClick={() => setIsLongDescExpanded(!isLongDescExpanded)}
              className="mt-6 flex items-center gap-2 text-[#1B3A6B] font-bold uppercase text-xs tracking-widest hover:text-accent transition-colors"
            >
              {isLongDescExpanded ? "Read Less" : "Read More"}
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isLongDescExpanded && "rotate-180")} />
            </button>
          </div>

        </div>
      </section>

      {/* Mobile Booking Drawer (Bottom Sheet) */}
      {showBookingDrawer && (
        <div className="fixed inset-0 z-[110] bg-black/60 lg:hidden flex flex-col justify-end" onClick={() => setShowBookingDrawer(false)}>
          <div
            className="bg-white rounded-t-2xl p-4 flex flex-col max-h-[80vh] overflow-y-auto shadow-[0_-10px_30px_rgba(0,0,0,0.3)] text-slate-800"
            onClick={(e) => e.stopPropagation()}
            style={{ marginBottom: "64px" }}
          >
            {/* Header / Close button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fare Summary</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">Booking Details</p>
              </div>
              <button
                onClick={() => setShowBookingDrawer(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Price rows — ultra compact */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Package Cost</span>
                <span className="font-semibold text-slate-800">₹{totalPackageCost.toLocaleString('en-IN')}</span>
              </div>

              {totalSavings > 0 && (
                <div className="flex items-center justify-between py-1.5 rounded bg-emerald-50 px-2">
                  <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-white text-[8px] font-black">✓</span>
                    {discountLabel}
                  </span>
                  <span className="font-bold text-emerald-700">−₹{totalSavings.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">After Discount</span>
                <span className="font-semibold text-slate-800">₹{priceAfterDiscount.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">GST (5%)</span>
                <span className="font-semibold text-slate-800">₹{gstAmount.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex items-center justify-between py-2 bg-slate-50 px-3 rounded-md my-2">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Grand Total</p>
                  <p className="text-xl font-black text-slate-900 leading-tight">₹{grandTotal.toLocaleString('en-IN')}</p>
                </div>
                {totalSavings > 0 && (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                    Saved ₹{totalSavings.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              {/* Configure Guests counter in mobile bottom sheet */}
              <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm space-y-2.5 mt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#1B3A6B]">Configure Guests</span>
                  <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-500">
                    Min: {minGuests} • Max: {maxGuests}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {/* Adults counter */}
                  <div className="flex flex-col items-center justify-center p-1.5 border border-slate-100 rounded-lg">
                    <span className="text-[9px] font-bold text-slate-500">Adults</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <button
                        type="button"
                        onClick={() => setAdults(prev => Math.max(1, prev - 1))}
                        className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50 text-[10px]"
                      >
                        −
                      </button>
                      <span className="text-xs font-bold font-mono">{adults}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (adults + childrenCount >= maxGuests) {
                            toast.error(`Max ${maxGuests} guests`);
                            return;
                          }
                          setAdults(prev => prev + 1);
                        }}
                        className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50 text-[10px]"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Children counter */}
                  <div className="flex flex-col items-center justify-center p-1.5 border border-slate-100 rounded-lg">
                    <span className="text-[9px] font-bold text-slate-500">Children</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <button
                        type="button"
                        onClick={() => setChildrenCount(prev => Math.max(0, prev - 1))}
                        className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50 text-[10px]"
                      >
                        −
                      </button>
                      <span className="text-xs font-bold font-mono">{childrenCount}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (adults < 2) {
                            toast.warning("Needs 2 adults");
                            return;
                          }
                          if (adults + childrenCount >= maxGuests) {
                            toast.error(`Max ${maxGuests} guests`);
                            return;
                          }
                          setChildrenCount(prev => prev + 1);
                        }}
                        className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50 text-[10px]"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Infants counter */}
                  <div className="flex flex-col items-center justify-center p-1.5 border border-slate-100 rounded-lg">
                    <span className="text-[9px] font-bold text-slate-500">Infants</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <button
                        type="button"
                        onClick={() => setInfantsCount(prev => Math.max(0, prev - 1))}
                        className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50 text-[10px]"
                      >
                        −
                      </button>
                      <span className="text-xs font-bold font-mono">{infantsCount}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (adults < 2) {
                            toast.warning("Needs 2 adults");
                            return;
                          }
                          setInfantsCount(prev => prev + 1);
                        }}
                        className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50 text-[10px]"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {adults < 2 && (childrenCount > 0 || infantsCount > 0) && (
                  <p className="text-[9px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded px-2 py-1">
                    ⚠️ Minimum 2 adults mandatory to include children or infants.
                  </p>
                )}
                {adults + childrenCount < minGuests && (
                  <p className="text-[9px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 rounded px-2 py-1">
                    ⚠️ Minimum {minGuests} guests are required.
                  </p>
                )}
              </div>

              {/* Mobile Calendar Date-Picker Widget */}
              <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm space-y-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Travel Date</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                      className="p-1 border border-slate-200 rounded text-[10px] font-bold"
                    >
                      &larr;
                    </button>
                    <span className="text-[10px] font-bold text-slate-700 min-w-[60px] text-center font-mono">
                      {currentMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                      className="p-1 border border-slate-200 rounded text-[10px] font-bold"
                    >
                      &rarr;
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-0.5">
                  {monthDays.map((dayDate, idx) => {
                    const isCurrentMonth = dayDate.getMonth() === currentMonth.getMonth();
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isPast = dayDate < today;

                    const yyyy = dayDate.getFullYear();
                    const mm = String(dayDate.getMonth() + 1).padStart(2, "0");
                    const dd = String(dayDate.getDate()).padStart(2, "0");
                    const dateStr = `${yyyy}-${mm}-${dd}`;

                    const rule = calendarRates.find(r => r.date === dateStr || (typeof r.date === "string" && r.date.split("T")[0] === dateStr));
                    const isSelected = travelDate === dateStr;

                    let finalPrice = basePricePerPerson;
                    let originalPriceBeforeDiscount = originalPrice;
                    let isBlackout = false;
                    let isPriceOnReq = false;
                    let rateType = "regular";
                    let discountPercentVal = 0;

                    if (rule) {
                      rateType = rule.rateType || "regular";
                      if (rule.rateType === "blackout") isBlackout = true;
                      else if (rule.rateType === "price-on-request") isPriceOnReq = true;
                      else {
                        const mod = Number(rule.priceModifierValue) || 0;
                        if (rule.priceModifierType === "fixed") finalPrice = mod;
                        else if (rule.priceModifierType === "percentage") finalPrice = basePricePerPerson * (1 + mod / 100);
                        else if (rule.priceModifierType === "value") finalPrice = basePricePerPerson + mod;

                        originalPriceBeforeDiscount = finalPrice;

                        const disc = Number(rule.discountValue) || 0;
                        if (rule.discountType === "percentage") {
                          finalPrice = finalPrice * (1 - disc / 100);
                          discountPercentVal = disc;
                        } else if (rule.discountType === "flat") {
                          finalPrice = Math.max(0, finalPrice - disc);
                          discountPercentVal = Math.round((disc / originalPriceBeforeDiscount) * 100);
                        }
                      }
                    } else {
                      const disc = packageData.discountPercent || 0;
                      if (disc > 0) {
                        finalPrice = basePricePerPerson;
                        originalPriceBeforeDiscount = originalPrice;
                        discountPercentVal = disc;
                      }
                    }

                    const isDisabled = isPast || !isCurrentMonth || isBlackout;
                    const isPeak = rateType === "peak";
                    const isOff = rateType === "off-season";

                    let cellBgClass = "bg-white text-slate-800 border-slate-100 hover:bg-slate-50";
                    if (isSelected) {
                      cellBgClass = "bg-[#1B3A6B] text-white border-[#1B3A6B] shadow-md shadow-[#1B3A6B]/20 scale-[1.03]";
                    } else if (isBlackout) {
                      cellBgClass = "bg-slate-100 text-slate-450 line-through border-slate-200 pointer-events-none";
                    } else if (isPriceOnReq) {
                      cellBgClass = "bg-amber-50/70 text-amber-800 border-amber-250/70 hover:bg-amber-100";
                    } else if (isPeak) {
                      cellBgClass = "bg-rose-50/60 text-rose-850 border-rose-150/70 hover:bg-rose-100/70";
                    } else if (isOff) {
                      cellBgClass = "bg-sky-50/60 text-sky-850 border-sky-150/70 hover:bg-sky-100/70";
                    } else if (rule && rateType === "regular") {
                      cellBgClass = "bg-emerald-50/40 text-emerald-800 border-emerald-150/70 hover:bg-emerald-100/60";
                    }

                    return (
                      <button
                        type="button"
                        key={idx}
                        disabled={isDisabled}
                        onClick={() => {
                          setTravelDate(dateStr);
                        }}
                        className={`h-9 rounded flex flex-col justify-center items-center p-0.5 transition-all border ${cellBgClass}`}
                      >
                        <span className="text-[9px] font-bold">{dayDate.getDate()}</span>
                        {isCurrentMonth && !isPast && !isBlackout && !isPriceOnReq && (
                          <div className="flex flex-col items-center justify-center leading-none mt-0.5 scale-90">
                            {discountPercentVal > 0 && (
                              <span className={`text-[5.5px] line-through ${isSelected ? "text-white/60" : "text-[#1B3A6B] font-bold"} leading-none mb-0.5`}>
                                ₹{Math.round(originalPriceBeforeDiscount)}
                              </span>
                            )}
                            <span className={`text-[7.5px] font-bold tracking-tighter leading-none ${isSelected ? "text-white" : discountPercentVal > 0 ? "text-emerald-700" : "text-slate-650"}`}>
                              ₹{Math.round(finalPrice)}
                            </span>
                          </div>
                        )}
                        {isBlackout && <span className="text-[6px] text-slate-450">Sold</span>}
                        {isPriceOnReq && <span className="text-[6px] text-amber-700">Req</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CTA Actions */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowBookingDrawer(false);
                  setBookingStep("details");
                  setShowBookingModal(true);
                }}
                className="block w-full rounded-md bg-[#1B3A6B] py-2.5 text-center text-xs font-bold text-white hover:bg-[#152e55] cursor-pointer"
              >
                {travelDate ? "Book Direct ⚡" : "Book Now"}
              </button>
              <button
                onClick={() => {
                  setShowBookingDrawer(false);
                  setCustName("");
                  setCustPhone("");
                  setCustEmail("");
                  setCustDate(travelDate || "");
                  setCustHotelPref("4 Star Deluxe");
                  setCustNotes("");
                  setCustBudget("");
                  setCustomizeSubmitted(false);
                  setShowCustomizeModal(true);
                }}
                className="block w-full rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 py-2.5 text-center text-xs font-bold text-emerald-800"
              >
                Customize Trip
              </button>
            </div>

            <a
              href={`https://wa.me/919000000000?text=I'm interested in ${encodeURIComponent(packageData.name || 'this package')}`}
              target="_blank"
              rel="noreferrer"
              className="block w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 text-center text-xs font-semibold text-slate-800 hover:bg-slate-100 mt-2"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Mobile Sticky Price Strip (positioned directly above BottomNav) */}
      <div
        className="fixed z-[90] left-0 right-0 bg-slate-900 border-t border-white/10 p-2 lg:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.2)] cursor-pointer"
        style={{ bottom: "64px" }}
        onClick={() => setShowBookingDrawer(true)}
      >
        <div className="container mx-auto flex items-center justify-between gap-3">
          {/* Price Info */}
          <div className="flex flex-col shrink-0">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Starting From</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base font-black text-white leading-tight">{priceLabel}</span>
              {savings > 0 && (
                <>
                  <span className="text-[9px] font-bold text-emerald-400 leading-none">{discountLabel}</span>
                  <span className="text-[10px] text-slate-400 line-through leading-none">₹{originalPrice.toLocaleString("en-IN")}</span>
                </>
              )}
            </div>
          </div>
          {/* Action indicator trigger */}
          <button
            type="button"
            onClick={() => setShowBookingModal(true)}
            className="flex items-center gap-1.5 bg-accent hover:bg-amber-500 text-slate-950 px-3.5 py-1.5 rounded-lg font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
          >
            <span>Book / Customize</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Smart OTA Booking & Price Breakout Modal (Mobile & Desktop) ── */}
      {showBookingModal && (
        <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#1B3A6B] text-white p-4 sm:p-5 flex items-start justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded uppercase tracking-wider">
                    OTA Booking Engine
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    Min {minGuests} – Max {maxGuests} Guests
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold mt-1 text-white leading-snug line-clamp-1">
                  {packageData.name}
                </h3>
                {travelDate ? (
                  <p className="text-xs text-amber-200 font-semibold mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 inline" /> Selected Departure: {travelDate}
                  </p>
                ) : (
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    Select guests below to calculate your exact trip total
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-800 flex-1">
              {/* Category Counter Adjusters */}
              <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1B3A6B]">Guest Selection</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {guestCount} / {maxGuests} Guests Max
                  </span>
                </div>

                {/* Primary Adults */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Adults (Primary)</p>
                    <p className="text-[10px] text-slate-400">Base room capacity (Age 12+)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setAdults(prev => Math.max(1, prev - 1))} className="w-7 h-7 rounded-full border border-slate-300 bg-white flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 text-xs">−</button>
                    <span className="text-sm font-bold text-slate-900 w-5 text-center font-mono">{adults}</span>
                    <button type="button" onClick={() => {
                      if (guestCount >= maxGuests) { toast.error(`Maximum allowed guests is ${maxGuests}`); return; }
                      setAdults(prev => prev + 1);
                    }} className="w-7 h-7 rounded-full border border-slate-300 bg-white flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 text-xs">+</button>
                  </div>
                </div>

                {/* Extra Adult */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Extra Adult</p>
                    <p className="text-[10px] text-slate-400">Add-on guest in room</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setExtraAdults(prev => Math.max(0, prev - 1))} className="w-7 h-7 rounded-full border border-slate-300 bg-white flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 text-xs">−</button>
                    <span className="text-sm font-bold text-slate-900 w-5 text-center font-mono">{extraAdults}</span>
                    <button type="button" onClick={() => {
                      if (guestCount >= maxGuests) { toast.error(`Maximum allowed guests is ${maxGuests}`); return; }
                      setExtraAdults(prev => prev + 1);
                    }} className="w-7 h-7 rounded-full border border-slate-300 bg-white flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 text-xs">+</button>
                  </div>
                </div>

                {/* Child with Bed */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Child with Bed</p>
                    <p className="text-[10px] text-slate-400">Age 5–12 yrs (extra bed)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setChildWithBed(prev => Math.max(0, prev - 1))} className="w-7 h-7 rounded-full border border-slate-300 bg-white flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 text-xs">−</button>
                    <span className="text-sm font-bold text-slate-900 w-5 text-center font-mono">{childWithBed}</span>
                    <button type="button" onClick={() => {
                      if (adults < 1) { toast.warning("At least 1 adult required"); return; }
                      if (guestCount >= maxGuests) { toast.error(`Maximum allowed guests is ${maxGuests}`); return; }
                      setChildWithBed(prev => prev + 1);
                    }} className="w-7 h-7 rounded-full border border-slate-300 bg-white flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 text-xs">+</button>
                  </div>
                </div>

                {/* Child without Bed */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Child w/o Bed</p>
                    <p className="text-[10px] text-slate-400">Age 2–5 yrs (sharing bed)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setChildWithoutBed(prev => Math.max(0, prev - 1))} className="w-7 h-7 rounded-full border border-slate-300 bg-white flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 text-xs">−</button>
                    <span className="text-sm font-bold text-slate-900 w-5 text-center font-mono">{childWithoutBed}</span>
                    <button type="button" onClick={() => {
                      if (adults < 1) { toast.warning("At least 1 adult required"); return; }
                      if (guestCount >= maxGuests) { toast.error(`Maximum allowed guests is ${maxGuests}`); return; }
                      setChildWithoutBed(prev => prev + 1);
                    }} className="w-7 h-7 rounded-full border border-slate-300 bg-white flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 text-xs">+</button>
                  </div>
                </div>

                {/* Infants counter */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Infants</p>
                    <p className="text-[10px] text-slate-400">Under 2 yrs</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setInfantsCount(prev => Math.max(0, prev - 1))} className="w-7 h-7 rounded-full border border-slate-300 bg-white flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 text-xs">−</button>
                    <span className="text-sm font-bold text-slate-900 w-5 text-center font-mono">{infantsCount}</span>
                    <button type="button" onClick={() => setInfantsCount(prev => prev + 1)} className="w-7 h-7 rounded-full border border-slate-300 bg-white flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 text-xs">+</button>
                  </div>
                </div>
              </div>

              {/* Price Line-Item Breakdown Table */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                <p className="font-bold text-slate-900 uppercase tracking-wider text-[10px] pb-1 border-b border-slate-200">
                  Rate Breakout ({travelDate || "Standard Rate"})
                </p>
                {categoryBreakdown.map((item, bIdx) => (
                  <div key={bIdx} className="flex justify-between text-slate-700">
                    <span>{item.count}× {item.label} (@ ₹{item.rate.toLocaleString('en-IN')})</span>
                    <span className="font-bold text-slate-900">₹{item.total.toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-800">₹{totalPackageCost.toLocaleString('en-IN')}</span>
                  </div>
                  {totalSavings > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                      <span>Savings ({discountLabel})</span>
                      <span>−₹{totalSavings.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>GST (5%)</span>
                    <span className="font-semibold text-slate-800">₹{gstAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="w-full sm:w-auto text-left">
                <p className="text-[10px] font-bold uppercase text-slate-400">Total Payable Amount</p>
                <p className="text-xl font-black text-[#1B3A6B]">₹{grandTotal.toLocaleString("en-IN")}</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingModal(false);
                    setCustName("");
                    setCustPhone("");
                    setCustEmail("");
                    setCustDate(travelDate || "");
                    setCustHotelPref("4 Star Deluxe");
                    setCustNotes("");
                    setCustBudget("");
                    setCustomizeSubmitted(false);
                    setShowCustomizeModal(true);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs transition"
                >
                  Customize Trip
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingModal(false);
                    handleBookNow();
                  }}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#1B3A6B] hover:bg-[#2a519b] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition active:scale-95"
                >
                  Proceed &amp; Reserve 🚀
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      <AttractionActivityModal
        type="hotel"
        data={selectedHotel}
        isOpen={!!selectedHotel}
        onClose={() => setSelectedHotel(null)}
      />

      <AttractionActivityModal
        type="transport"
        data={selectedTransport}
        isOpen={!!selectedTransport}
        onClose={() => setSelectedTransport(null)}
      />

      <AttractionActivityModal
        type="dining"
        data={selectedDining}
        isOpen={!!selectedDining}
        onClose={() => setSelectedDining(null)}
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
              aria-label="Close gallery"
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
              aria-label="Previous image"
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
                src={validateImageUrl(galleryImages[activeLightboxIndex], 1200, 800, "3:2")}
                alt={`${packageData.name} photo`}
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Right Button */}
            <button
              aria-label="Next image"
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
                aria-label={`View image ${idx + 1}`}
                onClick={() => setActiveLightboxIndex(idx)}
                className={cn(
                  "relative w-16 h-12 md:w-20 md:h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer",
                  activeLightboxIndex === idx ? "border-accent scale-105" : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <Image
                  src={validateImageUrl(img, 150, 150, "1:1")}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
           OTA DIRECT BOOKING ENGINE & RESERVATION CHECKOUT MODAL
      ══════════════════════════════════════════════════════════════ */}
      {showBookingModal && (
        <div className="fixed inset-0 z-[130] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 transition-all duration-300 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
            
            {/* Modal Header Bar with Step Indicators */}
            <div className="bg-[#1B3A6B] text-white p-4 sm:p-5 flex items-start justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded uppercase tracking-wider">
                    {bookingStep === "details" && "Step 1 of 3: Reserve Package"}
                    {bookingStep === "register" && "Step 2 of 3: Traveler Auth"}
                    {bookingStep === "payment" && "Step 3 of 3: Secure Checkout"}
                    {bookingStep === "confirmed" && "Booking Confirmed 🎉"}
                  </span>
                  <span className="text-xs text-slate-300 font-mono">
                    Code: {packageData.packageCode || "SH-RDS-GEN"}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                  {bookingStep === "details" && `Reserve "${packageData.name}"`}
                  {bookingStep === "register" && (regAuthMode === "register" ? "Traveler Registration & Profile" : "Sign In to Your Account")}
                  {bookingStep === "payment" && "Confirm Payment & Lock Package"}
                  {bookingStep === "confirmed" && "Booking Successfully Confirmed! 🚀"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Step Content Body */}
            <div className="p-4 sm:p-5 overflow-y-auto max-h-[75vh] space-y-4 text-xs">
              
              {/* STEP 1: Package Breakdown & Guest Segment Config */}
              {bookingStep === "details" && (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1 text-slate-700">
                    <p className="font-bold text-slate-900 text-xs">📅 Selected Travel Date: <span className="text-[#1B3A6B] font-mono font-black">{travelDate || "Not Selected (Select from Calendar)"}</span></p>
                    <p className="text-[11px]">👥 Configured Guests: <strong className="text-slate-900">{guestCountLabel}</strong></p>
                    {!travelDate && (
                      <p className="text-[10px] text-amber-700 font-semibold bg-amber-50 border border-amber-200 p-1.5 rounded mt-1">
                        ⚠️ Please close this modal and click your preferred travel date from the calendar to see exact live pricing.
                      </p>
                    )}
                  </div>

                  {/* Summary Pricing Line Items */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-1">Price Summary</h4>
                    {categoryBreakdown.map((item, bIdx) => (
                      <div key={bIdx} className="flex justify-between text-slate-650 text-xs">
                        <span>{item.count}× {item.label}</span>
                        <span className="font-bold text-slate-900">₹{item.total.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-slate-200 space-y-1">
                      <div className="flex justify-between text-slate-500">
                        <span>Subtotal</span>
                        <span className="font-semibold text-slate-800">₹{totalPackageCost.toLocaleString('en-IN')}</span>
                      </div>
                      {totalSavings > 0 && (
                        <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded text-xs">
                          <span>Total Discount Savings ({discountLabel})</span>
                          <span>−₹{totalSavings.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-500">
                        <span>Taxes &amp; GST (5%)</span>
                        <span className="font-semibold text-slate-800">₹{gstAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-[#1B3A6B] font-black text-sm pt-2 border-t border-slate-300">
                        <span>Total Payable Amount</span>
                        <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBookingModal(false)}
                      className="px-4 py-2 rounded-lg border border-slate-300 font-bold text-xs text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedFromDetails}
                      className="px-6 py-2.5 rounded-lg bg-[#1B3A6B] hover:bg-[#265191] text-white font-bold text-xs uppercase tracking-wider shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Proceed &amp; Reserve 🚀</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Traveler Registration / Sign In Form */}
              {bookingStep === "register" && (
                <form onSubmit={handleRegisterOrLogin} className="space-y-3.5">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 text-xs font-semibold">
                    🔑 {regAuthMode === "register" ? "Please create your traveler account to secure your booking & receive instant vouchers." : "Welcome back! Please sign in to complete your reservation."}
                  </div>

                  {/* Toggle between Register and Login */}
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setRegAuthMode("register")}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${regAuthMode === "register" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"}`}
                    >
                      Register New Account
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegAuthMode("login")}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${regAuthMode === "login" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"}`}
                    >
                      Already Have Account? Sign In
                    </button>
                  </div>

                  {regAuthMode === "register" && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className={`w-full px-3 py-2 rounded-lg border outline-none text-xs ${regErrors.name ? "border-rose-500 bg-rose-50/50" : "border-slate-300 focus:border-[#1B3A6B]"}`}
                      />
                      {regErrors.name && <p className="text-[10px] text-rose-600 font-bold mt-0.5">⚠️ {regErrors.name}</p>}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="e.g. rahul@example.com"
                        className={`w-full px-3 py-2 rounded-lg border outline-none text-xs ${regErrors.email ? "border-rose-500 bg-rose-50/50" : "border-slate-300 focus:border-[#1B3A6B]"}`}
                      />
                      {regErrors.email && <p className="text-[10px] text-rose-600 font-bold mt-0.5">⚠️ {regErrors.email}</p>}
                    </div>

                    {regAuthMode === "register" && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Phone Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="e.g. +91 9876543210"
                          className={`w-full px-3 py-2 rounded-lg border outline-none text-xs ${regErrors.phone ? "border-rose-500 bg-rose-50/50" : "border-slate-300 focus:border-[#1B3A6B]"}`}
                        />
                        {regErrors.phone && <p className="text-[10px] text-rose-600 font-bold mt-0.5">⚠️ {regErrors.phone}</p>}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className={`w-full px-3 py-2 rounded-lg border outline-none text-xs ${regErrors.password ? "border-rose-500 bg-rose-50/50" : "border-slate-300 focus:border-[#1B3A6B]"}`}
                    />
                    {regErrors.password && <p className="text-[10px] text-rose-600 font-bold mt-0.5">⚠️ {regErrors.password}</p>}
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setBookingStep("details")}
                      className="px-4 py-2 rounded-lg border border-slate-300 font-bold text-xs text-slate-600 hover:bg-slate-100"
                    >
                      &larr; Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingAuth}
                      className="px-6 py-2.5 rounded-lg bg-[#1B3A6B] hover:bg-[#265191] text-white font-bold text-xs uppercase tracking-wider shadow-md disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      {isSubmittingAuth ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <span>{regAuthMode === "register" ? "Register & Continue to Payment 🔒" : "Sign In & Continue 🔒"}</span>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: Payment Checkout Options */}
              {bookingStep === "payment" && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs space-y-1 text-emerald-900">
                    <p className="font-bold">✓ Logged in as: <span className="text-slate-900 font-black">{user?.name || regName}</span> ({user?.email || regEmail})</p>
                    <p className="text-[11px]">Package: <strong>{packageData.name}</strong> • Travel Date: <strong>{travelDate}</strong></p>
                  </div>

                  {/* Payment Option Selector */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Select Payment Plan</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setPayOption("advance")}
                        className={`p-3 rounded-xl border-2 text-left transition ${payOption === "advance" ? "border-[#1B3A6B] bg-blue-50/60 shadow-xs" : "border-slate-200 bg-white"}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">Token Advance (25%)</span>
                          <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-1.5 py-0.5 rounded">POPULAR</span>
                        </div>
                        <p className="text-sm font-black text-[#1B3A6B] mt-1">₹{Math.round(grandTotal * 0.25).toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Pay 25% now to lock price &amp; dates. Remaining on arrival.</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPayOption("full")}
                        className={`p-3 rounded-xl border-2 text-left transition ${payOption === "full" ? "border-[#1B3A6B] bg-blue-50/60 shadow-xs" : "border-slate-200 bg-white"}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">Full Amount (100%)</span>
                        </div>
                        <p className="text-sm font-black text-slate-900 mt-1">₹{grandTotal.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Complete full payment for instant 100% voucher release.</p>
                      </button>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Payment Gateway Option</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPayMethod("upi")}
                        className={`p-2 rounded-lg border text-center font-bold text-xs transition ${payMethod === "upi" ? "border-[#1B3A6B] bg-[#1B3A6B] text-white" : "border-slate-200 text-slate-700 bg-white"}`}
                      >
                        📱 UPI / QR
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayMethod("card")}
                        className={`p-2 rounded-lg border text-center font-bold text-xs transition ${payMethod === "card" ? "border-[#1B3A6B] bg-[#1B3A6B] text-white" : "border-slate-200 text-slate-700 bg-white"}`}
                      >
                        💳 Card
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayMethod("netbanking")}
                        className={`p-2 rounded-lg border text-center font-bold text-xs transition ${payMethod === "netbanking" ? "border-[#1B3A6B] bg-[#1B3A6B] text-white" : "border-slate-200 text-slate-700 bg-white"}`}
                      >
                        🏦 Banking
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setBookingStep("details")}
                      className="px-4 py-2 rounded-lg border border-slate-300 font-bold text-xs text-slate-600 hover:bg-slate-100"
                    >
                      &larr; Back
                    </button>
                    <button
                      type="button"
                      disabled={isProcessingPay}
                      onClick={handleConfirmPayment}
                      className="px-6 py-2.5 rounded-lg bg-[#1B3A6B] hover:bg-[#265191] text-white font-bold text-xs uppercase tracking-wider shadow-md disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      {isProcessingPay ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Processing Gateway...</span>
                        </>
                      ) : (
                        <span>Pay ₹{(payOption === "advance" ? Math.round(grandTotal * 0.25) : grandTotal).toLocaleString('en-IN')} &amp; Confirm Booking 🔒</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Booking Confirmation & 2-Hour Voucher Assurance Screen */}
              {bookingStep === "confirmed" && (
                <div className="p-4 sm:p-6 text-center space-y-4 bg-gradient-to-b from-white via-emerald-50/40 to-white rounded-xl">
                  <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping"></div>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/30 font-bold z-10 animate-bounce">
                      ✓
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                      Booking Confirmed &amp; Guaranteed! 🚀
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1.5 leading-relaxed">
                      Namaste &amp; Thank You, <strong className="text-slate-900">{user?.name || regName || "Valued Traveler"}</strong>! 🙏 Your tour booking for <strong className="text-slate-900">"{packageData.name}"</strong> has been successfully placed &amp; locked.
                    </p>
                  </div>

                  {/* PROMINENT VOUCHER GUARANTEE ASSURANCE BANNER */}
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-xl text-left shadow-lg space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📄</span>
                      <h4 className="font-bold text-sm text-amber-200 uppercase tracking-wider">Official Voucher Guarantee</h4>
                    </div>
                    <p className="text-xs text-white leading-relaxed pt-0.5">
                      Your official travel voucher, hotel confirmation slip, and day-by-day itinerary will be sent to your registered email (<strong className="underline text-amber-100">{user?.email || regEmail}</strong>) and WhatsApp (<strong className="underline text-amber-100">{user?.phone || user?.phoneNumber || regPhone}</strong>) within the <strong className="bg-white/20 px-1.5 py-0.5 rounded text-white font-bold font-mono">Next 2 Hours</strong> with proper confirmation!
                    </p>
                  </div>

                  {/* Booking Details Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-1.5 text-left shadow-xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <span className="font-bold text-[#1B3A6B]">Booking Ref: SH-BK-{confirmedBookingData?.id || Date.now().toString().slice(-6)}</span>
                      <span className="text-[10px] font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold">CONFIRMED</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <p><strong className="text-slate-500">Departure:</strong> {travelDate}</p>
                      <p><strong className="text-slate-500">Travelers:</strong> {guestCountLabel}</p>
                      <p><strong className="text-slate-500">Total Amount:</strong> ₹{grandTotal.toLocaleString('en-IN')}</p>
                      <p><strong className="text-slate-500">Paid Now:</strong> ₹{(payOption === "advance" ? Math.round(grandTotal * 0.25) : grandTotal).toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                    <a
                      href={`https://wa.me/919000000000?text=Hello%20Sampooran%20Holidays!%20I%20just%20booked%20${encodeURIComponent(packageData.name || "Package")}%20(Ref:%20SH-BK-${confirmedBookingData?.id || 'NEW'}).%20Please%20share%20my%20voucher.`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <span>💬 Chat for Instant Voucher on WhatsApp</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setShowBookingModal(false)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
                    >
                      Close &amp; Back to Package
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ── Customize Trip Modal & Animated Thank You Redirect ── */}
      {showCustomizeModal && (
        <div className="fixed inset-0 z-[130] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
            {customizeSubmitted ? (
              /* Beautiful Animated Thank You Card Overlay with Live Chat Guide & 5s Countdown */
              <div className="p-6 sm:p-8 text-center space-y-4 bg-gradient-to-b from-white via-emerald-50/30 to-white">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping"></div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/30 font-bold z-10 animate-bounce">
                    ✓
                  </div>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    Namaste &amp; Thank You, {custName || "Valued Guest"}! 🙏
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1.5 leading-relaxed">
                    We are deeply honored &amp; excited to plan your dream vacation for <strong className="text-slate-900">"{packageData.name}"</strong>. Our senior travel specialists are reviewing your requirements to build your personalized package!
                  </p>
                </div>

                {/* Requirements Summary Badge */}
                <div className="bg-white border border-emerald-200/80 rounded-xl p-3 shadow-xs text-xs text-slate-700 space-y-1 text-left">
                  <div className="flex items-center justify-between pb-1 border-b border-emerald-100">
                    <span className="font-bold text-emerald-800 flex items-center gap-1">
                      <span>✓ Inquiry Registered</span>
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
                      Code: {packageData.packageCode || "SH-RDS-GEN"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <p><strong className="text-slate-500">Departure:</strong> {travelDate || custDate || "Flexible"}</p>
                    <p><strong className="text-slate-500">Travelers:</strong> {guestCountLabel}</p>
                    <p><strong className="text-slate-500">Hotel Pref:</strong> {custHotelPref}</p>
                    <p><strong className="text-slate-500">Contact:</strong> {custPhone}</p>
                  </div>
                </div>

                {/* Live Chat Guide Widget Callout */}
                <div className="bg-gradient-to-r from-[#1B3A6B] to-[#265191] text-white rounded-xl p-3 text-left shadow-md flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl shrink-0">
                    💬
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-300">Need Instant Assistance?</p>
                    <p className="text-[11px] text-slate-100 leading-snug">
                      Our official Travel Experts are online! Look for the Live Chat Widget in the bottom-right corner to start a live conversation immediately.
                    </p>
                  </div>
                </div>

                {/* 5-Second Animated Progress Bar & Countdown */}
                <div className="pt-2 space-y-1.5">
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-1000 ease-linear"
                      style={{ width: `${(countdown / 5) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Returning to package page in{" "}
                    <span className="font-mono text-sm font-black text-[#1B3A6B] bg-slate-100 px-2 py-0.5 rounded">
                      {countdown}s
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              /* Customization Requirement Form */
              <>
                <div className="bg-[#1B3A6B] text-white p-4 sm:p-5 flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded uppercase tracking-wider">
                      Trip Customization
                    </span>
                    <h3 className="text-base sm:text-lg font-bold mt-1 text-white leading-snug">
                      Customize "{packageData.name}"
                    </h3>
                    <p className="text-xs text-slate-200 mt-0.5">
                      Code: {packageData.packageCode || "N/A"} • {guestCountLabel}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCustomizeModal(false)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm transition"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCustomizeSubmit} className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Your Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={custName}
                      onChange={(e) => {
                        setCustName(e.target.value);
                        if (custFormErrors.name) setCustFormErrors(prev => ({ ...prev, name: "" }));
                      }}
                      placeholder="e.g. Rahul Sharma"
                      className={`w-full px-3 py-2 rounded-lg border outline-none text-xs ${custFormErrors.name ? "border-rose-500 bg-rose-50/50" : "border-slate-300 focus:border-[#1B3A6B]"
                        }`}
                    />
                    {custFormErrors.name && (
                      <p className="text-[10px] text-rose-600 font-bold mt-0.5">⚠️ {custFormErrors.name}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={custPhone}
                        onChange={(e) => {
                          setCustPhone(e.target.value);
                          if (custFormErrors.phone) setCustFormErrors(prev => ({ ...prev, phone: "" }));
                        }}
                        placeholder="e.g. +91 9876543210"
                        className={`w-full px-3 py-2 rounded-lg border outline-none text-xs ${custFormErrors.phone ? "border-rose-500 bg-rose-50/50" : "border-slate-300 focus:border-[#1B3A6B]"
                          }`}
                      />
                      {custFormErrors.phone && (
                        <p className="text-[10px] text-rose-600 font-bold mt-0.5">⚠️ {custFormErrors.phone}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={custEmail}
                        onChange={(e) => {
                          setCustEmail(e.target.value);
                          if (custFormErrors.email) setCustFormErrors(prev => ({ ...prev, email: "" }));
                        }}
                        placeholder="e.g. rahul@example.com"
                        className={`w-full px-3 py-2 rounded-lg border outline-none text-xs ${custFormErrors.email ? "border-rose-500 bg-rose-50/50" : "border-slate-300 focus:border-[#1B3A6B]"
                          }`}
                      />
                      {custFormErrors.email && (
                        <p className="text-[10px] text-rose-600 font-bold mt-0.5">⚠️ {custFormErrors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Preferred Travel Date</label>
                      <input
                        type="date"
                        value={custDate || travelDate || ""}
                        onChange={(e) => setCustDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#1B3A6B] outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hotel Category Preference</label>
                      <select
                        value={custHotelPref}
                        onChange={(e) => setCustHotelPref(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#1B3A6B] outline-none text-xs bg-white"
                      >
                        <option value="3 Star Standard">3 Star Standard</option>
                        <option value="4 Star Deluxe">4 Star Deluxe</option>
                        <option value="5 Star Luxury">5 Star Luxury</option>
                        <option value="Heritage Resort">Heritage / Boutique Resort</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Customization Requirements &amp; Special Requests</label>
                    <textarea
                      rows={3}
                      value={custNotes}
                      onChange={(e) => setCustNotes(e.target.value)}
                      placeholder="Specify transport preference, meal plan, extra sightseeing, or custom itinerary requests..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#1B3A6B] outline-none text-xs"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCustomizeModal(false)}
                      className="px-4 py-2 rounded-lg border border-slate-300 font-bold text-xs text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingCust}
                      className="px-6 py-2 rounded-lg bg-[#1B3A6B] hover:bg-[#285294] text-white font-bold text-xs uppercase tracking-wider shadow-md disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isSubmittingCust ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <span>Submit Requirement 🚀</span>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
