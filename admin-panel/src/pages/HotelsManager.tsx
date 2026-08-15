import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Plus, Trash2, Edit3, Search, Filter, Star, MapPin, CheckCircle, XCircle,
  ChevronRight, Building2, LayoutGrid, List, RefreshCw, Eye, Ban,
  Users, Wallet, BookOpen, Shield, ChevronDown, ChevronUp, X,
  Save, Camera, Bed, Clock, Phone, Globe, Mail, AlertTriangle, TrendingUp, Info,
  Sliders, Calendar
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
  owner_name?: string;
  owner_email?: string;
  owner_role?: string;
  propertySource?: "ADMIN_B2B" | "VENDOR_OTA";
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
  extraAdultPrice?: number;
  extraChildWithBedPrice?: number;
  extraChildWithoutBedPrice?: number;
  sizeSqft?: number;
  viewType?: string;
  maxOccupancy: number;
  mealPlan: string;
  totalRooms: number;
  availableRooms: number;
  isActive: boolean;
  discountType?: string;
  discountPercent?: number;
  discountFlat?: number;
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

// ─── Inline Rooms Panel (embedded in Edit Hotel modal, Step 3) ────────────────
const ROOM_CATEGORIES_LIST = [
  "Standard Room", "Deluxe Room", "Super Deluxe Room", "Executive Suite",
  "Family Suite", "Premium Villa", "Luxury Cottage", "Penthouse", "Duplex Suite"
];
const VIEW_TYPES_LIST = ["Mountain View", "Valley View", "Lake View", "Pool View", "Garden View", "City View"];

