import { useState, useEffect, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import AdminLayout from "../components/AdminLayout";
import { customFetch } from "../utils/api";
import { toast } from "sonner";
import { 
  Save, X, Plus, Trash2, Mountain, MapPin, Clock, Calendar, 
  Tag, Info, List, Shield, CheckCircle, HelpCircle, AlertCircle,
  Image as ImageIcon, DollarSign, Users, Layout as LayoutIcon, FileText,
  Plane, Hotel, Utensils, Camera, Car, Zap, ShieldCheck, Coffee, Loader2, Upload, Search, Sliders
} from "lucide-react";
import { ItineraryDay, HotelInfo, FaqEntry, uploadMedia, MealType, MEAL_TYPES, MEAL_ICONS } from "../utils/packageFormTypes";

const INCLUSION_OPTIONS = [
  { id: "flight", label: "Flight", icon: Plane },
  { id: "hotel", label: "Hotel", icon: Hotel },
  { id: "meals", label: "Meals", icon: Utensils },
  { id: "sightseeing", label: "Sightseeing", icon: Camera },
  { id: "transfers", label: "Transfers", icon: Car },
  { id: "activities", label: "Activities", icon: Zap },
  { id: "insurance", label: "Insurance", icon: ShieldCheck },
  { id: "guide", label: "Guide", icon: Users },
  { id: "visa", label: "Visa", icon: FileText },
  { id: "drinks", label: "Drinks", icon: Coffee },
];

const TABS = [
  "Overview", "Destinations & Pricing", "Pricing Calendar", "Itinerary", "Gallery", "Inclusions", "Policies, FAQs & SEO"
];

export default function PackageForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [activeTab, setActiveTab] = useState(TABS[0]);

  // Form State
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

  // Destinations & Pricing
  const [selectedDestIds, setSelectedDestIds] = useState<number[]>([]);
  const [stateId, setStateId] = useState<number | "">("");
  const [countryId, setCountryId] = useState<number | "">("");
  const [duration, setDuration] = useState(5);
  const [nights, setNights] = useState(4);
  const [basePrice, setBasePrice] = useState(0);
  const [discountType, setDiscountType] = useState<"percent" | "flat" | "none">("none");
  const [discountValue, setDiscountValue] = useState(0);
  const [pricePerPerson, setPricePerPerson] = useState(0);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [monthsToTravel, setMonthsToTravel] = useState<string[]>([]);
  
  // Pricing Calendar States
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarRates, setCalendarRates] = useState<any[]>([]);
  const [selectedCalendarDates, setSelectedCalendarDates] = useState<string[]>([]);
  const [loadingCal, setLoadingCal] = useState(false);
  const [calRateType, setCalRateType] = useState<"peak" | "off-season" | "regular" | "blackout" | "price-on-request">("peak");
  const [calPriceModType, setCalPriceModType] = useState<"fixed" | "percentage" | "value">("fixed");
  const [calPriceModVal, setCalPriceModVal] = useState(0);
  const [calDiscountType, setCalDiscountType] = useState<"none" | "flat" | "percentage">("none");
  const [calDiscountVal, setCalDiscountVal] = useState(0);
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const [dragStart, setDragStart] = useState<string | null>(null);

  const fetchCalendarRates = async () => {
    if (!isEdit) return;
    setLoadingCal(true);
    try {
      const startYear = currentMonth.getFullYear();
      const startMonth = currentMonth.getMonth();
      const firstDay = new Date(startYear, startMonth - 1, 1);
      const lastDay = new Date(startYear, startMonth + 2, 0);
      
      const firstDayStr = firstDay.toISOString().split("T")[0];
      const lastDayStr = lastDay.toISOString().split("T")[0];
      
      const res = await customFetch(`/api/admin/packages/${id}/calendar-inventory?startDate=${firstDayStr}&endDate=${lastDayStr}`);
      if (Array.isArray(res)) {
        setCalendarRates(res);
      }
    } catch (error) {
      console.error("Failed to fetch calendar rates", error);
    } finally {
      setLoadingCal(false);
    }
  };

  useEffect(() => {
    if (activeTab === "Pricing Calendar" && isEdit) {
      fetchCalendarRates();
    }
  }, [activeTab, currentMonth, isEdit]);

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

  const handleDayMouseDown = (dateStr: string) => {
    setDragStart(dateStr);
    setSelectedCalendarDates([dateStr]);
    setStartDateInput(dateStr);
    setEndDateInput(dateStr);
  };

  const handleDayMouseEnter = (dateStr: string) => {
    if (!dragStart) return;
    const start = new Date(dragStart);
    const end = new Date(dateStr);
    const minDate = start < end ? start : end;
    const maxDate = start < end ? end : start;
    const range: string[] = [];
    const temp = new Date(minDate);
    while (temp <= maxDate) {
      range.push(temp.toISOString().split("T")[0]);
      temp.setDate(temp.getDate() + 1);
    }
    setSelectedCalendarDates(range);
    setStartDateInput(minDate.toISOString().split("T")[0]);
    setEndDateInput(maxDate.toISOString().split("T")[0]);
  };

  const handleDayMouseUp = () => {
    setDragStart(null);
  };

  useEffect(() => {
    const handleMouseUp = () => setDragStart(null);
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const generateDateRange = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return [];
    const start = new Date(startStr);
    const end = new Date(endStr);
    const range: string[] = [];
    const temp = new Date(start < end ? start : end);
    const maxDate = start < end ? end : start;
    while (temp <= maxDate) {
      range.push(temp.toISOString().split("T")[0]);
      temp.setDate(temp.getDate() + 1);
    }
    return range;
  };

  const applyBulkSelection = (type: "weekends" | "weekdays" | "all" | "clear") => {
    if (selectedCalendarDates.length === 0) {
      toast.error("Please select a date range first using click & drag or inputs");
      return;
    }
    const dateObjects = selectedCalendarDates.map(d => new Date(d));
    const minDate = new Date(Math.min(...dateObjects.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dateObjects.map(d => d.getTime())));
    
    const filtered: string[] = [];
    const temp = new Date(minDate);
    while (temp <= maxDate) {
      const day = temp.getDay();
      const dateStr = temp.toISOString().split("T")[0];
      if (type === "all") {
        filtered.push(dateStr);
      } else if (type === "weekends" && (day === 0 || day === 6)) {
        filtered.push(dateStr);
      } else if (type === "weekdays" && day !== 0 && day !== 6) {
        filtered.push(dateStr);
      }
      temp.setDate(temp.getDate() + 1);
    }
    
    if (type === "clear") {
      setSelectedCalendarDates([]);
      setStartDateInput("");
      setEndDateInput("");
    } else {
      setSelectedCalendarDates(filtered);
    }
  };

  const handleCalendarRateSubmit = async () => {
    if (selectedCalendarDates.length === 0) {
      toast.error("No dates selected");
      return;
    }
    try {
      const payload = {
        dates: selectedCalendarDates,
        rateType: calRateType,
        priceModifierType: calRateType === "blackout" || calRateType === "price-on-request" ? "fixed" : calPriceModType,
        priceModifierValue: calRateType === "blackout" || calRateType === "price-on-request" ? 0 : calPriceModVal,
        discountType: calRateType === "blackout" || calRateType === "price-on-request" ? "none" : calDiscountType,
        discountValue: calRateType === "blackout" || calRateType === "price-on-request" ? 0 : calDiscountVal,
      };
      
      await customFetch(`/api/admin/packages/${id}/calendar-inventory`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("Calendar rates updated successfully");
      setSelectedCalendarDates([]);
      setStartDateInput("");
      setEndDateInput("");
      fetchCalendarRates();
    } catch (error: any) {
      toast.error("Failed to update rates: " + error.message);
    }
  };

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

  const [destSearch, setDestSearch] = useState("");

  // Arrays
  const [inclusionIcons, setInclusionIcons] = useState<string[]>([]);
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [importantNotes, setImportantNotes] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<string[]>([]);
  const DEFAULT_CANCELLATION = "Free cancellation up to 15 days before travel. 50% charge for 7–14 days before. No refund within 7 days.";
  const DEFAULT_PAYMENT = "50% advance to confirm booking. Remaining 50% before 7 days of travel.";
  const [cancellationPolicy, setCancellationPolicy] = useState(DEFAULT_CANCELLATION);
  const [paymentPolicy, setPaymentPolicy] = useState(DEFAULT_PAYMENT);
  const [faqs, setFaqs] = useState<FaqEntry[]>([]);
  const [hotels, setHotels] = useState<HotelInfo[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  
  // Data sources
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

  const selectedPackageActivities = useMemo(() => {
    return Array.from(
      new Set(
        itinerary.flatMap((day) =>
          Array.isArray(day.activities)
            ? day.activities.map((item) => String(item).trim()).filter(Boolean)
            : []
        )
      )
    );
  }, [itinerary]);

  const allActivities = useMemo(() => {
    const fallbackActivities = allAttractions.flatMap((a) =>
      Array.isArray(a.activities) ? a.activities.map((item: unknown) => String(item).trim()) : []
    );
    // Use truthy check (not strict ===) because DB may return 1/0 or null instead of boolean
    const cmsActivityNames = allCmsActivities
      .filter((a) => a.isActive !== false)
      .map((a) => String(a.name || a.title || "").trim())
      .filter(Boolean);
    const combined = [...approvedActivities, ...cmsActivityNames, ...fallbackActivities, ...selectedPackageActivities];
    const unique = Array.from(new Set(combined.map((item) => String(item).trim()).filter(Boolean)));
    return unique.filter((activity) => !hiddenActivities.some((hidden) => hidden.toLowerCase() === activity.toLowerCase()));
  }, [allAttractions, allCmsActivities, approvedActivities, hiddenActivities, selectedPackageActivities]);

  useEffect(() => {
    Promise.all([
      customFetch("/api/admin/destinations"),
      customFetch("/api/admin/states"),
      customFetch("/api/admin/countries"),
      customFetch("/api/admin/attractions"),
      customFetch("/api/admin/activities"),
      customFetch("/api/admin/dining"),
      customFetch("/api/admin/hotels"),
      customFetch("/api/transport?limit=500")
    ]).then(([dests, states, countries, attrs, activities, dinings, globalHotels, transports]) => {
      setAllDests(Array.isArray(dests) ? dests : []);
      setAllStates(Array.isArray(states) ? states : []);
      setAllCountries(Array.isArray(countries) ? countries : []);
      setAllAttractions(Array.isArray(attrs) ? attrs : []);
      setAllCmsActivities(Array.isArray(activities) ? activities : []);
      setAllDining(Array.isArray(dinings) ? dinings : []);
      setAllGlobalHotels(Array.isArray(globalHotels) ? globalHotels : []);
      setAllGlobalTransports(Array.isArray(transports?.vehicles) ? transports.vehicles : []);
    });

    customFetch("/api/admin/settings").then((settings) => {
      if (Array.isArray(settings)) {
        const approved: string[] = [];
        const hidden: string[] = [];

        settings.forEach((item: any) => {
          if (item.key === "APPROVED_ACTIVITIES") {
            try {
              const values = JSON.parse(item.value);
              if (Array.isArray(values)) approved.push(...values.map(String));
            } catch {
              // ignore invalid activity library data
            }
          }
          if (item.key === "HIDDEN_ACTIVITIES") {
            try {
              const values = JSON.parse(item.value);
              if (Array.isArray(values)) hidden.push(...values.map(String));
            } catch {
              // ignore invalid hidden activity data
            }
          }
        });

        setApprovedActivities(Array.from(new Set(approved.map((item) => item.trim()).filter(Boolean))));
        setHiddenActivities(Array.from(new Set(hidden.map((item) => item.trim()).filter(Boolean))));
      }
    }).catch(() => {
      console.warn("Could not load activity settings");
    });
  }, []);

  useEffect(() => {
    if (isEdit) {
      customFetch(`/api/admin/packages/${id}`).then(pkg => {
        setName(pkg.name || ""); setSlug(pkg.slug || ""); setPackageCode(pkg.packageCode || ""); setCategory(pkg.category || "Adventure");
        setPackageType(pkg.packageType || "both"); setIsFeatured(pkg.isFeatured || false); setIsTrending(pkg.isTrending || false);
        setImageUrl(pkg.imageUrl || ""); setThumbnailUrl(pkg.thumbnailUrl || "");
        setShortDescription(pkg.shortDescription || ""); setLongDescription(pkg.longDescription || "");
        setSelectedDestIds(pkg.destinationIds || []); setStateId(pkg.stateId || ""); setCountryId(pkg.countryId || "");
        setDuration(pkg.duration || 5); setNights(pkg.nights || 4); setPricePerPerson(pkg.pricePerPerson || 0);
        setOriginalPrice(pkg.originalPrice || 0); setDiscountPercent(pkg.discountPercent || 0);
        setInclusionIcons(pkg.inclusionIcons || []); setInclusions(pkg.inclusions || []); setExclusions(pkg.exclusions || []);
        setImportantNotes(pkg.importantNotes || []); setHighlights(pkg.highlights || []); 
        setCancellationPolicy(pkg.cancellationPolicy || DEFAULT_CANCELLATION);
        setPaymentPolicy(pkg.paymentPolicy || DEFAULT_PAYMENT);
        setMonthsToTravel(pkg.monthsToTravel || []);
        
        const bPrice = pkg.originalPrice || pkg.pricePerPerson || 0;
        setBasePrice(bPrice);
        if (bPrice > (pkg.pricePerPerson || 0)) {
          setDiscountType("flat");
          setDiscountValue(bPrice - (pkg.pricePerPerson || 0));
        } else {
          setDiscountType("none");
          setDiscountValue(0);
        }
        setFaqs(pkg.faqs || []); setItinerary(pkg.itinerary || []);
        setGalleryImages(pkg.galleryImages || []); setMetaTitle(pkg.metaTitle || "");
        setMetaDescription(pkg.metaDescription || ""); setMetaKeywords(pkg.metaKeywords || "");
      }).catch(() => toast.error("Failed to load package")).finally(() => setFetching(false));
    } else { setFetching(false); }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      name, slug, packageCode, category, packageType, isFeatured, isTrending, imageUrl, thumbnailUrl,
      shortDescription, longDescription, destinationIds: selectedDestIds, destinationId: selectedDestIds[0] || null,
      stateId: stateId || null, countryId: countryId || null, duration, nights, pricePerPerson, originalPrice, discountPercent,
      inclusionIcons, inclusions, exclusions, importantNotes, highlights, cancellationPolicy, paymentPolicy, faqs, hotels: [], itinerary,
      galleryImages, metaTitle, metaDescription, metaKeywords, monthsToTravel
    };
    try {
      if (isEdit) await customFetch(`/api/admin/packages/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await customFetch("/api/admin/packages", { method: "POST", body: JSON.stringify(payload) });
      toast.success(isEdit ? "Package updated!" : "Package created!");
      setLocation("/packages");
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const handleImgUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (s:string)=>void) => {
    const f = e.target.files?.[0]; if (!f) return;
    try { setter(await uploadMedia(f, "packages")); toast.success("Uploaded"); }
    catch { toast.error("Upload failed"); }
  };

  if (fetching) return <AdminLayout title="Packages"><div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-[#1B3A6B]" /></div></AdminLayout>;

  return (
    <AdminLayout title={isEdit ? "Edit Package" : "Create Package"} subtitle={name}>
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-6 pb-20">
        <div className="flex justify-between items-center sticky top-0 z-10 bg-gray-50/90 backdrop-blur py-4 mb-2">
          <button type="button" onClick={() => setLocation("/packages")} className="text-gray-500 hover:text-gray-900 font-medium text-sm flex items-center gap-1"><X className="w-4 h-4"/> Cancel</button>
          <button type="submit" disabled={loading} className="flex items-center gap-2 bg-[#1B3A6B] text-white px-6 py-2.5 rounded-xl font-bold shadow hover:shadow-lg transition-all disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} {isEdit ? "Update" : "Save"}
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

        {/* TAB 1: Overview */}
        {activeTab === "Overview" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Package Name</label><input required value={name} onChange={e=>setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1B3A6B] outline-none" /></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Package Code</label><input readOnly value={packageCode} placeholder="Auto-generated on save" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none bg-gray-50 text-gray-500 font-mono font-bold" /></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Slug</label><input value={slug} onChange={e=>setSlug(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1B3A6B] outline-none bg-gray-50" /></div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                <input list="categories-list" value={category} onChange={e=>setCategory(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1B3A6B] outline-none" placeholder="Search or select category..." />
                <datalist id="categories-list">
                  <option value="Honeymoon" />
                  <option value="Adventure" />
                  <option value="Family" />
                  <option value="Religious" />
                  <option value="Wildlife" />
                  <option value="Leisure" />
                  <option value="Weekend" />
                  <option value="Corporate" />
                  <option value="Luxury" />
                  <option value="Group Tours" />
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cover Image</label>
                <div className="flex gap-2">
                  <input value={imageUrl} onChange={e=>setImageUrl(e.target.value)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1B3A6B] outline-none" />
                  <label className="bg-gray-100 px-4 py-3 rounded-xl cursor-pointer hover:bg-gray-200"><Upload className="w-5 h-5 text-gray-600"/><input type="file" className="hidden" onChange={e=>handleImgUpload(e, setImageUrl)}/></label>
                </div>
              </div>
              <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Short Description</label><textarea value={shortDescription} onChange={e=>setShortDescription(e.target.value)} rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1B3A6B] outline-none" /></div>
              <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Long Description</label><textarea value={longDescription} onChange={e=>setLongDescription(e.target.value)} rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1B3A6B] outline-none" /></div>
              <div className="col-span-2 bg-blue-50/30 p-5 rounded-2xl border border-blue-100">
                <label className="block text-xs font-bold text-blue-700 uppercase mb-2">Tour Highlights</label>
                <textarea
                  value={highlights.join("\n")}
                  onChange={e=>setHighlights(e.target.value.split("\n").filter(Boolean))}
                  rows={4}
                  placeholder="Add highlights (one per line)&#10;Example:&#10;Visit iconic landmarks&#10;Experience local culture&#10;Enjoy premium accommodations"
                  className="w-full p-3 rounded-xl border border-blue-200 outline-none text-sm focus:border-[#1B3A6B]"
                />
                <p className="mt-2 text-xs text-blue-600">These highlights will appear on the package details page as key selling points.</p>
              </div>
              <div className="col-span-2 flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isFeatured} onChange={e=>setIsFeatured(e.target.checked)} className="w-5 h-5" /> <span className="font-bold text-sm text-gray-700">Featured Package</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isTrending} onChange={e=>setIsTrending(e.target.checked)} className="w-5 h-5" /> <span className="font-bold text-sm text-gray-700">Trending Now</span></label>
              </div>

              {/* Months to Travel Selector */}
              <div className="col-span-2 bg-gray-50/50 p-5 rounded-2xl border border-gray-100 mt-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Best Months to Travel</label>
                <div className="flex flex-wrap gap-2">
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(month => {
                    const isSel = monthsToTravel.includes(month);
                    return (
                      <button
                        type="button"
                        key={month}
                        onClick={() => {
                          setMonthsToTravel(isSel 
                            ? monthsToTravel.filter(m => m !== month)
                            : [...monthsToTravel, month]
                          );
                        }}
                        className={`text-xs px-4 py-2 rounded-xl font-bold border transition-colors ${
                          isSel 
                            ? "bg-[#1B3A6B] text-white border-[#1B3A6B]" 
                            : "bg-white text-gray-500 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                        }`}
                      >
                        {month}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Destinations & Pricing */}
        {activeTab === "Destinations & Pricing" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Country</label>
                <select value={countryId} onChange={e=>{setCountryId(Number(e.target.value)); setStateId(""); setSelectedDestIds([]);}} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#1B3A6B]">
                  <option value="">Select Country</option>
                  {allCountries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">State</label>
                <select value={stateId} onChange={e=>{setStateId(Number(e.target.value)); setSelectedDestIds([]);}} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#1B3A6B]" disabled={!countryId}>
                  <option value="">Select State</option>
                  {allStates.filter(s => s.countryId === countryId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase">Destinations (Cities)</label>
                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input value={destSearch} onChange={e=>setDestSearch(e.target.value)} placeholder="Search cities..." className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#1B3A6B]" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 bg-gray-50 border border-gray-100 rounded-xl">
                  {allDests.filter(d => (!stateId || d.stateId === stateId) && d.name.toLowerCase().includes(destSearch.toLowerCase())).map(d => {
                    const sel = selectedDestIds.includes(d.id);
                    return <button type="button" key={d.id} onClick={() => setSelectedDestIds(sel ? selectedDestIds.filter(x=>x!==d.id) : [...selectedDestIds, d.id])} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${sel ? "bg-[#1B3A6B] text-white shadow-md shadow-[#1B3A6B]/20" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100 hover:border-gray-300"}`}>{d.name}</button>
                  })}
                  {allDests.filter(d => (!stateId || d.stateId === stateId) && d.name.toLowerCase().includes(destSearch.toLowerCase())).length === 0 && (
                    <span className="text-xs text-gray-400 p-2">No destinations found.</span>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duration (Days)</label><input type="number" value={duration} onChange={e=>setDuration(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" /></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nights</label><input type="number" value={nights} onChange={e=>setNights(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" /></div>
              
              <div className="col-span-2 border-t border-gray-100 pt-5 mt-2">
                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-600"/> Pricing & Discounts</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Base Price (₹)</label>
                    <input type="number" value={basePrice || ""} onChange={e=>setBasePrice(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none font-bold text-lg text-gray-800 focus:border-[#1B3A6B]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Discount Type</label>
                    <select value={discountType} onChange={e=>setDiscountType(e.target.value as any)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none bg-white focus:border-[#1B3A6B]">
                      <option value="none">No Discount</option>
                      <option value="percent">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Discount Value</label>
                    <input type="number" value={discountValue || ""} onChange={e=>setDiscountValue(Number(e.target.value))} disabled={discountType === "none"} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none disabled:bg-gray-50 disabled:text-gray-400 focus:border-[#1B3A6B]" />
                  </div>
                </div>
                
                <div className="mt-5 p-5 bg-gradient-to-r from-green-50 to-emerald-50/30 rounded-2xl border border-green-100 flex justify-between items-center shadow-sm">
                  <div>
                    <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-0.5">Final Selling Price (Auto-Calculated)</p>
                    <p className="text-3xl font-black text-green-800">₹{pricePerPerson.toLocaleString("en-IN")}</p>
                    {discountPercent > 0 && <p className="text-xs text-green-600 font-bold mt-1 inline-flex items-center gap-1 bg-green-100/50 px-2 py-0.5 rounded-md"><Tag className="w-3 h-3"/> {discountPercent}% OFF applied</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Original Strike Price</p>
                    <p className="text-xl font-bold text-gray-400 line-through">₹{originalPrice.toLocaleString("en-IN")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Pricing Calendar */}
        {activeTab === "Pricing Calendar" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
            {!isEdit ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                <AlertCircle className="w-12 h-12 text-[#1B3A6B] mb-2" />
                <p className="font-bold text-base">Save the Package First</p>
                <p className="text-sm mt-1 text-center max-w-md">You need to save this package overview and basic details first before you can configure dynamic rates and inventory on the calendar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
                
                {/* Left Side: Calendar View */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-950 text-base flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#1B3A6B]" /> Rate &amp; Inventory Calendar
                    </h3>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                        className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        &larr; Prev
                      </button>
                      <span className="font-bold text-gray-800 text-sm font-mono min-w-28 text-center uppercase tracking-wider">
                        {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                        className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Next &rarr;
                      </button>
                    </div>
                  </div>

                  {/* Calendar grid */}
                  <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                    {/* Weekdays header */}
                    <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200 text-center py-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      <div>Sun</div>
                      <div>Mon</div>
                      <div>Tue</div>
                      <div>Wed</div>
                      <div>Thu</div>
                      <div>Fri</div>
                      <div>Sat</div>
                    </div>

                    {/* Days grid */}
                    <div className="grid grid-cols-7 divide-x divide-y divide-gray-150 bg-gray-50/20">
                      {monthDays.map((dayDate, idx) => {
                        const isCurrentMonth = dayDate.getMonth() === currentMonth.getMonth();
                        const yyyy = dayDate.getFullYear();
                        const mm = String(dayDate.getMonth() + 1).padStart(2, "0");
                        const dd = String(dayDate.getDate()).padStart(2, "0");
                        const dateStr = `${yyyy}-${mm}-${dd}`;

                        const rule = calendarRates.find(r => r.date === dateStr || (typeof r.date === "string" && r.date.split("T")[0] === dateStr));
                        const isSelected = selectedCalendarDates.includes(dateStr);

                        // Calculate price if rule is active
                        let finalPrice = basePrice;
                        let isBlackout = false;
                        let isPriceOnReq = false;
                        let priceModText = "";
                        let discText = "";

                        if (rule) {
                          if (rule.rateType === "blackout") isBlackout = true;
                          else if (rule.rateType === "price-on-request") isPriceOnReq = true;
                          else {
                            const mod = Number(rule.priceModifierValue) || 0;
                            if (rule.priceModifierType === "fixed") {
                              finalPrice = mod;
                              priceModText = `₹${mod}`;
                            } else if (rule.priceModifierType === "percentage") {
                              finalPrice = basePrice * (1 + mod / 100);
                              priceModText = `${mod >= 0 ? "+" : ""}${mod}%`;
                            } else if (rule.priceModifierType === "value") {
                              finalPrice = basePrice + mod;
                              priceModText = `${mod >= 0 ? "+" : ""}₹${mod}`;
                            }

                            const disc = Number(rule.discountValue) || 0;
                            if (rule.discountType === "percentage") {
                              finalPrice = finalPrice * (1 - disc / 100);
                              discText = `${disc}% OFF`;
                            } else if (rule.discountType === "flat") {
                              finalPrice = Math.max(0, finalPrice - disc);
                              discText = `-₹${disc}`;
                            }
                          }
                        }

                        return (
                          <div
                            key={idx}
                            onMouseDown={() => isCurrentMonth && handleDayMouseDown(dateStr)}
                            onMouseEnter={() => isCurrentMonth && handleDayMouseEnter(dateStr)}
                            onMouseUp={handleDayMouseUp}
                            className={`min-h-[90px] p-2 flex flex-col justify-between transition-all select-none relative ${
                              !isCurrentMonth 
                                ? "bg-gray-150/40 text-gray-300 pointer-events-none cursor-default" 
                                : "cursor-pointer hover:bg-slate-50"
                            } ${
                              isSelected 
                                ? "bg-blue-50/70 border-2 border-blue-500/80 -m-0.5 z-10 rounded-lg shadow-sm" 
                                : ""
                            }`}
                          >
                            {/* Day number */}
                            <div className="flex justify-between items-start">
                              <span className={`text-xs font-bold ${
                                isSelected 
                                  ? "text-[#1B3A6B] bg-blue-100/80 rounded-full h-5 w-5 flex items-center justify-center" 
                                  : isCurrentMonth ? "text-gray-700" : "text-gray-300"
                              }`}>
                                {dayDate.getDate()}
                              </span>
                              {/* Badge for rate type */}
                              {isCurrentMonth && rule && (
                                <span className={`text-[8px] font-black uppercase px-1 rounded-sm border ${
                                  isBlackout 
                                    ? "bg-red-100 text-red-700 border-red-200" 
                                    : isPriceOnReq
                                    ? "bg-amber-100 text-amber-700 border-amber-200"
                                    : rule.rateType === "peak"
                                    ? "bg-orange-100 text-orange-700 border-orange-200"
                                    : rule.rateType === "off-season"
                                    ? "bg-cyan-100 text-cyan-700 border-cyan-200"
                                    : "bg-emerald-100 text-emerald-700 border-emerald-200"
                                }`}>
                                  {rule.rateType === "off-season" ? "OFF" : rule.rateType}
                                </span>
                              )}
                            </div>

                            {/* Price and Details */}
                            {isCurrentMonth && (
                              <div className="mt-2 text-right">
                                {isBlackout ? (
                                  <p className="text-[10px] font-black text-red-650 uppercase tracking-widest line-through">SOLD OUT</p>
                                ) : isPriceOnReq ? (
                                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">ON REQUEST</p>
                                ) : (
                                  <div className="space-y-0.5">
                                    <p className="text-xs font-black text-gray-900">
                                      ₹{Math.round(finalPrice).toLocaleString("en-IN")}
                                    </p>
                                    {priceModText && (
                                      <p className="text-[9px] text-gray-400 font-semibold leading-none">{priceModText}</p>
                                    )}
                                    {discText && (
                                      <p className="text-[9px] text-emerald-600 font-bold leading-none bg-emerald-50 inline-block px-1 rounded-sm border border-emerald-100">{discText}</p>
                                    )}
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

                {/* Right Side: Configuration Panel */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-5 h-fit shadow-xs">
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-800 uppercase tracking-wide mb-1 flex items-center gap-1.5"><Sliders className="w-4 h-4 text-[#1B3A6B]"/> Rate Overrides</h4>
                    <p className="text-[11px] text-gray-500">Drag select dates on the calendar or enter manually to set custom seasonal pricing rules.</p>
                  </div>

                  {/* Manual Range Pickers */}
                  <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-gray-150 shadow-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Start Date</label>
                      <input 
                        type="date" 
                        value={startDateInput} 
                        onChange={e => {
                          setStartDateInput(e.target.value);
                          if (e.target.value && endDateInput) {
                            setSelectedCalendarDates(generateDateRange(e.target.value, endDateInput));
                          }
                        }} 
                        className="w-full text-xs p-2 rounded-lg border border-gray-200 focus:border-[#1B3A6B] outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">End Date</label>
                      <input 
                        type="date" 
                        value={endDateInput} 
                        onChange={e => {
                          setEndDateInput(e.target.value);
                          if (startDateInput && e.target.value) {
                            setSelectedCalendarDates(generateDateRange(startDateInput, e.target.value));
                          }
                        }} 
                        className="w-full text-xs p-2 rounded-lg border border-gray-200 focus:border-[#1B3A6B] outline-none" 
                      />
                    </div>
                    {selectedCalendarDates.length > 0 && (
                      <div className="col-span-2 text-[10px] font-bold text-blue-600 bg-blue-50/50 p-1.5 rounded-md text-center border border-blue-100 mt-1">
                        Selected {selectedCalendarDates.length} days
                      </div>
                    )}
                  </div>

                  {/* Bulk Toggles */}
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

                  {/* Settings form */}
                  <div className="space-y-4 pt-2 border-t border-gray-200">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Rate Season Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "peak", label: "Peak Season 🟥" },
                          { value: "off-season", label: "Off-Season 🟦" },
                          { value: "regular", label: "Regular 🟩" },
                          { value: "blackout", label: "Blackout ⬛" },
                          { value: "price-on-request", label: "On Request 🟨" }
                        ].map(item => (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => setCalRateType(item.value as any)}
                            className={`text-[11px] font-bold py-2 rounded-xl text-center border transition-all ${
                              calRateType === item.value 
                                ? "bg-[#1B3A6B] text-white border-[#1B3A6B] shadow-md shadow-[#1B3A6B]/20" 
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                            } ${item.value === "price-on-request" ? "col-span-2" : ""}`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {calRateType !== "blackout" && calRateType !== "price-on-request" && (
                      <>
                        {/* Modifier settings */}
                        <div className="bg-white p-3 rounded-xl border border-gray-150 space-y-3 shadow-xs">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Modifier Type</label>
                            <select
                              value={calPriceModType}
                              onChange={e => setCalPriceModType(e.target.value as any)}
                              className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white focus:border-[#1B3A6B] outline-none"
                            >
                              <option value="fixed">Set Fixed price (₹)</option>
                              <option value="percentage">Adjust by percent (+/- %)</option>
                              <option value="value">Adjust by flat value (+/- ₹)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Modifier Value</label>
                            <input
                              type="number"
                              value={calPriceModVal || ""}
                              onChange={e => setCalPriceModVal(Number(e.target.value))}
                              placeholder={calPriceModType === "fixed" ? "e.g. 1200" : "e.g. +20 or -15"}
                              className="w-full text-xs p-2 rounded-lg border border-gray-200 focus:border-[#1B3A6B] outline-none"
                            />
                          </div>
                        </div>

                        {/* Discount overlays */}
                        <div className="bg-white p-3 rounded-xl border border-gray-150 space-y-3 shadow-xs">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Discount Overlay</label>
                            <select
                              value={calDiscountType}
                              onChange={e => setCalDiscountType(e.target.value as any)}
                              className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white focus:border-[#1B3A6B] outline-none"
                            >
                              <option value="none">No Discount</option>
                              <option value="percentage">Discount Percent (%)</option>
                              <option value="flat">Discount Flat (₹)</option>
                            </select>
                          </div>
                          {calDiscountType !== "none" && (
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Discount Value</label>
                              <input
                                type="number"
                                value={calDiscountVal || ""}
                                onChange={e => setCalDiscountVal(Number(e.target.value))}
                                placeholder={calDiscountType === "percentage" ? "e.g. 10%" : "e.g. 200"}
                                className="w-full text-xs p-2 rounded-lg border border-gray-200 focus:border-[#1B3A6B] outline-none"
                              />
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <button
                      type="button"
                      disabled={selectedCalendarDates.length === 0}
                      onClick={handleCalendarRateSubmit}
                      className="w-full bg-[#1B3A6B] text-white py-3 rounded-xl font-bold hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider text-xs shadow-md"
                    >
                      Update selected dates
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Itinerary */}
        {activeTab === "Itinerary" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h3 className="font-bold text-gray-900 uppercase tracking-widest text-sm">Day-Wise Itinerary</h3>
              <button type="button" onClick={() => setItinerary([...itinerary, { day: itinerary.length+1, title: "", description: "", location: "", accommodation: "", meals: {}, attractionIds: [], diningStops: [], activities: [] }])} className="text-[#1B3A6B] font-bold text-sm flex items-center gap-1 hover:underline"><Plus className="w-4 h-4"/> Add Day</button>
            </div>
            <div className="space-y-4">
              {itinerary.map((day, idx) => {
                const dayLocationNames = (day.location || "")
                  .split(/[,;&]/)
                  .map((s: string) => s.trim().toLowerCase())
                  .filter(Boolean);
                const dayDestIds = allDests
                  .filter(d => dayLocationNames.includes(d.name.toLowerCase()))
                  .map(d => d.id);
                const activeDestIds = dayDestIds.length > 0 ? dayDestIds : selectedDestIds;

                return (
                  <div key={idx} className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <span className="bg-[#1B3A6B] text-white px-3 py-1 rounded-lg font-bold text-xs">DAY {day.day}</span>
                      <button type="button" onClick={() => setItinerary(itinerary.filter((_,i) => i!==idx))} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input value={day.title} onChange={e => { const ni=[...itinerary]; ni[idx].title=e.target.value; setItinerary(ni); }} placeholder="Day Title (e.g. Arrival in Manali)" className="col-span-2 px-3 py-2 rounded-lg border outline-none font-bold" />
                      <textarea value={day.description} onChange={e => { const ni=[...itinerary]; ni[idx].description=e.target.value; setItinerary(ni); }} placeholder="Detailed description..." rows={2} className="col-span-2 px-3 py-2 rounded-lg border outline-none text-sm" />
                      
                      {/* Location & Accommodation & Transport */}
                      <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Location</label>
                          <input list={`locations-${idx}`} value={day.location} onChange={e => { const ni=[...itinerary]; ni[idx].location=e.target.value; setItinerary(ni); }} placeholder="Location (City)" className="w-full px-3 py-2 rounded-lg border outline-none text-sm bg-white" />
                          <datalist id={`locations-${idx}`}>
                            {allDests.map(d => <option key={d.id} value={d.name} />)}
                          </datalist>
                        </div>
                        
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Accommodation</label>
                          <input list={`hotels-${idx}`} value={day.accommodation} onChange={e => { const ni=[...itinerary]; ni[idx].accommodation=e.target.value; setItinerary(ni); }} placeholder="Search or type Accommodation..." className="w-full px-3 py-2 rounded-lg border outline-none text-sm bg-white" />
                          <datalist id={`hotels-${idx}`}>
                            <option value="No Accommodation" />
                            <option value="Overnight Journey" />
                            {(() => {
                              const filteredHotels = activeDestIds.length > 0
                                ? allGlobalHotels.filter(h => activeDestIds.includes(h.destinationId))
                                : allGlobalHotels;
                              return filteredHotels.map((h, hidx) => (
                                <option key={hidx} value={h.name}>
                                  {h.name} ({allDests.find(d => d.id === h.destinationId)?.name || 'Unknown'})
                                </option>
                              ));
                            })()}
                          </datalist>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Transport / Vehicle</label>
                          <input list={`transports-${idx}`} value={day.transport || ""} onChange={e => { const ni=[...itinerary]; ni[idx].transport=e.target.value; setItinerary(ni); }} placeholder="Search or type Transport..." className="w-full px-3 py-2 rounded-lg border outline-none text-sm bg-white" />
                          <datalist id={`transports-${idx}`}>
                            <option value="No Transport" />
                            <option value="Self Drive" />
                            {(() => {
                              const filteredTransports = activeDestIds.length > 0
                                ? allGlobalTransports.filter(t => activeDestIds.includes(t.destinationId))
                                : allGlobalTransports;
                              return filteredTransports.map((t, tidx) => (
                                <option key={tidx} value={t.name}>
                                  {t.name} ({t.type} • {t.seatingCapacity} Pax)
                                </option>
                              ));
                            })()}
                          </datalist>
                        </div>
                      </div>
                    
                    {/* Meals Selection */}
                    <div className="col-span-2">
                      <p className="text-xs font-bold text-gray-500 mb-1">Meals Provided</p>
                        <div className="flex flex-wrap gap-2">
                          {["Breakfast", "Lunch", "Dinner", "Snack"].map(meal => {
                            const currentMeals = Array.isArray(day.meals)
                              ? day.meals
                              : Object.entries(day.meals || {})
                                  .filter(([, entry]) => typeof entry !== 'undefined' && (entry as any).included !== false)
                                  .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1));
                            const isSel = currentMeals.includes(meal);
                            return (
                              <button type="button" key={meal} onClick={() => {
                                const ni = [...itinerary];
                                const updatedMeals = isSel
                                  ? currentMeals.filter((m) => m !== meal)
                                  : [...currentMeals, meal];
                                ni[idx].meals = updatedMeals;
                                setItinerary(ni);
                              }} className={`text-xs px-3 py-1 rounded-full font-bold border transition-colors ${isSel ? "bg-[#1B3A6B] text-white border-[#1B3A6B]" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}>
                                {meal}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                    
                    {/* Attractions Selection - pinned from CMS */}
                    <div className="col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-gray-500">
                          Attractions &amp; Sightseeing
                          {dayDestIds.length > 0 && (
                            <span className="text-[10px] text-blue-600 font-semibold normal-case ml-1.5 bg-blue-50 px-1.5 py-0.5 rounded">
                              Filtered by {day.location}
                            </span>
                          )}
                        </p>
                        <span className="text-[10px] text-gray-400">Click to select/deselect</span>
                      </div>
                      {/* Selected attractions pinned at top */}
                      {(day.attractionIds || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 p-2 bg-[#1B3A6B]/5 rounded-t-lg border border-b-0 border-[#1B3A6B]/20 min-h-[36px]">
                          {(day.attractionIds || []).map(attrId => {
                            const attr = allAttractions.find(a => a.id === attrId);
                            if (!attr) return null;
                            return (
                              <button type="button" key={attr.id} onClick={() => {
                                const ni=[...itinerary];
                                ni[idx].attractionIds = (ni[idx].attractionIds||[]).filter(id=>id!==attr.id);
                                setItinerary(ni);
                              }} className="text-[10px] px-2 py-1 rounded-full font-bold border bg-[#1B3A6B] text-white border-[#1B3A6B] flex items-center gap-1">
                                {attr.name} ✕
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {/* All available attractions from CMS */}
                      <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-b-lg border min-h-[42px] max-h-32 overflow-y-auto">
                        {(() => {
                          const filtered = activeDestIds.length > 0
                            ? allAttractions.filter(a => activeDestIds.includes(a.destinationId))
                            : allAttractions;
                          if (filtered.length === 0 && activeDestIds.length > 0) {
                            return <span className="text-xs text-gray-400 p-1">No attractions found for selected destinations. Add them in the Attractions page.</span>;
                          }
                          if (filtered.length === 0) {
                            return <span className="text-xs text-gray-400 p-1">No attractions in CMS yet. Add them in the Attractions page.</span>;
                          }
                          return filtered.map(attr => {
                            const isSel = day.attractionIds?.includes(attr.id);
                            if (isSel) return null; // already shown above
                            return (
                              <button type="button" key={attr.id} onClick={() => {
                                const ni=[...itinerary];
                                ni[idx].attractionIds = [...(ni[idx].attractionIds||[]), attr.id];
                                setItinerary(ni);
                              }} className="text-[9.5px] px-2 py-0.5 rounded-md font-semibold border bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition">
                                {attr.name}
                              </button>
                            );
                          });
                        })()}
                        {!activeDestIds.length && allAttractions.length > 0 && (
                          <div className="w-full mt-1 pt-1 border-t border-gray-100">
                            <span className="text-[9px] text-amber-600 font-bold">⚠ Select city above to filter attractions by location</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Activities Selection — strictly separate from Attractions */}
                    <div className="col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-green-700">Activities <span className="font-normal text-gray-400 normal-case">(separate from Attractions above)</span></p>
                        <span className="text-[10px] text-gray-400">Click selected to remove</span>
                      </div>
                      {/* Selected activities */}
                      <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-lg border min-h-[42px]">
                        {(day.activities || []).map((activity, activityIdx) => (
                          <button key={`${idx}-activity-${activityIdx}`} type="button" onClick={() => {
                            const ni = [...itinerary];
                            ni[idx].activities = (ni[idx].activities || []).filter((a: string) => a !== activity);
                            setItinerary(ni);
                          }} className="text-[10px] px-2 py-1 rounded-full font-bold border bg-green-600 text-white border-green-600 flex items-center gap-1">
                            {activity} ✕
                          </button>
                        ))}
                        {!day.activities?.length && <span className="text-xs text-gray-400 p-1">No activities selected. Add from suggestions below or type a custom one.</span>}
                      </div>
                      {/* Custom activity input + CMS suggestions */}
                      <div className="mt-2 space-y-2">
                        <div className="flex gap-2">
                          <input
                            value={activityInputs[idx] || ""}
                            onChange={(e) => setActivityInputs({ ...activityInputs, [idx]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const value = (activityInputs[idx] || "").trim();
                                if (!value) return;
                                const ni = [...itinerary];
                                ni[idx].activities = Array.from(new Set([...(ni[idx].activities || []), value]));
                                setItinerary(ni);
                                setActivityInputs({ ...activityInputs, [idx]: "" });
                              }
                            }}
                            placeholder="Type a custom activity and press Enter or click Add"
                            className="flex-1 px-3 py-2 rounded-lg border outline-none text-sm bg-white focus:border-green-400"
                          />
                          <button type="button" onClick={() => {
                            const value = (activityInputs[idx] || "").trim();
                            if (!value) return;
                            const ni = [...itinerary];
                            ni[idx].activities = Array.from(new Set([...(ni[idx].activities || []), value]));
                            setItinerary(ni);
                            setActivityInputs({ ...activityInputs, [idx]: "" });
                          }} className="px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition whitespace-nowrap">+ Add</button>
                        </div>
                        {/* CMS Activity suggestions */}
                        {(() => {
                          const filteredSuggestions = activeDestIds.length > 0
                            ? (() => {
                                const cmsNames = allCmsActivities
                                  .filter(a => a.isActive !== false && activeDestIds.includes(a.destinationId))
                                  .map(a => String(a.name || a.title || "").trim())
                                  .filter(Boolean);
                                const attrNames = allAttractions
                                  .filter(a => activeDestIds.includes(a.destinationId))
                                  .flatMap(a => Array.isArray(a.activities) ? a.activities.map((item: any) => String(item).trim()) : []);
                                return Array.from(new Set([...cmsNames, ...attrNames].map(item => String(item).trim()).filter(Boolean)));
                              })()
                            : allActivities;

                          if (filteredSuggestions.length === 0) return null;

                          return (
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                <span>
                                  Suggestions from CMS ({filteredSuggestions.length})
                                  {dayDestIds.length > 0 && (
                                    <span className="text-green-600 normal-case ml-1.5 bg-green-50 px-1.5 py-0.5 rounded font-semibold">
                                      Filtered by {day.location}
                                    </span>
                                  )}
                                </span>
                              </p>
                              <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-lg border max-h-28 overflow-y-auto">
                                {filteredSuggestions.map((activity) => {
                                  const isSel = (day.activities || []).includes(activity);
                                  if (isSel) return null;
                                  return (
                                    <button
                                      key={`${idx}-suggest-${activity}`}
                                      type="button"
                                      onClick={() => {
                                        const ni = [...itinerary];
                                        ni[idx].activities = [...new Set([...(ni[idx].activities || []), activity])];
                                        setItinerary(ni);
                                      }}
                                      className="text-[9.5px] px-2 py-0.5 rounded-md font-semibold border bg-white text-gray-700 border-gray-200 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition"
                                    >
                                      {activity}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Dining Stops Selection */}
                    <div className="col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-orange-700">Enroute Dining Stops</p>
                        <span className="text-[10px] text-gray-400">Orange = selected</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-lg border min-h-[42px] max-h-28 overflow-y-auto">
                        {(() => {
                          const enrouteDining = allDining.filter(d => d.isEnrouteStop);
                          const filtered = selectedDestIds.length > 0
                            ? enrouteDining.filter(d => selectedDestIds.includes(d.destinationId))
                            : enrouteDining;
                          if (filtered.length === 0 && enrouteDining.length === 0) {
                            return <span className="text-xs text-gray-400 p-1">No enroute dining points in CMS. Add them in the Dining Points page.</span>;
                          }
                          if (filtered.length === 0 && selectedDestIds.length > 0) {
                            return <span className="text-xs text-gray-400 p-1">No enroute dining for selected destinations. Add them in the Dining Points page.</span>;
                          }
                          return filtered.map(d => {
                            const stops = day.diningStops || [];
                            const isSel = stops.some(s => s.diningPointId === d.id);
                            const destName = allDests.find(dest => dest.id === d.destinationId)?.name;
                            return (
                              <button type="button" key={d.id} onClick={() => {
                                const ni=[...itinerary];
                                if(isSel) ni[idx].diningStops = stops.filter(s=>s.diningPointId!==d.id);
                                else ni[idx].diningStops = [...stops, { diningPointId: d.id, mealType: "lunch" }];
                                setItinerary(ni);
                              }} className={`text-[9.5px] px-2 py-0.5 rounded-md font-semibold border transition ${isSel ? "bg-orange-500 text-white border-orange-500":"bg-white text-gray-700 border-gray-200 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700"}`}>
                                🍽️ {d.name}{destName ? ` (${destName})` : ''}
                              </button>
                            );
                          });
                        })()}
                        {!selectedDestIds.length && allDining.filter(d => d.isEnrouteStop).length > 0 && (
                          <div className="w-full mt-1 pt-1 border-t border-gray-100">
                            <span className="text-[9px] text-amber-600 font-bold">⚠ Select destinations in Tab 2 to filter by location</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Basic Meals String (Legacy - Removed to favor structured UI above) */}
                  </div>
                </div>
              );
            })}
              {!itinerary.length && <p className="text-gray-400 text-sm text-center py-6">No days added yet.</p>}
            </div>
          </div>
        )}

        {/* TAB 4: Gallery */}
        {activeTab === "Gallery" && (
           <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-gray-900 uppercase tracking-widest text-sm">Package Gallery Images</h3>
               <label className="bg-[#1B3A6B] text-white px-4 py-2 rounded-xl font-bold text-sm cursor-pointer hover:bg-[#2a519b] transition-colors flex items-center gap-2">
                 <Upload className="w-4 h-4"/> Add Photos
                 <input type="file" multiple accept="image/*" className="hidden" onChange={async (e) => {
                   const files = Array.from(e.target.files || []);
                   if (!files.length) return;
                   const toastId = toast.loading(`Uploading ${files.length} images...`);
                   try {
                     const urls = await Promise.all(files.map(f => uploadMedia(f, "packages")));
                     setGalleryImages([...galleryImages, ...urls]);
                     toast.success(`Successfully uploaded ${urls.length} images`, { id: toastId });
                   } catch { toast.error("Failed to upload some images", { id: toastId }); }
                 }}/>
               </label>
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
               {galleryImages.map((url, idx) => (
                 <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-200">
                   <img src={url} alt="" className="w-full h-full object-cover" />
                   <button type="button" onClick={() => setGalleryImages(galleryImages.filter((_, i) => i !== idx))} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-sm">
                     <Trash2 className="w-6 h-6 text-red-400 hover:text-red-500 transition-colors"/>
                   </button>
                 </div>
               ))}
               {!galleryImages.length && (
                 <div className="col-span-full border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center text-gray-400 flex flex-col items-center bg-gray-50/50">
                   <ImageIcon className="w-12 h-12 mb-3 opacity-20 text-[#1B3A6B]"/>
                   <p className="font-bold text-gray-500">No gallery images yet</p>
                   <p className="text-sm mt-1">Upload multiple high-quality photos to showcase this package</p>
                 </div>
               )}
             </div>
           </div>
        )}

        {/* TAB 5: Inclusions */}
        {activeTab === "Inclusions" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 uppercase tracking-widest text-sm mb-4">Inclusion Icons</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {INCLUSION_OPTIONS.map(opt => {
                  const sel = inclusionIcons.includes(opt.id);
                  const Icon = opt.icon;
                  return (
                    <button type="button" key={opt.id} onClick={() => setInclusionIcons(sel ? inclusionIcons.filter(i=>i!==opt.id) : [...inclusionIcons, opt.id])}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${sel ? "bg-[#1B3A6B] text-white border-[#1B3A6B]" : "bg-gray-50 text-gray-500 hover:bg-white"}`}>
                      <Icon className="w-5 h-5"/>
                      <span className="text-[10px] font-bold uppercase">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50/30 p-5 rounded-2xl border border-green-100"><label className="block text-xs font-bold text-green-700 uppercase mb-2">Inclusions</label><textarea value={inclusions.join("\n")} onChange={e=>setInclusions(e.target.value.split("\n").filter(Boolean))} rows={6} className="w-full p-3 rounded-xl border outline-none text-sm"/></div>
              <div className="bg-red-50/30 p-5 rounded-2xl border border-red-100"><label className="block text-xs font-bold text-red-700 uppercase mb-2">Exclusions</label><textarea value={exclusions.join("\n")} onChange={e=>setExclusions(e.target.value.split("\n").filter(Boolean))} rows={6} className="w-full p-3 rounded-xl border outline-none text-sm"/></div>
              <div className="col-span-2 bg-amber-50/30 p-5 rounded-2xl border border-amber-100"><label className="block text-xs font-bold text-amber-700 uppercase mb-2">Important Notes</label><textarea value={importantNotes.join("\n")} onChange={e=>setImportantNotes(e.target.value.split("\n").filter(Boolean))} rows={4} className="w-full p-3 rounded-xl border outline-none text-sm"/></div>
            </div>
          </div>
        )}

        {/* TAB 7: Policies, FAQs & SEO */}
        {activeTab === "Policies, FAQs & SEO" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
            <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-6">
               <h3 className="col-span-2 font-bold text-gray-900 uppercase tracking-widest text-sm mb-2">Policies</h3>
               <div className="col-span-2 md:col-span-1">
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cancellation Policy</label>
                 <textarea value={cancellationPolicy} onChange={e=>setCancellationPolicy(e.target.value)} rows={4} className="w-full p-3 rounded-xl border outline-none text-sm"/>
               </div>
               <div className="col-span-2 md:col-span-1">
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Payment Policy</label>
                 <textarea value={paymentPolicy} onChange={e=>setPaymentPolicy(e.target.value)} rows={4} className="w-full p-3 rounded-xl border outline-none text-sm"/>
               </div>
            </div>
            
            <div>
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-gray-900 uppercase tracking-widest text-sm">FAQs</h3>
               <button type="button" onClick={() => setFaqs([...faqs, { question: "", answer: "" }])} className="text-[#1B3A6B] font-bold text-sm"><Plus className="inline w-4 h-4"/> Add FAQ</button>
             </div>
             <div className="space-y-3">
               {faqs.map((faq, i) => (
                 <div key={i} className="p-3 border rounded-xl bg-gray-50">
                   <div className="flex justify-end mb-1"><button type="button" onClick={()=>setFaqs(faqs.filter((_,idx)=>idx!==i))} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3"/></button></div>
                   <input value={faq.question} onChange={e=>{const nf=[...faqs]; nf[i].question=e.target.value; setFaqs(nf);}} placeholder="Question?" className="w-full p-2 border rounded-lg text-sm outline-none mb-2"/>
                   <textarea value={faq.answer} onChange={e=>{const nf=[...faqs]; nf[i].answer=e.target.value; setFaqs(nf);}} placeholder="Answer..." rows={2} className="w-full p-2 border rounded-lg text-sm outline-none"/>
                 </div>
               ))}
               {!faqs.length && <p className="text-gray-400 text-sm text-center py-4">No FAQs added</p>}
             </div>
            </div>

            <div className="mt-8 border-t border-gray-100 pt-6">
               <h3 className="font-bold text-gray-900 uppercase tracking-widest text-sm mb-4">Search Engine Optimization (SEO)</h3>
               <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Meta Title</label><input value={metaTitle} onChange={e=>setMetaTitle(e.target.value)} placeholder="e.g. Best Manali Tour Package 4 Nights 5 Days | Sampooran Holidays" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#1B3A6B]" /></div>
                 <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Meta Description</label><textarea value={metaDescription} onChange={e=>setMetaDescription(e.target.value)} rows={2} placeholder="Brief compelling description for Google search results..." className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#1B3A6B]" /></div>
                 <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Meta Keywords (Comma separated)</label><input value={metaKeywords} onChange={e=>setMetaKeywords(e.target.value)} placeholder="manali tour, adventure package, rohtang pass trip" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#1B3A6B]" /></div>
               </div>
             </div>
          </div>
        )}

      </form>
    </AdminLayout>
  );
}
