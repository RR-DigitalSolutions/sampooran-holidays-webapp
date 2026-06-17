"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2, MapPin, Image as ImageIcon, Settings, Check,
  ChevronRight, ChevronLeft, ArrowRight, Star,
  AlertCircle, Plus, X, Plane, LogOut, BarChart3, BookOpen, Wallet, User
} from "lucide-react";
import { useVendorAuth, vendorAuthHeader } from "@/context/VendorAuthContext";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/api-url";
import { AmenitiesSelector } from "@/components/AmenitiesSelector";
import VendorSidebar from "@/components/VendorSidebar";

const API_BASE = getApiUrl();

const PROPERTY_TYPES = ["Hotel", "Resort", "Cottage", "Homestay", "Villa", "Camp", "Hostel", "Apartment", "Farmhouse", "Treehouse"];
const MEAL_PLANS = [
  { val: "EP", label: "Room Only", desc: "No meals included" },
  { val: "CP", label: "Breakfast", desc: "Complimentary breakfast" },
  { val: "MAP", label: "Half Board", desc: "Breakfast + Dinner" },
  { val: "AP", label: "All Inclusive", desc: "All meals included" },
];
const STARS = [1, 2, 3, 4, 5];

const STEPS = [
  { num: 1, label: "Basic Info", icon: Building2 },
  { num: 2, label: "Location", icon: MapPin },
  { num: 3, label: "Details", icon: Settings },
  { num: 4, label: "Photos", icon: ImageIcon },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, i) => (
        <div key={step.num} className="flex items-center flex-1">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all",
              current > step.num ? "bg-emerald-500 border-emerald-500 text-white" :
                current === step.num ? "border-[#1B3A6B] bg-[#1B3A6B] text-white" :
                  "border-gray-200 text-gray-300"
            )}>
              {current > step.num ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.num}
            </div>
            <span className={cn("text-xs font-semibold hidden sm:block", current >= step.num ? "text-gray-700" : "text-gray-300")}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn("flex-1 h-0.5 mx-3", current > step.num ? "bg-emerald-400" : "bg-gray-100")} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function AddPropertyPage() {
  const { vendor, token, isLoading } = useVendorAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([""]);

  useEffect(() => {
    if (!isLoading && !vendor) {
      router.replace("/partner/login?redirect=/partner/properties/new");
    }
  }, [vendor, isLoading, router]);

  const [form, setForm] = useState({
    name: "",
    type: "Hotel",
    starRating: 3,
    description: "",
    amenities: [] as string[],
    address: "",
    city: "",
    pincode: "",
    latitude: "",
    longitude: "",
    checkInTime: "14:00",
    checkOutTime: "12:00",
    mealPlan: "CP",
    bookingType: "INSTANT",
    breakfastIncluded: false,
    totalRooms: "",
    minPrice: "",
  });

  // ── GEO HIERARCHY STATE ───────────────────────────────────
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [selectedState, setSelectedState] = useState<any>(null);
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [customCity, setCustomCity] = useState("");
  const [useCustomCity, setUseCustomCity] = useState(false);

  // Load countries on mount
  useEffect(() => {
    fetch(`${API_BASE}/destinations/countries`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setCountries(Array.isArray(data) ? data : (data.countries || [])))
      .catch(() => { });
  }, []);

  // Load states when country changes
  useEffect(() => {
    if (!selectedCountry) { setStates([]); setSelectedState(null); setCities([]); setSelectedCity(null); return; }
    fetch(`${API_BASE}/destinations/states?countryId=${selectedCountry.id}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setStates(Array.isArray(data) ? data : (data.states || [])))
      .catch(() => { });
    setSelectedState(null); setCities([]); setSelectedCity(null);
  }, [selectedCountry]);

  // Load cities/destinations when state changes
  useEffect(() => {
    if (!selectedState) { setCities([]); setSelectedCity(null); return; }
    fetch(`${API_BASE}/destinations?stateId=${selectedState.id}&limit=200`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setCities(Array.isArray(data) ? data : (data.destinations || [])))
      .catch(() => { });
    setSelectedCity(null);
  }, [selectedState]);

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const validateStep = () => {
    if (step === 1 && (!form.name || !form.type)) { setError("Please fill in Property Name and Type."); return false; }
    if (step === 2) {
      if (!selectedCountry) { setError("Please select a Country."); return false; }
      if (!selectedState) { setError("Please select a State / Region."); return false; }
      if (!selectedCity && !useCustomCity) { setError("Please select or enter a City / Place."); return false; }
      if (useCustomCity && !customCity.trim()) { setError("Please enter your city name."); return false; }
      if (!form.address) { setError("Please fill in the full address."); return false; }
    }
    setError("");
    return true;
  };

  const handleNext = () => { if (validateStep()) setStep(s => Math.min(4, s + 1)); };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const images = imageUrls.filter(u => u.trim());
      const payload: any = {
        ...form,
        starRating: Number(form.starRating),
        totalRooms: form.totalRooms ? Number(form.totalRooms) : undefined,
        minPrice: form.minPrice ? Number(form.minPrice) : undefined,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
        images,
        // Geo hierarchy fields
        countryId: selectedCountry?.id || null,
        stateId: selectedState?.id || null,
        destinationId: useCustomCity ? null : (selectedCity?.id || null),
        // City display name
        city: useCustomCity ? customCity : (selectedCity?.name || ""),
      };

      // If vendor entered a custom city
      if (useCustomCity && customCity.trim()) {
        payload.customCity = customCity.trim();
        payload.customStateName = selectedState?.name || null;
        payload.customCountryName = selectedCountry?.name || null;
      }

      const res = await fetch(`${API_BASE}/vendor/hotels`, {
        method: "POST",
        headers: vendorAuthHeader(token),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create property");
      router.push(`/partner/properties/${data.id}`);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !vendor) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#1B3A6B] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <VendorSidebar />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-3 sticky top-0 z-20">
          <Link href="/partner/properties" className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 transition-colors text-sm font-medium">
            <ChevronLeft className="w-4 h-4" /> Properties
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          <h1 className="font-black text-gray-900">Add New Property</h1>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <StepIndicator current={step} />

            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
              {/* ─── Step 1: Basic Info ─── */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 mb-1">Property Details</h2>
                    <p className="text-sm text-gray-400">Tell us the basic information about your property.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Property Name *</label>
                    <input value={form.name} onChange={e => update("name", e.target.value)}
                      className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors"
                      placeholder="e.g. The Grand Himalayan Resort" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Property Type *</label>
                    <div className="grid grid-cols-5 gap-2">
                      {PROPERTY_TYPES.map(type => (
                        <button key={type} type="button" onClick={() => update("type", type)}
                          className={cn("py-2.5 rounded-md border-2 text-xs font-bold text-center transition-all flex flex-col items-center gap-1",
                            form.type === type ? "border-[#1B3A6B] bg-[#1B3A6B]/5 text-[#1B3A6B]" : "border-gray-100 text-gray-500 hover:border-gray-200")}>
                          <Building2 className="w-3.5 h-3.5" />
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Star Rating</label>
                    <div className="flex items-center gap-2">
                      {STARS.map(s => (
                        <button key={s} type="button" onClick={() => update("starRating", s)}
                          className="p-1 transition-transform hover:scale-125">
                          <Star className={cn("w-7 h-7 transition-all", s <= form.starRating ? "fill-amber-400 text-amber-400" : "text-gray-200")} />
                        </button>
                      ))}
                      <span className="text-sm text-gray-500 ml-2">{form.starRating} Star</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Description</label>
                    <textarea value={form.description} onChange={e => update("description", e.target.value)}
                      className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors resize-none"
                      rows={4} placeholder="Describe your property, its unique features, location highlights, views, special offerings..." />
                    <p className="text-[10px] text-gray-400 mt-1">{form.description.length} / 2000 characters</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Amenities & Facilities</label>
                    <AmenitiesSelector selected={form.amenities} onChange={(amenities) => update("amenities", amenities)} compact={false} />
                  </div>
                </div>
              )}

              {/* ─── Step 2: Location ─── */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 mb-1">Location & Address</h2>
                    <p className="text-sm text-gray-400">Where is your property located? Select from our verified destinations.</p>
                  </div>

                  {/* ── Country Dropdown ── */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Country *</label>
                    <select
                      value={selectedCountry?.id || ""}
                      onChange={e => {
                        const c = countries.find(c => String(c.id) === e.target.value);
                        setSelectedCountry(c || null);
                      }}
                      className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors bg-white"
                    >
                      <option value="">-- Select Country --</option>
                      {countries.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* ── State / Region Dropdown ── */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">State / Region *</label>
                    <select
                      value={selectedState?.id || ""}
                      onChange={e => {
                        const s = states.find(s => String(s.id) === e.target.value);
                        setSelectedState(s || null);
                      }}
                      disabled={!selectedCountry || states.length === 0}
                      className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors bg-white disabled:opacity-50"
                    >
                      <option value="">
                        {!selectedCountry ? "Select a country first" : states.length === 0 ? "Loading..." : "-- Select State / Region --"}
                      </option>
                      {states.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* ── City / Place Dropdown + Custom Fallback ── */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">City / Place *</label>
                    {!useCustomCity ? (
                      <>
                        <select
                          value={selectedCity?.id || ""}
                          onChange={e => {
                            if (e.target.value === "__custom__") {
                              setUseCustomCity(true);
                              setSelectedCity(null);
                            } else {
                              const c = cities.find(c => String(c.id) === e.target.value);
                              setSelectedCity(c || null);
                            }
                          }}
                          disabled={!selectedState || cities.length === 0}
                          className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors bg-white disabled:opacity-50"
                        >
                          <option value="">
                            {!selectedState ? "Select a state first" : cities.length === 0 ? "Loading cities..." : "-- Select City / Place --"}
                          </option>
                          {cities.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                          <option value="__custom__">✏️ My city is not listed</option>
                        </select>
                      </>
                    ) : (
                      <>
                        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                          <strong>📍 Custom City</strong> — We'll notify our team to add this location to our database.
                          Your hotel will still be listed using the city name you provide.
                        </div>
                        <div className="flex gap-2">
                          <input
                            value={customCity}
                            onChange={e => setCustomCity(e.target.value)}
                            placeholder="Enter your city / place name"
                            className="flex-1 border border-amber-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => { setUseCustomCity(false); setCustomCity(""); }}
                            className="px-4 py-3 border border-gray-200 rounded-md text-xs font-semibold text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Selected location preview */}
                  {(selectedCity || (useCustomCity && customCity)) && selectedState && selectedCountry && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                      <strong>📌 URL will be:</strong>{" "}
                      <code className="text-emerald-700">
                        /hotels/{selectedCountry.slug}/{selectedState.slug}/hotels-in-{useCustomCity ? customCity.toLowerCase().replace(/\s+/g, "-") : selectedCity?.slug}/{"your-hotel-name"}
                      </code>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Full Address *</label>
                    <textarea value={form.address} onChange={e => update("address", e.target.value)}
                      className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors resize-none"
                      rows={2} placeholder="Village, Tehsil, Landmark..." />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">PIN Code</label>
                      <input value={form.pincode} onChange={e => update("pincode", e.target.value)}
                        className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors"
                        placeholder="175101" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">City (for display)</label>
                      <input
                        value={useCustomCity ? customCity : (selectedCity?.name || "")}
                        readOnly
                        className="w-full border border-gray-100 rounded-md px-4 py-3 text-sm bg-gray-50 text-gray-500"
                        placeholder="Auto-filled from selection" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">Latitude (optional)</label>
                      <input value={form.latitude} onChange={e => update("latitude", e.target.value)} type="number" step="0.000001"
                        className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors"
                        placeholder="32.2396" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">Longitude (optional)</label>
                      <input value={form.longitude} onChange={e => update("longitude", e.target.value)} type="number" step="0.000001"
                        className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors"
                        placeholder="77.1887" />
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                    <strong>Tip:</strong> You can find your exact coordinates from Google Maps — right-click on your property location and select "What's here?"
                  </div>
                </div>
              )}

              {/* ─── Step 3: Details ─── */}
              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 mb-1">Property Settings</h2>
                    <p className="text-sm text-gray-400">Configure check-in/check-out times, pricing, and booking preferences.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">Check-in Time</label>
                      <input type="time" value={form.checkInTime} onChange={e => update("checkInTime", e.target.value)}
                        className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">Check-out Time</label>
                      <input type="time" value={form.checkOutTime} onChange={e => update("checkOutTime", e.target.value)}
                        className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">Total Rooms</label>
                      <input type="number" min="1" value={form.totalRooms} onChange={e => update("totalRooms", e.target.value)}
                        className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors"
                        placeholder="e.g. 20" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">Starting Price (₹/night)</label>
                      <input type="number" min="0" value={form.minPrice} onChange={e => update("minPrice", e.target.value)}
                        className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors"
                        placeholder="e.g. 3500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Default Meal Plan</label>
                    <div className="grid grid-cols-2 gap-2">
                      {MEAL_PLANS.map(m => (
                        <button key={m.val} type="button" onClick={() => update("mealPlan", m.val)}
                          className={cn("p-3 rounded-md border-2 text-left transition-all",
                            form.mealPlan === m.val ? "border-[#1B3A6B] bg-[#1B3A6B]/5" : "border-gray-100 hover:border-gray-200")}>
                          <p className={cn("text-xs font-bold", form.mealPlan === m.val ? "text-[#1B3A6B]" : "text-gray-700")}>{m.label}</p>
                          <p className="text-[10px] text-gray-400">{m.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Booking Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => update("bookingType", "INSTANT")}
                        className={cn("p-4 rounded-md border-2 text-left transition-all", form.bookingType === "INSTANT" ? "border-[#1B3A6B] bg-[#1B3A6B]/5" : "border-gray-100 hover:border-gray-200")}>
                        <p className={cn("text-sm font-bold", form.bookingType === "INSTANT" ? "text-[#1B3A6B]" : "text-gray-700")}>⚡ Instant Book</p>
                        <p className="text-xs text-gray-400 mt-0.5">Guests book directly without approval</p>
                      </button>
                      <button type="button" onClick={() => update("bookingType", "REQUEST")}
                        className={cn("p-4 rounded-md border-2 text-left transition-all", form.bookingType === "REQUEST" ? "border-[#1B3A6B] bg-[#1B3A6B]/5" : "border-gray-100 hover:border-gray-200")}>
                        <p className={cn("text-sm font-bold", form.bookingType === "REQUEST" ? "text-[#1B3A6B]" : "text-gray-700")}>📋 Request to Book</p>
                        <p className="text-xs text-gray-400 mt-0.5">You approve each booking request</p>
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                    <input type="checkbox" checked={form.breakfastIncluded} onChange={e => update("breakfastIncluded", e.target.checked)} className="w-4 h-4 accent-[#1B3A6B]" />
                    <div>
                      <p className="text-sm font-bold text-emerald-800">Breakfast Included in Price</p>
                      <p className="text-xs text-emerald-600">Show breakfast-included badge on your listing</p>
                    </div>
                  </label>
                </div>
              )}

              {/* ─── Step 4: Photos ─── */}
              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 mb-1">Property Photos</h2>
                    <p className="text-sm text-gray-400">Add photo URLs to showcase your property. High-quality images lead to more bookings.</p>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
                    <strong>Note:</strong> Enter public image URLs (Unsplash, your website CDN, etc). You can add more photos after registration through the property management panel.
                  </div>

                  <div className="space-y-3">
                    {imageUrls.map((url, i) => (
                      <div key={i} className="flex gap-2">
                        <div className="flex-1">
                          <input value={url} onChange={e => {
                            const updated = [...imageUrls];
                            updated[i] = e.target.value;
                            setImageUrls(updated);
                          }}
                            className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors"
                            placeholder={i === 0 ? "Main photo URL (required for listing)" : `Photo ${i + 1} URL`} />
                        </div>
                        {url && (
                          <div className="w-16 h-12 rounded-md border border-gray-200 overflow-hidden shrink-0">
                            <img src={url} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
                          </div>
                        )}
                        {imageUrls.length > 1 && (
                          <button type="button" onClick={() => setImageUrls(u => u.filter((_, j) => j !== i))}
                            className="w-10 h-11 flex items-center justify-center border border-gray-200 rounded-md text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => setImageUrls(u => [...u, ""])}
                      disabled={imageUrls.length >= 20}
                      className="flex items-center gap-2 text-sm font-bold text-[#1B3A6B] hover:underline disabled:opacity-50">
                      <Plus className="w-4 h-4" /> Add Another Photo URL
                    </button>
                  </div>

                  {/* Summary */}
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-2">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Property Summary</h3>
                    {[
                      { label: "Property Name", value: form.name },
                      { label: "Type", value: `${form.type} · ${form.starRating} Star` },
                      {
                        label: "Location", value: [
                          useCustomCity ? customCity : selectedCity?.name,
                          selectedState?.name,
                          selectedCountry?.name
                        ].filter(Boolean).join(", ") || "Not set"
                      },
                      { label: "Starting Price", value: form.minPrice ? `₹${Number(form.minPrice).toLocaleString()}/night` : "Not set" },
                      { label: "Booking Type", value: form.bookingType === "INSTANT" ? "⚡ Instant Book" : "📋 Request to Book" },
                      { label: "Amenities", value: form.amenities.length > 0 ? `${form.amenities.length} selected` : "None" },
                      { label: "Photos", value: `${imageUrls.filter(u => u).length} added` },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between text-xs">
                        <span className="text-gray-400">{item.label}</span>
                        <span className="font-semibold text-gray-700">{item.value || "—"}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                    <strong>What happens next?</strong> Your property will be submitted for review. Our team will verify it within 24 hours. You can add rooms, rates, and update details immediately after submission.
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
                {step > 1 && (
                  <button type="button" onClick={() => setStep(s => s - 1)}
                    className="flex items-center gap-2 px-5 py-3 border border-gray-200 rounded-md text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                )}
                {step < 4 ? (
                  <button type="button" onClick={handleNext}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#1B3A6B] text-white font-bold py-3 rounded-md hover:bg-[#0f2548] transition-colors">
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white font-black py-3 rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-60">
                    {submitting ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                    ) : (
                      <><Check className="w-4 h-4" /> Submit Property for Review</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