function InlineRoomsPanel({ hotelId }: { hotelId: number }) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [calendarRoom, setCalendarRoom] = useState<any | null>(null);
  const [newRoom, setNewRoom] = useState({
    name: "", type: "Deluxe Room", bedType: "DOUBLE", basePrice: "",
    extraAdultPrice: "", extraChildWithBedPrice: "", extraChildWithoutBedPrice: "",
    sizeSqft: "", viewType: "Mountain View", maxOccupancy: 2, mealPlan: "EP", totalRooms: 1,
  });

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/hotels/${hotelId}/rooms`, { headers: authHeaders() });
      if (res.ok) setRooms(await res.json());
    } finally { setLoading(false); }
  }, [hotelId]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const addRoom = async () => {
    if (!newRoom.name.trim() || !newRoom.basePrice) { alert("Name and Base Price are required."); return; }
    await fetch(`${API_URL}/admin/hotels/${hotelId}/rooms`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({
        ...newRoom, basePrice: Number(newRoom.basePrice),
        extraAdultPrice: newRoom.extraAdultPrice ? Number(newRoom.extraAdultPrice) : 0,
        extraChildWithBedPrice: newRoom.extraChildWithBedPrice ? Number(newRoom.extraChildWithBedPrice) : 0,
        extraChildWithoutBedPrice: newRoom.extraChildWithoutBedPrice ? Number(newRoom.extraChildWithoutBedPrice) : 0,
        sizeSqft: newRoom.sizeSqft ? Number(newRoom.sizeSqft) : null,
      }),
    });
    setShowAdd(false);
    setNewRoom({ name: "", type: "Deluxe Room", bedType: "DOUBLE", basePrice: "", extraAdultPrice: "", extraChildWithBedPrice: "", extraChildWithoutBedPrice: "", sizeSqft: "", viewType: "Mountain View", maxOccupancy: 2, mealPlan: "EP", totalRooms: 1 });
    fetchRooms();
  };

  const deleteRoom = async (id: number) => {
    if (!confirm("Delete this room category?")) return;
    await fetch(`${API_URL}/admin/hotels/${hotelId}/rooms/${id}`, { method: "DELETE", headers: authHeaders() });
    fetchRooms();
  };

  if (calendarRoom) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setCalendarRoom(null)} className="text-xs font-bold text-[#1B3A6B] hover:underline flex items-center gap-1">
            ← Back to Rooms
          </button>
          <span className="text-xs text-gray-400">/ Calendar Pricing: {calendarRoom.name}</span>
        </div>
        <InlineCalendarPanel hotelId={hotelId} room={calendarRoom} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-700">Room Categories & Pricing</p>
          <p className="text-[11px] text-slate-400">Add room types with occupancy rates and set calendar-based pricing</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B3A6B] text-white text-xs font-bold rounded-xl hover:bg-[#0f2548] transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Room
        </button>
      </div>

      {showAdd && (
        <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Room Name *</label>
              <input value={newRoom.name} onChange={e => setNewRoom(r => ({ ...r, name: e.target.value }))}
                placeholder="e.g. Deluxe Valley View Room" className="input w-full bg-white font-bold" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category Type</label>
              <select aria-label="Category Type" value={newRoom.type} onChange={e => setNewRoom(r => ({ ...r, type: e.target.value }))} className="input w-full bg-white">
                {ROOM_CATEGORIES_LIST.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">View Type</label>
              <select aria-label="View Type" value={newRoom.viewType} onChange={e => setNewRoom(r => ({ ...r, viewType: e.target.value }))} className="input w-full bg-white">
                {VIEW_TYPES_LIST.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Bed Type</label>
              <select aria-label="Bed Type" value={newRoom.bedType} onChange={e => setNewRoom(r => ({ ...r, bedType: e.target.value }))} className="input w-full bg-white">
                {["SINGLE", "DOUBLE", "TWIN", "KING", "QUEEN"].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Meal Plan</label>
              <select aria-label="Meal Plan" value={newRoom.mealPlan} onChange={e => setNewRoom(r => ({ ...r, mealPlan: e.target.value }))} className="input w-full bg-white">
                {Object.entries(MEAL_PLANS).map(([k, v]) => <option key={k} value={k}>{v} ({k})</option>)}
              </select>
            </div>
            <div>
              <label className="block font-bold text-emerald-700 mb-1">Base Price/Night (₹) *</label>
              <input type="number" value={newRoom.basePrice} onChange={e => setNewRoom(r => ({ ...r, basePrice: e.target.value }))}
                placeholder="4500" className="input w-full bg-white font-black text-emerald-700" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Extra Adult (₹)</label>
              <input type="number" value={newRoom.extraAdultPrice} onChange={e => setNewRoom(r => ({ ...r, extraAdultPrice: e.target.value }))}
                placeholder="1200" className="input w-full bg-white" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Child w/ Bed (₹)</label>
              <input type="number" value={newRoom.extraChildWithBedPrice} onChange={e => setNewRoom(r => ({ ...r, extraChildWithBedPrice: e.target.value }))}
                placeholder="800" className="input w-full bg-white" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Child w/o Bed (₹)</label>
              <input type="number" value={newRoom.extraChildWithoutBedPrice} onChange={e => setNewRoom(r => ({ ...r, extraChildWithoutBedPrice: e.target.value }))}
                placeholder="500" className="input w-full bg-white" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Max Guests</label>
              <input type="number" value={newRoom.maxOccupancy} onChange={e => setNewRoom(r => ({ ...r, maxOccupancy: Number(e.target.value) }))}
                placeholder="3" className="input w-full bg-white" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Rooms</label>
              <input type="number" value={newRoom.totalRooms} onChange={e => setNewRoom(r => ({ ...r, totalRooms: Number(e.target.value) }))}
                placeholder="10" className="input w-full bg-white" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-blue-200">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl">Cancel</button>
            <button onClick={addRoom} className="px-4 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700">Save Room Category</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1B3A6B]" /></div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Bed className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-xs font-semibold">No room categories yet. Add your first room above.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
          {rooms.map(room => (
            <div key={room.id} className="flex items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:shadow-xs transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
                  <Bed className="w-4 h-4 text-[#1B3A6B]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-bold text-xs text-slate-900">{room.name}</p>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 text-slate-600">{room.type}</span>
                    {room.viewType && <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">{room.viewType}</span>}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {room.bedType} · {MEAL_PLANS[room.mealPlan] || room.mealPlan} · {room.maxOccupancy} guests · {room.totalRooms} rooms ·
                    <span className="text-emerald-700 font-bold ml-1">₹{Number(room.basePrice).toLocaleString()}/night</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setCalendarRoom(room)}
                  title="Calendar Pricing"
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-[#1B3A6B] bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-colors"
                >
                  <Calendar className="w-3 h-3" /> Pricing
                </button>
                <button onClick={() => deleteRoom(room.id)} title="Delete"
                  className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Inline Calendar Panel (lightweight embedded calendar pricing) ─────────────
function InlineCalendarPanel({ hotelId, room }: { hotelId: number; room: any }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rateType, setRateType] = useState("REGULAR");
  const [priceOverride, setPriceOverride] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const firstDay = new Date(year, month - 1, 1).toISOString().split("T")[0];
      const lastDay = new Date(year, month + 2, 0).toISOString().split("T")[0];
      const res = await fetch(
        `${API_URL}/admin/hotels/${hotelId}/rooms/${room.id}/inventory?startDate=${firstDay}&endDate=${lastDay}`,
        { headers: authHeaders() }
      );
      if (res.ok) setInventory(await res.json());
    } finally { setLoading(false); }
  }, [hotelId, room.id, currentMonth]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const applyRules = async () => {
    if (!startDate || !endDate) { alert("Please select both start and end dates."); return; }
    setUpdating(true);
    try {
      const res = await fetch(`${API_URL}/admin/hotels/${hotelId}/rooms/${room.id}/inventory/bulk`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ startDate, endDate, rateType, priceOverride: priceOverride ? Number(priceOverride) : undefined, isBlocked }),
      });
      if (!res.ok) throw new Error(await res.text());
      alert("✅ Pricing rules applied!");
      fetchInventory();
    } catch (err: any) { alert("Failed: " + err.message); } finally { setUpdating(false); }
  };

  // Build calendar days
  const getDays = (d: Date) => {
    const year = d.getFullYear(); const month = d.getMonth();
    const first = new Date(year, month, 1); const last = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    for (let i = 0; i < first.getDay(); i++) days.push(null);
    for (let i = 1; i <= last.getDate(); i++) days.push(new Date(year, month, i));
    return days;
  };

  const invMap = Object.fromEntries(inventory.map(inv => [inv.date?.split("T")[0], inv]));
  const days = getDays(currentMonth);
  const RATE_COLORS: Record<string, string> = {
    REGULAR: "bg-white border-slate-200 text-slate-700",
    PEAK: "bg-red-50 border-red-200 text-red-700",
    OFF_SEASON: "bg-green-50 border-green-200 text-green-700",
    FESTIVE: "bg-purple-50 border-purple-200 text-purple-700",
  };

  return (
    <div className="space-y-3">
      {/* Month Navigator */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">‹</button>
        <span className="text-xs font-bold text-slate-700">
          {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
        </span>
        <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">›</button>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1B3A6B]" /></div>
      ) : (
        <div className="grid grid-cols-7 gap-1 text-center">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-[9px] font-black text-gray-400 pb-1">{d}</div>
          ))}
          {days.map((day, i) => {
            if (!day) return <div key={i} />;
            const key = day.toISOString().split("T")[0];
            const inv = invMap[key];
            const blocked = inv?.isBlocked;
            const price = inv?.priceOverride ?? room.basePrice;
            const rt = inv?.rateType || "REGULAR";
            const colorClass = blocked ? "bg-red-100 border-red-300 text-red-500" : RATE_COLORS[rt] || RATE_COLORS.REGULAR;
            return (
              <div key={i} className={`rounded-md border px-0.5 py-1 ${colorClass} cursor-default`}>
                <div className="text-[9px] font-bold">{day.getDate()}</div>
                <div className="text-[8px] font-black leading-none">{blocked ? "⛔" : `₹${Math.round(Number(price) / 1000)}k`}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk Rule Applicator */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
        <p className="text-[11px] font-bold text-slate-700">Apply Bulk Rate Rules</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input w-full text-xs py-1.5" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input w-full text-xs py-1.5" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Season Type</label>
            <select aria-label="Season Type" value={rateType} onChange={e => setRateType(e.target.value)} className="input w-full text-xs py-1.5">
              <option value="REGULAR">Regular</option>
              <option value="PEAK">Peak Season</option>
              <option value="OFF_SEASON">Off Season</option>
              <option value="FESTIVE">Festive Special</option>
              <option value="BLACKOUT">Blackout</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Price Override (₹)</label>
            <input type="number" value={priceOverride} onChange={e => setPriceOverride(e.target.value)} placeholder={`Base: ₹${room.basePrice}`} className="input w-full text-xs py-1.5" />
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
            <input type="checkbox" checked={isBlocked} onChange={e => setIsBlocked(e.target.checked)} className="w-3.5 h-3.5 accent-red-500" />
            Mark as Blocked / Unavailable
          </label>
          <button onClick={applyRules} disabled={updating}
            className="px-4 py-1.5 bg-[#1B3A6B] hover:bg-[#0f2548] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-60">
            {updating ? "Applying..." : "⚡ Apply Rules"}
          </button>
        </div>
      </div>
    </div>
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
    propertySource: hotel?.propertySource || "ADMIN_B2B",
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

  const steps = ["Basic Info", "Location", "Rooms & Pricing", "Amenities & FAQs", "Media", "Settings"];

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
        <div className="flex border-b overflow-x-auto scrollbar-hide">
          {steps.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i + 1)}
              className={`flex-shrink-0 px-3 py-2.5 text-[11px] font-bold transition-colors whitespace-nowrap ${step === i + 1 ? "border-b-2 border-[#1B3A6B] text-[#1B3A6B]" : "text-gray-400 hover:text-gray-600"}`}
            >
              {i + 1}. {s}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 bg-blue-50/60 p-3 rounded-2xl border border-blue-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#1B3A6B]">Property Classification</p>
                    <p className="text-[11px] text-gray-500">Separate internal contracted B2B deals from vendor OTA listings</p>
                  </div>
                  <select
                    value={form.propertySource}
                    onChange={e => update("propertySource", e.target.value)}
                    className="px-3 py-1.5 bg-white border border-[#1B3A6B]/30 rounded-xl text-xs font-bold text-[#1B3A6B] outline-none"
                  >
                    <option value="ADMIN_B2B">🏢 Admin Contracted (B2B Package Deal)</option>
                    <option value="VENDOR_OTA">🏨 Vendor Property (OTA Marketplace)</option>
                  </select>
                </div>
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
              <div className="mt-3 space-y-2">
                <label className="label text-[#1B3A6B] font-bold">Hotel Highlights (Add up to 4 highlights, e.g. "Infinity Pool", "Close to Mall Road") *</label>
                
                {/* Highlights List (Pills) */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {(form.highlights || []).length === 0 ? (
                    <span className="text-xs text-gray-400 italic">No highlights added yet. Add up to 4.</span>
                  ) : (
                    (form.highlights || []).map((highlight: string, idx: number) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B3A6B] bg-[#1B3A6B]/5 px-3 py-1.5 rounded-xl border border-[#1B3A6B]/15">
                        {highlight}
                        <button
                          type="button"
                          onClick={() => {
                            const next = (form.highlights || []).filter((_: any, i: number) => i !== idx);
                            update("highlights", next);
                          }}
                          className="hover:text-red-500 font-bold ml-1 transition-colors text-sm"
                        >
                          &times;
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Add Highlight Input Field */}
                {(form.highlights || []).length < 4 && (
                  <div className="flex gap-2">
                    <input
                      id="admin-highlight-input"
                      type="text"
                      placeholder="Type a highlight e.g., Valley View Room"
                      className="input flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = e.currentTarget.value.trim();
                          if (val) {
                            const current = form.highlights || [];
                            if (current.includes(val)) {
                              alert("This highlight is already added.");
                              return;
                            }
                            update("highlights", [...current, val]);
                            e.currentTarget.value = "";
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById("admin-highlight-input") as HTMLInputElement;
                        const val = input?.value.trim();
                        if (val) {
                          const current = form.highlights || [];
                          if (current.includes(val)) {
                            alert("This highlight is already added.");
                            return;
                          }
                          update("highlights", [...current, val]);
                          input.value = "";
                        }
                      }}
                      className="btn bg-[#1B3A6B] text-white px-4 rounded-xl text-xs font-bold hover:bg-[#1B3A6B]/90 shrink-0"
                    >
                      Add
                    </button>
                  </div>
                )}
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

          {/* ── Step 3: Rooms & Pricing (inline room manager) ── */}
          {step === 3 && (
            <div className="space-y-4">
              {!isEdit ? (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <Bed className="w-8 h-8 text-[#1B3A6B]" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Save property first</p>
                    <p className="text-xs text-slate-500 mt-1">Room categories and calendar pricing will be available after the property is created.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2.5 bg-[#1B3A6B] text-white text-xs font-bold rounded-xl hover:bg-[#0f2548] transition-colors flex items-center gap-2 disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Creating..." : "Create Property & Add Rooms"}
                  </button>
                </div>
              ) : (
                <InlineRoomsPanel hotelId={hotel!.id!} />
              )}
            </div>
          )}

          {step === 4 && (
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

          {step === 5 && (
            <>
              <div>
                <label className="label">Image URLs (one per line)</label>
                <textarea value={form.images} onChange={e => update("images", e.target.value)}
                  className="input w-full font-mono text-xs" rows={8} placeholder="https://..." />
                <p className="text-xs text-gray-400 mt-1">First image will be used as the cover photo.</p>
              </div>
            </>
          )}

          {step === 6 && (
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
            {/* On Rooms step (3), skip to next or show Save for new properties */}
            {step === 3 && isEdit ? (
              <button onClick={() => setStep(s => s + 1)}
                className="px-5 py-2 text-sm font-bold bg-[#1B3A6B] text-white rounded-xl hover:bg-[#0f2548] transition-colors">
                Next →
              </button>
            ) : step < steps.length && step !== 3 ? (
              <button onClick={() => setStep(s => s + 1)}
                className="px-5 py-2 text-sm font-bold bg-[#1B3A6B] text-white rounded-xl hover:bg-[#0f2548] transition-colors">
                Next →
              </button>
            ) : step === steps.length ? (
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-60">
                <Save className="w-4 h-4" /> {saving ? "Saving..." : (isEdit ? "Update Property" : "Create Property")}
              </button>
            ) : null}
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
// ─── Room Calendar & Inventory Extranet Modal (Channel Manager Style) ──────────
function RoomCalendarExtranetModal({
  hotel,
  room,
  onClose,
}: {
  hotel: Hotel;
  room: Room;
  onClose: () => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Bulk update range state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rateType, setRateType] = useState("PEAK");
  const [priceOverride, setPriceOverride] = useState<string>("");
  const [extraAdultPrice, setExtraAdultPrice] = useState<string>("");
  const [extraChildWithBedPrice, setExtraChildWithBedPrice] = useState<string>("");
  const [extraChildWithoutBedPrice, setExtraChildWithoutBedPrice] = useState<string>("");
  const [isBlocked, setIsBlocked] = useState(false);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const firstDay = new Date(year, month - 1, 1).toISOString().split("T")[0];
      const lastDay = new Date(year, month + 2, 0).toISOString().split("T")[0];

      const res = await fetch(
        `${API_URL}/admin/hotels/${hotel.id}/rooms/${room.id}/inventory?startDate=${firstDay}&endDate=${lastDay}`,
        { headers: authHeaders() }
      );
      if (res.ok) {
        setInventoryList(await res.json());
      }
    } catch (e: any) {
      console.error("Failed to load inventory", e);
    } finally {
      setLoading(false);
    }
  }, [hotel.id, room.id, currentMonth]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleBulkApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert("Please select both start date and end date.");
      return;
    }

    setUpdating(true);
    try {
      const body = {
        startDate,
        endDate,
        rateType,
        priceOverride: priceOverride !== "" ? Number(priceOverride) : undefined,
        extraAdultPrice: extraAdultPrice !== "" ? Number(extraAdultPrice) : undefined,
        extraChildWithBedPrice: extraChildWithBedPrice !== "" ? Number(extraChildWithBedPrice) : undefined,
        extraChildWithoutBedPrice: extraChildWithoutBedPrice !== "" ? Number(extraChildWithoutBedPrice) : undefined,
        isBlocked,
      };

      const res = await fetch(`${API_URL}/admin/hotels/${hotel.id}/rooms/${room.id}/inventory/bulk`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(await res.text());
      alert("🎉 Rates & Extranet rules updated successfully!");
      fetchInventory();
    } catch (err: any) {
      alert("Failed to update rates: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Calendar days builder
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

  const monthDays = getDaysInMonth(currentMonth);

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-slate-900 via-[#1B3A6B] to-slate-900 text-white">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{room.name}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-white/20 text-white border border-white/30">
                {room.type}
              </span>
            </div>
            <p className="text-xs text-white/70">
              {hotel.name} · Base Price: <strong className="text-emerald-300">₹{(room.basePrice || 0).toLocaleString()}</strong> / night
            </p>
          </div>
          <button onClick={onClose} aria-label="Close Extranet" className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLUMNS: Visual Extranet Calendar */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                className="p-1.5 hover:bg-white rounded-xl text-slate-700 font-bold text-xs flex items-center gap-1 border border-slate-200"
              >
                ← Prev Month
              </button>
              <h3 className="font-extrabold text-slate-800 text-sm tracking-wide uppercase">
                {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
              </h3>
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                className="p-1.5 hover:bg-white rounded-xl text-slate-700 font-bold text-xs flex items-center gap-1 border border-slate-200"
              >
                Next Month →
              </button>
            </div>

            {/* Legend Badges */}
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Regular</span>
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">🔥 Peak Season</span>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">🌿 Off-Season</span>
              <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">🎉 Festive</span>
              <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">⛔ Blackout</span>
            </div>

            {/* Days Grid Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-slate-400 uppercase tracking-wider">
              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1.5">
              {monthDays.map((d, i) => {
                const dateStr = d.toISOString().split("T")[0];
                const isCurrentMonth = d.getMonth() === currentMonth.getMonth();
                const inventory = inventoryList.find(inv => inv.date === dateStr || (typeof inv.date === "string" && inv.date.split("T")[0] === dateStr));

                const isBlockedDate = inventory?.isBlocked;
                const price = inventory?.priceOverride !== null && inventory?.priceOverride !== undefined ? inventory.priceOverride : room.basePrice;
                const customType = inventory?.customPricing?.rateType || (isBlockedDate ? "BLACKOUT" : "REGULAR");

                let badgeClass = "bg-[#FAFBFD] border-slate-200 text-slate-700";
                if (isBlockedDate) badgeClass = "bg-red-50/80 border-red-200 text-red-700";
                else if (customType === "PEAK") badgeClass = "bg-amber-50 border-amber-200 text-amber-800";
                else if (customType === "OFF_SEASON") badgeClass = "bg-blue-50 border-blue-200 text-blue-800";
                else if (customType === "FESTIVE") badgeClass = "bg-purple-50 border-purple-200 text-purple-800";

                return (
                  <div
                    key={i}
                    onClick={() => {
                      setStartDate(dateStr);
                      setEndDate(dateStr);
                    }}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer hover:scale-105 min-h-[60px] flex flex-col justify-between ${
                      isCurrentMonth ? badgeClass : "opacity-30 bg-slate-50 border-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-extrabold">{d.getDate()}</span>
                      {isBlockedDate && <span className="text-[8px] font-black text-red-600 uppercase">OFF</span>}
                    </div>
                    <div className="text-[10px] font-black tracking-tight">
                      {isBlockedDate ? (
                        <span className="text-red-500 line-through">₹{price}</span>
                      ) : (
                        <span className="text-emerald-700">₹{price?.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: 1-Click Range Extranet Applicator */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-widest flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#1B3A6B]" />
                Rate & Blackout Modifier
              </h3>
            </div>

            <form onSubmit={handleBulkApply} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Seasonal Rate Tag</label>
                <select
                  value={rateType}
                  onChange={e => setRateType(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800"
                >
                  <option value="REGULAR">Regular Rate</option>
                  <option value="PEAK">🔥 Peak Season (High Demand)</option>
                  <option value="OFF_SEASON">🌿 Off-Season / Monsoon</option>
                  <option value="FESTIVE">🎉 Festive / Special Event</option>
                  <option value="PRICE_ON_REQ">📞 Price on Request</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Selling Price Override (₹ / night)</label>
                <input
                  type="number"
                  placeholder={`Base: ₹${room.basePrice}`}
                  value={priceOverride}
                  onChange={e => setPriceOverride(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white font-bold text-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Extra Adult (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1200"
                    value={extraAdultPrice}
                    onChange={e => setExtraAdultPrice(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Child w/ Bed (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 800"
                    value={extraChildWithBedPrice}
                    onChange={e => setExtraChildWithBedPrice(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">
                  <input
                    type="checkbox"
                    checked={isBlocked}
                    onChange={e => setIsBlocked(e.target.checked)}
                    className="w-4 h-4 accent-red-600"
                  />
                  <span>⛔ Block / Blackout Date Range</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={updating}
                className="w-full py-3 bg-[#1B3A6B] hover:bg-[#12284c] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {updating ? "Updating Rules..." : "⚡ Apply Rate Rules"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Room Management Panel ────────────────────────────────────────────────────
function RoomsPanel({ hotel, onClose }: { hotel: Hotel; onClose: () => void }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [extranetRoom, setExtranetRoom] = useState<Room | null>(null);

  const ROOM_CATEGORIES = [
    "Standard Room", "Deluxe Room", "Super Deluxe Room", "Executive Suite",
    "Family Suite", "Premium Villa", "Luxury Cottage", "Penthouse", "Duplex Suite"
  ];

  const VIEW_TYPES = [
    "Mountain View", "Valley View", "Lake View", "Pool View", "Garden View", "City View"
  ];

  const [newRoom, setNewRoom] = useState({
    name: "", type: "Deluxe Room", bedType: "DOUBLE", basePrice: "",
    extraAdultPrice: "", extraChildWithBedPrice: "", extraChildWithoutBedPrice: "",
    sizeSqft: "", viewType: "Mountain View",
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
    if (!newRoom.name.trim() || !newRoom.basePrice) {
      alert("Room Category Name and Base Price are required.");
      return;
    }
    await fetch(`${API_URL}/admin/hotels/${hotel.id}/rooms`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ 
        ...newRoom, 
        basePrice: Number(newRoom.basePrice),
        extraAdultPrice: newRoom.extraAdultPrice ? Number(newRoom.extraAdultPrice) : 0,
        extraChildWithBedPrice: newRoom.extraChildWithBedPrice ? Number(newRoom.extraChildWithBedPrice) : 0,
        extraChildWithoutBedPrice: newRoom.extraChildWithoutBedPrice ? Number(newRoom.extraChildWithoutBedPrice) : 0,
        sizeSqft: newRoom.sizeSqft ? Number(newRoom.sizeSqft) : null,
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
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{hotel.name}</h2>
            <p className="text-xs text-slate-500">Room Categories, Occupancy & Extranet Calendar Rates</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAddRoom(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1B3A6B] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#12284c] transition-colors">
              <Plus className="w-4 h-4" /> Add Room Category
            </button>
            <button aria-label="Close" title="Close" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {showAddRoom && (
          <div className="p-5 bg-blue-50/70 border-b border-blue-100 grid grid-cols-3 gap-3 text-xs">
            <div className="col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Room Category Name *</label>
              <input value={newRoom.name} onChange={e => setNewRoom(r => ({ ...r, name: e.target.value }))}
                placeholder="e.g. Deluxe Mountain View Room" className="input w-full bg-white font-bold" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category Type</label>
              <select aria-label="Category Type" value={newRoom.type} onChange={e => setNewRoom(r => ({ ...r, type: e.target.value }))} className="input w-full bg-white font-bold">
                {ROOM_CATEGORIES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Bed Type</label>
              <select aria-label="Bed Type" value={newRoom.bedType} onChange={e => setNewRoom(r => ({ ...r, bedType: e.target.value }))} className="input w-full bg-white">
                {["SINGLE", "DOUBLE", "TWIN", "KING", "QUEEN"].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">View Type</label>
              <select aria-label="View Type" value={newRoom.viewType} onChange={e => setNewRoom(r => ({ ...r, viewType: e.target.value }))} className="input w-full bg-white">
                {VIEW_TYPES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Meal Plan</label>
              <select aria-label="Meal Plan" value={newRoom.mealPlan} onChange={e => setNewRoom(r => ({ ...r, mealPlan: e.target.value }))} className="input w-full bg-white font-bold">
                {Object.entries(MEAL_PLANS).map(([k, v]) => <option key={k} value={k}>{v} ({k})</option>)}
              </select>
            </div>

            <div>
              <label className="block font-bold text-emerald-800 mb-1">Base Price / Night (₹) *</label>
              <input type="number" value={newRoom.basePrice} onChange={e => setNewRoom(r => ({ ...r, basePrice: e.target.value }))}
                placeholder="4500" className="input w-full bg-white font-black text-emerald-700" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Extra Adult (₹)</label>
              <input type="number" value={newRoom.extraAdultPrice} onChange={e => setNewRoom(r => ({ ...r, extraAdultPrice: e.target.value }))}
                placeholder="1200" className="input w-full bg-white" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Child w/ Bed (₹)</label>
              <input type="number" value={newRoom.extraChildWithBedPrice} onChange={e => setNewRoom(r => ({ ...r, extraChildWithBedPrice: e.target.value }))}
                placeholder="800" className="input w-full bg-white" />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Child w/o Bed (₹)</label>
              <input type="number" value={newRoom.extraChildWithoutBedPrice} onChange={e => setNewRoom(r => ({ ...r, extraChildWithoutBedPrice: e.target.value }))}
                placeholder="500" className="input w-full bg-white" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Max Guests</label>
              <input type="number" value={newRoom.maxOccupancy} onChange={e => setNewRoom(r => ({ ...r, maxOccupancy: Number(e.target.value) }))}
                placeholder="3" className="input w-full bg-white" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Rooms Count</label>
              <input type="number" value={newRoom.totalRooms} onChange={e => setNewRoom(r => ({ ...r, totalRooms: Number(e.target.value) }))}
                placeholder="10" className="input w-full bg-white" />
            </div>

            <div className="col-span-3 flex justify-end gap-2 pt-2 border-t border-blue-200">
              <button onClick={() => setShowAddRoom(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl">Cancel</button>
              <button onClick={addRoom} className="px-5 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl shadow-xs">Save Room Category</button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B]" /></div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Bed className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold">No room categories added yet</p>
            </div>
          ) : rooms.map(room => (
            <div key={room.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:bg-white hover:shadow-xs transition-all">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center border border-slate-200 shrink-0 text-[#1B3A6B] shadow-2xs">
                  <Bed className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-extrabold text-sm text-slate-900">{room.name}</p>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-slate-200 text-slate-700">
                      {room.type}
                    </span>
                    {room.viewType && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        {room.viewType}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {room.bedType} · {MEAL_PLANS[room.mealPlan] || room.mealPlan} · Max {room.maxOccupancy} Guests · Total {room.totalRooms} Rooms
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                <div className="text-left sm:text-right">
                  <p className="font-black text-emerald-700 text-base">₹{(room.basePrice || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">base rate / night</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExtranetRoom(room)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1B3A6B] text-white hover:bg-[#12284c] shadow-2xs transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Rate Calendar</span>
                  </button>

                  <button onClick={() => toggleRoom(room)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${room.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"}`}>
                    {room.isActive ? "Active" : "Inactive"}
                  </button>
                  <button aria-label="Delete Room" title="Delete Room" onClick={() => deleteRoom(room.id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg text-slate-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Extranet Calendar Overlay */}
      {extranetRoom && (
        <RoomCalendarExtranetModal
          hotel={hotel}
          room={extranetRoom}
          onClose={() => setExtranetRoom(null)}
        />
      )}
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
  const [tab, setTab] = useState<"admin-added" | "vendor-added" | "pending" | "bookings" | "vendors" | "pending-cities">("admin-added");
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("ALL");
  const [vendors, setVendors] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<{ id: number; name: string }[]>([]);
  const [pendingCities, setPendingCities] = useState<any[]>([]);
  const [pendingCityCount, setPendingCityCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");
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

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/hotel-bookings?limit=200`, { headers: authHeaders() });
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch { setBookings([]); }
    finally { setBookingsLoading(false); }
  }, []);

  useEffect(() => {
    fetchHotels();
    fetchDestinations();
    fetchVendors();
    fetchPendingCities();
    fetchBookings();
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

  const handleDeleteVendor = async (vendorId: number) => {
    if (!window.confirm("Are you sure you want to delete this vendor and all their associated properties/rooms? This action cannot be undone.")) {
      return;
    }
    try {
      const res = await fetch(`${API_URL}/admin/users/${vendorId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        fetchVendors();
        fetchHotels();
      } else {
        alert("Failed to delete vendor");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  // Hotels created by admin for B2B package deals vs vendor-submitted OTA marketplace properties
  const adminProperties = hotels.filter(h => h.propertySource === "ADMIN_B2B" || (!h.owner_role || h.owner_role !== "HOTEL_OWNER"));
  const vendorProperties = hotels.filter(h => h.propertySource === "VENDOR_OTA" || h.owner_role === "HOTEL_OWNER");
  const pendingHotels = hotels.filter(h => h.status === "PENDING");

  const filteredHotels = hotels.filter(h => {
    const matchSearch = !search ||
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      (h.city || h.address).toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || h.status === filterStatus;
    const matchType = filterType === "ALL" || h.type === filterType;

    // Filter by Admin / Vendor ownership tabs
    if (tab === "admin-added") {
      if (h.propertySource === "VENDOR_OTA" || h.owner_role === "HOTEL_OWNER") return false;
    } else if (tab === "vendor-added") {
      if (h.propertySource === "ADMIN_B2B" && (!h.owner_role || h.owner_role !== "HOTEL_OWNER")) return false;
    }

    return matchSearch && matchStatus && matchType;
  });

  const sortedHotels = [...filteredHotels].sort((a, b) => {
    if (sortBy === "RATING_DESC") return (b.starRating || 0) - (a.starRating || 0);
    if (sortBy === "PRICE_ASC") return (a.minPrice || 0) - (b.minPrice || 0);
    if (sortBy === "PRICE_DESC") return (b.minPrice || 0) - (a.minPrice || 0);
    if (sortBy === "ROOMS_DESC") return (b.totalRooms || 0) - (a.totalRooms || 0);
    return new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime();
  });

  // Stats
  const totalApproved = hotels.filter(h => h.status === "APPROVED").length;
  const totalFeatured = hotels.filter(h => h.isFeatured).length;

  const TABS = [
    { key: "admin-added", label: "Admin Properties", count: adminProperties.length },
    { key: "vendor-added", label: "Vendor Properties", count: vendorProperties.length },
    { key: "pending", label: "Pending Approval", count: pendingHotels.length, badge: pendingHotels.length > 0 },
    { key: "bookings", label: "Bookings" },
    { key: "vendors", label: "Vendors", count: vendors.length },
    { key: "pending-cities", label: "City Requests", count: pendingCityCount, badge: pendingCityCount > 0 },
  ] as const;

  return (
    <AdminLayout title="Hotel Management" subtitle="Full OTA property management — vendors, rooms, inventory, bookings">
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Properties" value={hotels.length} icon={Building2} color="bg-[#1B3A6B]" />
          <StatCard label="Live & Approved" value={totalApproved} icon={CheckCircle} color="bg-emerald-500" />
          <StatCard label="Pending Review" value={pendingHotels.length} icon={AlertTriangle} color="bg-amber-500" />
          <StatCard label="Featured" value={totalFeatured} icon={Star} color="bg-violet-500" />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 ${tab === t.key ? "border-b-2 border-[#1B3A6B] text-[#1B3A6B] bg-blue-50/40" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
            >
              {t.label}
              {"count" in t && t.count > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${(t as any).badge ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ──────── TAB: PROPERTIES LIST ──────── */}
        {(tab === "admin-added" || tab === "vendor-added") && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3 flex-1 w-full flex-wrap">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl flex-1 border border-gray-100 focus-within:border-[#1B3A6B] transition-all min-w-[200px]">
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
                <select aria-label="Sort by" title="Sort by" value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="input text-sm px-3 py-2 rounded-xl">
                  <option value="NEWEST">Newest First</option>
                  <option value="RATING_DESC">Rating (High to Low)</option>
                  <option value="PRICE_ASC">Price (Low to High)</option>
                  <option value="PRICE_DESC">Price (High to Low)</option>
                  <option value="ROOMS_DESC">Rooms (Most to Least)</option>
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
            ) : sortedHotels.length === 0 ? (
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
                    {sortedHotels.map(hotel => (
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
                          <p className="text-xs font-medium text-gray-600 truncate max-w-[150px]" title={hotel.owner_name || hotel.ownerName || "Admin"}>
                            {hotel.owner_name || hotel.ownerName || "Admin"}
                          </p>
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
                {sortedHotels.map(hotel => (
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
                      <p className="text-xs text-gray-400 mt-1">Submitted by: <span className="font-medium text-gray-600">{hotel.owner_name || hotel.ownerName || "Vendor"}</span></p>
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
        {tab === "bookings" && (() => {
          const BSTATUS: Record<string, { label: string; color: string; bg: string }> = {
            PENDING: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50" },
            CONFIRMED: { label: "Confirmed", color: "text-emerald-700", bg: "bg-emerald-50" },
            CANCELLED: { label: "Cancelled", color: "text-red-700", bg: "bg-red-50" },
            COMPLETED: { label: "Completed", color: "text-blue-700", bg: "bg-blue-50" },
          };
          const PSTATUS: Record<string, { label: string; color: string }> = {
            PENDING: { label: "Unpaid", color: "text-amber-600" },
            PAID: { label: "Paid", color: "text-emerald-600" },
            REFUNDED: { label: "Refunded", color: "text-red-500" },
          };
          const filteredBookings = bookings.filter(b => {
            const matchS = bookingStatusFilter === "ALL" || b.status === bookingStatusFilter;
            const q = bookingSearch.toLowerCase();
            const matchQ = !q || (b.guestName || "").toLowerCase().includes(q) ||
              (b.guestEmail || "").toLowerCase().includes(q) ||
              (b.hotelName || "").toLowerCase().includes(q) ||
              String(b.id).includes(q);
            return matchS && matchQ;
          });

          const totalRevenue = filteredBookings
            .filter(b => b.paymentStatus === "PAID")
            .reduce((s, b) => s + (b.finalPaidAmount || 0), 0);

          const handleBookingStatusChange = async (id: number, status: string) => {
            await fetch(`${API_URL}/admin/hotel-bookings/${id}`, {
              method: "PATCH", headers: authHeaders(),
              body: JSON.stringify({ status }),
            });
            fetchBookings();
          };

          return (
            <div className="space-y-4">
              {/* Booking stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[{label:"Total Bookings",val:bookings.length,color:"bg-[#1B3A6B]"},
                  {label:"Confirmed",val:bookings.filter(b=>b.status==="CONFIRMED").length,color:"bg-emerald-500"},
                  {label:"Pending",val:bookings.filter(b=>b.status==="PENDING").length,color:"bg-amber-500"},
                  {label:"Revenue (Paid)",val:`₹${totalRevenue.toLocaleString()}`,color:"bg-violet-500"},
                ].map((s,i)=>(
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color} shrink-0`}>
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-gray-900">{s.val}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Search + Filter */}
              <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl flex-1 border border-gray-100">
                  <Search className="w-4 h-4 text-gray-400 shrink-0" />
                  <input placeholder="Search by guest, email, or hotel..." className="bg-transparent text-sm focus:outline-none w-full"
                    value={bookingSearch} onChange={e => setBookingSearch(e.target.value)} />
                </div>
                <select value={bookingStatusFilter} onChange={e => setBookingStatusFilter(e.target.value)}
                  className="input text-sm px-3 py-2 rounded-xl">
                  <option value="ALL">All Statuses</option>
                  {Object.entries(BSTATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <button onClick={fetchBookings} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 shrink-0">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Bookings List */}
              {bookingsLoading ? (
                <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1B3A6B]" /></div>
              ) : filteredBookings.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 py-16 text-center text-gray-400">
                  <BookOpen className="w-14 h-14 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No hotel bookings found</p>
                  <p className="text-sm mt-1">Hotel bookings will appear here once guests make reservations.</p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b bg-gray-50">
                        <th className="px-5 py-3">#ID</th>
                        <th className="px-5 py-3">Guest</th>
                        <th className="px-5 py-3">Hotel / Room</th>
                        <th className="px-5 py-3">Travel Date</th>
                        <th className="px-5 py-3">Guests</th>
                        <th className="px-5 py-3">Amount</th>
                        <th className="px-5 py-3">Payment</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredBookings.map(b => {
                        const bs = BSTATUS[b.status] || { label: b.status, color: "text-gray-600", bg: "bg-gray-100" };
                        const ps = PSTATUS[b.paymentStatus || "PENDING"] || { label: b.paymentStatus, color: "text-gray-500" };
                        return (
                          <tr key={b.id} className="hover:bg-gray-50/80 group transition-all">
                            <td className="px-5 py-3.5">
                              <span className="text-xs font-black text-gray-400">#{b.id}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <p className="text-sm font-bold text-gray-900 truncate max-w-[130px]">{b.guestName || "Guest"}</p>
                              <p className="text-xs text-gray-400 truncate max-w-[130px]">{b.guestEmail}</p>
                            </td>
                            <td className="px-5 py-3.5">
                              <p className="text-sm font-medium text-gray-700 truncate max-w-[150px]">{b.hotelName || "—"}</p>
                              <p className="text-xs text-gray-400">{b.roomName || "—"}</p>
                            </td>
                            <td className="px-5 py-3.5">
                              <p className="text-sm text-gray-700">{b.travelDate ? new Date(b.travelDate).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—"}</p>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="text-sm font-bold text-gray-700">{b.travelersCount || 1}</span>
                              <span className="text-xs text-gray-400 ml-1">pax</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <p className="text-sm font-black text-[#1B3A6B]">₹{(b.finalPaidAmount || b.totalAmount || 0).toLocaleString()}</p>
                              <p className={`text-[10px] font-bold ${ps.color}`}>{ps.label}</p>
                            </td>
                            <td className="px-5 py-3.5">
                              <p className={`text-[10px] font-bold ${ps.color}`}>{ps.label}</p>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${bs.color} ${bs.bg}`}>{bs.label}</span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {b.status === "PENDING" && (
                                  <button onClick={() => handleBookingStatusChange(b.id, "CONFIRMED")}
                                    title="Confirm" className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-500 transition-colors">
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                )}
                                {b.status !== "CANCELLED" && b.status !== "COMPLETED" && (
                                  <button onClick={() => handleBookingStatusChange(b.id, "CANCELLED")}
                                    title="Cancel" className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition-colors">
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                )}
                                {b.status === "CONFIRMED" && (
                                  <button onClick={() => handleBookingStatusChange(b.id, "COMPLETED")}
                                    title="Mark Complete" className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors">
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}

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
                  <button onClick={() => handleDeleteVendor(vendor.id)}
                    title="Delete Vendor Request"
                    className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
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
