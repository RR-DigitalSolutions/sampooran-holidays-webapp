import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import AdminLayout from "../components/AdminLayout";
import { customFetch } from "../utils/api";
import { toast } from "sonner";
import {
  Save, X, Plus, Trash2, MapPin, Calendar, Map,
  Tag, AlertCircle, Image as ImageIcon, DollarSign, Users, FileText,
  Plane, Hotel, Utensils, Camera, Car, Zap, ShieldCheck, Coffee,
  Loader2, Upload, Search, Sliders, Globe, Layers, ChevronRight,
  ChevronDown, ChevronUp, ArrowRight, Navigation, Building2,
  Bus, Train, Ship, Tent, UserCheck, Sparkles, Award
} from "lucide-react";
import {
  ItineraryDay, HotelInfo, FaqEntry, uploadMedia,
  MealType, MEAL_TYPES, MEAL_ICONS, DayType, DAY_TYPE_CONFIG
} from "../utils/packageFormTypes";

// ─── Constants ────────────────────────────────────────────────────────────────

const INCLUSION_OPTIONS = [
  { id: "flight",      label: "Flight",        icon: Plane },
  { id: "hotel",       label: "Hotel Stay",    icon: Hotel },
  { id: "meals",       label: "Daily Meals",   icon: Utensils },
  { id: "cab",         label: "Private Cab",   icon: Car },
  { id: "volvo",       label: "Volvo Bus",     icon: Bus },
  { id: "sightseeing", label: "Sightseeing",   icon: Camera },
  { id: "activities",  label: "Activities",    icon: Zap },
  { id: "tripexpert",  label: "Trip Expert",   icon: UserCheck },
  { id: "train",       label: "Train / Rail",  icon: Train },
  { id: "houseboat",   label: "Houseboat",     icon: Ship },
  { id: "camp",        label: "Camp / Tent",   icon: Tent },
  { id: "insurance",   label: "Insurance",     icon: ShieldCheck },
  { id: "guide",       label: "Tour Guide",    icon: Users },
  { id: "visa",        label: "Visa",          icon: FileText },
  { id: "drinks",      label: "Drinks",        icon: Coffee },
];

