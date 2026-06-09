import { useState, useEffect, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import AdminLayout from "../components/AdminLayout";
import { customFetch } from "../utils/api";
import { toast } from "sonner";
import { 
  Save, X, Plus, Trash2, Mountain, MapPin, Clock, Calendar, 
  Tag, Info, List, Shield, CheckCircle, HelpCircle, AlertCircle,
  Image as ImageIcon, DollarSign, Users, Layout as LayoutIcon, FileText,
  Plane, Hotel, Utensils, Camera, Car, Zap, ShieldCheck, Coffee, Loader2, Upload, Search
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
  "Overview", "Destinations & Pricing", "Itinerary", "Gallery", "Inclusions", "Policies, FAQs & SEO"
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
    const cmsActivityNames = allCmsActivities
      .filter((a) => a.isActive === true)
      .map((a) => String(a.name || a.title).trim())
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
      customFetch("/api/admin/hotels")
    ]).then(([dests, states, countries, attrs, activities, dinings, globalHotels]) => {
      setAllDests(Array.isArray(dests) ? dests : []);
      setAllStates(Array.isArray(states) ? states : []);
      setAllCountries(Array.isArray(countries) ? countries : []);
      setAllAttractions(Array.isArray(attrs) ? attrs : []);
      setAllCmsActivities(Array.isArray(activities) ? activities : []);
      setAllDining(Array.isArray(dinings) ? dinings : []);
      setAllGlobalHotels(Array.isArray(globalHotels) ? globalHotels : []);
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
        setName(pkg.name || ""); setSlug(pkg.slug || ""); setCategory(pkg.category || "Adventure");
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
      name, slug, category, packageType, isFeatured, isTrending, imageUrl, thumbnailUrl,
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

        {/* TAB 3: Itinerary */}
        {activeTab === "Itinerary" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h3 className="font-bold text-gray-900 uppercase tracking-widest text-sm">Day-Wise Itinerary</h3>
              <button type="button" onClick={() => setItinerary([...itinerary, { day: itinerary.length+1, title: "", description: "", location: "", accommodation: "", meals: {}, attractionIds: [], diningStops: [], activities: [] }])} className="text-[#1B3A6B] font-bold text-sm flex items-center gap-1 hover:underline"><Plus className="w-4 h-4"/> Add Day</button>
            </div>
            <div className="space-y-4">
              {itinerary.map((day, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <span className="bg-[#1B3A6B] text-white px-3 py-1 rounded-lg font-bold text-xs">DAY {day.day}</span>
                    <button type="button" onClick={() => setItinerary(itinerary.filter((_,i) => i!==idx))} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input value={day.title} onChange={e => { const ni=[...itinerary]; ni[idx].title=e.target.value; setItinerary(ni); }} placeholder="Day Title (e.g. Arrival in Manali)" className="col-span-2 px-3 py-2 rounded-lg border outline-none font-bold" />
                    <textarea value={day.description} onChange={e => { const ni=[...itinerary]; ni[idx].description=e.target.value; setItinerary(ni); }} placeholder="Detailed description..." rows={2} className="col-span-2 px-3 py-2 rounded-lg border outline-none text-sm" />
                    
                    {/* Location & Accommodation */}
                    <div>
                      <input list={`locations-${idx}`} value={day.location} onChange={e => { const ni=[...itinerary]; ni[idx].location=e.target.value; setItinerary(ni); }} placeholder="Location (City)" className="w-full px-3 py-2 rounded-lg border outline-none text-sm bg-white" />
                      <datalist id={`locations-${idx}`}>
                        {allDests.map(d => <option key={d.id} value={d.name} />)}
                      </datalist>
                    </div>
                    
                    <div>
                      <input list={`hotels-${idx}`} value={day.accommodation} onChange={e => { const ni=[...itinerary]; ni[idx].accommodation=e.target.value; setItinerary(ni); }} placeholder="Search or type Accommodation..." className="w-full px-3 py-2 rounded-lg border outline-none text-sm bg-white" />
                      <datalist id={`hotels-${idx}`}>
                        <option value="No Accommodation" />
                        <option value="Overnight Journey" />
                        {allGlobalHotels.map((h, hidx) => <option key={hidx} value={h.name}>{h.name} ({allDests.find(d => d.id === h.destinationId)?.name || 'Unknown'})</option>)}
                      </datalist>
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
                    
                    {/* Attractions Selection */}
                    <div className="col-span-2">
                      <p className="text-xs font-bold text-gray-500 mb-1">Attractions & Sightseeing</p>
                      <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-lg border min-h-[42px]">
                        {allAttractions.filter(a => selectedDestIds.includes(a.destinationId)).map(attr => {
                          const isSel = day.attractionIds?.includes(attr.id);
                          return <button type="button" key={attr.id} onClick={() => {
                            const ni=[...itinerary]; 
                            if(isSel) ni[idx].attractionIds = (ni[idx].attractionIds||[]).filter(id=>id!==attr.id);
                            else ni[idx].attractionIds = [...(ni[idx].attractionIds||[]), attr.id];
                            setItinerary(ni);
                          }} className={`text-[10px] px-2 py-1 rounded-full font-bold border ${isSel ? "bg-[#1B3A6B] text-white border-[#1B3A6B]":"bg-white text-gray-600 border-gray-200"}`}>{attr.name}</button>
                        })}
                        {!selectedDestIds.length && <span className="text-xs text-gray-400 p-1">Select destinations first (Tab 2)</span>}
                      </div>
                    </div>

                    {/* Activities Selection */}
                    <div className="col-span-2">
                      <p className="text-xs font-bold text-gray-500 mb-1">Activities</p>
                      <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-lg border min-h-[42px]">
                        {(day.activities || []).map((activity, activityIdx) => (
                          <button key={`${idx}-activity-${activityIdx}`} type="button" onClick={() => {
                            const ni = [...itinerary];
                            ni[idx].activities = (ni[idx].activities || []).filter((a: string) => a !== activity);
                            setItinerary(ni);
                          }} className="text-[10px] px-2 py-1 rounded-full font-bold border bg-[#1B3A6B] text-white border-[#1B3A6B]">
                            {activity}
                          </button>
                        ))}
                        {!day.activities?.length && <span className="text-xs text-gray-400 p-1">Tap a suggestion or add a custom activity.</span>}
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2">
                        <input
                          value={activityInputs[idx] || ""}
                          onChange={(e) => setActivityInputs({ ...activityInputs, [idx]: e.target.value })}
                          placeholder="Add a custom activity"
                          className="w-full px-3 py-2 rounded-lg border outline-none text-sm bg-white"
                        />
                        <div className="flex gap-2">
                          <button type="button" onClick={() => {
                            const value = (activityInputs[idx] || "").trim();
                            if (!value) return;
                            const ni = [...itinerary];
                            ni[idx].activities = Array.from(new Set([...(ni[idx].activities || []), value]));
                            setItinerary(ni);
                            setActivityInputs({ ...activityInputs, [idx]: "" });
                          }} className="px-3 py-2 rounded-lg bg-[#1B3A6B] text-white text-xs font-bold hover:bg-[#2a519b] transition">Add Activity</button>
                          {allActivities.slice(0, 10).map((activity) => {
                            const isSel = (day.activities || []).includes(activity);
                            return (
                              <button key={`${idx}-suggest-${activity}`} type="button" onClick={() => {
                                const ni = [...itinerary];
                                ni[idx].activities = isSel ? (ni[idx].activities || []).filter((a: string) => a !== activity) : [...new Set([...(ni[idx].activities || []), activity])];
                                setItinerary(ni);
                              }} className={`text-[10px] px-2 py-1 rounded-full font-bold border ${isSel ? "bg-[#1B3A6B] text-white border-[#1B3A6B]" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
                                {activity}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Dining Stops Selection */}
                    <div className="col-span-2">
                      <p className="text-xs font-bold text-gray-500 mb-1">Enroute Dining Stops</p>
                      <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-lg border min-h-[42px]">
                        {allDining.filter(d => selectedDestIds.includes(d.destinationId) && d.isEnrouteStop).map(d => {
                          const stops = day.diningStops || [];
                          const isSel = stops.some(s => s.diningPointId === d.id);
                          return <button type="button" key={d.id} onClick={() => {
                            const ni=[...itinerary];
                            if(isSel) ni[idx].diningStops = stops.filter(s=>s.diningPointId!==d.id);
                            else ni[idx].diningStops = [...stops, { diningPointId: d.id, mealType: "lunch" }];
                            setItinerary(ni);
                          }} className={`text-[10px] px-2 py-1 rounded-full font-bold border ${isSel ? "bg-orange-500 text-white border-orange-500":"bg-white text-gray-600 border-gray-200"}`}>🍽️ {d.name}</button>
                        })}
                        {!selectedDestIds.length && <span className="text-xs text-gray-400 p-1">Select destinations first (Tab 2)</span>}
                      </div>
                    </div>

                    {/* Basic Meals String (Legacy - Removed to favor structured UI above) */}
                  </div>
                </div>
              ))}
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
