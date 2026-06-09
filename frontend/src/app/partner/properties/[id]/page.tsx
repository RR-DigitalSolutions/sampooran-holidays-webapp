"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Building2, Bed, Calendar, BookOpen, Star, MapPin, Plus, Trash2, Edit2,
  Save, X, Check, AlertTriangle, Clock, ArrowLeft, Eye, Settings,
  Image as ImageIcon, Plane, BarChart3, Wallet, User, LogOut, ChevronRight, ChevronLeft,
  Wifi, Car, Utensils, Waves, Dumbbell, Coffee, Flame, Umbrella, Tv,
  DollarSign, Users, CheckCircle, XCircle, MessageSquare, RefreshCw
} from "lucide-react";
import { useVendorAuth, vendorAuthHeader } from "@/context/VendorAuthContext";
import { cn } from "@/lib/utils";

import { getApiUrl } from "@/lib/api-url";

const API_BASE = getApiUrl();

const AMENITY_OPTIONS = [
  { key: "WIFI", label: "Wi-Fi", icon: Wifi },
  { key: "POOL", label: "Pool", icon: Waves },
  { key: "RESTAURANT", label: "Restaurant", icon: Utensils },
  { key: "PARKING", label: "Parking", icon: Car },
  { key: "GYM", label: "Gym", icon: Dumbbell },
  { key: "SPA", label: "Spa", icon: Flame },
  { key: "CAFE", label: "Café", icon: Coffee },
  { key: "TV", label: "TV", icon: Tv },
];
const BED_TYPES = ["Single", "Twin", "Double", "King", "Queen", "Bunk", "Sofa"];
const ROOM_TYPES = ["Standard", "Deluxe", "Super Deluxe", "Suite", "Dormitory", "Cottage", "Tent", "Villa"];
const MEAL_PLANS = ["EP", "CP", "MAP", "AP"];
const MEAL_LABELS: Record<string, string> = { EP: "Room Only", CP: "With Breakfast", MAP: "Half Board", AP: "All Inclusive" };

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  APPROVED:         { label: "Live",         color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle },
  PENDING_APPROVAL: { label: "Under Review", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",   icon: Clock },
  PENDING:          { label: "Under Review", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",   icon: Clock },
  REJECTED:         { label: "Rejected",     color: "text-red-700",    bg: "bg-red-50 border-red-200",       icon: AlertTriangle },
  SUSPENDED:        { label: "Suspended",    color: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: AlertTriangle },
  DRAFT:            { label: "Draft",        color: "text-gray-500",   bg: "bg-gray-50 border-gray-200",     icon: Settings },
};

function VendorSidebar({ active }: { active: string }) {
  const { vendor, logout } = useVendorAuth();
  return (
    <aside className="hidden lg:flex flex-col w-60 bg-gradient-to-b from-[#0B1F4E] to-[#1B3A6B] shrink-0">
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-white/10">
        <div className="w-8 h-8 bg-[#F5A623] rounded-lg flex items-center justify-center"><Plane className="w-4 h-4 text-white" /></div>
        <div><p className="text-white font-black text-xs">SAMPOORAN</p><p className="text-[#F5A623] text-[9px] font-bold tracking-widest">PARTNER</p></div>
      </div>
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {[
          { label: "Dashboard", icon: BarChart3, href: "/partner/dashboard" },
          { label: "Properties", icon: Building2, href: "/partner/properties" },
          { label: "Bookings", icon: BookOpen, href: "/partner/bookings" },
          { label: "Revenue", icon: Wallet, href: "/partner/revenue" },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm",
              active === item.href ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white")}>
            <item.icon className={cn("w-4 h-4", active === item.href && "text-[#F5A623]")} />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <button onClick={logout} className="flex items-center gap-2.5 w-full px-3 py-2 text-white/60 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-all text-sm">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
}

// ─── Inline editable field ───────────────────────────────────────────────────
function EditableField({ label, value, type = "text", onChange, options }: {
  label: string; value: string | number; type?: string; onChange: (v: any) => void; options?: string[];
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) return (
    <div className="flex items-center gap-2">
      {options ? (
        <select aria-label={label} title={label} value={String(draft)} onChange={e => setDraft(e.target.value)}
          className="border border-[#1B3A6B] rounded-lg px-3 py-1.5 text-sm focus:outline-none flex-1">
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input aria-label={label} title={label} placeholder={label} type={type} value={String(draft)} onChange={e => setDraft(e.target.value)}
          className="border border-[#1B3A6B] rounded-lg px-3 py-1.5 text-sm focus:outline-none flex-1" />
      )}
      <button aria-label="Confirm Edit" title="Confirm Edit" onClick={() => { onChange(draft); setEditing(false); }} className="text-emerald-600 hover:text-emerald-700"><Check className="w-4 h-4" /></button>
      <button aria-label="Cancel Edit" title="Cancel Edit" onClick={() => { setDraft(value); setEditing(false); }} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
    </div>
  );
  return (
    <div className="flex items-center justify-between group">
      <div>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value || "—"}</p>
      </div>
      <button aria-label="Edit Field" title="Edit Field" onClick={() => { setDraft(value); setEditing(true); }}
        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-100 rounded-lg transition-all text-gray-400 hover:text-[#1B3A6B]">
        <Edit2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Room Form ───────────────────────────────────────────────────────────────
function RoomForm({ room, onSave, onCancel }: {
  room?: any; onSave: (data: any) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: room?.name || "",
    type: room?.type || "Standard",
    bedType: room?.bedType || "Double",
    basePrice: room?.basePrice || "",
    extraAdultPrice: room?.extraAdultPrice || "",
    extraChildPrice: room?.extraChildPrice || "",
    maxOccupancy: room?.maxOccupancy || 2,
    totalRooms: room?.totalRooms || 1,
    mealPlan: room?.mealPlan || "CP",
    sizeSqft: room?.sizeSqft || "",
    description: room?.description || "",
    refundable: room?.refundable !== false,
    cancellationHours: room?.cancellationHours || 24,
    amenities: room?.amenities || [],
  });
  const [cancellationVal, setCancellationVal] = useState(() => {
    const hrs = room?.cancellationHours ?? 24;
    if (hrs % 168 === 0) return hrs / 168;
    if (hrs % 24 === 0) return hrs / 24;
    return hrs;
  });
  const [cancellationUnit, setCancellationUnit] = useState(() => {
    const hrs = room?.cancellationHours ?? 24;
    if (hrs % 168 === 0) return "Weeks";
    if (hrs % 24 === 0) return "Days";
    return "Hours";
  });

  const u = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="bg-white border border-[#1B3A6B]/20 rounded-2xl p-5 space-y-4">
      <h3 className="font-bold text-gray-900 text-sm">{room ? "Edit Room" : "Add New Room Type"}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Room Name</label>
          <input value={form.name} onChange={e => u("name", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]"
            placeholder="e.g. Deluxe Mountain View Room" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Room Type</label>
          <select aria-label="Room Type" title="Room Type" value={form.type} onChange={e => u("type", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]">
            {ROOM_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Bed Type</label>
          <select aria-label="Bed Type" title="Bed Type" value={form.bedType} onChange={e => u("bedType", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]">
            {BED_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Base Price (₹/night)</label>
          <input type="number" value={form.basePrice} onChange={e => u("basePrice", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]"
            placeholder="3500" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Extra Adult (₹/night)</label>
          <input type="number" value={form.extraAdultPrice} onChange={e => u("extraAdultPrice", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]"
            placeholder="1000" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Extra Child (₹/night)</label>
          <input type="number" value={form.extraChildPrice} onChange={e => u("extraChildPrice", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]"
            placeholder="500" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Max Occupancy</label>
          <input aria-label="Max Occupancy" title="Max Occupancy" placeholder="Max Occupancy" type="number" min="1" max="20" value={form.maxOccupancy} onChange={e => u("maxOccupancy", Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Number of Rooms</label>
          <input aria-label="Number of Rooms" title="Number of Rooms" placeholder="Number of Rooms" type="number" min="1" value={form.totalRooms} onChange={e => u("totalRooms", Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Meal Plan</label>
          <select value={form.mealPlan} onChange={e => u("mealPlan", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]">
            {MEAL_PLANS.map(m => <option key={m} value={m}>{MEAL_LABELS[m]}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Size (sq.ft)</label>
          <input type="number" value={form.sizeSqft} onChange={e => u("sizeSqft", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]"
            placeholder="250" />
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Room Description</label>
        <textarea value={form.description} onChange={e => u("description", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B] resize-none"
          rows={2} placeholder="Describe the room..." />
      </div>
      <label className="flex items-center gap-2 cursor-pointer text-sm flex-wrap">
        <input type="checkbox" checked={form.refundable} onChange={e => u("refundable", e.target.checked)} className="w-4 h-4 accent-[#1B3A6B]" />
        <span className="font-medium text-gray-700">Free Cancellation</span>
        {form.refundable && (
          <div className="flex items-center gap-1 ml-1">
            <input type="number" value={cancellationVal} onChange={e => setCancellationVal(Number(e.target.value))} min="1"
              className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs" />
            <select value={cancellationUnit} onChange={e => setCancellationUnit(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs">
              <option>Hours</option>
              <option>Days</option>
              <option>Weeks</option>
            </select>
            <span className="text-xs text-gray-400">before check-in</span>
          </div>
        )}
      </label>
      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        <button onClick={onCancel} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
        <button onClick={() => {
          let hrs = Number(cancellationVal);
          if (cancellationUnit === "Days") hrs *= 24;
          else if (cancellationUnit === "Weeks") hrs *= 168;
          onSave({
            ...form,
            cancellationHours: hrs,
            basePrice: Number(form.basePrice),
            extraAdultPrice: Number(form.extraAdultPrice || 0),
            extraChildPrice: Number(form.extraChildPrice || 0),
            sizeSqft: form.sizeSqft ? Number(form.sizeSqft) : undefined
          });
        }}
          className="px-5 py-2 bg-[#1B3A6B] text-white rounded-xl text-sm font-bold hover:bg-[#0f2548] transition-colors flex items-center gap-1.5">
          <Save className="w-3.5 h-3.5" /> {room ? "Save Changes" : "Add Room"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Property Management Page ──────────────────────────────────────────
export default function VendorPropertyManagerPage() {
  const { vendor, token, isLoading } = useVendorAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const hotelId = Number(params?.id);

  const [tab, setTab] = useState<"overview" | "rooms" | "inventory" | "bookings" | "policies" | "photos">((searchParams?.get("tab") as any) || "overview");
  const [hotel, setHotel] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  // Inventory state
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [selectedRoomForInv, setSelectedRoomForInv] = useState<string>("");
  const [invStartDate, setInvStartDate] = useState<string>("");
  const [invEndDate, setInvEndDate] = useState<string>("");
  const [invAvailableCount, setInvAvailableCount] = useState<string>("1");
  const [invPriceOverride, setInvPriceOverride] = useState<string>("");
  const [invIsBlocked, setInvIsBlocked] = useState<boolean>(false);
  const [savingInv, setSavingInv] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [editedHotel, setEditedHotel] = useState<any>({});
  const [savingField, setSavingField] = useState(false);

  // Photo management state
  const [photos, setPhotos] = useState<any[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newPhotoCaption, setNewPhotoCaption] = useState("");
  const [newPhotoCategory, setNewPhotoCategory] = useState("EXTERIOR");
  const [addingPhoto, setAddingPhoto] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<number | null>(null);

  // Policies state
  const [policies, setPolicies] = useState<any>({});
  const [savingPolicies, setSavingPolicies] = useState(false);

  useEffect(() => { if (!isLoading && !vendor) router.replace("/partner/login"); }, [vendor, isLoading, router]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setFetching(true);
    try {
      const [hotelRes, roomsRes, bookingsRes, photosRes] = await Promise.all([
        fetch(`${API_BASE}/vendor/hotels/${hotelId}`, { headers: vendorAuthHeader(token) }),
        fetch(`${API_BASE}/vendor/hotels/${hotelId}/rooms`, { headers: vendorAuthHeader(token) }),
        fetch(`${API_BASE}/vendor/hotels/${hotelId}/bookings`, { headers: vendorAuthHeader(token) }),
        fetch(`${API_BASE}/vendor/hotels/${hotelId}/photos`, { headers: vendorAuthHeader(token) }),
      ]);
      if (hotelRes.ok) {
        const h = await hotelRes.json();
        setHotel(h);
        setEditedHotel(h);
        // Load policies from hotel detail response
        if (h.policies) setPolicies(h.policies);
      }
      if (roomsRes.ok) setRooms(await roomsRes.json());
      if (bookingsRes.ok) setBookings(await bookingsRes.json());
      if (photosRes.ok) setPhotos(await photosRes.json());
    } catch {}
    finally { setFetching(false); }
  }, [token, hotelId]);

  useEffect(() => { if (token) fetchData(); }, [token, fetchData]);

  const fetchInventory = useCallback(async () => {
    if (!token || !selectedRoomForInv) return;
    try {
      const year = currentCalendarMonth.getFullYear();
      const month = currentCalendarMonth.getMonth();
      const startDay = new Date(year, month, 1);
      const endDay = new Date(year, month + 1, 0);
      const startDateStr = startDay.toISOString().split("T")[0];
      const endDateStr = endDay.toISOString().split("T")[0];

      const res = await fetch(`${API_BASE}/vendor/hotels/${hotelId}/inventory?roomId=${selectedRoomForInv}&startDate=${startDateStr}&endDate=${endDateStr}`, {
        headers: vendorAuthHeader(token),
      });
      if (res.ok) setInventoryData(await res.json());
    } catch {}
  }, [token, hotelId, selectedRoomForInv, currentCalendarMonth]);

  useEffect(() => {
    if (tab === "inventory") fetchInventory();
  }, [tab, fetchInventory]);

  const saveHotelField = async (field: string, value: any) => {
    setSavingField(true);
    try {
      const res = await fetch(`${API_BASE}/vendor/hotels/${hotelId}`, {
        method: "PATCH",
        headers: vendorAuthHeader(token),
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) { const updated = await res.json(); setHotel(updated); setEditedHotel(updated); }
    } catch {} finally { setSavingField(false); }
  };

  const addRoom = async (data: any) => {
    const res = await fetch(`${API_BASE}/vendor/hotels/${hotelId}/rooms`, {
      method: "POST", headers: vendorAuthHeader(token), body: JSON.stringify(data),
    });
    if (res.ok) { const room = await res.json(); setRooms(r => [...r, room]); setShowRoomForm(false); }
  };

  const updateRoom = async (roomId: number, data: any) => {
    const res = await fetch(`${API_BASE}/vendor/hotels/${hotelId}/rooms/${roomId}`, {
      method: "PATCH", headers: vendorAuthHeader(token), body: JSON.stringify(data),
    });
    if (res.ok) { const updated = await res.json(); setRooms(r => r.map(x => x.id === roomId ? updated : x)); setEditingRoom(null); }
  };

  const deleteRoom = async (roomId: number) => {
    if (!confirm("Delete this room type?")) return;
    await fetch(`${API_BASE}/vendor/hotels/${hotelId}/rooms/${roomId}`, { method: "DELETE", headers: vendorAuthHeader(token) });
    setRooms(r => r.filter(x => x.id !== roomId));
  };

  const updateBookingStatus = async (bookingId: number, status: "CONFIRMED" | "CANCELLED" | "COMPLETED") => {
    // Use the unified vendor bookings endpoint that supports all statuses
    const res = await fetch(`${API_BASE}/vendor/bookings/${bookingId}/status`, {
      method: "PATCH", headers: vendorAuthHeader(token), body: JSON.stringify({ status }),
    });
    if (res.ok) setBookings(b => b.map(x => x.id === bookingId ? { ...x, status } : x));
    else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Failed to update booking status");
    }
  };

  // ─── Photo Management Functions ───────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photos.length >= 15) {
      alert("You have reached the limit of 15 photos max for this property.");
      return;
    }

    setAddingPhoto(true);
    try {
      // Compress and convert image to WebP under 250KB in the browser
      const compressedFile = await new Promise<File>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new window.Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            const MAX_WIDTH = 1920;
            const MAX_HEIGHT = 1080;
            if (width > MAX_WIDTH || height > MAX_HEIGHT) {
              if (width > height) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              } else {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject(new Error("Canvas context is null"));
            ctx.drawImage(img, 0, 0, width, height);

            let quality = 0.8;
            const getBlob = (q: number): Promise<Blob | null> => {
              return new Promise((res) => canvas.toBlob(res, "image/webp", q));
            };

            const compress = async () => {
              let blob = await getBlob(quality);
              while (blob && blob.size > 250 * 1024 && quality > 0.1) {
                quality -= 0.1;
                blob = await getBlob(quality);
              }
              if (blob) {
                resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: "image/webp" }));
              } else {
                reject(new Error("Compression failed"));
              }
            };
            compress();
          };
          img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
      });

      const formData = new FormData();
      formData.append("file", compressedFile);

      const uploadRes = await fetch(`${API_BASE}/media/upload?folder=vendors/hotel_${hotelId}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!uploadRes.ok) {
        const uploadErr = await uploadRes.json().catch(() => ({}));
        throw new Error(uploadErr.message || "Failed to upload image to server");
      }

      const uploadData = await uploadRes.json();
      
      const res = await fetch(`${API_BASE}/vendor/hotels/${hotelId}/photos`, {
        method: "POST",
        headers: vendorAuthHeader(token),
        body: JSON.stringify({
          url: uploadData.url,
          caption: newPhotoCaption.trim() || null,
          category: newPhotoCategory,
          isPrimary: photos.length === 0,
          displayOrder: photos.length,
        }),
      });

      if (res.ok) {
        const photo = await res.json();
        setPhotos(p => [...p, photo]);
        setNewPhotoCaption("");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to save photo record");
      }
    } catch (err: any) {
      alert(err.message || "Error uploading file.");
    } finally {
      setAddingPhoto(false);
    }
  };

  const addPhoto = async () => {
    if (photos.length >= 15) {
      alert("You have reached the limit of 15 photos max for this property.");
      return;
    }
    if (!newPhotoUrl.trim()) return;
    setAddingPhoto(true);
    try {
      const res = await fetch(`${API_BASE}/vendor/hotels/${hotelId}/photos`, {
        method: "POST",
        headers: vendorAuthHeader(token),
        body: JSON.stringify({
          url: newPhotoUrl.trim(),
          caption: newPhotoCaption.trim() || null,
          category: newPhotoCategory,
          isPrimary: photos.length === 0,
          displayOrder: photos.length,
        }),
      });
      if (res.ok) {
        const photo = await res.json();
        setPhotos(p => [...p, photo]);
        setNewPhotoUrl("");
        setNewPhotoCaption("");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to add photo");
      }
    } catch { alert("Error adding photo."); }
    finally { setAddingPhoto(false); }
  };

  const deletePhoto = async (photoId: number) => {
    if (!confirm("Remove this photo?")) return;
    setDeletingPhotoId(photoId);
    try {
      const res = await fetch(`${API_BASE}/vendor/hotels/${hotelId}/photos/${photoId}`, {
        method: "DELETE", headers: vendorAuthHeader(token),
      });
      if (res.ok) setPhotos(p => p.filter(x => x.id !== photoId));
    } catch {}
    finally { setDeletingPhotoId(null); }
  };

  const setPrimaryPhoto = async (photoId: number) => {
    const res = await fetch(`${API_BASE}/vendor/hotels/${hotelId}/photos/${photoId}`, {
      method: "PATCH", headers: vendorAuthHeader(token),
      body: JSON.stringify({ isPrimary: true }),
    });
    if (res.ok) {
      // Refetch photos to reflect primary change
      const r = await fetch(`${API_BASE}/vendor/hotels/${hotelId}/photos`, { headers: vendorAuthHeader(token) });
      if (r.ok) setPhotos(await r.json());
    }
  };

  // ─── Policies Save ────────────────────────────────────────────────────────
  const savePolicies = async () => {
    setSavingPolicies(true);
    try {
      const res = await fetch(`${API_BASE}/vendor/hotels/${hotelId}/policies`, {
        method: "PATCH",
        headers: vendorAuthHeader(token),
        body: JSON.stringify(policies),
      });
      if (res.ok) {
        const updated = await res.json();
        setPolicies(updated);
        alert("Policies saved successfully!");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to save policies");
      }
    } catch { alert("Error saving policies."); }
    finally { setSavingPolicies(false); }
  };

  const submitProperty = async () => {
    if (!confirm("Are you sure you want to submit this property for verification? Make sure all details, photos, and rooms are added.")) return;
    try {
      const res = await fetch(`${API_BASE}/vendor/hotels/${hotelId}/submit`, {
        method: "POST", headers: vendorAuthHeader(token),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to submit property.");
      } else {
        alert("Property submitted successfully!");
        setHotel(data.hotel);
        setEditedHotel(data.hotel);
      }
    } catch (e: any) {
      alert("Error submitting property.");
    }
  };

  const renderCalendar = () => {
    if (!selectedRoomForInv) return null;
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();

    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const days = [];
    // Padding days
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`pad-${i}`} className="bg-slate-50 border border-gray-100 min-h-20" />);
    }

    const selectedRoom = rooms.find(r => r.id === Number(selectedRoomForInv));
    const basePrice = selectedRoom?.basePrice || 0;
    const baseTotalRooms = selectedRoom?.totalRooms || 0;

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const invRecord = inventoryData.find(x => x.date.split("T")[0] === dateStr);

      const isBlocked = invRecord ? invRecord.isBlocked : false;
      const availableCount = invRecord ? invRecord.availableCount : baseTotalRooms;
      const price = invRecord && invRecord.priceOverride !== null ? invRecord.priceOverride : basePrice;
      const isOverride = invRecord && invRecord.priceOverride !== null;

      let cellBg = "bg-emerald-50 border-emerald-200 text-emerald-800";
      let statusLabel = "Available";

      if (isBlocked) {
        cellBg = "bg-rose-100 border-rose-300 text-rose-800";
        statusLabel = "Stop Sales";
      } else if (availableCount === 0) {
        cellBg = "bg-rose-50 border-rose-200 text-rose-700";
        statusLabel = "Sold Out";
      } else if (availableCount <= 2) {
        cellBg = "bg-amber-50 border-amber-200 text-amber-800";
        statusLabel = "Low Avail";
      }

      let priceBorder = "border-gray-100";
      let priceLabel = null;
      if (!isBlocked && isOverride) {
        if (price > basePrice) {
          priceBorder = "border-blue-300 ring-1 ring-blue-100";
          priceLabel = <span className="text-[7px] font-black uppercase text-white bg-blue-600 px-1 py-0.5 rounded leading-none">Peak</span>;
        } else if (price < basePrice) {
          priceBorder = "border-orange-300 ring-1 ring-orange-100";
          priceLabel = <span className="text-[7px] font-black uppercase text-white bg-orange-500 px-1 py-0.5 rounded leading-none">Promo</span>;
        }
      }

      days.push(
        <div key={d}
          onClick={() => {
            setInvStartDate(dateStr);
            setInvEndDate(dateStr);
            setInvAvailableCount(String(availableCount));
            setInvPriceOverride(invRecord && invRecord.priceOverride !== null ? String(invRecord.priceOverride) : "");
            setInvIsBlocked(isBlocked);
          }}
          className={cn("p-2 rounded-xl border text-left cursor-pointer transition-all hover:scale-102 hover:shadow-sm min-h-[90px] flex flex-col justify-between", cellBg, priceBorder)}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-black text-slate-800">{d}</span>
            {priceLabel}
          </div>

          <div className="mt-1">
            <p className="text-xs font-black">₹{price.toLocaleString()}</p>
            <p className="text-[9px] font-bold mt-0.5">{isBlocked ? "Blocked" : `${availableCount} Left`}</p>
          </div>

          <span className="text-[7px] font-black uppercase tracking-wider block mt-1 text-slate-400">{statusLabel}</span>
        </div>
      );
    }

    return days;
  };

  const handleBulkUpdateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomForInv || !invStartDate || !invEndDate) return alert("Select room and date range.");
    setSavingInv(true);
    try {
      const res = await fetch(`${API_BASE}/vendor/hotels/${hotelId}/inventory`, {
        method: "POST",
        headers: vendorAuthHeader(token),
        body: JSON.stringify({
          roomId: selectedRoomForInv,
          startDate: invStartDate,
          endDate: invEndDate,
          availableCount: parseInt(invAvailableCount, 10),
          priceOverride: invPriceOverride ? parseInt(invPriceOverride, 10) : null,
          isBlocked: invIsBlocked,
        }),
      });
      if (res.ok) {
        alert("Inventory updated successfully!");
        fetchInventory();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update inventory.");
      }
    } catch {
      alert("Error updating inventory.");
    } finally {
      setSavingInv(false);
    }
  };

  if (isLoading || !vendor || fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1B3A6B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium">Property not found or access denied.</p>
          <Link href="/partner/properties" className="mt-3 inline-block text-[#1B3A6B] font-bold hover:underline text-sm">← Back to Properties</Link>
        </div>
      </div>
    );
  }

  const cfg = STATUS_BADGE[hotel.status] || STATUS_BADGE.DRAFT;
  const StatusIcon = cfg.icon;
  const pendingBookings = bookings.filter(b => b.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <VendorSidebar active="/partner/properties" />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/partner/properties" className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-sm font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" /> Properties
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              <h1 className="font-black text-gray-900 text-base truncate max-w-48">{hotel.name}</h1>
              <span className={cn("flex items-center gap-1 border px-2.5 py-1 rounded-full text-[10px] font-bold", cfg.bg, cfg.color)}>
                <StatusIcon className="w-3 h-3" /> {cfg.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {savingField && <span className="text-xs text-gray-400 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Saving...</span>}
              {hotel.status === "DRAFT" && (
                <button onClick={submitProperty} className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-[#F5A623] text-white rounded-xl hover:bg-amber-600 transition-colors">
                  Submit for Verification
                </button>
              )}
              <Link href={`/hotels/${hotel.slug}`} target="_blank"
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 border border-gray-200 rounded-xl hover:border-[#1B3A6B] text-gray-600 hover:text-[#1B3A6B] transition-colors">
                <Eye className="w-3.5 h-3.5" /> Preview
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-2 -mx-2 px-2 overflow-x-auto no-scrollbar">
            {[
              { key: "overview", label: "Overview", icon: Settings },
              { key: "rooms", label: `Rooms (${rooms.length})`, icon: Bed },
              { key: "inventory", label: "Inventory & Rates", icon: Calendar },
              { key: "bookings", label: `Bookings${pendingBookings > 0 ? ` (${pendingBookings} pending)` : ""}`, icon: BookOpen },
              { key: "photos", label: "Photos", icon: ImageIcon },
              { key: "policies", label: "Policies", icon: CheckCircle },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key as any)}
                className={cn("flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all",
                  tab === t.key ? "bg-[#1B3A6B] text-white" : "text-gray-500 hover:bg-gray-100")}>
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
                {t.key === "bookings" && pendingBookings > 0 && (
                  <span className="bg-amber-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ml-0.5">
                    {pendingBookings}
                  </span>
                )}
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1 p-6">
          {/* ─── Overview Tab ─── */}
          {tab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick stats */}
              <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Rooms", value: rooms.length, icon: Bed, color: "bg-[#1B3A6B]" },
                  { label: "Total Bookings", value: bookings.length, icon: BookOpen, color: "bg-violet-500" },
                  { label: "Pending Bookings", value: pendingBookings, icon: Clock, color: "bg-amber-500" },
                  { label: "Starting Price", value: hotel.minPrice ? `₹${hotel.minPrice.toLocaleString()}` : "—", icon: DollarSign, color: "bg-emerald-500" },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", s.color)}>
                      <s.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-gray-900">{s.value}</p>
                      <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Editable Details */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-[#1B3A6B]" /> Property Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <EditableField label="Property Name" value={hotel.name || ""} onChange={v => saveHotelField("name", v)} />
                  <EditableField label="Type" value={hotel.type || ""} options={["Hotel", "Resort", "Cottage", "Homestay", "Villa", "Camp"]} onChange={v => saveHotelField("type", v)} />
                  <EditableField label="City" value={hotel.city || ""} onChange={v => saveHotelField("city", v)} />
                  <EditableField label="State" value={hotel.state || ""} onChange={v => saveHotelField("state", v)} />
                  <EditableField label="Check-in Time" value={hotel.checkInTime || ""} type="time" onChange={v => saveHotelField("checkInTime", v)} />
                  <EditableField label="Check-out Time" value={hotel.checkOutTime || ""} type="time" onChange={v => saveHotelField("checkOutTime", v)} />
                  <EditableField label="Starting Price (₹)" value={hotel.minPrice || ""} type="number" onChange={v => saveHotelField("minPrice", Number(v))} />
                  <EditableField label="Booking Type" value={hotel.bookingType || ""} options={["INSTANT", "REQUEST"]} onChange={v => saveHotelField("bookingType", v)} />
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Description</p>
                  <textarea
                    defaultValue={hotel.description || ""}
                    onBlur={e => { if (e.target.value !== hotel.description) saveHotelField("description", e.target.value); }}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors resize-none"
                    rows={3} placeholder="Describe your property..." />
                </div>
              </div>

              {/* Amenities */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-4">Amenities</h3>
                <div className="grid grid-cols-2 gap-2">
                  {AMENITY_OPTIONS.map(a => {
                    const isSelected = hotel.amenities?.includes(a.key);
                    return (
                      <button key={a.key} type="button"
                        onClick={() => {
                          const current = hotel.amenities || [];
                          const next = isSelected ? current.filter((x: string) => x !== a.key) : [...current, a.key];
                          saveHotelField("amenities", next);
                        }}
                        className={cn("flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all text-left",
                          isSelected ? "border-[#1B3A6B] bg-[#1B3A6B]/5 text-[#1B3A6B]" : "border-gray-100 text-gray-400 hover:border-gray-200")}>
                        {isSelected ? <Check className="w-3 h-3 stroke-[3]" /> : <a.icon className="w-3 h-3" />}
                        {a.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── Rooms Tab ─── */}
          {tab === "rooms" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Room Types</h2>
                {!showRoomForm && (
                  <button onClick={() => { setShowRoomForm(true); setEditingRoom(null); }}
                    className="flex items-center gap-1.5 bg-[#1B3A6B] text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#0f2548] transition-colors">
                    <Plus className="w-4 h-4" /> Add Room Type
                  </button>
                )}
              </div>

              {showRoomForm && !editingRoom && (
                <RoomForm onSave={addRoom} onCancel={() => setShowRoomForm(false)} />
              )}

              {rooms.length === 0 && !showRoomForm ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-14 text-center">
                  <Bed className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p className="text-gray-500 font-medium mb-1">No rooms added yet</p>
                  <p className="text-gray-400 text-sm mb-4">Add room types with pricing to start accepting bookings</p>
                  <button onClick={() => setShowRoomForm(true)}
                    className="inline-flex items-center gap-1.5 bg-[#1B3A6B] text-white font-bold px-5 py-2.5 rounded-xl hover:bg-[#0f2548] text-sm transition-colors">
                    <Plus className="w-4 h-4" /> Add First Room
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {rooms.map(room => (
                    <div key={room.id}>
                      {editingRoom?.id === room.id ? (
                        <RoomForm room={editingRoom} onSave={d => updateRoom(room.id, d)} onCancel={() => setEditingRoom(null)} />
                      ) : (
                        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow">
                          <div className="w-full sm:w-36 h-28 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                            {room.images?.[0] ? (
                              <img src={room.images[0]} alt={room.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Bed className="w-8 h-8 text-gray-200" /></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-bold text-gray-900">{room.name}</h3>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  <span className="text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">{room.type}</span>
                                  {room.bedType && <span className="text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100 flex items-center gap-0.5"><Bed className="w-2.5 h-2.5" /> {room.bedType} Bed</span>}
                                  <span className="text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100 flex items-center gap-0.5"><Users className="w-2.5 h-2.5" /> Max {room.maxOccupancy}</span>
                                  {room.mealPlan && <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">{MEAL_LABELS[room.mealPlan]}</span>}
                                  {room.refundable && <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">Free Cancel</span>}
                                </div>
                                {room.description && <p className="text-xs text-gray-400 mt-2 line-clamp-1">{room.description}</p>}
                              </div>
                              <div className="flex items-center gap-1.5 ml-4">
                                <button aria-label="Edit Room" title="Edit Room" onClick={() => { setEditingRoom(room); setShowRoomForm(false); }}
                                  className="p-2 hover:bg-[#1B3A6B]/5 rounded-lg text-gray-400 hover:text-[#1B3A6B] transition-colors">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button aria-label="Delete Room" title="Delete Room" onClick={() => deleteRoom(room.id)}
                                  className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
                              <div>
                                <span className="text-lg font-black text-[#1B3A6B]">₹{room.basePrice?.toLocaleString()}</span>
                                <span className="text-xs text-gray-400 ml-1">/night</span>
                              </div>
                              <span className="text-xs text-gray-400">{room.totalRooms} room{room.totalRooms > 1 ? "s" : ""}</span>
                              {room.sizeSqft && <span className="text-xs text-gray-400">{room.sizeSqft} sq.ft</span>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── Inventory & Rates Tab ─── */}
          {tab === "inventory" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Dynamic Inventory & Rates</h2>
                <p className="text-xs text-gray-400">Update seasonal prices, availability, and blackout dates.</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-4 text-sm">Bulk Update</h3>
                <form onSubmit={handleBulkUpdateInventory} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <div className="lg:col-span-4">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Select Room Type</label>
                    <select aria-label="Select Room Type" title="Select Room Type" required value={selectedRoomForInv} onChange={e => setSelectedRoomForInv(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]">
                      <option value="" disabled>-- Select a room --</option>
                      {rooms.map(r => <option key={r.id} value={r.id}>{r.name} (Base: ₹{r.basePrice})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Start Date</label>
                    <input aria-label="Start Date" title="Start Date" type="date" required value={invStartDate} onChange={e => setInvStartDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">End Date</label>
                    <input aria-label="End Date" title="End Date" type="date" required value={invEndDate} onChange={e => setInvEndDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Daily Available Rooms</label>
                    <input aria-label="Daily Available Rooms" title="Daily Available Rooms" type="number" required min="0" value={invAvailableCount} onChange={e => setInvAvailableCount(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Seasonal Price (₹/night)</label>
                    <input type="number" min="0" value={invPriceOverride} onChange={e => setInvPriceOverride(e.target.value)}
                      placeholder="Leave blank for base price"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]" />
                  </div>
                  <div className="lg:col-span-2 flex items-center h-[42px]">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={invIsBlocked} onChange={e => setInvIsBlocked(e.target.checked)} className="w-4 h-4 accent-red-500" />
                      <span className="font-medium text-red-600">Blackout Dates (Stop Sales)</span>
                    </label>
                  </div>
                  <div className="lg:col-span-2 flex justify-end">
                    <button type="submit" disabled={savingInv}
                      className="px-6 py-2.5 bg-[#1B3A6B] text-white rounded-xl text-sm font-bold hover:bg-[#0f2548] transition-colors disabled:opacity-50">
                      {savingInv ? "Updating..." : "Update Calendar"}
                    </button>
                  </div>
                </form>
              </div>

              {selectedRoomForInv && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Room Availability & Rate Calendar</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Click a day to quickly pre-populate the Bulk Update form.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date();
                          const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                          const prev = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() - 1, 1);
                          if (prev >= minMonth) setCurrentCalendarMonth(prev);
                        }}
                        disabled={
                          currentCalendarMonth.getFullYear() === new Date().getFullYear() &&
                          currentCalendarMonth.getMonth() === new Date().getMonth()
                        }
                        className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-bold text-gray-800 min-w-32 text-center">
                        {currentCalendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date();
                          const maxMonth = new Date(today.getFullYear(), today.getMonth() + 11, 1);
                          const next = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() + 1, 1);
                          if (next <= maxMonth) setCurrentCalendarMonth(next);
                        }}
                        disabled={
                          currentCalendarMonth.getFullYear() === new Date(new Date().getFullYear(), new Date().getMonth() + 11, 1).getFullYear() &&
                          currentCalendarMonth.getMonth() === new Date(new Date().getFullYear(), new Date().getMonth() + 11, 1).getMonth()
                        }
                        className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-2">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {renderCalendar()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Bookings Tab ─── */}
          {tab === "bookings" && (
            <div className="space-y-4">
              <h2 className="font-bold text-gray-900">Booking Requests</h2>
              {bookings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-14 text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p className="text-gray-500 font-medium">No bookings yet</p>
                  <p className="text-gray-400 text-sm mt-1">Bookings will appear here once your property is live</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map(booking => (
                    <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-full border",
                            booking.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            booking.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            booking.status === "REJECTED" ? "bg-red-50 text-red-700 border-red-200" :
                            "bg-gray-50 text-gray-500 border-gray-200"
                          )}>
                            {booking.status}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">#{booking.bookingRef || booking.id}</span>
                        </div>
                        <p className="font-bold text-gray-900 text-sm">{booking.guestName || "Guest"}</p>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
                            {booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                            {" → "}
                            {booking.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          </span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {booking.adults || 2} guests</span>
                          {booking.roomName && <span className="flex items-center gap-1"><Bed className="w-3 h-3" /> {booking.roomName}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <p className="text-xl font-black text-[#1B3A6B]">₹{(booking.totalAmount || 0).toLocaleString()}</p>
                          <p className="text-[10px] text-gray-400">{booking.rooms || 1} room</p>
                        </div>
                        {booking.status === "PENDING" && (
                          <div className="flex gap-2">
                            <button onClick={() => updateBookingStatus(booking.id, "CONFIRMED")}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors">
                              <CheckCircle className="w-3 h-3" /> Confirm
                            </button>
                            <button onClick={() => updateBookingStatus(booking.id, "CANCELLED")}
                              className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors">
                              <XCircle className="w-3 h-3" /> Decline
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── Photos Tab ─── */}
          {tab === "photos" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Property Photos</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{photos.length} photos · First photo is the main cover shown in search results</p>
                </div>
              </div>

              {/* Photo Grid */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                {photos.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl mb-5">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-500 font-medium mb-1">No photos yet</p>
                    <p className="text-gray-400 text-sm">Add high-quality photos to attract more bookings. Properties with 10+ photos get 3x more views.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
                    {photos.map((photo: any, i: number) => (
                      <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                        <img src={photo.url} alt={photo.caption || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />

                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {photo.isPrimary && (
                            <span className="bg-[#1B3A6B] text-white text-[9px] font-black px-2 py-0.5 rounded-full">Cover</span>
                          )}
                          {photo.category && photo.category !== "EXTERIOR" && (
                            <span className="bg-black/50 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">{photo.category}</span>
                          )}
                        </div>

                        {/* Actions overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          {!photo.isPrimary && (
                            <button
                              aria-label="Set as cover photo"
                              title="Set as cover photo"
                              onClick={() => setPrimaryPhoto(photo.id)}
                              className="w-8 h-8 bg-[#1B3A6B] text-white rounded-lg flex items-center justify-center hover:bg-[#0f2548] transition-colors"
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            aria-label="Delete photo"
                            title="Delete photo"
                            onClick={() => deletePhoto(photo.id)}
                            disabled={deletingPhotoId === photo.id}
                            className="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Photo Form */}
                <div className="border-t border-gray-100 pt-5">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Add New Photo</h3>
                  
                  {photos.length >= 15 ? (
                    <div className="p-4 bg-red-50 border border-red-100 text-red-700 text-xs font-bold rounded-2xl mb-4">
                      ⚠️ Limit Reached: You have uploaded the maximum allowed 15 photos for this property. Delete existing photos to upload new ones.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Drag & Drop File Upload */}
                      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors relative cursor-pointer group">
                        <ImageIcon className="w-8 h-8 text-gray-400 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-xs font-bold text-gray-700">Upload Image (Max 250KB)</p>
                        <p className="text-[10px] text-gray-400 mt-1">Accepts any format. Non-WebP will auto-compress to WebP.</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={addingPhoto || photos.length >= 15}
                          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Add via URL */}
                      <div className="flex flex-col justify-center border border-gray-100 rounded-2xl p-4 bg-white">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Add via Image URL</label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={newPhotoUrl}
                            onChange={e => setNewPhotoUrl(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter" && newPhotoUrl.trim()) addPhoto(); }}
                            placeholder="https://example.com/photo.jpg"
                            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors"
                          />
                          <button
                            onClick={addPhoto}
                            disabled={addingPhoto || !newPhotoUrl.trim() || photos.length >= 15}
                            className="px-4 py-2.5 bg-[#1B3A6B] text-white rounded-xl text-xs font-bold hover:bg-[#0f2548] transition-colors disabled:opacity-50"
                          >
                            Add URL
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Category</label>
                      <select
                        value={newPhotoCategory}
                        onChange={e => setNewPhotoCategory(e.target.value)}
                        aria-label="Photo Category"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]"
                      >
                        {["EXTERIOR", "INTERIOR", "ROOM", "BATHROOM", "DINING", "POOL", "VIEW", "AMENITY", "OTHER"].map(c => (
                          <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Caption (optional)</label>
                      <input
                        type="text"
                        value={newPhotoCaption}
                        onChange={e => setNewPhotoCaption(e.target.value)}
                        placeholder="e.g. Mountain view from lobby"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors"
                      />
                    </div>
                  </div>

                  {newPhotoUrl && (
                    <div className="mt-3 p-2 bg-gray-50 rounded-xl flex items-center gap-3">
                      <img src={newPhotoUrl} alt="preview" className="w-16 h-12 rounded-lg object-cover border border-gray-200" onError={e => (e.currentTarget.style.display = "none")} />
                      <p className="text-xs text-gray-500">Preview</p>
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-3">⭐ Tip: Set one photo as Cover (star icon) to make it the main listing image.</p>
                </div>
              </div>
            </div>
          )}
          {/* ─── Policies Tab ─── */}
          {tab === "policies" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Hotel Policies</h2>
                <button
                  onClick={savePolicies}
                  disabled={savingPolicies}
                  className="px-5 py-2.5 bg-[#1B3A6B] text-white rounded-xl text-sm font-bold hover:bg-[#0f2548] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {savingPolicies ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Policies
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Policies */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Check-in / Check-out</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Check-in Time</label>
                        <input
                          type="time"
                          value={policies.checkInTime || "14:00"}
                          onChange={e => setPolicies({ ...policies, checkInTime: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Check-out Time</label>
                        <input
                          type="time"
                          value={policies.checkOutTime || "12:00"}
                          onChange={e => setPolicies({ ...policies, checkOutTime: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cancellation */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Cancellation Policy</h3>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Policy Type</label>
                      <select
                        value={policies.cancellationPolicy || "FREE"}
                        onChange={e => setPolicies({ ...policies, cancellationPolicy: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B]"
                      >
                        <option value="FREE">Free Cancellation</option>
                        <option value="PARTIAL">Partial Refund</option>
                        <option value="STRICT">Strict</option>
                        <option value="NON_REFUNDABLE">Non-Refundable</option>
                      </select>
                    </div>
                    {policies.cancellationPolicy !== "NON_REFUNDABLE" && (
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Cancellation Deadline</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={
                              (() => {
                                const hrs = policies.cancellationDeadlineHours || 24;
                                if (hrs % 168 === 0) return hrs / 168;
                                if (hrs % 24 === 0) return hrs / 24;
                                return hrs;
                              })()
                            }
                            onChange={e => {
                              const val = parseInt(e.target.value) || 0;
                              const hrs = policies.cancellationDeadlineHours || 24;
                              let unit = "Hours";
                              if (hrs % 168 === 0) unit = "Weeks";
                              else if (hrs % 24 === 0) unit = "Days";

                              let targetHrs = val;
                              if (unit === "Days") targetHrs *= 24;
                              else if (unit === "Weeks") targetHrs *= 168;

                              setPolicies({ ...policies, cancellationDeadlineHours: targetHrs });
                            }}
                            className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]"
                          />
                          <select
                            value={
                              (() => {
                                const hrs = policies.cancellationDeadlineHours || 24;
                                if (hrs % 168 === 0) return "Weeks";
                                if (hrs % 24 === 0) return "Days";
                                return "Hours";
                              })()
                            }
                            onChange={e => {
                              const unit = e.target.value;
                              const hrs = policies.cancellationDeadlineHours || 24;
                              let val = hrs;
                              const oldUnit = hrs % 168 === 0 ? "Weeks" : (hrs % 24 === 0 ? "Days" : "Hours");
                              if (oldUnit === "Weeks") val = hrs / 168;
                              else if (oldUnit === "Days") val = hrs / 24;

                              let targetHrs = val;
                              if (unit === "Days") targetHrs *= 24;
                              else if (unit === "Weeks") targetHrs *= 168;

                              setPolicies({ ...policies, cancellationDeadlineHours: targetHrs });
                            }}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]"
                          >
                            <option>Hours</option>
                            <option>Days</option>
                            <option>Weeks</option>
                          </select>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">Cancellation deadline before check-in.</p>
                      </div>
                    )}
                  </div>

                  {/* Rules */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Property Rules</h3>
                    <div className="space-y-3">
                      {[
                        { key: "childrenAllowed", label: "Children Allowed" },
                        { key: "petsAllowed", label: "Pets Allowed" },
                        { key: "smokingAllowed", label: "Smoking Allowed" },
                        { key: "unmarriedCouplesAllowed", label: "Unmarried Couples Allowed" },
                        { key: "alcoholAllowed", label: "Alcohol Allowed" },
                        { key: "payAtHotelAllowed", label: "Pay at Hotel Allowed" },
                      ].map(rule => (
                        <label key={rule.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={policies[rule.key] !== false} // Default to true for most unless set to false
                            onChange={e => setPolicies({ ...policies, [rule.key]: e.target.checked })}
                            className="w-4 h-4 accent-[#1B3A6B] rounded"
                          />
                          {rule.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* House Rules Text */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">House Rules & Important Info</h3>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">House Rules</label>
                      <textarea
                        value={policies.houseRules || ""}
                        onChange={e => setPolicies({ ...policies, houseRules: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A6B] resize-none"
                        rows={3}
                        placeholder="e.g. Quiet hours from 10 PM to 6 AM"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Important Information</label>
                      <textarea
                        value={policies.importantInfo || ""}
                        onChange={e => setPolicies({ ...policies, importantInfo: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A6B] resize-none"
                        rows={3}
                        placeholder="e.g. Valid ID required for all guests at check-in"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