// 6 tabs — merged "Destinations & Pricing" + "Pricing Calendar" into "Pricing & Calendar"
const TABS = [
  "Overview",
  "Pricing & Calendar",
  "Itinerary",
  "Gallery",
  "Inclusions",
  "Policies, FAQs & SEO",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function PackageForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [activeTab, setActiveTab] = useState(TABS[0]);

  // ── Overview State ────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [packageCode, setPackageCode] = useState("");
  const [category, setCategory] = useState("Adventure");
  const [packageType, setPackageType] = useState("both");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [dynamicCategories, setDynamicCategories] = useState<string[]>(["Adventure", "Luxury", "Honeymoon", "Family"]);
  const [monthsToTravel, setMonthsToTravel] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<string[]>([]);

  // ── Multi-Geo State (NEW) ─────────────────────────────────────────────────
  // These are the package-level location arrays — used for SEO, filtering, mapping
  const [selectedCountryIds, setSelectedCountryIds] = useState<number[]>([]);   // multi-country
  const [selectedStateIds, setSelectedStateIds]     = useState<number[]>([]);   // multi-state
  const [selectedDestIds, setSelectedDestIds]       = useState<number[]>([]);   // multi-city
  // Legacy single-value (kept for backward compat with existing DB records)
  const [stateId, setStateId]   = useState<number | "">("");
  const [countryId, setCountryId] = useState<number | "">("");

  // ── Pricing State ─────────────────────────────────────────────────────────
  const [duration, setDuration] = useState(5);
  const [nights, setNights] = useState(4);
  const [basePrice, setBasePrice] = useState(0);
  const [discountType, setDiscountType] = useState<"percent" | "flat" | "none">("none");
  const [discountValue, setDiscountValue] = useState(0);
  const [pricePerPerson, setPricePerPerson] = useState(0);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [minGuests, setMinGuests] = useState(2);
  const [maxGuests, setMaxGuests] = useState(10);
  const [isGroupPricing, setIsGroupPricing] = useState(false);
  const [groupBaseCapacity, setGroupBaseCapacity] = useState(2);
  const [extraPersonPrice, setExtraPersonPrice] = useState(0);
  const [extraChildPrice, setExtraChildPrice] = useState(0);
  const [childWithBedPrice, setChildWithBedPrice] = useState(0);
  const [childWithoutBedPrice, setChildWithoutBedPrice] = useState(0);
  const [infantPrice, setInfantPrice] = useState(0);

  // ── Pricing Calendar State ─────────────────────────────────────────────────
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarRates, setCalendarRates] = useState<any[]>([]);
  const [selectedCalendarDates, setSelectedCalendarDates] = useState<string[]>([]);
  const [loadingCal, setLoadingCal] = useState(false);
  const [calRateType, setCalRateType] = useState<"peak" | "off-season" | "regular" | "blackout" | "price-on-request">("peak");
  const [calPriceModType, setCalPriceModType] = useState<"fixed" | "percentage" | "value">("fixed");
  const [calPriceModVal, setCalPriceModVal] = useState(0);
  const [calDiscountType, setCalDiscountType] = useState<"none" | "flat" | "percentage">("none");
  const [calDiscountVal, setCalDiscountVal] = useState(0);
  const [calExtraAdult, setCalExtraAdult] = useState<number | "">("");
  const [calChildWithBed, setCalChildWithBed] = useState<number | "">("");
  const [calChildWithoutBed, setCalChildWithoutBed] = useState<number | "">("");
  const [calInfant, setCalInfant] = useState<number | "">("");
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const [dragStart, setDragStart] = useState<string | null>(null);

  // ── Arrays State ──────────────────────────────────────────────────────────
  const [inclusionIcons, setInclusionIcons] = useState<string[]>([]);
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [importantNotes, setImportantNotes] = useState<string[]>([]);
  const DEFAULT_CANCELLATION = "Free cancellation up to 15 days before travel. 50% charge for 7–14 days before. No refund within 7 days.";
  const DEFAULT_PAYMENT = "50% advance to confirm booking. Remaining 50% before 7 days of travel.";
  const [cancellationPolicy, setCancellationPolicy] = useState(DEFAULT_CANCELLATION);
  const [paymentPolicy, setPaymentPolicy] = useState(DEFAULT_PAYMENT);
  const [faqs, setFaqs] = useState<FaqEntry[]>([]);
  const [hotels, setHotels] = useState<HotelInfo[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [collapsedDays, setCollapsedDays] = useState<Record<number, boolean>>({});

  const toggleDayCollapse = (idx: number) => {
    setCollapsedDays(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const collapseAllDays = () => {
    const map: Record<number, boolean> = {};
    itinerary.forEach((_, i) => (map[i] = true));
    setCollapsedDays(map);
  };

  const expandAllDays = () => {
    setCollapsedDays({});
  };
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");

  // ── CRM Data Sources ──────────────────────────────────────────────────────
  const [allDests, setAllDests] = useState<any[]>([]);
  const [allStates, setAllStates] = useState<any[]>([]);
  const [allCountries, setAllCountries] = useState<any[]>([]);
  const [allAttractions, setAllAttractions] = useState<any[]>([]);
  const [allCmsActivities, setAllCmsActivities] = useState<any[]>([]);
  const [allDining, setAllDining] = useState<any[]>([]);
  const [allGlobalHotels, setAllGlobalHotels] = useState<any[]>([]);
  const [allGlobalTransports, setAllGlobalTransports] = useState<any[]>([]);
  const [approvedActivities, setApprovedActivities] = useState<string[]>([]);
  const [hiddenActivities, setHiddenActivities] = useState<string[]>([]);
  const [activityInputs, setActivityInputs] = useState<Record<number, string>>({});
  const [destSearch, setDestSearch] = useState("");

  // ──────────────────────────────────────────────────────────────────────────
  // DERIVED: auto-extract all destination IDs used across all itinerary days
  // ──────────────────────────────────────────────────────────────────────────
  const itineraryDerivedDestIds = useMemo(() => {
    const ids = new Set<number>();
    itinerary.forEach(day => {
      // multi-city days
      (day.cityIds || []).forEach(cid => ids.add(cid));
      // transit from/to
      if (day.fromCityId) ids.add(day.fromCityId);
      if (day.toCityId) ids.add(day.toCityId);
      // legacy single location fallback — try to match by name
      if (day.location) {
        const matched = allDests.find(d => d.name.toLowerCase() === day.location.toLowerCase());
        if (matched) ids.add(matched.id);
      }
    });
    return Array.from(ids);
  }, [itinerary, allDests]);

  // Auto-derive state and country IDs from the destinations used in itinerary
  const itineraryDerivedStateIds = useMemo(() => {
    const ids = new Set<number>();
    itineraryDerivedDestIds.forEach(destId => {
      const dest = allDests.find(d => d.id === destId);
      if (dest?.stateId) ids.add(dest.stateId);
    });
    return Array.from(ids);
  }, [itineraryDerivedDestIds, allDests]);

  const itineraryDerivedCountryIds = useMemo(() => {
    const ids = new Set<number>();
    itineraryDerivedDestIds.forEach(destId => {
      const dest = allDests.find(d => d.id === destId);
      if (dest?.stateId) {
        const st = allStates.find(s => s.id === dest.stateId);
        if (st?.countryId) ids.add(st.countryId);
      }
    });
    return Array.from(ids);
  }, [itineraryDerivedDestIds, allDests, allStates]);

  // Combined effective IDs (itinerary-derived UNION manually selected)
  const effectiveDestIds   = useMemo(() => [...new Set([...selectedDestIds, ...itineraryDerivedDestIds])], [selectedDestIds, itineraryDerivedDestIds]);
  const effectiveStateIds  = useMemo(() => [...new Set([...selectedStateIds, ...itineraryDerivedStateIds])], [selectedStateIds, itineraryDerivedStateIds]);
  const effectiveCountryIds = useMemo(() => [...new Set([...selectedCountryIds, ...itineraryDerivedCountryIds])], [selectedCountryIds, itineraryDerivedCountryIds]);

  // ──────────────────────────────────────────────────────────────────────────
  // ALL ACTIVITIES merged (approved + CMS + from itinerary)
  // ──────────────────────────────────────────────────────────────────────────
  const selectedPackageActivities = useMemo(() => {
    return Array.from(new Set(
      itinerary.flatMap(day =>
        Array.isArray(day.activities)
          ? day.activities.map(item => String(item).trim()).filter(Boolean)
          : []
      )
    ));
  }, [itinerary]);

  const allActivities = useMemo(() => {
    const cmsActivityNames = allCmsActivities
      .filter(a => a.isActive !== false)
      .map(a => String(a.name || a.title || "").trim())
      .filter(Boolean);
    const combined = [...approvedActivities, ...cmsActivityNames, ...selectedPackageActivities];
    const unique = Array.from(new Set(combined.map(item => String(item).trim()).filter(Boolean)));
    return unique.filter(activity => !hiddenActivities.some(hidden => hidden.toLowerCase() === activity.toLowerCase()));
  }, [allCmsActivities, approvedActivities, hiddenActivities, selectedPackageActivities]);

  // ──────────────────────────────────────────────────────────────────────────
  // CALENDAR helpers
  // ──────────────────────────────────────────────────────────────────────────
  const fetchCalendarRates = useCallback(async () => {
    if (!isEdit) return;
    setLoadingCal(true);
    try {
      const startYear  = currentMonth.getFullYear();
      const startMonth = currentMonth.getMonth();
      const firstDay   = new Date(startYear, startMonth - 1, 1);
      const lastDay    = new Date(startYear, startMonth + 2, 0);
      const firstDayStr = firstDay.toISOString().split("T")[0];
      const lastDayStr  = lastDay.toISOString().split("T")[0];
      const res = await customFetch(`/api/admin/packages/${id}/calendar-inventory?startDate=${firstDayStr}&endDate=${lastDayStr}`);
      if (Array.isArray(res)) setCalendarRates(res);
    } catch {
      console.error("Failed to fetch calendar rates");
    } finally {
      setLoadingCal(false);
    }
  }, [isEdit, id, currentMonth]);

  useEffect(() => {
    if (activeTab === "Pricing & Calendar" && isEdit) fetchCalendarRates();
  }, [activeTab, currentMonth, isEdit, fetchCalendarRates]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    const days: Date[] = [];
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) days.push(new Date(year, month, -i));
    const totalDays = lastDay.getDate();
    for (let i = 1; i <= totalDays; i++) days.push(new Date(year, month, i));
    return days;
  };

  const monthDays = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);

  const handleDayMouseDown = (dateStr: string) => {
    setDragStart(dateStr);
    setSelectedCalendarDates([dateStr]);
    setStartDateInput(dateStr);
    setEndDateInput(dateStr);
  };
  const handleDayMouseEnter = (dateStr: string) => {
    if (!dragStart) return;
    const start = new Date(dragStart); const end = new Date(dateStr);
    const minDate = start < end ? start : end; const maxDate = start < end ? end : start;
    const range: string[] = [];
    const temp = new Date(minDate);
    while (temp <= maxDate) { range.push(temp.toISOString().split("T")[0]); temp.setDate(temp.getDate() + 1); }
    setSelectedCalendarDates(range);
    setStartDateInput(minDate.toISOString().split("T")[0]);
    setEndDateInput(maxDate.toISOString().split("T")[0]);
  };
  const handleDayMouseUp = () => setDragStart(null);

  useEffect(() => {
    const up = () => setDragStart(null);
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  const generateDateRange = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return [];
    const start = new Date(startStr); const end = new Date(endStr);
    const range: string[] = [];
    const temp = new Date(start < end ? start : end);
    const maxDate = start < end ? end : start;
    while (temp <= maxDate) { range.push(temp.toISOString().split("T")[0]); temp.setDate(temp.getDate() + 1); }
    return range;
  };

  const applyBulkSelection = (type: "weekends" | "weekdays" | "all" | "clear") => {
    if (selectedCalendarDates.length === 0) { toast.error("Select a date range first"); return; }
    const dateObjects = selectedCalendarDates.map(d => new Date(d));
    const minDate = new Date(Math.min(...dateObjects.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dateObjects.map(d => d.getTime())));
    const filtered: string[] = [];
    const temp = new Date(minDate);
    while (temp <= maxDate) {
      const day = temp.getDay(); const dateStr = temp.toISOString().split("T")[0];
      if (type === "all") filtered.push(dateStr);
      else if (type === "weekends" && (day === 0 || day === 6)) filtered.push(dateStr);
      else if (type === "weekdays" && day !== 0 && day !== 6) filtered.push(dateStr);
      temp.setDate(temp.getDate() + 1);
    }
    if (type === "clear") { setSelectedCalendarDates([]); setStartDateInput(""); setEndDateInput(""); }
    else setSelectedCalendarDates(filtered);
  };

  const handleCalendarRateSubmit = async () => {
    if (selectedCalendarDates.length === 0) { toast.error("No dates selected"); return; }
    try {
      const payload = {
        dates: selectedCalendarDates,
        rateType: calRateType,
        priceModifierType: calRateType === "blackout" || calRateType === "price-on-request" ? "fixed" : calPriceModType,
        priceModifierValue: calRateType === "blackout" || calRateType === "price-on-request" ? 0 : calPriceModVal,
        discountType: calRateType === "blackout" || calRateType === "price-on-request" ? "none" : calDiscountType,
        discountValue: calRateType === "blackout" || calRateType === "price-on-request" ? 0 : calDiscountVal,
        extraPersonPrice: calExtraAdult !== "" ? Number(calExtraAdult) : undefined,
        childWithBedPrice: calChildWithBed !== "" ? Number(calChildWithBed) : undefined,
        childWithoutBedPrice: calChildWithoutBed !== "" ? Number(calChildWithoutBed) : undefined,
        infantPrice: calInfant !== "" ? Number(calInfant) : undefined,
      };
      await customFetch(`/api/admin/packages/${id}/calendar-inventory`, { method: "POST", body: JSON.stringify(payload) });
      toast.success("Calendar rates updated successfully");
      setSelectedCalendarDates([]); setStartDateInput(""); setEndDateInput("");
      setCalExtraAdult(""); setCalChildWithBed(""); setCalChildWithoutBed(""); setCalInfant("");
      fetchCalendarRates();
    } catch (error: any) {
      toast.error("Failed to update rates: " + error.message);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // PRICE CALCULATOR
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (discountType === "none") {
      setOriginalPrice(basePrice); setPricePerPerson(basePrice); setDiscountPercent(0);
    } else if (discountType === "percent") {
      setOriginalPrice(basePrice);
      setPricePerPerson(Math.round(basePrice - (basePrice * (discountValue / 100))));
      setDiscountPercent(discountValue);
    } else if (discountType === "flat") {
      setOriginalPrice(basePrice);
      setPricePerPerson(Math.max(0, basePrice - discountValue));
      setDiscountPercent(basePrice > 0 ? Math.round((discountValue / basePrice) * 100) : 0);
    }
  }, [basePrice, discountType, discountValue]);

  // ──────────────────────────────────────────────────────────────────────────
  // DATA LOADING
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      customFetch("/api/admin/destinations"),
      customFetch("/api/admin/states"),
      customFetch("/api/admin/countries"),
      customFetch("/api/admin/attractions"),
      customFetch("/api/admin/activities"),
      customFetch("/api/admin/dining"),
      customFetch("/api/admin/hotels"),
      customFetch("/api/transport?limit=500"),
      customFetch("/api/admin/home/categories"),
    ]).then(([dests, states, countries, attrs, activities, dinings, globalHotels, transports, categoriesData]) => {
      setAllDests(Array.isArray(dests) ? dests : []);
      setAllStates(Array.isArray(states) ? states : []);
      setAllCountries(Array.isArray(countries) ? countries : []);
      setAllAttractions(Array.isArray(attrs) ? attrs : []);
      setAllCmsActivities(Array.isArray(activities) ? activities : []);
      setAllDining(Array.isArray(dinings) ? dinings : []);
      setAllGlobalHotels(Array.isArray(globalHotels) ? globalHotels : []);
      setAllGlobalTransports(Array.isArray(transports?.vehicles) ? transports.vehicles : []);
      if (Array.isArray(categoriesData)) {
        const catNames = categoriesData.filter((c: any) => c.isActive !== false).map((c: any) => c.label);
        const defaults = ["Adventure", "Luxury", "Honeymoon", "Family", "Religious", "Wildlife", "Leisure", "Weekend", "Corporate", "Group Tours"];
        setDynamicCategories(Array.from(new Set([...catNames, ...defaults])));
      }
    });

    customFetch("/api/admin/settings").then((settings) => {
      if (Array.isArray(settings)) {
        const approved: string[] = []; const hidden: string[] = [];
        settings.forEach((item: any) => {
          if (item.key === "APPROVED_ACTIVITIES") { try { const v = JSON.parse(item.value); if (Array.isArray(v)) approved.push(...v.map(String)); } catch {} }
          if (item.key === "HIDDEN_ACTIVITIES")   { try { const v = JSON.parse(item.value); if (Array.isArray(v)) hidden.push(...v.map(String)); } catch {} }
        });
        setApprovedActivities(Array.from(new Set(approved.map(i => i.trim()).filter(Boolean))));
        setHiddenActivities(Array.from(new Set(hidden.map(i => i.trim()).filter(Boolean))));
      }
    }).catch(() => {});
  }, []);

  // Load package data for edit mode
  useEffect(() => {
    if (isEdit) {
      customFetch(`/api/admin/packages/${id}`).then(pkg => {
        setName(pkg.name || ""); setSlug(pkg.slug || ""); setPackageCode(pkg.packageCode || "");
        setCategory(pkg.category || "Adventure"); setPackageType(pkg.packageType || "both");
        setIsFeatured(pkg.isFeatured || false); setIsTrending(pkg.isTrending || false);
        setImageUrl(pkg.imageUrl || ""); setThumbnailUrl(pkg.thumbnailUrl || "");
        setShortDescription(pkg.shortDescription || ""); setLongDescription(pkg.longDescription || "");
        // Multi-geo (new) — fallback to old single values if arrays empty
        setSelectedCountryIds(pkg.countryIds?.length > 0 ? pkg.countryIds : (pkg.countryId ? [pkg.countryId] : []));
        setSelectedStateIds(pkg.stateIds?.length > 0 ? pkg.stateIds : (pkg.stateId ? [pkg.stateId] : []));
        setSelectedDestIds(pkg.destinationIds || []);
        setStateId(pkg.stateId || ""); setCountryId(pkg.countryId || "");
        setDuration(pkg.duration || 5); setNights(pkg.nights || 4);
        setPricePerPerson(pkg.pricePerPerson || 0); setOriginalPrice(pkg.originalPrice || 0);
        setDiscountPercent(pkg.discountPercent || 0); setHighlights(pkg.highlights || []);
        setInclusionIcons(pkg.inclusionIcons || []); setInclusions(pkg.inclusions || []);
        setExclusions(pkg.exclusions || []); setImportantNotes(pkg.importantNotes || []);
        setCancellationPolicy(pkg.cancellationPolicy || DEFAULT_CANCELLATION);
        setPaymentPolicy(pkg.paymentPolicy || DEFAULT_PAYMENT);
        setMonthsToTravel(pkg.monthsToTravel || []);
        setMinGuests(pkg.minGuests ?? 2); setMaxGuests(pkg.maxGuests ?? 10);
        setIsGroupPricing(pkg.isGroupPricing ?? false); setGroupBaseCapacity(pkg.groupBaseCapacity ?? 2);
        setExtraPersonPrice(pkg.extraPersonPrice ?? 0); setExtraChildPrice(pkg.extraChildPrice ?? 0);
        setChildWithBedPrice(pkg.childWithBedPrice ?? 0); setChildWithoutBedPrice(pkg.childWithoutBedPrice ?? 0);
        setInfantPrice(pkg.infantPrice ?? 0);
        const bPrice = pkg.originalPrice || pkg.pricePerPerson || 0;
        setBasePrice(bPrice);
        if (bPrice > (pkg.pricePerPerson || 0)) { setDiscountType("flat"); setDiscountValue(bPrice - (pkg.pricePerPerson || 0)); }
        else { setDiscountType("none"); setDiscountValue(0); }
        setFaqs(pkg.faqs || []); setItinerary(pkg.itinerary || []);
        setGalleryImages(pkg.galleryImages || []);
        setMetaTitle(pkg.metaTitle || ""); setMetaDescription(pkg.metaDescription || ""); setMetaKeywords(pkg.metaKeywords || "");
      }).catch(() => toast.error("Failed to load package")).finally(() => setFetching(false));
    } else { setFetching(false); }
  }, [id, isEdit]);

  // ──────────────────────────────────────────────────────────────────────────
  // DERIVE CITIES[] for backend from itinerary in EXACT CHRONOLOGICAL ORDER
  // ──────────────────────────────────────────────────────────────────────────
  const derivedCitiesArray = useMemo(() => {
    const rawSequence: string[] = [];

    itinerary.forEach((d) => {
      const dayType = d.dayType || "SIGHTSEEING";
      const isTransit = dayType === "TRANSIT";

      const from = (d.fromCity || "").trim();
      const to = (d.toCity || "").trim();
      const dayCities: string[] = Array.isArray(d.cities)
        ? d.cities.map((c) => c.trim()).filter(Boolean)
        : [];
      const location = (d.location || "").trim();

      if (isTransit || dayType === "DEPARTURE") {
        if (from) rawSequence.push(from);
        dayCities.forEach((c) => {
          if (c !== from && c !== to) rawSequence.push(c);
        });
        if (to) rawSequence.push(to);
      } else {
        if (dayCities.length > 0) {
          dayCities.forEach((c) => rawSequence.push(c));
        } else if (location) {
          location.split(/→|->|•|,/).forEach((c) => {
            if (c.trim()) rawSequence.push(c.trim());
          });
        } else {
          if (from) rawSequence.push(from);
          if (to) rawSequence.push(to);
        }
      }
    });

    const cleaned = rawSequence.filter(Boolean);
    const result: string[] = [];
    const seenGlobal = new Set<string>();

    cleaned.forEach((city) => {
      const lastAdded = result[result.length - 1];
      if (city !== lastAdded && !seenGlobal.has(city)) {
        seenGlobal.add(city);
        result.push(city);
      }
    });

    return result;
  }, [itinerary]);

  // ──────────────────────────────────────────────────────────────────────────
  // SUBMIT
  // ──────────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      name, slug, packageCode, category, packageType, isFeatured, isTrending,
      imageUrl, thumbnailUrl, shortDescription, longDescription,
      // Multi-geo (new arrays)
      countryIds: effectiveCountryIds,
      stateIds: effectiveStateIds,
      destinationIds: effectiveDestIds,
      // Legacy single-value (keep primary for backward compat)
      destinationId: effectiveDestIds[0] || null,
      stateId: effectiveStateIds[0] || null,
      countryId: effectiveCountryIds[0] || null,
      // Derived cities array (auto-populated from itinerary)
      cities: derivedCitiesArray,
      duration, nights, pricePerPerson, originalPrice, discountPercent,
      inclusionIcons, inclusions, exclusions, importantNotes, highlights,
      cancellationPolicy, paymentPolicy, faqs, hotels: [], itinerary,
      galleryImages, metaTitle, metaDescription, metaKeywords, monthsToTravel,
      minGuests, maxGuests, isGroupPricing, groupBaseCapacity, extraPersonPrice, extraChildPrice,
      childWithBedPrice, childWithoutBedPrice, infantPrice,
    };
    try {
      if (isEdit) await customFetch(`/api/admin/packages/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await customFetch("/api/admin/packages", { method: "POST", body: JSON.stringify(payload) });
      toast.success(isEdit ? "Package updated!" : "Package created!");
      setLocation("/packages");
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const handleImgUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
    const f = e.target.files?.[0]; if (!f) return;
    try { setter(await uploadMedia(f, "packages")); toast.success("Uploaded"); }
    catch { toast.error("Upload failed"); }
  };

  if (fetching) return <AdminLayout title="Packages"><div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-[#1B3A6B]" /></div></AdminLayout>;

  // ──────────────────────────────────────────────────────────────────────────
  // ITINERARY HELPERS
  // ──────────────────────────────────────────────────────────────────────────
  const DAY_TYPES: DayType[] = ["ARRIVAL", "SIGHTSEEING", "TRANSIT", "LEISURE", "DEPARTURE"];
  const getEffectiveDayType = (d: ItineraryDay): DayType => d.dayType || "SIGHTSEEING";

  const resolveCityId = (name: string): number | undefined =>
    allDests.find(d => d.name.toLowerCase() === name.toLowerCase())?.id;

  const getActiveDayIds = (d: ItineraryDay): number[] => {
    const dayType = getEffectiveDayType(d);
    const idsSet = new Set<number>();

    // 1. Explicit cityIds[] (for multi-city or enroute cities)
    if (d.cityIds && d.cityIds.length > 0) {
      d.cityIds.forEach(id => idsSet.add(id));
    }

    // 2. TRANSIT & DEPARTURE: fromCity + via cities + toCity
    if (dayType === "TRANSIT" || dayType === "DEPARTURE") {
      if (d.fromCityId) idsSet.add(d.fromCityId);
      if (d.toCityId) idsSet.add(d.toCityId);
      if (d.fromCity) { const m = resolveCityId(d.fromCity); if (m) idsSet.add(m); }
      if (d.toCity)   { const m = resolveCityId(d.toCity);   if (m) idsSet.add(m); }
    }

    // 3. Legacy single location
    if (d.location) {
      const m = resolveCityId(d.location);
      if (m) idsSet.add(m);
    }

    if (idsSet.size > 0) return Array.from(idsSet);

    // 4. Fallback: all package destinations
    return effectiveDestIds;
  };

  const updateDay = (idx: number, patch: Partial<ItineraryDay>) => {
    const ni = [...itinerary];
    ni[idx] = { ...ni[idx], ...patch };
    setItinerary(ni);
  };

  const autoTitle = (d: ItineraryDay): string => {
    const type = getEffectiveDayType(d);
    const displayCities = d.cities?.length ? d.cities.join(" → ") : d.location;
    if (type === "TRANSIT") {
      const from = d.fromCity?.trim(); const to = d.toCity?.trim();
      if (from && to) return `${from} → ${to} — Transfer`;
      if (to) return `Transfer to ${to}`;
    }
    if (type === "ARRIVAL")   return displayCities ? `Arrival in ${displayCities}` : "Arrival Day";
    if (type === "DEPARTURE") return displayCities ? `Departure from ${displayCities}` : "Departure Day";
    if (type === "LEISURE")   return displayCities ? `Leisure Day in ${displayCities}` : "Free & Leisure Day";
    return displayCities ? `Explore ${displayCities}` : "Sightseeing Day";
  };

  const getCurrentMeals = (d: ItineraryDay): string[] =>
    Array.isArray(d.meals)
      ? d.meals as string[]
      : Object.entries(d.meals || {}).filter(([, e]) => (e as any)?.included !== false).map(([k]) => k.charAt(0).toUpperCase() + k.slice(1));

  const addDay = () => {
    setItinerary([...itinerary, {
      day: itinerary.length + 1, dayType: "SIGHTSEEING",
      title: "", description: "", location: "",
      cities: [], cityIds: [],
      fromCity: "", toCity: "", fromCityId: undefined, toCityId: undefined,
      accommodation: "", meals: {}, attractionIds: [], diningStops: [], activities: [],
    }]);
  };

  const removeDay = (idx: number) => {
    setItinerary(itinerary.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: i + 1 })));
  };

  // ──────────────────────────────────────────────────────────────────────────
  // ITINERARY SUB-RENDERERS
  // ──────────────────────────────────────────────────────────────────────────

  const renderMeals = (d: ItineraryDay, idx: number) => {
    const currentMeals = getCurrentMeals(d);
    return (
      <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Meals Provided</p>
        <div className="flex flex-wrap gap-2">
          {["Breakfast", "Lunch", "Dinner", "Snack"].map(meal => {
            const isSel = currentMeals.includes(meal);
            return (
              <button type="button" key={meal} onClick={() => updateDay(idx, { meals: isSel ? currentMeals.filter(m => m !== meal) : [...currentMeals, meal] })}
                className={`text-xs px-3 py-1.5 rounded-full font-bold border transition-all ${isSel ? "bg-[#1B3A6B] text-white border-[#1B3A6B] shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}>
                {meal === "Breakfast" ? "🌅" : meal === "Lunch" ? "☀️" : meal === "Dinner" ? "🌙" : "☕"} {meal}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAttractions = (d: ItineraryDay, idx: number, activeIds: number[], labelPrefix = "") => {
    const filtered = activeIds.length > 0 ? allAttractions.filter(a => activeIds.includes(a.destinationId)) : allAttractions;
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5 w-full">
            <span>{labelPrefix}Attractions & Sightseeing</span>
            {activeIds.length > 0 && <span className="text-[9px] text-blue-500 normal-case bg-blue-50 px-1.5 py-0.5 rounded font-semibold">Location filtered</span>}
            <a href="/attractions" target="_blank" rel="noopener noreferrer" className="ml-auto text-[9.5px] text-blue-600 font-bold hover:underline flex items-center gap-0.5">➕ Add Attraction ↗️</a>
          </p>
          <span className="text-[10px] text-gray-400">Click to toggle</span>
        </div>
        {(d.attractionIds || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 p-2 bg-blue-50/60 rounded-t-lg border border-b-0 border-blue-200/60 min-h-[32px]">
            {(d.attractionIds || []).map(attrId => {
              const attr = allAttractions.find(a => a.id === attrId);
              if (!attr) return null;
              return (
                <button type="button" key={attr.id}
                  onClick={() => updateDay(idx, { attractionIds: (d.attractionIds || []).filter(id => id !== attr.id) })}
                  className="text-[10px] px-2 py-1 rounded-full font-bold bg-blue-600 text-white flex items-center gap-1 hover:bg-blue-700 transition">
                  {attr.name} ✕
                </button>
              );
            })}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-b-lg border min-h-[40px] max-h-28 overflow-y-auto">
          {filtered.length === 0
            ? <span className="text-xs text-gray-400 p-1">No attractions found. Add via Attractions CMS.</span>
            : filtered.map(attr => {
              if (d.attractionIds?.includes(attr.id)) return null;
              return (
                <button type="button" key={attr.id}
                  onClick={() => updateDay(idx, { attractionIds: [...(d.attractionIds || []), attr.id] })}
                  className="text-[9.5px] px-2 py-0.5 rounded-md font-semibold border bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition">
                  {attr.name}
                </button>
              );
            })}
        </div>
      </div>
    );
  };

  const renderActivities = (d: ItineraryDay, idx: number, activeIds: number[], labelPrefix = "") => {
    const filteredSuggestions = activeIds.length > 0
      ? Array.from(new Set(allCmsActivities.filter(a => a.isActive !== false && activeIds.includes(a.destinationId)).map(a => String(a.name || a.title || "").trim()).filter(Boolean)))
      : allActivities;
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5 w-full">
            <span>{labelPrefix}Activities</span>
            <a href="/activities" target="_blank" rel="noopener noreferrer" className="ml-auto text-[9.5px] text-emerald-600 font-bold hover:underline">➕ Add Activity ↗️</a>
          </p>
          <span className="text-[10px] text-gray-400">Click selected to remove</span>
        </div>
        <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-lg border min-h-[40px]">
          {(d.activities || []).map((act, aIdx) => (
            <button key={`${idx}-act-${aIdx}`} type="button"
              onClick={() => updateDay(idx, { activities: (d.activities || []).filter((a: string) => a !== act) })}
              className="text-[10px] px-2 py-1 rounded-full font-bold bg-emerald-600 text-white flex items-center gap-1 hover:bg-emerald-700 transition">
              {act} ✕
            </button>
          ))}
          {!d.activities?.length && <span className="text-xs text-gray-400 p-1">No activities selected. Type below or pick from suggestions.</span>}
        </div>
        <div className="mt-2 space-y-2">
          <div className="flex gap-2">
            <input value={activityInputs[idx] || ""} onChange={e => setActivityInputs({ ...activityInputs, [idx]: e.target.value })}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const value = (activityInputs[idx] || "").trim();
                  if (!value) return;
                  updateDay(idx, { activities: Array.from(new Set([...(d.activities || []), value])) });
                  setActivityInputs({ ...activityInputs, [idx]: "" });
                }
              }}
              placeholder="Type custom activity, press Enter"
              className="flex-1 px-3 py-2 rounded-lg border outline-none text-sm bg-white focus:border-emerald-400" />
            <button type="button" onClick={() => {
              const value = (activityInputs[idx] || "").trim(); if (!value) return;
              updateDay(idx, { activities: Array.from(new Set([...(d.activities || []), value])) });
              setActivityInputs({ ...activityInputs, [idx]: "" });
            }} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition whitespace-nowrap">+ Add</button>
          </div>
          {filteredSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-lg border max-h-24 overflow-y-auto">
              {filteredSuggestions.map(act => {
                if ((d.activities || []).includes(act)) return null;
                return (
                  <button key={`${idx}-sug-${act}`} type="button"
                    onClick={() => updateDay(idx, { activities: [...new Set([...(d.activities || []), act])] })}
                    className="text-[9.5px] px-2 py-0.5 rounded-md font-semibold border bg-white text-gray-700 border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition">
                    {act}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * renderDining — shows ALL dining points that are reachable on this day's route.
   * For TRANSIT days: shows dining points along the full route (all cities between From→To).
   * For other days: shows dining points in all selected cities for that day.
   * This gives the user a "wide list" to pick from, as requested.
   */
  const renderDining = (d: ItineraryDay, idx: number, filterIds: number[], labelPrefix = "") => {
    // Get ALL dining points (not just enroute) filtered by the active city IDs
    // This gives a wider, more useful list for package managers
    const dayType = getEffectiveDayType(d);
    const isTransitDay = dayType === "TRANSIT";

    // For transit: show ALL dining points along the route (enroute + destination)
    // For other days: show all dining points in the day's cities
    const filteredDining = filterIds.length > 0
      ? allDining.filter(dp => filterIds.includes(dp.destinationId))
      : (isTransitDay ? allDining.filter(dp => dp.isEnrouteStop) : allDining);

    // Show ALL if no filter matches (fallback to all enroute stops)
    const displayDining = filteredDining.length > 0 ? filteredDining : allDining.filter(dp => dp.isEnrouteStop);

    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wider flex items-center gap-1.5 w-full">
            <span>{labelPrefix}Dining Stops</span>
            {filterIds.length > 0 && <span className="text-[9px] text-orange-500 normal-case bg-orange-50 px-1.5 py-0.5 rounded font-semibold">{displayDining.length} available</span>}
            <a href="/dining" target="_blank" rel="noopener noreferrer" className="ml-auto text-[9.5px] text-orange-600 font-bold hover:underline">➕ Add Dining ↗️</a>
          </p>
          <span className="text-[10px] text-gray-400">Click to select</span>
        </div>
        <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-lg border min-h-[40px] max-h-36 overflow-y-auto">
          {displayDining.length === 0
            ? <span className="text-xs text-gray-400 p-1">No dining points found. Add via Dining CMS.</span>
            : displayDining.map(dp => {
              const stops = d.diningStops || [];
              const isSel = stops.some(s => s.diningPointId === dp.id);
              const destName = allDests.find(dest => dest.id === dp.destinationId)?.name;
              return (
                <button type="button" key={dp.id} onClick={() => {
                  const ni = [...itinerary];
                  if (isSel) ni[idx].diningStops = stops.filter(s => s.diningPointId !== dp.id);
                  else ni[idx].diningStops = [...stops, { diningPointId: dp.id, mealType: "lunch" }];
                  setItinerary(ni);
                }} className={`text-[9.5px] px-2 py-0.5 rounded-md font-semibold border transition ${isSel ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-700 border-gray-200 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700"}`}>
                  🍽️ {dp.name}{destName ? ` (${destName})` : ""}
                </button>
              );
            })}
        </div>
      </div>
    );
  };

  const renderAccommodation = (d: ItineraryDay, idx: number, activeIds: number[]) => {
    const currentCity = (getEffectiveDayType(d) === "TRANSIT"
      ? [d.fromCity, d.toCity].filter((c): c is string => Boolean(c))
      : [...(d.cities || []), d.location].filter((c): c is string => Boolean(c))).map(c => c.toLowerCase().trim());
    const suggestedHotels = allGlobalHotels.filter(h => {
      const hDestId = h.destinationId ?? h.destination_id;
      if (hDestId && activeIds.includes(hDestId)) return true;
      const hDestName = (h.destinationName ?? h.destination_name ?? h.city ?? h.custom_city ?? "").toLowerCase().trim();
      return hDestName && currentCity.some(c => c.includes(hDestName) || hDestName.includes(c));
    });
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider">Accommodation / Night Stay</label>
          <a href="/hotels" target="_blank" rel="noopener noreferrer" className="text-[9.5px] text-[#1B3A6B] font-bold hover:underline flex items-center gap-0.5">➕ Add Hotel ↗️</a>
        </div>
        <div className="flex gap-2">
          <input list={`hotels-${idx}`} value={d.accommodation || ""} onChange={e => updateDay(idx, { accommodation: e.target.value })}
            placeholder="Search or type hotel name..." className="flex-1 px-3 py-2 rounded-lg border outline-none text-sm bg-white focus:border-[#1B3A6B] font-semibold" />
          {d.accommodation && d.accommodation !== "No Accommodation" && (
            <button type="button" onClick={() => updateDay(idx, { accommodation: "No Accommodation" })}
              className="px-2.5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold transition border border-gray-200">Clear Stay</button>
          )}
        </div>
        <datalist id={`hotels-${idx}`}>
          <option value="No Accommodation" /><option value="Overnight Bus" /><option value="Overnight Train" /><option value="Overnight Journey" />
          {suggestedHotels.map((h, hi) => <option key={hi} value={h.name}>{h.name} ({h.destinationName ?? h.destination_name ?? "Unknown"})</option>)}
        </datalist>
        {suggestedHotels.length > 0 ? (
          <div className="space-y-1">
            <p className="text-[9.5px] font-bold text-[#1B3A6B] uppercase tracking-wider">🏨 Hotel Suggestions ({suggestedHotels.length})</p>
            <div className="flex flex-wrap gap-1.5 p-2 bg-blue-50/20 rounded-lg border border-blue-100/50 max-h-24 overflow-y-auto">
              {suggestedHotels.map((h, hi) => {
                const isCurrent = d.accommodation === h.name;
                const rating = h.starRating ?? h.star_rating;
                const ratingLabel = rating ? `${rating}★` : h.category || "Hotel";
                return (
                  <button key={hi} type="button" onClick={() => updateDay(idx, { accommodation: h.name })}
                    className={`text-[9.5px] px-2.5 py-0.5 rounded-full font-bold border transition ${isCurrent ? "bg-[#1B3A6B] text-white border-[#1B3A6B] shadow-xs" : "bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300"}`}>
                    {h.name} <span className={isCurrent ? "text-blue-200" : "text-gray-400 font-semibold"}>({ratingLabel})</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-[9.5px] text-gray-500">
            <span>No hotels found for city. Add via Hotels CMS:</span>
            <a href="/hotels" target="_blank" rel="noopener noreferrer" className="text-[#1B3A6B] font-bold hover:underline">➕ Add Hotel ↗️</a>
          </div>
        )}
      </div>
    );
  };

  const renderTransport = (d: ItineraryDay, idx: number, activeIds: number[]) => {
    const currentCity = (getEffectiveDayType(d) === "TRANSIT"
      ? [d.fromCity, d.toCity].filter((c): c is string => Boolean(c))
      : [...(d.cities || []), d.location].filter((c): c is string => Boolean(c))).map(c => c.toLowerCase().trim());
    const transportsInCity = allGlobalTransports.filter(t => {
      const tDestId = t.destinationId ?? t.destination_id;
      if (tDestId && activeIds.includes(tDestId)) return true;
      const tCity = (t.cityName ?? t.city_name ?? t.city ?? t.customCity ?? t.custom_city ?? "").toLowerCase().trim();
      return tCity && currentCity.some(c => c.includes(tCity) || tCity.includes(c));
    });
    const suggestedTransports = transportsInCity.length > 0 ? transportsInCity : allGlobalTransports;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Transport / Vehicle</label>
          <a href="/transport" target="_blank" rel="noopener noreferrer" className="text-[9.5px] text-[#1B3A6B] font-bold hover:underline flex items-center gap-0.5">➕ Add Vehicle ↗️</a>
        </div>
        <div className="flex gap-2">
          <input list={`transports-${idx}`} value={d.transport || ""} onChange={e => updateDay(idx, { transport: e.target.value })}
            placeholder="Search or type transport..." className="flex-1 px-3 py-2 rounded-lg border outline-none text-sm bg-white focus:border-[#1B3A6B] font-semibold" />
          {d.transport && d.transport !== "No Transport" && (
            <button type="button" onClick={() => updateDay(idx, { transport: "No Transport" })}
              className="px-2.5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold transition border border-gray-200">Clear</button>
          )}
        </div>
        <datalist id={`transports-${idx}`}>
          <option value="Private Cab" /><option value="Shared Cab" /><option value="Self Drive" />
          <option value="Bus" /><option value="Train" /><option value="Flight" /><option value="No Transport" />
          {suggestedTransports.map((t, ti) => <option key={ti} value={t.name}>{t.name} ({t.type} • {t.seatingCapacity ?? t.capacity} Pax)</option>)}
        </datalist>
        {suggestedTransports.length > 0 && (
          <div className="space-y-1">
            <p className="text-[9.5px] font-bold text-[#1B3A6B] uppercase tracking-wider">🚗 Vehicle Suggestions ({suggestedTransports.length})</p>
            <div className="flex flex-wrap gap-1.5 p-2 bg-blue-50/20 rounded-lg border border-blue-100/50 max-h-24 overflow-y-auto">
              {suggestedTransports.slice(0, 12).map((t, ti) => {
                const isCurrent = d.transport === t.name;
                const capacity = t.seatingCapacity ?? t.capacity;
                return (
                  <button key={ti} type="button" onClick={() => updateDay(idx, { transport: t.name })}
                    className={`text-[9.5px] px-2.5 py-0.5 rounded-full font-bold border transition ${isCurrent ? "bg-[#1B3A6B] text-white border-[#1B3A6B] shadow-xs" : "bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300"}`}>
                    {t.name} <span className={isCurrent ? "text-blue-200" : "text-gray-400 font-semibold"}>({t.type} • {capacity} Pax)</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  /**
   * Multi-city chip picker for a single day
   */
  const renderMultiCityPicker = (d: ItineraryDay, idx: number, labelOverride?: string, isTransitMode?: boolean) => {
    const currentCities: string[] = isTransitMode
      ? (d.cities || [])
      : (d.cities?.length ? d.cities : (d.location ? [d.location] : []));
    const currentCityIds: number[] = d.cityIds || [];

    const addCity = (cityName: string, cityId?: number) => {
      if (!cityName.trim()) return;
      if (currentCities.includes(cityName)) return;
      const newCities = [...currentCities, cityName];
      const newCityIds = cityId ? [...currentCityIds, cityId] : currentCityIds;
      // Also resolve state/country from the first city
      const dest = cityId ? allDests.find(x => x.id === cityId) : allDests.find(x => x.name.toLowerCase() === cityName.toLowerCase());
      const stId = dest?.stateId;
      const ctId = stId ? allStates.find(s => s.id === stId)?.countryId : undefined;
      updateDay(idx, {
        cities: newCities,
        cityIds: newCityIds,
        location: isTransitMode ? d.location : (newCities[0] || ""),
        stateId: stId || d.stateId,
        countryId: ctId || d.countryId,
      });
    };

    const removeCity = (cityName: string, cityId?: number) => {
      const newCities = currentCities.filter(c => c !== cityName);
      const newCityIds = cityId ? currentCityIds.filter(id => id !== cityId) : currentCityIds;
      updateDay(idx, {
        cities: newCities,
        cityIds: newCityIds,
        location: isTransitMode ? d.location : (newCities[0] || ""),
      });
    };

    return (
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider">
          {labelOverride || "Cities / Places Covered This Day"}
        </label>

        {/* Selected city chips with arrow separator */}
        {currentCities.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-gradient-to-r from-amber-50/70 to-orange-50/50 rounded-xl border border-amber-200/60 min-h-[40px]">
            {currentCities.map((city, ci) => {
              const cityId = currentCityIds[ci];
              return (
                <span key={ci} className="flex items-center gap-1">
                  {ci > 0 && <ArrowRight className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                  <span className="inline-flex items-center gap-1 bg-[#1B3A6B] text-white text-[10.5px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                    <MapPin className="w-2.5 h-2.5 opacity-70" />
                    {city}
                    <button
                      type="button"
                      onClick={() => removeCity(city, cityId)}
                      className="ml-0.5 hover:text-red-300 transition text-white/70 text-[9px]"
                    >✕</button>
                  </span>
                </span>
              );
            })}
          </div>
        )}

        {/* Destination picker */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              list={`city-picker-${idx}`}
              placeholder={isTransitMode ? "Search & add enroute city/place (e.g. Kullu, Mandi)..." : "Search & add a city..."}
              className="w-full pl-8 pr-3 py-2 rounded-lg border outline-none text-sm bg-white focus:border-[#1B3A6B]"
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (!val) return;
                  const matchedDest = allDests.find(d => d.name.toLowerCase() === val.toLowerCase());
                  addCity(matchedDest?.name || val, matchedDest?.id);
                  (e.target as HTMLInputElement).value = "";
                }
              }}
              onChange={e => {
                // Inline auto-match from datalist
                const val = e.target.value.trim();
                const matchedDest = allDests.find(d => d.name.toLowerCase() === val.toLowerCase());
                if (matchedDest) {
                  addCity(matchedDest.name, matchedDest.id);
                  e.target.value = "";
                }
              }}
            />
            <datalist id={`city-picker-${idx}`}>
              {allDests
                .filter(dest => !currentCities.includes(dest.name) && dest.name !== d.fromCity && dest.name !== d.toCity)
                .map(dest => <option key={dest.id} value={dest.name} />)}
            </datalist>
          </div>
        </div>

        {/* Quick-pick chips from package's selected destinations */}
        {effectiveDestIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {effectiveDestIds
              .filter(destId => !currentCityIds.includes(destId))
              .map(destId => {
                const dest = allDests.find(d => d.id === destId);
                if (!dest || dest.name === d.fromCity || dest.name === d.toCity) return null;
                return (
                  <button
                    key={destId}
                    type="button"
                    onClick={() => addCity(dest.name, dest.id)}
                    className="text-[9.5px] px-2 py-0.5 rounded-full border font-semibold bg-white text-gray-600 border-gray-200 hover:bg-[#1B3A6B] hover:text-white hover:border-[#1B3A6B] transition"
                  >
                    + {dest.name}
                  </button>
                );
              })}
          </div>
        )}
      </div>
    );
  };

  // ──────────────────────────────────────────────────────────────────────────
  // SMART DESTINATION PANEL (shown in Itinerary tab header)
  // ──────────────────────────────────────────────────────────────────────────
  const renderDestinationPanel = () => {
    const countries  = effectiveCountryIds.map(id => allCountries.find(c => c.id === id)).filter(Boolean);
    const states     = effectiveStateIds.map(id => allStates.find(s => s.id === id)).filter(Boolean);
    const cities     = effectiveDestIds.map(id => allDests.find(d => d.id === id)).filter(Boolean);

    return (
      <div className="bg-gradient-to-br from-slate-900 to-[#1B3A6B] rounded-2xl p-5 shadow-lg border border-white/10 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-300" />
            <h3 className="text-white font-bold text-sm tracking-wide uppercase">Package Route Map</h3>
            <span className="text-[10px] text-blue-300 bg-white/10 px-2 py-0.5 rounded-full font-medium">
              Auto-derived from itinerary days
            </span>
          </div>
        </div>

        {/* Route visual */}
        {countries.length > 0 || states.length > 0 || cities.length > 0 ? (
          <div className="space-y-3">
            {/* Countries row */}
            {countries.length > 0 && (
              <div className="flex items-start gap-2">
                <Globe className="w-3.5 h-3.5 text-blue-300 mt-0.5 flex-shrink-0" />
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-blue-300 text-[9.5px] font-bold uppercase tracking-wider">Countries:</span>
                  {countries.map((c, i) => (
                    <span key={i} className="flex items-center gap-1">
                      {i > 0 && <ChevronRight className="w-3 h-3 text-white/30" />}
                      <span className="text-[10.5px] font-bold text-white bg-white/15 px-2 py-0.5 rounded-full">{c.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* States row */}
            {states.length > 0 && (
              <div className="flex items-start gap-2">
                <Layers className="w-3.5 h-3.5 text-emerald-300 mt-0.5 flex-shrink-0" />
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-emerald-300 text-[9.5px] font-bold uppercase tracking-wider">States:</span>
                  {states.map((s, i) => (
                    <span key={i} className="flex items-center gap-1">
                      {i > 0 && <ChevronRight className="w-3 h-3 text-white/30" />}
                      <span className="text-[10.5px] font-bold text-white bg-white/10 px-2 py-0.5 rounded-full">{s.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cities row — with arrow separators in CHRONOLOGICAL ORDER */}
            {derivedCitiesArray.length > 0 && (
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-300 mt-0.5 flex-shrink-0" />
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-amber-300 text-[9.5px] font-bold uppercase tracking-wider mr-1">CITIES:</span>
                  {derivedCitiesArray.map((cityName, i) => (
                    <span key={i} className="flex items-center gap-1">
                      {i > 0 && <ArrowRight className="w-3 h-3 text-white/40" />}
                      <span className="text-[10.5px] font-bold text-white bg-amber-500/20 border border-amber-400/20 px-2 py-0.5 rounded-full">{cityName}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-white/50 text-xs italic">Add cities to your itinerary days below — the route map will auto-populate here.</p>
        )}

        {/* Manual selectors (for package-level override) */}
        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-3">
          {/* Countries multi-select */}
          <div>
            <label className="block text-[9.5px] font-bold text-blue-200 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Globe className="w-3 h-3" /> Add Country
            </label>
            <select
              className="w-full text-xs p-2 rounded-lg bg-white/10 border border-white/20 text-white focus:border-blue-400 outline-none"
              onChange={e => {
                const val = Number(e.target.value);
                if (val && !selectedCountryIds.includes(val)) setSelectedCountryIds([...selectedCountryIds, val]);
                e.target.value = "";
              }}
            >
              <option value="">+ Add Country</option>
              {allCountries.filter(c => !effectiveCountryIds.includes(c.id)).map(c => <option key={c.id} value={c.id} className="text-gray-900">{c.name}</option>)}
            </select>
            {selectedCountryIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {selectedCountryIds.map(cid => {
                  const c = allCountries.find(x => x.id === cid);
                  if (!c) return null;
                  return <span key={cid} className="text-[9px] bg-blue-500/30 text-blue-100 px-1.5 py-0.5 rounded-full border border-blue-400/30 flex items-center gap-0.5">{c.name} <button type="button" onClick={() => setSelectedCountryIds(selectedCountryIds.filter(x => x !== cid))} className="hover:text-red-300">✕</button></span>;
                })}
              </div>
            )}
          </div>

          {/* States multi-select */}
          <div>
            <label className="block text-[9.5px] font-bold text-emerald-200 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Layers className="w-3 h-3" /> Add State
            </label>
            <select
              className="w-full text-xs p-2 rounded-lg bg-white/10 border border-white/20 text-white focus:border-emerald-400 outline-none"
              onChange={e => {
                const val = Number(e.target.value);
                if (val && !selectedStateIds.includes(val)) setSelectedStateIds([...selectedStateIds, val]);
                e.target.value = "";
              }}
            >
              <option value="">+ Add State</option>
              {allStates.filter(s => !effectiveStateIds.includes(s.id)).map(s => <option key={s.id} value={s.id} className="text-gray-900">{s.name}</option>)}
            </select>
            {selectedStateIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {selectedStateIds.map(sid => {
                  const s = allStates.find(x => x.id === sid);
                  if (!s) return null;
                  return <span key={sid} className="text-[9px] bg-emerald-500/30 text-emerald-100 px-1.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-0.5">{s.name} <button type="button" onClick={() => setSelectedStateIds(selectedStateIds.filter(x => x !== sid))} className="hover:text-red-300">✕</button></span>;
                })}
              </div>
            )}
          </div>

          {/* Cities multi-select */}
          <div>
            <label className="block text-[9.5px] font-bold text-amber-200 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Add City
            </label>
            <div className="relative">
              <input
                list="dest-manual-add"
                placeholder="Search city..."
                className="w-full text-xs p-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-amber-400 outline-none"
                onChange={e => {
                  const val = e.target.value.trim();
                  const matched = allDests.find(d => d.name.toLowerCase() === val.toLowerCase());
                  if (matched && !selectedDestIds.includes(matched.id)) {
                    setSelectedDestIds([...selectedDestIds, matched.id]);
                    e.target.value = "";
                  }
                }}
              />
              <datalist id="dest-manual-add">
                {allDests.filter(d => !effectiveDestIds.includes(d.id)).map(d => <option key={d.id} value={d.name} />)}
              </datalist>
            </div>
            {selectedDestIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {selectedDestIds.map(did => {
                  const d = allDests.find(x => x.id === did);
                  if (!d) return null;
                  return <span key={did} className="text-[9px] bg-amber-500/30 text-amber-100 px-1.5 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-0.5">{d.name} <button type="button" onClick={() => setSelectedDestIds(selectedDestIds.filter(x => x !== did))} className="hover:text-red-300">✕</button></span>;
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const primaryCountry = allCountries.find(c => c.id === effectiveCountryIds[0]);
  const primaryState = allStates.find(s => s.id === effectiveStateIds[0]);
  const primaryDestination = allDests.find(d => d.id === effectiveDestIds[0]);
  const canonicalPackageUrl = primaryCountry && primaryState && primaryDestination && slug
    ? `/packages/${primaryCountry.slug}/${primaryState.slug}/${primaryDestination.packagePageSlug || primaryDestination.slug}/${slug}`
    : null;

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <AdminLayout title={isEdit ? "Edit Package" : "Create Package"} subtitle={name}>
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-6 pb-20">

        {/* Sticky top bar */}
        <div className="flex justify-between items-center sticky top-0 z-10 bg-gray-50/90 backdrop-blur py-4 mb-2">
          <button type="button" onClick={() => setLocation("/packages")} className="text-gray-500 hover:text-gray-900 font-medium text-sm flex items-center gap-1"><X className="w-4 h-4" /> Cancel</button>
          <button type="submit" disabled={loading} className="flex items-center gap-2 bg-[#1B3A6B] text-white px-6 py-2.5 rounded-xl font-bold shadow hover:shadow-lg transition-all disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {isEdit ? "Update" : "Save"}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto gap-2 border-b border-gray-200 pb-2">
          {TABS.map(t => (
            <button key={t} type="button" onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === t ? "bg-[#1B3A6B] text-white" : "text-gray-500 hover:bg-gray-100"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 1: OVERVIEW
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "Overview" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Package Name</label><input required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1B3A6B] outline-none" /></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Package Code</label><input readOnly value={packageCode} placeholder="Auto-generated on save" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none bg-gray-50 text-gray-500 font-mono font-bold" /></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Slug</label><input value={slug} onChange={e => setSlug(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1B3A6B] outline-none bg-gray-50" /></div>
              {canonicalPackageUrl && (
                <div className="col-span-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-blue-700">Canonical Package URL</p>
                  <p className="mt-1 break-all font-mono text-xs text-blue-900">{canonicalPackageUrl}</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                <input list="categories-list" value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1B3A6B] outline-none" placeholder="Search or select category..." />
                <datalist id="categories-list">{dynamicCategories.map(cat => <option key={cat} value={cat} />)}</datalist>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Package Type</label>
                <select value={packageType} onChange={e => setPackageType(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none bg-white focus:border-[#1B3A6B]">
                  <option value="both">Both (Online + Offline)</option>
                  <option value="online">Online Only</option>
                  <option value="offline">Offline / B2B Only</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cover Image</label>
                <div className="flex gap-2">
                  <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1B3A6B] outline-none" />
                  <label className="bg-gray-100 px-4 py-3 rounded-xl cursor-pointer hover:bg-gray-200"><Upload className="w-5 h-5 text-gray-600" /><input type="file" className="hidden" onChange={e => handleImgUpload(e, setImageUrl)} /></label>
                </div>
              </div>
              <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Short Description</label><textarea value={shortDescription} onChange={e => setShortDescription(e.target.value)} rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1B3A6B] outline-none" /></div>
              <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Long Description</label><textarea value={longDescription} onChange={e => setLongDescription(e.target.value)} rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1B3A6B] outline-none" /></div>
              <div className="col-span-2 bg-blue-50/30 p-5 rounded-2xl border border-blue-100">
                <label className="block text-xs font-bold text-blue-700 uppercase mb-2">Tour Highlights</label>
                <textarea value={highlights.join("\n")} onChange={e => setHighlights(e.target.value.split("\n").filter(Boolean))} rows={4} placeholder="Add highlights (one per line)&#10;Example:&#10;Visit iconic landmarks&#10;Experience local culture" className="w-full p-3 rounded-xl border border-blue-200 outline-none text-sm focus:border-[#1B3A6B]" />
              </div>
              <div className="col-span-2 flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="w-5 h-5" /> <span className="font-bold text-sm text-gray-700">Featured Package</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isTrending} onChange={e => setIsTrending(e.target.checked)} className="w-5 h-5" /> <span className="font-bold text-sm text-gray-700">Trending Now</span></label>
              </div>
              <div className="col-span-2 bg-gray-50/50 p-5 rounded-2xl border border-gray-100 mt-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Best Months to Travel</label>
                <div className="flex flex-wrap gap-2">
                  {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(month => {
                    const isSel = monthsToTravel.includes(month);
                    return (
                      <button type="button" key={month} onClick={() => setMonthsToTravel(isSel ? monthsToTravel.filter(m => m !== month) : [...monthsToTravel, month])}
                        className={`text-xs px-4 py-2 rounded-xl font-bold border transition-colors ${isSel ? "bg-[#1B3A6B] text-white border-[#1B3A6B]" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-100 hover:border-gray-300"}`}>
                        {month}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 2: PRICING & CALENDAR (MERGED)
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "Pricing & Calendar" && (
          <div className="space-y-6">

            {/* Section A: Duration & Core Pricing */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
              <h3 className="font-bold text-gray-900 uppercase tracking-widest text-sm flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-600" /> Duration & Pricing</h3>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duration (Days)</label><input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nights</label><input type="number" value={nights} onChange={e => setNights(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" /></div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Base Price (₹)</label>
                  <input type="number" value={basePrice || ""} onChange={e => setBasePrice(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none font-bold text-lg text-gray-800 focus:border-[#1B3A6B]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Discount Type</label>
                  <select value={discountType} onChange={e => setDiscountType(e.target.value as any)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none bg-white focus:border-[#1B3A6B]">
                    <option value="none">No Discount</option>
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Discount Value</label>
                  <input type="number" value={discountValue || ""} onChange={e => setDiscountValue(Number(e.target.value))} disabled={discountType === "none"} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none disabled:bg-gray-50 disabled:text-gray-400 focus:border-[#1B3A6B]" />
                </div>
              </div>

              {/* Price summary card */}
              <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50/30 rounded-2xl border border-green-100 flex justify-between items-center shadow-sm">
                <div>
                  <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-0.5">Final Selling Price (Auto-Calculated)</p>
                  <p className="text-3xl font-black text-green-800">₹{pricePerPerson.toLocaleString("en-IN")}</p>
                  {discountPercent > 0 && <p className="text-xs text-green-600 font-bold mt-1 inline-flex items-center gap-1 bg-green-100/50 px-2 py-0.5 rounded-md"><Tag className="w-3 h-3" /> {discountPercent}% OFF applied</p>}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Original Strike Price</p>
                  <p className="text-xl font-bold text-gray-400 line-through">₹{originalPrice.toLocaleString("en-IN")}</p>
                </div>
              </div>

              {/* Detailed Category-Based Rates */}
              <div className="border-t border-gray-100 pt-5 space-y-4">
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-600" /> Category-Wise Price Breakdown (Per Person Rates)
                </h4>
                <p className="text-xs text-gray-500 -mt-1">
                  Define specific pricing for Extra Adults, Children (with/without bed), and Infants. These rates are used for client add-ons and dynamic checkout calculations.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Extra Adult Rate (₹)</label>
                    <input type="number" min="0" value={extraPersonPrice || ""} onChange={e => setExtraPersonPrice(Number(e.target.value))} placeholder="e.g. 21999" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-[#1B3A6B] text-sm font-semibold text-gray-800" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Child with Bed Rate (₹)</label>
                    <input type="number" min="0" value={childWithBedPrice || ""} onChange={e => setChildWithBedPrice(Number(e.target.value))} placeholder="e.g. 17999" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-[#1B3A6B] text-sm font-semibold text-gray-800" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Child w/o Bed Rate (₹)</label>
                    <input type="number" min="0" value={childWithoutBedPrice || ""} onChange={e => setChildWithoutBedPrice(Number(e.target.value))} placeholder="e.g. 12999" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-[#1B3A6B] text-sm font-semibold text-gray-800" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Infant Rate (₹)</label>
                    <input type="number" min="0" value={infantPrice || ""} onChange={e => setInfantPrice(Number(e.target.value))} placeholder="e.g. 0 or 2500" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-[#1B3A6B] text-sm font-semibold text-gray-800" />
                  </div>
                </div>

                {/* Live Category Breakdown Table Preview */}
                <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 shadow-lg space-y-3 mt-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Category</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Price Per Person</span>
                  </div>

                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between items-center py-1 border-b border-slate-900">
                      <span className="font-semibold text-white">Adult</span>
                      <span className="font-bold text-emerald-400">₹{(pricePerPerson || basePrice || 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-900">
                      <span className="font-semibold text-slate-200">Extra Adult</span>
                      <span className="font-bold text-slate-100">₹{(extraPersonPrice || pricePerPerson || 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-900">
                      <span className="font-semibold text-slate-200">Child with Bed</span>
                      <span className="font-bold text-slate-100">₹{(childWithBedPrice || Math.round(pricePerPerson * 0.75) || 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-900">
                      <span className="font-semibold text-slate-200">Child without Bed</span>
                      <span className="font-bold text-slate-100">₹{(childWithoutBedPrice || Math.round(pricePerPerson * 0.5) || 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="font-semibold text-slate-200">Infant (Under 2 yrs)</span>
                      <span className="font-bold text-slate-100">₹{(infantPrice || 0).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Capacity & Group Pricing */}
              <div className="border-t border-gray-100 pt-5">
                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-blue-600" /> Capacity & Group Booking Rules</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Minimum Guests Required</label><input type="number" min="1" value={minGuests} onChange={e => setMinGuests(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#1B3A6B]" /></div>
                  <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Maximum Guests Allowed</label><input type="number" min="1" value={maxGuests} onChange={e => setMaxGuests(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#1B3A6B]" /></div>
                </div>
                <div className="bg-blue-50/30 border border-blue-100 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-700 uppercase">Enable Group Package Pricing</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Flat-rate pricing up to a base capacity with per-person extra charges.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={isGroupPricing} onChange={e => setIsGroupPricing(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B3A6B]"></div>
                    </label>
                  </div>
                  {isGroupPricing && (
                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-blue-100/50">
                      <div><label className="block text-xs font-bold text-gray-600 mb-1">Group Base Capacity</label><input type="number" min="1" value={groupBaseCapacity} onChange={e => setGroupBaseCapacity(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-[#1B3A6B] text-sm font-semibold" /><p className="text-[10px] text-gray-400 mt-1">Guests included in package price</p></div>
                      <div><label className="block text-xs font-bold text-gray-600 mb-1">Extra Adult Cost (₹)</label><input type="number" min="0" value={extraPersonPrice} onChange={e => setExtraPersonPrice(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-[#1B3A6B] text-sm font-semibold text-gray-800" /></div>
                      <div><label className="block text-xs font-bold text-gray-600 mb-1">Extra Child Cost (₹)</label><input type="number" min="0" value={extraChildPrice} onChange={e => setExtraChildPrice(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-[#1B3A6B] text-sm font-semibold text-gray-800" /></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section B: Pricing Calendar (inline) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
                <Calendar className="w-5 h-5 text-[#1B3A6B]" />
                <h3 className="font-bold text-gray-900 uppercase tracking-widest text-sm">Pricing Calendar & Seasonal Rates</h3>
                {!isEdit && (
                  <span className="ml-auto text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-2 py-1 rounded-lg font-bold">Save the package first to enable</span>
                )}
              </div>

              {!isEdit ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                  <AlertCircle className="w-12 h-12 text-[#1B3A6B] mb-2" />
                  <p className="font-bold text-base">Save the Package First</p>
                  <p className="text-sm mt-1 text-center max-w-md">Save basic details first, then return here to configure dynamic rates and seasonal pricing on the calendar.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
                  {/* Calendar view */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-950 text-base flex items-center gap-2"><Calendar className="w-5 h-5 text-[#1B3A6B]" /> Rate & Inventory Calendar</h3>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">&larr; Prev</button>
                        <span className="font-bold text-gray-800 text-sm font-mono min-w-28 text-center uppercase tracking-wider">{currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                        <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">Next &rarr;</button>
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200 text-center py-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d}>{d}</div>)}
                      </div>
                      <div className="grid grid-cols-7 divide-x divide-y divide-gray-150 bg-gray-50/20">
                        {monthDays.map((dayDate, idx) => {
                          const isCurrentMonth = dayDate.getMonth() === currentMonth.getMonth();
                          const yyyy = dayDate.getFullYear();
                          const mm = String(dayDate.getMonth() + 1).padStart(2, "0");
                          const dd = String(dayDate.getDate()).padStart(2, "0");
                          const dateStr = `${yyyy}-${mm}-${dd}`;
                          const rule = calendarRates.find(r => r.date === dateStr || (typeof r.date === "string" && r.date.split("T")[0] === dateStr));
                          const isSelected = selectedCalendarDates.includes(dateStr);
                          let finalPrice = basePrice; let isBlackout = false; let isPriceOnReq = false; let priceModText = ""; let discText = "";
                          if (rule) {
                            if (rule.rateType === "blackout") isBlackout = true;
                            else if (rule.rateType === "price-on-request") isPriceOnReq = true;
                            else {
                              const mod = Number(rule.priceModifierValue) || 0;
                              if (rule.priceModifierType === "fixed") { finalPrice = mod; priceModText = `₹${mod}`; }
                              else if (rule.priceModifierType === "percentage") { finalPrice = basePrice * (1 + mod / 100); priceModText = `${mod >= 0 ? "+" : ""}${mod}%`; }
                              else if (rule.priceModifierType === "value") { finalPrice = basePrice + mod; priceModText = `${mod >= 0 ? "+" : ""}₹${mod}`; }
                              const disc = Number(rule.discountValue) || 0;
                              if (rule.discountType === "percentage") { finalPrice = finalPrice * (1 - disc / 100); discText = `${disc}% OFF`; }
                              else if (rule.discountType === "flat") { finalPrice = Math.max(0, finalPrice - disc); discText = `-₹${disc}`; }
                            }
                          }
                          return (
                            <div key={idx}
                              onMouseDown={() => isCurrentMonth && handleDayMouseDown(dateStr)}
                              onMouseEnter={() => isCurrentMonth && handleDayMouseEnter(dateStr)}
                              onMouseUp={handleDayMouseUp}
                              className={`min-h-[90px] p-2 flex flex-col justify-between transition-all select-none relative ${!isCurrentMonth ? "bg-gray-150/40 text-gray-300 pointer-events-none cursor-default" : "cursor-pointer hover:bg-slate-50"} ${isSelected ? "bg-blue-50/70 border-2 border-blue-500/80 -m-0.5 z-10 rounded-lg shadow-sm" : ""}`}>
                              <div className="flex justify-between items-start">
                                <span className={`text-xs font-bold ${isSelected ? "text-[#1B3A6B] bg-blue-100/80 rounded-full h-5 w-5 flex items-center justify-center" : isCurrentMonth ? "text-gray-700" : "text-gray-300"}`}>{dayDate.getDate()}</span>
                                {isCurrentMonth && rule && (
                                  <span className={`text-[8px] font-black uppercase px-1 rounded-sm border ${isBlackout ? "bg-red-100 text-red-700 border-red-200" : isPriceOnReq ? "bg-amber-100 text-amber-700 border-amber-200" : rule.rateType === "peak" ? "bg-orange-100 text-orange-700 border-orange-200" : rule.rateType === "off-season" ? "bg-cyan-100 text-cyan-700 border-cyan-200" : "bg-emerald-100 text-emerald-700 border-emerald-200"}`}>
                                    {rule.rateType === "off-season" ? "OFF" : rule.rateType}
                                  </span>
                                )}
                              </div>
                              {isCurrentMonth && (
                                <div className="mt-2 text-right">
                                  {isBlackout ? <p className="text-[10px] font-black text-red-650 uppercase tracking-widest line-through">SOLD OUT</p>
                                   : isPriceOnReq ? <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">ON REQUEST</p>
                                   : (
                                    <div className="space-y-0.5">
                                      <p className="text-xs font-black text-gray-900">₹{Math.round(finalPrice).toLocaleString("en-IN")}</p>
                                      {priceModText && <p className="text-[9px] text-gray-400 font-semibold leading-none">{priceModText}</p>}
                                      {discText && <p className="text-[9px] text-emerald-600 font-bold leading-none bg-emerald-50 inline-block px-1 rounded-sm border border-emerald-100">{discText}</p>}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Calendar config panel */}
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-5 h-fit shadow-xs">
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-800 uppercase tracking-wide mb-1 flex items-center gap-1.5"><Sliders className="w-4 h-4 text-[#1B3A6B]" /> Rate Overrides</h4>
                      <p className="text-[11px] text-gray-500">Drag select dates on the calendar or enter manually to set seasonal pricing.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-gray-150 shadow-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Start Date</label>
                        <input type="date" value={startDateInput} onChange={e => { setStartDateInput(e.target.value); if (e.target.value && endDateInput) setSelectedCalendarDates(generateDateRange(e.target.value, endDateInput)); }} className="w-full text-xs p-2 rounded-lg border border-gray-200 focus:border-[#1B3A6B] outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">End Date</label>
                        <input type="date" value={endDateInput} onChange={e => { setEndDateInput(e.target.value); if (startDateInput && e.target.value) setSelectedCalendarDates(generateDateRange(startDateInput, e.target.value)); }} className="w-full text-xs p-2 rounded-lg border border-gray-200 focus:border-[#1B3A6B] outline-none" />
                      </div>
                      {selectedCalendarDates.length > 0 && <div className="col-span-2 text-[10px] font-bold text-blue-600 bg-blue-50/50 p-1.5 rounded-md text-center border border-blue-100 mt-1">Selected {selectedCalendarDates.length} days</div>}
                    </div>
                    {selectedCalendarDates.length > 0 && (
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Filter Modifiers</label>
                        <div className="grid grid-cols-3 gap-2">
                          <button type="button" onClick={() => applyBulkSelection("weekends")} className="text-[10px] px-2.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg font-bold text-gray-600 shadow-xs">Weekends Only</button>
                          <button type="button" onClick={() => applyBulkSelection("weekdays")} className="text-[10px] px-2.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg font-bold text-gray-600 shadow-xs">Weekdays Only</button>
                          <button type="button" onClick={() => applyBulkSelection("all")} className="text-[10px] px-2.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg font-bold text-gray-600 shadow-xs">Select All</button>
                        </div>
                      </div>
                    )}
                    <div className="space-y-4 pt-2 border-t border-gray-200">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Rate Season Type</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[{ value: "peak", label: "Peak Season 🟥" }, { value: "off-season", label: "Off-Season 🟦" }, { value: "regular", label: "Regular 🟩" }, { value: "blackout", label: "Blackout ⬛" }, { value: "price-on-request", label: "On Request 🟨" }].map(item => (
                            <button key={item.value} type="button" onClick={() => setCalRateType(item.value as any)}
                              className={`text-[11px] font-bold py-2 rounded-xl text-center border transition-all ${calRateType === item.value ? "bg-[#1B3A6B] text-white border-[#1B3A6B] shadow-md shadow-[#1B3A6B]/20" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"} ${item.value === "price-on-request" ? "col-span-2" : ""}`}>
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {calRateType !== "blackout" && calRateType !== "price-on-request" && (
                        <>
                          <div className="bg-white p-3 rounded-xl border border-gray-150 space-y-3 shadow-xs">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Modifier Type</label>
                              <select value={calPriceModType} onChange={e => setCalPriceModType(e.target.value as any)} className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white focus:border-[#1B3A6B] outline-none">
                                <option value="fixed">Set Fixed price (₹)</option>
                                <option value="percentage">Adjust by percent (+/- %)</option>
                                <option value="value">Adjust by flat value (+/- ₹)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Modifier Value</label>
                              <input type="number" value={calPriceModVal || ""} onChange={e => setCalPriceModVal(Number(e.target.value))} placeholder={calPriceModType === "fixed" ? "e.g. 12000" : "e.g. +20 or -15"} className="w-full text-xs p-2 rounded-lg border border-gray-200 focus:border-[#1B3A6B] outline-none" />
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-gray-150 space-y-3 shadow-xs">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Discount Overlay</label>
                              <select value={calDiscountType} onChange={e => setCalDiscountType(e.target.value as any)} className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white focus:border-[#1B3A6B] outline-none">
                                <option value="none">No Discount</option>
                                <option value="percentage">Discount Percent (%)</option>
                                <option value="flat">Discount Flat (₹)</option>
                              </select>
                            </div>
                            {calDiscountType !== "none" && (
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Discount Value</label>
                                <input type="number" value={calDiscountVal || ""} onChange={e => setCalDiscountVal(Number(e.target.value))} placeholder={calDiscountType === "percentage" ? "e.g. 10" : "e.g. 200"} className="w-full text-xs p-2 rounded-lg border border-gray-200 focus:border-[#1B3A6B] outline-none" />
                              </div>
                            )}
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-gray-150 space-y-2.5 shadow-xs">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Category Rate Overrides (Optional)</label>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9px] font-semibold text-gray-400">Extra Adult (₹)</label>
                                <input type="number" value={calExtraAdult} onChange={e => setCalExtraAdult(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Override..." className="w-full text-xs p-1.5 rounded-lg border border-gray-200 focus:border-[#1B3A6B] outline-none" />
                              </div>
                              <div>
                                <label className="block text-[9px] font-semibold text-gray-400">Child w/ Bed (₹)</label>
                                <input type="number" value={calChildWithBed} onChange={e => setCalChildWithBed(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Override..." className="w-full text-xs p-1.5 rounded-lg border border-gray-200 focus:border-[#1B3A6B] outline-none" />
                              </div>
                              <div>
                                <label className="block text-[9px] font-semibold text-gray-400">Child w/o Bed (₹)</label>
                                <input type="number" value={calChildWithoutBed} onChange={e => setCalChildWithoutBed(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Override..." className="w-full text-xs p-1.5 rounded-lg border border-gray-200 focus:border-[#1B3A6B] outline-none" />
                              </div>
                              <div>
                                <label className="block text-[9px] font-semibold text-gray-400">Infant (₹)</label>
                                <input type="number" value={calInfant} onChange={e => setCalInfant(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Override..." className="w-full text-xs p-1.5 rounded-lg border border-gray-200 focus:border-[#1B3A6B] outline-none" />
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      <button type="button" disabled={selectedCalendarDates.length === 0} onClick={handleCalendarRateSubmit}
                        className="w-full bg-[#1B3A6B] text-white py-3 rounded-xl font-bold hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider text-xs shadow-md">
                        Update Selected Dates
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 3: ITINERARY (Smart Builder + Destination Panel)
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "Itinerary" && (
          <div className="space-y-0">
            {/* Smart Destination Panel — always visible at top */}
            {renderDestinationPanel()}

            {/* Itinerary Day Builder */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-3">
                <div>
                  <h3 className="font-bold text-gray-900 uppercase tracking-widest text-sm">Smart Itinerary Builder</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Select day type → add multiple cities → CRM auto-suggests hotels, transport & dining for each city.</p>
                </div>
                <div className="flex items-center gap-2">
                  {itinerary.length > 0 && (
                    <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-bold">
                      <button type="button" onClick={expandAllDays} className="px-2.5 py-1 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white transition cursor-pointer">
                        Expand All
                      </button>
                      <button type="button" onClick={collapseAllDays} className="px-2.5 py-1 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white transition cursor-pointer">
                        Collapse All
                      </button>
                    </div>
                  )}
                  <button type="button" onClick={addDay}
                    className="bg-[#1B3A6B] text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-1.5 hover:bg-[#2a519b] transition shadow-sm cursor-pointer">
                    <Plus className="w-4 h-4" /> Add Day
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                {itinerary.map((day, idx) => {
                  const dayType = getEffectiveDayType(day);
                  const cfg = DAY_TYPE_CONFIG[dayType];
                  const activeIds = getActiveDayIds(day);
                  const isTransit    = dayType === "TRANSIT";
                  const isDeparture  = dayType === "DEPARTURE";
                  const isArrival    = dayType === "ARRIVAL";
                  const isSightseeing = dayType === "SIGHTSEEING";
                  const isLeisure    = dayType === "LEISURE";

                  const isCollapsed = Boolean(collapsedDays[idx]);

                  // Display city names for card header
                  const displayCities = day.cities?.length ? day.cities : (day.location ? [day.location] : []);

                  return (
                    <div key={idx} className={`rounded-2xl border-2 ${cfg.borderColor} overflow-hidden shadow-sm transition-all`}>
                      {/* Card Header */}
                      <div
                        className={`${cfg.headerBg} px-4 py-2.5 flex items-center justify-between cursor-pointer select-none`}
                        onClick={() => toggleDayCollapse(idx)}
                      >
                        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                          <div className="bg-white/20 backdrop-blur rounded px-2 py-0.5 text-white font-black text-xs tracking-wider shrink-0">DAY {day.day}</div>
                          <span className="text-white/95 text-xs font-bold shrink-0">{cfg.emoji} {cfg.label}</span>

                          {/* Day Title summary pill */}
                          {day.title && (
                            <span className="text-white text-xs font-bold bg-white/25 backdrop-blur rounded-lg px-2.5 py-0.5 truncate max-w-[200px] sm:max-w-[320px]">
                              {day.title}
                            </span>
                          )}

                          {/* City display with arrows */}
                          {isTransit && (day.fromCity || day.toCity || (day.cities && day.cities.length > 0)) ? (
                            <span className="text-white/90 text-[10px] font-semibold bg-white/20 rounded-full px-2.5 py-0.5 flex items-center gap-1">
                              {[day.fromCity, ...(day.cities || []), day.toCity].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(" ➔ ")}
                            </span>
                          ) : displayCities.length > 0 ? (
                            <span className="flex items-center gap-1">
                              {displayCities.map((city, ci) => (
                                <span key={ci} className="flex items-center gap-1">
                                  {ci > 0 && <ArrowRight className="w-3 h-3 text-white/60" />}
                                  <span className="text-white/90 text-[10px] font-semibold bg-white/20 rounded-full px-2 py-0.5 flex items-center gap-0.5">
                                    <MapPin className="w-2.5 h-2.5" /> {city}
                                  </span>
                                </span>
                              ))}
                            </span>
                          ) : null}
                        </div>

                        {/* Right Action Buttons: Delete Icon & Expand/Collapse Icon Button */}
                        <div className="flex items-center gap-1.5 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => removeDay(idx)}
                            title="Delete Day"
                            className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleDayCollapse(idx)}
                            title={isCollapsed ? "Expand Day Itinerary" : "Collapse Day Itinerary"}
                            className="text-white hover:bg-white/20 rounded-lg p-1 px-2 transition flex items-center gap-1 bg-white/15 text-xs font-bold cursor-pointer"
                          >
                            {isCollapsed ? (
                              <>
                                <span className="hidden sm:inline">Expand</span>
                                <ChevronDown className="w-4 h-4" />
                              </>
                            ) : (
                              <>
                                <span className="hidden sm:inline">Collapse</span>
                                <ChevronUp className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Card Body — rendered only when expanded */}
                      {!isCollapsed && (
                        <div className={`${cfg.bgColor} p-4 space-y-3.5`}>

                        {/* 1. Day Type Selector */}
                        <div>
                          <p className="text-[9.5px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Day Type</p>
                          <div className="flex flex-wrap gap-1.5">
                            {DAY_TYPES.map(dt => {
                              const dc = DAY_TYPE_CONFIG[dt];
                              const isCurrent = dayType === dt;
                              return (
                                <button key={dt} type="button" onClick={() => updateDay(idx, { dayType: dt })} title={dc.description}
                                  className={`text-[11px] px-2.5 py-1 rounded-full font-bold border transition-all ${isCurrent ? `${dc.bgColor} ${dc.color} ${dc.borderColor} shadow-xs ring-1 ring-current/30` : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
                                  {dc.emoji} {dc.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. Title & Description */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="md:col-span-1">
                            <label className="text-[9.5px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Day Title</label>
                            <div className="flex gap-1.5">
                              <input value={day.title} onChange={e => updateDay(idx, { title: e.target.value })} placeholder="e.g. Arrival in Shimla → Explore Kufri" className="flex-1 px-2.5 py-1.5 rounded-lg border outline-none font-bold text-xs bg-white focus:border-[#1B3A6B]" />
                              <button type="button" title="Auto-suggest title" onClick={() => updateDay(idx, { title: autoTitle(day) })} className="px-2 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-[11px] font-bold transition whitespace-nowrap border border-gray-200">✨ Auto</button>
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-[9.5px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Day Description</label>
                            <textarea value={day.description} onChange={e => updateDay(idx, { description: e.target.value })} placeholder="Describe the day's experience, highlights..." rows={1} className="w-full px-2.5 py-1.5 rounded-lg border outline-none text-xs bg-white focus:border-[#1B3A6B]" />
                          </div>
                        </div>

                        {/* 3. TRANSIT: From → Via Enroute Cities → To */}
                        {isTransit && (
                          <div className="bg-white rounded-xl border-2 border-amber-200 p-4 space-y-4 shadow-xs">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                                🚗 Journey Route (Transit Day)
                              </p>
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                Specify Origin, Enroute Places Covered & Destination
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-end gap-3 bg-amber-50/40 p-3 rounded-xl border border-amber-100">
                              <div>
                                <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-wider">From City (Origin)</label>
                                <input list={`fromcity-${idx}`} value={day.fromCity || ""} onChange={e => {
                                  const from = e.target.value;
                                  const cid = resolveCityId(from);
                                  const enrouteStr = day.cities?.length ? ` via ${day.cities.join(", ")}` : "";
                                  const newTitle = from && day.toCity ? `${from} → ${day.toCity}${enrouteStr} — Transfer` : day.title;
                                  updateDay(idx, { fromCity: from, fromCityId: cid, title: day.title || newTitle });
                                }} placeholder="e.g. Shimla" className="w-full px-3 py-2 rounded-lg border border-amber-200 outline-none text-sm bg-white font-semibold focus:border-amber-500 shadow-xs" />
                                <datalist id={`fromcity-${idx}`}>{allDests.map(d => <option key={d.id} value={d.name} />)}</datalist>
                              </div>
                              <div className="hidden md:flex flex-col items-center gap-1 pb-2">
                                <div className="w-10 h-0.5 bg-amber-400" /><Car className="w-5 h-5 text-amber-500" /><div className="w-10 h-0.5 bg-amber-400" />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-wider">To City (Destination)</label>
                                <input list={`tocity-${idx}`} value={day.toCity || ""} onChange={e => {
                                  const to = e.target.value;
                                  const cid = resolveCityId(to);
                                  const enrouteStr = day.cities?.length ? ` via ${day.cities.join(", ")}` : "";
                                  const newTitle = day.fromCity && to ? `${day.fromCity} → ${to}${enrouteStr} — Transfer` : day.title;
                                  updateDay(idx, { toCity: to, toCityId: cid, title: day.title || newTitle });
                                }} placeholder="e.g. Manali" className="w-full px-3 py-2 rounded-lg border border-amber-200 outline-none text-sm bg-white font-semibold focus:border-amber-500 shadow-xs" />
                                <datalist id={`tocity-${idx}`}>{allDests.map(d => <option key={d.id} value={d.name} />)}</datalist>
                              </div>
                            </div>
                            {/* Enroute / Via Places Covered Multi-city Picker */}
                            <div className="pt-1">
                              {renderMultiCityPicker(day, idx, "Enroute Cities / Via Places Covered Along the Route (Optional)", true)}
                            </div>
                          </div>
                        )}

                        {/* 4. Multi-city picker (non-transit days) */}
                        {!isTransit && renderMultiCityPicker(day, idx)}

                        {/* 5. Transport */}
                        {renderTransport(day, idx, activeIds)}

                        {/* 6. Meals */}
                        {renderMeals(day, idx)}

                        {/* 7. TRANSIT: Enroute stops */}
                        {isTransit && (
                          <div className="space-y-4 bg-amber-50/40 rounded-xl border border-amber-100 p-4">
                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">🗺️ Enroute Stops ({day.fromCity || "origin"} → {day.toCity || "destination"})</p>
                            {renderAttractions(day, idx, activeIds, "Enroute ")}
                            {renderActivities(day, idx, activeIds, "Enroute ")}
                            {renderDining(day, idx, activeIds, "Enroute ")}
                          </div>
                        )}

                        {/* 8. SIGHTSEEING: Full attractions + activities + dining */}
                        {isSightseeing && (
                          <div className="space-y-4">
                            {renderAttractions(day, idx, activeIds)}
                            {renderActivities(day, idx, activeIds)}
                            {renderDining(day, idx, activeIds)}
                          </div>
                        )}

                        {/* 9. ARRIVAL */}
                        {isArrival && (
                          <div className="space-y-4">
                            {renderAttractions(day, idx, activeIds)}
                            {renderActivities(day, idx, activeIds)}
                            {renderDining(day, idx, activeIds)}
                          </div>
                        )}

                        {/* 10. LEISURE */}
                        {isLeisure && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
                              <span className="text-purple-500 text-sm">🌸</span>
                              <p className="text-[11px] text-purple-700 font-semibold">Leisure Day — add optional activities guests may enjoy on their free time.</p>
                            </div>
                            {renderAttractions(day, idx, activeIds)}
                            {renderActivities(day, idx, activeIds)}
                            {renderDining(day, idx, activeIds)}
                          </div>
                        )}

                        {/* 11. DEPARTURE */}
                        {isDeparture && (
                          <div className="bg-white rounded-xl border-2 border-rose-200 p-4 space-y-4 shadow-xs">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                                🏠 Departure Route & Return Journey
                              </p>
                              <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                Specify Departure Origin, Enroute Places & Drop City
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-end gap-3 bg-rose-50/40 p-3 rounded-xl border border-rose-100">
                              <div>
                                <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-wider">From City (Departure Origin)</label>
                                <input list={`fromcity-dep-${idx}`} value={day.fromCity || ""} onChange={e => {
                                  const from = e.target.value;
                                  const cid = resolveCityId(from);
                                  const enrouteStr = day.cities?.length ? ` via ${day.cities.join(", ")}` : "";
                                  const newTitle = from && day.toCity ? `Departure from ${from} → ${day.toCity}${enrouteStr}` : day.title;
                                  updateDay(idx, { fromCity: from, fromCityId: cid, title: day.title || newTitle });
                                }} placeholder="e.g. Manali" className="w-full px-3 py-2 rounded-lg border border-rose-200 outline-none text-sm bg-white font-semibold focus:border-rose-500 shadow-xs" />
                                <datalist id={`fromcity-dep-${idx}`}>{allDests.map(d => <option key={d.id} value={d.name} />)}</datalist>
                              </div>
                              <div className="hidden md:flex flex-col items-center gap-1 pb-2">
                                <div className="w-10 h-0.5 bg-rose-400" /><Car className="w-5 h-5 text-rose-500" /><div className="w-10 h-0.5 bg-rose-400" />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-wider">To City (Drop Off / Airport / Railway Station)</label>
                                <input list={`tocity-dep-${idx}`} value={day.toCity || ""} onChange={e => {
                                  const to = e.target.value;
                                  const cid = resolveCityId(to);
                                  const enrouteStr = day.cities?.length ? ` via ${day.cities.join(", ")}` : "";
                                  const newTitle = day.fromCity && to ? `Departure from ${day.fromCity} → ${to}${enrouteStr}` : day.title;
                                  updateDay(idx, { toCity: to, toCityId: cid, title: day.title || newTitle });
                                }} placeholder="e.g. Chandigarh / Delhi" className="w-full px-3 py-2 rounded-lg border border-rose-200 outline-none text-sm bg-white font-semibold focus:border-rose-500 shadow-xs" />
                                <datalist id={`tocity-dep-${idx}`}>{allDests.map(d => <option key={d.id} value={d.name} />)}</datalist>
                              </div>
                            </div>
                            {/* Enroute / Via Places Covered Multi-city Picker for Departure */}
                            <div className="pt-1">
                              {renderMultiCityPicker(day, idx, "Enroute Cities / Places Visited Before Drop Off (Optional)", true)}
                            </div>
                            <div className="space-y-4 pt-2">
                              {renderAttractions(day, idx, activeIds, "Enroute ")}
                              {renderActivities(day, idx, activeIds, "Enroute ")}
                              {renderDining(day, idx, activeIds, "Enroute ")}
                            </div>
                          </div>
                        )}

                        {/* 12. Accommodation */}
                        {!isDeparture ? (
                          renderAccommodation(day, idx, activeIds)
                        ) : (
                          <div className="bg-rose-50/60 border border-rose-200/70 rounded-xl p-3 text-center">
                            <p className="text-[11px] font-bold text-rose-700">🏠 Departure Day (Checkout & Return Journey)</p>
                            <p className="text-[10px] text-rose-600 mt-0.5">No night stay accommodation on departure day. Breakfast/meals at hotel are configured in the Meals section above.</p>
                          </div>
                        )}

                      </div>
                      )}
                    </div>
                  );
                })}

                {!itinerary.length && (
                  <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                    <Map className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-bold">No itinerary days yet</p>
                    <p className="text-gray-400 text-sm mt-1">Click "Add Day" to start building your day-by-day journey</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 4: GALLERY
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "Gallery" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900 uppercase tracking-widest text-sm">Package Gallery Images</h3>
              <label className="bg-[#1B3A6B] text-white px-4 py-2 rounded-xl font-bold text-sm cursor-pointer hover:bg-[#2a519b] transition-colors flex items-center gap-2">
                <Upload className="w-4 h-4" /> Add Photos
                <input type="file" multiple accept="image/*" className="hidden" onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  if (!files.length) return;
                  const toastId = toast.loading(`Uploading ${files.length} images...`);
                  try {
                    const urls = await Promise.all(files.map(f => uploadMedia(f, "packages")));
                    setGalleryImages([...galleryImages, ...urls]);
                    toast.success(`Uploaded ${urls.length} images`, { id: toastId });
                  } catch { toast.error("Failed to upload some images", { id: toastId }); }
                }} />
              </label>
            </div>

            {/* ── Image Dimension Guide ── */}
            <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 flex flex-col sm:flex-row sm:items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-blue-800 mb-1.5">📐 Recommended Hero Slider Image Dimensions</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 bg-white border border-blue-200 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    <span className="text-blue-400">⬛</span> 1280 × 720 px
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white border border-emerald-200 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    <span>16 : 9</span> Aspect Ratio
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white border border-amber-200 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    ≤ 500 KB per image
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full">
                    JPG / WebP format
                  </span>
                </div>
                <p className="text-xs text-blue-600 leading-relaxed">
                  <strong>Why 1280×720?</strong> This resolution delivers sharp, full-width display on all devices — desktop (up to 1300px wide) and mobile — while keeping file size small for fast loading.
                  For best quality: shoot in <strong>landscape orientation</strong>, keep the subject centred, and avoid very bright or very dark images (overlay text must remain readable).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {galleryImages.map((url, idx) => (
                <div key={idx} className="relative aspect-video rounded-xl overflow-hidden group border border-gray-200">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setGalleryImages(galleryImages.filter((_, i) => i !== idx))} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-sm">
                    <Trash2 className="w-6 h-6 text-red-400 hover:text-red-500 transition-colors" />
                  </button>
                  <span className="absolute bottom-1 left-1 text-[9px] font-bold text-white/70 bg-black/40 rounded px-1">{idx + 1}</span>
                </div>
              ))}
              {!galleryImages.length && (
                <div className="col-span-full border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center text-gray-400 flex flex-col items-center bg-gray-50/50">
                  <ImageIcon className="w-12 h-12 mb-3 opacity-20 text-[#1B3A6B]" />
                  <p className="font-bold text-gray-500">No gallery images yet</p>
                  <p className="text-sm mt-1">Upload high-quality <strong>1280×720 px</strong> landscape photos to showcase this package in the hero slider</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 5: INCLUSIONS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "Inclusions" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 uppercase tracking-widest text-xs mb-3 flex items-center justify-between">
                <span>Inclusion Icons ({inclusionIcons.length} selected)</span>
                <span className="text-[11px] text-slate-400 font-normal normal-case">Click to toggle icons shown on package cards & detail page</span>
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-2">
                {INCLUSION_OPTIONS.map(opt => {
                  const sel = inclusionIcons.includes(opt.id);
                  const Icon = opt.icon;
                  return (
                    <button type="button" key={opt.id} onClick={() => setInclusionIcons(sel ? inclusionIcons.filter(i => i !== opt.id) : [...inclusionIcons, opt.id])}
                      className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border transition-all ${sel ? "bg-[#1B3A6B] text-white border-[#1B3A6B] shadow-xs" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-white hover:border-slate-300"}`}>
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-[10px] font-bold text-center leading-tight truncate w-full">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50/30 p-5 rounded-2xl border border-green-100"><label className="block text-xs font-bold text-green-700 uppercase mb-2">Inclusions</label><textarea value={inclusions.join("\n")} onChange={e => setInclusions(e.target.value.split("\n").filter(Boolean))} rows={6} className="w-full p-3 rounded-xl border outline-none text-sm" /></div>
              <div className="bg-red-50/30 p-5 rounded-2xl border border-red-100"><label className="block text-xs font-bold text-red-700 uppercase mb-2">Exclusions</label><textarea value={exclusions.join("\n")} onChange={e => setExclusions(e.target.value.split("\n").filter(Boolean))} rows={6} className="w-full p-3 rounded-xl border outline-none text-sm" /></div>
              <div className="col-span-2 bg-amber-50/30 p-5 rounded-2xl border border-amber-100"><label className="block text-xs font-bold text-amber-700 uppercase mb-2">Important Notes</label><textarea value={importantNotes.join("\n")} onChange={e => setImportantNotes(e.target.value.split("\n").filter(Boolean))} rows={4} className="w-full p-3 rounded-xl border outline-none text-sm" /></div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 6: POLICIES, FAQs & SEO
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "Policies, FAQs & SEO" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
            <div className="grid grid-cols-2 gap-6 border-b border-gray-100 pb-6">
              <h3 className="col-span-2 font-bold text-gray-900 uppercase tracking-widest text-sm mb-1">Policies</h3>
              <p className="col-span-2 text-xs text-gray-400 font-medium -mt-1">Write policy lines one per line — they'll be formatted as bullets on the package detail page.</p>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cancellation Policy</label>
                <textarea value={cancellationPolicy} onChange={e => setCancellationPolicy(e.target.value)} rows={6} className="w-full p-3 rounded-xl border outline-none text-sm focus:border-[#1B3A6B] bg-gray-50/30" placeholder="e.g. 30 Days before travel: 100% Refund&#10;15-30 Days: 50% Refund" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Policy</label>
                <textarea value={paymentPolicy} onChange={e => setPaymentPolicy(e.target.value)} rows={6} className="w-full p-3 rounded-xl border outline-none text-sm focus:border-[#1B3A6B] bg-gray-50/30" placeholder="e.g. 25% Booking advance&#10;Balance 15 days before travel" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900 uppercase tracking-widest text-sm">FAQs</h3>
                <button type="button" onClick={() => setFaqs([...faqs, { question: "", answer: "" }])} className="text-[#1B3A6B] font-bold text-sm"><Plus className="inline w-4 h-4" /> Add FAQ</button>
              </div>
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <div key={i} className="p-3 border rounded-xl bg-gray-50">
                    <div className="flex justify-end mb-1"><button type="button" onClick={() => setFaqs(faqs.filter((_, fi) => fi !== i))} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button></div>
                    <input value={faq.question} onChange={e => { const nf = [...faqs]; nf[i].question = e.target.value; setFaqs(nf); }} placeholder="Question?" className="w-full p-2 border rounded-lg text-sm outline-none mb-2" />
                    <textarea value={faq.answer} onChange={e => { const nf = [...faqs]; nf[i].answer = e.target.value; setFaqs(nf); }} placeholder="Answer..." rows={2} className="w-full p-2 border rounded-lg text-sm outline-none" />
                  </div>
                ))}
                {!faqs.length && <p className="text-gray-400 text-sm text-center py-4">No FAQs added</p>}
              </div>
            </div>

            <div className="mt-8 border-t border-gray-100 pt-6">
              <h3 className="font-bold text-gray-900 uppercase tracking-widest text-sm mb-4">Search Engine Optimization (SEO)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Meta Title</label><input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder="e.g. Best Manali Tour Package 4 Nights 5 Days | Sampooran Holidays" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#1B3A6B]" /></div>
                <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Meta Description</label><textarea value={metaDescription} onChange={e => setMetaDescription(e.target.value)} rows={2} placeholder="Brief compelling description for Google search results..." className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#1B3A6B]" /></div>
                <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Meta Keywords (Comma separated)</label><input value={metaKeywords} onChange={e => setMetaKeywords(e.target.value)} placeholder="manali tour, adventure package, rohtang pass trip" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#1B3A6B]" /></div>
              </div>
            </div>
          </div>
        )}

      </form>
    </AdminLayout>
  );
}
