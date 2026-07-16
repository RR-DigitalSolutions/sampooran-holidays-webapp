import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Plus, Trash2, Edit3, Search, Filter, Star, MapPin, CheckCircle, XCircle,
  ChevronRight, Building2, LayoutGrid, List, RefreshCw, Eye, Ban,
  Users, Wallet, BookOpen, Shield, ChevronDown, ChevronUp, X,
  Save, Camera, Bed, Clock, Phone, Globe, Mail, AlertTriangle, TrendingUp, Info
} from "lucide-react";
import { getApiUrl } from "@/utils/api-url";

const API_URL = getApiUrl();

const getToken = () => {
  try { return JSON.parse(localStorage.getItem("sh_admin_token") || "{}").token; }
  catch { return ""; }
};

const authHeaders = () => ({
  "Authorization": `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

// ─── Types ────────────────────────────────────────────────────────────────────
interface Hotel {
  id: number;
  name: string;
  slug: string;
  type: string;
  address: string;
  city?: string;
  starRating: number;
  status: string;
  isFeatured: boolean;
  displayOrder: number;
  minPrice: number;
  totalRooms: number;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  amenities?: string[];
  highlights?: string[];
  images?: string[];
  bookingType?: string;
  checkInTime?: string;
  checkOutTime?: string;
  destinationId?: number;
  destinationName?: string;
  ownerName?: string;
  ownerEmail?: string;
  pincode?: string;
  website?: string;
  vendorCommissionPct?: number;
  createdAt?: string;
  metaTitle?: string;
  metaDescription?: string;
  breakfastIncluded?: boolean;
  showOnFrontend?: boolean;
  proximity?: { place: string; distance: string }[];
  faqs?: { question: string; answer: string }[];
}

interface Room {
  id: number;
  hotelId: number;
  name: string;
  type: string;
  bedType: string;
  basePrice: number;
  maxOccupancy: number;
  mealPlan: string;
  totalRooms: number;
  availableRooms: number;
  isActive: boolean;
  amenities?: string[];
  images?: string[];
}

interface Booking {
  id: number;
  hotelId: number;
  userId: number;
  status: string;
  travelDate: string;
  travelersCount: number;
  totalAmount: number;
  paymentStatus: string;
  guestName?: string;
  guestEmail?: string;
  createdAt: string;
}

const PROPERTY_TYPES = ["Hotel", "Resort", "Cottage", "Homestay", "Villa", "Camp", "Hostel", "Apartment"];
const MEAL_PLANS: Record<string, string> = { EP: "Room Only", CP: "Breakfast", MAP: "Half Board", AP: "All Inclusive" };
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  APPROVED: { label: "Live", color: "text-emerald-700", bg: "bg-emerald-50" },
  PENDING: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50" },
  REJECTED: { label: "Rejected", color: "text-red-700", bg: "bg-red-50" },
  DRAFT: { label: "Draft", color: "text-gray-500", bg: "bg-gray-50" },
  SUSPENDED: { label: "Suspended", color: "text-orange-700", bg: "bg-orange-50" },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900">{value}</p>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "text-gray-600", bg: "bg-gray-100" };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${cfg.color} ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

// ─── Add/Edit Hotel Modal ─────────────────────────────────────────────────────
function HotelFormModal({
  hotel,
  destinations,
  onClose,
  onSave,
}: {
  hotel?: Partial<Hotel>;
  destinations: { id: number; name: string }[];
  onClose: () => void;
  onSave: () => void;
}) {
  const isEdit = !!hotel?.id;
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: hotel?.name || "",
    type: hotel?.type || "Hotel",
    starRating: hotel?.starRating || 3,
    description: hotel?.description || "",
    address: hotel?.address || "",
    city: hotel?.city || "",
    phone: hotel?.phone || "",
    email: hotel?.email || "",
    destinationId: hotel?.destinationId || "",
    checkInTime: hotel?.checkInTime || "14:00",
    checkOutTime: hotel?.checkOutTime || "12:00",
    bookingType: hotel?.bookingType || "INSTANT",
    metaTitle: hotel?.metaTitle || hotel?.name || "",
    metaDescription: hotel?.metaDescription || hotel?.description?.slice(0, 160) || "",
    status: hotel?.status || "PENDING",
    isFeatured: hotel?.isFeatured || false,
    images: hotel?.images?.join("\n") || "",
    amenities: Array.isArray(hotel?.amenities)
      ? hotel.amenities
      : typeof hotel?.amenities === "string"
      ? (hotel.amenities as string).split(",").map(s => s.trim()).filter(Boolean)
      : [] as string[],
    highlights: Array.isArray(hotel?.highlights)
      ? hotel.highlights
      : typeof hotel?.highlights === "string"
      ? (hotel.highlights as string).split(",").map(s => s.trim()).filter(Boolean)
      : [] as string[],
    pincode: hotel?.pincode || "",
    latitude: hotel?.latitude || "",
    longitude: hotel?.longitude || "",
    minPrice: hotel?.minPrice || "",
    totalRooms: hotel?.totalRooms || "",
    breakfastIncluded: hotel?.breakfastIncluded || false,
    vendorCommissionPct: hotel?.vendorCommissionPct || 15.0,
    website: hotel?.website || "",
    showOnFrontend: hotel?.showOnFrontend !== false,
    proximity: hotel?.proximity || [] as { place: string; distance: string }[],
    faqs: hotel?.faqs || [] as { question: string; answer: string }[],
  });

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        ...form,
        starRating: Number(form.starRating),
        destinationId: form.destinationId ? Number(form.destinationId) : null,
        images: form.images.split("\n").filter(Boolean),
        minPrice: form.minPrice ? Number(form.minPrice) : null,
        totalRooms: form.totalRooms ? Number(form.totalRooms) : null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        vendorCommissionPct: form.vendorCommissionPct ? Number(form.vendorCommissionPct) : null,
        pincode: form.pincode || null,
        website: form.website || null,
        breakfastIncluded: !!form.breakfastIncluded,
        showOnFrontend: !!form.showOnFrontend,
      };

      const url = isEdit
        ? `${API_URL}/admin/hotels/${hotel!.id}`
        : `${API_URL}/admin/hotels`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      onSave();
      onClose();
    } catch (err: any) {
      alert("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const steps = ["Basic Info", "Location", "Amenities & FAQs", "Media", "Settings"];

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{isEdit ? "Edit Property" : "Add New Property"}</h2>
            <p className="text-xs text-gray-400">Step {step} of {steps.length} — {steps[step - 1]}</p>
          </div>
          <button aria-label="Close" title="Close" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
        </div>

        {/* Step Indicator */}
        <div className="flex border-b overflow-x-auto">
          {steps.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i + 1)}
              className={`flex-1 min-w-[90px] py-3 text-xs font-bold transition-colors whitespace-nowrap ${step === i + 1 ? "border-b-2 border-[#1B3A6B] text-[#1B3A6B]" : "text-gray-400 hover:text-gray-600"}`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Property Name *</label>
                  <input value={form.name} onChange={e => update("name", e.target.value)} className="input w-full" placeholder="Grand Hyatt" />
                </div>
                <div>
                  <label className="label">Property Type</label>
                  <select aria-label="Property Type" title="Property Type" value={form.type} onChange={e => update("type", e.target.value)} className="input w-full">
                    <option value="Hotel">Hotel</option>
                    <option value="Resort">Resort</option>
                    <option value="Villa">Villa</option>
                    <option value="Cottage">Cottage</option>
                    <option value="Camp">Camp</option>
                    <option value="Homestay">Homestay</option>
                  </select>
                </div>
                <div>
                  <label className="label">Star Rating *</label>
                  <select aria-label="Star Rating" title="Star Rating" value={form.starRating} onChange={e => update("starRating", Number(e.target.value))} className="input w-full">
                    <option value={1}>1 Star</option>
                    <option value={2}>2 Star</option>
                    <option value={3}>3 Star</option>
                    <option value={4}>4 Star</option>
                    <option value={5}>5 Star</option>
                  </select>
                </div>
                <div>
                  <label className="label">Website Link</label>
                  <input value={form.website} onChange={e => update("website", e.target.value)} className="input w-full" placeholder="https://example.com" />
                </div>
                <div>
                  <label className="label">Contact Phone</label>
                  <input value={form.phone} onChange={e => update("phone", e.target.value)} className="input w-full" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="label">Contact Email</label>
                  <input type="email" value={form.email} onChange={e => update("email", e.target.value)} className="input w-full" placeholder="info@hotel.com" />
                </div>
              </div>
              <div>
                <label className="label">Description *</label>
                <textarea value={form.description} onChange={e => update("description", e.target.value)}
                  className="input w-full" rows={4} placeholder="About this premium property..." />
              </div>
              <div className="mt-3">
                <label className="label text-[#1B3A6B] font-bold">Hotel Highlights (Select up to 4 popular amenities to display as card badges) *</label>
                <div className="grid grid-cols-2 gap-2.5 border border-slate-100 rounded-2xl p-4 bg-slate-50/20 max-h-56 overflow-y-auto no-scrollbar">
                  {POPULAR_AMENITIES.map(opt => {
                    const isChecked = (form.highlights || []).includes(opt.key);
                    return (
                      <label key={opt.key} className={`flex items-center gap-2 text-xs font-semibold px-3 py-2.5 rounded-xl border cursor-pointer select-none transition-all ${isChecked ? "bg-[#1B3A6B]/5 border-[#1B3A6B]/20 text-[#1B3A6B]" : "bg-white border-slate-100 text-slate-700 hover:bg-slate-50"}`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const current = form.highlights || [];
                            let next;
                            if (e.target.checked) {
                              if (current.length >= 4) {
                                alert("You can select a maximum of 4 highlights.");
                                return;
                              }
                              next = [...current, opt.key];
                            } else {
                              next = current.filter(k => k !== opt.key);
                            }
                            update("highlights", next);
                          }}
                          className="rounded border-slate-300 text-[#1B3A6B] focus:ring-[#1B3A6B]"
                        />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="label">Destination *</label>
                <select aria-label="Destination" title="Destination" value={form.destinationId} onChange={e => update("destinationId", e.target.value)} className="input w-full">
                  <option value="">Select Destination</option>
                  {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Full Address *</label>
                <textarea value={form.address} onChange={e => update("address", e.target.value)}
                  className="input w-full" rows={2} placeholder="Building, Street, Area" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">City / Town</label>
                  <input value={form.city} onChange={e => update("city", e.target.value)} className="input w-full" placeholder="Manali" />
                </div>
                <div>
                  <label className="label">PIN Code</label>
                  <input value={form.pincode} onChange={e => update("pincode", e.target.value)} className="input w-full" placeholder="175131" />
                </div>
                <div className="col-span-3 grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Latitude</label>
                    <input type="number" step="any" value={form.latitude} onChange={e => update("latitude", e.target.value)} className="input w-full" placeholder="32.2396" />
                  </div>
                  <div>
                    <label className="label">Longitude</label>
                    <input type="number" step="any" value={form.longitude} onChange={e => update("longitude", e.target.value)} className="input w-full" placeholder="77.1887" />
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              <div>
                <label className="label">Popular Amenities</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                  {POPULAR_AMENITIES.map(opt => {
                    const isChecked = form.amenities.includes(opt.key);
                    return (
                      <label key={opt.key} className="flex items-center gap-2 text-xs font-semibold text-gray-700 bg-slate-50 border border-slate-100 hover:bg-slate-100 px-3 py-2 rounded-xl cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...form.amenities, opt.key]
                              : form.amenities.filter(k => k !== opt.key);
                            update("amenities", next);
                          }}
                          className="w-3.5 h-3.5 accent-[#1B3A6B]"
                        />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Proximity Editor */}
              <div className="border-t pt-3">
                <div className="flex justify-between items-center mb-2">
                  <label className="label mb-0 text-sm">Proximity (Nearby Places)</label>
                  <button
                    type="button"
                    onClick={() => update("proximity", [...form.proximity, { place: "", distance: "" }])}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                  >
                    + Add Place
                  </button>
                </div>
                <div className="space-y-2">
                  {form.proximity.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        placeholder="Place name (e.g. Mall Road)"
                        value={item.place}
                        onChange={(e) => {
                          const list = [...form.proximity];
                          list[idx].place = e.target.value;
                          update("proximity", list);
                        }}
                        className="input flex-1 text-xs py-1.5"
                      />
                      <input
                        placeholder="Distance (e.g. 500 m, 1.5 km)"
                        value={item.distance}
                        onChange={(e) => {
                          const list = [...form.proximity];
                          list[idx].distance = e.target.value;
                          update("proximity", list);
                        }}
                        className="input w-32 text-xs py-1.5"
                      />
                      <button
                        type="button"
                        onClick={() => update("proximity", form.proximity.filter((_: any, i: number) => i !== idx))}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {form.proximity.length === 0 && (
                    <p className="text-[10px] text-gray-400 italic">No proximity data added yet.</p>
                  )}
                </div>
              </div>

              {/* FAQ Editor */}
              <div className="border-t pt-3">
                <div className="flex justify-between items-center mb-2">
                  <label className="label mb-0 text-sm">FAQs (Frequently Asked Questions)</label>
                  <button
                    type="button"
                    onClick={() => update("faqs", [...form.faqs, { question: "", answer: "" }])}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                  >
                    + Add FAQ
                  </button>
                </div>
                <div className="space-y-3">
                  {form.faqs.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl relative space-y-2">
                      <button
                        type="button"
                        onClick={() => update("faqs", form.faqs.filter((_: any, i: number) => i !== idx))}
                        className="absolute right-2 top-2 p-1 text-red-500 hover:bg-red-100 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <input
                        placeholder="Question (e.g. Is parking available?)"
                        value={item.question}
                        onChange={(e) => {
                          const list = [...form.faqs];
                          list[idx].question = e.target.value;
                          update("faqs", list);
                        }}
                        className="input w-full text-xs py-1.5 bg-white"
                      />
                      <textarea
                        placeholder="Answer"
                        value={item.answer}
                        onChange={(e) => {
                          const list = [...form.faqs];
                          list[idx].answer = e.target.value;
                          update("faqs", list);
                        }}
                        className="input w-full text-xs py-1.5 bg-white"
                        rows={2}
                      />
                    </div>
                  ))}
                  {form.faqs.length === 0 && (
                    <p className="text-[10px] text-gray-400 italic">No FAQs added yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <>
              <div>
                <label className="label">Image URLs (one per line)</label>
                <textarea value={form.images} onChange={e => update("images", e.target.value)}
                  className="input w-full font-mono text-xs" rows={8} placeholder="https://..." />
                <p className="text-xs text-gray-400 mt-1">First image will be used as the cover photo.</p>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <div className="grid grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2">
                <div>
                  <label className="label">Check-in Time</label>
                  <input aria-label="Check-in Time" title="Check-in Time" type="time" value={form.checkInTime} onChange={e => update("checkInTime", e.target.value)} className="input w-full" />
                </div>
                <div>
                  <label className="label">Check-out Time</label>
                  <input aria-label="Check-out Time" title="Check-out Time" type="time" value={form.checkOutTime} onChange={e => update("checkOutTime", e.target.value)} className="input w-full" />
                </div>
                <div>
                  <label className="label">Starting Price (Min Price)</label>
                  <input type="number" placeholder="4500" value={form.minPrice} onChange={e => update("minPrice", e.target.value)} className="input w-full" />
                </div>
                <div>
                  <label className="label">Total Rooms</label>
                  <input type="number" placeholder="24" value={form.totalRooms} onChange={e => update("totalRooms", e.target.value)} className="input w-full" />
                </div>
                <div>
                  <label className="label">Commission %</label>
                  <input type="number" step="0.1" value={form.vendorCommissionPct} onChange={e => update("vendorCommissionPct", e.target.value)} className="input w-full" />
                </div>
                <div>
                  <label className="label">Booking Type</label>
                  <select aria-label="Booking Type" title="Booking Type" value={form.bookingType} onChange={e => update("bookingType", e.target.value)} className="input w-full">
                    <option value="INSTANT">Instant Booking</option>
                    <option value="REQUEST">Request to Book</option>
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select aria-label="Status" title="Status" value={form.status} onChange={e => update("status", e.target.value)} className="input w-full">
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2 justify-center pt-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={form.breakfastIncluded} onChange={e => update("breakfastIncluded", e.target.checked)} className="w-4 h-4 accent-[#1B3A6B]" />
                    Breakfast Included
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={form.showOnFrontend} onChange={e => update("showOnFrontend", e.target.checked)} className="w-4 h-4 accent-[#1B3A6B]" />
                    Show on Frontend
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={form.isFeatured} onChange={e => update("isFeatured", e.target.checked)} className="w-4 h-4 accent-[#1B3A6B]" />
                    Mark as Featured
                  </label>
                </div>
                <div className="col-span-2">
                  <label className="label">SEO Meta Title</label>
                  <input aria-label="SEO Meta Title" title="SEO Meta Title" placeholder="SEO Meta Title" value={form.metaTitle} onChange={e => update("metaTitle", e.target.value)} className="input w-full" />
                </div>
                <div className="col-span-2">
                  <label className="label">SEO Meta Description</label>
                  <textarea aria-label="SEO Meta Description" title="SEO Meta Description" placeholder="SEO Meta Description" value={form.metaDescription} onChange={e => update("metaDescription", e.target.value)} className="input w-full" rows={2} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 rounded-b-3xl">
          <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-xl disabled:opacity-40 transition-colors">
            ← Back
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-xl">Cancel</button>
            {step < steps.length ? (
              <button onClick={() => setStep(s => s + 1)}
                className="px-5 py-2 text-sm font-bold bg-[#1B3A6B] text-white rounded-xl hover:bg-[#0f2548] transition-colors">
                Next →
              </button>
            ) : (
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-60">
                <Save className="w-4 h-4" /> {saving ? "Saving..." : (isEdit ? "Update Property" : "Create Property")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const POPULAR_AMENITIES = [
  { key: "WIFI", label: "Free Wi-Fi" },
  { key: "AC", label: "Air Conditioning" },
  { key: "HEATING", label: "Room Heating" },
  { key: "TV", label: "Flat-screen TV" },
  { key: "MINIBAR", label: "Minibar" },
  { key: "SAFE", label: "In-Room Safe" },
  { key: "HOT_WATER", label: "Hot Water 24/7" },
  { key: "TOILETRIES", label: "Premium Toiletries" },
  { key: "RESTAURANT", label: "In-House Restaurant" },
  { key: "BAR", label: "Bar & Lounge" },
  { key: "ROOM_SERVICE", label: "24/7 Room Service" },
  { key: "BREAKFAST", label: "Breakfast Included" },
  { key: "POOL", label: "Swimming Pool" },
  { key: "GYM", label: "Fitness Center" },
  { key: "SPA", label: "Spa & Massage" },
  { key: "LAUNDRY", label: "Laundry Service" },
  { key: "PARKING", label: "Free Parking" },
  { key: "VALET_PARKING", label: "Valet Parking" },
  { key: "EV_CHARGING", label: "EV Charging" },
  { key: "MOUNTAIN_VIEW", label: "Mountain View" },
  { key: "VALLEY_VIEW", label: "Valley View" },
  { key: "BONFIRE", label: "Bonfire" }
];
// ─── Room Management Panel ────────────────────────────────────────────────────
function RoomsPanel({ hotel, onClose }: { hotel: Hotel; onClose: () => void }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: "", type: "Standard", bedType: "DOUBLE", basePrice: "",
    maxOccupancy: 2, mealPlan: "EP", totalRooms: 1,
    discountType: "PERCENT", discountPercent: 0, discountFlat: 0,
  });

  const fetchRooms = async () => {
    const res = await fetch(`${API_URL}/admin/hotels/${hotel.id}/rooms`, { headers: authHeaders() });
    setRooms(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchRooms(); }, [hotel.id]);

  const addRoom = async () => {
    await fetch(`${API_URL}/admin/hotels/${hotel.id}/rooms`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ 
        ...newRoom, 
        basePrice: Number(newRoom.basePrice),
        discountPercent: Number(newRoom.discountPercent || 0),
        discountFlat: Number(newRoom.discountFlat || 0),
      }),
    });
    setShowAddRoom(false);
    fetchRooms();
  };

  const toggleRoom = async (room: Room) => {
    await fetch(`${API_URL}/admin/hotels/${hotel.id}/rooms/${room.id}`, {
      method: "PATCH", headers: authHeaders(),
      body: JSON.stringify({ isActive: !room.isActive }),
    });
    fetchRooms();
  };

  const deleteRoom = async (roomId: number) => {
    if (!confirm("Delete this room type?")) return;
    await fetch(`${API_URL}/admin/hotels/${hotel.id}/rooms/${roomId}`, {
      method: "DELETE", headers: authHeaders(),
    });
    fetchRooms();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold">{hotel.name}</h2>
            <p className="text-xs text-gray-400">Room Types & Pricing</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAddRoom(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1B3A6B] text-white text-sm font-bold rounded-xl">
              <Plus className="w-4 h-4" /> Add Room
            </button>
            <button aria-label="Close" title="Close" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {showAddRoom && (
          <div className="p-5 bg-blue-50 border-b grid grid-cols-3 gap-3">
            <input value={newRoom.name} onChange={e => setNewRoom(r => ({ ...r, name: e.target.value }))}
              placeholder="Room name (e.g. Deluxe Room)" className="input col-span-3" />
            <select aria-label="Room Type" title="Room Type" value={newRoom.type} onChange={e => setNewRoom(r => ({ ...r, type: e.target.value }))} className="input">
              {["Standard", "Deluxe", "Suite", "Executive", "Family"].map(t => <option key={t}>{t}</option>)}
            </select>
            <select aria-label="Bed Type" title="Bed Type" value={newRoom.bedType} onChange={e => setNewRoom(r => ({ ...r, bedType: e.target.value }))} className="input">
              {["SINGLE", "DOUBLE", "TWIN", "KING", "QUEEN"].map(b => <option key={b}>{b}</option>)}
            </select>
            <select aria-label="Meal Plan" title="Meal Plan" value={newRoom.mealPlan} onChange={e => setNewRoom(r => ({ ...r, mealPlan: e.target.value }))} className="input">
              {Object.entries(MEAL_PLANS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input type="number" value={newRoom.basePrice} onChange={e => setNewRoom(r => ({ ...r, basePrice: e.target.value }))}
              placeholder="Price per night (₹)" className="input" />
            <input type="number" value={newRoom.maxOccupancy} onChange={e => setNewRoom(r => ({ ...r, maxOccupancy: Number(e.target.value) }))}
              placeholder="Max occupancy" className="input" />
            <input type="number" value={newRoom.totalRooms} onChange={e => setNewRoom(r => ({ ...r, totalRooms: Number(e.target.value) }))}
              placeholder="Total rooms" className="input" />
            
            <select aria-label="Discount Type" title="Discount Type" value={newRoom.discountType} onChange={e => setNewRoom(r => ({ ...r, discountType: e.target.value }))} className="input">
              <option value="PERCENT">Percentage Discount (%)</option>
              <option value="FLAT">Flat Discount Amount (₹)</option>
            </select>
            {newRoom.discountType === "PERCENT" ? (
              <input type="number" value={newRoom.discountPercent || ""} onChange={e => setNewRoom(r => ({ ...r, discountPercent: Number(e.target.value), discountFlat: 0 }))}
                placeholder="Discount Percent (%)" className="input" min="0" max="100" />
            ) : (
              <input type="number" value={newRoom.discountFlat || ""} onChange={e => setNewRoom(r => ({ ...r, discountFlat: Number(e.target.value), discountPercent: 0 }))}
                placeholder="Discount Flat Amount (₹)" className="input" min="0" />
            )}
            <div className="col-span-3 flex justify-end gap-2">
              <button onClick={() => setShowAddRoom(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-xl">Cancel</button>
              <button onClick={addRoom} className="px-4 py-2 text-sm font-bold bg-emerald-600 text-white rounded-xl">Save Room</button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B]" /></div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Bed className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No rooms added yet</p>
            </div>
          ) : rooms.map(room => (
            <div key={room.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border">
                <Bed className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900">{room.name}</p>
                <p className="text-xs text-gray-400">{room.type} · {room.bedType} · {MEAL_PLANS[room.mealPlan] || room.mealPlan} · Max {room.maxOccupancy} guests</p>
              </div>
              <div className="text-right">
                <p className="font-black text-[#1B3A6B]">₹{(room.basePrice || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-400">{room.totalRooms} rooms</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleRoom(room)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${room.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                  {room.isActive ? "Active" : "Inactive"}
                </button>
                <button aria-label="Delete Room" title="Delete Room" onClick={() => deleteRoom(room.id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg text-gray-300 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Hotel View Modal ────────────────────────────────────────────────────────
function HotelViewModal({ hotel, onClose }: { hotel: Hotel; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-black text-gray-900">{hotel.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{hotel.type} · {hotel.starRating}★ · {hotel.city}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {hotel.images && hotel.images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {hotel.images.map((img, i) => (
                <img key={i} src={img} alt="Property" className="w-48 h-32 object-cover rounded-xl shrink-0" />
              ))}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-2xl">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-[#1B3A6B]" /> Location</h3>
              <p className="text-sm text-gray-600">{hotel.address}</p>
              <p className="text-sm text-gray-600">{hotel.city}, {hotel.pincode}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-2xl">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Phone className="w-4 h-4 text-[#1B3A6B]" /> Contact</h3>
              <p className="text-sm text-gray-600">{hotel.phone}</p>
              <p className="text-sm text-gray-600">{hotel.email}</p>
              {hotel.website && <p className="text-sm text-blue-600 hover:underline"><a href={hotel.website} target="_blank" rel="noreferrer">{hotel.website}</a></p>}
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-2xl">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Building2 className="w-4 h-4 text-[#1B3A6B]" /> Property Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-xs text-gray-500">Total Rooms</p><p className="font-bold text-gray-900">{hotel.totalRooms}</p></div>
              <div><p className="text-xs text-gray-500">Status</p><p className="font-bold text-gray-900"><StatusBadge status={hotel.status} /></p></div>
              <div><p className="text-xs text-gray-500">Commission</p><p className="font-bold text-gray-900">{hotel.vendorCommissionPct}%</p></div>
              <div><p className="text-xs text-gray-500">Check-in</p><p className="font-bold text-gray-900">{hotel.checkInTime}</p></div>
              <div><p className="text-xs text-gray-500">Check-out</p><p className="font-bold text-gray-900">{hotel.checkOutTime}</p></div>
            </div>
          </div>

          {hotel.description && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{hotel.description}</p>
            </div>
          )}
          
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {hotel.amenities.map((amenity, i) => (
                  <span key={i} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Pending City Request Card ─────────────────────────────────────────────────
function PendingCityCard({
  request,
  destinations,
  onRefresh,
}: {
  request: any;
  destinations: { id: number; name: string }[];
  onRefresh: () => void;
}) {
  const [resolving, setResolving] = useState(false);
  const [mapToExisting, setMapToExisting] = useState(false);
  const [existingDestId, setExistingDestId] = useState("");

  const handleAccept = async () => {
    setResolving(true);
    try {
      const body: any = { action: "APPROVE" };
      if (mapToExisting && existingDestId) {
        body.existingDestinationId = Number(existingDestId);
      } else {
        body.createNew = true;
      }
      const res = await fetch(`${API_URL}/admin/pending-cities/${request.id}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      onRefresh();
    } catch (e: any) {
      alert("Failed to accept: " + e.message);
    } finally {
      setResolving(false);
    }
  };

  const handleReject = async () => {
    setResolving(true);
    try {
      await fetch(`${API_URL}/admin/pending-cities/${request.id}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "REJECT" }),
      });
      onRefresh();
    } catch { } finally { setResolving(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-amber-100 p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-bold text-gray-900">{request.requestedCityName}</p>
            <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-bold">NEW CITY</span>
          </div>
          <p className="text-xs text-gray-400">
            Vendor: <strong>{request.vendorName || request.vendorEmail}</strong>
            {request.stateName && <> · State: <strong>{request.stateName}</strong></>}
            {request.countryName && <> · Country: <strong>{request.countryName}</strong></>}
          </p>
          {request.hotelName && (
            <p className="text-xs text-gray-400 mt-0.5">For hotel: <strong className="text-gray-700">{request.hotelName}</strong></p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleReject} disabled={resolving}
            className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5 inline mr-1" /> Reject
          </button>
          <button
            onClick={handleAccept} disabled={resolving || (mapToExisting && !existingDestId)}
            className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {resolving ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            {mapToExisting ? "Map to Existing" : "Accept & Add City"}
          </button>
        </div>
      </div>

      {/* Options */}
      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
          <input
            type="checkbox"
            checked={mapToExisting}
            onChange={e => setMapToExisting(e.target.checked)}
            className="w-3.5 h-3.5"
          />
          Map to existing destination instead
        </label>
        {mapToExisting && (
          <select
            value={existingDestId}
            onChange={e => setExistingDestId(e.target.value)}
            className="flex-1 input text-xs"
          >
            <option value="">-- Select existing destination --</option>
            {destinations.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

// ─── Main Hotel Manager Page ───────────────────────────────────────────────────
export default function HotelsManager() {
  const [tab, setTab] = useState<"all" | "pending" | "bookings" | "vendors" | "pending-cities">("all");
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<{ id: number; name: string }[]>([]);
  const [pendingCities, setPendingCities] = useState<any[]>([]);
  const [pendingCityCount, setPendingCityCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [editingHotel, setEditingHotel] = useState<Partial<Hotel> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewingHotel, setViewingHotel] = useState<Hotel | null>(null);
  const [managingRoomsFor, setManagingRoomsFor] = useState<Hotel | null>(null);

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/hotels`, { headers: authHeaders() });
      const data = await res.json();
      setHotels(Array.isArray(data) ? data : []);
    } catch { setHotels([]); }
    finally { setLoading(false); }
  }, []);

  const fetchDestinations = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/destinations`, { headers: authHeaders() });
      const data = await res.json();
      setDestinations(Array.isArray(data) ? data.map((d: any) => ({ id: d.id, name: d.name })) : []);
    } catch {}
  }, []);

  const fetchVendors = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/users`, { headers: authHeaders() });
      const data = await res.json();
      setVendors(Array.isArray(data) ? data.filter((u: any) => u.role === "HOTEL_OWNER") : []);
    } catch {}
  }, []);

  const fetchPendingCities = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/pending-cities?status=PENDING`, { headers: authHeaders() });
      const data = await res.json();
      setPendingCities(data.requests || []);
      setPendingCityCount(data.pendingCount || 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchHotels();
    fetchDestinations();
    fetchVendors();
    fetchPendingCities();
  }, []);

  const handleApprove = async (hotel: Hotel) => {
    try {
      const res = await fetch(`${API_URL}/admin/hotels/${hotel.id}`, {
        method: "PATCH", headers: authHeaders(),
        body: JSON.stringify({ status: "APPROVED" }),
      });
      if (!res.ok) throw new Error("Failed to approve");
      fetchHotels();
    } catch (e: any) {
      alert("Failed to approve hotel.");
    }
  };

  const handleReject = async (hotel: Hotel) => {
    await fetch(`${API_URL}/admin/hotels/${hotel.id}`, {
      method: "PATCH", headers: authHeaders(),
      body: JSON.stringify({ status: "REJECTED" }),
    });
    fetchHotels();
  };

  const handleDelete = async (hotel: Hotel) => {
    if (!confirm(`Delete "${hotel.name}"? This action cannot be undone.`)) return;
    await fetch(`${API_URL}/admin/hotels/${hotel.id}`, {
      method: "DELETE", headers: authHeaders(),
    });
    fetchHotels();
  };

  const handleToggleFeatured = async (hotel: Hotel) => {
    await fetch(`${API_URL}/admin/hotels/${hotel.id}`, {
      method: "PATCH", headers: authHeaders(),
      body: JSON.stringify({ isFeatured: !hotel.isFeatured }),
    });
    fetchHotels();
  };

  const handleVerifyVendor = async (vendorId: number, verified: boolean) => {
    await fetch(`${API_URL}/admin/users/${vendorId}`, {
      method: "PATCH", headers: authHeaders(),
      body: JSON.stringify({ vendorVerified: verified }),
    });
    fetchVendors();
  };

  const filteredHotels = hotels.filter(h => {
    const matchSearch = !search ||
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      (h.city || h.address).toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || h.status === filterStatus;
    const matchType = filterType === "ALL" || h.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const pendingHotels = hotels.filter(h => h.status === "PENDING");

  // Stats
  const totalApproved = hotels.filter(h => h.status === "APPROVED").length;
  const totalFeatured = hotels.filter(h => h.isFeatured).length;

  const TABS = [
    { key: "all", label: "All Properties", count: hotels.length },
    { key: "pending", label: "Pending Approval", count: pendingHotels.length, badge: pendingHotels.length > 0 },
    { key: "bookings", label: "Bookings" },
    { key: "vendors", label: "Vendors", count: vendors.length },
    { key: "pending-cities", label: "🏙️ City Requests", count: pendingCityCount, badge: pendingCityCount > 0 },
  ] as const;

  return (
    <AdminLayout title="Hotel Management" subtitle="Full OTA property management — vendors, rooms, inventory, bookings">
      <div className="space-y-6">

        {/* Dropdown visibility redirect banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3 items-start shadow-sm">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800 leading-relaxed">
            <span className="font-bold">🏨 Hotels Navbar Dropdown Settings:</span> To configure which Countries, States, and Cities appear under the Hotels dropdown menu on the website navbar, go to the <a href="/admin/destinations" className="underline font-black hover:text-blue-900 text-[#1B3A6B]">Destinations Manager</a>. Edit the desired place, state, or country card and check <span className="font-bold">"Show in Hotels Dropdown"</span> box located at the very bottom of the form.
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Properties" value={hotels.length} icon={Building2} color="bg-[#1B3A6B]" />
          <StatCard label="Live & Approved" value={totalApproved} icon={CheckCircle} color="bg-emerald-500" />
          <StatCard label="Pending Review" value={pendingHotels.length} icon={AlertTriangle} color="bg-amber-500" />
          <StatCard label="Featured" value={totalFeatured} icon={Star} color="bg-violet-500" />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 gap-0">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors ${tab === t.key ? "border-b-2 border-[#1B3A6B] text-[#1B3A6B]" : "text-gray-400 hover:text-gray-700"}`}
            >
              {t.label}
              {"count" in t && t.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${(t as any).badge ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ──────── TAB: ALL PROPERTIES ──────── */}
        {tab === "all" && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3 flex-1 w-full">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl flex-1 border border-gray-100 focus-within:border-[#1B3A6B] transition-all">
                  <Search className="w-4 h-4 text-gray-400 shrink-0" />
                  <input placeholder="Search properties or cities..." className="bg-transparent text-sm focus:outline-none w-full"
                    value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select aria-label="Filter by Status" title="Filter by Status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="input text-sm px-3 py-2 rounded-xl">
                  <option value="ALL">All Status</option>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select aria-label="Filter by Type" title="Filter by Type" value={filterType} onChange={e => setFilterType(e.target.value)}
                  className="input text-sm px-3 py-2 rounded-xl">
                  <option value="ALL">All Types</option>
                  {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex bg-gray-100 p-0.5 rounded-xl">
                  <button aria-label="List View" title="List View" onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white shadow-sm text-[#1B3A6B]" : "text-gray-400"}`}><List className="w-4 h-4" /></button>
                  <button aria-label="Grid View" title="Grid View" onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-[#1B3A6B]" : "text-gray-400"}`}><LayoutGrid className="w-4 h-4" /></button>
                </div>
                <button onClick={() => { setEditingHotel({}); setShowForm(true); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#1B3A6B] text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-900/20 hover:bg-[#0f2548] transition-colors">
                  <Plus className="w-4 h-4" /> Add Property
                </button>
                <button aria-label="Refresh" title="Refresh" onClick={fetchHotels} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1B3A6B]" /></div>
            ) : filteredHotels.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 py-16 text-center text-gray-400">
                <Building2 className="w-14 h-14 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No properties found</p>
                <p className="text-sm mt-1">Try adjusting your filters or add a new property</p>
              </div>
            ) : viewMode === "list" ? (
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b bg-gray-50">
                      <th className="px-5 py-3">Property</th>
                      <th className="px-5 py-3">Location</th>
                      <th className="px-5 py-3">Rooms</th>
                      <th className="px-5 py-3">Min Price</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Owner</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredHotels.map(hotel => (
                      <tr key={hotel.id} className="hover:bg-gray-50/80 group transition-all">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                              {hotel.images?.[0] ? (
                                <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Building2 className="w-5 h-5 text-gray-300" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-gray-900 leading-tight">{hotel.name}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-2.5 h-2.5 ${i < hotel.starRating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                                ))}
                                <span className="text-[10px] text-gray-400 ml-1">{hotel.type}</span>
                              </div>
                              {hotel.isFeatured && (
                                <span className="text-[9px] font-black text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full">FEATURED</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-gray-700">{hotel.destinationName || hotel.city || "—"}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[130px]">{hotel.address}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-bold text-gray-700">{hotel.totalRooms || 0}</span>
                          <span className="text-xs text-gray-400 ml-1">rooms</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-black text-[#1B3A6B]">
                            {hotel.minPrice ? `₹${hotel.minPrice.toLocaleString()}` : "—"}
                          </span>
                          <span className="text-xs text-gray-400">/night</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={hotel.status} />
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-xs font-medium text-gray-600 truncate max-w-[100px]">{hotel.ownerName || "Admin"}</p>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setManagingRoomsFor(hotel)}
                              title="Manage Rooms"
                              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-[#1B3A6B] transition-colors">
                              <Bed className="w-4 h-4" />
                            </button>
                            {hotel.status === "PENDING" && (
                              <button onClick={() => handleApprove(hotel)}
                                title="Approve"
                                className="p-1.5 hover:bg-emerald-50 rounded-lg text-gray-400 hover:text-emerald-600 transition-colors">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {hotel.status === "PENDING" && (
                              <button onClick={() => handleReject(hotel)}
                                title="Reject"
                                className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => handleToggleFeatured(hotel)}
                              title={hotel.isFeatured ? "Unfeature" : "Feature"}
                              className={`p-1.5 rounded-lg transition-colors ${hotel.isFeatured ? "bg-violet-50 text-violet-600" : "hover:bg-violet-50 text-gray-300 hover:text-violet-600"}`}>
                              <Star className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setEditingHotel(hotel); setShowForm(true); }}
                              title="Edit"
                              className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-[#1B3A6B] transition-colors">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(hotel)}
                              title="Delete"
                              className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredHotels.map(hotel => (
                  <div key={hotel.id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                    <div className="relative h-44 bg-gray-100 overflow-hidden">
                      {hotel.images?.[0] ? (
                        <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="w-12 h-12 text-gray-200" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <StatusBadge status={hotel.status} />
                      </div>
                      {hotel.isFeatured && (
                        <div className="absolute top-3 right-3">
                          <span className="text-[9px] font-black bg-violet-600 text-white px-2 py-0.5 rounded-full">★ FEATURED</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 group-hover:text-[#1B3A6B] transition-colors leading-tight">{hotel.name}</h3>
                      <div className="flex items-center gap-1 mt-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < hotel.starRating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                        ))}
                        <span className="text-[10px] text-gray-400 ml-1">{hotel.type}</span>
                      </div>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mb-3">
                        <MapPin className="w-3 h-3" /> {hotel.destinationName || hotel.city || hotel.address.slice(0, 25)}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          {hotel.minPrice ? (
                            <span className="text-sm font-black text-[#1B3A6B]">₹{hotel.minPrice.toLocaleString()}<span className="text-xs font-normal text-gray-400">/night</span></span>
                          ) : (
                            <span className="text-xs text-gray-400">{hotel.totalRooms || 0} rooms</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button aria-label="View Property" title="View Property" onClick={() => setViewingHotel(hotel)} className="p-1.5 hover:bg-emerald-50 rounded-lg text-gray-400 hover:text-emerald-600 transition-colors"><Eye className="w-4 h-4" /></button>
                          <button aria-label="Manage Rooms" title="Manage Rooms" onClick={() => setManagingRoomsFor(hotel)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-[#1B3A6B]"><Bed className="w-4 h-4" /></button>
                          <button aria-label="Edit Property" title="Edit Property" onClick={() => { setEditingHotel(hotel); setShowForm(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-[#1B3A6B]"><Edit3 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ──────── TAB: PENDING APPROVALS ──────── */}
        {tab === "pending" && (
          <div className="space-y-4">
            {pendingHotels.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 py-16 text-center text-gray-400">
                <CheckCircle className="w-14 h-14 mx-auto mb-3 opacity-20 text-emerald-500" />
                <p className="font-medium">All clear! No pending approvals.</p>
              </div>
            ) : pendingHotels.map(hotel => (
              <div key={hotel.id} className="bg-white rounded-2xl border border-amber-200 p-5 flex flex-col md:flex-row gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden shrink-0">
                  {hotel.images?.[0] ? <img src={hotel.images[0]} className="w-full h-full object-cover" alt={hotel.name} /> : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-8 h-8 text-gray-300" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-gray-900">{hotel.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{hotel.type} · {hotel.starRating}★ · {hotel.destinationName || hotel.city}</p>
                      <p className="text-xs text-gray-500 mt-1">{hotel.address}</p>
                      <p className="text-xs text-gray-400 mt-1">Submitted by: <span className="font-medium text-gray-600">{hotel.ownerName || "Vendor"}</span></p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => setViewingHotel(hotel)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 text-sm font-bold rounded-xl hover:bg-blue-100 transition-colors">
                        <Eye className="w-4 h-4" /> View Details
                      </button>
                      <button onClick={() => handleApprove(hotel)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors">
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={() => handleReject(hotel)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-colors">
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                  {hotel.description && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{hotel.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ──────── TAB: BOOKINGS ──────── */}
        {tab === "bookings" && (
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b bg-gray-50">
              <h3 className="font-bold text-gray-700">Hotel Bookings Overview</h3>
              <p className="text-xs text-gray-400 mt-0.5">All property bookings across the platform</p>
            </div>
            <div className="p-8 text-center text-gray-400">
              <BookOpen className="w-14 h-14 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Bookings will appear here</p>
              <p className="text-sm mt-1">Once guests book hotels, all reservations will be listed here with guest details, amounts, and status.</p>
            </div>
          </div>
        )}

        {/* ──────── TAB: VENDORS ──────── */}
        {tab === "vendors" && (
          <div className="space-y-3">
            {vendors.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 py-16 text-center text-gray-400">
                <Users className="w-14 h-14 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No hotel vendors registered yet</p>
              </div>
            ) : vendors.map(vendor => (
              <div key={vendor.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#1B3A6B] to-[#F5A623] rounded-2xl flex items-center justify-center text-white font-black text-lg">
                  {vendor.name?.[0]?.toUpperCase() || "V"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{vendor.name}</p>
                  <p className="text-xs text-gray-400">{vendor.email} · {vendor.vendorBusinessName || "No business name"}</p>
                  {vendor.companyName && <p className="text-xs text-gray-400">Company: {vendor.companyName} {vendor.gstNumber ? `· GST: ${vendor.gstNumber}` : ""}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${vendor.vendorVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {vendor.vendorVerified ? "✓ Verified" : "Pending"}
                  </span>
                  {!vendor.vendorVerified ? (
                    <button onClick={() => handleVerifyVendor(vendor.id, true)}
                      className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors">
                      Verify Vendor
                    </button>
                  ) : (
                    <button onClick={() => handleVerifyVendor(vendor.id, false)}
                      className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors">
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ──────── TAB: PENDING CITY REQUESTS ──────── */}
        {tab === "pending-cities" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-amber-100">
              <div>
                <h3 className="font-bold text-gray-900">Vendor City Requests</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Vendors submitted these city names that aren't in our CMS yet. Review and add them.
                </p>
              </div>
              <button onClick={fetchPendingCities} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {pendingCities.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 py-16 text-center text-gray-400">
                <CheckCircle className="w-14 h-14 mx-auto mb-3 opacity-20 text-emerald-400" />
                <p className="font-medium">All city requests resolved!</p>
                <p className="text-sm mt-1">No pending city submissions from vendors.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingCities.map((req: any) => (
                  <PendingCityCard
                    key={req.id}
                    request={req}
                    destinations={destinations}
                    onRefresh={fetchPendingCities}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <HotelFormModal
          hotel={editingHotel || {}}
          destinations={destinations}
          onClose={() => { setShowForm(false); setEditingHotel(null); }}
          onSave={fetchHotels}
        />
      )}

      {viewingHotel && (
        <HotelViewModal hotel={viewingHotel} onClose={() => setViewingHotel(null)} />
      )}

      {managingRoomsFor && (
        <RoomsPanel hotel={managingRoomsFor} onClose={() => setManagingRoomsFor(null)} />
      )}

      <style>{`
        .label { display: block; font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 4px; }
        .input { border: 1px solid #e5e7eb; border-radius: 10px; padding: 8px 12px; font-size: 14px; outline: none; transition: border-color 0.2s; background: white; }
        .input:focus { border-color: #1B3A6B; }
      `}</style>
    </AdminLayout>
  );
}
