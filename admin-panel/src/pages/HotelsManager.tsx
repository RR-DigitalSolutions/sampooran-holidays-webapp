import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Plus, Trash2, Edit3, Search, Filter, Star, MapPin, CheckCircle, XCircle,
  ChevronRight, Building2, LayoutGrid, List, RefreshCw, Eye, Ban,
  Users, Wallet, BookOpen, Shield, ChevronDown, ChevronUp, X,
  Save, Camera, Bed, Clock, Phone, Globe, Mail, AlertTriangle, TrendingUp
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
    metaTitle: hotel?.name || "",
    metaDescription: hotel?.description?.slice(0, 160) || "",
    status: hotel?.status || "PENDING",
    isFeatured: hotel?.isFeatured || false,
    images: hotel?.images?.join("\n") || "",
    amenities: (hotel?.amenities || []).join(", "),
  });

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        ...form,
        starRating: Number(form.starRating),
        destinationId: form.destinationId ? Number(form.destinationId) : undefined,
        images: form.images.split("\n").filter(Boolean),
        amenities: form.amenities.split(",").map(s => s.trim()).filter(Boolean),
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

  const steps = ["Basic Info", "Location", "Media", "Settings"];

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
        <div className="flex border-b">
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => setStep(i + 1)}
              className={`flex-1 py-3 text-xs font-bold transition-colors ${step === i + 1 ? "border-b-2 border-[#1B3A6B] text-[#1B3A6B]" : "text-gray-400 hover:text-gray-600"}`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Property Name *</label>
                  <input value={form.name} onChange={e => update("name", e.target.value)}
                    className="input w-full" placeholder="e.g. The Grand Himalayan Resort" />
                </div>
                <div>
                  <label className="label">Property Type</label>
                  <select aria-label="Property Type" title="Property Type" value={form.type} onChange={e => update("type", e.target.value)} className="input w-full">
                    {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Star Rating</label>
                  <select aria-label="Star Rating" title="Star Rating" value={form.starRating} onChange={e => update("starRating", e.target.value)} className="input w-full">
                    {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>{s} Star{s > 1 ? "s" : ""}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input value={form.phone} onChange={e => update("phone", e.target.value)} className="input w-full" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input value={form.email} onChange={e => update("email", e.target.value)} className="input w-full" placeholder="hotel@example.com" />
                </div>
                <div className="col-span-2">
                  <label className="label">Description</label>
                  <textarea value={form.description} onChange={e => update("description", e.target.value)}
                    className="input w-full" rows={4} placeholder="Describe the property experience..." />
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
              <div>
                <label className="label">City / Town</label>
                <input value={form.city} onChange={e => update("city", e.target.value)} className="input w-full" placeholder="Manali" />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className="label">Image URLs (one per line)</label>
                <textarea value={form.images} onChange={e => update("images", e.target.value)}
                  className="input w-full font-mono text-xs" rows={6} placeholder="https://..." />
                <p className="text-xs text-gray-400 mt-1">First image will be used as the cover photo.</p>
              </div>
              <div>
                <label className="label">Amenities (comma-separated)</label>
                <input value={form.amenities} onChange={e => update("amenities", e.target.value)}
                  className="input w-full" placeholder="WIFI, POOL, RESTAURANT, PARKING, GYM" />
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Check-in Time</label>
                  <input aria-label="Check-in Time" title="Check-in Time" type="time" value={form.checkInTime} onChange={e => update("checkInTime", e.target.value)} className="input w-full" />
                </div>
                <div>
                  <label className="label">Check-out Time</label>
                  <input aria-label="Check-out Time" title="Check-out Time" type="time" value={form.checkOutTime} onChange={e => update("checkOutTime", e.target.value)} className="input w-full" />
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
                <div className="col-span-2 flex items-center gap-3">
                  <input type="checkbox" id="featured" checked={form.isFeatured} onChange={e => update("isFeatured", e.target.checked)} className="w-4 h-4" />
                  <label htmlFor="featured" className="text-sm font-medium text-gray-700">Mark as Featured Property</label>
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

// ─── Room Management Panel ────────────────────────────────────────────────────
function RoomsPanel({ hotel, onClose }: { hotel: Hotel; onClose: () => void }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: "", type: "Standard", bedType: "DOUBLE", basePrice: "",
    maxOccupancy: 2, mealPlan: "EP", totalRooms: 1,
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
      body: JSON.stringify({ ...newRoom, basePrice: Number(newRoom.basePrice) }),
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

// ─── Main Hotel Manager Page ───────────────────────────────────────────────────
export default function HotelsManager() {
  const [tab, setTab] = useState<"all" | "pending" | "bookings" | "vendors">("all");
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<{ id: number; name: string }[]>([]);
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

  useEffect(() => {
    fetchHotels();
    fetchDestinations();
    fetchVendors();
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
